import fs from 'node:fs';
import path from 'node:path';
import {sha256, verifyRef, inside} from './atomic-file.mjs';

export const STAGE_APPROVAL_SCHEMA_VERSION='nova-stage-approval.v0.4.0';
const positive=value=>typeof value==='number'&&Number.isFinite(value)&&value>0;
const ids=value=>Array.isArray(value)&&value.every(id=>typeof id==='string'&&id.trim())&&new Set(value).size===value.length;
const sameIds=(left,right)=>JSON.stringify([...left].sort())===JSON.stringify([...right].sort());
const iso=value=>typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value)&&Number.isFinite(Date.parse(value));
const roleForStage=stage=>stage?.split('.')[0].replace(/^(\d{2})[a-z]$/,'$1');

function explicitlyBoundApproval({projectRoot,config,stageId,approvalRef}){
  if(approvalRef)return{ref:approvalRef,source:'explicit_argument'};
  const configured=config.execution_approvals?.[stageId]??config.execution?.stage_approval_refs?.[stageId];
  if(configured)return{ref:configured,source:'config'};
  const indexRef=config.execution?.stage_approval_index_ref;
  if(indexRef){
    const indexPath=verifyRef(indexRef,projectRoot);const bytes=fs.readFileSync(indexPath);
    if(sha256(bytes)!==indexRef.sha256)throw new Error('Approval index bytes changed');
    const index=JSON.parse(bytes);
    if(index.schema_version!=='nova-stage-approval-index.v0.4.0'||index.run_id!==config.run_id)throw new Error('Approval index is not bound to this run');
    return{ref:index.approvals?.[stageId],source:'hash_bound_index',index_ref:{path:indexPath,sha256:indexRef.sha256}};
  }
  return{ref:null,source:'absent'};
}

