// Explicit one-time local reconciliation/registration. No provider entry point.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {prepareLegacyMigration} from './reconcile-legacy.mjs';
import {loadRun,runController,PROJECT_ROOT} from './controller.mjs';
import {buildRegistration} from '../roles/15-register.mjs';
import {inside,sha256,writeImmutable} from './atomic-file.mjs';

const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const pin=p=>({path:p,sha256:sha256(fs.readFileSync(p)),bytes:fs.statSync(p).size});
const relative=p=>path.relative(PROJECT_ROOT,p).replaceAll('\\','/');
function replaceOwnedJson(runDir,file,value,lock){
  lock.assertHeld();inside(runDir,file);
  const bytes=Buffer.from(JSON.stringify(value,null,2)+'\n'),tmp=file+'.'+process.pid+'.tmp';
  const fd=fs.openSync(tmp,'wx');try{fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
  lock.assertHeld();fs.renameSync(tmp,file);return pin(file);
}

export async function finalizeDryBuild({runConfigPath,executorId,decisionRef,issuerCaptureRef,pythonPath}){
  const loaded=loadRun({projectRoot:PROJECT_ROOT,runConfigPath});
  if(loaded.config.execution_enabled!==false||loaded.config.limits.spend_mode!=='dry_run')throw Error('Dry-only config required.');
  const captureFile=inside(PROJECT_ROOT,issuerCaptureRef.path),captureBytes=fs.readFileSync(captureFile);
  if(sha256(captureBytes)!==issuerCaptureRef.sha256)throw Error('Issuer capture changed.');
  const capture=JSON.parse(captureBytes);
  if(capture.url!=='https://dld.utah.gov/learner-permit/'||!capture.handbook_links.some(l=>l.href===loaded.config.scope.handbook_url))throw Error('Captured issuer link does not match intake.');
  const handover=await prepareLegacyMigration({projectRoot:PROJECT_ROOT,runDir:loaded.runDir,runId:loaded.config.run_id,executorId,decisionRef,pythonPath});
  const lock=handover.lockHandle;
  let controllerOwnsLock=false;
  try{
    const oldConfigBytes=fs.readFileSync(loaded.configPath);
    writeImmutable(loaded.runDir,path.join(handover.quarantineRoot,'run-config-before-builder.json'),oldConfigBytes,{lockHandle:lock,bytes:true});
    const oldIssuerFile=inside(loaded.runDir,'receipts/issuer-current-edition-confirmation.json');
    const oldIssuer=read(oldIssuerFile),oldIssuerBytes=fs.readFileSync(oldIssuerFile);
    writeImmutable(loaded.runDir,path.join(handover.quarantineRoot,'issuer-confirmation-original.json'),oldIssuerBytes,{lockHandle:lock,bytes:true});
    const captured=writeImmutable(loaded.runDir,'receipts/issuer-learner-permit-dom-'+issuerCaptureRef.sha256+'.json',captureBytes,{lockHandle:lock,bytes:true});
    const now=new Date().toISOString();
    const issuer={...oldIssuer,observed_at_utc:capture.observed_at_utc??now,
      observation_method:'Ordinary browser rendered DOM excerpt and exact visible handbook href; saved snapshot bytes are JSON, not the HTTP response body.',
      page_sha256:captured.sha256,page_bytes:captured.bytes,page_snapshot_ref:{path:relative(captured.path),sha256:captured.sha256},
      snapshot_kind:'rendered_dom_excerpt',hash_status:'HASHED_RENDERED_DOM_SNAPSHOT',
      effective_date_disposition:{value:null,status:'unknown_not_stated',kind:'effective_date_not_applicable',
        accepted_by:'founder direct S4 order in builder chat, 2026-10-27',
        evidence:'Current issuer page links the pinned handbook URL; no single handbook effective date is stated. Contextual law dates remain separate.'},
      recorded_by:{actor:'Sol builder / browser observer',session_id:executorId,role:'builder evidence registration'},
      previous_observation_ref:{path:relative(path.join(handover.quarantineRoot,'issuer-confirmation-original.json')),sha256:sha256(oldIssuerBytes)}};
    replaceOwnedJson(loaded.runDir,oldIssuerFile,issuer,lock);
    const observed=await buildRegistration({projectRoot:PROJECT_ROOT,runConfigPath:loaded.configPath});
    const sourceText=observed.privateArtifacts.find(a=>a.encoding==='utf8').contents;
    const page33=sourceText.match(/=== PHYSICAL PDF PAGE 33; PRINTED [^\n]+ ===\n([\s\S]*?)(?=\n=== PHYSICAL PDF PAGE|$)/)?.[1];
    const normalized=page33?.replace(/\s+/g,' ');
    const scoreQuote=normalized?.match(/you must pass with a score of 80% or better/i)?.[0];
    if(!scoreQuote||!/WRITTEN KNOWLEDGE TEST/i.test(normalized))throw Error('Passing-score claim is not on the exact expected handbook page.');
    const mappedPage=observed.pageMap.pages.find(p=>p.pdf_page===33);
    const score=writeImmutable(loaded.runDir,'receipts/15-passing-score-observation.json',{artifact_type:'LocalSourceFactObservation',run_id:loaded.config.run_id,source_ref:observed.source.source_ref,snapshot_sha256:observed.source.sha256,source_page:mappedPage.page_id,pdf_page:33,printed_page:mappedPage.printed_page,value:80,verbatim:scoreQuote,method:'Exact local PDF-page text match; no model or parametric fact source',factual_audit:'pending07/08'},{lockHandle:lock});
    const config=read(loaded.configPath);
    config.execution_enabled=false;config.limits.spend_mode='dry_run';
    config.orchestration_owner='Builder01a1764d-cf44-7fc1-a31f-bf0be7852006; runnerClaude2bdcad95-d4cc-467e-a88d-be4a6260cf03; Muse preview. No content calls without stage-bound founder go.';
    config.execution.lock_note='Native executor-lock.mjs; one holder during each local/dispatch operation; explicit builder handover recorded.';
    config.scope.handbook_edition='Utah Driver Handbook '+observed.registry.sources[0].edition;
    config.scope.exam_facts.passing_percent={value:80,status:'verified',source_page:mappedPage.page_id,source_ref:observed.source.source_ref,
      source_snapshot_sha256:observed.source.sha256,liveness_receipt_ref:relative(path.join(loaded.runDir,'15-source-liveness.json')),
      source_observation_ref:{path:relative(score.path),sha256:score.sha256},previous:config.scope.exam_facts.passing_percent};
    config.producer.pricing_ref={path:'contracts/meta-pricing-snapshot.v0.4.0.json',sha256:pin(path.join(PROJECT_ROOT,'contracts/meta-pricing-snapshot.v0.4.0.json')).sha256};
    config.producer.billing_mode??=null;
    replaceOwnedJson(loaded.runDir,loaded.configPath,config,lock);
    controllerOwnsLock=true;
    const result=await runController({projectRoot:PROJECT_ROOT,runConfigPath:loaded.configPath,executorId,initLedger:true,registerSources:true,heldLock:lock,legacyMigration:handover});
    return{...result,legacy_handover_receipt:handover.receiptRef,legacy_backup:handover.backupRef,legacy_snapshot:handover.snapshotRef};
  }finally{
    if(!controllerOwnsLock)lock.release();
  }
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),get=k=>args[args.indexOf(k)+1];
  try{
    if(!args.includes('--reconcile-legacy'))throw Error('Explicit --reconcile-legacy is required.');
    const decisionFile=inside(PROJECT_ROOT,'coordination/BUILDER-OWNERSHIP-2026-10-27.json'),captureFile=inside(PROJECT_ROOT,'coordination/ISSUER-RENDERED-DOM-CAPTURE-2026-10-27.json');
    const result=await finalizeDryBuild({runConfigPath:get('--run-config'),executorId:get('--executor-id'),decisionRef:pin(decisionFile),issuerCaptureRef:pin(captureFile),pythonPath:args.includes('--python')?get('--python'):'python'});
    console.log(JSON.stringify(result,null,2));
  }catch(error){console.error(JSON.stringify({status:'BLOCKED',message:error.message,model_calls:0,quarantine_root:error.quarantineRoot??null}));process.exitCode=2;}
}
