#!/usr/bin/env node
// shrink-clips.mjs — re-encode minted narration to mono 48 kbps mp3 (speech-grade, ~1/4 the size) in place and rewrite the
// manifest's bytes/sha256 so the coverage gate and provenance stay truthful. Idempotent: clips already ≤ target bitrate skip.
//   node tools/audio/shrink-clips.mjs [--bitrate 48k] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const AUDIO = path.join(LANE, 'app-preview', 'audio');
const MANIFEST = path.join(AUDIO, 'audio-manifest.json');
const FFMPEG = process.env.FFMPEG || 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe';
const FFPROBE = FFMPEG.replace(/ffmpeg(\.exe)?$/, 'ffprobe$1');
const args = process.argv.slice(2);
const BITRATE = (args.find((a) => a.startsWith('--bitrate')) ? args[args.indexOf('--bitrate') + 1] : null) || '48k';
const DRY = args.includes('--dry');
const sha = (f) => 'sha256:' + crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
if (!fs.existsSync(FFMPEG)) { console.error('ffmpeg not found at ' + FFMPEG); process.exit(1); }
if (!fs.existsSync(MANIFEST)) { console.error('manifest not found; run the minter first'); process.exit(1); }

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
let before = 0, after = 0, done = 0, skipped = 0, failed = 0;
for (const e of manifest.entries) {
  const file = path.join(LANE, 'app-preview', e.file_ref);
  if (!fs.existsSync(file)) { failed++; continue; }
  const b0 = fs.statSync(file).size; before += b0;
  if (e.shrunk_bitrate === BITRATE) { after += b0; skipped++; continue; }
  if (DRY) { after += Math.round(b0 / 4); done++; continue; }
  const tmp = file + '.shrink.mp3';
  const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', file, '-ac', '1', '-ar', '24000', '-b:a', BITRATE, tmp], { stdio: 'ignore' });
  if (r.status !== 0 || !fs.existsSync(tmp) || fs.statSync(tmp).size < 2000) { try { fs.unlinkSync(tmp); } catch {} failed++; after += b0; continue; }
  fs.renameSync(tmp, file);
  const b1 = fs.statSync(file).size; after += b1;
  e.bytes = b1; e.sha256 = sha(file); e.shrunk_bitrate = BITRATE; e.channels = 1; e.sample_rate_hz = 24000;
  done++;
  if (done % 100 === 0) console.log(`shrink ${done}/${manifest.entries.length}`);
}
if (!DRY) {
  manifest.shrink = { bitrate: BITRATE, channels: 1, sample_rate_hz: 24000, at: new Date().toISOString(), tool: 'tools/audio/shrink-clips.mjs', note: 'speech-grade re-encode after mint; manifest bytes/sha256 rewritten; narration content unchanged' };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}
console.log(`${DRY ? 'DRY ' : ''}SHRINK: ${done} re-encoded, ${skipped} skipped, ${failed} failed · ${(before / 1e6).toFixed(1)} MB → ${(after / 1e6).toFixed(1)} MB${DRY ? ' (estimate)' : ''}`);
process.exit(failed ? 2 : 0);
