import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inspectSourceGroup,groupBookkeeping,validateSourceGroupCandidate,resolveDossierSupersession} from '../../tools/belt/source-groups.mjs';
import {compileDossier} from '../../tools/belt/compile.mjs';
import {SECTION_IDS,run as runChecks} from '../../tools/belt/checks/02-dossier-sections.mjs';
import {sha256,jsonBytes,canonicalJson} from '../../tools/belt/atomic-file.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const FIXTURE=JSON.parse(fs.readFileSync(path.join(ROOT,'tools/belt/fixtures/02.dossier_sections/synthetic-positive.json'),'utf8'));
const BASE=path.resolve(process.env.NOVA_PRIVATE_TEST_ROOT??os.tmpdir());
fs.mkdirSync(BASE,{recursive:true});
const STAGE='02.dossier_sections',RUN='synthetic-unpartitioned',SECTION='sec-synthetic',NOW='2026-10-29T00:00:00Z';
const ref=({path,sha256})=>({path,sha256}),target=({path,sha256,task_id,artifact_id})=>({path,sha256,task_id,artifact_id});
const clone=structuredClone;
function fixture(t,{parts=[],mutateBody=()=>{},mutateIdentity=()=>{},proofChange={}}={}){
 const projectRoot=fs.mkdtempSync(path.join(BASE,'nova-unpartitioned-')),runDir=path.join(projectRoot,'runs',RUN);fs.mkdirSync(runDir,{recursive:true});
 t.after(()=>{const owned=fs.realpathSync(projectRoot),base=fs.realpathSync(BASE);assert.equal(path.dirname(owned),base);assert.ok(path.basename(owned).startsWith('nova-unpartitioned-'));fs.rmSync(owned,{recursive:true,force:true});});
 const save=(relative,value,{raw=false}={})=>{const bytes=raw?Buffer.from(value):jsonBytes(value),p=path.join(projectRoot,relative);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,bytes);return {path:relative,sha256:sha256(bytes),accepted:true};};
 const local=(name,value,options)=>save('runs/'+RUN+'/'+name,value,options);
 const pageMapRef={...local('map.json',{source_ref:'SYN-HB',source_document_ref:{path:'synthetic.pdf',sha256:'b'.repeat(64)},pages:[1,2].map(n=>({page_map_id:'syn-pm0'+n,page_id:'SYN-HB#p.'+n,source_ref:'SYN-HB',pdf_page:n,printed_page:String(n),source_document_sha256:'b'.repeat(64)}))}),kind:'page_map'};
 const sourceRegistryRef={...local('source.json',{sources:[{source_ref:'SYN-HB',snapshot_hash:'b'.repeat(64),page_map_sha256:pageMapRef.sha256}]}),kind:'source_registry'};
 const sourceTextRef={...local('source.txt','SYNTHETIC: A full stop is required at a red octagonal sign. A driver must stop fully at a red octagonal sign.',{raw:true}),kind:'source_text'};
 const config={run_id:RUN,scope:{section_page_ranges:{[SECTION]:[1,2]}},synthetic_only:true};local('run-config.json',config);
 const configRef=local('sources/private/config-snapshot.json',config);
 const evidence=local('receipts/evidence.json',{synthetic:true,fact_id:'F1',finding:'Source-faithful original paraphrase; same fact ID, citations and debt.'});
 const old=clone(FIXTURE);delete old._fixture;old.lineage.source_registry_sha256=sourceRegistryRef.sha256;old.merge.expected_merged_sha256=null;
 old.corpus_stability={assessment:'unknown',blocked_probe:false,reason:'Synthetic source revision frequency is not known.'};
 old.verification_debt.push({claim_id:'SYN-STABILITY',claim_text:'Synthetic revision frequency remains unknown.',blocker_kind:'source_missing',source_tier_required:'official',owner_worker:'EvidenceLibrarian',ship_blocking:false,expires_by:null,resolution_artifact_ref:null,located_at:{section_id:'A',chunk_id:old.sections.find(s=>s.section_id==='A').chunk_id},withheld_values:[]});
 mutateBody(old);
 const identity={run_id:RUN,stage_id:STAGE,role_id:'02',lineage_id:'old-lineage',config:{section_ids:[SECTION],dossier_parts:parts},inputs:[sourceRegistryRef,pageMapRef,sourceTextRef].map(x=>({...ref(x),kind:x.kind}))};mutateIdentity(identity);
 function accepted(name,value,nativeIdentity){
  const artifact=local(name+'.json',value),validation=local('receipts/'+name+'-validation.json',{status:'PASS',output_sha256:artifact.sha256}),acceptance=local('receipts/'+name+'-acceptance.json',{status:'PASS',output_sha256:artifact.sha256});
  return {...artifact,artifact_id:'artifact-'+name,task_id:'task-'+name,kind:STAGE,stage_id:STAGE,identity:JSON.stringify(nativeIdentity),accepted_at:name==='old'?'2026-10-28T00:00:00Z':'2026-10-28T01:00:00Z',validation_ref:validation,acceptance_ref:acceptance};
 }
 const oldRef=accepted('old',old,identity),proof={schema_version:'nova-section-source-reconciliation.v1',status:'PASS',kind:'source_supported_fact_correction',authority_scope:'submission_only_not_factual_acceptance',run_id:RUN,stage_id:STAGE,section_ids:[SECTION],part_ids:[...SECTION_IDS],supersedes:[target(oldRef)],previous_registry_ref:ref(sourceRegistryRef),source_registry_ref:ref(sourceRegistryRef),previous_page_map_ref:ref(pageMapRef),page_map_ref:ref(pageMapRef),previous_source_text_ref:ref(sourceTextRef),source_text_ref:ref(sourceTextRef),config_ref:ref(configRef),source_evidence_refs:[ref(evidence)],metadata_dependencies:[],g_box_debt_links:{},corrected_parts:['C'],reason:'Synthetic original wording correction without source/debt/meaning change.',recorded_by:{actor_id:'synthetic-test',session_id:'synthetic-session',provider_family:'engineering_test'},recorded_at:'2026-10-28T23:00:00Z',content_calls_authorized:false,...proofChange};
 const replacementRef=local('receipts/replacement.json',proof),acceptedArtifacts=[sourceRegistryRef,pageMapRef,sourceTextRef,oldRef];
 const inspect=(changes={})=>inspectSourceGroup({projectRoot,runDir,runId:RUN,stageId:STAGE,sectionIds:[SECTION],partIds:[...SECTION_IDS],acceptedArtifacts,replacementRef,nowUtc:NOW,...changes});
 const compose=()=>{
  const inspection=inspect();assert.equal(inspection.status,'PASS',inspection.blockers?.join(';'));
  const candidate=clone(old),c=candidate.sections.find(x=>x.section_id==='C');c.markdown=c.markdown.replace('A full stop is required at a red octagonal sign','A driver must stop fully at a red octagonal sign');c.char_count=[...c.markdown].length;candidate.lineage.candidate_lineage_id='new-lineage';candidate.merge.expected_merged_sha256=null;
  const book=groupBookkeeping(inspection,candidate);for(const part of ['F','G']){const index=candidate.sections.findIndex(s=>s.section_id===part);candidate.sections[index]={...book[part],merge_seq:index+1,char_count:[...book[part].markdown].length};}candidate.verification_debt=book.verification_debt;candidate.g_matrix=book.g_matrix;
  return {candidate,inspection};
 };
 const overlayRef=save('contracts/overlay.json',{role_overrides:{'16':{implementation:'deterministic_merge_and_fact_index'},'17':{disposition:'n/a_pilot',reason:'Synthetic source-group test only.'}}});
 const compile=refs=>compileDossier({projectRoot,runRoot:runDir,acceptedEnvelopes:refs,sourceRegistryRef,pageMapRef,overlayRef});
 return {projectRoot,runDir,save,local,old,oldRef,identity,proof,replacementRef,acceptedArtifacts,sourceRegistryRef,pageMapRef,sourceTextRef,accepted,inspect,compose,compile};
}

