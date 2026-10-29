// node --test tests/belt/05-card-scripts.test.mjs
// Local deterministic tests of the 05.card_scripts strict adapter + compensating checks. No model/network calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { lintAll } from '../../tools/belt/strict-lint.mjs';
import { sha256File } from '../../tools/belt/lib/hash.mjs';
import { spokenTokens, practiceOnlyViolations, SPEAK_REQUEST_RE } from '../../tools/belt/lib/cards-sessions-common.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STAGE = '05.card_scripts';
const mapping = JSON.parse(readFileSync(join(ROOT, 'schemas-strict/05-voicescripts.mapping.json'), 'utf8'));
const load = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const run = async (rel) => {
  const abs = join(ROOT, rel);
  return validateArtifact({ stage_id: STAGE, artifact: load(rel), context: { ...loadFixtureContext(abs).context, strip_fixture_meta: true } });
};
const statusOf = (r, id) => r.checks.find(c => c.check_id === id)?.status;

test('adapter passes strict-lint and pins are current', () => {
  const lint = lintAll()['05-voicescripts.schema.json'];
  assert.equal(lint.ok, true, JSON.stringify(lint.violations));
  assert.equal(sha256File(join(ROOT, mapping.adapter_schema.path)), mapping.adapter_schema.sha256);
  assert.equal(sha256File(join('D:/nova', mapping.parent_schema.path)), mapping.parent_schema.sha256);
  assert.equal(mapping.parent_schema.sha256, 'dacca78436481539c7ca3bd5c7d95f67cc7cc99b16e4f6e0d7a4da19ca19b3ca');
});

