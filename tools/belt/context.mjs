// Controller-owned context assembly. No execution, writes, clock or inferred acceptance.
import fs from 'node:fs';
import {isSourceGroupProof,inspectSourceGroup,resolveDossierSupersession} from './source-groups.mjs';
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

const identityOf = ref => {
  const value = ref?.identity ?? ref?.identity_json;
  try { return typeof value === 'string' ? JSON.parse(value) : value ?? {}; } catch { return {}; }
};
const idsKey = ids => JSON.stringify([...ids].sort());
const validIds = ids => Array.isArray(ids) && ids.length > 0 && ids.every(id => typeof id === 'string' && id.trim()) && new Set(ids).size === ids.length;
const dossierRef = ref => (ref?.stage_id ?? ref?.kind) === '02.dossier_sections' || ref?.kind === 'dossier_envelope';
const newer = (a, b) => String(a.accepted_at ?? '').localeCompare(String(b.accepted_at ?? '')) || String(a.task_id ?? '').localeCompare(String(b.task_id ?? ''));
const dossierScope = ref => {
  const config = identityOf(ref).config ?? {};
  return {sections: ref.section_ids ?? config.section_ids ?? [], parts: config.dossier_parts ?? []};
};
const exactRef = (a, b, root) => a?.sha256 === b?.sha256 && typeof a?.path === 'string' && typeof b?.path === 'string' && path.resolve(root, a.path) === path.resolve(root, b.path);

// A source revision does not reconcile prior content merely by becoming the
// selected registration. Keep upstream repair available, but require a fresh
// compile/index and exact consumed-artifact provenance before proceeding.
function sourceReconciliationBlockers({stageId, context, runtime, projectRoot}) {
  if (stageId === '02.dossier_sections') return [];
  const blockers = [], revised = context.source_registry?.source_revision?.reconciliation_required === true;
  const fail = reason => blockers.push('source_reconciliation:' + reason);
  for (const kind of ['compiled_dossier', 'fact_registry']) {
    const loaded = runtime.get(kind);
    if (!loaded) { if (revised) fail(kind + '_missing'); continue; }
    for (const [field, sourceKind] of [['source_registry_sha256', 'source_registry'], ['page_map_sha256', 'page_map']]) {
      const selected = runtime.get(sourceKind)?.pin;
      if (revised && !selected) fail(sourceKind + '_missing');
      else if (selected && ((revised && loaded.data[field] !== selected.sha256) || (loaded.data[field] != null && loaded.data[field] !== selected.sha256))) fail(kind + '_' + sourceKind + '_mismatch');
    }
  }
  if (!revised) return [...new Set(blockers)];
  if (context.compiled_dossier?.fact_registry_sha256 !== runtime.get('fact_registry')?.pin.sha256) fail('compiled_fact_registry_mismatch');
  const upstream = {
    knowledge_graph: [], carddeck: ['knowledge_graph'], exam_bank: ['knowledge_graph'], sessions: ['exam_bank'],
    card_scripts: ['carddeck'], curriculum_unit_map: ['knowledge_graph', 'carddeck', 'sessions', 'exam_bank'],
    candidate_manifest: ['knowledge_graph', 'carddeck', 'sessions', 'card_scripts', 'exam_bank', 'curriculum_unit_map'],
    coverage_report: ['candidate_manifest', 'exam_bank'], facts_report: ['candidate_manifest'],
  };
  const visiting = new Set(), checked = new Set();
  function check(kind) {
    if (checked.has(kind)) return;
    if (visiting.has(kind)) { fail(kind + '_provenance_cycle'); return; }
    const loaded = runtime.get(kind);
    if (!loaded) { fail(kind + '_provenance_missing'); return; }
    visiting.add(kind);
    const inputs = arr(identityOf(loaded.acceptedRef).inputs);
    for (const dependency of ['source_registry', 'page_map', 'compiled_dossier', 'fact_registry', ...(upstream[kind] ?? [])]) {
      const expected = runtime.get(dependency)?.pin;
      const matching = inputs.filter(r => (ALIASES[r.kind ?? r.stage_id] ?? r.kind ?? r.stage_id) === dependency);
      if (!expected || matching.length !== 1 || !exactRef(matching[0], expected, projectRoot)) fail(kind + '_' + dependency + '_provenance_mismatch');
      if (Object.hasOwn(upstream, dependency)) check(dependency);
    }
    visiting.delete(kind); checked.add(kind);
  }
  for (const need of NEEDS[stageId]) {
    const kind = need === 'exambank' || need === 'accepted_inputs.exam_stems' ? 'exam_bank'
      : need.startsWith('accepted_inputs.') ? need.slice('accepted_inputs.'.length)
      : need === 'qa_reports.coverage' ? 'coverage_report' : need === 'qa_reports.facts' ? 'facts_report' : need;
    if (Object.hasOwn(upstream, kind)) check(kind);
  }
  return [...new Set(blockers)];
}

