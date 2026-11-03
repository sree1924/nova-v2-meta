// image-repaint-page.mjs — side-by-side review of Meta re-paints vs the rejected original, with Keep/Reject per scene.
// Reads coordination/IMAGE-CHECK/repaint-list.json (ids), _quarantine_regen/<id>.*.png (old), _meta_repaint/<id>.png (new),
// results/<id>.json (Meta vision verdict on the NEW file). Writes coordination/IMAGE-CHECK/repaint.html + repaint-img/.
// Decisions post to the :4330 server's /decisions (same store as held.html; key = scene id). Apply with image-held-apply.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHK = path.join(ROOT, 'coordination/IMAGE-CHECK');
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const argOf = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };
const Q = path.join(VIS, '_quarantine_regen'), NEW = path.join(VIS, argOf('--new', '_meta_repaint')); // --new _openai_repaint
const LABEL = argOf('--label', 'Meta muse-image-1.0');
const IMG = path.join(CHK, 'repaint-img'); fs.mkdirSync(path.join(IMG, 'old'), { recursive: true }); fs.mkdirSync(path.join(IMG, 'new'), { recursive: true });
const list = JSON.parse(fs.readFileSync(path.join(CHK, 'repaint-list.json'), 'utf8'));
const qFiles = fs.readdirSync(Q);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rows = [];
for (const s of list) {
  const oldF = qFiles.find((f) => f.startsWith(s.id + '.'));
  const newF = path.join(NEW, s.id + '.png');
  if (!fs.existsSync(newF)) continue;
  if (oldF) fs.copyFileSync(path.join(Q, oldF), path.join(IMG, 'old', s.id + '.png'));
  fs.copyFileSync(newF, path.join(IMG, 'new', s.id + '.png'));
  const rp = path.join(CHK, 'results', s.id + '.json');
  const r = fs.existsSync(rp) ? JSON.parse(fs.readFileSync(rp, 'utf8')) : null;
  const res = r?.result || {};
  const fails = Object.entries(res).filter(([, v]) => v === false || v === 'FAIL' || v === 'MISMATCH' || v === 'WRONG').map(([k]) => k);
  rows.push({ id: s.id, title: s.title, why_rejected: oldF ? oldF.replace(s.id + '.', '').replace(/\.png$/, '') : '(no old file)', verdict: res.overall || 'UNCHECKED', note: res.note || res.summary || res.reason || '', fails, hasOld: !!oldF });
}
const order = { REJECT: 0, HUMAN_REVIEW: 1, UNCHECKED: 2, ACCEPT: 3 };
if (process.argv.includes('--no-reject')) { const n = rows.length; for (let i = rows.length - 1; i >= 0; i--) if (rows[i].verdict === 'REJECT') rows.splice(i, 1); console.log(`--no-reject: hiding ${n - rows.length} Meta-rejected re-paints`); }
rows.sort((a, b) => (order[a.verdict] ?? 2) - (order[b.verdict] ?? 2) || a.id.localeCompare(b.id));
const tally = rows.reduce((t, r) => ((t[r.verdict] = (t[r.verdict] || 0) + 1), t), {});
const html = `<!doctype html><meta charset="utf-8"><title>Re-paints — ${rows.length}</title>
<style>body{font:14px system-ui;margin:16px;background:#111;color:#eee}h1{font-size:18px}.row{display:grid;grid-template-columns:1fr 1fr 260px;gap:12px;border-top:1px solid #333;padding:12px 0}
img{width:100%;border-radius:6px;background:#000}.meta b{display:block;margin-bottom:4px}.v-ACCEPT{color:#7f7}.v-REJECT{color:#f77}.v-HUMAN_REVIEW{color:#fd6}.v-UNCHECKED{color:#aaa}
button{padding:8px 14px;margin:6px 6px 0 0;font-size:14px;cursor:pointer}.on-keep{background:#2a2;color:#fff}.on-rej{background:#a22;color:#fff}.cap{font-size:12px;color:#aaa}.tally{color:#aaa}</style>
<h1>Meta re-paints of rejected scenes — ${rows.length}</h1><p class="tally">Meta vision on the NEW picture: ${Object.entries(tally).map(([k, v]) => k + ' ' + v).join(' · ')}. Left = what you rejected, right = Meta's re-paint. Keep = ships; Reject = stays on fallback. Decisions save as you click.</p>
${rows.map((r) => `<div class="row" data-id="${esc(r.id)}">
<div><div class="cap">OLD — rejected: ${esc(r.why_rejected)}</div>${r.hasOld ? `<img loading="lazy" src="repaint-img/old/${esc(r.id)}.png">` : '<div class="cap">(no old file)</div>'}</div>
<div><div class="cap">NEW — ${esc(LABEL)}</div><img loading="lazy" src="repaint-img/new/${esc(r.id)}.png"></div>
<div class="meta"><b>${esc(r.id)}</b><div>${esc(r.title)}</div><p class="v-${esc(r.verdict)}"><b>Meta: ${esc(r.verdict)}</b>${r.fails.length ? ' · ' + esc(r.fails.join(', ')) : ''}</p><p class="cap">${esc(r.note)}</p>
<button class="keep">Keep</button><button class="rej">Reject</button><span class="state cap"></span></div></div>`).join('\n')}
<script>
const KEY='repaint-decisions';let dec={};try{dec=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
fetch('/decisions').then(r=>r.json()).then(s=>{dec=Object.assign({},s&&s.decisions?s.decisions:s,dec);paint();post();}).catch(paint);
function paint(){document.querySelectorAll('.row').forEach(row=>{const id=row.dataset.id,v=dec[id];row.querySelector('.keep').className='keep'+(v==='KEEP'?' on-keep':'');row.querySelector('.rej').className='rej'+(v==='REJECT'?' on-rej':'');row.querySelector('.state').textContent=v||'';});document.title='Re-paints — '+Object.keys(dec).length+' decided';}
function post(){fetch('/decisions',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({decisions:dec})}).catch(()=>{});}
document.addEventListener('click',e=>{const row=e.target.closest('.row');if(!row)return;if(e.target.classList.contains('keep'))dec[row.dataset.id]='KEEP';else if(e.target.classList.contains('rej'))dec[row.dataset.id]='REJECT';else return;localStorage.setItem(KEY,JSON.stringify(dec));paint();post();});
</script>`;
fs.writeFileSync(path.join(CHK, 'repaint.html'), html);
console.log(`repaint.html: ${rows.length} scenes · ${Object.entries(tally).map(([k, v]) => k + ' ' + v).join(' · ')}`);
