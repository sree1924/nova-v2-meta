import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {inside, sha256, jsonBytes, verifyRef} from './atomic-file.mjs';
import {acquireExecutorLock} from './executor-lock.mjs';

const executeFile = promisify(execFile);
const REQUIRED_TABLES = ['runs','tasks','attempts','model_calls','reservations','events','artifacts'];
const TERMINAL = new Set(['accepted','blocked','failed','quarantined','route_back','cancelled','canceled','rejected','completed']);
const ACTIVE_TASKS = new Set(['claimed','running','started','dispatching','output_saved','validating','awaiting_audit','unknown_provider_result']);
const STAGE_ALIASES = Object.freeze({'15.source_registry':'15.sources'});
const ORIGINAL_FILES = ['ledger/run.sqlite','ledger/run.sqlite-wal','ledger/run.sqlite-shm','15-source-registry.json','role15-findings.json','trace.html','EXECUTOR.lock.md'];

// This program writes only the explicitly supplied private backup. Source is
// opened mode=ro, including committed WAL data, and is never migrated/checkpointed.
const BACKUP_PROGRAM = String.raw`
import base64, json, math, sqlite3, sys
from pathlib import Path
sys.stdout.reconfigure(encoding='utf-8')
source, destination = sys.argv[1:3]
def encode(value):
    if isinstance(value, bytes): return {'__sqlite_blob_base64__': base64.b64encode(value).decode('ascii')}
    if isinstance(value, int) and abs(value) > 9007199254740991: return {'__sqlite_integer_decimal__': str(value)}
    if isinstance(value, float) and not math.isfinite(value): return {'__sqlite_real__': str(value)}
    return value
src = sqlite3.connect(Path(source).resolve().as_uri() + '?mode=ro', uri=True, timeout=3)
dst = sqlite3.connect(destination, timeout=3)
try:
    src.execute('PRAGMA query_only=ON')
    src.backup(dst, pages=128, sleep=0.01)
    dst.commit()
    integrity = [row[0] for row in dst.execute('PRAGMA quick_check')]
    if integrity != ['ok']: raise RuntimeError('Consistent backup failed quick_check: '+repr(integrity))
    schema = [dict(zip(('type','name','tbl_name','sql'), row)) for row in dst.execute("SELECT type,name,tbl_name,sql FROM sqlite_master ORDER BY type,name")]
    tables, columns = {}, {}
    for entry in schema:
        if entry['type'] != 'table': continue
        quoted = '"' + entry['name'].replace('"','""') + '"'
        cursor = dst.execute('SELECT * FROM ' + quoted)
        names = [column[0] for column in cursor.description]
        columns[entry['name']] = names
        tables[entry['name']] = [{key:encode(value) for key,value in zip(names,row)} for row in cursor.fetchall()]
    result = {'tables':tables,'columns':columns,'schema':schema,'user_version':dst.execute('PRAGMA user_version').fetchone()[0],
              'integrity_check':integrity,'sqlite_version':sqlite3.sqlite_version,
              'serialization':'SQLite rows unchanged except lossless tagged BLOB, unsafe-integer and nonfinite-real encodings; original consistent SQLite backup is authoritative'}
finally:
    dst.close()
    src.close()
print(json.dumps(result,ensure_ascii=False,allow_nan=False))
`;

