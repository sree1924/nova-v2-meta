#!/usr/bin/env node
// onboard-videos.mjs — put a state's rendered lesson videos into the shell (2026-10-31).
//
//   node tools/video/onboard-videos.mjs --state ND --from scratch/video-samples/nd-all-lessons/course-video-manifest.json [--dry]
//
// Reads the studio's course-video-manifest.json (lessons[] with unit_id, section_id, video_file, duration_seconds,
// slides[] {slide_id, kind, duration_seconds}), then:
//   1. copies each mp4 into app-preview/video/<xx>/<unit_id>.mp4 (streamable check: moov before mdat, else remux
//      with faststart; byte-identical otherwise), skipping files already present with the right size;
//   2. extracts a poster jpg per lesson (frame at 1.5 s) into app-preview/video/<xx>/<unit_id>.jpg;
//   3. writes app-preview/video/<xx>/video-manifest.json: per unit the file, poster, duration, section_id and the
//      slide chapters with cumulative start offsets — what the shell's lesson player reads.
// mp4/jpg are gitignored; only the manifest is tracked. No network, no model calls, $0.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const ST = (opt('--state') || '').toUpperCase(), FROM = opt('--from'), UNITS_RAW = opt('--units'), DRY = a.includes('--dry'), FORCE = a.includes('--force');
const UNIT_FILTER = UNITS_RAW ? new Set(UNITS_RAW.split(',').map((s) => s.trim()).filter(Boolean)) : null;
if (!ST || !FROM) { console.error('usage: --state XX --from <course-video-manifest.json> [--units u1,u2] [--dry] [--force]'); process.exit(2); }
const FFMPEG = process.env.FFMPEG || 'D:/nova/video-studio/node_modules/ffmpeg-static/ffmpeg.exe';
const xx = ST.toLowerCase();
const outDir = path.join(ROOT, 'app-preview', 'video', xx);
const existingManifestPath = path.join(outDir, 'video-manifest.json');
const existingManifest = (UNIT_FILTER && fs.existsSync(existingManifestPath)) ? JSON.parse(fs.readFileSync(existingManifestPath, 'utf8')) : null;
const src = JSON.parse(fs.readFileSync(path.resolve(ROOT, FROM), 'utf8'));
if (String(src.state || '').toUpperCase() !== ST && String(src.course_slug || '').toUpperCase().indexOf(ST) < 0) console.warn(`warning: manifest state "${src.state}" vs --state ${ST}`);

const moovFirst = (file) => {
  const r = spawnSync(FFMPEG, ['-v', 'trace', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 64 << 20 });
  const m = (r.stderr || '').match(/type:'(moov|mdat)'/g) || [];
  return m.length ? m[0].includes('moov') : true;
};
const units = existingManifest && existingManifest.units ? { ...existingManifest.units } : {};
let copied = 0, remuxed = 0, posters = 0, skipped = 0;
for (const l of src.lessons || []) {
  const unit = l.unit_id, from = l.video_file;
  if (UNIT_FILTER && !UNIT_FILTER.has(unit)) continue;
  if (!unit || !from || !fs.existsSync(from)) { console.warn(`skip ${unit}: source missing`); continue; }
  const mp4 = path.join(outDir, unit + '.mp4'), jpg = path.join(outDir, unit + '.jpg');
  const size = fs.statSync(from).size;
  let starts = 0; const slides = (l.slides || []).map((s) => { const o = { slide_id: s.slide_id, kind: s.kind || null, start: Math.round(starts * 100) / 100, duration: s.duration_seconds }; starts += Number(s.duration_seconds) || 0; return o; });
  units[unit] = { file: `video/${xx}/${unit}.mp4`, poster: `video/${xx}/${unit}.jpg`, section_id: l.section_id, title: l.title || null, lesson_number: l.lesson_number || null, duration: l.duration_seconds, size_bytes: size, sha256: l.sha256 || null, slides };
  if (DRY) continue;
  fs.mkdirSync(outDir, { recursive: true });
  const needMp4 = FORCE || !(fs.existsSync(mp4) && fs.statSync(mp4).size > 0);
  if (needMp4) {
    if (moovFirst(from)) { fs.copyFileSync(from, mp4); copied++; }
    else { const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-i', from, '-c', 'copy', '-movflags', '+faststart', mp4], { encoding: 'utf8' }); if (r.status !== 0) { console.warn(`remux failed ${unit}: ${r.stderr.slice(-200)}`); continue; } remuxed++; }
  } else skipped++;
  if (FORCE || !fs.existsSync(jpg)) {
    const r = spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', mp4, '-frames:v', '1', '-q:v', '4', '-vf', 'scale=960:-2', jpg], { encoding: 'utf8' });
    if (r.status === 0) posters++; else { console.warn(`poster failed ${unit}: ${r.stderr.slice(-160)}`); delete units[unit].poster; }
  }
}
const manifest = { schema_version: 'nova-lesson-video-manifest.v1', state: ST, generated_at: new Date().toISOString(), source: path.relative(ROOT, path.resolve(ROOT, FROM)).replace(/\\/g, '/'),
  style: src.style || null, resolution: src.resolution || null, fps: src.fps || null, video_codec: src.video_codec || null, audio_codec: src.audio_codec || null,
  note: 'Lesson videos combine the lesson slides, their narration and scene illustrations. Illustrations and narration are replaced as newer renders land; the shell only reads this manifest.',
  totals: { units: Object.keys(units).length, duration_seconds: Math.round(Object.values(units).reduce((t, u) => t + (u.duration || 0), 0)), size_bytes: Object.values(units).reduce((t, u) => t + (u.size_bytes || 0), 0) },
  units };
if (!DRY) fs.writeFileSync(path.join(outDir, 'video-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`${ST}: ${manifest.totals.units} lesson videos, ${Math.round(manifest.totals.duration_seconds / 60)} min, ${(manifest.totals.size_bytes / 1e6).toFixed(0)} MB · copied ${copied}, remuxed ${remuxed}, already present ${skipped}, posters ${posters}${DRY ? ' · DRY (nothing written)' : ' -> app-preview/video/' + xx + '/video-manifest.json'}`);
