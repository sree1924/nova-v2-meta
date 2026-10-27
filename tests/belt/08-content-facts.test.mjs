// node --test tests/belt/08-content-facts.test.mjs — local deterministic tests for the 08.content_facts adapter + checks.
// No model/endpoint call; a PASS here is local validation only, never provider acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../../tools/belt/post-validate.mjs';
import { lintSchema } from '../../tools/belt/strict-lint.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const STAGE = '08.content_facts';
const FX = 'tools/belt/fixtures/08.content_facts';
const mapping = J('schemas-strict/08-fact-report.mapping.json');
const ctxSyn = J(`${FX}/context-synthetic.json`);
const base = () => { const a = J(`${FX}/synthetic-pass.json`); delete a._fixture; return a; };
const run = (artifact, context = ctxSyn) => validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } });
const st = (res, id) => res.checks.find(c => c.check_id === id)?.status;

test('adapter passes strict-lint with no soft-keyword exemptions', () => {
  const r = lintSchema(J('schemas-strict/08-fact-report.schema.json'));
  assert.equal(r.ok, true, JSON.stringify(r.violations));
  assert.equal(r.soft_compensated.length, 0);
});

test('every mapping fixture yields its expected status', async () => {
  for (const f of mapping.fixtures) {
    const res = await run(J(f.path), J(f.context_path));
    assert.equal(res.status, f.expected_status, `${f.path}: ${res.checks.filter(c => c.status !== 'PASS').map(c => c.check_id).join(',')}`);
  }
});

test('result names every mapped compensating check; synthetic report PASSes all', async () => {
  const res = await run(base());
  const ids = new Set(res.checks.map(c => c.check_id));
  for (const id of mapping.compensating_checks) assert.ok(ids.has(id), `missing ${id}`);
  assert.equal(res.status, 'PASS');
});

test('mismatched candidate hash -> FAIL; manifest absent -> HOLD', async () => {
  assert.equal(st(await run(J(`${FX}/synthetic-neg-candidate-mismatch.json`)), '08.CANDIDATE_ECHO'), 'FAIL');
  const { candidate_manifest, ...noManifest } = ctxSyn;
  const res = await run(base(), noManifest);
  assert.equal(st(res, '08.CANDIDATE_ECHO'), 'HOLD');
  assert.equal(res.status, 'HOLD');
});

test('receipt age: no now_utc -> HOLD; stale receipt on a PASS report -> FAIL; on a HOLD report -> HOLD', async () => {
  const { now_utc, ...noClock } = ctxSyn;
  assert.equal(st(await run(base(), noClock), '08.LIVENESS_AGE'), 'HOLD');
  const late = { ...ctxSyn, now_utc: '2026-10-27T09:00:00Z' };
  assert.equal(st(await run(base(), late), '08.LIVENESS_AGE'), 'FAIL');
  const h = base(); h.verdict = 'HOLD'; h.verification_debt.push({ claim_id: 'claim.syn.001', blocker_kind: 'stale_receipt', detail: 'refetch', source_tier_required: 'official', owner_worker: '15', ship_blocking: true });
  assert.equal(st(await run(h, late), '08.LIVENESS_AGE'), 'HOLD');
  const f = base(); f.source_liveness[0].retrieved_at = '2026-10-26T13:00:00Z';
  assert.equal(st(await run(f), '08.LIVENESS_AGE'), 'FAIL', 'receipt dated after now_utc');
});

test('cited source without receipt / with (verify) effective date cannot PASS', async () => {
  const a = base(); a.claim_tiers[0].source_ref = 'src:examplia:other:002';
  assert.equal(st(await run(a), '08.LIVENESS_COVERAGE'), 'FAIL');
  const b = base(); b.source_liveness[0].effective_date = '(verify)';
  const rb = await run(b);
  assert.equal(st(rb, '08.LIVENESS_RECEIPT_SHAPE'), 'FAIL', 'contract allOf: PASS receipt needs YYYY-MM-DD');
  assert.equal(st(rb, '08.LIVENESS_COVERAGE'), 'FAIL');
  const c = base(); c.source_liveness[0].effective_date = null; c.source_liveness[0].status = 'VERIFICATION_DEBT';
  const accepted = { ...ctxSyn, accepted_dispositions: [{ source_ref: 'src:examplia:handbook:001', kind: 'effective_date_not_applicable', ref: 'synthetic/disposition.json' }] };
  assert.equal(st(await run(c, accepted), '08.LIVENESS_COVERAGE'), 'FAIL', 'VERIFICATION_DEBT receipt still blocks PASS');
});

test('honest HOLD on undated effective date (policy HOLD)', async () => {
  const res = await run(J(`${FX}/synthetic-hold-undated-effective-date.json`));
  assert.equal(st(res, '08.LIVENESS_COVERAGE'), 'HOLD');
  assert.equal(res.status, 'HOLD');
});

