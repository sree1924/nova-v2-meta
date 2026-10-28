// parked 2026-10-28 — not part of the learner loop; candidate for an onboarding/marketing agent; needs MODEL_API_KEY from .env; never log the key
//
// transcribe-proxy.parked.mjs — the former POST /api/transcribe handler, moved
// out of tools/preview/serve.mjs (founder decision 2026-10-28 23:20 MDT: no
// spoken recall in the study app). Nothing imports this file; serve.mjs is a
// plain static server with no network. To reuse, mount it from a server:
//
//   import { loadEnv, handleTranscribe } from './transcribe-proxy.parked.mjs';
//   loadEnv();
//   if (req.method === 'POST' && urlPath === '/api/transcribe') return handleTranscribe(req, res);
//
// Forwards a WAV body (raw audio/wav or multipart field "audio", 2 MB cap) to
// Meta Voice Transcribe (muse-voice-transcribe-1.0, PUSH_TO_TALK) and returns
// {transcript, elapsed_ms, model}. Optional local log (logPath) records only
// ts, bytes, elapsed_ms, status, chars — never the audio, never the key.
// Browser half: app-preview/parked/voice-recall.js.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const laneRoot = path.resolve(here, '..', '..');

const META_URL = 'https://api.meta.ai/v1/asr/transcribe';
const META_MODEL = 'muse-voice-transcribe-1.0';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const UPSTREAM_TIMEOUT_MS = 20 * 1000; // 20 s

// Load MODEL_API_KEY from the lane-root .env (dotenv, already installed).
// Never prints the key.
export async function loadEnv(envPath = path.join(laneRoot, '.env')) {
  const { default: dotenv } = await import('dotenv');
  dotenv.config({ path: envPath });
}

// Append one log line. Fields only: ts, bytes, elapsed_ms, status, chars.
// Never the audio, never the key.
function logCall(logPath, rec) {
  if (!logPath) return;
  try {
    fs.appendFileSync(logPath, JSON.stringify(rec) + '\n');
  } catch { /* local log is best-effort; the response still goes out */ }
}

// Extract audio bytes from a multipart/form-data body (first audio-ish part)
// or return the raw body unchanged.
export function extractAudio(body, contentType) {
  const m = /multipart\/form-data;\s*boundary=(?:"([^"]+)"|([^\s;]+))/i.exec(contentType || '');
  if (!m) return { audio: body, filename: 'recording.wav' };
  const boundary = '--' + (m[1] || m[2]);
  const parts = body.toString('latin1').split(boundary);
  for (const p of parts) {
    const sep = p.indexOf('\r\n\r\n');
    if (sep < 0) continue;
    const head = p.slice(0, sep);
    if (/name="audio"/i.test(head) || /content-type:\s*audio\//i.test(head) || /filename="/i.test(head)) {
      let data = p.slice(sep + 4);
      if (data.endsWith('\r\n')) data = data.slice(0, -2);
      const fn = (/filename="([^"]*)"/i.exec(head) || [])[1] || 'recording.wav';
      return { audio: Buffer.from(data, 'latin1'), filename: fn };
    }
  }
  return { audio: null, filename: null };
}

// Forward WAV bytes to Meta Voice Transcribe. Request shape per
// https://dev.meta.ai/docs/speech-to-text and
// https://dev.meta.ai/docs/api-reference/voice/transcribe:
// multipart with a `request` JSON part and an `audio` WAV part.
export async function transcribeAudio(audio, { filename = 'recording.wav' } = {}) {
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) {
    const err = new Error('MODEL_API_KEY is not set (lane-root .env)');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const started = Date.now();
  const form = new FormData();
  form.append('request', new Blob([JSON.stringify({ model: META_MODEL, audioEncoding: 'WAV', mode: 'PUSH_TO_TALK' })], { type: 'application/json' }), 'request.json');
  form.append('audio', new Blob([audio], { type: 'audio/wav' }), filename);
  const upstream = await fetch(META_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, accept: 'application/json' },
    body: form,
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });
  const elapsed_ms = Date.now() - started;
  const text = await upstream.text();
  if (!upstream.ok) {
    const err = new Error(`upstream ${upstream.status}: ${text.slice(0, 200)}`);
    err.code = 'UPSTREAM_' + upstream.status;
    err.elapsed_ms = elapsed_ms;
    throw err;
  }
  let json = {};
  try { json = JSON.parse(text); } catch { /* keep {} */ }
  const transcript = typeof json.transcript === 'string' && json.transcript
    ? json.transcript
    : Array.isArray(json.turns) ? json.turns.map((t) => t.transcript).filter(Boolean).join(' ') : '';
  return { transcript, elapsed_ms, model: META_MODEL };
}

function readBody(req, res) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BYTES) {
        res.writeHead(413, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'audio exceeds 2 MB' }));
        req.destroy();
        reject(Object.assign(new Error('too large'), { code: 'TOO_LARGE' }));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// The former POST /api/transcribe handler, unchanged in behavior.
// opts.logPath: optional JSONL log file (no default; nothing is logged unless set).
export async function handleTranscribe(req, res, { logPath = null } = {}) {
  const started = Date.now();
  let body;
  try {
    body = await readBody(req, res);
  } catch (e) {
    if (e.code === 'TOO_LARGE') return; // 413 already sent
    throw e;
  }
  const { audio, filename } = extractAudio(body, req.headers['content-type']);
  if (!audio || !audio.length) {
    res.writeHead(400, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: 'no audio part found (send multipart field "audio" or a raw audio body)' }));
  }
  try {
    const out = await transcribeAudio(audio, { filename });
    logCall(logPath, { ts: new Date().toISOString(), bytes: audio.length, elapsed_ms: out.elapsed_ms, status: 200, chars: out.transcript.length });
    console.log(`transcribe ok bytes=${audio.length} elapsed_ms=${out.elapsed_ms}`);
    res.writeHead(200, { 'content-type': 'application/json' });
    return res.end(JSON.stringify(out));
  } catch (e) {
    const elapsed_ms = e.elapsed_ms ?? (Date.now() - started);
    logCall(logPath, { ts: new Date().toISOString(), bytes: audio.length, elapsed_ms, status: 'error', chars: 0, error: e.code || 'forward_failed' });
    console.log(`transcribe error bytes=${audio.length} elapsed_ms=${elapsed_ms} code=${e.code || 'forward_failed'}`);
    const status = e.code === 'NO_API_KEY' ? 503 : 502;
    res.writeHead(status, { 'content-type': 'application/json' });
    return res.end(JSON.stringify({ error: e.code === 'NO_API_KEY' ? 'transcription unavailable: server has no MODEL_API_KEY' : 'transcription upstream failed' }));
  }
}
