// verify-learner.cjs — preview-lane DOM harness (Muse Code, preview lane).
// Executes the REAL app-preview/index.html inline module in a minimal DOM
// sandbox with the file:// embedded data (window.__REAL_EMBEDDED /
// window.__PREVIEW_EMBEDDED), drives every learner + reviewer route, and
// asserts counts, real titles, byte-exact accepted wording, and that the
// fictional sample string appears ONLY on #/synthetic-sample.
//
// Usage: node tools/preview/verify-learner.cjs
// Exit 0 = all checks pass. No network, no model calls, read-only.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const fails = [];
const ok = (name, cond, extra) => {
  if (cond) { console.log('PASS ' + name); }
  else { fails.push(name); console.log('FAIL ' + name + (extra ? ' :: ' + extra : '')); }
};

// ---- load embedded data the way file:// does ----
const win = {};
win.window = win;
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'app-preview', 'data-real-embedded.js'), 'utf8'), { window: win });
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'app-preview', 'data-embedded.js'), 'utf8'), { window: win });
const REAL = win.__REAL_EMBEDDED;
const SYN = win.__PREVIEW_EMBEDDED;
ok('embedded real manifest present', !!(REAL && REAL.manifest && REAL.manifest.files));
ok('embedded synthetic present', !!(SYN && SYN.manifest));

// ---- sandbox ----
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
const sandbox = {
  window: {
    __REAL_EMBEDDED: REAL, __PREVIEW_EMBEDDED: SYN,
    matchMedia: () => ({ matches: false }),
    scrollTo: () => {}, addEventListener: () => {},
  },
  document: {
    getElementById: (id) => (id === 'banner' ? bannerEl : id === 'view' ? viewEl : null),
    querySelectorAll: () => [],
    querySelector: () => null,
  },
  location: { hash: '#/' },
  localStorage: {
    getItem: (k) => (k in memStore ? memStore[k] : null),
    setItem: (k, v) => { memStore[k] = String(v); },
    removeItem: (k) => { delete memStore[k]; },
  },
  fetch: async () => { throw new Error('no-http-in-harness'); },
  console,
  setTimeout, clearTimeout, setInterval, clearInterval,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);

const html = fs.readFileSync(path.join(ROOT, 'app-preview', 'index.html'), 'utf8');
const m = html.match(/<script type="module">([\s\S]*)<\/script>/);
if (!m) { console.error('NO-MODULE-SCRIPT'); process.exit(2); }
const driver = m[1] + '\n;globalThis.__go = (hash) => { location.hash = hash; route(); return { html: view.innerHTML, bannerClass: document.getElementById("banner").className, bannerText: document.getElementById("banner").textContent }; };'
  + '\nglobalThis.__save = saveResult; globalThis.__R = () => R; globalThis.__D = () => D;';
vm.runInContext(driver, sandbox);

