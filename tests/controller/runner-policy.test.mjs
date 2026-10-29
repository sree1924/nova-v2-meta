import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {sha256} from '../../tools/belt/atomic-file.mjs';
import {parseRunnerOptions,inspectAcceptedReuse,inspectSubscriptionStep,runnerFailure,archiveBasename} from '../../tools/belt/runner-policy.mjs';
import {runUtah} from '../../tools/belt/run-utah.mjs';
import {authoringKey,retryNonceKey} from '../../tools/belt/dispatch.mjs';
import {authoringPaths,museFileTransport,readAuthoringOutbox} from '../../tools/belt/muse-file-transport.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const section='sec-synthetic-runner',manifest='a'.repeat(64);
const registry=fact=>Buffer.from(JSON.stringify({facts:{F1:{statement:'Stop before proceeding.',spoken_statement:'Stop before proceeding.',status:'verified',verification_debt:[],citations:['HB#p.1'],...fact}}}));
const pin=(kind,value=kind)=>({kind,path:`runs/synthetic/${kind}.json`,sha256:sha256(value)});
function reuseFixture(stageId='04.cards'){
  const registryBytes=registry(),currentRefs=['compiled_dossier','source_registry','page_map','source_text','source_liveness','learning_loop','knowledge_graph','carddeck','exam_bank'].map(k=>pin(k));
  currentRefs.push({...pin('fact_registry'),sha256:sha256(registryBytes)});
  const identity={config:{section_ids:[section],dossier_parts:[]},inputs:structuredClone(currentRefs)};
  return{stageId,sectionIds:[section],acceptedIdentities:[identity],currentRefs,registryBytes,projectRoot:ROOT};
}

test('unchanged registry/dependency pins reuse accepted work across lineage changes',()=>{
  const f=reuseFixture();f.acceptedIdentities[0].lineage_id='previous-accepted-lineage';
  assert.deepEqual(inspectAcceptedReuse(f),{status:'PASS',done:['[]'],stale:[],reason:null});
});
for(const [name,change] of [['statement',{statement:'Do not stop.'}],['status',{status:'verification_debt'}],['debt',{verification_debt:['unresolved']}],['citation',{citations:['HB#p.2']}]]){
  test(`stable fact ID with changed ${name} cannot reuse accepted work`,()=>{
    const f=reuseFixture();f.registryBytes=registry(change);f.currentRefs.find(r=>r.kind==='fact_registry').sha256=sha256(f.registryBytes);
    const result=inspectAcceptedReuse(f);assert.equal(result.done.length,0);assert.deepEqual(result.stale,['[]']);
  });
}
for(const stageId of ['04.cards','05.card_scripts'])test(`changed speech requires current ${stageId} acceptance`,()=>{
  const f=reuseFixture(stageId);f.registryBytes=registry({spoken_statement:'Stop, then proceed only when safe.'});f.currentRefs.find(r=>r.kind==='fact_registry').sha256=sha256(f.registryBytes);
  assert.deepEqual(inspectAcceptedReuse(f).done,[]);
  f.acceptedIdentities.push({config:{section_ids:[section],dossier_parts:[]},inputs:structuredClone(f.currentRefs)});
  assert.deepEqual(inspectAcceptedReuse(f).done,['[]']);assert.deepEqual(inspectAcceptedReuse(f).stale,[]);
});
test('metadata-only compile revision requires genuine current inputs; a fresh nonce is no proof',()=>{
  const f=reuseFixture('03.combined_kg');f.currentRefs.find(r=>r.kind==='compiled_dossier').sha256=sha256('changed F/G metadata');
  f.acceptedIdentities[0].config.retry_nonce=9001;
  assert.deepEqual(inspectAcceptedReuse(f).done,[]);
  f.acceptedIdentities[0].inputs=structuredClone(f.currentRefs);
  assert.deepEqual(inspectAcceptedReuse(f).done,['[]']);
});
test('06 retains its native graph dependency without introducing a cards dependency',()=>{
  const f=reuseFixture('06.exam_bank');f.currentRefs.find(r=>r.kind==='carddeck').sha256=sha256('changed card');
  assert.deepEqual(inspectAcceptedReuse(f).done,['[]']);
  f.currentRefs.find(r=>r.kind==='knowledge_graph').sha256=sha256('changed graph');
  assert.deepEqual(inspectAcceptedReuse(f).done,[]);
});
test('registry bytes must match the accepted ledger hash; missing/unreadable compile metadata holds',()=>{
  const f=reuseFixture();f.registryBytes=registry({statement:'Tampered content.'});
  assert.equal(inspectAcceptedReuse(f).reason,'current_registry_hash_mismatch');
  const absent=reuseFixture();absent.currentRefs=absent.currentRefs.filter(r=>r.kind!=='compiled_dossier');
  assert.equal(inspectAcceptedReuse(absent).status,'HOLD');assert.deepEqual(inspectAcceptedReuse(absent).done,[]);
  const unreadable=reuseFixture();unreadable.registryBytes=Buffer.from('{');unreadable.currentRefs.find(r=>r.kind==='fact_registry').sha256=sha256(unreadable.registryBytes);
  assert.equal(inspectAcceptedReuse(unreadable).reason,'current_registry_metadata_unreadable');
});

