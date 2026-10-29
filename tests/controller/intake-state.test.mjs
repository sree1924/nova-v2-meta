import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {PROJECT_ROOT,pinLearningLoop} from '../../tools/belt/controller.mjs';
import {buildIntakePlan,loadIntakePlan,executeIntakePlan,intakeCompletion} from '../../tools/belt/intake-state.mjs';
import {sha256,jsonBytes,verifyRef} from '../../tools/belt/atomic-file.mjs';
import {readNativeSnapshot} from '../../tools/belt/dispatch.mjs';

const NOW='2026-10-28T19:00:00Z';
const pin=(path,bytes)=>({path,sha256:sha256(bytes)});
const doc=(plan,name)=>JSON.parse(plan.files.find(f=>f.path===name).bytes.toString('utf8'));
function inputs(){
  // Synthetic source only. This plan test performs no real issuer visit or source registration.
  const pdfBytes=Buffer.from('%PDF-1.4\nsynthetic intake bytes\n%%EOF\n');
  const authorityBytes=jsonBytes({run_id:'synthetic-intake',founder_words:'SYNTHETIC fixture authority for this run only'});
  const spec={run_id:'synthetic-intake',state:'Texas',jurisdiction:'US-TX',issuing_authority:'Synthetic Texas Licensing Body',
    license_or_permit_class:'Class C',handbook_title:'Synthetic Texas Driver Handbook',handbook_edition:'Edition 2026',handbook_url:'https://agency.example.gov/handbook.pdf',handbook_pdf:'sources/fixture.pdf',
    retrieved_at_utc:NOW,current_authority_ref:pin('coordination/current-authority.json',authorityBytes),authoring_mode:'sol_subscription',
    actual_author:{actor_id:'sol-fixture-author',provider_family:'openai',model:'gpt-6.1-sol'},
    state_selection:{status:'confirmed',confirmed_by:'founder',jurisdiction:'US-TX',evidence:'SYNTHETIC current fixture selection',recorded_by:'sol-fixture-author',confirmed_at_utc:NOW},
    issuer_page:{url:'https://agency.example.gov/manuals',domains:['agency.example.gov'],observed_at_utc:NOW,excerpt:'SYNTHETIC visible link https://agency.example.gov/handbook.pdf',observed_statements:['SYNTHETIC link observation']},
    visual_observation:{observed_by:{actor_id:'sol-fixture-observer',provider_family:'openai',model:'gpt-6.1-sol'},method_kind:'local_pdf_text_observation',
      renderer:'Synthetic test text fixture',physical_page:1,printed_page:null,observed_at_utc:NOW,observations:[{kind:'title',value:'Synthetic Texas Driver Handbook',verbatim:'Synthetic Texas Driver Handbook'}]},
    passing_score:{pdf_page:2,printed_page:null,value:70,verbatim:'SYNTHETIC score 70 percent'},exam_facts:{question_count:30,passing_percent:70,time_limit:null,source_pages:[2]},section_page_ranges:{'sec01-synthetic':[1,2]}};
  const templateConfig={schema_version:'synthetic.1',run_id:'old-utah',working_product_id:'rdmv-ut-class-d',status:'OLD',
    execution_note:'Old Utah founder quote must not extend',orchestration_owner:'old Claude runner',founder_decision:'Old Utah authority',
    scope:{jurisdiction:'US-UT',audience_age_band:'Utah age claims',exam_facts:{old:{value:'Utah'}},rights_posture:'Utah historical assertion',language:'en',application_path:'first_time_never_licensed',coverage_kind:'full_knowledge_test'},
    producer:{provider:'meta',model:'muse-spark-1.3',pricing_ref:pin('contracts/meta-pricing.json',Buffer.from('synthetic pricing')),billing_mode:'credits',billing_mode_detail:{mode:'meta_free_credits',credit_balance_observed_usd:123}},
    limits:{max_total_usd:60,per_provider_usd_caps:{meta:60,openai:0},per_role_usd_caps:{'15':0,'02':40}},audit_pool:{required_providers:['openai','anthropic']},baseline:{kind:'none_new_product'},
    execution:{standing_authority_ref:pin('runs/old-utah/authority.json',Buffer.from('old')),live_window:{armed_by:'old Utah founder quote'},ledger:{path:'ledger/run.sqlite'},retry_nonces:{old:10}}};
  const templateLoop={minted_by:{model:'claude-fable-5-1',lane:'tool_assisted',pass:'old',authored_by:'Old Utah founder quote'},probe:'rdmv-ut-class-d',schema_version:'1.0.0',loop_version:'ut-pilot-0.4.0',
    source_refs:{knowledge_graph:'old-utah-graph'},user_cycle:['session','flashcards','module_quiz'],
    teach_mode:{audio_autoplay_on_advance:false,first_card_waits_for_start:true,manual_replay:false,mark_for_review:true,pilot_note:'Old Utah prose'},
    module_quiz:{placement:'immediately_after_module_study',items_per_card:1,instant_feedback_with_rationale:true,audio:'none'},
    missed_pool:{scope:'global',persistent_across_sessions:true,sources:['quiz_miss']},review_missed:{fixed_rule:'Synthetic policy',session_attempt_cap:2,on_cap:'reenter_via_interval_ladder'},
    mastery_gate:{quiz_threshold_pct:70,missed_items_must_be_cleared:true,blocks_navigation:false},spaced_reentry:{interval_ladder_days:[1,3],ease_default:2.5,review_due_surfaced_on_home:true},
    readiness:{bands:['studying','ready','review'],study_pct_threshold:80,quiz_accuracy_threshold:80,mock_unlock_rule:'Synthetic product policy'},
    audio_placement:{teach_mode:'autoplay',review_missed:'manual_replay',quizzes:'none',mocks:'none'},
    audio_teacher_loop:{provider:'openai_audio_api',generation_mode:'pre_generated_batch',surfaces:['session','flashcards','review_missed'],silent_surfaces:['module_quiz','mock_exam'],runtime_live_tts:false,pilot_status:'DEFERRED_TEXT_FIRST'},
    modules:[{module_id:'m.sec09-old-utah',order:1,card_count:0,quiz_ref:'pending:06.exam_bank'}]};
  return {spec,templateConfig,templateLoop,pdfBytes,authorityBytes,executorId:'actual-fixture-executor',now:NOW,templateRef:'runs/old-utah'};
}
function build(f){const specBytes=jsonBytes(f.spec);return buildIntakePlan({...f,specBytes,specRef:pin('coordination/intake.spec.json',specBytes),templateConfigBytes:jsonBytes(f.templateConfig),templateLoopBytes:jsonBytes(f.templateLoop)});}

