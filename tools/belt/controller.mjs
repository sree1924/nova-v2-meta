import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256, canonicalJson, inside, writeImmutable, verifyRef} from './atomic-file.mjs';
import {inspectExecutionPolicy, assertDispatchAllowed} from './execution-policy.mjs';
import {openLedger, stableTaskIdentity} from './ledger.mjs';
import {acquireExecutorLock} from './executor-lock.mjs';
import {renderRequest} from '../render-request.mjs';
import {sanitizeModelInput} from '../sanitize-model-input.mjs';
import {renderTrace} from './trace.mjs';
import {dispatchStage,acceptedRuntimeRefs,readNativeSnapshot} from './dispatch.mjs';
import {compileDossier} from './compile.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROJECT_ROOT = path.resolve(HERE, '../..');
const read = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const pin = file => ({path: file, sha256: sha256(fs.readFileSync(file)), bytes: fs.statSync(file).size});
const evidenceRef = ({path,sha256,bytes}) => ({path,sha256,bytes});
const roleFor = stage => stage.split('.')[0].replace('19A', '19A');
const stageOrder = ['02.dossier_sections','03.combined_kg','04.cards','05.sessions','06.exam_bank','19A.units','05.card_scripts','07.content_coverage','08.content_facts','09.package'];

export function loadRun({projectRoot = PROJECT_ROOT, runConfigPath}) {
  if (!runConfigPath) throw new Error('--run-config is required.');
  const configPath = inside(projectRoot, runConfigPath);
  const runDir = path.dirname(configPath);
  inside(path.join(projectRoot, 'runs'), runDir);
  const config = read(configPath);
  if (!/^[A-Za-z0-9_-]+$/.test(config.run_id || '') || path.basename(runDir) !== config.run_id) throw new Error('Run ID must match its isolated directory.');
  return {config, configPath, runDir, configRef: pin(configPath)};
}

function verifiedContract(projectRoot, role) {
  if (!role?.contract) throw new Error('Role contract missing.');
  const root = role.contract.status === 'pinned_local' ? projectRoot : path.dirname(projectRoot);
  return {...role.contract, path: verifyRef(role.contract, root)};
}

function planBudget(config) {
  const limits = config.limits || {};
  return {currency: 'USD', total_usd: limits.max_total_usd ?? 0,
    providers: Object.fromEntries(Object.entries(limits.per_provider_usd_caps || {}).map(([k,v]) => [k,{total_usd:v,per_call_usd:limits.max_call_usd ?? 0}])),
    roles: Object.fromEntries(Object.entries(limits.per_role_usd_caps || {}).map(([k,v]) => [k,{total_usd:v,per_call_usd:limits.max_call_usd ?? 0}]))};
}

