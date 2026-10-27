// V1 projection + fixture generator for stage 09.package (ProductPackage pilot adapter, v0.4.0).
// API:  projectV1(parentPackage, opts) -> adapter-shaped artifact with a `_fixture` provenance block.
//       opts.mode = 'raw' (keep V1 meaning: shipped / openai_audio_api / V1 counts / unpaged numbers — expected FAIL)
//                 | 'normalized' (honest pilot reading of the same V1 bytes — expected PASS as a *blocked* package)
// CLI:  node tools/belt/project/09-package.mjs --write
//       (re)writes every fixture + sibling .context.json + synthetic input under tools/belt/fixtures/09.package/.
// Reads local files only (lane contracts + D:/nova/runs/2026-06-11-citizenship V1 reference); no network, no model.
// Output is a FIXTURE/REFERENCE, never a DMV production result.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Bytes, sha256File } from '../lib/hash.mjs';
import { readInputs, recomputeCounts, recomputeIntegrity, hasProvenance } from '../checks/09-package.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const NOVA = resolve(LANE, '..');
const S = 'deferred:not_applicable_pilot';
const FIX = 'tools/belt/fixtures/09.package';
const V1 = 'runs/2026-06-11-citizenship';
const V1_PKG = `${V1}/09-product-package.json`;
const V1_AUDIO_PKG = `${V1}/launch-fixes-2026-09-05/generated-corpus-held/public/tenants/us-citizenship/09-product-package.json`;
const V1_AUDIO_MANIFEST = `${V1}/20-audio-manifest.json`;
const CONTRACTS = { media_disposition: 'contracts/media-disposition.json', finish_criteria: 'contracts/pilot-finish-criteria.json', overlay: 'contracts/pilot-overrides-v0.4.0.json' };
const V1_INPUTS = { carddeck: '04-carddeck.json', card_scripts: '05-voicescripts.json', sessions: '05b-session-scripts.json', exam_bank: '06-exambank.json' };

const novaSha = (rel) => sha256File(join(NOVA, rel));
const laneSha = (rel) => sha256File(join(LANE, rel));
const readNova = (rel) => JSON.parse(readFileSync(join(NOVA, rel), 'utf8'));
const num = (value, status, source_page = null, fact_id = null) => ({ value, status, source_page, fact_id });
const NO_AUDIO = { provider: 'none_text_only_pilot', generation_mode: 'none', output_manifest: 'none', live_tts_in_user_flow: false };
const FEATURES_OFF = { auth: false, checkout: false, rendered_audio: false, trace_in_learner_navigation: false };

function v1Recomputed() {
  const ai = Object.fromEntries(Object.entries(V1_INPUTS).map(([k, f]) => [k, readNova(`${V1}/${f}`)]));
  const r = readInputs(ai);
  return {
    contents: recomputeCounts(r),
    integrity: recomputeIntegrity(r, 'us-citizenship').values,
    provenance_preserved: r.cards.every(hasProvenance) && r.items.every(hasProvenance),
  };
}