test('adapter declares segment properties in the fixed order', () => {
  const s = load('schemas-strict/05-voicescripts.schema.json').properties.audio_scripts.items.properties.segments.anyOf[0];
  assert.deepEqual(Object.keys(s.properties), ['question', 'think_ref', 'recall_pause_ms', 'answer', 'teaching']);
  assert.deepEqual(s.required, ['question', 'think_ref', 'recall_pause_ms', 'answer', 'teaching']);
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

test('positive fixture exercises every check', async () => {
  const r = await run('tools/belt/fixtures/05.card_scripts/synthetic-positive.json');
  assert.deepEqual(r.checks.map(c => c.check_id).sort(), [...mapping.checks].sort());
});

test('answer / hook / segment mismatches are each rejected', async () => {
  assert.equal(statusOf(await run('tools/belt/fixtures/05.card_scripts/synthetic-neg-answer-mismatch.json'), '05.CARD_PARITY'), 'FAIL');
  assert.equal(statusOf(await run('tools/belt/fixtures/05.card_scripts/synthetic-neg-hook-mismatch.json'), '05.SELF_EQUALITY'), 'FAIL');
  assert.equal(statusOf(await run('tools/belt/fixtures/05.card_scripts/synthetic-neg-segment-order.json'), '05.SEGMENT_ORDER'), 'FAIL');
});

test('visual-sync accepts exact front/back/hook substrings from the current card', async () => {
  const rel = 'tools/belt/fixtures/05.card_scripts/synthetic-positive.json';
  const a = load(rel), context = loadFixtureContext(join(ROOT, rel)).context;
  const s = a.audio_scripts.find(s => !s.is_recap);
  const c = context.accepted_inputs.carddeck.decks.flatMap(d => d.cards).find(c => c.card_id === s.card_id);
  s.visual_sync = [c.front, c.back, c.memory_hook, c.back.slice(4, 30)].map(text_span => ({ text_span, timing_hint: 'highlight' }));
  const r = await validateArtifact({ stage_id: STAGE, artifact: a, context: { ...context, strip_fixture_meta: true } });
  assert.equal(statusOf(r, '05.CARD_PARITY'), 'PASS');
  assert.equal(r.checks.find(c => c.check_id === '05.CARD_PARITY').metrics.visual_sync, 0);
});

test('revised answer cannot retain a stale visual-sync answer span', async () => {
  const rel = 'tools/belt/fixtures/05.card_scripts/synthetic-positive.json';
  const a = load(rel), context = loadFixtureContext(join(ROOT, rel)).context;
  const s = a.audio_scripts.find(s => !s.is_recap);
  const c = context.accepted_inputs.carddeck.decks.flatMap(d => d.cards).find(c => c.card_id === s.card_id);
  const oldBack = c.back;
  c.back = 'Stop completely before the marked fixture boundary.';
  s.segments.answer.text = c.back;
  s.must_match_card_back = c.back;
  s.segments.teaching.text = `Remember: ${c.memory_hook}. ${c.back}`;
  assert.equal(s.visual_sync[0].text_span, oldBack);
  const r = await validateArtifact({ stage_id: STAGE, artifact: a, context: { ...context, strip_fixture_meta: true } });
  assert.equal(statusOf(r, '05.SELF_EQUALITY'), 'PASS');
  assert.equal(statusOf(r, '05.CARD_PARITY'), 'FAIL');
  assert.equal(r.checks.find(c => c.check_id === '05.CARD_PARITY').metrics.visual_sync, 1);
});

test('without the accepted deck, parity HOLDs (never PASS)', async () => {
  const r = await run('tools/belt/fixtures/05.card_scripts/synthetic-hold-no-context.json');
  for (const id of ['05.CARD_COVERAGE', '05.CARD_PARITY', '05.RECAP_PARITY', '05.TEACHING_FACT_IDS', '05.AUDIO_RENDER', '05.INPUT_BINDING']) assert.equal(statusOf(r, id), 'HOLD', id);
});

test('V1 split is lossless and the "official answer" FAIL flips only on the normalized fixture', async () => {
  const fx = load('tools/belt/fixtures/05.card_scripts/v1-projected.json');
  assert.equal(fx._fixture.source.sha256, sha256File(join('D:/nova', fx._fixture.source.path)));
  assert.deepEqual(fx._fixture.split.unsplit, []);
  assert.deepEqual(fx._fixture.split.answer_prefix_mismatch, []);
  const v1 = load('../runs/2026-06-11-citizenship/05-voicescripts.json');
  for (const s of fx.audio_scripts.filter(x => !x.is_recap)) {
    const orig = v1.audio_scripts.find(o => o.card_id === s.card_id).narration_text;
    const g = s.segments;
    const headTxt = `Question: ${g.question.text} ... ${fx.think_cue.text} ... ${g.answer.lead_in} ${g.answer.text}`;
    assert.ok(orig.startsWith(headTxt), `${s.card_id}: question/think/answer reassemble to the V1 prefix`);
    const tail = orig.slice(headTxt.length);
    assert.ok(tail.endsWith(g.teaching.text), `${s.card_id}: teaching is the V1 suffix`);
    assert.match(tail.slice(0, tail.length - g.teaching.text.length), /^\.?\s*$/, `${s.card_id}: only a separator period/space dropped`);
  }
  const raw = await run('tools/belt/fixtures/05.card_scripts/v1-projected.json');
  const norm = await run('tools/belt/fixtures/05.card_scripts/v1-projected-practice-normalized.json');
  assert.equal(statusOf(raw, '05.PRACTICE_ONLY'), 'FAIL');
  assert.equal(statusOf(norm, '05.PRACTICE_ONLY'), 'PASS');
  assert.match(norm.checks.find(c => c.check_id === '05.STAGE_DIRECTIONS').evidence, /card\.gov-a\.07/);
});

test('pronunciation token equality and lints', () => {
  assert.deepEqual(spokenTokens('U.S.'), spokenTokens('U S'));
  assert.deepEqual(spokenTokens('USCIS'), spokenTokens('U S C I S'));
  assert.notDeepEqual(spokenTokens(' | '), spokenTokens(', or, '));
  assert.ok(practiceOnlyViolations('Here is the official answer:').length > 0);
  assert.deepEqual(practiceOnlyViolations('Here is the answer:'), []);
  assert.ok(SPEAK_REQUEST_RE.test('The test is spoken, so say it out loud: twenty-seven.'));
  assert.ok(!SPEAK_REQUEST_RE.test('which words appear in the read-aloud sentences?'));
  assert.ok(!SPEAK_REQUEST_RE.test('The holiday trio, easy to say out loud.'));
});