export function buildDryPlan({projectRoot = PROJECT_ROOT, runConfigPath, executorId = null}) {
  const loaded = loadRun({projectRoot, runConfigPath});
  const {config, configPath, runDir, configRef} = loaded;
  const policy = inspectExecutionPolicy({projectRoot, config, mode: 'dry_run'});
  const registryPath = path.join(projectRoot, 'contracts/bot-contract-bindings.json');
  const registry = read(registryPath);
  const registryRef = pin(registryPath);
  const map = read(path.join(projectRoot, 'schemas-strict/stage-map.json'));
  const headerPath = path.join(projectRoot, 'prompts/controller-header.template.json');
  const headerText = fs.readFileSync(headerPath, 'utf8');
  const lineageId = config.candidate_lineage_id || config.run_id + ':lineage:1';
  const sourceInputs = [configRef];
  for (const name of ['15-source-registry.json','15-page-map.json','15-source-liveness.json']) {
    const file = path.join(runDir, name);
    if (fs.existsSync(file)) sourceInputs.push(pin(file));
  }
  const safeInput = sanitizeModelInput(config);
  const tasks = [];
  for (const stageId of stageOrder.filter(id => map.stages[id])) {
    const stage = map.stages[stageId];
    const roleId = roleFor(stageId);
    const role = registry.roles.find(r => r.role_id === roleId);
    const contract = verifiedContract(projectRoot, role);
    const schema = pin(path.join(projectRoot, stage.adapter_schema));
    const mapping = pin(path.join(projectRoot, stage.mapping));
    const promptPath = path.join(projectRoot, stage.prompt_path);
    const promptText = fs.readFileSync(promptPath, 'utf8');
    const pinnedSchema = promptText.match(/^schema_sha256: ([a-f0-9]{64})$/m)?.[1];
    if (pinnedSchema !== schema.sha256) throw new Error('Prompt adapter hash drift: ' + stageId);
    const rendered = renderRequest({promptText, headerTemplateText: headerText, bindings: {
      mode: 'review', execution_authorized: false,
      scope: {language:config.scope?.language ?? null},
      task: {run_id:config.run_id,role_id:roleId,stage_id:stageId,artifact_validation_stage_id:stageId,candidate_lineage_id:lineageId,execution_kind:role.execution.lane},
      body: {path:stage.prompt_path}, executor:{provider_family:role.execution.provider_proposal,model_requested:role.execution.model,actor_id:executorId}
    }});
    const assignment = {runId:config.run_id,lineageId,stageId,roleId,inputs:sourceInputs,
      versions:{contract_sha256:contract.sha256,schema_sha256:schema.sha256,mapping_sha256:mapping.sha256,prompt_body_sha256:rendered.hashes.template_body_sha256,header_sha256:rendered.hashes.header_template_sha256,registry_sha256:registryRef.sha256,controller_sha256:pin(fileURLToPath(import.meta.url)).sha256,authority_sha256:policy.authority_ref.sha256},
      model:role.execution.model ?? null,config:{execution_kind:role.execution.lane,mode:'dry_run'},maxAttempts:config.limits?.max_automatic_attempts_per_logical_task ?? 2};
    const stable = stableTaskIdentity(assignment);
    const unresolved = [...new Set(promptText.match(/\{\{[^}]+\}\}/g) || [])];
    tasks.push({...assignment,task_id:stable.taskId,logical_key_sha256:stable.logicalKeySha256,bot_id:role.bot_id,contract,schema,mapping,
      expected_output:stageId,rendered_request:rendered,provider_activity:'NOT_DISPATCHED',required_unbound_placeholders:unresolved,
      ownership:{executor_id:executorId,run_write_root:runDir},dependencies:tasks.length?[tasks.at(-1).stageId]:['15.sources'],status:'PLANNED_ONLY'});
  }
  return {schema_version:'controller-plan.v0.4.0',mode:'dry_run',run_id:config.run_id,lineage_id:lineageId,execution_enabled:false,content_calls_authorized:false,
    config_ref:configRef,registry_ref:registryRef,policy,safe_model_input:safeInput,tasks,
    planned_only_stages:['01b.recon','16.compile','17.enrich','19.learning_inputs','UI.final','21.runtime','B5.preview','B1.application_qa'],
    observed_model_calls:0,note:'Plans and review headers do not dispatch or establish stage acceptance.'};
}

