#!/usr/bin/env node
// Deterministic narration preparation: accepted text inventory + verified existing-file reuse.
// No network, API credentials, generation or writes to app-preview/store course assets.
// node tools/audio/prepare-state-audio.mjs --state ID [--reference-samples]
// --provider gpt-live --billing subscription records the unavailable export capability honestly.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(ROOT, 'app-preview');
export const RECIPE = Object.freeze({
  model: 'gpt-4o-mini-tts', voice: 'nova',
  instructions: "Speak in a calm, clear, warm, encouraging teacher's voice for a driver-handbook written-test prep. Emphasize key terms clearly. " +
    'Deliberately unhurried: a slow, steady, ESL-friendly pace, about three-quarters of normal speaking speed. ' +
    'Pause briefly after every sentence, and pause a little longer before the answer or the key fact. Never rush a number, a unit or a term.',
  target_postprocess: { pace_atempo: 0.85, bitrate: '128k', sample_rate_hz: 24000, channels: 1 },
});
const STAGES = new Set(['05.card_scripts', '05.sessions']);
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const cleanSha = value => String(value || '').replace(/^sha256:/, '');
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const rel = file => path.relative(ROOT, file).replace(/\\/g, '/');
const writeJson = (file, value) => fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
function inside(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative)) throw new Error('unsafe_relative_path');
  const resolved = path.resolve(root, relative);
  const back = path.relative(root, resolved);
  if (back === '..' || back.startsWith('..' + path.sep)) throw new Error('path_outside_root');
  return resolved;
}
function speech(value, scope) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`missing_or_nonstring_narration:${scope}`);
  // Preserve every accepted character: no whitespace normalization, reordering or truncation.
  return value;
}
function ledSpeech(segment, scope) {
  if (!segment || typeof segment !== 'object') throw new Error(`missing_segment:${scope}`);
  const text = speech(segment.text, scope);
  if (segment.lead_in === undefined || segment.lead_in === null || segment.lead_in === '') return text;
  return speech(segment.lead_in, scope + ':lead_in') + ' ' + text;
}
export function clipIdentity(input, recipe = RECIPE) {
  return digest(`${recipe.voice}|${recipe.model}|${recipe.instructions}|${input}`);
}

export function extractJobs(sources, recipe = RECIPE) {
  const jobs = [], thinks = new Map(), ids = new Set();
  let cards = 0, recaps = 0, slides = 0, units = 0;
  const add = job => {
    const identity = `${job.kind}:${job.section}:${job.id}`;
    if (ids.has(identity)) throw new Error('duplicate_audio_target:' + identity);
    ids.add(identity);
    jobs.push({ ...job, spoken_text_sha256: digest(job.input), recipe_text_sha256: clipIdentity(job.input, recipe), chars: job.input.length });
  };
  for (const { pin, document: doc } of sources) {
    const source = { file: pin.file, sha256: pin.sha256, task_id: pin.task_id, attempt_id: pin.attempt_id, artifact_id: pin.artifact_id, stage_id: pin.stage_id, section_id: pin.section_id };
    const section = pin.section_id;
    if (pin.stage_id === '05.card_scripts') {
      if (!Array.isArray(doc.audio_scripts)) throw new Error('audio_scripts_missing:' + section);
      for (const s of doc.audio_scripts) {
        if (!s || typeof s.card_id !== 'string') throw new Error('card_id_missing:' + section);
        if (s.is_recap) {
          const input = speech(s.recap?.narration_text ?? s.recap?.text, `${section}:${s.card_id}:recap`);
          recaps++;
          add({ kind: 'recap', id: s.card_id, section, module_id: s.module_id, input, source });
        } else {
          if (!s.segments) throw new Error('card_segments_missing:' + s.card_id);
          cards++;
          add({ kind: 'card_q', id: s.card_id, section, input: ledSpeech(s.segments.question, s.card_id + ':question'), source });
          add({ kind: 'card_a', id: s.card_id, section, input: ledSpeech(s.segments.answer, s.card_id + ':answer'), source });
          add({ kind: 'card_teach', id: s.card_id, section, input: speech(s.segments.teaching?.text, s.card_id + ':teaching'), source });
        }
      }
      if (doc.think_cue?.text !== undefined) {
        const input = speech(doc.think_cue.text, section + ':think');
        if (!thinks.has(input)) thinks.set(input, { sections: [], sources: [] });
        thinks.get(input).sections.push(section);
        thinks.get(input).sources.push(source);
      }
    } else if (pin.stage_id === '05.sessions') {
      if (!Array.isArray(doc.units)) throw new Error('session_units_missing:' + section);
      for (const u of doc.units) {
        units++;
        for (const sl of u.slides || []) {
          slides++;
          add({ kind: 'slide', id: `${u.unit_id}/${sl.slide_id}`, section, unit_id: u.unit_id, slide_id: sl.slide_id, input: speech(sl.narration?.text ?? sl.narration, sl.slide_id), source });
        }
      }
    }
  }
  for (const [input, references] of thinks) add({ kind: 'think', id: 'think-' + digest(input).slice(0, 12), section: references.sections.join('+'), input, sources: references.sources });
  return { jobs, counts: { cards, recaps, slides, lesson_units: units, think_clips: thinks.size, clips: jobs.length, unique_utterances: new Set(jobs.map(j => j.recipe_text_sha256)).size, spoken_characters: jobs.reduce((n, j) => n + j.chars, 0) } };
}

