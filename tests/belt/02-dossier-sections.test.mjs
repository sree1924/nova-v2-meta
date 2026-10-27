// node --test tests/belt/02-dossier-sections.test.mjs
// Stage 02.dossier_sections: mapping fixtures yield their expected status; negatives fail on the targeted check;
// V1 projection is deterministic and its merge reproduces the V1 dossier bytes. Local deterministic only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { validateArtifact, LANE_ROOT } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { sha256File, canonicalJson } from '../../tools/belt/lib/hash.mjs';
import { run, mergeSections, mergeEnvelopes, CONTRACT_MAX_SECTION_CHARS } from '../../tools/belt/checks/02-dossier-sections.mjs';
import { projectV1, V1_SOURCE } from '../../tools/belt/project/02-dossier-sections.mjs';

const STAGE = '02.dossier_sections';
const FIX = join(LANE_ROOT, 'tools/belt/fixtures', STAGE);
const mapping = JSON.parse(readFileSync(join(LANE_ROOT, 'schemas-strict/02-sme-dossier-envelope.mapping.json'), 'utf8'));
const load = (name) => {
  const abs = join(FIX, `${name}.json`);
  const raw = JSON.parse(readFileSync(abs, 'utf8'));
  const { _fixture, ...artifact } = raw;
  return { raw, artifact, context: loadFixtureContext(abs).context };
};
const statusOf = (r, id) => (Array.isArray(r) ? r : r.checks).find(c => c.check_id === id)?.status;
const clone = (o) => structuredClone(o);
const cp = (s) => [...s].length;
const reseal = (a) => { a.merge.expected_merged_sha256 = mergeSections(a.sections).sha256; for (const s of a.sections) s.char_count = cp(s.markdown); return a; };

for (const fx of mapping.fixtures) {
  test(`fixture ${fx.path.split('/').pop()} -> ${fx.expected_status}`, async () => {
    const abs = join(LANE_ROOT, fx.path);
    const raw = JSON.parse(readFileSync(abs, 'utf8'));
    const { context } = loadFixtureContext(abs);
    const r = await validateArtifact({ stage_id: STAGE, artifact: raw, context: { ...context, strip_fixture_meta: true } });
    assert.equal(r.errors.length, 0, r.errors.join('; '));
    assert.equal(r.status, fx.expected_status, JSON.stringify(r.checks.filter(c => c.status !== 'PASS'), null, 1));
    for (const id of raw._fixture?.expected_failing_checks ?? []) assert.equal(statusOf(r, id), 'FAIL', `${id} should FAIL`);
  });
}

test('V1 projection is deterministic and equals the committed fixture', () => {
  const md = readFileSync(V1_SOURCE, 'utf8');
  const a = projectV1(md, { sourceSha256: sha256File(V1_SOURCE) });
  const b = projectV1(md, { sourceSha256: sha256File(V1_SOURCE) });
  assert.equal(canonicalJson(a), canonicalJson(b));
  assert.equal(canonicalJson(a), canonicalJson(JSON.parse(readFileSync(join(FIX, 'v1-projected.json'), 'utf8'))));
});

test('V1 merge of all chunks reproduces the V1 02-blueprint.md bytes exactly', () => {
  const { artifact } = load('v1-projected');
  const m = mergeSections(artifact.sections);
  assert.equal(m.sha256, sha256File(V1_SOURCE));
  assert.ok(artifact.sections.every(s => cp(s.markdown) < CONTRACT_MAX_SECTION_CHARS));
  assert.ok(artifact.sections.some(s => / \[part 2\]$/.test(s.heading)), 'the oversized Gov-B chunk is re-split');
});