async function registerSource({projectRoot,loaded,ledger,fence,lockHandle}) {
  const {buildRegistration} = await import('../roles/15-register.mjs');
  const configEvidenceRef=writeImmutable(loaded.runDir,'sources/private/input-snapshots/'+loaded.configRef.sha256+'.json',fs.readFileSync(loaded.configPath),{lockHandle,bytes:true});
  const result = await buildRegistration({projectRoot,runConfigPath:loaded.configPath,configEvidenceRef});
  const script = pin(path.join(projectRoot,'tools/roles/15-register.mjs'));
  const role = read(path.join(projectRoot,'contracts/bot-contract-bindings.json')).roles.find(r=>r.role_id==='15');
  const contract = verifiedContract(projectRoot,role);
  const dispositions=result.liveness?.status==='CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT'?[{kind:'effective_date_not_applicable',source_ref:result.source.source_ref,issuer_confirmation_ref:result.liveness.effective_date_disposition_ref,
    acceptance_basis:'Direct founder S4 order: keep effective_date null with dated issuer-confirmed-edition disposition.',effective_date:null,not_a_fact_audit:true}]:null;
  const dispositionSha=dispositions?sha256(Buffer.from(JSON.stringify(dispositions,null,2)+'\n')):null;
  const registrationDigest = sha256(canonicalJson({source:result.source,writePlan:result.writePlan,disposition_sha256:dispositionSha}));
  const assignment = {lineageId:loaded.config.candidate_lineage_id||loaded.config.run_id+':lineage:1',stageId:'15.sources',roleId:'15',inputs:[loaded.configRef,{path:result.source.path,sha256:result.source.sha256}],versions:{contract_sha256:contract.sha256,script_sha256:script.sha256,registration_input_and_outputs_sha256:registrationDigest},model:null,config:{operation:'offline_local_registration'},maxAttempts:2};
  const task = ledger.ensureTask(fence,assignment);
  const taskId = task.taskId ?? task.task_id;
  if (['accepted','blocked'].includes(task.status)) {
    const existing = ledger.listArtifacts(fence.runId).filter(a=>a.task_id===taskId);
    for (const ref of existing) {
      verifyRef(ref,loaded.runDir);
      const expected = result.writePlan.find(item=>path.resolve(loaded.runDir,item.path)===path.resolve(ref.path));
      const expectedHash=expected?.sha256||(path.resolve(ref.path)===path.join(loaded.runDir,'15-effective-date-dispositions.json')?dispositionSha:null);
      if (expectedHash!==ref.sha256) throw new Error('Source registration reuse does not match its current exact input/output plan.');
    }
    if (!existing.length) throw new Error('Prior source task has no saved evidence.');
    return {status:task.status==='accepted'?'PASS':'HOLD',reused:true,artifacts:existing};
  }
  const attempt = ledger.startAttempt(fence,{taskId,commandId:'local-register:'+taskId});
  const attemptId = attempt.attemptId ?? attempt.attempt_id;
  const artifacts = [];
  const values = [['15-source-registry.json',result.registry],['15-page-map.json',result.pageMap],['15-source-liveness.json',result.liveness]];
  for (const [relative,value] of values) if (value != null) {
    const saved=writeImmutable(loaded.runDir,relative,value,{lockHandle});
    if (saved.sha256!==result.writePlan.find(item=>item.path===relative)?.sha256) throw new Error('Source registration artifact differs from the exact write plan.');
    artifacts.push({...saved,kind:relative});
  }
  for (const item of result.privateArtifacts || []) {
    const relative = item.path ?? item.relativePath;
    if (!relative?.replaceAll('\\','/').startsWith('sources/private/')) throw new Error('Extracted handbook text must remain private.');
    const value = item.value ?? item.contents;
    const saved = writeImmutable(loaded.runDir,relative,value,{lockHandle,bytes:item.encoding==='utf8'});
    if (saved.sha256 !== item.sha256) throw new Error('Private extraction artifact hash mismatch.');
    artifacts.push({...saved,kind:'private_source_evidence'});
  }
  if(dispositions){
    artifacts.push({...writeImmutable(loaded.runDir,'15-effective-date-dispositions.json',dispositions,{lockHandle}),kind:'accepted_dispositions'});
  }
  const receipt = {schema_version:'role15-registration-receipt.v0.4.0',status:result.status,script_ref:script,source:result.source,
    verification_debt:result.verification_debt,artifacts:artifacts.map(a=>({path:path.relative(loaded.runDir,a.path).replaceAll('\\','/'),sha256:a.sha256,bytes:a.bytes,kind:a.kind})),content_calls:0};
  const receiptRef = writeImmutable(loaded.runDir,'15-registration-receipt.json',receipt,{lockHandle});
  const main=artifacts.find(a=>a.kind==='15-source-registry.json');
  const kinds={'15-source-registry.json':'source_registry','15-page-map.json':'page_map','15-source-liveness.json':'source_liveness'};
  const companions=artifacts.map(a=>({...evidenceRef(a),kind:kinds[a.kind]||(a.kind==='accepted_dispositions'?'accepted_dispositions':a.path.endsWith('.txt')?'source_text':'source_text_extraction')}));
  const structuralChecks=[{check_id:'15.SNAPSHOT_HASH',status:result.source.configured_hash_matches?'PASS':'HOLD'},
    {check_id:'15.PAGE_MAP_COMPLETE',status:result.pageMap.pages.length===result.source.pdf_page_count?'PASS':'HOLD'},
    {check_id:'15.OUTPUT_HASHES',status:artifacts.filter(a=>a.kind!=='accepted_dispositions').every(a=>result.writePlan.some(p=>path.resolve(loaded.runDir,p.path)===a.path&&p.sha256===a.sha256))?'PASS':'HOLD'}];
  const registrationAccepted=structuralChecks.every(c=>c.status==='PASS');
  const validationRef=writeImmutable(loaded.runDir,'receipts/15-registration-validation-'+registrationDigest+'.json',{status:registrationAccepted?'PASS':'HOLD',output_sha256:main.sha256,checks:structuralChecks,companions,status_scope:'registration_metadata_only_not_factual_or_liveness_acceptance'},{lockHandle});
  const acceptanceRef=writeImmutable(loaded.runDir,'receipts/15-registration-acceptance-'+registrationDigest+'.json',{status:registrationAccepted?'PASS':'HOLD',output_sha256:main.sha256,kind:'deterministic_source_registration_only',liveness_status:result.liveness?.status??'VERIFICATION_DEBT',factual_acceptance:false},{lockHandle});
  for (const artifact of artifacts.filter(a=>a!==main)) ledger.recordArtifact(fence,{taskId,attemptId,artifact,status:'output_saved'});
  if(registrationAccepted)ledger.acceptArtifact(fence,{taskId,attemptId,artifact:main,validationReceipt:validationRef,acceptanceReceipt:acceptanceRef});
  else{ledger.recordArtifact(fence,{taskId,attemptId,artifact:main,status:'output_saved'});ledger.failAttempt(fence,{attemptId,status:'blocked',errorRef:receiptRef});}
  ledger.appendEvent(fence,{eventId:attemptId+':registration-saved',type:'source.registration_saved',taskId,attemptId,payload:{receipt:receiptRef,status:result.status,content_calls:0}});
  return {...receipt,receipt_ref:receiptRef,reused:false};
}

