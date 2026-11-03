#!/usr/bin/env node
// Four explicitly approved Idaho voice samples only. Default is dry; no automatic retries.
// Authorization: founder selected existing Nova API for four samples, cap USD 0.10 (2026-10-29).
// node tools/audio/render-state-samples.mjs --state ID
// node tools/audio/render-state-samples.mjs --state ID --go --max-usd 0.10
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { main as prepare, RECIPE, verifyPinnedBytes } from './prepare-state-audio.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const relative = file => path.relative(ROOT, file).replace(/\\/g, '/');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const APPROVAL = { state: 'ID', max_calls: 4, max_usd: 0.10, existing_key_reuse: true, model: 'gpt-4o-mini-tts', voice: 'nova', no_automatic_retries: true, authority: 'Founder explicitly selected: Use existing Nova API for 4 samples; estimated USD0.02; cap USD0.10. Parent task authorization 2026-10-29.' };

function mediaDetails(ffmpeg, file) {
  const r = spawnSync(ffmpeg, ['-hide_banner', '-v', 'info', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', timeout: 30000 });
  if (r.status !== 0) throw new Error('audio_decode_failed:' + relative(file));
  const stream = (r.stderr || '').match(/Audio:\s*mp3[^\n]*?(\d+) Hz,\s*(mono|stereo)[^\n]*?(\d+) kb\/s/);
  const duration = (r.stderr || '').match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!stream || !duration) throw new Error('audio_metadata_missing:' + relative(file));
  return { codec: 'mp3', sample_rate_hz: Number(stream[1]), channels: stream[2] === 'mono' ? 1 : 2, bitrate_kbps: Number(stream[3]), duration_seconds: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]), decoded_successfully: true };
}

function chooseSamples(inventory) {
  const target = 'sec11-card-f14';
  const trio = ['card_q', 'card_a', 'card_teach'].map(kind => inventory.jobs.find(j => j.kind === kind && j.id === target));
  if (trio.some(j => !j)) throw new Error('approved_idaho_fact_card_sample_missing');
  const lesson = inventory.jobs.find(j => j.kind === 'slide' && j.id === 'sec11-u01/sec11-u01-slide-4');
  if (!lesson) throw new Error('approved_idaho_lesson_slide_missing');
  const selected = [...trio, lesson];
  const labels = ['question', 'answer', 'teaching', 'lesson'];
  return selected.map((j, i) => ({ ...j, label: labels[i], output_name: `id-sec11-f14-${labels[i]}.mp3` }));
}

