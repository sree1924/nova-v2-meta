// Pure byte-to-plan builder: no filesystem, subprocess, network, clock or provider activity.
import path from 'node:path';
import {sha256,jsonBytes} from './atomic-file.mjs';
const text=(value,label)=>{if(typeof value!=='string'||!value.trim())throw new Error('Required explicit '+label);return value;};
const date=(value,label)=>{if(typeof value!=='string'||!/^\d{4}-\d\d-\d\dT/.test(value)||!Number.isFinite(Date.parse(value)))throw new Error('Invalid '+label);return value;};
const hashRef=(ref,bytes,label)=>{if(!ref?.path||!/^[a-f0-9]{64}$/.test(ref.sha256??'')||!bytes||sha256(bytes)!==ref.sha256)throw new Error('Invalid exact '+label+' reference/hash');return {path:ref.path,sha256:ref.sha256};};
const https=(value,label)=>{const u=new URL(text(value,label));if(u.protocol!=='https:'||u.username||u.password)throw new Error('Required HTTPS '+label);return value;};
const unknown=()=>({value:null,status:'unknown',source_page:null,source_ref:null,source_snapshot_sha256:null,liveness_receipt_ref:null});
const parse=bytes=>JSON.parse(Buffer.from(bytes).toString('utf8'));
function identity(value,label){
  if(!value||typeof value!=='object')throw new Error('Required explicit '+label);
  const actor=text(value.actor_id,label+'.actor_id'),provider=text(value.provider_family,label+'.provider_family');
  const model=value.model==null||value.model==='unknown'?null:text(value.model,label+'.model');
  const expected=model&&(/^(?:gpt-|o[134](?:-|$))/i.test(model)?'openai':/^claude-/i.test(model)?'anthropic':/^muse-/i.test(model)?'meta':/^gemini-/i.test(model)?'google':null);
  if(expected&&provider!==expected)throw new Error(label+' contradictory provider/model');
  if(!model&&value.model_id_availability==='exposed')throw new Error(label+' cannot expose an unknown model');
  return {actor_id:actor,provider_family:provider,identity:value.identity??actor,model,model_id_availability:model?'exposed':'not_exposed'};
}

