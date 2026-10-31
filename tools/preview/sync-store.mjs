// sync-store.mjs — mirror the app-preview learner shell into the production
// store (store/public/app/) and generate the store's build inputs.
//
// Re-runnable and incremental: unchanged files (same size, dest not older) are
// skipped; files that no longer belong to the mirror are removed from
// store/public/app/ (never anything outside it). app-preview/ is only READ.
// store/public/app/gate.js is authored in place and is never touched here.
//
// What is copied (source = app-preview/):
//   index.html (+ the STORE PATCH below, applied to the copy only), styles.css,
//   states-embedded.js, data/states.json,
//   every complete state's data_root/** (data/<xx>/real/**, Utah data/real/**),
//   audio/** — *.mp3 + audio-manifest.json only (mint logs / estimates /
//     event journals are floor files, not learner assets, and are skipped),
//   data/<dir>/quarantine.json when present (parallel wording-fix lane),
//   shell support the unchanged index.html loads: data-embedded.js,
//     data/manifest.json, data/synthetic/** (the #/synthetic-sample route).
// NOT copied: trace.html / trace-embedded.js / data/trace.json (belt ledger:
//   costs, tokens, ledger paths — reviewer material, not a store asset),
//   data-real-embedded.js / audio-manifest-embedded.js (file:// fallbacks —
//   the store is always served over HTTP), parked/, README.md.
//
// Generated:
//   store/public/app/quarantine-index.json  {states:{UT:{source,cards:[…]}}}
//   store/src/generated/free-paths.json     middleware allowlist + paid prefixes
//   store/src/generated/catalog.json        landing pages / sitemap / checkout
//
// Usage: node tools/preview/sync-store.mjs [--check]   (--check = report only)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { patchCustomerHtml } from '../../store/learner-assets/customer-ui.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const LANE = path.resolve(here, '..', '..');
const SRC = path.join(LANE, 'app-preview');
const STORE = path.join(LANE, 'store');
const DEST = path.join(STORE, 'public', 'app');
const GEN = path.join(STORE, 'src', 'generated');
const CHECK = process.argv.includes('--check');
const ASSETS = path.join(STORE, 'learner-assets');
const posix = (p) => p.split(path.sep).join('/');
const walk = (dirAbs) => {
  if (!fs.existsSync(dirAbs)) return [];
  const out = [];
  for (const name of fs.readdirSync(dirAbs)) {
    const p = path.join(dirAbs, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p)); else out.push(p);
  }
  return out;
};
const SIGN_ASSETS = walk(path.join(ASSETS, 'signs')).map((f) => posix(path.relative(ASSETS, f))).sort();
const VISUAL_ASSETS = walk(path.join(ASSETS, 'visuals')).map((f) => posix(path.relative(ASSETS, f))).sort();
const STORE_ASSETS = ['gate.js', 'learner.css', ...SIGN_ASSETS, ...VISUAL_ASSETS];
const KEEP = new Set(STORE_ASSETS);

const die = (msg) => { console.error('sync-store: ' + msg); process.exit(1); };
if (!fs.existsSync(path.join(SRC, 'index.html'))) die('app-preview/index.html not found at ' + SRC);
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(SRC, rel), 'utf8'));
const relSrc = (abs) => posix(path.relative(SRC, abs));
const trim = (p) => String(p || '').replace(/\/+$/, '');

// ---------------------------------------------------------------- copy set
const STATES = readJson('data/states.json');
if (!Array.isArray(STATES) || !STATES.length) die('data/states.json is empty');
const COMPLETE = STATES.filter((s) => s.status === 'complete');

