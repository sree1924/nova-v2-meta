// node --test tests/belt/06-exam-bank.test.mjs — local deterministic tests for the 06.exam_bank adapter + checks.
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
const STAGE = '06.exam_bank';
const FX = 'tools/belt/fixtures/06.exam_bank';
const mapping = J('schemas-strict/06-exambank.mapping.json');
const ctxSyn = J(`${FX}/context-synthetic.json`);
const base = () => { const a = J(`${FX}/synthetic-pass.json`); delete a._fixture; return a; };
const run = (artifact, context = ctxSyn) => validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } });
const st = (res, id) => res.checks.find(c => c.check_id === id)?.status;

test('adapter passes strict-lint with no soft-keyword exemptions', () => {
  const r = lintSchema(J('schemas-strict/06-exambank.schema.json'));
  assert.equal(r.ok, true, JSON.stringify(r.violations));
  assert.equal(r.soft_compensated.length, 0);
});

test('every mapping fixture yields its expected status', async () => {
  for (const f of mapping.fixtures) {
    const res = await run(J(f.path), J(f.context_path));
    assert.equal(res.status, f.expected_status, `${f.path}: ${res.checks.filter(c => c.status !== 'PASS').map(c => c.check_id).join(',')}`);
  }
});

test('result names every mapped compensating check (no aggregate-only acceptance)', async () => {
  const res = await run(base());
  const ids = new Set(res.checks.map(c => c.check_id));
  for (const id of mapping.compensating_checks) assert.ok(ids.has(id), `missing ${id}`);
  assert.equal(res.status, 'PASS');
  assert.ok(res.checks.every(c => c.status === 'PASS'));
});

test('source-debt numeral leak: "Full 30-Question Practice Test" with n_questions unknown -> FAIL', async () => {
  const res = await run(J(`${FX}/synthetic-neg-source-debt-numeral.json`));
  assert.equal(res.status, 'FAIL');
  assert.equal(st(res, '06.FORM_NUMERALS'), 'FAIL');
  assert.equal(st(res, '06.SCHEMA'), 'PASS');
});

test('unknown official status carrying a numeric hint -> FAIL', async () => {
  const a = base(); a.practice_forms[0].official_mirror.n_questions.value = 30;
  assert.equal(st(await run(a), '06.OFFICIAL_MIRROR'), 'FAIL');
});

test('verified mirror needs page + view confirmation; declared_count must equal n_questions', async () => {
  const a = base();
  const om = a.practice_forms[0].official_mirror;
  Object.assign(om, { status: 'verified', passing_unit: 'correct_count' });
  om.n_questions = { value: 3, status: 'verified', source_page: 'p.4' };
  om.passing = { value: 2, status: 'verified', source_page: 'p.4' };
  assert.equal(st(await run(a), '06.OFFICIAL_MIRROR'), 'HOLD', 'no exam_facts_view -> HOLD');
  const view = { by_form: { 'form-a': { n_questions: { value: 3, status: 'verified' }, passing: { value: 2, status: 'verified' } } } };
  assert.equal(st(await run(a, { ...ctxSyn, exam_facts_view: view }), '06.OFFICIAL_MIRROR'), 'PASS');
  om.n_questions.value = 4;
  assert.equal(st(await run(a, { ...ctxSyn, exam_facts_view: view }), '06.OFFICIAL_MIRROR'), 'FAIL');
});

test('declared_count != item_ids.length -> FAIL (rule 15)', async () => {
  const a = base(); a.practice_forms[1].declared_count = 4;
  assert.equal(st(await run(a), '06.DECLARED_COUNT'), 'FAIL');
});

test('>20% overlap without overlap_note -> FAIL; false "no overlap" claim -> FAIL (rule 5)', async () => {
  const a = base(); a.practice_forms[0].overlap_note = null;
  assert.equal(st(await run(a), '06.FORM_OVERLAP'), 'FAIL');
  const b = base(); b.practice_forms[0].overlap_note = 'Non-overlapping with Practice Set B.';
  assert.equal(st(await run(b), '06.FORM_OVERLAP'), 'FAIL');
  const c = base(); c.practice_forms[0].overlap_note = 'This practice set shares 2 reused items with Practice Set B.';
  assert.equal(st(await run(c), '06.FORM_OVERLAP'), 'FAIL', 'count claim asserted against the bank');
});

test('item clone (same correct+distractors+rationale, different stem) -> FAIL (rule 6)', async () => {
  const a = base(); const clone = structuredClone(a.items[0]); clone.item_id = 's07'; clone.stem = 'A reworded stem about permit hours?';
  a.items.push(clone); a.module_quizzes[0].item_ids.push('s07');
  assert.equal(st(await run(a), '06.ITEM_CLONE'), 'FAIL');
});

test('duplicate stem with the same answer -> FAIL; shared stem with different answers allowed', async () => {
  const a = base(); a.items[1].stem = a.items[0].stem; a.items[1].options[0].text = '40 hours';
  a.items[0].options.find(o => o.key === 'B').text = '40 hours';
  assert.equal(st(await run(a), '06.DUPLICATE_STEM'), 'FAIL');
  const b = base(); b.items[1].stem = b.items[0].stem;
  assert.equal(st(await run(b), '06.DUPLICATE_STEM'), 'PASS');
});