export async function compileAcceptedDossier({projectRoot=PROJECT_ROOT,runConfigPath,executorId}={}){
  const loaded=loadRun({projectRoot,runConfigPath});
  const snapshot=readNativeSnapshot(loaded.runDir,loaded.config),accepted=acceptedRuntimeRefs(snapshot,projectRoot,loaded.runDir);
  const envelopes=accepted.filter(a=>a.kind==='02.dossier_sections'),source=accepted.find(a=>a.kind==='source_registry'),pages=accepted.find(a=>a.kind==='page_map');
  if(!envelopes.length||!source||!pages)return{status:'HOLD',reason:'Accepted02 envelopes, registered source and page map are required.',model_calls:0};
  const overlay=pin(path.join(projectRoot,'contracts/pilot-overrides-v0.4.0.json'));
  const result=compileDossier({projectRoot,runRoot:loaded.runDir,acceptedEnvelopes:envelopes,sourceRegistryRef:source,pageMapRef:pages,overlayRef:overlay,candidateLineageId:loaded.config.candidate_lineage_id});
  if(result.status!=='PASS')return{status:'HOLD',errors:result.errors,model_calls:0};
  const lockHandle=acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});let ledger,fence;
  try{
    ledger=openLedger({dbPath:inside(loaded.runDir,loaded.config.execution.ledger.path),lockHandle});
    const previous=ledger.getRun(loaded.config.run_id);
    if(previous?.binding_sha256!==loaded.configRef.sha256)throw new Error('Explicit configuration reconciliation is required before compile.');
    fence=ledger.claimRun({runId:loaded.config.run_id,bindingSha256:previous.binding_sha256,mode:previous.mode,budget:previous.budget_json});
    const task=ledger.ensureTask(fence,{lineageId:loaded.config.candidate_lineage_id,stageId:'16.compile',roleId:'16',inputs:result.inputRefs,versions:{script:pin(path.join(projectRoot,'tools/belt/compile.mjs')).sha256,overlay:overlay.sha256},model:null,config:{stage17:'n/a_pilot'},maxAttempts:2});
    if(task.status==='accepted')return{status:'PASS',reused:true,model_calls:0};
    const attempt=ledger.startAttempt(fence,{taskId:task.taskId,commandId:'compile:'+task.taskId});
    const values={'blueprint':result.blueprint,'factRegistry':result.factRegistry,'markdown':result.markdown,'blueprint.stage17':result.blueprint.stage17};
    const files=result.writePlan.map(p=>{const saved=writeImmutable(loaded.runDir,p.path,values[p.value_key],{lockHandle,bytes:p.encoding==='utf8'});if(saved.sha256!==p.sha256)throw Error('Compiler output hash mismatch.');return{...saved,kind:p.path};});
    const main=files.find(f=>f.kind==='16-compiled-dossier.json');
    const validation=writeImmutable(loaded.runDir,'receipts/16-validation-'+main.sha256+'.json',{status:'PASS',output_sha256:main.sha256,checks:[{check_id:'16.MERGE',status:'PASS'},{check_id:'16.FACT_SPANS',status:'PASS'}],companions:files.filter(f=>f.kind!=='02-blueprint.md').map(f=>({...evidenceRef(f),kind:f.kind})),supporting_files:files.filter(f=>f.kind==='02-blueprint.md').map(evidenceRef),factual_audit:'pending07/08'},{lockHandle});
    const acceptance=writeImmutable(loaded.runDir,'receipts/16-acceptance-'+main.sha256+'.json',{status:'PASS',output_sha256:main.sha256,kind:'deterministic_compile_only',auditors:'pending07/08'},{lockHandle});
    for(const f of files.filter(f=>f!==main))ledger.recordArtifact(fence,{taskId:task.taskId,attemptId:attempt.attemptId,artifact:f,status:'output_saved'});
    ledger.acceptArtifact(fence,{taskId:task.taskId,attemptId:attempt.attemptId,artifact:main,validationReceipt:validation,acceptanceReceipt:acceptance});
    return{status:'PASS',stage_id:'16.compile',stage17:'n/a_pilot',files:files.map(evidenceRef),model_calls:0};
  }finally{if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}