export function buildIntakePlan({specBytes,specRef,templateConfigBytes,templateLoopBytes,templateRef,pdfBytes,authorityBytes,
  standingAuthorityBytes=null,provenanceBytes=null,projectTemplateBytes=null,projectTemplateRef=null,adapterValidationReceiptBytes=null,executorId,now}={}){
  const spec=parse(specBytes),template=parse(templateConfigBytes),loop=parse(templateLoopBytes);
  const exactSpec=hashRef(specRef,specBytes,'spec');text(executorId,'executor id');date(now,'planning time');
  if(spec.executor_id!==undefined&&spec.executor_id!==executorId)throw new Error('Spec executor_id contradicts actual executor');
  if(!/^[A-Za-z0-9_-]+$/.test(spec.run_id??''))throw new Error('Invalid run_id');
  if(!/^US-[A-Z]{2}$/.test(spec.jurisdiction??''))throw new Error('Invalid jurisdiction');
  for(const k of ['state','issuing_authority','license_or_permit_class','handbook_title','handbook_pdf','authoring_mode'])text(spec[k],k);
  const author=identity(spec.actual_author,'actual_author'),vo=spec.visual_observation;
  const observer=identity(vo?.observed_by??(vo?{actor_id:vo.actor_id,provider_family:vo.provider_family,identity:vo.identity,model:vo.model,model_id_availability:vo.model_id_availability}:null),'visual observer');
  if(vo?.observed_by)for(const k of ['actor_id','provider_family','model'])if(vo[k]!==undefined&&vo[k]!==vo.observed_by[k])throw new Error('Contradictory visual observer '+k);
  if(!Number.isInteger(vo.physical_page)||vo.physical_page<1||!Array.isArray(vo.observations)||!vo.observations.length)throw new Error('Invalid visual_observation');
  if(vo.method_kind!==undefined&&!['local_pdf_text_observation','local_pdf_render_visual_inspection'].includes(vo.method_kind))throw new Error('Invalid visual method');
  for(const o of vo.observations){if(!['title','issuer','edition'].includes(o.kind))throw new Error('Invalid visual kind');text(o.verbatim,'visual verbatim');text(o.value,'visual value');}
  const ranges=spec.section_page_ranges;
  if(!ranges||typeof ranges!=='object'||Array.isArray(ranges)||!Object.keys(ranges).length)throw new Error('Missing section_page_ranges');
  for(const [id,pages]of Object.entries(ranges))if(!/^sec\d{2}-[a-z0-9-]+$/.test(id)||!Array.isArray(pages)||!pages.length||pages.length>30||
    pages.some(p=>!Number.isInteger(p)||p<1)||new Set(pages).size!==pages.length||pages.some((p,i)=>i&&p<=pages[i-1]))throw new Error('Invalid section page list: '+id);
  const authorityRef=hashRef(spec.current_authority_ref,authorityBytes,'current authority');
  const validateAuthority=bytes=>{const s=Buffer.from(bytes).toString('utf8');if(s.trim().startsWith('{')){const value=parse(bytes);if(value.run_id&&value.run_id!==spec.run_id)throw new Error('Current authority belongs to another run');const jurisdiction=value.jurisdiction??value.scope?.jurisdiction;if(jurisdiction&&jurisdiction!==spec.jurisdiction)throw new Error('Current authority belongs to another jurisdiction');}text(s,'authority bytes');};
  validateAuthority(authorityBytes);
  const selection=spec.state_selection;
  if(selection?.status!=='confirmed'||selection.confirmed_by!=='founder'||selection.jurisdiction!==spec.jurisdiction)throw new Error('Explicit current founder state_selection required');
  text(selection.evidence,'state_selection.evidence');text(typeof selection.recorded_by==='string'?selection.recorded_by:selection.recorded_by?.actor_id,'state_selection.recorded_by');
  if(selection.confirmed_at_utc)date(selection.confirmed_at_utc,'state selection timestamp');
  if(!Buffer.from(pdfBytes).subarray(0,5).equals(Buffer.from('%PDF-')))throw new Error('handbook_pdf is not a PDF');
  const pdfSha=sha256(pdfBytes),run='runs/'+spec.run_id,files=[];
  const add=(file,bytes)=>{files.push({path:file,bytes:Buffer.from(bytes)});return {path:run+'/'+file,sha256:sha256(bytes)};};
  const addJ=(file,value)=>add(file,jsonBytes(value));
  const sourceKind=spec.source_origin?.kind??'official_pdf';
  if(!['official_pdf','official_web_assembly'].includes(sourceKind))throw new Error('Unsupported source_origin.kind');
  const assembly=sourceKind==='official_web_assembly',handbookUrl=assembly?https(spec.source_origin.collection_url,'assembly collection_url'):https(spec.handbook_url,'handbook_url');
  if(assembly&&spec.handbook_url!==undefined&&spec.handbook_url!==handbookUrl)throw new Error('Assembly handbook_url must be real collection locator');
  const name=assembly?'official-web-assembly.pdf':(path.posix.basename(new URL(handbookUrl).pathname).replace(/[^A-Za-z0-9._-]/g,'_').replace(/\.pdf$/i,'')||'handbook')+'.pdf';
  const snapshotRel='sources/private/'+name;add(snapshotRel,pdfBytes);add('sources/private/SHA256',Buffer.from(pdfSha+'  '+name+'\n'));
  const localAuthorityRef=add('approvals/INTAKE-AUTHORITY'+(Buffer.from(authorityBytes).toString('utf8').trim().startsWith('{')?'.json':'.md'),authorityBytes);
  let standingRef=null;
  if(spec.standing_authority_ref){hashRef(spec.standing_authority_ref,standingAuthorityBytes,'standing authority');validateAuthority(standingAuthorityBytes);standingRef=add('approvals/STANDING-AUTHORITY-current.json',standingAuthorityBytes);}
  const inputRefs=[exactSpec,{...authorityRef,kind:'workspace_evidence'},...(spec.standing_authority_ref?[{...spec.standing_authority_ref,kind:'workspace_evidence'}]:[])];
  const projectTemplate=projectTemplateBytes?parse(projectTemplateBytes):null;
  const adapterRef=spec.adapter_validation_receipts_ref??projectTemplate?.execution?.adapter_validation_receipts_ref??template.execution?.adapter_validation_receipts_ref??null;
  if(adapterRef){
    inputRefs.push(hashRef(adapterRef,adapterValidationReceiptBytes,'adapter validation receipt'));
    if(!spec.adapter_validation_receipts_ref&&projectTemplate?.execution?.adapter_validation_receipts_ref)inputRefs.push(hashRef(projectTemplateRef,projectTemplateBytes,'current project template'));
  }
  let origin={kind:sourceKind},issuerDomains,passingRef=null,issuerRef=null,chapterUrls=[];
  if(assembly){
    const so=spec.source_origin;hashRef(so.provenance_ref,provenanceBytes,'assembly provenance');
    if(so.local_pdf_sha256!==pdfSha)throw new Error('Assembly local_pdf_sha256 must match exact unchanged PDF bytes');
    const provenance=parse(provenanceBytes);
    if(!Array.isArray(provenance.chapters)||!provenance.chapters.length)throw new Error('Assembly provenance must retain original chapters');
    chapterUrls=provenance.chapters.map(chapter=>https(chapter.url??chapter.source_url,'original chapter locator'));
    if(vo.observations.some(o=>o.kind==='edition'))throw new Error('Assembly edition remains unverified; no edition claim allowed');
    const provenanceRef=add('sources/private/original-chapter-provenance.json',provenanceBytes);inputRefs.push({...so.provenance_ref,kind:'workspace_evidence'});
    issuerDomains=so.issuer_domains??[new URL(handbookUrl).hostname.replace(/^www\./,'')];
    origin={kind:sourceKind,collection_url:handbookUrl,local_pdf_sha256:pdfSha,provenance_ref:provenanceRef,original_provenance_ref:so.provenance_ref,
      edition_status:'unverified',retrieved_at_utc:null,exact_issuer_pdf_download_claim:false,issuer_current_edition_confirmed:false};
  }else{
    text(spec.handbook_edition,'handbook_edition');date(spec.retrieved_at_utc,'retrieved_at_utc');
    const ip=spec.issuer_page;if(!ip)throw new Error('Missing issuer_page');https(ip.url,'issuer page');date(ip.observed_at_utc,'issuer observation time');
    if(!String(ip.excerpt??'').includes(handbookUrl))throw new Error('issuer_page.excerpt must contain exact handbook_url');
    issuerDomains=ip.domains??[new URL(ip.url).hostname.replace(/^www\./,'')];
    const snapshot=addJ('receipts/issuer-page-snapshot.json',{artifact_type:'IssuerPageRenderedExcerpt',run_id:spec.run_id,page_url:ip.url,
      observed_at_utc:ip.observed_at_utc,snapshot_kind:'rendered_dom_excerpt',excerpt:ip.excerpt,handbook_href:handbookUrl});
    issuerRef=addJ('receipts/issuer-current-edition-confirmation.json',{artifact_type:'IssuerCurrentEditionConfirmation',version:'0.4.0',run_id:spec.run_id,
      page_url:ip.url,observed_at_utc:ip.observed_at_utc,observation_method:'Explicit intake rendered-page excerpt; saved bytes are JSON, not HTTP response bytes.',
      page_sha256:snapshot.sha256,page_bytes:files.at(-1).bytes.length,hash_status:'HASHED_RENDERED_DOM_SNAPSHOT',snapshot_kind:'rendered_dom_excerpt',page_snapshot_ref:snapshot,
      observed_statements:ip.observed_statements??[],links_exact_handbook_url:handbookUrl,handbook_snapshot_sha256:pdfSha,edition_claim:spec.handbook_edition,
      effective_date_disposition:{value:null,reason:'No effective-date assertion supplied; remains verification debt'},
      recorded_by:{actor:ip.recorded_by??author.actor_id,session_id:executorId},recorded_at_utc:now});
  }
  if(!Array.isArray(issuerDomains)||!issuerDomains.length||issuerDomains.some(d=>typeof d!=='string'||!/^([a-z0-9-]+\.)+[a-z]{2,}$/i.test(d)))throw new Error('Invalid issuer domains');
  const onIssuer=value=>issuerDomains.some(d=>{const h=new URL(value).hostname;return h===d||h.endsWith('.'+d);});
  if(!onIssuer(handbookUrl)||(!assembly&&!onIssuer(spec.issuer_page.url))||chapterUrls.some(url=>!onIssuer(url)))throw new Error('Official locator must belong to supplied issuer domains');
  const visualRef=addJ('receipts/ROLE15-VISUAL-OBSERVATION.json',{artifact_type:'Role15VisualObservation',version:'0.4.0',source_document:{path:run+'/'+snapshotRel,sha256:pdfSha},
    observed_by:observer,method:{kind:vo.method_kind??'local_pdf_render_visual_inspection',renderer:text(vo.renderer,'visual renderer'),physical_page:vo.physical_page,
      render_parameters:vo.render_parameters??[],transport:vo.transport??'Local observation recorded in explicit intake spec',files_written:0,network_requests:0},
    observations:vo.observations.map(o=>({pdf_page:vo.physical_page,printed_page:vo.printed_page??null,kind:o.kind,value:o.value,verbatim:o.verbatim})),
    declarations:{engineering_observation:true,measured_meta_model_output:false,issuer_current_edition_confirmation:false,handbook_effective_date_evidence:false,retrieval_time_evidence:false,rights_clearance:false},
    observed_at_utc:date(vo.observed_at_utc??now,'visual observation time')});
  const product=spec.working_product_id??'rdmv-'+spec.jurisdiction.slice(3).toLowerCase()+'-'+(spec.license_or_permit_class.match(/class\s+([a-z])/i)?.[1]??'x').toLowerCase();
  if(!/^[a-z0-9][a-z0-9-]*$/.test(product))throw new Error('Invalid working_product_id');
  const issuerSlug=spec.issuing_authority.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40);
  const sourceRef=spec.jurisdiction==='US-UT'?'src:rdmv-ut-class-d:utah-dld:handbook':`src:${product}:${issuerSlug}:handbook`;
  const ef=spec.exam_facts??{},ps=spec.passing_score;
  if(!assembly){
    if(!ps||!Number.isInteger(ps.pdf_page)||ps.pdf_page<1||typeof ps.value!=='number'||!Number.isFinite(ps.value))throw new Error('Invalid passing_score');text(ps.verbatim,'passing_score.verbatim');
    passingRef=addJ('receipts/15-passing-score-observation.json',{artifact_type:'LocalSourceFactObservation',run_id:spec.run_id,source_ref:sourceRef,snapshot_sha256:pdfSha,
      source_page:`${sourceRef}:pdf-${String(ps.pdf_page).padStart(4,'0')}`,pdf_page:ps.pdf_page,printed_page:ps.printed_page??null,value:ps.value,verbatim:ps.verbatim,
      method:'Explicit intake local PDF-page observation; pending factual audit',factual_audit:'pending07/08'});
  }
  const fact=(value,page)=>value==null||page==null?unknown():{value,status:'verified',source_page:`${sourceRef}:pdf-${String(page).padStart(4,'0')}`,
    source_ref:sourceRef,source_snapshot_sha256:pdfSha,liveness_receipt_ref:run+'/15-source-liveness.json'};
  const examFacts=assembly?Object.fromEntries(['question_count','passing_percent','time_limit','format'].map(k=>[k,unknown()])):{
    question_count:fact(ef.question_count??null,ef.question_count_page??ef.source_pages?.find(p=>p!==ps.pdf_page)??ps.pdf_page),
    passing_percent:fact(ef.passing_percent??null,ps.pdf_page),time_limit:fact(ef.time_limit??null,ef.time_limit_page??null),format:unknown()};
  const cfg={schema_version:template.schema_version,run_id:spec.run_id,working_product_id:product,candidate_lineage_id:spec.run_id+':lineage:1',
    status:'STATE_SELECTED_BY_EXPLICIT_INTAKE_SOURCE_VERIFY_PENDING',execution_enabled:template.execution_enabled===true,
    producer:structuredClone(template.producer),limits:structuredClone(template.limits),audit_pool:structuredClone(template.audit_pool),baseline:structuredClone(template.baseline),
    authoring:{mode:spec.authoring_mode,actual_author:author},
    scope:{application_path:spec.application_path??template.scope?.application_path,language:spec.language??template.scope?.language??'en',coverage_kind:spec.coverage_kind??template.scope?.coverage_kind,
      jurisdiction:spec.jurisdiction,jurisdiction_selected_by:selection.evidence,issuing_authority:spec.issuing_authority,license_or_permit_class:spec.license_or_permit_class,
      handbook_edition:assembly?spec.handbook_title+' (edition unverified)':`${spec.handbook_title} ${spec.handbook_edition}`,handbook_url:handbookUrl,handbook_local_snapshot:run+'/'+snapshotRel,
      handbook_sha256:pdfSha,handbook_snapshot_bytes:pdfBytes.length,handbook_retrieved_at_utc:assembly?null:spec.retrieved_at_utc,source_origin:origin,issuer_page_domains:issuerDomains,
      exam_facts:examFacts,exam_facts_provenance:{note:assembly?'Assembly source: exam facts remain unknown':ef.note??null,passing_score_observation_ref:passingRef,issuer_confirmation_ref:issuerRef,intake_spec_ref:exactSpec},
      section_page_ranges:structuredClone(ranges),section_titles:structuredClone(spec.section_titles??{}),visual_observation_ref:visualRef,coverage_manifest_ref:null,
      ...(spec.depth_floor??template.scope?.depth_floor?{depth_floor:structuredClone(spec.depth_floor??template.scope.depth_floor)}:{})},
    execution:{executor_id:executorId,lock_ref:'EXECUTOR.lock.md',run_write_root:run,ledger:structuredClone(template.execution?.ledger??{path:'ledger/run.sqlite'}),
      ...(adapterRef?{adapter_validation_receipts_ref:structuredClone(adapterRef)}:{}),
      retry_nonces:{},current_intake_authority_ref:localAuthorityRef,...(standingRef?{standing_authority_ref:standingRef}:{})},
    state_selection:structuredClone(selection),intake_provenance:{spec_ref:exactSpec,current_authority_ref:authorityRef,actual_executor_id:executorId,actual_author:author},
    seeded_from:{run_id:template.run_id,config_ref:{path:templateRef+'/run-config.json',sha256:sha256(templateConfigBytes)},
      learning_loop_ref:{path:templateRef+'/19-learning-loop.json',sha256:sha256(templateLoopBytes)},at:now,by:'tools/belt/intake-state.mjs'}};
  // These two historical content-author labels are not transport/pricing identity.
  if(cfg.producer){delete cfg.producer.authoring_mode;delete cfg.producer.authoring_note;}
  loop.probe=product;loop.loop_version=product+'-intake-1';loop.minted_by={model:'deterministic-script:no-model',lane:'tool_assisted',pass:'intake-template-copy',actual_author:author,template_ref:cfg.seeded_from.learning_loop_ref};
  loop.source_refs={knowledge_graph:'pending:03.combined_kg',curriculum_unit_hints:'pending:03.combined_kg'};
  loop.modules=Object.keys(ranges).map((id,i)=>({module_id:'m.'+id,order:i+1,card_count:0,quiz_ref:'pending:06.exam_bank'}));
  const clearInherited=value=>Array.isArray(value)?value.map(clearInherited):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([k])=>k!=='authored_by').map(([k,v])=>[k,clearInherited(v)])):typeof value==='string'&&/\butah\b|ut-pilot|rdmv-ut-class-d/i.test(value)?value.replace(/\bUtah\b/gi,spec.state).replaceAll('ut-pilot',product+'-policy').replaceAll('rdmv-ut-class-d',product):value;
  const currentLoop=clearInherited(loop);currentLoop.minted_by=loop.minted_by;
  const runConfigRef=addJ('run-config.json',cfg);addJ('19-learning-loop.json',currentLoop);
  add('sources/private/README.md',Buffer.from(assembly?`# Private source\n\nExact unchanged local assembly ${pdfSha}. Collection: ${handbookUrl}. Original chapter provenance is hash-pinned. No issuer PDF download, current edition or retrieval time is asserted.\n`:
    `# Private source\n\n${spec.handbook_title}; supplied retrieval assertion ${spec.retrieved_at_utc}; locator ${handbookUrl}. Source verification debt remains with role 15.\n`));
  add('jams.md',Buffer.from(`# jams — ${spec.run_id}\n\nIntake ${now}; current authority and original template ancestry are pinned in run-config.json. Author: ${author.actor_id}; executor: ${executorId}.\n`));
  return {run_id:spec.run_id,executor_id:executorId,files,config:cfg,learning_loop:currentLoop,run_config_ref:runConfigRef,
    input_refs:[...inputRefs,{path:templateRef+'/run-config.json',sha256:sha256(templateConfigBytes)},{path:templateRef+'/19-learning-loop.json',sha256:sha256(templateLoopBytes)},{path:spec.handbook_pdf,sha256:pdfSha,kind:'explicit_local_pdf'}]};
}
