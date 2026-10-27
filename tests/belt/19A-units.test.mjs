// node --test tests/belt/19A-units.test.mjs
// Stage 19A.units: synthetic fixtures (no V1 19A artifact exists -> HOLD recorded in the mapping) yield their expected
// status; production_ready (+orphans) is rejected; integrity is recomputed; mastery binds to the LearningLoop.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, LANE_ROOT } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { canonicalJson } from '../../tools/belt/lib/hash.mjs';
import { run, computeIntegrity } from '../../tools/belt/checks/19a-units.mjs';

const STAGE = '19A.units';
const FIX = join(LANE_ROOT, 'tools/belt/fixtures', STAGE);
const mapping = JSON.parse(readFileSync(join(LANE_ROOT, 'schemas-strict/19a-curriculum-unit-map.mapping.json'), 'utf8'));
const load = (name) => {
  const abs = join(FIX, `${name}.json`);
  const { _fixture, ...artifact } = JSON.parse(readFileSync(abs, 'utf8'));
  return { artifact, context: loadFixtureContext(abs).context };
};
const st = (r, id) => (Array.isArray(r) ? r : r.checks).find(c => c.check_id === id)?.status;
const clone = (o) => structuredClone(o);
const resync = (a, ctx) => { a.integrity = { ...computeIntegrity(a, ctx).counts }; return a; };

test('mapping records the V1 projection as HOLD and lists no v1_projected fixture', () => {
  assert.equal(mapping.v1_projection.status, 'HOLD');
  assert.ok(mapping.fixtures.every(f => f.kind === 'synthetic'));
});

for (const fx of mapping.fixtures) {
  test(`fixture ${fx.path.split('/').pop()} -> ${fx.expected_status}`, async () => {
    const abs = join(LANE_ROOT, fx.path);
    const raw = JSON.parse(readFileSync(abs, 'utf8'));
    const { context } = loadFixtureContext(abs);
    const r = await validateArtifact({ stage_id: STAGE, artifact: raw, context: { ...context, strip_fixture_meta: true } });
    assert.equal(r.errors.length, 0, r.errors.join('; '));
    assert.equal(r.status, fx.expected_status, JSON.stringify(r.checks.filter(c => c.status !== 'PASS'), null, 1));
    for (const id of raw._fixture?.expected_failing_checks ?? []) assert.equal(st(r, id), 'FAIL', `${id} should FAIL`);
  });
}

test('REQUIRED NEGATIVE: production_ready + orphans is rejected and the parent allOf is restored', async () => {
  const { artifact, context } = load('synthetic-negative-production-ready-orphans');
  const r = await validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } });
  assert.equal(r.status, 'FAIL');
  assert.match(r.checks.find(c => c.check_id === '19A.PARENT_ALLOF_RESTORED').evidence, /orphan_card_refs=2/);
  assert.match(r.checks.find(c => c.check_id === '19A.INTEGRITY_RECOMPUTE').evidence, /orphan_card_refs: artifact 0 != recomputed 2/);
});

test('production_ready is rejected even with zero defects (pilot ceiling)', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.production_gate.status = 'production_ready';
  const r = run(a, context);
  assert.equal(st(r, '19A.PRODUCTION_GATE_CEILING'), 'FAIL');
  assert.equal(st(r, '19A.PARENT_ALLOF_RESTORED'), 'FAIL');
});

test('preview_only with recomputed defects must be blocked; blocked + blockers + honest counts passes that check', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.units[1].quiz_item_ids = []; resync(a, context);
  const r = run(a, context);
  assert.equal(st(r, '19A.INTEGRITY_RECOMPUTE'), 'PASS', 'counts are honest');
  assert.equal(st(r, '19A.INCOMPLETE_MAP_BLOCKED'), 'FAIL', 'but preview_only cannot hide them');
  a.production_gate = { status: 'blocked', reason: 'u02 has no quiz items', blockers: ['units_missing_quizzes=1; quiz items q3,q4 unbound'] };
  const r2 = run(a, context);
  assert.equal(st(r2, '19A.INCOMPLETE_MAP_BLOCKED'), 'PASS');
  assert.equal(st(r2, '19A.PRODUCTION_GATE_CEILING'), 'PASS');
});

test('model-written counts are advisory: any mismatch FAILs; integrity_computed_by must be script', async () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.integrity.duplicate_bindings = 1;
  assert.equal(st(run(a, context), '19A.INTEGRITY_RECOMPUTE'), 'FAIL');
  const b = clone(artifact); b.integrity_computed_by = 'model';
  const rb = await validateArtifact({ stage_id: STAGE, artifact: b, context: { ...context, strip_fixture_meta: true } });
  assert.equal(st(rb, '19A.SCHEMA'), 'FAIL');
  assert.equal(st(rb, '19A.INTEGRITY_RECOMPUTE'), 'FAIL');
  const c = clone(artifact); c.units[1].card_ids.push('c1'); resync(c, context);
  assert.equal(computeIntegrity(c, context).counts.duplicate_bindings, 1);
});

