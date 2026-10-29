#!/usr/bin/env node
// Validate every intake input before creating a run. --executor-id is always explicit.
// --plan-only performs no writes. Completion requires native structural source acceptance
// and a policy pin; HOLD assessment debt remains visible and does not imply rejection.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {inside,sha256,verifyRef,writeImmutable} from './atomic-file.mjs';
import {acquireExecutorLock} from './executor-lock.mjs';
import {buildIntakePlan} from './intake-plan.mjs';
export {buildIntakePlan} from './intake-plan.mjs';

const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=file=>fs.readFileSync(file);
const json=bytes=>JSON.parse(bytes.toString('utf8'));
const slash=value=>value.replaceAll('\\','/');

/** Read-only filesystem boundary. Referenced paths/hashes and policy schema precede all run writes. */
export async function loadIntakePlan({projectRoot=ROOT,specPath,from='runs/2026-10-26-rdmv-ut-class-d',executorId,now=new Date().toISOString()}={}){
  if(!specPath||!executorId)throw new Error('--spec and explicit --executor-id are required');
  const specFile=inside(projectRoot,specPath),specBytes=read(specFile),spec=json(specBytes);
  const templateDir=inside(path.join(projectRoot,'runs'),inside(projectRoot,from));
  const runDir=inside(path.join(projectRoot,'runs'),String(spec.run_id??''));
  if(fs.existsSync(runDir))throw new Error('Target run already exists; refusing partial intake or overwrite');
  const refBytes=ref=>{
    if(!ref?.path||!/^[a-f0-9]{64}$/.test(ref.sha256??''))throw new Error('Intake evidence needs an explicit path and exact hash');
    return read(verifyRef({...ref,path:path.resolve(projectRoot,ref.path)},path.dirname(projectRoot)));
  };
  const templateConfigBytes=read(path.join(templateDir,'run-config.json'));
  const projectTemplateFile=inside(projectRoot,'RDMV-RUN-CONFIG.template.json');
  const projectTemplateBytes=fs.existsSync(projectTemplateFile)?read(projectTemplateFile):null;
  const projectTemplateRef=projectTemplateBytes?{path:'RDMV-RUN-CONFIG.template.json',sha256:sha256(projectTemplateBytes)}:null;
  const adapterRef=spec.adapter_validation_receipts_ref??(projectTemplateBytes?json(projectTemplateBytes).execution?.adapter_validation_receipts_ref:null)??json(templateConfigBytes).execution?.adapter_validation_receipts_ref??null;
  const plan=buildIntakePlan({specBytes,specRef:{path:slash(path.relative(projectRoot,specFile)),sha256:sha256(specBytes)},
    templateConfigBytes,templateLoopBytes:read(path.join(templateDir,'19-learning-loop.json')),projectTemplateBytes,projectTemplateRef,
    adapterValidationReceiptBytes:adapterRef?read(verifyRef(adapterRef,projectRoot)):null,
    templateRef:slash(path.relative(projectRoot,templateDir)),pdfBytes:read(path.resolve(projectRoot,spec.handbook_pdf)),
    authorityBytes:refBytes(spec.current_authority_ref),standingAuthorityBytes:spec.standing_authority_ref?refBytes(spec.standing_authority_ref):null,
    provenanceBytes:spec.source_origin?.kind==='official_web_assembly'?refBytes(spec.source_origin.provenance_ref):null,executorId,now});
  for(const file of plan.files)inside(projectRoot,path.join('runs',plan.run_id,file.path));
  const {default:Ajv}=await import('ajv/dist/2020.js'),{default:addFormats}=await import('ajv-formats');
  const ajv=new Ajv({strict:false,allErrors:true});addFormats(ajv);
  const validate=ajv.compile(json(read(path.join(path.dirname(projectRoot),'schemas/learning-loop.schema.json'))));
  if(!validate(plan.learning_loop))throw new Error('Intake learning loop fails schema: '+JSON.stringify(validate.errors));
  return {...plan,projectRoot:path.resolve(projectRoot),runDir};
}