function sectionOf(task) {
  const id = JSON.parse(task.identity_json || '{}');
  return id.config?.section_ids?.[0] || task.identity_json?.match(/sec\d\d[a-z-]*/)?.[0] || null;
}
export function verifyPinnedBytes(file, expectedHash, expectedBytes) {
  const bytes = fs.readFileSync(file);
  if (digest(bytes) !== cleanSha(expectedHash) || (expectedBytes !== undefined && bytes.length !== expectedBytes)) throw new Error('source_hash_or_size_mismatch:' + file);
  return bytes;
}

async function acceptedSources(state) {
  const manifestFile = inside(APP, state.data_root + '/manifest.json');
  const manifestBytes = fs.readFileSync(manifestFile);
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  if (manifest.run_id !== state.run_id) throw new Error('state_manifest_run_mismatch');
  const runRoot = inside(path.join(ROOT, 'runs'), state.run_id);
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(path.join(runRoot, 'ledger', 'run.sqlite'), { readOnly: true });
  const tasks = db.prepare('SELECT * FROM tasks WHERE run_id = ?').all(state.run_id);
  const arts = db.prepare('SELECT * FROM artifacts WHERE run_id = ? AND kind = ?').all(state.run_id, 'stage_output');
  db.close();
  const winners = new Map();
  for (const t of tasks) {
    if (t.status !== 'accepted' || !STAGES.has(t.stage_id)) continue;
    const section = sectionOf(t);
    if (!section) throw new Error('accepted_audio_task_without_section:' + t.task_id);
    const key = t.stage_id + '|' + section;
    const current = winners.get(key);
    if (!current || String(t.created_at) > String(current.created_at)) winners.set(key, t);
  }
  const picked = (manifest.files || []).filter(e => STAGES.has(e.stage_id));
  const byKey = new Map();
  const sources = [];
  for (const e of picked) {
    const key = e.stage_id + '|' + e.section_id;
    if (byKey.has(key)) throw new Error('duplicate_export_stage_section:' + key);
    byKey.set(key, e);
    const winner = winners.get(key);
    if (!winner || winner.task_id !== e.task_id || winner.accepted_artifact_id !== e.artifact_id || e.task_status !== 'accepted') throw new Error('stale_or_nonaccepted_export:' + key);
    const art = arts.find(a => a.artifact_id === e.artifact_id && a.task_id === e.task_id && a.attempt_id === e.attempt_id);
    if (!art) throw new Error('native_artifact_binding_missing:' + e.artifact_id);
    const nativeBytes = verifyPinnedBytes(inside(runRoot, art.path), art.sha256, art.bytes);
    const exportedBytes = verifyPinnedBytes(inside(APP, e.file), e.sha256, e.bytes);
    if (!nativeBytes.equals(exportedBytes)) throw new Error('native_export_bytes_differ:' + key);
    sources.push({ pin: e, document: JSON.parse(exportedBytes.toString('utf8')) });
  }
  for (const [key] of winners) if (!byKey.has(key)) throw new Error('accepted_source_missing_from_export:' + key);
  for (const chapter of state.chapters || []) for (const stage of STAGES) if (!byKey.has(stage + '|' + chapter.id)) throw new Error('chapter_narration_stage_missing:' + stage + '|' + chapter.id);
  if (!manifestBytes.equals(fs.readFileSync(manifestFile))) throw new Error('source_manifest_changed_during_read');
  return { sources, manifest_ref: { file: rel(manifestFile), sha256: digest(manifestBytes), exported_at: manifest.exported_at, run_id: state.run_id }, section_count: (state.chapters || []).length };
}