function failure(message, code='LEGACY_HANDOVER_BLOCKED') {
  const error = new Error(message); error.code = code; return error;
}
function pin(file) { const bytes=fs.readFileSync(file); return {path:file,sha256:sha256(bytes),bytes:bytes.length}; }
function saveBytes(root, relative, bytes) {
  const target=inside(root,relative);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  inside(root,target);
  const fd=fs.openSync(target,'wx',0o600);
  try { fs.writeFileSync(fd,bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  return pin(target);
}
function saveJson(root, relative, value) {return saveBytes(root,relative,jsonBytes(value));}
function fingerprint(runDir, relative) {
  const target=inside(runDir,relative);
  if(!fs.existsSync(target))return{relative_path:relative,exists:false};
  if(!fs.statSync(target).isFile())throw failure('Legacy evidence is not a regular file: '+relative);
  return{relative_path:relative,exists:true,...pin(target)};
}
function requireSame(runDir, expected) {
  const actual=fingerprint(runDir,expected.relative_path);
  if(actual.exists!==expected.exists||actual.sha256!==expected.sha256||actual.bytes!==expected.bytes)throw failure('Legacy evidence changed during handover: '+expected.relative_path,'LEGACY_CHANGED');
}
function validateRows(data,runId,config) {
  if(!REQUIRED_TABLES.every(name=>Array.isArray(data.tables?.[name])))throw failure('Legacy backup does not preserve all seven required table arrays');
  if(data.tables.runs.length!==1||data.tables.runs[0].run_id!==runId)throw failure('Legacy database must contain exactly the declared run');
  if(data.tables.model_calls.length||data.tables.reservations.length)throw failure('Legacy model calls/reservations require separate accounting reconciliation','LEGACY_ACCOUNTING_HOLD');
  for(const [table,rows]of Object.entries(data.tables))for(const row of rows)if(row.run_id!=null&&row.run_id!==runId)throw failure('Cross-run row in legacy table '+table);
  const originalLineage=data.tables.runs[0].candidate_lineage_id??data.tables.runs[0].lineage_id;
  const lineage=originalLineage??config.candidate_lineage_id??runId+':lineage:1';
  if(typeof lineage!=='string'||!lineage.trim())throw failure('Candidate lineage must be explicit and nonempty');
  const taskMap=new Map(), identityMap={tasks:{},attempts:{}};
  for(const task of data.tables.tasks){
    const id=task.task_id??task.logical_task_id??task.id;
    if(typeof id!=='string'||!id||taskMap.has(id)||typeof task.stage_id!=='string'||!task.stage_id||typeof task.role_id!=='string'||!task.role_id)throw failure('Legacy task identity, stage or role is missing/duplicate');
    if(ACTIVE_TASKS.has(String(task.status??task.state).toLowerCase()))throw failure('Active legacy task prevents manual handover','LEGACY_ACTIVE_ATTEMPT');
    taskMap.set(id,task);
    identityMap.tasks[id]={legacy_stage_id:task.stage_id,stage_id:STAGE_ALIASES[task.stage_id]??task.stage_id,role_id:task.role_id,lineage_id:task.lineage_id??task.candidate_lineage_id??lineage};
  }
  const attempts=new Set();
  for(const attempt of data.tables.attempts){
    const id=attempt.attempt_id??attempt.id,taskId=attempt.task_id??attempt.logical_task_id;
    if(typeof id!=='string'||!id||attempts.has(id)||!taskMap.has(taskId))throw failure('Legacy attempt identity or task join is missing/duplicate');
    if(!TERMINAL.has(String(attempt.status??attempt.state).toLowerCase()))throw failure('Active/unknown legacy attempt prevents manual handover','LEGACY_ACTIVE_ATTEMPT');
    attempts.add(id);identityMap.attempts[id]={task_id:taskId,original_state:attempt.status??attempt.state};
  }
  return{candidate_lineage_id:lineage,lineage_basis:originalLineage!=null?'legacy.runs lineage':config.candidate_lineage_id!=null?'run_config.candidate_lineage_id':'declared controller default: run_id + :lineage:1',identity_map:identityMap};
}

/** Explicit, dry-only legacy ownership transfer. Never called on import or CLI.
 * The returned native lock remains HELD; caller alone creates/imports the new
 * ledger, verifies it and later releases/transfers ownership to the runner.
 * All captures and quarantine are inside sources/private; no handbook is copied.
 */
export async function prepareLegacyMigration({projectRoot,runDir,runId,executorId,decisionRef,pythonPath='python'}={}) {
  if(typeof projectRoot!=='string'||typeof runDir!=='string'||!runId||!executorId)throw failure('Explicit projectRoot, runDir, runId and executorId are required');
  projectRoot=fs.realpathSync(projectRoot);
  runDir=inside(path.join(projectRoot,'runs'),path.resolve(runDir));
  if(path.basename(runDir)!==runId)throw failure('Run directory and run ID differ');
  const configPath=inside(runDir,'run-config.json'),configBytes=fs.readFileSync(configPath),config=JSON.parse(configBytes);
  if(config.run_id!==runId||config.execution_enabled!==false||config.limits?.spend_mode!=='dry_run')throw failure('Legacy transfer requires this run to remain execution-disabled and dry_run');
  const decisionPath=verifyRef(decisionRef,projectRoot),decisionBytes=fs.readFileSync(decisionPath),decision=JSON.parse(decisionBytes);
  if(decision.schema_version!=='builder-ownership.v0.4.0'||decision.builder_session!==executorId||!decision.stopped_builder_session||decision.stopped_builder_session===executorId||!decision.authority||!decision.founder_words||decision.content_calls_authorized!==false)throw failure('Pinned founder ownership decision does not authorize this dry-only builder/stopped-holder handover');
  if(decision.run_id!=null?decision.run_id!==runId:!decision.founder_words.includes('runs/'+runId+'/EXECUTOR.lock.md'))throw failure('Ownership decision is not bound to this legacy run');
  const oldLock=fingerprint(runDir,'EXECUTOR.lock.md');
  if(!oldLock.exists)throw failure('Expected legacy plain lock is missing');
  const oldLockBytes=fs.readFileSync(oldLock.path),oldLockText=oldLockBytes.toString('utf8');
  if(oldLockText.includes('```json')||oldLockText.match(/^holder:\s*(.+?)\s*$/m)?.[1]!==decision.stopped_builder_session||oldLockText.match(/^status:\s*(.+?)\s*$/m)?.[1]!=='HELD'||!oldLockText.includes('runs/'+runId))throw failure('Legacy plain lock does not name the explicitly stopped holder/run');
  const configFingerprint=fingerprint(runDir,'run-config.json');
  const before=ORIGINAL_FILES.filter(rel=>rel!=='ledger/run.sqlite-shm').map(rel=>fingerprint(runDir,rel));
  if(!before.find(ref=>ref.relative_path==='ledger/run.sqlite')?.exists)throw failure('Legacy SQLite database is missing');
  // Check the complete private path before acquiring a guard or creating files.
  inside(runDir,'sources/private/quarantine');
  const guardPath=inside(runDir,'.LEGACY-HANDOVER.guard.json');
  const guardId=crypto.randomUUID(),createdAt=new Date().toISOString();
  const guard={schema_version:'legacy-handover-guard.v0.4.0',guard_id:guardId,run_id:runId,builder_session:executorId,stopped_holder:decision.stopped_builder_session,decision_sha256:decisionRef.sha256,legacy_lock_sha256:oldLock.sha256,pid:process.pid,hostname:os.hostname(),created_at:createdAt};
  let guardFd;
  try{guardFd=fs.openSync(guardPath,'wx',0o600);fs.writeFileSync(guardFd,jsonBytes(guard));fs.fsyncSync(guardFd);}catch(error){if(error.code==='EEXIST')throw failure('Another explicit legacy handover guard exists; no age heuristic is permitted','LEGACY_HANDOVER_GUARD_HELD');throw error;}finally{if(guardFd!==undefined)fs.closeSync(guardFd);}
  const quarantineRoot=inside(runDir,'sources/private/quarantine/legacy-'+createdAt.replace(/[:.]/g,'-')+'-'+guardId);
  let journalPath,chain=null,lockHandle=null;
  const moved=[];
  const journal=(event,payload={})=>{
    if(!journalPath)return;
    const entry={at:new Date().toISOString(),guard_id:guardId,event,previous_entry_sha256:chain,...payload};
    const bytes=Buffer.from(JSON.stringify(entry)+'\n','utf8'),fd=fs.openSync(journalPath,'a',0o600);
    try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}chain=sha256(bytes);
  };
  const archiveGuard=label=>{
    const current=JSON.parse(fs.readFileSync(guardPath,'utf8'));
    if(current.guard_id!==guardId)throw failure('Handover guard changed; retain it for manual reconciliation');
    const target=inside(quarantineRoot,label);if(fs.existsSync(target))throw failure('Guard archive collision');
    fs.renameSync(guardPath,target);return pin(target);
  };
  try{
    fs.mkdirSync(quarantineRoot,{recursive:true});inside(runDir,quarantineRoot);
    journalPath=inside(quarantineRoot,'migration-journal.jsonl');
    journal('handover.started',{decision_ref:decisionRef,config_ref:pin(configPath),legacy_lock:oldLock,source_fingerprints:before,visibility:'private_only'});
    for(const ref of before)requireSame(runDir,ref);
    requireSame(runDir,configFingerprint);verifyRef(decisionRef,projectRoot);
    const oldLockRef=saveBytes(quarantineRoot,'legacy-lock.exact.md',oldLockBytes);
    const backupPath=inside(quarantineRoot,'consistent-legacy.sqlite');
    const reserved=fs.openSync(backupPath,'wx',0o600);fs.closeSync(reserved);
    const {stdout}=await executeFile(pythonPath,['-c',BACKUP_PROGRAM,inside(runDir,'ledger/run.sqlite'),backupPath],{encoding:'utf8',windowsHide:true,timeout:30_000,maxBuffer:32*1024*1024});
    const captured=JSON.parse(stdout);
    const identities=validateRows(captured,runId,config);
    for(const ref of before)requireSame(runDir,ref);
    requireSame(runDir,configFingerprint);verifyRef(decisionRef,projectRoot);
    const backupRef=pin(backupPath);
    const snapshot={schema_version:'legacy-ledger-snapshot.v0.4.0',run_id:runId,...identities,captured_at:new Date().toISOString(),
      decision_ref:decisionRef,run_config_ref:pin(configPath),backup_ref:backupRef,legacy_lock_ref:oldLockRef,source_fingerprints:before,
      ...captured,stage_aliases:STAGE_ALIASES,row_counts:Object.fromEntries(Object.entries(captured.tables).map(([name,rows])=>[name,rows.length])),
      acceptance_scope:'Legacy states are historical observations, not native validation, source-liveness or factual PASS receipts.',visibility:'private_only'};
    const snapshotRef=saveJson(quarantineRoot,'legacy-snapshot.json',snapshot);
    journal('capture.verified',{backup_ref:backupRef,snapshot_ref:snapshotRef,row_counts:snapshot.row_counts});
    // SHM read marks can legitimately change during a read-only backup; capture
    // its final bytes, while DB/WAL and every original document must stay exact.
    const inventory=[...before.filter(ref=>ref.relative_path!=='EXECUTOR.lock.md'),fingerprint(runDir,'ledger/run.sqlite-shm'),oldLock].filter(ref=>ref.exists);
    for(const expected of inventory){
      requireSame(runDir,expected);
      const from=inside(runDir,expected.relative_path),to=inside(quarantineRoot,'legacy-original/'+expected.relative_path);
      fs.mkdirSync(path.dirname(to),{recursive:true});inside(runDir,from);inside(quarantineRoot,to);
      if(fs.existsSync(to))throw failure('Quarantine destination already exists');
      fs.renameSync(from,to);moved.push({relative_path:expected.relative_path,from,to,sha256:expected.sha256,bytes:expected.bytes});
      if(pin(to).sha256!==expected.sha256)throw failure('Legacy evidence changed while moving: '+expected.relative_path,'LEGACY_CHANGED');
      journal('original.quarantined',{original_path:expected.relative_path,quarantined_ref:pin(to)});
    }
    // A new contender cannot be overwritten; acquisition remains exclusive.
    lockHandle=acquireExecutorLock({runDir,runId,executorId});
    lockHandle.assertHeld();
    for(const item of moved)if(pin(item.to).sha256!==item.sha256)throw failure('Quarantined evidence changed before completion','LEGACY_CHANGED');
    requireSame(runDir,configFingerprint);verifyRef(decisionRef,projectRoot);
    const receipt={schema_version:'legacy-handover-receipt.v0.4.0',status:'LEGACY_CAPTURED_NATIVE_LOCK_HELD',run_id:runId,builder_session:executorId,stopped_holder:decision.stopped_builder_session,runner_session:decision.runner_session??null,
      decision_ref:decisionRef,authority_basis:'Explicit pinned founder ownership decision; no lock-age or PID heuristic.',legacy_lock_ref:oldLockRef,
      backup_ref:backupRef,snapshot_ref:snapshotRef,candidate_lineage_id:identities.candidate_lineage_id,lineage_basis:identities.lineage_basis,stage_aliases:STAGE_ALIASES,
      archived_originals:moved.map(item=>({original_path:item.relative_path,...pin(item.to)})),new_lock_ref:pin(lockHandle.lockPath),
      journal_path:journalPath,model_calls:0,reservations:0,native_ledger_created:false,content_calls_authorized:false,visibility:'private_only',
      note:'Original SQLite and raw rows are preserved. Caller must create/import the native ledger and verify counters before runner handover. Historical source registration does not establish current source/fact acceptance.'};
    const receiptRef=saveJson(quarantineRoot,'handover-receipt.json',receipt);
    journal('handover.prepared',{receipt_ref:receiptRef,new_lock_ref:receipt.new_lock_ref});
    archiveGuard('handover-guard.completed.json');
    return{lockHandle,backupRef,snapshotRef,receiptRef,quarantineRoot,stageAliases:STAGE_ALIASES};
  }catch(error){
    const rollback=[];
    try{journal('handover.failed',{code:error.code??null,message:error.message});}catch{}
    if(lockHandle){
      try{saveBytes(quarantineRoot,'native-lock.rolled-back.md',fs.readFileSync(lockHandle.lockPath));lockHandle.release();rollback.push({operation:'release_own_native_lock',status:'PASS'});}
      catch(e){rollback.push({operation:'release_own_native_lock',status:'FAIL',message:e.message});}
    }
    for(const item of [...moved].reverse()){
      try{
        inside(runDir,item.from);inside(quarantineRoot,item.to);
        if(fs.existsSync(item.from))throw failure('Original path occupied; rollback will not overwrite it');
        if(!fs.existsSync(item.to))throw failure('Quarantined original missing during rollback');
        fs.mkdirSync(path.dirname(item.from),{recursive:true});fs.renameSync(item.to,item.from);
        rollback.push({operation:'restore_original',path:item.relative_path,status:'PASS'});
      }catch(e){rollback.push({operation:'restore_original',path:item.relative_path,status:'FAIL',message:e.message});}
    }
    const complete=rollback.every(item=>item.status==='PASS');
    try{journal('rollback.finished',{complete,operations:rollback});}catch{}
    if(complete&&fs.existsSync(quarantineRoot))try{archiveGuard('handover-guard.failed.json');}catch(e){rollback.push({operation:'archive_own_guard',status:'FAIL',message:e.message});}
    error.quarantineRoot=quarantineRoot;error.rollback=rollback;error.manual_reconciliation_required=rollback.some(item=>item.status==='FAIL')||fs.existsSync(guardPath);
    throw error;
  }
}
