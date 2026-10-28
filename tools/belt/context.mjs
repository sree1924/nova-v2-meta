// Controller-owned context assembly. No execution, writes, clock or inferred acceptance.
import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, sha256, verifyRef, inside} from './atomic-file.mjs';
import {sanitizeModelInput} from '../sanitize-model-input.mjs';

const slash = s => s.replaceAll('\\', '/');
const arr = value => Array.isArray(value) ? value : [];
const copy = value => JSON.parse(JSON.stringify(value));
const STATIC = new Set(['overlay', 'policy', 'media_disposition', 'finish_criteria', 'prompt_authorship']);
const ALIASES = {
  '15-source-registry.json': 'source_registry', '15-page-map.json': 'page_map', '15-source-liveness.json': 'source_liveness',
  '16-fact-registry.json': 'fact_registry', '16-compiled-dossier.json': 'compiled_dossier',
  blueprint: 'compiled_dossier', exambank: 'exam_bank', session_scripts: 'sessions', voice_scripts: 'card_scripts',
  '02.dossier_sections': 'dossier_envelope', '03.combined_kg': 'knowledge_graph', '04.cards': 'carddeck',
  '05.sessions': 'sessions', '05.card_scripts': 'card_scripts', '06.exam_bank': 'exam_bank',
  '19A.units': 'curriculum_unit_map', '07.content_coverage': 'coverage_report', '08.content_facts': 'facts_report',
};
const NEEDS = {
  '02.dossier_sections': ['source_registry', 'page_map', 'source_document'],
  '03.combined_kg': ['compiled_dossier', 'fact_registry', 'source_registry', 'learning_loop'],
  '04.cards': ['fact_registry', 'page_map', 'source_document', 'learning_loop', 'accepted_inputs.knowledge_graph', 'accepted_inputs.blueprint_mnemonics'],
  '05.sessions': ['fact_registry', 'source_registry', 'accepted_inputs.exam_stems'],
  '05.card_scripts': ['fact_registry', 'accepted_inputs.carddeck'],
  '06.exam_bank': ['fact_registry', 'learning_loop', 'accepted_inputs.knowledge_graph'],
  '19A.units': ['accepted_inputs.knowledge_graph', 'accepted_inputs.carddeck', 'accepted_inputs.sessions', 'accepted_inputs.exam_bank', 'learning_loop'],
  '07.content_coverage': ['candidate_manifest', 'intervention_lineage', 'audit_assignment', 'exambank', 'early_media_intent', 'titled_surfaces'],
  '08.content_facts': ['candidate_manifest', 'source_registry', 'source_liveness', 'intervention_lineage', 'audit_assignment', 'prompt_authorship', 'now_utc'],
  '09.package': ['candidate_manifest', 'accepted_inputs.carddeck', 'accepted_inputs.card_scripts', 'accepted_inputs.sessions',
    'accepted_inputs.curriculum_unit_map', 'accepted_inputs.exam_bank', 'qa_reports.coverage', 'qa_reports.facts', 'uispec', 'uispec_receipts', 'finish_criteria'],
};

function put(target, dotted, value) {
  const parts = dotted.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) current = current[part] ??= {};
  current[parts.at(-1)] = value;
}
function get(target, dotted) { return dotted.split('.').reduce((v, k) => v?.[k], target); }

