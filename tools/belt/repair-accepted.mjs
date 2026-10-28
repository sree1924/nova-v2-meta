// Accepted C/C2 correction, through the ordinary packet -> file transport -> validation -> compile path.
// node tools/belt/repair-accepted.mjs --run runs/<run> --executor-id <actor> --author muse
//   --section <section> --part C --replacement <run-local-proof> --replacement-sha256 <sha256>
//   [--approval <GO-02.dossier_sections-...json> --approval-sha256 <sha256>] [--packet thin|full]
// A replacement proof authorizes a submission only. The existing stage GO and every native check still apply.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256,canonicalJson,inside} from './atomic-file.mjs';
import {acquireExecutorLock} from './executor-lock.mjs';
import {assertDispatchAllowed} from './execution-policy.mjs';
import {PROJECT_ROOT,loadRun,compileAcceptedDossier} from './controller.mjs';
import {readNativeSnapshot,acceptedRuntimeRefs,taskSectionIds,inspectAccepted02Replacement,prepareDispatch,applyFileTransportPreflight,
  retryNonceKey,authoringKey,authoringPaths,emitAuthoringPacket,emitThinPacket,
  readAuthoringOutbox,museFileTransport,dispatchStage} from './dispatch.mjs';

const STAGE='02.dossier_sections';
const DOWNSTREAM=new Set(['03.combined_kg','04.cards','06.exam_bank','05.sessions','05.card_scripts']);
const sameIds=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&canonicalJson([...a].sort())===canonicalJson([...b].sort());
const hold=(reason,detail={})=>({status:'HOLD',reason,...detail,model_api_called:false});
export function downstreamReconciliationTasks(snapshot,sectionIds){
  return snapshot.tasks.filter(task=>task.status==='accepted'&&DOWNSTREAM.has(task.stage_id)&&(!taskSectionIds(task).length||taskSectionIds(task).some(id=>sectionIds.includes(id))))
    .map(task=>({task_id:task.task_id,stage_id:task.stage_id}));
}

function inspect({projectRoot,loaded,sectionIds,partIds,replacementRef,nowUtc}){
  const snapshot=readNativeSnapshot(loaded.runDir,loaded.config);
  const acceptedArtifacts=acceptedRuntimeRefs(snapshot,projectRoot,loaded.runDir,{sectionIds});
  return inspectAccepted02Replacement({projectRoot,runDir:loaded.runDir,runId:loaded.config.run_id,
    stageId:STAGE,sectionIds,partIds,acceptedArtifacts,replacementRef,nowUtc});
}

function packetProblem(packet,prepared,key,nonce){
  if(packet?.key!==key||packet.run_id!==prepared.config.run_id||packet.stage_id!==STAGE||
    !sameIds(packet.section_ids,prepared.sectionIds)||!sameIds(packet.part_ids,prepared.partIds)||packet.retry_nonce!==nonce)return'packet_scope_mismatch';
  if(packet.candidate_lineage_id!==prepared.config.candidate_lineage_id)return'packet_lineage_mismatch';
  if(packet.input_manifest_sha256!==prepared.context.input_manifest_sha256||packet.request_sha256!==prepared.request_sha256)return'packet_inputs_changed';
  return null;
}

function archiveOutbox({runDir,runId,executorId,key,status}){
  const files=authoringPaths(runDir,key),bytes=fs.readFileSync(files.outbox),hash=sha256(bytes);
  const target=inside(runDir,path.join(files.done,`${key}.${status}.${hash}.json`));
  const lockHandle=acquireExecutorLock({runDir,runId,executorId});
  try{
    fs.mkdirSync(files.done,{recursive:true});
    if(fs.existsSync(target)){
      if(sha256(fs.readFileSync(target))!==hash)throw Error('Archived outbox bytes changed.');
      fs.unlinkSync(files.outbox);
    }else fs.renameSync(files.outbox,target);
  }finally{lockHandle.release();}
  return{path:target,sha256:hash};
}