test('unpartitioned complete target is recognized without modifying its native identity or bytes',t=>{
 const f=fixture(t),before=fs.readFileSync(path.join(f.projectRoot,f.oldRef.path)),identity=f.oldRef.identity;
 const inspected=f.inspect();assert.equal(inspected.status,'PASS',inspected.blockers.join(';'));assert.equal(inspected.target.artifact_id,f.oldRef.artifact_id);
 assert.deepEqual(JSON.parse(inspected.target.identity).config.dossier_parts,[]);assert.equal(inspected.target.identity,identity);assert.deepEqual(fs.readFileSync(path.join(f.projectRoot,f.oldRef.path)),before);
});

test('existing explicit-nine target retains the same correction semantics',t=>{
 const f=fixture(t,{parts:[...SECTION_IDS]}),{candidate,inspection}=f.compose();assert.equal(validateSourceGroupCandidate({artifact:candidate,inspection}).status,'PASS');
 assert.deepEqual(candidate.high_yield_ranked,f.old.high_yield_ranked);assert.deepEqual(candidate.sections.find(x=>x.section_id==='C').fact_ids,['F1']);
});

test('complete replacement preserves A stability debt, source/exam/corpus and unchanged chunks',t=>{
 const f=fixture(t),{candidate,inspection}=f.compose(),checked=validateSourceGroupCandidate({artifact:candidate,inspection});assert.equal(checked.status,'PASS',checked.reason);
 assert.deepEqual(candidate.verification_debt,f.old.verification_debt);assert.deepEqual(candidate.exam_facts,f.old.exam_facts);assert.deepEqual(candidate.corpus_stability,f.old.corpus_stability);
 for(const part of ['A','B','C2','D','E','E2'])assert.deepEqual(candidate.sections.find(s=>s.section_id===part),f.old.sections.find(s=>s.section_id===part));
 const checks=runChecks(candidate,{});for(const id of ['02.CORPUS_STABILITY','02.DEBT_TYPED'])assert.equal(checks.find(c=>c.check_id===id)?.status,'PASS',id);
 for(const mutate of [a=>{a.verification_debt=[];},a=>{a.sections.find(s=>s.section_id==='D').markdown+='Silent change.';},a=>{a.corpus_stability.assessment='stable_le_1_per_year';},a=>{a.exam_facts.n_questions.value=99;}]){const broken=clone(candidate);mutate(broken);assert.equal(validateSourceGroupCandidate({artifact:broken,inspection}).status,'FAIL');}
});

