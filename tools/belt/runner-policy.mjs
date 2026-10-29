// Pure runner decisions. No writes, retries, authority grants, or content equivalence.
import path from 'node:path';
import {createHash} from 'node:crypto';

export const RUNNER_STAGES = {'02':'02.dossier_sections','16':'16.compile','03':'03.combined_kg','04':'04.cards','06':'06.exam_bank','05.sessions':'05.sessions','05.card_scripts':'05.card_scripts'};
const stageIds = new Set(Object.values(RUNNER_STAGES));
const defaults = {run:'runs/2026-10-26-rdmv-ut-class-d',stages:'02,16,03,04,06,05.sessions,05.card_scripts',parts:'C,C2,A,B,D,E,E2,F,G',packet:'full','max-resets':'0'};
const valueFlags = new Set(['run','executor-id','author','stages','parts','packet','max-resets','section','sections','remint']);
const boolFlags = new Set(['dry','go']);
export function parseRunnerOptions(argv) {
  const values={...defaults};
  const seen=new Set();
  for(let i=0;i<argv.length;i++){
    const flag=argv[i];
    if(!flag.startsWith('--'))throw Error('Unexpected argument: '+flag);
    const key=flag.slice(2);
    if(!valueFlags.has(key)&&!boolFlags.has(key))throw Error('Unknown option: '+flag);
    if(seen.has(key))throw Error('Duplicate option: '+flag);
    seen.add(key);
    if(boolFlags.has(key)){values[key]=true;continue;}
    if(i+1>=argv.length||argv[i+1].startsWith('--')||!argv[i+1].trim())throw Error('Value required for '+flag);
    values[key]=argv[++i];
  }
  if(!values['executor-id']||!values['executor-id'].trim())throw Error('Explicit actual --executor-id is required.');
  if(!['muse','model-api'].includes(values.author))throw Error('Explicit --author muse|model-api is required; no paid fallback.');
  if(values.author==='model-api'&&!values.go&&!values.dry)throw Error('--author model-api requires explicit --go and existing money/GO controls.');
  if(!['full','thin'].includes(values.packet))throw Error('Unknown --packet; supported: full, thin.');
  if(!/^\d+$/.test(values['max-resets'])||!Number.isSafeInteger(Number(values['max-resets'])))throw Error('--max-resets must be a nonnegative integer.');
  if(Number(values['max-resets'])!==0)throw Error('Automatic lineage resets are disabled; use --max-resets 0 and the explicit cause/revision path.');
  if(Boolean(values.section)===Boolean(values.sections))throw Error('Exactly one of --section <id> or --sections all|a,b is required.');
  const csv=(raw,label)=>{const out=raw.split(',');if(out.some(x=>!x.trim()||x!==x.trim())||new Set(out).size!==out.length)throw Error('Invalid '+label+' list.');return out;};
  const stages=csv(values.stages,'--stages').map(s=>RUNNER_STAGES[s]??s);
  if(stages.some(s=>!stageIds.has(s)))throw Error('Unknown --stages value.');
  const parts=csv(values.parts,'--parts');
  if(parts.some(p=>!defaults.parts.split(',').includes(p)))throw Error('Unknown --parts value.');
  const remintStage=values.remint?(RUNNER_STAGES[values.remint]??values.remint):null;
  if(remintStage&&!stageIds.has(remintStage))throw Error('Unknown --remint stage.');
  if(values.sections&&values.sections!=='all')csv(values.sections,'--sections');
  const run=values.run.replaceAll('\\','/').replace(/\/$/,'');
  if(!/^runs\/[A-Za-z0-9][A-Za-z0-9._-]*$/.test(run))throw Error('--run must be an isolated runs/<run-id> directory.');
  return{run,executorId:values['executor-id'],author:values.author,stepMode:values.author==='muse',packetMode:values.packet,stages,parts,maxResets:0,dry:values.dry===true,go:values.go===true,section:values.section,sections:values.sections,remintStage};
}

const aliases={'15-source-registry.json':'source_registry','15-page-map.json':'page_map','15-source-liveness.json':'source_liveness','16-fact-registry.json':'fact_registry','16-compiled-dossier.json':'compiled_dossier','03.combined_kg':'knowledge_graph','04.cards':'carddeck','06.exam_bank':'exam_bank','05.sessions':'sessions','05.card_scripts':'card_scripts'};
const sourceKinds=['source_registry','page_map','source_text','source_liveness'];
const required={
  '02.dossier_sections':['source_registry','page_map','source_text'],
  '03.combined_kg':['compiled_dossier','fact_registry','source_registry','learning_loop'],
  '04.cards':['compiled_dossier','fact_registry','page_map','source_text','learning_loop','knowledge_graph'],
  // Keep the native 04/06 relationship: 06 consumes graph/registry, not cards.
  '06.exam_bank':['compiled_dossier','fact_registry','learning_loop','knowledge_graph'],
  '05.sessions':['compiled_dossier','fact_registry','source_registry','exam_bank'],
  '05.card_scripts':['compiled_dossier','fact_registry','carddeck'],
};
const kindOf=ref=>aliases[ref?.kind]??ref?.kind;
const sameIds=(a,b)=>JSON.stringify([...(a??[])].sort())===JSON.stringify([...b].sort());
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const exact=(a,b,root)=>a?.sha256===b?.sha256&&typeof a?.path==='string'&&typeof b?.path==='string'&&path.resolve(root,a.path)===path.resolve(root,b.path);