const baseArgs=['--executor-id','synthetic-actual-executor','--author','muse','--section',section,'--max-resets','0'];
test('CLI requires explicit executor, explicit author, valid options and paid GO before any run access',()=>{
  for(const argv of [[],['--author','muse','--section',section],['--executor-id','actual','--section',section],['--executor-id','actual','--author','model-api','--section',section], [...baseArgs,'--typo'], [...baseArgs,'--packet','unknown'], [...baseArgs,'--stages','unsafe'], [...baseArgs.slice(0,-2),'--max-resets','1'], [...baseArgs.slice(0,-2),'--max-resets','NaN']])assert.throws(()=>parseRunnerOptions(argv));
  assert.equal(parseRunnerOptions(baseArgs).stepMode,true);
  assert.equal(parseRunnerOptions(['--executor-id','actual','--author','model-api','--go','--section',section]).stepMode,false);
});
test('step policy stops on capacity, uncertain state and stale pins, with no reset/retry disposition',()=>{
  const base={lineageId:'lineage:1',attempts:0,maxAttempts:2,outbox:{ok:false,reason:'outbox_absent'},packet:null,expectedKey:'key',currentManifestSha256:manifest};
  assert.equal(inspectSubscriptionStep(base).status,'EMIT');
  assert.equal(inspectSubscriptionStep({...base,attempts:2}).status,'NEEDS_CAUSE');
  assert.equal(inspectSubscriptionStep({...base,activeAttempts:[{status:'unknown_provider_result'}]}).status,'HOLD');
  assert.equal(inspectSubscriptionStep({...base,packet:{key:'key',candidate_lineage_id:'old',input_manifest_sha256:manifest}}).reason,'stale_packet_lineage');
  assert.equal(runnerFailure(Error('LINEAGE_ATTEMPT_LIMIT')).status,'NEEDS_CAUSE');
  assert.equal(runnerFailure(Error('SEQUENTIAL_TASK_BUSY')).status,'HOLD');
  assert.equal(runnerFailure(Error('not eligible for a new attempt')).status,'HOLD');
});
test('accepted archive names are short content hashes independent of authoring-key length',()=>{
  assert.match(archiveBasename(Buffer.from('outbox'),'accepted'),/^outbox-[a-f0-9]{24}\.accepted\.json$/);
  assert.equal(archiveBasename(Buffer.from('outbox'),'accepted').length,45);
});

