// Subscription: ingest one current outbox, then emit/wait for the next packet.
// True HOLDs, stale pins, exceptions and capacity exhaustion STOP without changing
// lineage, retry nonces, accepted history or uncertain-provider accounting.
// node tools/belt/run-utah.mjs --run runs/<id> --executor-id <actual-id> --author muse --section <id> --max-resets 0
// Legacy paid mode requires explicit --author model-api --go plus all existing money/GO controls.
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {inside,verifyRef} from './atomic-file.mjs';
import {parseRunnerOptions,inspectAcceptedReuse,inspectSubscriptionStep,runnerFailure,archiveBasename} from './runner-policy.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const activeStates=new Set(['claimed','running','output_saved','validating','awaiting_audit','unknown_provider_result']);
const busy=state=>(state.attempts??[]).some(a=>activeStates.has(a.status))||(state.tasks??[]).some(t=>activeStates.has(t.status))||(state.reservations??[]).some(r=>['reserved','unknown_provider_result'].includes(r.state));

export async function runUtah({argv=process.argv.slice(2),projectRoot=ROOT,runtime=null,log=console.log,loadEnv=true}={}) {
  // Validate every CLI choice before reading a run, loading dotenv, or writing.
  const options=parseRunnerOptions(argv);
  projectRoot=path.resolve(projectRoot);
  const {run:RUN,executorId:EXECUTOR,stepMode,dry,stages,parts,packetMode}=options;
  if(loadEnv)dotenv.config({path:path.join(projectRoot,'.env'),quiet:true});
  const runDir=inside(path.join(projectRoot,'runs'),path.join(projectRoot,RUN));
  const configPath=path.join(runDir,'run-config.json'),readConfig=()=>read(configPath);
  const initial=readConfig();
  if(path.basename(runDir)!==initial.run_id)throw Error('Run/config directory mismatch.');
  const allSections=Object.keys(initial.scope?.section_page_ranges??{});
  const sections=options.sections?(options.sections==='all'?allSections:options.sections.split(',')):[options.section];
  if(!sections.length||sections.some(s=>!allSections.includes(s)))throw Error('Unknown section selection.');
  if(!stepMode&&!dry&&!process.env[initial.producer?.key_env_name??'MODEL_API_KEY'])throw Error('MODEL_API_KEY absent for explicit model-api mode.');
  const standingPath=initial.execution?.standing_authority_ref
    ?inside(runDir,verifyRef(initial.execution.standing_authority_ref,projectRoot))
    :path.join(runDir,'approvals/STANDING-AUTHORITY-utah-full-run.json');
  const standingBytes=fs.readFileSync(standingPath),standing=JSON.parse(standingBytes),standingSha=sha(standingBytes);
  if(standing.run_id!==initial.run_id||!Number.isFinite(standing.usd_cap_total)||standing.usd_cap_total<=0||typeof standing.founder_words!=='string'||!standing.founder_words.trim())throw Error('Standing authority is not bound to this run/cap/founder words.');
  if(!runtime){
    const dispatch=await import('./dispatch.mjs'),controller=await import('./controller.mjs');
    runtime={...dispatch,compileAcceptedDossier:controller.compileAcceptedDossier};
  }
  const snapshot=()=>runtime.readNativeSnapshot(runDir,readConfig());
  const spentUsd=()=>snapshot().reservations.reduce((sum,r)=>sum+(r.state==='reported'?(r.actual_microusd??0):['reserved','unknown_provider_result'].includes(r.state)?r.reserved_microusd:0),0)/1e6;
  const assertNoForeignLock=()=>{if(fs.existsSync(path.join(runDir,'EXECUTOR.lock.md')))throw Error('EXECUTOR_LOCK_HELD: existing ownership requires explicit reconciliation.');};
  function mintApproval(stageId,section){
    assertNoForeignLock();
    if(sha(fs.readFileSync(standingPath))!==standingSha)throw Error('Standing authority bytes changed.');
    const remaining=standing.usd_cap_total-spentUsd();
    if(remaining<0.25)throw Error('BUDGET_CAP: standing authority remaining cap is below the dispatch floor.');
    const stamp=new Date().toISOString().replace(/[:.]/g,'-');
    const file=path.join(runDir,'approvals',`GO-${stageId}-${stamp}.json`);
    const approval={schema_version:'nova-stage-approval.v0.4.0',run_id:standing.run_id,stage_id:stageId,section_ids:[section],founder_words:standing.founder_words,founder:standing.founder,
      derived_from_standing_authority:{path:path.relative(projectRoot,standingPath).replaceAll('\\','/'),sha256:standingSha},
      recorded_by:{actor_id:'native-belt-runner',session_id:EXECUTOR},recorded_at:new Date().toISOString(),expires_at:standing.expires_at,usd_ceiling:Math.min(1,remaining),content_calls_authorized:true};
    fs.writeFileSync(file,JSON.stringify(approval,null,2)+'\n',{flag:'wx'});
    return{path:file,sha256:sha(fs.readFileSync(file))};
  }
  function acceptedParts(stageId,section){
    const state=snapshot();
    const refs=runtime.acceptedRuntimeRefs(state,projectRoot,runDir,{sectionIds:[section]});
    const registry=refs.find(r=>['fact_registry','16-fact-registry.json'].includes(r.kind));
    return inspectAcceptedReuse({stageId,sectionIds:[section],projectRoot,currentRefs:refs,
      acceptedIdentities:refs.filter(r=>r.stage_id===stageId).map(r=>r.identity),
      registryBytes:registry?fs.readFileSync(registry.path):null});
  }
  function nonPass(result){
    try{if(result.validation?.path)return read(result.validation.path).checks.filter(c=>c.status!=='PASS').map(c=>`${c.check_id}=${c.status}`);}catch{}
    return[result.reason??result.status];
  }
  async function runStage(stageId,partIds,section){
    const label=`${stageId}${partIds.length?' part '+partIds.join('+'):''}`;
    if(dry){log(`DRY ${label}; no approval, packet or dispatch written`);return{status:'DRY'};}
    try{
      assertNoForeignLock();
      const cfg=readConfig(),state=snapshot();
      if(busy(state))return{status:'HOLD',reason:'active_or_uncertain_attempt_requires_reconciliation'};
      let transport=null,key=null,ap=null;
      if(stepMode){
        const nonce=cfg.execution?.retry_nonces?.[runtime.retryNonceKey(stageId,partIds,[section])]??0;
        key=runtime.authoringKey(stageId,[section],partIds,nonce);
        ap=runtime.authoringPaths(runDir,key);
        transport=runtime.museFileTransport({runDir,key});
        const prepared=runtime.prepareDispatch({projectRoot,runConfigPath:configPath,executorId:EXECUTOR,stageId,sectionIds:[section],partIds,go:false,snapshot:state});
        runtime.applyFileTransportPreflight(prepared,transport);
        if(prepared.preflight.status!=='PASS')return{status:'HOLD',reason:'authoring_preflight_hold',blockers:prepared.preflight.blockers};
        let packet=null,packetBytes=null;
        const packetPresent=fs.existsSync(ap.inbox);
        if(packetPresent){try{packetBytes=fs.readFileSync(ap.inbox);packet=JSON.parse(packetBytes);}catch{}}
        const taskIds=new Set((state.tasks??[]).filter(t=>t.stage_id===stageId&&t.lineage_id===cfg.candidate_lineage_id).map(t=>t.task_id));
        const decision=inspectSubscriptionStep({lineageId:cfg.candidate_lineage_id,attempts:(state.attempts??[]).filter(a=>taskIds.has(a.task_id)).length,
          maxAttempts:cfg.limits?.max_automatic_attempts_per_logical_task??2,outbox:runtime.readAuthoringOutbox(runDir,key),packet,packetPresent,
          currentManifestSha256:prepared.context.input_manifest_sha256,packetSha256:packetBytes?sha(packetBytes):null,expectedKey:key,stageId,sectionIds:[section],partIds});
        if(decision.status==='EMIT'){
          // Packet writes hold the native executor lock just like ordinary dispatch.
          const {acquireExecutorLock}=await import('./executor-lock.mjs');
          const lock=acquireExecutorLock({runDir,runId:cfg.run_id,executorId:EXECUTOR});
          let emitted;
          try{const emit=packetMode==='thin'?runtime.emitThinPacket:runtime.emitAuthoringPacket;emitted=emit({projectRoot,runConfigPath:configPath,executorId:EXECUTOR,stageId,sectionIds:[section],partIds,transport});}
          finally{lock.release();}
          if(emitted.status!=='EMITTED')return{status:'HOLD',reason:'authoring_packet_not_emitted',blockers:emitted.blockers};
          log(`  ${label}: ${packetMode} packet ${key} emitted`);
          log(`    → read ${path.relative(projectRoot,emitted.inbox)}, write ${path.relative(projectRoot,emitted.outbox)}, re-run this command`);
          return{status:'WAITING',key,inbox:emitted.inbox,outbox:emitted.outbox};
        }
        if(decision.status==='WAITING')return{status:'WAITING',key,inbox:ap.inbox,outbox:ap.outbox};
        if(decision.status!=='INGEST')return decision;
      }
      const approvalRef=mintApproval(stageId,section);
      const result=await runtime.dispatchStage({projectRoot,runConfigPath:configPath,executorId:EXECUTOR,stageId,sectionIds:[section],partIds,approvalRef,go:true,...(transport?{transport}:{})});
      log(`  ${label}${stepMode?' [muse subscription, $0]':''}: ${result.status}${result.status!=='accepted'?' — '+nonPass(result).join(', '):''}`);
      // A HOLD keeps its exact outbox bytes in place. No automatic retry/nonce/reset/reconciliation.
      if(result.status!=='accepted'&&!result.reused)return result;
      if(ap){
        try{
          const bytes=fs.readFileSync(ap.outbox),archive=path.join(ap.done,archiveBasename(bytes,result.status));
          fs.mkdirSync(ap.done,{recursive:true});
          if(fs.existsSync(archive)){if(!fs.readFileSync(archive).equals(bytes))throw Error('Archive hash collision.');}
          else fs.renameSync(ap.outbox,archive);
        }catch(error){return{status:'HOLD',reason:'accepted_outbox_archive_requires_reconciliation',accepted:true,message:error.message};}
      }
      return result;
    }catch(error){return runnerFailure(error);}
  }
  const outcomes={};
  log(`BELT RUN — ${sections.length} section(s): ${sections.join(', ')}; stages ${stages.join(' → ')}; spent $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total}`);
  sectionLoop:for(const section of sections){
    log(`\n=== ${section} ===`);
    for(const stageId of stages){
      if(!dry&&busy(snapshot())){outcomes[section]=`HOLD ${stageId} active_or_uncertain_attempt_requires_reconciliation`;break sectionLoop;}
      if(stageId==='16.compile'){
        if(dry){log('DRY 16.compile; no approval, compile or pointer written');continue;}
        let compiled;
        try{
          const state=snapshot();
          if(busy(state))compiled={status:'HOLD',reason:'active_or_uncertain_attempt_requires_reconciliation'};
          else compiled=await runtime.compileAcceptedDossier({projectRoot,runConfigPath:configPath,executorId:EXECUTOR,sectionIds:[section],approvalRef:mintApproval(stageId,section)});
        }catch(error){compiled=runnerFailure(error);}
        log(`  16.compile: ${compiled.status}${compiled.reason?' — '+compiled.reason:''}`);
        if(compiled.status!=='PASS'){outcomes[section]=`${compiled.status} 16.compile ${compiled.reason??''}`;break sectionLoop;}
        // Restored 2026-10-29 (coordinator): move 16/<section>/CURRENT.json to the ledger's latest accepted
        // compile, so downstream authors and the re-author pass read the registry the belt will bind.
        try{const {markCurrentCompiles}=await import(pathToFileURL(path.join(projectRoot,'tools/belt/mark-current-compiles.mjs')).href);const m=markCurrentCompiles(path.relative(projectRoot,runDir).replace(/\\/g,'/'));log(`  CURRENT.json: ${Array.isArray(m)?m.length:0} section pointer(s) current`);}
        catch(error){log(`  CURRENT.json pointer not written: ${String(error.message).slice(0,120)}`);}
        continue;
      }
      let reuse;
      try{reuse=acceptedParts(stageId,section);}catch(error){reuse={status:'HOLD',reason:'accepted_metadata_unreadable',message:error.message};}
      if(reuse.status!=='PASS'){log(`STOP ${section}: ${reuse.reason}`);outcomes[section]=`HOLD ${stageId} ${reuse.reason}`;break sectionLoop;}
      const partList=stageId==='02.dossier_sections'?parts.map(p=>[p]):[[]];
      for(const partIds of partList){
        const partKey=JSON.stringify(partIds);
        if(reuse.stale?.includes(partKey)){log(`STOP ${section}: ${stageId} requires exact current dependency reconciliation`);outcomes[section]=`HOLD ${stageId} accepted_dependency_reconciliation_required`;break sectionLoop;}
        if(reuse.done.includes(partKey)&&options.remintStage!==stageId){log(`  ${stageId}${partIds.length?' part '+partIds.join('+'):''}: accepted over exact current dependencies — skipped`);continue;}
        const result=await runStage(stageId,partIds,section);
        if(!['accepted','DRY'].includes(result.status)&&!result.reused){
          log(`${result.status} ${section}: ${stageId} ${result.reason??result.key??''}`);
          outcomes[section]=`${result.status} ${stageId} ${result.reason??result.key??''}`;break sectionLoop;
        }
      }
    }
    outcomes[section]=dry?'DRY':'DONE';
  }
  log(`\nSUMMARY spent $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total}`);
  for(const section of sections)log(`  ${section}: ${outcomes[section]??'not reached'}`);
  const values=Object.values(outcomes);
  const exitCode=values.some(v=>v.startsWith('WAITING'))?3:values.every(v=>v==='DONE'||v==='DRY')&&values.length===sections.length?0:1;
  return{exitCode,outcomes};
}

if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  try{const result=await runUtah();process.exitCode=result.exitCode;}
  catch(error){console.error(String(error.message??error));process.exitCode=2;}
}