export function projectV1(parent, opts = {}) {
  const mode = opts.mode ?? 'normalized';
  const src = { path: opts.source_path ?? V1_PKG, sha256: opts.source_sha256 ?? null };
  const v1Weights = parent.exam_config?.domain_weights ?? [];
  const audioRecord = 'V1 had REAL rendered audio: 20-audio-manifest.json (gpt-4o-mini-tts, voice nova) + 617 files under runs/2026-06-11-citizenship/audio/; the later finish-line copy of the package declares audio_teacher_loop.provider=openai_audio_api. The pinned V1 09-product-package.json itself carries NO audio_teacher_loop block (it predates the parent field) and says "audio mp3 render is Worker 20, next phase".';
  if (mode === 'raw') {
    const audioSrc = opts.audio_source ?? null;
    return {
      _fixture: {
        kind: 'v1_projection_raw', fixture_not_production: true,
        source: src, audio_source: audioSrc && { path: audioSrc.path, sha256: audioSrc.sha256 },
        expected_status: 'FAIL',
        transformation_decisions: [
          'status "shipped" kept verbatim; pilot_status set to "preview_ready" because V1 "shipped" asserted every gate passed',
          'status_reason "" — V1 records none',
          'audio_teacher_loop taken from the finish-line package copy (openai_audio_api / pre_generated_batch / AudioAssetManifest) because the pinned V1 file lacks the block; learner_features.rendered_audio=true because V1 shipped rendered audio',
          audioRecord,
          'qa_gates verdicts PASS kept; report refs kept as V1 relative names with sha256=null (the V1 package hashes neither report)',
          'candidate_sha256=null (V1 predates ContentCandidateManifest); uispec ref kept, validate receipts null (V1 has none)',
          'contents = V1 package claims (deck 26, card 130, voice 156→text_script_count, session 26, item 128, mock 3→form_count, unit 0 because V1 carries no curriculum_unit_count)',
          'integrity: cards_missing_voice→cards_missing_text_script, orphans kept; fields V1 lacks set 0 as V1 implied',
          'exam_config numbers marked "verified" with source_page=null exactly as V1 asserted them (V1 cites [S2]/[S4] tags, no page); passing_threshold value null because V1 states it as prose',
          'deploy refs mapped to pilot sentinels (structural only); V1 deploy strings preserved here: ' + JSON.stringify(parent.deploy ?? {}).slice(0, 400),
        ],
      },
      minted_by: { model: 'projection:tools/belt/project/09-package.mjs', lane: 'tool_assisted', pass: 'v1_projection_raw' },
      probe: parent.probe,
      schema_version: '1.0.0',
      adapter_version: '0.4.0',
      package_version: parent.package_version,
      status: parent.status,
      pilot_status: 'preview_ready',
      status_scope: 'content_package',
      status_reason: '',
      candidate_manifest_ref: null,
      candidate_sha256: null,
      qa_gates: {
        coverage: { report_ref: parent.qa_gates?.refs?.coverage ?? null, sha256: null, verdict: parent.qa_gates?.coverage ?? 'NOT_RUN' },
        facts: { report_ref: parent.qa_gates?.refs?.fact ?? null, sha256: null, verdict: parent.qa_gates?.fact ?? 'NOT_RUN' },
        all_assigned_providers_pass: true,
        blocking_findings: 0,
      },
      uispec: { ref: '09-uispec.json', sha256: null, validate_1_receipt: null, validate_2_receipt: null },
      early_media_intent_ref: null,
      media_disposition_ref: CONTRACTS.media_disposition, media_disposition_sha256: null,
      finish_criteria_ref: CONTRACTS.finish_criteria, finish_criteria_sha256: null,
      pilot_overlay_ref: CONTRACTS.overlay, pilot_overlay_sha256: null,
      deploy: { supabase_dataset_ref: S, mobile_api_payload_refs: [S], listing_assets_ref: S, image_scout_plan_ref: S, audio_manifest_ref: S, exam_config_ref: parent.deploy?.exam_config_ref ?? '', curriculum_unit_map_ref: null, curriculum_unit_map_sha256: null, preview_payload_refs: [] },
      contents: {
        deck_count: parent.contents.deck_count, card_count: parent.contents.card_count, text_script_count: parent.contents.voice_count,
        session_count: parent.contents.session_count ?? 0, unit_count: parent.contents.curriculum_unit_count ?? 0,
        item_count: parent.contents.item_count, form_count: parent.contents.mock_count,
      },
      integrity: {
        computed_by: 'deterministic_script', orphans: parent.integrity.orphans, unresolved_refs: parent.integrity.unresolved_session_claims ?? 0,
        cards_missing_text_script: parent.integrity.cards_missing_voice, forms_missing_items: 0,
        units_missing_refs: parent.integrity.curriculum_units_missing_refs ?? 0, cross_product_refs: parent.integrity.cross_product_refs ?? 0,
      },
      exam_config: {
        practice_only: false, official_mirror_status: 'verified',
        n_questions: num(parent.exam_config.n_questions, 'verified'),
        passing_threshold: num(null, 'verified'),
        domain_weights: v1Weights.map(w => ({ domain: w.domain, weight: num(w.weight_pct, 'verified') })),
      },
      audio_teacher_loop: {
        provider: audioSrc?.audio_teacher_loop?.provider ?? 'openai_audio_api',
        generation_mode: audioSrc?.audio_teacher_loop?.generation_mode ?? 'pre_generated_batch',
        output_manifest: audioSrc?.audio_teacher_loop?.output_manifest ?? 'AudioAssetManifest',
        live_tts_in_user_flow: audioSrc?.audio_teacher_loop?.coverage_gate?.live_tts_in_user_flow ?? false,
      },
      learner_features: { auth: false, checkout: false, rendered_audio: true, trace_in_learner_navigation: false },
      provenance_preserved: parent.provenance_preserved,
      market_signal_ref: S,
    };
  }
  // normalized
  const rc = opts.recomputed;
  const refs = opts.refs;
  return {
    _fixture: {
      kind: 'v1_projection_normalized', fixture_not_production: true,
      source: src, expected_status: 'PASS',
      transformation_decisions: [
        'status "shipped" → "blocked" and pilot_status "blocked": the V1 bytes lack a v0.4.0 ContentCandidateManifest, candidate-scoped 07/08 reports and UiSpec validate_1/validate_2 receipts, so preview_ready cannot be claimed',
        'audio_teacher_loop → {none_text_only_pilot,none,none,false} and deploy.audio_manifest_ref → sentinel because media-disposition lists role 20 inactive; learner_features.rendered_audio=false',
        audioRecord,
        `contents/integrity RECOMPUTED from the current V1 input bytes (not copied): V1 package claimed card_count=${parent.contents.card_count}, voice_count=${parent.contents.voice_count}, item_count=${parent.contents.item_count}; current bytes give card_count=${rc.contents.card_count}, text_script_count=${rc.contents.text_script_count}, item_count=${rc.contents.item_count}, cards_missing_text_script=${rc.integrity.cards_missing_text_script} (the V1 inputs were extended after the package was minted)`,
        'unit_count=0 / curriculum_unit_map_ref=null: the V1 run root has no 19A CurriculumUnitMap (stage-map v1_reference absent)',
        `exam_config numbers → {value:null,status:"unknown"}: the V1 package cites [S2]/[S4] tags but no source_page, so per source-fact-policy they are UNKNOWN; V1 hints preserved here only: n_questions=${parent.exam_config.n_questions}, passing_threshold=${JSON.stringify(String(parent.exam_config.passing_threshold).slice(0, 90))}`,
        'V1 domain weight_pct values (item-share, not issuer weights) → status "authored" product emphasis under practice_only=true, never official',
        'qa_gates keep V1 07/08 verdict PASS with real report sha256; all_assigned_providers_pass=false (V1 had no assigned-provider scope); blocking_findings=0 (V1 08 publish_blocked=false, flagged=[]; V1 07 has no blocking field)',
        'deploy/listing/market refs → sentinels; preview_payload_refs = the four V1 accepted inputs at current bytes',
        'uispec ref = V1 09-uispec.json at current bytes (pre-v0.4.0 shape, not a validated pilot UiSpec); receipts null',
      ],
    },
    minted_by: { model: 'projection:tools/belt/project/09-package.mjs', lane: 'tool_assisted', pass: 'v1_projection_normalized' },
    probe: parent.probe,
    schema_version: '1.0.0',
    adapter_version: '0.4.0',
    package_version: `${parent.package_version}+pilot-projection-0.4.0`,
    status: 'blocked',
    pilot_status: 'blocked',
    status_scope: 'content_package',
    status_reason: 'V1 citizenship reference projected as an interface fixture: no v0.4.0 ContentCandidateManifest, no candidate-scoped 07/08 reports and no UiSpec validate_1/validate_2 receipts exist for these bytes; production release deferred.',
    candidate_manifest_ref: null,
    candidate_sha256: null,
    qa_gates: {
      coverage: { report_ref: `${V1}/07-coverage-report.json`, sha256: refs.coverage, verdict: parent.qa_gates.coverage },
      facts: { report_ref: `${V1}/08-fact-report.json`, sha256: refs.facts, verdict: parent.qa_gates.fact },
      all_assigned_providers_pass: false,
      blocking_findings: 0,
    },
    uispec: { ref: `${V1}/09-uispec.json`, sha256: refs.uispec, validate_1_receipt: null, validate_2_receipt: null },
    early_media_intent_ref: null,
    media_disposition_ref: CONTRACTS.media_disposition, media_disposition_sha256: refs.media_disposition,
    finish_criteria_ref: CONTRACTS.finish_criteria, finish_criteria_sha256: refs.finish_criteria,
    pilot_overlay_ref: CONTRACTS.overlay, pilot_overlay_sha256: refs.overlay,
    deploy: {
      supabase_dataset_ref: S, mobile_api_payload_refs: [S], listing_assets_ref: S, image_scout_plan_ref: S, audio_manifest_ref: S,
      exam_config_ref: `${V1}/06-exambank.json#/exam_meta_mirror`, curriculum_unit_map_ref: null, curriculum_unit_map_sha256: null,
      preview_payload_refs: Object.values(V1_INPUTS).map(f => ({ path: `${V1}/${f}`, sha256: novaSha(`${V1}/${f}`) })),
    },
    contents: rc.contents,
    integrity: { computed_by: 'deterministic_script', ...rc.integrity },
    exam_config: {
      practice_only: true, official_mirror_status: 'unknown',
      n_questions: num(null, 'unknown'), passing_threshold: num(null, 'unknown'),
      domain_weights: v1Weights.map(w => ({ domain: w.domain, weight: num(w.weight_pct, 'authored') })),
    },
    audio_teacher_loop: { ...NO_AUDIO },
    learner_features: { ...FEATURES_OFF },
    provenance_preserved: rc.provenance_preserved,
    market_signal_ref: S,
  };
}

