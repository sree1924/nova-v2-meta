import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,writeImmutable} from '../../tools/belt/atomic-file.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';
import {acquireExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {renderRequest} from '../../tools/render-request.mjs';
import {inspectExecutionPolicy} from '../../tools/belt/execution-policy.mjs';
import {executePreparedDispatch,acceptDossier} from '../../tools/belt/dispatch.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
function fixture(t){
  const parent=path.join(ROOT,'tests/.tmp');fs.mkdirSync(parent,{recursive:true});
  const projectRoot=fs.mkdtempSync(path.join(parent,'nova-dispatch-')),runId='synthetic-run',runDir=path.join(projectRoot,'runs',runId);
  fs.mkdirSync(runDir,{recursive:true});
  const lockHandle=acquireExecutorLock({runDir,runId,executorId:'synthetic-builder'});
  const ledger=openLedger({dbPath:path.join(runDir,'ledger/run.sqlite'),lockHandle});
  const config={run_id:runId,candidate_lineage_id:runId+':lineage:1',execution_enabled:true,scope:{jurisdiction:'US-UT',jurisdiction_selected_by:'synthetic-fixture'},producer:{provider:'meta',model:'muse-spark-1.3'},limits:{spend_mode:'live',max_total_usd:10,max_call_usd:1,per_provider_usd_caps:{meta:10},per_role_usd_caps:{'02':10},max_completion_tokens:100,max_automatic_attempts_per_logical_task:2,run_deadline_utc:'2026-11-01T00:00:00Z'}};
  const budget={currency:'USD',total_usd:10,providers:{meta:{total_usd:10,per_call_usd:1}},roles:{'02':{total_usd:10,per_call_usd:1}}};
  const fence=ledger.claimRun({runId,bindingSha256:'1'.repeat(64),mode:'execute',budget});
  const approvalRef=writeImmutable(runDir,'approvals/GO-02.dossier_sections-synthetic.json',{schema_version:'nova-stage-approval.v0.4.0',run_id:runId,stage_id:'02.dossier_sections',section_ids:['pdf:33'],founder_words:'SYNTHETIC TEST FIXTURE ONLY: go 02',recorded_by:'synthetic-test',recorded_at:'2026-10-27T00:00:00Z',usd_ceiling:2,content_calls_authorized:true,test_fixture:true},{lockHandle});
  const nowUtc='2026-10-27T14:00:00Z',policy=inspectExecutionPolicy({projectRoot,config,go:true,mode:'live',stageId:'02.dossier_sections',sectionIds:['pdf:33'],approvalRef,nowUtc,maxUsd:1,runDir});
  assert.equal(policy.status,'ELIGIBLE_FOR_BOUND_TASK_CHECKS');
  const promptBody='Synthetic role instruction.\n',promptText=promptBody+'prompt_template_sha256: '+sha256(promptBody)+'\n';
  const headerTemplateText=fs.readFileSync(path.join(ROOT,'prompts/controller-header.template.json'),'utf8');
  const inputData={synthetic:true};
  const rendered=renderRequest({promptText,headerTemplateText,inputData,bindings:{mode:'production',render_only:false,execution_authorized:true,execution_authority_ref:approvalRef.path,execution_authority_sha256:approvalRef.sha256,task:{run_id:runId,stage_id:'02.dossier_sections'}}});
  const input=writeImmutable(runDir,'inputs/synthetic.json',{synthetic:true},{lockHandle});
  const pricingRef=writeImmutable(runDir,'inputs/pricing.json',{synthetic:true,input_usd_per_million:1.25,output_usd_per_million:4.25},{lockHandle});
  const prepared={projectRoot,runDir,config,configRef:{path:'synthetic',sha256:'1'.repeat(64)},stageId:'02.dossier_sections',roleId:'02',sectionIds:['pdf:33'],executorId:'synthetic-builder',nowUtc,go:true,policy,
    context:{synthetic:true},inputRefs:[{...input,kind:'synthetic_input'}],contract:{sha256:'2'.repeat(64)},schema:{sha256:'3'.repeat(64)},mapping:{sha256:'4'.repeat(64)},registryRef:{sha256:'5'.repeat(64)},requiredChecks:['02.SCHEMA','02.SOURCE'],pricing:{input_usd_per_million:1.25,output_usd_per_million:4.25},pricingRef,rendered,renderingInputs:{promptText,headerTemplateText,inputData},request:{model:'muse-spark-1.3',messages:rendered.messages,response_format:{type:'json_schema',json_schema:{strict:true,schema:{type:'object'}}},max_completion_tokens:100,reasoning_effort:'low'},preflight:{status:'PASS',blockers:[]}};
  t.after(()=>{ledger.releaseRun(fence);ledger.close();lockHandle.release();if(path.dirname(path.resolve(projectRoot))!==path.resolve(parent)||!path.basename(projectRoot).startsWith('nova-dispatch-'))throw Error('Unsafe cleanup');fs.rmSync(projectRoot,{recursive:true,force:true});});
  return{prepared,ledger,fence,lockHandle};
}
function response({http=200,finish='stop',content=JSON.stringify({artifact:'synthetic'}),usage=true}={}){
  const body={model:'muse-spark-1.3',choices:[{finish_reason:finish,message:{content}}],...(usage?{usage:{prompt_tokens:10,completion_tokens:5,total_tokens:15,completion_tokens_details:{reasoning_tokens:2}}}:{})};
  return{http_status:http,ok:http===200,body,raw_text:JSON.stringify(body),elapsed_ms:4};
}
const validation=()=>({status:'PASS',checks:[{check_id:'02.SCHEMA',status:'PASS'},{check_id:'02.SOURCE',status:'PASS'}],errors:[]});

test('S1 records reservation and dispatching before stub call, saves raw, settles, validates and accepts scoped02',async t=>{
  const c=fixture(t);let sends=0;
  const client={complete:async request=>{sends++;const s=c.ledger.snapshot(c.fence.runId);assert.equal(s.model_calls[0].status,'dispatching');assert.equal(s.reservations[0].state,'reserved');assert.ok(request.messages[0].content.includes('budget_reservation_sha256'));return response();}};
  const result=await executePreparedDispatch({...c,client,validator:validation});
  assert.equal(result.status,'accepted');assert.equal(sends,1);
  const s=c.ledger.snapshot(c.fence.runId);assert.equal(s.model_calls[0].status,'completed');assert.equal(s.model_calls[0].usage_json.total_tokens,15);assert.equal(s.reservations[0].state,'reported');assert.equal(s.reservations[0].actual_microusd,34);
  assert.ok(fs.existsSync(result.raw_ref.path));const accepted=s.artifacts.find(a=>a.status==='accepted');const a=JSON.parse(fs.readFileSync(path.join(c.prepared.runDir,accepted.acceptance_ref_json.path)));assert.equal(a.kind,'deterministic_validation_only');assert.equal(a.auditors,'pending 07/08');
});
for(const [name,options,reason] of [['HTTP400',{http:400},'http_status_not_200'],['length',{finish:'length'},'finish_reason_not_stop']])test('S1 '+name+' never parses partial content or invokes validator',async t=>{
  const c=fixture(t);let checked=0;
  const result=await executePreparedDispatch({...c,client:{complete:async()=>response({...options,content:'{"TRUNCATED"'})},validator:()=>{checked++;return validation();}});
  assert.equal(result.status,'HOLD');assert.equal(result.reason,reason);assert.equal(checked,0);assert.equal(c.ledger.listArtifacts(c.fence.runId).some(a=>a.status==='accepted'),false);assert.ok(fs.existsSync(result.raw_ref.path));assert.equal(c.ledger.listModelCalls(c.fence.runId)[0].status,'failed');
});
test('S1 unknown network result retains reserve and never automatically retries',async t=>{
  const c=fixture(t);let sends=0;
  const result=await executePreparedDispatch({...c,client:{complete:async()=>{sends++;throw Object.assign(Error('synthetic timeout'),{code:'UNKNOWN_PROVIDER_RESULT'});}},validator:validation});
  assert.equal(result.status,'HOLD');assert.equal(sends,1);assert.equal(c.ledger.listModelCalls(c.fence.runId)[0].status,'unknown_provider_result');assert.equal(c.ledger.listReservations(c.fence.runId)[0].state,'unknown_provider_result');
});
test('S1 missing usage holds acceptance and retains unknown reserve',async t=>{
  const c=fixture(t);let checked=0;
  const result=await executePreparedDispatch({...c,client:{complete:async()=>response({usage:false})},validator:()=>{checked++;return validation();}});
  assert.equal(result.reason,'usage_missing_reserve_retained');assert.equal(checked,0);assert.equal(c.ledger.listReservations(c.fence.runId)[0].state,'unknown_provider_result');
});
test('S8 missing mapped check and source HOLD cannot be accepted',async t=>{
  const c=fixture(t);const result=await executePreparedDispatch({...c,client:{complete:async()=>response()},validator:()=>({status:'PASS',checks:[{check_id:'02.SCHEMA',status:'PASS'}],errors:[]})});
  assert.equal(result.status,'HOLD');assert.equal(c.ledger.listArtifacts(c.fence.runId).filter(a=>a.status==='accepted').length,0);
});
test('S1 duplicate accepted02 reuses evidence with no second call or reservation',async t=>{
  const c=fixture(t);let sends=0;const options={...c,client:{complete:async()=>{sends++;return response();}},validator:validation};
  await executePreparedDispatch(options);const again=await executePreparedDispatch(options);assert.equal(again.reused,true);assert.equal(sends,1);assert.equal(c.ledger.listReservations(c.fence.runId).length,1);
});
test('S1 driver reaches saved-output recovery after an interrupted validation continuation',async t=>{
  const c=fixture(t);let sends=0,signalSaved;
  const saved=new Promise(resolve=>{signalSaved=resolve;});
  // Simulate losing the original continuation after durable output publication.
  // This pending promise owns no timers/IO; separate child-exit tests exercise
  // the process/lock/ownership transition itself.
  void executePreparedDispatch({...c,client:{complete:async()=>{sends++;return response();}},validator:async()=>{signalSaved();return new Promise(()=>{});}});
  await saved;
  const replay=await executePreparedDispatch({...c,client:{complete:async()=>{throw Error('Recovery must not call a provider.');}},validator:validation});
  assert.equal(replay.status,'accepted');assert.equal(replay.recovered,true);assert.equal(replay.new_model_calls,0);assert.equal(sends,1);
  assert.equal(c.ledger.listAttempts(c.fence.runId).length,1);assert.equal(c.ledger.listModelCalls(c.fence.runId).length,1);assert.equal(c.ledger.listReservations(c.fence.runId).length,1);
});
test('S1 fixture-labelled output is blocked after raw evidence save',async t=>{
  const c=fixture(t);const result=await executePreparedDispatch({...c,client:{complete:async()=>response({content:JSON.stringify({_fixture:{kind:'synthetic'}})})},validator:validation});
  assert.equal(result.status,'HOLD');assert.equal(result.reason,'artifact_or_validation_error');assert.equal(c.ledger.listArtifacts(c.fence.runId).filter(a=>a.status==='accepted').length,0);
});
test('S8 malformed/duplicate/debt aggregate PASS remains HOLD',()=>{
  assert.equal(acceptDossier(null,['02.SCHEMA']).status,'HOLD');
  assert.equal(acceptDossier({status:'PASS',checks:[{check_id:'02.SCHEMA',status:'PASS'},{check_id:'02.SCHEMA',status:'PASS'}]},['02.SCHEMA']).status,'HOLD');
  assert.equal(acceptDossier({status:'PASS',checks:[{check_id:'02.SCHEMA',status:'HOLD'}]},['02.SCHEMA']).status,'HOLD');
});