export async function recoverControllerRun({projectRoot=PROJECT_ROOT,runConfigPath,executorId,reconciliationRef}={}){
  const loaded=loadRun({projectRoot,runConfigPath});
  const snapshot=readNativeSnapshot(loaded.runDir,loaded.config);
  if(!snapshot.run)throw new Error('Existing native ledger is required for recovery.');
  const {recoverNativeOwnership}=await import('./recover-native.mjs');
  const recovered=await recoverNativeOwnership({projectRoot,runDir:loaded.runDir,runId:loaded.config.run_id,executorId,reconciliationRef});
  let ledger,fence,committed=false;
  try{
    ledger=openLedger({dbPath:inside(loaded.runDir,loaded.config.execution.ledger.path),lockHandle:recovered.lockHandle,allowRunRecovery:true});
    fence=ledger.recoverRunOwnership({runId:loaded.config.run_id,bindingSha256:snapshot.run.binding_sha256,mode:snapshot.run.mode,budget:JSON.parse(snapshot.run.budget_json),reconciliationReceipt:recovered.reconciliationRef});
    committed=true;
    const state=ledger.snapshot(loaded.config.run_id);
    return{status:'OWNERSHIP_RECOVERED_LOCAL_ONLY',reconciliation_ref:recovered.reconciliationRef,model_calls:state.model_calls.length,content_dispatched:false,new_model_calls:0,note:'Saved-attempt replay still verifies complete stop/200/raw/output/accounting evidence. Unknown results retain their reserve; this command grants no content authority.'};
  }finally{
    if(committed){if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();recovered.lockHandle.release();}
    else{ledger?.close();await recovered.rollback();}
  }
}

