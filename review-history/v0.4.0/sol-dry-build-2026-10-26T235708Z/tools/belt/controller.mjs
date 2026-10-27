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
  const result = await buildRegistration({projectRoot,runConfigPath:loaded.configPath});
  const script = pin(path.join(projectRoot,'tools/roles/15-register.mjs'));
  const role = read(path.join(projectRoot,'contracts/bot-contract-bindings.json')).roles.find(r=>r.role_id==='15');
  const contract = verifiedContract(projectRoot,role);
  const registrationDigest = sha256(canonicalJson({source:result.source,writePlan:result.writePlan}));
  const assignment = {lineageId:loaded.config.run_id+':lineage:1',stageId:'15.sources',roleId:'15',inputs:[loaded.configRef,{path:result.source.path,sha256:result.source.sha256}],versions:{contract_sha256:contract.sha256,script_sha256:script.sha256,registration_input_and_outputs_sha256:registrationDigest},model:null,config:{operation:'offline_local_registration'},maxAttempts:2};
  const task = ledger.ensureTask(fence,assignment);
  const taskId = task.taskId ?? task.task_id;
  if (['accepted','blocked'].includes(task.status)) {
    const existing = ledger.listArtifacts(fence.runId).filter(a=>a.task_id===taskId);
    for (const ref of existing) {
      verifyRef(ref,loaded.runDir);
      const expected = result.writePlan.find(item=>path.resolve(loaded.runDir,item.path)===path.resolve(ref.path));
      if (!expected || expected.sha256!==ref.sha256) throw new Error('Source registration reuse does not match its current exact input/output plan.');
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
  const receipt = {schema_version:'role15-registration-receipt.v0.4.0',status:result.status,script_ref:script,source:result.source,
    verification_debt:result.verification_debt,artifacts:artifacts.map(a=>({path:path.relative(loaded.runDir,a.path).replaceAll('\\','/'),sha256:a.sha256,bytes:a.bytes,kind:a.kind})),content_calls:0};
  const receiptRef = writeImmutable(loaded.runDir,'15-registration-receipt.json',receipt,{lockHandle});
  for (const artifact of artifacts) ledger.recordArtifact(fence,{taskId,attemptId,artifact,status:'output_saved'});
  // Registration of incomplete evidence is never source/fact acceptance.
  ledger.failAttempt(fence,{attemptId,status:'blocked',errorRef:receiptRef});
  ledger.appendEvent(fence,{eventId:attemptId+':registration-saved',type:'source.registration_saved',taskId,attemptId,payload:{receipt:receiptRef,status:result.status,content_calls:0}});
  return {...receipt,receipt_ref:receiptRef,reused:false};
}

export async function runController({projectRoot = PROJECT_ROOT,runConfigPath,executorId,initLedger=false,registerSources=false,go=false,mode='dry_run'}={}) {
  const loaded = loadRun({projectRoot,runConfigPath});
  if (go || mode !== 'dry_run') {
    assertDispatchAllowed({projectRoot,config:loaded.config,go,mode});
    throw new Error('This build requires a separately reviewed bound-task activation before live dispatch. No request was sent.');
  }
  if (!initLedger && !registerSources) return {status:'DRY_PLAN',plan:buildDryPlan({projectRoot,runConfigPath,executorId}),model_calls:0};
  if (!executorId) throw new Error('An attributable --executor-id is required for ledger/source writes.');
  const lockHandle = acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});
  let ledger, fence;
  try {
    ledger = openLedger({dbPath:inside(loaded.runDir,loaded.config.execution?.ledger?.path || 'ledger/run.sqlite'),lockHandle});
    fence = ledger.claimRun({runId:loaded.config.run_id,bindingSha256:loaded.configRef.sha256,mode:'dry_run',budget:planBudget(loaded.config)});
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

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = key => args[args.indexOf(key)+1];
  const supported = new Set(['--run-config','--executor-id','--init-ledger','--register-sources','--dry-run','--go']);
  try {
    for (let i=0;i<args.length;i++) {
      if (!supported.has(args[i])) throw new Error('Unknown controller argument: '+args[i]);
      if (['--run-config','--executor-id'].includes(args[i])) { if (!args[i+1] || args[i+1].startsWith('--')) throw new Error('Argument value missing.'); i++; }
    }
    const result = await runController({runConfigPath:args.includes('--run-config')?get('--run-config'):null,executorId:args.includes('--executor-id')?get('--executor-id'):null,initLedger:args.includes('--init-ledger'),registerSources:args.includes('--register-sources'),go:args.includes('--go'),mode:args.includes('--go')?'live':'dry_run'});
    if (result.plan) console.log(JSON.stringify({status:result.status,run_id:result.plan.run_id,tasks:result.plan.tasks.length,model_calls:0,policy:result.plan.policy},null,2));
    else console.log(JSON.stringify(result,null,2));
  } catch (error) { console.error(JSON.stringify({status:'BLOCKED',code:error.code||'CONTROLLER_ERROR',message:error.message,model_calls:0})); process.exitCode=2; }
}
