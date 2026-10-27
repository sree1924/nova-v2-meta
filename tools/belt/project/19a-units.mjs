// Synthetic fixture builder for stage 19A.units. There is NO V1 projection: the citizenship run has no 19A
// CurriculumUnitMap artifact on disk (stage-map.json v1_reference.kind = "absent"), so projectV1 is not provided and the
// mapping records HOLD. Every fixture here is clearly synthetic (fictional product line "synthetic-probe").
// CLI: node tools/belt/project/19a-units.mjs --write   (writes tools/belt/fixtures/19A.units/*)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';
import { SENTINEL } from '../checks/19a-units.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
export const MEDIA_DISPOSITION = join(LANE, 'contracts', 'media-disposition.json');
export const V1_PROJECTION = { status: 'HOLD', reason: 'no 19A CurriculumUnitMap exists in D:/nova/runs/2026-06-11-citizenship (stage-map v1_reference.kind=absent); nothing to project, provenance is not manufactured' };

export function buildSynthetic(mediaDisposition) {
  const learningLoop = { artifact: 'LearningLoop', probe: 'synthetic-probe', mastery_gate: { quiz_threshold_pct: 80, missed_items_must_be_cleared: true, blocks_navigation: false }, note: 'SYNTHETIC LearningLoop for 19A interface fixtures' };
  const llSha = sha256Canonical(learningLoop);
  const LL_REF = 'runs/synthetic-pilot/19-learning-loop.json';
  const unit = (n, mod, nodes, cards, quiz, session) => ({
    unit_id: `u0${n}`, module_id: mod, order: n, title: `Synthetic module ${n}`, domain: `Synthetic domain ${n}`,
    node_ids: nodes, session_ref: session, card_ids: cards, quiz_item_ids: quiz, mock_item_ids: [], practice_form_ids: [], media_slot_ids: [],
    readiness_domain: `Synthetic domain ${n}`,
    user_cycle: ['session', 'flashcards', 'module_hub', 'missed_review', 'spaced_review'],
    hub_options: ['module_quiz', 'flashcards', 'session'],
    hub_unlock: { requires: ['lesson_complete', 'all_cards_seen'], rule_source: 'learning_loop' },
    mastery_gate: { quiz_threshold_pct: 80, missed_items_must_be_cleared: true, policy_source: 'learning_loop', provenance_kind: 'product_policy', learning_loop_ref: LL_REF, learning_loop_sha256: llSha },
  });
  const refs = {
    knowledge_graph: 'runs/synthetic-pilot/03-knowledge-graph.json', carddeck: 'runs/synthetic-pilot/04-carddeck.json',
    session_scripts: 'runs/synthetic-pilot/05b-session-scripts.json', exambank: 'runs/synthetic-pilot/06-exambank.json',
    learning_loop: LL_REF, media_disposition: 'contracts/media-disposition.json',
  };
  const positive = {
    _fixture: { kind: 'synthetic', label: 'SYNTHETIC interface fixture — preview_only unit map with script-computed integrity (no V1 19A artifact exists)', generator: 'tools/belt/project/19a-units.mjs#buildSynthetic', expected_status_with_context: 'PASS' },
    artifact: 'CurriculumUnitMap', schema_version: '1.0.0', adapter: 'pilot_adapter@0.4.0', stage_id: '19A.units',
    minted_by: { model: 'none', lane: 'tool_assisted', pass: 'deterministic' }, probe: 'synthetic-probe',
    lineage: { input_manifest_sha256: 'd'.repeat(64), candidate_lineage_id: 'lineage-synthetic-019a' },
    product_line: { product_line_id: 'synthetic-line', tenant_id: 'synthetic-probe', tenant_dir: 'runs/synthetic-pilot/preview', tenant_dir_kind: 'pilot_lane_path', source_run: 'runs/synthetic-pilot', isolation: 'one_product_one_tenant_dir' },
    source_refs: { ...refs, image_scout_pre_kg: SENTINEL, image_scout_post_kg: SENTINEL, image_asset_manifest: SENTINEL },
    units: [unit(1, 'm01', ['n1', 'n2'], ['c1', 'c2'], ['q1', 'q2'], 's01'), unit(2, 'm02', ['n3', 'n4'], ['c3', 'c4'], ['q3', 'q4'], 's02')],
    exam_modes: [{ mode_id: 'module-quiz', kind: 'module_quiz', title: 'Module quiz (practice)', item_ids: ['q1', 'q2', 'q3', 'q4'], form_ids: [], scoring_policy: { passing_threshold: { value: null, status: 'unknown', source_page: null }, result_language: 'practice_only', blocks_production_if_unknown: true } }],
    media: { required_slot_ids: [], optional_slot_ids: [], exempt_by_disposition: ['pre/post image scout plans'] },
    production_gate: { status: 'preview_only', reason: 'pilot ceiling: local preview only; official passing threshold unknown', blockers: [] },
    integrity: { units_missing_sessions: 0, units_missing_cards: 0, units_missing_quizzes: 0, orphan_card_refs: 0, orphan_quiz_item_refs: 0, orphan_session_refs: 0, unresolved_required_media: 0, cross_product_refs: 0, duplicate_bindings: 0, module_unit_mismatches: 0 },
    integrity_computed_by: 'script',
  };
  const context = {
    _fixture: { kind: 'synthetic_context', label: 'SYNTHETIC accepted inputs + LearningLoop for 19A fixtures; media_disposition embedded from contracts/media-disposition.json' },
    input_manifest_sha256: 'd'.repeat(64),
    accepted_inputs: {
      product_line_id: 'synthetic-line', tenant_id: 'synthetic-probe', refs,
      ids: { modules: ['m01', 'm02'], nodes: ['n1', 'n2', 'n3', 'n4'], cards: ['c1', 'c2', 'c3', 'c4'], quiz_items: ['q1', 'q2', 'q3', 'q4'], sessions: ['s01', 's02'], mock_items: [], practice_forms: [], media_slots_resolved: [] },
      module_nodes: { m01: ['n1', 'n2'], m02: ['n3', 'n4'] },
    },
    learning_loop: learningLoop,
    learning_loop_sha256: llSha,
    media_disposition: mediaDisposition,
  };
  // negative: production_ready with an orphan card (c9 unresolved, c2 unbound) and model-written zero counts
  const prodOrphans = structuredClone(positive);
  prodOrphans._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — production_ready + orphans with fabricated zero integrity counts (parent allOf restored)', expected_status_with_context: 'FAIL', expected_failing_checks: ['19A.SCHEMA', '19A.PRODUCTION_GATE_CEILING', '19A.PARENT_ALLOF_RESTORED', '19A.INTEGRITY_RECOMPUTE', '19A.INCOMPLETE_MAP_BLOCKED', '19A.REFS_RESOLVE'] };
  prodOrphans.production_gate = { status: 'production_ready', reason: 'all good (model claim)', blockers: [] };
  prodOrphans.units[0].card_ids = ['c1', 'c9'];
  // negative: threshold copied from a candidate-config hint instead of the LearningLoop
  const threshold = structuredClone(positive);
  threshold._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — mastery threshold not equal to the accepted LearningLoop', expected_status_with_context: 'FAIL', expected_failing_checks: ['19A.MASTERY_GATE'] };
  for (const u of threshold.units) u.mastery_gate.quiz_threshold_pct = 70;
  return { positive, context, prodOrphans, threshold };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const dir = join(LANE, 'tools', 'belt', 'fixtures', '19A.units');
  mkdirSync(dir, { recursive: true });
  const md = JSON.parse(readFileSync(MEDIA_DISPOSITION, 'utf8'));
  const { positive, context, prodOrphans, threshold } = buildSynthetic(md);
  const w = (name, obj) => { writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + '\n'); console.log(`${name} ${sha256File(join(dir, name))}`); };
  const hold = structuredClone(positive);
  hold._fixture = { kind: 'synthetic', label: 'SYNTHETIC — positive unit map with NO context (accepted inputs / LearningLoop absent) -> HOLD, never PASS', expected_status: 'HOLD' };
  w('synthetic-positive.json', positive);
  w('synthetic-context.json', context);
  w('synthetic-negative-production-ready-orphans.json', prodOrphans);
  w('synthetic-negative-threshold-mismatch.json', threshold);
  w('synthetic-hold-no-context.json', hold);
  for (const n of ['synthetic-positive', 'synthetic-negative-production-ready-orphans', 'synthetic-negative-threshold-mismatch']) w(`${n}.context.json`, { $load: 'tools/belt/fixtures/19A.units/synthetic-context.json' });
}
