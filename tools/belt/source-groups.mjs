// Explicit complete-section supersession. Proofs authorize submissions, never facts or spend.
import fs from 'node:fs';
import path from 'node:path';
import {inside,verifyRef,canonicalJson,sha256} from './atomic-file.mjs';
import {SECTION_IDS} from './checks/02-dossier-sections.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const key=ids=>canonicalJson([...(ids??[])].sort());
const valid=ids=>Array.isArray(ids)&&ids.length>0&&ids.every(id=>typeof id==='string'&&id.trim())&&new Set(ids).size===ids.length;
const same=(a,b,root)=>!!a&&!!b&&a.sha256===b.sha256&&typeof a.path==='string'&&typeof b.path==='string'&&path.resolve(root,a.path)===path.resolve(root,b.path);
const ident=r=>{const v=r.identity??r.identity_json;return typeof v==='string'?JSON.parse(v):v??{};};
const scope=r=>ident(r).config??{};
const dossier=r=>(r.kind??r.stage_id)==='02.dossier_sections'||r.kind==='dossier_envelope';
const newer=(a,b)=>String(a.accepted_at??'').localeCompare(String(b.accepted_at??''))||String(a.task_id??'').localeCompare(String(b.task_id??''));
const fail=why=>{throw Error('source_group:'+why);};
const ref=r=>({path:r.path,sha256:r.sha256});
const D_LOCATOR='source_supported_D_debt_locator_correction';
const KINDS=['source_binding_reconciliation','dependent_metadata_reconciliation','source_supported_fact_correction',D_LOCATOR];
export const isSourceGroupProof=p=>p?.schema_version==='nova-section-source-reconciliation.v1';
function local(r,root,run){return inside(run,verifyRef(r,root));}
function body(r,root,run){return read(local(r,root,run));}
function exactTarget(target,all,root,run){
  if(!target||Object.keys(target).some(k=>!['path','sha256','task_id','artifact_id'].includes(k)))fail('target_shape');
  const found=all.find(r=>r.accepted===true&&r.task_id===target.task_id&&r.artifact_id===target.artifact_id&&same(r,target,root));
  if(!found)fail('target_not_accepted');
  local(found,root,run);
  for(const receipt of [found.validation_ref,found.acceptance_ref]){const value=body(receipt,root,run);if(value.status!=='PASS'||value.output_sha256!==found.sha256)fail('target_receipt');}
  return found;
}
function proofShape(p,runId,nowUtc){
  const keys=['schema_version','status','kind','authority_scope','run_id','stage_id','section_ids','part_ids','supersedes','previous_registry_ref','source_registry_ref','previous_page_map_ref','page_map_ref','previous_source_text_ref','source_text_ref','config_ref','source_evidence_refs','metadata_dependencies','g_box_debt_links','corrected_parts','reason','recorded_by','recorded_at','content_calls_authorized'];
  if(!p||Array.isArray(p)||Object.keys(p).some(k=>!keys.includes(k)&&k!=='debt_location_projection'&&!(p.kind===D_LOCATOR&&k==='d_locator_corrections')&&!(p.kind==='source_binding_reconciliation'&&k==='scope_debt_recontextualization'))||keys.some(k=>!Object.hasOwn(p,k))||!isSourceGroupProof(p)||p.status!=='PASS'||!KINDS.includes(p.kind)||p.authority_scope!=='submission_only_not_factual_acceptance'||p.content_calls_authorized!==false)fail('authority_or_shape');
  if(p.kind===D_LOCATOR&&(!Array.isArray(p.d_locator_corrections)||p.d_locator_corrections.length!==1))fail('D_locator_exactly_one_declaration_required');
  if(p.run_id!==runId||p.stage_id!=='02.dossier_sections'||!valid(p.section_ids)||p.section_ids.length!==1||!valid(p.part_ids)||key(p.part_ids)!==key(SECTION_IDS)||!p.reason?.trim())fail('scope');
  if(!p.recorded_by||Object.keys(p.recorded_by).some(k=>!['actor_id','session_id','provider_family'].includes(k))||!['actor_id','session_id','provider_family'].every(k=>p.recorded_by[k]?.trim()))fail('recorder');
  const at=Date.parse(p.recorded_at);if(!/^\d{4}-\d{2}-\d{2}T.*Z$/.test(p.recorded_at??'')||!Number.isFinite(at)||(nowUtc&&at>Date.parse(nowUtc)))fail('recorded_time');
  if(!Array.isArray(p.source_evidence_refs)||!p.source_evidence_refs.length||!Array.isArray(p.metadata_dependencies)||!Array.isArray(p.corrected_parts)||!p.g_box_debt_links||Array.isArray(p.g_box_debt_links))fail('evidence_shape');
}
function sourceDescends(source,ancestor,root,run,seen=new Set()){
  if(same(source,ancestor,root))return true;
  const token=source.path+':'+source.sha256;if(seen.has(token))fail('source_cycle');seen.add(token);
  const value=body(source,root,run),parent=value.source_revision?.previous_registry_ref;
  return !!parent&&sourceDescends(parent,ancestor,root,run,seen);
}
function anchorIdentity(locator,map){
  const pages=map.pages??[],direct=pages.filter(page=>[page.page_id,page.page_map_id,page.source_page].includes(locator));
  const physical=typeof locator==='string'?locator.match(/^(.*?)#(?:pdf_page=|pdf_page:)(\d+)$/):null;
  const found=direct.length?direct:physical?pages.filter(page=>page.pdf_page===Number(physical[2])&&page.source_ref===physical[1]):[];
  if(found.length!==1)return null;const page=found[0];
  return{pdf_page:page.pdf_page,source_ref:page.source_ref,source_document_sha256:page.source_document_sha256??map.source_document_ref?.sha256??null};
}
// This policy changes existing unresolved D debt locators only. No authored prose,
// fact ID, debt disposition, or new anchor is authorized by a locator declaration.
function declaredBodies(inspection){
  const {receipt:p,targets,projectRoot,runDir}=inspection,bodies=targets.map(r=>body(r,projectRoot,runDir));
  if(p.kind==='source_binding_reconciliation')return scopeDebtBodies(inspection,bodies);
  if(p.kind!==D_LOCATOR)return bodies;
  if(!Array.isArray(p.d_locator_corrections)||p.d_locator_corrections.length!==1)fail('D_locator_exactly_one_declaration_required');
  if(!same(p.previous_registry_ref,p.source_registry_ref,projectRoot)||!same(p.previous_page_map_ref,p.page_map_ref,projectRoot)||!same(p.previous_source_text_ref,p.source_text_ref,projectRoot)||p.metadata_dependencies.length||p.corrected_parts.length)fail('D_locator_same_source_required');
  const map=body(p.page_map_ref,projectRoot,runDir),registry=body(p.source_registry_ref,projectRoot,runDir),text=fs.readFileSync(local(p.source_text_ref,projectRoot,runDir),'utf8');
  const pageText=n=>{const marker=new RegExp('^=== PHYSICAL PDF PAGE '+n+';[^\\r\\n]*===\\r?\\n','m'),match=marker.exec(text);if(!match)fail('D_locator_page_text_missing');const rest=text.slice(match.index+match[0].length);return rest.split(/^=== PHYSICAL PDF PAGE /m)[0];};
  const seen=new Set(),anchorChanges=new Map();
  for(const c of p.d_locator_corrections){
    const fields=['claim_id','from_token','to_token','from_source_page','to_source_page','anchor_ids','source_quote','evidence_ref'];
    if(!c||Object.keys(c).some(k=>!fields.includes(k))||fields.some(k=>!Object.hasOwn(c,k))||typeof c.claim_id!=='string'||seen.has(c.claim_id)||!Array.isArray(c.anchor_ids)||c.anchor_ids.some(x=>typeof x!=='string')||new Set(c.anchor_ids).size!==c.anchor_ids.length)fail('D_locator_declaration_shape');seen.add(c.claim_id);
    const from=/^physical page ([1-9]\d*)$/.exec(c.from_token),to=/^physical page ([1-9]\d*)$/.exec(c.to_token);
    if(!from||!to||from[1]===to[1])fail('D_locator_tokens');
    const before=anchorIdentity(c.from_source_page,map),after=anchorIdentity(c.to_source_page,map);
    if(!before||!after||before.pdf_page!==Number(from[1])||after.pdf_page!==Number(to[1])||before.source_ref!==after.source_ref||!before.source_document_sha256||before.source_document_sha256!==after.source_document_sha256)fail('D_locator_unmapped_or_foreign_page');
    const document=registry.sources?.find(s=>s.source_ref===after.source_ref&&s.snapshot_hash===after.source_document_sha256);if(!document||registry.sources.length!==1)fail('D_locator_foreign_document');local({path:document.snapshot_ref,sha256:document.snapshot_hash},projectRoot,runDir);
    if(typeof c.source_quote!=='string'||c.source_quote.trim().length<40||!pageText(after.pdf_page).includes(c.source_quote)||pageText(before.pdf_page).includes(c.source_quote))fail('D_locator_quote_not_specific_to_new_page');
    if(!p.source_evidence_refs.some(r=>same(r,c.evidence_ref,projectRoot))||Object.keys(c.evidence_ref??{}).some(k=>!['path','sha256'].includes(k)))fail('D_locator_evidence_not_pinned');
    const debts=bodies.flatMap(v=>v.verification_debt??[]).filter(d=>d.claim_id===c.claim_id);
    const tokenPattern=new RegExp('\\b'+c.from_token+'\\b','g');
    if(!debts.length||debts.some(d=>d.located_at?.section_id!=='D'||d.resolution_artifact_ref!==null||typeof d.claim_text!=='string'||[...d.claim_text.matchAll(tokenPattern)].length!==1||d.claim_text.includes(c.to_token)))fail('D_locator_not_existing_unresolved_debt');
    const chunks=bodies.flatMap(v=>v.sections??[]).filter(s=>s.section_id==='D');
    if(chunks.length!==1||debts.some(d=>d.located_at.chunk_id!==chunks[0].chunk_id))fail('D_locator_debt_chunk');
    const anchors=(chunks[0].source_anchors??[]).filter(a=>canonicalJson(anchorIdentity(a.source_page,map))===canonicalJson(before));
    if(key(anchors.map(a=>a.anchor_id))!==key(c.anchor_ids))fail('D_locator_anchor_declaration');
    for(const anchor of anchors){if(anchorChanges.has(anchor.anchor_id)&&anchorChanges.get(anchor.anchor_id)!==c.to_source_page)fail('D_locator_anchor_conflict');anchorChanges.set(anchor.anchor_id,c.to_source_page);anchor.source_page=c.to_source_page;}
    for(const debt of debts)debt.claim_text=debt.claim_text.replace(tokenPattern,c.to_token);
  }
  return bodies;
}
const LEGACY_VARIANT_ROWS={"ID-APPLICANT-COMPETITORS":["0fdf1f710f61718b3f8a65660874cf92cec6f72db42b12e9eb2d6216908308a0","7eb59f729a7d56af47c6ffbba450a3c9dab2a3dd012a15e5a0dc9a9c6f1e8306"],"ID-APPLICANT-MARKET":["059861ff913e82ca443dd50638d1264a39ecf881ab60210dadb9891d361ebd29","16ff772f141d75119bb35f678f3dc72b5f8d2e6d24ebf274960264d885da6f71"],"ID-BASICS-COMPETITORS":["20ed5bb3db619a506d3daf230d551e4fcde15e951e56147dde0fd57e1ea9e41a","cf22c0d609a661d834a1713e914559e86e0a995e51cff3706741eaae48e09224"],"ID-BASICS-MARKET":["3d939cb848c92527cc58096ff2f7a3cee33778bcefdaf46d5c87e2d82212d5f2","d44b5ffda5686e9d5d44c98c350f6115e7a6bb788d6afa916f3a73bf95ebc53e"],"ID-EQUIPMENT-COMPETITORS":["0f2a7897c20811a4b271c74811bd9a5bcff4c2b702369956a5d219f7eecb38f0","74a99377ebd2132a6dc63c1a7cc9c45334049580ceb16f9bf2fc1d80913c8441"],"ID-EQUIPMENT-MARKET":["3b9e257489398a49e97399e71b57f0f9b6a47bbe574b5e15c8bd8fb262790401","6b2c6f4f0f7d0b7ee133fdf98b56521dcedb6b342a1b50c9e80047149f1e86fa"],"ID-TESTING-COMPETITORS":["55196139b5a0340d3bcf2bfe2628eb78499d1379e370282abb8000143b19dc43","72deaa89d073219c23f638cc81ccfc0dda9d9885b91b194ff7ef33bc423cd8a8"],"ID-TESTING-MARKET":["93f1e3014a57c7a6e07255ab97e3adab76e96fac65a2426a83f38f81ab4b159d","f6a6f75fddbb347067631d0e807229306c5cae186c83544e2423a821658b347f"],"NE-sec01-MARKET":["137d5e499d2a4f565341230ced82ba267a99263f6cf6ae7e1889a2ecbe271237","807f158b3a8bd4bb52a690efcc9079e80a0bb9c0853c978de67494b05d279fa6"],"NE-sec01-PASS":["8ed3696e7df2c487c8f6a04f2fc0a1a56c408efa5b2ecf79bbb15c2445e64349","f4f5497ce21ae699dbf40bb0606cdce42e5906f45780bb12c03b472a4d306811"],"NE-sec01-TEARDOWN":["0e57dd78f8afb5b4771abc3d775b67eaa1f38235a7cfb26de9620d8ae16dfda3","83b5753a07e7ada4303c326f5c42aacf9c36bf609e54fb842783708e4eb9dc9e"],"NE-sec02-MARKET":["3730f7dd08f4535efcad9667476c11f3dc6bb7bb679b9799672405e7ef6e47e4","92e727286ba335e4e38c35a1d8931d06c4948eefd266c147f75d69abbc49656e"],"NE-sec02-PASS":["6b4636520ce214e6bd8ad3ed2ae8dde98947d361c9ae0ac2e64efcb4d78d903f","df7cffd4544393f576b1451dbdfd35b721c34f8f92b88e2e657066d1475d090b"],"NE-sec02-TEARDOWN":["ca51d76b49738d801267575022563decfec74d5af2b1608070bbd695ca15a0f2","cb2e57ad90ffcf25f928f2551983c657346d1abdb439dbe4908259c53d627201"],"NE-sec03-MARKET":["55f29975b75f505932ef698f6cfde7fcb82749b1a264dc98650ef5ba45a2b5ef","e8437656c2d92f9ee55647d60061225686086a4dd78a72d22ed545b407d005e1"],"NE-sec03-PASS":["48d5130f966f96af6c6f5c9ec152af57751223398f2da0da250cda1d5689b086","8aa53154f245d5e7e86ebbae379f861e376baf80e4d183597546f59fd7b036af"],"NE-sec03-TEARDOWN":["29b3ee268715de1b4839664c1d866a7a25d0a11c159d22812122d8d0b9926b63","ead0667273e28988bd90a1047edc09d120338ab4b9b31f17f578d897f2c0d252"],"NE-sec04-MARKET":["ba963e5644c68d130c282c91f871f1501db888b48b70f725f6ee93fbf86fe2bf","d7c42c26a6f88676667a0b0496da463c774988035c759537ce644c7da16325ae"],"NE-sec04-PASS":["4179023aad601ed0162f42f33d63ff8114c2e284df9dc5785e3da435939325c2","82e41a0fc46cc0d6d927d6cb94eda8c13572f6e696ea958ea0344eac6f851825"],"NE-sec04-TEARDOWN":["772fd5416cfee09495343f632c27dc324424739f7baca7db7abb081dc2f069e1","b69fe2a0eb3d4acae31de9e245f5f860b44a6243b17c7a2e330f4874ac0ba29a"]};
function debtLocationPlan({targets,projectRoot,runDir},{allowLegacyTextVariants=false}={}){
  const groups=new Map(),allIds=new Set(),bodies=targets.map(r=>body(r,projectRoot,runDir));
  for(const [targetIndex,value]of bodies.entries())for(const [rowIndex,debt]of (value.verification_debt??[]).entries()){
    if(typeof debt.claim_id!=='string'||!debt.claim_id)fail('debt_location_original_id');allIds.add(debt.claim_id);
    const occurrence={target:{path:path.relative(projectRoot,local(targets[targetIndex],projectRoot,runDir)).replaceAll('\\','/'),sha256:targets[targetIndex].sha256,task_id:targets[targetIndex].task_id,artifact_id:targets[targetIndex].artifact_id},row_index:rowIndex};
    const entry={debt,targetIndex,rowIndex,occurrence};groups.set(debt.claim_id,[...(groups.get(debt.claim_id)??[]),entry]);
  }
  const mappings=[],assignments=new Map(),seenAliases=new Set(allIds),legacy=[];
  for(const [claimId,entries]of [...groups].sort(([a],[b])=>a.localeCompare(b))){
    if(entries.length===1)continue;
    const substantive=d=>{const {located_at,...rest}=d;return canonicalJson(rest);};
    const textVariant=entries.some(e=>substantive(e.debt)!==substantive(entries[0].debt));
    if(textVariant){
      const approved=/^(?:ID-(?:BASICS|APPLICANT|TESTING|EQUIPMENT)-(?:MARKET|COMPETITORS)|NE-sec0[1-4]-(?:PASS|MARKET|TEARDOWN))$/.test(claimId),fields=d=>{const {claim_text,located_at,...rest}=d;return canonicalJson(rest);},expectedPart=claimId.endsWith('-PASS')?'A':claimId.endsWith('-MARKET')?'E':'E2',locations=[...new Set(entries.map(e=>e.debt.located_at?.section_id))].sort();
      if(!allowLegacyTextVariants||!approved||canonicalJson(locations)!==canonicalJson([expectedPart,'G'].sort())||entries.some(e=>fields(e.debt)!==fields(entries[0].debt)||e.debt.resolution_artifact_ref!==null||e.debt.ship_blocking!==false||e.debt.expires_by!==null||canonicalJson(e.debt.withheld_values)!=='[]'))fail('conflicting_metadata:claim_id:'+claimId);
      const hashes=[...new Set(entries.map(e=>sha256(canonicalJson(e.debt))))].sort();if(hashes.length!==2||canonicalJson(hashes)!==canonicalJson(LEGACY_VARIANT_ROWS[claimId]))fail('legacy_debt_variant_scope');legacy.push({original_claim_id:claimId,original_row_sha256s:hashes});
    }
    const rows=new Map();for(const entry of entries){const k=canonicalJson(entry.debt);rows.set(k,[...(rows.get(k)??[]),entry]);}
    const distinct=[...rows.values()].sort((a,b)=>SECTION_IDS.indexOf(a[0].debt.located_at.section_id)-SECTION_IDS.indexOf(b[0].debt.located_at.section_id)||a[0].debt.located_at.chunk_id.localeCompare(b[0].debt.located_at.chunk_id));
    for(const [index,occurrences]of distinct.entries()){
      const original=occurrences[0].debt,derived=index===0?claimId:claimId+'::location:'+sha256(canonicalJson({claim_id:claimId,located_at:original.located_at}));
      if(index>0&&seenAliases.has(derived))fail('debt_location_alias_collision');seenAliases.add(derived);
      const mapping={original_claim_id:claimId,derived_claim_id:derived,original_row_sha256:sha256(canonicalJson(original)),located_at:structuredClone(original.located_at),occurrences:occurrences.map(e=>e.occurrence).sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b)))};
      mappings.push(mapping);for(const entry of occurrences)assignments.set(entry.targetIndex+':'+entry.rowIndex,{derived,key:canonicalJson(original)});
    }
  }
  const references=[],referenceAssignments=new Map();
  for(const [targetIndex,value]of bodies.entries())for(const [rowIndex,row]of (value.g_matrix??[]).entries()){
    if(!mappings.some(m=>m.original_claim_id===row.debt_ref))continue;
    const chunk=String(row.located_at??'').replace(/:L\d+$/,''),matches=mappings.filter(m=>m.original_claim_id===row.debt_ref&&m.located_at.chunk_id===chunk);
    if(matches.length!==1)fail('debt_location_reference_ambiguous_or_unresolved');
    const selected=matches[0];if(selected.derived_claim_id===row.debt_ref)continue;
    references.push({target:{path:path.relative(projectRoot,local(targets[targetIndex],projectRoot,runDir)).replaceAll('\\','/'),sha256:targets[targetIndex].sha256,task_id:targets[targetIndex].task_id,artifact_id:targets[targetIndex].artifact_id},g_box_id:row.box_id,located_at:row.located_at,original_claim_id:row.debt_ref,derived_claim_id:selected.derived_claim_id});referenceAssignments.set(targetIndex+':'+rowIndex,selected.derived_claim_id);
  }
  references.sort((a,b)=>canonicalJson(a).localeCompare(canonicalJson(b)));
  return{projection:mappings.length?{policy:'preserve_debt_locations.v1',rows:mappings,...(legacy.length?{legacy_text_variants:legacy}:{}),...(references.length?{references}:{})}:null,assignments,referenceAssignments};
}
// A proof pins every original row and source occurrence; native02 gets unique IDs.
// The original ID remains at the earliest native part, so existing VERIFY markers
// keep their identity. Legacy A/E/E2 versus G text variants need a separate exact
// row-hash opt-in; no flag/status differences are authorized by that declaration.
export function debtLocationProjection(inspection,options){return debtLocationPlan(inspection,options).projection;}
function acceptedBodies(inspection){
  const bodies=declaredBodies(inspection),declared=inspection.receipt.debt_location_projection,{projection,assignments,referenceAssignments}=debtLocationPlan(inspection,{allowLegacyTextVariants:Array.isArray(declared?.legacy_text_variants)&&declared.legacy_text_variants.length>0});
  if(projection?canonicalJson(projection)!==canonicalJson(declared):Object.hasOwn(inspection.receipt,'debt_location_projection'))fail(projection?'debt_location_projection_required_or_mismatch':'debt_location_projection_unnecessary');
  const emitted=new Set();for(const [targetIndex,value]of bodies.entries()){value.verification_debt=(value.verification_debt??[]).flatMap((debt,rowIndex)=>{const a=assignments.get(targetIndex+':'+rowIndex);if(!a)return[debt];if(emitted.has(a.key))return[];emitted.add(a.key);return[{...debt,claim_id:a.derived}];});value.g_matrix=(value.g_matrix??[]).map((row,rowIndex)=>referenceAssignments.has(targetIndex+':'+rowIndex)?{...row,debt_ref:referenceAssignments.get(targetIndex+':'+rowIndex)}:row);}
  return bodies;
}
const SCOPE_CLAIM='NE-sec02-C-PAGE-MAPPING-SEAM',SCOPE_SECTION='sec02-application-and-testing';
const SCOPE_ORIGINAL='Final review identified the passenger-car application opening on physical page sixteen, which is excluded from this section’s current configured page scope. It remains deferred pending supported source/config reconciliation; no assertion from that span is emitted.';
const SCOPE_CURRENT='Current source-scope annotation: Physical PDF page 16 is now included in sec02-application-and-testing by the selected source/config mapping. Fact authoring and review for this span remain pending; this debt stays unresolved and ship-blocking. No fact from this span is accepted by this metadata reconciliation.';
function scopeDebtBodies({receipt:p,projectRoot,runDir},bodies){
  const declaration=p.scope_debt_recontextualization,debts=bodies.flatMap(v=>v.verification_debt??[]).filter(d=>d.claim_id===SCOPE_CLAIM);
  if(!declaration&&!debts.length)return bodies;
  const previous=body(p.previous_registry_ref,projectRoot,runDir),current=body(p.source_registry_ref,projectRoot,runDir);
  const oldConfig=body(previous.input_config,projectRoot,runDir),newConfig=body(current.input_config,projectRoot,runDir),oldRanges=oldConfig.scope?.section_page_ranges??{},newRanges=newConfig.scope?.section_page_ranges??{},before=oldRanges[SCOPE_SECTION],after=newRanges[SCOPE_SECTION];
  if(!declaration){if(debts.some(d=>d.claim_text===SCOPE_ORIGINAL)&&after?.includes(16))fail('scope_debt_declaration_required');return bodies;}
  if(canonicalJson(declaration)!==canonicalJson({policy:'NE_sec02_page16_scope_history.v1',claim_id:SCOPE_CLAIM,section_id:SCOPE_SECTION,added_pdf_pages:[16]})||key(p.section_ids)!==key([SCOPE_SECTION])||previous.probe!=='rdmv-ne-o'||current.probe!=='rdmv-ne-o')fail('scope_debt_declaration');
  if(!same(current.input_config,p.config_ref,projectRoot)||!Array.isArray(before)||!before.length||before.some(n=>!Number.isSafeInteger(n)||n<1)||new Set(before).size!==before.length||before.includes(16)||!Array.isArray(after)||key(after)!==key([...before,16])||canonicalJson({...oldRanges,[SCOPE_SECTION]:after})!==canonicalJson(newRanges))fail('scope_debt_selected_mapping_not_extended');
  const oldMap=body(p.previous_page_map_ref,projectRoot,runDir),newMap=body(p.page_map_ref,projectRoot,runDir),pages=map=>map.pages?.filter(page=>page.pdf_page===16)??[];
  if(p.previous_source_text_ref.sha256!==p.source_text_ref.sha256||previous.sources?.length!==1||current.sources?.length!==1||previous.sources[0].snapshot_hash!==current.sources[0].snapshot_hash||!previous.sources[0].snapshot_hash)fail('scope_debt_same_pdf_text_required');
  for(const source of [previous.sources[0],current.sources[0]])local({path:source.snapshot_ref,sha256:source.snapshot_hash},projectRoot,runDir);
  const oldPages=pages(oldMap),newPages=pages(newMap);if(oldPages.length!==1||newPages.length!==1||canonicalJson(anchorIdentity(oldPages[0].page_id,oldMap))!==canonicalJson(anchorIdentity(newPages[0].page_id,newMap))||newPages[0].source_document_sha256!==current.sources[0].snapshot_hash)fail('scope_debt_page16_not_registered_same_snapshot');
  const chunks=bodies.flatMap(v=>v.sections).filter(s=>s.section_id==='C');
  if(!debts.length||chunks.length!==1||debts.some(d=>d.claim_text!==SCOPE_ORIGINAL||d.ship_blocking!==true||d.resolution_artifact_ref!==null||d.located_at?.section_id!=='C'||d.located_at.chunk_id!==chunks[0].chunk_id))fail('scope_debt_original_unresolved_claim_required');
  for(const debt of debts)debt.claim_text='Historical source-scope note (retained verbatim): '+SCOPE_ORIGINAL+'\n'+SCOPE_CURRENT;
  return bodies;
}
// An empty native dossier_parts array is the ordinary unpartitioned complete-dossier
// request. Infer its part coverage only from a hash/receipt-verified accepted full
// envelope, and only for the existing single-composite fact-correction operation.
// Never rewrite the recorded identity or broaden partial/malformed target scopes.
function factCorrectionTargetParts(target,value,{kind,runId}){
  const parts=scope(target).dossier_parts;if(valid(parts))return parts;
  if(kind!=='source_supported_fact_correction'||!Array.isArray(parts)||parts.length!==0)fail('target_scope');
  const identity=ident(target),envelope=value.envelope_scope,chunks=value.sections;
  if(identity.run_id!==runId||identity.stage_id!=='02.dossier_sections'||identity.role_id!=='02'||
      value.artifact!=='SmeDossierEnvelope'||value.stage_id!=='02.dossier_sections'||
      envelope?.kind!=='complete_dossier'||envelope.chunk_index!==1||envelope.chunk_total!==1||
      !valid(envelope.assigned_section_ids)||key(envelope.assigned_section_ids)!==key(SECTION_IDS)||
      !Array.isArray(chunks)||chunks.length<SECTION_IDS.length)fail('unpartitioned_target_not_complete');
  // Logical A..G part coverage is distinct from physical chunks: accepted C/C2
  // may span multiple unique chunks. Preserve contiguous part order and native
  // merge sequence; never infer a missing part or accept duplicated chunk data.
  const ordered=[...chunks].sort((a,b)=>a.merge_seq-b.merge_seq),coverage=[...new Set(chunks.map(s=>s.section_id))];
  const orderedParts=ordered.filter((s,i)=>i===0||s.section_id!==ordered[i-1].section_id).map(s=>s.section_id);
  const contents=chunks.map(s=>{const {chunk_id,merge_seq,...content}=s;return canonicalJson(content);});
  if(!valid(coverage)||key(coverage)!==key(SECTION_IDS)||
      !valid(chunks.map(s=>s.chunk_id))||!valid(contents)||ordered.some((s,i)=>s.merge_seq!==i+1)||
      orderedParts.length!==SECTION_IDS.length||orderedParts.some((part,i)=>part!==SECTION_IDS[i]))fail('unpartitioned_target_chunk_scope');
  return [...SECTION_IDS];
}
function inspectProof({projectRoot,runDir,runId,all,proofRef,nowUtc=null}){
  const file=local(proofRef,projectRoot,runDir),p=read(file);proofShape(p,runId,nowUtc);
  if(!Array.isArray(p.supersedes)||!p.supersedes.length)fail('targets_missing');
  const targets=p.supersedes.map(t=>exactTarget(t,all,projectRoot,runDir)),parts=[];
  if(new Set(targets.map(r=>r.artifact_id)).size!==targets.length)fail('target_duplicate');
  for(const target of targets){const s=scope(target);if(key(s.section_ids)!==key(p.section_ids))fail('target_scope');const v=body(target,projectRoot,runDir),targetParts=factCorrectionTargetParts(target,v,{kind:p.kind,runId});parts.push(...targetParts);if(key(v.envelope_scope?.assigned_section_ids)!==key(targetParts)||v.lineage?.source_registry_sha256!==p.previous_registry_ref.sha256)fail('target_body_source');}
  if(parts.length!==SECTION_IDS.length||new Set(parts).size!==parts.length||key(parts)!==key(SECTION_IDS))fail('target_partition');
  for(const pin of [p.previous_registry_ref,p.source_registry_ref,p.previous_page_map_ref,p.page_map_ref,p.previous_source_text_ref,p.source_text_ref,p.config_ref,...p.source_evidence_refs])local(pin,projectRoot,runDir);
  for(const target of targets){const inputs=ident(target).inputs??[];for(const [kind,pin]of [['source_registry',p.previous_registry_ref],['page_map',p.previous_page_map_ref],['source_text',p.previous_source_text_ref]])if(!inputs.some(input=>input.kind===kind&&same(input,pin,projectRoot)))fail('previous_'+kind+'_not_consumed');}
  if(p.source_evidence_refs.some(r=>Object.keys(r).some(k=>!['path','sha256'].includes(k))))fail('evidence_fields');
  const source=body(p.source_registry_ref,projectRoot,runDir),map=body(p.page_map_ref,projectRoot,runDir);
  if(source.sources?.some(s=>s.page_map_sha256&&s.page_map_sha256!==p.page_map_ref.sha256))fail('source_page_map_hash');
  if(map.source_document_ref&&source.sources?.some(s=>s.snapshot_hash&&s.snapshot_hash!==map.source_document_ref.sha256))fail('source_snapshot_hash');
  if(p.kind==='source_binding_reconciliation'){
    if(same(p.previous_registry_ref,p.source_registry_ref,projectRoot)||!sourceDescends(p.source_registry_ref,p.previous_registry_ref,projectRoot,runDir)||source.source_revision?.reconciliation_required!==true||!source.source_revision.affected_section_ids?.includes(p.section_ids[0]))fail('source_revision_not_genuine');
    if(p.metadata_dependencies.length||p.corrected_parts.length)fail('source_kind_metadata_fields');
    const previous=body(p.previous_registry_ref,projectRoot,runDir),before=previous.sources??[],after=source.sources??[];
    if(!before.length||before.length!==after.length)fail('same_pdf_evidence_missing');
    for(const old of before){const current=after.find(value=>value.source_ref===old.source_ref);if(!current||!old.snapshot_hash||old.snapshot_hash!==current.snapshot_hash)fail('same_pdf_required');for(const item of [old,current])local({path:item.snapshot_ref,sha256:item.snapshot_hash},projectRoot,runDir);}
    if(p.previous_source_text_ref.sha256!==p.source_text_ref.sha256)fail('same_extracted_text_required');
    const previousMap=body(p.previous_page_map_ref,projectRoot,runDir),locators=new Set();
    for(const target of targets){const value=body(target,projectRoot,runDir);for(const section of value.sections)for(const anchor of section.source_anchors??[])locators.add(anchor.source_page);for(const fact of Object.values(value.exam_facts??{}))if(fact.status==='verified'&&fact.source_page)locators.add(fact.source_page);}
    for(const locator of locators){const before=anchorIdentity(locator,previousMap),after=anchorIdentity(locator,map);if(!before||!after||canonicalJson(before)!==canonicalJson(after))fail('retained_anchor_moved');}
    acceptedBodies({receipt:p,targets,projectRoot,runDir});
  }else if(p.kind==='dependent_metadata_reconciliation'){
    if(p.corrected_parts.length)fail('metadata_cannot_author_corrected_facts');
    if(!same(p.previous_registry_ref,p.source_registry_ref,projectRoot)||p.metadata_dependencies.length!==2)fail('metadata_source_or_dependencies');
    const knowledge=targets.filter(t=>scope(t).dossier_parts.some(part=>['C','C2'].includes(part)));
    // A later composite may be corrected as a whole; its predecessor proof pins the original F/G dependency edges.
    const fTarget=targets.find(t=>scope(t).dossier_parts.includes('F')),inputs=ident(fTarget).inputs??[];
    const seen=new Set();let changed=false;
    for(const dep of p.metadata_dependencies){
      if(!dep||Object.keys(dep).some(k=>!['part_id','previous','current'].includes(k))||!['C','C2'].includes(dep.part_id)||seen.has(dep.part_id))fail('metadata_dependency_shape');seen.add(dep.part_id);
      const previous=exactTarget(dep.previous,all,projectRoot,runDir),current=exactTarget(dep.current,all,projectRoot,runDir);
      if(!scope(previous).dossier_parts.includes(dep.part_id)||!scope(current).dossier_parts.includes(dep.part_id)||!knowledge.some(r=>same(r,current,projectRoot)))fail('metadata_dependency_target');
      if(!inputs.some(r=>same(r,previous,projectRoot)))fail('metadata_previous_not_consumed_by_F');
      const chunks=(r,part)=>body(r,projectRoot,runDir).sections.filter(s=>s.section_id===part).map(payload);
      if(canonicalJson(chunks(previous,dep.part_id))!==canonicalJson(chunks(current,dep.part_id)))changed=true;
    }
    if(!changed)fail('metadata_no_changed_accepted_knowledge');
  }else if(p.kind===D_LOCATOR){
    acceptedBodies({receipt:p,targets,projectRoot,runDir});
  }else{
    if(!same(p.previous_registry_ref,p.source_registry_ref,projectRoot)||targets.length!==1||key(factCorrectionTargetParts(targets[0],body(targets[0],projectRoot,runDir),{kind:p.kind,runId}))!==key(SECTION_IDS)||!valid(p.corrected_parts)||p.corrected_parts.some(part=>!['C','C2'].includes(part))||p.metadata_dependencies.length)fail('composite_fact_correction_scope');
  }
  acceptedBodies({receipt:p,targets,projectRoot,runDir});
  return{receipt:p,ref:{path:file,sha256:proofRef.sha256},targets,group:true,projectRoot,runDir};
}

