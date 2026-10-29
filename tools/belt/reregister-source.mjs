#!/usr/bin/env node
// reregister-source.mjs — re-run role-15 source registration on a run that has ALREADY executed (ledger bound in execute
// mode), reusing the run's existing binding/mode/budget exactly as compileAcceptedDossier does. `plan --register-sources`
// claims the run in dry_run mode with the plan budget and therefore refuses (RUN_BINDING_CHANGED) once a run has dispatched.
// Why this exists (2026-10-28): tools/roles/15-register.mjs was patched (curly-apostrophe title matching) and the 15.sources
// task identity hashes that script, so a re-run mints a NEW registration task; the old one stays accepted in history.
// Use only at a worker boundary. A changed registration requires a run-local hash-bound SourceRegistrationRevision proof:
// {artifact_type:'SourceRegistrationRevision',version:'1.0.0',run_id,previous_registry_ref:{path,sha256},
//  config_ref:{path,sha256},issuer_confirmation_ref?:{path,sha256},visual_observation_ref?:{path,sha256},reason,
//  reconciliation:{status:'required',affected_section_ids:['section-id']}}.
// Proof refs are run-relative (absolute paths inside this run also work). config_ref is a separate private immutable snapshot
// of the current config. Do not pin the proof in that config: the CLI supplies it externally, avoiding a hash cycle.
// Registration accepts metadata only. Old source-dependent envelopes/compiles require explicit reconciliation and all checks.
//   node tools/belt/reregister-source.mjs --run runs/<run> --executor-id <uuid> --revision repair/source-v2.json --revision-sha256 <sha>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {loadRun, registerSource} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/controller.mjs')).href);
const {acceptedRuntimeRefs} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/dispatch.mjs')).href);
const {openLedger} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/ledger.mjs')).href);
const {acquireExecutorLock} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/executor-lock.mjs')).href);
const {inside} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/atomic-file.mjs')).href);

export async function reregisterSourceRun({projectRoot=ROOT,run,executorId,revisionProofRef=null}={}) {
  if(!run||!executorId)throw new Error('--run and --executor-id are required.');
  const loaded = loadRun({projectRoot, runConfigPath: path.join(run,'run-config.json')});
  const lockHandle = acquireExecutorLock({runDir: loaded.runDir, runId: loaded.config.run_id, executorId});
  let ledger, fence;
  try {
  ledger = openLedger({dbPath: inside(loaded.runDir, loaded.config.execution?.ledger?.path || 'ledger/run.sqlite'), lockHandle});
  const previous = ledger.getRun(loaded.config.run_id);
  if (!previous) throw new Error('run has no ledger binding; use plan --init-ledger --register-sources instead');
  fence = ledger.claimRun({runId: loaded.config.run_id, bindingSha256: previous.binding_sha256, mode: previous.mode, budget: previous.budget_json});
  const refs=()=>acceptedRuntimeRefs(ledger.snapshot(loaded.config.run_id),projectRoot,loaded.runDir);
  const beforeRef=refs().find(r=>r.kind==='source_registry');
  const before=beforeRef?JSON.parse(fs.readFileSync(beforeRef.path,'utf8')).sources[0]:null;
  const result = await registerSource({projectRoot, loaded, ledger, fence, lockHandle, revisionProofRef});
  const accepted=result.native_acceptance?.accepted===true;
  // The last accepted historical registry can survive a blocked new revision. It is not that revision's success.
  const afterRefs=accepted?refs():[],registryRef=afterRefs.find(r=>r.kind==='source_registry'),livenessRef=afterRefs.find(r=>r.kind==='source_liveness');
  const registry=registryRef?JSON.parse(fs.readFileSync(registryRef.path,'utf8')):null,after=registry?.sources[0];
  const liveness=livenessRef?JSON.parse(fs.readFileSync(livenessRef.path,'utf8')):null;
  return {run: loaded.config.run_id, registration: result.status ?? result, reused: result.reused ?? null,
    assessment_status:result.assessment_status??null,registration_metadata_status:result.registration_metadata_status??null,
    native_acceptance:result.native_acceptance??null,verification_debt:result.verification_debt??[],receipt_ref:result.receipt_ref??null,
    is_official: {before: before?.is_official??null, after: after?.is_official??null}, trust_tier: {before: before?.trust_tier??null, after: after?.trust_tier??null},
    source_registry_ref:registryRef??null,previous_source_registry_ref:beforeRef??null,page_map_ref:afterRefs.find(r=>r.kind==='page_map')??null,
    liveness:liveness?.status??'VERIFICATION_DEBT',edition:liveness?.edition??null,source_revision:registry?.source_revision??null,
    factual_acceptance:false,model_calls:0};
  } finally { if (fence && ledger) ledger.releaseRun(fence); ledger?.close(); lockHandle.release(); }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2),supported=new Set(['--run','--executor-id','--revision','--revision-sha256']),options={};
    for(let i=0;i<args.length;i+=2){if(!supported.has(args[i])||!args[i+1]||args[i+1].startsWith('--')||Object.hasOwn(options,args[i]))throw new Error('Unknown, duplicate or missing source registration argument: '+args[i]);options[args[i]]=args[i+1];}
    if(!!options['--revision']!==!!options['--revision-sha256'])throw new Error('--revision and --revision-sha256 must be supplied together.');
    const result=await reregisterSourceRun({run:options['--run'],executorId:options['--executor-id'],revisionProofRef:options['--revision']?{path:options['--revision'],sha256:options['--revision-sha256']}:null});
    console.log(JSON.stringify(result,null,1));
    if(result.native_acceptance?.accepted!==true)process.exitCode=1;
  }catch(error){console.error(JSON.stringify({status:'BLOCKED',message:error.message,model_calls:0}));process.exitCode=2;}
}