test('independence: prompt-template author as auditor -> FAIL; lineage absent -> HOLD; unqualified -> HOLD', async () => {
  assert.equal(st(await run(J(`${FX}/synthetic-neg-auditor-not-independent.json`)), '08.INDEPENDENCE'), 'FAIL');
  const { intervention_lineage, ...noLineage } = ctxSyn;
  assert.equal(st(await run(base(), noLineage), '08.INDEPENDENCE'), 'HOLD');
  const { auditor_qualification, ...noQual } = ctxSyn;
  assert.equal(st(await run(base(), noQual), '08.INDEPENDENCE'), 'HOLD');
  const sameSession = base(); sameSession.auditor.session_id = 'synthetic-session-author-1';
  assert.equal(st(await run(sameSession), '08.INDEPENDENCE'), 'FAIL', 'session that authored candidate bytes');
});

test('dissent: own or peer source-supported blocking finding blocks PASS', async () => {
  const res = await run(J(`${FX}/synthetic-neg-dissent-outvoted.json`));
  assert.equal(st(res, '08.DISSENT_NOT_OUTVOTED'), 'FAIL');
  const peer = { candidate_sha256: base().candidate_sha256, auditor: { provider_family: 'google' }, source_supported_blocking_findings: [{ finding_id: 'p1' }] };
  assert.equal(st(await run(base(), { ...ctxSyn, peer_reports: [peer] }), '08.DISSENT_NOT_OUTVOTED'), 'FAIL', 'other provider PASS cannot outvote');
});

test('parent allOf restored: PASS with visual or grouped-unit claim issue -> FAIL', async () => {
  const a = base(); a.visual_claim_issues.push({ media_slot_id: 'img.1', issue: 'unsupported_alt_claim', claim: 'x', severity: 'minor' });
  assert.equal(st(await run(a), '08.VERDICT_INVARIANT'), 'FAIL');
  const b = base(); b.grouped_unit_claim_issues.push({ unit_id: 'unit.a', issue: 'claim_ref_missing', claim: 'y', severity: 'minor' });
  assert.equal(st(await run(b), '08.VERDICT_INVARIANT'), 'FAIL');
});

test('tier-first: unverified-tier claim without debt -> FAIL; PASS with unrun required check -> FAIL', async () => {
  const a = base(); a.claim_tiers[1].tier = 'reputable';
  assert.equal(st(await run(a), '08.TIER_FIRST'), 'FAIL');
  const b = base(); b.required_checks_not_run = ['step5.card_equality'];
  assert.equal(st(await run(b), '08.REQUIRED_CHECKS_RUN'), 'FAIL');
});

test('flagged finding outside the candidate -> FAIL; external review without legal ref -> FAIL', async () => {
  const a = base(); a.verdict = 'FAIL';
  a.flagged.push({ check_id: 'step3', item_id: 's01', artifact_hash: '7'.repeat(64), source_page: '12', issue: 'x', evidence: 'y', severity: 'minor', owner_worker: '06', repair_route: 'route_to_producer' });
  assert.equal(st(await run(a), '08.FLAGGED_BINDING'), 'FAIL');
  const b = base(); b.verdict = 'HOLD';
  b.external_review_requests.push({ request_id: 'err.1', claim_ids: [], review_kind: 'legal', source_tier_checked: 'official', why_human_required: 'risky', legal_requirement_ref: '', blocking: true });
  assert.equal(st(await run(b), '08.EXTERNAL_REVIEW'), 'FAIL');
});

test('severity enum is blocking|major|minor ("high" rejected by the adapter)', async () => {
  const a = base(); a.verdict = 'FAIL';
  a.flagged.push({ check_id: 'step3', item_id: 's01', artifact_hash: base().input_hashes.exambank, source_page: '12', issue: 'x', evidence: 'y', severity: 'high', owner_worker: '06', repair_route: 'route_to_producer' });
  assert.equal(st(await run(a), '08.SCHEMA'), 'FAIL');
});

test('V1 projection (synthetic candidate/liveness) FAILs for its recorded reasons', async () => {
  const fx = J(`${FX}/v1-projected.json`);
  assert.equal(fx._fixture.kind, 'v1_projected_with_synthetic_candidate');
  const res = await run(fx, J(`${FX}/context-v1.json`));
  assert.equal(st(res, '08.SCHEMA'), 'PASS');
  for (const id of ['08.INPUT_MEMBERSHIP', '08.REQUIRED_CHECKS_RUN', '08.LIVENESS_COVERAGE', '08.LIVENESS_AGE', '08.INDEPENDENCE']) assert.equal(st(res, id), 'FAIL', id);
  assert.equal(res.status, 'FAIL');
});
