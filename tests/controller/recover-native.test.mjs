import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {DatabaseSync} from 'node:sqlite';
import {recoverNativeOwnership} from '../../tools/belt/recover-native.mjs';
import {acquireExecutorLock, readExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {canonicalJson, sha256} from '../../tools/belt/atomic-file.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';

const PROJECT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TEMP = path.join(PROJECT, 'tests/.tmp');
const digest = file => sha256(fs.readFileSync(file));
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const budget = {currency:'USD',total_usd:2,providers:{meta:{total_usd:2,per_call_usd:1}},roles:{'02':{total_usd:2,per_call_usd:1}}};
function save(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
  return {path:file, sha256:digest(file)};
}
function fixture(t, {child=false} = {}) {
  fs.mkdirSync(TEMP, {recursive:true});
  const projectRoot = fs.mkdtempSync(path.join(TEMP, 'nova-native-recovery-'));
  t.after(() => {
    if (path.dirname(path.resolve(projectRoot)) !== path.resolve(TEMP) || !path.basename(projectRoot).startsWith('nova-native-recovery-')) throw Error('Unsafe synthetic cleanup');
    fs.rmSync(projectRoot, {recursive:true, force:true});
  });
  const runId='synthetic-recovery', runDir=path.join(projectRoot, 'runs', runId), executorId='synthetic-new-owner';
  fs.mkdirSync(path.join(runDir, 'ledger'), {recursive:true});
  if (!child) {
    acquireExecutorLock({runDir, runId, executorId:'synthetic-stopped-owner'});
    // Helper tests deliberately use an opaque sentinel: it must not even open SQLite.
    fs.writeFileSync(path.join(runDir, 'ledger/run.sqlite'), 'SYNTHETIC DATABASE BYTES MUST NOT CHANGE');
  }
  return {projectRoot, runDir, runId, executorId};
}
function authority(f, {oldGeneration=1, basis='operator_confirmed_process_stopped'} = {}) {
  const old = readExecutorLock(f.runDir), now = new Date().toISOString();
  const stopped = {schema_version:'nova-executor-stopped.v0.4.0',status:'PASS',source:'operator',run_id:f.runId,
    executor_id:old.executor_id,lock_id:old.lock_id,pid:old.pid,hostname:old.hostname,process_stopped:true,
    recorded_by:'SYNTHETIC TEST OPERATOR',recorded_at:now,basis,content_calls_authorized:false};
  const stoppedRef = save(path.join(f.runDir, 'receipts/stopped.json'), stopped);
  const reconciliation = {schema_version:'nova-run-recovery.v0.4.0',status:'PASS',action:'recover_run',source:'operator',
    content_calls_authorized:false,run_id:f.runId,old_generation:oldGeneration,old_lock_id:old.lock_id,
    old_executor_id:old.executor_id,new_executor_id:f.executorId,old_lock_ref:{path:'EXECUTOR.lock.md',sha256:digest(old.lockPath)},
    stopped_evidence_ref:stoppedRef,binding_sha256:'1'.repeat(64),mode:'dry_run',budget_sha256:sha256(canonicalJson(budget)),
    recorded_by:'SYNTHETIC TEST OPERATOR',recorded_at:now};
  const reconciliationRef=save(path.join(f.runDir,'receipts/reconciliation.json'), reconciliation);
  return {...f, old, stopped, stoppedRef, reconciliation, reconciliationRef};
}

test('explicit native recovery archives exact lock and returns derived receipt without touching database', async t => {
  const f=authority(fixture(t)), oldBytes=fs.readFileSync(f.old.lockPath), db=path.join(f.runDir,'ledger/run.sqlite'), dbHash=digest(db);
  const result=await recoverNativeOwnership(f); t.after(()=>{try{result.lockHandle.release();}catch{}});
  result.lockHandle.assertHeld();
  assert.notEqual(result.lockHandle.lockId,f.old.lock_id);
  assert.equal(readExecutorLock(f.runDir).executor_id,f.executorId);
  assert.deepEqual(fs.readFileSync(result.archivedLockRef.path),oldBytes);
  const derived=read(result.receiptRef.path);
  assert.equal(derived.schema_version,'nova-run-recovery.v0.4.0');
  assert.equal(derived.old_lock_ref.sha256,sha256(oldBytes));
  assert.equal(digest(path.join(f.runDir,derived.old_lock_ref.path)),sha256(oldBytes));
  assert.equal(derived.source_reconciliation_ref.sha256,f.reconciliationRef.sha256);
  assert.equal(derived.new_lock_id,result.lockHandle.lockId);
  assert.equal(derived.content_calls_authorized,false);
  assert.equal(digest(db),dbHash);
  assert.equal(fs.existsSync(path.join(f.runDir,'.NATIVE-RECOVERY.guard.json')),false);
});

test('wrong hash, generation, executor or content grant leaves current lock untouched', async t => {
  const f=authority(fixture(t)), before=digest(f.old.lockPath);
  await assert.rejects(recoverNativeOwnership({...f,reconciliationRef:{...f.reconciliationRef,sha256:'0'.repeat(64)}}),/hash mismatch/);
  for (const change of [{old_generation:0},{new_executor_id:'other'},{content_calls_authorized:true},{binding_sha256:null}]) {
    const reconciliationRef=save(f.reconciliationRef.path,{...f.reconciliation,...change});
    await assert.rejects(recoverNativeOwnership({...f,reconciliationRef}),/does not explicitly authorize/);
    assert.equal(digest(f.old.lockPath),before);
  }
});

test('stop proof requires exact old holder PID and explicit stop, never age or PID heuristics', async t => {
  const f=authority(fixture(t)), before=digest(f.old.lockPath);
  for (const change of [{process_stopped:false},{pid:f.old.pid+1},{basis:'dead_pid'},{content_calls_authorized:true},{lock_id:'different-lock'}]) {
    const stoppedRef=save(f.stoppedRef.path,{...f.stopped,...change});
    const reconciliationRef=save(f.reconciliationRef.path,{...f.reconciliation,stopped_evidence_ref:stoppedRef});
    await assert.rejects(recoverNativeOwnership({...f,reconciliationRef}),/Stopped evidence/);
    assert.equal(digest(f.old.lockPath),before);
  }
});

test('uncommitted caller rollback restores exact old lock and preserves archived evidence', async t => {
  const f=authority(fixture(t)), before=fs.readFileSync(f.old.lockPath), dbHash=digest(path.join(f.runDir,'ledger/run.sqlite'));
  const result=await recoverNativeOwnership(f);
  assert.equal(result.rollback().status,'rolled_back');
  assert.deepEqual(fs.readFileSync(f.old.lockPath),before);
  assert.deepEqual(fs.readFileSync(result.archivedLockRef.path),before);
  assert.equal(digest(path.join(f.runDir,'ledger/run.sqlite')),dbHash);
  assert.equal(result.rollback().reused,true);
  assert.throws(()=>result.lockHandle.assertHeld(),/RELEASED/);
});

test('existing guard or mismatched current lock never grants recovery authority', async t => {
  const f=authority(fixture(t)), before=digest(f.old.lockPath), guard=path.join(f.runDir,'.NATIVE-RECOVERY.guard.json');
  fs.writeFileSync(guard,'SYNTHETIC prior recovery owner');
  await assert.rejects(recoverNativeOwnership(f),/existing recovery guard/);
  assert.equal(digest(f.old.lockPath),before);
  fs.unlinkSync(guard);
  fs.appendFileSync(f.old.lockPath,'SYNTHETIC changed lock');
  await assert.rejects(recoverNativeOwnership(f),/hash mismatch|differs/);
});

test('actual child exit leaves completed synthetic call and fsynced output for explicit ownership recovery', async t => {
  const f=fixture(t,{child:true});
  const imports=Object.fromEntries(['ledger','executor-lock','atomic-file','artifact-task'].map(name=>[name,new URL('../../tools/belt/'+name+'.mjs',import.meta.url).href]));
  const script=`import fs from 'node:fs';import path from 'node:path';
    import {openLedger} from ${JSON.stringify(imports.ledger)};
    import {acquireExecutorLock} from ${JSON.stringify(imports['executor-lock'])};
    import {writeImmutable} from ${JSON.stringify(imports['atomic-file'])};
    import {runArtifactTask} from ${JSON.stringify(imports['artifact-task'])};
    const f=${JSON.stringify(f)},budget=${JSON.stringify(budget)};
    const lockHandle=acquireExecutorLock({runDir:f.runDir,runId:f.runId,executorId:'synthetic-crashed-child'});
    const ledger=openLedger({dbPath:path.join(f.runDir,'ledger/run.sqlite'),lockHandle});
    const fence=ledger.claimRun({runId:f.runId,bindingSha256:'1'.repeat(64),mode:'dry_run',budget});
    const task=ledger.ensureTask(fence,{lineageId:'synthetic-lineage',stageId:'02.dossier_sections',roleId:'02',inputs:[],versions:{synthetic:'v1'},model:'SYNTHETIC-STUB',config:{},maxAttempts:2});
    const attempt=ledger.startAttempt(fence,{taskId:task.task_id,commandId:'synthetic-crash-attempt'});
    const reservation=ledger.reserveBudget(fence,{attemptId:attempt.attempt_id,provider:'meta',roleId:'02',maxUsd:1,pricingRef:{label:'SYNTHETIC-STUB-PRICE'}});
    ledger.recordModelCall(fence,{attemptId:attempt.attempt_id,reservationId:reservation.reservation_id,callId:'synthetic-completed-call',provider:'meta',roleId:'02',model_requested:'SYNTHETIC-STUB'});
    const receiptRef=writeImmutable(f.runDir,'receipts/synthetic-call.json',{status:'SYNTHETIC completed stub',usage:{prompt_tokens:1,completion_tokens:1}},{lockHandle});
    ledger.completeModelCall(fence,{callId:'synthetic-completed-call',status:'completed',usage:{prompt_tokens:1,completion_tokens:1,total_tokens:2},receiptRef,responseMetadata:{returned_model:'SYNTHETIC-STUB',finish_reason:'stop'}});
    ledger.settleReservation(fence,{reservationId:reservation.reservation_id,status:'reported',actualUsd:0.01,evidenceRef:receiptRef});
    await runArtifactTask({ledger,fence,lockHandle,runDir:f.runDir,task,requiredChecks:['SYNTHETIC.CHECK'],produce:()=>({kind:'SYNTHETIC saved output'}),afterOutputSaved:()=>process.exit(17)});
  `;
  const child=spawnSync(process.execPath,['--experimental-sqlite','--input-type=module','-e',script],{encoding:'utf8',timeout:15000});
  assert.equal(child.status,17,child.stderr);
  const f2=authority(f,{basis:'observed_process_exit'});
  assert.equal(f2.old.pid,child.pid);
  const dbPath=path.join(f.runDir,'ledger/run.sqlite'), db=new DatabaseSync(dbPath,{readOnly:true});
  let before;
  try {
    before={tasks:db.prepare('SELECT * FROM tasks').all(),attempts:db.prepare('SELECT * FROM attempts').all(),calls:db.prepare('SELECT * FROM model_calls').all(),reserves:db.prepare('SELECT * FROM reservations').all()};
    assert.equal(before.calls.length,1);assert.equal(before.calls[0].status,'completed');assert.equal(before.tasks[0].status,'running');
    assert.equal(db.prepare("SELECT count(*) n FROM artifacts WHERE status='accepted'").get().n,0);
  } finally {db.close();}
  const result=await recoverNativeOwnership(f2);t.after(()=>{try{result.lockHandle.release();}catch{}});
  const after=new DatabaseSync(dbPath,{readOnly:true});
  try {
    assert.deepEqual(after.prepare('SELECT * FROM tasks').all(),before.tasks);
    assert.deepEqual(after.prepare('SELECT * FROM attempts').all(),before.attempts);
    assert.deepEqual(after.prepare('SELECT * FROM model_calls').all(),before.calls);
    assert.deepEqual(after.prepare('SELECT * FROM reservations').all(),before.reserves);
  } finally {after.close();}
  const output=path.join(f.runDir,'artifacts',before.tasks[0].task_id,before.attempts[0].attempt_id,'artifact.json');
  assert.deepEqual(read(output),{kind:'SYNTHETIC saved output'});
  // The helper's derived proof must be consumable by the actual native ownership API.
  const recoveredLedger=openLedger({dbPath,lockHandle:result.lockHandle,allowRunRecovery:true});
  let fence;
  try {
    fence=recoveredLedger.recoverRunOwnership({runId:f.runId,bindingSha256:'1'.repeat(64),mode:'dry_run',budget,reconciliationReceipt:result.receiptRef});
    assert.equal(fence.generation,2);
    const snapshot=recoveredLedger.snapshot(f.runId);
    assert.equal(snapshot.tasks.length,1);assert.equal(snapshot.attempts.length,1);assert.equal(snapshot.model_calls.length,1);assert.equal(snapshot.reservations.length,1);
    assert.equal(snapshot.model_calls[0].status,'completed');
    assert.equal(snapshot.events.filter(e=>e.type==='run.ownership_recovered').length,1);
  } finally {if(fence)recoveredLedger.releaseRun(fence);recoveredLedger.close();}
});