// History goes in intact. Only exact accepted proof edges remove semantic inputs.
// Ordinary C/C2 replacement edges are resolved too, before any group targets vanish.
export function resolveDossierSupersession({projectRoot,runDir,runId=path.basename(runDir),acceptedArtifacts}){
  const all=acceptedArtifacts.filter(dossier),edges=new Map(),proofs=new Map();
  for(const accepted of all){
    const pin=scope(accepted).replacement_ref;if(!pin)continue;
    const p=body(pin,projectRoot,runDir);let targets;
    if(isSourceGroupProof(p)){
      const inspection=inspectProof({projectRoot,runDir,runId,all,proofRef:pin});targets=inspection.targets;
      const guard=validateSourceGroupCandidate({artifact:body(accepted,projectRoot,runDir),inspection,checkChange:false});if(guard.status!=='PASS')fail(guard.reason);
      if(key(scope(accepted).section_ids)!==key(p.section_ids)||key(scope(accepted).dossier_parts)!==key(SECTION_IDS))fail('accepted_group_scope');
      for(const [kind,pin]of [['source_registry',p.source_registry_ref],['page_map',p.page_map_ref],['source_text',p.source_text_ref]])if(!(ident(accepted).inputs??[]).some(input=>input.kind===kind&&same(input,pin,projectRoot)))fail('accepted_group_'+kind+'_not_consumed');
      proofs.set(accepted.artifact_id,inspection);
    }else{
      if(p.schema_version!=='nova-accepted-part-replacement.v1'||p.status!=='PASS'||p.authority_scope!=='submission_only_not_factual_acceptance'||p.content_calls_authorized!==false||p.run_id!==runId||p.stage_id!=='02.dossier_sections'||p.supersedes?.length!==1||!valid(p.part_ids)||p.part_ids.length!==1||!['C','C2'].includes(p.part_ids[0]))fail('historical_replacement_proof');
      targets=p.supersedes.map(t=>exactTarget(t,all,projectRoot,runDir));
      if(key(scope(accepted).section_ids)!==key(p.section_ids)||key(scope(accepted).dossier_parts)!==key(p.part_ids)||key(scope(targets[0]).section_ids)!==key(p.section_ids)||key(scope(targets[0]).dossier_parts)!==key(p.part_ids))fail('historical_replacement_scope');
    }
    if(targets.some(t=>t.artifact_id===accepted.artifact_id))fail('self_supersession');
    edges.set(accepted.artifact_id,targets.map(t=>t.artifact_id));
  }
  const excluded=new Set(),visiting=new Set(),visited=new Set();
  function visit(id){if(visiting.has(id))fail('supersession_cycle');if(visited.has(id))return;visiting.add(id);for(const target of edges.get(id)??[]){excluded.add(target);visit(target);}visiting.delete(id);visited.add(id);}
  for(const id of edges.keys())visit(id);
  const active=all.filter(r=>!excluded.has(r.artifact_id)),latest=new Map();
  for(const r of active){const k=key(scope(r).section_ids)+'@'+key(scope(r).dossier_parts);if(!latest.has(k)||newer(r,latest.get(k))>0)latest.set(k,r);}
  const selected=[...latest.values()];
  for(const group of selected.filter(r=>proofs.has(r.artifact_id))){
    if(selected.some(r=>r.artifact_id!==group.artifact_id&&key(scope(r).section_ids)===key(scope(group).section_ids)&&scope(r).dossier_parts.some(p=>scope(group).dossier_parts.includes(p))))fail('composite_overlap_requires_explicit_group');
  }
  return{active:selected,unexcluded:active,superseded:all.filter(r=>!selected.includes(r)),proofs,edges};
}

