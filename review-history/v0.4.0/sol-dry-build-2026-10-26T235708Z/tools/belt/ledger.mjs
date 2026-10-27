import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';

// Synchronous, single-host collector. No network/model dispatch, source generation or live-run
// discovery occurs here. Callers supply an already-held exclusive executor-lock handle.
export const LEDGER_SCHEMA_VERSION=1;
const digest=value=>crypto.createHash('sha256').update(value).digest('hex');
const isHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const canonical=value=>JSON.stringify(sort(value));
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sort(value[key])]));return value;}
const clone=value=>JSON.parse(JSON.stringify(value));
const money=value=>{if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw new Error('Money must be a known non-negative USD number');const amount=Math.round(value*1_000_000);if(!Number.isSafeInteger(amount)||Math.abs(amount/1_000_000-value)>1e-9)throw new Error('Money exceeds safe micro-USD precision');return amount;};
const validId=(value,label)=>{if(typeof value!=='string'||!value.trim())throw new Error(label+' is required');return value;};
const activeStates=['claimed','running','output_saved','validating','awaiting_audit','unknown_provider_result'];
const parseRow=row=>{if(!row)return null;const parsed=Object.fromEntries(Object.entries(row).map(([key,value])=>[key,key.endsWith('_json')&&value!==null?JSON.parse(value):value]));return{...parsed,...Object.fromEntries(Object.entries(parsed).map(([key,value])=>[key.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase()),value]))};};
const sameRef=(left,right)=>left?.path===right?.path&&left?.sha256===right?.sha256;

const migration=`
CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY,applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS runs(
 run_id TEXT PRIMARY KEY,binding_sha256 TEXT NOT NULL,mode TEXT NOT NULL CHECK(mode IN ('dry_run','execute')),
 budget_json TEXT NOT NULL,ownership_state TEXT NOT NULL CHECK(ownership_state IN ('owned','released')),
 executor_id TEXT NOT NULL,lock_id TEXT NOT NULL,generation INTEGER NOT NULL CHECK(generation>0),
 status TEXT NOT NULL DEFAULT 'draft',created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS tasks(
 task_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(run_id),lineage_id TEXT NOT NULL,
 stage_id TEXT NOT NULL,role_id TEXT NOT NULL,logical_key_sha256 TEXT NOT NULL,command_id TEXT NOT NULL,
 identity_json TEXT NOT NULL,status TEXT NOT NULL,active_attempt_id TEXT,accepted_artifact_id TEXT,
 max_attempts INTEGER NOT NULL CHECK(max_attempts BETWEEN 1 AND 2),created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 UNIQUE(run_id,logical_key_sha256),UNIQUE(run_id,command_id));
CREATE TABLE IF NOT EXISTS attempts(
 attempt_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(run_id),task_id TEXT NOT NULL REFERENCES tasks(task_id),
 command_id TEXT NOT NULL,attempt_no INTEGER NOT NULL,executor_id TEXT NOT NULL,generation INTEGER NOT NULL,
 status TEXT NOT NULL,error_ref_json TEXT,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,
 UNIQUE(run_id,command_id),UNIQUE(task_id,attempt_no));
CREATE TABLE IF NOT EXISTS reservations(
 reservation_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(run_id),task_id TEXT NOT NULL REFERENCES tasks(task_id),
 attempt_id TEXT NOT NULL UNIQUE REFERENCES attempts(attempt_id),provider TEXT NOT NULL,role_id TEXT NOT NULL,
 reserved_microusd INTEGER NOT NULL CHECK(reserved_microusd>=0),actual_microusd INTEGER CHECK(actual_microusd>=0),
 state TEXT NOT NULL CHECK(state IN ('reserved','reported','unknown_provider_result','released')),
 currency TEXT NOT NULL CHECK(currency='USD'),pricing_ref_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS model_calls(
 call_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(run_id),attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
 reservation_id TEXT NOT NULL UNIQUE REFERENCES reservations(reservation_id),provider TEXT NOT NULL,role_id TEXT NOT NULL,
 status TEXT NOT NULL,usage_json TEXT,receipt_ref_json TEXT,metadata_json TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS artifacts(
 artifact_id TEXT PRIMARY KEY,run_id TEXT NOT NULL REFERENCES runs(run_id),task_id TEXT NOT NULL REFERENCES tasks(task_id),
 attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),kind TEXT NOT NULL,status TEXT NOT NULL,
 path TEXT NOT NULL,sha256 TEXT NOT NULL,bytes INTEGER NOT NULL CHECK(bytes>=0),
 validation_ref_json TEXT,acceptance_ref_json TEXT,created_at TEXT NOT NULL,UNIQUE(task_id,attempt_id,path,sha256,status));
CREATE UNIQUE INDEX IF NOT EXISTS one_accepted_artifact_per_task ON artifacts(task_id) WHERE status='accepted';
CREATE TABLE IF NOT EXISTS events(
 sequence INTEGER PRIMARY KEY AUTOINCREMENT,event_id TEXT NOT NULL UNIQUE,run_id TEXT NOT NULL REFERENCES runs(run_id),
 task_id TEXT REFERENCES tasks(task_id),attempt_id TEXT REFERENCES attempts(attempt_id),type TEXT NOT NULL,
 executor_id TEXT NOT NULL,generation INTEGER NOT NULL,occurred_at TEXT NOT NULL,payload_json TEXT NOT NULL);
CREATE TRIGGER IF NOT EXISTS events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'events are append-only'); END;
CREATE TRIGGER IF NOT EXISTS artifacts_no_update BEFORE UPDATE ON artifacts BEGIN SELECT RAISE(ABORT,'artifacts are immutable'); END;
CREATE TRIGGER IF NOT EXISTS artifacts_no_delete BEFORE DELETE ON artifacts BEGIN SELECT RAISE(ABORT,'artifacts are immutable'); END;
CREATE INDEX IF NOT EXISTS tasks_run_status ON tasks(run_id,status);
CREATE INDEX IF NOT EXISTS attempts_run_task ON attempts(run_id,task_id);
CREATE INDEX IF NOT EXISTS events_run_sequence ON events(run_id,sequence);
`;

