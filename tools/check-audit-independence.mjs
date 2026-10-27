import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export function providerFamily(value) {
  const s=String(value||'').trim().toLowerCase();
  if(/openai|\bgpt\b|codex/.test(s))return'openai';
  if(/anthropic|claude/.test(s))return'anthropic';
  if(/google|gemini/.test(s))return'google';
  if(/\bmeta\b|muse/.test(s))return'meta';
  if(['human','issuer','script'].includes(s))return s;
  return null;
}

// Pure policy evaluator. Eligible means both independent and currently qualified for this scope.
export function evaluateAuditIndependence({actors=[],auditors=[],lineageComplete=false,requiredProviderFamilies=2}={}) {
  const normalized=actors.map(a=>({...a,family:providerFamily(a.provider_family||a.provider)}));
  const provenanceComplete=lineageComplete&&normalized.length>0&&normalized.every(a=>a.family&&typeof a.actor_id==='string'&&a.actor_id.length>0);
  const evaluations=auditors.map(a=>{
    const family=providerFamily(a.provider_family||a.provider);
    const reasons=[];
    if(!provenanceComplete)reasons.push('candidate_lineage_provenance_incomplete');
    if(!family)reasons.push('auditor_provider_family_unknown');
    if(!['openai','anthropic','google'].includes(family))reasons.push('auditor_family_is_not_a_configured_model_provider');
    if(!a.actor_id||!a.session_id)reasons.push('auditor_actor_or_session_unresolved');
    if(!a.model||/verify/i.test(a.model))reasons.push('auditor_actual_model_unresolved');
    if(a.qualification_status!=='qualified')reasons.push('auditor_not_qualified_for_scope');
    const contributors=normalized.filter(c=>(family&&c.family===family)||(a.actor_id&&c.actor_id===a.actor_id)||(a.session_id&&c.session_id===a.session_id));
    if(contributors.some(c=>family&&c.family===family))reasons.push('provider_family_contributed_to_candidate_or_prompt');
    if(contributors.some(c=>a.actor_id&&c.actor_id===a.actor_id))reasons.push('actor_contributed_to_candidate_or_prompt');
    if(contributors.some(c=>a.session_id&&c.session_id===a.session_id))reasons.push('session_contributed_to_candidate_or_prompt');
    return{bot_id:a.bot_id||null,actor_id:a.actor_id||null,provider_family:family,eligible:reasons.length===0,reasons,conflicting_contributors:contributors.map(c=>({actor_id:c.actor_id,session_id:c.session_id||null,provider_family:c.family,artifact_sha256:c.artifact_sha256||null,contribution_kind:c.contribution_kind||null}))};
  });
  const eligibleFamilies=[...new Set(evaluations.filter(e=>e.eligible).map(e=>e.provider_family))];
  return{status:provenanceComplete&&eligibleFamilies.length>=requiredProviderFamilies?'PASS':'BLOCKED',lineage_complete:provenanceComplete,required_provider_families:requiredProviderFamilies,eligible_provider_families:eligibleFamilies,eligible_provider_family_count:eligibleFamilies.length,evaluations,policy:'actor_and_provider_family_independence_including_prompt_and_intervention_lineage',no_model_calls:true};
}