// ------------------------------------------------------------------ synthetic sets
const NOTE = 'SYNTHETIC interface input for 09.package fixtures (Claude schema lane, v0.4.0); not DMV content, not a production artifact.';
function writeJson(rel, obj) {
  const abs = join(LANE, rel);
  mkdirSync(dirname(abs), { recursive: true });
  const bytes = Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8');
  writeFileSync(abs, bytes);
  return { path: rel, sha256: sha256Bytes(bytes) };
}

function buildSet(dir, { orphanScript = false } = {}) {
  const carddeck = {
    artifact_type: 'CardDeck', synthetic_note: NOTE,
    decks: [
      { deck_id: 'd01', module_id: 'm01', cards: [{ id: 'c01', fact_ids: ['f01'], source_refs: ['SYN-SRC#p1'] }, { id: 'c02', fact_ids: ['f02'], source_refs: ['SYN-SRC#p1'] }] },
      { deck_id: 'd02', module_id: 'm02', cards: [{ id: 'c03', fact_ids: ['f03'], source_refs: ['SYN-SRC#p2'] }, { id: 'c04', fact_ids: ['f04'], source_refs: ['SYN-SRC#p2'] }] },
    ],
  };
  const scripts = ['c01', 'c02', 'c03', 'c04'].map(card_id => ({ card_id }));
  if (orphanScript) scripts.push({ card_id: 'c99-not-in-deck' });
  const card_scripts = { artifact_type: 'VoiceScripts', synthetic_note: NOTE, scripts };
  const sessions = { artifact_type: 'TeachingUnitSet', synthetic_note: NOTE, units: [{ unit_id: 'tu01' }, { unit_id: 'tu02' }] };
  const curriculum_unit_map = {
    artifact_type: 'CurriculumUnitMap', synthetic_note: NOTE,
    units: [
      { unit_id: 'u01', session_ref: 'tu01', card_ids: ['c01', 'c02'], quiz_item_ids: ['i01', 'i02', 'i03'], mock_item_ids: [] },
      { unit_id: 'u02', session_ref: 'tu02', card_ids: ['c03', 'c04'], quiz_item_ids: ['i04', 'i05', 'i06'], mock_item_ids: [] },
    ],
  };
  const items = ['i01', 'i02', 'i03', 'i04', 'i05', 'i06'].map((id, n) => ({ id, fact_ids: [`f0${(n % 4) + 1}`], source_refs: ['SYN-SRC#p1'] }));
  const exam_bank = {
    artifact_type: 'ExamBank', synthetic_note: NOTE, items,
    module_quizzes: [{ module_id: 'm01', item_ids: ['i01', 'i02', 'i03'] }, { module_id: 'm02', item_ids: ['i04', 'i05', 'i06'] }],
    practice_forms: [{ form_id: 'p1', item_ids: items.map(i => i.id) }],
  };
  const inputs = { carddeck, card_scripts, sessions, curriculum_unit_map, exam_bank };
  const refs = {};
  for (const [k, v] of Object.entries(inputs)) refs[k] = writeJson(`${dir}/${k}.json`, v);
  const manifest = writeJson(`${dir}/candidate-manifest.json`, {
    artifact_type: 'ContentCandidateManifest', synthetic_note: NOTE, candidate_lineage_id: `synthetic-09-${orphanScript ? 'orphan' : 'base'}`,
    artifacts: Object.entries(refs).map(([role, r]) => ({ role, path: r.path, sha256: r.sha256 })),
  });
  const cand = manifest.sha256;
  const coverage = writeJson(`${dir}/coverage-report.json`, { artifact_type: 'CoverageReport', synthetic_note: NOTE, candidate_sha256: cand, verdict: 'PASS', blocking_findings: 0 });
  const facts = writeJson(`${dir}/fact-report.json`, { artifact_type: 'FactReport', synthetic_note: NOTE, candidate_sha256: cand, verdict: 'PASS', blocking_findings: 0 });
  const uispec = writeJson(`${dir}/uispec-placeholder.json`, { synthetic_note: `${NOTE} Placeholder bytes standing in for a validated FINAL UiSpec: 09 binds its hash only; UiSpec validity is evidenced by the validate_1/validate_2 receipts, not by 09.`, content_candidate_sha256: cand });
  const early = writeJson(`${dir}/early-media-intent.json`, { synthetic_note: NOTE, media_density: 'text_first', narration_status: 'deferred_not_available_pilot', content_candidate_lineage: `synthetic-09-${orphanScript ? 'orphan' : 'base'}` });
  const uiSchemaSha = laneSha('contracts/ui-spec.schema.json');
  const receipt = (phase, kind, actor, family) => ({
    schema_version: 'rdmv.ui-validation-receipt.0.4.0', phase, kind, status: 'PASS', spec_sha256: uispec.sha256, schema_sha256: uiSchemaSha,
    content_candidate_sha256: cand, actor_id: actor, provider_family: family, session_id: `synthetic-${phase}-${kind}`, evidence_refs: [{ path: uispec.path, sha256: uispec.sha256 }],
  });
  const rcpt = {};
  for (const phase of ['validate_1', 'validate_2']) {
    rcpt[phase] = {
      schema: writeJson(`${dir}/${phase}-schema-receipt.synthetic.json`, receipt(phase, 'role14_schema', 'synthetic-role-14', 'synthetic-family-a')),
      independent: writeJson(`${dir}/${phase}-independent-receipt.synthetic.json`, receipt(phase, 'independent_semantic', 'synthetic-reviewer', 'synthetic-family-b')),
    };
  }
  return { refs, manifest, cand, coverage, facts, uispec, early, rcpt, inputs };
}