function audioDetails(file) {
  const binary = process.env.FFMPEG || 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe';
  if (!fs.existsSync(binary)) throw new Error('ffmpeg_unavailable_for_sample_validation');
  const check = spawnSync(binary, ['-hide_banner', '-v', 'info', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', timeout: 30000 });
  if (check.status !== 0) throw new Error('sample_audio_decode_failed:' + file);
  const info = check.stderr || '';
  const stream = info.match(/Audio:\s*mp3[^\n]*?(\d+) Hz,\s*(mono|stereo)[^\n]*?(\d+) kb\/s/);
  const duration = info.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!stream || !duration) throw new Error('sample_audio_metadata_missing:' + file);
  return { codec: 'mp3', sample_rate_hz: Number(stream[1]), channels: stream[2] === 'mono' ? 1 : 2, bitrate_kbps: Number(stream[3]), duration_seconds: Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]), decoded_successfully: true };
}
function verifyCandidate(entry, manifest) {
  const file = inside(APP, entry.file_ref);
  verifyPinnedBytes(file, entry.sha256, entry.bytes);
  const media = audioDetails(file);
  return { file, media, recorded_postprocess: { pace_atempo: manifest.minted_by?.pace_atempo ?? null, bitrate: entry.shrunk_bitrate || manifest.shrink?.bitrate || null, sample_rate_hz: entry.sample_rate_hz ?? null, channels: entry.channels ?? null }, pace_evidence: manifest.minted_by?.pace_atempo == null ? 'not_established_by_current_manifest' : 'recorded_in_manifest' };
}

