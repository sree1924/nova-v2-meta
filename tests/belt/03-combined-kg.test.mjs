// node --test tests/belt/03-combined-kg.test.mjs
// Stage 03.combined_kg: mapping fixtures yield their expected status; the required weight negative pair
// (unknown + null PASSes, unknown + bare number FAILs); recomputation beats model claims. Local deterministic only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, LANE_ROOT } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { sha256File, canonicalJson } from '../../tools/belt/lib/hash.mjs';
import { run } from '../../tools/belt/checks/03-combined-kg.mjs';
import { projectV1, V1_SOURCE } from '../../tools/belt/project/03-combined-kg.mjs';

const STAGE = '03.combined_kg';
const FIX = join(LANE_ROOT, 'tools/belt/fixtures', STAGE);
const mapping = JSON.parse(readFileSync(join(LANE_ROOT, 'schemas-strict/03-knowledge-graph.mapping.json'), 'utf8'));
const load = (name) => {
  const abs = join(FIX, `${name}.json`);
  const { _fixture, ...artifact } = JSON.parse(readFileSync(abs, 'utf8'));
  return { artifact, context: loadFixtureContext(abs).context };
};
const st = (r, id) => (Array.isArray(r) ? r : r.checks).find(c => c.check_id === id)?.status;
const clone = (o) => structuredClone(o);

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

test('REQUIRED NEGATIVE PAIR: unknown weights with no fabricated number PASS; a bare number under unknown FAILs', async () => {
  const pos = load('synthetic-positive');
  const r1 = await validateArtifact({ stage_id: STAGE, artifact: pos.artifact, context: { ...pos.context, strip_fixture_meta: true } });
  assert.equal(r1.status, 'PASS');
  assert.ok(pos.artifact.nodes.every(n => n.official_weight.status === 'unknown' && n.official_weight.value === null));
  assert.equal(st(r1, '03.SCHEMA'), 'PASS', 'the adapter itself accepts null official weights');
  const neg = clone(pos.artifact); neg.modules[1].official_weight = { value: 0, status: 'unknown', source_page: null };
  const r2 = await validateArtifact({ stage_id: STAGE, artifact: neg, context: { ...pos.context, strip_fixture_meta: true } });
  assert.equal(st(r2, '03.SCHEMA'), 'PASS', 'schema cannot see the lie');
  assert.equal(st(r2, '03.WEIGHT_HONESTY'), 'FAIL', 'a guessed zero under unknown status is a fabricated number');
});

test('V1 projection is deterministic, equals the fixture, and never marks a weight verified', () => {
  const kg = JSON.parse(readFileSync(V1_SOURCE, 'utf8'));
  const a = projectV1(kg, { sourceSha256: sha256File(V1_SOURCE) });
  assert.equal(canonicalJson(a), canonicalJson(JSON.parse(readFileSync(join(FIX, 'v1-projected.json'), 'utf8'))));
  assert.ok(a.nodes.every(n => n.official_weight.status === 'authored'));
  assert.equal(a.nodes.find(n => n.id === 'gov-b.01').official_weight.source_page, 'S1#p.4');
  assert.deepEqual(a.nodes.map(n => n.official_weight.value), kg.nodes.map(n => n.exam_weight), 'values kept, not altered');
});

test('V1 honest findings: recomputed structure holds, missing confidence/confusables/hints FAIL, high-yield set HOLD', () => {
  const { artifact, context } = load('v1-projected');
  const r = run(artifact, context);
  for (const id of ['03.ACYCLIC', '03.PATH_TOPOLOGICAL', '03.PATH_COVERAGE', '03.ONE_MODULE_PER_NODE', '03.WEIGHT_HONESTY', '03.DOMAIN_EMPHASIS', '03.WEIGHT_CLOSURE', '03.KG05_ASSERTIONS', '03.FACT_IDS_REGISTERED']) assert.equal(st(r, id), 'PASS', id);
  for (const id of ['03.EDGE_TYPED', '03.CONFUSABLE_SOURCE_BOUND', '03.CURRICULUM_HINTS', '03.LEARNING_INPUT_BOUND']) assert.equal(st(r, id), 'FAIL', id);
  assert.equal(st(r, '03.HIGH_YIELD_SET'), 'HOLD');
});

test('confusable must cite a fact of BOTH endpoints', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.nodes[0].confusable_with[0].fact_ids = ['f.n1'];
  assert.equal(st(run(a, context), '03.CONFUSABLE_SOURCE_BOUND'), 'FAIL');
  const b = clone(artifact); b.nodes[2].no_confusable_reason = null;
  assert.equal(st(run(b, context), '03.CONFUSABLE_SOURCE_BOUND'), 'FAIL', 'high-yield n3 needs a confusable or a reason');
  const c = clone(artifact); c.nodes[0].confusable_with[0].fact_ids = ['f.n1', 'f.nX']; c.nodes[1].fact_ids = ['f.nX'];
  assert.equal(st(run(c, context), '03.FACT_IDS_REGISTERED'), 'FAIL', 'unregistered fact id');
});