export function intakeCompletion(registration,policyPin){
  const accepted=registration?.native_acceptance;
  const sourceAccepted=accepted?.accepted===true&&accepted.status==='ACCEPTED'&&!!accepted.task_id&&!!accepted.attempt_id&&
    [accepted.source_registry_ref,accepted.validation_receipt_ref,accepted.acceptance_receipt_ref].every(ref=>ref?.path&&/^[a-f0-9]{64}$/.test(ref.sha256??''));
  const policyPinned=policyPin?.status==='PASS'&&!!policyPin.artifact?.path&&/^[a-f0-9]{64}$/.test(policyPin.artifact?.sha256??'');
  return {status:sourceAccepted&&policyPinned?'COMPLETE':'BLOCKED',source_registered:!!sourceAccepted,learning_loop_pinned:!!policyPinned,
    assessment_status:registration?.assessment_status??null,verification_debt:registration?.verification_debt??[]};
}

export async function executeIntakePlan(plan,{controller=null}={}){
  for(const ref of plan.input_refs){
    if(ref.kind==='explicit_local_pdf'){
      if(sha256(read(path.resolve(plan.projectRoot,ref.path)))!==ref.sha256)throw new Error('Explicit handbook PDF changed since planning');
    }else if(ref.kind==='workspace_evidence')verifyRef({...ref,path:path.resolve(plan.projectRoot,ref.path)},path.dirname(plan.projectRoot));
    else verifyRef(ref,plan.projectRoot);
  }
  if(fs.existsSync(plan.runDir))throw new Error('Target run already exists; refusing partial intake or overwrite');
  const lock=acquireExecutorLock({runDir:plan.runDir,runId:plan.run_id,executorId:plan.executor_id});
  try{
    for(const file of plan.files)writeImmutable(plan.runDir,file.path,file.bytes,{lockHandle:lock,bytes:true});
  }finally{lock.release();}
  // The controller acquires and releases its own lock, including when handed an existing lock.
  // End the intake write transaction before that separate native ownership boundary.
  const native=controller??await import('./controller.mjs');
  const registration=(await native.runController({projectRoot:plan.projectRoot,runConfigPath:plan.run_config_ref.path,executorId:plan.executor_id,
    initLedger:true,registerSources:true})).source_registration;
  const policy=registration?.native_acceptance?.accepted===true?await native.pinLearningLoop({projectRoot:plan.projectRoot,
    runConfigPath:plan.run_config_ref.path,executorId:plan.executor_id}):null;
  return {run:plan.run_id,...intakeCompletion(registration,policy),source_registration:registration,policy_pin:policy,model_calls:0};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=process.argv.slice(2),opts={},supported=new Set(['--spec','--from','--executor-id']);let planOnly=false;
    for(let i=0;i<args.length;i++){
      if(args[i]==='--plan-only'){if(planOnly)throw new Error('Duplicate --plan-only');planOnly=true;continue;}
      const key=args[i];if(!supported.has(key)||Object.hasOwn(opts,key)||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Unknown, duplicate or missing intake argument: '+key);
      opts[key]=args[++i];
    }
    const plan=await loadIntakePlan({specPath:opts['--spec'],from:opts['--from'],executorId:opts['--executor-id']});
    const result=planOnly?{status:'VALIDATED_PLAN',run:plan.run_id,writes_performed:0,files:plan.files.map(f=>({path:f.path,sha256:sha256(f.bytes)})),model_calls:0}:await executeIntakePlan(plan);
    console.log(JSON.stringify(result,null,2));if(!planOnly&&result.status!=='COMPLETE')process.exitCode=1;
  }catch(error){console.error(JSON.stringify({status:'BLOCKED',message:error.message,model_calls:0}));process.exitCode=2;}
}