async function compileReplacement({projectRoot,loaded,executorId,sectionIds,approvalRef,replacement}){
  let compiled;
  try{compiled=await compileAcceptedDossier({projectRoot,runConfigPath:loaded.configPath,executorId,sectionIds,approvalRef});}
  catch(error){return hold('compile_error',{message:error.message,replacement_ref:replacement.ref});}
  if(compiled.status!=='PASS')return hold('compile_not_pass',{compile:compiled,replacement_ref:replacement.ref});
  const current=acceptedRuntimeRefs(readNativeSnapshot(loaded.runDir,loaded.config),projectRoot,loaded.runDir,{sectionIds})
    .find(ref=>ref.kind==='compiled_dossier'||ref.kind==='16-compiled-dossier.json');
  if(!current)return hold('compiled_acceptance_missing',{compile:compiled});
  const blueprint=JSON.parse(fs.readFileSync(current.path,'utf8'));
  const corrected=replacement.acceptedReplacement;
  const superseded=replacement.target;
  // A previous accepted compile can be reused only when it already contains this corrected acceptance.
  // The old target remains visible solely as supersession provenance.
  if(!corrected||(blueprint.input_refs??[]).every(ref=>ref.sha256!==corrected.sha256)||
    (blueprint.input_refs??[]).some(ref=>ref.sha256===superseded.sha256)||
    !(blueprint.superseded_envelopes??[]).some(ref=>ref.sha256===superseded.sha256))
    return hold('compile_replacement_binding_missing',{compile:compiled,compiled_ref:current});
  return{status:'PASS',replacement_ref:replacement.ref,accepted_replacement:corrected,compiled_ref:current,
    compile:compiled,actual_usd:0,model_api_called:false};
}

export async function repairAcceptedPart({projectRoot=PROJECT_ROOT,runConfigPath,executorId,author,
  sectionIds=[],partIds=[],replacementRef,approvalRef,packetMode='thin',nowUtc=new Date().toISOString()}={}){
  if(author!=='muse')throw Error('Accepted-part repair requires explicit --author muse; no Model API fallback exists.');
  if(typeof executorId!=='string'||!executorId.trim())throw Error('--executor-id is required.');
  if(sectionIds.length!==1||typeof sectionIds[0]!=='string'||!sectionIds[0].trim()||
    partIds.length!==1||!['C','C2'].includes(partIds[0]))throw Error('Repair requires exactly one --section and one --part C or C2.');
  if(!['thin','full'].includes(packetMode))throw Error('--packet must be thin or full.');
  if(!replacementRef?.path||!/^[a-f0-9]{64}$/.test(replacementRef.sha256??''))throw Error('Hash-bound --replacement and --replacement-sha256 are required.');
  const loaded=loadRun({projectRoot,runConfigPath});
  if(!Object.hasOwn(loaded.config.scope?.section_page_ranges??{},sectionIds[0]))throw Error('Requested section is not bound in this run.');
  const downstream=downstreamReconciliationTasks(readNativeSnapshot(loaded.runDir,loaded.config),sectionIds);
  // Same-ID wording corrections can invalidate learner artifacts even when their fact-ID set stays unchanged.
  // This narrow path cannot revoke those acceptances; stop before emitting or ingesting anything.
  if(downstream.length)return hold('DOWNSTREAM_RECONCILIATION_REQUIRED',{section_ids:sectionIds,downstream_tasks:downstream});
  let replacement=inspect({projectRoot,loaded,sectionIds,partIds,replacementRef,nowUtc});
  if(replacement.status!=='PASS')return hold('replacement_proof_invalid',{blockers:replacement.blockers});
  // This validates the ordinary GO even when this invocation only emits or reuses a packet.
  const policy=assertDispatchAllowed({projectRoot,config:loaded.config,runDir:loaded.runDir,go:true,mode:'live',
    stageId:STAGE,sectionIds,approvalRef,nowUtc,maxUsd:loaded.config.limits.max_call_usd});
  const nonce=loaded.config.execution?.retry_nonces?.[retryNonceKey(STAGE,partIds,sectionIds)]??0;
  const key=authoringKey(STAGE,sectionIds,partIds,nonce,replacement.ref.sha256);
  const transport=museFileTransport({runDir:loaded.runDir,key});
  const options={projectRoot,runConfigPath:loaded.configPath,executorId,stageId:STAGE,sectionIds,partIds,
    replacementRef,approvalRef:policy.approval_ref,nowUtc,transport};
  const prepared=applyFileTransportPreflight(prepareDispatch({...options,go:false}),transport);
  if(prepared.preflight.status!=='PASS')return hold('native_preflight',{blockers:prepared.preflight.blockers});
  if(replacement.acceptedReplacement)return compileReplacement({projectRoot,loaded,executorId,sectionIds,approvalRef:policy.approval_ref,replacement});
  const files=authoringPaths(loaded.runDir,key);
  const got=readAuthoringOutbox(loaded.runDir,key);
  if(!fs.existsSync(files.inbox)){
    if(got.reason!=='outbox_absent')return hold('outbox_without_packet',{key,outbox:files.outbox});
    const lockHandle=acquireExecutorLock({runDir:loaded.runDir,runId:loaded.config.run_id,executorId});
    let emitted;
    try{emitted=(packetMode==='thin'?emitThinPacket:emitAuthoringPacket)(options);}
    finally{lockHandle.release();}
    return{...emitted,
      // Native EMITTED names publication; the runner's WAITING names the required next action.
      status:emitted.status==='EMITTED'?'WAITING':'HOLD',replacement_ref:replacement.ref,model_api_called:false};
  }
  const packetBytes=fs.readFileSync(files.inbox);
  let packet;
  try{packet=JSON.parse(packetBytes);}catch{return hold('packet_invalid_json',{key,inbox:files.inbox});}
  const problem=packetProblem(packet,prepared,key,nonce);
  if(problem)return hold(problem,{key,inbox:files.inbox});
  if(!got.ok)return got.reason==='outbox_absent'?{status:'WAITING',key,inbox:files.inbox,outbox:files.outbox,
    packet_sha256:sha256(packetBytes),replacement_ref:replacement.ref,model_api_called:false}:hold(got.reason,{key,outbox:files.outbox});
  if(got.outbox.packet_sha256!==sha256(packetBytes))return hold('outbox_packet_sha256_mismatch',{key});
  const artifact=got.outbox.artifact;
  if(artifact.lineage?.candidate_lineage_id!==packet.candidate_lineage_id||artifact.lineage?.input_manifest_sha256!==packet.input_manifest_sha256)
    return hold('outbox_lineage_mismatch',{key});
  if(artifact.stage_id!==STAGE||!sameIds(artifact.envelope_scope?.assigned_section_ids,partIds)||
    !Array.isArray(artifact.sections)||artifact.sections.some(section=>!partIds.includes(section.section_id)))return hold('outbox_candidate_scope_mismatch',{key});
  let dispatched;
  try{dispatched=await dispatchStage({...options,go:true,transport});}
  catch(error){return hold('native_dispatch_error',{message:error.message,key});}
  const authoredRef=archiveOutbox({runDir:loaded.runDir,runId:loaded.config.run_id,executorId,key,status:dispatched.status});
  if(dispatched.status!=='accepted'&&!dispatched.reused)return hold('native_dispatch_not_accepted',{dispatch:dispatched,authored_ref:authoredRef,key});
  replacement=inspect({projectRoot,loaded,sectionIds,partIds,replacementRef,nowUtc});
  if(replacement.status!=='PASS'||!replacement.acceptedReplacement)return hold('replacement_acceptance_missing',{blockers:replacement.blockers,dispatch:dispatched});
  const result=await compileReplacement({projectRoot,loaded,executorId,sectionIds,approvalRef:policy.approval_ref,replacement});
  return{...result,dispatch:dispatched,authored_ref:authoredRef,key};
}