test('native supersession removes the old whole envelope before compilation, without duplicate facts',t=>{
 const f=fixture(t),beforeIdentity=f.oldRef.identity,{candidate,inspection}=f.compose();assert.equal(validateSourceGroupCandidate({artifact:candidate,inspection}).status,'PASS');
 const newIdentity={...clone(f.identity),lineage_id:'new-lineage',config:{section_ids:[SECTION],dossier_parts:[...SECTION_IDS],replacement_ref:ref(f.replacementRef)}};
 const replacement=f.accepted('replacement',candidate,newIdentity),resolved=resolveDossierSupersession({projectRoot:f.projectRoot,runDir:f.runDir,runId:RUN,acceptedArtifacts:[...f.acceptedArtifacts,replacement]});
 assert.equal(resolved.unexcluded.length,1);assert.equal(resolved.unexcluded[0].artifact_id,replacement.artifact_id);assert.equal(f.oldRef.identity,beforeIdentity);
 const result=f.compile([f.oldRef,replacement]);assert.equal(result.status,'PASS',result.errors.join(';'));assert.deepEqual(Object.keys(result.factRegistry.facts),['F1']);assert.match(result.factRegistry.facts.F1.statement,/driver must stop fully/);
 assert.equal(result.blueprint.sections.filter(s=>s.section_id==='C').length,1);assert.ok(result.blueprint.superseded_envelopes.some(r=>r.task_id===f.oldRef.task_id));assert.ok(!result.blueprint.input_refs.some(r=>r.sha256===f.oldRef.sha256));
 const again=f.inspect({acceptedArtifacts:[...f.acceptedArtifacts,replacement]});assert.equal(again.status,'PASS',again.blockers.join(';'));assert.equal(again.acceptedReplacement.artifact_id,replacement.artifact_id);
});

test('ordinary unproved whole-envelope remint still produces a HOLD rather than hiding duplicates',t=>{
 const f=fixture(t),other=clone(f.old);other.sections.find(x=>x.section_id==='C').markdown+=' Another F1 line.';
 const duplicate=f.accepted('unproved',other,{...clone(f.identity),lineage_id:'another-lineage'}),result=f.compile([f.oldRef,duplicate]);assert.equal(result.status,'HOLD');assert.match(result.errors.join(';'),/duplicate|Duplicate|merge_seq/);
});