test('pure plan records actual Sol observer/author and preserves Meta transport, pricing, caps and credits',()=>{
  const f=inputs(),plan=build(f),visual=doc(plan,'receipts/ROLE15-VISUAL-OBSERVATION.json');
  assert.equal(visual.observed_by.actor_id,'sol-fixture-observer');assert.equal(visual.observed_by.provider_family,'openai');assert.equal(visual.observed_by.model,'gpt-6.1-sol');
  assert.deepEqual(plan.config.producer,f.templateConfig.producer);assert.deepEqual(plan.config.limits,f.templateConfig.limits);
  assert.equal(plan.config.authoring.actual_author.provider_family,'openai');assert.equal(plan.config.authoring.mode,'sol_subscription');
  assert.equal(plan.config.execution.executor_id,'actual-fixture-executor');assert.equal(plan.config.execution.standing_authority_ref,undefined);assert.equal(plan.config.execution.live_window,undefined);
  assert.equal(plan.learning_loop.probe,plan.config.working_product_id);assert.equal(plan.learning_loop.probe,'rdmv-tx-c');
  assert.deepEqual(plan.learning_loop.minted_by.template_ref,plan.config.seeded_from.learning_loop_ref,'template ancestry remains exact');
  assert.equal(plan.config.scope.audience_age_band,undefined);assert.equal(plan.config.scope.rights_posture,undefined);assert.equal(plan.config.founder_decision,undefined);
  const active={...plan.config};delete active.seeded_from;
  assert.doesNotMatch(JSON.stringify(active),/utah|old Claude|old founder quote|rdmv-ut-class-d/i);
  assert.equal(doc(plan,'approvals/INTAKE-AUTHORITY.json').run_id,'synthetic-intake');
});