test('mastery threshold binds to the accepted LearningLoop; absent loop -> HOLD; out-of-range -> FAIL', () => {
  const { artifact, context } = load('synthetic-positive');
  const ctx = clone(context); delete ctx.learning_loop;
  assert.equal(st(run(artifact, ctx), '19A.MASTERY_GATE'), 'HOLD');
  const a = clone(artifact); a.units[0].mastery_gate.quiz_threshold_pct = 120;
  assert.equal(st(run(a, context), '19A.MASTERY_GATE'), 'FAIL');
  const b = clone(artifact); b.units[0].mastery_gate.learning_loop_sha256 = '0'.repeat(64);
  assert.equal(st(run(b, context), '19A.MASTERY_GATE'), 'FAIL');
  const noSha = clone(context); delete noSha.learning_loop_sha256;
  assert.equal(st(run(artifact, noSha), '19A.MASTERY_GATE'), 'HOLD', 'pin unverifiable without the loop hash');
});

test('hub opens only after lesson + all cards; quiz is hub-chosen', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.units[0].hub_unlock.requires = ['lesson_complete'];
  assert.equal(st(run(a, context), '19A.HUB_UNLOCK'), 'FAIL');
  const b = clone(artifact); b.units[0].user_cycle = ['session', 'flashcards', 'module_quiz', 'module_hub'];
  assert.equal(st(run(b, context), '19A.USER_CYCLE'), 'FAIL');
  const c = clone(artifact); c.units[0].user_cycle = ['session', 'flashcards', 'module_quiz', 'missed_review'];
  assert.equal(st(run(c, context), '19A.USER_CYCLE'), 'FAIL', 'no module_hub');
  const d = clone(artifact); d.units[0].hub_options = ['module_quiz', 'session'];
  assert.equal(st(run(d, context), '19A.USER_CYCLE'), 'FAIL');
  const e = clone(artifact); e.units[0].user_cycle = ['session', 'flashcards', 'module_hub', 'module_quiz', 'missed_review'];
  assert.equal(st(run(e, context), '19A.USER_CYCLE'), 'PASS', 'a quiz after the hub is chosen there, not forced');
});

test('every ref resolves against accepted inputs; absent inputs -> HOLD', () => {
  const { artifact, context } = load('synthetic-positive');
  const ctx = clone(context); delete ctx.accepted_inputs;
  assert.equal(st(run(artifact, ctx), '19A.REFS_RESOLVE'), 'HOLD');
  const a = clone(artifact); a.source_refs.exambank = 'runs/other/06-exambank.json';
  assert.equal(st(run(a, context), '19A.REFS_RESOLVE'), 'FAIL');
  const b = clone(artifact); b.units[0].node_ids = ['n1', 'n9'];
  const rb = run(b, context);
  assert.equal(st(rb, '19A.REFS_RESOLVE'), 'FAIL');
  assert.equal(st(rb, '19A.MODULE_UNIT_CARDINALITY'), 'FAIL', 'unit node_ids != KG module');
  const c = clone(artifact); c.units.pop(); c.units[0].order = 1; resync(c, context);
  assert.equal(st(run(c, context), '19A.MODULE_UNIT_CARDINALITY'), 'FAIL', 'module m02 has no unit');
});

test('tenant dir: canonical claim must be exact; pilot path never claims tenants/; cross-product refs are counted', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.product_line.tenant_dir_kind = 'canonical_tenant';
  assert.equal(st(run(a, context), '19A.TENANT_DIR'), 'FAIL');
  a.product_line.tenant_dir = 'app/public/tenants/synthetic-probe';
  assert.equal(st(run(a, context), '19A.TENANT_DIR'), 'PASS');
  const b = clone(artifact); b.product_line.tenant_dir = 'runs/x/tenants/other-line';
  assert.equal(st(run(b, context), '19A.TENANT_DIR'), 'FAIL');
  const c = clone(artifact); c.units[0].session_ref = 'app/public/tenants/other-line/s01';
  assert.equal(computeIntegrity(c, context).counts.cross_product_refs, 1);
  assert.equal(st(run(c, context), '19A.INTEGRITY_RECOMPUTE'), 'FAIL');
});

test('exam modes: pass_fail needs a verified sourced threshold; unknown threshold stays null', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.exam_modes[0].scoring_policy.result_language = 'pass_fail';
  assert.equal(st(run(a, context), '19A.EXAM_MODE_TRUTH'), 'FAIL');
  const b = clone(artifact); b.exam_modes[0].scoring_policy.passing_threshold = { value: 70, status: 'unknown', source_page: null };
  assert.equal(st(run(b, context), '19A.EXAM_MODE_TRUTH'), 'FAIL');
});

test('media: exemptions must be named by the pinned disposition; required visuals without assets are unresolved', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.media.exempt_by_disposition.push('road sign images');
  assert.equal(st(run(a, context), '19A.MEDIA_SENTINEL'), 'FAIL');
  const b = clone(artifact); b.media.required_slot_ids = ['slot.sign.stop']; resync(b, context);
  const rb = run(b, context);
  assert.equal(computeIntegrity(b, context).counts.unresolved_required_media, 1);
  assert.equal(st(rb, '19A.INCOMPLETE_MAP_BLOCKED'), 'FAIL');
  assert.equal(st(rb, '19A.MEDIA_SENTINEL'), 'FAIL', 'image cards disabled by the disposition');
});

test('run() and computeIntegrity() are pure', () => {
  const { artifact, context } = load('synthetic-positive');
  const a0 = canonicalJson(artifact), c0 = canonicalJson(context);
  run(artifact, context); computeIntegrity(artifact, context);
  assert.equal(canonicalJson(artifact), a0);
  assert.equal(canonicalJson(context), c0);
});
