// node --test tests/belt/04-cards.test.mjs
// Local deterministic tests of the 04.cards strict adapter + compensating checks. No model/network calls.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../../tools/belt/post-validate.mjs';
import { loadFixtureContext } from '../../tools/belt/lib/fixture-context.mjs';
import { lintAll } from '../../tools/belt/strict-lint.mjs';
import { sha256File } from '../../tools/belt/lib/hash.mjs';
import { spokenFormViolations } from '../../tools/belt/lib/cards-sessions-common.mjs';
import { expectedTier } from '../../tools/belt/checks/04-cards.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STAGE = '04.cards';
const mapping = JSON.parse(readFileSync(join(ROOT, 'schemas-strict/04-carddeck.mapping.json'), 'utf8'));
const run = async (rel) => {
  const abs = join(ROOT, rel);
  return validateArtifact({ stage_id: STAGE, artifact: JSON.parse(readFileSync(abs, 'utf8')), context: { ...loadFixtureContext(abs).context, strip_fixture_meta: true } });
};
const statusOf = (r, id) => r.checks.find(c => c.check_id === id)?.status;

test('adapter passes strict-lint and pins are current', () => {
  const lint = lintAll()['04-carddeck.schema.json'];
  assert.equal(lint.ok, true, JSON.stringify(lint.violations));
  assert.equal(sha256File(join(ROOT, mapping.adapter_schema.path)), mapping.adapter_schema.sha256, 'mapping adapter hash');
  assert.equal(sha256File(join('D:/nova', mapping.parent_schema.path)), mapping.parent_schema.sha256, 'parent schema hash');
  assert.equal(mapping.parent_schema.sha256, '9a5a0e438ad6206e50ae052067cbbe69d1f44f989090dd7b9b94e49e654adb93');
  assert.equal(sha256File(join(ROOT, mapping.checks_module.path)), mapping.checks_module.sha256, 'checks module hash');
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

test('positive fixture exercises every check (no silent skip)', async () => {
  const r = await run('tools/belt/fixtures/04.cards/synthetic-positive.json');
  assert.deepEqual(r.checks.map(c => c.check_id).sort(), [...mapping.checks].sort());
});

test('no-context run never PASSes a context-bound check', async () => {
  const r = await run('tools/belt/fixtures/04.cards/synthetic-hold-no-context.json');
  for (const id of ['04.HOOK_ORIGIN', '04.BACK_FIDELITY', '04.PAGE_RESOLUTION', '04.MEDIA_DISPOSITION', '04.DECKS_MIRROR_KG', '04.ORIGINALITY', '04.INPUT_BINDING', '04.FACT_IDS']) assert.equal(statusOf(r, id), 'HOLD', id);
});

test('V1 legitimate spoken-form FAIL flips to PASS only on the normalized fixture', async () => {
  const raw = await run('tools/belt/fixtures/04.cards/v1-projected.json');
  const fixed = await run('tools/belt/fixtures/04.cards/v1-projected-spokenform-fixed.json');
  assert.equal(statusOf(raw, '04.BACK_SPOKEN_FORM'), 'FAIL');
  assert.match(raw.checks.find(c => c.check_id === '04.BACK_SPOKEN_FORM').evidence, /symbol'\|'/);
  assert.equal(statusOf(fixed, '04.BACK_SPOKEN_FORM'), 'PASS');
  const fx = JSON.parse(readFileSync(join(ROOT, 'tools/belt/fixtures/04.cards/v1-projected-spokenform-fixed.json'), 'utf8'));
  assert.ok(fx._fixture.diff.length > 0 && fx._fixture.diff.every(d => /\/(back|memory_hook|text)$/.test(d.pointer)), 'diff only touches back/hook/recap text');
});

test('V1 projection records the source hash and parses pages from "[Qn · p.N]"', () => {
  const fx = JSON.parse(readFileSync(join(ROOT, 'tools/belt/fixtures/04.cards/v1-projected.json'), 'utf8'));
  assert.equal(fx._fixture.source.sha256, sha256File(join('D:/nova', fx._fixture.source.path)));
  const c = fx.decks[0].cards.find(x => x.card_id === 'card.gov-b.01');
  assert.equal(c.source_ref.pdf_page, 4);
  assert.equal(fx.decks.flatMap(d => d.cards).length, 147);
  assert.ok(fx.decks.flatMap(d => d.cards).every(x => x.claims_fact_ids.length === 0), 'no invented fact ids');
});

test('spoken-form lint: units/symbols flagged, spelled forms and ordinary words allowed', () => {
  assert.ok(spokenFormViolations('Do not exceed 55 mph.').length > 0);
  assert.ok(spokenFormViolations('Keep 20 ft back').length > 0);
  assert.ok(spokenFormViolations('stop | yield').length > 0);
  assert.ok(spokenFormViolations('limit 0.08 percent').length > 0, 'unspelled decimal');
  assert.ok(spokenFormViolations('a 12in gap').length > 0, 'glued unit');
  assert.deepEqual(spokenFormViolations('Do not exceed fifty-five miles per hour.'), []);
  assert.deepEqual(spokenFormViolations('Signed in 1787 in Philadelphia, in the 1800s.'), []);
});

test('SRS tier function is the bound deterministic policy', () => {
  assert.equal(expectedTier('easy', false), 'relaxed');
  assert.equal(expectedTier('easy', true), 'standard');
  assert.equal(expectedTier('medium', true), 'tight');
  assert.equal(expectedTier('hard', true), 'tight');
  assert.equal(expectedTier('bogus', false), null);
});
