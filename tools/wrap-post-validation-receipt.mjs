import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire,isBuiltin} from 'node:module';
import {fileURLToPath} from 'node:url';

// Collector metadata adapter only. It never imports or executes the owner's validator,
// starts a service, runs a model, changes artifacts or writes a receipt.
const here=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const normalize=value=>value.replaceAll('\\','/');
const inside=(root,target)=>{const rel=path.relative(root,target);return rel===''||(!rel.startsWith('..')&&!path.isAbsolute(rel));};
const validSha=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const closureDigest=refs=>sha(Buffer.from(JSON.stringify([...refs].sort((a,b)=>a.path.localeCompare(b.path)).map(ref=>({path:ref.path,sha256:ref.sha256})))));
const ruleSections=new Set(['deviations','dropped_constraints','sentinels']);
export const EXPECTED_04_CHECK_IDS=Object.freeze([
  '04.SCHEMA','04.STRING_BOUNDS','04.CARD_IDS','04.MERGES','04.EXAM_WEIGHT_STATUS',
  '04.SRS_POLICY','04.BACK_SPOKEN_FORM','04.HOOK_LENGTH','04.HOOK_ORIGIN','04.FACT_IDS',
  '04.BACK_FIDELITY','04.ATOMIC_CLUSTER','04.DUPLICATE_BACKS','04.PAGE_CITATIONS',
  '04.PAGE_RESOLUTION','04.LEARNER_SCAFFOLD','04.MEDIA_DISPOSITION','04.RECAP_PER_DECK',
  '04.DECKS_MIRROR_KG','04.ORIGINALITY','04.INPUT_BINDING','04.VERIFICATION_DEBT'
]);
const RETRIEVAL_GUARDS=['04.PAGE_CITATIONS','04.PAGE_RESOLUTION','04.STRING_BOUNDS'];