test('dynamic node on the path, double home, orphan node', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.learning_path.push('d1');
  assert.equal(st(run(a, context), '03.PATH_COVERAGE'), 'FAIL');
  const b = clone(artifact); b.modules[1].node_ids.push('n1');
  const rb = run(b, context);
  assert.equal(st(rb, '03.ONE_MODULE_PER_NODE'), 'FAIL');
  assert.equal(st(rb, '03.CURRICULUM_HINTS'), 'FAIL', 'unit hint node_ids no longer equal the module');
  const c = clone(artifact); c.modules[0].node_ids = ['n1']; c.department_pass.kg05.validation_assertions.orphan_nodes = 0;
  const rc = run(c, context);
  assert.equal(st(rc, '03.ONE_MODULE_PER_NODE'), 'FAIL');
  assert.equal(st(rc, '03.KG05_ASSERTIONS'), 'FAIL', 'claimed orphan_nodes 0 vs recomputed 1');
  const d = clone(artifact); d.learning_path_rule.dynamic_excluded = false;
  assert.equal(st(run(d, context), '03.PATH_COVERAGE'), 'FAIL', 'rule must be recorded');
});

test('high-yield set must equal the accepted source set; absent source -> HOLD', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.nodes[1].high_yield = true; a.nodes[1].no_confusable_reason = 'none';
  assert.equal(st(run(a, context), '03.HIGH_YIELD_SET'), 'FAIL');
  const ctx = clone(context); delete ctx.accepted_inputs.high_yield_ids;
  assert.equal(st(run(artifact, ctx), '03.HIGH_YIELD_SET'), 'HOLD');
});

test('KG-01 blocking gap: PASS verdict FAILs; FAIL verdict with zero extraction routes back to 02', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.department_pass.kg01.gaps.push({ type: 'unsourced_fact', located_at: 'C.03:L4', detail: 'no page', severity: 'blocking' });
  assert.equal(st(run(a, context), '03.KG01_GAPS'), 'FAIL');
  const b = clone(a); b.department_pass.kg01.verdict = 'FAIL'; b.department_pass.kg01.nodes_extracted = 0; b.nodes = []; b.modules = []; b.edges = []; b.department_pass.kg03.edges = []; b.learning_path = []; b.curriculum_unit_hints = []; b.department_pass.kg04.domain_emphasis_check = [];
  const rb = run(b, context);
  assert.equal(st(rb, '03.KG01_GAPS'), 'PASS');
  assert.equal(st(rb, '03.KG01_ROUTE_BACK'), 'FAIL');
});

test('verified weights: need a registered page; registry absent -> HOLD', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.nodes[0].official_weight = { value: 30, status: 'verified', source_page: 'SYN-HB#p.1' };
  assert.equal(st(run(a, context), '03.WEIGHT_HONESTY'), 'PASS');
  assert.equal(st(run(a, context), '03.VERIFIED_WEIGHTS_REGISTERED'), 'PASS');
  const ctx = clone(context); delete ctx.source_registry;
  assert.equal(st(run(a, ctx), '03.VERIFIED_WEIGHTS_REGISTERED'), 'HOLD');
  a.nodes[0].official_weight.source_page = 'OTHER#p.1';
  assert.equal(st(run(a, context), '03.VERIFIED_WEIGHTS_REGISTERED'), 'FAIL');
  const b = clone(artifact); b.nodes[0].official_weight = { value: 30, status: 'verified', source_page: null };
  assert.equal(st(run(b, context), '03.WEIGHT_HONESTY'), 'FAIL');
});

test('domain emphasis is recomputed; verified-basis drift > 2pp FAILs', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.department_pass.kg04.domain_emphasis_check[0].computed_pct = 60;
  assert.equal(st(run(a, context), '03.DOMAIN_EMPHASIS'), 'FAIL');
  const b = clone(artifact);
  for (const n of b.nodes) n.official_weight = { value: 25, status: 'verified', source_page: 'SYN-HB#p.1' };
  b.department_pass.kg04.domain_emphasis_check = [
    { domain: 'Signs (synthetic)', blueprint_pct: 40, weight_status: 'verified', computed_pct: 50, drift_pp: 10, comparison_basis: 'official_verified', within_tolerance: false },
    { domain: 'Right of way (synthetic)', blueprint_pct: 60, weight_status: 'verified', computed_pct: 50, drift_pp: 10, comparison_basis: 'official_verified', within_tolerance: false },
  ];
  const rb = run(b, context);
  assert.equal(st(rb, '03.DOMAIN_EMPHASIS'), 'FAIL');
  assert.match(rb.find(c => c.check_id === '03.DOMAIN_EMPHASIS').evidence, /re-weights the exam/);
});

test('curriculum hints: module_quiz forced before the hub FAILs; sentinel needs the media disposition', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.curriculum_unit_hints[0].user_cycle = ['session', 'flashcards', 'module_quiz', 'module_hub'];
  assert.equal(st(run(a, context), '03.CURRICULUM_HINTS'), 'FAIL');
  const ctx = clone(context); ctx.media_disposition = { ...ctx.media_disposition, inactive_roles: ['20', '20B'] };
  assert.equal(st(run(artifact, ctx), '03.SCOUT_SENTINEL'), 'FAIL');
  const noMd = clone(context); delete noMd.media_disposition;
  assert.equal(st(run(artifact, noMd), '03.SCOUT_SENTINEL'), 'HOLD');
});

test('run() is pure', () => {
  const { artifact, context } = load('synthetic-positive');
  const a0 = canonicalJson(artifact), c0 = canonicalJson(context);
  run(artifact, context);
  assert.equal(canonicalJson(artifact), a0);
  assert.equal(canonicalJson(context), c0);
});