test('unknown actual observer model stays unknown; contradictory identity, missing executor and inherited authority fail',()=>{
  const f=inputs();delete f.spec.visual_observation.observed_by.model;
  const observer=doc(build(f),'receipts/ROLE15-VISUAL-OBSERVATION.json').observed_by;
  assert.equal(observer.model,null);assert.equal(observer.model_id_availability,'not_exposed');
  f.spec.visual_observation.observed_by.model='claude-fable-5-1';assert.throws(()=>build(f),/contradictory provider\/model/);
  const noExecutor=inputs();delete noExecutor.executorId;assert.throws(()=>build(noExecutor),/executor id/);
  const old=inputs();old.authorityBytes=jsonBytes({run_id:'old-utah'});old.spec.current_authority_ref=pin('coordination/old.json',old.authorityBytes);assert.throws(()=>build(old),/another run/);
  const noAuthority=inputs();delete noAuthority.spec.current_authority_ref;assert.throws(()=>build(noAuthority),/current authority/);
});

test('new intake preserves old source ancestry while selecting and pinning the current project adapter binding',()=>{
  const f=inputs(),oldReceipt=Buffer.from('synthetic historical Claude receipt'),currentReceipt=Buffer.from('synthetic truthful current Sol receipt');
  f.templateConfig.execution.adapter_validation_receipts_ref=pin('coordination/old-claude.json',oldReceipt);
  f.projectTemplateBytes=jsonBytes({execution:{adapter_validation_receipts_ref:pin('coordination/current-sol.json',currentReceipt)}});
  f.projectTemplateRef=pin('RDMV-RUN-CONFIG.template.json',f.projectTemplateBytes);f.adapterValidationReceiptBytes=currentReceipt;
  const plan=build(f);
  assert.equal(plan.config.seeded_from.run_id,'old-utah');assert.equal(plan.config.seeded_from.config_ref.path,'runs/old-utah/run-config.json');
  assert.deepEqual(plan.config.execution.adapter_validation_receipts_ref,pin('coordination/current-sol.json',currentReceipt));
  assert.ok(plan.input_refs.some(ref=>ref.path==='RDMV-RUN-CONFIG.template.json'&&ref.sha256===sha256(f.projectTemplateBytes)));
  assert.ok(plan.input_refs.some(ref=>ref.path==='coordination/current-sol.json'&&ref.sha256===sha256(currentReceipt)));
  const explicitReceipt=Buffer.from('synthetic explicit receipt');f.spec.adapter_validation_receipts_ref=pin('coordination/explicit.json',explicitReceipt);f.adapterValidationReceiptBytes=explicitReceipt;
  assert.deepEqual(build(f).config.execution.adapter_validation_receipts_ref,f.spec.adapter_validation_receipts_ref,'explicit spec binding takes precedence');
  f.adapterValidationReceiptBytes=oldReceipt;assert.throws(()=>build(f),/adapter validation receipt reference\/hash/);
});

test('official web assembly keeps exact PDF/provenance bytes with real collection locator and debt',()=>{
  const f=inputs();f.provenanceBytes=jsonBytes({kind:'original assembly provenance',chapters:[{chapter:1,url:'https://agency.example.gov/manual/chapter-1',original_title:'SYNTHETIC chapter'}]});
  f.spec.source_origin={kind:'official_web_assembly',collection_url:'https://agency.example.gov/manual',local_pdf_sha256:sha256(f.pdfBytes),provenance_ref:pin('coordination/chapter-provenance.json',f.provenanceBytes)};
  delete f.spec.handbook_url;delete f.spec.issuer_page;delete f.spec.retrieved_at_utc;delete f.spec.passing_score;delete f.spec.handbook_edition;
  const plan=build(f),scope=plan.config.scope,origin=scope.source_origin;
  assert.deepEqual(plan.files.find(a=>a.path==='sources/private/official-web-assembly.pdf').bytes,f.pdfBytes);
  assert.deepEqual(plan.files.find(a=>a.path==='sources/private/original-chapter-provenance.json').bytes,f.provenanceBytes);
  assert.equal(origin.provenance_ref.sha256,sha256(f.provenanceBytes));assert.equal(scope.handbook_sha256,sha256(f.pdfBytes));
  assert.equal(scope.handbook_url,'https://agency.example.gov/manual');assert.equal(scope.handbook_retrieved_at_utc,null);assert.equal(origin.edition_status,'unverified');
  assert.equal(origin.exact_issuer_pdf_download_claim,false);assert.equal(origin.issuer_current_edition_confirmed,false);
  assert.equal(plan.files.some(a=>a.path==='receipts/issuer-current-edition-confirmation.json'),false);
  assert.equal(plan.files.some(a=>a.path==='receipts/15-passing-score-observation.json'),false);
  assert.ok(Object.values(scope.exam_facts).every(v=>v.status==='unknown'&&v.value===null));
  f.spec.source_origin.local_pdf_sha256='0'.repeat(64);assert.throws(()=>build(f),/exact unchanged PDF/);
});