const copy = new Set(['styles.css', 'states-embedded.js', 'data/states.json', 'data-embedded.js', 'data/manifest.json']);
for (const f of walk(path.join(SRC, 'data', 'synthetic'))) copy.add(relSrc(f));
for (const s of COMPLETE) for (const f of walk(path.join(SRC, trim(s.data_root)))) copy.add(relSrc(f));
const AUDIO_OK = (rel) => rel.endsWith('.mp3') || path.posix.basename(rel) === 'audio-manifest.json';
const skippedAudio = [];
for (const f of walk(path.join(SRC, 'audio'))) {
  const rel = relSrc(f);
  if (AUDIO_OK(rel)) copy.add(rel); else skippedAudio.push(rel);
}
// lesson videos (2026-10-31): video/<xx>/{<unit>.mp4, <unit>.jpg, video-manifest.json}, written by tools/video/onboard-videos.mjs
const VIDEO_OK = (rel) => rel.endsWith('.mp4') || rel.endsWith('.jpg') || path.posix.basename(rel) === 'video-manifest.json';
if (fs.existsSync(path.join(SRC, 'video'))) for (const f of walk(path.join(SRC, 'video'))) { const rel = relSrc(f); if (VIDEO_OK(rel)) copy.add(rel); }
const quarantineFiles = [];
for (const name of fs.readdirSync(path.join(SRC, 'data'))) {
  const rel = 'data/' + name + '/quarantine.json';
  if (fs.existsSync(path.join(SRC, rel))) { copy.add(rel); quarantineFiles.push(rel); }
}
for (const rel of copy) if (!fs.existsSync(path.join(SRC, rel))) die('missing source file ' + rel);

// ------------------------------------------------------- STORE PATCH (index.html)
// Applied to the store copy only; app-preview/index.html is never edited.
// Every anchor must match exactly once, or the sync fails loudly (the shell
// changed upstream and the patch needs a human look). With no gate.js present
// (app-preview, file://) the patched branches are inert: `window.NovaGate` is
// undefined and the shell behaves exactly as before.
const PATCHES = [
  {
    name: 'load gate.js before the module script',
    find: '<script src="states-embedded.js" defer></script>\n',
    replace: '<script src="states-embedded.js" defer></script>\n'
      + '<!-- STORE PATCH (tools/preview/sync-store.mjs): paywall + quarantine gate.\n'
      + '     gate.js defines window.NovaGate; it exists only in store/public/app. -->\n'
      + '<script src="gate.js"></script>\n',
  },
  {
    name: 'loadReal: skip locked chapters, hide quarantined cards',
    find: '    for (const e of manifest.files || []) {\n'
      + '      const rel = relKey(root, e.file);\n'
      + '      files[rel] = await fetchJson(root + "/" + rel);\n'
      + '    }\n'
      + '    return { manifest, files, from: "fetch" };\n',
    replace: '    for (const e of manifest.files || []) {\n'
      + '      // STORE PATCH: chapters the visitor has not unlocked are not fetched\n'
      + '      // (the server refuses them too); chapter 1 always loads.\n'
      + '      if (window.NovaGate && !window.NovaGate.canLoad(s, e.section_id)) continue;\n'
      + '      const rel = relKey(root, e.file);\n'
      + '      files[rel] = await fetchJson(root + "/" + rel);\n'
      + '    }\n'
      + '    // STORE PATCH: hide quarantined card ids from decks, card scripts and\n'
      + '    // recaps in the loaded view model (the artifact files are untouched).\n'
      + '    if (window.NovaGate) window.NovaGate.hideQuarantined(s, files);\n'
      + '    if (window.NovaGate && window.NovaGate.ensureStateVisuals) await window.NovaGate.ensureStateVisuals(s);\n'
      + '    return { manifest, files, from: "fetch" };\n',
  },
  {
    name: 'routeState: locked routes render the buy panel',
    find: '// One state\'s course: sub = parts after "#/<xx>/".\nfunction routeState(sub) {\n',
    replace: '// STORE PATCH: read-only view helpers handed to gate.js.\n'
      + 'const GATE_VIEW = { esc, P: () => P(), HB: () => HB(), realNote: () => REAL_NOTE, sections: () => SECTIONS,\n'
      + '  hasAudio: () => !!AUDIO_MANIFEST, stopAudio: () => stopAudio(), manifest: () => (R && R.manifest) || null, sectionMeta, sectionOfModule, sectionOfUnit, moduleForUnit, practiceForms };\n'
      + '// One state\'s course: sub = parts after "#/<xx>/".\nfunction routeState(sub) {\n'
      + '  // STORE PATCH: chapter 1 is free; chapters 2+ (and their modules, lessons,\n'
      + '  // cards, quizzes, practice forms) render gate.js\'s buy panel unless the\n'
      + '  // signed-in visitor holds an unexpired entitlement for this state.\n'
      + '  const gated = window.NovaGate ? window.NovaGate.route(ST, sub || [], GATE_VIEW) : null;\n'
      + '  if (gated) return gated;\n',
  },
  {
    name: 'route: post-render hook (quarantine note, store copy fixes)',
    find: '  view.innerHTML = out.html;\n',
    replace: '  // STORE PATCH: gate.js post-render hook (quarantine note, buy card on\n'
      + '  // lists, store-true copy). Identity when gate.js is absent.\n'
      + '  view.innerHTML = window.NovaGate ? window.NovaGate.after(ST, sub, out.html, GATE_VIEW) : out.html;\n',
  },
  {
    name: 'bootstrap: wait for /api/me before the first route',
    find: '  .then(() => { route(); })\n',
    replace: '  .then(() => (window.NovaGate ? window.NovaGate.ready : null)) // STORE PATCH: entitlements first\n'
      + '  .then(() => { route(); })\n',
  },
];
let html = fs.readFileSync(path.join(SRC, 'index.html'), 'utf8').replace(/\r\n/g, '\n');
for (const p of PATCHES) {
  const n = html.split(p.find).length - 1;
  if (n !== 1) die(`patch "${p.name}": anchor found ${n} times (want 1) — app-preview/index.html changed; update PATCHES`);
  html = html.replace(p.find, () => p.replace);
}
html = patchCustomerHtml(html);

