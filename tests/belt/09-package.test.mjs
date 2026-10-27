// node --test tests/belt/09-package.test.mjs
// Stage 09.package: every mapping-listed fixture yields its expected status, and each negative fails on the
// specific compensating check it targets. Local deterministic only (no model, no endpoint, no network).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, LANE_ROOT } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { run as runChecks } from '../../tools/belt/checks/09-package.mjs';

const STAGE = '09.package';
const FIX = join(LANE_ROOT, 'tools/belt/fixtures/09.package');
const mapping = JSON.parse(readFileSync(join(LANE_ROOT, 'schemas-strict/09-product-package.mapping.json'), 'utf8'));

async function validateFixture(name) {
  const abs = join(FIX, `${name}.json`);
  const artifact = JSON.parse(readFileSync(abs, 'utf8'));
  const { context } = loadFixtureContext(abs);
  return { artifact, context, result: await validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } }) };
}
const statusOf = (r, id) => r.checks.find(c => c.check_id === id)?.status;

for (const fx of mapping.fixtures) {
  test(`fixture ${fx.path.split('/').pop()} → ${fx.expected_status}`, async () => {
    const abs = join(LANE_ROOT, fx.path);
    const artifact = JSON.parse(readFileSync(abs, 'utf8'));
    const { context } = loadFixtureContext(abs);
    const r = await validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } });
    assert.equal(r.errors.length, 0, r.errors.join('; '));
    assert.equal(r.status, fx.expected_status, JSON.stringify(r.checks.filter(c => c.status !== 'PASS'), null, 1));
  });
}

test('preview_ready represented honestly: legacy status blocked + scoped reason, pilot_status preview_ready, every check PASS', async () => {
  const { artifact, result } = await validateFixture('synthetic-preview-ready');
  assert.equal(artifact.status, 'blocked');
  assert.equal(artifact.pilot_status, 'preview_ready');
  assert.equal(artifact.status_scope, 'content_package');
  assert.match(artifact.status_reason, /deferred/);
  assert.equal(result.status, 'PASS');
  assert.ok(result.checks.every(c => c.status === 'PASS'));
  assert.equal(statusOf(result, '09.LEGACY_STATUS_HONEST'), 'PASS');
  assert.equal(statusOf(result, '09.UISPEC_RECEIPTS'), 'PASS');
});

test('inactive audio provider rejected: openai_audio_api while role 20 inactive', async () => {
  const { result } = await validateFixture('synthetic-neg-audio-active-role20-inactive');
  assert.equal(result.status, 'FAIL');
  assert.equal(statusOf(result, '09.SCHEMA'), 'PASS', 'the adapter accepts the parent value so the check can reject it with evidence');
  const c = result.checks.find(x => x.check_id === '09.AUDIO_INACTIVE_ROLE20');
  assert.equal(c.status, 'FAIL');
  assert.match(c.evidence, /provider=openai_audio_api/);
});

test('preview_ready without UiSpec receipts → FAIL on 09.UISPEC_RECEIPTS', async () => {
  const { result } = await validateFixture('synthetic-neg-preview-ready-no-uispec-receipts');
  assert.equal(statusOf(result, '09.UISPEC_RECEIPTS'), 'FAIL');
  assert.equal(result.status, 'FAIL');
});

test('legacy status shipped / empty reason rejected', async () => {
  const a = await validateFixture('synthetic-neg-legacy-shipped');
  assert.equal(statusOf(a.result, '09.LEGACY_STATUS_HONEST'), 'FAIL');
  const b = await validateFixture('synthetic-neg-empty-status-reason');
  assert.equal(statusOf(b.result, '09.LEGACY_STATUS_HONEST'), 'FAIL');
});

test('mismatched candidate hash rejected', async () => {
  const { result } = await validateFixture('synthetic-neg-candidate-mismatch');
  assert.equal(statusOf(result, '09.CANDIDATE_IN_MANIFEST'), 'FAIL');
  assert.equal(statusOf(result, '09.QA_REPORTS_BINDING'), 'FAIL');
});

test('fabricated count rejected by recomputation', async () => {
  const { result } = await validateFixture('synthetic-neg-count-fabricated');
  const c = result.checks.find(x => x.check_id === '09.COUNTS_RECOMPUTED');
  assert.equal(c.status, 'FAIL');
  assert.match(c.evidence, /card_count: package=5 recomputed=4/);
});

