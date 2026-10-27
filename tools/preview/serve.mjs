// serve.mjs — local dev server for app-preview/ (Muse Code, preview lane).
// Static app-preview/ on 127.0.0.1:4310 + ONE endpoint: POST /api/transcribe,
// a dev proxy to Meta Voice Transcribe. No other network. Usage:
//   node tools/preview/serve.mjs [port]
// Needs MODEL_API_KEY in the lane-root .env (dotenv, already installed).
// Never logs or serves the key; never serves .env.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const here = path.dirname(fileURLToPath(import.meta.url));
const laneRoot = path.resolve(here, '..', '..');
const root = path.join(laneRoot, 'app-preview');
dotenv.config({ path: path.join(laneRoot, '.env') });

const META_URL = 'https://api.meta.ai/v1/asr/transcribe';
const META_MODEL = 'muse-voice-transcribe-1.0';
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const UPSTREAM_TIMEOUT_MS = 20 * 1000; // 20 s
const LOG_PATH = path.join(root, 'data', 'voice-log.jsonl');

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.jsonl': 'application/x-ndjson; charset=utf-8', '.mp3': 'audio/mpeg' };

// Append one log line. Fields only: ts, bytes, elapsed_ms, status, chars.
// Never the audio, never the key.
function logCall(rec) {
  try {
    fs.appendFileSync(LOG_PATH, JSON.stringify(rec) + '\n');
  } catch { /* local log is best-effort; the response still goes out */ }
}

// Extract audio bytes from a multipart/form-data body (first audio-ish part)
// or return the raw body unchanged.
function extractAudio(body, contentType) {
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

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0].split('#')[0]);
    if (req.method === 'POST' && urlPath === '/api/transcribe') {
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
        logCall({ ts: new Date().toISOString(), bytes: audio.length, elapsed_ms: out.elapsed_ms, status: 200, chars: out.transcript.length });
        console.log(`transcribe ok bytes=${audio.length} elapsed_ms=${out.elapsed_ms}`);
        res.writeHead(200, { 'content-type': 'application/json' });
        return res.end(JSON.stringify(out));
      } catch (e) {
        const elapsed_ms = e.elapsed_ms ?? (Date.now() - started);
        logCall({ ts: new Date().toISOString(), bytes: audio.length, elapsed_ms, status: 'error', chars: 0, error: e.code || 'forward_failed' });
        console.log(`transcribe error bytes=${audio.length} elapsed_ms=${elapsed_ms} code=${e.code || 'forward_failed'}`);
        const status = e.code === 'NO_API_KEY' ? 503 : 502;
        res.writeHead(status, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ error: e.code === 'NO_API_KEY' ? 'transcription unavailable: server has no MODEL_API_KEY' : 'transcription upstream failed' }));
      }
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405); return res.end();
    }
    if (path.basename(urlPath) === '.env') { res.writeHead(403); return res.end(); }
    let file = path.resolve(root, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(500, { 'content-type': 'application/json' });
    if (!res.writableEnded) res.end(JSON.stringify({ error: 'proxy error' }));
  }
});

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.argv[2] ?? 4310);
  server.listen(port, '127.0.0.1', () => console.log(`app-preview on http://127.0.0.1:${port} (+ POST /api/transcribe)`));
}
