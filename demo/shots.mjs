// Demo capture — records each shot of submission/VIDEO-SCRIPT.md v2 as a silent 1920×1080 clip (webm) in demo/clips/.
// Usage: node demo/shots.mjs [shotId ...]   (no args = all). Needs: python -m http.server 4399 at repo root.
import { chromium, devices } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const CLIPS = path.join(ROOT, 'demo', 'clips');
const GEN = path.join(ROOT, 'demo', 'gen');
const BASE = 'http://127.0.0.1:4399';
const LIVE = 'https://passlearnerspermit.com';
fs.mkdirSync(CLIPS, { recursive: true }); fs.mkdirSync(GEN, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const receiptUrl = (f, hl, soft) => `${BASE}/demo/receipt.html?f=${encodeURIComponent(f)}${hl ? '&hl=' + encodeURIComponent(hl) : ''}${soft ? '&soft=' + encodeURIComponent(soft) : ''}`;

// ---- generated listings (directory contents rendered as text receipts) ----
function genListing(dir, out, limit = 400) {
  const abs = path.join(ROOT, dir);
  const names = fs.readdirSync(abs).sort();
  const rows = names.slice(0, limit).map(n => {
    const st = fs.statSync(path.join(abs, n));
    return `${st.isDirectory() ? 'd' : '-'}  ${String(st.size).padStart(10)}  ${st.mtime.toISOString().slice(0, 19).replace('T', ' ')}  ${n}`;
  });
  const head = `${dir}/   —   ${names.length} entries${names.length > limit ? ` (first ${limit} shown)` : ''}\n\n`;
  fs.writeFileSync(path.join(GEN, out), head + rows.join('\n') + '\n');
}
function gen() {
  genListing('schemas-strict', 'schemas-strict.txt');
  genListing('tools/belt/checks', 'belt-checks.txt');
  genListing('runs/2026-10-26-rdmv-ut-class-d/ledger', 'ut-ledger.txt', 300);
  genListing('coordination/IMAGE-CHECK/results', 'image-results.txt', 700);
  genListing('store/public/app/video/ne', 'ne-videos.txt', 1800);
  const spend = fs.readFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), 'utf8').split('\n').filter(l => /positive control/i.test(l));
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json'), 'utf8'));
  fs.writeFileSync(path.join(GEN, 'catalog-summary.json'), JSON.stringify({ file: 'scratch/terra-dataset/national-fleet-700-visual-catalog.json', summary: cat.summary }, null, 2));
  fs.writeFileSync(path.join(GEN, 'positive-control.jsonl'), `# coordination/MUSE-API-SPEND.jsonl — rows whose purpose is "fact-check positive control" (${spend.length})\n` + spend.join('\n') + '\n');
}