export function stableTaskIdentity({runId,lineageId,stageId,roleId,inputs=[],versions,model=null,config={}}={}){
  [ [runId,'runId'],[lineageId,'lineageId'],[stageId,'stageId'],[roleId,'roleId'] ].forEach(([value,label])=>validId(value,label));
  if(!Array.isArray(inputs)||inputs.some(ref=>!isHash(ref?.sha256)))throw new Error('All task input hashes must be complete SHA256 pins');
  if(!versions||typeof versions!=='object'||Array.isArray(versions)||!Object.keys(versions).length)throw new Error('Task contract/schema/prompt/tool versions must be declared');
  const identity={run_id:runId,lineage_id:lineageId,stage_id:stageId,role_id:roleId,inputs:[...inputs].map(ref=>clone(ref)).sort((a,b)=>canonical(a).localeCompare(canonical(b))),versions:clone(versions),model:clone(model),config:clone(config)};
  const logicalKeySha256=digest(canonical(identity));return{identity,logicalKeySha256,taskId:'task_'+logicalKeySha256};
}
export const stableTaskKey=assignment=>stableTaskIdentity(assignment).logicalKeySha256;

export function openLedger(options){return new Ledger(options);}
export class Ledger{
  #db;#lock;#clock;#closed=false;
  constructor({dbPath,lockHandle,busyTimeoutMs=5000,clock=()=>new Date().toISOString()}={}){
    if(!lockHandle||typeof lockHandle.assertHeld!=='function')throw new Error('An exclusive executor lock must be held before any ledger write');
    lockHandle.assertHeld();
    if(typeof dbPath!=='string'||!dbPath||dbPath===':memory:')throw new Error('Ledger requires a local durable file path');
    const absolute=path.resolve(dbPath),relative=path.relative(lockHandle.runDir,absolute);
    if(relative.startsWith('..')||path.isAbsolute(relative)||/^\\\\/.test(absolute))throw new Error('Ledger must stay on local disk inside the owned run directory');
    if(!Number.isInteger(busyTimeoutMs)||busyTimeoutMs<1||busyTimeoutMs>30_000)throw new Error('Bounded busy timeout required');
    fs.mkdirSync(path.dirname(absolute),{recursive:true});
    const realRelative=path.relative(fs.realpathSync(lockHandle.runDir),fs.realpathSync(path.dirname(absolute)));
    if(realRelative.startsWith('..')||path.isAbsolute(realRelative))throw new Error('Ledger directory symlink escapes the owned run');
    if(fs.existsSync(absolute)){const fileRelative=path.relative(fs.realpathSync(lockHandle.runDir),fs.realpathSync(absolute));if(fileRelative.startsWith('..')||path.isAbsolute(fileRelative))throw new Error('Ledger file symlink escapes the owned run');}
    this.#lock=lockHandle;this.#clock=clock;this.dbPath=absolute;
    this.#db=new DatabaseSync(absolute);
    const existingSchema=this.#db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='runs'").get();
    if(existingSchema){const prior=this.#db.prepare("SELECT * FROM runs WHERE ownership_state='owned'").all();if(prior.some(run=>run.run_id!==lockHandle.runId||run.lock_id!==lockHandle.lockId||run.executor_id!==lockHandle.executorId)){this.#db.close();throw new Error('RUN_OWNERSHIP_HELD: database belongs to an unreleased executor');}}
    this.#db.exec('PRAGMA busy_timeout='+busyTimeoutMs+'; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; PRAGMA foreign_keys=ON;');
    this.migrate();
  }
  #now(){const now=this.#clock();if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))throw new Error('Clock must return an ISO timestamp');return now;}
  #transaction(action){this.#lock.assertHeld();this.#db.exec('BEGIN IMMEDIATE');try{const value=action();this.#db.exec('COMMIT');return value;}catch(error){this.#db.exec('ROLLBACK');throw error;}}
  migrate(){return this.#transaction(()=>{const version=this.#db.prepare('PRAGMA user_version').get().user_version;if(version>LEDGER_SCHEMA_VERSION)throw new Error('Ledger schema is newer than this controller');this.#db.exec(migration);this.#db.prepare('INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES (?,?)').run(1,this.#now());this.#db.exec('PRAGMA user_version=1');return{schemaVersion:1};});}
  #fence(fence){
    this.#lock.assertHeld();
    const run=this.#db.prepare('SELECT * FROM runs WHERE run_id=?').get(fence?.runId??'');
    if(!run||run.ownership_state!=='owned'||run.executor_id!==fence.executorId||run.lock_id!==fence.lockId||run.generation!==fence.generation||fence.lockId!==this.#lock.lockId||fence.executorId!==this.#lock.executorId)throw new Error('STALE_FENCE: run ownership/generation mismatch');
    return run;
  }
  #event(fence,{eventId,type,taskId=null,attemptId=null,payload={}}){
    validId(eventId,'eventId');validId(type,'event type');
    const existing=this.#db.prepare('SELECT * FROM events WHERE event_id=?').get(eventId);
    if(existing){if(existing.run_id!==fence.runId||existing.task_id!==taskId||existing.attempt_id!==attemptId||existing.type!==type||existing.payload_json!==canonical(payload))throw new Error('EVENT_ID_COLLISION');return parseRow(existing);}
    this.#db.prepare('INSERT INTO events(event_id,run_id,task_id,attempt_id,type,executor_id,generation,occurred_at,payload_json) VALUES (?,?,?,?,?,?,?,?,?)').run(eventId,fence.runId,taskId,attemptId,type,fence.executorId,fence.generation,this.#now(),canonical(payload));
    return parseRow(this.#db.prepare('SELECT * FROM events WHERE event_id=?').get(eventId));
  }
  claimRun({runId,bindingSha256,mode='dry_run',budget={}}={}){
    validId(runId,'runId');if(runId!==this.#lock.runId||!isHash(bindingSha256)||!['dry_run','execute'].includes(mode))throw new Error('Run claim requires matching locked run, binding SHA256 and explicit mode');
    return this.#transaction(()=>{
      const existing=this.#db.prepare('SELECT * FROM runs WHERE run_id=?').get(runId);const now=this.#now();
      if(existing&&(existing.binding_sha256!==bindingSha256||existing.mode!==mode||existing.budget_json!==canonical(budget)))throw new Error('RUN_BINDING_CHANGED: cannot silently replace frozen run configuration/budget');
      if(existing?.ownership_state==='owned'){
        if(existing.executor_id!==this.#lock.executorId||existing.lock_id!==this.#lock.lockId)throw new Error('RUN_OWNERSHIP_HELD: explicit release/reconciliation required');
        return{runId,executorId:existing.executor_id,lockId:existing.lock_id,generation:existing.generation};
      }
      const generation=(existing?.generation??0)+1;
      if(existing)this.#db.prepare("UPDATE runs SET ownership_state='owned',executor_id=?,lock_id=?,generation=?,updated_at=? WHERE run_id=?").run(this.#lock.executorId,this.#lock.lockId,generation,now,runId);
      else this.#db.prepare("INSERT INTO runs(run_id,binding_sha256,mode,budget_json,ownership_state,executor_id,lock_id,generation,created_at,updated_at) VALUES (?,?,?,?,'owned',?,?,?,?,?)").run(runId,bindingSha256,mode,canonical(budget),this.#lock.executorId,this.#lock.lockId,generation,now,now);
      const fence={runId,executorId:this.#lock.executorId,lockId:this.#lock.lockId,generation};this.#event(fence,{eventId:'run:'+runId+':generation:'+generation,type:'run.claimed',payload:{binding_sha256:bindingSha256,mode}});return fence;
    });
  }
  releaseRun(fence){return this.#transaction(()=>{this.#fence(fence);this.#event(fence,{eventId:'run:'+fence.runId+':release:'+fence.generation,type:'run.released'});this.#db.prepare("UPDATE runs SET ownership_state='released',updated_at=? WHERE run_id=? AND generation=?").run(this.#now(),fence.runId,fence.generation);return{status:'released'};});}
  rebindRun(fence,{bindingSha256,mode,budget,authorizationReceipt}={}){
    if(!isHash(bindingSha256)||!['dry_run','execute'].includes(mode)||!budget||typeof budget!=='object')throw new Error('Explicit new binding/mode/budget required');
    const verified=this.#verified(authorizationReceipt,'Run rebind authorization');const authorization=JSON.parse(verified.bytes);
    if(authorization.status!=='PASS'||authorization.action!=='rebind_run'||authorization.source!=='founder'||authorization.run_id!==fence.runId||authorization.binding_sha256!==bindingSha256||authorization.mode!==mode||authorization.budget_sha256!==digest(canonical(budget))||(mode==='execute'&&(authorization.execution_authorized!==true||authorization.content_calls_authorized!==true)))throw new Error('Rebind requires exact hash-bound founder authorization; flags alone grant no authority');
    return this.#transaction(()=>{const previous=this.#fence(fence);
      if(previous.binding_sha256===bindingSha256&&previous.mode===mode&&previous.budget_json===canonical(budget))return{...fence,reused:true};
      if(authorization.previous_binding_sha256!==previous.binding_sha256)throw new Error('Rebind authorization does not name the previous frozen binding');
      if(this.#db.prepare("SELECT 1 FROM tasks WHERE run_id=? AND status IN ('claimed','running','output_saved','validating','awaiting_audit','unknown_provider_result') LIMIT 1").get(fence.runId))throw new Error('Rebind is blocked while an attempt or uncertain provider result remains active');
      // Changing spend authority cannot erase prior accounting or omit already-used provider/role caps.
      const committed=this.#db.prepare("SELECT provider,role_id,CASE WHEN state='reported' THEN actual_microusd WHEN state IN ('reserved','unknown_provider_result') THEN reserved_microusd ELSE 0 END AS amount FROM reservations WHERE run_id=?").all(fence.runId);
      if(committed.length){
        if(budget.currency!=='USD'||committed.reduce((total,row)=>total+row.amount,0)>money(budget.total_usd))throw new Error('Rebind budget is below committed total');
        for(const provider of new Set(committed.map(row=>row.provider))){if(!budget.providers?.[provider]||committed.filter(row=>row.provider===provider).reduce((total,row)=>total+row.amount,0)>money(budget.providers[provider].total_usd))throw new Error('Rebind budget omits/exceeds committed provider');}
        for(const roleId of new Set(committed.map(row=>row.role_id))){if(!budget.roles?.[roleId]||committed.filter(row=>row.role_id===roleId).reduce((total,row)=>total+row.amount,0)>money(budget.roles[roleId].total_usd))throw new Error('Rebind budget omits/exceeds committed role');}
      }
      const next={...fence,generation:previous.generation+1};
      this.#db.prepare('UPDATE runs SET binding_sha256=?,mode=?,budget_json=?,generation=?,updated_at=? WHERE run_id=? AND generation=?').run(bindingSha256,mode,canonical(budget),next.generation,this.#now(),fence.runId,fence.generation);
      this.#event(next,{eventId:'run:'+fence.runId+':rebind:'+verified.ref.sha256,type:'run.rebound',payload:{previous_binding_sha256:previous.binding_sha256,binding_sha256:bindingSha256,previous_mode:previous.mode,mode,previous_budget:JSON.parse(previous.budget_json),budget,authorization_receipt:verified.ref,history_and_counters_retained:true}});return next;
    });
  }
  ensureTask(fence,assignment={}){
    const stable=stableTaskIdentity({...assignment,runId:fence.runId});
    const commandId=assignment.commandId??'command_'+stable.logicalKeySha256;
    validId(commandId,'commandId');const maxAttempts=assignment.maxAttempts??2;if(!Number.isInteger(maxAttempts)||maxAttempts<1||maxAttempts>2)throw new Error('Pilot task attempts must be bounded at one or two');
    return this.#transaction(()=>{this.#fence(fence);
      const duplicate=this.#db.prepare('SELECT * FROM tasks WHERE run_id=? AND (logical_key_sha256=? OR command_id=?)').get(fence.runId,stable.logicalKeySha256,commandId);
      if(duplicate){if(duplicate.logical_key_sha256!==stable.logicalKeySha256||duplicate.command_id!==commandId||duplicate.max_attempts!==maxAttempts)throw new Error('TASK_COMMAND_COLLISION');if(duplicate.status==='accepted')this.#verifyAcceptedRecord(duplicate);return parseRow(duplicate);}
      const now=this.#now();this.#db.prepare("INSERT INTO tasks(task_id,run_id,lineage_id,stage_id,role_id,logical_key_sha256,command_id,identity_json,status,max_attempts,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,'queued',?,?,?)").run(stable.taskId,fence.runId,assignment.lineageId,assignment.stageId,assignment.roleId,stable.logicalKeySha256,commandId,canonical(stable.identity),maxAttempts,now,now);
      this.#event(fence,{eventId:'task:'+stable.taskId+':queued',type:'task.queued',taskId:stable.taskId,payload:{logical_key_sha256:stable.logicalKeySha256,command_id:commandId}});return this.getTask(stable.taskId);
    });
  }
  #task(fence,taskId){const task=this.#db.prepare('SELECT * FROM tasks WHERE task_id=? AND run_id=?').get(taskId,fence.runId);if(!task)throw new Error('Task does not belong to owned run');return task;}
  #attempt(fence,attemptId){const attempt=this.#db.prepare('SELECT * FROM attempts WHERE attempt_id=? AND run_id=?').get(attemptId,fence.runId);if(!attempt)throw new Error('Attempt does not belong to owned run');return attempt;}
  #activeAttempt(fence,attemptId){const attempt=this.#attempt(fence,attemptId);const task=this.#task(fence,attempt.task_id);if(attempt.generation!==fence.generation||attempt.executor_id!==fence.executorId||task.active_attempt_id!==attemptId)throw new Error('STALE_ATTEMPT: result cannot advance current task');return{attempt,task};}
  startAttempt(fence,{taskId,commandId}={}){
    validId(commandId,'attempt commandId');
    return this.#transaction(()=>{this.#fence(fence);const task=this.#task(fence,taskId);
      const duplicate=this.#db.prepare('SELECT * FROM attempts WHERE run_id=? AND command_id=?').get(fence.runId,commandId);
      if(duplicate){if(duplicate.task_id!==taskId)throw new Error('ATTEMPT_COMMAND_COLLISION');if(duplicate.generation!==fence.generation||duplicate.executor_id!==fence.executorId)throw new Error('STALE_ATTEMPT: replay from another executor generation requires reconciliation');return parseRow(duplicate);}
      if(!['queued','retry_wait','route_back'].includes(task.status))throw new Error('Task is not eligible for a new attempt: '+task.status);
      const active=this.#db.prepare("SELECT task_id FROM tasks WHERE run_id=? AND status IN ('claimed','running','output_saved','validating','awaiting_audit','unknown_provider_result') LIMIT 1").get(fence.runId);if(active)throw new Error('SEQUENTIAL_TASK_BUSY: another attempt is active');
      const total=this.#db.prepare('SELECT count(*) AS count FROM attempts a JOIN tasks t ON t.task_id=a.task_id WHERE t.run_id=? AND t.lineage_id=? AND t.stage_id=? AND t.role_id=?').get(fence.runId,task.lineage_id,task.stage_id,task.role_id).count;
      if(total>=task.max_attempts)throw new Error('LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts');
      const attemptNo=this.#db.prepare('SELECT count(*) AS count FROM attempts WHERE task_id=?').get(taskId).count+1;const attemptId='attempt_'+digest(fence.runId+'\n'+commandId);const now=this.#now();
      this.#db.prepare("INSERT INTO attempts(attempt_id,run_id,task_id,command_id,attempt_no,executor_id,generation,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'running',?,?)").run(attemptId,fence.runId,taskId,commandId,attemptNo,fence.executorId,fence.generation,now,now);
      this.#db.prepare("UPDATE tasks SET status='running',active_attempt_id=?,updated_at=? WHERE task_id=?").run(attemptId,now,taskId);
      this.#event(fence,{eventId:attemptId+':started',type:'attempt.started',taskId,attemptId,payload:{attempt_no:attemptNo,command_id:commandId,lineage_attempt_count:total+1}});return parseRow(this.#db.prepare('SELECT * FROM attempts WHERE attempt_id=?').get(attemptId));
    });
  }
  reserveBudget(fence,{attemptId,provider,roleId,maxUsd,pricingRef,reservationId='reservation_'+attemptId}={}){
    const reserved=money(maxUsd);if(reserved<=0||!pricingRef||typeof pricingRef!=='object')throw new Error('Conservative positive maximum and price provenance are required');validId(provider,'provider');
    return this.#transaction(()=>{const run=this.#fence(fence);const {attempt,task}=this.#activeAttempt(fence,attemptId);if(attempt.status!=='running'||task.role_id!==roleId)throw new Error('Reservation role/state mismatch');
      const existing=this.#db.prepare('SELECT * FROM reservations WHERE attempt_id=? OR reservation_id=?').get(attemptId,reservationId);
      if(existing){if(existing.attempt_id!==attemptId||existing.provider!==provider||existing.role_id!==roleId||existing.reserved_microusd!==reserved||existing.pricing_ref_json!==canonical(pricingRef))throw new Error('RESERVATION_COLLISION');return parseRow(existing);}
      const budget=JSON.parse(run.budget_json);const providerCap=budget.providers?.[provider],roleCap=budget.roles?.[roleId];
      if(!providerCap||!roleCap||budget.currency!=='USD')throw new Error('BUDGET_UNCONFIGURED: provider, role, total and per-call USD caps required');
      const caps=[['total',money(budget.total_usd),null,null],['provider',money(providerCap.total_usd),'provider',provider],['role',money(roleCap.total_usd),'role_id',roleId]];
      if(reserved>money(providerCap.per_call_usd)||reserved>money(roleCap.per_call_usd))throw new Error('BUDGET_PER_CALL_EXCEEDED');
      for(const [scope,cap,column,value]of caps){const used=this.#db.prepare("SELECT coalesce(sum(CASE WHEN state='reported' THEN actual_microusd WHEN state IN ('reserved','unknown_provider_result') THEN reserved_microusd ELSE 0 END),0) AS used FROM reservations WHERE run_id=?"+(column?' AND '+column+'=?':'')).get(...(column?[fence.runId,value]:[fence.runId])).used;if(used+reserved>cap)throw new Error('BUDGET_CAP_EXCEEDED: '+scope);}
      const now=this.#now();this.#db.prepare("INSERT INTO reservations(reservation_id,run_id,task_id,attempt_id,provider,role_id,reserved_microusd,state,currency,pricing_ref_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'reserved','USD',?,?,?)").run(reservationId,fence.runId,task.task_id,attemptId,provider,roleId,reserved,canonical(pricingRef),now,now);
      this.#event(fence,{eventId:reservationId+':reserved',type:'budget.reserved',taskId:task.task_id,attemptId,payload:{reservation_id:reservationId,max_usd:maxUsd,provider,role_id:roleId,pricing_ref:pricingRef}});return parseRow(this.#db.prepare('SELECT * FROM reservations WHERE reservation_id=?').get(reservationId));
    });
  }
  settleReservation(fence,{reservationId,actualUsd=null,status='reported',evidenceRef=null}={}){
    if(!['reported','unknown_provider_result','released'].includes(status))throw new Error('Unknown reservation settlement');const actual=status==='reported'?money(actualUsd):null;
    return this.#transaction(()=>{this.#fence(fence);const row=this.#db.prepare('SELECT * FROM reservations WHERE reservation_id=? AND run_id=?').get(reservationId,fence.runId);if(!row)throw new Error('Unknown reservation');
      if(row.state===status&&row.actual_microusd===actual)return parseRow(row);
      if(!['reserved','unknown_provider_result'].includes(row.state))throw new Error('Settled reservation cannot be rewritten');
      if(!evidenceRef||typeof evidenceRef!=='object')throw new Error('Attributable reconciliation/release evidence is required');
      this.#db.prepare('UPDATE reservations SET state=?,actual_microusd=?,updated_at=? WHERE reservation_id=?').run(status,actual,this.#now(),reservationId);
      this.#event(fence,{eventId:reservationId+':'+status,type:'budget.'+status,taskId:row.task_id,attemptId:row.attempt_id,payload:{reservation_id:reservationId,actual_usd:actual===null?null:actual/1_000_000,evidence_ref:evidenceRef,reserve_retained:status==='unknown_provider_result'}});return parseRow(this.#db.prepare('SELECT * FROM reservations WHERE reservation_id=?').get(reservationId));
    });
  }
  recordModelCall(fence,{attemptId,reservationId,callId,provider,roleId,status='dispatching',usage=null,receiptRef=null,...metadata}={}){
    validId(callId,'callId');if(!['dispatching','completed','failed','unknown_provider_result'].includes(status))throw new Error('Unknown model call status');
    return this.#transaction(()=>{this.#fence(fence);const {attempt,task}=this.#activeAttempt(fence,attemptId);const reservation=this.#db.prepare('SELECT * FROM reservations WHERE reservation_id=? AND attempt_id=? AND run_id=?').get(reservationId,attemptId,fence.runId);
      if(!reservation||reservation.provider!==provider||reservation.role_id!==roleId||task.role_id!==roleId)throw new Error('Model call requires its matching durable budget reservation');
      const existing=this.#db.prepare('SELECT * FROM model_calls WHERE call_id=? OR reservation_id=?').get(callId,reservationId);const now=this.#now();
      if(existing){
        if(existing.call_id!==callId||existing.attempt_id!==attemptId||existing.provider!==provider||existing.role_id!==roleId||existing.metadata_json!==canonical(metadata))throw new Error('MODEL_CALL_COLLISION');
        if(existing.status===status&&existing.usage_json===canonical(usage)&&existing.receipt_ref_json===canonical(receiptRef))return parseRow(existing);
        if(existing.status!=='dispatching'||status==='dispatching')throw new Error('Model call completion is immutable; a retry needs a new bounded attempt');
        this.#db.prepare('UPDATE model_calls SET status=?,usage_json=?,receipt_ref_json=?,updated_at=? WHERE call_id=?').run(status,canonical(usage),canonical(receiptRef),now,callId);
      }else{
        if(attempt.status!=='running'||reservation.state!=='reserved')throw new Error('Call cannot start without an active reserved attempt');
        this.#db.prepare('INSERT INTO model_calls(call_id,run_id,attempt_id,reservation_id,provider,role_id,status,usage_json,receipt_ref_json,metadata_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)').run(callId,fence.runId,attemptId,reservationId,provider,roleId,status,canonical(usage),canonical(receiptRef),canonical(metadata),now,now);
      }
      this.#event(fence,{eventId:callId+':'+status,type:'model_call.'+status,taskId:task.task_id,attemptId,payload:{call_id:callId,reservation_id:reservationId,provider,role_id:roleId,usage,receipt_ref:receiptRef,...metadata}});return parseRow(this.#db.prepare('SELECT * FROM model_calls WHERE call_id=?').get(callId));
    });
  }
  #verified(ref,label){
    if(!ref||typeof ref.path!=='string'||!isHash(ref.sha256))throw new Error(label+' needs an exact file/hash reference');
    const target=path.resolve(this.#lock.runDir,ref.path),relative=path.relative(this.#lock.runDir,target);
    if(relative.startsWith('..')||path.isAbsolute(relative))throw new Error(label+' escapes owned run');
    const real=fs.realpathSync(target),realRelative=path.relative(fs.realpathSync(this.#lock.runDir),real);if(realRelative.startsWith('..')||path.isAbsolute(realRelative))throw new Error(label+' symlink escapes owned run');
    const bytes=fs.readFileSync(target);if(digest(bytes)!==ref.sha256||(ref.bytes!==undefined&&ref.bytes!==bytes.length))throw new Error(label+' bytes/hash changed');return{ref:{path:relative.replaceAll('\\','/'),sha256:ref.sha256,bytes:bytes.length},bytes};
  }
  #verifyAcceptedRecord(task){
    const artifact=this.#db.prepare("SELECT * FROM artifacts WHERE artifact_id=? AND task_id=? AND status='accepted'").get(task.accepted_artifact_id,task.task_id);
    if(!artifact)throw new Error('Accepted task lacks its immutable artifact record');
    this.#verified(artifact,'Previously accepted artifact');
    for(const column of ['validation_ref_json','acceptance_ref_json']){
      const saved=this.#verified(JSON.parse(artifact[column]),'Previously accepted receipt');const report=JSON.parse(saved.bytes);
      if((report.status??report.verdict)!=='PASS'||(report.output_sha256??report.artifact_sha256)!==artifact.sha256)throw new Error('Previously accepted receipt no longer matches a PASS');
    }
    return true;
  }
  recordArtifact(fence,{taskId,attemptId,artifact,status='output_saved',eventId}={}){
    if(!['output_saved','blocked'].includes(status))throw new Error('Unaccepted artifact must be output_saved or blocked');
    const verified=this.#verified(artifact,'Artifact');const artifactId='artifact_'+digest(taskId+'\n'+attemptId+'\n'+verified.ref.path+'\n'+verified.ref.sha256);
    return this.#transaction(()=>{this.#fence(fence);const {attempt,task}=this.#activeAttempt(fence,attemptId);if(task.task_id!==taskId)throw new Error('Artifact task/attempt mismatch');
      const existing=this.#db.prepare('SELECT * FROM artifacts WHERE artifact_id=?').get(artifactId);if(existing){if(existing.status!==status)throw new Error('ARTIFACT_STATUS_COLLISION');return parseRow(existing);}
      if(!(activeStates.includes(task.status)&&attempt.status==='running')&&!(status==='blocked'&&task.status==='blocked'&&attempt.status==='blocked'))throw new Error('Task cannot record another output');
      this.#db.prepare('INSERT INTO artifacts(artifact_id,run_id,task_id,attempt_id,kind,status,path,sha256,bytes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(artifactId,fence.runId,taskId,attemptId,artifact.kind??'stage_output',status,verified.ref.path,verified.ref.sha256,verified.ref.bytes,this.#now());
      this.#db.prepare('UPDATE tasks SET status=?,updated_at=? WHERE task_id=?').run(status,this.#now(),taskId);
      if(status==='blocked')this.#db.prepare("UPDATE attempts SET status='blocked',updated_at=? WHERE attempt_id=?").run(this.#now(),attemptId);
      this.#event(fence,{eventId:eventId??artifactId+':'+status,type:'artifact.'+status,taskId,attemptId,payload:{artifact_id:artifactId,...verified.ref}});return parseRow(this.#db.prepare('SELECT * FROM artifacts WHERE artifact_id=?').get(artifactId));
    });
  }
  acceptArtifact(fence,{taskId,attemptId,artifact,validationReceipt,acceptanceReceipt,eventId}={}){
    const output=this.#verified(artifact,'Output');const validation=this.#verified(validationReceipt,'Validation receipt');const acceptance=this.#verified(acceptanceReceipt,'Acceptance receipt');
    const validateData=JSON.parse(validation.bytes),acceptData=JSON.parse(acceptance.bytes);
    for(const [label,receipt]of [['validation',validateData],['acceptance',acceptData]])if((receipt.status??receipt.verdict)!=='PASS'||(receipt.output_sha256??receipt.artifact_sha256)!==output.ref.sha256)throw new Error('Artifact '+label+' is not PASS against the exact output hash');
    if(!Array.isArray(validateData.checks)||!validateData.checks.length||validateData.checks.some(check=>typeof check.check_id!=='string'||!check.check_id||check.status!=='PASS')||new Set(validateData.checks.map(check=>check.check_id)).size!==validateData.checks.length||(Array.isArray(validateData.errors)&&validateData.errors.length))throw new Error('Validation receipt needs actual unique passing checks and zero errors');
    const artifactId='accepted_'+digest(taskId+'\n'+output.ref.sha256);
    return this.#transaction(()=>{this.#fence(fence);const task=this.#task(fence,taskId);
      if(task.status==='accepted'){
        const previous=this.#db.prepare('SELECT * FROM artifacts WHERE artifact_id=?').get(task.accepted_artifact_id);
        if(previous?.sha256!==output.ref.sha256||previous.attempt_id!==attemptId||!sameRef(JSON.parse(previous.validation_ref_json),validation.ref)||!sameRef(JSON.parse(previous.acceptance_ref_json),acceptance.ref))throw new Error('ACCEPTED_TASK_COLLISION');return{status:'accepted',reused:true,artifact:parseRow(previous)};
      }
      const active=this.#activeAttempt(fence,attemptId);if(active.task.task_id!==taskId||active.attempt.status!=='running'||!activeStates.includes(task.status)||task.status==='unknown_provider_result')throw new Error('Illegal artifact acceptance transition');
      const now=this.#now();this.#db.prepare("INSERT INTO artifacts(artifact_id,run_id,task_id,attempt_id,kind,status,path,sha256,bytes,validation_ref_json,acceptance_ref_json,created_at) VALUES (?,?,?,?,?,'accepted',?,?,?,?,?,?)").run(artifactId,fence.runId,taskId,attemptId,artifact.kind??'stage_output',output.ref.path,output.ref.sha256,output.ref.bytes,canonical(validation.ref),canonical(acceptance.ref),now);
      this.#db.prepare("UPDATE attempts SET status='accepted',updated_at=? WHERE attempt_id=?").run(now,attemptId);
      this.#db.prepare("UPDATE tasks SET status='accepted',accepted_artifact_id=?,updated_at=? WHERE task_id=?").run(artifactId,now,taskId);
      const event=this.#event(fence,{eventId:eventId??artifactId+':accepted',type:'task.accepted',taskId,attemptId,payload:{artifact_id:artifactId,output:output.ref,validation_receipt:validation.ref,acceptance_receipt:acceptance.ref}});
      return{status:'accepted',reused:false,artifact:parseRow(this.#db.prepare('SELECT * FROM artifacts WHERE artifact_id=?').get(artifactId)),event};
    });
  }
  failAttempt(fence,{attemptId,status='failed',errorRef=null,eventId}={}){
    if(!['failed','blocked','quarantined','route_back','unknown_provider_result'].includes(status))throw new Error('Illegal failure outcome');
    return this.#transaction(()=>{this.#fence(fence);const {attempt,task}=this.#activeAttempt(fence,attemptId);
      if(attempt.status===status)return parseRow(attempt);if(attempt.status!=='running')throw new Error('Attempt outcome already recorded');
      const now=this.#now();const attempts=this.#db.prepare('SELECT count(*) AS count FROM attempts a JOIN tasks t ON t.task_id=a.task_id WHERE t.run_id=? AND t.lineage_id=? AND t.stage_id=? AND t.role_id=?').get(fence.runId,task.lineage_id,task.stage_id,task.role_id).count;
      const taskStatus=status==='failed'?(attempts<task.max_attempts?'retry_wait':'failed'):status==='route_back'?(attempts<task.max_attempts?'route_back':'blocked'):status;
      this.#db.prepare('UPDATE attempts SET status=?,error_ref_json=?,updated_at=? WHERE attempt_id=?').run(status,canonical(errorRef),now,attemptId);
      this.#db.prepare('UPDATE tasks SET status=?,updated_at=? WHERE task_id=?').run(taskStatus,now,task.task_id);
      if(status==='unknown_provider_result')this.#db.prepare("UPDATE reservations SET state='unknown_provider_result',updated_at=? WHERE attempt_id=? AND state='reserved'").run(now,attemptId);
      this.#event(fence,{eventId:eventId??attemptId+':'+status,type:'attempt.'+status,taskId:task.task_id,attemptId,payload:{error_ref:errorRef,task_status:taskStatus,reserve_retained:status==='unknown_provider_result'}});return parseRow(this.#db.prepare('SELECT * FROM attempts WHERE attempt_id=?').get(attemptId));
    });
  }
  appendEvent(fence,event){return this.#transaction(()=>{this.#fence(fence);if(event.taskId)this.#task(fence,event.taskId);if(event.attemptId){const attempt=this.#attempt(fence,event.attemptId);if(event.taskId&&attempt.task_id!==event.taskId)throw new Error('Event attempt/task identity mismatch');}return this.#event(fence,event);});}
  getRun(runId){return parseRow(this.#db.prepare('SELECT * FROM runs WHERE run_id=?').get(runId));}
  getTask(taskId){return parseRow(this.#db.prepare('SELECT * FROM tasks WHERE task_id=?').get(taskId));}
  #list(table,runId,order){return this.#db.prepare('SELECT * FROM '+table+' WHERE run_id=? ORDER BY '+order).all(runId).map(parseRow);}
  listTasks(runId){return this.#list('tasks',runId,'created_at,task_id');}
  listAttempts(runId){return this.#list('attempts',runId,'created_at,attempt_id');}
  listModelCalls(runId){return this.#list('model_calls',runId,'created_at,call_id');}
  listArtifacts(runId){return this.#list('artifacts',runId,'created_at,artifact_id');}
  listReservations(runId){return this.#list('reservations',runId,'created_at,reservation_id');}
  listEvents(runId){return this.#list('events',runId,'sequence');}
  snapshot(runId){return{run:this.getRun(runId),tasks:this.listTasks(runId),attempts:this.listAttempts(runId),model_calls:this.listModelCalls(runId),artifacts:this.listArtifacts(runId),events:this.listEvents(runId),reservations:this.listReservations(runId)};}
  diagnostics(){return{node_version:process.version,sqlite_version:this.#db.prepare('SELECT sqlite_version() AS version').get().version,schema_version:this.#db.prepare('PRAGMA user_version').get().user_version,journal_mode:this.#db.prepare('PRAGMA journal_mode').get().journal_mode,synchronous:this.#db.prepare('PRAGMA synchronous').get().synchronous,foreign_keys:this.#db.prepare('PRAGMA foreign_keys').get().foreign_keys,integrity_check:this.#db.prepare('PRAGMA integrity_check').get().integrity_check};}
  close(){if(!this.#closed){this.#db.close();this.#closed=true;}}
}
