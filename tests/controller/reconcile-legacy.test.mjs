import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {prepareLegacyMigration} from '../../tools/belt/reconcile-legacy.mjs';
import {sha256} from '../../tools/belt/atomic-file.mjs';
import {readExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';

const PROJECT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const TEMP=path.join(PROJECT,'tests','.tmp');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const digest=file=>sha256(fs.readFileSync(file));
function json(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
function fixture(t){
  fs.mkdirSync(TEMP,{recursive:true});
  const root=fs.mkdtempSync(path.join(TEMP,'nova-reconcile-'));
  t.after(()=>{
    const resolved=path.resolve(root);
    if(path.dirname(resolved)!==path.resolve(TEMP)||!path.basename(resolved).startsWith('nova-reconcile-'))throw Error('Unsafe synthetic cleanup target');
    fs.rmSync(resolved,{recursive:true,force:true});
  });
  const projectRoot=path.join(root,'project'),runId='synthetic-legacy',runDir=path.join(projectRoot,'runs',runId);
  fs.mkdirSync(path.join(runDir,'ledger'),{recursive:true});
  fs.mkdirSync(path.join(runDir,'sources/private'),{recursive:true});
  const config={run_id:runId,execution_enabled:false,limits:{spend_mode:'dry_run'},scope:{jurisdiction:'US-UT'}};
  json(path.join(runDir,'run-config.json'),config);
  const executorId='synthetic-builder',oldHolder='synthetic-stopped';
  const decision={schema_version:'builder-ownership.v0.4.0',run_id:runId,builder_session:executorId,stopped_builder_session:oldHolder,runner_session:'synthetic-runner',authority:'Direct founder instruction — SYNTHETIC TEST',founder_words:'Select the synthetic builder for runs/'+runId+'/EXECUTOR.lock.md; preserve the prior evidence.',content_calls_authorized:false,legacy_state:'Preserve exact lock and consistent backup; no age heuristic.'};
  const decisionPath=path.join(projectRoot,'coordination/decision.json');json(decisionPath,decision);
  const oldLock='# EXECUTOR LOCK - runs/'+runId+'\nholder: '+oldHolder+'\nclaimed_at: 2020-01-01T00:00:00Z\nstatus: HELD\ncontroller: synthetic-legacy\n';
  fs.writeFileSync(path.join(runDir,'EXECUTOR.lock.md'),oldLock);
  json(path.join(runDir,'15-source-registry.json'),{source:'SYNTHETIC registration metadata',status:'active',liveness:'VERIFICATION_DEBT'});
  json(path.join(runDir,'role15-findings.json'),{status:'SYNTHETIC',facts:[]});
  fs.writeFileSync(path.join(runDir,'trace.html'),'<html>SYNTHETIC legacy trace</html>');
  const pdf=path.join(runDir,'sources/private/handbook.pdf');fs.writeFileSync(pdf,'%PDF-SYNTHETIC; never parsed');
  const dbPath=path.join(runDir,'ledger/run.sqlite'),db=new DatabaseSync(dbPath);
  try{
    db.exec(`CREATE TABLE runs(run_id TEXT PRIMARY KEY,config_sha256 TEXT,execution_enabled INTEGER,spend_mode TEXT,created_at TEXT);
      CREATE TABLE tasks(logical_task_id TEXT PRIMARY KEY,run_id TEXT,stage_id TEXT,role_id TEXT,state TEXT,attempt_count INTEGER,created_at TEXT);
      CREATE TABLE attempts(attempt_id TEXT PRIMARY KEY,logical_task_id TEXT,attempt_no INTEGER,state TEXT,created_at TEXT);
      CREATE TABLE model_calls(call_id TEXT PRIMARY KEY);
      CREATE TABLE reservations(reservation_id TEXT PRIMARY KEY);
      CREATE TABLE artifacts(artifact_id TEXT PRIMARY KEY,run_id TEXT,stage_id TEXT,logical_task_id TEXT,path TEXT,sha256 TEXT,validation_status TEXT);
      CREATE TABLE events(seq INTEGER PRIMARY KEY,event_id TEXT,run_id TEXT,kind TEXT,at_utc TEXT,note TEXT);
      CREATE TABLE opaque_evidence(id TEXT PRIMARY KEY,raw BLOB,large_int INTEGER);`);
    db.prepare('INSERT INTO runs VALUES (?,?,?,?,?)').run(runId,digest(path.join(runDir,'run-config.json')),0,'dry_run','2026-10-26T23:48:51.915Z');
    db.prepare('INSERT INTO tasks VALUES (?,?,?,?,?,?,?)').run('legacy-task',runId,'15.source_registry','15','accepted',1,'2026-10-26T23:49:24.126Z');
    db.prepare('INSERT INTO attempts VALUES (?,?,?,?,?)').run('legacy-attempt','legacy-task',1,'accepted','2026-10-26T23:49:24.142Z');
    db.prepare('INSERT INTO artifacts VALUES (?,?,?,?,?,?,?)').run('legacy-artifact',runId,'15.source_registry','legacy-task','runs/'+runId+'/15-source-registry.json',digest(path.join(runDir,'15-source-registry.json')),'PASS');
    db.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(9,'legacy-event',runId,'attempt.accepted','2026-10-26T23:49:24.143Z','SYNTHETIC registration; VERIFICATION_DEBT remains');
    db.prepare('INSERT INTO opaque_evidence VALUES (?,?,?)').run('opaque',Buffer.from([0,255,17]),9007199254740993n);
  }finally{db.close();}
  const decisionRef={path:'coordination/decision.json',sha256:digest(decisionPath)};
  return{root,projectRoot,runDir,runId,executorId,decisionRef,decisionPath,decision,oldHolder,oldLock,pdf,dbPath};
}
function updateDb(f,sql){const db=new DatabaseSync(f.dbPath);try{db.exec(sql);}finally{db.close();}}
function originalHashes(f){return Object.fromEntries(['EXECUTOR.lock.md','ledger/run.sqlite','15-source-registry.json','role15-findings.json','trace.html'].map(rel=>[rel,digest(path.join(f.runDir,rel))]));}

test('explicit migration preserves a coherent backup, raw rows and exact lock; returns a new held native lock',async t=>{
  const f=fixture(t),original=originalHashes(f),pdfHash=digest(f.pdf);
  const result=await prepareLegacyMigration(f);t.after(()=>{try{result.lockHandle.release();}catch{}});
  assert.equal(readExecutorLock(f.runDir).executor_id,f.executorId);
  assert.equal(fs.existsSync(f.dbPath),false,'caller must explicitly create the native ledger');
  assert.equal(digest(result.backupRef.path),result.backupRef.sha256);
  assert.ok(fs.readFileSync(result.backupRef.path).subarray(0,16).equals(Buffer.from('SQLite format 3\0')));
  const snapshot=read(result.snapshotRef.path),receipt=read(result.receiptRef.path);
  assert.equal(snapshot.run_id,f.runId);assert.equal(snapshot.candidate_lineage_id,f.runId+':lineage:1');
  assert.equal(snapshot.tables.tasks[0].logical_task_id,'legacy-task');
  assert.equal(snapshot.tables.tasks[0].state,'accepted');
  assert.equal(snapshot.tables.attempts[0].created_at,'2026-10-26T23:49:24.142Z');
  assert.equal(snapshot.tables.events[0].seq,9);
  assert.equal(snapshot.identity_map.tasks['legacy-task'].stage_id,'15.sources');
  assert.equal(snapshot.identity_map.tasks['legacy-task'].legacy_stage_id,'15.source_registry');
  assert.deepEqual(snapshot.tables.opaque_evidence[0].raw,{__sqlite_blob_base64__:'AP8R'});
  assert.deepEqual(snapshot.tables.opaque_evidence[0].large_int,{__sqlite_integer_decimal__:'9007199254740993'});
  assert.equal(receipt.content_calls_authorized,false);assert.equal(receipt.native_ledger_created,false);
  assert.equal(fs.readFileSync(receipt.legacy_lock_ref.path,'utf8'),f.oldLock);
  for(const [relative,hash]of Object.entries(original))assert.equal(digest(path.join(result.quarantineRoot,'legacy-original',relative)),hash);
  assert.equal(digest(f.pdf),pdfHash);assert.ok(fs.existsSync(f.pdf),'private handbook remains at its original path');
  assert.ok(result.quarantineRoot.startsWith(path.join(f.runDir,'sources/private/quarantine')));
  assert.equal(fs.existsSync(path.join(f.runDir,'.LEGACY-HANDOVER.guard.json')),false);
  assert.ok(fs.existsSync(path.join(result.quarantineRoot,'handover-guard.completed.json')));
});

test('wrong decision hash or selected builder cannot replace an existing plain lock',async t=>{
  const f=fixture(t),before=originalHashes(f);
  await assert.rejects(prepareLegacyMigration({...f,decisionRef:{...f.decisionRef,sha256:'1'.repeat(64)}}),/hash mismatch/);
  await assert.rejects(prepareLegacyMigration({...f,executorId:'unselected-builder'}),/does not authorize/);
  assert.deepEqual(originalHashes(f),before);
  assert.equal(fs.existsSync(path.join(f.runDir,'.LEGACY-HANDOVER.guard.json')),false);
});

test('decision must match the stopped holder and the exact run; lock age grants nothing',async t=>{
  const f=fixture(t),before=originalHashes(f);
  json(f.decisionPath,{...f.decision,stopped_builder_session:'some-other-holder'});
  await assert.rejects(prepareLegacyMigration({...f,decisionRef:{...f.decisionRef,sha256:digest(f.decisionPath)}}),/plain lock/);
  json(f.decisionPath,{...f.decision,run_id:'different-run'});
  await assert.rejects(prepareLegacyMigration({...f,decisionRef:{...f.decisionRef,sha256:digest(f.decisionPath)}}),/not bound/);
  assert.deepEqual(originalHashes(f),before);
});

test('nonzero model or reservation accounting prevents transfer without changing legacy evidence',async t=>{
  for(const table of ['model_calls','reservations'])await t.test(table,async t=>{
    const f=fixture(t);updateDb(f,'INSERT INTO '+table+' VALUES (\'synthetic-record\')');const before=originalHashes(f);
    await assert.rejects(prepareLegacyMigration(f),error=>error.code==='LEGACY_ACCOUNTING_HOLD');
    assert.deepEqual(originalHashes(f),before);
    assert.equal(fs.existsSync(path.join(f.runDir,'.LEGACY-HANDOVER.guard.json')),false);
  });
});

test('active or unknown attempt state prevents transfer',async t=>{
  const f=fixture(t);updateDb(f,"UPDATE attempts SET state='running'");const before=originalHashes(f);
  await assert.rejects(prepareLegacyMigration(f),error=>error.code==='LEGACY_ACTIVE_ATTEMPT');
  assert.deepEqual(originalHashes(f),before);
});

test('an existing handover guard is never stolen or aged out',async t=>{
  const f=fixture(t),before=originalHashes(f),guard=path.join(f.runDir,'.LEGACY-HANDOVER.guard.json');
  fs.writeFileSync(guard,'another owner\n');
  await assert.rejects(prepareLegacyMigration(f),error=>error.code==='LEGACY_HANDOVER_GUARD_HELD');
  assert.equal(fs.readFileSync(guard,'utf8'),'another owner\n');assert.deepEqual(originalHashes(f),before);
});

test('partial quarantine failure restores every moved original and records rollback',async t=>{
  const f=fixture(t),before=originalHashes(f),rename=fs.renameSync;let injected=false;
  fs.renameSync=(from,to)=>{if(!injected&&from===path.join(f.runDir,'trace.html')){injected=true;const error=Error('SYNTHETIC move failure');error.code='EIO';throw error;}return rename(from,to);};
  let failure;
  try{await prepareLegacyMigration(f);}catch(error){failure=error;}finally{fs.renameSync=rename;}
  assert.ok(failure);assert.equal(injected,true);assert.equal(failure.manual_reconciliation_required,false);
  assert.deepEqual(originalHashes(f),before);
  const rows=fs.readFileSync(path.join(failure.quarantineRoot,'migration-journal.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(rows.at(-1).event,'rollback.finished');assert.equal(rows.at(-1).complete,true);
  assert.ok(fs.existsSync(path.join(failure.quarantineRoot,'consistent-legacy.sqlite')));
  assert.equal(fs.existsSync(path.join(f.runDir,'.LEGACY-HANDOVER.guard.json')),false);
});

test('a concurrent original-byte change is detected and moved evidence is restored without hiding the change',async t=>{
  const f=fixture(t),oldLock=f.oldLock,rename=fs.renameSync;let injected=false;
  fs.renameSync=(from,to)=>{if(!injected&&from===f.dbPath){injected=true;fs.appendFileSync(from,'SYNTHETIC concurrent change');}return rename(from,to);};
  let failure;
  try{await prepareLegacyMigration(f);}catch(error){failure=error;}finally{fs.renameSync=rename;}
  assert.equal(failure?.code,'LEGACY_CHANGED');assert.ok(fs.existsSync(f.dbPath));
  assert.equal(fs.readFileSync(path.join(f.runDir,'EXECUTOR.lock.md'),'utf8'),oldLock);
  assert.ok(fs.readFileSync(f.dbPath).includes(Buffer.from('SYNTHETIC concurrent change')));
  assert.ok(fs.existsSync(path.join(failure.quarantineRoot,'consistent-legacy.sqlite')));
});

test('configured lineage is preserved without editing the original legacy tables',async t=>{
  const f=fixture(t),configPath=path.join(f.runDir,'run-config.json');
  json(configPath,{...read(configPath),candidate_lineage_id:'founder-pinned-lineage'});
  const result=await prepareLegacyMigration(f);t.after(()=>{try{result.lockHandle.release();}catch{}});
  const snapshot=read(result.snapshotRef.path);
  assert.equal(snapshot.candidate_lineage_id,'founder-pinned-lineage');
  assert.equal(snapshot.identity_map.tasks['legacy-task'].lineage_id,'founder-pinned-lineage');
  assert.equal(Object.hasOwn(snapshot.tables.tasks[0],'lineage_id'),false);
});

test('backup includes committed WAL rows and quarantines the exact original WAL',async t=>{
  const f=fixture(t),writerDir=path.join(f.root,'synthetic-writer');fs.mkdirSync(writerDir);
  const writerPath=path.join(writerDir,'writer.sqlite');fs.copyFileSync(f.dbPath,writerPath);
  const writer=new DatabaseSync(writerPath);
  try{
    writer.exec('PRAGMA journal_mode=WAL; PRAGMA wal_autocheckpoint=0;');
    writer.prepare('INSERT INTO events VALUES (?,?,?,?,?,?)').run(10,'wal-event',f.runId,'SYNTHETIC committed WAL event','2026-10-26T23:50:00Z','WAL-only committed row');
    for(const suffix of ['','-wal','-shm'])fs.copyFileSync(writerPath+suffix,f.dbPath+suffix);
  }finally{writer.close();}
  const walHash=digest(f.dbPath+'-wal');
  const result=await prepareLegacyMigration(f);t.after(()=>{try{result.lockHandle.release();}catch{}});
  assert.equal(read(result.snapshotRef.path).tables.events.some(row=>row.event_id==='wal-event'),true);
  assert.equal(digest(path.join(result.quarantineRoot,'legacy-original/ledger/run.sqlite-wal')),walHash);
});

test('private quarantine rejects an existing ancestor resolving outside the owned run',async t=>{
  const f=fixture(t),before=originalHashes(f),privatePath=path.join(f.runDir,'sources/private'),outside=path.join(f.root,'synthetic-outside');
  fs.mkdirSync(outside);const realpath=fs.realpathSync;
  // The Windows sandbox denies creating junctions. Exercise the actual path
  // guard at its realpath seam instead; this does not claim an OS-junction test.
  fs.realpathSync=(value,...args)=>path.resolve(String(value))===path.resolve(privatePath)?outside:realpath(value,...args);
  try{await assert.rejects(prepareLegacyMigration(f),/Symlink\/junction escapes/);}finally{fs.realpathSync=realpath;}
  assert.deepEqual(originalHashes(f),before);
  assert.equal(fs.existsSync(path.join(f.runDir,'.LEGACY-HANDOVER.guard.json')),false);
});

test('raw snapshot imports into the native ledger without resetting legacy attempt counters',async t=>{
  const f=fixture(t),result=await prepareLegacyMigration(f);
  const ledger=openLedger({dbPath:f.dbPath,lockHandle:result.lockHandle});let fence;
  try{
    fence=ledger.claimRun({runId:f.runId,bindingSha256:digest(path.join(f.runDir,'run-config.json')),mode:'dry_run',budget:{}});
    const imported=ledger.importLegacyHistory(fence,{snapshotRef:result.snapshotRef,backupRef:result.backupRef,stageAliases:result.stageAliases});
    assert.deepEqual(imported.attempt_counts,[{lineage_id:f.runId+':lineage:1',stage_id:'15.sources',role_id:'15',count:1}]);
    const task=ledger.ensureTask(fence,{lineageId:f.runId+':lineage:1',stageId:'15.sources',roleId:'15',inputs:[{sha256:'1'.repeat(64)}],versions:{script:'SYNTHETIC-new-registration'},maxAttempts:2});
    const attempt=ledger.startAttempt(fence,{taskId:task.taskId,commandId:'synthetic-native-attempt'});
    ledger.failAttempt(fence,{attemptId:attempt.attemptId,status:'failed'});
    const changed=ledger.ensureTask(fence,{lineageId:f.runId+':lineage:1',stageId:'15.sources',roleId:'15',inputs:[{sha256:'2'.repeat(64)}],versions:{script:'SYNTHETIC-new-registration'},maxAttempts:2});
    assert.throws(()=>ledger.startAttempt(fence,{taskId:changed.taskId,commandId:'synthetic-no-counter-reset'}),/LINEAGE_ATTEMPT_LIMIT/);
    assert.equal(ledger.listModelCalls(f.runId).length,0);assert.equal(ledger.listReservations(f.runId).length,0);
  }finally{if(fence)ledger.releaseRun(fence);ledger.close();result.lockHandle.release();}
});
