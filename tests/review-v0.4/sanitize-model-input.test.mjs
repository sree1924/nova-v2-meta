import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOfficialFact, sanitizeModelInput} from '../../tools/sanitize-model-input.mjs';

// Synthetic interface fixtures, not accepted driving facts or source evidence.
const hash = 'a'.repeat(64);
const sourceRegistry = {sources: [{ref: 'fixture-source', sha256: hash, accepted: true, current: true,
  liveness_receipt_ref: 'fixture-liveness', accepted_pages: ['fixture-page']}]};
const bound = {value: 7, status: 'verified', source_page: 'fixture-page', source_ref: 'fixture-source',
  source_snapshot_sha256: hash, liveness_receipt_ref: 'fixture-liveness'};

test('legacy passing-percent hint and verify sibling never enter the model view', () => {
  const result = sanitizeModelInput({scope: {jurisdiction: 'candidate', exam_facts: {
    passing_percent: 70, passing_percent_status: '(verify)', question_count: null}}});
  assert.equal(result.status, 'HOLD');
  assert.equal(result.model_input.exam_facts.passing_percent.value, null);
  assert.equal(JSON.stringify(result.model_input).includes('70'), false);
});
test('verified-looking wrapped value without page evidence remains unknown', () => {
  assert.equal(normalizeOfficialFact({...bound, source_page: null}, null, sourceRegistry).value, null);
});
test('only an accepted current source/page binding preserves a typed value', () => {
  assert.equal(normalizeOfficialFact(bound, null, sourceRegistry).value, 7);
  assert.equal(normalizeOfficialFact(bound, null, {sources: []}).value, null);
});
test('verify in any supplied status wins over a verified-looking wrapper', () => {
  assert.equal(normalizeOfficialFact(bound, '(verify)', sourceRegistry).value, null);
});
test('a raw candidate jurisdiction does not confirm selected-state scope', () => {
  const result = sanitizeModelInput({scope: {jurisdiction: 'candidate', language: 'candidate-language'}});
  assert.equal(result.model_input.scope.jurisdiction, null);
  assert.deepEqual(result.hold_reasons, ['state_selection_pending']);
});
test('mastery threshold is explicitly product policy and never copied from an exam hint', () => {
  const result = sanitizeModelInput({scope: {exam_facts: {passing_percent: 70}}}, {learningPolicy: {
    kind: 'product_policy', ref: 'fixture-learning-loop', sha256: hash, accepted: true, quiz_threshold_pct: 61}});
  assert.equal(result.model_input.scoring_policy.quiz_threshold_pct, 61);
  assert.equal(result.model_input.scoring_policy.is_official_exam_fact, false);
  assert.equal(result.model_input.exam_facts.passing_percent.value, null);
});