test('V1 honest findings: C2 missing, [S5] unregistered, VD-4 tier null, lineage HOLD', () => {
  const { artifact, context } = load('v1-projected');
  const r = run(artifact, context);
  assert.equal(statusOf(r, '02.SCOPE_COMPLETENESS'), 'FAIL');
  assert.match(r.find(c => c.check_id === '02.ANCHORS_REGISTERED').evidence, /\[S5\]->S5/);
  assert.match(r.find(c => c.check_id === '02.DEBT_TYPED').evidence, /VD-4\.source_tier_required is null/);
  assert.equal(statusOf(r, '02.LINEAGE'), 'HOLD');
  assert.equal(statusOf(r, '02.NUMERAL_LEAK'), 'PASS', 'V1 withheld 993k / 60–90 do not appear in learner-facing chunks');
});

test('unknown official fact with a number FAILs; null value PASSes', () => {
  const { artifact, context } = load('synthetic-positive');
  assert.equal(statusOf(run(artifact, context), '02.EXAM_FACT_STATUS'), 'PASS');
  const bad = clone(artifact); bad.exam_facts.passing_standard = { value: 80, status: 'unknown', source_page: null };
  assert.equal(statusOf(run(bad, context), '02.EXAM_FACT_STATUS'), 'FAIL');
  const ver = clone(artifact); ver.exam_facts.edition = { value: '2026', status: 'verified', source_page: 'NOT-REGISTERED#p.9' };
  assert.equal(statusOf(run(ver, context), '02.EXAM_FACT_STATUS'), 'FAIL');
  const cnt = clone(artifact); cnt.exam_facts.n_questions.value = 0;
  assert.equal(statusOf(run(cnt, context), '02.EXAM_FACT_STATUS'), 'FAIL', 'parent n_questions minimum 1 restored');
});

test('authored numeric exam fact is withheld from learner-facing prose', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact); a.exam_facts.time_limit = { value: 25, status: 'authored', source_page: null };
  assert.equal(statusOf(run(a, context), '02.NUMERAL_LEAK'), 'FAIL', '"25 items" in A now collides with an authored 25');
});

test('a knowledge chunk cannot dodge the numeral guard by declaring learner_facing:false', () => {
  const { raw } = load('synthetic-negative-numeral-leak');
  const { _fixture, ...a } = clone(raw);
  a.sections[2].learner_facing = false;
  const r = run(a, load('synthetic-negative-numeral-leak').context);
  assert.equal(statusOf(r, '02.NUMERAL_LEAK'), 'FAIL');
});

test('oversized chunk FAILs the bound even when the envelope declares a larger cap', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact);
  a.section_char_limit = 50000;
  a.sections[1].markdown = '## B — Audience (SYNTHETIC)\n' + 'plain words. '.repeat(1000) + '\n';
  reseal(a);
  const r = run(a, context);
  assert.equal(statusOf(r, '02.SECTION_BOUNDS'), 'FAIL');
  assert.match(r.find(c => c.check_id === '02.SECTION_BOUNDS').evidence, /exceeds contract max 12000/);
});

test('(verify) needs an OPEN debt id on the same line', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact);
  a.sections[1].markdown = '## B — Audience (SYNTHETIC)\nAbout 40 thousand candidates sit yearly (verify).\n';
  reseal(a);
  assert.equal(statusOf(run(a, context), '02.FACT_LINES_CITED'), 'FAIL');
  a.sections[1].markdown = '## B — Audience (SYNTHETIC)\nAbout 40 thousand candidates sit yearly (verify — SD-2).\n';
  reseal(a);
  assert.equal(statusOf(run(a, context), '02.FACT_LINES_CITED'), 'PASS');
  a.verification_debt[1].resolution_artifact_ref = 'resolved.json';
  assert.equal(statusOf(run(a, context), '02.FACT_LINES_CITED'), 'FAIL', 'a resolved debt no longer licenses an uncited numeral');
});

test('list lines inherit the anchor of their parent (nearest non-list) line in the same block only', () => {
  const { artifact, context } = load('synthetic-positive');
  const a = clone(artifact);
  a.sections[2].markdown = '## C — Road rules (SYNTHETIC)\n**F1.** Stop fully at the sign [P2].\n- within 3 feet of the line\n\n- 5 seconds minimum\n**§ high_yield (ranked):** 1) F1 full stop.\n';
  reseal(a);
  const r = run(a, context);
  assert.equal(statusOf(r, '02.FACT_LINES_CITED'), 'FAIL');
  assert.match(r.find(c => c.check_id === '02.FACT_LINES_CITED').evidence, /1\/3 fact-bearing lines uncited: C\.03:L5$/);
});