export async function main(argv = process.argv.slice(2)) {
  const opt = (name, fallback) => { const exact = argv.indexOf(name); const joined = argv.find(a => a.startsWith(name + '=')); return exact >= 0 ? argv[exact + 1] : joined ? joined.slice(name.length + 1) : fallback; };
  if (argv.includes('--go')) throw new Error('generation_not_implemented_here: this deterministic tool never calls an API');
  const code = String(opt('--state', 'ID')).toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) throw new Error('invalid_state_code');
  const state = json(path.join(APP, 'data/states.json')).find(s => s.code === code);
  if (!state) throw new Error('state_not_registered:' + code);
  const provider = opt('--provider', 'gpt-live'), billing = opt('--billing', 'subscription');
  if (!['gpt-live', 'openai-audio-api'].includes(provider)) throw new Error('unsupported_provider');
  if (!['subscription', 'api'].includes(billing)) throw new Error('unsupported_billing');
  const source = await acceptedSources(state);
  const { jobs, counts } = extractJobs(source.sources);
  const out = path.join(ROOT, 'scratch/store-local', 'audio-' + code);
  const referenceManifestFile = path.join(APP, 'audio/audio-manifest.json');
  const referenceManifestBytes = fs.existsSync(referenceManifestFile) ? fs.readFileSync(referenceManifestFile) : null;
  const referenceManifest = referenceManifestBytes ? JSON.parse(referenceManifestBytes.toString('utf8')) : null;
  const profileMatches = referenceManifest?.minted_by?.model === RECIPE.model && referenceManifest?.minted_by?.voice === RECIPE.voice && referenceManifest?.minted_by?.instructions === RECIPE.instructions;
  const matches = [], invalid = [], references = [];
  if (profileMatches) {
    const byIdentity = new Map();
    for (const entry of referenceManifest.entries || []) {
      if (!entry.reordered && !byIdentity.has(entry.text_sha256)) byIdentity.set(entry.text_sha256, entry);
    }
    for (const job of jobs) {
      const entry = byIdentity.get(job.recipe_text_sha256);
      if (!entry) continue;
      try {
        const checked = verifyCandidate(entry, referenceManifest);
        matches.push({ job, entry, checked });
      } catch (error) { invalid.push({ id: job.id, source: entry.file_ref, reason: error.message }); }
    }
  }
  // All writes stay in scratch; matched samples and voice references never become a course manifest.
  fs.mkdirSync(out, { recursive: true });
  const copied = [];
  function copySample(item, referenceOnly = false) {
    const name = (referenceOnly ? 'reference-utah-' : 'matched-' + code.toLowerCase() + '-') + item.entry.kind + '-' + cleanSha(item.entry.sha256).slice(0, 12) + '.mp3';
    const destination = path.join(out, 'samples', name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(item.checked.file, destination);
    verifyPinnedBytes(destination, item.entry.sha256, item.entry.bytes);
    return { file: rel(destination), reference_only: referenceOnly, used_in_idaho_course: false, generated_this_run: false, origin: 'existing_utah_nova_audio', source_file: item.entry.file_ref, source_manifest: { file: rel(referenceManifestFile), sha256: digest(referenceManifestBytes) }, sha256: cleanSha(item.entry.sha256), bytes: item.entry.bytes, model: referenceManifest.minted_by.model, voice: referenceManifest.minted_by.voice, instructions: referenceManifest.minted_by.instructions, text_identity_sha256: item.entry.text_sha256, ...item.checked.media, ...item.checked.recorded_postprocess, pace_evidence: item.checked.pace_evidence, ...(item.job ? { idaho_target: { kind: item.job.kind, id: item.job.id, section: item.job.section, spoken_text: item.job.input } } : {}), note: referenceOnly ? 'Utah voice reference only; this is not Idaho narration or a GPT-Live output.' : 'Exact accepted target utterance matched by full model/voice/instructions/text identity. Existing media reused with its recorded encoding and pace; not newly generated.' };
  }
  const copiedHashes = new Set();
  for (const item of matches) {
    if (copiedHashes.has(item.entry.sha256)) continue;
    copiedHashes.add(item.entry.sha256); copied.push(copySample(item));
  }
  if (argv.includes('--reference-samples') && referenceManifest) for (const kind of ['card_q', 'card_a', 'card_teach']) {
    const entry = (referenceManifest.entries || []).find(e => e.kind === kind && !e.reordered);
    if (!entry) continue;
    try { references.push(copySample({ entry, checked: verifyCandidate(entry, referenceManifest) }, true)); }
    catch (error) { invalid.push({ reference_kind: kind, source: entry.file_ref, reason: error.message }); }
  }
  const capability = { requested_provider: provider, requested_billing: billing, status: provider === 'gpt-live' && billing === 'subscription' ? 'unavailable_subscription_audio_export_capability' : 'deterministic_preparation_only', generation_attempted: false, network_requests: 0, paid_calls: 0, new_audio_files_generated: 0, fallback_provider_used: false, reason: provider === 'gpt-live' ? 'No subscription GPT-Live audio-file export tool is exposed to this session. ChatGPT live voice is not a batch narration export endpoint.' : 'This preparation tool has no API execution path or credential handling.' };
  const matchedIdentities = new Set(matches.map(item => item.job.recipe_text_sha256));
  const pendingUnique = new Set(jobs.filter(job => !matchedIdentities.has(job.recipe_text_sha256)).map(job => job.recipe_text_sha256)).size;
  const estimate = { estimate_basis: 'historical_fleet_rate_only_not_provider_quote', historical_usd_per_clip: 0.005, unrendered_clip_targets: jobs.length - matches.length, unrendered_distinct_utterances: pendingUnique, estimated_new_audio_usd_with_exact_text_deduplication: Math.round(pendingUnique * 0.005 * 100) / 100, per_target_upper_estimate_usd_without_deduplication: Math.round((jobs.length - matches.length) * 0.005 * 100) / 100, estimate_is_authorization: false };
  const inventory = { artifact: 'StateNarrationPreparation', generated_at: new Date().toISOString(), state: code, run_id: state.run_id, source_manifest: source.manifest_ref, source_sections: source.section_count, source_pins: source.sources.map(s => s.pin), narration_recipe: RECIPE, accepted_text_policy: 'verbatim segment text; one space joins an explicit lead-in to its text; no normalization, rewriting, reordering or truncation', counts, capability, estimate, existing_audio_reuse: { source_profile_matches: profileMatches, exact_utterance_matches: matches.length, distinct_copied_samples: copied.length, invalid_matches: invalid, samples: copied }, voice_reference_samples: references, coverage_status: 'not_generated_not_published_not_fact_cleared', jobs };
  writeJson(path.join(out, 'narration-inventory.json'), inventory);
  writeJson(path.join(out, 'samples.json'), { state: code, new_audio_files_generated: 0, idaho_exact_match_samples: copied, utah_voice_references_only: references, capability });
  console.log(JSON.stringify({ state: code, sections: source.section_count, ...counts, exact_existing_matches: matches.length, voice_reference_files: references.map(s => s.file), capability: capability.status, inventory: rel(path.join(out, 'narration-inventory.json')), estimate }));
  return inventory;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main().catch(error => { console.error('AUDIO PREPARATION FAILED: ' + error.message); process.exitCode = 1; });
