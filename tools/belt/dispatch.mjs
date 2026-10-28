import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,canonicalJson,inside,verifyRef,writeImmutable} from './atomic-file.mjs';
import {assembleContext,inspectAccepted02Replacement} from './context.mjs';
import {validateSourceGroupCandidate,groupBookkeeping} from './source-groups.mjs';
export {inspectAccepted02Replacement} from './context.mjs';
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
// Only exact transports created by this module may use the zero-cost file exemption.
const museFileTransports=new WeakSet();
export function applyFileTransportPreflight(prepared,transport){
  if(museFileTransports.has(transport)&&prepared.preflight.status!=='PASS'){
    const waived=prepared.preflight.blockers.filter(b=>b==='request_byte_limit'||b==='call_cap_below_conservative_request_estimate');
    const remaining=prepared.preflight.blockers.filter(b=>!waived.includes(b));
    if(waived.length)prepared.preflight={status:remaining.length?'HOLD':'PASS',blockers:remaining,waived_for_file_transport:waived};
  }
  return prepared;
}
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

// Section scope of an accepted task, from its identity (config.section_ids). Run-level tasks (15 sources, 19 learning loop) have
// none. The two 16.compile tasks accepted before section scoping (2026-10-27 <19:10Z) carry none either but ARE Section 9's.
const LEGACY_UNSCOPED_COMPILE_SECTION=['sec09-rules-of-the-road'];
export function taskSectionIds(task){
  try{const raw=task.identity_json??task.identity??null;const identity=typeof raw==='string'?JSON.parse(raw):raw;const ids=identity?.config?.section_ids;if(Array.isArray(ids)&&ids.length)return ids;}catch{}
  return task.stage_id==='16.compile'?LEGACY_UNSCOPED_COMPILE_SECTION:[];
}
const sectionKey=ids=>JSON.stringify([...(ids||[])].sort());
// Source revisions are an explicit parent chain. Receipt time/task hash only
// breaks ties between unrelated nonrevision registrations, never reverses it.
function sourceDescendsFrom(task,ancestor,snapshot,projectRoot,runDir,seen=new Set()){
  if(seen.has(task.task_id))throw new Error('Accepted source revision chain is cyclic.');
  seen.add(task.task_id);
  const raw=task.identity_json??task.identity??null,identity=typeof raw==='string'?JSON.parse(raw):raw;
  const parent=identity?.config?.source_revision?.previous_registry_ref;
  if(!parent)return false;
  const parentFile=inside(runDir,verifyRef(parent,projectRoot));
  const matches=(snapshot.tasks||[]).filter(t=>t.status==='accepted'&&t.stage_id===task.stage_id&&t.task_id!==task.task_id).filter(t=>{
    const main=(snapshot.artifacts||[]).find(a=>a.artifact_id===t.accepted_artifact_id);
    return main?.sha256===parent.sha256&&path.resolve(runDir,main.path)===parentFile;
  });
  if(!matches.length)throw new Error('Accepted source revision parent is not ledger accepted.');
  return matches.some(t=>t.task_id===ancestor.task_id||sourceDescendsFrom(t,ancestor,snapshot,projectRoot,runDir,new Set(seen)));
}
export function acceptedRuntimeRefs(snapshot,projectRoot,runDir,{sectionIds=null}={}){
  const out=[];
  // Latest accepted wins per (stage, section) (except 02, whose parts are deduped per part set by the compiler): a stage re-run
  // after a fix supersedes its earlier accepted artifact for downstream context (context forbids duplicate accepted kinds).
  // With sectionIds, only that section's scoped artifacts plus run-level ones are returned (per-section belt, 2026-10-27).
  const want=sectionIds?sectionKey(sectionIds):null;
  const latest=new Map();
  for(const task of snapshot.tasks||[]){
    if(task.status!=='accepted'||task.stage_id==='02.dossier_sections')continue;
    const k=task.stage_id+'@'+sectionKey(taskSectionIds(task)),prev=latest.get(k);
    const source=task.stage_id==='15.sources';
    if(!prev||(source&&sourceDescendsFrom(task,prev,snapshot,projectRoot,runDir))||(!(source&&sourceDescendsFrom(prev,task,snapshot,projectRoot,runDir))&&(String(task.updated_at)>String(prev.updated_at)||(String(task.updated_at)===String(prev.updated_at)&&task.task_id>prev.task_id))))latest.set(k,task);
  }
  for(const task of snapshot.tasks||[]){
    if(task.status!=='accepted')continue;
    const secs=taskSectionIds(task);
    if(want!==null&&secs.length&&sectionKey(secs)!==want)continue;
    if(task.stage_id!=='02.dossier_sections'&&latest.get(task.stage_id+'@'+sectionKey(secs))?.task_id!==task.task_id)continue;
    const main=(snapshot.artifacts||[]).find(a=>a.artifact_id===task.accepted_artifact_id);
    if(!main)throw new Error('Accepted task has no accepted artifact.');
    const outputFile=verifyRef(main,runDir),validationFile=verifyRef(main.validation_ref_json,runDir),acceptanceFile=verifyRef(main.acceptance_ref_json,runDir);
    const validation=read(validationFile),acceptance=read(acceptanceFile);
    if(validation.status!=='PASS'||acceptance.status!=='PASS'||validation.output_sha256!==main.sha256||acceptance.output_sha256!==main.sha256)throw new Error('Stale accepted artifact receipts.');
    // Native snapshot readers expose identity_json as either parsed data or SQL text.
    // The compiler consumes serialized identities to retain exact part-set history.
    const identity=task.identity_json??task.identity??null;
    const metadata={stage_id:task.stage_id,accepted:true,accepted_at:task.updated_at,task_id:task.task_id,artifact_id:main.artifact_id,
      identity:typeof identity==='string'?identity:JSON.stringify(identity),section_ids:secs,
      validation_ref:{...ref(main.validation_ref_json),path:validationFile},acceptance_ref:{...ref(main.acceptance_ref_json),path:acceptanceFile}};
    if(Array.isArray(validation.companions)){
      for(const companion of validation.companions||[]){const file=verifyRef(companion,runDir);out.push({...ref(companion),path:file,kind:companion.kind,...metadata});}
    }else out.push({...ref(main),path:outputFile,kind:task.stage_id,...metadata});
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

export function prepareDispatch({projectRoot,runConfigPath,executorId,stageId,sectionIds=[],partIds=[],go=false,approvalRef,nowUtc=new Date().toISOString(),snapshot=null,replacementRef=null}){
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
  const acceptedArtifacts=acceptedRuntimeRefs(snapshot,projectRoot,runDir,{sectionIds:sectionIds.length?sectionIds:null});
  const bindings=Object.fromEntries(Object.entries({overlay:'pilot-overrides-v0.4.0.json',policy:'source-fact-policy.json',media_disposition:'media-disposition.json',finish_criteria:'pilot-finish-criteria.json',prompt_authorship:'prompt-authorship.json'}).map(([k,name])=>[k,pin(path.join(projectRoot,'contracts',name))]));
  const assembled=assembleContext({projectRoot,runRoot:runDir,stageId,acceptedArtifacts,bindings,config,configRef,nowUtc,replacementRef,sectionIds,partIds});
  // Depth floor (run-config scope.depth_floor) rides in the validation context so 02.DEPTH_FLOOR can reject hollow envelopes.
  assembled.context.depth_floor=config.scope?.depth_floor??null;
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
  // Output conventions the owner's compensating checks enforce (schemas-strict/output-conventions.json) travel with the inputs,
  // so the generator is only graded on rules it was told. Added 2026-10-27 after JAM-UT-02's convention-mismatch HOLD.
  let outputConventions=null;try{const oc=read(path.join(projectRoot,'schemas-strict/output-conventions.json'));outputConventions=oc.stages?.[stageId]??null;}catch{}
  // Shape example: the stage's synthetic positive fixture (labelled SHAPE ONLY, synthetic content) steers strict-schema
  // output structure without supplying facts. Runner addition 2026-10-27 (founder full-run authority).
  let outputExample=null;try{const mp=read(path.join(projectRoot,stage.mapping));const pos=(mp.fixtures||[]).find(f=>f.expected_status==='PASS'&&/synthetic/.test(f.kind||''))||(mp.fixtures||[]).find(f=>f.expected_status==='PASS');if(pos){const ex=read(path.join(projectRoot,pos.path));delete ex._fixture;outputExample={note:'SHAPE EXAMPLE ONLY — synthetic placeholder content from a fixture; copy the STRUCTURE (keys, nesting, id styles, status enums), never the facts, names or numbers.',fixture:pos.path,example:ex};}}catch{}
  // Dossier parts per call (JAM-UT-03): the generator is asked for exactly these envelope section ids; role 16 merges later.
  const inputData={kind:'bound_task_inputs',stage_id:stageId,section_ids:sectionIds,assigned_dossier_parts:partIds.length?partIds:null,chunk_plan:partIds.length?{chunk_index:1,chunk_total:1,kind:assembled.replacement?.group?'complete_dossier':'partial_chunk'}:null,output_conventions:outputConventions,output_shape_example:outputExample,depth_floor:config.scope?.depth_floor??null,
    ...(assembled.context.accepted_replacement?{accepted_replacement:assembled.context.accepted_replacement}:{}),
    ...(assembled.replacement?.group?{complete_section_submission:{kind:assembled.replacement.receipt.kind,proof:assembled.replacement.receipt,
      accepted_targets:assembled.replacement.targets.map(r=>({ref:{path:r.path,sha256:r.sha256},artifact:read(r.path)})),
      metadata_projection:assembled.replacement.receipt.kind==='dependent_metadata_reconciliation'?groupBookkeeping(assembled.replacement):null,
      instructions:'Submit one complete_dossier containing all nine assigned parts. Keep preserved part payloads exact; only normalize merge_seq to the complete envelope. Follow the explicit proof, retain typed debt, and use the projected F/G content for dependency-only reconciliation. Registration and metadata receipts grant no factual audit acceptance.'}}:{}),
    // The ONE lineage block the output must echo (03 attempt 17:44Z copied the accepted dossier's own manifest hash instead).
    lineage_to_copy:{candidate_lineage_id:config.candidate_lineage_id,input_manifest_sha256:assembled.context.input_manifest_sha256,note:'copy these two values verbatim into your lineage / input_manifest_sha256 / candidate_lineage_id fields; hashes inside accepted_inputs belong to THOSE artifacts, not to this task'},
    // Flat {fact_id: accepted statement} for stages whose learner text must BYTE-EQUAL accepted wording (04 backs, 05 answers).
    accepted_fact_statements:assembled.context.fact_registry?.facts?Object.fromEntries(Object.entries(assembled.context.fact_registry.facts).map(([id,f])=>[id,f.spoken_statement??f.statement])):null,
    // Explicit node roster for 03 (sec06 attempt 21:06Z built nodes for kg_hints ids): exactly these ids are nodes; these are not.
    node_ids_required:assembled.context.fact_registry?.facts?Object.keys(assembled.context.fact_registry.facts):null,
    hint_ids_excluded:Object.keys(assembled.context.fact_registry?.kg_hints??{}),runtime_bindings:runtimeBindings,safe_run_config:assembled.context.safe_model_input?.model_input,accepted_inputs:sourceViews,source_registry:assembled.context.source_registry,page_map:assembled.context.page_map,selected_source_pages:selected.sections,source_policy:assembled.context.policy,pilot_overlay:assembled.context.overlay,instruction_templates:{master_sme:masterTemplate},missing_inputs:assembled.missing};
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
  return{projectRoot,runDir,config,configRef,stageId,roleId,sectionIds,partIds,executorId,nowUtc,go,policy,context:assembled.context,inputRefs:assembled.inputRefs,replacement:assembled.replacement,replacementRef:assembled.replacement?.ref??null,
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

// Keyed per stage + part + section so a HOLD on one section never renumbers another's tasks. Section-less keys (pre-scoping
// Section 9 entries) stay valid for sec09.
export function retryNonceKey(stageId,partIds=[],sectionIds=[]){const base=stageId+':'+(partIds||[]).join('+');const secs=[...(sectionIds||[])].sort();return secs.length&&!(secs.length===1&&secs[0]==='sec09-rules-of-the-road')?base+'@'+secs.join('+'):base;}
function retryNonce(p){const n=p.config.execution?.retry_nonces?.[retryNonceKey(p.stageId,p.partIds,p.sectionIds)];return Number.isInteger(n)&&n>0?{retry_nonce:n}:{};}

// ---- Muse Code subscription authoring (founder, 2026-10-27 23:20Z: "switch to muse authoring under subscription") ----
// The belt stays the foreman. It renders the exact bound request (prompt + inputs + strict schema) into a PACKET; Muse Code
// authors the artifact under its subscription (no Model API call, $0 on the credit); the belt ingests the artifact through the
// SAME client → validator → ledger path via a fetch-compatible file transport. Packets carry private handbook text, so they
// live under sources/private/ (gitignored). Nothing in the validators, ledger or acceptance policy changes.
export function authoringKey(stageId,sectionIds=[],partIds=[],nonce=0,replacementSha256=null){if(replacementSha256!==null&&!/^[a-f0-9]{64}$/.test(replacementSha256))throw new Error('Replacement authoring key requires an exact proof hash.');return [stageId,...[...(sectionIds||[])].sort(),(partIds||[]).join('+')||'-','n'+(nonce||0),...(replacementSha256?['r'+replacementSha256]:[])].join('__').replace(/[^A-Za-z0-9_.+@-]/g,'_');}
export function authoringPaths(runDir,key){const base=path.join(runDir,'sources','private','muse-authoring');return{base,inbox:path.join(base,'inbox',key+'.json'),outbox:path.join(base,'outbox',key+'.json'),done:path.join(base,'done'),next:path.join(base,'inbox','NEXT.json')};}
export function emitAuthoringPacket({previousNonPass=[],...options}){
  const p=prepareDispatch({...options,go:false});
  applyFileTransportPreflight(p,options.transport);
  if(options.replacementRef&&p.replacement?.status!=='PASS')return{status:'HOLD',key:null,inbox:null,outbox:null,blockers:p.preflight.blockers};
  const nonce=retryNonce(p).retry_nonce??0;
  const key=authoringKey(p.stageId,p.sectionIds,p.partIds,nonce,p.replacementRef?.sha256??null);
  const paths=authoringPaths(p.runDir,key);
  for(const d of [path.dirname(paths.inbox),path.dirname(paths.outbox),paths.done])fs.mkdirSync(d,{recursive:true});
  const rel=f=>path.relative(p.projectRoot,f).replace(/\\/g,'/');
  const packet={schema_version:'nova-muse-authoring-packet.v1',key,run_id:p.config.run_id,candidate_lineage_id:p.config.candidate_lineage_id,input_manifest_sha256:p.context.input_manifest_sha256,stage_id:p.stageId,section_ids:p.sectionIds,part_ids:p.partIds,retry_nonce:nonce,
    ...(p.replacementRef?{replacement_ref:p.replacementRef}:{}),
    authoring:{mode:'muse_code_subscription',model:p.config.producer.model,billing:'Muse Code subscription (operator tokens); no Model API call; ledger actual = $0',
      instructions:'You ARE the producer model for this request. Read request.messages exactly as the Model API would (system, then user). Obey request.response_format.json_schema.schema STRICTLY: every required key, no extra keys, exact enums and types. Obey the output_conventions and lineage_to_copy inside the user message. Every statement comes from the handbook text in the request; never invent. If previous_non_pass lists check ids, they failed on the last attempt: fix exactly those. Write the artifact as `artifact` in the outbox file named below, with this packet file\'s sha256 as packet_sha256.',
      write_outbox_to:rel(paths.outbox),
      outbox_shape:{key,packet_sha256:'<sha256 of this inbox file>',authored_by:'muse-code/'+p.config.producer.model+' (subscription)',artifact:'<JSON matching request.response_format.json_schema.schema>'}},
    previous_non_pass:previousNonPass,required_checks:p.requiredChecks,
    request:p.request,request_sha256:sha256(canonicalJson(p.request)),request_bytes:Buffer.byteLength(canonicalJson(p.request)),preflight:p.preflight,emitted_at:new Date().toISOString()};
  const body=JSON.stringify(packet,null,2)+'\n';
  fs.writeFileSync(paths.inbox,body);
  const packetSha=sha256(Buffer.from(body));
  fs.writeFileSync(paths.next,JSON.stringify({key,inbox:rel(paths.inbox),outbox:rel(paths.outbox),packet_sha256:packetSha,candidate_lineage_id:p.config.candidate_lineage_id,input_manifest_sha256:p.context.input_manifest_sha256,stage_id:p.stageId,section_ids:p.sectionIds,part_ids:p.partIds,retry_nonce:nonce,previous_non_pass:previousNonPass,required_checks:p.requiredChecks,emitted_at:packet.emitted_at},null,2)+'\n');
  return{status:p.preflight.status==='PASS'?'EMITTED':'HOLD',key,inbox:paths.inbox,outbox:paths.outbox,packet_sha256:packetSha,request_bytes:packet.request_bytes,blockers:p.preflight.blockers};
}
// THIN packets (v2, 2026-10-28 02:00Z, founder: "pdf to packet... how better can you do?"). Measured on Florida: a full packet is
// 232 KB of which source_registry (92 KB) + page_map (58 KB) + conventions/templates/example (32 KB) are IDENTICAL for every part
// of every section of the state, selected_source_pages (35 KB) is identical for every part of a section, and the per-part delta is
// ~3 KB. Muse is stateful within a launch, so: write the state layer once, the section layer once per section, and hand each part a
// few-KB packet that names both layers. The ingest path is unchanged (the belt re-renders the full request itself).
const STATE_LAYER_KEYS = ['source_registry', 'page_map', 'output_conventions', 'instruction_templates', 'pilot_overlay', 'output_shape_example', 'safe_run_config', 'source_policy'];
const SECTION_LAYER_KEYS = ['selected_source_pages', 'depth_floor'];
function writeLayerIfChanged(file, value) {
  const body = JSON.stringify(value, null, 1) + '\n';
  const next = sha256(Buffer.from(body));
  if (fs.existsSync(file) && sha256(fs.readFileSync(file)) === next) return { path: file, sha256: next, rewritten: false };
  fs.writeFileSync(file, body);
  return { path: file, sha256: next, rewritten: true };
}
export function emitThinPacket({ previousNonPass = [], ...options }) {
  const p = prepareDispatch({ ...options, go: false });
  applyFileTransportPreflight(p, options.transport);
  if (options.replacementRef && p.replacement?.status !== 'PASS') return {status: 'HOLD', key: null, inbox: null, outbox: null, blockers: p.preflight.blockers};
  const nonce = retryNonce(p).retry_nonce ?? 0;
  const key = authoringKey(p.stageId, p.sectionIds, p.partIds, nonce, p.replacementRef?.sha256 ?? null);
  const paths = authoringPaths(p.runDir, key);
  for (const d of [path.dirname(paths.inbox), path.dirname(paths.outbox), paths.done]) fs.mkdirSync(d, { recursive: true });
  const rel = (f) => path.relative(p.projectRoot, f).replace(/\\/g, '/');
  const inputData = p.renderingInputs.inputData;
  const stateLayer = { schema_version: 'nova-muse-context-layer.v2', layer: 'state', run_id: p.config.run_id,
    prompts: { [p.stageId]: p.rendered.messages[1].content }, response_formats: { [p.stageId]: p.request.response_format },
    inputData: Object.fromEntries(Object.entries(inputData).filter(([k]) => STATE_LAYER_KEYS.includes(k))) };
  const sectionLayer = { schema_version: 'nova-muse-context-layer.v2', layer: 'section', run_id: p.config.run_id, section_ids: p.sectionIds,
    inputData: Object.fromEntries(Object.entries(inputData).filter(([k]) => SECTION_LAYER_KEYS.includes(k))) };
  const delta = Object.fromEntries(Object.entries(inputData).filter(([k]) => !STATE_LAYER_KEYS.includes(k) && !SECTION_LAYER_KEYS.includes(k)));
  const inboxDir = path.dirname(paths.inbox);
  const stateRef = writeLayerIfChanged(path.join(inboxDir, 'CONTEXT-state.json'), stateLayer);
  const secRef = writeLayerIfChanged(path.join(inboxDir, `CONTEXT-${[...p.sectionIds].sort().join('+') || 'run'}.json`), sectionLayer);
  // Each stage's prompt/schema must be present in the state layer: merge on first sight of a new stage.
  if (!stateRef.rewritten) {
    const existing = JSON.parse(fs.readFileSync(stateRef.path, 'utf8'));
    if (!existing.prompts?.[p.stageId]) { existing.prompts[p.stageId] = stateLayer.prompts[p.stageId]; existing.response_formats[p.stageId] = stateLayer.response_formats[p.stageId]; Object.assign(stateRef, writeLayerIfChanged(stateRef.path, existing)); }
  }
  const packet = { schema_version: 'nova-muse-authoring-packet.v2-thin', key, run_id: p.config.run_id, candidate_lineage_id: p.config.candidate_lineage_id, input_manifest_sha256: p.context.input_manifest_sha256,
    stage_id: p.stageId, section_ids: p.sectionIds, part_ids: p.partIds, retry_nonce: nonce,
    ...(p.replacementRef ? {replacement_ref: p.replacementRef} : {}),
    layers: { state: { path: rel(stateRef.path), sha256: stateRef.sha256 }, section: { path: rel(secRef.path), sha256: secRef.sha256 } },
    assembly: 'full request = [system: delta.system_header] + [user: layers.state.prompts[stage_id]] + [user: canonical JSON of {...layers.state.inputData, ...layers.section.inputData, ...delta.inputData}]; response_format = layers.state.response_formats[stage_id]. Read the state layer once per launch and the section layer once per section; every part packet only changes delta.',
    delta: { system_header: p.rendered.messages[0].content, inputData: delta },
    authoring: { mode: 'muse_code_subscription', model: p.config.producer.model, billing: 'Muse Code subscription; no Model API call; ledger actual = $0',
      instructions: 'You ARE the producer model. Assemble the request as described in `assembly`, obey the response_format schema STRICTLY (every required key — including verification_debt, market_signal, g_matrix, external_review_requests, needs_dedicated_surface — no extra keys), obey output_conventions, copy delta.inputData.lineage_to_copy verbatim. Every statement comes from the section pages in the section layer; never invent. If previous_non_pass lists check ids, fix exactly those. Write ONLY the artifact JSON as `artifact` in the outbox named below.',
      write_outbox_to: rel(paths.outbox),
      outbox_shape: { key, packet_sha256: '<sha256 of this inbox file>', authored_by: 'muse-code/' + p.config.producer.model + ' (subscription)', artifact: '<JSON matching the response_format schema>' } },
    previous_non_pass: previousNonPass, required_checks: p.requiredChecks, request_sha256: sha256(canonicalJson(p.request)), full_request_bytes: Buffer.byteLength(canonicalJson(p.request)), preflight: p.preflight, emitted_at: new Date().toISOString() };
  const body = JSON.stringify(packet, null, 2) + '\n';
  fs.writeFileSync(paths.inbox, body);
  const packetSha = sha256(Buffer.from(body));
  fs.writeFileSync(paths.next, JSON.stringify({ packet_mode: 'thin', key, inbox: rel(paths.inbox), outbox: rel(paths.outbox), packet_sha256: packetSha, layers: packet.layers, candidate_lineage_id: p.config.candidate_lineage_id, input_manifest_sha256: p.context.input_manifest_sha256, stage_id: p.stageId, section_ids: p.sectionIds, part_ids: p.partIds, retry_nonce: nonce, previous_non_pass: previousNonPass, required_checks: p.requiredChecks, emitted_at: packet.emitted_at }, null, 2) + '\n');
  return { status: p.preflight.status === 'PASS' ? 'EMITTED' : 'HOLD', key, inbox: paths.inbox, outbox: paths.outbox, packet_sha256: packetSha, request_bytes: Buffer.byteLength(body), full_request_bytes: packet.full_request_bytes, layers: { state: stateRef, section: secRef }, blockers: p.preflight.blockers };
}
// Reads Muse's outbox for a key without throwing: {ok, reason, outbox}. The runner calls this BEFORE dispatching so a missing or
// malformed outbox never reaches the client (a transport throw would park the attempt as unknown_provider_result).
export function readAuthoringOutbox(runDir,key){
  const paths=authoringPaths(runDir,key);
  if(!fs.existsSync(paths.outbox))return{ok:false,reason:'outbox_absent',path:paths.outbox};
  let out;try{out=JSON.parse(fs.readFileSync(paths.outbox,'utf8'));}catch(e){return{ok:false,reason:'outbox_invalid_json:'+String(e.message).slice(0,80),path:paths.outbox};}
  if(out?.key!==key)return{ok:false,reason:'outbox_key_mismatch:'+String(out?.key),path:paths.outbox};
  if(!out.artifact||typeof out.artifact!=='object'||Array.isArray(out.artifact))return{ok:false,reason:'outbox_no_artifact_object',path:paths.outbox};
  return{ok:true,outbox:out,path:paths.outbox};
}
// fetch-compatible transport answering the bound request from the outbox (Model API response shape; usage 0 → ledger actual $0).
// Never throws (a throw = "may have reached the provider"); a bad outbox answers 422 with zero usage → HOLD http_status_not_200.
export function museFileTransport({runDir,key}){
  const transport=async function transport(_url,init){
    const zero={prompt_tokens:0,completion_tokens:0,total_tokens:0};
    const got=readAuthoringOutbox(runDir,key);
    if(!got.ok){const text=JSON.stringify({error:{message:got.reason,type:'muse_outbox_unusable'},usage:zero,model:null});return{status:422,ok:false,headers:{get:()=>null},text:async()=>text};}
    const raw=fs.readFileSync(got.path);const req=JSON.parse(init.body);
    const body={id:'musecode-'+sha256(raw).slice(0,24),object:'chat.completion',created:Math.floor(Date.now()/1000),model:req.model,
      choices:[{index:0,finish_reason:'stop',message:{role:'assistant',content:JSON.stringify(got.outbox.artifact)}}],usage:zero,
      billing:{mode:'muse_code_subscription',authored_by:got.outbox.authored_by??'muse-code (subscription)',packet_sha256:got.outbox.packet_sha256??null,outbox_sha256:sha256(raw),model_api_called:false,credit_usd:0}};
    const text=JSON.stringify(body);
    return{status:200,ok:true,headers:{get:()=>null},text:async()=>text};
  };
  museFileTransports.add(transport);
  return transport;
}

export async function executePreparedDispatch({prepared:p,ledger,fence,lockHandle,client,validator=validateArtifact}){
  const validateBound=async artifact=>{
    const validation=await validator({stage_id:p.stageId,artifact,context:p.context});
    if(!p.replacement?.group)return validation;
    const guard=validateSourceGroupCandidate({artifact,inspection:p.replacement});
    return{...validation,status:guard.status==='PASS'?validation.status:'FAIL',checks:[...validation.checks,{check_id:'02.GROUP_SUPERSESSION',status:guard.status,evidence:guard.reason??'Complete section preserves exact proof scope and dependency constraints.'}]};
  };
  if(p.preflight.status!=='PASS')throw new Error('Dispatch inputs remain HOLD: '+p.preflight.blockers.join(', '));
  for(const bound of [...(p.inputRefs||[]),p.contract,p.schema,p.mapping,p.registryRef,p.pricingRef,p.validatorRef,p.ownerReceiptRef,...(p.ownerFiles||[])].filter(r=>r?.path)){
    const bytes=fs.readFileSync(path.resolve(p.projectRoot,bound.path));
    if(sha256(bytes)!==bound.sha256)throw new Error('Bound input/tool changed before dispatch: '+bound.path);
  }
  if(p.replacementRef){
    if(!(p.inputRefs||[]).some(r=>r.kind==='accepted02_replacement_proof'&&r.sha256===p.replacementRef.sha256&&path.resolve(p.projectRoot,r.path)===path.resolve(p.projectRoot,p.replacementRef.path)))return{status:'HOLD',reason:'accepted02_replacement_proof_not_bound',new_model_calls:0};
    // Re-resolve against the held native ledger: a superseding acceptance between
    // rendering and lock acquisition must never authorize another submission.
    const replacement=inspectAccepted02Replacement({projectRoot:p.projectRoot,runDir:p.runDir,runId:fence.runId,stageId:p.stageId,sectionIds:p.sectionIds,partIds:p.partIds,
      acceptedArtifacts:acceptedRuntimeRefs(ledger.snapshot(fence.runId),p.projectRoot,p.runDir,{sectionIds:p.sectionIds}),replacementRef:p.replacementRef,nowUtc:p.nowUtc});
    if(replacement.status!=='PASS')return{status:'HOLD',reason:'accepted02_replacement_proof',blockers:replacement.blockers,new_model_calls:0};
    if(replacement.acceptedReplacement){
      const prior=ledger.getTask(replacement.acceptedReplacement.task_id);
      return{...await runArtifactTask({ledger,fence,lockHandle,runDir:p.runDir,task:prior,requiredChecks:p.requiredChecks}),new_model_calls:0,replacement_ref:p.replacementRef};
    }
  }
  const task=ledger.ensureTask(fence,{lineageId:p.config.candidate_lineage_id,stageId:p.stageId,roleId:p.roleId,inputs:p.inputRefs,
    versions:{contract:p.contract.sha256,schema:p.schema.sha256,mapping:p.mapping.sha256,prompt:p.rendered.hashes.template_body_sha256,header:p.rendered.hashes.header_template_sha256,registry:p.registryRef.sha256,validator:p.validatorRef?.sha256??null,validator_closure:sha256(canonicalJson(p.ownerFiles||[]))},model:p.config.producer.model,config:{section_ids:p.sectionIds,dossier_parts:p.partIds??[],generation:{max_completion_tokens:p.request.max_completion_tokens,reasoning_effort:p.request.reasoning_effort},
    // Runner retry nonce (2026-10-27, standing authority): a HOLD leaves the logical task `blocked` for good; the runner retries by
    // minting a NEW logical task keyed per stage+part (run-config execution.retry_nonces). Absent/0 → identity unchanged.
    ...retryNonce(p),...(p.replacementRef?{replacement_ref:p.replacementRef}:{})},maxAttempts:p.config.limits.max_automatic_attempts_per_logical_task});
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
    const result=await runArtifactTask({ledger,fence,lockHandle,runDir:p.runDir,task,produce:()=>{throw Error('Recovery cannot remint content.');},validate:validateBound,requiredChecks:p.requiredChecks,accept:(_,{validation})=>p.stageId==='02.dossier_sections'?acceptDossier(validation,p.requiredChecks):{status:'HOLD'},validationRevision:'recovery-'+sha256(canonicalJson({generation:fence.generation,now:p.nowUtc})).slice(0,16)});
    return{...result,new_model_calls:0,recovery_ref:proofRef};
  }
  const attempt=ledger.startAttempt(fence,{taskId,commandId:'dispatch:'+taskId+':'+(old.length+1)}),attemptId=attempt.attemptId??attempt.attempt_id;
  const folder='artifacts/'+taskId+'/'+attemptId;
  // A refused reservation (role/total budget cap) must fail the attempt here, never leave it `running` (sec07 C2, 2026-10-27:
  // BUDGET_CAP_EXCEEDED thrown out of the dispatcher stranded the attempt and SEQUENTIAL_TASK_BUSY cascaded over 9 sections).
  let reservation;
  try{reservation=ledger.reserveBudget(fence,{attemptId,provider:'meta',roleId:p.roleId,maxUsd:p.config.limits.max_call_usd,pricingRef:p.pricingRef,approvalRef:p.policy.approval_ref,approvalUsdCeiling:p.policy.caps.approval_usd});}
  catch(error){
    const failure=writeImmutable(p.runDir,folder+'/reservation-refused.json',{status:'failed_pre_send',reason:'budget_cap',error_message:String(error.message).slice(0,400),money_spent_usd:0},{lockHandle});
    ledger.failAttempt(fence,{attemptId,status:'failed',errorRef:failure});
    return{status:'HOLD',reason:'budget_cap',detail:String(error.message).slice(0,200),raw_ref:failure,new_model_calls:0};
  }
  const reservationId=reservation.reservationId??reservation.reservation_id;
  const reservationRef=writeImmutable(p.runDir,folder+'/reservation.json',reservation,{lockHandle});
  const bound=renderRequest({...p.renderingInputs,bindings:{...p.rendered.header,render_only:false,execution_authorized:true,task:{...p.rendered.header.task,logical_task_id:taskId,attempt_id:attemptId,budget_reservation_ref:reservationRef.path,budget_reservation_sha256:reservationRef.sha256}}});
  const request={...p.request,messages:bound.messages},requestHash=sha256(canonicalJson(request));
  const savedRequest=writeImmutable(p.runDir,'sources/private/requests/'+attemptId+'.json',request,{lockHandle});
  const envelopeRef=writeImmutable(p.runDir,folder+'/request-envelope.json',{header:bound.header,hashes:bound.hashes,request_sha256:requestHash,request_ref:ref(savedRequest),stage_id:p.stageId,section_ids:p.sectionIds,inputs:p.inputRefs,contract:p.contract,schema:p.schema,mapping:p.mapping,registry:p.registryRef,reservation_id:reservationId,executor_id:p.executorId,...(p.replacementRef?{replacement_ref:p.replacementRef}:{})},{lockHandle});
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
    const failure=writeImmutable(p.runDir,folder+'/provider-unknown.json',{status:'unknown_provider_result',error_code:error.code||'UNKNOWN_PROVIDER_RESULT',request_sha256:requestHash,cause_name:error.cause_name??null,cause_message:error.cause_message??null,elapsed_ms:error.elapsed_ms??null,timeout_ms:error.timeout_ms??null},{lockHandle});
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
      validate:validateBound,requiredChecks:p.requiredChecks,
      // Pilot acceptance = deterministic validation only, every stage (auditors 07/08 pending — the pilot has no audit executor).
      // Before 2026-10-27 17:50Z only 02 could be accepted; 03+ were hard-held `acceptance_policy_pending` (03 attempt 19de30b5
      // passed 24/24 checks and was still blocked). Opened under the founder's standing authority for the full Utah run.
      accept:(_value,{validation})=>acceptDossier(validation,p.requiredChecks)});
    return{...accepted,raw_ref:raw,call_receipt:callReceipt,estimated_usd:cost};
  }catch(error){const failure=writeImmutable(p.runDir,folder+'/artifact-error.json',{status:'HOLD',reason:error.message,call_receipt:ref(callReceipt)},{lockHandle});ledger.failAttempt(fence,{attemptId,status:'blocked',errorRef:failure});return{status:'HOLD',reason:'artifact_or_validation_error',error_ref:failure,raw_ref:raw};}
}

