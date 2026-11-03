// image-review-page.mjs — renders coordination/IMAGE-CHECK/results/*.json into one static page
// (coordination/IMAGE-CHECK/review.html) for human eyes: image beside the Meta verdict, rejects first.
// Usage: node tools/audit/image-review-page.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'coordination/IMAGE-CHECK');
const RES = path.join(DIR, 'results');
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const order = { REJECT: 0, HUMAN_REVIEW: 1, ACCEPT: 2 };
const recs = fs.readdirSync(RES).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(fs.readFileSync(path.join(RES, f), 'utf8')))
  .sort((a, b) => (order[a.result?.overall] ?? 3) - (order[b.result?.overall] ?? 3) || a.id.localeCompare(b.id));
const counts = recs.reduce((m, r) => ((m[r.result?.overall ?? 'ERROR'] = (m[r.result?.overall ?? 'ERROR'] || 0) + 1), m), {});
const spend = recs.reduce((s, r) => s + (r.usd_priced || 0), 0);

const card = (r) => {
  const v = r.result;
  const jpg = fs.readdirSync(path.join(DIR, '.jpg-cache')).find((f) => f.startsWith(path.basename(r.file, '.png') + '.w'));
  if (!v) return `<section class="c err"><h2>${esc(r.id)}</h2><p>no verdict: ${esc(r.parse_error || r.error_body)}</p></section>`;
  const rules = Object.entries(v.rules).map(([k, x]) => `<li class="${x.verdict}"><b>${esc(k)}</b> ${x.verdict}${x.note ? ' — ' + esc(x.note) : ''}</li>`).join('');
  return `<section class="c ${v.overall}">
  <img src=".jpg-cache/${esc(jpg)}" alt="" loading="lazy">
  <div class="t">
    <h2><span class="pill">${v.overall}</span> ${esc(r.id)}</h2>
    <p class="title">${esc(r.title)}</p>
    <p><b>Sees:</b> ${esc(v.what_i_see)}</p>
    <p><b>Scene:</b> ${v.scene_match.verdict} — ${esc(v.scene_match.note)}</p>
    <p><b>Teaching:</b> ${v.teaching_correct.verdict} — ${esc(v.teaching_correct.note)}</p>
    <ul>${rules}</ul>
    <p class="sum">${esc(v.summary)}</p>
    <p class="meta">$${r.usd_priced.toFixed(4)} · ${Math.round(r.elapsed_ms / 1000)}s · ${esc(r.model_returned || r.model)}</p>
    <div class="vote"><label><input type="radio" name="${esc(r.id)}" value="agree"> agree</label> <label><input type="radio" name="${esc(r.id)}" value="disagree"> disagree</label></div>
  </div>
</section>`;
};

const html = `<!doctype html><meta charset="utf-8"><title>Image check — ${recs.length}</title>
<style>
body{font:15px/1.4 system-ui,sans-serif;margin:0;background:#f4f4f2;color:#111}
header{position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd;padding:10px 16px;display:flex;gap:18px;align-items:center;flex-wrap:wrap}
header b{font-size:18px}
.c{display:grid;grid-template-columns:minmax(320px,56%) 1fr;gap:16px;background:#fff;margin:14px 16px;padding:12px;border-radius:10px;border-left:8px solid #999}
.c.REJECT{border-color:#c62828}.c.HUMAN_REVIEW{border-color:#ef9f00}.c.ACCEPT{border-color:#2e7d32}
.c img{width:100%;height:auto;border-radius:6px;background:#000}
h2{margin:0 0 4px;font-size:17px}.pill{font-size:12px;padding:2px 8px;border-radius:999px;background:#eee;margin-right:6px}
.REJECT .pill{background:#fde0e0}.HUMAN_REVIEW .pill{background:#fff0c7}.ACCEPT .pill{background:#def5e0}
.title{color:#555;margin:0 0 8px}.sum{font-weight:600}.meta{color:#777;font-size:12px}
ul{margin:6px 0;padding-left:18px}li.FAIL{color:#c62828;font-weight:600}li.NOT_APPLICABLE{color:#888}
.vote{margin-top:8px;padding-top:8px;border-top:1px dashed #ddd;font-size:14px}
@media(max-width:800px){.c{grid-template-columns:1fr}}
</style>
<header><b>Image check</b> <span>${recs.length} images</span> <span>REJECT ${counts.REJECT || 0}</span> <span>HUMAN_REVIEW ${counts.HUMAN_REVIEW || 0}</span> <span>ACCEPT ${counts.ACCEPT || 0}</span> <span>Meta spend $${spend.toFixed(3)}</span> <span id="votes"></span></header>
${recs.map(card).join('\n')}
<script>
const key='image-check-votes';let votes={};try{votes=JSON.parse(localStorage.getItem(key)||'{}')}catch{}
for(const [id,v] of Object.entries(votes)){const el=document.querySelector('input[name="'+id+'"][value="'+v+'"]');if(el)el.checked=true}
function tally(){const a=Object.values(votes).filter(v=>v==='agree').length,d=Object.values(votes).filter(v=>v==='disagree').length;document.getElementById('votes').textContent='your votes: agree '+a+' · disagree '+d}
document.addEventListener('change',e=>{if(e.target.type!=='radio')return;votes[e.target.name]=e.target.value;try{localStorage.setItem(key,JSON.stringify(votes))}catch{};tally()});tally();
</script>`;
fs.writeFileSync(path.join(DIR, 'review.html'), html);
console.log(`review.html: ${recs.length} images, ${JSON.stringify(counts)}, spend $${spend.toFixed(4)}`);