/** Rendering a production-shaped dry request never authorizes a provider dispatch. */
export function inspectExecutionPolicy({projectRoot,config,go=false,mode='dry_run',stageId,roleId=roleForStage(stageId),sectionIds=[],approvalRef,nowUtc=new Date().toISOString(),maxUsd,runDir,authorityPath='contracts/execution-authority.v0.4.0.json'}={}){
  const blockers=[],warnings=[];let approval=null,boundRef=null,indexRef=null,approvalSource='absent',globalRef=null;
  config=config||{};const limits=config.limits||{};
  if(mode!=='live')blockers.push('dry_run_mode');
  if(go!==true)blockers.push('explicit_go_absent');
  if(!iso(nowUtc))blockers.push('controller_clock_invalid');
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(stageId||''))blockers.push('stage_scope_missing');
  if(!ids(sectionIds))blockers.push('requested_sections_invalid');
  if(config.execution_enabled!==true)blockers.push('execution_disabled');
  if(limits.spend_mode!=='live')blockers.push('spend_mode_not_live');
  const model=config.producer?.model||'';
  if(typeof model!=='string'||!model.trim()||/contributor/i.test(model))blockers.push('standard_model_assignment_missing');
  if(config.producer?.provider&&config.producer.provider!=='meta')blockers.push('meta_provider_assignment_missing');
  if(!config.scope?.jurisdiction||config.scope?.jurisdiction_selected_by==null)blockers.push('state_binding_missing');
  for(const field of ['max_total_usd','max_call_usd'])if(!positive(limits[field]))blockers.push(field+'_missing');
  if(!positive(limits.per_provider_usd_caps?.meta))blockers.push('meta_budget_missing');
  if(!positive(limits.per_role_usd_caps?.[roleId]))blockers.push('role_budget_missing');
  if(!Number.isSafeInteger(limits.max_completion_tokens)||limits.max_completion_tokens<1)blockers.push('token_limit_missing');
  if(!iso(limits.run_deadline_utc))blockers.push('deadline_missing');
  else if(Date.parse(limits.run_deadline_utc)<=Date.parse(nowUtc))blockers.push('deadline_expired');
  const caps={run_usd:limits.max_total_usd??null,provider_usd:limits.per_provider_usd_caps?.meta??null,role_usd:limits.per_role_usd_caps?.[roleId]??null,per_call_usd:limits.max_call_usd??null,approval_usd:null,max_completion_tokens:limits.max_completion_tokens??null};
  try{
    const resolved=explicitlyBoundApproval({projectRoot,config,stageId,approvalRef});approvalSource=resolved.source;indexRef=resolved.index_ref??null;
    if(!resolved.ref)throw new Error('Founder stage approval is absent');
    if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(config.run_id||''))throw new Error('Run identity is invalid');
    const canonicalRunDir=inside(projectRoot,path.join('runs',config.run_id));
    if(runDir&&path.resolve(runDir)!==canonicalRunDir)throw new Error('Requested run directory differs from bound run');
    const target=verifyRef(resolved.ref,projectRoot);inside(canonicalRunDir,target);
    const filename='GO-'+stageId+'-';const basename=path.basename(target);
    if(path.dirname(target)!==path.join(canonicalRunDir,'approvals')||!basename.startsWith(filename)||!basename.endsWith('.json')||!basename.slice(filename.length,-5))throw new Error('Approval must be a stage-named GO artifact in this run approvals directory');
    const bytes=fs.readFileSync(target);if(sha256(bytes)!==resolved.ref.sha256)throw new Error('Approval bytes changed');
    approval=JSON.parse(bytes);boundRef={path:target,sha256:resolved.ref.sha256,bytes:bytes.length};
    if(approval.schema_version!==STAGE_APPROVAL_SCHEMA_VERSION||approval.content_calls_authorized!==true)blockers.push('stage_content_authority_not_granted');
    if(approval.run_id!==config.run_id)blockers.push('approval_not_bound_to_run');
    if(approval.stage_id!==stageId)blockers.push('approval_not_bound_to_stage');
    if(!ids(approval.section_ids)||!ids(sectionIds)||!sameIds(approval.section_ids,sectionIds))blockers.push('approval_section_scope_mismatch');
    if(typeof approval.founder_words!=='string'||!approval.founder_words.trim())blockers.push('founder_verbatim_words_missing');
    if(!(typeof approval.recorded_by==='string'&&approval.recorded_by.trim())&&!(approval.recorded_by&&typeof approval.recorded_by.actor_id==='string'&&approval.recorded_by.actor_id.trim()))blockers.push('approval_recorder_missing');
    if(!iso(approval.recorded_at)||Date.parse(approval.recorded_at)>Date.parse(nowUtc))blockers.push('approval_recorded_time_invalid');
    if(approval.expires_at!==undefined&&(!iso(approval.expires_at)||Date.parse(approval.expires_at)<=Date.parse(nowUtc)))blockers.push('approval_expired');
    if(!positive(approval.usd_ceiling))blockers.push('approval_usd_ceiling_missing');
    else{caps.approval_usd=approval.usd_ceiling;if([caps.run_usd,caps.provider_usd,caps.role_usd].some(cap=>!positive(cap)||approval.usd_ceiling>cap))blockers.push('approval_ceiling_exceeds_run_caps');}
  }catch(error){blockers.push('founder_stage_approval_invalid');warnings.push(String(error.message||error));}
  if(!boundRef||approval?.content_calls_authorized!==true)blockers.push('founder_content_authority_not_granted');
  const maximum=[caps.run_usd,caps.provider_usd,caps.role_usd,caps.per_call_usd,caps.approval_usd];
  const effectiveMax=maximum.every(positive)?Math.min(...maximum):null;
  if(maxUsd!==undefined&&(!positive(maxUsd)||effectiveMax===null||maxUsd>effectiveMax))blockers.push('requested_reservation_exceeds_bound_ceiling');
  // Global metadata describes dry preparation only and is never a live grant or prerequisite.
  if(!boundRef){try{const target=inside(projectRoot,authorityPath);const bytes=fs.readFileSync(target);globalRef={path:target,sha256:sha256(bytes)};}catch{warnings.push('global_dry_run_metadata_unavailable');}}
  return{status:blockers.length?'BLOCKED':'ELIGIBLE_FOR_BOUND_TASK_CHECKS',mode,go,stage_id:stageId??null,role_id:roleId??null,section_ids:sectionIds,content_calls_authorized:blockers.length===0,blockers:[...new Set(blockers)],warnings,approval_ref:boundRef,approval_source:approvalSource,approval_index_ref:indexRef,authority_ref:boundRef??globalRef,global_authority_ref:globalRef,caps,effective_max_usd:effectiveMax,requested_max_usd:maxUsd??effectiveMax,approval};
}

export function assertDispatchAllowed(options) {
  const policy = inspectExecutionPolicy(options);
  if (policy.status !== 'ELIGIBLE_FOR_BOUND_TASK_CHECKS') {
    const error = new Error('CONTENT_DISPATCH_BLOCKED: ' + policy.blockers.join(', '));
    error.code = 'CONTENT_DISPATCH_BLOCKED'; error.policy = policy;
    throw error;
  }
  return policy;
}
