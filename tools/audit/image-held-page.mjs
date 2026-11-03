// image-held-page.mjs — one page of the HUMAN_REVIEW images with Keep / Reject buttons for the founder.
// Decisions are kept in the browser (localStorage 'image-held-decisions'); apply them with
//   node tools/audit/image-held-apply.mjs --decisions '<json>'   (the page's "Copy decisions" button gives the JSON)
// Usage: node tools/audit/image-held-page.mjs  -> coordination/IMAGE-CHECK/held.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'coordination/IMAGE-CHECK');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const allRows = JSON.parse(fs.readFileSync(path.join(DIR, 'DISPOSITION.json'), 'utf8')).rows;
const latest = [...new Map(allRows.map((r) => [r.id, r])).values()]; // latest row per id
// Held = HUMAN_REVIEW, plus REJECTs that hinge on the single-lit-lens rule alone (too blunt for doghouse / multi-head signals):
// the founder's eyes decide those too. Keep = back to approved; Reject = stays on the re-paint list.
const onlySingleBulb = (r) => {
  if (r.verdict !== 'REJECT' || r.human_override) return false;
  const res = JSON.parse(fs.readFileSync(path.join(DIR, 'results', r.id + '.json'), 'utf8')).result;
  const fails = Object.entries(res.rules).filter(([, v]) => v.verdict === 'FAIL').map(([k]) => k);
  return fails.length === 1 && fails[0] === 'single_bulb_signal' && res.teaching_correct.verdict !== 'WRONG';
};
const rows = latest.filter((r) => r.verdict === 'HUMAN_REVIEW' || onlySingleBulb(r));
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json'), 'utf8'));
const byId = new Map(cat.scenes.map((s) => [s.id, s]));
const jpgs = fs.readdirSync(path.join(DIR, '.jpg-cache'));
const items = rows.map((r) => {
  const res = JSON.parse(fs.readFileSync(path.join(DIR, 'results', r.id + '.json'), 'utf8')).result;
  const s = byId.get(r.id);
  return { id: r.id, slots: s.national_usage.total_slots, title: s.title, jpg: jpgs.find((f) => f.startsWith(r.id + '.w')), sees: res.what_i_see, scene: res.scene_match, teach: res.teaching_correct, summary: res.summary };
}).sort((a, b) => b.slots - a.slots);

const card = (r) => `<section class="c" data-id="${esc(r.id)}">
  <img src=".jpg-cache/${esc(r.jpg)}" alt="" loading="lazy">
  <div class="t">
    <h2>${esc(r.id)} <span class="slots">${r.slots} slots</span></h2>
    <p class="title">${esc(r.title)}</p>
    <p><b>Sees:</b> ${esc(r.sees)}</p>
    <p><b>Scene ${r.scene.verdict}:</b> ${esc(r.scene.note)}</p>
    ${r.teach.verdict !== 'CORRECT' ? `<p><b>Teaching ${r.teach.verdict}:</b> ${esc(r.teach.note)}</p>` : ''}
    <div class="btns"><button data-d="KEEP">✓ Keep</button><button data-d="REJECT">✗ Reject</button><span class="state"></span></div>
  </div>
</section>`;

const html = `<!doctype html><meta charset="utf-8"><title>Held images — ${items.length}</title>
<style>
body{font:15px/1.4 system-ui,sans-serif;margin:0;background:#f4f4f2;color:#111}
header{position:sticky;top:0;z-index:2;background:#fff;border-bottom:1px solid #ddd;padding:10px 16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
header b{font-size:18px}header button{padding:6px 12px;border-radius:8px;border:1px solid #333;background:#111;color:#fff;cursor:pointer}
.c{display:grid;grid-template-columns:minmax(320px,58%) 1fr;gap:16px;background:#fff;margin:14px 16px;padding:12px;border-radius:10px;border-left:8px solid #ef9f00}
.c.KEEP{border-color:#2e7d32;opacity:.75}.c.REJECT{border-color:#c62828;opacity:.75}
.c img{width:100%;height:auto;border-radius:6px;background:#000}
h2{margin:0 0 4px;font-size:17px}.slots{font-size:12px;color:#777;font-weight:400;margin-left:8px}.title{color:#555;margin:0 0 8px}
.btns{margin-top:10px;display:flex;gap:10px;align-items:center}.btns button{padding:8px 16px;border-radius:8px;border:2px solid #333;background:#fff;font-weight:600;cursor:pointer;font-size:15px}
.btns button[data-d=KEEP]{border-color:#2e7d32;color:#2e7d32}.btns button[data-d=REJECT]{border-color:#c62828;color:#c62828}
.c.KEEP button[data-d=KEEP],.c.REJECT button[data-d=REJECT]{color:#fff}.c.KEEP button[data-d=KEEP]{background:#2e7d32}.c.REJECT button[data-d=REJECT]{background:#c62828}
.state{color:#777;font-size:13px}
@media(max-width:800px){.c{grid-template-columns:1fr}}
</style>
<header><b>Held for your eyes</b> <span>${items.length} images</span> <span id="tally"></span> <button id="copy">Copy decisions</button> <span id="msg"></span></header>
${items.map(card).join('\n')}
<script>
const key='image-held-decisions';let d={};try{d=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
function paint(){for(const s of document.querySelectorAll('section.c')){s.classList.remove('KEEP','REJECT');const v=d[s.dataset.id];if(v)s.classList.add(v);s.querySelector('.state').textContent=v?v:'undecided'}
const k=Object.values(d).filter(v=>v==='KEEP').length,r=Object.values(d).filter(v=>v==='REJECT').length;document.getElementById('tally').textContent='keep '+k+' · reject '+r+' · left '+(${items.length}-k-r)}
async function save(){try{localStorage.setItem(key,JSON.stringify(d))}catch{};try{const r=await fetch('/decisions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const j=await r.json();document.getElementById('msg').textContent='saved to disk: '+j.count}catch{document.getElementById('msg').textContent='NOT saved to disk (server?)'}}
document.addEventListener('click',e=>{const b=e.target.closest('button[data-d]');if(!b)return;const id=b.closest('section').dataset.id;d[id]=d[id]===b.dataset.d?undefined:b.dataset.d;if(!d[id])delete d[id];paint();save()});
// On load: merge what the server has with this browser's clicks (browser wins), then push the union to disk.
fetch('/decisions').then(r=>r.json()).then(j=>{d={...(j.decisions||{}),...d};paint();if(Object.keys(d).length)save()}).catch(()=>{});
document.getElementById('copy').onclick=async()=>{const j=JSON.stringify(d);try{await navigator.clipboard.writeText(j);document.getElementById('msg').textContent='copied '+Object.keys(d).length+' decisions'}catch{document.getElementById('msg').textContent=j}};
paint();
</script>`;
fs.writeFileSync(path.join(DIR, 'held.html'), html);
console.log(`held.html: ${items.length} images`);
