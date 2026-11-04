// Title card, end card (cream brand background + app icon), the 16-state lesson-video grid, and the 24-scene visuals grid.
// Output: demo/out/{title,end,grid,visuals}.mp4 (1920x1080, 30 fps, silent). Needs demo/gen/icon.png (node demo/icon.mjs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const FF = path.join(ROOT, 'scratch/video-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const OUT = path.join(ROOT, 'demo/out'); fs.mkdirSync(OUT, { recursive: true });
const ICON = path.join(ROOT, 'demo/gen/icon.png');
const ff = p => p.replace(/\\/g, '/').replace(/:/g, '\\:');
const FONT = ff(path.join(ROOT, 'store/public/app/fonts/Outfit-Bold.ttf'));
const FONT2 = ff(path.join(ROOT, 'store/public/app/fonts/PlusJakartaSans-SemiBold.ttf'));
const run = args => { console.log('ffmpeg', path.basename(args.slice(-1)[0])); execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' }); };
const esc = s => s.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\\\'").replace(/,/g, '\\,');

const BG = '0xF6F1E7', INK = '0x0E0F12', ACCENT = '0xB8860B';
const LINES = ['255,145 files', '188 GB', '4,987 HD lesson videos', '234,656 narration clips', '37,967 flashcards', '50 states + DC'];
function card(name, dur, lines, dateLine, beat) {
  const filters = [`[1:v]scale=150:-1[ic];[0:v][ic]overlay=(W-w)/2:70[b]`];
  const top = 262, step = 100; const txt = [];
  lines.forEach((t, i) => {
    const t0 = (beat * i).toFixed(2);
    txt.push(`drawtext=fontfile='${FONT}':text='${esc(t)}':fontcolor=${INK}:fontsize=72:x=(w-text_w)/2:y=${top + i * step}:enable='gte(t,${t0})':alpha='min(1,(t-${t0})/0.35)'`);
  });
  const tD = (beat * lines.length + 0.2).toFixed(2);
  txt.push(`drawtext=fontfile='${FONT2}':text='${esc(dateLine)}':fontcolor=${ACCENT}:fontsize=42:x=(w-text_w)/2:y=${top + lines.length * step + 44}:enable='gte(t,${tD})':alpha='min(1,(t-${tD})/0.6)'`);
  txt.push(`drawtext=fontfile='${FONT2}':text='PassLearnersPermit':fontcolor=${INK}:fontsize=30:x=(w-text_w)/2:y=232`);
  run(['-f', 'lavfi', '-i', `color=c=${BG}:s=1920x1080:r=30:d=${dur}`, '-i', ICON, '-filter_complex', `${filters.join(';')};[b]${txt.join(',')}[v]`, '-map', '[v]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', path.join(OUT, `${name}.mp4`)]);
}
card('title', 10, LINES, 'All of it made between Oct 26 and Nov 3, 2026.', 1.3);
card('end', 8, LINES, 'Made Oct 26 – Nov 3, 2026. Every frame.  ·  passlearnerspermit.com', 0.01);

// 4×4 grid of lesson videos from 16 states, 8 s, muted
const list = fs.readFileSync(path.join(ROOT, 'demo/gen/grid-list.txt'), 'utf8').trim().split('\n').map(p => path.join(ROOT, p));
{
  const inputs = list.flatMap((p, i) => ['-ss', String(20 + i * 7), '-t', '8', '-i', p]);
  const scale = list.map((_, i) => `[${i}:v]scale=480:270,setsar=1,fps=30[v${i}]`).join(';');
  const layout = list.map((_, i) => `${(i % 4) * 480}_${Math.floor(i / 4) * 270}`).join('|');
  run([...inputs, '-filter_complex', `${scale};${list.map((_, i) => `[v${i}]`).join('')}xstack=inputs=16:layout=${layout}[g]`, '-map', '[g]', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-t', '8', path.join(OUT, 'grid.mp4')]);
}

// 6×4 grid of 24 verified scenes (WebP) from store/learner-assets/visuals, 8 s still, slow push-in
{
  const dir = path.join(ROOT, 'store/learner-assets/visuals');
  const all = fs.readdirSync(dir).filter(f => f.endsWith('.webp')).sort();
  const pick = Array.from({ length: 24 }, (_, i) => path.join(dir, all[Math.floor(i * all.length / 24)]));
  const inputs = pick.flatMap(p => ['-loop', '1', '-t', '8', '-i', p]);
  const scale = pick.map((_, i) => `[${i}:v]scale=320:180:force_original_aspect_ratio=increase,crop=320:180,setsar=1,fps=30[v${i}]`).join(';');
  const layout = pick.map((_, i) => `${(i % 6) * 320}_${Math.floor(i / 6) * 180}`).join('|');
  run([...inputs, '-filter_complex', `${scale};${pick.map((_, i) => `[v${i}]`).join('')}xstack=inputs=24:layout=${layout},scale=1920:1080:flags=lanczos,zoompan=z='1+0.04*in/240':d=1:s=1920x1080:fps=30[g]`, '-map', '[g]', '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-t', '8', path.join(OUT, 'visuals.mp4')]);
}
console.log('cards done');