function cliOptions(args){
  const valueFlags=new Set(['--run','--executor-id','--author','--section','--part','--replacement','--replacement-sha256','--approval','--approval-sha256','--packet']);
  const values={};
  for(let i=0;i<args.length;i++){
    const flag=args[i];
    if(!valueFlags.has(flag)||Object.hasOwn(values,flag))throw Error('Unknown or repeated argument: '+flag);
    if(!args[i+1]||args[i+1].startsWith('--'))throw Error('Argument value missing: '+flag);
    values[flag]=args[++i];
  }
  if(!values['--run'])throw Error('--run runs/<run> is required.');
  if(Boolean(values['--approval'])!==Boolean(values['--approval-sha256']))throw Error('--approval and --approval-sha256 must be supplied together.');
  return{runConfigPath:path.join(values['--run'],'run-config.json'),executorId:values['--executor-id'],author:values['--author'],
    sectionIds:values['--section']?[values['--section']]:[],partIds:values['--part']?[values['--part']]:[],
    replacementRef:{path:values['--replacement'],sha256:values['--replacement-sha256']},
    ...(values['--approval']?{approvalRef:{path:values['--approval'],sha256:values['--approval-sha256']}}:{}),packetMode:values['--packet']??'thin'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const result=await repairAcceptedPart(cliOptions(process.argv.slice(2)));
    console.log(JSON.stringify(result,null,2));
    process.exitCode=result.status==='PASS'?0:result.status==='WAITING'?3:2;
  }catch(error){console.error(JSON.stringify(hold('repair_error',{message:error.message})));process.exitCode=2;}
}
