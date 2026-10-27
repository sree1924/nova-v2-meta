import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

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
const scriptedIds=new Set(['00','12','13','14','15','16','17','19','21']);
const localUIPath=path.join(here,'contracts','ui-rdmv-tx.md');
const localRef=target=>{const data=fs.readFileSync(target);return{path:normalize(path.relative(here,target)),sha256:hash(data),bytes:data.length,status:'pinned_local'};};
const nonApplicableSchemas=new Set(['schemas/teaching-presentation.schema.json','schemas/teaching.schema.json']);
const naReason='Conditional pilot non-applicability: no active_pilot stage consumes a TeachingPresentation artifact. Session outputs must validate against the existing schemas/session-script.schema.json and schemas/voicescripts.schema.json as applicable; dev-preview tenantData assembly must preserve accepted artifact shapes. Re-evaluate applicability if pilot consumption changes; no parent schema requirement is amended.';
const profileExecution=id=>{
  const active=activeIds.has(id);
  const common={lane:lane(id),provider_proposal:null,model:null,adapter_status:'not_configured',qualification_status:'not_qualified',observed_execution:false};
  if(!active)return common;
  if(scriptedIds.has(id))return{...common,lane:'tool_assisted',provider_proposal:'script',adapter_status:'script',script_ref:{path:'tools/roles/'+id+'-role.mjs',status:'planned',file_exists:fs.existsSync(path.join(here,'tools','roles',id+'-role.mjs'))}};
  if(['07','08'].includes(id))return{...common,lane:'independent_audit',provider_proposal:'active review_bots',adapter_status:'configured_pending_smoke'};
  if(['B1','B5'].includes(id))return{...common,lane:'build_engineering',provider_proposal:id==='B1'?'claude-code':'muse-code',adapter_status:'assistant',assistant_identity_is_runtime_model:false};
  return{...common,lane:'meta_authoring',provider_proposal:'meta',model:'muse-spark-1.3',model_status:'candidate_not_verified',adapter_status:'configured_pending_smoke',...(id.startsWith('KG-')?{combined_call_owner_role_id:'03',separate_model_call:false}:{}),...(id==='01b'?{recon_only:true,fact_authority:false}:{})};
};
const qualificationSource=id=>({policy:id==='04'?'scoped_held_out_qualification_report':'qualified_by_first_accepted_artifact',status:'pending',report_ref:id==='04'?'qualification/QUALIFICATION-REPORT-04.json':null,rubric_ref:id==='04'?'qualification/RUBRIC-04-road-signs.json':null,proof_owner_role_id:id.startsWith('KG-')?'03':id,policy_does_not_imply_current_qualification:true});
// Qualification is a read-only evaluation of scoped saved evidence, never a provider call.
function qualification04(registry) {
  const result={role_id:'04',qualification_status:'not_qualified',qualification_source:'scoped_held_out_qualification_report',report_ref:config.producer?.qualification_report_ref||'qualification/QUALIFICATION-REPORT-04.json',validation_errors:[]};
  const problems=result.validation_errors;
  const requireThat=(ok,msg)=>{if(!ok)problems.push(msg);};
  const reportPath=config.producer?.qualification_report_ref?path.resolve(path.dirname(configPath),config.producer.qualification_report_ref):path.join(here,result.report_ref);
  if(path.relative(here,reportPath).startsWith('..')||path.isAbsolute(path.relative(here,reportPath))){result.report_status='invalid';problems.push('Qualification report must be inside hackathon project');return result;}
  if(!fs.existsSync(reportPath)){result.report_status='absent';return result;}
  const safePath=p=>{
    if(typeof p!=='string'||!p.trim())throw new Error('Missing evidence path');
    const candidates=path.isAbsolute(p)?[p]:[path.resolve(here,p),path.resolve(repo,p),path.resolve(path.dirname(reportPath),p)];
    const selected=candidates.find(p=>fs.existsSync(p))||candidates[0];
    if(path.relative(repo,selected).startsWith('..')||path.isAbsolute(path.relative(repo,selected)))throw new Error('Evidence path escapes Nova repository');
    return selected;
  };
  const pinned=(ref,label)=>{
    if(!ref||typeof ref.path!=='string'||!/^[0-9a-f]{64}$/i.test(ref.sha256||''))throw new Error(label+': missing path or complete SHA-256');
    const target=safePath(ref.path);
    const bytes=fs.readFileSync(target);
    if(hash(bytes)!==ref.sha256)throw new Error(label+': hash mismatch');
    return{path:target,bytes};
  };
  try {
    const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
    result.report_status='invalid';
    requireThat(report.schema_version==='qualification-report.04.v1','Unsupported report schema version');
    requireThat(report.role_id==='04'&&report.verdict==='PASS','Only a Role04 PASS report can qualify Role04');
    requireThat(report.run_id===config.run_id&&typeof report.run_id==='string','Qualification run does not match selected run config');
    const rubricPin=pinned(report.rubric,'rubric');
    requireThat(rubricPin.path===path.join(here,'qualification','RUBRIC-04-road-signs.json'),'Qualification must use the frozen local04 rubric');
    const rubric=JSON.parse(rubricPin.bytes);
    const reportShapeErrors=validateProjection(rubric.report_schema,report);
    requireThat(reportShapeErrors.length===0,'Report schema validation failed: '+reportShapeErrors.slice(0,3).join('; '));
    const frozenBundle=JSON.parse(fs.readFileSync(path.join(here,'REVIEW-BUNDLE.json'),'utf8'));
    const requireFrozen=(ref,label)=>requireThat(frozenBundle.primary_targets?.some(t=>t.path===normalize(path.relative(here,safePath(ref.path)))&&t.sha256===ref.sha256),label+' is not pinned by the sealed review bundle');
    requireFrozen(report.rubric,'Rubric');
    const role=registry.roles.find(r=>r.role_id==='04');
    const contract=pinned(report.contract,'contract');
    requireThat(contract.path===path.resolve(repo,role.contract.path)&&report.contract.sha256===role.contract.sha256,'Qualification contract differs from pinned Role04');
    const parent=pinned({path:report.schema?.parent_ref,sha256:report.schema?.parent_sha256},'parent schema');
    requireThat(parent.path===path.join(repo,'schemas','carddeck.schema.json'),'Wrong parent schema');
    requireThat(report.contract.path===rubric.canonical_contract?.path&&report.contract.sha256===rubric.canonical_contract?.sha256,'Report contract does not match frozen rubric');
    requireThat(report.schema.parent_sha256===rubric.output_schema?.parent_sha256&&report.schema.projection_ref===rubric.output_schema?.projection_ref&&report.schema.projection_sha256===rubric.output_schema?.projection_sha256,'Schema projection differs from frozen implemented rubric projection');
    const projection=pinned({path:report.schema?.projection_ref,sha256:report.schema?.projection_sha256},'schema projection');
    requireThat(path.relative(path.join(here,'schemas-strict'),projection.path).startsWith('..')===false,'Projection is outside project schemas-strict/');
    const outputPin=pinned(report.output,'CardDeck output');
    requireThat(report.output.candidate_hash===report.output.sha256,'Output candidate hash must bind the exact saved output bytes');
    const output=JSON.parse(outputPin.bytes);
    const deckCards=(output.decks||[]).flatMap(d=>d.cards||[]);
    requireThat(deckCards.length>=25&&report.output.card_count===deckCards.length,'CardDeck must contain at least25 cards and match reported count');
    for(const card of deckCards){const locator=typeof card.source_ref==='string'?card.source_ref:card.source_ref?.ref;requireThat(typeof locator==='string'&&locator.trim().length>0,'Every card requires a source reference');}
    const projectedSchema=JSON.parse(projection.bytes);
    requireThat(projectedSchema.type==='object'&&projectedSchema.additionalProperties===false&&Array.isArray(projectedSchema.required)&&['minted_by','probe','schema_version','source_refs','decks','recaps'].every(key=>projectedSchema.required.includes(key)),'Projection omits required CardDeck envelope or strict root object');
    const schemaErrors=validateProjection(projectedSchema,output);
    requireThat(schemaErrors.length===0,'Strict projection validation failed: '+schemaErrors.slice(0,3).join('; '));
    const parentErrors=validateProjection(JSON.parse(parent.bytes),output);
    requireThat(parentErrors.length===0,'Parent CardDeck validation failed: '+parentErrors.slice(0,3).join('; '));
    const requiredKinds=['run_config','source_document','source_chapter','page_map','knowledge_graph','blueprint','mutcd_sign_list'];
    requireThat(Array.isArray(report.input_refs),'Input manifest is missing');
    const inputRefs=report.input_refs||[];
    for(const kind of requiredKinds)requireThat(inputRefs.filter(r=>r.kind===kind).length===1,'Missing or duplicate input kind: '+kind);
    for(const bound of rubric.input_bindings||[]){const actual=inputRefs.find(r=>r.kind===bound.kind);requireThat(bound.path!=null&&bound.sha256!=null&&actual?.path===bound.path&&actual?.sha256===bound.sha256,'Input differs from frozen rubric binding: '+bound.kind);}
    const pinnedInputs=inputRefs.map((ref,i)=>({kind:ref.kind,...pinned(ref,'input'+i)}));
    requireThat(pinnedInputs.some(r=>r.kind==='run_config'&&r.path===configPath),'Input manifest must pin selected run configuration');
    const source=report.source_binding||{};
    requireThat(source.selection_status==='locked'&&source.jurisdiction===config.scope?.jurisdiction&&source.issuing_authority===config.scope?.issuing_authority&&source.edition===config.scope?.handbook_edition,'Source binding differs from selected configuration or is not locked');
    requireThat(typeof source.chapter_id==='string'&&source.chapter_id.length>0&&source.page_range!=null,'Source chapter/page scope missing');
    const sourceBinding=rubric.source_chapter_binding||{};
    requireThat(sourceBinding.jurisdiction===source.jurisdiction&&sourceBinding.issuing_authority===source.issuing_authority&&sourceBinding.edition===source.edition&&sourceBinding.chapter_id===source.chapter_id&&JSON.stringify(sourceBinding.pdf_page_range)===JSON.stringify(source.page_range),'Report source identity/page range differs from frozen rubric binding');
    requireThat(config.state_selection?.status==='confirmed'&&config.state_selection?.confirmed_by==='founder'&&config.state_selection?.jurisdiction===source.jurisdiction,'Candidate state is not confirmed by founder');
    const prompt=pinned(report.prompt,'prompt');
    requireThat(path.relative(path.join(here,'prompts'),prompt.path).startsWith('..')===false,'Qualification prompt is outside reviewed project prompts/');
    requireFrozen(report.prompt,'Prompt');
    const footerStart=prompt.bytes.lastIndexOf(Buffer.from('\nprompt_template_sha256:'));
    const footer=footerStart>=0?prompt.bytes.subarray(footerStart+1).toString('utf8').match(/^prompt_template_sha256: ([0-9a-f]{64})\n?$/):null;
    const promptBodyHash=footer?hash(prompt.bytes.subarray(0,footerStart+1)):null;
    requireThat(footer&&promptBodyHash===footer[1]&&report.prompt.template_body_sha256===promptBodyHash&&!prompt.bytes.includes(13)&&prompt.bytes[0]!==0xef,'Prompt template-body hash or UTF-8/no-BOM/LF footer convention mismatch');
    const heldout=pinned(report.heldout,'heldout');
    const hold=report.heldout||{};
    requireThat(hold.item_count===15&&hold.independent_of_generator===true&&hold.not_supplied_to_generator===true,'Held-out audit must contain15 independently authored items not supplied to generator');
    requireThat(typeof hold.authored_by?.actor_id==='string'&&typeof hold.authored_by?.provider==='string'&&hold.authored_by.provider.toLowerCase()!=='meta'&&typeof hold.authored_by?.model==='string'&&!/verify/i.test(hold.authored_by.model),'Held-out author identity must be a declared independent non-Meta auditor');
    const heldoutData=JSON.parse(heldout.bytes);
    const items=Array.isArray(heldoutData)?heldoutData:heldoutData.items;
    requireThat(Array.isArray(items)&&items.length===15,'Held-out evidence bytes must contain15 items');
    requireThat(Number.isFinite(Date.parse(hold.sealed_at))&&Number.isFinite(Date.parse(report.generation_started_at))&&Number.isFinite(Date.parse(report.completed_at))&&Date.parse(hold.sealed_at)<=Date.parse(report.generation_started_at)&&Date.parse(report.generation_started_at)<=Date.parse(report.completed_at)&&Date.parse(report.completed_at)<=Date.now(),'Held-out sealing must precede generation and actual completion');
    const model=report.model||{};
    const requestIdentityRecorded=model.request_id_availability==='recorded'&&typeof model.request_id==='string'&&model.request_id.length>0;
    const requestIdentityNotExposed=model.request_id===null&&model.request_id_availability==='not_exposed';
    requireThat(model.provider==='meta'&&model.requested===role.execution.model&&typeof model.returned==='string'&&model.returned.length>0&&!/verify|contributor/i.test(model.returned)&&(requestIdentityRecorded||requestIdentityNotExposed),'Missing or mismatched actual Meta model provenance');
    requireThat(Number.isInteger(report.attempt_count)&&report.attempt_count>=1&&report.attempt_count<=2,'Qualification attempt count must be1or2');
    const attempts=report.attempt_evidence_refs||[];
    requireThat(attempts.length>=report.attempt_count&&new Set(attempts.map(r=>r.path)).size===attempts.length,'Attempt evidence must cover each actual dispatch');
    for(const [i,ref]of attempts.entries())pinned(ref,'attempt evidence'+i);
    const checks=report.blocking_checks||[];
    const rubricChecks=(rubric.blocking_checks||[]).map(c=>typeof c==='string'?c:c.check_id||c.id).filter(Boolean);
    requireThat(rubricChecks.length>0,'Frozen rubric must declare named blocking checks');
    requireThat(new Set(checks.map(c=>c.check_id)).size===checks.length,'Duplicate blocking checks');
    for(const id of rubricChecks)requireThat(checks.some(c=>c.check_id===id),'Missing blocking check: '+id);
    for(const c of checks){requireThat(c.status==='PASS'&&c.executed===true&&Array.isArray(c.evidence_refs)&&c.evidence_refs.length>0,'Unexecuted/failed/unevidenced check: '+c.check_id);for(const [i,ref]of(c.evidence_refs||[]).entries())pinned(ref,'check '+c.check_id+' evidence'+i);}
    requireThat(report.metrics?.facts_contradicting_source===0&&report.metrics?.cards_missing_page_citation===0&&Number.isFinite(report.metrics?.max_contiguous_source_word_overlap)&&report.metrics.max_contiguous_source_word_overlap<=12,'Content blocking metrics failed or unknown');
    const usage=report.usage||{};
    requireThat(['input_tokens','output_tokens','total_tokens'].every(k=>Number.isInteger(usage[k])&&usage[k]>=0)&&usage.total_tokens===usage.input_tokens+usage.output_tokens,'Usage is unknown or inconsistent');
    requireThat(Number.isFinite(report.cost?.amount_usd)&&report.cost.amount_usd>=0&&typeof report.cost.estimated==='boolean','Cost is unknown');
    pinned({path:report.cost?.pricing_ref,sha256:report.cost?.pricing_sha256},'pricing');
    requireThat(Number.isFinite(report.latency_ms)&&report.latency_ms>0,'Latency must be recorded');
    if(!problems.length){result.qualification_status='qualified';result.report_status='valid_scoped_pass';result.scope={run_id:report.run_id,model_requested:model.requested,model_returned:model.returned,chapter_id:source.chapter_id,jurisdiction:source.jurisdiction,output_sha256:report.output.sha256,contract_sha256:report.contract.sha256,rubric_sha256:report.rubric.sha256};}
  }catch(error){problems.push(String(error.message||error));result.report_status='invalid';}
  return result;
}
function validateProjection(schema,value) {
  const errors=[];
  const ignored=new Set(['$schema','$id','title','description','default','examples','$defs','definitions']);
  const supported=new Set(['$ref','type','enum','const','properties','required','additionalProperties','items','minItems','maxItems','minLength','maxLength','minimum','maximum','exclusiveMinimum','exclusiveMaximum','pattern','format','anyOf','oneOf','allOf',...ignored]);
  const visit=(node,data,location,depth=0)=>{
    if(depth>100){errors.push(location+':schema recursion limit');return;}
    if(node===true)return;if(node===false){errors.push(location+':false schema');return;}
    for(const key of Object.keys(node))if(!supported.has(key))errors.push(location+':unsupported keyword '+key);
    if(node.$ref){if(!node.$ref.startsWith('#/')){errors.push(location+':external ref unsupported');return;}let ref=schema;for(const part of node.$ref.slice(2).split('/'))ref=ref?.[part.replaceAll('~1','/').replaceAll('~0','~')];if(!ref){errors.push(location+':unresolved ref');return;}visit(ref,data,location,depth+1);}
    if(node.type){const types=Array.isArray(node.type)?node.type:[node.type];const isType=t=>t==='null'?data===null:t==='array'?Array.isArray(data):t==='object'?data!==null&&typeof data==='object'&&!Array.isArray(data):t==='integer'?Number.isInteger(data):t==='number'?typeof data==='number'&&Number.isFinite(data):typeof data===t;if(!types.some(isType)){errors.push(location+':type mismatch');return;}}
    if(node.enum&&!node.enum.some(v=>JSON.stringify(v)===JSON.stringify(data)))errors.push(location+':enum mismatch');
    if('const'in node&&JSON.stringify(node.const)!==JSON.stringify(data))errors.push(location+':const mismatch');
    for(const group of ['anyOf','oneOf','allOf'])if(node[group]){const outcomes=node[group].map(part=>{const start=errors.length;visit(part,data,location,depth+1);const count=errors.length-start;errors.splice(start);return count===0;});if(group==='allOf'?!outcomes.every(Boolean):group==='oneOf'?outcomes.filter(Boolean).length!==1:!outcomes.some(Boolean))errors.push(location+':'+group+' failed');}
    if(Array.isArray(data)){if(node.minItems!=null&&data.length<node.minItems||node.maxItems!=null&&data.length>node.maxItems)errors.push(location+':array length');if(node.items)data.forEach((v,i)=>visit(node.items,v,location+'['+i+']',depth+1));}
    else if(data!==null&&typeof data==='object'){for(const k of node.required||[])if(!(k in data))errors.push(location+':missing '+k);for(const[k,v]of Object.entries(data)){if(node.properties?.[k])visit(node.properties[k],v,location+'.'+k,depth+1);else if(node.additionalProperties===false)errors.push(location+':unknown '+k);else if(node.additionalProperties&&typeof node.additionalProperties==='object')visit(node.additionalProperties,v,location+'.'+k,depth+1);}}
    else if(typeof data==='string'){if(node.minLength!=null&&data.length<node.minLength||node.maxLength!=null&&data.length>node.maxLength)errors.push(location+':string length');if(node.pattern&&!new RegExp(node.pattern).test(data))errors.push(location+':pattern mismatch');if(node.format&&(node.format!=='date-time'||!Number.isFinite(Date.parse(data))))errors.push(location+':unsupported or invalid format');}
    else if(typeof data==='number'){for(const[k,bad]of [['minimum',data<node.minimum],['maximum',data>node.maximum],['exclusiveMinimum',data<=node.exclusiveMinimum],['exclusiveMaximum',data>=node.exclusiveMaximum]])if(node[k]!=null&&bad)errors.push(location+':'+k+' failed');}
  };
  visit(schema,value,'$');return errors;
}
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
      presentation:{name:r.name,group:r.group,input:r.input,output:r.output,description:r.desc,linked_role_ids:[...r.next],links_are:'illustrative_responsibility_links_not_execution_dependencies'},
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
    artifact_type:'BotContractBindingRegistry',version:'0.3.0',pilot_profile:'0.3.0',prepared_local_date:'2026-10-26',status:'CONFIGURED_FOR_REVIEW',execution_enabled:false,
    path_base:'Nova repository root (the parent of this hackathon project); all contract and schema paths are relative to that root.',
    purpose:'Bind existing floor bot identities to pinned existing role-contract bytes. This is assignment configuration, not endpoint qualification or an execution receipt.',
    authority:['factory/factory-manifest.json','_MASTER-PROMPT.md','factory/THE-BELT.md','canonical role contract including amendments'],
    v2_overlay:{...bytesRef(overlayPath),version:overlayVersion,status:'DRAFT_NOT_APPROVED',effect:'Proposed hackathon adapter overlay; does not amend frozen parent contracts.'},
    design_source:{kind:'factory_floor_role_data',role_data_only:true,optional_refresh:'Set NOVA_FLOOR_PREVIEW_PATH and run node tools/check-bot-contracts.mjs --write --refresh-floor. Default verification and regeneration require no visualization file.'},
    global_acceptance:['Full pinned canonical contract text and its amendments are authoritative. Excerpts and presentation summaries are navigational aids, not replacement contracts.','A role cannot execute until the selected probe, exact stage inputs/outputs, schema applicability, provider/model/tools, budget, qualifications and run ownership are resolved.','Validate artifacts under role 14; preserve source references; output acceptance requires applicable structural, semantic and independent evidence.','Resolve canonical/V2 conflicts through review; this registry does not weaken frozen requirements.','The linked role IDs shown on the floor are not a dependency graph; use THE-BELT and the reviewed run plan for sequencing.','Failure handling uses the canonical role routes and stricter bounded V2 lineage policy after adoption; never restart counters by changing provider, role instance or candidate hash.'],
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
assert(registry.version==='0.3.0'&&registry.pilot_profile==='0.3.0','Expected pilot binding registry revision 0.3.0');
assert(registry.v2_overlay.status==='DRAFT_NOT_APPROVED','V2 overlay approval must stay explicit');
assert(registry.v2_overlay.path===relative(overlayPath),'Unexpected V2 overlay path');
assert(registry.v2_overlay.version===overlayVersion,'V2 declared version mismatch');
function verifyRef(ref,allowTemplate=false) {
  if (allowTemplate && ref.status==='unresolved_template') {
    assert(ref.sha256===null && ref.path.includes('<selected-probe>'),'Invalid unresolved UI template');
    return;
  }
  const base=ref.status==='pinned_local'?here:repo;
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
for (const r of registry.roles) {
  assert(r.execution_enabled===false,'Role enabled: '+r.role_id);
  assert(r.execution.observed_execution===false,'Role must not claim observed execution in review configuration: '+r.role_id);
  assert(r.assignment_status===(activeIds.has(r.role_id)?'active_pilot':'inactive_for_pilot'),'Incorrect pilot activation: '+r.role_id);
  assert(JSON.stringify(r.execution)===JSON.stringify(profileExecution(r.role_id)),'Pilot execution configuration drift: '+r.role_id);
  assert(JSON.stringify(r.qualification_source)===JSON.stringify(qualificationSource(r.role_id)),'Qualification policy drift: '+r.role_id);
  assert(r.contract.path===(r.role_id==='UI'&&r.contract.status==='pinned_local'?'contracts/ui-rdmv-tx.md':roleContracts[r.role_id]),'Contract path mismatch: '+r.role_id);
  verifyRef(r.contract,r.role_id==='UI');
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
const qualificationResult=errors.length?{role_id:'04',qualification_status:'not_qualified',report_status:'binding_integrity_failed',validation_errors:['Contract-binding integrity must pass before qualification evidence can apply.']}:qualification04(registry);
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
const plannedScripts=activeRoles.filter(r=>r.execution.script_ref?.file_exists===false).map(r=>r.execution.script_ref.path);
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
  ...(qualificationResult.report_status==='invalid'?[{kind:'invalid_qualification_report',role_id:'04',reasons:qualificationResult.validation_errors}]:[]),
  {kind:'execution_disabled',detail:'This reviewed-configuration draft has not enabled or demonstrated a live belt run.'}
];
console.log(JSON.stringify({status:errors.length?'FAIL':'PASS',binding_integrity:errors.length?'FAIL':'PASS',execution_readiness:'NOT_READY_FOR_EXECUTION',execution_blockers:blockers,verification_debt_fields:verificationDebtFields,notes,optional_preview_parity:previewRoles?'checked':'not_requested',run_config:normalize(configPath),registry_spec_inherited_from_template:!config.contract_binding_registry,roles:registry.roles.length,roles_active:activeRoles.length,inactive_for_pilot:registry.roles.filter(r=>r.assignment_status==='inactive_for_pilot').map(r=>r.role_id),pinned_contracts:registry.roles.filter(r=>['pinned','pinned_local'].includes(r.contract.status)).length,unbound_roles:unboundRoles,review_bots:registry.review_bots.length,review_bots_active:activeReviewers.length,qualification_result_04:qualificationResult,qualification_sources:activeRoles.map(r=>({role_id:r.role_id,...r.qualification_source,effective_qualification_status:r.role_id==='04'?qualificationResult.qualification_status:r.execution.qualification_status})),schema_references:schemaRefs.length,unique_schema_paths:new Set(schemaRefs.map(s=>s.path)).size,missing_schema_paths:missingSchemas,registry:normalize(registryPath),errors},null,2));
if(errors.length)process.exitCode=1;
