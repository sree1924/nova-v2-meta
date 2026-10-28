import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {PROJECT_ROOT,loadRun,registerSource} from '../../tools/belt/controller.mjs';
import {reregisterSourceRun} from '../../tools/belt/reregister-source.mjs';
import {acceptedRuntimeRefs,readNativeSnapshot} from '../../tools/belt/dispatch.mjs';
import {compileDossier} from '../../tools/belt/compile.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';
import {acquireExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {sha256,writeImmutable,verifyRef} from '../../tools/belt/atomic-file.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const pin=file=>({path:file,sha256:sha256(fs.readFileSync(file)),bytes:fs.statSync(file).size});
function json(file,value){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(value,null,2)+'\n');return pin(file);}

// All documents and observations here are synthetic. No real issuer visit or model call is asserted.
function pdf(){
  const objects=[null,'<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [4 0 R 6 0 R] /Count 2 >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  for(let i=0;i<2;i++){
    const content=`BT /F1 12 Tf 40 730 Td (${i?'Synthetic chapter':'UTAH DRIVER HANDBOOK'}) Tj ET\nBT /F1 12 Tf 40 16 Td (${i+1}) Tj ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5+i*2} 0 R >>`,`<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`);
  }
  let body='%PDF-1.4\n';const offsets=[];
  for(let i=1;i<objects.length;i++){offsets.push(Buffer.byteLength(body));body+=`${i} 0 obj\n${objects[i]}\nendobj\n`;}
  const start=Buffer.byteLength(body);
  body+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`+offsets.map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(body);
}

function fixture(t){
  const tempRoot=path.join(PROJECT_ROOT,'tests/.tmp');fs.mkdirSync(tempRoot,{recursive:true});
  const root=fs.mkdtempSync(path.join(tempRoot,'nova-source-version-')),projectRoot=path.join(root,'project'),run='runs/source-version',runDir=path.join(projectRoot,run);
  t.after(()=>{const resolved=path.resolve(root);if(path.dirname(resolved)!==path.resolve(tempRoot)||!path.basename(resolved).startsWith('nova-source-version-'))throw Error('Unsafe test cleanup path');fs.rmSync(resolved,{recursive:true,force:true});});
  fs.mkdirSync(path.join(runDir,'sources/private'),{recursive:true});
  const bytes=pdf(),pdfPath=path.join(runDir,'sources/private/handbook.pdf');fs.writeFileSync(pdfPath,bytes);
  const config={run_id:'source-version',candidate_lineage_id:'source-version:lineage:1',scope:{jurisdiction:'US-UT',handbook_local_snapshot:run+'/sources/private/handbook.pdf',handbook_sha256:sha256(bytes),handbook_snapshot_bytes:bytes.length,handbook_url:'https://dld.utah.gov/synthetic-handbook.pdf',handbook_retrieved_at_utc:'2026-10-26T12:00:00Z',section_page_ranges:{'sec01-synthetic':[1]}},execution:{ledger:{path:'ledger/run.sqlite'}}};
  const runConfigPath=path.join(runDir,'run-config.json');json(runConfigPath,config);
  const script=path.join(projectRoot,'tools/roles/15-register.mjs');fs.mkdirSync(path.dirname(script),{recursive:true});fs.copyFileSync(path.join(PROJECT_ROOT,'tools/roles/15-register.mjs'),script);
  const contract=json(path.join(projectRoot,'contracts/role15-synthetic.json'),{synthetic:true});
  json(path.join(projectRoot,'contracts/bot-contract-bindings.json'),{roles:[{role_id:'15',contract:{...contract,status:'pinned_local'}}]});
  const overlayRef=json(path.join(projectRoot,'contracts/overlay.json'),{role_overrides:{'16':{implementation:'deterministic_merge_and_fact_index'},'17':{disposition:'n/a_pilot',reason:'Synthetic compiler fixture.'}}});
  let requests=0;const originalFetch=globalThis.fetch;globalThis.fetch=()=>{requests++;throw Error('Network is forbidden in source-version tests');};t.after(()=>{globalThis.fetch=originalFetch;assert.equal(requests,0);});
  const f={root,projectRoot,run,runDir,runConfigPath,config,overlayRef};issuer(f,'issuer-current-edition-confirmation.json','2026-10-26T12:10:00Z');return f;
}

function issuer(f,name,observed){
  const page=Buffer.from('SYNTHETIC local issuer snapshot links '+f.config.scope.handbook_url),pageFile=path.join(f.runDir,'receipts/issuer-page.txt');
  fs.mkdirSync(path.dirname(pageFile),{recursive:true});if(!fs.existsSync(pageFile))fs.writeFileSync(pageFile,page);
  return json(path.join(f.runDir,'receipts',name),{artifact_type:'IssuerCurrentEditionConfirmation',version:'0.4.0',run_id:f.config.run_id,page_url:'https://dld.utah.gov/learner-permit/',observed_at_utc:observed,observation_method:'SYNTHETIC test observation',links_exact_handbook_url:f.config.scope.handbook_url,handbook_snapshot_sha256:f.config.scope.handbook_sha256,page_sha256:sha256(page),page_bytes:page.length,snapshot_kind:'rendered_dom_excerpt',page_snapshot_ref:{path:f.run+'/receipts/issuer-page.txt',sha256:sha256(page)},effective_date_disposition:{value:null,status:'unknown_not_stated'},recorded_by:{actor:'synthetic-test-recorder',session_id:'synthetic-source-version-test'}});
}

async function withLedger(f,work){
  const loaded=loadRun(f),lockHandle=acquireExecutorLock({runDir:f.runDir,runId:f.config.run_id,executorId:'synthetic-source-version'});
  let ledger,fence;
  try{
    ledger=openLedger({dbPath:path.join(f.runDir,'ledger/run.sqlite'),lockHandle});const previous=ledger.getRun(f.config.run_id);
    fence=ledger.claimRun({runId:f.config.run_id,bindingSha256:previous?.binding_sha256??loaded.configRef.sha256,mode:previous?.mode??'dry_run',budget:previous?.budget_json??{}});
    return await work({projectRoot:f.projectRoot,loaded,ledger,fence,lockHandle});
  }finally{if(fence)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}
const initial=f=>withLedger(f,c=>registerSource(c));
const snapshot=f=>withLedger(f,({ledger})=>ledger.snapshot(f.config.run_id));
const refs=(f,s)=>acceptedRuntimeRefs(s,f.projectRoot,f.runDir);
function proof(f,prior,{issuerRef=null,changeConfig=true,name='source-v2',previousRef=prior}={}){
  if(changeConfig){f.config.scope.section_page_ranges['sec01-synthetic']=[1,2];json(f.runConfigPath,f.config);}
  const configRef=pin(f.runConfigPath),savedConfig=path.join(f.runDir,'sources/private/input-snapshots',configRef.sha256+'.json');
  if(!fs.existsSync(savedConfig))fs.writeFileSync(savedConfig,fs.readFileSync(f.runConfigPath));
  return json(path.join(f.runDir,'repair',name+'.json'),{artifact_type:'SourceRegistrationRevision',version:'1.0.0',run_id:f.config.run_id,previous_registry_ref:{path:previousRef.path,sha256:previousRef.sha256},config_ref:pin(savedConfig),...(issuerRef?{issuer_confirmation_ref:issuerRef}:{}),reason:'SYNTHETIC issuer timestamp and section seam correction.',reconciliation:{status:'required',affected_section_ids:['sec01-synthetic']}});
}
const revise=(f,revisionProofRef)=>reregisterSourceRun({projectRoot:f.projectRoot,run:f.run,executorId:'synthetic-source-version',revisionProofRef});

test('versioned timestamp and section-map revision preserves every accepted byte and leaves edition debt',async t=>{
  const f=fixture(t),first=await initial(f),before=await snapshot(f),old=refs(f,before).find(a=>a.kind==='source_registry');
  const oldRefs=[...before.artifacts.map(a=>pin(verifyRef(a,f.runDir))),...before.artifacts.filter(a=>a.status==='accepted').flatMap(a=>[pin(verifyRef(a.validation_ref_json,f.runDir)),pin(verifyRef(a.acceptance_ref_json,f.runDir))]),pin(first.receipt_ref.path)];
  const issuerRef=issuer(f,'issuer-v2.json','2026-10-28T08:00:00Z'),revision=proof(f,old,{issuerRef}),result=await revise(f,revision),after=await snapshot(f),selected=refs(f,after);
  assert.equal(result.reused,false);assert.equal(result.registration,'HOLD');assert.equal(result.factual_acceptance,false);assert.equal(result.model_calls,0);
  const source=selected.find(a=>a.kind==='source_registry'),registry=read(source.path),pageMap=selected.find(a=>a.kind==='page_map'),extraction=selected.find(a=>a.kind==='source_text_extraction'),liveness=read(selected.find(a=>a.kind==='source_liveness').path);
  assert.ok(source.path.replaceAll('\\','/').includes('/15/revisions/'+revision.sha256+'/'));
  assert.ok(selected.find(a=>a.kind==='source_text').path.replaceAll('\\','/').includes('/sources/private/15-revisions/'+revision.sha256+'/'));
  assert.equal(registry.source_revision.previous_registry_ref.sha256,old.sha256);assert.equal(registry.source_revision.reconciliation_required,true);
  assert.equal(registry.sources[0].issuer_current_edition_observation.observed_at_utc,'2026-10-28T08:00:00Z');
  assert.equal(registry.sources[0].issuer_current_edition_observation.receipt_ref.sha256,issuerRef.sha256);
  assert.deepEqual(read(path.resolve(f.projectRoot,registry.input_config.path)).scope.section_page_ranges['sec01-synthetic'],[1,2]);
  assert.equal(registry.sources[0].page_map_sha256,pageMap.sha256);assert.equal(read(extraction.path).page_map_sha256,pageMap.sha256);
  assert.equal(liveness.edition,null);assert.equal(liveness.status,'VERIFICATION_DEBT');assert.equal(liveness.effective_date,null);
  assert.equal(registry.sources[0].fact_authority_eligible,false);assert.ok(registry.verification_debt.some(d=>d.code==='edition_unconfirmed'));
  assert.equal(after.tasks.filter(a=>a.stage_id==='15.sources'&&a.status==='accepted').length,2);
  const native=readNativeSnapshot(f.runDir,f.config);
  for(const task of native.tasks.filter(t=>t.stage_id==='15.sources'))task.updated_at=task.accepted_artifact_id===before.tasks[0].accepted_artifact_id?'2999-01-01':'1900-01-01';
  native.tasks.reverse();
  assert.equal(refs(f,native).find(a=>a.kind==='source_registry').sha256,source.sha256,'source revision ancestry wins over task order and inverted acceptance times');
  const ajv=new Ajv2020({strict:false});addFormats(ajv);
  for(const [value,schema]of [[registry,path.join(PROJECT_ROOT,'../schemas/source_registry.schema.json')],[liveness,path.join(PROJECT_ROOT,'contracts/source-liveness-receipt.schema.json')]]){
    const validate=ajv.compile(read(schema));assert.equal(validate(value),true,JSON.stringify(validate.errors));
  }
  for(const ref of oldRefs)verifyRef(ref,f.runDir);
  const accepted=after.artifacts.find(a=>a.status==='accepted'&&a.sha256===source.sha256),acceptance=read(verifyRef(accepted.acceptance_ref_json,f.runDir));
  assert.equal(acceptance.factual_acceptance,false);assert.equal(acceptance.kind,'deterministic_source_registration_only');
  assert.equal(after.model_calls.length,0);assert.equal(after.reservations.length,0);
});

test('missing, tampered, mutable-config and no-change proofs fail before source task writes',async t=>{
  const f=fixture(t);await initial(f);const old=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry'),unchanged=proof(f,old,{changeConfig:false,name:'unchanged'});
  const before=(await snapshot(f)).tasks.length;
  await assert.rejects(revise(f,unchanged),/genuine source-scope/);
  await assert.rejects(revise(f,{...unchanged,sha256:'0'.repeat(64)}),/hash mismatch/);
  const bad=read(unchanged.path);bad.config_ref=pin(f.runConfigPath);const mutable=json(path.join(f.runDir,'repair/mutable.json'),bad);
  await assert.rejects(revise(f,mutable),/escapes owned root|separate immutable/);
  f.config.scope.section_page_ranges['sec01-synthetic']=[1,2];json(f.runConfigPath,f.config);
  await assert.rejects(revise(f,null),/explicit hash-bound revision proof/);
  assert.equal((await snapshot(f)).tasks.length,before);
});

test('same revision replays exactly, stale targets fail, and later revisions inherit selected issuer evidence',async t=>{
  const f=fixture(t);await initial(f);const old=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry'),issuerRef=issuer(f,'issuer-v2.json','2026-10-28T08:00:00Z'),revision=proof(f,old,{issuerRef});
  const first=await revise(f,revision),before=await snapshot(f),again=await revise(f,revision);
  assert.equal(again.reused,true);assert.equal(again.source_registry_ref.sha256,first.source_registry_ref.sha256);assert.equal((await snapshot(f)).tasks.length,before.tasks.length);
  const stale=proof(f,old,{changeConfig:false,name:'stale'});await assert.rejects(revise(f,stale),/stale registry/);
  const current=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry');f.config.scope.section_page_ranges['sec01-synthetic']=[2];f.config.candidate_lineage_id='source-version:lineage:2';json(f.runConfigPath,f.config);
  const next=proof(f,current,{changeConfig:false,name:'source-v3'}),third=await revise(f,next),registry=read(third.source_registry_ref.path);
  assert.equal(registry.sources[0].issuer_current_edition_observation.receipt_ref.sha256,issuerRef.sha256);
  assert.equal(registry.sources[0].issuer_current_edition_observation.observed_at_utc,'2026-10-28T08:00:00Z');
});

test('alternate issuer receipt still passes unchanged Role15 hash and exact-URL checks',async t=>{
  const f=fixture(t);await initial(f);const old=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry'),issuerRef=issuer(f,'issuer-v2.json','2026-10-28T08:00:00Z'),value=read(issuerRef.path);
  value.links_exact_handbook_url='https://dld.utah.gov/different.pdf';const invalid=json(issuerRef.path,value),revision=proof(f,old,{issuerRef:invalid});
  await assert.rejects(revise(f,revision),/Issuer confirmation does not bind/);
  assert.equal((await snapshot(f)).tasks.filter(a=>a.stage_id==='15.sources').length,1);
});

test('a new issuer receipt cannot excuse a changed historical issuer receipt',async t=>{
  const f=fixture(t);await initial(f);const old=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry'),issuerRef=issuer(f,'issuer-v2.json','2026-10-28T08:00:00Z'),revision=proof(f,old,{issuerRef});
  fs.appendFileSync(path.join(f.runDir,'receipts/issuer-current-edition-confirmation.json'),'\n');
  await assert.rejects(revise(f,revision),/hash mismatch/);
  assert.equal((await snapshot(f)).tasks.filter(a=>a.stage_id==='15.sources').length,1);
});

test('new source metadata never silently reconciles a previously accepted dossier',async t=>{
  const f=fixture(t);await initial(f);const old=refs(f,await snapshot(f)).find(a=>a.kind==='source_registry');
  await withLedger(f,({ledger,fence,lockHandle})=>{
    const task=ledger.ensureTask(fence,{lineageId:'synthetic-old-content',stageId:'02.dossier_sections',roleId:'02',inputs:[old],versions:{synthetic:'fixture'},config:{section_ids:['sec01-synthetic'],dossier_parts:['C']},maxAttempts:2}),attempt=ledger.startAttempt(fence,{taskId:task.task_id,commandId:'synthetic-old-content'});
    const artifact={...writeImmutable(f.runDir,'synthetic/old-envelope.json',{artifact:'SmeDossierEnvelope',stage_id:'02.dossier_sections',probe:'rdmv-ut-class-d',lineage:{source_registry_sha256:old.sha256,candidate_lineage_id:'synthetic-old-content'},sections:[],exam_facts:{},merge:{expected_merged_sha256:null}},{lockHandle}),kind:'02.dossier_sections'};
    const validation=writeImmutable(f.runDir,'synthetic/validation.json',{status:'PASS',output_sha256:artifact.sha256,checks:[{check_id:'synthetic.history',status:'PASS'}]},{lockHandle}),acceptance=writeImmutable(f.runDir,'synthetic/acceptance.json',{status:'PASS',output_sha256:artifact.sha256,scope:'synthetic historical fixture only'},{lockHandle});
    ledger.acceptArtifact(fence,{taskId:task.task_id,attemptId:attempt.attempt_id,artifact,validationReceipt:validation,acceptanceReceipt:acceptance});
  });
  const revision=proof(f,old);await revise(f,revision);const after=await snapshot(f),selected=refs(f,after);
  assert.equal(after.tasks.filter(a=>a.stage_id==='02.dossier_sections'&&a.status==='accepted').length,1);
  const compiled=compileDossier({projectRoot:f.projectRoot,runRoot:f.runDir,acceptedEnvelopes:selected.filter(a=>a.kind==='02.dossier_sections'),sourceRegistryRef:selected.find(a=>a.kind==='source_registry'),pageMapRef:selected.find(a=>a.kind==='page_map'),overlayRef:f.overlayRef});
  assert.equal(compiled.status,'HOLD');assert.ok(compiled.errors.some(e=>e.includes('Envelope source registry hash differs')));
  assert.equal(after.model_calls.length,0);assert.equal(after.reservations.length,0);
});
