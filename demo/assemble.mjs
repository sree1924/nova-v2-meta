// Rough cut of submission/VIDEO-SCRIPT.md v2 from demo/clips/*.webm + demo/out/{title,grid,end}.mp4.
// Narration: if demo/narration/<row>.mp3 exists it is mixed in at that row's start (rows r01..r15 as in the script).
// Output: demo/out/rough-cut.mp4 (1920x1080, 30 fps, H.264 + AAC). Usage: node demo/assemble.mjs
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const FF = path.join(ROOT, 'scratch/video-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const C = n => path.join(ROOT, 'demo/clips', `${n}.webm`);
const O = n => path.join(ROOT, 'demo/out', `${n}.mp4`);
const NARR = n => path.join(ROOT, 'demo/narration', `${n}.mp3`);
const FONT = path.join(ROOT, 'store/public/app/fonts/PlusJakartaSans-SemiBold.ttf').replace(/\\/g, '/').replace(/:/g, '\\:');

// row = script row (narration unit); src = clip; ss = seconds into clip; d = seconds on screen
const SEG = [
  { row: 'r01', src: O('title'), ss: 0, d: 6 }, { row: 'r01', src: C('s01_open'), ss: 3.5, d: 4 },
  { row: 'r02', src: C('s02a_schemas'), ss: 1, d: 2.5 }, { row: 'r02', src: C('s02b_checks'), ss: 1, d: 2.5 }, { row: 'r02', src: C('s02c_ledger'), ss: 1, d: 3 }, { row: 'r02', src: C('s03_trace'), ss: 2, d: 6 },
  { row: 'r03', src: C('s04a_cost'), ss: 1, d: 5 }, { row: 'r03', src: C('s04b_ut_lesson'), ss: 2, d: 8 }, { row: 'r03', src: C('s05a_muse_ledger'), ss: 1, d: 4 }, { row: 'r03', src: C('s05b_tx'), ss: 1.5, d: 3 },
  { row: 'r04', src: C('s06a_triage'), ss: 1, d: 8 }, { row: 'r04', src: C('s06b_ct'), ss: 1, d: 10 },
  { row: 'r05', src: C('s08a_held'), ss: 1.5, d: 7 }, { row: 'r05', src: C('s08b_results'), ss: 1, d: 3 },
  { row: 'r06', src: O('visuals'), ss: 0, d: 6 }, { row: 'r06', src: C('s09b_catalog'), ss: 1, d: 4 },
  { row: 'r07', src: C('s09_signs'), ss: 1.5, d: 9 },
  { row: 'r08', src: C('s10a_sol_closeout'), ss: 1, d: 6 }, { row: 'r08', src: C('s10d_ne'), ss: 1.5, d: 5 },
  { row: 'r09', src: C('s11b_closure'), ss: 1, d: 6 }, { row: 'r09', src: C('s06a_triage'), ss: 1, d: 4 },
  { row: 'r10', src: C('s12a_ut_video'), ss: 2.5, d: 5 }, { row: 'r10', src: O('grid'), ss: 0, d: 6 }, { row: 'r10', src: C('s12c_nd_mobile'), ss: 2, d: 4, mobile: true }, { row: 'r10', src: C('s12d_audio_closeout'), ss: 1, d: 3 },
  { row: 'r11', src: C('s13a_bug008'), ss: 1, d: 5 }, { row: 'r11', src: C('s13b_index'), ss: 1, d: 4 },
  { row: 'r12', src: C('s14a_seal'), ss: 1, d: 3 }, { row: 'r12', src: C('s14b_status'), ss: 1, d: 4 }, { row: 'r12', src: C('s14c_ledger'), ss: 1, d: 3 }, { row: 'r12', src: C('s14d_paywall'), ss: 1.5, d: 3 },
  { row: 'r13', src: C('s15_close'), ss: 1, d: 5 }, { row: 'r13', src: O('grid'), ss: 0, d: 5 }, { row: 'r13', src: C('s14c_ledger'), ss: 1, d: 4 }, { row: 'r13', src: O('end'), ss: 0, d: 6 },
];
// live app clips: take the LAST d seconds (the loaded content), not a fixed offset
const FROM_END = new Set(['s04b_ut_lesson','s05b_tx','s09_signs','s10d_ne','s12a_ut_video','s12c_nd_mobile','s14d_paywall','s15_close']);
function duration(file) {
  try { execFileSync(FF, ['-i', file], { stdio: 'pipe' }); } catch (e) {
    const m = /Duration: (\d+):(\d+):([\d.]+)/.exec(String(e.stderr)); if (m) return (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]);
  }
  return null;
}
for (const s of SEG) {
  const id = path.basename(s.src, '.webm');
  if (FROM_END.has(id) && fs.existsSync(s.src)) { const dur = duration(s.src); if (dur) s.ss = Math.max(0, dur - s.d - 0.4); }
}
// --fit: stretch each row's picture so it spans that row's narration (+0.6 s breath). Output name gets -fit.
const FIT = process.argv.includes('--fit');
const OUTNAME = process.argv.find(a => a.startsWith('--out='))?.slice(6) || (FIT ? 'long-cut' : 'rough-cut');
let SPEED = +(process.argv.find(a => a.startsWith('--speed='))?.slice(8) || 1);  // atempo on narration, e.g. 1.1
const TARGET = +(process.argv.find(a => a.startsWith('--target='))?.slice(9) || 0); // seconds; sets SPEED automatically
const BREATH = 1.2;
if (FIT) {
  const byRow = {}; for (const s of SEG) (byRow[s.row] ||= []).push(s);
  if (TARGET) {
    const rowsWithNarr = Object.keys(byRow).filter(r => fs.existsSync(NARR(r)));
    const narrTotal = rowsWithNarr.reduce((a, r) => a + duration(NARR(r)), 0);
    const fixed = SEG.filter(s => !fs.existsSync(NARR(s.row))).reduce((a, s) => a + s.d, 0);
    SPEED = Math.min(1.25, Math.max(1, narrTotal / (TARGET - fixed - BREATH * rowsWithNarr.length)));
    console.log(`narration ${narrTotal.toFixed(1)}s natural → tempo ×${SPEED.toFixed(3)} for target ${TARGET}s`);
  }
  for (const [row, segs] of Object.entries(byRow)) {
    if (!fs.existsSync(NARR(row))) continue;
    const need = duration(NARR(row)) / SPEED + BREATH, have = segs.reduce((a, s) => a + s.d, 0);
    const k = need / have; for (const s of segs) s.d = +(s.d * k).toFixed(2);
    console.log(`${row}: narration ${need.toFixed(1)}s, picture ${have}s → ×${k.toFixed(2)}`);
  }
}
const missing = SEG.filter(s => !fs.existsSync(s.src)).map(s => path.basename(s.src));
if (missing.length) console.log('MISSING clips (will be black):', missing.join(' '));