// Required manifest shape: {lineage_complete:true,artifacts:[{path,sha256}],prompt_refs:[...],
// lineage_refs:[...],intervention_ledger_refs:[...]}. Ledger entries identify artifact_sha256,
// actor_id, provider_family, session_id and contribution_kind. All refs hash real saved bytes.
export function inspectAuditIndependence({projectRoot,candidateManifestRef,interventionLedgerRef,promptAuthorshipRef,auditors=[],requiredProviderFamilies=2}={}) {
  const errors=[],actors=[],visited=new Set(),coveredHashes=new Set(),nodes=[],ledgerRefs=[];
  const base=path.resolve(projectRoot||path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  const readPinned=(ref,label)=>{
    if(!ref||typeof ref.path!=='string'||!/^[a-f0-9]{64}$/.test(ref.sha256||''))throw new Error(label+': missing path/hash');
    const target=path.resolve(base,ref.path);
    const rel=path.relative(base,target);
    if(rel.startsWith('..')||path.isAbsolute(rel))throw new Error(label+': path escapes project');
    const bytes=fs.readFileSync(target);
    if(sha(bytes)!==ref.sha256)throw new Error(label+': hash mismatch');
    return{path:target,sha256:ref.sha256,bytes};
  };
  const addActors=(list,artifactHash)=>{for(const actor of list||[])actors.push({...actor,artifact_sha256:actor.artifact_sha256||artifactHash});};
  const walk=(ref,label)=>{
    const pinned=readPinned(ref,label);
    const key=pinned.path+'@'+pinned.sha256;
    if(visited.has(key))return;
    visited.add(key);coveredHashes.add(pinned.sha256);nodes.push(pinned);
    let doc;
    try{doc=JSON.parse(pinned.bytes);}catch{
      // Prompt bodies are text; provenance must still come from the hashed intervention ledger.
      return;
    }
    addActors(doc.contributed_by,pinned.sha256);
    if(doc.producer)addActors([doc.producer],pinned.sha256);
    if(doc.provenance?.authors)addActors(doc.provenance.authors,pinned.sha256);
    if(doc.template_provenance?.author_actor&&doc.template_provenance?.author_provider_family)addActors([{actor_id:doc.template_provenance.author_actor,provider_family:doc.template_provenance.author_provider_family,session_id:doc.template_provenance.author_session_id||null,contribution_kind:'controller_header_template'}],pinned.sha256);
    for(const property of ['artifacts','input_refs','prompt_refs','lineage_refs','parent_candidate_refs'])for(const child of doc[property]||[])walk(child,label+'.'+property);
    for(const ledger of doc.intervention_ledger_refs||[])ledgerRefs.push(ledger);
    if(doc.intervention_ledger_ref)ledgerRefs.push(doc.intervention_ledger_ref);
  };
  let manifest;
  try{
    if(!candidateManifestRef)throw new Error('candidate_manifest_ref unresolved');
    const root=readPinned(candidateManifestRef,'candidate manifest');
    manifest=JSON.parse(root.bytes);
    if(manifest.lineage_complete!==true)throw new Error('Candidate lineage_complete receipt is absent');
    if(!Array.isArray(manifest.artifacts)||!manifest.artifacts.length)throw new Error('Candidate artifact refs are missing');
    if(!Array.isArray(manifest.prompt_refs)||!manifest.prompt_refs.length)throw new Error('Authoring prompt refs are missing from candidate lineage');
    // Root manifest bytes are control evidence; artifact and prompt bytes require contributor coverage.
    for(const ref of manifest.artifacts)walk(ref,'candidate artifact');
    for(const ref of manifest.prompt_refs)walk(ref,'authoring prompt');
    for(const ref of manifest.lineage_refs||[])walk(ref,'candidate lineage');
    const authorshipRef=manifest.prompt_authorship_ref||promptAuthorshipRef;
    if(!authorshipRef)throw new Error('Hash-bound authoring-prompt provenance is missing');
    const authorship=JSON.parse(readPinned(authorshipRef,'prompt authorship').bytes);
    for(const entry of authorship.entries||[]){
      const prompt=readPinned(entry,'authored prompt');
      if(coveredHashes.has(prompt.sha256))actors.push({...entry,artifact_sha256:prompt.sha256,contribution_kind:'authoring_prompt'});
    }
    ledgerRefs.push(...(manifest.intervention_ledger_refs||[]));
    if(manifest.intervention_ledger_ref)ledgerRefs.push(manifest.intervention_ledger_ref);
    if(interventionLedgerRef)ledgerRefs.push(interventionLedgerRef);
    if(!ledgerRefs.length)throw new Error('No intervention ledger ref resolves candidate lineage');
    for(const [i,ref]of ledgerRefs.entries()){
      const ledger=JSON.parse(readPinned(ref,'intervention ledger'+i).bytes);
      if(ledger.lineage_complete!==true||!Array.isArray(ledger.entries))throw new Error('Intervention ledger completeness/entries missing');
      for(const entry of ledger.entries){
        if(!/^[a-f0-9]{64}$/.test(entry.artifact_sha256||''))throw new Error('Intervention entry has no bound artifact hash');
        if(coveredHashes.has(entry.artifact_sha256))actors.push(entry);
      }
    }
    for(const node of nodes)if(!actors.some(a=>a.artifact_sha256===node.sha256))errors.push('No contributor provenance for '+path.relative(base,node.path));
  }catch(error){errors.push(String(error.message||error));}
  const result=evaluateAuditIndependence({actors,auditors,lineageComplete:errors.length===0,requiredProviderFamilies});
  return{...result,candidate_manifest_ref:candidateManifestRef||null,resolved_lineage_files:nodes.length,validation_errors:errors};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const flags=Object.fromEntries(process.argv.slice(2).reduce((pairs,token,index,args)=>token.startsWith('--')?[...pairs,[token,args[index+1]]]:pairs,[]));
  const projectRoot=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  const load=flag=>flags[flag]?JSON.parse(fs.readFileSync(path.resolve(projectRoot,flags[flag]),'utf8')):null;
  const input=load('--assignment')||{};
  const result=inspectAuditIndependence({projectRoot,...input});
  console.log(JSON.stringify(result,null,2));
  if(result.status!=='PASS')process.exitCode=1;
}
