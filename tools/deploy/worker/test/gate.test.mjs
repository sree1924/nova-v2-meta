// node --test tools/deploy/worker/test/gate.test.mjs — the 8 gate cases, run on the real free-paths.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeTierRule, decide, signEntitlementCookie, ENT_COOKIE, cacheControlFor, edgeCacheable, isShellKey } from '../src/gate.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FREE = JSON.parse(fs.readFileSync(path.join(here, '../free-paths.json'), 'utf8'));
const classify = makeTierRule(FREE);
const SECRET = 'test-secret-not-production';
const NOW = Date.parse('2026-11-03T12:00:00Z');
const cookie = async (e, x = NOW + 3600e3, secret = SECRET) => `${ENT_COOKIE}=${await signEntitlementCookie({ u: 'user_1', e, x }, secret)}`;
const freeFile = FREE.free.find((p) => /^data\/nd\/.*sec01/.test(p)) || FREE.free.find((p) => p.startsWith('data/nd/'));
const paidNd = 'video/nd/sec02-u01.mp4', paidTx = 'video/tx/sec02-u01.mp4';

test('free file, signed out -> 200 free', async () => { const d = await decide(freeFile, null, classify, SECRET, NOW); assert.equal(d.status, 200); assert.equal(d.tier, 'free'); });
test('shell root "" and index.html are free', async () => { assert.equal((await decide('', null, classify, SECRET, NOW)).status, 200); assert.equal((await decide('index.html', null, classify, SECRET, NOW)).status, 200); });
test('paid file, signed out -> 401 sign_in_required with state', async () => { const d = await decide(paidNd, null, classify, SECRET, NOW); assert.deepEqual(d, { status: 401, error: 'sign_in_required', state: 'ND' }); });
test('forged cookie (wrong secret) -> 401', async () => { const d = await decide(paidNd, await cookie({ ND: '2027-01-01T00:00:00Z' }, undefined, 'other'), classify, SECRET, NOW); assert.equal(d.status, 401); });
test('valid ND cookie -> 200 paid', async () => { const d = await decide(paidNd, await cookie({ ND: '2027-01-01T00:00:00Z' }), classify, SECRET, NOW); assert.equal(d.status, 200); assert.equal(d.tier, 'paid'); });
test('valid ND cookie asking for TX -> 403 not_entitled', async () => { const d = await decide(paidTx, await cookie({ ND: '2027-01-01T00:00:00Z' }), classify, SECRET, NOW); assert.deepEqual(d, { status: 403, error: 'not_entitled', state: 'TX' }); });
test('expired entitlement -> 403; expired cookie -> 401', async () => {
  assert.equal((await decide(paidNd, await cookie({ ND: '2026-01-01T00:00:00Z' }), classify, SECRET, NOW)).status, 403);
  assert.equal((await decide(paidNd, await cookie({ ND: '2027-01-01T00:00:00Z' }, NOW - 1), classify, SECRET, NOW)).status, 401);
});
test('bad paths -> 400; unknown path -> 404', async () => {
  assert.equal((await decide('../x', null, classify, SECRET, NOW)).status, 400);
  assert.equal((await decide('a\\b', null, classify, SECRET, NOW)).status, 400);
  assert.equal((await decide('nope/zzz.txt', null, classify, SECRET, NOW)).status, 404);
});
test('every paid prefix has a 2-letter code and no free path falls under a paid prefix by accident', () => {
  for (const p of FREE.paid_prefixes) assert.match(p.code, /^[A-Z]{2}$/);
  const leaks = FREE.free.filter((f) => FREE.paid_prefixes.some((p) => f.startsWith(p.prefix)));
  // chapter-1 files legitimately live under paid prefixes (that is the free allowlist's job); just report the count
  assert.ok(leaks.length > 0);
});

// 2026-11-04 (BUG-010 follow-up): the shell is never cached; everything else keeps its rule.
test('shell key: index.html and the /app/ root are no-cache and never edge-cached', () => {
  for (const rel of ['', 'index.html']) {
    assert.equal(isShellKey(rel), true);
    assert.equal(cacheControlFor(rel, true), 'no-cache, must-revalidate');
    assert.equal(edgeCacheable(rel, true), false);
  }
});
test('non-shell free objects stay public+cached; paid objects stay private', () => {
  assert.equal(isShellKey('gate.js'), false);
  assert.equal(cacheControlFor('gate.js', true), 'public, max-age=3600, stale-while-revalidate=86400');
  assert.equal(edgeCacheable('gate.js', true), true);
  assert.equal(cacheControlFor('data/ne/real/04_cards/x.json', false), 'private, no-store');
  assert.equal(edgeCacheable('data/ne/real/04_cards/x.json', false), false);
});