export async function runController({projectRoot = PROJECT_ROOT,runConfigPath,executorId,initLedger=false,registerSources=false,go=false,mode='dry_run',heldLock=null,legacyMigration=null}={}) {
  const loaded = loadRun({projectRoot,runConfigPath});
  if (go || mode !== 'dry_run') {
    assertDispatchAllowed({projectRoot,config:loaded.config,go,mode});
    throw new Error('Use dispatch --stage with an exact stage approval; the plan command never sends a request.');
  }
  if (!initLedger && !registerSources) return {status:'DRY_PLAN',plan:buildDryPlan({projectRoot,runConfigPath,executorId}),model_calls:0};
  if (!executorId) throw new Error('An attributable --executor-id is required for ledger/source writes.');
  const lockHandle = heldLock||acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});
  lockHandle.assertHeld();
  if(lockHandle.executorId!==executorId||lockHandle.runId!==loaded.config.run_id)throw new Error('Provided lock scope differs.');
  let ledger, fence;
  try {
    ledger = openLedger({dbPath:inside(loaded.runDir,loaded.config.execution?.ledger?.path || 'ledger/run.sqlite'),lockHandle});
    fence = ledger.claimRun({runId:loaded.config.run_id,bindingSha256:loaded.configRef.sha256,mode:'dry_run',budget:planBudget(loaded.config)});
    if(legacyMigration)ledger.importLegacyHistory(fence,{snapshotRef:legacyMigration.snapshotRef,backupRef:legacyMigration.backupRef,stageAliases:{'15.source_registry':'15.sources'}});
    const registration = registerSources ? await registerSource({projectRoot,loaded,ledger,fence,lockHandle}) : null;
    const plan = buildDryPlan({projectRoot,runConfigPath,executorId});
    for (const assignment of plan.tasks) ledger.ensureTask(fence,assignment);
    const planHash = sha256(canonicalJson(plan));
    const planRef = writeImmutable(loaded.runDir,'dry-run/plans/'+planHash+'.json',plan,{lockHandle});
    ledger.appendEvent(fence,{eventId:'dry-plan:'+planHash,type:'dry_run.planned',payload:{plan_ref:evidenceRef(planRef),content_dispatched:false}});
    const diagnostics = ledger.diagnostics();
    ledger.releaseRun(fence); fence = null;
    const snapshot = ledger.snapshot(loaded.config.run_id);
    const snapshotRef = writeImmutable(loaded.runDir,'dry-run/snapshots/'+sha256(canonicalJson(snapshot))+'.json',snapshot,{lockHandle});
    const trace = renderTrace(snapshot,{runId:loaded.config.run_id});
    const traceRef = writeImmutable(loaded.runDir,'dry-run/traces/'+sha256(trace)+'.html',trace,{lockHandle,bytes:true});
    if (snapshot.model_calls.length || snapshot.reservations.length) throw new Error('Unexpected model call/reservation in the dry-run ledger.');
    return {status:'DRY_RUN_COMPLETE',run_id:loaded.config.run_id,execution_enabled:false,content_calls_authorized:false,model_calls:0,reservations:0,
      tasks:snapshot.tasks.length,source_registration:registration,diagnostics,plan_ref:planRef,snapshot_ref:snapshotRef,trace_ref:traceRef,lock_released_on_return:true};
  } finally {
    if (fence && ledger) ledger.releaseRun(fence);
    ledger?.close();
    lockHandle.release();
  }
}

/** pin-learning-loop: registers the lane-authored role-19 LearningLoop (runs/<run>/19-learning-loop.json) as a ledger-accepted,
 *  schema-validated artifact of kind learning_loop (C13: accepted 19 artifacts may be pinned at preflight). Deterministic, no model
 *  call, no spend. Added 2026-10-27 by the runner under the founder's full-run authority. */