const inputs = []; const vparts = []; let t = 0; const rowStart = {};
SEG.forEach((s, i) => {
  if (!(s.row in rowStart)) rowStart[s.row] = t;
  s.start = t; t += s.d;
  if (fs.existsSync(s.src)) {
    inputs.push('-i', s.src);
    const idx = inputs.length / 2 - 1;
    const fit = s.mobile
      ? `scale=-2:1080:flags=lanczos,pad=1920:1080:(ow-iw)/2:0:color=0x0E0F12`
      : `scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x0E0F12`;
    vparts.push(`[${idx}:v]trim=start=${s.ss},setpts=PTS-STARTPTS,fps=30,${fit},setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=${s.d},trim=duration=${s.d},setpts=PTS-STARTPTS[v${i}]`);
  } else {
    vparts.push(`color=c=black:s=1920x1080:r=30:d=${s.d}[v${i}]`);
  }
});
const total = t;
const concat = `${SEG.map((_, i) => `[v${i}]`).join('')}concat=n=${SEG.length}:v=1:a=0[vc]`;
const OVERLAY_END = (SEG.find(s => s.src === O('end'))?.start ?? (total - 4)) - 0.2; // overlays stop when the end card starts
const lower = `drawtext=fontfile='${FONT}':text='Made during the hackathon\\, Oct 26 – Nov 3\\, 2026  ·  255\\,145 files  ·  188 GB':fontcolor=0xF3C969@0.92:fontsize=26:x=36:y=h-54:box=1:boxcolor=0x0E0F12@0.55:boxborderw=12:enable='between(t,6,${OVERLAY_END})'`;
const LANE = { r01:'FABLE', r02:'FABLE', r03:'MUSE', r04:'MUSE', r05:'MUSE', r06:'TERRA', r07:'MUSE', r08:'SOL', r09:'ARGON', r10:'ARGON', r11:'ARGON', r12:'FABLE', r13:'FABLE' };
const LINES_JSON = path.join(ROOT, 'demo/narration/LINES.json');
const CAPTION = {}; if (fs.existsSync(LINES_JSON)) for (const r of JSON.parse(fs.readFileSync(LINES_JSON, 'utf8'))) if (r.caption && r.caption !== '—') CAPTION[r.id] = r.caption;
const BADGE = { FABLE: ['Fable  ·  Claude', '0xD97757'], MUSE: ['Muse  ·  Meta', '0x0866FF'], SOL: ['Sol  ·  GPT', '0x10A37F'], ARGON: ['Argon  ·  Gemini', '0x4285F4'], TERRA: ['Terra  ·  GPT image', '0x10A37F'] };
const rowEnd = {}; for (const s of SEG) rowEnd[s.row] = s.start + s.d;
// badge = fixed box bottom-right: company logo (white PNG) + lane label, shown for the row's span
const LOGO = { FABLE: 'anthropic', MUSE: 'meta', SOL: 'openai', ARGON: 'googlegemini', TERRA: 'openai' };
const logoInputs = {}; // lane → input index (added once per logo file)
const BW = 470, BH = 76, BX = 1920 - BW - 40, BY = 1080 - BH - 96;
const steps = [`[vc]${lower}[bl]`]; let chain = '[bl]';
Object.entries(rowStart).forEach(([row, st], i) => {
  const lane = LANE[row]; const [label, color] = BADGE[lane]; const en = Math.min(rowEnd[row], OVERLAY_END); const s0 = Math.max(st, 6);
  const en_ = `enable='between(t,${s0},${en})'`;
  const logoFile = path.join(ROOT, 'demo/gen/logos', `${LOGO[lane]}.png`);
  let logoIdx = null;
  if (fs.existsSync(logoFile) && !process.env.NO_LOGO) { inputs.push('-i', logoFile); logoIdx = inputs.length / 2 - 1; }
  steps.push(`${chain}drawbox=x=${BX}:y=${BY}:w=${BW}:h=${BH}:color=${color}@0.94:t=fill:${en_}[b${i}a]`); chain = `[b${i}a]`;
  if (logoIdx !== null) { steps.push(`${chain}[${logoIdx}:v]overlay=${BX + 18}:${BY + 10}:${en_}[b${i}b]`); chain = `[b${i}b]`; }
  steps.push(`${chain}drawtext=fontfile='${FONT}':text='${label.replace(/:/g, '\\:')}':fontcolor=0xFFFFFF:fontsize=30:x=${BX + (logoIdx !== null ? 92 : 24)}:y=${BY + 22}:${en_}[b${i}c]`); chain = `[b${i}c]`;
  if (CAPTION[row]) {
    const cap = CAPTION[row].replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\\\'").replace(/,/g, '\\,');
    steps.push(`${chain}drawtext=fontfile='${FONT}':text='${cap}':fontcolor=0x0E0F12:fontsize=34:x=(w-text_w)/2:y=26:box=1:boxcolor=0xF3C969@0.96:boxborderw=16:${en_}[b${i}d]`); chain = `[b${i}d]`;
  }
});
const vfinal = process.env.VF_SIMPLE ? '[vc]null[vout]' : steps.join(';') + `;${chain}null[vout]`;