function contextFor(set) {
  return {
    _note: 'Fixture context: {"$load": path} entries are resolved + hashed by tools/belt/lib/fixture-context.mjs (paths relative to D:/nova/fb-ai-hackathon).',
    media_disposition: { $load: CONTRACTS.media_disposition },
    finish_criteria: { $load: CONTRACTS.finish_criteria },
    overlay: { $load: CONTRACTS.overlay },
    accepted_inputs: Object.fromEntries(Object.entries(set.refs).map(([k, r]) => [k, { $load: r.path }])),
    candidate_manifest: { $load: set.manifest.path },
    qa_reports: { coverage: { $load: set.coverage.path }, facts: { $load: set.facts.path } },
    uispec: { $load: set.uispec.path },
    uispec_receipts: Object.fromEntries(Object.entries(set.rcpt).map(([p, v]) => [p, { schema: { $load: v.schema.path }, independent: { $load: v.independent.path } }])),
  };
}

function previewReady(set, label, contracts) {
  const recompute = readInputs(set.inputs);
  return {
    _fixture: { kind: 'synthetic', fixture_not_production: true, label, source: { path: `${FIX}/inputs`, note: 'generated by tools/belt/project/09-package.mjs --write' } },
    minted_by: { model: 'deterministic:tools/belt/project/09-package.mjs', lane: 'tool_assisted', pass: 'package' },
    probe: 'rdmv-synthetic',
    schema_version: '1.0.0',
    adapter_version: '0.4.0',
    package_version: '0.4.0-synthetic.1',
    status: 'blocked',
    pilot_status: 'preview_ready',
    status_scope: 'content_package',
    status_reason: 'production release deferred; local content preview ready (content package only, not an application or deployment result)',
    candidate_manifest_ref: set.manifest.path,
    candidate_sha256: set.cand,
    qa_gates: {
      coverage: { report_ref: set.coverage.path, sha256: set.coverage.sha256, verdict: 'PASS' },
      facts: { report_ref: set.facts.path, sha256: set.facts.sha256, verdict: 'PASS' },
      all_assigned_providers_pass: true,
      blocking_findings: 0,
    },
    uispec: {
      ref: set.uispec.path, sha256: set.uispec.sha256,
      validate_1_receipt: { schema_receipt: set.rcpt.validate_1.schema, independent_receipt: set.rcpt.validate_1.independent },
      validate_2_receipt: { schema_receipt: set.rcpt.validate_2.schema, independent_receipt: set.rcpt.validate_2.independent },
    },
    early_media_intent_ref: set.early,
    media_disposition_ref: CONTRACTS.media_disposition, media_disposition_sha256: contracts.media_disposition,
    finish_criteria_ref: CONTRACTS.finish_criteria, finish_criteria_sha256: contracts.finish_criteria,
    pilot_overlay_ref: CONTRACTS.overlay, pilot_overlay_sha256: contracts.overlay,
    deploy: {
      supabase_dataset_ref: S, mobile_api_payload_refs: [S], listing_assets_ref: S, image_scout_plan_ref: S, audio_manifest_ref: S,
      exam_config_ref: `${set.refs.exam_bank.path}#/practice_forms`,
      curriculum_unit_map_ref: set.refs.curriculum_unit_map.path, curriculum_unit_map_sha256: set.refs.curriculum_unit_map.sha256,
      preview_payload_refs: Object.values(set.refs),
    },
    contents: recomputeCounts(recompute),
    integrity: { computed_by: 'deterministic_script', ...recomputeIntegrity(recompute, 'rdmv-synthetic').values },
    exam_config: {
      practice_only: true, official_mirror_status: 'unknown',
      n_questions: num(null, 'unknown'), passing_threshold: num(null, 'unknown'),
      domain_weights: [{ domain: 'm01', weight: num(null, 'unknown') }, { domain: 'm02', weight: num(null, 'unknown') }],
    },
    audio_teacher_loop: { ...NO_AUDIO },
    learner_features: { ...FEATURES_OFF },
    provenance_preserved: true,
    market_signal_ref: S,
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));
function variant(base, label, mutate) { const v = clone(base); v._fixture.label = label; mutate(v); return v; }