// Compatibility view for the existing safe-input guard. "current" confirms the
// dated issuer edition only; effective_date_status is retained as debt. No raw
// config claim is upgraded to verified by this projection.
function acceptedSourceProjection({context, runtime, projectRoot, runRoot, nowUtc, config = null}) {
  const projection = {sources: []};
  if (!runtime.has('source_registry') || !runtime.has('page_map') || !runtime.has('source_liveness') || !nowUtc) return projection;
  for (const source of arr(context.source_registry?.sources)) {
    const ref = source.source_ref ?? source.ref;
    const snapshot = source.snapshot_hash ?? source.sha256;
    const receipt = arr(context.source_liveness).find(r => r.source_ref === ref && r.snapshot_sha256 === snapshot);
    if (!receipt || !['PASS', 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT'].includes(receipt.status) || source.is_official !== true) continue;
    try {
      const issuerPath = verifyRef({path: receipt.issuer_current_edition_ref, sha256: receipt.issuer_current_edition_sha256}, projectRoot);
      inside(runRoot, issuerPath);
      const issuer = JSON.parse(fs.readFileSync(issuerPath, 'utf8'));
      // Issuer page must be on the run's declared issuer domain(s) (scope.issuer_page_domains; Utah DLD by default) — multi-state
      // intake 2026-10-28; the Utah literal here excluded every other state's source from the projection.
      const issuerDomains = Array.isArray(config?.scope?.issuer_page_domains) && config.scope.issuer_page_domains.length ? config.scope.issuer_page_domains : ['dld.utah.gov'];
      const onIssuerDomain = issuerDomains.some(d => new RegExp('^https://(?:[a-z0-9-]+\\.)*' + String(d).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(issuer.page_url ?? ''));
      if (issuer.handbook_snapshot_sha256 !== snapshot || issuer.links_exact_handbook_url !== receipt.official_url || !onIssuerDomain) continue;
      const age = Date.parse(nowUtc) - Date.parse(issuer.observed_at_utc);
      if (!Number.isFinite(age) || age < 0 || age > (context.policy?.freshness?.max_receipt_age_hours ?? 24) * 3_600_000) continue;
      if (receipt.status === 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT') {
        const disposition = receipt.effective_date_disposition_ref;
        if (receipt.effective_date !== null || !disposition || disposition.path !== receipt.issuer_current_edition_ref || disposition.sha256 !== receipt.issuer_current_edition_sha256 || issuer.effective_date_disposition?.value !== null) continue;
      }
      if (!issuer.page_snapshot_ref || !issuer.page_sha256) continue;
      const snapshotRef = typeof issuer.page_snapshot_ref === 'string'
        ? {path: issuer.page_snapshot_ref, sha256: issuer.page_sha256} : issuer.page_snapshot_ref;
      if (snapshotRef.sha256 !== issuer.page_sha256) continue;
      const pageFile = verifyRef(snapshotRef, projectRoot);
      inside(runRoot, pageFile);
      const bytes = fs.readFileSync(pageFile);
      if (bytes.length !== issuer.page_bytes || !bytes.toString('utf8').includes(receipt.official_url)) continue;
      const pages = arr(context.page_map?.pages).filter(p => p.source_ref === ref && p.source_document_sha256 === snapshot);
      if (!pages.length) continue;
      projection.sources.push({ref, sha256: snapshot, accepted: true, current: true,
        accepted_pages: [...new Set(pages.flatMap(p => [p.page_id, p.page_map_id].filter(Boolean)))],
        liveness_receipt_ref: runtime.get('source_liveness').pin.path,
        liveness_status: receipt.status, effective_date_status: receipt.effective_date === null ? 'debt' : 'dated',
        issuer_observation_ref: {path: receipt.issuer_current_edition_ref, sha256: receipt.issuer_current_edition_sha256}});
    } catch {
      // Missing/stale exact evidence yields no accepted source, never a guess.
    }
  }
  return projection;
}

/**
 * acceptedArtifacts are exact ledger-resolved refs {kind,path,sha256,accepted:true}.
 * accepted:true is an assertion by the controller after looking up its ledger; it
 * is never synthesized here from file presence, output status or a validation PASS.
 * Static policy refs live in bindings; arbitrary runtime context belongs in the
 * accepted artifact list. Caller provides its clock as nowUtc, never a live read.
 */
export function assembleContext({projectRoot, runRoot, stageId, acceptedArtifacts = [], bindings = {}, config = null, configRef = null, nowUtc = null} = {}) {
  if (!projectRoot || !runRoot || !NEEDS[stageId]) throw new Error('Known stageId, projectRoot and isolated runRoot are required');
  projectRoot = fs.realpathSync(projectRoot);
  runRoot = inside(path.join(projectRoot, 'runs'), runRoot);
  if (nowUtc !== null && (typeof nowUtc !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(nowUtc) || !Number.isFinite(Date.parse(nowUtc)))) {
    throw new Error('nowUtc must be an explicit ISO controller clock value');
  }
  const context = {accepted_inputs: {}, fact_registry: null, source_registry: null, candidate_manifest: null,
    media_disposition: null, learning_loop: null, intervention_lineage: null, overlay: null, policy: null,
    finish_criteria: null, exam_facts_view: null, now_utc: nowUtc, loaded_refs: {}, strip_fixture_meta: false};
  const inputRefs = [];
  const runtime = new Map();
  function load(ref, kind, runtimeOnly = false) {
    const file = verifyRef(ref, projectRoot);
    if (runtimeOnly) inside(runRoot, file);
    const bytes = fs.readFileSync(file);
    const data = kind === 'source_text' ? {text: bytes.toString('utf8')} : JSON.parse(bytes.toString('utf8'));
    if (Object.hasOwn(data, '_fixture') || Object.hasOwn(data, '$load')) throw new Error('Fixture metadata/load directives cannot enter production context');
    const pin = {kind, path: slash(path.relative(projectRoot, file)), sha256: ref.sha256};
    inputRefs.push(pin);
    return {data, pin};
  }
  for (const ref of acceptedArtifacts) {
    if (ref?.accepted !== true && ref?.status !== 'accepted') throw new Error('Context accepts only ledger-accepted runtime references');
    const declaredKind = ref.kind ?? ref.stage_id ?? ref.stageId;
    const kind = ALIASES[declaredKind] ?? declaredKind;
    if (typeof kind !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(kind)) throw new Error('Runtime reference needs an explicit semantic kind');
    const loaded = load(ref, kind, true);
    if (runtime.has(kind) && kind !== 'dossier_envelope') throw new Error(`Ambiguous duplicate accepted input kind ${kind}`);
    if (kind === 'dossier_envelope') {
      const siblings = runtime.get(kind) ?? [];
      siblings.push(loaded); runtime.set(kind, siblings);
    } else runtime.set(kind, loaded);
  }
  for (const [key, ref] of Object.entries(bindings)) {
    if (!STATIC.has(key)) throw new Error(`Runtime binding ${key} requires an accepted artifact ref, not a static-policy bypass`);
    const loaded = load(ref, key);
    // Contracts are confined to project root; no imports or directives execute.
    context[key] = loaded.data;
    context.loaded_refs[key] = loaded.pin;
  }
  if (config !== null) {
    if (!configRef) throw new Error('Config data requires its exact configuration file reference');
    const loaded = load(configRef, 'run_config', true);
    if (canonicalJson(loaded.data) !== canonicalJson(config)) throw new Error('Provided config differs from its exact pinned file');
  }
  const direct = ['fact_registry', 'source_registry', 'page_map', 'compiled_dossier', 'candidate_manifest', 'intervention_lineage',
    'audit_assignment', 'accepted_dispositions', 'titled_surfaces', 'uispec', 'uispec_receipts', 'peer_reports', 'exam_policy_disposition'];
  for (const key of direct) if (runtime.has(key)) {
    context[key] = runtime.get(key).data;
    context.loaded_refs[key] = runtime.get(key).pin;
  }
  if (runtime.has('source_text')) {
    context.source_document = runtime.get('source_text').data;
    context.loaded_refs.source_document = runtime.get('source_text').pin;
  }
  if (runtime.has('source_liveness')) {
    const loaded = runtime.get('source_liveness');
    context.source_liveness = Array.isArray(loaded.data) ? loaded.data : [loaded.data];
    context.loaded_refs.source_liveness = loaded.pin;
  }
  for (const key of ['knowledge_graph', 'carddeck', 'sessions', 'card_scripts', 'exam_bank', 'curriculum_unit_map', 'blueprint_mnemonics']) {
    if (!runtime.has(key)) continue;
    const {data, pin} = runtime.get(key);
    context.accepted_inputs[key] = data;
    context.loaded_refs[`accepted_inputs.${key}`] = pin;
  }
  if (runtime.has('learning_loop')) {
    const {data, pin} = runtime.get('learning_loop');
    context.learning_loop = {...data, ref: pin.path};
    context.learning_loop_sha256 = pin.sha256;
    context.loaded_refs.learning_loop = pin;
    context.accepted_inputs.learning_loop_ref = pin.path;
  }
  if (runtime.has('early_media_intent')) {
    const {data, pin} = runtime.get('early_media_intent');
    context.early_media_intent = {ref: pin.path, path: pin.path, sha256: pin.sha256, document: data};
    context.loaded_refs.early_media_intent = pin;
  }
  if (runtime.has('exam_policy_disposition')) context.exam_policy_disposition_ref = runtime.get('exam_policy_disposition').pin.path;
  for (const [kind, key] of [['coverage_report', 'coverage'], ['facts_report', 'facts']]) if (runtime.has(kind)) {
    const {data, pin} = runtime.get(kind);
    context.qa_reports ??= {};
    context.qa_reports[key] = data;
    context.loaded_refs[`qa_reports.${key}`] = pin;
  }
  if (runtime.has('dossier_envelope')) context.sibling_envelopes = runtime.get('dossier_envelope').map(e => e.data);
  const compiled = context.compiled_dossier;
  if (compiled) {
    context.accepted_inputs.blueprint = compiled;
    context.loaded_refs['accepted_inputs.blueprint'] = runtime.get('compiled_dossier').pin;
    // Only ids that are real facts in the registry count as high-yield nodes; C2 KG-hint ids (fact_registry.kg_hints) are not nodes.
    const hintIds = new Set(Object.keys(context.fact_registry?.kg_hints ?? {}));
    context.accepted_inputs.high_yield_fact_ids = [...new Set(arr(compiled.high_yield_ranked).flatMap(d => arr(d.ranked).flatMap(r => arr(r.item_refs))))].filter(id => !hintIds.has(id));
    if (Array.isArray(compiled.high_yield_node_ids)) context.accepted_inputs.high_yield_ids = copy(compiled.high_yield_node_ids);
    else if (context.overlay?.role_overrides?.['03']?.high_yield_node_id_source === 'accepted_fact_ids') {
      context.accepted_inputs.high_yield_ids = copy(context.accepted_inputs.high_yield_fact_ids);
    }
    if (compiled.blueprint_mnemonics && !context.accepted_inputs.blueprint_mnemonics) context.accepted_inputs.blueprint_mnemonics = copy(compiled.blueprint_mnemonics);
    // The pilot 02 adapter carries no SME mnemonic map (mnemonics live only as the G05 DoD box), so an accepted compile without one
    // binds an EMPTY map: every 04 hook is therefore "minted" (04.HOOK_ORIGIN mnemonic-first rule has nothing to carry). Recorded, not guessed.
    else if (!context.accepted_inputs.blueprint_mnemonics) { context.accepted_inputs.blueprint_mnemonics = {}; context.accepted_inputs.blueprint_mnemonics_source = 'none_in_pilot_02_adapter'; }
  }
  const kg = context.accepted_inputs.knowledge_graph;
  if (kg) {
    context.accepted_inputs.module_ids = arr(kg.modules).map(m => m.module_id ?? m.id);
    context.accepted_inputs.module_nodes = Object.fromEntries(arr(kg.modules).map(m => [m.module_id ?? m.id, arr(m.node_ids)]));
    context.accepted_inputs.ids = {modules: context.accepted_inputs.module_ids, nodes: arr(kg.nodes).map(n => n.id)};
  }
  const bank = context.accepted_inputs.exam_bank;
  if (bank) {
    context.exambank = bank;
    const items = [...arr(bank.item_pool), ...arr(bank.items), ...arr(bank.module_quizzes).flatMap(q => arr(q.items))];
    context.accepted_inputs.exam_stems = items.map(i => i.stem).filter(s => typeof s === 'string');
    context.accepted_inputs.ids ??= {};
    context.accepted_inputs.ids.quiz_items = arr(bank.module_quizzes).flatMap(q => arr(q.item_ids).length ? q.item_ids : arr(q.items).map(i => i.item_id));
    context.accepted_inputs.ids.mock_items = arr(bank.item_pool).map(i => i.item_id);
    context.accepted_inputs.ids.practice_forms = arr(bank.practice_forms).map(f => f.form_id);
  }
  if (context.accepted_inputs.carddeck) {
    context.accepted_inputs.ids ??= {};
    context.accepted_inputs.ids.cards = arr(context.accepted_inputs.carddeck.decks).flatMap(d => arr(d.cards).map(c => c.card_id));
  }
  if (context.accepted_inputs.sessions) {
    context.accepted_inputs.ids ??= {};
    const data = context.accepted_inputs.sessions;
    context.accepted_inputs.ids.sessions = arr(data.units ?? data.sessions).map(s => s.session_id ?? s.unit_id);
  }
  context.accepted_inputs.refs = {};
  for (const [name, kind] of Object.entries({knowledge_graph: 'knowledge_graph', carddeck: 'carddeck', session_scripts: 'sessions', exambank: 'exam_bank', learning_loop: 'learning_loop'})) {
    if (runtime.has(kind)) context.accepted_inputs.refs[name] = runtime.get(kind).pin.path;
  }
  if (context.loaded_refs.media_disposition) context.accepted_inputs.refs.media_disposition = context.loaded_refs.media_disposition.path;
  context.source_registry_sha256 = context.loaded_refs.source_registry?.sha256 ?? null;
  if (config !== null) {
    const learningPolicy = context.learning_loop ? {kind: 'product_policy', ref: context.learning_loop.ref,
      sha256: context.learning_loop_sha256, accepted: true,
      quiz_threshold_pct: context.learning_loop.mastery_gate?.quiz_threshold_pct} : null;
    context.accepted_source_projection = acceptedSourceProjection({context, runtime, projectRoot, runRoot, nowUtc, config});
    const safe = sanitizeModelInput(config, {sourceRegistry: context.accepted_source_projection, learningPolicy});
    context.exam_facts_view = safe.model_input.exam_facts;
    context.safe_model_input = safe;
  }
  if (stageId === '07.content_coverage' && context.media_disposition) {
    const pin = context.loaded_refs.media_disposition;
    context.media_disposition = {path: pin.path, sha256: pin.sha256, document: context.media_disposition};
  }
  inputRefs.sort((a, b) => `${a.kind}:${a.path}`.localeCompare(`${b.kind}:${b.path}`));
  context.input_manifest_sha256 = sha256(canonicalJson(inputRefs));
  const required = ['overlay', 'policy', 'media_disposition', ...NEEDS[stageId]];
  const missing = required.filter(k => get(context, k) === null || get(context, k) === undefined);
  return {status: missing.length ? 'HOLD' : 'PASS', context, inputRefs, missing,
    acceptance_claim: 'context_assembly_only_not_artifact_validation_or_execution_authority'};
}
