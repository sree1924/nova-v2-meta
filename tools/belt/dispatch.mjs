import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,canonicalJson,inside,verifyRef,writeImmutable} from './atomic-file.mjs';
import {assembleContext} from './context.mjs';
import {createMetaClient} from './meta-client.mjs';
import {inspectExecutionPolicy,assertDispatchAllowed} from './execution-policy.mjs';
import {openLedger} from './ledger.mjs';
import {acquireExecutorLock} from './executor-lock.mjs';
import {renderRequest} from '../render-request.mjs';
import {mappedCompensatingChecks} from '../wrap-post-validation-receipt.mjs';
import {validateArtifact} from './post-validate.mjs';
import {inspectImplementationClosure} from '../inspect-implementation-closure.mjs';
import {runArtifactTask} from './artifact-task.mjs';
import {DatabaseSync} from 'node:sqlite';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pin=p=>({path:p,sha256:sha256(fs.readFileSync(p)),bytes:fs.statSync(p).size});
const ref=({path,sha256,bytes})=>({path,sha256,bytes});
const roleIdFor=id=>id.split('.')[0];
export function budgetFromConfig(config){const l=config.limits;return{currency:'USD',total_usd:l.max_total_usd,providers:Object.fromEntries(Object.entries(l.per_provider_usd_caps).map(([k,v])=>[k,{total_usd:v,per_call_usd:l.max_call_usd}])),roles:Object.fromEntries(Object.entries(l.per_role_usd_caps).map(([k,v])=>[k,{total_usd:v,per_call_usd:l.max_call_usd}]))};}

export function readNativeSnapshot(runDir,config){
  const dbPath=inside(runDir,config.execution?.ledger?.path||'ledger/run.sqlite');
  if(!fs.existsSync(dbPath))return{run:null,tasks:[],attempts:[],artifacts:[],model_calls:[],reservations:[]};
  const db=new DatabaseSync(dbPath,{readOnly:true});
  try{
    const columns=db.prepare('PRAGMA table_info(tasks)').all().map(x=>x.name);
    if(!columns.includes('task_id'))throw new Error('LEGACY_LEDGER_RECONCILIATION_REQUIRED');
    const parse=row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,k.endsWith('_json')&&v!==null?JSON.parse(v):v]));
    return Object.fromEntries(['runs','tasks','attempts','artifacts','model_calls','reservations'].map(table=>[table==='runs'?'run':table,table==='runs'?db.prepare('SELECT * FROM runs WHERE run_id=?').get(config.run_id):db.prepare('SELECT * FROM '+table+' WHERE run_id=?').all(config.run_id).map(parse)]));
  }finally{db.close();}
}

export function acceptedRuntimeRefs(snapshot,projectRoot,runDir){
  const out=[];
  for(const task of snapshot.tasks||[]){
    if(task.status!=='accepted')continue;
    const main=(snapshot.artifacts||[]).find(a=>a.artifact_id===task.accepted_artifact_id);
    if(!main)throw new Error('Accepted task has no accepted artifact.');
    const outputFile=verifyRef(main,runDir),validationFile=verifyRef(main.validation_ref_json,runDir),acceptanceFile=verifyRef(main.acceptance_ref_json,runDir);
    const validation=read(validationFile),acceptance=read(acceptanceFile);
    if(validation.status!=='PASS'||acceptance.status!=='PASS'||validation.output_sha256!==main.sha256||acceptance.output_sha256!==main.sha256)throw new Error('Stale accepted artifact receipts.');
    if(Array.isArray(validation.companions)){
      for(const companion of validation.companions||[]){const file=verifyRef(companion,runDir);out.push({...ref(companion),path:file,kind:companion.kind,stage_id:task.stage_id,accepted:true});}
    }else out.push({...ref(main),path:outputFile,kind:task.stage_id,stage_id:task.stage_id,accepted:true});
  }
  return out;
}