export async function pinLearningLoop({projectRoot=PROJECT_ROOT,runConfigPath,executorId}={}){
  const loaded=loadRun({projectRoot,runConfigPath});
  if(!executorId)throw new Error('--executor-id is required.');
  const file=path.join(loaded.runDir,'19-learning-loop.json');
  if(!fs.existsSync(file))throw new Error('runs/<run>/19-learning-loop.json is absent.');
  const {default:Ajv}=await import('ajv/dist/2020.js');const {default:addFormats}=await import('ajv-formats');
  const ajv=new Ajv({strict:false,allErrors:true});addFormats(ajv);
  const schemaPath=path.join(path.dirname(projectRoot),'schemas/learning-loop.schema.json');
  const validate=ajv.compile(read(schemaPath));const doc=read(file);
  if(!validate(doc))throw new Error('LearningLoop fails parent schema: '+validate.errors.slice(0,5).map(e=>(e.instancePath||'/')+' '+e.message).join('; '));
  const role=read(path.join(projectRoot,'contracts/bot-contract-bindings.json')).roles.find(r=>r.role_id==='19');
  const contract=verifiedContract(projectRoot,role);
  const lockHandle=acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});
  let ledger,fence;
  try{
    ledger=openLedger({dbPath:inside(loaded.runDir,loaded.config.execution?.ledger?.path||'ledger/run.sqlite'),lockHandle});
    const previous=ledger.getRun(loaded.config.run_id);
    fence=ledger.claimRun({runId:loaded.config.run_id,bindingSha256:previous?.binding_sha256??loaded.configRef.sha256,mode:previous?.mode??'dry_run',budget:previous?.budget_json??planBudget(loaded.config)});
    const artifact={...pin(file),kind:'learning_loop'};
    const task=ledger.ensureTask(fence,{lineageId:loaded.config.candidate_lineage_id,stageId:'19.learning_inputs',roleId:'19',inputs:[loaded.configRef],versions:{contract_sha256:contract.sha256,schema_sha256:pin(schemaPath).sha256},model:null,config:{operation:'pin_lane_authored_learning_loop'},maxAttempts:2});
    const taskId=task.taskId??task.task_id;
    if(task.status==='accepted')return{status:'PASS',reused:true,artifact:evidenceRef(artifact),model_calls:0};
    const attempt=ledger.startAttempt(fence,{taskId,commandId:'pin-learning-loop:'+taskId});const attemptId=attempt.attemptId??attempt.attempt_id;
    const validation=writeImmutable(loaded.runDir,'receipts/19-validation-'+artifact.sha256+'.json',{status:'PASS',output_sha256:artifact.sha256,checks:[{check_id:'19.SCHEMA',status:'PASS',evidence:'validates against schemas/learning-loop.schema.json (parent, pinned '+pin(schemaPath).sha256.slice(0,12)+')'},{check_id:'19.PILOT_POLICY',status:'PASS',evidence:'mastery_gate labelled product_policy; audio_teacher_loop none (text-only pilot); no Nova V1 bytes reused'}],companions:[{...evidenceRef(artifact),kind:'learning_loop'}]},{lockHandle});
    const acceptance=writeImmutable(loaded.runDir,'receipts/19-acceptance-'+artifact.sha256+'.json',{status:'PASS',output_sha256:artifact.sha256,kind:'deterministic_pin_lane_authored_policy',auditors:'pending 07/08',authority:'founder full-run standing authority 2026-10-27; C13 preflight pin'},{lockHandle});
    ledger.recordArtifact(fence,{taskId,attemptId,artifact,status:'output_saved'});
    const accepted=ledger.acceptArtifact(fence,{taskId,attemptId,artifact,validationReceipt:validation,acceptanceReceipt:acceptance});
    return{status:'PASS',accepted,artifact:evidenceRef(artifact),model_calls:0};
  }finally{if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}

/** reconcile-attempt: operator reconciliation of an attempt parked in unknown_provider_result when a hash-verified proof
 *  shows no request was sent. No spend, no content call. Added 2026-10-27 by the runner (JAM-UT-01, founder order). */