export async function main(argv = process.argv.slice(2)) {
  const opt = (name, fallback) => { const at = argv.indexOf(name), joined = argv.find(a => a.startsWith(name + '=')); return at >= 0 ? argv[at + 1] : joined ? joined.slice(name.length + 1) : fallback; };
  const code = String(opt('--state', 'ID')).toUpperCase();
  const go = argv.includes('--go');
  if (code !== APPROVAL.state) throw new Error('approval_is_scoped_to_idaho_only');
  if (RECIPE.model !== APPROVAL.model || RECIPE.voice !== APPROVAL.voice) throw new Error('approved_nova_recipe_changed');
  const maxUsd = Number(opt('--max-usd', '0'));
  if (go && (!Number.isFinite(maxUsd) || maxUsd < 0.02 || maxUsd > APPROVAL.max_usd)) throw new Error('go_requires_explicit_max_usd_between_0.02_and_0.10');
  const ffmpeg = process.env.FFMPEG || 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe';
  if (!fs.existsSync(ffmpeg)) throw new Error('ffmpeg_required_before_any_paid_request');
  // Re-read the current native ledger and hash-pinned export before choosing the utterances.
  const inventory = await prepare(['--state', code, '--provider', 'openai-audio-api', '--billing', 'api', '--reference-samples']);
  const samples = chooseSamples(inventory);
  const characters = samples.reduce((n, j) => n + j.input.length, 0);
  if (samples.length !== APPROVAL.max_calls || characters > 2000) throw new Error('sample_scope_exceeds_four_calls_or_2000_characters');
  const out = path.join(ROOT, 'scratch/store-local/audio-ID/generated-samples');
  fs.mkdirSync(out, { recursive: true });
  const estimate = { dry_run: !go, state: code, calls_planned: 4, max_calls: 4, accepted_spoken_characters: characters, historical_estimate_usd: 0.02, estimate_basis: 'historical_fleet_average_usd0.005_per_clip_not_a_provider_quote', authorized_max_usd: APPROVAL.max_usd, explicit_run_max_usd: go ? maxUsd : null, actual_provider_cost_usd: null, model: RECIPE.model, voice: RECIPE.voice, recipe: RECIPE, source_manifest: inventory.source_manifest, samples: samples.map(s => ({ label: s.label, kind: s.kind, id: s.id, source: s.source, spoken_text: s.input, spoken_text_sha256: s.spoken_text_sha256, recipe_text_sha256: s.recipe_text_sha256, chars: s.chars, intended_file: relative(path.join(out, s.output_name)) })), generation_attempted: false };
  writeJson(path.join(out, 'dry-estimate.json'), estimate);
  console.log(JSON.stringify({ phase: 'sample_estimate', calls: 4, characters, estimated_usd: 0.02, max_usd: APPROVAL.max_usd, dry: !go, output: relative(out) }));
  if (!go) return estimate;
  const recordFile = path.join(out, 'run-record.json');
  if (fs.existsSync(recordFile)) {
    const prior = readJson(recordFile);
    if (prior.status !== 'complete' || prior.sample_set_sha256 !== digest(JSON.stringify(estimate.samples))) throw new Error('prior_sample_run_exists_do_not_retry_or_replay_without_new_authority');
    const existing = readJson(path.join(out, 'sample-manifest.json'));
    for (const e of existing.entries) verifyPinnedBytes(path.resolve(ROOT, e.file), e.sha256, e.bytes);
    console.log(JSON.stringify({ phase: 'already_complete', new_calls: 0, manifest: relative(path.join(out, 'sample-manifest.json')) }));
    return existing;
  }
  const key = process.env.OPENAI_API_KEY;
  if (typeof key !== 'string' || !key.startsWith('sk-')) throw new Error('existing_process_openai_api_key_unavailable');
  const record = { approval: APPROVAL, started_at: new Date().toISOString(), status: 'in_progress', sample_set_sha256: digest(JSON.stringify(estimate.samples)), calls_attempted: 0, calls_succeeded: 0, max_usd: maxUsd, actual_provider_cost_usd: null, provider_usage: null, errors: [], request_records: [] };
  // Exclusive creation prevents two invocations from spending against the same four-call grant.
  fs.writeFileSync(recordFile, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  const entries = [];
  const eventFile = path.join(out, 'request-events.jsonl');
  try {
    for (const sample of samples) {
      if (record.calls_attempted >= APPROVAL.max_calls) throw new Error('four_call_limit_reached');
      record.calls_attempted++;
      const request = { sequence: record.calls_attempted, at: new Date().toISOString(), label: sample.label, model: RECIPE.model, voice: RECIPE.voice, spoken_text_sha256: sample.spoken_text_sha256, input_chars: sample.chars, status: 'requested', automatic_retry: false };
      record.request_records.push(request); writeJson(recordFile, record);
      fs.appendFileSync(eventFile, JSON.stringify(request) + '\n');
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST', headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: RECIPE.model, voice: RECIPE.voice, input: sample.input, instructions: RECIPE.instructions, response_format: 'mp3' }),
        signal: AbortSignal.timeout(90000),
      });
      request.http_status = response.status;
      request.provider_request_id = response.headers.get('x-request-id');
      if (!response.ok) throw new Error('speech_http_' + response.status + '_no_retry');
      const originalBytes = Buffer.from(await response.arrayBuffer());
      if (originalBytes.length < 1000) throw new Error('speech_file_too_small_no_retry');
      const original = path.join(out, 'originals', sample.output_name);
      fs.mkdirSync(path.dirname(original), { recursive: true });
      fs.writeFileSync(original, originalBytes, { flag: 'wx' });
      const originalMedia = mediaDetails(ffmpeg, original);
      const paced = path.join(out, sample.output_name);
      const pace = spawnSync(ffmpeg, ['-n', '-hide_banner', '-loglevel', 'error', '-i', original, '-filter:a', 'atempo=0.85', '-ac', '1', '-ar', '24000', '-b:a', '128k', paced], { encoding: 'utf8', timeout: 30000 });
      if (pace.status !== 0) throw new Error('sample_pacing_failed_original_preserved');
      const pacedMedia = mediaDetails(ffmpeg, paced);
      if (pacedMedia.channels !== 1 || pacedMedia.sample_rate_hz !== 24000 || pacedMedia.bitrate_kbps !== 128) throw new Error('paced_sample_encoding_mismatch');
      const pacedBytes = fs.readFileSync(paced);
      const entry = { label: sample.label, kind: sample.kind, id: sample.id, section: sample.section, file: relative(paced), bytes: pacedBytes.length, sha256: digest(pacedBytes), ...pacedMedia, original: { file: relative(original), bytes: originalBytes.length, sha256: digest(originalBytes), ...originalMedia }, source: sample.source, spoken_text: sample.input, spoken_text_sha256: sample.spoken_text_sha256, recipe_text_sha256: sample.recipe_text_sha256, model: RECIPE.model, voice: RECIPE.voice, instructions: RECIPE.instructions, pace_atempo: 0.85, actual_provider_cost_usd: null, provider_usage: null, provider_request_id: request.provider_request_id, source_text_reordered: false, source_text_truncated: false, asr_verified: false, human_listening_verified: false };
      entries.push(entry);
      record.calls_succeeded++;
      request.status = 'audio_received_decoded_and_paced'; request.bytes = originalBytes.length;
      writeJson(recordFile, record);
      fs.appendFileSync(eventFile, JSON.stringify({ ...request, completed_at: new Date().toISOString() }) + '\n');
      console.log(JSON.stringify({ phase: 'sample_ready', label: sample.label, file: entry.file, seconds: pacedMedia.duration_seconds, bytes: entry.bytes }));
    }
    const manifest = { artifact: 'IdahoNarrationSampleManifest', generated_at: new Date().toISOString(), scope: 'four_samples_only_not_full_course_audio', provider: 'openai_audio_api', billing: 'existing_nova_api_key', not_gpt_live_subscription: true, new_audio_files_generated: entries.length, paid_calls_attempted: record.calls_attempted, successful_calls: record.calls_succeeded, approved_cap_usd: maxUsd, historical_estimate_usd: 0.02, actual_provider_cost_usd: null, actual_usage_reason: 'Speech response returned audio bytes without token-usage or authoritative dollar accounting; cost is unknown.', runtime_policy: 'pre_generated_files_only', source_manifest: inventory.source_manifest, recipe: RECIPE, source_factual_clearance: 'target_sec11_F14_supported_by_existing_independent_pilot; no_whole_course_release_or_lesson_clearance_claim', all_clips_decoded: true, all_clips_asr_verified: false, entries };
    writeJson(path.join(out, 'sample-manifest.json'), manifest);
    record.status = 'complete'; record.finished_at = new Date().toISOString(); writeJson(recordFile, record);
    return manifest;
  } catch (error) {
    record.status = 'failed_or_uncertain_do_not_retry'; record.finished_at = new Date().toISOString();
    // Only a controlled message, never provider body, key value, request headers or stack.
    const message = String(error.message || 'sample_generation_failed').replace(/sk-[A-Za-z0-9_-]+/g, '[redacted]');
    record.errors.push(message); writeJson(recordFile, record);
    writeJson(path.join(out, 'partial-sample-manifest.json'), { scope: 'incomplete_four_sample_run', calls_attempted: record.calls_attempted, successful_calls: record.calls_succeeded, actual_provider_cost_usd: null, entries, failure: message, retry_allowed_without_new_authority: false });
    throw new Error(message);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error('SAMPLE RENDER FAILED: ' + error.message); process.exitCode = 1; });