function sourceSelection(context,sectionIds,config){
  const text=context.source_document?.text;
  if(!text)return{sections:[],missing:['source_text']};
  const mappings=config.scope?.section_page_ranges||{};
  const wanted=new Set();const missing=[];
  for(const id of sectionIds){
    const explicit=/^pdf:(\d+)(?:-(\d+))?$/.exec(id);
    const pages=explicit?Array.from({length:Number(explicit[2]||explicit[1])-Number(explicit[1])+1},(_,i)=>Number(explicit[1])+i):mappings[id];
    if(!Array.isArray(pages)||!pages.length||pages.length>30){missing.push('section_page_binding:'+id);continue;}
    for(const page of pages)if(Number.isSafeInteger(page)&&page>0)wanted.add(page);else missing.push('invalid_section_page:'+id);
  }
  if(!sectionIds.length)missing.push('selected_handbook_section');
  const pieces=[...text.matchAll(/=== PHYSICAL PDF PAGE (\d+); PRINTED ([^\n]+) ===\n([\s\S]*?)(?=\n=== PHYSICAL PDF PAGE |$)/g)];
  const sections=pieces.filter(m=>wanted.has(Number(m[1]))).map(m=>({pdf_page:Number(m[1]),printed_page:m[2],text:m[3]}));
  for(const page of wanted)if(!sections.some(s=>s.pdf_page===page))missing.push('source_page_unavailable:'+page);
  return{sections,missing};
}

