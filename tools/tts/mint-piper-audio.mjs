#!/usr/bin/env node
/**
 * mint-piper-audio.mjs — Zero-cracking, dynamic work-stealing offline Piper TTS minter ($0.00).
 *
 * Drives tools/tts/piper-tts.py in persistent --worker mode (stdin -> stdout JSONL) with:
 * - In-RAM LAME C MP3 encoding (64k mono @ native 22050 Hz, zero ffmpeg.exe spawns)
 * - Raised-cosine phrase envelopes + DC offset removal + -3 dBFS true-peak headroom (zero cracking)
 * - Dynamic work-stealing worker pool + ONNX thread pinning (default 6 workers x 2 threads on 12-core CPU)
 * - Hash-aware staleness detection (re-renders if text_sha256 changed after a fact fix)
 * - Safe --sections manifest merge (partial runs never clobber existing sections)
 * - Cross-state Piper utterance deduplication (identical text_sha256 copies in 0 ms)
 * - Per-state single-instance lock file
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..'); // D:/nova
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
const FORCE = argv.includes('--force');
const VOICE = opt('--voice', process.env.PIPER_TTS_VOICE || 'D:/nova/samples/piper-demo/en_US-amy-medium.onnx');
const SPEED = Number(opt('--speed', process.env.PIPER_TTS_SPEED || '1.03'));
const PAUSE = Number(opt('--pause', process.env.PIPER_TTS_PAUSE || '0.38'));
const GAIN = Number(opt('--gain', process.env.PIPER_TTS_GAIN || '0.72'));
const BITRATE = opt('--bitrate', process.env.PIPER_TTS_BITRATE || '64k');
const DEFAULT_WORKERS = 4;
const WORKERS = Math.max(1, Number(opt('--workers', process.env.AUDIO_WORKERS || String(DEFAULT_WORKERS))));
const THREADS = Math.max(1, Number(opt('--threads', process.env.AUDIO_THREADS || '2')));
const LIMIT = Number(opt('--limit', '0'));
const MIN_BYTES = Number(opt('--min-bytes', process.env.AUDIO_MIN_BYTES || '1536'));
const MODEL_ID = 'rhasspy/piper en_US-amy-medium (clean-teacher v3: length 1.03, noise 0.60, noise_w 0.72, cosine-fade, -3dBFS LAME q2)';

const sleepBuf = new Int32Array(new SharedArrayBuffer(4));
const sleepSync = (ms) => Atomics.wait(sleepBuf, 0, 0, ms);

const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJsonAtomic = (f, o) => {
  const payload = JSON.stringify(o, null, 2) + '\n';
  fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.tmp.${process.pid}`;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      fs.writeFileSync(tmp, payload);
      fs.renameSync(tmp, f);
      return;
    } catch (err) {
      if (attempt === 10) {
        try { fs.unlinkSync(tmp); } catch {}
        throw err;
      }
      sleepSync(35 * attempt);
    }
  }
};
const copyFileRetry = (src, dst) => {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  const tmp = `${dst}.tmp.${process.pid}`;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      fs.copyFileSync(src, tmp);
      fs.renameSync(tmp, dst);
      return;
    } catch (err) {
      if (attempt === 8) {
        try { fs.unlinkSync(tmp); } catch {}
        throw err;
      }
      sleepSync(30 * attempt);
    }
  }
};

const shaFile = (f) => 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const sizeOk = (f) => fs.existsSync(f) && fs.statSync(f).size >= MIN_BYTES;
const oneLine = (t) => String(t ?? '').replace(/\s+/g, ' ').trim();
const clipHash = (input) =>
  crypto.createHash('sha256').update(`${VOICE}|${MODEL_ID}|speed=${SPEED}|pause=${PAUSE}|gain=${GAIN}|bitrate=${BITRATE}|${input}`).digest('hex');

function acquireLock(lockFile) {
  fs.mkdirSync(path.dirname(lockFile), { recursive: true });
  if (fs.existsSync(lockFile)) {
    try {
      const info = readJson(lockFile);
      process.kill(info.pid, 0);
      throw new Error(`Another mint-piper-audio process (pid=${info.pid}) already holds ${lockFile}`);
    } catch (err) {
      if (err.code !== 'ESRCH' && !String(err.message).includes('JSON')) throw err;
    }
  }
  fs.writeFileSync(lockFile, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString(), argv }, null, 2));
  const release = () => { try { fs.unlinkSync(lockFile); } catch {} };
  process.on('exit', release);
  process.on('SIGINT', () => { release(); process.exit(130); });
  process.on('SIGTERM', () => { release(); process.exit(143); });
  return release;
}

// Dynamic work-stealing streaming worker pool (--worker stdin -> stdout)
async function runPool(pending) {
  if (!pending.length) return { rendered: 0, failed: 0, failures: [], sampleRate: 22050, audioSec: 0 };
  const nWorkers = Math.min(WORKERS, pending.length);
  let cursor = 0;
  let done = 0, rendered = 0, failed = 0, audioSec = 0, sampleRate = 22050;
  const failures = [];
  const t0 = Date.now();
  const reportEvery = Math.max(10, Math.min(50, Math.floor(pending.length / 20) || 10));

  const spawnWorker = (workerId) =>
    new Promise((resolve, reject) => {
      const args = [
        PY_SCRIPT,
        '--worker',
        '--voice', VOICE,
        '--speed', String(SPEED),
        '--pause', String(PAUSE),
        '--gain', String(GAIN),
        '--bitrate', BITRATE,
        '--threads', String(THREADS),
        '--ffmpeg', FFMPEG,
      ];
      const proc = spawn(PYTHON, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUTF8: '1', PYTHONIOENCODING: 'utf-8' },
      });
      let buf = '';
      let stderr = '';
      let ready = false;
      let closing = false;

      const sendNext = () => {
        if (cursor < pending.length) {
          const j = pending[cursor++];
          proc.stdin.write(JSON.stringify({ id: j.id, text: j.input, out: j.file, speed: SPEED, pause: PAUSE, gain: GAIN, bitrate: BITRATE }) + '\n');
        } else if (!closing) {
          closing = true;
          try {
            proc.stdin.write(JSON.stringify({ cmd: 'quit' }) + '\n');
            proc.stdin.end();
          } catch {}
        }
      };

      proc.stdout.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        let nl;
        while ((nl = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line.startsWith('{')) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }
          if (msg.ready) {
            ready = true;
            if (msg.sample_rate) sampleRate = msg.sample_rate;
            sendNext();
            continue;
          }
          done++;
          if (msg.status === 'rendered') {
            rendered++;
            audioSec += Number(msg.duration_s || 0);
            if (msg.sample_rate) sampleRate = msg.sample_rate;
          } else {
            failed++;
            failures.push({ id: msg.id, out: msg.out, error: msg.error });
          }
          if (done % reportEvery === 0 || done === pending.length) {
            const wallSec = (Date.now() - t0) / 1000;
            const rtf = wallSec > 0 ? (audioSec / wallSec).toFixed(1) : '0.0';
            const ratePerSec = wallSec > 0 ? (done / wallSec).toFixed(1) : '0.0';
            console.log(`  [${done}/${pending.length}] rendered=${rendered} failed=${failed} · ${ratePerSec} clips/s · ${rtf}x realtime (${wallSec.toFixed(1)}s elapsed)`);
          }
          sendNext();
        }
      });

      proc.stderr.on('data', (chunk) => { stderr += chunk.toString('utf8'); });
      proc.on('close', (code) => {
        if (!ready || (code !== 0 && !closing)) {
          return reject(new Error(`piper worker ${workerId} exited ${code}: ${stderr.slice(-400)}`));
        }
        resolve();
      });
    });

  await Promise.all(Array.from({ length: nWorkers }, (_, i) => spawnWorker(i)));
  return { rendered, failed, failures, sampleRate, audioSec };
}

function loadFleetPiperCache(lane) {
  const cache = new Map();
  const audioRoot = path.join(lane, 'app-preview', 'audio');
  if (!fs.existsSync(audioRoot)) return cache;
  const manifestCandidates = [path.join(audioRoot, 'audio-manifest.json')];
  for (const d of fs.readdirSync(audioRoot, { withFileTypes: true })) {
    if (d.isDirectory() && d.name !== 'sessions') {
      manifestCandidates.push(path.join(audioRoot, d.name, 'audio-manifest.json'));
    }
  }
  for (const mp of manifestCandidates) {
    if (!fs.existsSync(mp)) continue;
    try {
      const m = readJson(mp);
      if (m.minted_by?.provider !== 'piper_local_offline' || m.minted_by?.model !== MODEL_ID) continue;
      for (const e of m.entries || []) {
        if (!e.text_sha256 || !e.file_ref || cache.has(e.text_sha256)) continue;
        const abs = path.join(lane, 'app-preview', e.file_ref);
        if (sizeOk(abs)) cache.set(e.text_sha256, abs);
      }
    } catch {}
  }
  return cache;
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
    '--gain', String(GAIN),
    '--bitrate', BITRATE,
    '--threads', String(THREADS),
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

  // Load existing state audio-manifest (for hash-aware staleness detection + --sections safe merge)
  const manifestPath = path.join(audioDir, 'audio-manifest.json');
  const prevManifest = fs.existsSync(manifestPath) ? (() => { try { return readJson(manifestPath); } catch { return null; } })() : null;
  const prevByFileRef = new Map();
  if (prevManifest && Array.isArray(prevManifest.entries)) {
    for (const e of prevManifest.entries) {
      if (e.file_ref) prevByFileRef.set(e.file_ref, e);
    }
  }

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
  const thinkFiles = { ...(prevManifest?.think || {}) };
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

  for (const j of jobs) {
    j.file_ref = path.relative(path.join(lane, 'app-preview'), j.file).replace(/\\/g, '/');
    j.text_sha256 = clipHash(j.input);
  }
  const chars = jobs.reduce((n, j) => n + j.input.length, 0);

  // Hash-aware freshness check: clip is fresh only if prior manifest (when present) is Piper offline,
  // file exists, AND (no prior manifest entry OR text_sha256 matches)
  const nonPiperManifest = Boolean(prevManifest && prevManifest.schema_version !== '1.0.0-piper-offline');
  const isFresh = (j) => {
    if (FORCE || nonPiperManifest || !sizeOk(j.file)) return false;
    const prev = prevByFileRef.get(j.file_ref);
    if (prev && prev.text_sha256 && prev.text_sha256 !== j.text_sha256) return false;
    return true;
  };

  let pending = jobs.filter((j) => !isFresh(j));
  if (LIMIT > 0) pending = pending.slice(0, LIMIT);

  console.log(
    `PIPER MINT [${code.toUpperCase()}] — model=${MODEL_ID}\n` +
      `  voice=${VOICE} speed=${SPEED} pause=${PAUSE}s gain=${GAIN} bitrate=${BITRATE} workers=${WORKERS} threads=${THREADS} cost=$0.00\n` +
      `  total=${jobs.length} (${cards} cards×3 + ${recaps} recaps + ${thinkByText.size} think + ${slides} slides; ${chars.toLocaleString()} chars)\n` +
      `  pending=${pending.length}  ` +
      (GO ? 'MINTING (--go)...' : 'DRY RUN — pass --go to mint.')
  );
  if (!GO) return;

  const releaseLock = acquireLock(path.join(audioDir, '.mint.lock'));
  const tStart = Date.now();
  try {
    // 1. Cross-state Piper cache reuse (instant 0ms copy when identical utterance already exists on disk)
    const fleetCache = loadFleetPiperCache(lane);
    let cacheHits = 0;
    const stillPending = [];
    for (const j of pending) {
      const cachedSrc = fleetCache.get(j.text_sha256);
      if (cachedSrc && path.resolve(cachedSrc) !== path.resolve(j.file) && sizeOk(cachedSrc)) {
        copyFileRetry(cachedSrc, j.file);
        cacheHits++;
      } else {
        stillPending.push(j);
      }
    }

    // 2. Within-run deduplication: sort slightly longer slides first so tail workers finish short clips smoothly
    const byHashPending = new Map();
    const duplicates = [];
    for (const j of stillPending) {
      if (!byHashPending.has(j.text_sha256)) byHashPending.set(j.text_sha256, j);
      else duplicates.push({ target: j, canonical: byHashPending.get(j.text_sha256) });
    }
    const uniquePending = [...byHashPending.values()].sort((a, b) => b.input.length - a.input.length);
    if (cacheHits || duplicates.length) {
      console.log(`  dedup: ${uniquePending.length} unique renders · ${duplicates.length} intra-state dups · ${cacheHits} cross-state cache copies`);
    }

    const { rendered, failed, failures, sampleRate, audioSec } = await runPool(uniquePending);

    let copiedDups = cacheHits;
    for (const { target, canonical } of duplicates) {
      if (sizeOk(canonical.file)) {
        copyFileRetry(canonical.file, target.file);
        copiedDups++;
      }
    }

    const freshEntries = jobs.filter((j) => sizeOk(j.file)).map((j) => {
      const prev = prevByFileRef.get(j.file_ref);
      const stat = fs.statSync(j.file);
      const unchanged = prev && prev.text_sha256 === j.text_sha256 && prev.bytes === stat.size && prev.sha256;
      return {
        kind: j.kind,
        id: j.id,
        section: j.section,
        file_ref: j.file_ref,
        text_sha256: j.text_sha256,
        chars: j.input.length,
        bytes: stat.size,
        sha256: unchanged ? prev.sha256 : shaFile(j.file),
        shrunk_bitrate: BITRATE,
        channels: 1,
        sample_rate_hz: sampleRate || 22050,
        ...(j.unit_id ? { unit_id: j.unit_id, slide_id: j.slide_id } : {}),
      };
    });

    // Safe merge when --sections is used: keep untouched sections from prevManifest
    let entries = freshEntries;
    if (sectionsFilter.length && prevManifest && Array.isArray(prevManifest.entries)) {
      const freshRefs = new Set(freshEntries.map((e) => e.file_ref));
      const kept = prevManifest.entries.filter((e) => !freshRefs.has(e.file_ref) && !sectionsFilter.includes(e.section));
      entries = [...kept, ...freshEntries];
    }

    const byHash = {};
    for (const e of entries) byHash[e.text_sha256] ??= e.file_ref;
    const allCardIds = [...new Set(entries.filter((e) => e.kind.startsWith('card_')).map((e) => e.id))];
    const cardsComplete = allCardIds.filter((id) => ['q', 'a', 'teach'].every((s) => sizeOk(path.join(audioDir, `${id}.${s}.mp3`))));
    const slideEntries = entries.filter((e) => e.kind === 'slide');
    const recapEntries = entries.filter((e) => e.kind === 'recap');
    const wallSec = +((Date.now() - tStart) / 1000).toFixed(2);

    writeJsonAtomic(manifestPath, {
      artifact: 'AudioAssetManifest',
      schema_version: '1.0.0-piper-offline',
      lane: `${code}-driver-prep`,
      generated_at: new Date().toISOString(),
      minted_by: {
        provider: 'piper_local_offline',
        model: MODEL_ID,
        not_a_meta_model: true,
        license: 'unverified (Piper en_US-amy-medium; founder accepted 2026-10-30, to be replaced by Kokoro)',
        voice: VOICE,
        speed: SPEED,
        sentence_pause_s: PAUSE,
        gain_ceiling: GAIN,
        bitrate: BITRATE,
        sample_rate_hz: sampleRate || 22050,
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
        cards: allCardIds.length,
        cards_complete: cardsComplete.length,
        cards_missing_voice: sectionsFilter.length ? Math.max(0, cards - cardsComplete.length) : Math.max(0, cards - cardsComplete.length),
        slides: sectionsFilter.length ? slideEntries.length : slides,
        slides_with_audio: slideEntries.length,
        sessions_missing_audio: sectionsFilter.length ? 0 : Math.max(0, slides - slideEntries.length),
        recaps: sectionsFilter.length ? recapEntries.length : recaps,
        missing: Math.max(0, jobs.length - freshEntries.length),
      },
      this_run: {
        rendered,
        copied_duplicates: copiedDups,
        failed,
        failures,
        wall_seconds: wallSec,
        rendered_audio_seconds: +audioSec.toFixed(2),
        realtime_factor: wallSec > 0 ? +(audioSec / wallSec).toFixed(2) : 0,
      },
      entries,
    });
    console.log(
      `DONE [${code.toUpperCase()}]: ${freshEntries.length}/${jobs.length} clips in ${wallSec}s (${(wallSec / 60).toFixed(2)}m) · ` +
        `audio=${(audioSec / 60).toFixed(1)}m (${wallSec > 0 ? (audioSec / wallSec).toFixed(1) : '0'}x RT) · ` +
        `rendered=${rendered} dedup_copied=${copiedDups} failed=${failed} → ${path.relative(ROOT, manifestPath)}`
    );
    if (failed) process.exit(2);
  } finally {
    releaseLock();
  }
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
    `PIPER TENANT MINT [${tenant}] — model=${MODEL_ID} voice=${VOICE} speed=${SPEED} cost=$0.00\n` +
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
      `  1. 51-State DMV course:  node tools/tts/mint-piper-audio.mjs --state <CODE> [--go] [--limit=N] [--workers=6]\n` +
      `  2. Nova tenant course:   node tools/tts/mint-piper-audio.mjs --tenant <slug> [--go] [--limit=N] [--workers=6]\n` +
      `  3. Single audio clip:    node tools/tts/mint-piper-audio.mjs --text "Hello" --out clip.mp3`
  );
}

main().catch((err) => {
  console.error('PIPER MINT ERROR:', err.message);
  process.exit(1);
});