test('completion requires explicit native structural acceptance plus a successful policy pin',()=>{
  const ref={path:'synthetic/receipt.json',sha256:'1'.repeat(64)},debt=[{code:'edition_unconfirmed'}],native={status:'ACCEPTED',accepted:true,task_id:'task',attempt_id:'attempt',source_registry_ref:ref,validation_receipt_ref:ref,acceptance_receipt_ref:ref};
  const source={status:'HOLD',assessment_status:'HOLD',native_acceptance:native,verification_debt:debt},policy={status:'PASS',artifact:ref};
  assert.deepEqual(intakeCompletion(source,policy),{status:'COMPLETE',source_registered:true,learning_loop_pinned:true,assessment_status:'HOLD',verification_debt:debt});
  assert.equal(intakeCompletion({status:'PASS'},policy).status,'BLOCKED');
  assert.equal(intakeCompletion({...source,native_acceptance:{...native,status:'BLOCKED',accepted:false}},policy).status,'BLOCKED');
  assert.equal(intakeCompletion(source,{status:'HOLD',artifact:ref}).status,'BLOCKED');assert.equal(intakeCompletion(source,null).status,'BLOCKED');
});

function disposable(t){
  const tempRoot=path.join(PROJECT_ROOT,'tests/.tmp');fs.mkdirSync(tempRoot,{recursive:true});
  const root=fs.mkdtempSync(path.join(tempRoot,'nova-intake-')),projectRoot=path.join(root,'project'),f=inputs();
  t.after(()=>{const target=path.resolve(root);if(path.dirname(target)!==path.resolve(tempRoot)||!path.basename(target).startsWith('nova-intake-'))throw Error('Unsafe cleanup path');fs.rmSync(target,{recursive:true,force:true});});
  const write=(rel,bytes)=>{const file=path.join(projectRoot,rel);fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);};
  write(f.templateRef+'/run-config.json',jsonBytes(f.templateConfig));write(f.templateRef+'/19-learning-loop.json',jsonBytes(f.templateLoop));
  write(f.spec.handbook_pdf,f.pdfBytes);write(f.spec.current_authority_ref.path,f.authorityBytes);write('coordination/intake.spec.json',jsonBytes(f.spec));
  // Loader schema validation remains real, against the existing parent policy schema in this disposable project.
  fs.mkdirSync(path.join(root,'schemas'),{recursive:true});fs.copyFileSync(path.join(PROJECT_ROOT,'../schemas/learning-loop.schema.json'),path.join(root,'schemas/learning-loop.schema.json'));
  return {...f,root,projectRoot,from:f.templateRef,write,specPath:'coordination/intake.spec.json'};
}

test('invalid spec/link/identity/path creates no partial run and CLI import does not execute',async t=>{
  const f=disposable(t),runDir=path.join(f.projectRoot,'runs',f.spec.run_id);
  f.spec.issuer_page.excerpt='SYNTHETIC missing exact link';f.write(f.specPath,jsonBytes(f.spec));
  await assert.rejects(loadIntakePlan(f),/exact handbook_url/);assert.equal(fs.existsSync(runDir),false);
  f.spec.issuer_page.excerpt=f.spec.handbook_url;f.spec.actual_author.model='claude-fable-5-1';f.write(f.specPath,jsonBytes(f.spec));
  await assert.rejects(loadIntakePlan(f),/contradictory provider\/model/);assert.equal(fs.existsSync(runDir),false);
  delete f.spec.actual_author.model;f.spec.run_id='../escaped';f.write(f.specPath,jsonBytes(f.spec));
  await assert.rejects(loadIntakePlan(f),/escapes owned root/);assert.equal(fs.existsSync(runDir),false);
  const before=fs.readdirSync(path.join(f.projectRoot,'runs'));
  const cli=spawnSync(process.execPath,[path.join(PROJECT_ROOT,'tools/belt/intake-state.mjs'),'--spec',path.join(f.projectRoot,f.specPath)],{encoding:'utf8'});
  assert.equal(cli.status,2);assert.match(cli.stderr,/explicit --executor-id/);assert.deepEqual(fs.readdirSync(path.join(f.projectRoot,'runs')),before);
});