/** Locate literal module imports without interpreting strings/comments/regex as source code. */
export function literalModuleSpecifiers(code){
  const mask=new Uint8Array(code.length).fill(1);let previous='';
  for(let index=0;index<code.length;){
    const start=index;const char=code[index];
    if(char==='"'||char==="'"||char==='`'){
      const quote=char;index++;
      while(index<code.length){if(code[index]==='\\'){index+=2;continue;}if(code[index++]===quote)break;}
      mask.fill(0,start,index);previous='s';continue;
    }
    if(char==='/'&&code[index+1]==='/'){index+=2;while(index<code.length&&code[index]!=='\n')index++;mask.fill(0,start,index);continue;}
    if(char==='/'&&code[index+1]==='*'){index+=2;while(index<code.length&&!(code[index]==='*'&&code[index+1]==='/'))index++;index=Math.min(code.length,index+2);mask.fill(0,start,index);continue;}
    if(char==='/'&&(!previous||/[=(:,!\[?{};&|]/.test(previous))){
      index++;let characterClass=false;
      while(index<code.length){if(code[index]==='\\'){index+=2;continue;}if(code[index]==='[')characterClass=true;else if(code[index]===']')characterClass=false;else if(code[index]==='/'&&!characterClass){index++;while(/[a-z]/i.test(code[index]||'')&&index<code.length)index++;break;}index++;}
      mask.fill(0,start,index);previous='r';continue;
    }
    if(!/\s/.test(char))previous=char;index++;
  }
  const pattern=/\b(?:import|export)\s+(?:[^'";]*?\sfrom\s*)?['"]([^'"]+)['"]|\brequire\(\s*['"]([^'"]+)['"]\s*\)|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g;
  return[...code.matchAll(pattern)].filter(match=>mask[match.index]===1).map(match=>match[1]||match[2]||match[3]);
}

/** Only documented, explicit compensating-check mappings are accepted. Unknown layout holds. */
export function mappedCompensatingChecks(mapping,stageId){
  const errors=[];const ids=[];const downstream=[];const collector=[];let sourceLivenessRequired=false;
  if(!mapping||mapping.stage_id!==stageId)errors.push('Mapping stage is absent or different');
  if(!['strict_subset','pilot_adapter'].includes(mapping?.adapter_kind))errors.push('Mapping adapter_kind is unknown');
  const prefix=stageId?.split('.')[0];
  const identifiers=value=>typeof value==='string'?[...value.matchAll(/\b(?:\d{2}[A-Z]?|19A)\.[A-Z][A-Z0-9_]*/g)].map(match=>match[0]):[];
  const declared=Array.isArray(mapping?.checks)?mapping.checks:mapping?.compensating_checks;
  const explicit=Array.isArray(declared);
  if(explicit){
    for(const id of declared){if(typeof id!=='string'||!new RegExp('^'+prefix+'\\.[A-Z][A-Z0-9_]*$').test(id))errors.push('Unknown/nonlocal mandatory check ID');else ids.push(id);}
    if(new Set(ids).size!==ids.length)errors.push('Duplicate mandatory mapping check IDs');
  }
  if(stageId==='04.cards'&&(!explicit||!equal([...new Set(declared)].sort(),[...EXPECTED_04_CHECK_IDS].sort())))errors.push('The 04.cards mapping must declare the complete reviewed22-check set');
  const sections=[...ruleSections].filter(key=>Object.hasOwn(mapping||{},key));
  if(!sections.length)errors.push('Unknown mapping format: explicit deviations/dropped_constraints sections absent');
  for(const key of sections){
    if(!Array.isArray(mapping[key])){errors.push('Unknown mapping rule section shape: '+key);continue;}
    for(const [index,row]of mapping[key].entries()){
      if(key==='deviations'&&row?.field==='/artifact_hash'&&row.adapter_rule==='omitted'&&row.compensating_check==='post-validate.mjs CLI artifact_sha256'){
        collector.push('COLLECTOR.ARTIFACT_HASH');continue;
      }
      if(key==='dropped_constraints'&&row?.json_pointer==='/$defs/sourceRef/properties/retrieved_at'&&row.keyword==='format'&&row.parent_value==='date-time'&&row.compensating_check==='n/a — field not carried by the adapter (see deviations /source_ref)'){
        const replacement=(mapping.deviations||[]).find(item=>item.field==='/decks/*/cards/*/source_ref');
        const replacements=identifiers(replacement?.compensating_check);
        const evidenceMoved=explicit&&typeof replacement?.adapter_rule==='string'&&!replacement.adapter_rule.includes('retrieved_at')&&replacement.adapter_rule.includes('pdf_page')&&replacement.adapter_rule.includes('printed_page')&&/source registry/i.test(replacement.reason||'')&&/liveness receipt/i.test(replacement.reason||'')&&RETRIEVAL_GUARDS.every(id=>replacements.includes(id)&&declared.includes(id));
        if(evidenceMoved){sourceLivenessRequired=true;ids.push(...RETRIEVAL_GUARDS);continue;}
      }
      const checks=typeof row?.compensating_check==='string'?identifiers(row.compensating_check):Array.isArray(row?.compensating_check)?row.compensating_check:null;
      if(!checks?.length||checks.some(id=>typeof id!=='string'||!id.trim()))errors.push('Unmapped mandatory constraint: '+key+'['+index+']');else ids.push(...checks);
    }
  }
  if(mapping?.added_invariants!==undefined){
    if(!Array.isArray(mapping.added_invariants))errors.push('Unknown added_invariants section shape');
    else for(const [index,row]of mapping.added_invariants.entries()){const checks=identifiers(row?.check);if(!checks.length)errors.push('Unmapped added invariant: '+index);else ids.push(...checks);}
  }
  const localIds=ids.filter(id=>id.startsWith(prefix+'.'));
  for(const id of ids.filter(id=>!id.startsWith(prefix+'.'))){
    const rows=[...sections.flatMap(key=>Array.isArray(mapping[key])?mapping[key]:[]),...(Array.isArray(mapping?.added_invariants)?mapping.added_invariants:[])];
    if(rows.some(row=>String(row.compensating_check||row.check||'').includes(id)&&/downstream|stage\s+\d/i.test(String(row.compensating_check||row.check||''))))downstream.push(id);else errors.push('Unresolved nonlocal compensating check: '+id);
  }
  if(explicit)for(const id of localIds)if(!declared.includes(id))errors.push('Constraint refers to an undeclared mandatory check: '+id);
  for(const key of Object.keys(mapping||{}))if(/invariant|constraint|deviation|rule/i.test(key)&&!ruleSections.has(key)&&!['added_invariants','dropped_constraints_note'].includes(key))errors.push('Unrecognized mandatory rule section: '+key);
  const required=explicit?declared:localIds;
  if(!required.length)errors.push('No explicit compensating checks are mapped');
  return{status:errors.length?'HOLD':'PASS',check_ids:[...new Set(required)].sort(),collector_check_ids:[...new Set(collector)],source_liveness_required:sourceLivenessRequired,downstream_check_ids:[...new Set(downstream)].sort(),validation_errors:errors};
}

function filePin(projectRoot,target){const data=fs.readFileSync(target);return{path:normalize(path.relative(projectRoot,target)),sha256:sha(data),bytes:data.length};}
function resolvePin(projectRoot,ref){
  if(!ref||typeof ref.path!=='string'||!validSha(ref.sha256))throw new Error('Incomplete saved evidence pin');
  const repoRoot=path.resolve(projectRoot,'..');const target=path.resolve(projectRoot,ref.path);
  if(!inside(repoRoot,target)||!inside(fs.realpathSync(repoRoot),fs.realpathSync(target)))throw new Error('Evidence pin escapes Nova workspace');
  const bytes=fs.readFileSync(target);if(sha(bytes)!==ref.sha256)throw new Error('Saved evidence hash changed: '+ref.path);
  return{target,bytes,data:()=>JSON.parse(bytes)};
}

/** Conservative closure: lane code/data, local imports, Ajv package trees/transitives and lockfiles. */
export function collectImplementationClosure({projectRoot=here,artifactStageId='04.cards'}={}){
  const errors=[];const pins=new Map();const parsed=new Set();const packages=new Set();
  const add=target=>{
    const absolute=path.resolve(target);
    if(!inside(path.resolve(projectRoot,'..'),absolute)){errors.push('Implementation dependency outside Nova workspace: '+absolute);return;}
    if(!fs.existsSync(absolute)||!fs.statSync(absolute).isFile()){errors.push('Missing implementation file: '+normalize(path.relative(projectRoot,absolute)));return;}
    if(!inside(fs.realpathSync(path.resolve(projectRoot,'..')),fs.realpathSync(absolute))){errors.push('Implementation symlink escapes Nova workspace: '+absolute);return;}
    if(!pins.has(absolute))pins.set(absolute,filePin(projectRoot,absolute));
  };
  const walk=directory=>{
    if(!fs.existsSync(directory)){errors.push('Missing implementation directory: '+normalize(path.relative(projectRoot,directory)));return;}
    for(const entry of fs.readdirSync(directory,{withFileTypes:true})){const target=path.join(directory,entry.name);if(entry.isDirectory()){if(!['fixtures','node_modules','.git','test','tests'].includes(entry.name))walk(target);}else if(entry.isFile())add(target);}
  };
  let map,stage;
  try{map=JSON.parse(fs.readFileSync(path.join(projectRoot,'schemas-strict','stage-map.json'),'utf8'));stage=map.stages?.[artifactStageId];if(!stage)errors.push('Unknown artifact-validation stage');}catch(error){errors.push('Stage map unavailable: '+error.message);}
  walk(path.join(projectRoot,'tools','belt'));walk(path.join(projectRoot,'schemas-strict'));
  add(path.join(projectRoot,'package.json'));add(path.join(projectRoot,'package-lock.json'));
  add(path.join(projectRoot,'tools','wrap-post-validation-receipt.mjs'));
  if(stage){for(const key of ['adapter_schema','mapping','checks_module']){if(typeof stage[key]!=='string')errors.push('Missing stage implementation ref: '+key);else add(path.resolve(projectRoot,stage[key]));}if(stage.local_owned_schema?.path)add(path.resolve(projectRoot,stage.local_owned_schema.path));}
  const packageTree=(specifier,fromFile)=>{
    if(isBuiltin(specifier))return;
    try{
      const require=createRequire(fromFile);const resolved=require.resolve(specifier);
      if(!path.isAbsolute(resolved))return;
      let directory=path.dirname(resolved),manifest;
      while(inside(path.resolve(projectRoot,'..'),directory)){
        const candidate=path.join(directory,'package.json');if(fs.existsSync(candidate)){manifest=candidate;break;}const parent=path.dirname(directory);if(parent===directory)break;directory=parent;
      }
      if(!manifest){errors.push('Cannot pin dependency package tree: '+specifier);return;}
      if(packages.has(manifest))return;packages.add(manifest);walk(path.dirname(manifest));
      const pkg=JSON.parse(fs.readFileSync(manifest,'utf8'));for(const dependency of Object.keys(pkg.dependencies||{}))packageTree(dependency,manifest);
    }catch(error){errors.push('Implementation dependency unavailable: '+specifier+' ('+error.code+')');}
  };
  packageTree('ajv/dist/2020.js',path.join(projectRoot,'package.json'));packageTree('ajv-formats',path.join(projectRoot,'package.json'));
  for(let pass=0;pass<20;pass++){
    const candidates=[...pins.keys()].filter(file=>/\.(mjs|cjs|js)$/.test(file)&&!normalize(file).includes('/node_modules/')&&!parsed.has(file));if(!candidates.length)break;
    for(const file of candidates){parsed.add(file);const code=fs.readFileSync(file,'utf8');
      const imports=literalModuleSpecifiers(code);
      for(const specifier of imports){if(isBuiltin(specifier))continue;try{const require=createRequire(file);const resolved=require.resolve(specifier);if(specifier.startsWith('.'))add(resolved);else packageTree(specifier,file);}catch(error){errors.push('Unresolved implementation import '+specifier+' from '+normalize(path.relative(projectRoot,file)));}}
    }
  }
  const refs=[...pins.values()].sort((a,b)=>a.path.localeCompare(b.path));
  return{status:errors.length?'HOLD':'PASS',refs,sha256:closureDigest(refs),validation_errors:[...new Set(errors)]};
}

/** Pure collector preparation. Caller persists this metadata BEFORE invoking the owner API. */
export function capturePostValidationInvocation({projectRoot=here,artifactPath,contextPath,invocationId,collectorSequence,capturedAt,logicalStageId='04.qualification',artifactStageId='04.cards'}={}){
  const snapshot={schema_version:'post-validation-invocation.v0.4.0',status:'HOLD',phase:'before_validation',invocation_id:invocationId??null,collector_sequence:collectorSequence??null,captured_at:capturedAt??null,logical_stage_id:logicalStageId,artifact_stage_id:artifactStageId,artifact:null,context:null,context_strip_fixture_meta:null,implementation_closure:[],implementation_closure_sha256:null,validation_errors:[]};
  try{
    if(logicalStageId!=='04.qualification'||artifactStageId!=='04.cards')throw new Error('Snapshot logical/artifact-validation stage mismatch');
    if(typeof invocationId!=='string'||!invocationId||!Number.isInteger(collectorSequence)||collectorSequence<1||typeof capturedAt!=='string'||!Number.isFinite(Date.parse(capturedAt)))throw new Error('Caller must supply a stable invocation ID and actual pre-validation collector sequence/time');
    const target=value=>{if(typeof value!=='string')throw new Error('Missing snapshot evidence path');const absolute=path.resolve(projectRoot,value);if(!inside(projectRoot,absolute)||/(^|[\\/])\.env(?:\.[^\\/]*)?$/i.test(absolute))throw new Error('Snapshot evidence path is forbidden');return absolute;};
    snapshot.artifact=filePin(projectRoot,target(artifactPath));snapshot.context=filePin(projectRoot,target(contextPath));
    const artifact=JSON.parse(fs.readFileSync(target(artifactPath),'utf8'));const context=JSON.parse(fs.readFileSync(target(contextPath),'utf8'));
    if(Object.hasOwn(artifact,'_fixture')||context.strip_fixture_meta!==false)throw new Error('Qualification snapshot forbids fixture metadata/stripping');
    snapshot.context_strip_fixture_meta=false;
    const closure=collectImplementationClosure({projectRoot,artifactStageId});snapshot.implementation_closure=closure.refs;snapshot.implementation_closure_sha256=closure.sha256;
    if(closure.status!=='PASS')snapshot.validation_errors.push(...closure.validation_errors);else snapshot.status='READY';
  }catch(error){snapshot.validation_errors.push(String(error.message||error));}
  return snapshot;
}

/** Pure comparison seam for synthetic tests; file/closure integrity is supplied by saved inspection. */
export function evaluatePostValidationReceipt({receipt,rawResult,artifact,context,mapping,currentClosure,invocationSnapshot,expectedPins={},logicalStageId='04.qualification',artifactStageId='04.cards'}={}){
  const failures=[];const holds=[];const fail=(test,message)=>{if(!test)failures.push(message);};
  fail(receipt?.schema_version==='post-validation-receipt.v0.4.0','Unknown collector receipt version');
  fail(receipt?.logical_stage_id===logicalStageId&&receipt?.artifact_stage_id===artifactStageId,'Logical task/artifact-validation stage mismatch');
  fail(rawResult?.stage_id===artifactStageId,'Saved raw result validates the wrong artifact stage');
  fail(rawResult?.status==='PASS'&&Array.isArray(rawResult.errors)&&rawResult.errors.length===0,'Saved raw result is not an error-free PASS');
  fail(context?.strip_fixture_meta===false,'Qualification context must disable fixture stripping');
  fail(artifact&&typeof artifact==='object'&&!Object.hasOwn(artifact,'_fixture'),'Qualification output cannot contain fixture metadata');
  fail(!Object.hasOwn(rawResult?.metrics||{},'fixture_kind'),'Fixture result cannot become qualification evidence');
  for(const [name,expected]of Object.entries(expectedPins)){
    fail(receipt?.[name]?.path===expected.path&&receipt?.[name]?.sha256===expected.sha256,'Pinned '+name+' changed');
  }
  fail(receipt?.output_sha256===receipt?.artifact?.sha256,'Collector output byte hash mismatch');
  if(rawResult?.artifact_sha256===undefined){
    if(!receipt?.invocation_snapshot||!invocationSnapshot)holds.push('Bare owner API result needs a saved collector pre-invocation snapshot');
    else if(receipt.artifact_binding_kind!=='owner_api_invocation_snapshot')holds.push('Bare owner API result has the wrong binding kind');
  }else fail(rawResult.artifact_sha256===receipt?.artifact?.sha256,'Raw result/output byte hash mismatch');
  fail(receipt?.schema_sha256===receipt?.adapter?.sha256&&rawResult?.metrics?.adapter_schema_sha256===receipt?.adapter?.sha256,'Raw result/adapter schema hash mismatch');
  fail(receipt?.validator_sha256===receipt?.validator?.sha256&&receipt?.mapping_sha256===receipt?.mapping?.sha256,'Collector implementation/mapping hash mismatch');
  if(!currentClosure||currentClosure.status!=='PASS')holds.push(...currentClosure?.validation_errors||['Implementation closure is unavailable']);
  else{
    fail(receipt?.implementation_closure_sha256===currentClosure.sha256&&equal(receipt?.implementation_closure,currentClosure.refs),'Implementation closure changed');
    for(const ref of ['validator','mapping','adapter','stage_map'])fail(currentClosure.refs.some(item=>item.path===receipt?.[ref]?.path&&item.sha256===receipt?.[ref]?.sha256),'Implementation closure omits '+ref);
  }
  if(receipt?.invocation_snapshot){
    const snapshot=invocationSnapshot;
    if(!snapshot||snapshot.schema_version!=='post-validation-invocation.v0.4.0'||snapshot.status!=='READY'||snapshot.phase!=='before_validation'||snapshot.logical_stage_id!==logicalStageId||snapshot.artifact_stage_id!==artifactStageId||!Number.isInteger(snapshot.collector_sequence)||snapshot.collector_sequence<1||typeof snapshot.invocation_id!=='string'||!snapshot.invocation_id||typeof snapshot.captured_at!=='string'||!Number.isFinite(Date.parse(snapshot.captured_at))||snapshot.context_strip_fixture_meta!==false||!Array.isArray(snapshot.validation_errors)||snapshot.validation_errors.length)holds.push('Pre-invocation snapshot identity/phase/sequence/time is missing or invalid');
    else if(!equal(snapshot.artifact,receipt.artifact)||!equal(snapshot.context,receipt.context)||snapshot.implementation_closure_sha256!==currentClosure?.sha256||!equal(snapshot.implementation_closure,currentClosure?.refs))holds.push('Pre-invocation artifact/context/implementation pins differ from current validation evidence');
  }
  const mapped=mappedCompensatingChecks(mapping,artifactStageId);if(mapped.status!=='PASS')holds.push(...mapped.validation_errors);
  if(mapped.source_liveness_required){
    const registry=context?.source_registry;
    if(!registry||typeof registry!=='object'||Array.isArray(registry)||Object.keys(registry).length===0)holds.push('Removed card retrieved_at still requires source-registry context');
    const liveness=context?.source_liveness;
    if(!Array.isArray(liveness)||!liveness.length)holds.push('Removed card retrieved_at still requires dated source-liveness context and downstream08 gates');
    else for(const receipt of liveness){
      if(receipt.status!=='PASS'||typeof receipt.source_ref!=='string'||!receipt.source_ref||!validSha(receipt.snapshot_sha256)||!['issuer','official_regulator','official_standard'].includes(receipt.source_tier)||!Number.isFinite(Date.parse(receipt.retrieved_at))||typeof receipt.edition!=='string'||!receipt.edition||!/^\d{4}-\d\d-\d\d$/.test(receipt.effective_date||'')||!receipt.issuer_current_edition_ref||!validSha(receipt.issuer_current_edition_sha256))holds.push('Source-liveness context is incomplete or unresolved; optional card field removal grants no waiver');
    }
  }
  const checks=Array.isArray(rawResult?.checks)?rawResult.checks:[];const ids=checks.map(check=>check.check_id);
  fail(new Set(ids).size===ids.length,'Duplicate post-validation check IDs');
  fail(checks.length>0&&checks.every(check=>check.status==='PASS'),'Post-validation includes missing, failed or held checks');
  const required=['04.SCHEMA',...mapped.check_ids];
  for(const id of required)fail(checks.filter(check=>check.check_id===id&&check.status==='PASS').length===1,'Required mapped check missing/not PASS: '+id);
  return{status:failures.length?'FAIL':holds.length?'HOLD':'PASS',validation_errors:failures,hold_reasons:holds,required_check_ids:[...new Set(required)],collector_check_ids:mapped.collector_check_ids,downstream_liveness_still_required:mapped.source_liveness_required};
}

/** Existing immutable-ledger evidence establishes that API input pins preceded the invocation. */
export function evaluateInvocationChronology({receipt,snapshot,receiptRef,events,runId,candidateLineageId,completedAt}={}){
  if(receipt?.artifact_binding_kind!=='owner_api_invocation_snapshot')return{status:'PASS',validation_errors:[]};
  const errors=[];
  const scoped=Array.isArray(events)?events.filter(event=>event.run_id===runId&&event.candidate_lineage_id===candidateLineageId&&event.invocation_id===snapshot?.invocation_id&&event.stage_id===receipt.logical_stage_id&&event.artifact_validation_stage_id===receipt.artifact_stage_id):[];
  const unique=type=>{const found=scoped.filter(event=>event.type===type);if(found.length!==1)errors.push('API chronology needs exactly one '+type+' event');return found[0];};
  const commit=unique('validation.invocation.committed'),start=unique('validation.started'),complete=unique('validation.completed');
  if(commit&&start&&complete){
    if(![commit,start,complete].every(event=>Number.isInteger(event.sequence)&&event.snapshot_sha256===receipt.invocation_snapshot?.sha256&&event.artifact_sha256===receipt.artifact?.sha256&&event.context_sha256===receipt.context?.sha256&&event.implementation_closure_sha256===receipt.implementation_closure_sha256))errors.push('API chronology event input pins/sequence differ from saved invocation');
    if(commit.sequence!==snapshot?.collector_sequence||!(commit.sequence<start.sequence&&start.sequence<complete.sequence))errors.push('API snapshot commit must precede validation start and completion');
    if(complete.raw_result_sha256!==receipt.raw_result?.sha256||complete.post_validation_receipt_sha256!==receiptRef?.sha256)errors.push('API completion event does not pin the saved raw result and wrapper');
    const times=[snapshot?.captured_at,commit.occurred_at,start.occurred_at,complete.occurred_at,completedAt].map(value=>typeof value==='string'?Date.parse(value):NaN);
    if(!times.every(Number.isFinite)||!times.every((time,index)=>index===0||times[index-1]<=time))errors.push('API snapshot/start/completion/report timestamps are invalid or reversed');
  }
  return{status:errors.length?'HOLD':'PASS',validation_errors:errors};
}

export function inspectSavedPostValidationReceipt({projectRoot=here,receiptRef,expectedArtifactRef,expectedAdapterRef,expectedMappingRef,logicalStageId='04.qualification',artifactStageId='04.cards'}={}){
  try{
    const receipt=resolvePin(projectRoot,receiptRef).data();
    if(receipt.status!=='PASS')return{status:receipt.status==='FAIL'?'FAIL':'HOLD',validation_errors:receipt.validation_errors||[],hold_reasons:[...(receipt.hold_reasons||[]),'Saved collector receipt is not PASS']};
    for(const key of ['raw_result','artifact','context','adapter','validator','mapping','stage_map','collector_wrapper'])resolvePin(projectRoot,receipt[key]);
    const invocationSnapshot=receipt.invocation_snapshot?resolvePin(projectRoot,receipt.invocation_snapshot).data():undefined;
    const closure=collectImplementationClosure({projectRoot,artifactStageId});
    const expectedPins={artifact:expectedArtifactRef,adapter:expectedAdapterRef,mapping:expectedMappingRef};
    for(const key of Object.keys(expectedPins))if(!expectedPins[key])delete expectedPins[key];
    const stageMap=resolvePin(projectRoot,receipt.stage_map).data();const stage=stageMap.stages?.[artifactStageId];
    if(!stage)return{status:'HOLD',validation_errors:[],hold_reasons:['Current owner stage map lacks artifact-validation stage']};
    const actualPaths={adapter:stage.adapter_schema,mapping:stage.mapping,validator:'tools/belt/post-validate.mjs',stage_map:'schemas-strict/stage-map.json',collector_wrapper:'tools/wrap-post-validation-receipt.mjs'};
    for(const [key,relative]of Object.entries(actualPaths))if(receipt[key]?.path!==relative)throw new Error('Collector '+key+' path differs from current owner interface');
    return evaluatePostValidationReceipt({receipt,rawResult:resolvePin(projectRoot,receipt.raw_result).data(),artifact:resolvePin(projectRoot,receipt.artifact).data(),context:resolvePin(projectRoot,receipt.context).data(),mapping:resolvePin(projectRoot,receipt.mapping).data(),currentClosure:closure,invocationSnapshot,expectedPins,logicalStageId,artifactStageId});
  }catch(error){return{status:'FAIL',validation_errors:[String(error.message||error)],hold_reasons:[]};}
}

export function wrapPostValidationReceipt({projectRoot=here,rawResultPath,artifactPath,contextPath,invocationSnapshotRef,logicalStageId='04.qualification',artifactStageId='04.cards'}={}){
  const receipt={schema_version:'post-validation-receipt.v0.4.0',status:'HOLD',logical_stage_id:logicalStageId,artifact_stage_id:artifactStageId,artifact_binding_kind:'owner_cli_artifact_hash',output_sha256:null,schema_sha256:null,validator_sha256:null,mapping_sha256:null,raw_result:null,artifact:null,context:null,adapter:null,validator:null,mapping:null,stage_map:null,collector_wrapper:null,invocation_snapshot:null,implementation_closure:[],implementation_closure_sha256:null,metadata_collector_node_version:process.version,validation_errors:[],hold_reasons:[]};
  try{
    const absolute=value=>{if(typeof value!=='string')throw new Error('Missing saved artifact/result/context path');const target=path.resolve(projectRoot,value);if(!inside(projectRoot,target)||/(^|[\\/])\.env(?:\.[^\\/]*)?$/i.test(target))throw new Error('Collector evidence path is forbidden');return target;};
    receipt.raw_result=filePin(projectRoot,absolute(rawResultPath));receipt.artifact=filePin(projectRoot,absolute(artifactPath));receipt.context=filePin(projectRoot,absolute(contextPath));
    const mapPath=path.join(projectRoot,'schemas-strict','stage-map.json');receipt.stage_map=filePin(projectRoot,mapPath);const map=JSON.parse(fs.readFileSync(mapPath,'utf8'));const stage=map.stages?.[artifactStageId];if(!stage)throw new Error('Owner artifact-validation stage is unavailable');
    for(const [key,relative]of Object.entries({adapter:stage.adapter_schema,mapping:stage.mapping,validator:'tools/belt/post-validate.mjs',collector_wrapper:'tools/wrap-post-validation-receipt.mjs'}))receipt[key]=filePin(projectRoot,absolute(relative));
    receipt.output_sha256=receipt.artifact.sha256;receipt.schema_sha256=receipt.adapter.sha256;receipt.validator_sha256=receipt.validator.sha256;receipt.mapping_sha256=receipt.mapping.sha256;
    const closure=collectImplementationClosure({projectRoot,artifactStageId});receipt.implementation_closure=closure.refs;receipt.implementation_closure_sha256=closure.sha256;
    const rawResult=JSON.parse(fs.readFileSync(absolute(rawResultPath),'utf8'));
    const invocationSnapshot=invocationSnapshotRef?resolvePin(projectRoot,invocationSnapshotRef).data():undefined;
    if(invocationSnapshotRef)receipt.invocation_snapshot=filePin(projectRoot,resolvePin(projectRoot,invocationSnapshotRef).target);
    if(rawResult.artifact_sha256===undefined)receipt.artifact_binding_kind=invocationSnapshot?'owner_api_invocation_snapshot':'api_snapshot_pending';
    const checked=evaluatePostValidationReceipt({receipt,rawResult,artifact:JSON.parse(fs.readFileSync(absolute(artifactPath),'utf8')),context:JSON.parse(fs.readFileSync(absolute(contextPath),'utf8')),mapping:JSON.parse(fs.readFileSync(absolute(stage.mapping),'utf8')),currentClosure:closure,invocationSnapshot,logicalStageId,artifactStageId});
    Object.assign(receipt,{status:checked.status,validation_errors:checked.validation_errors,hold_reasons:checked.hold_reasons});
  }catch(error){receipt.hold_reasons.push(String(error.message||error));}
  return receipt;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2);const get=flag=>{const index=args.indexOf(flag);return index<0?undefined:args[index+1];};
  if(args.some(value=>['--go','--write','--execute'].includes(value))){console.error('Collector wrapper is read-only and never executes the owner validator');process.exitCode=2;}
  else{const snapshotPath=get('--invocation-snapshot');const snapshotRef=snapshotPath&&fs.existsSync(path.resolve(here,snapshotPath))?filePin(here,path.resolve(here,snapshotPath)):undefined;const receipt=wrapPostValidationReceipt({rawResultPath:get('--raw-result'),artifactPath:get('--artifact'),contextPath:get('--context'),invocationSnapshotRef:snapshotRef,logicalStageId:get('--task-stage')||'04.qualification',artifactStageId:get('--artifact-stage')||'04.cards'});console.log(JSON.stringify(receipt,null,2));process.exitCode=receipt.status==='PASS'?0:receipt.status==='FAIL'?1:2;}
}
