import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { extractJobs, clipIdentity, RECIPE, verifyPinnedBytes } from './prepare-state-audio.mjs';

const pin = { file: 'fixture', sha256: 'a'.repeat(64), task_id: 'task', attempt_id: 'attempt', artifact_id: 'accepted', stage_id: '05.card_scripts', section_id: 'sec01-fixture' };
test('accepted text and recap.narration_text survive verbatim, including long/short final sentences', () => {
  const long = 'Exact  decimal  0.08. ' + 'Keep this unchanged. '.repeat(220) + 'Stop.';
  const doc = { audio_scripts: [
    { card_id: 'one', is_recap: false, segments: { question: { lead_in: 'Question:', text: 'What  is the rule?' }, answer: { lead_in: 'Answer:', text: long }, teaching: { text: 'First sentence. Stop.' } } },
    { card_id: 'recap', is_recap: true, recap: { narration_text: 'Keep every  accepted word. Stop.', hooks_spoken: ['not the narration'] } },
  ], think_cue: { text: 'Recall the complete rule.' } };
  const result = extractJobs([{ pin, document: doc }]);
  assert.equal(result.jobs.find(j => j.kind === 'card_a').input, 'Answer: ' + long);
  assert.equal(result.jobs.find(j => j.kind === 'card_q').input, 'Question: What  is the rule?');
  assert.equal(result.jobs.find(j => j.kind === 'card_teach').input, 'First sentence. Stop.');
  assert.equal(result.jobs.find(j => j.kind === 'recap').input, 'Keep every  accepted word. Stop.');
  assert.ok(result.jobs.find(j => j.kind === 'card_a').chars > 3800);
  assert.equal(result.counts.clips, 5);
});
test('malformed narration object fails instead of narrating object coercion', () => {
  assert.throws(() => extractJobs([{ pin, document: { audio_scripts: [{ card_id: 'recap', is_recap: true, recap: { hooks_spoken: ['only'] } }] } }]), /missing_or_nonstring_narration/);
});
test('full model, voice, instructions and exact text determine reuse identity', () => {
  const h = clipIdentity('Exact.');
  for (const recipe of [{ ...RECIPE, voice: 'alloy' }, { ...RECIPE, model: 'another' }, { ...RECIPE, instructions: RECIPE.instructions + ' ' }]) assert.notEqual(clipIdentity('Exact.', recipe), h);
  assert.notEqual(clipIdentity('Exact. '), h);
});
test('byte/hash mismatch rejects stale or corrupted files', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-audio-pin-test-'));
  const file = path.join(directory, 'fixture.json');
  try {
    const bytes = Buffer.from('{"exact":true}'); fs.writeFileSync(file, bytes);
    const hash = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.deepEqual(verifyPinnedBytes(file, hash, bytes.length), bytes);
    assert.throws(() => verifyPinnedBytes(file, hash, bytes.length + 1), /source_hash_or_size_mismatch/);
    fs.writeFileSync(file, '{"exact":false}');
    assert.throws(() => verifyPinnedBytes(file, hash, bytes.length), /source_hash_or_size_mismatch/);
  } finally { fs.unlinkSync(file); fs.rmdirSync(directory); }
});