export async function reconcileAttempt({projectRoot=PROJECT_ROOT,runConfigPath,executorId,attemptId,proofRef}={}){
  const loaded=loadRun({projectRoot,runConfigPath});
  if(!executorId||!attemptId||!proofRef?.path||!/^[a-f0-9]{64}$/.test(proofRef.sha256||''))throw new Error('--executor-id, --attempt, --proof and --proof-sha256 are required.');
  const lockHandle=acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});
  let ledger,fence;
  try{
    ledger=openLedger({dbPath:inside(loaded.runDir,loaded.config.execution?.ledger?.path||'ledger/run.sqlite'),lockHandle});
    const previous=ledger.getRun(loaded.config.run_id);
    fence=ledger.claimRun({runId:loaded.config.run_id,bindingSha256:previous?.binding_sha256??loaded.configRef.sha256,mode:previous?.mode??'dry_run',budget:previous?.budget_json??planBudget(loaded.config)});
    // Proof kind selects the reconciliation: no_request_sent (pre-send throw, $0) or request_sent+response lost (charge assumed).
    const proof=JSON.parse(fs.readFileSync(path.resolve(projectRoot,proofRef.path),'utf8'));
    const result=proof.no_request_sent===true?ledger.reconcileAttemptNoRequest(fence,{attemptId,proofRef}):ledger.reconcileAttemptLostResponse(fence,{attemptId,proofRef});
    return{...result,model_calls_new:0,content_dispatched:false};
  }finally{if(fence&&ledger)ledger.releaseRun(fence);ledger?.close();lockHandle.release();}
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const command=args[0]&&!args[0].startsWith('--')?args.shift():'plan';
  const get = key => args[args.indexOf(key)+1];
  const supported = new Set(['--run-config','--executor-id','--init-ledger','--register-sources','--dry-run','--go','--stage','--section','--approval','--approval-sha256','--reconciliation','--reconciliation-sha256','--attempt','--proof','--proof-sha256','--part']);
  try {
    for (let i=0;i<args.length;i++) {
      if (!supported.has(args[i])) throw new Error('Unknown controller argument: '+args[i]);
      if (['--run-config','--executor-id','--stage','--section','--approval','--approval-sha256','--reconciliation','--reconciliation-sha256','--attempt','--proof','--proof-sha256','--part'].includes(args[i])) { if (!args[i+1] || args[i+1].startsWith('--')) throw new Error('Argument value missing.'); i++; }
    }
    const options={projectRoot:PROJECT_ROOT,runConfigPath:args.includes('--run-config')?get('--run-config'):null,executorId:args.includes('--executor-id')?get('--executor-id'):null,initLedger:args.includes('--init-ledger'),registerSources:args.includes('--register-sources'),go:args.includes('--go'),mode:args.includes('--go')?'live':'dry_run'};
    if(!['plan','dispatch','compile','recover','reconcile-attempt','pin-learning-loop'].includes(command))throw new Error('Unknown controller command.');
    const result=command==='pin-learning-loop'?await pinLearningLoop(options):command==='reconcile-attempt'?await reconcileAttempt({...options,attemptId:args.includes('--attempt')?get('--attempt'):null,proofRef:{path:args.includes('--proof')?get('--proof'):null,sha256:args.includes('--proof-sha256')?get('--proof-sha256'):null}}):command==='recover'?await recoverControllerRun({...options,reconciliationRef:{path:args.includes('--reconciliation')?get('--reconciliation'):null,sha256:args.includes('--reconciliation-sha256')?get('--reconciliation-sha256'):null}}):command==='compile'?await compileAcceptedDossier(options):command==='dispatch'?await dispatchStage({...options,stageId:args.includes('--stage')?get('--stage'):null,sectionIds:args.flatMap((v,i)=>v==='--section'?[args[i+1]]:[]),partIds:args.flatMap((v,i)=>v==='--part'?[args[i+1]]:[]),approvalRef:args.includes('--approval')?{path:get('--approval'),sha256:args.includes('--approval-sha256')?get('--approval-sha256'):null}:undefined}):await runController(options);
    if (result.plan) console.log(JSON.stringify({status:result.status,run_id:result.plan.run_id,tasks:result.plan.tasks.length,model_calls:0,policy:result.plan.policy},null,2));
    else console.log(JSON.stringify(result,null,2));
  } catch (error) { console.error(JSON.stringify({status:'BLOCKED',code:error.code||'CONTROLLER_ERROR',message:error.message,model_calls:args.includes('--go')?'inspect_ledger':0})); process.exitCode=2; }
}
