import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDryPlan,runController,PROJECT_ROOT} from '../../tools/belt/controller.mjs';
import {createMetaClient} from '../../tools/belt/meta-client.mjs';
import {sha256,inside,writeImmutable} from '../../tools/belt/atomic-file.mjs';
import {renderTrace} from '../../tools/belt/trace.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';
import {acquireExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {runArtifactTask} from '../../tools/belt/artifact-task.mjs';

function cleanup(root) {
  const tempRoot=path.join(PROJECT_ROOT,'tests','.tmp');
  const resolved=path.resolve(root);
  if(path.dirname(resolved)!==path.resolve(tempRoot) || !path.basename(resolved).startsWith('nova-controller-')) throw Error('Unsafe test cleanup path');
  fs.rmSync(resolved,{recursive:true,force:true});
}
function temp(t, clean = true) {
  // Windows AppContainer temp permits writes but denies atomic rename. Exercise
  // the actual workspace filesystem used by the controller instead.
  const tempRoot = path.join(PROJECT_ROOT,'tests','.tmp');
  fs.mkdirSync(tempRoot,{recursive:true});
  const root = fs.mkdtempSync(path.join(tempRoot,'nova-controller-'));
  if(clean)t.after(()=>cleanup(root));
  return root;
}
function json(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');}
function fixture(t) {
  const root=temp(t), projectRoot=path.join(root,'project'), runDir=path.join(projectRoot,'runs/sample');
  fs.mkdirSync(runDir,{recursive:true});
  const copy=(rel)=>{const target=path.join(projectRoot,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(PROJECT_ROOT,rel),target);};
  const map=JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT,'schemas-strict/stage-map.json')));
  const stage=map.stages['04.cards'];
  for(const rel of [stage.adapter_schema,stage.mapping,stage.prompt_path,'prompts/controller-header.template.json','contracts/execution-authority.v0.4.0.json'])copy(rel);
  json(path.join(projectRoot,'schemas-strict/stage-map.json'),{stages:{'04.cards':stage}});
  const registry=JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT,'contracts/bot-contract-bindings.json')));
  const role=registry.roles.find(r=>r.role_id==='04');
  const contractSrc=path.resolve(PROJECT_ROOT,'..',role.contract.path),contractDest=path.join(root,role.contract.path);
  fs.mkdirSync(path.dirname(contractDest),{recursive:true});fs.copyFileSync(contractSrc,contractDest);
  json(path.join(projectRoot,'contracts/bot-contract-bindings.json'),{roles:[role]});
  const config={run_id:'sample',execution_enabled:false,scope:{jurisdiction:'US-UT',language:'en',exam_facts:{}},producer:{model:'muse-spark-1.3'},limits:{spend_mode:'dry_run',max_total_usd:10,max_call_usd:1,per_provider_usd_caps:{meta:10},max_automatic_attempts_per_logical_task:2},execution:{ledger:{path:'ledger/run.sqlite'}}};
  const configPath=path.join(runDir,'run-config.json');json(configPath,config);
  return{root,projectRoot,runDir,config,runConfigPath:configPath};
}
test('default controller plans without a ledger, key or provider request',async t=>{
  const f=fixture(t);let calls=0;const before=globalThis.fetch;globalThis.fetch=()=>{calls++;throw Error('No network');};t.after(()=>{globalThis.fetch=before;});
  const result=await runController({...f,executorId:'synthetic'});
  assert.equal(result.status,'DRY_PLAN');assert.equal(result.model_calls,0);assert.equal(calls,0);assert.equal(fs.existsSync(path.join(f.runDir,'ledger/run.sqlite')),false);
  assert.equal(result.plan.tasks.length,1);assert.equal(result.plan.tasks[0].rendered_request.header.execution_authorized,false);assert.equal(result.plan.tasks[0].provider_activity,'NOT_DISPATCHED');
});
test('dry ledger init reopens idempotently with zero model attempts or reservations',async t=>{
  const f=fixture(t);
  const first=await runController({...f,executorId:'synthetic',initLedger:true});
  const second=await runController({...f,executorId:'synthetic',initLedger:true});
  assert.equal(first.tasks,1);assert.equal(second.tasks,1);assert.equal(second.model_calls,0);assert.equal(second.reservations,0);
  const snap=JSON.parse(fs.readFileSync(second.snapshot_ref.path));assert.equal(snap.attempts.length,0);assert.equal(snap.tasks[0].status,'queued');
  assert.equal(second.diagnostics.journal_mode,'wal');assert.equal(second.diagnostics.synchronous,2);assert.equal(fs.existsSync(path.join(f.runDir,'EXECUTOR.lock.md')),false);
});
test('--go alone cannot override saved founder authority or create a DB',async t=>{
  const f=fixture(t);await assert.rejects(runController({...f,go:true,mode:'live',initLedger:true}),/CONTENT_DISPATCH_BLOCKED/);
  assert.equal(fs.existsSync(path.join(f.runDir,'ledger/run.sqlite')),false);
});
test('even live config flags cannot bypass dry-only authority before provider access',async t=>{
  const f=fixture(t);f.config.execution_enabled=true;f.config.limits.spend_mode='live';let calls=0;
  const client=createMetaClient({...f,config:f.config,go:true,mode:'live',transport:()=>{calls++;throw Error('must not dispatch');}});
  await assert.rejects(client.complete({}),/founder_content_authority_not_granted/);assert.equal(calls,0);
});
test('schema/prompt hash drift blocks the dry plan',t=>{
  const f=fixture(t);fs.appendFileSync(path.join(f.projectRoot,'schemas-strict/04-carddeck.schema.json'),' ');
  assert.throws(()=>buildDryPlan(f),/adapter hash drift/);
});
test('config outside owned runs is rejected',t=>{
  const f=fixture(t);const p=path.join(f.projectRoot,'foreign.json');json(p,f.config);assert.throws(()=>buildDryPlan({...f,runConfigPath:p}),/escapes owned root/);
});
test('atomic outputs refuse traversal, immutable replacement and junction escape',t=>{
  const root=temp(t),owned=path.join(root,'owned'),outside=path.join(root,'outside');fs.mkdirSync(owned);fs.mkdirSync(outside);
  assert.throws(()=>writeImmutable(owned,'../outside/leak.json',{}),/escapes/);
  writeImmutable(owned,'saved.json',{a:1});assert.throws(()=>writeImmutable(owned,'saved.json',{a:2}),/different bytes/);
  fs.symlinkSync(outside,path.join(owned,'jump'),process.platform==='win32'?'junction':'dir');assert.throws(()=>inside(owned,'jump/out.json'),/escapes/);
});
test('trace escapes text and distinguishes planned work from observed model calls',()=>{
  const html=renderTrace({tasks:[{task_id:'x',stage_id:'<script>alert(1)</script>',role_id:'04',status:'queued'}],model_calls:[],events:[],artifacts:[]},{runId:'synthetic'});
  assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('no model call'));assert.ok(html.includes('Animated floor remains deferred'));
});

