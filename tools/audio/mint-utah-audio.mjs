#!/usr/bin/env node
// mint-utah-audio.mjs — Nova fleet audio recipe (tools/mint-tenant-audio.mjs + app/scripts/render-segments-all.real.mjs)
// adapted to the hackathon lane's belt exports. Reads ONLY the ledger-accepted exports under app-preview/data/real/
// (05_sessions = lesson slides, 05_card_scripts = 4-movement card scripts) and mints pre-generated narration with
// OpenAI TTS — NOT a Meta model (Meta has no TTS; the app says so). Runtime policy: play pre-generated files only.
//
//   node tools/audio/mint-utah-audio.mjs            # DRY RUN (default): counts clips, prints ≈ $, mints nothing
//   node tools/audio/mint-utah-audio.mjs --go       # mint missing clips (founder gate, 2026-06-19 rule)
//   node tools/audio/mint-utah-audio.mjs --go --limit=20 --sections=sec01-definitions
//   env: OPENAI_API_KEY (required for --go; never printed), OPENAI_TTS_MODEL (gpt-4o-mini-tts), OPENAI_TTS_VOICE (nova),
//        AUDIO_CONCURRENCY (4), AUDIO_USD_PER_CLIP (0.005 — the fleet's observed rate), AUDIO_PACE (0.85 atempo, 0 = off)
//
// Clip set per card script (fleet 4-movement arc, think clip shared per section):
//   <card_id>.q.mp3      "Question: …"            question.lead_in + question.text
//   <card_id>.a.mp3      "Here is the answer: …"  answer.lead_in + answer.text
//   <card_id>.teach.mp3  teaching.text
//   _think.<section>.mp3 think_cue.text            (accepted text, one clip per section, deduped by text)
//   <card_id>.recap.mp3  recap scripts (is_recap) — single clip from recap.text
// Per lesson slide: sessions/<unit_id>.<slide_id>.mp3 from narration.text
//
// Known voice trap (memory tts-drops-final-short-sentence, 2026-10-11): gpt-4o-mini-tts drops a short standalone FINAL
// sentence. Fix = move that sentence to the front of the spoken input. Applied automatically; logged per clip.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL = path.join(LANE, 'app-preview', 'data', 'real');
const AUDIO = path.join(LANE, 'app-preview', 'audio');
const SESSION_AUDIO = path.join(AUDIO, 'sessions');
const MANIFEST = path.join(AUDIO, 'audio-manifest.json');
const ESTIMATE = path.join(AUDIO, 'audio-mint-estimate.json');
const EVENTS = path.join(AUDIO, 'audio-mint-events.jsonl');

const argv = process.argv.slice(2);
const GO = argv.includes('--go');
const LIMIT = Number((argv.find((a) => a.startsWith('--limit=')) || '--limit=0').split('=')[1]);
const SECTIONS = (argv.find((a) => a.startsWith('--sections=')) || '').split('=')[1]?.split(',').filter(Boolean) ?? [];
const MODEL = process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts';
const VOICE = process.env.OPENAI_TTS_VOICE || 'nova';
const CONCURRENCY = Number(process.env.AUDIO_CONCURRENCY || 4);
const RATE = Number(process.env.AUDIO_USD_PER_CLIP || 0.005);
const MIN_BYTES = Number(process.env.AUDIO_MIN_BYTES || 8000);
const MAX_RETRIES = Number(process.env.AUDIO_MAX_RETRIES || 4);
const API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const PACE_FACTOR = Number(process.env.AUDIO_PACE ?? 0.85);
const FFMPEG = process.env.FFMPEG || 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe';

// Fleet instruction + PACE clause (AMENDMENT-ORDER-2026-10-01-C). Voice stays `nova`.
const INSTRUCTIONS =
  "Speak in a calm, clear, warm, encouraging teacher's voice for a driver-handbook written-test prep. Emphasize key terms clearly. " +
  'Deliberately unhurried: a slow, steady, ESL-friendly pace, about three-quarters of normal speaking speed. ' +
  'Pause briefly after every sentence, and pause a little longer before the answer or the key fact. Never rush a number, a unit or a term.';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
const sha = (f) => 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sizeOk = (f) => fs.existsSync(f) && fs.statSync(f).size > MIN_BYTES;
const oneLine = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const event = (o) => fs.appendFileSync(EVENTS, JSON.stringify({ at: new Date().toISOString(), ...o }) + '\n');
const listJson = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f));

// Short-closer guard: if the LAST sentence is short (< 30 chars) and there is more than one sentence, move it first.
function guardShortCloser(text) {
  const t = oneLine(text).slice(0, 3800);
  const parts = t.match(/[^.!?]+[.!?]+/g);
  if (!parts || parts.length < 2) return { text: t, reordered: false };
  const last = parts[parts.length - 1].trim();
  if (last.length >= 30) return { text: t, reordered: false };
  return { text: [last, ...parts.slice(0, -1).map((p) => p.trim())].join(' '), reordered: true };
}

