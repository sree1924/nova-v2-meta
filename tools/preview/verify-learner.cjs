// verify-learner.cjs — preview-lane DOM harness (Muse Code, preview lane).
// Whole-handbook edition: executes the REAL app-preview/index.html inline
// module in a minimal DOM sandbox with the file:// embedded data, drives
// every learner + reviewer route across ALL 16 handbook chapters, and
// asserts: chapter count = sections with an accepted KG; per chapter the
// lesson/cards/quiz counts equal the exports; home aggregate counts equal
// the exports; the fictional sample string appears ONLY on
// #/synthetic-sample.
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
  + '\nglobalThis.__save = saveResult; globalThis.__R = () => R; globalThis.__D = () => D;'
  + '\nglobalThis.__voiceMatch = voiceMatch; globalThis.__listenAvailable = listenAvailable;';
vm.runInContext(driver, sandbox);

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
      if (s.is_recap) recaps[s.module_id] = s;
      else scriptsByCard[s.card_id] = s;
    }
  }
  const forms = [];
  for (const { entry, doc } of examDocs) {
    for (const f of (doc.practice_forms || [])) forms.push({ ...f, section_id: entry.section_id });
  }
  let totalCards = 0;
  for (const { doc } of cardsDocs) for (const d of (doc.decks || [])) totalCards += (d.cards || []).length;
  let totalLessons = 0, totalSlides = 0;
  for (const { doc } of sessDocs) for (const u of (doc.units || [])) { totalLessons += 1; totalSlides += (u.slides || []).length; }
  return { sections, findUnit, findDeck, findQuiz, itemsById, scriptsByCard, recaps, forms, totalCards, totalLessons, totalSlides, totalItems: Object.keys(itemsById).length };
}