/** A replacement receipt permits submission of one corrected accepted C/C2 part.
 * It grants no execution or spend authority and never changes accepted history.
 * acceptedArtifacts must come from the controller's native accepted-ledger view.
 */
export function inspectAccepted02Replacement({projectRoot, runDir, runId, stageId, sectionIds = [], partIds = [], acceptedArtifacts = [], replacementRef, nowUtc} = {}) {
  const held = message => ({status: 'HOLD', blockers: ['accepted02_replacement:' + message], ref: null, receipt: null, target: null, acceptedReplacement: null, siblingArtifacts: []});
  try {
    if (!replacementRef) return held('proof_missing');
    if(isSourceGroupProof(JSON.parse(fs.readFileSync(inside(runDir,verifyRef(replacementRef,projectRoot)),'utf8'))))return inspectSourceGroup({projectRoot,runDir,runId,stageId,sectionIds,partIds,acceptedArtifacts,replacementRef,nowUtc});
    if (!projectRoot || !runDir || !runId) return held('run_scope_missing');
    runDir = inside(path.join(projectRoot, 'runs'), runDir);
    if (stageId !== '02.dossier_sections' || !validIds(sectionIds) || sectionIds.length !== 1 || !validIds(partIds) || partIds.length !== 1 || !['C', 'C2'].includes(partIds[0])) return held('scope_requires_one_section_and_one_C_or_C2_part');
    if (!nowUtc || !Number.isFinite(Date.parse(nowUtc))) return held('controller_clock_missing');
    const proofPath = inside(runDir, verifyRef(replacementRef, projectRoot));
    const receipt = JSON.parse(fs.readFileSync(proofPath, 'utf8'));
    const keys = ['schema_version', 'status', 'kind', 'authority_scope', 'run_id', 'stage_id', 'section_ids', 'part_ids', 'supersedes', 'source_evidence_refs', 'reason', 'recorded_by', 'recorded_at', 'content_calls_authorized'];
    if (!receipt || Array.isArray(receipt) || Object.keys(receipt).some(k => !keys.includes(k)) || keys.some(k => !Object.hasOwn(receipt, k))) return held('proof_shape_invalid');
    if (receipt.schema_version !== 'nova-accepted-part-replacement.v1' || receipt.status !== 'PASS' || receipt.kind !== 'source_supported_fact_correction' || receipt.authority_scope !== 'submission_only_not_factual_acceptance' || receipt.content_calls_authorized !== false) return held('proof_authority_invalid');
    if (receipt.run_id !== runId || receipt.stage_id !== stageId || !validIds(receipt.section_ids) || !validIds(receipt.part_ids) || idsKey(receipt.section_ids) !== idsKey(sectionIds) || idsKey(receipt.part_ids) !== idsKey(partIds)) return held('proof_scope_mismatch');
    const actor = receipt.recorded_by;
    if (!actor || Object.keys(actor).some(k => !['actor_id', 'session_id', 'provider_family'].includes(k)) || !['actor_id', 'session_id', 'provider_family'].every(k => typeof actor[k] === 'string' && actor[k].trim()) || typeof receipt.reason !== 'string' || !receipt.reason.trim()) return held('reason_or_actor_missing');
    const at = Date.parse(receipt.recorded_at);
    if (typeof receipt.recorded_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T.*Z$/.test(receipt.recorded_at) || !Number.isFinite(at) || at > Date.parse(nowUtc)) return held('recorded_time_invalid');
    if (!Array.isArray(receipt.source_evidence_refs) || !receipt.source_evidence_refs.length) return held('source_evidence_missing');
    const evidenceRefs = receipt.source_evidence_refs.map(r => {
      if (!r || Object.keys(r).some(k => !['path', 'sha256'].includes(k))) throw new Error('source_evidence_shape_invalid');
      const file = inside(runDir, verifyRef(r, projectRoot));
      return {path: file, sha256: r.sha256};
    });
    if (new Set(evidenceRefs.map(r => r.path + ':' + r.sha256)).size !== evidenceRefs.length) return held('source_evidence_duplicate');
    if (!Array.isArray(receipt.supersedes) || receipt.supersedes.length !== 1) return held('one_exact_superseded_artifact_required');
    const superseded = receipt.supersedes[0];
    if (!superseded || Object.keys(superseded).some(k => !['artifact_id', 'task_id', 'path', 'sha256'].includes(k)) || !['artifact_id', 'task_id'].every(k => typeof superseded[k] === 'string' && superseded[k])) return held('superseded_identity_missing');
    inside(runDir, verifyRef(superseded, projectRoot));
    const dossiers = resolveDossierSupersession({projectRoot,runDir,runId,acceptedArtifacts}).active;
    if (dossiers.some(r => r.accepted !== true && r.status !== 'accepted')) return held('runtime_reference_not_accepted');
    const target = acceptedArtifacts.filter(dossierRef).find(r => r.task_id === superseded.task_id && r.artifact_id === superseded.artifact_id && exactRef(r, superseded, projectRoot));
    if (!target) return held('target_not_ledger_accepted');
    const scope = dossierScope(target);
    if (!validIds(scope.sections) || !validIds(scope.parts) || idsKey(scope.sections) !== idsKey(sectionIds) || idsKey(scope.parts) !== idsKey(partIds)) return held('target_scope_mismatch');
    const targetBody = JSON.parse(fs.readFileSync(inside(runDir, verifyRef(target, projectRoot)), 'utf8'));
    if (targetBody.stage_id !== stageId || !validIds(targetBody.envelope_scope?.assigned_section_ids) || idsKey(targetBody.envelope_scope.assigned_section_ids) !== idsKey(partIds)) return held('target_envelope_scope_mismatch');
    const latest = new Map();
    for (const r of dossiers) {
      const s = dossierScope(r);
      if (!validIds(s.sections) || idsKey(s.sections) !== idsKey(sectionIds)) continue;
      const key = idsKey(s.sections) + '@' + (validIds(s.parts) ? idsKey(s.parts) : 'whole:' + (r.task_id ?? r.sha256));
      if (!latest.has(key) || newer(r, latest.get(key)) > 0) latest.set(key, r);
    }
    const current = latest.get(idsKey(sectionIds) + '@' + idsKey(partIds));
    const acceptedReplacement = dossiers.find(r => {
      const s = dossierScope(r);
      return validIds(s.sections) && validIds(s.parts) && idsKey(s.sections) === idsKey(sectionIds) && idsKey(s.parts) === idsKey(partIds) && exactRef(identityOf(r).config?.replacement_ref, replacementRef, projectRoot);
    }) ?? null;
    if (current?.task_id !== target.task_id && current?.task_id !== acceptedReplacement?.task_id) return held('target_stale');
    const pin = {path: proofPath, sha256: replacementRef.sha256};
    return {status: 'PASS', blockers: [], ref: pin, receipt, target, acceptedReplacement,
      evidenceRefs, siblingArtifacts: [...latest.values()].filter(r => r.task_id !== target.task_id)};
  } catch (error) { return held('proof_or_reference_invalid:' + error.message); }
}

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
export function assembleContext({projectRoot, runRoot, stageId, acceptedArtifacts = [], bindings = {}, config = null, configRef = null, nowUtc = null, replacementRef = null, sectionIds = [], partIds = [], runId = config?.run_id} = {}) {
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
  const replacement = replacementRef === null ? null : inspectAccepted02Replacement({projectRoot, runDir: runRoot, runId, stageId, sectionIds, partIds, acceptedArtifacts, replacementRef, nowUtc});
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
    const loaded = {...load(ref, kind, true), acceptedRef: ref};
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
  if (runtime.has('dossier_envelope')) {
    const siblings = runtime.get('dossier_envelope');
    const active=resolveDossierSupersession({projectRoot,runDir:runRoot,runId:runId??path.basename(runRoot),acceptedArtifacts}).active;
    context.sibling_envelopes = replacement?.status === 'PASS'
      ? siblings.filter(e => replacement.siblingArtifacts.some(r => exactRef(e.pin, r, projectRoot))).map(e => e.data)
      : siblings.filter(e=>active.some(r=>exactRef(e.pin,r,projectRoot))).map(e => e.data);
    if(stageId==='02.dossier_sections'&&!replacement?.group&&active.some(r=>JSON.parse(fs.readFileSync(r.path,'utf8')).envelope_scope?.kind==='complete_dossier'&&identityOf(r).config?.replacement_ref))context.source_group_requires_explicit_submission=true;
  }
  if (replacement?.status === 'PASS') {
    const provenanceRefs = [{...replacement.ref, kind: 'accepted02_replacement_proof'},
      ...replacement.evidenceRefs.map(r => ({...r, kind: 'accepted02_replacement_source_evidence'})),
      ...(replacement.lineageTargets??replacement.targets??[replacement.target]).flatMap(target=>[['validation_ref', 'superseded_validation'], ['acceptance_ref', 'superseded_acceptance']].flatMap(([key, kind]) => target[key] ? [{...target[key], kind}] : []))];
    if(replacement.group){const file=path.join(projectRoot,'tools/belt/source-groups.mjs');provenanceRefs.push({path:file,sha256:sha256(fs.readFileSync(file)),kind:'source_group_implementation'});}
    for (const r of provenanceRefs) {
      const file = r.kind==='source_group_implementation'?verifyRef(r,projectRoot):inside(runRoot, verifyRef(r, projectRoot));
      inputRefs.push({kind: r.kind, path: slash(path.relative(projectRoot, file)), sha256: r.sha256});
    }
    context.accepted_replacement = {proof_ref: {...replacement.ref, path: slash(path.relative(projectRoot, replacement.ref.path))},
      authority_scope: replacement.receipt.authority_scope, supersedes: copy(replacement.receipt.supersedes),
      source_evidence_refs: copy(replacement.receipt.source_evidence_refs), reason: replacement.receipt.reason,
      content_calls_authorized: false};
  }
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
  const missing = [...required.filter(k => get(context, k) === null || get(context, k) === undefined), ...(replacement?.blockers ?? []),
    ...(context.source_group_requires_explicit_submission?['source_group:composite_requires_explicit_group']:[]),
    ...sourceReconciliationBlockers({stageId, context, runtime, projectRoot})];
  return {status: missing.length ? 'HOLD' : 'PASS', context, inputRefs, missing, replacement,
    acceptance_claim: 'context_assembly_only_not_artifact_validation_or_execution_authority'};
}