export function prepareDispatch({projectRoot,runConfigPath,executorId,stageId,sectionIds=[],go=false,approvalRef,nowUtc=new Date().toISOString(),snapshot=null}){
  const configPath=inside(projectRoot,runConfigPath),config=read(configPath),runDir=path.dirname(configPath),configRef=pin(configPath);
  if(path.basename(runDir)!==config.run_id)throw new Error('Run/config directory mismatch.');
  inside(path.join(projectRoot,'runs'),runDir);
  const map=read(path.join(projectRoot,'schemas-strict/stage-map.json')),stage=map.stages[stageId];
  if(!stage)throw new Error('Unknown artifact stage: '+stageId);
  const registryRef=pin(path.join(projectRoot,'contracts/bot-contract-bindings.json')),registry=read(registryRef.path);
  const roleId=roleIdFor(stageId),role=registry.roles.find(r=>r.role_id===roleId);
  if(!role)throw new Error('Role assignment is absent.');
  if(['07','08','09','19A'].includes(roleId))throw new Error('This stage requires its independent-audit or deterministic executor; it cannot dispatch through the Meta authoring client.');
  const contractRoot=role.contract.status==='pinned_local'?projectRoot:path.dirname(projectRoot);
  const contract={...role.contract,path:verifyRef(role.contract,contractRoot)};
  const schema=pin(path.join(projectRoot,stage.adapter_schema)),mapping=pin(path.join(projectRoot,stage.mapping));
  const mapped=mappedCompensatingChecks(read(mapping.path),stageId);
  if(mapped.status!=='PASS'||!mapped.check_ids.length)throw new Error('Required mapping checks cannot be resolved.');
  const promptPath=path.join(projectRoot,stage.prompt_path),promptText=fs.readFileSync(promptPath,'utf8');
  if(promptText.match(/^schema_sha256: ([a-f0-9]{64})$/m)?.[1]!==schema.sha256)throw new Error('Prompt schema hash drift.');
  snapshot??=readNativeSnapshot(runDir,config);
  const acceptedArtifacts=acceptedRuntimeRefs(snapshot,projectRoot,runDir);
  const bindings=Object.fromEntries(Object.entries({overlay:'pilot-overrides-v0.4.0.json',policy:'source-fact-policy.json',media_disposition:'media-disposition.json',finish_criteria:'pilot-finish-criteria.json',prompt_authorship:'prompt-authorship.json'}).map(([k,name])=>[k,pin(path.join(projectRoot,'contracts',name))]));
  const assembled=assembleContext({projectRoot,runRoot:runDir,stageId,acceptedArtifacts,bindings,config,configRef,nowUtc});
  const selected=sourceSelection(assembled.context,sectionIds,config);
  const policy=inspectExecutionPolicy({projectRoot,config,go,mode:go?'live':'dry_run',stageId,sectionIds,approvalRef,nowUtc,maxUsd:config.limits.max_call_usd,runDir});
  const ownerRef=config.execution?.adapter_validation_receipts_ref;
  const blockers=[...assembled.missing,...selected.missing];
  let ownerClosure=null,ownerFiles=[];
  try{const ownerFile=verifyRef(ownerRef,projectRoot),receipt=read(ownerFile);ownerFiles=receipt.implementation_closure?.files||[];ownerClosure=inspectImplementationClosure({projectRoot,receiptFiles:ownerFiles});if(ownerClosure.receipt_status!=='LISTED_HASHES_MATCH_ONLY')blockers.push('owner_implementation_closure_unsealed');}catch{blockers.push('owner_receipt_missing_or_stale');}
  const pricingRef=config.producer?.pricing_ref;
  let pricing=null;
  try{const p=verifyRef(pricingRef,projectRoot);pricing=read(p).models[config.producer.model];if(!pricing)throw Error('price');}catch{blockers.push('pricing_snapshot_unbound');}
  if(!['card','credits'].includes(config.producer?.billing_mode))blockers.push('billing_mode_pending');
  if(go&&!process.env[config.producer?.key_env_name||'MODEL_API_KEY'])blockers.push('model_api_key_env_absent');
  const runtimeBindings=Object.fromEntries(assembled.inputRefs.map(p=>[p.kind+'_ref',p.path]));
  for(const p of assembled.inputRefs)runtimeBindings[p.kind+'_sha256']=p.sha256;
  runtimeBindings.run_config_ref=configRef.path;runtimeBindings.run_config_sha256=configRef.sha256;
  runtimeBindings.pilot_overlay_ref=bindings.overlay.path;runtimeBindings.pilot_overlay_sha256=bindings.overlay.sha256;
  runtimeBindings.competitive_intel_ref='verification_debt:not_supplied_first_chapter';runtimeBindings.competitive_intel_sha256=null;
  const sourceViews=Object.fromEntries(Object.entries(assembled.context.accepted_inputs).filter(([k])=>k!=='source_document'));
  const masterMatch=promptText.match(/^master_sme_ref: (.+)$/m),masterHash=promptText.match(/^master_sme_file_sha256: ([a-f0-9]{64})$/m);
  let masterTemplate=null;
  if(masterMatch&&masterHash){const file=verifyRef({path:masterMatch[1],sha256:masterHash[1]},path.dirname(projectRoot));masterTemplate=fs.readFileSync(file,'utf8');runtimeBindings.sme_template_ref=masterMatch[1];runtimeBindings.sme_template_sha256=masterHash[1];}
  const inputData={kind:'bound_task_inputs',stage_id:stageId,section_ids:sectionIds,runtime_bindings:runtimeBindings,safe_run_config:assembled.context.safe_model_input?.model_input,accepted_inputs:sourceViews,source_registry:assembled.context.source_registry,page_map:assembled.context.page_map,selected_source_pages:selected.sections,source_policy:assembled.context.policy,pilot_overlay:assembled.context.overlay,instruction_templates:{master_sme:masterTemplate},missing_inputs:assembled.missing};
  const rendered=renderRequest({promptText,headerTemplateText:fs.readFileSync(path.join(projectRoot,'prompts/controller-header.template.json'),'utf8'),bindings:{
    mode:roleId==='04'?'qualification':'production',render_only:!go,execution_authorized:go&&policy.status==='ELIGIBLE_FOR_BOUND_TASK_CHECKS',
    execution_authority_ref:policy.approval_ref?.path??'contracts/execution-authority.v0.4.0.json',execution_authority_sha256:policy.approval_ref?.sha256??policy.authority_ref.sha256,
    scope:{state_selection:{status:config.state_selection?.status,jurisdiction:config.scope.jurisdiction},language:config.scope.language,source_edition:config.scope.handbook_edition},
    task:{run_id:config.run_id,role_id:roleId,stage_id:stageId,artifact_validation_stage_id:stageId,candidate_lineage_id:config.candidate_lineage_id,execution_kind:role.execution.lane,deadline_utc:config.limits.run_deadline_utc},
    body:{path:stage.prompt_path},bindings:{input_manifest_sha256:assembled.context.input_manifest_sha256,pilot_overlay_ref:bindings.overlay.path,pilot_overlay_sha256:bindings.overlay.sha256},executor:{provider_family:'meta',model_requested:config.producer.model,actor_id:executorId}},inputData});
  const request={model:config.producer.model,messages:rendered.messages,response_format:{type:'json_schema',json_schema:{name:stageId.replace(/[^A-Za-z0-9_]/g,'_'),strict:true,schema:read(schema.path)}},max_completion_tokens:config.limits.max_completion_tokens,reasoning_effort:'low'};
  const requestBytes=Buffer.byteLength(canonicalJson(request));
  if(requestBytes>(config.limits.max_request_bytes||262144))blockers.push('request_byte_limit');
  const conservativeEstimate=pricing?Math.ceil(((requestBytes+1024)*pricing.input_usd_per_million+request.max_completion_tokens*pricing.output_usd_per_million))/1e6:null;
  if(conservativeEstimate!==null&&conservativeEstimate>config.limits.max_call_usd)blockers.push('call_cap_below_conservative_request_estimate');
  return{projectRoot,runDir,config,configRef,stageId,roleId,sectionIds,executorId,nowUtc,go,policy,context:assembled.context,inputRefs:assembled.inputRefs,
    contract,schema,mapping,registryRef,requiredChecks:mapped.check_ids,pricing,pricingRef,rendered,request,
    validatorRef:pin(path.join(projectRoot,'tools/belt/post-validate.mjs')),ownerFiles,ownerReceiptRef:ownerRef,
    renderingInputs:{promptText,headerTemplateText:fs.readFileSync(path.join(projectRoot,'prompts/controller-header.template.json'),'utf8'),inputData},
    preflight:{status:blockers.length?'HOLD':'PASS',blockers:[...new Set(blockers)]},ownerClosure,
    proposed_reservation:{usd:config.limits.max_call_usd,microusd:Math.round(config.limits.max_call_usd*1e6),reserved:false,conservative_estimate_usd:conservativeEstimate,estimate_policy:'UTF8 request bytes plus1024 token overhead allowance; full output cap; estimate not provider billing cap'},request_sha256:sha256(canonicalJson(request))};
}

