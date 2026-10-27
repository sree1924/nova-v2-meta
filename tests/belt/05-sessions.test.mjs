// node --test tests/belt/05-sessions.test.mjs
// Local deterministic tests of the 05.sessions strict projection of contracts/teaching-unit.schema.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateArtifact } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { lintAll } from '../../tools/belt/strict-lint.mjs';
import { sha256File } from '../../tools/belt/lib/hash.mjs';
import { stageDirectionViolations } from '../../tools/belt/lib/cards-sessions-common.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STAGE = '05.sessions';
const mapping = JSON.parse(readFileSync(join(ROOT, 'schemas-strict/05b-session-scripts.mapping.json'), 'utf8'));
const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const run = async (rel) => {
  const abs = join(ROOT, rel);
  return validateArtifact({ stage_id: STAGE, artifact: load(rel), context: { ...loadFixtureContext(abs).context, strip_fixture_meta: true } });
};
const statusOf = (r, id) => r.checks.find(c => c.check_id === id)?.status;
const strip = ({ _fixture, ...rest }) => rest;

test('adapter passes strict-lint; parent + owned TeachingUnit pins are current', () => {
  const lint = lintAll()['05b-session-scripts.schema.json'];
  assert.equal(lint.ok, true, JSON.stringify(lint.violations));
  assert.equal(sha256File(join(ROOT, mapping.adapter_schema.path)), mapping.adapter_schema.sha256);
  assert.equal(sha256File(join('D:/nova', mapping.parent_schema.path)), mapping.parent_schema.sha256);
  assert.equal(mapping.parent_schema.sha256, '82aad2b15dd77c58e9770f6b809d07b1be9f3b5b91de550b6837f11bc5695ff2');
  assert.equal(sha256File(join(ROOT, mapping.local_owned_schema.path)), mapping.local_owned_schema.sha256);
  assert.equal(mapping.local_owned_schema.sha256, '0eb8189a6d4aac9ac2ce455c9d65f632e88c977200280748b6173f76de3a4b35');
});

test('projection keeps exactly the owned schema field set (no $ref, same required keys)', () => {
  const owned = load('contracts/teaching-unit.schema.json');
  const ad = load('schemas-strict/05b-session-scripts.schema.json');
  assert.ok(!JSON.stringify(ad).includes('"$ref"'));
  assert.deepEqual(ad.required, owned.required);
  const ou = owned.properties.units.items; const au = ad.properties.units.items;
  assert.deepEqual(au.required, ou.required);
  assert.deepEqual(au.properties.slides.items.required, ou.properties.slides.items.required);
  assert.deepEqual(au.properties.slides.items.properties.kind.enum, ou.properties.slides.items.properties.kind.enum);
});

test("Sol's synthetic payload is accepted by BOTH the owned schema and the strict projection", async () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const owned = ajv.compile(load('contracts/teaching-unit.schema.json'));
  const payload = strip(load('tools/belt/fixtures/05.sessions/synthetic-positive-sol.json'));
  assert.equal(owned(payload), true, JSON.stringify(owned.errors));
  const sol = load('qualification/fixtures/TEACHING-UNIT.synthetic.json');
  assert.deepEqual(payload, sol.payload, 'copied payload is unchanged');
});

test('every owned-schema rejection of a negative is also a 05S FAIL (projection + checks are not weaker)', async () => {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  const owned = ajv.compile(load('contracts/teaching-unit.schema.json'));
  for (const fx of mapping.fixtures) {
    const body = strip(load(fx.path));
    if (!owned(body)) { const r = await run(fx.path); assert.equal(r.status, 'FAIL', `${fx.path}: owned schema rejects but post-validation is ${r.status}`); }
  }
});