// ------------------------------------------------------------ mirror files
let copied = 0, skipped = 0, removed = 0, bytes = 0;
const writeIfChanged = (destAbs, content) => {
  if (fs.existsSync(destAbs) && fs.readFileSync(destAbs, 'utf8') === content) return false;
  if (!CHECK) { fs.mkdirSync(path.dirname(destAbs), { recursive: true }); fs.writeFileSync(destAbs, content); }
  return true;
};
if (writeIfChanged(path.join(DEST, 'index.html'), html)) copied++; else skipped++;
for (const rel of STORE_ASSETS) {
  const source = fs.readFileSync(path.join(ASSETS, rel));
  const target = path.join(DEST, rel);
  if (fs.existsSync(target) && fs.readFileSync(target).equals(source)) { skipped++; continue; }
  if (!CHECK) { fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, source); }
  copied++;
}
for (const rel of [...copy].sort()) {
  const s = path.join(SRC, rel), d = path.join(DEST, rel);
  const ss = fs.statSync(s);
  bytes += ss.size;
  if (fs.existsSync(d)) {
    const ds = fs.statSync(d);
    if (ds.size === ss.size && ds.mtimeMs >= ss.mtimeMs) { skipped++; continue; }
  }
  if (!CHECK) { fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
  copied++;
}

// ------------------------------------------------------ quarantine index
const SLUG_DIR = (s) => String(s.code).toLowerCase();
const qIndex = { generated_by: 'tools/preview/sync-store.mjs', policy: 'hide listed card ids at render time; never alter the artifact', states: {} };
for (const s of COMPLETE) {
  const cands = [`data/${SLUG_DIR(s)}/quarantine.json`, trim(s.data_root) + '/quarantine.json'];
  const rel = cands.find((c) => fs.existsSync(path.join(SRC, c)));
  if (!rel) continue;
  let doc;
  try { doc = readJson(rel); } catch (e) { die('bad JSON in ' + rel + ': ' + e.message); }
  const cards = (Array.isArray(doc && doc.cards) ? doc.cards : []).filter((c) => c && typeof c.id === 'string' && c.id)
    .map((c) => ({ id: c.id, deck: c.deck ?? null, class: c.class ?? null }));
  qIndex.states[s.code] = { source: rel, cards };
  if (!copy.has(rel)) { copy.add(rel); if (!CHECK) { fs.mkdirSync(path.dirname(path.join(DEST, rel)), { recursive: true }); fs.copyFileSync(path.join(SRC, rel), path.join(DEST, rel)); } }
}
const qJson = JSON.stringify(qIndex, null, 1) + '\n';
if (writeIfChanged(path.join(DEST, 'quarantine-index.json'), qJson)) copied++;

// ------------------------------------------------- free allowlist + paid map
// Free = the shell itself, registries/manifests, quarantine lists, and every
// file of each state's FIRST chapter (by n) — plus that chapter's narration
// clips (only Utah has minted audio today). Everything else under /app/ needs
// an unexpired entitlement for the state that owns its prefix.
const firstChapter = (s) => [...(s.chapters || [])].sort((a, b) => (a.n || 0) - (b.n || 0))[0] || null;
const free = new Set(['', 'index.html', ...STORE_ASSETS, 'quarantine-index.json', 'styles.css', 'states-embedded.js', 'data-embedded.js', 'data/states.json', 'data/manifest.json']);
for (const rel of copy) if (rel.startsWith('data/synthetic/') || rel.endsWith('/quarantine.json')) free.add(rel);
const paidPrefixes = [];
const catalog = [];
const audioByState = {};
for (const s of COMPLETE) {
  const root = trim(s.data_root);
  const ch1 = firstChapter(s);
  if (!ch1) die(s.code + ' has no chapters in states.json');
  paidPrefixes.push({ prefix: root + '/', code: s.code });
  paidPrefixes.push({ prefix: trim(s.audio_root) + '/', code: s.code });
  const manifest = readJson(root + '/manifest.json');
  if (manifest.run_id && manifest.run_id !== s.run_id) die(`${s.code}: manifest run_id ${manifest.run_id} != states.json ${s.run_id}`);
  free.add(root + '/manifest.json');
  const relOf = (file) => { const pre = root + '/'; return String(file).startsWith(pre) ? String(file) : String(file).replace(/^data\/real\//, pre); };
  // counts for the landing pages, straight from the accepted exports
  // held-back (quarantined) cards are not counted: the counts describe what renders
  const hidden = new Set(((qIndex.states[s.code] || {}).cards || []).map((c) => c.id));
  let cards = 0, heldBack = 0, items = 0, lessons = 0, forms = 0, quizzes = 0;
  const built = new Set();
  for (const e of manifest.files || []) {
    const rel = relOf(e.file);
    if (!copy.has(rel)) die(`${s.code}: manifest lists ${rel} but it is not in the copy set`);
    if (e.section_id && e.section_id === ch1.id) free.add(rel);
    if (e.stage_id === '03.combined_kg') built.add(e.section_id);
    const doc = (e.stage_id === '04.cards' || e.stage_id === '06.exam_bank' || e.stage_id === '05.sessions') ? readJson(rel) : null;
    if (e.stage_id === '04.cards') for (const d of doc.decks || []) for (const c of d.cards || []) { if (hidden.has(c.card_id)) heldBack++; else cards++; }
    if (e.stage_id === '06.exam_bank') { items += (doc.items || []).length; forms += (doc.practice_forms || []).length; quizzes += (doc.module_quizzes || []).length; }
    if (e.stage_id === '05.sessions') lessons += (doc.units || []).length;
  }
  // audio (only when the state's manifest exists on disk)
  let audio = null;
  if (fs.existsSync(path.join(SRC, s.audio_manifest))) {
    const am = readJson(s.audio_manifest);
    const aroot = trim(s.audio_root) || 'audio';
    const rebase = (ref) => { const r = String(ref || ''); if (r.startsWith(aroot + '/')) return r; if (r.startsWith('audio/')) return aroot + r.slice('audio'.length); return aroot + '/' + r; };
    free.add(s.audio_manifest);
    let freeClips = 0;
    let sampleSlide = null, sampleCardQ = null, sampleCardId = null, sampleCardA = null;
    for (const e of am.entries || []) {
      const secs = String(e.section || '').split('+');
      if (e.file_ref && secs.includes(ch1.id)) {
        const reb = rebase(e.file_ref);
        free.add(reb);
        freeClips++;
        if (!sampleSlide && e.kind === 'slide') sampleSlide = reb;
        if (!sampleCardQ && e.kind === 'card_q') { sampleCardQ = reb; sampleCardId = e.id; }
        if (sampleCardId && !sampleCardA && e.kind === 'card_a' && e.id === sampleCardId) sampleCardA = reb;
      }
    }
    if (am.think && am.think[ch1.id]) free.add(aroot + '/' + am.think[ch1.id]);
    audio = { clips: (am.totals && am.totals.clips) || (am.entries || []).length, free_clips: freeClips, sample_slide: sampleSlide, sample_card_q: sampleCardQ, sample_card_a: sampleCardA };
    audioByState[s.code] = audio;
  }
  // lesson videos (optional per state; convention video/<xx>/): chapter-1 units free, the rest behind the state's paid prefix
  let video = null;
  const vroot = 'video/' + s.code.toLowerCase();
  if (fs.existsSync(path.join(SRC, vroot, 'video-manifest.json'))) {
    const vm = readJson(vroot + '/video-manifest.json');
    paidPrefixes.push({ prefix: vroot + '/', code: s.code });
    free.add(vroot + '/video-manifest.json');
    let units = 0, freeUnits = 0;
    for (const u of Object.values(vm.units || {})) {
      units++;
      if (u.section_id === ch1.id) { if (u.file) free.add(u.file); if (u.poster) free.add(u.poster); freeUnits++; }
    }
    video = { units, free_units: freeUnits, duration_seconds: (vm.totals && vm.totals.duration_seconds) || null };
  }
  catalog.push({
    code: s.code, registry_name: s.name, handbook: s.handbook, test: s.test, run_id: s.run_id,
    chapters: (s.chapters || []).map((c, i) => ({ id: c.id, n: c.n || i + 1, title: c.title || c.id, built: built.has(c.id) })),
    free_chapter: { id: ch1.id, n: ch1.n || 1, title: ch1.title || ch1.id },
    counts: { chapters_built: built.size, chapters_total: (s.chapters || []).length, flashcards: cards, flashcards_held_back: heldBack, quiz_items: items, lessons, module_quizzes: quizzes, practice_forms: forms },
    audio,
    video,
  });
}
for (const rel of free) if (rel && !copy.has(rel) && !['index.html', ...STORE_ASSETS, 'quarantine-index.json'].includes(rel)) die('free path not in copy set: ' + rel);
paidPrefixes.sort((a, b) => b.prefix.length - a.prefix.length);
const freeDoc = { generated_by: 'tools/preview/sync-store.mjs', note: 'paths are relative to /app/', free: [...free].sort(), paid_prefixes: paidPrefixes };
const catDoc = { generated_by: 'tools/preview/sync-store.mjs', states: catalog };
if (!CHECK) fs.mkdirSync(GEN, { recursive: true });
writeIfChanged(path.join(GEN, 'free-paths.json'), JSON.stringify(freeDoc, null, 1) + '\n');
writeIfChanged(path.join(GEN, 'catalog.json'), JSON.stringify(catDoc, null, 1) + '\n');

// ------------------------------------------------------- remove stale files
const want = new Set([...copy, 'index.html', 'quarantine-index.json']);
for (const f of walk(DEST)) {
  const rel = posix(path.relative(DEST, f));
  if (KEEP.has(rel) || want.has(rel)) continue;
  if (!CHECK) fs.unlinkSync(f);
  removed++;
}

const freeAudio = Object.entries(audioByState).map(([c, a]) => `${c}:${a.free_clips}/${a.clips}`).join(' ') || 'none';
console.log(`sync-store${CHECK ? ' (--check, nothing written)' : ''}: ${copy.size + 2} files (${(bytes / 1e6).toFixed(1)} MB) · copied ${copied} · unchanged ${skipped} · removed stale ${removed}`);
console.log(`  states: ${COMPLETE.length} complete · free paths ${free.size} · paid prefixes ${paidPrefixes.length} · free narration clips ${freeAudio}`);
console.log(`  quarantine: ${quarantineFiles.length ? quarantineFiles.join(', ') : 'no data/<xx>/quarantine.json yet (empty list)'} · hidden ids ${Object.values(qIndex.states).reduce((n, x) => n + x.cards.length, 0)}`);
console.log(`  skipped audio floor files: ${skippedAudio.join(', ') || 'none'}`);
if (!fs.existsSync(path.join(DEST, 'gate.js'))) console.log('  WARNING: store/public/app/gate.js is missing — the shell will run ungated');