export function acceptDossier(validation,requiredChecks){
  const checks=Array.isArray(validation?.checks)?validation.checks:[],ids=checks.map(c=>c.check_id);
  const complete=requiredChecks.length>0&&new Set(ids).size===ids.length&&requiredChecks.every(id=>checks.find(c=>c.check_id===id)?.status==='PASS');
  return{status:validation?.status==='PASS'&&complete&&!checks.some(c=>c.status!=='PASS')&&!validation.errors?.length?'PASS':'HOLD',kind:'deterministic_validation_only',auditors:'pending 07/08'};
}

export async function executePreparedDispatch({prepared:p,ledger,fence,lockHandle,client,validator=validateArtifact}){
  if(p.preflight.status!=='PASS')throw new Error('Dispatch inputs remain HOLD: '+p.preflight.blockers.join(', '));
  for(const bound of [...(p.inputRefs||[]),p.contract,p.schema,p.mapping,p.registryRef,p.pricingRef,p.validatorRef,p.ownerReceiptRef,...(p.ownerFiles||[])].filter(r=>r?.path)){
    const bytes=fs.readFileSync(path.resolve(p.projectRoot,bound.path));
    if(sha256(bytes)!==bound.sha256)throw new Error('Bound input/tool changed before dispatch: '+bound.path);
  }
  const task=ledger.ensureTask(fence,{lineageId:p.config.candidate_lineage_id,stageId:p.stageId,roleId:p.roleId,inputs:p.inputRefs,
    versions:{contract:p.contract.sha256,schema:p.schema.sha256,mapping:p.mapping.sha256,prompt:p.rendered.hashes.template_body_sha256,header:p.rendered.hashes.header_template_sha256,registry:p.registryRef.sha256,validator:p.validatorRef?.sha256??null,validator_closure:sha256(canonicalJson(p.ownerFiles||[]))},model:p.config.producer.model,config:{section_ids:p.sectionIds,generation:{max_completion_tokens:p.request.max_completion_tokens,reasoning_effort:p.request.reasoning_effort}},maxAttempts:p.config.limits.max_automatic_attempts_per_logical_task});
  const taskId=task.taskId??task.task_id;
  if(task.status==='accepted')return runArtifactTask({ledger,fence,lockHandle,runDir:p.runDir,task,requiredChecks:p.requiredChecks});
  const old=ledger.listAttempts(fence.runId).filter(a=>a.task_id===taskId);
  const interrupted=old.find(a=>['running','unknown_provider_result'].includes(a.status));
  if(interrupted){
    if(interrupted.status==='unknown_provider_result')return{status:'HOLD',reason:'unknown_provider_result_requires_reconciliation',new_model_calls:0};
    const priorDir='artifacts/'+taskId+'/'+interrupted.attempt_id;
    const savedPath=inside(p.runDir,priorDir+'/artifact.json'),receiptPath=inside(p.runDir,priorDir+'/call-receipt.json'),rawPath=inside(p.runDir,priorDir+'/raw-response.json');
    if(![savedPath,receiptPath,rawPath].every(f=>fs.existsSync(f)))return{status:'HOLD',reason:'interrupted_attempt_evidence_incomplete',new_model_calls:0};
    const call=ledger.listModelCalls(fence.runId).find(c=>c.attempt_id===interrupted.attempt_id),reservation=ledger.listReservations(fence.runId).find(r=>r.attempt_id===interrupted.attempt_id);
    if(call?.status!=='completed'||reservation?.state!=='reported')return{status:'HOLD',reason:'interrupted_attempt_accounting_unresolved',new_model_calls:0};
    const receipt=read(receiptPath);
    const proof={schema_version:'nova-attempt-recovery.v0.4.0',kind:'content',run_id:fence.runId,task_id:taskId,attempt_id:interrupted.attempt_id,logical_key_sha256:task.logical_key_sha256,from_generation:interrupted.generation,to_generation:fence.generation,recovered_by:fence.executorId,recorded_at:p.nowUtc,saved_artifact:pin(savedPath),model_call:{call_id:call.call_id,receipt_ref:pin(receiptPath),raw_response_ref:pin(rawPath),usage:call.usage_json,reservation_id:reservation.reservation_id,actual_usd:receipt.estimated_usd}};
    const proofRef=writeImmutable(p.runDir,priorDir+'/recovery-'+sha256(canonicalJson(proof))+'.json',proof,{lockHandle});
    ledger.recoverAttempt(fence,{attemptId:interrupted.attempt_id,recoveryReceipt:proofRef});
    const result=await runArtifactTask({ledger,fence,lockHandle,runDir:p.runDir,task,produce:()=>{throw Error('Recovery cannot remint content.');},validate:artifact=>validator({stage_id:p.stageId,artifact,context:p.context}),requiredChecks:p.requiredChecks,accept:(_,{validation})=>p.stageId==='02.dossier_sections'?acceptDossier(validation,p.requiredChecks):{status:'HOLD'},validationRevision:'recovery-'+sha256(canonicalJson({generation:fence.generation,now:p.nowUtc})).slice(0,16)});
    return{...result,new_model_calls:0,recovery_ref:proofRef};
  }
  const attempt=ledger.startAttempt(fence,{taskId,commandId:'dispatch:'+taskId+':'+(old.length+1)}),attemptId=attempt.attemptId??attempt.attempt_id;
  const folder='artifacts/'+taskId+'/'+attemptId;
  const reservation=ledger.reserveBudget(fence,{attemptId,provider:'meta',roleId:p.roleId,maxUsd:p.config.limits.max_call_usd,pricingRef:p.pricingRef,approvalRef:p.policy.approval_ref,approvalUsdCeiling:p.policy.caps.approval_usd});
  const reservationId=reservation.reservationId??reservation.reservation_id;
  const reservationRef=writeImmutable(p.runDir,folder+'/reservation.json',reservation,{lockHandle});
  const bound=renderRequest({...p.renderingInputs,bindings:{...p.rendered.header,render_only:false,execution_authorized:true,task:{...p.rendered.header.task,logical_task_id:taskId,attempt_id:attemptId,budget_reservation_ref:reservationRef.path,budget_reservation_sha256:reservationRef.sha256}}});
  const request={...p.request,messages:bound.messages},requestHash=sha256(canonicalJson(request));
  const savedRequest=writeImmutable(p.runDir,'sources/private/requests/'+attemptId+'.json',request,{lockHandle});
  const envelopeRef=writeImmutable(p.runDir,folder+'/request-envelope.json',{header:bound.header,hashes:bound.hashes,request_sha256:requestHash,request_ref:ref(savedRequest),stage_id:p.stageId,section_ids:p.sectionIds,inputs:p.inputRefs,contract:p.contract,schema:p.schema,mapping:p.mapping,registry:p.registryRef,reservation_id:reservationId,executor_id:p.executorId},{lockHandle});
  const callId='call_'+attemptId;
  ledger.recordModelCall(fence,{attemptId,reservationId,callId,status:'dispatching',provider:'meta',roleId:p.roleId,model_requested:request.model,request_sha256:requestHash,envelope_ref:ref(envelopeRef)});
  let result;
  try{result=await client.complete(request);}
  catch(error){
    // Only a thrown transport() (meta-client sets code UNKNOWN_PROVIDER_RESULT) may have reached the provider. Any other
    // exception happened before the send (config/key/policy): fail the attempt, release the reserve, never park it as unknown.
    if(error.code!=='UNKNOWN_PROVIDER_RESULT'){
      const failure=writeImmutable(p.runDir,folder+'/failed-pre-send.json',{status:'failed_pre_send',error_message:String(error.message).slice(0,400),request_sha256:requestHash,money_spent_usd:0},{lockHandle});
      ledger.completeModelCall(fence,{callId,status:'failed',usage:null,receiptRef:failure,responseMetadata:{error_code:'FAILED_PRE_SEND'}});
      ledger.settleReservation(fence,{reservationId,status:'released',evidenceRef:failure});ledger.failAttempt(fence,{attemptId,status:'failed',errorRef:failure});
      return{status:'HOLD',reason:'failed_pre_send',detail:String(error.message).slice(0,200),raw_ref:failure};
    }
    const failure=writeImmutable(p.runDir,folder+'/provider-unknown.json',{status:'unknown_provider_result',error_code:error.code||'UNKNOWN_PROVIDER_RESULT',request_sha256:requestHash},{lockHandle});
    ledger.completeModelCall(fence,{callId,status:'unknown_provider_result',usage:null,receiptRef:failure,responseMetadata:{error_code:error.code||'UNKNOWN_PROVIDER_RESULT'}});
    ledger.settleReservation(fence,{reservationId,status:'unknown_provider_result',evidenceRef:failure});ledger.failAttempt(fence,{attemptId,status:'unknown_provider_result',errorRef:failure});
    return{status:'HOLD',reason:'unknown_provider_result',raw_ref:failure};
  }
  const raw=writeImmutable(p.runDir,folder+'/raw-response.json',result.raw_text,{lockHandle,bytes:true});
  ledger.recordArtifact(fence,{taskId,attemptId,artifact:{...raw,kind:'raw_provider_response'},status:'output_saved'});
  const usage=result.body?.usage,validUsage=Number.isSafeInteger(usage?.prompt_tokens)&&usage.prompt_tokens>=0&&Number.isSafeInteger(usage?.completion_tokens)&&usage.completion_tokens>=0;
  const ledgerUsage=validUsage?{prompt_tokens:usage.prompt_tokens,completion_tokens:usage.completion_tokens,...(Number.isSafeInteger(usage.total_tokens)?{total_tokens:usage.total_tokens}:{})}:null;
  const cost=validUsage&&p.pricing?Math.round((usage.prompt_tokens*p.pricing.input_usd_per_million+usage.completion_tokens*p.pricing.output_usd_per_million))/1e6:null;
  const finish=result.body?.choices?.[0]?.finish_reason;
  const callReceipt=writeImmutable(p.runDir,folder+'/call-receipt.json',{http_status:result.http_status,model_requested:request.model,model_returned:result.body?.model??null,usage:usage??null,finish_reason:finish??null,elapsed_ms:result.elapsed_ms,raw_response:ref(raw),request_sha256:requestHash,estimated_usd:cost,billing_classification:'estimated_from_reported_usage',pricing_ref:p.pricingRef},{lockHandle});
  ledger.completeModelCall(fence,{callId,status:result.http_status===200&&finish==='stop'?'completed':'failed',usage:ledgerUsage,receiptRef:callReceipt,responseMetadata:{...(typeof result.body?.model==='string'?{returned_model:result.body.model}:{}),finish_reason:finish??null,http_status:result.http_status,latency_ms:result.elapsed_ms,raw_response_sha256:raw.sha256}});
  if(cost===null)ledger.settleReservation(fence,{reservationId,status:'unknown_provider_result',evidenceRef:callReceipt});else ledger.settleReservation(fence,{reservationId,status:'reported',actualUsd:cost,evidenceRef:callReceipt});
  if(result.http_status!==200||finish!=='stop'||!result.body?.choices?.[0]?.message?.content){
    ledger.failAttempt(fence,{attemptId,status:cost===null?'unknown_provider_result':'failed',errorRef:callReceipt});
    return{status:'HOLD',reason:result.http_status!==200?'http_status_not_200':'finish_reason_not_stop',raw_ref:raw,call_receipt:callReceipt};
  }
  if(cost===null){ledger.failAttempt(fence,{attemptId,status:'unknown_provider_result',errorRef:callReceipt});return{status:'HOLD',reason:'usage_missing_reserve_retained',raw_ref:raw};}
  let value;
  try{value=JSON.parse(result.body.choices[0].message.content);}catch{ledger.failAttempt(fence,{attemptId,status:'failed',errorRef:callReceipt});return{status:'HOLD',reason:'invalid_artifact_json',raw_ref:raw};}
  try{
    const accepted=await runArtifactTask({ledger,fence,lockHandle,runDir:p.runDir,task,produce:()=>value,
      validate:artifact=>validator({stage_id:p.stageId,artifact,context:p.context}),requiredChecks:p.requiredChecks,
      accept:(_value,{validation})=>p.stageId==='02.dossier_sections'?acceptDossier(validation,p.requiredChecks):{status:'HOLD',kind:'acceptance_policy_pending',auditors:'pending 07/08'}});
    return{...accepted,raw_ref:raw,call_receipt:callReceipt,estimated_usd:cost};
  }catch(error){const failure=writeImmutable(p.runDir,folder+'/artifact-error.json',{status:'HOLD',reason:error.message,call_receipt:ref(callReceipt)},{lockHandle});ledger.failAttempt(fence,{attemptId,status:'blocked',errorRef:failure});return{status:'HOLD',reason:'artifact_or_validation_error',error_ref:failure,raw_ref:raw};}
}

