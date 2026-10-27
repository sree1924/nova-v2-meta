import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

// Package-definition preparation only: no provider, database, source or qualification execution.
// Frozen criteria are write-once: a changed definition requires a new versioned file.
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const ref={$ref:'#/$defs/ref'};
const text={type:'string',minLength:1};
const sha256={type:'string',pattern:'^[a-f0-9]{64}$'};
const utc={type:'string',format:'date-time'};
const array=(items,minItems=1)=>({type:'array',items,minItems});
const object=properties=>({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
const span=object({text,fact_ids:{...array(text),uniqueItems:true}});
const spanRef={$ref:'#/$defs/span'};
function writeJson(relative,value,immutable=false){
  const target=path.join(projectRoot,relative);
  const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n');
  fs.mkdirSync(path.dirname(target),{recursive:true});
  if(immutable&&fs.existsSync(target)&&!fs.readFileSync(target).equals(bytes)){
    const bundlePath=path.join(projectRoot,'REVIEW-BUNDLE.json');
    const sealed=fs.existsSync(bundlePath)?JSON.parse(fs.readFileSync(bundlePath,'utf8')):null;
    if(sealed?.primary_targets?.some(item=>item.path===relative))throw new Error('Sealed frozen definition changed; create a new version: '+relative);
  }
  fs.writeFileSync(target,bytes);
  return {path:relative,sha256:sha(bytes),bytes:bytes.length};
}

const teachingSchema={
  $schema:'https://json-schema.org/draft/2020-12/schema',
  $id:'urn:nova:local:teaching-unit:v0.4.0',
  title:'Selected-state text-first TeachingUnit collection',
  description:'Local 05-sessions artifact. Every learner-facing string is a fact-tagged Span. Structural validation does not certify source entailment.',
  ...object({
    schema_version:{const:'teaching-unit.v0.4.0'},
    input_manifest_sha256:sha256,
    candidate_lineage_id:text,
    source_registry_sha256:sha256,
    units:array(object({
      unit_id:text,module_id:text,objective_ids:{...array(text),uniqueItems:true},title:spanRef,
      why_how:array(spanRef),
      worked_example:object({scenario:spanRef,reasoning:spanRef,result:spanRef}),
      misconception:object({claim:spanRef,correction:spanRef}),
      memory_support:spanRef,
      self_check:object({prompt:spanRef,answer:spanRef,rationale:spanRef}),
      slides:{...array(object({
        slide_id:text,
        kind:{enum:['opening','concept','bridge','trap','self_check','close']},
        title:spanRef,
        lines:{...array(spanRef),maxItems:4},
        narration:spanRef,
        estimated_narration_seconds:{type:'number',minimum:30,maximum:60},
        media_role:{const:'none'},
        media_absence_reason:{const:'text_first_pilot'}
      }),6),maxItems:8}
    }))
  }),
  $defs:{span},
  'x-post-validation':[
    'Resolve every span fact_ids entry against accepted facts; require 100% resolution and independently check entailment.',
    'Per unit: first slide opening; last close; at least one trap/bridge and one self_check; concept slides have 2-4 lines.',
    'Per unit: at least six slides, average narration text length at least400 characters; titles at most6 words, each line at most15 words.',
    'Estimated narration duration30-60 seconds is a text-cadence estimate, not an audio file or measured playback claim.',
    'Across two or more units reject a uniform slide-count vector; for one unit report comparison not_applicable_single_unit.',
    'Why/how, worked example, misconception correction, memory support and aligned self-check are present for every unit; counters are computed by scripts.',
    'A source-bound misconception is explicitly labelled as a misconception; its correction and reasoning need supported fact IDs.',
    'No unresolved verification debt, source/edition mismatch or learner-visible internal trace metadata is permitted in an accepted unit.'
  ]
};
const teachingPin=writeJson('contracts/teaching-unit.schema.json',teachingSchema);
const roleContract=fs.readFileSync(path.resolve(projectRoot,'..','factory','workers','04-flashcard-engineer.md'));
const parentSchema=fs.readFileSync(path.resolve(projectRoot,'..','schemas','carddeck.schema.json'));
const checkDefinitions=[
  ['Q04-BOUND-INPUTS','Confirmed state/source/chapter, accepted graph/blueprint, media disposition, criteria/binding, prompt/header, run config and adapter hashes are committed before the first attempt.'],
  ['Q04-ADAPTER-POSTVALIDATION','The exact Claude-owned local adapter and deterministic post-validator pass, with every parent deviation and retained invariant recorded. Do not claim unchanged parent conformance where the adapter deliberately deviates.'],
  ['Q04-COUNT-COVERAGE','At least25 genuine cards from accepted nodes, with no duplicate padding; accepted nodes covered or explicitly justified merges; stable IDs and source refs.'],
  ['Q04-FACTS-HELDOUT','Exactly15 auditor-presealed source items all covered_correct. Contradicted=0, qualifier_loss=0 and not_covered=0. Missing tested facts cannot pass as zero contradictions.'],
  ['Q04-PAGE-CITATIONS','Every card resolves to an accepted selected-state source page and fact/node. Source evidence must state the claim; model memory is not source authority.'],
  ['Q04-ORIGINALITY','Longest normalized contiguous overlap in any learner field is at most12 words against the registered full source document.'],
  ['Q04-HOOK-FIDELITY','Every card has a source-true hook of at most6 words, declared hook_origin and faithful back conversion. Card backs/hooks are spoken-form text; no new whole-unit teaching claims are assigned to04.'],
  ['Q04-MEDIA-DISPOSITION','The first qualification is text-first with image cards disabled; page-sourced verbal cues require facts. Road-sign recognition/image capability needs a separate bound sign intake and qualification.'],
  ['Q04-INDEPENDENCE','Independent held-out author and all scoped auditors pass actor/session plus provider-family exclusion against candidate and authoring-prompt lineage; two eligible non-generating families are required.'],
  ['Q04-PROVENANCE','Actual standard Meta request/returned identity, rendered-request/header/body hashes, immutable raw-call evidence and candidate/output hashes resolve.'],
  ['Q04-USAGE-COST-LATENCY','All physical requests have known reconciled usage, numeric reported/estimated USD with a pricing pin and positive monotonic elapsed milliseconds.'],
  ['Q04-ATTEMPT-CHRONOLOGY','One or two physical attempts; held-out seal and binding ledger commits strictly precede first attempt by sequence; timestamps also ordered; committed audited seal is backed by a distinct auditor call receipt.']
];
const criteria={
  schema_version:'qualification-criteria.04.v0.4.0',criteria_version:'0.4.0',role_id:'04',status:'FROZEN_CRITERIA',
  definition_only:true,execution_authority:false,
  scope:{product:'regular non-commercial passenger-car written/knowledge-test preparation',chapter_class:'text_first_selected_handbook_chapter',state_selection:'binding_instance_required',minimum_card_count:25,target_card_count:25,road_sign_recognition_qualified:false,road_sign_image_qualification:'separate_later_task_with_bound_role15_sign_intake'},
  canonical_contract:{path:'factory/workers/04-flashcard-engineer.md',sha256:sha(roleContract)},
  canonical_parent_schema:{path:'schemas/carddeck.schema.json',sha256:sha(parentSchema)},
  adapter:{path:'schemas-strict/04-carddeck.schema.json',hash_owner:'binding_instance',kind:'explicit_pilot_adapter',post_validator_ref:'tools/belt/post-validate.mjs',mapping_manifest_ref:'schemas-strict/README.md'},
  required_input_kinds:['run_config','source_document','source_chapter','page_map','knowledge_graph','blueprint','source_registry','media_disposition'],
  heldout:{item_count:15,minimum_covered_correct:15,maximum_contradicted:0,maximum_qualifier_loss:0,maximum_not_covered:0,outcomes:['covered_correct','qualifier_loss','contradicted','not_covered'],sealed_before_generation:true,ledger_sequence_must_precede_attempt:true,independent_auditor_call_receipt_required:true,hidden_from_generator:true},
  independence:{levels:['actor_id','session_id','provider_family'],candidate_authors_disqualified:true,authoring_prompt_authors_disqualified:true,minimum_eligible_audit_families:2,generating_family_disqualified:true,incomplete_lineage_blocks:true},
  originality:{max_contiguous_source_words:12,normalization:'Unicode NFKC + lowercase; consecutive Unicode letter/number tokens; punctuation and whitespace separate tokens.',scope:'All learner fields separately against registered full source document; source locators are metadata, not an exclusion for teaching prose.'},
  memory:{hook_max_words:6,back_and_hook_spoken_form:true,forbidden_back_hook_pattern:'[|/%&]|\\b(?:mph|ft|oz|lbs|km/h)\\b|\\b[0-9]+(?:\\.[0-9]+)?\\s*(?:mph|ft|in|oz|lbs|km/h)\\b',hook_origin_required:true,whole_unit_decompression_owner:'05.sessions',recall_pause_owner:'05.card_scripts'},
  limits:{max_physical_attempts:2,maximum_source_overlap_words:12},
  blocking_checks:checkDefinitions.map(([check_id,requirement])=>({check_id,requirement})),
  separate_05_teaching_acceptance:{schema:teachingPin,owner:'05.sessions',minimum_why_how_spans_per_unit:1,minimum_worked_examples_per_unit:1,minimum_misconception_corrections_per_unit:1,minimum_memory_support_spans_per_unit:1,minimum_aligned_self_checks_per_unit:1,minimum_fact_id_resolution_ratio:1,minimum_slides_per_session:6,maximum_slides_per_session:8,minimum_average_narration_characters:400,title_max_words:6,line_max_words:15,estimated_narration_seconds_range:[30,60],minimum_trap_or_bridge_slides:1,uniform_slide_count_policy:'reject_when_two_or_more_units; not_applicable_single_unit'},
  frozen_definition_rule:'This criteria file contains no state/source/model/held-out binding values to fill. Changing criteria requires a new version/hash and review. A separate binding instance pins these exact criteria before a call.'
};
const criteriaPin=writeJson('qualification/CRITERIA-04-text-first.json',criteria,true);

const binding={
  schema_version:'qualification-binding.04.v0.4.0',role_id:'04',status:'PENDING_BINDINGS',execution_enabled:false,
  criteria:criteriaPin,
  run_id:null,candidate_lineage_id:null,
  stage_id:'04.qualification',run_config:null,source_binding:null,source_text_ref:null,source_text_extraction_receipt:null,inputs:criteria.required_input_kinds.map(kind=>({kind,path:null,sha256:null})),
  adapter:{path:'schemas-strict/04-carddeck.schema.json',sha256:null,artifact_validation_stage_id:'04.cards',validation_receipt:null,mapping_manifest:{path:'schemas-strict/04-carddeck.mapping.json',sha256:null},post_validator:{path:'tools/belt/post-validate.mjs',sha256:null},implementation_closure_sha256:null,implementation_closure:[]},
  post_validation_receipt_schema:{path:'qualification/POST-VALIDATION-RECEIPT.schema.json',sha256:fs.existsSync(path.join(projectRoot,'qualification','POST-VALIDATION-RECEIPT.schema.json'))?sha(fs.readFileSync(path.join(projectRoot,'qualification','POST-VALIDATION-RECEIPT.schema.json'))):null},
  post_validation_invocation_schema:{path:'qualification/POST-VALIDATION-INVOCATION.schema.json',sha256:fs.existsSync(path.join(projectRoot,'qualification','POST-VALIDATION-INVOCATION.schema.json'))?sha(fs.readFileSync(path.join(projectRoot,'qualification','POST-VALIDATION-INVOCATION.schema.json'))):null},
  prompt:{path:'prompts/04.md',sha256:null,template_body_sha256:null},
  controller_header_template:{path:'prompts/controller-header.template.json',sha256:fs.existsSync(path.join(projectRoot,'prompts','controller-header.template.json'))?sha(fs.readFileSync(path.join(projectRoot,'prompts','controller-header.template.json'))):null},
  heldout:{path:null,sha256:null,item_count:15,authored_by:null,author_qualification_ref:null,auditor_call_receipt:null,seal_event:null},
  intervention_ledger:null,prompt_authorship_ref:null,audit_assignments:[],
  media_disposition:{mode:'verbal_page_sourced_cues',image_cards_enabled:false,sign_asset_binding_ref:null},
  budget:null,
  binding_commit_event_id:null,
  note:'Template only. Selected state/source/evidence remain pending. Filling a new per-run instance never changes frozen criteria bytes. This file authorizes no generation or qualification.'
};
writeJson('qualification/BINDING-04-text-first.template.json',binding);

const refDef=object({path:text,sha256});
const actorDef=object({actor_id:text,session_id:text,provider_family:text,model:text});
const checkDef=object({check_id:text,status:{enum:['PASS','FAIL','NOT_EXECUTED']},executed:{type:'boolean'},evidence_refs:array(ref)});
const outcomeDef=object({item_id:text,outcome:{enum:criteria.heldout.outcomes},card_ids:array(text,0),fact_ids:array(text),evidence_refs:array(ref)});
const sourceDef=object({jurisdiction:text,issuing_authority:text,edition:text,effective_date:text,chapter_id:text,page_range:array({type:'integer',minimum:1}),selection_status:{const:'locked'}});
const passProperties={
  schema_version:{const:'qualification-report.04.v0.4.0'},role_id:{const:'04'},verdict:{const:'PASS'},run_id:text,candidate_lineage_id:text,stage_id:{const:'04.qualification'},
  criteria:ref,binding:ref,contract:ref,adapter:ref,post_validation:ref,candidate_manifest:ref,intervention_ledger:ref,source_text_ref:ref,
  input_refs:array({...refDef,properties:{kind:text,...refDef.properties},required:['kind','path','sha256']}),
  source_binding:sourceDef,
  output:object({path:text,sha256,candidate_sha256:sha256,card_count:{type:'integer',minimum:25}}),
  model:object({provider:{const:'meta'},provider_family:{const:'meta'},requested:text,returned:text,request_id:{type:['string','null']},request_id_availability:{enum:['recorded','not_exposed']}}),
  prompt:object({path:text,sha256,template_body_sha256:sha256}),
  controller_header:ref,
  binding_commit_event:ref,
  heldout:object({path:text,sha256,item_count:{const:15},authored_by:{$ref:'#/$defs/actor'},author_qualification_ref:ref,independent_of_generator:{const:true},not_supplied_to_generator:{const:true},sealed_at:utc,seal_event:ref,auditor_call_receipt:ref}),
  heldout_outcomes:{...array({$ref:'#/$defs/outcome'},15),maxItems:15},
  audit_assignments:array(object({actor_id:text,session_id:text,provider_family:text,model:text,scope:text,candidate_sha256:sha256,qualification_ref:ref,report:ref}),2),
  attempt_count:{type:'integer',minimum:1,maximum:2},attempt_evidence_refs:array(ref),ledger_events:ref,
  blocking_checks:{...array({$ref:'#/$defs/check'},12),maxItems:12},
  metrics:object({facts_contradicting_source:{const:0},qualifier_loss:{const:0},heldout_not_covered:{const:0},heldout_covered_correct:{const:15},cards_missing_page_citation:{const:0},max_contiguous_source_word_overlap:{type:'integer',minimum:0,maximum:12},maximum_hook_words:{type:'integer',minimum:1,maximum:6}}),
  usage:object({input_tokens:{type:'integer',minimum:0},output_tokens:{type:'integer',minimum:0},total_tokens:{type:'integer',minimum:0}}),
  cost:object({amount_usd:{type:'number',minimum:0},estimated:{type:'boolean'},pricing:ref}),
  latency_ms:{type:'number',exclusiveMinimum:0},generation_started_at:utc,completed_at:utc
};
const reportSchema={
  $schema:'https://json-schema.org/draft/2020-12/schema',$id:'urn:nova:qualification-report:04:v0.4.0',title:'Qualification report with evidence-required PASS',
  type:'object',required:['schema_version','role_id','verdict'],properties:{schema_version:{const:'qualification-report.04.v0.4.0'},role_id:{const:'04'},verdict:{enum:['PASS','FAIL','BLOCKED']},...Object.fromEntries(Object.keys(passProperties).filter(k=>!['schema_version','role_id','verdict'].includes(k)).map(k=>[k,{}]))},additionalProperties:false,
  allOf:[{if:{properties:{verdict:{const:'PASS'}},required:['verdict']},then:object(passProperties)}],
  $defs:{ref:refDef,actor:actorDef,check:checkDef,outcome:outcomeDef}
};
const reportSchemaPin=writeJson('qualification/QUALIFICATION-REPORT-04.schema.json',reportSchema);
const oldRubricPath=path.join(projectRoot,'qualification','RUBRIC-04-road-signs.json');
if(fs.existsSync(oldRubricPath)){
  const old=fs.readFileSync(oldRubricPath);const data=JSON.parse(old);
  if(data.rubric_version==='0.3.0-review'){
    const history=path.join(projectRoot,'qualification','history','RUBRIC-04-road-signs.v0.3.0.json');
    fs.mkdirSync(path.dirname(history),{recursive:true});if(!fs.existsSync(history))fs.writeFileSync(history,old);
  }
}
writeJson('qualification/RUBRIC-04-road-signs.json',{
  schema_version:'qualification-definition-index.v0.4.0',status:'FROZEN_CRITERIA_WITH_SEPARATE_PENDING_BINDING',role_id:'04',execution_enabled:false,
  legacy_filename_notice:'The historical road-signs filename is an index only. First qualification is a text-first selected-state chapter; it establishes no road-sign image recognition capability.',
  criteria:criteriaPin,binding_template:'qualification/BINDING-04-text-first.template.json',report_schema:reportSchemaPin,
  actual_report_path:'qualification/QUALIFICATION-REPORT-04.json',actual_report_exists_at_package_preparation:false,
  authoring_or_decomposition_execution:false,
  frozen_definition:'Criteria bytes are frozen independently of selected-state/source/model/held-out binding fills. New binding instances pin criteria and committed pre-attempt evidence.'
});
const fixtureSpan=value=>({text:value,fact_ids:['fixture-fact-1']});
const fixtureNarration='This is deliberately synthetic validator text. It makes no driving, licensing, legal or source-authority claim. '.repeat(5);
const fixtureSlide=(kind,index)=>({slide_id:'fixture-slide-'+index,kind,title:fixtureSpan('Generic test title'),lines:[fixtureSpan('Generic short test line.'),fixtureSpan('Another short test line.')],narration:fixtureSpan(fixtureNarration),estimated_narration_seconds:45,media_role:'none',media_absence_reason:'text_first_pilot'});
const teachingFixture={schema_version:'teaching-unit.v0.4.0',input_manifest_sha256:'a'.repeat(64),candidate_lineage_id:'SYNTHETIC-NOT-A-RUN',source_registry_sha256:'b'.repeat(64),units:[{unit_id:'fixture-unit-1',module_id:'fixture-module-1',objective_ids:['fixture-objective-1'],title:fixtureSpan('Generic test unit'),why_how:[fixtureSpan('Generic why explanation.')],worked_example:{scenario:fixtureSpan('Generic scenario.'),reasoning:fixtureSpan('Generic reasoning.'),result:fixtureSpan('Generic result.')},misconception:{claim:fixtureSpan('A labelled synthetic misconception.'),correction:fixtureSpan('A synthetic correction.')},memory_support:fixtureSpan('Generic memory cue.'),self_check:{prompt:fixtureSpan('Generic retrieval prompt?'),answer:fixtureSpan('Generic answer.'),rationale:fixtureSpan('Generic rationale.')},slides:['opening','concept','concept','trap','self_check','close'].map(fixtureSlide)}]};
writeJson('qualification/fixtures/TEACHING-UNIT.synthetic.json',{fixture_kind:'SYNTHETIC_VALIDATOR_TEST_ONLY',not_a_qualification_or_source:true,synthetic_fact_ids:['fixture-fact-1'],payload:teachingFixture});
writeJson('qualification/fixtures/NULL-PASS.synthetic.json',{fixture_kind:'SYNTHETIC_NEGATIVE_TEST_ONLY',not_a_qualification_or_source:true,payload:{...Object.fromEntries(Object.keys(passProperties).map(key=>[key,null])),schema_version:'qualification-report.04.v0.4.0',role_id:'04',verdict:'PASS'}});
writeJson('qualification/fixtures/HELDOUT-OMISSIONS.synthetic.json',{fixture_kind:'SYNTHETIC_NEGATIVE_TEST_ONLY',not_a_qualification_or_source:true,items:Array.from({length:15},(_,index)=>({item_id:'fixture-check-'+(index+1)})),outcomes:Array.from({length:15},(_,index)=>({item_id:'fixture-check-'+(index+1),outcome:'not_covered',card_ids:[],fact_ids:['fixture-fact-1'],evidence_refs:[]}))});
console.log(JSON.stringify({criteria:criteriaPin,teaching_schema:teachingPin,report_schema:reportSchemaPin,binding:'PENDING_BINDINGS',execution:false},null,2));