test('an unrelated accepted section remains active and byte-identical',t=>{
 const f=fixture(t),{candidate}=f.compose(),unrelated=f.accepted('unrelated',f.old,{...clone(f.identity),config:{section_ids:['other-section'],dossier_parts:[]}}),before=fs.readFileSync(path.join(f.projectRoot,unrelated.path));
 const replacement=f.accepted('replacement',candidate,{...clone(f.identity),config:{section_ids:[SECTION],dossier_parts:[...SECTION_IDS],replacement_ref:ref(f.replacementRef)}});
 const resolved=resolveDossierSupersession({projectRoot:f.projectRoot,runDir:f.runDir,runId:RUN,acceptedArtifacts:[...f.acceptedArtifacts,unrelated,replacement]});assert.ok(resolved.unexcluded.some(x=>x.artifact_id===unrelated.artifact_id));assert.deepEqual(fs.readFileSync(path.join(f.projectRoot,unrelated.path)),before);
});

test('malformed, partial, forged or mismatched unpartitioned targets remain held',async t=>{
 const cases=[
  ['missing native parts',{mutateIdentity:i=>{delete i.config.dossier_parts;}}],['null native parts',{parts:null}],['partial native parts',{parts:['C']}],
  ['wrong native run',{mutateIdentity:i=>{i.run_id='foreign-run';}}],['wrong native role',{mutateIdentity:i=>{i.role_id='03';}}],['wrong native stage',{mutateIdentity:i=>{i.stage_id='03.combined_kg';}}],['foreign native section',{mutateIdentity:i=>{i.config.section_ids=['foreign-section'];}}],
  ['partial envelope',{mutateBody:b=>{b.envelope_scope.kind='partial_chunk';}}],['not stage02 body',{mutateBody:b=>{b.stage_id='03.combined_kg';}}],['not dossier body',{mutateBody:b=>{b.artifact='OtherArtifact';}}],['multi-chunk declaration',{mutateBody:b=>{b.envelope_scope.chunk_total=2;}}],
  ['missing assigned part',{mutateBody:b=>{b.envelope_scope.assigned_section_ids.pop();}}],['duplicate assigned part',{mutateBody:b=>{b.envelope_scope.assigned_section_ids[8]='C';}}],
  ['missing body part',{mutateBody:b=>{b.sections.pop();}}],['duplicate body part',{mutateBody:b=>{b.sections[8].section_id='C';}}],['foreign body part',{mutateBody:b=>{b.sections[8].section_id='FOREIGN';}}],['extra body part',{mutateBody:b=>{b.sections.push(clone(b.sections[0]));}}],['duplicate chunk id',{mutateBody:b=>{b.sections[8].chunk_id=b.sections[0].chunk_id;}}],['invalid merge sequence',{mutateBody:b=>{b.sections[8].merge_seq=1;}}],['foreign source hash',{mutateBody:b=>{b.lineage.source_registry_sha256='f'.repeat(64);}}],
  ['no implicit metadata-reconciliation expansion',{proofChange:{kind:'dependent_metadata_reconciliation',corrected_parts:[]}}]
 ];
 for(const[name,options]of cases)await t.test(name,tt=>{const f=fixture(tt,options),r=f.inspect();assert.equal(r.status,'HOLD',name);});
});

test('native receipt/hash integrity and explicit replacement request scope remain mandatory',async t=>{
 await t.test('target not accepted',tt=>{const f=fixture(tt);f.oldRef.accepted=false;assert.equal(f.inspect().status,'HOLD');});
 await t.test('target receipt output mismatch',tt=>{const f=fixture(tt);f.oldRef.validation_ref=f.local('receipts/bad-validation.json',{status:'PASS',output_sha256:'f'.repeat(64)});assert.equal(f.inspect().status,'HOLD');});
 await t.test('target bytes drift',tt=>{const f=fixture(tt);fs.appendFileSync(path.join(f.projectRoot,f.oldRef.path),' ');assert.equal(f.inspect().status,'HOLD');});
 await t.test('unpartitioned replacement request still refused',tt=>{const f=fixture(tt);assert.equal(f.inspect({partIds:[]}).status,'HOLD');});
 await t.test('future accepted replacement must explicitly scope all9',tt=>{const f=fixture(tt),{candidate}=f.compose(),bad=f.accepted('bad-replacement',candidate,{...clone(f.identity),config:{section_ids:[SECTION],dossier_parts:[],replacement_ref:ref(f.replacementRef)}});assert.throws(()=>resolveDossierSupersession({projectRoot:f.projectRoot,runDir:f.runDir,runId:RUN,acceptedArtifacts:[...f.acceptedArtifacts,bad]}),/accepted_group_scope/);});
});

