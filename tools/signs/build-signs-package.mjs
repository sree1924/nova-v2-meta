// build-signs-package.mjs — assembles the national Road Signs data package the shell renders at #/<st>/signs:
//   app-preview/data/signs/signs.json      — 93 signs: name, category, shape/colour spec, meaning, image, mutcd (verify), source
//   app-preview/data/signs/by-state.json   — per state: sign ids its handbook cards mention (from sign-list.json) + handbook card ids
//   app-preview/data/signs/quiz.json       — recognition items: "What does this sign mean?" / "Which sign is this?" with 3 same-category distractors
//   app-preview/signs/<id>.png             — QA-accepted images only (copied from store/learner-assets/signs-raw)
// Source of truth for meanings = MUTCD (FHWA, official tier); each sign carries that source_ref. Nothing here touches runs/ or belt artifacts.
// Usage: node tools/signs/build-signs-package.mjs [--qa coordination/SIGNS/qa] [--allow-unqa]  (default: only QA-ACCEPT images are shipped)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const QA = path.resolve(ROOT, opt('--qa', 'coordination/SIGNS/qa'));
const ALLOW_UNQA = args.includes('--allow-unqa');
const RAW = path.join(ROOT, 'store/learner-assets/signs-raw');
const OUT = path.join(ROOT, 'app-preview/data/signs');
const IMG = path.join(ROOT, 'app-preview/signs');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(IMG, { recursive: true });

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/SIGNS/sign-list.json'), 'utf8'));
const SOURCE = { ref: 'src:fhwa-mutcd-11th-edition', tier: 'official', title: 'Manual on Uniform Traffic Control Devices, 11th Edition (FHWA)', url: 'https://mutcd.fhwa.dot.gov/', note: 'Sign shape, colour, legend and meaning per the national standard; designation codes marked (verify).' };

const qaOf = (id) => { const f = path.join(QA, id + '.json'); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; };
let shipped = 0, withheld = [];
const signs = list.signs.map((s) => {
  const raw = path.join(RAW, s.id + '.png');
  const qa = qaOf(s.id);
  const ok = fs.existsSync(raw) && (ALLOW_UNQA || qa?.result?.overall === 'ACCEPT');
  let image = null;
  if (ok) { fs.copyFileSync(raw, path.join(IMG, s.id + '.png')); image = { file: `signs/${s.id}.png`, sha256: crypto.createHash('sha256').update(fs.readFileSync(raw)).digest('hex'), generator: 'muse-image-1.0 (Meta Model API)', qa: qa ? { verdict: qa.result.overall, legend_read: qa.result.legend_read, model: qa.model } : null }; shipped++; }
  else withheld.push(s.id + (qa ? ' (QA ' + qa.result?.overall + ')' : ' (no image/QA)'));
  return { id: s.id, name: s.name, category: s.category, mutcd: s.mutcd, mutcd_status: s.mutcd_status, spec: s.spec, meaning: s.meaning, image, source_ref: SOURCE, states_mentioning: s.states_mentioning };
});

// Per-state membership + the handbook cards that mention each sign (so the shell can link "see your handbook's rule").
const walk = (o, out) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { for (const x of o) walk(x, out); return; } if (typeof o.front === 'string' && typeof o.back === 'string') { out.push(o); return; } for (const v of Object.values(o)) walk(v, out); };
const byState = {};
for (const [st, ids] of Object.entries(list.by_state)) {
  const d = st === 'UT' ? path.join(ROOT, 'app-preview/data/real/04_cards') : path.join(ROOT, 'app-preview/data', st.toLowerCase(), 'real/04_cards'); // UT = pilot layout
  const cards = []; if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) walk(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')), cards);
  const terms = Object.fromEntries(list.signs.map((s) => [s.id, s.match_terms]));
  byState[st] = { signs: ids, handbook_cards: Object.fromEntries(ids.map((id) => [id, cards.filter((c) => terms[id].some((t) => (c.front + ' ' + c.back).toLowerCase().includes(t))).slice(0, 6).map((c) => c.card_id)])) };
}

// Recognition quiz: for every shipped sign, two item types with 3 distractors from the same category (fallback: any).
const seed = (str) => { let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; };
const pick = (pool, n, rnd) => { const a = [...pool]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
const items = [];
for (const s of signs.filter((x) => x.image)) {
  const rnd = seed(s.id);
  const same = signs.filter((x) => x.id !== s.id && x.category === s.category && x.meaning !== s.meaning);
  const pool = same.length >= 3 ? same : signs.filter((x) => x.id !== s.id);
  const dis = pick(pool, 3, rnd);
  const opts = pick([s, ...dis], 4, rnd);
  items.push({ item_id: `sign-q-meaning-${s.id}`, kind: 'sign_meaning', sign_id: s.id, image: s.image.file, stem: 'What does this sign mean?', options: opts.map((o, i) => ({ key: 'ABCD'[i], text: o.meaning, correct: o.id === s.id })), rationale: `${s.name}: ${s.spec}. ${s.meaning}`, source_ref: SOURCE });
  const opts2 = pick([s, ...dis], 4, rnd);
  items.push({ item_id: `sign-q-name-${s.id}`, kind: 'sign_name', sign_id: s.id, image: s.image.file, stem: 'Which sign is this?', options: opts2.map((o, i) => ({ key: 'ABCD'[i], text: o.name, correct: o.id === s.id })), rationale: `${s.name}: ${s.spec}.`, source_ref: SOURCE });
}

const pkg = { schema_version: 'nova-road-signs-package.v1', built_at: new Date().toISOString(), counts: { signs: signs.length, images_shipped: shipped, withheld: withheld.length, quiz_items: items.length, states: Object.keys(byState).length }, categories: [...new Set(signs.map((s) => s.category))], source_ref: SOURCE, signs };
fs.writeFileSync(path.join(OUT, 'signs.json'), JSON.stringify(pkg, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'by-state.json'), JSON.stringify({ schema_version: 'nova-road-signs-by-state.v1', built_at: pkg.built_at, states: byState }, null, 2) + '\n');
fs.writeFileSync(path.join(OUT, 'quiz.json'), JSON.stringify({ schema_version: 'nova-road-signs-quiz.v1', built_at: pkg.built_at, items }, null, 2) + '\n');
console.log(`signs ${signs.length} · images shipped ${shipped} · withheld ${withheld.length} · quiz items ${items.length} · states ${Object.keys(byState).length}`);
if (withheld.length) console.log('withheld: ' + withheld.join(', '));