test('needs_review item or miscount -> FAIL (rule 1); unresolved self-flag -> FAIL', async () => {
  const a = base(); a.items[2].needs_review = true; a.needs_review_count = 1;
  assert.equal(st(await run(a), '06.NEEDS_REVIEW_ZERO'), 'FAIL');
  const b = base(); b.needs_review_count = 2;
  assert.equal(st(await run(b), '06.NEEDS_REVIEW_ZERO'), 'FAIL');
  const c = base(); c.items[0].self_flagged = true; c.self_flagged_distractors.push({ item_id: 's01', option_key: 'D', why_possibly_correct: 'synthetic' });
  assert.equal(st(await run(c), '06.SELF_FLAGGED_RESOLVED'), 'FAIL');
});

test('answer/rationale disagreement -> FAIL', async () => {
  const a = base(); a.items[0].correct_rationale = 'The correct answer is C.';
  assert.equal(st(await run(a), '06.ANSWER_RATIONALE_AGREEMENT'), 'FAIL');
  const b = base(); b.items[0].options.find(o => o.key === 'A').rationale = '20 hours is correct for night driving.';
  assert.equal(st(await run(b), '06.ANSWER_RATIONALE_AGREEMENT'), 'FAIL');
});

test('banned claims and missing practice label -> FAIL', async () => {
  const a = base(); a.items[3].stem = 'This is a leaked question from the actual exam: how close to a hydrant?';
  assert.equal(st(await run(a), '06.BANNED_CLAIMS'), 'FAIL');
  const b = base(); b.practice_forms[0].title = 'Set A';
  assert.equal(st(await run(b), '06.PRACTICE_LABEL'), 'FAIL');
});

test('distractor count != 3 and missing distractor_source -> FAIL', async () => {
  const a = base(); a.items[0].options.pop();
  assert.equal(st(await run(a), '06.OPTIONS_SHAPE'), 'FAIL');
  const b = base(); b.items[0].distractor_source = ['x', 'y'];
  assert.equal(st(await run(b), '06.DISTRACTOR_SOURCE'), 'FAIL');
});

test('fewer than 2 forms -> FAIL; derived item in a form without disposition -> FAIL', async () => {
  const a = base(); a.practice_forms.pop();
  assert.equal(st(await run(a), '06.FORM_COUNT'), 'FAIL');
  const b = base(); b.practice_forms[0].item_ids.push('s06'); b.practice_forms[0].declared_count = 4;
  assert.equal(st(await run(b), '06.DERIVED_PLACEMENT'), 'FAIL');
});

test('item without page and without page_debt -> FAIL; with page_debt -> HOLD', async () => {
  const a = base(); a.items[0].source_ref.pdf_page = null; a.items[0].source_ref.printed_page = null;
  assert.equal(st(await run(a), '06.PAGE_OR_DEBT'), 'FAIL');
  a.page_debt.push({ item_id: 's01', reason: '(verify) page not located', route_to: '15' });
  const res = await run(a);
  assert.equal(st(res, '06.PAGE_OR_DEBT'), 'HOLD');
  assert.equal(res.status, 'HOLD');
});

test('unanchored numeral in an item, and missing context -> HOLD (never guess)', async () => {
  const a = base(); a.items[1].correct_rationale = 'A licensed adult supervisor aged 21 is required in the front seat.';
  assert.equal(st(await run(a), '06.ITEM_NUMERALS'), 'FAIL');
  const res = await run(base(), { strip_fixture_meta: true });
  for (const id of ['06.INPUT_MANIFEST', '06.ITEM_NUMERALS', '06.SCORING_POLICY', '06.MODULE_QUIZ_COVERAGE', '06.ITEM_BINDING']) assert.equal(st(res, id), 'HOLD', id);
  assert.equal(res.status, 'HOLD');
});

test('V1 projection FAILs for its recorded reasons (fixture/reference, not a DMV result)', async () => {
  const fx = J(`${FX}/v1-projected.json`);
  assert.equal(fx._fixture.kind, 'v1_projected');
  const res = await run(fx, J(`${FX}/context-v1.json`));
  assert.equal(st(res, '06.SCHEMA'), 'PASS');
  for (const id of ['06.NEEDS_REVIEW_ZERO', '06.SELF_FLAGGED_RESOLVED', '06.ITEM_BINDING', '06.FORM_OVERLAP']) assert.equal(st(res, id), 'FAIL', id);
  assert.equal(st(res, '06.PAGE_OR_DEBT'), 'HOLD');
  assert.equal(res.status, 'FAIL');
});

test('strip_fixture_meta:false rejects an unexpected _fixture key', async () => {
  const res = await validateArtifact({ stage_id: STAGE, artifact: J(`${FX}/synthetic-pass.json`), context: { ...ctxSyn, strip_fixture_meta: false } });
  assert.equal(st(res, '06.SCHEMA'), 'FAIL');
});
