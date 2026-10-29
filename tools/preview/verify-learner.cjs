// verify-learner.cjs — preview-lane DOM harness (Muse Code, preview lane).
// Whole-handbook edition: executes the REAL app-preview/index.html inline
// module in a minimal DOM sandbox with the file:// embedded data, drives
// every learner + reviewer route across ALL 16 handbook chapters, and
// asserts: chapter count = sections with an accepted KG; per chapter the
// lesson/cards/quiz counts equal the exports; home aggregate counts equal
// the exports; the fictional sample string appears ONLY on
// #/synthetic-sample; and the minted-audio coverage gate (cards_missing_voice
// and sessions_missing_audio are 0, every rendered card/slide references its
// manifest file_ref, no speechSynthesis string remains in app-preview/).
//
// Multi-state shell edition (2026-10-28): the registry app-preview/data/states.json
// drives a state picker at #/ and per-state routes #/<xx>/…; legacy
// unprefixed routes redirect to Utah. The harness asserts the picker (one
// card per registry entry, Utah card -> #/ut/, a non-complete entry renders
// "coming soon" with no link), the redirects, and runs every content/audio
// assertion against Utah's prefixed routes. Spoken recall was removed
// 2026-10-28; the harness asserts no trace of it remains in index.html. Content and audio load
// through the app's own per-state loaders: in the default mode fetch fails
// and the app injects the state's *-embedded.js fallbacks (exactly like a
// file:// open); with --http=<base> the app fetches from a running
// tools/preview/serve.mjs instead.
//
// Usage: node tools/preview/verify-learner.cjs [--http=http://127.0.0.1:4311]
//        node tools/preview/verify-learner.cjs --root=store/public/app
// Exit 0 = all checks pass. No model calls, read-only. Default mode makes no
// network requests; --http mode only talks to the given local server.
//
// Store edition (2026-10-28): --root=<dir> runs the same checks against a
// mirrored copy of the shell (store/public/app, made by sync-store.mjs). Its
// fetches are answered from that directory on disk; /api/me is mocked. When
// <dir>/gate.js exists (STORE mode) the content run is signed in with a Utah
// entitlement, expected decks exclude quarantined card ids, the reviewer-only
// trace link must be absent, and a gate section asserts: signed out, chapter 1
// is free and chapter 2 renders the buy panel (and its files are never
// fetched); a quarantined card id never renders and the deck says so.
// Expected content always comes from app-preview's embedded exports.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const APP = path.join(ROOT, 'app-preview');            // expected model source
const ROOT_ARG = (process.argv.find((a) => a.startsWith('--root=')) || '').slice('--root='.length);
const UNDER = ROOT_ARG ? path.resolve(ROOT, ROOT_ARG) : APP; // shell under test
const STORE = !!ROOT_ARG && fs.existsSync(path.join(UNDER, 'gate.js'));
const HTTP_BASE = ((process.argv.find((a) => a.startsWith('--http=')) || '').slice('--http='.length)).replace(/\/+$/, '');
const FETCH_MODE = !!HTTP_BASE || !!ROOT_ARG;
const fails = [];
const ok = (name, cond, extra) => {
  if (cond) { console.log('PASS ' + name); }
  else { fails.push(name); console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
};
console.log('mode: ' + (HTTP_BASE ? 'http ' + HTTP_BASE : ROOT_ARG ? 'disk fetch from ' + path.relative(ROOT, UNDER) + (STORE ? ' (STORE: gate.js present)' : '') : 'file:// fallback (embedded scripts injected by the app)'));
// Disk-backed fetch for --root mode; /api/me answers from `me` (STORE gate).
const fetchLog = [];
const diskFetch = (getMe, override) => async (u) => {
  const s = String(u);
  fetchLog.push(s);
  const res = (status, body) => ({ ok: status === 200, status, json: async () => JSON.parse(body) });
  if (s === '/api/me') return res(200, JSON.stringify(getMe()));
  if (override && Object.prototype.hasOwnProperty.call(override, s)) return res(200, JSON.stringify(override[s]));
  const file = path.resolve(UNDER, s.split('?')[0]);
  if (!file.startsWith(UNDER + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return res(404, '{}');
  return res(200, fs.readFileSync(file, 'utf8'));
};
const FUTURE = new Date(Date.now() + 300 * 864e5).toISOString();
let ME = { signedIn: true, entitlements: { UT: FUTURE } };

// ---- state registry ----
const STATES = JSON.parse(fs.readFileSync(path.join(APP, 'data', 'states.json'), 'utf8'));
ok('states.json is a non-empty array', Array.isArray(STATES) && STATES.length > 0);
const UT = STATES.find((s) => s.code === 'UT');
ok('states.json: Utah entry', !!UT && UT.status === 'complete' && UT.run_id === '2026-10-26-rdmv-ut-class-d' && UT.data_root === 'data/real' && UT.audio_root === 'audio' && UT.audio_manifest === 'audio/audio-manifest.json', JSON.stringify(UT || null).slice(0, 200));
for (const s of STATES) {
  const missing = ['code', 'name', 'run_id', 'handbook', 'test', 'data_root', 'audio_root', 'audio_manifest', 'status', 'authored_by'].filter((k) => typeof s[k] !== 'string' || !s[k]);
  ok('states.json: ' + s.code + ' has every required field', missing.length === 0, missing.join(','));
}
// Content invariants (2026-10-29, after the re-author pass shipped doubled decks
// to five states and the harness passed): per complete state, exactly one 04 deck
// artifact per section, no duplicate card ids, every card has a script, and every
// card script's must_match_card_back and answer segment equal the card back byte
// for byte. Reads the exported manifests under the shell under test.
for (const s of STATES) {
  if (s.status !== 'complete' || !s.data_root) continue;
  let man;
  try { man = JSON.parse(fs.readFileSync(path.join(UNDER, s.data_root, 'manifest.json'), 'utf8')); }
  catch (e) { ok('content: ' + s.code + ' manifest readable', false, String(e.message).slice(0, 80)); continue; }
  const files = (stage) => (man.files || []).filter((f) => f.stage_id === stage);
  const read = (f) => JSON.parse(fs.readFileSync(path.join(UNDER, String(f.file).replace(/^\.?\//, '')), 'utf8'));
  const deckFiles = files('04.cards');
  const perSection = {};
  for (const f of deckFiles) perSection[f.section_id] = (perSection[f.section_id] || 0) + 1;
  const doubled = Object.entries(perSection).filter(([, n]) => n > 1).map(([k, n]) => k + 'x' + n);
  ok('content: ' + s.code + ' one 04 deck artifact per section', doubled.length === 0, doubled.slice(0, 4).join(' '));
  const backs = new Map(); let dup = 0;
  for (const f of deckFiles) { let j; try { j = read(f); } catch { continue; }
    for (const d of j.decks || []) for (const c of d.cards || []) { if (backs.has(c.card_id)) dup++; backs.set(c.card_id, c.back); } }
  ok('content: ' + s.code + ' no duplicate card ids', dup === 0, 'duplicates=' + dup);
  const scripted = new Set(); let mismatch = 0; const ex = [];
  for (const f of files('05.card_scripts')) { let j; try { j = read(f); } catch { continue; }
    for (const sc of j.audio_scripts || []) {
      if (!sc.card_id || !backs.has(sc.card_id)) continue; // recaps and non-card scripts
      scripted.add(sc.card_id);
      const ans = sc.segments && sc.segments.answer ? sc.segments.answer.text : undefined;
      const back = backs.get(sc.card_id);
      if (sc.must_match_card_back !== back || (ans !== undefined && ans !== back)) { mismatch++; if (ex.length < 3) ex.push(sc.card_id); }
    } }
  const unscripted = [...backs.keys()].filter((id) => !scripted.has(id)).length;
  ok('content: ' + s.code + ' every card has a script', unscripted === 0, 'unscripted=' + unscripted);
  ok('content: ' + s.code + ' card scripts byte-equal to card backs', mismatch === 0, 'mismatch=' + mismatch + ' ' + ex.join(' '));
}
const swin = {};
vm.runInNewContext(fs.readFileSync(path.join(UNDER, 'states-embedded.js'), 'utf8'), { window: swin });
ok('states-embedded.js matches states.json', JSON.stringify(swin.__STATES_EMBEDDED) === JSON.stringify(STATES), 'regenerate: node tools/preview/embed-states.mjs');
const PFX = '#/ut/';

// ---- load Utah's embedded data the way file:// does (expected model) ----
const win = {};
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(APP, UT.content_embedded || 'data-real-embedded.js'), 'utf8'), { window: win });
vm.runInNewContext(fs.readFileSync(path.join(APP, 'data-embedded.js'), 'utf8'), { window: win });
const REAL = win.__REAL_EMBEDDED;
const SYN = win.__PREVIEW_EMBEDDED;
ok('embedded real manifest present', !!(REAL && REAL.manifest && REAL.manifest.files));
ok('embedded real manifest is Utah run', !!(REAL && REAL.manifest && REAL.manifest.run_id === UT.run_id));
ok('embedded synthetic present', !!(SYN && SYN.manifest));
vm.runInNewContext(fs.readFileSync(path.join(APP, UT.audio_embedded || 'audio-manifest-embedded.js'), 'utf8'), { window: win });
const AUD = win.__AUDIO_MANIFEST_EMBEDDED;
ok('embedded audio manifest present', !!(AUD && Array.isArray(AUD.entries)));

// ---- minted-audio coverage gate: manifest totals ----
const AM = JSON.parse(fs.readFileSync(path.join(APP, UT.audio_manifest), 'utf8'));
ok('audio manifest loads', !!(AM && Array.isArray(AM.entries) && AM.totals));
ok('audio: cards_missing_voice === 0', AM.totals && AM.totals.cards_missing_voice === 0, JSON.stringify(AM.totals));
ok('audio: sessions_missing_audio === 0', AM.totals && AM.totals.sessions_missing_audio === 0, JSON.stringify(AM.totals));
ok('audio: runtime policy is files-only', AM.runtime_policy === 'play_pre_generated_files_only', String(AM.runtime_policy));
ok('audio: minted voice is honestly not Meta', !!(AM.minted_by && AM.minted_by.not_a_meta_model === true), JSON.stringify(AM.minted_by));
const AM_BY_KEY = new Map(AM.entries.map((e) => [`${e.kind}|${e.id}`, e]));
const AM_SLIDE = new Map(AM.entries.filter((e) => e.kind === 'slide').map((e) => [`${e.unit_id}|${e.slide_id}`, e]));
const AM_FILES = new Set(AM.entries.map((e) => e.file_ref));
const AUDIO_TAG = 'pre-generated (OpenAI TTS, not a Meta model)';
const countTag = (h) => h.split(AUDIO_TAG).length - 1;

// ---- sandbox (factory: STORE mode builds a second, signed-out one) ----
const html = fs.readFileSync(path.join(UNDER, 'index.html'), 'utf8');
ok('index.html starts with a real doctype', html.startsWith('<!DOCTYPE html>'));
ok('index.html no longer hard-loads Utah fallbacks', !/<script src="data-real-embedded\.js"/.test(html) && !/<script src="audio-manifest-embedded\.js"/.test(html));
ok('index.html loads the states registry fallback', /<script src="states-embedded\.js"/.test(html));
const m = html.match(/<script type="module">([\s\S]*)<\/script>/);
if (!m) { console.error('NO-MODULE-SCRIPT'); process.exit(2); }
const driver = m[1] + '\n;globalThis.__go = (hash) => { location.hash = hash; route(); return { html: view.innerHTML, bannerClass: document.getElementById("banner").className, bannerText: document.getElementById("banner").textContent, hash: location.hash }; };'
  + '\nglobalThis.__save = saveResult; globalThis.__R = () => R; globalThis.__D = () => D;'
  + '\nglobalThis.__states = () => STATES; globalThis.__statesFrom = () => STATES_FROM; globalThis.__setStates = (l) => { STATES = l; };'
  + '\nglobalThis.__ensure = (slug) => ensureState(stateBySlug(slug)); globalThis.__summaries = () => Promise.all((STATES || []).filter((s) => s.status === "complete").map((s) => ensureSummary(s)));'
  + '\nglobalThis.__summary = (code) => SUMMARY[code]; globalThis.__active = () => (ST ? ST.code : null);'
  + '\nglobalThis.__audio = () => ({ has: !!AUDIO_MANIFEST, files: AUDIO_FILES.size, pause_ms: AUDIO_PAUSE_MS, from: AUDIO_FROM, root: AUDIO_ROOT });';
function makeSandbox(getMe, override) {
  let lastHtml = '';
  let bannerClass = '', bannerText = '';
  const bannerEl = {
    set className(v) { bannerClass = v; }, get className() { return bannerClass; },
    set textContent(v) { bannerText = v; }, get textContent() { return bannerText; },
  };
  const viewEl = {
    set innerHTML(v) { lastHtml = String(v); }, get innerHTML() { return lastHtml; },
    querySelectorAll() { return []; },
    querySelector() { return null; },
    focus() {},
  };
  const memStore = {};
  const injected = []; // every <script src> the app injected (file:// fallback path)
  // Static <script defer> tags in index.html (synthetic sample + state registry)
  // are pre-run into the sandbox window the way a browser would; per-state
  // fallbacks are NOT pre-loaded — the app must inject them itself.
  const sandboxWindow = {
    __PREVIEW_EMBEDDED: SYN, __STATES_EMBEDDED: swin.__STATES_EMBEDDED,
    matchMedia: () => ({ matches: false }),
    scrollTo: () => {}, addEventListener: () => {},
  };
  const sandbox = {
    window: sandboxWindow,
    document: {
      getElementById: (id) => (id === 'banner' ? bannerEl : id === 'view' ? viewEl : null),
      querySelectorAll: () => [],
      querySelector: () => null,
      createElement: (tag) => ({ tagName: String(tag).toUpperCase() }),
      head: {
        appendChild(el) {
          injected.push(el.src);
          setImmediate(() => {
            const file = path.resolve(UNDER, String(el.src || ''));
            if (!file.startsWith(UNDER) || !fs.existsSync(file)) { if (el.onerror) el.onerror(new Error('404 ' + el.src)); return; }
            try { vm.runInNewContext(fs.readFileSync(file, 'utf8'), { window: sandboxWindow }); } catch (e) { if (el.onerror) el.onerror(e); return; }
            if (el.onload) el.onload();
          });
          return el;
        },
      },
    },
    location: { hash: '#/' },
    localStorage: {
      getItem: (k) => (k in memStore ? memStore[k] : null),
      setItem: (k, v) => { memStore[k] = String(v); },
      removeItem: (k) => { delete memStore[k]; },
    },
    fetch: HTTP_BASE
      ? async (u) => fetch(new URL(String(u), HTTP_BASE + '/'))
      : ROOT_ARG ? diskFetch(getMe, override)
      : async () => { throw new Error('no-http-in-harness'); },
    console,
    setTimeout, clearTimeout, setInterval, clearInterval,
  };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  // gate.js is a classic <script> that runs before the module (STORE mode only).
  if (STORE) vm.runInContext(fs.readFileSync(path.join(UNDER, 'gate.js'), 'utf8'), sandbox);
  vm.runInContext(driver, sandbox);
  return { sandbox, injected, memStore, gate: sandboxWindow.NovaGate || null };
}
const MAIN = makeSandbox(() => ME);
const sandbox = MAIN.sandbox, injected = MAIN.injected, memStore = MAIN.memStore;
// Quarantined (held-back) card ids for Utah, as the store copy lists them.
const QIDX = STORE && fs.existsSync(path.join(UNDER, 'quarantine-index.json')) ? JSON.parse(fs.readFileSync(path.join(UNDER, 'quarantine-index.json'), 'utf8')) : { states: {} };
const Q_UT = new Set((((QIDX.states || {}).UT || {}).cards || []).map((c) => c.id));
if (STORE) console.log('STORE: Utah quarantine ids = ' + Q_UT.size);

const tick = () => new Promise((r) => setImmediate(r));
const escS = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- expected model straight from the embedded exports ----
function buildExpected() {
  const files = REAL.files;
  const entryByRel = {};
  for (const e of (REAL.manifest.files || [])) entryByRel[e.file.replace(/^data\/real\//, '')] = e;
  const byStage = (prefix) => Object.keys(files).filter((k) => k.startsWith(prefix + '/')).map((k) => ({ rel: k, entry: entryByRel[k], doc: files[k] }));
  const kgs = byStage('03_combined_kg');
  const cardsDocs = byStage('04_cards');
  const sessDocs = byStage('05_sessions');
  const examDocs = byStage('06_exam_bank');
  const scriptDocs = byStage('05_card_scripts');
  const sections = {}; // secId -> { modules:[{module_id,title,unit_id,section_id}], ... }
  for (const { entry, doc } of kgs) {
    const sec = entry.section_id;
    const hintBy = {};
    (doc.curriculum_unit_hints || []).forEach((h) => { hintBy[h.module_id] = h.unit_id; });
    sections[sec] = {
      sec,
      kg: doc,
      modules: (doc.modules || []).map((x) => ({ module_id: x.module_id, title: x.title, unit_id: hintBy[x.module_id] || null, section_id: sec })),
    };
  }
  const findUnit = (unitId) => {
    for (const { doc } of sessDocs) {
      const u = (doc.units || []).find((x) => x.unit_id === unitId);
      if (u) return u;
    }
    return null;
  };
  const findDeck = (unitId, moduleId) => {
    const out = [];
    for (const { doc } of cardsDocs) {
      for (const d of (doc.decks || [])) {
        for (const c of (d.cards || [])) {
          if (Q_UT.has(c.card_id)) continue; // STORE: held back, never rendered
          if (c.unit_id === unitId || (moduleId && c.module_id === moduleId)) out.push(c);
        }
      }
    }
    const seen = new Set();
    return out.filter((c) => (seen.has(c.card_id) ? false : (seen.add(c.card_id), true)));
  };
  const findQuiz = (unitId) => {
    for (const { doc } of examDocs) {
      const q = (doc.module_quizzes || []).find((x) => x.unit_id === unitId);
      if (q) return q;
    }
    return null;
  };
  const itemsById = {};
  for (const { doc } of examDocs) for (const it of (doc.items || [])) itemsById[it.item_id] = it;
  const scriptsByCard = {};
  const recaps = {};
  for (const { doc } of scriptDocs) {
    for (const s of (doc.audio_scripts || [])) {
      if (Q_UT.has(s.card_id)) continue; // STORE: held back
      if (s.is_recap) recaps[s.module_id] = s;
      else scriptsByCard[s.card_id] = s;
    }
  }
  const forms = [];
  for (const { entry, doc } of examDocs) {
    for (const f of (doc.practice_forms || [])) forms.push({ ...f, section_id: entry.section_id });
  }
  let totalCards = 0;
  for (const { doc } of cardsDocs) for (const d of (doc.decks || [])) totalCards += (d.cards || []).filter((c) => !Q_UT.has(c.card_id)).length;
  let totalLessons = 0, totalSlides = 0;
  for (const { doc } of sessDocs) for (const u of (doc.units || [])) { totalLessons += 1; totalSlides += (u.slides || []).length; }
  return { sections, findUnit, findDeck, findQuiz, itemsById, scriptsByCard, recaps, forms, totalCards, totalLessons, totalSlides, totalItems: Object.keys(itemsById).length };
}

(async () => {
  const go = sandbox.__go;
  if (!go) { console.error('BOOTSTRAP-NEVER-RAN'); process.exit(2); }
  for (let i = 0; i < 200 && !sandbox.__states(); i++) await tick(); // registry + synthetic load
  ok('bootstrap loaded the state registry', Array.isArray(sandbox.__states()) && sandbox.__states().length === STATES.length, 'from=' + sandbox.__statesFrom());
  ok('registry source matches mode', sandbox.__statesFrom() === (FETCH_MODE ? 'fetch' : 'embedded-fallback'), sandbox.__statesFrom());

  // ---- state picker at #/ ----
  await sandbox.__summaries();
  let r = go('#/');
  ok('picker: REAL banner, audit pending', r.bannerClass === 'real-banner' && /belt-validated, audit pending/.test(r.bannerText), r.bannerClass + ' / ' + r.bannerText);
  const cardCodes = [...r.html.matchAll(/data-state-card="([A-Z]{2})"/g)].map((x) => x[1]);
  ok('picker: one card per states.json entry (' + STATES.length + ')', cardCodes.length === STATES.length && STATES.every((s) => cardCodes.includes(s.code)), cardCodes.join(','));
  ok('picker: Utah card links to #/ut/', /data-state-card="UT"[\s\S]*?href="#\/ut\/"/.test(r.html));
  for (const s of STATES) {
    const card = (r.html.split('data-state-card="' + s.code + '"')[1] || '').split('data-state-card=')[0];
    ok('picker: ' + s.code + ' card shows name/handbook/test', card.includes(escS(s.name)) && card.includes(escS(s.handbook)) && card.includes(escS(s.test)));
    if (s.status !== 'complete') ok('picker: ' + s.code + ' is coming soon, not a link', /coming soon/.test(card) && !card.includes('href="#/' + s.code.toLowerCase() + '/"'));
  }
  {
    const files = REAL.manifest.files;
    const built = new Set(files.filter((e) => e.stage_id === '03.combined_kg').map((e) => e.section_id)).size;
    const card = (r.html.split('data-state-card="UT"')[1] || '').split('data-state-card=')[0];
    const want = `${built} of ${(UT.chapters || []).length} chapters built · ${files.length} accepted artifacts · narration: ${AM.totals.cards} cards, ${AM.totals.slides} lesson slides, ${AM.totals.recaps} recaps (${AM.totals.clips} clips)`;
    ok('picker: Utah counts from its manifests', card.includes(want), want);
    if (STORE) ok('picker: STORE strips the reviewer-only trace link', !card.includes('href="trace.html"'));
    else ok('picker: trace link for Utah', card.includes('href="trace.html"'));
  }
  ok('picker: no Nowhere/SYNTHETIC', !/Nowhere/.test(r.html) && !/SYNTHETIC/.test(r.html));
  // non-complete entries: inject a throwaway building state into the in-memory
  // registry only (states.json is untouched), assert, then restore.
  {
    const real = sandbox.__states();
    sandbox.__setStates([...real, { code: 'ZZ', name: 'Harnessland', run_id: 'none', handbook: 'Harnessland Handbook', test: 'Class H test', data_root: 'data/zz/real', audio_root: 'audio/zz', audio_manifest: 'audio/zz/audio-manifest.json', status: 'building', authored_by: 'n/a', chapters: [{ id: 'sec01-a' }, { id: 'sec02-b' }, { id: 'sec03-c' }] }]);
    const x = go('#/');
    const card = (x.html.split('data-state-card="ZZ"')[1] || '');
    ok('picker: building state renders coming soon + what exists', /coming soon/.test(card) && card.includes('3 handbook sections mapped'), card.slice(0, 200));
    ok('picker: building state has no link', !x.html.includes('href="#/zz/"'));
    const y = go('#/zz/');
    ok('picker: #/zz/ renders coming soon, not broken', /Harnessland — coming soon/.test(y.html) && !/Nothing here/.test(y.html));
    const before = injected.length;
    for (let i = 0; i < 20; i++) await tick();
    ok('picker: building state loads no data', injected.length === before && !injected.some((s) => /zz/.test(String(s))), injected.join(','));
    sandbox.__setStates(real);
  }
  r = go('#/nope/');
  ok('unknown state code renders an honest miss', /no state course/.test(r.html));

  // ---- Utah loads through its states.json entry ----
  await sandbox.__ensure('ut');
  r = go(PFX);
  ok('bootstrap loaded real + synthetic', !!(sandbox.__R() && sandbox.__R().manifest && sandbox.__D()));
  ok('Utah content source matches mode', sandbox.__R().from === (FETCH_MODE ? 'fetch' : 'embedded-fallback'), sandbox.__R().from);
  ok('Utah content: every manifest file loaded', Object.keys(sandbox.__R().files).length === REAL.manifest.files.length, Object.keys(sandbox.__R().files).length + '/' + REAL.manifest.files.length);
  if (!FETCH_MODE) {
    ok('file:// path injected Utah fallbacks from states.json', injected.includes(UT.content_embedded) && injected.includes(UT.audio_embedded), injected.join(','));
  } else {
    ok('http path injected no fallback scripts', injected.length === 0, injected.join(','));
  }
  ok('active state is UT', sandbox.__active() === 'UT');
  ok('bootstrap loaded audio manifest', !!(sandbox.__audio() && sandbox.__audio().has && sandbox.__audio().files > 0), JSON.stringify(sandbox.__audio()));
  ok('audio source matches mode', sandbox.__audio().from === (FETCH_MODE ? 'fetch' : 'embedded-fallback'), sandbox.__audio().from);
  ok('audio root from states.json', sandbox.__audio().root === UT.audio_root, sandbox.__audio().root);
  ok('audio: pause_ms matches manifest', sandbox.__audio().pause_ms === AM.pause_ms, 'app=' + sandbox.__audio().pause_ms + ' manifest=' + AM.pause_ms);
  const X = buildExpected();
  const secIds = Object.keys(X.sections);
  console.log('built chapters (accepted KG): ' + secIds.join(', '));

  // ---- legacy unprefixed routes redirect to Utah (one release) ----
  {
    const sec = secIds[0];
    const mod0 = X.sections[sec].modules[0];
    const form0 = X.forms[0];
    const legacy = ['#/chapters', '#/chapter/' + sec, '#/module/' + mod0.module_id, '#/lesson/' + mod0.unit_id, '#/cards/' + mod0.unit_id, '#/quiz/' + mod0.unit_id, '#/practice', '#/practice/' + (form0 ? form0.form_id : 'form-a'), '#/results/none', '#/settings', '#/dossier', '#/modules', '#/real-cards', '#/real-quiz', '#/real-lesson'];
    for (const old of legacy) {
      const want = PFX + old.slice(2);
      const a = go(old);
      const b = go(want);
      ok('redirect ' + old + ' -> ' + want, a.hash === want && a.html === b.html && a.html.length > 0 && !/Nothing here/.test(a.html), 'hash=' + a.hash);
    }
  }

  // ---- Utah home (#/ut/): aggregate counts equal the exports ----
  r = go(PFX);
  ok('home: REAL banner', r.bannerClass === 'real-banner' && /audit pending/.test(r.bannerText), r.bannerClass + ' / ' + r.bannerText);
  ok('home: Utah banner text unchanged', r.bannerText === 'REAL — Utah Driver Handbook, belt-validated, audit pending', r.bannerText);
  const expectCounts = `${secIds.length} of 16 chapters built · ${X.totalCards} flashcards · ${X.totalItems} quiz items · ${X.totalLessons} lessons (${X.totalSlides} slides)`;
  ok('home: aggregate counts from exports', r.html.includes(expectCounts), expectCounts);
  if (STORE) ok('home: STORE strips the trace link', !/href="trace\.html"/.test(r.html));
  else ok('home: trace link', /href="trace\.html"/.test(r.html));
  ok('home: no Nowhere', !/Nowhere/.test(r.html));
  ok('home: no SYNTHETIC', !/SYNTHETIC/.test(r.html));
  for (const sec of secIds) {
    ok('home: chapter link ' + sec, r.html.includes(PFX + 'chapter/' + sec), sec);
  }

  // ---- chapters: 16 in handbook order, built vs not-yet-built ----
  r = go(PFX + 'chapters');
  ok('chapters: REAL banner', r.bannerClass === 'real-banner');
  const order = ['sec01-definitions', 'sec02-licensing-requirements', 'sec03-driver-education-permits', 'sec04-license-types-id-documents', 'sec05-vision-health', 'sec06-examinations', 'sec07-preparing-vehicle', 'sec08-basic-driving', 'sec09-rules-of-the-road', 'sec10-alcohol-drugs', 'sec11-distractions-challenges', 'sec12-crashes-insurance', 'sec13-suspensions-record', 'sec14-sharing-the-road', 'sec15-vehicle-equipment', 'sec16-towing'];
  ok('chapters: 16 chapter cards', (r.html.match(/Chapter \d+ —/g) || []).length === 16, 'found=' + ((r.html.match(/Chapter \d+ —/g) || []).length));
  let lastIdx = -1, ordered = true;
  for (let n = 1; n <= 16; n++) {
    const i = r.html.indexOf(`Chapter ${n} —`);
    if (i < 0 || i < lastIdx) ordered = false;
    lastIdx = i;
  }
  ok('chapters: handbook order 1..16', ordered);
  ok('chapters: built link per KG section', secIds.every((s) => r.html.includes(PFX + 'chapter/' + s)));
  ok('chapters: not-yet-built count', (r.html.match(/Not yet built/g) || []).length === 16 - secIds.length,
    'pending=' + ((r.html.match(/Not yet built/g) || []).length));
  ok('chapters: no Nowhere', !/Nowhere/.test(r.html));

  const learnerRoutes = ['#/', PFX, PFX + 'chapters'];

  // ---- per built chapter: hub, modules, lesson/cards/quiz equal exports ----
  for (const sec of secIds) {
    const S = X.sections[sec];
    const rc = go(PFX + 'chapter/' + sec);
    ok('chapter ' + sec + ': REAL banner', rc.bannerClass === 'real-banner');
    learnerRoutes.push(PFX + 'chapter/' + sec);
    for (const mod of S.modules) {
      ok('chapter ' + sec + ': module ' + mod.module_id, rc.html.includes(escS(mod.module_id)) && rc.html.includes(escS(mod.title)));
      r = go(PFX + 'module/' + mod.module_id);
      learnerRoutes.push(PFX + 'module/' + mod.module_id);
      ok('hub ' + mod.module_id + ': REAL banner', r.bannerClass === 'real-banner');
      const li = r.html.indexOf('Lesson'), fi = r.html.indexOf('Flashcards'), qi = r.html.indexOf('Quiz');
      ok('hub ' + mod.module_id + ': Lesson>Flashcards>Quiz order', li > 0 && li < fi && fi < qi, [li, fi, qi].join(','));

      const unit = X.findUnit(mod.unit_id);
      const deck = X.findDeck(mod.unit_id, mod.module_id);
      const quiz = X.findQuiz(mod.unit_id);

      // lesson
      r = go(PFX + 'lesson/' + mod.unit_id);
      learnerRoutes.push(PFX + 'lesson/' + mod.unit_id);
      if (unit) {
        ok('lesson ' + mod.unit_id + ': REAL banner', r.bannerClass === 'real-banner');
        for (const [i, sl] of unit.slides.entries()) {
          ok('lesson ' + mod.unit_id + ': slide ' + (i + 1) + ' title', r.html.includes(escS(sl.title.text)), (sl.title.text || '').slice(0, 40));
          ok('lesson ' + mod.unit_id + ': slide ' + (i + 1) + ' narration', r.html.includes(escS(sl.narration.text)));
          ok('lesson ' + mod.unit_id + ': slide ' + (i + 1) + ' seconds', r.html.includes(String(sl.estimated_narration_seconds) + 's'));
          for (const l of sl.lines) {
            if (!r.html.includes(escS(l.text))) ok('lesson ' + mod.unit_id + ': slide ' + (i + 1) + ' line', false, l.text.slice(0, 50));
          }
        }
        ok('lesson ' + mod.unit_id + ': slide count ' + unit.slides.length, (r.html.match(/Teacher says/g) || []).length === unit.slides.length);
        const slideRefs = unit.slides.map((sl) => AM_SLIDE.get(mod.unit_id + '|' + sl.slide_id) || null);
        const absentSlides = unit.slides.filter((sl, i) => !slideRefs[i]).map((sl) => sl.slide_id);
        const missingSlides = slideRefs.filter(Boolean).map((e) => e.file_ref).filter((ref) => !r.html.includes(ref));
        ok('lesson ' + mod.unit_id + ': every slide references manifest file_ref', absentSlides.length === 0 && missingSlides.length === 0, 'absent=' + absentSlides.join(',') + ' missing=' + missingSlides.join(','));
        ok('lesson ' + mod.unit_id + ': play button per slide', (r.html.match(/data-slide-audio/g) || []).length === unit.slides.length);
        ok('lesson ' + mod.unit_id + ': narration label once', countTag(r.html) === 1, 'found=' + countTag(r.html));
        ok('lesson ' + mod.unit_id + ': no audio pending', !/audio pending/.test(r.html));
        for (const w of unit.why_how) ok('lesson ' + mod.unit_id + ': why/how', r.html.includes(escS(w.text)));
        ok('lesson ' + mod.unit_id + ': worked example', r.html.includes(escS(unit.worked_example.scenario.text)) && r.html.includes(escS(unit.worked_example.result.text)));
        ok('lesson ' + mod.unit_id + ': misconception', r.html.includes(escS(unit.misconception.claim.text)) && r.html.includes(escS(unit.misconception.correction.text)));
        ok('lesson ' + mod.unit_id + ': memory support', r.html.includes(escS(unit.memory_support.text)));
        ok('lesson ' + mod.unit_id + ': self-check', r.html.includes(escS(unit.self_check.prompt.text)) && r.html.includes(escS(unit.self_check.answer.text)) && r.html.includes(escS(unit.self_check.rationale.text)));
      } else {
        ok('lesson ' + mod.unit_id + ': pending, not filler', /not yet built/i.test(r.html) && r.bannerClass === 'real-banner');
      }
      ok('lesson ' + mod.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));

      // cards
      r = go(PFX + 'cards/' + mod.unit_id);
      learnerRoutes.push(PFX + 'cards/' + mod.unit_id);
      if (deck.length) {
        ok('cards ' + mod.unit_id + ': REAL banner', r.bannerClass === 'real-banner');
        ok('cards ' + mod.unit_id + ': count ' + deck.length, (r.html.match(/data-recall/g) || []).length === deck.length);
        for (const c of deck) {
          if (!r.html.includes(escS(c.front))) ok('cards ' + mod.unit_id + ': front ' + c.card_id, false);
          if (!r.html.includes(escS(c.back))) ok('cards ' + mod.unit_id + ': back ' + c.card_id, false);
          if (!r.html.includes(escS(c.memory_hook))) ok('cards ' + mod.unit_id + ': hook ' + c.card_id, false);
          const t = X.scriptsByCard[c.card_id] && X.scriptsByCard[c.card_id].segments.teaching.text;
          if (t && !r.html.includes(escS(t))) ok('cards ' + mod.unit_id + ': teaching ' + c.card_id, false);
        }
        console.log('PASS cards ' + mod.unit_id + ': ' + deck.length + '/' + deck.length + ' byte-exact fronts+backs+hooks+teaching');
        if (X.recaps[mod.module_id]) ok('cards ' + mod.unit_id + ': recap hook', /Deck recap/.test(r.html));
        const thinkRef = AM.think[mod.section_id] ? 'audio/' + AM.think[mod.section_id] : null;
        const cardGaps = [];
        if (!thinkRef || !AM_FILES.has(thinkRef)) cardGaps.push('think:' + mod.section_id + '(absent-manifest)');
        else if (!r.html.includes(thinkRef)) cardGaps.push(thinkRef);
        for (const c of deck) {
          for (const k of ['card_q', 'card_a', 'card_teach']) {
            const e = AM_BY_KEY.get(k + '|' + c.card_id);
            if (!e) cardGaps.push(k + ':' + c.card_id + '(absent-manifest)');
            else if (!r.html.includes(e.file_ref)) cardGaps.push(e.file_ref);
          }
        }
        const rec = X.recaps[mod.module_id];
        if (rec) {
          const e = AM_BY_KEY.get('recap|' + rec.card_id);
          if (!e) cardGaps.push('recap:' + rec.card_id + '(absent-manifest)');
          else if (!r.html.includes(e.file_ref)) cardGaps.push(e.file_ref);
        }
        ok('cards ' + mod.unit_id + ': every card+recap references manifest file_ref', cardGaps.length === 0, cardGaps.slice(0, 8).join(','));
        ok('cards ' + mod.unit_id + ': play button per card', (r.html.match(/data-card-audio/g) || []).length === deck.length);
        if (rec) ok('cards ' + mod.unit_id + ': recap play button', (r.html.match(/data-recap-audio/g) || []).length === 1);
        ok('cards ' + mod.unit_id + ': no audio pending', !/audio pending/.test(r.html));
      } else {
        ok('cards ' + mod.unit_id + ': pending, not filler', /not yet built/i.test(r.html) && r.bannerClass === 'real-banner');
      }
      ok('cards ' + mod.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));

      // quiz
      r = go(PFX + 'quiz/' + mod.unit_id);
      learnerRoutes.push(PFX + 'quiz/' + mod.unit_id);
      if (quiz) {
        ok('quiz ' + mod.unit_id + ': REAL banner', r.bannerClass === 'real-banner');
        ok('quiz ' + mod.unit_id + ': count ' + quiz.item_ids.length, (r.html.match(/data-ritem/g) || []).length === quiz.item_ids.length);
        let whole = true;
        for (const id of quiz.item_ids) {
          const it = X.itemsById[id];
          if (!it) { whole = false; ok('quiz ' + mod.unit_id + ': item present ' + id, false); continue; }
          if (!r.html.includes(escS(it.stem))) { whole = false; ok('quiz ' + mod.unit_id + ': stem ' + id, false); }
          if (!r.html.includes(escS(it.correct_rationale))) { whole = false; ok('quiz ' + mod.unit_id + ': rationale ' + id, false); }
          for (const o of it.options) {
            if (!r.html.includes(escS(o.text)) || !r.html.includes(escS(o.rationale))) { whole = false; ok('quiz ' + mod.unit_id + ': option ' + id + o.key, false, (o.text || '').slice(0, 40)); }
          }
        }
        if (whole) console.log('PASS quiz ' + mod.unit_id + ': ' + quiz.item_ids.length + '/' + quiz.item_ids.length + ' stems+options+rationales');
      } else {
        ok('quiz ' + mod.unit_id + ': pending, not filler', /not yet built/i.test(r.html) && r.bannerClass === 'real-banner');
      }
      ok('quiz ' + mod.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));
    }
  }

  // ---- unbuilt chapters render honest pending ----
  for (const s of order.filter((x) => !secIds.includes(x))) {
    r = go(PFX + 'chapter/' + s);
    ok('chapter ' + s + ': not yet built', /Not yet built/.test(r.html) && r.bannerClass === 'real-banner', s);
    learnerRoutes.push(PFX + 'chapter/' + s);
  }

  // ---- practice: every accepted form, grouped by chapter ----
  r = go(PFX + 'practice');
  learnerRoutes.push(PFX + 'practice');
  for (const f of X.forms) {
    ok('practice chooser: form ' + f.form_id, r.html.includes(PFX + 'practice/' + f.form_id));
    learnerRoutes.push(PFX + 'practice/' + f.form_id);
  }
  ok('practice chooser: no official pass claim', !/passing score|pass mark|must score|required to pass/i.test(r.html));
  for (const f of X.forms) {
    r = go(PFX + 'practice/' + f.form_id);
    ok('practice ' + f.form_id + ': ' + f.item_ids.length + ' items', (r.html.match(/data-ritem/g) || []).length === f.item_ids.length);
    ok('practice ' + f.form_id + ': practice label, no pass claim', /ractice only/.test(r.html) && /No pass or fail is claimed/.test(r.html));
    ok('practice ' + f.form_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- results round-trip ----
  sandbox.__save({ attemptId: 'harness-1', formId: 'form:form-a', title: 'Rules of the Road Practice Set A', takenAt: '2026-10-27T00:00:00Z', correctCount: 1, answers: [{ itemId: 'q01', picked: 'C', correct: true, stem: 'S1', why: 'W1', key: 'C', options: [{ key: 'A', text: 'tA', rationale: 'rA' }] }, { itemId: 'q02', picked: 'A', correct: false, stem: 'S2', why: 'W2', key: 'B', options: [{ key: 'A', text: 'tA', rationale: 'rA' }, { key: 'B', text: 'tB', rationale: 'rB' }] }] });
  r = go(PFX + 'results/harness-1');
  ok('results: renders stored attempt with rationales', /1 of 2/.test(r.html) && /W2/.test(r.html) && /tB/.test(r.html) && /rB/.test(r.html));

  // ---- settings + synthetic isolation ----
  r = go(PFX + 'settings');
  learnerRoutes.push(PFX + 'settings');
  ok('settings: links synthetic sample', /#\/synthetic-sample/.test(r.html));
  if (STORE) ok('settings: STORE strips the trace link and the free-for-all claim', !/href="trace\.html"/.test(r.html) && !/Everything is free, with no account/.test(r.html));
  else ok('settings: trace link', /href="trace\.html"/.test(r.html));
  ok('settings: no Nowhere', !/Nowhere/.test(r.html));
  r = go('#/synthetic-sample');
  ok('synthetic-sample: SYNTHETIC banner kept', r.bannerClass === 'sample-banner' && /SYNTHETIC/.test(r.bannerText));
  ok('synthetic-sample: Nowhere lives only here', /Nowhere/.test(r.html));

  // ---- reviewer routes intact ----
  for (const rt of [PFX + 'dossier', PFX + 'modules', PFX + 'real-cards', PFX + 'real-quiz', PFX + 'real-lesson']) {
    r = go(rt);
    ok('reviewer ' + rt + ': REAL banner + content', r.bannerClass === 'real-banner' && r.html.length > 2000, 'len=' + r.html.length);
  }

  // ---- flashcard recall beat + minted narration (spoken recall removed 2026-10-28) ----
  const vMod = X.sections[secIds[0]].modules[0];
  const vDeck = X.findDeck(vMod.unit_id, vMod.module_id);
  const vLesson = X.findUnit(vMod.unit_id);
  if (vDeck.length) {
    r = go(PFX + 'cards/' + vMod.unit_id);
    ok('cards: manual recall beat per card', (r.html.match(/data-recall/g) || []).length === vDeck.length);
    ok('cards: play button per card', (r.html.match(/data-card-audio/g) || []).length === vDeck.length,
      'found=' + ((r.html.match(/data-card-audio/g) || []).length));
    ok('cards: no spoken-recall markup on cards route', !/data-sayit|data-voice-result|Say it/.test(r.html));
    ok('audio: narration label on cards', countTag(r.html) === 1, 'found=' + countTag(r.html));
    ok('audio: no device-voice remnants on cards', !/data-listen/.test(r.html) && !/device voice/.test(r.html) && !/speechSynthesis/.test(r.html));
  } else {
    ok('cards: cards route has deck to test', false, vMod.unit_id);
  }
  if (vLesson) {
    r = go(PFX + 'lesson/' + vMod.unit_id);
    ok('audio: play button per teacher-says slide', (r.html.match(/data-slide-audio/g) || []).length === vLesson.slides.length,
      'found=' + ((r.html.match(/data-slide-audio/g) || []).length) + ' want=' + vLesson.slides.length);
    ok('audio: narration label once on lesson', countTag(r.html) === 1, 'found=' + countTag(r.html));
    ok('audio: teacher-says count unchanged', (r.html.match(/Teacher says/g) || []).length === vLesson.slides.length);
    ok('audio: no device-voice remnants on lesson', !/data-listen/.test(r.html) && !/device voice/.test(r.html) && !/speechSynthesis/.test(r.html));
  } else {
    ok('audio: lesson route has unit to test', false, vMod.unit_id);
  }
  // ---- spoken recall is gone from the app (founder 2026-10-28) ----
  const voiceHits = ['Say it', 'transcribe', 'MediaRecorder', 'Voice Transcribe'].filter((s) => html.includes(s));
  ok('no spoken-recall strings in app-preview/index.html (Say it, transcribe, MediaRecorder, Voice Transcribe)', voiceHits.length === 0, voiceHits.join(','));

  // ---- no device-voice string left in app-preview/ ----
  const walkFiles = (dir) => {
    const out = [];
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      if (fs.statSync(p).isDirectory()) out.push(...walkFiles(p));
      else out.push(p);
    }
    return out;
  };
  const TEXT_EXTS = new Set(['.html', '.js', '.css', '.json', '.md', '.jsonl', '.log', '.svg', '.txt']);
  const synthHits = [], listenHits = [];
  for (const f of walkFiles(path.join(ROOT, 'app-preview'))) {
    if (!TEXT_EXTS.has(path.extname(f).toLowerCase())) continue;
    const s = fs.readFileSync(f, 'utf8');
    if (s.includes('speechSynthesis')) synthHits.push(path.relative(ROOT, f));
    if (s.includes('data-listen')) listenHits.push(path.relative(ROOT, f));
  }
  ok('audio: no speechSynthesis string in app-preview/', synthHits.length === 0, synthHits.join(','));
  ok('audio: no data-listen hook in app-preview/', listenHits.length === 0, listenHits.join(','));

  // ---- global Nowhere sweep on learner routes ----
  // Case-sensitive, like every per-route check above: the synthetic marker
  // is the proper noun "Nowhere" (the fictional island). Lowercase "nowhere"
  // is ordinary English inside accepted sec08/sec14 exam options and must render.
  const leaked = [];
  for (const rt of learnerRoutes) { const x = go(rt); if (/Nowhere/.test(x.html) || /SYNTHETIC SAMPLE/.test(x.html)) leaked.push(rt); }
  ok('no Nowhere/SYNTHETIC on any learner route (' + learnerRoutes.length + ' routes)', leaked.length === 0, leaked.join(','));

  // ---- shell: every in-course link is state-prefixed; Utah progress key kept ----
  const LEGACY_HREF = /href="#\/(chapters|chapter\/|module\/|lesson\/|cards\/|quiz\/|practice|results\/|settings|dossier|modules|real-)/;
  const unprefixed = [];
  for (const rt of [...learnerRoutes, PFX + 'dossier', PFX + 'modules', PFX + 'real-cards', PFX + 'real-quiz', PFX + 'real-lesson', PFX + 'results/harness-1']) {
    const x = go(rt);
    if (LEGACY_HREF.test(x.html)) unprefixed.push(rt + ' ' + (x.html.match(LEGACY_HREF) || [''])[0]);
  }
  ok('shell: no unprefixed in-course links on any route', unprefixed.length === 0, unprefixed.slice(0, 5).join(' | '));
  ok('shell: Utah progress key unchanged (nova-preview:v1:ut-handbook)', Object.keys(memStore).length > 0 && Object.keys(memStore).every((k) => k === 'nova-preview:v1:ut-handbook'), Object.keys(memStore).join(','));

  // ---- STORE gate + quarantine (store/public/app only) ----
  if (STORE) {
    ok('STORE: gate.js defined window.NovaGate', !!MAIN.gate);
    ok('STORE: index.html carries the STORE PATCH + gate.js tag', /STORE PATCH/.test(html) && html.includes('<script src="gate.js"></script>'));
    // (a) listed ids never render in the entitled run: no back text, no clip
    const origCards = {};
    for (const [rel, doc] of Object.entries(REAL.files)) {
      if (!rel.startsWith('04_cards/')) continue;
      for (const d of (doc.decks || [])) for (const c of (d.cards || [])) origCards[c.card_id] = c;
    }
    const leakedQ = [];
    for (const id of Q_UT) {
      const c = origCards[id];
      if (!c) { leakedQ.push(id + '(not a Utah card)'); continue; }
      const x = go(PFX + 'cards/' + c.unit_id);
      if (x.html.includes(escS(c.back)) || x.html.includes('/' + id + '.q.mp3') || x.html.includes('/' + id + '.a.mp3')) leakedQ.push(id);
    }
    ok('STORE quarantine: no listed Utah card id renders on its deck (' + Q_UT.size + ' ids)', leakedQ.length === 0, leakedQ.join(','));
    if (Q_UT.size) {
      const c = origCards[[...Q_UT][0]];
      const x = go(PFX + 'cards/' + (c ? c.unit_id : ''));
      ok('STORE quarantine: deck shows "held back for a wording fix"', /data-gate-heldback="\d+"/.test(x.html) && /held back for a wording fix/.test(x.html));
    }

    // (b) signed out: chapter 1 free, chapter 2 gated, chapter 2 files never fetched;
    //     plus one injected quarantine id on a chapter-1 deck.
    const chs = [...UT.chapters].sort((a, b) => a.n - b.n);
    const ch1 = chs[0].id, ch2 = chs[1].id;
    const m1 = X.sections[ch1].modules[0], m2 = X.sections[ch2].modules[0];
    const deck1 = X.findDeck(m1.unit_id, m1.module_id);
    const pick = deck1[0];
    const qOverride = JSON.parse(JSON.stringify(QIDX));
    qOverride.states = qOverride.states || {};
    qOverride.states.UT = qOverride.states.UT || { cards: [] };
    qOverride.states.UT.cards = [...(qOverride.states.UT.cards || []), { id: pick.card_id, deck: m1.module_id, class: 'harness_injected' }];
    fetchLog.length = 0;
    const OUT = makeSandbox(() => ({ signedIn: false, entitlements: {} }), { 'quarantine-index.json': qOverride });
    const S = OUT.sandbox;
    for (let i = 0; i < 200 && !S.__states(); i++) await tick();
    await S.__ensure('ut');
    const g = S.__go;
    const files = REAL.manifest.files;
    const ch2plus = files.filter((e) => e.section_id !== ch1).map((e) => e.file);
    const ch1files = files.filter((e) => e.section_id === ch1).map((e) => e.file);
    ok('gate: signed out, no chapter 2+ Utah file is fetched', !fetchLog.some((u) => ch2plus.includes(u)), fetchLog.filter((u) => ch2plus.includes(u)).slice(0, 3).join(','));
    ok('gate: signed out, every chapter 1 Utah file is fetched', ch1files.every((f) => fetchLog.includes(f)));
    let r1 = g(PFX + 'chapter/' + ch1);
    ok('gate: signed out, chapter 1 is free (modules, no buy panel)', !/data-gate-buy/.test(r1.html) && X.sections[ch1].modules.every((x) => r1.html.includes(escS(x.title))));
    const u1 = X.findUnit(m1.unit_id);
    r1 = g(PFX + 'lesson/' + m1.unit_id);
    ok('gate: signed out, chapter 1 lesson renders with narration', !/data-gate-buy/.test(r1.html) && u1.slides.every((sl) => r1.html.includes(escS(sl.title.text))) && (r1.html.match(/data-slide-audio/g) || []).length === u1.slides.length);
    r1 = g(PFX + 'quiz/' + m1.unit_id);
    ok('gate: signed out, chapter 1 quiz renders', !/data-gate-buy/.test(r1.html) && /data-ritem/.test(r1.html));
    r1 = g(PFX + 'cards/' + m1.unit_id);
    ok('gate: signed out, chapter 1 flashcards render (minus held-back)', !/data-gate-buy/.test(r1.html) && (r1.html.match(/data-recall/g) || []).length === deck1.length - 1);
    ok('gate: injected quarantine id does not render', !r1.html.includes(escS(pick.back)) && !r1.html.includes('/' + pick.card_id + '.q.mp3'), pick.card_id);
    ok('gate: deck says "1 card held back for a wording fix"', r1.html.includes('1 card held back for a wording fix'));
    for (const [label, hash] of [['chapter', 'chapter/' + ch2], ['module hub', 'module/' + m2.module_id], ['lesson', 'lesson/' + m2.unit_id], ['flashcards', 'cards/' + m2.unit_id], ['quiz', 'quiz/' + m2.unit_id]]) {
      const x = g(PFX + hash);
      ok('gate: signed out, chapter 2 ' + label + ' renders the buy panel', /data-gate-buy="UT"/.test(x.html) && x.html.includes('$9.99') && x.html.includes('Narration audio: Utah only for now') && x.html.includes('/sign-in?redirect_url=') && !x.html.includes('data-recall') && !x.html.includes('Teacher says'), x.html.slice(0, 160));
    }
    const f2 = X.forms.find((f) => f.section_id === ch2);
    if (f2) ok('gate: signed out, chapter 2 practice form renders the buy panel', /data-gate-buy="UT"/.test(g(PFX + 'practice/' + f2.form_id).html));
    const home = g(PFX);
    ok('gate: signed out home marks chapter 1 free, chapter 2 locked', home.html.includes('data-gate-free="' + ch1 + '"') && home.html.includes('data-gate-locked="' + ch2 + '"'));
    // Texas: same rule through its own registry entry
    const TX = STATES.find((s) => s.code === 'TX');
    if (TX) {
      await S.__ensure('tx');
      const t = [...TX.chapters].sort((a, b) => a.n - b.n);
      const a = g('#/tx/chapter/' + t[0].id), b = g('#/tx/chapter/' + t[1].id);
      ok('gate: Texas chapter 1 free, chapter 2 gated', !/data-gate-buy/.test(a.html) && /Open module hub/.test(a.html) && /data-gate-buy="TX"/.test(b.html));
    }
  }

  console.log(fails.length ? ('\nRESULT: ' + fails.length + ' FAILURES: ' + fails.join(' | ')) : '\nRESULT: ALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS-ERROR', e); process.exit(2); });