for (const fx of mapping.fixtures) {
  test(`fixture ${fx.path} -> ${fx.expected_status}`, async () => {
    assert.equal(sha256File(join(ROOT, fx.path)), fx.sha256, 'fixture bytes match mapping');
    const r = await run(fx.path);
    assert.deepEqual(r.errors, []);
    assert.equal(r.status, fx.expected_status, r.checks.filter(c => c.status !== 'PASS').map(c => `${c.check_id}=${c.status}`).join(' '));
    for (const [id, st] of Object.entries(fx.expected_check_status ?? {})) assert.equal(statusOf(r, id), st, `${id} expected ${st}`);
    if (fx.expected_status === 'PASS') assert.ok(r.checks.every(c => c.status === 'PASS'));
  });
}

test('positive fixture exercises every mapping-named check (no aggregate-only PASS)', async () => {
  const r = await run('tools/belt/fixtures/05.sessions/synthetic-positive-sol.json');
  assert.deepEqual(r.checks.map(c => c.check_id).sort(), [...mapping.checks].sort());
  assert.ok(r.checks.every(c => c.status === 'PASS'));
});

test("consistent with Sol's measureTeachingUnits: never weaker, same depth metrics", async () => {
  const { measureTeachingUnits } = await import('../../tools/qualify-04.mjs');
  for (const fx of mapping.fixtures) {
    if (!fx.context_path) continue;
    const ctx = load(fx.context_path);
    const body = strip(load(fx.path));
    const sol = measureTeachingUnits(body, { factIds: Object.keys(ctx.fact_registry.facts) });
    const r = await run(fx.path);
    if (sol.status === 'FAIL') assert.equal(r.status, 'FAIL', `${fx.path}: measureTeachingUnits FAIL (${sol.validation_errors.join('; ')}) but 05S ${r.status}`);
    const minAvg = Math.min(...sol.per_unit.map(u => u.average_narration_characters));
    assert.equal(r.metrics['05.NARRATION_DEPTH.min_unit_avg_chars'], Number(minAvg.toFixed(1)), `${fx.path}: avg narration metric`);
  }
});

test('five-slide lesson is rejected; schema alone would accept it', async () => {
  const r = await run('tools/belt/fixtures/05.sessions/synthetic-neg-five-slide.json');
  assert.equal(statusOf(r, '05.SCHEMA'), 'PASS');
  assert.equal(statusOf(r, '05.SLIDE_COUNT'), 'FAIL');
  assert.equal(r.status, 'FAIL');
});

test('uniform slide-count vector rejected; single unit reported not_applicable_single_unit', async () => {
  const u = await run('tools/belt/fixtures/05.sessions/synthetic-neg-uniform-vector.json');
  assert.equal(statusOf(u, '05.UNIFORM_VECTOR'), 'FAIL');
  const s = await run('tools/belt/fixtures/05.sessions/synthetic-positive-sol.json');
  assert.equal(s.metrics['05.UNIFORM_VECTOR.comparison'], 'not_applicable_single_unit');
  const two = await run('tools/belt/fixtures/05.sessions/synthetic-positive-two-units.json');
  assert.equal(two.metrics['05.UNIFORM_VECTOR.comparison'], 'varied');
});

test('fact resolution HOLDs without a registry and never reports ratio 1', async () => {
  const r = await run('tools/belt/fixtures/05.sessions/synthetic-hold-no-context.json');
  assert.equal(statusOf(r, '05.FACT_RESOLUTION'), 'HOLD');
  assert.equal(r.metrics['05.FACT_RESOLUTION.ratio'], null);
});

test('V1 05.sessions projection is HOLD by design (no fabricated spans)', () => {
  assert.equal(mapping.v1_projection.status, 'HOLD');
  assert.ok(!mapping.fixtures.some(f => /v1-/.test(f.path)), 'no V1 fixture file');
  assert.equal(mapping.v1_projection.source.sha256, sha256File(join('D:/nova', mapping.v1_projection.source.path)));
});

test('stage-direction lint: directions flagged, a sourced three-second rule is not', () => {
  assert.ok(stageDirectionViolations('[beat] Now pause for three seconds.').length > 0);
  assert.ok(stageDirectionViolations('Think about it for three seconds.').length > 0);
  assert.deepEqual(stageDirectionViolations('Stay at least three seconds behind the car ahead.'), []);
});