function fixture(t,{stageId='02.dossier_sections',parts=['C'],state={tasks:[],attempts:[],reservations:[]},dispatchResult={status:'HOLD',reason:'synthetic_validation_hold'},dispatchError=null}={}){
  const parent=path.join(ROOT,'tests/.tmp');fs.mkdirSync(parent,{recursive:true});
  const projectRoot=fs.mkdtempSync(path.join(parent,'runner-policy-')),runDir=path.join(projectRoot,'runs','synthetic-runner');
  fs.mkdirSync(path.join(runDir,'approvals'),{recursive:true});
  const write=(file,value)=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');return file;};
  const config={run_id:'synthetic-runner',candidate_lineage_id:'synthetic-runner:lineage:1',scope:{section_page_ranges:{[section]:[1]}},execution:{retry_nonces:{}},limits:{max_automatic_attempts_per_logical_task:2}};
  const configPath=write(path.join(runDir,'run-config.json'),config);
  write(path.join(runDir,'approvals/STANDING-AUTHORITY-utah-full-run.json'),{run_id:config.run_id,usd_cap_total:30,founder_words:'SYNTHETIC TEST ONLY: subscription fixture, no provider requests.'});
  const currentRefs=['source_registry','page_map','source_text'].map(kind=>{const file=write(path.join(runDir,'inputs',kind+'.json'),{synthetic:kind});return{kind,path:file,sha256:sha256(fs.readFileSync(file))};});
  const key=authoringKey(stageId,[section],parts,0),files=authoringPaths(runDir,key);
  const packet={key,stage_id:stageId,section_ids:[section],part_ids:parts,candidate_lineage_id:config.candidate_lineage_id,input_manifest_sha256:manifest};
  write(files.inbox,packet);
  const outbox={key,packet_sha256:sha256(fs.readFileSync(files.inbox)),authored_by:'synthetic subscription fixture',artifact:{lineage:{candidate_lineage_id:config.candidate_lineage_id,input_manifest_sha256:manifest}}};
  write(files.outbox,outbox);
  let dispatches=0,emissions=0,compiles=0;
  const runtime={readNativeSnapshot:()=>structuredClone(state),acceptedRuntimeRefs:()=>currentRefs,authoringKey,retryNonceKey,authoringPaths,museFileTransport,readAuthoringOutbox,
    prepareDispatch:()=>({context:{input_manifest_sha256:manifest},preflight:{status:'PASS',blockers:[]}}),applyFileTransportPreflight:p=>p,
    dispatchStage:async()=>{dispatches++;if(dispatchError)throw dispatchError;return structuredClone(dispatchResult);},
    emitThinPacket:()=>{emissions++;throw Error('Unexpected packet overwrite');},emitAuthoringPacket:()=>{emissions++;throw Error('Unexpected packet overwrite');},
    compileAcceptedDossier:async()=>{compiles++;if(dispatchError)throw dispatchError;return structuredClone(dispatchResult);}};
  const argv=['--run','runs/synthetic-runner','--executor-id','synthetic-actual-executor','--author','muse','--section',section,'--stages',stageId,'--parts',parts.join(','),'--max-resets','0'];
  const run=(extra=[])=>runUtah({projectRoot,argv:[...argv,...extra],runtime,loadEnv:false,log:()=>{}});
  const fingerprint=()=>{
    const result=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else result.push([path.relative(runDir,file),sha256(fs.readFileSync(file))]);}};walk(runDir);return result.sort(([a],[b])=>a.localeCompare(b));
  };
  t.after(()=>{if(path.dirname(path.resolve(projectRoot))!==path.resolve(parent)||!path.basename(projectRoot).startsWith('runner-policy-'))throw Error('Unsafe fixture cleanup');fs.rmSync(projectRoot,{recursive:true,force:true});});
  return{projectRoot,runDir,config,configPath,key,files,packet,outbox,currentRefs,runtime,run,fingerprint,write,counts:()=>({dispatches,emissions,compiles})};
}