test('partial chunks merge deterministically across envelopes; duplicates and gaps are rejected', () => {
  const { artifact } = load('synthetic-positive');
  const part = (ids, idx) => ({ ...clone(artifact), envelope_scope: { kind: 'partial_chunk', assigned_section_ids: ids, chunk_index: idx, chunk_total: 3 }, sections: artifact.sections.filter(s => ids.includes(s.section_id)) });
  const p1 = part(['A', 'B', 'C'], 1), p2 = part(['C2', 'D', 'E'], 2), p3 = part(['E2', 'F', 'G'], 3);
  const m = mergeEnvelopes([p3, p1, p2]);
  assert.equal(m.ok, true, m.errors.join('; '));
  assert.equal(m.sha256, artifact.merge.expected_merged_sha256);
  const r = run(p1, { sibling_envelopes: [p2, p3] });
  assert.equal(statusOf(r, '02.SCOPE_COMPLETENESS'), 'PASS');
  assert.equal(statusOf(r, '02.MERGE_DETERMINISTIC'), 'PASS');
  assert.equal(mergeEnvelopes([p1, p2]).ok, false, 'missing E2/F/G');
  assert.match(mergeEnvelopes([p1, p1, p2, p3]).errors.join(' '), /duplicate chunk_id/);
  const conflict = clone(p2); conflict.exam_facts.n_questions.value = 30;
  assert.match(mergeEnvelopes([p1, conflict, p3]).errors.join(' '), /conflicting exam_facts\.n_questions/);
  const wrongScope = clone(p1); wrongScope.envelope_scope.assigned_section_ids = ['A', 'B'];
  assert.equal(statusOf(run(wrongScope, {}), '02.SCOPE_COMPLETENESS'), 'FAIL', 'a chunk carrying an unassigned section');
});

test('volatile corpus must emit BlockedProbe; legal debt needs an ExternalReviewRequest; G matrix is complete', () => {
  const { artifact, context } = load('synthetic-positive');
  const v = clone(artifact); v.corpus_stability = { assessment: 'volatile_gt_1_per_year', blocked_probe: false, reason: 'rewritten twice a year' };
  assert.equal(statusOf(run(v, context), '02.CORPUS_STABILITY'), 'FAIL');
  const l = clone(artifact); l.verification_debt[0].blocker_kind = 'legal_review_required';
  assert.equal(statusOf(run(l, context), '02.EXTERNAL_REVIEW'), 'FAIL');
  l.external_review_requests = [{ request_id: 'ER-1', claim_ids: ['SD-1'], review_kind: 'legal', source_tier_checked: 'official', why_human_required: 'statute interpretation', blocking: true }];
  assert.equal(statusOf(run(l, context), '02.EXTERNAL_REVIEW'), 'PASS');
  const g = clone(artifact); g.g_matrix.pop();
  assert.equal(statusOf(run(g, context), '02.G_MATRIX'), 'FAIL');
  const d = clone(artifact); d.verification_debt[1].expires_by = 'next run';
  assert.equal(statusOf(run(d, context), '02.DEBT_TYPED'), 'FAIL');
  const n = clone(artifact); n.needs_dedicated_surface = { status: 'unknown', items: [] };
  assert.equal(statusOf(run(n, context), '02.DEDICATED_SURFACE'), 'FAIL');
});

test('run() is pure: the artifact and context are not mutated', () => {
  const { artifact, context } = load('synthetic-positive');
  const a0 = canonicalJson(artifact), c0 = canonicalJson(context);
  run(artifact, context);
  assert.equal(canonicalJson(artifact), a0);
  assert.equal(canonicalJson(context), c0);
});