// Regression cases for accepted complete A..G coverage spread over >9 chunks.
function addDistinctChunk(body,part='C2'){
 const index=body.sections.findIndex(s=>s.section_id===part),old=body.sections[index],extra=clone(old);
 extra.chunk_id=old.chunk_id+'.continued';extra.markdown='## '+part+' — Synthetic continuation\nAdditional synthetic provenance notes; no new learner fact is asserted.\n';extra.char_count=[...extra.markdown].length;extra.fact_ids=[];extra.source_anchors=[];
 body.sections.splice(index+1,0,extra);body.sections.forEach((s,i)=>s.merge_seq=i+1);return extra;
}
test('multi-chunk complete target retains all9 logical parts and original native identity',t=>{
 const f=fixture(t,{mutateBody:b=>addDistinctChunk(b)}),before=fs.readFileSync(path.join(f.projectRoot,f.oldRef.path)),identity=f.oldRef.identity,r=f.inspect();assert.equal(r.status,'PASS',r.blockers.join(';'));assert.equal(f.old.sections.length,10);assert.deepEqual(JSON.parse(r.target.identity).config.dossier_parts,[]);assert.equal(r.target.identity,identity);assert.deepEqual(fs.readFileSync(path.join(f.projectRoot,f.oldRef.path)),before);
});
test('several legitimate C and C2 chunks retain complete contiguous logical coverage',t=>{
 const f=fixture(t,{mutateBody:b=>{addDistinctChunk(b,'C');addDistinctChunk(b,'C2');}}),r=f.inspect();assert.equal(f.old.sections.length,11);assert.equal(r.status,'PASS',r.blockers.join(';'));const checks=runChecks(f.old,{});assert.equal(checks.find(x=>x.check_id==='02.CHUNK_IDENTITY').status,'PASS');
});
test('multi-chunk correction preserves every unchanged C2 chunk, source and accepted debt',t=>{
 const f=fixture(t,{mutateBody:b=>addDistinctChunk(b)}),{candidate,inspection}=f.compose(),r=validateSourceGroupCandidate({artifact:candidate,inspection});assert.equal(r.status,'PASS',r.reason);assert.deepEqual(candidate.sections.filter(s=>s.section_id==='C2'),f.old.sections.filter(s=>s.section_id==='C2'));assert.deepEqual(candidate.verification_debt,f.old.verification_debt);assert.deepEqual(candidate.corpus_stability,f.old.corpus_stability);assert.deepEqual(candidate.exam_facts,f.old.exam_facts);
});
test('multi-chunk native supersession excludes old whole input before compile without duplicate facts',t=>{
 const f=fixture(t,{mutateBody:b=>addDistinctChunk(b)}),{candidate,inspection}=f.compose();assert.equal(validateSourceGroupCandidate({artifact:candidate,inspection}).status,'PASS');const replacement=f.accepted('replacement',candidate,{...clone(f.identity),config:{section_ids:[SECTION],dossier_parts:[...SECTION_IDS],replacement_ref:ref(f.replacementRef)}}),all=[...f.acceptedArtifacts,replacement],resolved=resolveDossierSupersession({projectRoot:f.projectRoot,runDir:f.runDir,runId:RUN,acceptedArtifacts:all});assert.equal(resolved.unexcluded.length,1);assert.equal(resolved.unexcluded[0].artifact_id,replacement.artifact_id);const compiled=f.compile([f.oldRef,replacement]);assert.equal(compiled.status,'PASS',compiled.errors.join(';'));assert.deepEqual(Object.keys(compiled.factRegistry.facts),['F1']);assert.equal(compiled.blueprint.sections.filter(s=>s.section_id==='C2').length,2);assert(!compiled.blueprint.input_refs.some(r=>r.sha256===f.oldRef.sha256));assert(compiled.blueprint.superseded_envelopes.some(r=>r.task_id===f.oldRef.task_id));
});
test('multi-chunk targets still reject missing, duplicated, reordered or foreign chunk coverage',async t=>{
 const cases=[
 ['missing part',b=>{b.sections=b.sections.filter(s=>s.section_id!=='E2');b.sections.forEach((s,i)=>s.merge_seq=i+1);}],
 ['duplicate chunk id',b=>{b.sections[4].chunk_id=b.sections[3].chunk_id;}],
 ['duplicate payload under a new chunk id',b=>{const index=b.sections.findIndex(s=>s.section_id==='C2'),copy=clone(b.sections[index]);copy.chunk_id+='-duplicate';b.sections.splice(index+1,0,copy);b.sections.forEach((s,i)=>s.merge_seq=i+1);}],
 ['noncontiguous part order',b=>{const index=b.sections.findIndex(s=>s.section_id==='D');[b.sections[index].merge_seq,b.sections[index-1].merge_seq]=[b.sections[index-1].merge_seq,b.sections[index].merge_seq];}],
 ['foreign part',b=>{b.sections[4].section_id='FOREIGN';}],
 ['invalid merge sequence',b=>{b.sections[4].merge_seq=3;}],
 ['foreign source hash',b=>{b.lineage.source_registry_sha256='e'.repeat(64);}],
 ['partial declared envelope',b=>{b.envelope_scope.kind='partial_chunk';}]
 ];for(const [name,mutate]of cases)await t.test(name,tt=>{const f=fixture(tt,{mutateBody:b=>{addDistinctChunk(b);mutate(b);}});assert.equal(f.inspect().status,'HOLD',name);});
});
test('multi-chunk targets still require genuine accepted receipt output and request scope',async t=>{
 await t.test('receipt hash mismatch',tt=>{const f=fixture(tt,{mutateBody:b=>addDistinctChunk(b)});f.oldRef.acceptance_ref=f.local('receipts/wrong-output.json',{status:'PASS',output_sha256:'f'.repeat(64)});assert.equal(f.inspect().status,'HOLD');});
 await t.test('unpartitioned replacement request',tt=>{const f=fixture(tt,{mutateBody:b=>addDistinctChunk(b)});assert.equal(f.inspect({partIds:[]}).status,'HOLD');});
});
test('actual accepted MS10chunk target and exact source-bound proof inspect without changing any run bytes',async t=>{
 const realRoot=process.env.NOVA_ACTUAL_ROOT;if(!realRoot){t.skip('Actual project root supplied only by the private regression runner');return;}const {pathToFileURL}=await import('node:url'),{loadRun}=await import(pathToFileURL(path.join(realRoot,'tools/belt/controller.mjs'))),{readNativeSnapshot,acceptedRuntimeRefs}=await import(pathToFileURL(path.join(realRoot,'tools/belt/dispatch.mjs'))),checkpoint=JSON.parse(fs.readFileSync(path.join(realRoot,'scratch/sol-round2/ms/CHECKPOINT.json'))),runDir=path.join(realRoot,'runs/2026-10-28-rdmv-ms-class-r'),loaded=loadRun({projectRoot:realRoot,runConfigPath:path.join(runDir,'run-config.json')}),snapshot=readNativeSnapshot(loaded.runDir,loaded.config),acceptedArtifacts=acceptedRuntimeRefs(snapshot,realRoot,loaded.runDir),oldRef=checkpoint.hold.accepted_target,before=fs.readFileSync(oldRef.path),r=inspectSourceGroup({projectRoot:realRoot,runDir,runId:loaded.config.run_id,stageId:STAGE,sectionIds:['sec04-traffic-signs'],partIds:[...SECTION_IDS],acceptedArtifacts,replacementRef:checkpoint.hold.replacement_proof_ref});assert.equal(r.status,'PASS',r.blockers.join(';'));assert.equal(r.target.sha256,oldRef.sha256);assert.equal(JSON.parse(before).sections.length,10);assert.deepEqual(JSON.parse(r.target.identity).config.dossier_parts,[]);assert.deepEqual(fs.readFileSync(oldRef.path),before);assert.equal(sha256(before),oldRef.sha256);
});