const tick = () => new Promise((r) => setImmediate(r));
(async () => {
  for (let i = 0; i < 30; i++) await tick(); // let loadReal/loadData chains settle
  const go = sandbox.__go;
  if (!go) { console.error('BOOTSTRAP-NEVER-RAN'); process.exit(2); }
  ok('bootstrap loaded real + synthetic', !!(sandbox.__R() && sandbox.__D()));

  const files = REAL.files;
  const rel = (stage) => Object.keys(files).find((k) => k.startsWith(stage + '/'));
  const kg = files[rel('03_combined_kg')];
  const cardsDoc = files[rel('04_cards')];
  const sessDoc = files[rel('05_sessions')];
  const examDoc = files[rel('06_exam_bank')];
  const scriptsDoc = files[rel('05_card_scripts')];
  const escS = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // ---- home ----
  let r = go('#/');
  ok('home: REAL banner', r.bannerClass === 'real-banner' && /audit pending/.test(r.bannerText), r.bannerClass + ' / ' + r.bannerText);
  const modTitles = kg.modules.map((x) => x.title);
  for (const t of modTitles) ok('home: module title "' + t.slice(0, 30) + '"', r.html.includes(escS(t)));
  ok('home: no Nowhere', !/Nowhere/.test(r.html));
  ok('home: no SYNTHETIC', !/SYNTHETIC/.test(r.html));
  ok('home: course heading', /Section 9.*Rules of the Road/.test(r.html));

  // ---- module hubs ----
  const unitByModule = {};
  kg.curriculum_unit_hints.forEach((h) => { unitByModule[h.module_id] = h.unit_id; });
  for (const mod of kg.modules) {
    const u = unitByModule[mod.module_id];
    r = go('#/module/' + mod.module_id);
    ok('hub ' + mod.module_id + ': REAL banner', r.bannerClass === 'real-banner');
    const li = r.html.indexOf('Lesson'), fi = r.html.indexOf('Flashcards'), qi = r.html.indexOf('Quiz');
    ok('hub ' + mod.module_id + ': Lesson>Flashcards>Quiz order', li > 0 && li < fi && fi < qi, [li, fi, qi].join(','));
    ok('hub ' + mod.module_id + ': links lesson/cards/quiz', r.html.includes('#/lesson/' + u) && r.html.includes('#/cards/' + u) && r.html.includes('#/quiz/' + u));
    ok('hub ' + mod.module_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- lessons ----
  const unitSlides = {};
  for (const u of sessDoc.units) {
    unitSlides[u.unit_id] = u;
    r = go('#/lesson/' + u.unit_id);
    ok('lesson ' + u.unit_id + ': REAL banner', r.bannerClass === 'real-banner');
    for (const [i, sl] of u.slides.entries()) {
      ok('lesson ' + u.unit_id + ': slide ' + (i + 1) + ' title', r.html.includes(escS(sl.title.text)), (sl.title.text || '').slice(0, 40));
      ok('lesson ' + u.unit_id + ': slide ' + (i + 1) + ' narration', r.html.includes(escS(sl.narration.text)));
      ok('lesson ' + u.unit_id + ': slide ' + (i + 1) + ' seconds', r.html.includes(String(sl.estimated_narration_seconds) + 's'));
      for (const l of sl.lines) {
        if (!r.html.includes(escS(l.text))) ok('lesson ' + u.unit_id + ': slide ' + (i + 1) + ' line', false, l.text.slice(0, 50));
      }
    }
    ok('lesson ' + u.unit_id + ': slide count ' + u.slides.length, (r.html.match(/Teacher says/g) || []).length === u.slides.length, 'teacher-panels=' + (r.html.match(/Teacher says/g) || []).length);
    for (const w of u.why_how) ok('lesson ' + u.unit_id + ': why/how', r.html.includes(escS(w.text)));
    ok('lesson ' + u.unit_id + ': worked example', r.html.includes(escS(u.worked_example.scenario.text)) && r.html.includes(escS(u.worked_example.result.text)));
    ok('lesson ' + u.unit_id + ': misconception', r.html.includes(escS(u.misconception.claim.text)) && r.html.includes(escS(u.misconception.correction.text)));
    ok('lesson ' + u.unit_id + ': memory support', r.html.includes(escS(u.memory_support.text)));
    ok('lesson ' + u.unit_id + ': self-check', r.html.includes(escS(u.self_check.prompt.text)) && r.html.includes(escS(u.self_check.answer.text)) && r.html.includes(escS(u.self_check.rationale.text)));
    ok('lesson ' + u.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- flashcards ----
  const byCard = {};
  for (const s of scriptsDoc.audio_scripts) if (!s.is_recap) byCard[s.card_id] = s;
  const decksByUnit = {};
  for (const d of cardsDoc.decks) for (const c of d.cards) { (decksByUnit[c.unit_id] = decksByUnit[c.unit_id] || []).push(c); }
  for (const [unitId, list] of Object.entries(decksByUnit)) {
    r = go('#/cards/' + unitId);
    ok('cards ' + unitId + ': REAL banner', r.bannerClass === 'real-banner');
    ok('cards ' + unitId + ': count ' + list.length, (r.html.match(/data-recall/g) || []).length === list.length, 'recall-buttons=' + (r.html.match(/data-recall/g) || []).length);
    for (const c of list) {
      if (!r.html.includes(escS(c.front))) ok('cards ' + unitId + ': front ' + c.card_id, false);
      if (!r.html.includes(escS(c.back))) ok('cards ' + unitId + ': back ' + c.card_id, false);
      if (!r.html.includes(escS(c.memory_hook))) ok('cards ' + unitId + ': hook ' + c.card_id, false);
      const t = byCard[c.card_id] && byCard[c.card_id].segments.teaching.text;
      if (t && !r.html.includes(escS(t))) ok('cards ' + unitId + ': teaching ' + c.card_id, false);
    }
    console.log('PASS cards ' + unitId + ': ' + list.length + '/' + list.length + ' byte-exact fronts+backs+hooks' + (Object.keys(byCard).length ? '+teaching' : ''));
    ok('cards ' + unitId + ': recap hook', /Deck recap/.test(r.html));
    ok('cards ' + unitId + ': 3s beat markup', /data-beat/.test(r.html) && /3 second/.test(r.html));
    ok('cards ' + unitId + ': text-first footer note', /text-first pilot/i.test(r.html) && /no audio/i.test(r.html));
    ok('cards ' + unitId + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- module quizzes ----
  for (const q of examDoc.module_quizzes) {
    r = go('#/quiz/' + q.unit_id);
    ok('quiz ' + q.unit_id + ': REAL banner', r.bannerClass === 'real-banner');
    ok('quiz ' + q.unit_id + ': count ' + q.item_ids.length, (r.html.match(/data-ritem/g) || []).length === q.item_ids.length, 'items=' + (r.html.match(/data-ritem/g) || []).length);
    const byId = {};
    examDoc.items.forEach((it) => { byId[it.item_id] = it; });
    let whole = true;
    for (const id of q.item_ids) {
      const it = byId[id];
      const keys = ['A', 'B', 'C', 'D'];
      const hasOpts = keys.every((k) => it.options.some((o) => o.key === k));
      if (!hasOpts) { whole = false; ok('quiz ' + q.unit_id + ': A-D options ' + id, false); }
      if (!r.html.includes(escS(it.stem))) { whole = false; ok('quiz ' + q.unit_id + ': stem ' + id, false); }
      if (!r.html.includes(escS(it.correct_rationale))) { whole = false; ok('quiz ' + q.unit_id + ': rationale ' + id, false); }
      for (const o of it.options) {
        if (!r.html.includes(escS(o.text)) || !r.html.includes(escS(o.rationale))) { whole = false; ok('quiz ' + q.unit_id + ': option ' + id + o.key, false, (o.text || '').slice(0, 40)); }
      }
    }
    if (whole) console.log('PASS quiz ' + q.unit_id + ': ' + q.item_ids.length + '/' + q.item_ids.length + ' stems+options+rationales');
    ok('quiz ' + q.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- practice ----
  r = go('#/practice');
  ok('practice chooser: 2 forms', /form-a/.test(r.html) && /form-b/.test(r.html));
  ok('practice chooser: no official pass claim', !/passing score|pass mark|must score|required to pass/i.test(r.html));
  for (const f of examDoc.practice_forms) {
    r = go('#/practice/' + f.form_id);
    ok('practice ' + f.form_id + ': 19 items', (r.html.match(/data-ritem/g) || []).length === 19, 'items=' + (r.html.match(/data-ritem/g) || []).length);
    ok('practice ' + f.form_id + ': practice label, no pass claim', /ractice only/.test(r.html) && /No pass or fail is claimed/.test(r.html));
    ok('practice ' + f.form_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- results round-trip ----
  sandbox.__save({ attemptId: 'harness-1', formId: 'form:form-a', title: 'Rules of the Road Practice Set A', takenAt: '2026-10-27T00:00:00Z', correctCount: 1, answers: [{ itemId: 'q01', picked: 'C', correct: true, stem: 'S1', why: 'W1', key: 'C', options: [{ key: 'A', text: 'tA', rationale: 'rA' }] }, { itemId: 'q02', picked: 'A', correct: false, stem: 'S2', why: 'W2', key: 'B', options: [{ key: 'A', text: 'tA', rationale: 'rA' }, { key: 'B', text: 'tB', rationale: 'rB' }] }] });
  r = go('#/results/harness-1');
  ok('results: renders stored attempt with rationales', /1 of 2/.test(r.html) && /W2/.test(r.html) && /tB/.test(r.html) && /rB/.test(r.html));

  // ---- settings + synthetic isolation ----
  r = go('#/settings');
  ok('settings: links synthetic sample', /#\/synthetic-sample/.test(r.html));
  ok('settings: no Nowhere', !/Nowhere/.test(r.html));
  r = go('#/chapters');
  ok('modules list: 3 real modules', modTitles.every((t) => r.html.includes(escS(t))));
  r = go('#/synthetic-sample');
  ok('synthetic-sample: SYNTHETIC banner kept', r.bannerClass === 'sample-banner' && /SYNTHETIC/.test(r.bannerText));
  ok('synthetic-sample: Nowhere lives only here', /Nowhere/.test(r.html));

  // ---- reviewer routes intact ----
  for (const rt of ['#/dossier', '#/modules', '#/real-cards', '#/real-quiz', '#/real-lesson']) {
    r = go(rt);
    ok('reviewer ' + rt + ': REAL banner + content', r.bannerClass === 'real-banner' && r.html.length > 2000, 'len=' + r.html.length);
  }

  // ---- global Nowhere sweep on learner routes ----
  const learnerRoutes = ['#/', '#/chapters', '#/module/m01', '#/module/m02', '#/module/m03', '#/lesson/u01', '#/lesson/u02', '#/lesson/u03', '#/cards/u01', '#/cards/u02', '#/cards/u03', '#/quiz/u01', '#/quiz/u02', '#/quiz/u03', '#/practice', '#/practice/form-a', '#/practice/form-b', '#/settings'];
  const leaked = [];
  for (const rt of learnerRoutes) { const x = go(rt); if (/Nowhere/i.test(x.html) || /SYNTHETIC SAMPLE/.test(x.html)) leaked.push(rt); }
  ok('no Nowhere/SYNTHETIC on any learner route', leaked.length === 0, leaked.join(','));

  console.log(fails.length ? ('\nRESULT: ' + fails.length + ' FAILURES: ' + fails.join(' | ')) : '\nRESULT: ALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS-ERROR', e); process.exit(2); });