test('orphans block preview_ready but an honestly blocked package with the same orphan passes', async () => {
  const neg = await validateFixture('synthetic-neg-orphans-preview-ready');
  assert.equal(statusOf(neg.result, '09.INTEGRITY_RECOMPUTED'), 'PASS', 'orphans are reported truthfully');
  assert.equal(statusOf(neg.result, '09.INTEGRITY_ZERO_FOR_PREVIEW'), 'FAIL');
  const pos = await validateFixture('synthetic-blocked-orphans-honest');
  assert.equal(pos.result.status, 'PASS');
});

test('auth/checkout/deployment claims and source-debt numerals rejected', async () => {
  const a = await validateFixture('synthetic-neg-deploy-auth-claims');
  assert.equal(statusOf(a.result, '09.NO_DEPLOY_AUTH_CLAIMS'), 'FAIL');
  const b = await validateFixture('synthetic-neg-source-debt-numeral');
  assert.equal(statusOf(b.result, '09.SOURCE_DEBT_LEAK'), 'FAIL');
  assert.equal(statusOf(b.result, '09.OFFICIAL_NUMBERS'), 'FAIL');
});

test('status_scope application readiness rejected (schema + check)', async () => {
  const { result } = await validateFixture('synthetic-neg-application-scope');
  assert.equal(statusOf(result, '09.SCHEMA'), 'FAIL');
  assert.equal(statusOf(result, '09.STATUS_SCOPE'), 'FAIL');
});

test('no context → HOLD, never PASS; nothing guessed', async () => {
  const { result } = await validateFixture('synthetic-hold-no-context');
  assert.equal(result.status, 'HOLD');
  for (const id of ['09.COUNTS_RECOMPUTED', '09.AUDIO_INACTIVE_ROLE20', '09.CANDIDATE_IN_MANIFEST', '09.MEDIA_DISPOSITION_BINDING', '09.UISPEC_RECEIPTS']) assert.equal(statusOf(result, id), 'HOLD', id);
  assert.ok(!result.checks.some(c => c.status === 'FAIL'));
});

test('V1 raw projection is a legitimate FAIL (shipped + openai_audio_api + stale counts + unpaged numbers)', async () => {
  const { artifact, result } = await validateFixture('v1-projected-raw');
  assert.equal(artifact.audio_teacher_loop.provider, 'openai_audio_api');
  assert.equal(result.status, 'FAIL');
  for (const id of ['09.LEGACY_STATUS_HONEST', '09.AUDIO_INACTIVE_ROLE20', '09.COUNTS_RECOMPUTED', '09.OFFICIAL_NUMBERS', '09.UISPEC_RECEIPTS', '09.CANDIDATE_IN_MANIFEST']) assert.equal(statusOf(result, id), 'FAIL', id);
  assert.match(JSON.stringify(artifact._fixture), /REAL rendered audio/);
});

test('V1 normalized projection passes as an honest blocked package and records V1 audio', async () => {
  const { artifact, result } = await validateFixture('v1-projected-normalized');
  assert.equal(result.status, 'PASS', JSON.stringify(result.checks.filter(c => c.status !== 'PASS')));
  assert.equal(artifact.pilot_status, 'blocked');
  assert.equal(artifact.audio_teacher_loop.provider, 'none_text_only_pilot');
  assert.ok(artifact._fixture.audio_evidence.audio_manifest.sha256);
  assert.equal(artifact.contents.card_count, 147);
});

test('checks are pure and HOLD on missing media disposition (direct call)', () => {
  const art = JSON.parse(readFileSync(join(FIX, 'synthetic-neg-audio-active-role20-inactive.json'), 'utf8'));
  delete art._fixture;
  const out = runChecks(art, {});
  assert.equal(out.find(c => c.check_id === '09.AUDIO_INACTIVE_ROLE20').status, 'HOLD');
  const out2 = runChecks(art, { media_disposition: { inactive_roles: ['20'] } });
  assert.equal(out2.find(c => c.check_id === '09.AUDIO_INACTIVE_ROLE20').status, 'FAIL');
  const out3 = runChecks(art, { media_disposition: { inactive_roles: [] } });
  assert.equal(out3.find(c => c.check_id === '09.AUDIO_INACTIVE_ROLE20').status, 'PASS');
});