export async function dispatchStage(options){
  const prepared=prepareDispatch(options);
  if(!options.go)return{status:'DRY_DISPATCH_ENVELOPE',stage_id:prepared.stageId,section_ids:prepared.sectionIds,mode:prepared.rendered.header.mode,render_only:true,hashes:prepared.rendered.hashes,adapter_sha256:prepared.schema.sha256,request_sha256:prepared.request_sha256,max_completion_tokens:prepared.request.max_completion_tokens,reasoning_effort:prepared.request.reasoning_effort,proposed_reservation:prepared.proposed_reservation,preflight:prepared.preflight,approval_policy:prepared.policy,model_calls:0};
  assertDispatchAllowed({projectRoot:prepared.projectRoot,config:prepared.config,runDir:prepared.runDir,go:true,mode:'live',stageId:prepared.stageId,sectionIds:prepared.sectionIds,approvalRef:prepared.policy.approval_ref,nowUtc:prepared.nowUtc,maxUsd:prepared.config.limits.max_call_usd});
  if(prepared.preflight.status!=='PASS')throw new Error('Dispatch remains HOLD: '+prepared.preflight.blockers.join(', '));
  const lockHandle=acquireExecutorLock({runDir:prepared.runDir,runId:prepared.config.run_id,executorId:prepared.executorId});
  let ledger,fence;
  try{
    ledger=openLedger({dbPath:inside(prepared.runDir,prepared.config.execution.ledger.path),lockHandle});
    const previous=ledger.getRun(prepared.config.run_id);
    fence=ledger.claimRun({runId:prepared.config.run_id,bindingSha256:previous?.binding_sha256??prepared.configRef.sha256,mode:previous?.mode??'execute',budget:previous?.budget_json??budgetFromConfig(prepared.config)});
    if(previous&&(previous.binding_sha256!==prepared.configRef.sha256||previous.mode!=='execute')){
      const authorization={status:'PASS',action:'rebind_run',source:'founder',run_id:prepared.config.run_id,previous_binding_sha256:previous.binding_sha256,binding_sha256:prepared.configRef.sha256,mode:'execute',budget_sha256:sha256(canonicalJson(budgetFromConfig(prepared.config))),execution_authorized:true,content_calls_authorized:true,derived_from_stage_approval:prepared.policy.approval_ref};
      const authRef=writeImmutable(prepared.runDir,'receipts/binding-'+sha256(canonicalJson(authorization))+'.json',authorization,{lockHandle});
      fence=ledger.rebindRun(fence,{bindingSha256:prepared.configRef.sha256,mode:'execute',budget:budgetFromConfig(prepared.config),authorizationReceipt:authRef});
    }
    const client=createMetaClient({...options,projectRoot:prepared.projectRoot,config:prepared.config,runDir:prepared.runDir,go:true,mode:'live',stageId:prepared.stageId,sectionIds:prepared.sectionIds,approvalRef:prepared.policy.approval_ref,nowUtc:prepared.nowUtc,maxUsd:prepared.config.limits.max_call_usd});
    return await executePreparedDispatch({prepared,ledger,fence,lockHandle,client});
  }finally{if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}