const sectionOf = (file) => {
  const j = readJson(file);
  return j.section_id || j.probe?.section_id || (readJson(path.join(REAL, 'manifest.json')).files.find((e) => file.endsWith(e.file.replace(/^data\/real\//, '').replace(/\//g, path.sep)))?.section_id) || 'unknown';
};

// ---- build jobs from the accepted exports ----
const jobs = [];
const thinkByText = new Map();
let cards = 0, recaps = 0, slides = 0, reorders = 0;

for (const f of listJson(path.join(REAL, '05_card_scripts'))) {
  const j = readJson(f);
  const section = sectionOf(f);
  if (SECTIONS.length && !SECTIONS.includes(section)) continue;
  for (const s of j.audio_scripts || []) {
    if (s.is_recap || !s.segments) {
      const txt = oneLine(s.recap?.text || s.recap || '');
      if (!txt) continue;
      recaps++;
      const g = guardShortCloser(txt); if (g.reordered) reorders++;
      jobs.push({ kind: 'recap', id: s.card_id, section, file: path.join(AUDIO, `${s.card_id}.recap.mp3`), input: g.text, reordered: g.reordered });
      continue;
    }
    cards++;
    const q = oneLine(`${s.segments.question.lead_in || 'Question:'} ${s.segments.question.text}`);
    const a = guardShortCloser(`${s.segments.answer.lead_in || 'Here is the answer:'} ${s.segments.answer.text}`);
    const t = guardShortCloser(s.segments.teaching.text);
    if (a.reordered) reorders++; if (t.reordered) reorders++;
    jobs.push({ kind: 'card_q', id: s.card_id, section, file: path.join(AUDIO, `${s.card_id}.q.mp3`), input: q });
    jobs.push({ kind: 'card_a', id: s.card_id, section, file: path.join(AUDIO, `${s.card_id}.a.mp3`), input: a.text, reordered: a.reordered });
    jobs.push({ kind: 'card_teach', id: s.card_id, section, file: path.join(AUDIO, `${s.card_id}.teach.mp3`), input: t.text, reordered: t.reordered });
  }
  const cue = oneLine(j.think_cue?.text || '');
  if (cue) {
    if (!thinkByText.has(cue)) thinkByText.set(cue, { sections: [] });
    thinkByText.get(cue).sections.push(section);
  }
}
let thinkIdx = 0;
const thinkFiles = {};
for (const [text, v] of thinkByText) {
  const file = path.join(AUDIO, thinkIdx === 0 ? '_think.mp3' : `_think.${thinkIdx}.mp3`);
  thinkIdx++;
  for (const s of v.sections) thinkFiles[s] = path.basename(file);
  jobs.push({ kind: 'think', id: path.basename(file), section: v.sections.join('+'), file, input: text });
}

for (const f of listJson(path.join(REAL, '05_sessions'))) {
  const j = readJson(f);
  const section = sectionOf(f);
  if (SECTIONS.length && !SECTIONS.includes(section)) continue;
  for (const u of j.units || []) for (const sl of u.slides || []) {
    const txt = oneLine(sl.narration?.text ?? sl.narration ?? '');
    if (!txt) continue;
    slides++;
    const g = guardShortCloser(txt); if (g.reordered) reorders++;
    jobs.push({ kind: 'slide', id: `${u.unit_id}/${sl.slide_id}`, section, unit_id: u.unit_id, slide_id: sl.slide_id, file: path.join(SESSION_AUDIO, `${u.unit_id}.${sl.slide_id}.mp3`), input: g.text, reordered: g.reordered });
  }
}

fs.mkdirSync(SESSION_AUDIO, { recursive: true });
const chars = jobs.reduce((n, j) => n + j.input.length, 0);
let pending = jobs.filter((j) => !sizeOk(j.file));
if (LIMIT > 0) pending = pending.slice(0, LIMIT);
const estUsd = +(pending.length * RATE).toFixed(2);
console.log(`COST ESTIMATE — utah: ${pending.length} new clips of ${jobs.length} total (${cards} cards × 3 + ${recaps} recaps + ${thinkByText.size} think + ${slides} slides; ${chars.toLocaleString()} chars; ${reorders} short-closer reorders) ≈ $${estUsd} @ ~$${RATE}/clip. ` + (GO ? 'MINTING (--go).' : 'DRY RUN — re-run with --go to mint.'));
writeJson(ESTIMATE, { lane: 'utah', model: MODEL, voice: VOICE, provider: 'openai_audio_api', total_clips: jobs.length, new_clips: pending.length, chars, usd_per_clip: RATE, est_usd: estUsd, cards, recaps, think_clips: thinkByText.size, slides, short_closer_reorders: reorders, generated: GO, at: new Date().toISOString() });
if (!GO) process.exit(0);

const KEY = process.env.OPENAI_API_KEY;
if (!KEY || !KEY.startsWith('sk-')) { console.error('FATAL: OPENAI_API_KEY missing/invalid (never printed).'); process.exit(1); }

async function render(job) {
  if (sizeOk(job.file)) return { ...job, status: 'skipped' };
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_BASE + '/audio/speech', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, voice: VOICE, input: job.input, instructions: INSTRUCTIONS, response_format: 'mp3' }),
      });
      if (res.status === 429 || res.status >= 500) {
        const ra = Number(res.headers.get('retry-after') || 0);
        await sleep(ra ? ra * 1000 : Math.min(30000, 1000 * 2 ** attempt));
        continue;
      }
      if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).slice(0, 200));
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length <= MIN_BYTES) throw new Error('small audio ' + buf.length + ' bytes');
      fs.writeFileSync(job.file, buf);
      return { ...job, status: 'rendered', bytes: buf.length };
    } catch (err) {
      if (attempt === MAX_RETRIES) return { ...job, status: 'failed', error: err.message };
      await sleep(Math.min(30000, 1000 * 2 ** attempt));
    }
  }
}