export function sourceGroupCompileEvidence(options){
  const resolved=resolveDossierSupersession(options),all=options.acceptedArtifacts.filter(dossier),out=new Map();
  const add=r=>{local(r,options.projectRoot,options.runDir);out.set(r.path+':'+r.sha256,{...ref(r),kind:'source_group_supersession_evidence'});};
  const walk=(id,seen=new Set())=>{if(seen.has(id))return;seen.add(id);const item=all.find(r=>r.artifact_id===id);if(!item)return;const pin=scope(item).replacement_ref;if(pin)add(pin);for(const targetId of resolved.edges.get(id)??[]){const target=all.find(r=>r.artifact_id===targetId);add(target.validation_ref);add(target.acceptance_ref);walk(targetId,seen);}};
  for(const accepted of resolved.active)if(resolved.proofs.has(accepted.artifact_id))walk(accepted.artifact_id);
  return[...out.values()];
}

export function inspectSourceGroup({projectRoot,runDir,runId,stageId,sectionIds,partIds,acceptedArtifacts,replacementRef,nowUtc}){
  try{
    if(stageId!=='02.dossier_sections'||!valid(sectionIds)||sectionIds.length!==1||key(partIds)!==key(SECTION_IDS))fail('request_scope');
    const resolved=resolveDossierSupersession({projectRoot,runDir,runId,acceptedArtifacts}),all=acceptedArtifacts.filter(dossier);
    const group=inspectProof({projectRoot,runDir,runId,all,proofRef:replacementRef,nowUtc}),p=group.receipt;
    if(key(p.section_ids)!==key(sectionIds))fail('request_section');
    const source=acceptedArtifacts.find(r=>r.kind==='source_registry'),map=acceptedArtifacts.find(r=>r.kind==='page_map'),text=acceptedArtifacts.find(r=>r.kind==='source_text');
    if(!same(p.source_registry_ref,source,projectRoot)||!same(p.page_map_ref,map,projectRoot)||!same(p.source_text_ref,text,projectRoot))fail('selected_source_or_page_map_or_text');
    const cfg=local(p.config_ref,projectRoot,runDir);inside(path.join(runDir,'sources/private'),cfg);
    if(!fs.readFileSync(cfg).equals(fs.readFileSync(path.join(runDir,'run-config.json'))))fail('stale_config');
    const acceptedReplacement=resolved.active.find(r=>same(scope(r).replacement_ref,replacementRef,projectRoot))??null;
    const current=resolved.active.filter(r=>key(scope(r).section_ids)===key(sectionIds));
    if(!acceptedReplacement&&(current.length!==group.targets.length||current.some(r=>!group.targets.some(t=>t.artifact_id===r.artifact_id))))fail('stale_targets');
    return{...group,status:'PASS',blockers:[],target:group.targets[0],lineageTargets:[...new Map([...group.targets,...resolved.superseded].map(r=>[r.artifact_id,r])).values()],acceptedReplacement,siblingArtifacts:resolved.active.filter(r=>key(scope(r).section_ids)===key(sectionIds)&&!group.targets.some(t=>t.artifact_id===r.artifact_id)&&r.artifact_id!==acceptedReplacement?.artifact_id),evidenceRefs:[p.source_registry_ref,p.page_map_ref,p.source_text_ref,p.previous_registry_ref,p.previous_page_map_ref,p.previous_source_text_ref,p.config_ref,...p.source_evidence_refs]};
  }catch(error){return{status:'HOLD',blockers:[error.message],ref:null,targets:[],target:null,acceptedReplacement:null,siblingArtifacts:[]};}
}