// audio: silence base + product audio at r12 + any narration files present
const aparts = [`anullsrc=r=48000:cl=stereo,atrim=duration=${total}[a0]`]; const amix = ['[a0]']; let ai = 0;
const addAudio = (file, at, dur, gain = 1, tempo = 1) => {
  inputs.push('-i', file); const idx = inputs.length / 2 - 1; ai++;
  aparts.push(`[${idx}:a]${dur ? `atrim=duration=${dur},` : ''}${tempo !== 1 ? `atempo=${tempo},` : ''}volume=${gain},aresample=48000,aformat=channel_layouts=stereo,adelay=${Math.round(at * 1000)}|${Math.round(at * 1000)}[a${ai}]`);
  amix.push(`[a${ai}]`);
};
// the app's own audio plays only where no lane is narrating (founder: no overlap under Argon)
for (const s of SEG) if (s.audio && fs.existsSync(s.audio) && !fs.existsSync(NARR(s.row))) addAudio(s.audio, s.start, s.d, 0.9);
const narrFound = [];
// level every narration clip to the same mean loudness (TTS voices differ by up to 13 dB)
const TARGET_DB = -20;
function meanDb(file) {
  const r = spawnSync(FF, ['-hide_banner', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' });
  const m = /mean_volume: ([-\d.]+) dB/.exec(r.stderr || ''); return m ? +m[1] : null;
}
for (const row of Object.keys(rowStart)) if (fs.existsSync(NARR(row))) {
  const mean = meanDb(NARR(row)); const gain = mean === null ? '0dB' : `${(TARGET_DB - mean).toFixed(1)}dB`;
  addAudio(NARR(row), rowStart[row], 0, gain, SPEED); narrFound.push(`${row}(${gain})`);
}
const afinal = `${amix.join('')}amix=inputs=${amix.length}:normalize=0[aout]`;

const script = [...vparts, concat, vfinal, ...aparts, afinal].join(';\n');
const scriptPath = path.join(ROOT, 'demo/out/filter.txt'); fs.writeFileSync(scriptPath, script);
console.log(`segments ${SEG.length}, runtime ${total}s, narration rows present: ${narrFound.join(' ') || 'none'}`);
console.log('row starts:', Object.entries(rowStart).map(([r, s]) => `${r}@${s}s`).join(' '));
execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...inputs, '-filter_complex_script', scriptPath, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-t', process.env.VF_T || String(total), O(OUTNAME)], { stdio: 'inherit' });
console.log(`wrote demo/out/${OUTNAME}.mp4`);