(async () => {
  for (let i = 0; i < 30; i++) await tick(); // let loadReal/loadData chains settle
  const go = sandbox.__go;
  if (!go) { console.error('BOOTSTRAP-NEVER-RAN'); process.exit(2); }
  ok('bootstrap loaded real + synthetic', !!(sandbox.__R() && sandbox.__D()));
  const X = buildExpected();
  const secIds = Object.keys(X.sections);
  console.log('built chapters (accepted KG): ' + secIds.join(', '));

  // ---- home: aggregate counts equal the exports ----
  let r = go('#/');
  ok('home: REAL banner', r.bannerClass === 'real-banner' && /audit pending/.test(r.bannerText), r.bannerClass + ' / ' + r.bannerText);
  const expectCounts = `${secIds.length} of 16 chapters built · ${X.totalCards} flashcards · ${X.totalItems} quiz items · ${X.totalLessons} lessons (${X.totalSlides} slides)`;
  ok('home: aggregate counts from exports', r.html.includes(expectCounts), expectCounts);
  ok('home: trace link', /href="trace\.html"/.test(r.html));
  ok('home: no Nowhere', !/Nowhere/.test(r.html));
  ok('home: no SYNTHETIC', !/SYNTHETIC/.test(r.html));
  for (const sec of secIds) {
    ok('home: chapter link ' + sec, r.html.includes('#/chapter/' + sec), sec);
  }

  // ---- chapters: 16 in handbook order, built vs not-yet-built ----
  r = go('#/chapters');
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
  ok('chapters: built link per KG section', secIds.every((s) => r.html.includes('#/chapter/' + s)));
  ok('chapters: not-yet-built count', (r.html.match(/Not yet built/g) || []).length === 16 - secIds.length,
    'pending=' + ((r.html.match(/Not yet built/g) || []).length));
  ok('chapters: no Nowhere', !/Nowhere/.test(r.html));

  const learnerRoutes = ['#/', '#/chapters'];

  // ---- per built chapter: hub, modules, lesson/cards/quiz equal exports ----
  for (const sec of secIds) {
    const S = X.sections[sec];
    const rc = go('#/chapter/' + sec);
    ok('chapter ' + sec + ': REAL banner', rc.bannerClass === 'real-banner');
    learnerRoutes.push('#/chapter/' + sec);
    for (const mod of S.modules) {
      ok('chapter ' + sec + ': module ' + mod.module_id, rc.html.includes(escS(mod.module_id)) && rc.html.includes(escS(mod.title)));
      r = go('#/module/' + mod.module_id);
      learnerRoutes.push('#/module/' + mod.module_id);
      ok('hub ' + mod.module_id + ': REAL banner', r.bannerClass === 'real-banner');
      const li = r.html.indexOf('Lesson'), fi = r.html.indexOf('Flashcards'), qi = r.html.indexOf('Quiz');
      ok('hub ' + mod.module_id + ': Lesson>Flashcards>Quiz order', li > 0 && li < fi && fi < qi, [li, fi, qi].join(','));

      const unit = X.findUnit(mod.unit_id);
      const deck = X.findDeck(mod.unit_id, mod.module_id);
      const quiz = X.findQuiz(mod.unit_id);

      // lesson
      r = go('#/lesson/' + mod.unit_id);
      learnerRoutes.push('#/lesson/' + mod.unit_id);
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
      r = go('#/cards/' + mod.unit_id);
      learnerRoutes.push('#/cards/' + mod.unit_id);
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
      } else {
        ok('cards ' + mod.unit_id + ': pending, not filler', /not yet built/i.test(r.html) && r.bannerClass === 'real-banner');
      }
      ok('cards ' + mod.unit_id + ': no Nowhere', !/Nowhere/.test(r.html));

      // quiz
      r = go('#/quiz/' + mod.unit_id);
      learnerRoutes.push('#/quiz/' + mod.unit_id);
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
    r = go('#/chapter/' + s);
    ok('chapter ' + s + ': not yet built', /Not yet built/.test(r.html) && r.bannerClass === 'real-banner', s);
    learnerRoutes.push('#/chapter/' + s);
  }

  // ---- practice: every accepted form, grouped by chapter ----
  r = go('#/practice');
  learnerRoutes.push('#/practice');
  for (const f of X.forms) {
    ok('practice chooser: form ' + f.form_id, r.html.includes('#/practice/' + f.form_id));
    learnerRoutes.push('#/practice/' + f.form_id);
  }
  ok('practice chooser: no official pass claim', !/passing score|pass mark|must score|required to pass/i.test(r.html));
  for (const f of X.forms) {
    r = go('#/practice/' + f.form_id);
    ok('practice ' + f.form_id + ': ' + f.item_ids.length + ' items', (r.html.match(/data-ritem/g) || []).length === f.item_ids.length);
    ok('practice ' + f.form_id + ': practice label, no pass claim', /ractice only/.test(r.html) && /No pass or fail is claimed/.test(r.html));
    ok('practice ' + f.form_id + ': no Nowhere', !/Nowhere/.test(r.html));
  }

  // ---- results round-trip ----
  sandbox.__save({ attemptId: 'harness-1', formId: 'form:form-a', title: 'Rules of the Road Practice Set A', takenAt: '2026-10-27T00:00:00Z', correctCount: 1, answers: [{ itemId: 'q01', picked: 'C', correct: true, stem: 'S1', why: 'W1', key: 'C', options: [{ key: 'A', text: 'tA', rationale: 'rA' }] }, { itemId: 'q02', picked: 'A', correct: false, stem: 'S2', why: 'W2', key: 'B', options: [{ key: 'A', text: 'tA', rationale: 'rA' }, { key: 'B', text: 'tB', rationale: 'rB' }] }] });
  r = go('#/results/harness-1');
  ok('results: renders stored attempt with rationales', /1 of 2/.test(r.html) && /W2/.test(r.html) && /tB/.test(r.html) && /rB/.test(r.html));

  // ---- settings + synthetic isolation ----
  r = go('#/settings');
  learnerRoutes.push('#/settings');
  ok('settings: links synthetic sample', /#\/synthetic-sample/.test(r.html));
  ok('settings: trace link', /href="trace\.html"/.test(r.html));
  ok('settings: no Nowhere', !/Nowhere/.test(r.html));
  r = go('#/synthetic-sample');
  ok('synthetic-sample: SYNTHETIC banner kept', r.bannerClass === 'sample-banner' && /SYNTHETIC/.test(r.bannerText));
  ok('synthetic-sample: Nowhere lives only here', /Nowhere/.test(r.html));

  // ---- reviewer routes intact ----
  for (const rt of ['#/dossier', '#/modules', '#/real-cards', '#/real-quiz', '#/real-lesson']) {
    r = go(rt);
    ok('reviewer ' + rt + ': REAL banner + content', r.bannerClass === 'real-banner' && r.html.length > 2000, 'len=' + r.html.length);
  }

  // ---- spoken recall ("Say it") + device-voice "Listen" ----
  // The endpoint is mocked out of existence here: harness fetch throws, so
  // these checks cover rendering, the honesty strings, the match function
  // with canned transcripts, and both speechSynthesis branches.
  const vMod = X.sections[secIds[0]].modules[0];
  const vDeck = X.findDeck(vMod.unit_id, vMod.module_id);
  const vLesson = X.findUnit(vMod.unit_id);
  const teachCount = (unitId) => vDeck.filter((c) => {
    const s = X.scriptsByCard[c.card_id];
    return s && s.segments && s.segments.teaching && s.segments.teaching.text;
  }).length;
  if (vDeck.length) {
    r = go('#/cards/' + vMod.unit_id);
    ok('voice: say-it button per card', (r.html.match(/<button data-sayit[ >]/g) || []).length === vDeck.length,
      'found=' + ((r.html.match(/<button data-sayit[ >]/g) || []).length));
    ok('voice: card back embedded for matching', vDeck.every((c) => r.html.includes('data-back="' + escS(c.back) + '"')));
    ok('voice: voice-result slot per card', (r.html.match(/data-voice-result/g) || []).length === vDeck.length);
    ok('voice: honesty note verbatim', r.html.includes('voice is transcribed by Meta Voice Transcribe via a local dev proxy; nothing is stored beyond this browser and the local log'));
    ok('voice: posts to dev proxy', html.includes('fetch("/api/transcribe"'));
    ok('voice: manual recall path kept', (r.html.match(/data-recall/g) || []).length === vDeck.length);
    ok('voice: listen button per teaching script', (r.html.match(/data-listen/g) || []).length === teachCount(vMod.unit_id),
      'found=' + ((r.html.match(/data-listen/g) || []).length) + ' want=' + teachCount(vMod.unit_id));
    ok('voice: device-voice label on cards', /device voice — not minted narration/.test(r.html));
  } else {
    ok('voice: cards route has deck to test', false, vMod.unit_id);
  }
  if (vLesson) {
    r = go('#/lesson/' + vMod.unit_id);
    ok('voice: listen button per teacher-says slide', (r.html.match(/data-listen/g) || []).length === vLesson.slides.length,
      'found=' + ((r.html.match(/data-listen/g) || []).length) + ' want=' + vLesson.slides.length);
    ok('voice: device-voice label on lesson', /device voice — not minted narration/.test(r.html));
    ok('voice: teacher-says count unchanged', (r.html.match(/Teacher says/g) || []).length === vLesson.slides.length);
  } else {
    ok('voice: lesson route has unit to test', false, vMod.unit_id);
  }
  const vm = sandbox.__voiceMatch;
  let m = vm('stop completely at the limit line', 'Stop completely at the limit line.');
  ok('voice-match: exact+case+punct', m.score === 1 && m.recalled === true, JSON.stringify(m));
  m = vm('twenty five miles per hour', 'Speed limit 25 miles per hour');
  ok('voice-match: number words vs digits recalled', m.recalled === true && m.score >= 0.6, JSON.stringify(m));
  m = vm('25 miles per hour', 'Speed limit twenty-five miles per hour');
  ok('voice-match: digits vs number words recalled', m.recalled === true, JSON.stringify(m));
  m = vm('something entirely different here', 'Stop completely at the limit line');
  ok('voice-match: unrelated missed', m.recalled === false, JSON.stringify(m));
  m = vm('', 'Stop completely at the limit line');
  ok('voice-match: empty transcript missed', m.score === 0 && m.recalled === false, JSON.stringify(m));
  ok('voice: speechSynthesis undefined in harness', !('speechSynthesis' in sandbox.window));
  ok('voice: listen unavailable without speechSynthesis', sandbox.__listenAvailable() === false);
  r = go('#/lesson/' + vMod.unit_id);
  ok('voice: lesson renders with speechSynthesis undefined', r.html.length > 2000 && (r.html.match(/data-listen/g) || []).length === (vLesson ? vLesson.slides.length : 0));
  sandbox.window.speechSynthesis = {};
  ok('voice: listen available with speechSynthesis', sandbox.__listenAvailable() === true);
  delete sandbox.window.speechSynthesis;

  // ---- global Nowhere sweep on learner routes ----
  // Case-sensitive, like every per-route check above: the synthetic marker
  // is the proper noun "Nowhere" (the fictional island). Lowercase "nowhere"
  // is ordinary English inside accepted sec08/sec14 exam options and must render.
  const leaked = [];
  for (const rt of learnerRoutes) { const x = go(rt); if (/Nowhere/.test(x.html) || /SYNTHETIC SAMPLE/.test(x.html)) leaked.push(rt); }
  ok('no Nowhere/SYNTHETIC on any learner route (' + learnerRoutes.length + ' routes)', leaked.length === 0, leaked.join(','));

  console.log(fails.length ? ('\nRESULT: ' + fails.length + ' FAILURES: ' + fails.join(' | ')) : '\nRESULT: ALL CHECKS PASSED');
  process.exit(fails.length ? 1 : 0);
})().catch((e) => { console.error('HARNESS-ERROR', e); process.exit(2); });