const payload=s=>{const {merge_seq,...rest}=s;return rest;};
function unique(values,id){const seen=new Map();for(const value of values){const k=value[id];if(seen.has(k)&&canonicalJson(seen.get(k))!==canonicalJson(value))fail('conflicting_metadata:'+id+':'+k);seen.set(k,value);}return [...seen.values()];}
export function groupBookkeeping(inspection,candidate=null){
  const {targets,receipt:p,projectRoot,runDir}=inspection,bodies=acceptedBodies(inspection);
  if(candidate){for(const old of bodies){old.sections=old.sections.filter(s=>!p.corrected_parts.includes(s.section_id));}bodies.push({...candidate,sections:candidate.sections.filter(s=>p.corrected_parts.includes(s.section_id)),g_matrix:[],verification_debt:candidate.verification_debt.filter(d=>p.corrected_parts.includes(d.located_at.section_id))});}
  const sections=bodies.flatMap(b=>b.sections);
  const ids=part=>[...new Set(sections.filter(s=>s.section_id===part).flatMap(s=>s.fact_ids??[]))].sort();
  const debts=unique(bodies.flatMap(b=>b.verification_debt??[]),'claim_id'),matrix=unique(bodies.flatMap(b=>b.g_matrix??[]),'box_id');
  const f=sections.filter(s=>s.section_id==='F'),g=sections.filter(s=>s.section_id==='G');if(f.length!==1||g.length!==1)fail('one_F_and_G_chunk_required');
  const lines=['## F — Accepted research inventory',`Accepted C fact count: ${ids('C').length}.`,`Accepted C fact IDs: ${ids('C').join(', ')||'none'}.`,`Accepted C2 inventory count: ${ids('C2').length}.`,`Accepted C2 IDs: ${ids('C2').join(', ')||'none'}.`,'Open typed debts:',...debts.map(d=>`- ${d.claim_id}: ${d.blocker_kind}; owner ${d.owner_worker}; ship_blocking ${d.ship_blocking}.`)];
  const gLines=['## G — Accepted inventory and unresolved review',`Accepted C/C2 inventory entries: ${ids('C').length+ids('C2').length}.`,'Typed debts retained from accepted inputs:',...debts.map(d=>`- ${d.claim_id}: ${d.claim_text} (${d.blocker_kind}; ship_blocking ${d.ship_blocking}).`)];
  for(const [box,id]of Object.entries(p.g_box_debt_links)){
    const row=matrix.find(r=>r.box_id===box),debt=debts.find(d=>d.claim_id===id&&d.resolution_artifact_ref===null);if(!row||!debt)fail('g_box_debt_link_invalid');
    row.disposition='debt';row.debt_ref=id;row.located_at=debt.located_at.chunk_id;row.note='Unresolved accepted debt '+id+'; no completion granted.';
  }
  for(const debt of debts.filter(d=>d.ship_blocking&&d.resolution_artifact_ref===null)){if(!Object.values(p.g_box_debt_links).includes(debt.claim_id)&&!matrix.some(r=>r.disposition==='debt'&&r.debt_ref===debt.claim_id))fail('ship_blocking_debt_not_located_in_G');}
  gLines.push('Definition-of-done dispositions retained from accepted inputs and explicit unresolved-debt links:',...matrix.map(row=>`- ${row.box_id}: ${row.disposition}; located_at ${row.located_at}; debt_ref ${row.debt_ref??'none'}.`));
  return{F:{...f[0],markdown:lines.join('\n')+'\n'},G:{...g[0],markdown:gLines.join('\n')+'\n'},verification_debt:debts,g_matrix:matrix};
}
export function validateSourceGroupCandidate({artifact,inspection,checkChange=true}){
  try{
    const {receipt:p,projectRoot,runDir,targets}=inspection;
    if(artifact.stage_id!=='02.dossier_sections'||artifact.envelope_scope?.kind!=='complete_dossier'||key(artifact.envelope_scope.assigned_section_ids)!==key(SECTION_IDS)||artifact.lineage?.source_registry_sha256!==p.source_registry_ref.sha256)fail('candidate_scope_or_source');
    const original=targets.map(r=>body(r,projectRoot,runDir)),old=acceptedBodies(inspection);
    if(old.some(value=>value.probe!==artifact.probe))fail('candidate_probe_changed');
    for(const debt of old.flatMap(value=>value.verification_debt??[]).filter(debt=>debt.ship_blocking&&debt.resolution_artifact_ref===null))if(!artifact.verification_debt?.some(value=>canonicalJson(value)===canonicalJson(debt)))fail('accepted_ship_blocking_debt_dropped');
    {
      const corrected=p.corrected_parts,book=groupBookkeeping(inspection,corrected.length?artifact:null),unchanged=s=>!['F','G',...corrected].includes(s.section_id),expected=old.flatMap(v=>v.sections).filter(unchanged),actual=artifact.sections.filter(unchanged);
      // A bookkeeping submission cannot alter exam policy or administrative assertions.
      const owner=part=>old.find(value=>value.sections.some(section=>section.section_id===part));
      const examKeys=Object.keys(old[0].exam_facts??{});
      for(const field of examKeys){const values=unique(old.map(value=>({...value.exam_facts[field],field})).filter(value=>value.status!=='unknown'),'field');const selected=values[0]??old[0].exam_facts[field];const {field:_,...entry}=selected;if(canonicalJson(artifact.exam_facts[field])!==canonicalJson(entry))fail('exam_policy_changed');}
      for(const [field,part]of [['needs_dedicated_surface','C'],['market_signal','E']])if(!corrected.includes(part)&&canonicalJson(artifact[field])!==canonicalJson(owner(part)[field]))fail('accepted_metadata_changed:'+field);
      if(!old.some(value=>canonicalJson(value.corpus_stability)===canonicalJson(artifact.corpus_stability)))fail('corpus_stability_changed');
      const requests=unique(old.flatMap(value=>value.external_review_requests??[]),'request_id');if(canonicalJson(requests)!==canonicalJson(artifact.external_review_requests))fail('review_requests_changed');
      if(!corrected.length){
        const ranked=old.flatMap(value=>value.high_yield_ranked??[]),seen=new Map();
        for(const row of ranked){
          const id=canonicalJson([row.domain,row.chunk_id]);
          if(seen.has(id)&&canonicalJson(seen.get(id))!==canonicalJson(row))fail('conflicting_metadata:domain_chunk_id:'+id);
          seen.set(id,row);
        }
        if(canonicalJson(ranked)!==canonicalJson(artifact.high_yield_ranked))fail('accepted_high_yield_changed');
      }
      else{const unchangedChunks=new Set(old.flatMap(value=>value.sections).filter(section=>!corrected.includes(section.section_id)).map(section=>section.chunk_id));for(const ranked of old.flatMap(value=>value.high_yield_ranked??[]).filter(ranked=>unchangedChunks.has(ranked.chunk_id)))if(!artifact.high_yield_ranked.some(value=>canonicalJson(value)===canonicalJson(ranked)))fail('unchanged_high_yield_dropped');}
      if(canonicalJson(expected.map(payload).sort((a,b)=>a.chunk_id.localeCompare(b.chunk_id)))!==canonicalJson(actual.map(payload).sort((a,b)=>a.chunk_id.localeCompare(b.chunk_id))))fail('metadata_variant_changed_non_F_G');
      for(const part of ['F','G']){const chunks=artifact.sections.filter(s=>s.section_id===part),expected={...book[part],char_count:[...book[part].markdown].length};if(chunks.length!==1||canonicalJson(payload(chunks[0]))!==canonicalJson(payload(expected)))fail('metadata_bookkeeping_not_derived');}
      if(canonicalJson(artifact.verification_debt)!==canonicalJson(book.verification_debt)||canonicalJson(artifact.g_matrix)!==canonicalJson(book.g_matrix))fail('metadata_debt_or_G_mismatch');
      if(corrected.length&&!corrected.some(part=>canonicalJson(old.flatMap(v=>v.sections).filter(s=>s.section_id===part).map(payload))!==canonicalJson(artifact.sections.filter(s=>s.section_id===part).map(payload))))fail('candidate_unchanged');
    }
    if(checkChange&&p.kind!=='source_binding_reconciliation'&&original.length===1){const comparable=v=>{const copy=structuredClone(v);delete copy.lineage;copy.merge.expected_merged_sha256=null;return canonicalJson(copy);};if(comparable(original[0])===comparable(artifact))fail('candidate_unchanged');}
    return{status:'PASS',reason:null};
  }catch(error){return{status:'FAIL',reason:error.message};}
}