let done = 0, rendered = 0, failed = 0, skipped = 0;
const failures = [];
async function worker(queue) {
  while (queue.length) {
    const r = await render(queue.shift());
    done++;
    if (r.status === 'rendered') rendered++; else if (r.status === 'failed') { failed++; failures.push({ id: r.id, kind: r.kind, error: r.error }); } else skipped++;
    event({ phase: 'render', done, total: pending.length, kind: r.kind, id: r.id, status: r.status, bytes: r.bytes, reordered: r.reordered || false, error: r.error });
    if (done % 25 === 0 || done === pending.length) console.log(`utah: ${done}/${pending.length} rendered=${rendered} skipped=${skipped} failed=${failed}`);
  }
}
const queue = pending.slice();
await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length || 1) }, () => worker(queue)));

// Pace post-step (fleet standard: atempo 0.85, pitch preserved) on clips rendered THIS run only.
let paced = 0;
if (PACE_FACTOR && PACE_FACTOR !== 1 && fs.existsSync(FFMPEG)) {
  for (const j of pending) {
    if (!sizeOk(j.file)) continue;
    const tmp = j.file + '.pace.mp3';
    const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', j.file, '-filter:a', `atempo=${PACE_FACTOR}`, tmp], { stdio: 'ignore' });
    if (r.status === 0 && sizeOk(tmp)) { fs.renameSync(tmp, j.file); paced++; } else { try { fs.unlinkSync(tmp); } catch {} }
  }
  console.log(`pace: atempo ${PACE_FACTOR} applied to ${paced} clips`);
} else if (PACE_FACTOR && PACE_FACTOR !== 1) {
  console.log(`pace: ffmpeg not found at ${FFMPEG} — clips left at TTS pace (instruction clause only)`);
}

// Manifest: every clip present on disk, with hashes; coverage gate counts.
const entries = jobs.filter((j) => sizeOk(j.file)).map((j) => ({
  kind: j.kind, id: j.id, section: j.section, file_ref: path.relative(path.join(LANE, 'app-preview'), j.file).replace(/\\/g, '/'),
  bytes: fs.statSync(j.file).size, sha256: sha(j.file), reordered: j.reordered || false,
  ...(j.unit_id ? { unit_id: j.unit_id, slide_id: j.slide_id } : {}),
}));
const missing = jobs.filter((j) => !sizeOk(j.file));
const cardIds = [...new Set(jobs.filter((j) => j.kind.startsWith('card_')).map((j) => j.id))];
const cardsComplete = cardIds.filter((id) => ['q', 'a', 'teach'].every((s) => sizeOk(path.join(AUDIO, `${id}.${s}.mp3`))));
writeJson(MANIFEST, {
  artifact: 'AudioAssetManifest', schema_version: '1.0.0-utah-lane', lane: 'utah-class-d', generated_at: new Date().toISOString(),
  minted_by: { provider: 'openai_audio_api', model: MODEL, voice: VOICE, instructions: INSTRUCTIONS, pace_atempo: paced ? PACE_FACTOR : null, not_a_meta_model: true },
  runtime_policy: 'play_pre_generated_files_only', live_tts_in_user_flow: false,
  think: thinkFiles, pause_ms: 3000,
  totals: { clips: entries.length, cards: cardIds.length, cards_complete: cardsComplete.length, cards_missing_voice: cardIds.length - cardsComplete.length, slides, slides_with_audio: entries.filter((e) => e.kind === 'slide').length, sessions_missing_audio: slides - entries.filter((e) => e.kind === 'slide').length, recaps, missing: missing.length },
  this_run: { rendered, skipped, failed, paced, failures },
  entries,
});
console.log(`DONE: ${entries.length}/${jobs.length} clips on disk · cards complete ${cardsComplete.length}/${cardIds.length} · slides ${slides - missing.filter((m) => m.kind === 'slide').length}/${slides} · failed ${failed} → ${path.relative(LANE, MANIFEST)}`);
process.exit(failed ? 2 : 0);
