import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {inspectQualification04,validateJsonSchema} from './qualify-04.mjs';
import {inspectAuditIndependence} from './check-audit-independence.mjs';
import {inspectImplementationClosure} from './inspect-implementation-closure.mjs';

// Configuration only. This tool never dispatches a bot, reads credentials or spends money.
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repo = path.resolve(here, '..');
const registryPath = path.join(here, 'contracts', 'bot-contract-bindings.json');
const floorPath = process.env.NOVA_FLOOR_PREVIEW_PATH;
const refreshFloor = process.argv.includes('--refresh-floor');
if(refreshFloor && (!floorPath || !process.argv.includes('--write')))throw new Error('--refresh-floor requires NOVA_FLOOR_PREVIEW_PATH and --write');
const roleContracts = {
  '00':'factory/workers/00-orchestrator.md',
  '01':'factory/workers/01-market-scout.md',
  '01b':'factory/workers/01b-competitive-intel-gatherer.md',
  '02':'factory/workers/02-sme-research-agent.md',
  '03':'factory/workers/03-knowledge-architect.md',
  '04':'factory/workers/04-flashcard-engineer.md',
  '05':'factory/workers/05-voice-coach.md',
  '06':'factory/workers/06-exam-author.md',
  '07':'factory/workers/07-coverage-auditor.md',
  '08':'factory/workers/08-hallucination-auditor.md',
  '09':'factory/workers/09-product-publisher.md',
  '10':'factory/workers/10-launch-growth.md',
  '10A':'factory/workers/10a-search-operations.md',
  '10B':'factory/workers/10b-ai-discovery.md',
  '11':'factory/workers/11-outcomes-analyst.md',
  '12':'factory/infra-roles/12-factory-registrar.md',
  '13':'factory/infra-roles/13-schema-steward.md',
  '14':'factory/infra-roles/14-artifact-validator.md',
  '15':'factory/infra-roles/15-evidence-librarian.md',
  '16':'factory/infra-roles/16-blueprint-compiler.md',
  '17':'factory/infra-roles/17-kg-input-enricher.md',
  '18':'factory/infra-roles/18-dynamic-facts-monitor.md',
  '19':'factory/infra-roles/19-learning-science-calibrator.md',
  '19A':'factory/infra-roles/19a-curriculum-unit-grouper.md',
  '20':'factory/infra-roles/20-audio-production-engineer.md',
  '20A':'factory/infra-roles/20a-image-scout.md',
  '20B':'factory/infra-roles/20b-prosody-director.md',
  '21':'factory/infra-roles/21-runtime-adapter.md',
  '22':'factory/infra-roles/22-sales-signal-agent.md',
  '23':'factory/infra-roles/23-objection-miner.md',
  '24':'factory/infra-roles/24-portfolio-allocator.md',
  '25':'factory/infra-roles/25-executive-assistant.md',
  'KG-01':'factory/kg-department/kg-01-concept-extractor-verifier.md',
  'KG-02':'factory/kg-department/kg-02-ontologist.md',
  'KG-03':'factory/kg-department/kg-03-dependency-mapper.md',
  'KG-04':'factory/kg-department/kg-04-weight-difficulty-calibrator.md',
  'KG-05':'factory/kg-department/kg-05-path-sequencer.md',
  'UI':'factory/ui-architects/<selected-probe>.md',
  'B1':'factory/build-crew/B1-build-lead.md',
  'B2':'factory/build-crew/B2-database-platform.md',
  'B3':'factory/build-crew/B3-orchestrator-backend.md',
  'B4':'factory/build-crew/B4-agent-integration.md',
  'B5':'factory/build-crew/B5-frontend-app.md',
  'B6':'factory/build-crew/B6-seo-pages.md',
  'B7':'factory/build-crew/B7-signal-data.md',
  'B8':'factory/build-crew/B8-media-audio.md',
  'B9':'factory/build-crew/B9-local-setup-bashiac.md'
};
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => value.replaceAll('\\', '/');
const relative = value => normalize(path.relative(repo, value));
const bytesRef = target => {
  const bytes = fs.readFileSync(target);
  return {path: relative(target), sha256: hash(bytes), bytes: bytes.length, status: 'pinned'};
};
const seedRegistry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const storedRoles=Object.fromEntries(seedRegistry.roles.map(r=>[r.role_id,{
  name:r.presentation.name,group:r.presentation.group,input:r.presentation.input,output:r.presentation.output,
  desc:r.presentation.description,next:r.presentation.linked_role_ids,file:roleContracts[r.role_id]?.replace(/^factory\//,'')
}]));
let previewRoles=null;
if(floorPath) {
  const floorText=fs.readFileSync(floorPath,'utf8');
  const roleLiteral=floorText.match(/const roles\s*=\s*(\{[\s\S]*?\n\s*\});\s*\n\s*const reviewers/);
  if(!roleLiteral)throw new Error('Cannot find the optional floor role data literal');
  previewRoles=vm.runInNewContext('('+roleLiteral[1]+')',Object.create(null),{timeout:1000});
}
const floorRoles=refreshFloor ? previewRoles : storedRoles;
const overlayPath=path.join(here,'BELT-V2-CONTRACT.md');
const overlayVersion=fs.readFileSync(overlayPath,'utf8').match(/^(?:\*\*Version:\*\*\s*|Version\s+)(\d+\.\d+\.\d+)/m)?.[1];
if(!overlayVersion)throw new Error('V2 contract must declare **Version:** <semver>');
const configFlag=process.argv.indexOf('--run-config');
if(configFlag>=0&&(!process.argv[configFlag+1]||process.argv[configFlag+1].startsWith('--')))throw new Error('--run-config requires a path relative to the hackathon project or an absolute path');
const configPath=path.resolve(here,configFlag>=0?process.argv[configFlag+1]:'RDMV-RUN-CONFIG.template.json');
const configRelative=path.relative(here,configPath);
if(configRelative.startsWith('..')||path.isAbsolute(configRelative)||!configPath.toLowerCase().endsWith('.json'))throw new Error('Run configuration must be a JSON file inside the hackathon project');
const config=JSON.parse(fs.readFileSync(configPath,'utf8'));
const templatePath=path.join(here,'RDMV-RUN-CONFIG.template.json');
const templateConfig=JSON.parse(fs.readFileSync(templatePath,'utf8'));
const excerptField = (text, pattern) => {
  const lines = text.replaceAll('\r\n', '\n').split('\n');
  const found=[];
  for(let i=0;i<lines.length;i++) {
    if(!pattern.test(lines[i]))continue;
    const captured=[lines[i]];
    for(let j=i+1;j<lines.length;j++) {
      if(/^\*\*|^#{1,6} |^<!--/.test(lines[j]))break;
      captured.push(lines[j]);
    }
    found.push(captured.join('\n').trim());
  }
  return found.join('\n\n') || null;
};
const extract = text => {
  const clean = text.replaceAll('\r\n','\n');
  return {
    inputs: excerptField(clean, /^\*\*(?:Upstream[^*]*Inputs|Inputs)[^*]*:\*\*/i),
    outputs: excerptField(clean, /^\*\*Outputs?[^*]*:\*\*/i),
    quality_metrics: excerptField(clean, /^\*\*Quality Metrics[^*]*:\*\*/i),
    definition_of_done: excerptField(clean, /^\*\*Definition of Done[^*]*:\*\*/i),
    failure_conditions: excerptField(clean, /^\*\*(?:Failure Conditions|Build-Blockers)[^*]*:\*\*/i),
    machine_interface: excerptField(clean, /^\*\*Machine interface[^*]*:\*\*/i),
    autonomy: excerptField(clean, /^\*\*Autonomy Contract[^*]*:\*\*/i)
  };
};
const stages = {
  '02':['blueprint_draft','blueprint_improve'],
  '05':['session_scripts','card_scripts_from_accepted_04'],
  '20A':['pre_kg','post_kg'],
  'UI':['early_media_voice_intent','final_uispec_draft','final_uispec_improve']
};
const lane = id => /^B\d$/.test(id) ? 'build_engineering' : ['07','08'].includes(id) ? 'independent_review' : ['00','12','13','14','15','16','17','18','19','20','21','25'].includes(id) ? 'tool_assisted' : 'meta_authoring';
const activeIds=new Set(['02','03','KG-01','KG-02','KG-03','KG-04','KG-05','04','05','06','09','19A','01b','00','12','13','14','15','16','17','19','21','07','08','B1','B5','UI']);
const scriptedIds=new Set(['00','09','12','13','14','15','16','17','19','19A','21']);
const pilotOverrideIds=['02','03','16','17','19A','06','07','09'];
// A real implementation path is scoped evidence of code, not role qualification.
// Assemblers 09/19/19A/21 remain planned; a validator does not implement them.
const implementedScripts={
  '00':{path:'tools/belt/controller.mjs',scope:'Bounded sequential controller; current dispatch/dependency scope only, not a demonstrated full belt.'},
  '12':{path:'tools/belt/ledger.mjs',scope:'Isolated run SQLite ledger and append-only provenance; does not amend the canonical factory manifest.'},
  '13':{path:'tools/belt/strict-lint.mjs',scope:'Provider strict-schema shape guard only; does not mint or repair all schema-steward artifacts.'},
  '14':{path:'tools/belt/post-validate.mjs',scope:'Mapped artifact schemas and deterministic post-checks; does not assemble content or grant independent acceptance.'},
  '15':{path:'tools/roles/15-register.mjs',scope:'Offline private-PDF registration and source evidence/debt; independent fact audits remain pending.'},
  '16':{path:'tools/belt/compile.mjs',scope:'Deterministic accepted02 merge and fact index through the local CompiledDossierPilot adaptation; no canonical Blueprint certification.'},
  '17':{path:'tools/belt/compile.mjs',scope:'Records the explicit pinned n/a_pilot disposition; no hint-enrichment task or model call executes.',disposition:'n/a_pilot',executes_stage:false},
};
const scriptRef=id=>{
  const implementation=implementedScripts[id];
  const scriptPath=implementation?.path??'tools/roles/'+id+'-role.mjs';
  const target=path.join(here,scriptPath);
  const exists=fs.existsSync(target);
  return{path:scriptPath,status:implementation?(exists?'implemented_not_qualified':'declared_implementation_missing'):'planned',file_exists:exists,
    ...(implementation?{implementation_scope:implementation.scope,...(exists?{sha256:hash(fs.readFileSync(target)),bytes:fs.statSync(target).size}:{}),
      ...(implementation.disposition?{disposition:implementation.disposition,executes_stage:implementation.executes_stage}:{})}:{}),
  };
};
const localUIPath=path.join(here,'contracts','ui-rdmv-tx.md');
const localRef=target=>{const data=fs.readFileSync(target);return{path:normalize(path.relative(here,target)),sha256:hash(data),bytes:data.length,status:'pinned_local'};};
const nonApplicableSchemas=new Set(['schemas/teaching-presentation.schema.json','schemas/teaching.schema.json']);
const naReason='Conditional pilot non-applicability: the absent parent TeachingPresentation/teaching schemas remain legacy artifacts, distinct from the active project-local contracts/teaching-unit.schema.json owned by05-sessions. Parent session-script/voicescripts and declared local adapters apply only to their mapped outputs. Local teaching fields and fact_id resolution are required, not waived. Re-evaluate applicability if pilot consumption changes; no parent schema requirement is amended.';
const profileExecution=id=>{
  const active=activeIds.has(id);
  const common={lane:lane(id),provider_proposal:null,model:null,adapter_status:'not_configured',qualification_status:'not_qualified',observed_execution:false};
  if(!active)return common;
  if(scriptedIds.has(id))return{...common,lane:'tool_assisted',provider_proposal:'script',adapter_status:'script',script_ref:scriptRef(id)};
  if(['07','08'].includes(id))return{...common,lane:'independent_audit',provider_proposal:'active review_bots',adapter_status:'configured_pending_smoke'};
  if(['B1','B5'].includes(id))return{...common,lane:'build_engineering',provider_proposal:id==='B1'?'claude-code':'muse-code',adapter_status:'assistant',assistant_identity_is_runtime_model:false};
  return{...common,lane:'meta_authoring',provider_proposal:'meta',model:'muse-spark-1.3',model_status:'candidate_not_verified',adapter_status:'configured_pending_smoke',...(id.startsWith('KG-')?{combined_call_owner_role_id:'03',separate_model_call:false}:{}),...(id==='01b'?{recon_only:true,fact_authority:false}:{})};
};
const qualificationSource=id=>({policy:id==='04'?'scoped_held_out_qualification_report':'qualified_by_first_accepted_artifact',status:'pending',report_ref:id==='04'?'qualification/QUALIFICATION-REPORT-04.json':null,criteria_ref:id==='04'?'qualification/CRITERIA-04-text-first.json':null,binding_ref:id==='04'?'qualification/BINDING-04-text-first.template.json':null,proof_owner_role_id:id.startsWith('KG-')?'03':id,policy_does_not_imply_current_qualification:true});
function makeRegistry() {
  const roles = Object.entries(floorRoles).map(([roleId, r]) => {
    const localUI=roleId==='UI'&&fs.existsSync(localUIPath);
    const unresolved = !localUI&&r.file.includes('<selected-probe>');
    const contractPath = localUI?localUIPath:path.join(repo,'factory',r.file);
    const contractText = unresolved ? '' : fs.readFileSync(contractPath,'utf8');
    const schemaPaths = [...new Set(contractText.match(/schemas\/[A-Za-z0-9_.\/-]+\.schema\.json/g) || [])];
    const oldPin=seedRegistry.roles.find(s=>s.role_id===roleId)?.contract;
    if(roleId!=='UI'&&oldPin?.sha256!==hash(fs.readFileSync(contractPath)))throw new Error('Canonical pin changed; explicit review is required before repinning role '+roleId);
    return {
      role_id:roleId,
      bot_id:'nova-role-' + roleId.toLowerCase(),
      assignment_status:activeIds.has(roleId)?'active_pilot':'inactive_for_pilot',
      execution_enabled:false,
      execution:profileExecution(roleId),
      qualification_source:qualificationSource(roleId),
      contract:unresolved ? {path:'factory/'+r.file,status:'unresolved_template',sha256:null,bytes:null} : localUI?localRef(contractPath):{...oldPin},
      inherited_contract_refs:roleId==='UI'?[bytesRef(path.join(repo,'factory','ui-architects','_MASTER-UI-TEMPLATE.md'))]:[],
      presentation:{name:r.name,group:r.group,input:roleId==='UI'?'Accepted ContentCandidateManifest + early media intent + finish criteria':roleId==='09'?'Accepted content + validated UiSpec + pilot-finish-criteria':r.input,output:r.output,description:r.desc,linked_role_ids:[...r.next],links_are:'illustrative_responsibility_links_not_execution_dependencies'},
      pilot_override_ref:pilotOverrideIds.includes(roleId)?'contracts/pilot-overrides-v0.4.0.json#/role_overrides/'+roleId:null,
      local_schema_refs:roleId==='UI'?[{...localRef(path.join(here,'contracts','ui-spec.schema.json')),status:'pinned_local_schema'}]:['05','13'].includes(roleId)?[{...localRef(path.join(here,'contracts','teaching-unit.schema.json')),status:'pinned_local_schema'}]:[],
      excerpts:unresolved ? {inputs:null,outputs:null,quality_metrics:null,definition_of_done:null,failure_conditions:null,machine_interface:null,autonomy:null} : extract(contractText),
      schema_refs:schemaPaths.map(p => fs.existsSync(path.join(repo,p)) ? {...bytesRef(path.join(repo,p)),status:'present'} : {path:p,status:roleId==='13'&&nonApplicableSchemas.has(p)?'absent_not_applicable_pilot':'missing',sha256:null,bytes:null,...(roleId==='13'&&nonApplicableSchemas.has(p)?{reason:naReason,applicability:'conditional_on_declared_pilot_artifact_consumption',substitute_schema_refs:['schemas/session-script.schema.json','schemas/voicescripts.schema.json']}:{} )}),
      stage_specializations:stages[roleId] || [],
      specialization_authority:stages[roleId] ? 'BELT-V2-CONTRACT.md sections 3-4; THE-BELT.md choreography; role identity is not a stage-instance ID' : null,
      restrictions:roleId==='B1' ? ['Preserve the existing independent tester binding in the full B1 contract: Astra/GPT review; Fable executes; reviewer must differ from builder. Provider-pool eligibility does not override it.','Pilot build assistant assignment is proposed review configuration, not a replacement independent tester or evidence of executed QA.'] : roleId==='UI' ? ['Local filename ui-rdmv-tx.md is a legacy candidate label. State selection remains open; do not infer Texas selection or state-specific facts.'] : /^B[23489]$/.test(roleId) ? ['Inactive foundation responsibility for this pilot. A contract is not an installed service.'] : []
    };
  });
  const reviewers = [['audit-openai','OpenAI'],['audit-claude','Anthropic / Claude'],['audit-google','Google']].map(([botId,provider]) => ({
    bot_id:botId,provider,assignment_status:botId==='audit-google'?'inactive_for_pilot':'active_pilot',execution_enabled:false,
    eligible_role_scopes:['07','08','B1'],scope_assignment:null,model:botId==='audit-openai'?'(verify id)':botId==='audit-claude'?'claude-opus-5-5':null,model_status:botId==='audit-google'?'not_configured':'candidate_not_verified',key_env_name:botId==='audit-openai'?'OPENAI_API_KEY':null,adapter_status:botId==='audit-google'?'not_configured':'configured_pending_smoke',qualification_status:'not_qualified',qualification_source:{policy:'qualified_by_first_accepted_artifact',status:'pending',policy_does_not_imply_current_qualification:true},observed_execution:false,
    contract_refs:roles.filter(r => ['07','08','B1'].includes(r.role_id)).map(r => ({role_id:r.role_id,...r.contract})),
    requirements:['Receive the exact candidate and scoped input hashes, rubric, tools, budget and blocking criteria in a run-specific assignment.','Record actual independent calls and their evidence; eligibility is not completed review.','07 and 08 bind the content candidate; B1 product QA binds the later assembled release candidate.','Do not approve the bot’s own output; provider agreement never substitutes for source or executed test evidence.','Preserve B1’s named independent product-QA tester binding; a provider shirt is not an automatic reassignment.']
  }));
  return {
    artifact_type:'BotContractBindingRegistry',version:'0.4.0',pilot_profile:'0.4.0',prepared_local_date:'2026-10-26',status:'CONFIGURED_FOR_REVIEW',execution_enabled:false,
    path_base:'Nova repository root (the parent of this hackathon project); all contract and schema paths are relative to that root.',
    purpose:'Bind existing floor bot identities to pinned existing role-contract bytes. This is assignment configuration, not endpoint qualification or an execution receipt.',
    authority:['factory/factory-manifest.json','_MASTER-PROMPT.md','factory/THE-BELT.md','canonical role contract including amendments'],
    v2_overlay:{...bytesRef(overlayPath),version:overlayVersion,status:'DRAFT_NOT_APPROVED',effect:'Proposed hackathon adapter overlay; does not amend frozen parent contracts.'},
    pilot_override_contract:{...localRef(path.join(here,'contracts','pilot-overrides-v0.4.0.json')),version:'0.4.0',adoption_status:'review_only_not_execution_authority'},
    design_source:{kind:'factory_floor_role_data',role_data_only:true,optional_refresh:'Set NOVA_FLOOR_PREVIEW_PATH and run node tools/check-bot-contracts.mjs --write --refresh-floor. Default verification and regeneration require no visualization file.'},
    global_acceptance:['Read full pinned canonical contracts and amendments together with the explicit project-local pilot-overrides-v0.4.0.json dispositions; any unresolved authority conflict blocks dispatch. Excerpts are navigation aids. The proposed overlay never edits parent contracts.','A role cannot execute until the selected probe, exact stage inputs/outputs, schema applicability, provider/model/tools, budget, qualifications and run ownership are resolved.','Validate artifacts under role14 using actual adapters and deterministic post-validation, preserving source refs and independent evidence. Planned/missing adapters are not a PASS.','Two distinct eligible provider families are required for audit scopes after actor/session/family intervention and prompt-lineage checks; no automatic Google activation or waiver.','The linked role IDs on the floor are not a dependency graph. Early media intent and accepted content precede finalUiSpec; validatedUiSpec and finishcriteria precede09.','Failure handling uses bounded lineage policy after adoption; provider or candidate changes never reset counters.'],
    roles,review_bots:reviewers
  };
}

if (process.argv.includes('--write')) {
  fs.mkdirSync(path.dirname(registryPath),{recursive:true});
  fs.writeFileSync(registryPath,JSON.stringify(makeRegistry(),null,2)+'\n','utf8');
}
const registry=JSON.parse(fs.readFileSync(registryPath,'utf8'));
const errors=[];
const assert=(ok,message)=>{if(!ok)errors.push(message);};
const sourceIds=Object.keys(roleContracts).sort();
const actualIds=registry.roles.map(r=>r.role_id).sort();
assert(JSON.stringify(sourceIds)===JSON.stringify(actualIds),'Role coverage differs from the declared 47-role roster');
if(previewRoles) {
  assert(JSON.stringify(sourceIds)===JSON.stringify(Object.keys(previewRoles).sort()),'Optional floor role coverage differs from declared roster');
  for(const [id,r] of Object.entries(previewRoles))if(id!=='UI')assert(roleContracts[id]==='factory/'+r.file,'Optional floor contract path mismatch: '+id);
}
assert(new Set(actualIds).size===actualIds.length,'Duplicate role IDs');
assert(new Set([...registry.roles,...registry.review_bots].map(r=>r.bot_id)).size===registry.roles.length+registry.review_bots.length,'Duplicate bot IDs');
assert(registry.execution_enabled===false,'Registry must not enable execution');
assert(config.execution_enabled===false,'Review-only checker requires selected configuration execution_enabled:false');
assert(registry.version==='0.4.0'&&registry.pilot_profile==='0.4.0','Expected pilot binding registry revision 0.4.0');
assert(registry.v2_overlay.status==='DRAFT_NOT_APPROVED','V2 overlay approval must stay explicit');
assert(registry.v2_overlay.path===relative(overlayPath),'Unexpected V2 overlay path');
assert(registry.v2_overlay.version===overlayVersion,'V2 declared version mismatch');
function verifyRef(ref,allowTemplate=false) {
  if (allowTemplate && ref.status==='unresolved_template') {
    assert(ref.sha256===null && ref.path.includes('<selected-probe>'),'Invalid unresolved UI template');
    return;
  }
  const base=['pinned_local','pinned_local_schema'].includes(ref.status)?here:repo;
  const target=path.resolve(base,ref.path);
  const inside=!path.relative(base,target).startsWith('..')&&!path.isAbsolute(path.relative(base,target));
  assert(inside,'Ref escapes base: '+ref.path);
  if(!inside)return;
  if(ref.status==='pinned_local')assert(ref.path.startsWith('contracts/'),'Local contract must be inside project contracts/');
  if (['missing','absent_not_applicable_pilot'].includes(ref.status)) {
    assert(!fs.existsSync(target),'Schema marked absent exists: '+ref.path);
    if(ref.status==='absent_not_applicable_pilot'){
      assert(nonApplicableSchemas.has(ref.path)&&ref.reason===naReason,'Unsupported schema applicability waiver: '+ref.path);
      for(const p of ref.substitute_schema_refs||[])assert(fs.existsSync(path.join(repo,p)),'Missing declared substitute schema: '+p);
    }
    return;
  }
  if (!fs.existsSync(target)) {errors.push('Missing pinned file: '+ref.path);return;}
  const data=fs.readFileSync(target);
  assert(hash(data)===ref.sha256,'Hash mismatch: '+ref.path);
  assert(data.length===ref.bytes,'Byte length mismatch: '+ref.path);
}
verifyRef(registry.v2_overlay);
if(registry.pilot_override_contract)verifyRef(registry.pilot_override_contract);
else assert(false,'Missing pinned local pilot override contract');
const overridePath=path.join(here,'contracts','pilot-overrides-v0.4.0.json');
if(fs.existsSync(overridePath)){
  const overrides=JSON.parse(fs.readFileSync(overridePath,'utf8'));
  for(const roleId of pilotOverrideIds)assert(overrides.role_overrides?.[roleId]!=null,'Missing explicit pilot role disposition: '+roleId);
}
for (const r of registry.roles) {
  assert(r.execution_enabled===false,'Role enabled: '+r.role_id);
  assert(r.execution.observed_execution===false,'Role must not claim observed execution in review configuration: '+r.role_id);
  assert(r.assignment_status===(activeIds.has(r.role_id)?'active_pilot':'inactive_for_pilot'),'Incorrect pilot activation: '+r.role_id);
  assert(JSON.stringify(r.execution)===JSON.stringify(profileExecution(r.role_id)),'Pilot execution configuration drift: '+r.role_id);
  assert(JSON.stringify(r.qualification_source)===JSON.stringify(qualificationSource(r.role_id)),'Qualification policy drift: '+r.role_id);
  assert(r.contract.path===(r.role_id==='UI'&&r.contract.status==='pinned_local'?'contracts/ui-rdmv-tx.md':roleContracts[r.role_id]),'Contract path mismatch: '+r.role_id);
  verifyRef(r.contract,r.role_id==='UI');
  for(const ref of r.inherited_contract_refs||[])verifyRef(ref);
  for(const ref of r.local_schema_refs||[])verifyRef(ref);
  if(pilotOverrideIds.includes(r.role_id))assert(r.pilot_override_ref==='contracts/pilot-overrides-v0.4.0.json#/role_overrides/'+r.role_id,'Missing pilot override mapping: '+r.role_id);
  if(r.role_id==='UI')for(const key of ['inputs','outputs','quality_metrics','definition_of_done','failure_conditions','machine_interface','autonomy'])assert(typeof r.excerpts[key]==='string'&&r.excerpts[key].length>0,'Missing UI contract excerpt: '+key);
  for(const s of r.schema_refs)verifyRef(s);
  for(const linked of r.presentation.linked_role_ids)assert(sourceIds.includes(linked),'Unknown linked role: '+linked);
  if(['pinned','pinned_local'].includes(r.contract.status)) {
    const canonicalText=fs.readFileSync(path.join(r.contract.status==='pinned_local'?here:repo,r.contract.path),'utf8');
    const expected=extract(canonicalText);
    assert(JSON.stringify(expected)===JSON.stringify(r.excerpts),'Excerpt drift: '+r.role_id);
    const expectedSchemaPaths=[...new Set(canonicalText.match(/schemas\/[A-Za-z0-9_.\/-]+\.schema\.json/g)||[])].sort();
    assert(JSON.stringify(expectedSchemaPaths)===JSON.stringify(r.schema_refs.map(s=>s.path).sort()),'Schema-reference coverage mismatch: '+r.role_id);
  }
}
const bindingConfig=config.contract_binding_registry??templateConfig.contract_binding_registry;
const bindingBase=config.contract_binding_registry?path.dirname(configPath):here;
const bindingTarget=bindingConfig?.path?path.resolve(bindingBase,bindingConfig.path):null;
assert(bindingTarget===registryPath,'RDMV config must reference the local binding registry');
assert(bindingConfig?.required===true,'RDMV config must require contract bindings');
assert(bindingConfig?.validation_command==='node tools/check-bot-contracts.mjs','RDMV config must declare the binding checker');
assert(bindingConfig?.require_contract_hash_match===true,'RDMV config must require matching pinned contract hashes');
assert(bindingConfig?.require_qualified_stage_assignments===true,'RDMV config must require qualified run-specific stage assignments');
assert(registry.review_bots.length===3,'Expected three proposed review bots');
for (const r of registry.review_bots) {
  assert(JSON.stringify([...r.eligible_role_scopes].sort())===JSON.stringify(['07','08','B1']),'Reviewer scope mismatch: '+r.bot_id);
  assert(r.execution_enabled===false && r.scope_assignment===null && r.observed_execution===false,'Reviewer claims unqualified execution: '+r.bot_id);
  assert(r.assignment_status===(r.bot_id==='audit-google'?'inactive_for_pilot':'active_pilot'),'Incorrect reviewer pilot activation: '+r.bot_id);
  assert(r.qualification_status==='not_qualified','Reviewer must retain unqualified status without evidence: '+r.bot_id);
  assert(r.contract_refs.length===3,'Missing reviewer contracts: '+r.bot_id);
  for(const ref of r.contract_refs){
    const role=registry.roles.find(s=>s.role_id===ref.role_id);
    assert(role&&ref.sha256===role.contract.sha256&&ref.path===role.contract.path,'Reviewer ref mismatch: '+r.bot_id);
    verifyRef(ref);
  }
}
const schemaRefs=registry.roles.flatMap(r=>r.schema_refs);
const activeRoles=registry.roles.filter(r=>r.assignment_status==='active_pilot');
const activeReviewers=registry.review_bots.filter(r=>r.assignment_status==='active_pilot');
let qualificationResult=errors.length?{role_id:'04',qualification_status:'not_qualified',report_status:'binding_integrity_failed',validation_errors:['Contract-binding integrity must pass before qualification evidence can apply.']}:await inspectQualification04({projectRoot:here,repoRoot:repo,runConfigPath:configPath,registry});
const unboundRoles=activeRoles.filter(r=>!['pinned','pinned_local'].includes(r.contract.status)).map(r=>r.role_id);
const missingSchemas=[...new Set(schemaRefs.filter(s=>s.status==='missing').map(s=>s.path))];
const unqualifiedRoles=activeRoles.filter(r=>r.role_id==='04'?qualificationResult.qualification_status!=='qualified':r.execution.qualification_status!=='qualified').map(r=>r.role_id);
const adaptersUnset=activeRoles.filter(r=>!['script','assistant','configured_pending_smoke'].includes(r.execution.adapter_status)).map(r=>r.role_id);
const unconfiguredModels=activeRoles.filter(r=>r.execution.lane==='meta_authoring'&&!r.execution.model).map(r=>r.bot_id).concat(activeReviewers.filter(r=>!r.model).map(r=>r.bot_id));
const verificationDebtFields=[];
const verifyMarker=value=>typeof value==='string'&&/\(verify(?:\s[^)]*)?\)/i.test(value);
const scanDebt=(value,prefix='')=>{if(verifyMarker(value))verificationDebtFields.push(prefix);else if(value&&typeof value==='object')for(const[key,child]of Object.entries(value))scanDebt(child,prefix?prefix+'.'+key:key);};
scanDebt(config);
for(const r of activeReviewers)if(verifyMarker(r.model))verificationDebtFields.push('bindings.review_bots.'+r.bot_id+'.model');
const unresolvedIntake=[];
const scanIntake=(value,prefix='scope')=>{for(const[key,child]of Object.entries(value||{})){
  if(key.endsWith('_ref'))continue;
  if(child===null&&!verifyMarker(value[key+'_status']))unresolvedIntake.push(prefix+'.'+key);
  else if(child&&typeof child==='object'&&!Array.isArray(child))scanIntake(child,prefix+'.'+key);
}};
scanIntake(config.scope);
const unresolvedBudgets=Object.entries(config.limits?.per_provider_usd_caps||{}).filter(([,value])=>value===null).map(([key])=>'limits.per_provider_usd_caps.'+key);
const stateConfirmed=config.state_selection?.status==='confirmed'&&config.state_selection?.confirmed_by==='founder'&&config.state_selection?.jurisdiction===config.scope?.jurisdiction;
const notes=schemaRefs.filter(s=>s.status==='absent_not_applicable_pilot').map(s=>({kind:'conditional_schema_non_applicability',path:s.path,reason:s.reason}));
const plannedScripts=activeRoles.filter(r=>r.execution.script_ref&&r.execution.script_ref.status!=='implemented_not_qualified').map(r=>r.execution.script_ref.path);
const scriptImplementationInventory=[...scriptedIds].filter(id=>activeIds.has(id)).map(role_id=>({role_id,...scriptRef(role_id),qualification_status:'not_qualified',observed_execution:false}));
const promptNames=['02','03','04','05-sessions','05-card-scripts','06','07','08','09','19A'];
const promptChecks=promptNames.map(name=>{
  const promptPath=path.join(here,'prompts',name+'.md'),bytes=fs.readFileSync(promptPath),text=bytes.toString('utf8');
  const footerStart=bytes.lastIndexOf(Buffer.from('\nprompt_template_sha256:'));
  const footer=footerStart>=0?bytes.subarray(footerStart+1).toString('utf8').match(/^prompt_template_sha256: ([0-9a-f]{64})\n?$/):null;
  const bodyHash=footer?hash(bytes.subarray(0,footerStart+1)):null;
  const schemaRef=text.match(/^schema_ref:\s*(\S+)\s*$/m)?.[1];
  const pinnedSchemaHash=text.match(/^schema_sha256:\s*(\S+)\s*$/m)?.[1];
  const schemaPath=schemaRef?path.resolve(here,schemaRef):null;
  const schemaExists=schemaPath&&fs.existsSync(schemaPath);
  const bodyBoundaryValid=!/REVIEW ONLY|This template authorizes no execution|execution_authorized|render_only|^mode:\s*(review|qualification|production)/mi.test(text);
  const footerValid=!!footer&&footer[1]===bodyHash&&!bytes.includes(13)&&bytes[0]!==0xef;
  assert(footerValid,'Prompt body/footer hash invalid: '+name);
  assert(bodyBoundaryValid,'Controller mode/authority text leaked into prompt body: '+name);
  if(schemaExists&&/^[a-f0-9]{64}$/.test(pinnedSchemaHash||''))assert(hash(fs.readFileSync(schemaPath))===pinnedSchemaHash,'Strict adapter hash mismatch: '+name);
  return{path:'prompts/'+name+'.md',file_sha256:hash(bytes),template_body_sha256:bodyHash,footer_valid:footerValid,body_mode_boundary_valid:bodyBoundaryValid,schema_ref:schemaRef||null,schema_exists:!!schemaExists,schema_hash_pinned:!!schemaExists&&/^[a-f0-9]{64}$/.test(pinnedSchemaHash||''),adapter_status:schemaExists?'present_receipt_still_required':'missing_external_Claude_lane'};
});
const headerPath=path.join(here,'prompts','controller-header.template.json');
let controllerHeader={status:'missing',sha256:null};
if(fs.existsSync(headerPath)){
  const bytes=fs.readFileSync(headerPath),header=JSON.parse(bytes);
  controllerHeader={status:'template_only',sha256:hash(bytes),mode:header.mode,render_only:header.render_only,execution_authorized:header.execution_authorized};
  assert(header.mode==='review'&&header.render_only===true&&header.execution_authorized===false,'Controller header must stay review/render-only in this package');
  for(const field of ['intervention_ledger_ref','candidate_lineage_ref','candidate_manifest_ref'])assert(field in (header.bindings||header),'Controller header missing lineage binding field: '+field);
}
const authorshipPath=path.join(here,'contracts','prompt-authorship.json');
let authorshipRef=null;
if(fs.existsSync(authorshipPath)){
  const bytes=fs.readFileSync(authorshipPath),authors=JSON.parse(bytes);
  authorshipRef={path:'contracts/prompt-authorship.json',sha256:hash(bytes)};
  for(const prompt of promptChecks){const entry=authors.entries?.find(e=>e.path===prompt.path);assert(entry&&entry.sha256===prompt.file_sha256&&entry.template_body_sha256===prompt.template_body_sha256&&entry.actor_id&&entry.provider_family,'Unbound prompt authorship: '+prompt.path);}
}
const candidateRef=typeof config.audit_pool?.content_manifest_ref==='object'?config.audit_pool.content_manifest_ref:null;
const interventionRef=typeof config.audit_pool?.intervention_ledger_ref==='object'?config.audit_pool.intervention_ledger_ref:null;
const independenceResult=inspectAuditIndependence({projectRoot:here,candidateManifestRef:candidateRef,interventionLedgerRef:interventionRef,promptAuthorshipRef:authorshipRef,auditors:activeReviewers,requiredProviderFamilies:2});
const uiFlag=process.argv.indexOf('--ui-spec');
let uiValidation={status:'not_requested',acceptance:'No UiSpec or validation receipts were produced by this check.'};
if(uiFlag>=0){
  if(!process.argv[uiFlag+1]||process.argv[uiFlag+1].startsWith('--'))throw new Error('--ui-spec requires a local instance path');
  const uiPath=path.resolve(here,process.argv[uiFlag+1]),ui=JSON.parse(fs.readFileSync(uiPath,'utf8'));
  const uiErrors=validateJsonSchema(JSON.parse(fs.readFileSync(path.join(here,'contracts','ui-spec.schema.json'),'utf8')),ui);
  const screens=ui.screens||[],ids=screens.map(s=>s.id);
  if(new Set(ids).size!==8||!['home','chapter_hub','lesson','cards','quiz','practice','results','trace'].every(id=>ids.includes(id)))uiErrors.push('Exactly eight distinct required screen IDs are required.');
  for(const s of screens)if(s.id==='trace'?(s.audience!=='reviewer'||s.learner_navigation!==false):(s.audience!=='learner'||s.learner_navigation!==true))uiErrors.push('Route audience/navigation mismatch: '+s.id);
  if((ui.flows||[]).some(f=>f.audience==='learner'&&(f.to==='trace'||f.from==='trace')))uiErrors.push('Learner flow reaches reviewer Trace.');
  const uiRefs=[...(ui.input_refs||[]),...screens.flatMap(s=>s.artifact_bindings||[])];
  for(const ref of uiRefs){const target=path.resolve(here,ref.path||''),rel=path.relative(here,target);if(rel.startsWith('..')||path.isAbsolute(rel)||!fs.existsSync(target)||!fs.statSync(target).isFile()||hash(fs.readFileSync(target))!==ref.sha256)uiErrors.push('Unresolved/mismatched local UI input binding: '+ref.path);}
  uiValidation={status:uiErrors.length?'FAIL':'PASS_STRUCTURAL_AND_LOCAL_SEMANTIC_ONLY',instance_sha256:hash(fs.readFileSync(uiPath)),schema_sha256:hash(fs.readFileSync(path.join(here,'contracts','ui-spec.schema.json'))),errors:uiErrors,acceptance:'External independent validate_1/validate_2 receipts still required; this command writes no receipt.'};
}
const strictPrerequisites=promptChecks.filter(p=>!p.schema_exists||!p.schema_hash_pinned).map(p=>p.schema_ref||p.path);
const postValidatorExists=fs.existsSync(path.join(here,'tools','belt','post-validate.mjs'));
const adapterReceiptRef=config.execution?.adapter_validation_receipts_ref;
let normalizedClosureFiles=null;
let adapterReceiptCheck={status:'unresolved',path:'coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json',reason:'Actual Claude-owner schema validation receipt and full hash are required.'};
const ownerReceiptPath=path.resolve(here,adapterReceiptRef?.path||adapterReceiptCheck.path);
const ownerReceiptRel=path.relative(here,ownerReceiptPath);
if(ownerReceiptRel.startsWith('..')||path.isAbsolute(ownerReceiptRel))assert(false,'Adapter receipt path escapes project');
else if(fs.existsSync(ownerReceiptPath)){
  const bytes=fs.readFileSync(ownerReceiptPath),actualReceiptHash=hash(bytes),receipt=JSON.parse(bytes);
  const configuredPinMatches=/^[a-f0-9]{64}$/.test(adapterReceiptRef?.sha256||'')&&actualReceiptHash===adapterReceiptRef.sha256;
  if(/^[a-f0-9]{64}$/.test(adapterReceiptRef?.sha256||''))assert(configuredPinMatches,'Adapter validation receipt hash mismatch');
  const incomplete=[],hashMismatches=[],verified=new Map();
  const verifyLocal=(ref,label)=>{
    if(!ref?.path||!/^[a-f0-9]{64}$/.test(ref.sha256||'')){incomplete.push(label+':missing_path_or_hash');return null;}
    const target=path.resolve(here,ref.path),rel=path.relative(here,target);
    if(rel.startsWith('..')||path.isAbsolute(rel)||!fs.existsSync(target)||!fs.statSync(target).isFile()){incomplete.push(label+':unresolved_local_file');return null;}
    const data=fs.readFileSync(target),actual=hash(data);
    if(actual!==ref.sha256){hashMismatches.push({path:ref.path,expected_sha256:ref.sha256,actual_sha256:actual,label});incomplete.push(label+':hash_mismatch');return null;}
    verified.set(ref.path,actual);return data;
  };
  normalizedClosureFiles=Array.isArray(receipt.implementation_closure)?receipt.implementation_closure:Array.isArray(receipt.implementation_closure?.files)?receipt.implementation_closure.files:null;
  if(!normalizedClosureFiles)incomplete.push('implementation_closure.files_missing');
  const stageMapPath=path.join(here,'schemas-strict','stage-map.json');
  const stageMap=fs.existsSync(stageMapPath)?JSON.parse(fs.readFileSync(stageMapPath,'utf8')):{stages:{}};
  const rows=receipt.adapter_receipts||[],apiRows=receipt.post_validator?.api_mapping||[];
  if(rows.length!==10||new Set(rows.map(r=>r.stage_id)).size!==10)incomplete.push('ten_distinct_adapter_receipts_required');
  if(apiRows.length!==10||new Set(apiRows.map(r=>r.stage_id)).size!==10)incomplete.push('ten_distinct_API_mappings_required');
  for(const prompt of promptChecks){
    const stageEntry=Object.entries(stageMap.stages||{}).find(([,s])=>s.prompt_path===prompt.path);
    if(!stageEntry){incomplete.push(prompt.path+':stage_map_entry_missing');continue;}
    const [stageId,stage]=stageEntry,row=rows.find(r=>r.stage_id===stageId),api=apiRows.find(r=>r.stage_id===stageId);
    if(!row||row.prompt_path!==prompt.path||row.schema_ref!==stage.adapter_schema||row.schema_ref!==prompt.schema_ref||row.mapping_ref!==stage.mapping){incomplete.push(prompt.path+':stage_schema_mapping_join');continue;}
    verifyLocal({path:row.schema_ref,sha256:row.schema_sha256},stageId+'.schema');
    verifyLocal({path:row.mapping_ref,sha256:row.mapping_sha256},stageId+'.mapping');
    if(!api||api.prompt_path!==prompt.path||api.exported_function!=='validateArtifact'||api.checks_module!==stage.checks_module)incomplete.push(stageId+':checks_API_mapping');
    else verifyLocal({path:api.checks_module,sha256:api.checks_module_sha256},stageId+'.checks_module');
    const validation=row.validation;
    if(validation?.status!=='PASS'||validation?.executed!==true)incomplete.push(stageId+':executed_validation_receipt');
    const evidenceBytes=verifyLocal(validation?.evidence_ref,stageId+'.evidence');
    if(evidenceBytes){
      const evidence=JSON.parse(evidenceBytes);
      if(evidence.stage_id!==stageId||evidence.adapter_schema?.path!==row.schema_ref||evidence.adapter_schema?.sha256!==row.schema_sha256||evidence.mapping?.path!==row.mapping_ref||evidence.mapping?.sha256!==row.mapping_sha256)incomplete.push(stageId+':evidence_scope_mismatch');
    }
  }
  verifyLocal(receipt.post_validator,'post_validator');
  verifyLocal(receipt.post_validator?.strict_lint,'strict_lint');
  verifyLocal(receipt.post_validator?.hash_lib,'hash_library');
  verifyLocal(receipt.mapping_manifest,'mapping_manifest');
  verifyLocal(receipt.fixture_runs,'fixture_runs_receipt');
  verifyLocal(receipt.node_tests,'node_tests_receipt');
  verifyLocal({path:receipt.implementation_closure?.inspector,sha256:receipt.implementation_closure?.inspector_sha256},'closure_inspector');
  for(const ref of receipt.handoff_targets_consumed||[])verifyLocal(ref,'handoff_input');
  for(const ref of normalizedClosureFiles||[])verifyLocal(ref,'implementation_closure');
  const tests=receipt.node_tests?.summary,fixtures=receipt.fixture_runs?.summary;
  if(tests?.fail!==0||tests?.all_exit_zero!==true)incomplete.push('owner_node_test_summary_not_passing');
  if(fixtures?.mismatched!==0||fixtures?.mapping_errors!==0||fixtures?.stages_run?.length!==10)incomplete.push('owner_fixture_summary_incomplete');
  adapterReceiptCheck={status:incomplete.length?'STALE_OR_INCOMPLETE_OWNER_RECEIPT':configuredPinMatches?'PINNED_EXECUTED_RECEIPTS_PRESENT':'UNPINNED_OWNER_RECEIPT_PRESENT',path:slashReceiptPath(ownerReceiptPath),observed_sha256:actualReceiptHash,configured_pin_matches:configuredPinMatches,normalized_protocol:'ClaudeSchemaReceipt.0.4.0',incomplete:[...new Set(incomplete)],hash_mismatches:hashMismatches,verified_file_count:verified.size,owner_test_summary:tests||null,owner_fixture_summary:fixtures||null,integration_acceptance:'Not granted by metadata inspection; owner feedback and independent integration review remain separate.'};
}
function slashReceiptPath(target){return path.relative(here,target).replaceAll('\\','/');}
const observedClosure=inspectImplementationClosure({projectRoot:here,receiptFiles:normalizedClosureFiles});
if(errors.length&&qualificationResult.qualification_status==='qualified'){
  qualificationResult={role_id:'04',qualification_status:'not_qualified',report_status:'binding_integrity_failed',validation_errors:['Late prompt/header/provenance integrity checks failed.']};
  if(!unqualifiedRoles.includes('04'))unqualifiedRoles.push('04');
}
const blockers=[
  ...(unboundRoles.length?[{kind:'unbound_contract',role_ids:unboundRoles}]:[]),
  ...(missingSchemas.length?[{kind:'missing_referenced_schemas',paths:missingSchemas}]:[]),
  ...(unqualifiedRoles.length?[{kind:'role_qualification_pending',count:unqualifiedRoles.length}]:[]),
  ...(adaptersUnset.length?[{kind:'role_adapter_configuration_pending',count:adaptersUnset.length}]:[]),
  ...(unconfiguredModels.length?[{kind:'authoring_or_review_model_configuration_pending',bot_ids:unconfiguredModels}]:[]),
  ...(unresolvedIntake.length?[{kind:'unresolved_run_intake',fields:unresolvedIntake}]:[]),
  ...(unresolvedBudgets.length?[{kind:'unresolved_provider_budgets',fields:unresolvedBudgets}]:[]),
  ...(!stateConfirmed?[{kind:'state_selection_pending',detail:'A non-null candidate jurisdiction does not establish founder selection. Regular passenger-car written-test prep is the locked product scope.'}]:[]),
  ...(plannedScripts.length?[{kind:'planned_role_scripts_not_implemented',paths:plannedScripts}]:[]),
  ...(activeReviewers.some(r=>!r.scope_assignment)?[{kind:'run_specific_review_scope_assignments_pending'}]:[]),
  ...(strictPrerequisites.length?[{kind:'strict_adapter_prerequisites_missing',external_owner:'Claude projection/post-validator lane',paths:strictPrerequisites}]:[]),
  ...(!postValidatorExists?[{kind:'deterministic_post_validator_missing',external_owner:'Claude projection/post-validator lane',path:'tools/belt/post-validate.mjs'}]:[]),
  ...(adapterReceiptCheck.status!=='PINNED_EXECUTED_RECEIPTS_PRESENT'?[{kind:'adapter_validation_receipts_unresolved',external_owner:'Claude projection/post-validator lane',receipt:adapterReceiptCheck}]:[]),
  ...(!observedClosure.closure_complete||observedClosure.receipt_status!=='LISTED_HASHES_MATCH_ONLY'?[{kind:'implementation_closure_unsealed',receipt_status:observedClosure.receipt_status,missing_files:observedClosure.missing_files,unlisted_dependencies:observedClosure.unlisted_dependencies,changed_dependencies:observedClosure.changed_dependencies,errors:observedClosure.validation_errors}]:[]),
  ...(controllerHeader.status==='missing'?[{kind:'controller_header_template_missing'}]:[]),
  ...(!authorshipRef?[{kind:'prompt_authorship_provenance_missing'}]:[]),
  ...(independenceResult.status!=='PASS'?[{kind:'two_independent_provider_families_unresolved',eligible_family_count:independenceResult.eligible_provider_family_count,detail:'Resolve actual candidate, authoring-prompt and intervention lineage; assign two eligible qualified families or HOLD. Google is not automatically activated.'}]:[]),
  ...(uiValidation.status==='FAIL'?[{kind:'ui_spec_validation_failed',errors:uiValidation.errors}]:[]),
  ...(qualificationResult.report_status==='invalid'?[{kind:'invalid_qualification_report',role_id:'04',reasons:qualificationResult.validation_errors}]:[]),
  {kind:'execution_disabled',detail:'This reviewed-configuration draft has not enabled or demonstrated a live belt run.'}
];
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',binding_integrity:errors.length?'FAIL':'PASS',execution_readiness:'NOT_READY_FOR_EXECUTION',execution_blockers:blockers,verification_debt_fields:verificationDebtFields,notes,prompt_checks:promptChecks,controller_header:controllerHeader,script_implementation_inventory:scriptImplementationInventory,adapter_validation_receipt:adapterReceiptCheck,observed_closure:observedClosure,audit_independence:independenceResult,ui_validation:uiValidation,optional_preview_parity:previewRoles?'checked':'not_requested',run_config:normalize(configPath),registry_spec_inherited_from_template:!config.contract_binding_registry,roles:registry.roles.length,roles_active:activeRoles.length,inactive_for_pilot:registry.roles.filter(r=>r.assignment_status==='inactive_for_pilot').map(r=>r.role_id),pinned_contracts:registry.roles.filter(r=>['pinned','pinned_local'].includes(r.contract.status)).length,unbound_roles:unboundRoles,review_bots:registry.review_bots.length,review_bots_active:activeReviewers.length,qualification_result_04:qualificationResult,qualification_sources:activeRoles.map(r=>({role_id:r.role_id,...r.qualification_source,effective_qualification_status:r.role_id==='04'?qualificationResult.qualification_status:r.execution.qualification_status})),schema_references:schemaRefs.length,unique_schema_paths:new Set(schemaRefs.map(s=>s.path)).size,missing_schema_paths:missingSchemas,registry:normalize(registryPath),errors},null,2));
if(errors.length)process.exitCode=1;
