#!/usr/bin/env node
/**
 * mint-piper-audio.mjs — lane copy of D:/nova/tools/mint-kokoro-audio.mjs driving tools/tts/piper-tts.py (Piper en_US-amy-medium, brisk), $0 offline. Founder 2026-10-30: Piper for all states before the hackathon; Kokoro replaces it later.
 *
 * Uses tools/tts/kokoro-tts.py (hexgrad/Kokoro-82M, default voice=af_heart, speed=0.95, pause=0.6s)
 * with persistent Python worker processes so KPipeline loads ONCE per worker.
 *
 * Supports THREE targets from the base workspace:
 *   1. Nova product-line tenant (app/public/tenants/<tenant>):
 *      node tools/mint-kokoro-audio.mjs --tenant <slug> [--go] [--limit=N] [--workers=2]
 *
 *   2. 51-State DMV Hackathon course (fb-ai-hackathon/app-preview/data/<state>/real or data/real):
 *      node tools/mint-kokoro-audio.mjs --state <CODE|utah> [--go] [--limit=N] [--sections=sec01...] [--workers=2]
 *
 *   3. Direct JSONL batch or single text clip:
 *      node tools/mint-kokoro-audio.mjs --text "Hello class." --out sample.mp3
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'); // D:/nova (lane copy lives in fb-ai-hackathon/tools/tts)
const PY_SCRIPT = path.join(ROOT, 'fb-ai-hackathon', 'tools', 'tts', 'piper-tts.py');
const PYTHON = process.env.PYTHON || 'python';
const FFMPEG = process.env.FFMPEG || path.join(ROOT, 'video-studio', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

const argv = process.argv.slice(2);
const opt = (name, fallback = '') => {
  const eq = argv.find((a) => a.startsWith(`${name}=`));
  if (eq) return eq.slice(name.length + 1);
  const idx = argv.indexOf(name);
  return idx >= 0 && argv[idx + 1] && !argv[idx + 1].startsWith('--') ? argv[idx + 1] : fallback;
};

const GO = argv.includes('--go');
const VOICE = opt('--voice', process.env.PIPER_TTS_VOICE || 'D:/nova/samples/piper-demo/en_US-amy-medium.onnx');
const SPEED = Number(opt('--speed', process.env.PIPER_TTS_SPEED || '1.08'));
const PAUSE = Number(opt('--pause', process.env.PIPER_TTS_PAUSE || '0.35'));
const BITRATE = opt('--bitrate', process.env.KOKORO_TTS_BITRATE || '48k');
const WORKERS = Math.max(1, Number(opt('--workers', process.env.AUDIO_WORKERS || '2')));
const THREADS = Math.max(1, Number(opt('--threads', process.env.AUDIO_THREADS || '4')));
const LIMIT = Number(opt('--limit', '0'));
const MIN_BYTES = Number(opt('--min-bytes', process.env.AUDIO_MIN_BYTES || '2048'));
const MODEL_ID = 'rhasspy/piper en_US-amy-medium (brisk: length 1.08, noise 0.65, noise_w 0.75)';

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJson = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
const shaFile = (f) => 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sizeOk = (f) => fs.existsSync(f) && fs.statSync(f).size > MIN_BYTES;
const oneLine = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const clipHash = (input) =>
  crypto.createHash('sha256').update(`${VOICE}|${MODEL_ID}|speed=${SPEED}|pause=${PAUSE}|${input}`).digest('hex');

function runBatchWorker(workerId, slice, onProgress) {
  return new Promise((resolve, reject) => {
    if (!slice.length) return resolve([]);
    const tmpJsonl = path.join(os.tmpdir(), `piper-batch-${process.pid}-w${workerId}-${Date.now()}.jsonl`);
    fs.writeFileSync(
      tmpJsonl,
      slice.map((j) => JSON.stringify({ id: j.id, text: j.input, out: j.file, voice: VOICE, speed: SPEED, pause: PAUSE, bitrate: BITRATE })).join('\n') + '\n'
    );
    const args = [
      PY_SCRIPT,
      '--batch', tmpJsonl,
      '--voice', VOICE,
      '--speed', String(SPEED),
      '--pause', String(PAUSE),
      '--bitrate', BITRATE,
      '--threads', String(THREADS),
      '--ffmpeg', FFMPEG,
    ];
    const proc = spawn(PYTHON, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    const results = [];
    let buf = '';
    proc.stdout.on('data', (chunk) => {
      buf += chunk.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, nl).trim();
        buf = buf.slice(nl + 1);
        if (!line.startsWith('{')) continue;
        try {
          const r = JSON.parse(line);
          results.push(r);
          onProgress?.(r);
        } catch {}
      }
    });
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
    proc.on('close', (code) => {
      try { fs.unlinkSync(tmpJsonl); } catch {}
      if (code !== 0 && results.length === 0) {
        return reject(new Error(`piper worker ${workerId} exited ${code}: ${stderr.slice(-400)}`));
      }
      resolve(results);
    });
  });
}

async function runPool(pending) {
  if (!pending.length) return { rendered: 0, failed: 0, failures: [] };
  const nWorkers = Math.min(WORKERS, pending.length);
  const buckets = Array.from({ length: nWorkers }, () => []);
  pending.forEach((job, i) => buckets[i % nWorkers].push(job));

  let done = 0, rendered = 0, failed = 0;
  const failures = [];
  const t0 = Date.now();

  await Promise.all(
    buckets.map((bucket, wIdx) =>
      runBatchWorker(wIdx, bucket, (r) => {
        done++;
        if (r.status === 'rendered') rendered++;
        else {
          failed++;
          failures.push({ id: r.id, out: r.out, error: r.error });
        }
        if (done % 10 === 0 || done === pending.length) {
          const elapsedMin = ((Date.now() - t0) / 60000).toFixed(1);
          console.log(`  [${done}/${pending.length}] rendered=${rendered} failed=${failed} (${elapsedMin}m elapsed)`);
        }
      })
    )
  );
  return { rendered, failed, failures };
}

// ---- Mode A: Single clip convenience ----
async function runSingleClip(text, textFile, out) {
  const args = [
    PY_SCRIPT,
    ...(text ? ['--text', text] : ['--text-file', textFile]),
    '--out', path.resolve(out),
    '--voice', VOICE,
    '--speed', String(SPEED),
    '--pause', String(PAUSE),
    '--bitrate', BITRATE,
    '--ffmpeg', FFMPEG,
  ];
  await new Promise((resolve, reject) => {
    const p = spawn(PYTHON, args, { stdio: 'inherit' });
    p.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

// ---- Mode B: 51-State DMV Hackathon lane ----
async function runHackathonState(stateArg) {
  const lane = path.join(ROOT, 'fb-ai-hackathon');
  const code = stateArg.toLowerCase();
  const realDir =
    code === 'ut' || code === 'utah'
      ? (fs.existsSync(path.join(lane, 'app-preview', 'data', 'ut', 'real'))
          ? path.join(lane, 'app-preview', 'data', 'ut', 'real')
          : path.join(lane, 'app-preview', 'data', 'real'))
      : path.join(lane, 'app-preview', 'data', code, 'real');

  if (!fs.existsSync(realDir)) throw new Error(`Missing state export dir: ${realDir}`);

  const audioDir =
    code === 'ut' || code === 'utah'
      ? path.join(lane, 'app-preview', 'audio')
      : path.join(lane, 'app-preview', 'audio', code);
  const sessionAudioDir = path.join(audioDir, 'sessions');
  fs.mkdirSync(sessionAudioDir, { recursive: true });

  const sectionsFilter = opt('--sections', '').split(',').filter(Boolean);
  const listJson = (d) => (fs.existsSync(d) ? fs.readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => path.join(d, f)) : []);
  const manifestData = fs.existsSync(path.join(realDir, 'manifest.json')) ? readJson(path.join(realDir, 'manifest.json')) : { files: [] };
  const sectionOf = (file) => {
    const j = readJson(file);
    return (
      j.section_id ||
      j.probe?.section_id ||
      manifestData.files?.find((e) => file.endsWith(path.basename(e.file)))?.section_id ||
      'unknown'
    );
  };

  const jobs = [];
  const thinkByText = new Map();
  let cards = 0, recaps = 0, slides = 0;

  for (const f of listJson(path.join(realDir, '05_card_scripts'))) {
    const j = readJson(f);
    const section = sectionOf(f);
    if (sectionsFilter.length && !sectionsFilter.includes(section)) continue;
    for (const s of j.audio_scripts || []) {
      if (s.is_recap || !s.segments) {
        const txt = oneLine(s.recap?.narration_text ?? s.recap?.text ?? s.recap ?? '');
        if (!txt) continue;
        recaps++;
        jobs.push({ kind: 'recap', id: s.card_id, section, file: path.join(audioDir, `${s.card_id}.recap.mp3`), input: txt });
        continue;
      }
      cards++;
      const q = oneLine(`${s.segments.question.lead_in || 'Question:'} ${s.segments.question.text}`);
      const a = oneLine(`${s.segments.answer.lead_in || 'Here is the answer:'} ${s.segments.answer.text}`);
      const t = oneLine(s.segments.teaching.text);
      jobs.push({ kind: 'card_q', id: s.card_id, section, file: path.join(audioDir, `${s.card_id}.q.mp3`), input: q });
      jobs.push({ kind: 'card_a', id: s.card_id, section, file: path.join(audioDir, `${s.card_id}.a.mp3`), input: a });
      jobs.push({ kind: 'card_teach', id: s.card_id, section, file: path.join(audioDir, `${s.card_id}.teach.mp3`), input: t });
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
    const file = path.join(audioDir, thinkIdx === 0 ? '_think.mp3' : `_think.${thinkIdx}.mp3`);
    thinkIdx++;
    for (const s of v.sections) thinkFiles[s] = path.basename(file);
    jobs.push({ kind: 'think', id: path.basename(file), section: v.sections.join('+'), file, input: text });
  }

  for (const f of listJson(path.join(realDir, '05_sessions'))) {
    const j = readJson(f);
    const section = sectionOf(f);
    if (sectionsFilter.length && !sectionsFilter.includes(section)) continue;
    for (const u of j.units || []) {
      for (const sl of u.slides || []) {
        const txt = oneLine(sl.narration?.text ?? sl.narration ?? '');
        if (!txt) continue;
        slides++;
        jobs.push({
          kind: 'slide',
          id: `${u.unit_id}/${sl.slide_id}`,
          section,
          unit_id: u.unit_id,
          slide_id: sl.slide_id,
          file: path.join(sessionAudioDir, `${u.unit_id}.${sl.slide_id}.mp3`),
          input: txt,
        });
      }
    }
  }

  for (const j of jobs) j.text_sha256 = clipHash(j.input);
  const chars = jobs.reduce((n, j) => n + j.input.length, 0);
  let pending = jobs.filter((j) => !sizeOk(j.file));
  if (LIMIT > 0) pending = pending.slice(0, LIMIT);

  console.log(
    `PIPER MINT [${code.toUpperCase()}] — model=${MODEL_ID} voice=${VOICE} speed=${SPEED} pause=${PAUSE}s cost=$0.00 (local; licence unverified, founder-accepted 2026-10-30)\n` +
      `  total=${jobs.length} (${cards} cards×3 + ${recaps} recaps + ${thinkByText.size} think + ${slides} slides; ${chars.toLocaleString()} chars)\n` +
      `  pending=${pending.length}  workers=${WORKERS}  ` +
      (GO ? 'MINTING (--go)...' : 'DRY RUN — pass --go to mint.')
  );
  if (!GO) return;

  // Cross-clip exact text deduplication within the run: synthesize unique spoken strings first, then copy duplicates
  const byHashPending = new Map();
  const duplicates = [];
  for (const j of pending) {
    if (!byHashPending.has(j.text_sha256)) byHashPending.set(j.text_sha256, j);
    else duplicates.push({ target: j, canonical: byHashPending.get(j.text_sha256) });
  }
  const uniquePending = [...byHashPending.values()];
  if (duplicates.length) {
    console.log(`  dedup: ${uniquePending.length} unique utterances (${duplicates.length} exact duplicate clips will copy after render)`);
  }

  const { rendered, failed, failures } = await runPool(uniquePending);
  let copiedDups = 0;
  for (const { target, canonical } of duplicates) {
    if (sizeOk(canonical.file) && !sizeOk(target.file)) {
      fs.mkdirSync(path.dirname(target.file), { recursive: true });
      fs.copyFileSync(canonical.file, target.file);
      copiedDups++;
    }
  }

  const manifestPath = path.join(audioDir, 'audio-manifest.json');
  const entries = jobs.filter((j) => sizeOk(j.file)).map((j) => {
    const file_ref = path.relative(path.join(lane, 'app-preview'), j.file).replace(/\\/g, '/');
    return {
      kind: j.kind,
      id: j.id,
      section: j.section,
      file_ref,
      text_sha256: j.text_sha256,
      chars: j.input.length,
      bytes: fs.statSync(j.file).size,
      sha256: shaFile(j.file),
      shrunk_bitrate: BITRATE,
      channels: 1,
      sample_rate_hz: 24000,
      ...(j.unit_id ? { unit_id: j.unit_id, slide_id: j.slide_id } : {}),
    };
  });
  const byHash = {};
  for (const e of entries) byHash[e.text_sha256] ??= e.file_ref;
  const cardIds = [...new Set(jobs.filter((j) => j.kind.startsWith('card_')).map((j) => j.id))];
  const cardsComplete = cardIds.filter((id) => ['q', 'a', 'teach'].every((s) => sizeOk(path.join(audioDir, `${id}.${s}.mp3`))));

  writeJson(manifestPath, {
    artifact: 'AudioAssetManifest',
    schema_version: '1.0.0-piper-offline',
    lane: `${code}-driver-prep`,
    generated_at: new Date().toISOString(),
    minted_by: {
      provider: 'piper_local_offline',
      model: MODEL_ID,
      license: 'unverified (Piper en_US-amy-medium; founder accepted 2026-10-30, to be replaced by Kokoro)',
      voice: VOICE,
      speed: SPEED,
      sentence_pause_s: PAUSE,
      bitrate: BITRATE,
      cost_usd: 0,
    },
    runtime_policy: 'play_pre_generated_files_only',
    live_tts_in_user_flow: false,
    by_hash: byHash,
    by_hash_count: Object.keys(byHash).length,
    think: thinkFiles,
    pause_ms: 3000,
    totals: {
      clips: entries.length,
      cards: cardIds.length,
      cards_complete: cardsComplete.length,
      cards_missing_voice: cardIds.length - cardsComplete.length,
      slides,
      slides_with_audio: entries.filter((e) => e.kind === 'slide').length,
      sessions_missing_audio: slides - entries.filter((e) => e.kind === 'slide').length,
      recaps,
      missing: jobs.length - entries.length,
    },
    this_run: { rendered, copied_duplicates: copiedDups, failed, failures },
    entries,
  });
  console.log(
    `DONE [${code.toUpperCase()}]: ${entries.length}/${jobs.length} clips on disk · rendered=${rendered} dedup_copied=${copiedDups} failed=${failed} → ${path.relative(ROOT, manifestPath)}`
  );
  if (failed) process.exit(2);
}

// ---- Mode C: Nova Factory Product-Line Tenant ----
async function runTenant(tenant) {
  const tenantDir = path.join(ROOT, 'app', 'public', 'tenants', tenant);
  if (!fs.existsSync(tenantDir)) throw new Error(`Missing tenant dir: ${tenantDir}`);
  const deck = readJson(path.join(tenantDir, '04-carddeck.json'));
  const sessions = readJson(path.join(tenantDir, '05b-session-scripts.json'));
  const audioDir = path.join(tenantDir, 'audio');
  const sessionAudioDir = path.join(audioDir, 'sessions');
  fs.mkdirSync(sessionAudioDir, { recursive: true });

  const cards = (deck.decks || []).flatMap((d) => (d.cards || []).map((card) => ({ deck: d, card })));
  const slides = (sessions.sessions || []).flatMap((session) => (session.slides || []).map((slide) => ({ session, slide })));

  const jobs = [
    ...cards.map(({ card }) => ({
      kind: 'card',
      id: card.id,
      file: path.join(audioDir, card.audio_file || `${card.id}.mp3`),
      input: oneLine(`Question: ${card.front}. Answer: ${card.back}. Remember: ${card.memory_hook || 'say the exact answer, then test it again.'}`),
    })),
    ...slides.map(({ session, slide }) => ({
      kind: 'session_slide',
      id: `${session.module_id}/${slide.slide_id}`,
      file: path.join(sessionAudioDir, slide.audio_file || `session.${session.module_id}.${slide.slide_id}.mp3`),
      input: oneLine(slide.narration_text || `${session.title}. ${slide.title}. ${(slide.lines || []).join(' ')}`),
    })),
  ];

  let pending = jobs.filter((j) => !sizeOk(j.file));
  if (LIMIT > 0) pending = pending.slice(0, LIMIT);

  console.log(
    `KOKORO TENANT MINT [${tenant}] — model=${MODEL_ID} voice=${VOICE} speed=${SPEED} cost=$0.00\n` +
      `  total=${jobs.length}  pending=${pending.length}  workers=${WORKERS}  ` +
      (GO ? 'MINTING (--go)...' : 'DRY RUN — pass --go to mint.')
  );
  if (!GO) return;

  const { rendered, failed } = await runPool(pending);
  console.log(`DONE [${tenant}]: rendered=${rendered} failed=${failed}`);
  if (failed) process.exit(2);
}

async function main() {
  const state = opt('--state');
  const tenant = opt('--tenant');
  const text = opt('--text');
  const textFile = opt('--text-file');
  const out = opt('--out');

  if (text || textFile) {
    if (!out) throw new Error('Pass --out <file.mp3|file.wav> with --text or --text-file');
    return runSingleClip(text, textFile, out);
  }
  if (state) return runHackathonState(state);
  if (tenant) return runTenant(tenant);

  console.log(
    `Usage:\n` +
      `  1. 51-State DMV course:  node tools/mint-kokoro-audio.mjs --state <CODE> [--go] [--limit=N] [--workers=2]\n` +
      `  2. Nova tenant course:   node tools/mint-kokoro-audio.mjs --tenant <slug> [--go] [--limit=N] [--workers=2]\n` +
      `  3. Single audio clip:    node tools/mint-kokoro-audio.mjs --text "Hello" --out clip.mp3 [--voice af_heart] [--speed 0.95]`
  );
}

main().catch((err) => {
  console.error('KOKORO MINT ERROR:', err.message);
  process.exit(1);
});
