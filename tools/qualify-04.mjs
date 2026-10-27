import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {inspectAuditIndependence} from './check-audit-independence.mjs';
import {inspectSavedPostValidationReceipt,evaluateInvocationChronology} from './wrap-post-validation-receipt.mjs';

// Read-only inspection of saved evidence. This module cannot call a model, open SQLite,
// start a controller, create a report or change a binding/qualification flag on disk.
const moduleProjectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const equal=(left,right)=>JSON.stringify(left)===JSON.stringify(right);
// Frozen originality policy: letter/number runs after NFKC + lowercase.
export const overlap_tokens=text=>String(text).normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu)||[];
// Ordinary word limits follow the owner's whitespace chunks containing letters/numbers.
export const word_limit_count=text=>typeof text==='string'?text.trim().split(/\s+/).filter(token=>/[\p{L}\p{N}]/u.test(token)).length:0;
const inside=(root,target)=>{const rel=path.relative(root,target);return rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel));};
const completeHash=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);

/** Small fail-closed validator for the documented local Draft2020 schemas. */
export function validateJsonSchema(schema,value){
  const errors=[];
  const annotations=new Set(['$schema','$id','$comment','title','description','default','examples','$defs','definitions','readOnly','writeOnly','deprecated']);
  const supported=new Set(['$ref','type','const','enum','properties','patternProperties','required','additionalProperties','minProperties','maxProperties','items','prefixItems','minItems','maxItems','uniqueItems','contains','minContains','maxContains','minLength','maxLength','minimum','maximum','exclusiveMinimum','exclusiveMaximum','multipleOf','pattern','format','allOf','anyOf','oneOf','not','if','then','else','dependentRequired',...annotations]);
  const run=(node,data,location,depth=0)=>{
    if(depth>100){errors.push(location+': schema recursion limit');return;}
    if(node===true)return;
    if(node===false){errors.push(location+': false schema');return;}
    if(!isRecord(node)){errors.push(location+': invalid schema node');return;}
    for(const key of Object.keys(node))if(!supported.has(key)&&!key.startsWith('x-'))errors.push(location+': unsupported keyword '+key);
    if(node.$ref){
      if(typeof node.$ref!=='string'||!node.$ref.startsWith('#/')){errors.push(location+': external schema ref unsupported');return;}
      let target=schema;
      for(const key of node.$ref.slice(2).split('/'))target=target?.[key.replaceAll('~1','/').replaceAll('~0','~')];
      if(target===undefined){errors.push(location+': unresolved schema ref');return;}
      run(target,data,location,depth+1);
    }
    if(node.type){
      const types=Array.isArray(node.type)?node.type:[node.type];
      const hasType=type=>type==='null'?data===null:type==='array'?Array.isArray(data):type==='object'?isRecord(data):type==='integer'?Number.isInteger(data):type==='number'?typeof data==='number'&&Number.isFinite(data):typeof data===type;
      if(!types.some(hasType)){errors.push(location+': type mismatch');return;}
    }
    if(Object.hasOwn(node,'const')&&!equal(node.const,data))errors.push(location+': const mismatch');
    if(node.enum&&!node.enum.some(candidate=>equal(candidate,data)))errors.push(location+': enum mismatch');
    const matches=branch=>{const start=errors.length;run(branch,data,location,depth+1);const valid=errors.length===start;errors.splice(start);return valid;};
    for(const group of ['allOf','anyOf','oneOf'])if(node[group]){
      const found=node[group].map(matches);
      if(group==='allOf'?!found.every(Boolean):group==='anyOf'?!found.some(Boolean):found.filter(Boolean).length!==1)errors.push(location+': '+group+' failed');
    }
    if(node.not&&matches(node.not))errors.push(location+': not failed');
    if(node.if){if(matches(node.if)){if(node.then)run(node.then,data,location,depth+1);}else if(node.else)run(node.else,data,location,depth+1);}
    if(Array.isArray(data)){
      if(node.minItems!==undefined&&data.length<node.minItems||node.maxItems!==undefined&&data.length>node.maxItems)errors.push(location+': array length');
      if(node.uniqueItems&&new Set(data.map(item=>JSON.stringify(item))).size!==data.length)errors.push(location+': duplicate array items');
      const prefix=node.prefixItems||[];prefix.forEach((item,index)=>{if(index<data.length)run(item,data[index],location+'['+index+']',depth+1);});
      if(node.items!==undefined)data.forEach((item,index)=>{if(index>=prefix.length)run(node.items,item,location+'['+index+']',depth+1);});
      if(node.contains){
        let actual=0;for(const item of data){const start=errors.length;run(node.contains,item,location,depth+1);if(errors.length===start)actual++;errors.splice(start);}
        if(actual<(node.minContains??1)||node.maxContains!==undefined&&actual>node.maxContains)errors.push(location+': contains failed');}
    }else if(isRecord(data)){
      for(const key of node.required||[])if(!Object.hasOwn(data,key))errors.push(location+': missing '+key);
      if(node.minProperties!==undefined&&Object.keys(data).length<node.minProperties||node.maxProperties!==undefined&&Object.keys(data).length>node.maxProperties)errors.push(location+': property count');
      for(const [key,item]of Object.entries(data)){
        let covered=false;if(Object.hasOwn(node.properties||{},key)){run(node.properties[key],item,location+'.'+key,depth+1);covered=true;}
        for(const [pattern,rule]of Object.entries(node.patternProperties||{}))if(new RegExp(pattern).test(key)){run(rule,item,location+'.'+key,depth+1);covered=true;}
        if(!covered&&node.additionalProperties===false)errors.push(location+': unknown '+key);
        else if(!covered&&isRecord(node.additionalProperties))run(node.additionalProperties,item,location+'.'+key,depth+1);
      }
      for(const [key,dependencies]of Object.entries(node.dependentRequired||{}))if(Object.hasOwn(data,key))for(const dependency of dependencies)if(!Object.hasOwn(data,dependency))errors.push(location+': '+key+' requires '+dependency);
    }else if(typeof data==='string'){
      if(node.minLength!==undefined&&[...data].length<node.minLength||node.maxLength!==undefined&&[...data].length>node.maxLength)errors.push(location+': string length');
      if(node.pattern&&!new RegExp(node.pattern,'u').test(data))errors.push(location+': pattern mismatch');
      if(node.format){const valid=node.format==='date-time'?/^\d{4}-\d\d-\d\dT/.test(data)&&Number.isFinite(Date.parse(data)):node.format==='uri'?/^https?:\/\//.test(data):false;if(!valid)errors.push(location+': unsupported/invalid format');}
    }else if(typeof data==='number'){
      for(const [name,bad]of [['minimum',data<node.minimum],['maximum',data>node.maximum],['exclusiveMinimum',data<=node.exclusiveMinimum],['exclusiveMaximum',data>=node.exclusiveMaximum]])if(node[name]!==undefined&&bad)errors.push(location+': '+name+' failed');
      if(node.multipleOf!==undefined&&Math.abs(data/node.multipleOf-Math.round(data/node.multipleOf))>1e-10)errors.push(location+': multipleOf failed');
    }
  };
  try{run(schema,value,'$');}catch(error){errors.push('$: invalid schema or value: '+String(error.message||error));}return errors;
}

export function evaluateHeldoutOutcomes(outcomes,expectedItems,minimumCovered=15){
  const errors=[];
  const ids=expectedItems.map(item=>typeof item==='string'?item:item.item_id||item.id);
  const counts={covered_correct:0,qualifier_loss:0,contradicted:0,not_covered:0};
  if(ids.length!==15||new Set(ids).size!==15||ids.some(id=>typeof id!=='string'||!id))errors.push('Exactly15 unique presealed held-out item IDs are required');
  if(!Array.isArray(outcomes))return{status:'FAIL',counts,validation_errors:[...errors,'Held-out outcomes are missing']};
  if(outcomes.length!==15||new Set(outcomes.map(o=>o.item_id)).size!==outcomes.length)errors.push('Every held-out item needs exactly one outcome');
  for(const item of outcomes){if(!ids.includes(item.item_id))errors.push('Unknown held-out item ID: '+item.item_id);if(!Object.hasOwn(counts,item.outcome))errors.push('Invalid held-out outcome: '+item.outcome);else counts[item.outcome]++;if(item.outcome==='covered_correct'&&(!Array.isArray(item.card_ids)||item.card_ids.length===0))errors.push('Covered outcome lacks actual card IDs: '+item.item_id);}
  if(counts.covered_correct<minimumCovered||counts.qualifier_loss||counts.contradicted||counts.not_covered)errors.push('Held-out coverage/errors fail the frozen criterion');
  return{status:errors.length?'FAIL':'PASS',counts,validation_errors:errors};
}

export function longestWordOverlap(sourceText,learnerFields){
  const positions=new Map();overlap_tokens(sourceText).forEach((word,index)=>{if(!positions.has(word))positions.set(word,[]);positions.get(word).push(index);});
  let maximum=0;const perField=[];
  for(const [field,text]of Object.entries(learnerFields)){
    let prior=new Map();let fieldMaximum=0;
    for(const word of overlap_tokens(text)){const current=new Map();for(const position of positions.get(word)||[]){const length=(prior.get(position-1)||0)+1;current.set(position,length);fieldMaximum=Math.max(fieldMaximum,length);}prior=current;}
    maximum=Math.max(maximum,fieldMaximum);perField.push({field,longest_contiguous_source_words:fieldMaximum});
  }
  return{maximum,per_field:perField};
}

export function qualificationCardView(output){
  const cards=(output?.decks||[]).flatMap(deck=>deck.cards||[]);
  const cardIds=new Set(cards.map(card=>card.card_id));
  const learnerFields={};
  for(const card of cards)for(const key of ['front','back','memory_hook'])learnerFields[card.card_id+'.'+key]=card[key];
  for(const [index,recap]of (output?.recaps||[]).entries())for(const [hookIndex,hook]of (recap.recap_hooks||[]).entries())learnerFields['recaps['+index+'].recap_hooks['+hookIndex+']']=hook?.text;
  return{cards,cardIds,learnerFields};
}

export function measureTeachingUnits(document,{factIds=[],schema}={}){
  const errors=schema?validateJsonSchema(schema,document):[];
  const facts=new Set(factIds);const units=Array.isArray(document?.units)?document.units:[];
  let totalSpans=0,resolvedSpans=0;const unresolved=[];const perUnit=[];
  function visit(value,location){
    if(Array.isArray(value)){value.forEach((item,index)=>visit(item,location+'['+index+']'));return;}
    if(!isRecord(value))return;
    if(typeof value.text==='string'&&Array.isArray(value.fact_ids)){totalSpans++;if(value.fact_ids.length&&value.fact_ids.every(id=>facts.has(id)))resolvedSpans++;else unresolved.push(location);}
    for(const [key,item]of Object.entries(value))visit(item,location+'.'+key);
  }
  if(!units.length)errors.push('At least one teaching unit is required');
  units.forEach((unit,index)=>{
    const slides=Array.isArray(unit.slides)?unit.slides:[];const unitErrors=[];
    const average=slides.length?slides.reduce((sum,s)=>sum+(s.narration?.text?.length||0),0)/slides.length:0;
    if(slides.length<6||slides.length>8)unitErrors.push('slides must number6..8');
    if(average<400)unitErrors.push('average narration must be at least400 characters');
    if(slides[0]?.kind!=='opening'||slides.at(-1)?.kind!=='close')unitErrors.push('opening/close order missing');
    if(!slides.some(s=>['trap','bridge'].includes(s.kind)))unitErrors.push('trap/bridge missing');
    if(!slides.some(s=>s.kind==='self_check'))unitErrors.push('self_check slide missing');
    for(const s of slides){if(word_limit_count(s.title?.text||'')>6)unitErrors.push('slide title exceeds6words');for(const line of s.lines||[])if(word_limit_count(line.text||'')>15)unitErrors.push('slide line exceeds15words');if(s.kind==='concept'&&(s.lines?.length<2||s.lines?.length>4))unitErrors.push('concept lines must number2..4');}
    if(!Array.isArray(unit.why_how)||!unit.why_how.length||!unit.worked_example||!unit.misconception||!unit.memory_support||!unit.self_check)unitErrors.push('structured decompression component missing');
    visit(unit,'units['+index+']');errors.push(...unitErrors.map(e=>unit.unit_id+': '+e));
    perUnit.push({unit_id:unit.unit_id,slides:slides.length,average_narration_characters:average,why_how_count:unit.why_how?.length||0,worked_example_count:unit.worked_example?1:0,misconception_correction_count:unit.misconception?1:0,memory_support_count:unit.memory_support?1:0,aligned_self_check_count:unit.self_check?1:0});
  });
  const uniform=units.length>1&&new Set(perUnit.map(u=>u.slides)).size===1;
  if(uniform)errors.push('Uniform slide-count vector violates OrderQ rule7');
  if(unresolved.length)errors.push('Unresolved fact IDs in '+unresolved.length+' learner spans');
  return{status:errors.length?'FAIL':'PASS',per_unit:perUnit,learner_span_count:totalSpans,resolved_span_count:resolvedSpans,fact_id_resolution_ratio:totalSpans?resolvedSpans/totalSpans:0,unresolved_spans:unresolved,uniform_slide_count_check:units.length<2?'not_applicable_single_unit':uniform?'FAIL':'PASS',validation_errors:errors};
}

export function inspectQualification04({projectRoot=moduleProjectRoot,repoRoot=path.resolve(projectRoot,'..'),runConfigPath=path.join(projectRoot,'RDMV-RUN-CONFIG.template.json'),registry,reportPath:explicitReportPath}={}){
  const result={role_id:'04',qualification_status:'not_qualified',qualification_source:'scoped_held_out_qualification_report',report_ref:'qualification/QUALIFICATION-REPORT-04.json',report_status:'absent',validation_errors:[]};
  const errors=result.validation_errors;const requireThat=(test,message)=>{if(!test)errors.push(message);};
  const resolveEvidence=value=>{
    if(typeof value!=='string'||!value.trim())throw new Error('Missing evidence path');
    let target;if(path.isAbsolute(value))target=path.resolve(value);else if(/^(factory|schemas)\//.test(value)||/^AMENDMENT-/.test(value))target=path.resolve(repoRoot,value);else target=path.resolve(projectRoot,value);
    if(!inside(repoRoot,target))throw new Error('Evidence path escapes the Nova workspace');
    if(fs.existsSync(target)&&!inside(fs.realpathSync(repoRoot),fs.realpathSync(target)))throw new Error('Evidence symlink/junction escapes the Nova workspace');
    if(/(^|[\\/])(?:\.env(?:\.[^\\/]*)?|\.aws|\.ssh|credentials|id_rsa|id_ed25519)(?:$|[\\/])/i.test(target))throw new Error('Credential files are forbidden evidence');
    return target;
  };
  const pinned=(ref,label)=>{
    if(!isRecord(ref)||!completeHash(ref.sha256)||typeof ref.path!=='string')throw new Error(label+': incomplete path/hash');
    const target=resolveEvidence(ref.path);const bytes=fs.readFileSync(target);if(digest(bytes)!==ref.sha256)throw new Error(label+': hash mismatch');return{path:target,bytes,data:()=>JSON.parse(bytes)};
  };
  try{
    const config=JSON.parse(fs.readFileSync(runConfigPath,'utf8'));
    const reportPath=explicitReportPath?resolveEvidence(explicitReportPath):config.producer?.qualification_report_ref?path.resolve(path.dirname(runConfigPath),config.producer.qualification_report_ref):path.join(projectRoot,result.report_ref);
    if(!inside(projectRoot,reportPath))throw new Error('Qualification report must remain inside the hackathon project');
    result.report_ref=path.relative(projectRoot,reportPath).replaceAll('\\','/');
    if(!fs.existsSync(reportPath))return result;
    result.report_status='invalid';
    const report=JSON.parse(fs.readFileSync(reportPath,'utf8'));
    const indexPath=path.join(projectRoot,'qualification','RUBRIC-04-road-signs.json');
    const index=JSON.parse(fs.readFileSync(indexPath,'utf8'));
    const criteriaPin=pinned(index.criteria,'criteria index pin');const criteria=criteriaPin.data();
    const schemaPin=pinned(index.report_schema,'report schema index pin');const schema=schemaPin.data();
    const schemaErrors=validateJsonSchema(schema,report);requireThat(!schemaErrors.length,'Report schema invalid: '+schemaErrors.slice(0,8).join('; '));
    if(schemaErrors.length)return result;
    requireThat(report.verdict==='PASS','Only an actual PASS report can qualify04');
    if(report.verdict!=='PASS')return result;
    requireThat(report.schema_version==='qualification-report.04.v0.4.0','Unexpected report version');
    const bundle=JSON.parse(fs.readFileSync(path.join(projectRoot,'REVIEW-BUNDLE.json'),'utf8'));
    const requireSealed=(ref,label)=>requireThat(bundle.primary_targets?.some(t=>path.resolve(projectRoot,t.path)===resolveEvidence(ref.path)&&t.sha256===ref.sha256),label+' is not pinned by the current sealed review bundle');
    const reportedCriteria=pinned(report.criteria,'reported criteria');requireThat(reportedCriteria.path===criteriaPin.path&&report.criteria.sha256===index.criteria.sha256,'Report uses different frozen criteria');requireSealed(report.criteria,'Criteria');
    requireThat(criteria.status==='FROZEN_CRITERIA','Qualification criteria are not frozen');
    const bindingPin=pinned(report.binding,'binding instance');const binding=bindingPin.data();
    requireThat(binding.status==='BOUND'&&binding.schema_version==='qualification-binding.04.v0.4.0','Binding instance is not bound');
    requireThat(binding.criteria?.sha256===report.criteria.sha256&&binding.criteria?.path===report.criteria.path,'Binding/criteria mismatch');
    requireThat(binding.run_id===report.run_id&&binding.candidate_lineage_id===report.candidate_lineage_id&&binding.stage_id===report.stage_id&&report.run_id===config.run_id,'Run/lineage/stage mismatch');
    requireThat(config.execution_enabled===true,'Selected config has execution disabled; a report cannot grant execution authority');
    const state=report.source_binding;
    requireThat(config.state_selection?.status==='confirmed'&&config.state_selection?.confirmed_by==='founder'&&config.state_selection.jurisdiction===state.jurisdiction&&state.jurisdiction===config.scope?.jurisdiction,'Selected state lacks founder confirmation');
    requireThat(equal(state,binding.source_binding)&&state.issuing_authority===config.scope?.issuing_authority&&state.edition===config.scope?.handbook_edition,'Selected source binding differs from configuration/instance');
    requireThat(!/verify|pending|unresolved/i.test(state.effective_date),'Source effective date remains verification debt');
    const role=registry?.roles?.find(r=>r.role_id==='04');
    const contractPin=pinned(report.contract,'04 contract');
    requireThat(role&&report.contract.sha256===role.contract.sha256&&contractPin.path===resolveEvidence(role.contract.path)&&report.contract.sha256===criteria.canonical_contract.sha256,'Canonical04 contract pin mismatch');
    const adapterPin=pinned(report.adapter,'local adapter');
    requireThat(adapterPin.path===path.join(projectRoot,criteria.adapter.path)&&binding.adapter?.sha256===report.adapter.sha256,'Adapter/binding mismatch');requireSealed(report.adapter,'Adapter');
    const inputRefs=report.input_refs||[];
    for(const kind of criteria.required_input_kinds){const actual=inputRefs.filter(r=>r.kind===kind);requireThat(actual.length===1,'Missing/duplicate input kind: '+kind);const expected=binding.inputs?.find(r=>r.kind===kind);requireThat(expected&&actual[0]?.sha256===expected.sha256&&actual[0]?.path===expected.path,'Input differs from binding: '+kind);}
    const inputs=new Map(inputRefs.map(ref=>[ref.kind,pinned(ref,'input '+ref.kind)]));
    requireThat(inputs.get('run_config')?.path===path.resolve(runConfigPath),'Input configuration differs from inspected config');
    const outputPin=pinned(report.output,'CardDeck');const output=outputPin.data();const {cards,cardIds,learnerFields}=qualificationCardView(output);
    requireThat(cards.length>=criteria.scope.minimum_card_count&&report.output.card_count===cards.length&&cardIds.size===cards.length&&[...cardIds].every(id=>typeof id==='string'&&id.length>0),'Card count/identity mismatch');
    const sourceTextPin=pinned(report.source_text_ref,'registered full source text');
    requireThat(binding.source_text_ref?.sha256===report.source_text_ref.sha256,'Source-text binding mismatch');
    const extraction=pinned(binding.source_text_extraction_receipt,'source text extraction receipt').data();
    requireThat(extraction.status==='PASS'&&extraction.source_document_sha256===digest(inputs.get('source_document').bytes)&&extraction.extracted_text_sha256===report.source_text_ref.sha256&&extraction.page_map_sha256===digest(inputs.get('page_map').bytes),'Registered full-source text/extraction provenance differs from pinned source/page map');
    const sourceText=sourceTextPin.bytes.toString('utf8');requireThat(Buffer.from(sourceText,'utf8').equals(sourceTextPin.bytes),'Source text is not valid UTF-8');
    const overlap=longestWordOverlap(sourceText,learnerFields);requireThat(overlap.maximum<=criteria.originality.max_contiguous_source_words&&report.metrics.max_contiguous_source_word_overlap===overlap.maximum,'Originality overlap failed or reported metric differs from actual text');
    const adapterErrors=validateJsonSchema(adapterPin.data(),output);requireThat(!adapterErrors.length,'Adapter validation failed: '+adapterErrors.slice(0,3).join('; '));
    const candidatePin=pinned(report.candidate_manifest,'candidate manifest');const candidate=candidatePin.data();
    requireThat(report.output.candidate_sha256===report.candidate_manifest.sha256,'Output report is bound to a different candidate manifest');
    const candidateRefs=[...(candidate.artifacts||[]),...(candidate.input_refs||[])];
    requireThat(candidateRefs.some(r=>r.sha256===report.output.sha256&&resolveEvidence(r.path)===outputPin.path),'Candidate manifest does not contain this output');
    const postPin=pinned(report.post_validation,'collector post-validation receipt');const post=postPin.data();
    const receiptSchemaPin=pinned(binding.post_validation_receipt_schema,'collector receipt schema');requireSealed(binding.post_validation_receipt_schema,'Collector receipt schema');
    const receiptErrors=validateJsonSchema(receiptSchemaPin.data(),post);requireThat(!receiptErrors.length,'Collector receipt schema invalid: '+receiptErrors.slice(0,3).join('; '));
    requireThat(binding.adapter?.artifact_validation_stage_id==='04.cards','Binding confuses logical qualification and artifact-validation stages');
    const toolPin=pinned(binding.adapter?.post_validator,'post-validator implementation');requireSealed(binding.adapter.post_validator,'Post-validator');
    const mappingPin=pinned(binding.adapter?.mapping_manifest,'per-stage adapter mapping');requireSealed(binding.adapter.mapping_manifest,'Adapter mapping');
    requireThat(post.status==='PASS'&&post.output_sha256===report.output.sha256&&post.schema_sha256===report.adapter.sha256&&post.validator_sha256===digest(toolPin.bytes)&&post.mapping_sha256===digest(mappingPin.bytes),'Collector receipt does not bind exact artifact/schema/implementation/mapping');
    requireThat(completeHash(binding.adapter.implementation_closure_sha256)&&post.implementation_closure_sha256===binding.adapter.implementation_closure_sha256&&equal(post.implementation_closure,binding.adapter.implementation_closure),'Validator closure differs from the pre-attempt committed binding');
    const postInspection=inspectSavedPostValidationReceipt({projectRoot,receiptRef:report.post_validation,expectedArtifactRef:report.output,expectedAdapterRef:report.adapter,expectedMappingRef:binding.adapter.mapping_manifest,logicalStageId:report.stage_id,artifactStageId:'04.cards'});
    requireThat(postInspection.status==='PASS','Saved owner validation proof did not pass: '+[...(postInspection.validation_errors||[]),...(postInspection.hold_reasons||[])].join('; '));
    const promptPin=pinned(report.prompt,'prompt');requireSealed(report.prompt,'Prompt');requireThat(binding.prompt?.sha256===report.prompt.sha256,'Prompt/binding mismatch');
    const footerIndex=promptPin.bytes.lastIndexOf(Buffer.from('\nprompt_template_sha256:'));
    const footer=footerIndex>=0?promptPin.bytes.subarray(footerIndex+1).toString('utf8').match(/^prompt_template_sha256: ([a-f0-9]{64})\n?$/):null;
    const bodyHash=footer?digest(promptPin.bytes.subarray(0,footerIndex+1)):null;
    requireThat(footer&&footer[1]===bodyHash&&bodyHash===report.prompt.template_body_sha256&&bodyHash===binding.prompt?.template_body_sha256,'Prompt body/footer hash mismatch');
    const headerPin=pinned(report.controller_header,'controller header');const header=headerPin.data();
    requireThat(header.mode==='qualification'&&header.execution_authorized===true&&header.run_id===report.run_id,'Rendered header lacks matching qualification authority');
    requireThat(header.task?.stage_id===report.stage_id&&header.task?.artifact_validation_stage_id==='04.cards','Rendered header confuses logical task/artifact-validation stages');
    const authority=pinned(header.authority_ref,'existing execution authority').data();requireThat(['approved','authorized'].includes(authority.status)&&authority.run_id===report.run_id&&authority.mode==='qualification'&&['founder','explicit_go_invocation'].includes(authority.source),'Header lacks evidence of existing scope/explicit execution authority');
    const headerTemplate=pinned(binding.controller_header_template,'controller header template');requireSealed(binding.controller_header_template,'Controller header template');
    requireThat(header.template_sha256===digest(headerTemplate.bytes)&&header.binding_sha256===report.binding.sha256,'Rendered header does not pin the bound template/instance');
    const heldoutPin=pinned(report.heldout,'held-out items');const heldoutData=heldoutPin.data();const heldoutItems=Array.isArray(heldoutData)?heldoutData:heldoutData.items;
    requireThat(Array.isArray(heldoutItems)&&heldoutItems.length===15,'Held-out file does not contain15 items');
    requireThat(binding.heldout?.sha256===report.heldout.sha256&&equal(binding.heldout?.authored_by,report.heldout.authored_by),'Held-out/binding identity mismatch');
    const outcomes=evaluateHeldoutOutcomes(report.heldout_outcomes,heldoutItems||[],criteria.heldout.minimum_covered_correct);requireThat(outcomes.status==='PASS',outcomes.validation_errors.join('; '));
    for(const outcome of report.heldout_outcomes){for(const id of outcome.card_ids)requireThat(cardIds.has(id),'Outcome references absent card: '+id);for(const evidence of outcome.evidence_refs)pinned(evidence,'held-out outcome evidence');}
    requireThat(report.metrics.heldout_covered_correct===outcomes.counts.covered_correct&&report.metrics.heldout_not_covered===outcomes.counts.not_covered&&report.metrics.qualifier_loss===outcomes.counts.qualifier_loss&&report.metrics.facts_contradicting_source===outcomes.counts.contradicted,'Held-out metrics disagree with per-item outcomes');
    const eventsPin=pinned(report.ledger_events,'committed ledger export');const eventsData=eventsPin.data();const events=Array.isArray(eventsData)?eventsData:eventsData.events;
    requireThat(Array.isArray(events)&&events.every(e=>Number.isInteger(e.sequence))&&new Set(events.map(e=>e.sequence)).size===events.length,'Ledger events require unique integer sequences');
    const lineageEvents=(events||[]).filter(e=>e.run_id===report.run_id&&e.candidate_lineage_id===report.candidate_lineage_id);
    if(post.artifact_binding_kind==='owner_api_invocation_snapshot'){
      const snapshot=pinned(post.invocation_snapshot,'pre-invocation collector snapshot').data();
      const snapshotSchema=pinned(binding.post_validation_invocation_schema,'pre-invocation snapshot schema');requireSealed(binding.post_validation_invocation_schema,'Pre-invocation snapshot schema');
      requireThat(validateJsonSchema(snapshotSchema.data(),snapshot).length===0,'Pre-invocation snapshot schema is invalid');
      const chronology=evaluateInvocationChronology({receipt:post,snapshot,receiptRef:report.post_validation,events:lineageEvents,runId:report.run_id,candidateLineageId:report.candidate_lineage_id,completedAt:report.completed_at});
      requireThat(chronology.status==='PASS','Owner API snapshot lacks immutable pre-invocation chronology: '+chronology.validation_errors.join('; '));
    }
    const sealPin=pinned(report.heldout.seal_event,'held-out seal event');const seal=sealPin.data();
    const bindingEventPin=pinned(report.binding_commit_event,'binding commit event');const bindingEvent=bindingEventPin.data();
    const starts=lineageEvents.filter(e=>e.type==='attempt.started'&&e.role_id==='04'&&e.stage_id===report.stage_id);const firstStart=starts.sort((a,b)=>a.sequence-b.sequence)[0];
    requireThat(seal.type==='heldout.sealed'&&seal.heldout_sha256===report.heldout.sha256&&seal.criteria_sha256===report.criteria.sha256&&seal.auditor_call_receipt_sha256===report.heldout.auditor_call_receipt.sha256,'Held-out seal lacks committed content/auditor receipt');
    requireThat(lineageEvents.some(e=>equal(e,seal))&&lineageEvents.some(e=>equal(e,bindingEvent)),'Seal/binding event is absent from committed lineage export');
    requireThat(bindingEvent.type==='qualification.binding.committed'&&bindingEvent.event_id===binding.binding_commit_event_id&&bindingEvent.binding_sha256===report.binding.sha256&&firstStart&&seal.sequence<firstStart.sequence&&bindingEvent.sequence<firstStart.sequence,'Held-out/binding commit did not precede first attempt');
    requireThat(firstStart?.binding_sha256===report.binding.sha256&&firstStart?.heldout_sha256===report.heldout.sha256,'First attempt did not pin precommitted binding/held-out hashes');
    requireThat(Date.parse(report.heldout.sealed_at)<=Date.parse(report.generation_started_at)&&Date.parse(report.generation_started_at)<=Date.parse(report.completed_at)&&Date.parse(report.completed_at)<=Date.now(),'Qualification timestamp chronology invalid');
    const authorReceipt=pinned(report.heldout.auditor_call_receipt,'held-out author call');const authorCall=authorReceipt.data();
    requireThat(authorCall.kind==='auditor_call_receipt'&&authorCall.actor_id===report.heldout.authored_by.actor_id&&authorCall.session_id===report.heldout.authored_by.session_id&&authorCall.provider_family===report.heldout.authored_by.provider_family&&authorCall.output_sha256===report.heldout.sha256,'Held-out seal is not backed by the named author call/output receipt');
    requireThat(authorCall.type!=='controller_self_attestation'&&authorCall.returned_model===report.heldout.authored_by.model&&!/verify|pending/i.test(authorCall.returned_model),'Held-out author provenance is unavailable');
    const authorQualification=pinned(report.heldout.author_qualification_ref,'held-out author qualification').data();
    requireThat(authorQualification.qualification_status==='qualified'&&authorQualification.actor_id===report.heldout.authored_by.actor_id&&authorQualification.provider_family===report.heldout.authored_by.provider_family,'Held-out author lacks independent qualified identity evidence');
    const auditors=report.audit_assignments.map(assignment=>{
      const qualification=pinned(assignment.qualification_ref,'auditor qualification').data();
      requireThat(qualification.qualification_status==='qualified'&&qualification.actor_id===assignment.actor_id&&qualification.session_id===assignment.session_id&&qualification.provider_family===assignment.provider_family&&qualification.model===assignment.model,'Scoped auditor qualification identity mismatch');
      const scopedReport=pinned(assignment.report,'scoped auditor report').data();
      requireThat(assignment.candidate_sha256===report.candidate_manifest.sha256&&scopedReport.candidate_sha256===report.candidate_manifest.sha256&&scopedReport.verdict==='PASS'&&scopedReport.actor_id===assignment.actor_id&&scopedReport.session_id===assignment.session_id&&scopedReport.provider_family===assignment.provider_family,'Scoped report does not accept the same candidate/actor');
      return{...assignment,bot_id:assignment.actor_id,qualification_status:qualification.qualification_status};
    });
    const independence=inspectAuditIndependence({projectRoot,candidateManifestRef:report.candidate_manifest,interventionLedgerRef:report.intervention_ledger,promptAuthorshipRef:binding.prompt_authorship_ref,auditors,requiredProviderFamilies:criteria.independence.minimum_eligible_audit_families});
    requireThat(independence.status==='PASS','Audit independence failed: '+(independence.validation_errors||[]).join('; '));
    const authorIndependence=inspectAuditIndependence({projectRoot,candidateManifestRef:report.candidate_manifest,interventionLedgerRef:report.intervention_ledger,promptAuthorshipRef:binding.prompt_authorship_ref,auditors:[{...report.heldout.authored_by,bot_id:'heldout-author',qualification_status:authorQualification.qualification_status}],requiredProviderFamilies:1});
    requireThat(authorIndependence.status==='PASS','Held-out author shares candidate/prompt authorship lineage or lacks evidence');
    const model=report.model;requireThat(model.provider==='meta'&&model.provider_family==='meta'&&model.requested===role.execution.model&&!/verify|pending|contributor/i.test(model.returned),'Actual standard Meta model identity missing/mismatched');
    requireThat(model.request_id_availability==='recorded'?typeof model.request_id==='string'&&model.request_id.length>0:model.request_id===null,'Request ID availability inconsistent');
    requireThat(report.attempt_count>=1&&report.attempt_count<=2&&report.attempt_evidence_refs.length===report.attempt_count&&starts.length===report.attempt_count,'Physical attempt count mismatch');
    const attemptTotals={input_tokens:0,output_tokens:0,total_tokens:0,amount_usd:0,latency_ms:0};
    for(const attemptRef of report.attempt_evidence_refs){
      const attempt=pinned(attemptRef,'attempt receipt').data();
      requireThat(attempt.kind==='model_call_receipt'&&attempt.run_id===report.run_id&&attempt.candidate_lineage_id===report.candidate_lineage_id&&attempt.role_id==='04'&&attempt.stage_id===report.stage_id&&attempt.returned_model===model.returned,'Attempt receipt lacks matching actual call provenance');
      requireThat(attempt.prompt_body_sha256===bodyHash&&attempt.header_sha256===report.controller_header.sha256&&completeHash(attempt.rendered_request_sha256),'Attempt does not pin the rendered header/body/request');
      const request=pinned(attempt.request_artifact_ref,'actual rendered request');requireThat(digest(request.bytes)===attempt.rendered_request_sha256,'Rendered request digest mismatch');
      const requestText=request.bytes.toString('utf8');requireThat(!requestText.includes(report.heldout.sha256)&&!requestText.includes(report.heldout.path),'Held-out evidence was exposed in rendered request');for(const item of heldoutItems||[])requireThat(!requestText.includes(item.item_id||item.id),'Held-out item IDs were exposed to generator');pinned(attempt.response_artifact_ref,'actual raw response');
      for(const key of ['input_tokens','output_tokens','total_tokens']){requireThat(Number.isInteger(attempt.usage?.[key])&&attempt.usage[key]>=0,'Unknown attempt usage: '+key);attemptTotals[key]+=attempt.usage?.[key]??NaN;}
      requireThat(Number.isFinite(attempt.cost?.amount_usd)&&attempt.cost.amount_usd>=0&&Number.isFinite(attempt.latency_ms)&&attempt.latency_ms>0,'Unknown attempt cost/elapsed');attemptTotals.amount_usd+=attempt.cost?.amount_usd??NaN;attemptTotals.latency_ms+=attempt.latency_ms??NaN;
    }
    const requiredChecks=criteria.blocking_checks.map(c=>c.check_id);requireThat(report.blocking_checks.length===requiredChecks.length&&new Set(report.blocking_checks.map(c=>c.check_id)).size===requiredChecks.length,'Blocking check set length/uniqueness mismatch');
    for(const checkId of requiredChecks)requireThat(report.blocking_checks.some(c=>c.check_id===checkId&&c.executed===true&&c.status==='PASS'),'Missing/unexecuted/failed check: '+checkId);
    for(const check of report.blocking_checks)for(const evidence of check.evidence_refs)pinned(evidence,'check evidence');
    requireThat(report.usage.total_tokens===report.usage.input_tokens+report.usage.output_tokens,'Usage totals inconsistent');pinned(report.cost.pricing,'pricing');
    requireThat(['input_tokens','output_tokens','total_tokens'].every(key=>report.usage[key]===attemptTotals[key])&&Math.abs(report.cost.amount_usd-attemptTotals.amount_usd)<1e-8&&report.latency_ms>=attemptTotals.latency_ms,'Reported accounting omits or contradicts physical attempts');
    for(const card of cards){requireThat(typeof card.memory_hook==='string'&&word_limit_count(card.memory_hook)>=1&&word_limit_count(card.memory_hook)<=6,'Card hook missing or exceeds6words');requireThat(!new RegExp(criteria.memory.forbidden_back_hook_pattern,'i').test(card.back+' '+card.memory_hook),'Unspoken unit/symbol in card back/hook');}
    requireThat(report.metrics.maximum_hook_words===Math.max(...cards.map(card=>word_limit_count(card.memory_hook))),'Hook metric differs from actual cards');
    if(errors.length===0){result.qualification_status='qualified';result.report_status='valid_scoped_pass';result.scope={run_id:report.run_id,candidate_sha256:report.candidate_manifest.sha256,output_sha256:report.output.sha256,criteria_sha256:report.criteria.sha256,binding_sha256:report.binding.sha256,jurisdiction:state.jurisdiction,chapter_id:state.chapter_id,model_returned:model.returned};}
  }catch(error){result.report_status='invalid';errors.push(String(error.message||error));}
  return result;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const argv=process.argv.slice(2);const flag=name=>{const index=argv.indexOf(name);if(index<0)return undefined;if(!argv[index+1]||argv[index+1].startsWith('--'))throw new Error(name+' requires a path');return argv[index+1];};
  try{
    if(argv.some(value=>['--write','--go','--execute'].includes(value)))throw new Error('This tool is read-only; execution/write flags are forbidden');
    const runConfigPath=path.resolve(moduleProjectRoot,flag('--run-config')||'RDMV-RUN-CONFIG.template.json');
    const registry=JSON.parse(fs.readFileSync(path.join(moduleProjectRoot,'contracts','bot-contract-bindings.json'),'utf8'));
    const result=inspectQualification04({projectRoot:moduleProjectRoot,runConfigPath,registry,reportPath:flag('--report')});
    console.log(JSON.stringify(result,null,2));process.exitCode=result.qualification_status==='qualified'?0:result.report_status==='absent'?0:1;
  }catch(error){console.log(JSON.stringify({qualification_status:'not_qualified',report_status:'invalid',validation_errors:[String(error.message||error)]},null,2));process.exitCode=1;}
}