for(const [name,options] of [['true HOLD',{}],['native exception',{dispatchError:Error('not eligible for a new attempt')}],['lineage cap exception',{dispatchError:Error('LINEAGE_ATTEMPT_LIMIT')}],['unknown result',{dispatchResult:{status:'HOLD',reason:'unknown_provider_result_requires_reconciliation'}}]])test(`${name} stops after one operation and preserves outbox/config/accepted history`,async t=>{
  const f=fixture(t,options),outboxBytes=fs.readFileSync(f.files.outbox),configBytes=fs.readFileSync(f.configPath);
  const result=await f.run();assert.equal(result.exitCode,1);assert.equal(f.counts().dispatches,1);assert.equal(f.counts().emissions,0);
  assert.deepEqual(fs.readFileSync(f.files.outbox),outboxBytes);assert.deepEqual(fs.readFileSync(f.configPath),configBytes);
  assert.equal(fs.existsSync(path.join(f.runDir,'receipts')),false);assert.equal(fs.existsSync(f.files.done),false);
});
test('accepted lineage capacity returns NEEDS_CAUSE with --max-resets 0 and writes nothing',async t=>{
  const tasks=[1,2].map(n=>({task_id:'accepted-'+n,stage_id:'02.dossier_sections',lineage_id:'synthetic-runner:lineage:1',status:'accepted'}));
  const f=fixture(t,{state:{tasks,attempts:tasks.map(task=>({task_id:task.task_id,status:'accepted'})),reservations:[]}}),before=f.fingerprint();
  const result=await f.run();assert.match(Object.values(result.outcomes)[0],/^NEEDS_CAUSE/);assert.deepEqual(f.fingerprint(),before);assert.equal(f.counts().dispatches,0);assert.equal(f.counts().emissions,0);
});
for(const name of ['uncertain attempt','stale lineage','stale manifest','stale packet hash','malformed packet'])test(`${name} holds without moving or rewriting an outbox`,async t=>{
  const f=fixture(t,{state:{tasks:[],attempts:name==='uncertain attempt'?[{status:'unknown_provider_result'}]:[],reservations:[]}});
  if(name==='stale lineage')f.write(f.files.inbox,{...f.packet,candidate_lineage_id:'superseded'});
  if(name==='stale manifest')f.write(f.files.inbox,{...f.packet,input_manifest_sha256:'b'.repeat(64)});
  if(name==='stale packet hash')f.write(f.files.outbox,{...f.outbox,packet_sha256:'0'.repeat(64)});
  if(name==='malformed packet')fs.writeFileSync(f.files.inbox,'{');
  const before=f.fingerprint(),result=await f.run();assert.equal(result.exitCode,1);assert.deepEqual(f.fingerprint(),before);assert.equal(f.counts().dispatches,0);assert.equal(f.counts().emissions,0);
});
test('waiting for a current packet is idempotent and does not rewrite its hash',async t=>{
  const f=fixture(t);fs.unlinkSync(f.files.outbox);const before=f.fingerprint();
  assert.equal((await f.run()).exitCode,3);assert.equal((await f.run()).exitCode,3);assert.deepEqual(f.fingerprint(),before);assert.equal(f.counts().emissions,0);
});
test('unsettled accounting holds before a current accepted part can be reported done',async t=>{
  const f=fixture(t,{state:{tasks:[],attempts:[],reservations:[{state:'unknown_provider_result',reserved_microusd:1_000_000}]}});
  f.currentRefs.push({stage_id:'02.dossier_sections',kind:'02.dossier_sections',identity:{config:{section_ids:[section],dossier_parts:['C']},inputs:structuredClone(f.currentRefs)}});
  const before=f.fingerprint(),result=await f.run();assert.equal(result.exitCode,1);assert.match(Object.values(result.outcomes)[0],/active_or_uncertain_attempt/);assert.deepEqual(f.fingerprint(),before);assert.equal(f.counts().dispatches,0);
});
test('successful ingest archives exact outbox bytes under a short hash basename',async t=>{
  const f=fixture(t,{dispatchResult:{status:'accepted'}}),bytes=fs.readFileSync(f.files.outbox);
  assert.equal((await f.run()).exitCode,0);const saved=fs.readdirSync(f.files.done);assert.equal(saved.length,1);assert.match(saved[0],/^outbox-[a-f0-9]{24}\.accepted\.json$/);assert.deepEqual(fs.readFileSync(path.join(f.files.done,saved[0])),bytes);
});
test('compile capacity exceptions stop without an automatic reset, even with accepted history',async t=>{
  const f=fixture(t,{stageId:'16.compile',dispatchError:Error('LINEAGE_ATTEMPT_LIMIT')});const configBytes=fs.readFileSync(f.configPath);
  const result=await f.run();assert.match(Object.values(result.outcomes)[0],/^NEEDS_CAUSE 16.compile/);assert.equal(f.counts().compiles,1);assert.deepEqual(fs.readFileSync(f.configPath),configBytes);assert.equal(fs.existsSync(path.join(f.runDir,'receipts')),false);
});
test('dry compile performs no native compile, approval, packet, or pointer writes',async t=>{
  const f=fixture(t,{stageId:'16.compile'}),before=f.fingerprint();
  assert.equal((await f.run(['--dry'])).exitCode,0);assert.deepEqual(f.fingerprint(),before);assert.equal(f.counts().compiles,0);
});
test('invalid CLI invocation fails before touching the fixture tree',t=>{
  const f=fixture(t),before=f.fingerprint();
  const result=spawnSync(process.execPath,[path.join(ROOT,'tools/belt/run-utah.mjs'),'--run','runs/synthetic-runner','--author','muse','--section',section],{cwd:f.projectRoot,encoding:'utf8'});
  assert.equal(result.status,2);assert.match(result.stderr,/Explicit actual --executor-id/);assert.deepEqual(f.fingerprint(),before);
});