// ---- recording helpers ----
async function clip(name, fn, { mobile = false } = {}) {
  const browser = await chromium.launch();
  const size = mobile ? { width: 390, height: 844 } : { width: 1920, height: 1080 };
  const ctx = await browser.newContext({
    viewport: size, deviceScaleFactor: 1,
    recordVideo: { dir: CLIPS, size },
    ...(mobile ? { isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent } : {}),
    colorScheme: 'light',
  });
  const page = await ctx.newPage();
  page.on('pageerror', e => console.log(`  [pageerror] ${e.message.slice(0, 120)}`));
  const t0 = Date.now();
  try { await fn(page); } catch (e) { console.log(`  [${name}] ERROR ${e.message.slice(0, 200)}`); }
  const video = page.video();
  await ctx.close(); await browser.close();
  const src = await video.path();
  const dst = path.join(CLIPS, `${name}.webm`);
  fs.renameSync(src, dst);
  console.log(`${name}  ${((Date.now() - t0) / 1000).toFixed(1)}s  -> ${path.relative(ROOT, dst)}`);
}
async function receipt(page, f, { hl, soft, hold = 3000, scrollTo, scrollPx = 0, scrollMs = 4000 } = {}) {
  await page.goto(receiptUrl(f, hl, soft), { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  await sleep(800);
  if (scrollTo) {
    await page.evaluate(id => { const el = document.getElementById(id); if (el) el.scrollIntoView({ block: 'center' }); }, scrollTo);
    await sleep(hold);
  }
  if (scrollPx) {
    const room = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - window.innerHeight - Math.round(window.innerHeight * 0.55)));
    const px = Math.min(scrollPx, room);
    if (px > 40) await smoothScroll(page, px, scrollMs * (px / scrollPx));
  }
  await sleep(hold);
}
async function smoothScroll(page, px, ms, steps = 60) {
  for (let i = 0; i < steps; i++) { await page.mouse.wheel(0, px / steps); await sleep(ms / steps); }
}
async function live(page, hash, { wait = 2500 } = {}) {
  await page.goto(`${LIVE}${hash}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => !/Loading the .* course|LOADING COURSE/i.test(document.body.innerText), null, { timeout: 45000 }).catch(() => {});
  await sleep(wait);
}
async function clickText(page, text, { timeout = 3000 } = {}) {
  try { await page.getByText(text, { exact: false }).first().click({ timeout }); return true; } catch { return false; }
}
async function playVideo(page, secs) {
  const ok = await page.evaluate(async () => {
    const v = document.querySelector('video'); if (!v) return false;
    v.muted = true; try { await v.play(); } catch {} return true;
  });
  if (!ok) { await clickText(page, 'Play'); }
  await sleep(secs * 1000);
}

// ---- shot list (ids match VIDEO-SCRIPT.md rows) ----
const SHOTS = {
  // 0:00 cold open — landing + state picker spin (title card is ffmpeg)
  s01_open: async p => {
    await live(p, '/', { wait: 3500 });
    for (const st of ['nd', 'tx', 'ut']) {
      await p.selectOption('#hero-state-select', st.toUpperCase(), { timeout: 5000 }).catch(() => {});
      await sleep(2200);
    }
    await smoothScroll(p, 900, 3000); await sleep(1200);
  },
  // 0:10 the belt as contract
  s02a_schemas: async p => receipt(p, 'demo/gen/schemas-strict.txt', { hold: 2500, scrollPx: 600, scrollMs: 3500 }),
  s02b_checks: async p => receipt(p, 'demo/gen/belt-checks.txt', { hold: 2500, scrollPx: 600, scrollMs: 3000 }),
  s02c_ledger: async p => receipt(p, 'demo/gen/ut-ledger.txt', { hold: 2000, scrollPx: 2400, scrollMs: 5000 }),
  // 0:19 trace — one Utah card, a HOLD then an accept
  s03_trace: async p => {
    await p.goto(`${BASE}/app-preview/trace.html`, { waitUntil: 'load' }); await sleep(2500);
    // v4: land on an ACCEPTED attempt (validation PASS) and stay there; no HOLD on screen
    await p.evaluate(() => { const el = [...document.querySelectorAll('dd.pass')][0]; if (el) el.closest('.card')?.scrollIntoView({ block: 'start' }); });
    await sleep(2500);
    await p.evaluate(() => { const el = [...document.querySelectorAll('dd.pass')][0]; if (el) el.scrollIntoView({ block: 'center' }); });
    await sleep(6000);
  },
  // 0:30 Muse author — Utah cost accounting, live Utah lesson, reading pages
  s04a_cost: async p => receipt(p, 'runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md', { hl: '44\\.08|\\b371\\b|144 / 144|16 / 16|accepted artifacts', hold: 3500, scrollPx: 500, scrollMs: 3000 }),
  s04b_ut_lesson: async p => { await live(p, '/app/#/ut/lesson/sec01-u01', { wait: 3500 }); await playVideo(p, 6); await clickText(p, 'Read'); await sleep(2500); await clickText(p, 'Next'); await sleep(1800); await clickText(p, 'Next'); await sleep(1800); },
  // 0:50 Muse Code nine states
  s05a_muse_ledger: async p => receipt(p, 'coordination/MUSE-TOKEN-LEDGER.md', { hl: '\\b(TX|CA|FL|NY|VA|KY|OK|CT|IA)\\b', hold: 3000, scrollPx: 700, scrollMs: 4000 }),
  s05b_tx: async p => { await live(p, '/app/#/tx', { wait: 3500 }); await smoothScroll(p, 700, 3000); await sleep(1500); },
  // 1:00 fact check
  s06a_triage: async p => receipt(p, 'coordination/FACT-CHECK/TRIAGE.md', { hl: '664|CONTRADICTED|^\\| CT ', hold: 3500, scrollPx: 900, scrollMs: 5000 }),
  s06b_ct: async p => receipt(p, 'coordination/FACT-CHECK/CT/report.md', { hl: 'CONTRADICTED', scrollTo: 'L58', hold: 5000 }),
  // 1:22 positive control
  s07_spend: async p => receipt(p, 'demo/gen/positive-control.jsonl', { hl: 'positive control', hold: 5000 }),
  // 1:30 vision — held pairs, 636 verdict files
  s08a_held: async p => { await p.goto(`${BASE}/coordination/IMAGE-CHECK/held.html`, { waitUntil: 'load' }); await sleep(3000); await smoothScroll(p, 1400, 6000); await sleep(1500); },
  s08b_results: async p => receipt(p, 'demo/gen/image-results.txt', { hold: 2000, scrollPx: 3000, scrollMs: 5000 }),
  s09b_catalog: async p => receipt(p, 'demo/gen/catalog-summary.json', { hl: 'canonical_scenes_total|terra_drv_scenes_total|approved|rejected', hold: 5000 }),
  // 1:42 signs — hub, cards, a "Picture coming" card
  s09_signs: async p => {
    await live(p, '/app/#/tx/signs', { wait: 3500 }); await smoothScroll(p, 500, 2500);
    // v5: a real sign card with its picture — flip it, then the next one (never the withheld text cards)
    await live(p, '/app/#/tx/signs/cards', { wait: 3000 });
    await clickText(p, 'Flip Card', { timeout: 2000 }); await sleep(3000);
    await clickText(p, 'Next', { timeout: 2000 }); await sleep(2500);
    await clickText(p, 'Flip Card', { timeout: 2000 }); await sleep(3000);
  },
  // 1:52 Sol
  s10a_sol_closeout: async p => receipt(p, 'coordination/SOL-REPORTS/CLOSEOUT-FIRST-TEN-20261028.md', { hl: '2,?612', hold: 3500, scrollPx: 700, scrollMs: 4000 }),
  s10b_wb_request: async p => receipt(p, 'coordination/SOL-COMPLETE-DOSSIER-REPLACEMENT-WRITE-BARRIER-REQUEST-20261028.json', { hl: 'barrier|Alaska|AK', hold: 4000 }),
  s10c_wb_release: async p => receipt(p, 'coordination/SOL-COMPLETE-DOSSIER-REPLACEMENT-WRITE-BARRIER-RELEASE.json', { hl: 'release|barrier', hold: 4000 }),
  s10d_ne: async p => { await live(p, '/app/#/ne', { wait: 3500 }); await smoothScroll(p, 600, 3000); await sleep(1500); },
  // 2:08 Argon — Hawaii HOLDs, 41-state closure
  s11a_hi: async p => receipt(p, 'coordination/ARGON-HANDOFF/HI-ARGON-NATIVE-UPDATE-HANDOFF.json', { hl: 'HOLD', soft: 'original_author_preserved|31|11', hold: 3000, scrollPx: 1500, scrollMs: 5000 }),
  s11b_closure: async p => receipt(p, 'scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json', { hl: '370|5\\.82|"41"|: 41\\b|185', hold: 4000, scrollPx: 600, scrollMs: 3000 }),
  // 2:18 media — Utah lesson plays (audio mixed from the MP4 in ffmpeg), ND cards on a phone, audio closeout
  s12a_ut_video: async p => { await live(p, '/app/#/ut/lesson/sec01-u01', { wait: 3500 }); await playVideo(p, 9); },
  s12c_nd_mobile: async p => { await live(p, '/app/#/nd/cards/sec01-u01', { wait: 4000 }); await p.mouse.click(195, 500); await sleep(3500); await p.mouse.click(195, 500); await sleep(2500); },
  s12d_audio_closeout: async p => receipt(p, 'scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json', { hl: '153,?735|737\\.49|19\\.78|38,?167,?388', hold: 4500, scrollPx: 300, scrollMs: 2000 }),
  s12e_ne_videos: async p => receipt(p, 'demo/gen/ne-videos.txt', { hold: 1500, scrollPx: 6000, scrollMs: 6000 }),
  // 2:32 bugs
  s13a_bug008: async p => receipt(p, 'coordination/BUGS/BUG-008-lesson-videos-rendered-against-pre-review-library.md', { hl: '116|831|723', hold: 3500, scrollPx: 800, scrollMs: 4000 }),
  s13b_index: async p => receipt(p, 'coordination/BUGS/INDEX.md', { hl: 'BUG-00[1-9]', hold: 5000 }),
  // 2:41 seal, upload status, ledger, paywall
  s14a_seal: async p => receipt(p, 'coordination/DATASET-SEAL-2026-11-02.md', { hl: 'ed1c97a9|34f51e3f|254,?314|255,?145|188', hold: 3500, scrollPx: 700, scrollMs: 4000 }),
  s14b_status: async p => receipt(p, 'coordination/R2-UPLOAD-STATUS.md', { soft: 'PASS', hl: 'RUN COMPLETE|failures=0|\\| ut \\|', hold: 2000, scrollPx: 1800, scrollMs: 7000 }),
  s14c_ledger: async p => receipt(p, 'coordination/R2-LEDGER.md', { hl: '255,?145|188\\.4|0 missing|missing', hold: 5000 }),
  s14d_paywall: async p => { await live(p, '/app/#/tx/lesson/sec02-u01', { wait: 4000 }); await smoothScroll(p, 400, 2000); await sleep(3000); },
  // 2:51 close
  s15_close: async p => { await live(p, '/', { wait: 3000 }); await smoothScroll(p, 1200, 4000); await sleep(1000); await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await sleep(3500); },
};

const want = process.argv.slice(2);
const ids = want.length ? want : Object.keys(SHOTS);
gen();
for (const id of ids) {
  if (!SHOTS[id]) { console.log(`unknown shot ${id}`); continue; }
  await clip(id, SHOTS[id], { mobile: id.includes('mobile') });
}
console.log('done', ids.length, 'clips');