export function writeAll() {
  const contracts = Object.fromEntries(Object.entries(CONTRACTS).map(([k, p]) => [k, laneSha(p)]));
  const written = [];
  const put = (name, artifact, context) => {
    written.push(writeJson(`${FIX}/${name}.json`, artifact));
    if (context) writeJson(`${FIX}/${name}.context.json`, context);
  };

  // V1 projections
  const parent = readNova(V1_PKG);
  const audioPkg = readNova(V1_AUDIO_PKG);
  const v1ctx = {
    _note: 'V1 reference context: contracts + the V1 accepted inputs/07/08/UiSpec at their CURRENT bytes (paths relative to the lane root). No 19A unit map exists in the V1 run root.',
    media_disposition: { $load: CONTRACTS.media_disposition }, finish_criteria: { $load: CONTRACTS.finish_criteria }, overlay: { $load: CONTRACTS.overlay },
    accepted_inputs: Object.fromEntries(Object.entries(V1_INPUTS).map(([k, f]) => [k, { $load: `../${V1}/${f}` }])),
    qa_reports: { coverage: { $load: `../${V1}/07-coverage-report.json` }, facts: { $load: `../${V1}/08-fact-report.json` } },
    uispec: { $load: `../${V1}/09-uispec.json` },
  };
  put('v1-projected-raw', projectV1(parent, {
    mode: 'raw', source_path: V1_PKG, source_sha256: novaSha(V1_PKG),
    audio_source: { path: V1_AUDIO_PKG, sha256: novaSha(V1_AUDIO_PKG), audio_teacher_loop: audioPkg.audio_teacher_loop },
  }), v1ctx);
  const n = projectV1(parent, {
    mode: 'normalized', source_path: V1_PKG, source_sha256: novaSha(V1_PKG), recomputed: v1Recomputed(),
    refs: { coverage: novaSha(`${V1}/07-coverage-report.json`), facts: novaSha(`${V1}/08-fact-report.json`), uispec: novaSha(`${V1}/09-uispec.json`), ...contracts },
  });
  n._fixture.audio_evidence = { audio_manifest: { path: V1_AUDIO_MANIFEST, sha256: novaSha(V1_AUDIO_MANIFEST) }, finish_line_package: { path: V1_AUDIO_PKG, sha256: novaSha(V1_AUDIO_PKG) } };
  put('v1-projected-normalized', n, v1ctx);

  // synthetic
  const base = buildSet(`${FIX}/inputs`);
  const ctx = contextFor(base);
  const pr = previewReady(base, 'preview_ready represented honestly: pilot_status preview_ready beside legacy status blocked with a scoped reason', contracts);
  put('synthetic-preview-ready', pr, ctx);
  put('synthetic-hold-no-context', variant(pr, 'valid preview_ready package validated with NO context → HOLD (bindings/counts unverifiable)', () => {}), null);
  put('synthetic-neg-audio-active-role20-inactive', variant(pr, 'audio_teacher_loop claims openai_audio_api while media-disposition lists role 20 inactive', v => {
    v.audio_teacher_loop = { provider: 'openai_audio_api', generation_mode: 'pre_generated_batch', output_manifest: 'AudioAssetManifest', live_tts_in_user_flow: false };
  }), ctx);
  put('synthetic-neg-preview-ready-no-uispec-receipts', variant(pr, 'preview_ready without UiSpec validate_1/validate_2 receipts', v => { v.uispec.validate_1_receipt = null; v.uispec.validate_2_receipt = null; }), ctx);
  put('synthetic-neg-legacy-shipped', variant(pr, 'legacy parent status "shipped" (canonical shipped forbidden for the preview)', v => { v.status = 'shipped'; }), ctx);
  put('synthetic-neg-empty-status-reason', variant(pr, 'legacy blocked with an empty status_reason', v => { v.status_reason = ' '; }), ctx);
  put('synthetic-neg-candidate-mismatch', variant(pr, 'candidate_sha256 not equal to the bound ContentCandidateManifest bytes', v => { v.candidate_sha256 = 'f'.repeat(64); }), ctx);
  put('synthetic-neg-count-fabricated', variant(pr, 'card_count fabricated (5 claimed, 4 accepted)', v => { v.contents.card_count = 5; }), ctx);
  put('synthetic-neg-deploy-auth-claims', variant(pr, 'status_reason and payload ref claim Clerk/Stripe checkout and a live URL', v => {
    v.status_reason = 'production release deferred; Clerk auth + Stripe checkout wired, deployed to https://example.invalid';
  }), ctx);
  put('synthetic-neg-source-debt-numeral', variant(pr, 'unpaged "(verify)" numeral promoted to a verified exam number', v => {
    v.exam_config.n_questions = num(30, 'verified', null, null);
    v.exam_config.official_mirror_status = 'verified';
    v.deploy.exam_config_ref = 'practice config: 30 questions (verify)';
  }), ctx);
  put('synthetic-neg-application-scope', variant(pr, 'status_scope claims application readiness (separate later receipt)', v => { v.status_scope = 'application_preview_ready'; }), ctx);
  const orphan = buildSet(`${FIX}/inputs-orphan`, { orphanScript: true });
  const prO = previewReady(orphan, 'preview_ready with an honestly reported orphan script (orphans=1) → rejected', contracts);
  put('synthetic-neg-orphans-preview-ready', prO, contextFor(orphan));
  put('synthetic-blocked-orphans-honest', variant(prO, 'same orphan inputs, pilot_status blocked with honest reason → PASS', v => {
    v.pilot_status = 'blocked'; v.status_reason = 'integrity join found 1 orphan text script (c99-not-in-deck); routed to 05 card scripts; production release deferred';
  }), contextFor(orphan));
  return written;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--write')) { console.error('usage: node tools/belt/project/09-package.mjs --write'); process.exit(2); }
  const w = writeAll();
  console.log(JSON.stringify({ written: w }, null, 2));
}