function artifactContext(t) {
  const runDir=temp(t,false),runId=path.basename(runDir),executorId='synthetic';
  const lockHandle=acquireExecutorLock({runDir,runId,executorId});
  const ledger=openLedger({dbPath:path.join(runDir,'ledger/run.sqlite'),lockHandle});
  const fence=ledger.claimRun({runId,bindingSha256:'1'.repeat(64),mode:'dry_run',budget:{}});
  const task=ledger.ensureTask(fence,{stageId:'04.fixture',roleId:'04',lineageId:'synthetic-lineage',inputs:[{path:'fixture',sha256:'2'.repeat(64)}],versions:{contract:'synthetic-pinned'},config:{kind:'synthetic'}});
  t.after(()=>{ledger.releaseRun(fence);ledger.close();lockHandle.release();cleanup(runDir);});
  return{runDir,ledger,fence,lockHandle,task,requiredChecks:['04.SCHEMA','04.FACTS'],validate:()=>({status:'PASS',checks:[{check_id:'04.SCHEMA',status:'PASS'},{check_id:'04.FACTS',status:'PASS'}],errors:[]}),accept:()=>({status:'PASS',scope:'synthetic'})};
}
test('duplicate completed command reuses exact artifacts without another producer or auditor',async t=>{
  const c=artifactContext(t);let produced=0,audited=0;
  const opts={...c,produce:()=>{produced++;return{answer:'synthetic'};},accept:()=>{audited++;return{status:'PASS'};}};
  const first=await runArtifactTask(opts),second=await runArtifactTask(opts);
  assert.equal(first.status,'accepted');assert.equal(second.reused,true);assert.equal(produced,1);assert.equal(audited,1);assert.equal(c.ledger.listArtifacts(c.fence.runId).filter(a=>a.status==='accepted').length,1);
});
test('crash after artifact write before DB acceptance recovers without reminting',async t=>{
  const c=artifactContext(t);let produced=0;
  const opts={...c,produce:()=>{produced++;return{answer:'synthetic'};}};
  await assert.rejects(runArtifactTask({...opts,afterOutputSaved:()=>{throw Error('injected crash');}}),/injected crash/);
  assert.equal(c.ledger.listArtifacts(c.fence.runId).length,0);
  const result=await runArtifactTask(opts);assert.equal(result.recovered,true);assert.equal(result.status,'accepted');assert.equal(produced,1);
});
test('aggregate PASS missing a mapped check is held and cannot advance',async t=>{
  const c=artifactContext(t);const r=await runArtifactTask({...c,produce:()=>({answer:'synthetic'}),validate:()=>({status:'PASS',checks:[{check_id:'04.SCHEMA',status:'PASS'}],errors:[]})});
  assert.equal(r.status,'HOLD');assert.equal(c.ledger.getTask(c.task.task_id).status,'blocked');assert.equal(c.ledger.listArtifacts(c.fence.runId).filter(a=>a.status==='accepted').length,0);
});
test('source-supported auditor defect holds acceptance despite schema PASS',async t=>{
  const c=artifactContext(t);const r=await runArtifactTask({...c,produce:()=>({answer:'synthetic'}),accept:()=>({status:'HOLD',findings:[{severity:'blocking',source_page:'synthetic-page',reason:'answer contradicts bound source'}]})});
  assert.equal(r.status,'HOLD');assert.equal(c.ledger.getTask(c.task.task_id).status,'blocked');assert.equal(c.ledger.listArtifacts(c.fence.runId).filter(a=>a.status==='accepted').length,0);
});
