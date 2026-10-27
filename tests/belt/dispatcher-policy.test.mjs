// Pins the dispatcher behaviours Sol's collector relies on (SOL-CONTROLLER-STATUS claude_pending):
//  1. `_fixture` metadata is NOT stripped by default → a production artifact carrying it fails the adapter schema.
//  2. Every stage mapping parses as PASS under Sol's mappedCompensatingChecks() (same reader the collector uses).
//  3. Fail-closed: the dispatcher reports required_checks > 0 for every stage and a positive fixture emits them all.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateArtifact, loadStageMap, LANE_ROOT } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { mappedCompensatingChecks } from '../../tools/wrap-post-validation-receipt.mjs';

const map = loadStageMap();

test('fixture metadata is not stripped unless the caller opts in', async () => {
  const abs = resolve(LANE_ROOT, 'tools/belt/fixtures/04.cards/synthetic-positive.json');
  const artifact = JSON.parse(readFileSync(abs, 'utf8'));
  assert.ok('_fixture' in artifact, 'test fixture must carry _fixture');
  const { context } = loadFixtureContext(abs);
  const r = await validateArtifact({ stage_id: '04.cards', artifact, context });           // no strip flag
  assert.equal(r.checks.find(c => c.check_id === '04.SCHEMA')?.status, 'FAIL');
  const r2 = await validateArtifact({ stage_id: '04.cards', artifact, context: { ...context, strip_fixture_meta: true } });
  assert.equal(r2.status, 'PASS');
});

for (const [stage_id, st] of Object.entries(map.stages)) {
  test(`${stage_id}: mapping parses PASS under Sol's collector reader`, () => {
    const m = JSON.parse(readFileSync(resolve(LANE_ROOT, st.mapping), 'utf8'));
    const r = mappedCompensatingChecks(m, stage_id);
    assert.equal(r.status, 'PASS', r.validation_errors.join(' | '));
    assert.ok(r.check_ids.includes(`${st.prefix}.SCHEMA`), 'SCHEMA must be a mapped check');
  });
}

test('fail-closed: positive fixtures emit every mapped check', async () => {
  for (const [stage_id, st] of Object.entries(map.stages)) {
    const m = JSON.parse(readFileSync(resolve(LANE_ROOT, st.mapping), 'utf8'));
    const pos = (m.fixtures ?? []).find(f => f.expected_status === 'PASS');
    if (!pos) continue;
    const abs = resolve(LANE_ROOT, pos.path);
    const artifact = JSON.parse(readFileSync(abs, 'utf8'));
    const context = pos.context_path ? (await import('../../tools/belt/lib/fixture-context.mjs')).resolveContext(JSON.parse(readFileSync(resolve(LANE_ROOT, pos.context_path), 'utf8'))) : loadFixtureContext(abs).context;
    const r = await validateArtifact({ stage_id, artifact, context: { ...context, strip_fixture_meta: true } });
    assert.equal(r.status, 'PASS', `${stage_id} ${pos.path}: ${r.checks.filter(c => c.status !== 'PASS').map(c => c.check_id + '=' + c.status).join(',')}`);
    assert.ok(r.metrics.required_checks > 0, `${stage_id}: required_checks not computed`);
    assert.equal(r.metrics.required_checks_missing, 0);
  }
});