test('read-only load validates policy before writes and rechecks exact inputs at the write boundary',async t=>{
  const f=disposable(t),runDir=path.join(f.projectRoot,'runs',f.spec.run_id),plan=await loadIntakePlan(f);
  assert.equal(fs.existsSync(runDir),false);assert.equal(plan.config.working_product_id,'rdmv-tx-c');
  assert.deepEqual(plan.learning_loop.modules,[{module_id:'m.sec01-synthetic',order:1,card_count:0,quiz_ref:'pending:06.exam_bank'}]);
  f.write(f.spec.handbook_pdf,Buffer.from('%PDF-changed source'));
  await assert.rejects(executeIntakePlan(plan,{controller:{runController(){throw Error('Native must not be called');}}}),/PDF changed/);
  assert.equal(fs.existsSync(runDir),false);
  f.write(f.spec.handbook_pdf,f.pdfBytes);f.templateLoop.user_cycle=[];f.write(f.templateRef+'/19-learning-loop.json',jsonBytes(f.templateLoop));
  await assert.rejects(loadIntakePlan(f),/learning loop fails schema/);assert.equal(fs.existsSync(runDir),false);
});

test('write boundary consumes structural result rather than controller success and never pins rejected source',async t=>{
  const f=disposable(t),plan=await loadIntakePlan(f);let pins=0,registrations=0;
  const result=await executeIntakePlan(plan,{controller:{
    async runController(options){registrations++;assert.equal(options.executorId,f.executorId);assert.equal(options.initLedger,true);assert.equal(options.registerSources,true);assert.equal(options.go,undefined);
      assert.equal(fs.existsSync(path.join(plan.runDir,'EXECUTOR.lock.md')),false,'intake released its own write lock before native controller ownership');
      return {status:'DRY_RUN_COMPLETE',source_registration:{status:'HOLD',assessment_status:'HOLD',native_acceptance:{status:'BLOCKED',accepted:false},verification_debt:[{code:'synthetic_debt'}]}};},
    async pinLearningLoop(){pins++;throw Error('A rejected source cannot pin policy');}
  }});
  assert.equal(result.status,'BLOCKED');assert.equal(result.source_registered,false);assert.equal(result.learning_loop_pinned,false);assert.equal(result.assessment_status,'HOLD');
  assert.equal(registrations,1);assert.equal(pins,0);assert.equal(result.model_calls,0);assert.equal(fs.existsSync(path.join(plan.runDir,'EXECUTOR.lock.md')),false);
});

test('native policy pin carries verified actual authority and never invents dated founder execution permission',async t=>{
  for(const includeAuthority of [true,false]){
    const f=disposable(t),plan=await loadIntakePlan(f),runDir=plan.runDir;
    for(const file of plan.files){const target=path.join(runDir,file.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,file.bytes);}
    if(!includeAuthority){delete plan.config.execution.current_intake_authority_ref;f.write('runs/'+f.spec.run_id+'/run-config.json',jsonBytes(plan.config));}
    const contractBytes=jsonBytes({fixture:'Synthetic role 19 contract'});f.write('contracts/role19.json',contractBytes);
    f.write('contracts/bot-contract-bindings.json',jsonBytes({roles:[{role_id:'19',contract:{...pin('contracts/role19.json',contractBytes),status:'pinned_local'}}]}));
    const result=await pinLearningLoop({projectRoot:f.projectRoot,runConfigPath:plan.run_config_ref.path,executorId:f.executorId});
    assert.equal(result.status,'PASS');
    const snapshot=readNativeSnapshot(runDir,plan.config),accepted=snapshot.artifacts.find(a=>a.status==='accepted'&&a.kind==='learning_loop');
    const receipt=JSON.parse(fs.readFileSync(verifyRef(accepted.acceptance_ref_json,runDir),'utf8'));
    assert.equal(receipt.execution_authorized,false);assert.doesNotMatch(receipt.authority,/2026-10-27|founder full-run/i);
    assert.equal(receipt.authority_status,includeAuthority?'PINNED_REFERENCE_ONLY_NOT_EXECUTION_GO':'UNKNOWN_POLICY_PIN_ONLY');
    assert.equal(receipt.authority_refs.current_intake_authority_ref?.sha256??null,includeAuthority?plan.config.execution.current_intake_authority_ref.sha256:null);
    assert.equal(receipt.authority_refs.standing_authority_ref,null);assert.equal(snapshot.model_calls.length,0);assert.equal(snapshot.reservations.length,0);
  }
});
