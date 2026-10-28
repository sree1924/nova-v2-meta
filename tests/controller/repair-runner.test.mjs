import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {sha256,writeImmutable} from '../../tools/belt/atomic-file.mjs';
import {acquireExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';
import {runArtifactTask} from '../../tools/belt/artifact-task.mjs';
import {validateArtifact} from '../../tools/belt/post-validate.mjs';
import {inspectImplementationClosure} from '../../tools/inspect-implementation-closure.mjs';
import {mappedCompensatingChecks} from '../../tools/wrap-post-validation-receipt.mjs';
import {budgetFromConfig,readNativeSnapshot,acceptedRuntimeRefs,authoringPaths} from '../../tools/belt/dispatch.mjs';
import {compileAcceptedDossier} from '../../tools/belt/controller.mjs';
import {repairAcceptedPart} from '../../tools/belt/repair-accepted.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const SECTION='sec-synthetic-repair';
const NOW=new Date().toISOString();
const BEFORE=new Date(Date.now()-3_600_000).toISOString();
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const pin=file=>({path:file,sha256:sha256(fs.readFileSync(file))});
const clone=value=>structuredClone(value);

async function fixture(t,{oldCompile=true,part='C'}={}){
  // Use the real contracts/closure with a disposable synthetic run, so the test calls native prepare/dispatch/compile.
  const runId='synthetic-repair-test-'+crypto.randomUUID(),runDir=path.join(ROOT,'runs',runId),executorId='synthetic-repair-builder';
  fs.mkdirSync(runDir,{recursive:true});
  const previousKey=process.env.MODEL_API_KEY;process.env.MODEL_API_KEY='synthetic-file-transport-only';
  const previousFetch=globalThis.fetch;let networkCalls=0;
  globalThis.fetch=async()=>{networkCalls++;throw Error('A repair test must never call the Model API.');};
  t.after(()=>{
    globalThis.fetch=previousFetch;
    if(previousKey===undefined)delete process.env.MODEL_API_KEY;else process.env.MODEL_API_KEY=previousKey;
    const absolute=path.resolve(runDir),parent=path.resolve(ROOT,'runs');
    if(path.dirname(absolute)!==parent||!path.basename(absolute).startsWith('synthetic-repair-test-'))throw Error('Unsafe synthetic test cleanup.');
    fs.rmSync(absolute,{recursive:true,force:true});
  });
  const closure=inspectImplementationClosure({projectRoot:ROOT});
  const owner=writeImmutable(runDir,'receipts/synthetic-owner-closure.json',{implementation_closure:{files:closure.observed_files.map(({path,sha256})=>({path,sha256}))}});
  const config={run_id:runId,execution_enabled:true,candidate_lineage_id:runId+':lineage:1',
    scope:{jurisdiction:'US-SYN',jurisdiction_selected_by:'synthetic fixture',language:'en',handbook_edition:'SYNTHETIC',exam_facts:{},section_page_ranges:{[SECTION]:[1,2]}},
    producer:{provider:'meta',model:'muse-spark-1.3',key_env_name:'MODEL_API_KEY',billing_mode:'credits',pricing_ref:pin(path.join(ROOT,'contracts/meta-pricing-snapshot.v0.4.0.json'))},
    limits:{spend_mode:'live',max_total_usd:5,max_call_usd:1,per_provider_usd_caps:{meta:5},per_role_usd_caps:{'02':5,'16':0},max_completion_tokens:1000,max_request_bytes:640000,max_automatic_attempts_per_logical_task:2,run_deadline_utc:'2026-11-05T00:00:00Z'},
    execution:{ledger:{path:'ledger/run.sqlite'},adapter_validation_receipts_ref:owner,retry_nonces:{}}};
  const configRef=writeImmutable(runDir,'run-config.json',config),runConfigPath=configRef.path;
  const approvalRef=writeImmutable(runDir,'approvals/GO-02.dossier_sections-synthetic-repair.json',{
    schema_version:'nova-stage-approval.v0.4.0',run_id:runId,stage_id:'02.dossier_sections',section_ids:[SECTION],
    founder_words:'SYNTHETIC TEST FIXTURE ONLY: authorize file-transport repair submission.',recorded_by:{actor_id:executorId},recorded_at:BEFORE,usd_ceiling:1,content_calls_authorized:true});
  const lockHandle=acquireExecutorLock({runDir,runId,executorId});
  const ledger=openLedger({dbPath:path.join(runDir,'ledger/run.sqlite'),lockHandle});
  const fence=ledger.claimRun({runId,bindingSha256:configRef.sha256,mode:'execute',budget:budgetFromConfig(config)});
  const requiredChecks=mappedCompensatingChecks(read(path.join(ROOT,'schemas-strict/02-sme-dossier-envelope.mapping.json')),'02.dossier_sections').check_ids;
  const source=writeImmutable(runDir,'15-source-registry.json',{sources:[{source_ref:'SYN-HB'}]},{lockHandle});
  const pages=writeImmutable(runDir,'15-page-map.json',{source_ref:'SYN-HB',pages:[1,2].map(n=>({page_map_id:'syn-pm0'+n,page_id:'SYN-HB#p.'+n,source_ref:'SYN-HB',pdf_page:n,printed_page:String(n),source_document_sha256:'b'.repeat(64)}))},{lockHandle});
  const text=writeImmutable(runDir,'sources/private/synthetic-handbook.txt','=== PHYSICAL PDF PAGE 1; PRINTED 1 ===\nSynthetic issuer information.\n=== PHYSICAL PDF PAGE 2; PRINTED 2 ===\nA full stop is required at a red octagonal sign. A full stop must precede proceeding beyond the marked stop line.\n',{lockHandle,bytes:true});
  const sourceTask=ledger.ensureTask(fence,{lineageId:runId+':seed',stageId:'15.sources',roleId:'15',inputs:[configRef],versions:{synthetic:'source'},config:{operation:'synthetic_source_registration'},maxAttempts:2});
  const sourceAttempt=ledger.startAttempt(fence,{taskId:sourceTask.taskId,commandId:'synthetic-source'});
  const validation=writeImmutable(runDir,'receipts/synthetic-source-validation.json',{status:'PASS',output_sha256:source.sha256,checks:[{check_id:'15.OUTPUT_HASHES',status:'PASS'}],companions:[{...source,kind:'source_registry'},{...pages,kind:'page_map'},{...text,kind:'source_text'}]},{lockHandle});
  const acceptance=writeImmutable(runDir,'receipts/synthetic-source-acceptance.json',{status:'PASS',output_sha256:source.sha256},{lockHandle});
  ledger.acceptArtifact(fence,{taskId:sourceTask.taskId,attemptId:sourceAttempt.attemptId,artifact:source,validationReceipt:validation,acceptanceReceipt:acceptance});
  const whole=read(path.join(ROOT,'tools/belt/fixtures/02.dossier_sections/synthetic-positive.json'));delete whole._fixture;
  whole.lineage.source_registry_sha256=source.sha256;
  const original=clone(whole);
  original.envelope_scope={kind:'partial_chunk',assigned_section_ids:[part],chunk_index:1,chunk_total:1};
  original.sections=original.sections.filter(s=>s.section_id===part);original.sections[0].merge_seq=1;
  if(part==='C2'){original.high_yield_ranked=[];original.needs_dedicated_surface={status:'unknown',items:[]};}
  original.exam_facts=Object.fromEntries(Object.keys(original.exam_facts).map(k=>[k,{value:null,status:'unknown',source_page:null}]));
  original.verification_debt=[];original.g_matrix=[];original.market_signal={origin:'sme',origin_note:'Synthetic correction test; market research scoped out.',disposition:'scoped_out',chunk_ids:[],debt_refs:[]};
  original.merge.expected_merged_sha256=null;
  const siblings=clone(whole);siblings.sections=siblings.sections.filter(s=>s.section_id!==part);siblings.sections.forEach((s,i)=>s.merge_seq=i+1);
  siblings.envelope_scope={kind:'partial_chunk',assigned_section_ids:siblings.sections.map(s=>s.section_id),chunk_index:1,chunk_total:1};
  if(part==='C'){siblings.high_yield_ranked=[];siblings.needs_dedicated_surface={status:'unknown',items:[]};}siblings.merge.expected_merged_sha256=null;
  for(const [parts,value,other]of [[[part],original,[]],[siblings.envelope_scope.assigned_section_ids,siblings,[original]]]){
    const task=ledger.ensureTask(fence,{lineageId:runId+':seed',stageId:'02.dossier_sections',roleId:'02',inputs:[configRef,source,pages],versions:{synthetic:'accepted-baseline'},config:{section_ids:[SECTION],dossier_parts:parts},maxAttempts:2});
    const result=await runArtifactTask({ledger,fence,lockHandle,runDir,task,requiredChecks,produce:()=>value,
      validate:artifact=>validateArtifact({stage_id:'02.dossier_sections',artifact,context:{input_manifest_sha256:value.lineage.input_manifest_sha256,source_registry:read(source.path),sibling_envelopes:other}}),accept:()=>({status:'PASS',kind:'synthetic_baseline'})});
    assert.equal(result.status,'accepted',JSON.stringify(result));
  }
  ledger.releaseRun(fence);ledger.close();lockHandle.release();
  const initial=readNativeSnapshot(runDir,config);
  const old=acceptedRuntimeRefs(initial,ROOT,runDir,{sectionIds:[SECTION]}).find(r=>r.kind==='02.dossier_sections'&&JSON.parse(r.identity).config.dossier_parts.length===1);
  const evidence=writeImmutable(runDir,'receipts/correction-source-evidence.txt','SYNTHETIC source excerpt, physical page 2: A full stop must precede proceeding beyond the marked stop line.\n',{bytes:true});
  const proof={schema_version:'nova-accepted-part-replacement.v1',status:'PASS',kind:'source_supported_fact_correction',authority_scope:'submission_only_not_factual_acceptance',run_id:runId,stage_id:'02.dossier_sections',section_ids:[SECTION],part_ids:[part],
    supersedes:[{artifact_id:old.artifact_id,task_id:old.task_id,path:old.path,sha256:old.sha256}],source_evidence_refs:[{path:evidence.path,sha256:evidence.sha256}],reason:'Restore the source-supported before-proceeding qualifier.',recorded_by:{actor_id:executorId,session_id:'synthetic-session',provider_family:'synthetic'},recorded_at:BEFORE,content_calls_authorized:false};
  const replacementRef=writeImmutable(runDir,'receipts/accepted-C-replacement.json',proof);
  const options={projectRoot:ROOT,runConfigPath,executorId,author:'muse',sectionIds:[SECTION],partIds:[part],replacementRef,approvalRef,packetMode:'thin',nowUtc:NOW};
  const oldResult=oldCompile?await compileAcceptedDossier({projectRoot:ROOT,runConfigPath,executorId,sectionIds:[SECTION],approvalRef}):null;
  if(oldResult)assert.equal(oldResult.status,'PASS',JSON.stringify(oldResult));
  return{options,config,runDir,old,original,proof,replacementRef,oldResult,initial,networkCalls:()=>networkCalls};
}

function author(f,packet,change=()=>{}){
  const artifact=clone(f.original);
  if(f.options.partIds[0]==='C')artifact.sections[0].markdown=artifact.sections[0].markdown.replace('A full stop is required','A full stop before proceeding is required');
  else{artifact.sections[0].markdown+='Stop before proceeding beyond the marked stop line [P2].\n';artifact.sections[0].source_anchors.push({anchor_id:'P2',source_page:'SYN-HB#p.2'});}
  artifact.sections[0].char_count=[...artifact.sections[0].markdown].length;
  artifact.lineage.candidate_lineage_id=packet.candidate_lineage_id;artifact.lineage.input_manifest_sha256=packet.input_manifest_sha256;
  change(artifact);
  const files=authoringPaths(f.runDir,packet.key);
  fs.writeFileSync(files.outbox,JSON.stringify({key:packet.key,packet_sha256:sha256(fs.readFileSync(files.inbox)),authored_by:'muse-code/synthetic (subscription)',artifact},null,2)+'\n');
  return files;
}

test('repair emits a distinct packet, ingests through native file transport at $0, versions compile and reuses idempotently',async t=>{
  const f=await fixture(t),configBytes=fs.readFileSync(f.options.runConfigPath),oldBytes=fs.readFileSync(f.old.path);
  const first=await repairAcceptedPart(f.options);assert.equal(first.status,'WAITING',JSON.stringify(first));assert.match(first.key,/__r[0-9a-f]+$/);
  const packet=read(first.inbox),packetBytes=fs.readFileSync(first.inbox);
  const waiting=await repairAcceptedPart(f.options);assert.equal(waiting.status,'WAITING');assert.deepEqual(fs.readFileSync(first.inbox),packetBytes);
  author(f,packet);
  const result=await repairAcceptedPart(f.options);assert.equal(result.status,'PASS',JSON.stringify(result));assert.equal(result.actual_usd,0);assert.equal(result.compile.reused,undefined);
  const blueprint=read(result.compiled_ref.path);assert.ok(blueprint.sections.find(s=>s.section_id==='C').markdown.includes('full stop before proceeding'));
  assert.ok(blueprint.superseded_envelopes.some(r=>r.sha256===f.old.sha256));assert.ok(!blueprint.input_refs.some(r=>r.sha256===f.old.sha256));
  assert.ok(result.compiled_ref.path.includes(path.join('16',SECTION)));assert.notEqual(result.compiled_ref.sha256,f.oldResult.files.find(r=>r.path.endsWith('16-compiled-dossier.json')).sha256);
  assert.deepEqual(fs.readFileSync(f.old.path),oldBytes);assert.deepEqual(fs.readFileSync(f.options.runConfigPath),configBytes);
  const snapshot=readNativeSnapshot(f.runDir,f.config),reservations=snapshot.reservations;
  assert.equal(reservations.length,1);assert.ok(reservations.every(r=>r.state==='reported'&&r.actual_microusd===0));assert.equal(snapshot.model_calls.length,1);
  const raw=read(result.dispatch.raw_ref.path);assert.equal(raw.billing.model_api_called,false);assert.equal(raw.billing.credit_usd,0);
  const again=await repairAcceptedPart(f.options);assert.equal(again.status,'PASS',JSON.stringify(again));assert.equal(again.compile.reused,true);
  const after=readNativeSnapshot(f.runDir,f.config);assert.equal(after.attempts.length,snapshot.attempts.length);assert.equal(after.model_calls.length,1);assert.equal(f.networkCalls(),0);
});

test('repair requires Muse, a current exact proof and ordinary stage approval before emitting',async t=>{
  const f=await fixture(t,{oldCompile:false});
  await assert.rejects(repairAcceptedPart({...f.options,author:undefined}),/explicit --author muse/);
  const badHash=await repairAcceptedPart({...f.options,replacementRef:{...f.replacementRef,sha256:'0'.repeat(64)}});assert.equal(badHash.status,'HOLD');assert.equal(badHash.reason,'replacement_proof_invalid');
  await assert.rejects(repairAcceptedPart({...f.options,approvalRef:undefined}),/CONTENT_DISPATCH_BLOCKED/);
  const wrongProof=writeImmutable(f.runDir,'receipts/wrong-section-replacement.json',{...f.proof,section_ids:['other-section']});
  assert.equal((await repairAcceptedPart({...f.options,replacementRef:wrongProof})).status,'HOLD');
  assert.equal(readNativeSnapshot(f.runDir,f.config).model_calls.length,0);assert.equal(f.networkCalls(),0);
});

test('repair rejects packet, outbox hash, candidate scope and lineage mismatches before dispatch',async t=>{
  const f=await fixture(t,{oldCompile:false}),first=await repairAcceptedPart(f.options),packet=read(first.inbox),bytes=fs.readFileSync(first.inbox);
  const badPacket={...packet,candidate_lineage_id:'foreign-lineage'};fs.writeFileSync(first.inbox,JSON.stringify(badPacket));
  assert.equal((await repairAcceptedPart(f.options)).reason,'packet_lineage_mismatch');fs.writeFileSync(first.inbox,bytes);
  const files=author(f,packet,a=>{a.lineage.candidate_lineage_id='foreign-lineage';});
  assert.equal((await repairAcceptedPart(f.options)).reason,'outbox_lineage_mismatch');
  author(f,packet,a=>{a.envelope_scope.assigned_section_ids=['C2'];});assert.equal((await repairAcceptedPart(f.options)).reason,'outbox_candidate_scope_mismatch');
  author(f,packet);const outbox=read(files.outbox);outbox.packet_sha256='0'.repeat(64);fs.writeFileSync(files.outbox,JSON.stringify(outbox));
  assert.equal((await repairAcceptedPart(f.options)).reason,'outbox_packet_sha256_mismatch');
  assert.equal(readNativeSnapshot(f.runDir,f.config).model_calls.length,0);assert.equal(f.networkCalls(),0);
});

test('truncated corrected content still fails the mapped native validator and cannot recompile',async t=>{
  const f=await fixture(t),first=await repairAcceptedPart(f.options),packet=read(first.inbox);
  author(f,packet,a=>{a.sections[0].markdown+='**unfinished';a.sections[0].char_count=[...a.sections[0].markdown].length;});
  const result=await repairAcceptedPart(f.options);assert.equal(result.status,'HOLD',JSON.stringify(result));assert.equal(result.reason,'native_dispatch_not_accepted');
  const validation=read(result.dispatch.validation.path);assert.ok(validation.checks.some(c=>c.check_id==='02.TRUNCATION_GUARD'&&c.status==='FAIL'));
  const snapshot=readNativeSnapshot(f.runDir,f.config);assert.equal(snapshot.tasks.filter(t=>t.stage_id==='16.compile').length,1);
  assert.equal(snapshot.tasks.filter(task=>task.stage_id==='02.dossier_sections'&&task.status==='accepted').length,2);
  assert.ok(snapshot.reservations.every(r=>r.state==='reported'&&r.actual_microusd===0));assert.equal(f.networkCalls(),0);
});

test('C2 repair uses the same native path and preserves the C acceptance',async t=>{
  const f=await fixture(t,{part:'C2'}),first=await repairAcceptedPart(f.options);assert.equal(first.status,'WAITING',JSON.stringify(first));
  author(f,read(first.inbox));const result=await repairAcceptedPart(f.options);assert.equal(result.status,'PASS',JSON.stringify(result));
  const compiled=read(result.compiled_ref.path);assert.ok(compiled.sections.find(s=>s.section_id==='C2').markdown.includes('Stop before proceeding'));
  assert.equal(compiled.sections.filter(s=>s.section_id==='C').length,1);assert.equal(result.actual_usd,0);assert.equal(f.networkCalls(),0);
});

test('an exhausted native lineage stays HOLD without resetting lineage or raising caps',async t=>{
  const f=await fixture(t,{oldCompile:false});
  f.config.candidate_lineage_id=f.config.run_id+':seed';fs.writeFileSync(f.options.runConfigPath,JSON.stringify(f.config,null,2)+'\n');
  const configBytes=fs.readFileSync(f.options.runConfigPath),first=await repairAcceptedPart(f.options);assert.equal(first.status,'WAITING',JSON.stringify(first));
  author(f,read(first.inbox));const result=await repairAcceptedPart(f.options);assert.equal(result.status,'HOLD');assert.equal(result.reason,'native_dispatch_error');assert.match(result.message,/LINEAGE_ATTEMPT_LIMIT/);
  assert.deepEqual(fs.readFileSync(f.options.runConfigPath),configBytes);const snapshot=readNativeSnapshot(f.runDir,f.config);
  assert.equal(snapshot.reservations.length,0);assert.equal(snapshot.model_calls.length,0);assert.equal(f.networkCalls(),0);
});

test('accepted downstream work requires reconciliation before repair can write or dispatch',async t=>{
  const f=await fixture(t,{oldCompile:false}),{runDir,config}=f,executorId=f.options.executorId;
  const lockHandle=acquireExecutorLock({runDir,runId:config.run_id,executorId}),ledger=openLedger({dbPath:path.join(runDir,'ledger/run.sqlite'),lockHandle});
  const fence=ledger.claimRun({runId:config.run_id,bindingSha256:pin(f.options.runConfigPath).sha256,mode:'execute',budget:budgetFromConfig(config)});
  try{
    const task=ledger.ensureTask(fence,{lineageId:config.candidate_lineage_id,stageId:'03.combined_kg',roleId:'03',inputs:[pin(f.old.path)],versions:{synthetic:'downstream_guard_fixture'},config:{section_ids:[SECTION]},maxAttempts:2});
    // Seed native accepted history; this test exercises the repair guard, not stage03 authoring.
    const attempt=ledger.startAttempt(fence,{taskId:task.taskId,commandId:'synthetic-accepted-downstream'});
    const artifact=writeImmutable(runDir,'synthetic-downstream/03.json',{synthetic:'accepted downstream guard evidence'},{lockHandle});
    const validation=writeImmutable(runDir,'synthetic-downstream/03-validation.json',{status:'PASS',output_sha256:artifact.sha256,checks:[{check_id:'03.SCHEMA',status:'PASS'}]},{lockHandle});
    const acceptance=writeImmutable(runDir,'synthetic-downstream/03-acceptance.json',{status:'PASS',output_sha256:artifact.sha256,kind:'synthetic_test_seed'},{lockHandle});
    ledger.acceptArtifact(fence,{taskId:task.taskId,attemptId:attempt.attemptId,artifact,validationReceipt:validation,acceptanceReceipt:acceptance});
  }finally{ledger.releaseRun(fence);ledger.close();lockHandle.release();}
  const fingerprint=()=>{
    const files=[];
    const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else files.push([path.relative(runDir,file),sha256(fs.readFileSync(file))]);}};
    walk(runDir);return files.sort(([a],[b])=>a.localeCompare(b));
  };
  const before=readNativeSnapshot(runDir,config),beforeFiles=fingerprint();
  const result=await repairAcceptedPart(f.options);assert.equal(result.status,'HOLD');assert.equal(result.reason,'DOWNSTREAM_RECONCILIATION_REQUIRED');
  assert.deepEqual(result.downstream_tasks.map(task=>task.stage_id),['03.combined_kg']);
  assert.deepEqual(readNativeSnapshot(runDir,config),before);assert.deepEqual(fingerprint(),beforeFiles);
  assert.equal(before.model_calls.length,0);assert.equal(f.networkCalls(),0);
});