export async function dispatchStage(options){
  const prepared=prepareDispatch(options);
  if(!options.go)return{status:'DRY_DISPATCH_ENVELOPE',stage_id:prepared.stageId,section_ids:prepared.sectionIds,mode:prepared.rendered.header.mode,render_only:true,hashes:prepared.rendered.hashes,adapter_sha256:prepared.schema.sha256,request_sha256:prepared.request_sha256,max_completion_tokens:prepared.request.max_completion_tokens,reasoning_effort:prepared.request.reasoning_effort,proposed_reservation:prepared.proposed_reservation,preflight:prepared.preflight,approval_policy:prepared.policy,model_calls:0};
  assertDispatchAllowed({projectRoot:prepared.projectRoot,config:prepared.config,runDir:prepared.runDir,go:true,mode:'live',stageId:prepared.stageId,sectionIds:prepared.sectionIds,approvalRef:prepared.policy.approval_ref,nowUtc:prepared.nowUtc,maxUsd:prepared.config.limits.max_call_usd});
  // Capture once: an accessor must not swap transports after the identity check.
  const transport=options.transport;
  applyFileTransportPreflight(prepared,transport);
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
    const client=createMetaClient({...options,projectRoot:prepared.projectRoot,config:prepared.config,runDir:prepared.runDir,go:true,mode:'live',stageId:prepared.stageId,sectionIds:prepared.sectionIds,approvalRef:prepared.policy.approval_ref,nowUtc:prepared.nowUtc,maxUsd:prepared.config.limits.max_call_usd,transport});
    return await executePreparedDispatch({prepared,ledger,fence,lockHandle,client});
  }finally{if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}