// currentRefs must come from the native ledger/receipt resolver. Registry bytes
// are independently checked before their ledger hash may be used for skipping.
export function inspectAcceptedReuse({stageId,sectionIds,acceptedIdentities,currentRefs,registryBytes,projectRoot}) {
  const needs=required[stageId];
  if(!needs)throw Error('Unsupported runner reuse stage: '+stageId);
  const current=new Map();
  for(const ref of currentRefs??[]){
    const kind=kindOf(ref);
    if(!needs.includes(kind)&&!sourceKinds.includes(kind))continue;
    if(current.has(kind)&&!exact(current.get(kind),ref,projectRoot))return{status:'HOLD',reason:'ambiguous_current_dependency',done:[],kind};
    current.set(kind,ref);
  }
  const missing=needs.filter(k=>!current.has(k));
  if(missing.length)return{status:'HOLD',reason:stageId==='02.dossier_sections'?'current_source_metadata_unavailable':'current_compile_or_dependency_metadata_unavailable',done:[],missing};
  if(stageId!=='02.dossier_sections'){
    if(registryBytes===undefined||registryBytes===null)return{status:'HOLD',reason:'current_registry_bytes_unavailable',done:[]};
    const registry=current.get('fact_registry');
    if(digest(registryBytes)!==registry.sha256)return{status:'HOLD',reason:'current_registry_hash_mismatch',done:[]};
    try{const body=JSON.parse(Buffer.from(registryBytes).toString('utf8'));if(!body.facts||typeof body.facts!=='object'||Array.isArray(body.facts))throw Error('facts');}
    catch{return{status:'HOLD',reason:'current_registry_metadata_unreadable',done:[]};}
  }
  const done=new Set(),stale=new Set();
  for(const raw of acceptedIdentities??[]){
    let identity;
    try{identity=typeof raw==='string'?JSON.parse(raw):raw;}catch{return{status:'HOLD',reason:'accepted_identity_unreadable',done:[]};}
    if(!identity||!sameIds(identity.config?.section_ids,sectionIds))continue;
    if(!Array.isArray(identity.inputs))return{status:'HOLD',reason:'accepted_dependency_pins_unreadable',done:[]};
    const part=JSON.stringify(identity.config?.dossier_parts??[]);
    if([...current.values()].every(ref=>identity.inputs.some(old=>exact(old,ref,projectRoot))))done.add(part);
    else stale.add(part);
  }
  const staleParts=[...stale].filter(part=>!done.has(part));
  return{status:'PASS',done:[...done],stale:staleParts,reason:staleParts.length?'accepted_dependency_reconciliation_required':null};
}

export function inspectSubscriptionStep({lineageId,attempts,maxAttempts,outbox,packet,packetPresent=packet!==null,currentManifestSha256,packetSha256,expectedKey,stageId,sectionIds,partIds,activeAttempts=[]}) {
  if(activeAttempts.length)return{status:'HOLD',reason:'active_or_uncertain_attempt_requires_reconciliation'};
  if(attempts>=maxAttempts)return{status:'NEEDS_CAUSE',reason:'lineage_capacity_requires_explicit_cause'};
  if(packetPresent&&!packet)return{status:'HOLD',reason:'authoring_packet_missing_or_unreadable'};
  if(packet){
    if(packet.key!==expectedKey)return{status:'HOLD',reason:'authoring_key_mismatch'};
    if(stageId&&(packet.stage_id!==stageId||!sameIds(packet.section_ids,sectionIds)||!sameIds(packet.part_ids,partIds)))return{status:'HOLD',reason:'authoring_packet_scope_mismatch'};
    if(packet.candidate_lineage_id!==lineageId)return{status:'HOLD',reason:'stale_packet_lineage'};
    if(packet.input_manifest_sha256!==currentManifestSha256)return{status:'HOLD',reason:'stale_packet_input_pins'};
  }
  if(!outbox.ok)return outbox.reason==='outbox_absent'?{status:packet?'WAITING':'EMIT'}:{status:'HOLD',reason:outbox.reason};
  if(!packet)return{status:'HOLD',reason:'authoring_packet_missing_or_unreadable'};
  if(outbox.outbox.key!==expectedKey)return{status:'HOLD',reason:'authoring_key_mismatch'};
  if(outbox.outbox.packet_sha256!==packetSha256)return{status:'HOLD',reason:'outbox_packet_sha256_mismatch'};
  const value=outbox.outbox.artifact;
  const lineage=value?.lineage??value;
  if(lineage.candidate_lineage_id!==lineageId||lineage.input_manifest_sha256!==currentManifestSha256)return{status:'HOLD',reason:'outbox_lineage_or_input_pins_mismatch'};
  return{status:'INGEST'};
}

export function runnerFailure(error) {
  const message=String(error?.message??error);
  if(/LINEAGE_ATTEMPT_LIMIT/.test(message))return{status:'NEEDS_CAUSE',reason:'lineage_capacity_requires_explicit_cause',message};
  if(/BUDGET_CAP|budget cap|cap exceeded/i.test(message))return{status:'CAP',reason:'budget_cap',message};
  return{status:'HOLD',reason:/SEQUENTIAL_TASK_BUSY|uncertain provider|unknown_provider_result/i.test(message)?'active_or_uncertain_attempt_requires_reconciliation':'native_operation_error',message};
}
export function archiveBasename(outboxBytes,status) {
  return `outbox-${digest(outboxBytes).slice(0,24)}.${String(status).replace(/[^A-Za-z0-9_-]/g,'_')}.json`;
}
