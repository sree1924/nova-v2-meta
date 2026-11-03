import { patchHubHtml } from './hub-ui.mjs';

// Store-only presentation. The accepted course files and authoring preview stay unchanged.
export function patchCustomerHtml(html) {
  const once = (find, replacement) => {
    if (html.split(find).length !== 2) throw new Error('customer patch anchor changed: ' + find.slice(0, 85));
    html = html.replace(find, () => replacement);
  };
  const between = (start, end, replacement) => {
    const a = html.indexOf(start), b = html.indexOf(end, a);
    if (a < 0 || b < 0 || html.indexOf(start, a + 1) >= 0) throw new Error('customer function anchor changed: ' + start);
    html = html.slice(0, a) + replacement + '\n\n' + html.slice(b);
  };

  // Stylesheet, brand, unified header slots, and loading shell
  once('<link rel="stylesheet" href="styles.css">', '<link rel="icon" type="image/svg+xml" href="/icon.svg">\n<link rel="stylesheet" href="styles.css">\n<link rel="stylesheet" href="learner.css">');
  once(
    '<span class="brand" id="brand">Driver Handbook — Written-Test Prep</span>',
    '<a class="brand" id="brand" href="/">'
      + '<span class="brand-badge-pop" aria-hidden="true"><svg viewBox="0 0 36 36" fill="none">'
      + '<rect x="2" y="2" width="32" height="32" rx="9" fill="#FFD23F" stroke="#111326" stroke-width="2.6"></rect>'
      + '<path d="M10.5 26L15.4 10H20.6L25.5 26" stroke="#111326" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"></path>'
      + '<path d="M18 13.5V25" stroke="#111326" stroke-width="2.2" stroke-dasharray="2.4 2.8" stroke-linecap="round"></path>'
      + '</svg></span>'
      + '<span class="brand-wordmark">PassLearnersPermit<small id="brand-sub">50 STATES + D.C. · CH. 1 FREE</small></span>'
      + '</a>'
  );
  once(
    '    <nav class="main" aria-label="Learner">\n'
      + '      <a href="#/" data-nav="states">All states</a>\n'
      + '      <a href="#/ut/" data-nav="home">Home</a>\n'
      + '      <a href="#/ut/chapters" data-nav="chapters">Chapters</a>\n'
      + '      <a href="#/ut/practice" data-nav="practice">Practice tests</a>\n'
      + '      <a href="#/ut/settings" data-nav="settings">Settings</a>\n'
      + '    </nav>',
    '    <div class="header-right-cluster">\n'
      + '      <nav class="main" aria-label="Learner">\n'
      + '        <a href="/" data-nav="store" class="nav-store-link">← Store</a>\n'
      + '        <a href="#/" data-nav="states">All states</a>\n'
      + '        <a href="#/ut/" data-nav="home">Overview</a>\n'
      + '        <a href="#/ut/chapters" data-nav="chapters">Chapters</a>\n'
      + '        <a href="#/ut/practice" data-nav="practice">Practice tests</a>\n'
      + '        <a href="#/ut/settings" data-nav="settings">Settings</a>\n'
      + '      </nav>\n'
      + '      <div class="session-header-bar" id="session-header-bar" hidden></div>\n'
      + '      <div class="header-account-slot" id="header-account-slot"></div>\n'
      + '    </div>'
  );
  once('<main class="wrap" id="view" tabindex="-1"></main>', '<main class="wrap" id="view" tabindex="-1"><div class="card loading-shell" role="status"><p class="course-kicker">PASSLEARNERSPERMIT</p><h1>Getting your course ready…</h1><p class="muted">Loading official handbook lessons, flashcards, and your saved study progress.</p></div></main>');
  once('<footer class="site">dev preview — no production claims · narration: pre-generated files only (OpenAI TTS, not a Meta model)</footer>', '<footer class="site">PassLearnersPermit · Built from official state driver handbooks · Independent written-test prep (not affiliated with any state DMV or DOT) · <a href="/support">Support</a> · <a href="/refunds">Refunds</a></footer>');

  // Keep active navigation highlighted across study routes + register page-flip reading route
  once('const LEGACY_ROUTES = new Set(["chapters",', 'const LEGACY_ROUTES = new Set(["read", "chapters",');
  once('  else if (p0 === "chapter") html = vChapter(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "chapter") { html = vChapter(decodeURIComponent(sub[1] || "")); nav = "chapters"; }');
  once('  else if (p0 === "module") html = vModule(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "module") { html = vModule(decodeURIComponent(sub[1] || "")); nav = "chapters"; }');
  once('  else if (p0 === "lesson") html = vLesson(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "lesson") { html = vLesson(decodeURIComponent(sub[1] || "")); nav = "chapters"; }\n  else if (p0 === "read") { html = vRead(decodeURIComponent(sub[1] || "")); nav = "chapters"; }');
  once('  else if (p0 === "cards") html = vCards(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "cards") { html = vCards(decodeURIComponent(sub[1] || "")); nav = "chapters"; }');
  once('  else if (p0 === "quiz") html = vQuiz(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "quiz") { html = vQuiz(decodeURIComponent(sub[1] || "")); nav = "chapters"; }');
  once('  else if (p0 === "results") html = vResults(decodeURIComponent(sub[1] || ""));', '  else if (p0 === "results") { html = vResults(decodeURIComponent(sub[1] || "")); nav = "practice"; }');
  once('  else if (p0 === "dossier") { html = vDossier(); banner = "review"; bannerText = REVIEWER_EMPTY_NOTE; }', '  else if (p0 === "dossier") { html = vDossier(); nav = "settings"; banner = "review"; bannerText = REVIEWER_EMPTY_NOTE; }');

  // Header links, banners, and explicit completion hook
  html = html.replace(/href="#\/ut\/[^\"]*"/g, 'href="#/"');
  html = html.replaceAll('REAL — driver handbook courses, belt-validated, audit pending', 'Built from official driver handbooks. Machine-checked; independent review in progress.');
  once('  REAL_NOTE = `REAL — ${HB()}, belt-validated, audit pending`;', '  REAL_NOTE = `Built from the ${ST.name} Driver Handbook. Machine-checked; independent review in progress.`;');
  once('  setBanner(out.banner, out.bannerText);', '  setBanner(out.banner, window.NovaGate ? window.NovaGate.banner(navState, out.banner, out.bannerText) : out.bannerText);');
  once('  wire(sub);', '  wire(sub);\n  if (window.NovaGate) window.NovaGate.mount(navState, sub, view, GATE_VIEW);');
  once('  // sub = route parts after the state prefix (["lesson", unitId], …)\n  if (ST && sub && sub[0] === "lesson" && sub[1]) markDone(sub[1], "lesson");', '  // A lesson is complete only after the learner reaches its end.\n  // The store mount attaches the explicit completion control.');

  // Live multi-movement audio player feedback (lesson slides, flashcard 4-part arcs, deck recaps)
  between('function stopAudio() {', 'let D = null;', String.raw`let audioBeat = null;
let audioCard = null;
const canPlayAudio = (src) => audioAllowed(src) || (typeof src === "string" && src.startsWith("decks/audio/"));
function stopAudio() {
  audioGen += 1;
  if (audioTimer) { try { clearTimeout(audioTimer); } catch { /* no-op */ } audioTimer = 0; }
  if (audioEl) {
    try { audioEl.pause(); } catch { /* no-op */ }
    try { audioEl.removeAttribute("src"); audioEl.load(); } catch { /* no-op */ }
    audioEl.onended = audioEl.onerror = null;
    audioEl._src = null;
  }
  if (audioBeat) {
    audioBeat.hidden = true;
    audioBeat = null;
  }
  if (audioCard) {
    if (audioCard.querySelectorAll) {
      audioCard.querySelectorAll("[data-beat-pill]").forEach((p) => { p.classList.remove("is-active"); });
    }
    audioCard = null;
  }
  if (audioBtn) {
    if (audioBtn.classList) audioBtn.classList.remove("is-playing");
    const idleLabel = (audioBtn.getAttribute && audioBtn.getAttribute("data-idle-label"))
      || (audioBtn.hasAttribute("data-recap-audio") ? "▶ Play recap" : "▶ Play narration");
    audioBtn.textContent = idleLabel;
    audioBtn = null;
  }
}
function playOne(src, btn) {
  if (!canPlayAudio(src)) return false;
  const el = ensureAudioEl();
  if (!el) return false;
  const idleLabel = (btn.getAttribute && btn.getAttribute("data-idle-label"))
    || (btn.hasAttribute("data-recap-audio") ? "▶ Play recap" : "▶ Play narration");
  const pauseLabel = (btn.getAttribute && btn.getAttribute("data-pause-label"))
    || (btn.hasAttribute("data-recap-audio") ? "⏸ Pause recap" : "⏸ Pause narration");
  if (audioBtn === btn && el._src === src) {
    if (el.paused) {
      try { const p = el.play(); if (p && p.catch) p.catch(() => { stopAudio(); }); } catch { stopAudio(); return false; }
      if (btn.classList) btn.classList.add("is-playing");
      btn.textContent = pauseLabel;
    } else {
      try { el.pause(); } catch { /* no-op */ }
      if (btn.classList) btn.classList.remove("is-playing");
      btn.textContent = idleLabel;
    }
    return true;
  }
  stopAudio();
  const gen = audioGen;
  const el2 = ensureAudioEl();
  if (!el2) return false;
  audioBtn = btn;
  if (btn.classList) btn.classList.add("is-playing");
  el2._src = src;
  try { el2.src = src; } catch { stopAudio(); return false; }
  btn.textContent = pauseLabel;
  el2.onended = () => {
    if (audioGen === gen) {
      const wasRecap = btn && btn.hasAttribute && btn.hasAttribute("data-recap-audio");
      stopAudio();
      if (wasRecap && btn.dispatchEvent) {
        try { btn.dispatchEvent(new CustomEvent("nova:recap-ended", { bubbles: true })); } catch {}
      }
    }
  };
  el2.onerror = () => { if (audioGen === gen) stopAudio(); };
  try {
    const p = el2.play();
    if (p && p.catch) p.catch(() => { if (audioGen === gen) stopAudio(); });
  } catch { if (audioGen === gen) stopAudio(); return false; }
  return true;
}
function playCardArc(srcs, pauseMs, btn, card) {
  const el = ensureAudioEl();
  if (!el) return false;
  if (audioBtn === btn) { stopAudio(); return true; }
  stopAudio();
  const gen = audioGen;
  const el2 = ensureAudioEl();
  if (!el2) return false;
  audioBtn = btn;
  audioCard = card || null;
  if (btn.classList) btn.classList.add("is-playing");
  const ans = card ? card.querySelector("[data-answer]") : null;
  const beat = card ? card.querySelector("[data-beat]") : null;
  const recallBtn = card ? card.querySelector("[data-recall]") : null;
  const setBeatPill = (name) => {
    if (!card || !card.querySelectorAll) return;
    const order = ["q", "think", "a", "teach"];
    const idx = order.indexOf(name);
    card.querySelectorAll("[data-beat-pill]").forEach((p) => {
      const k = p.getAttribute("data-beat-pill");
      const ki = order.indexOf(k);
      p.classList.toggle("is-active", k === name);
      p.classList.toggle("is-done", name === "done" || (idx > ki && ki >= 0));
    });
  };
  const revealNow = () => {
    if (audioBeat) { audioBeat.hidden = true; audioBeat = null; }
    if (ans && ans.hidden) {
      ans.hidden = false;
      if (beat) beat.hidden = true;
      if (recallBtn) { recallBtn.disabled = true; recallBtn.textContent = "Answer shown"; }
    }
  };
  const showPauseBeat = () => {
    setBeatPill("think");
    btn.textContent = "⏹ Think of the answer…";
    if (beat && (!ans || ans.hidden)) {
      beat.textContent = "Take " + Math.max(1, Math.round(pauseMs / 1000)) + " seconds to recall the rule before the answer plays…";
      beat.hidden = false;
      audioBeat = beat;
    }
  };
  const seq = [
    { src: srcs.q, label: "⏹ Beat 1/4 · Question…", onStart: () => setBeatPill("q") },
    { src: srcs.think, label: "⏹ Beat 2/4 · Think cue…", onStart: () => setBeatPill("think") },
    { wait: pauseMs, onStart: showPauseBeat },
    { src: srcs.a, label: "⏹ Beat 3/4 · Official answer…", onStart: () => { setBeatPill("a"); revealNow(); } },
    { src: srcs.teach, label: "⏹ Beat 4/4 · Coach takeaway…", onStart: () => setBeatPill("teach") }
  ];
  let i = 0;
  const step = () => {
    if (audioGen !== gen) return;
    if (i >= seq.length) {
      setBeatPill("done");
      stopAudio();
      if (card && card.dispatchEvent) {
        try { card.dispatchEvent(new CustomEvent("nova:card-arc-ended", { bubbles: true })); } catch {}
      }
      return;
    }
    const s = seq[i++];
    if (s.onStart) s.onStart();
    if (s.label) btn.textContent = s.label;
    if (s.wait) {
      audioTimer = setTimeout(() => { audioTimer = 0; step(); }, s.wait);
      return;
    }
    if (!canPlayAudio(s.src)) { stopAudio(); return; }
    try {
      el2._src = s.src;
      el2.src = s.src;
      el2.onended = () => step();
      el2.onerror = () => { if (audioGen === gen) stopAudio(); };
      const p = el2.play();
      if (p && p.catch) p.catch(() => { if (audioGen === gen) stopAudio(); });
    } catch { if (audioGen === gen) stopAudio(); }
  };
  step();
  return true;
}`);

  // Empty & pending copy cleanup
  between('function realEmpty(what) {', '// A section exists in the KG', String.raw`function realEmpty(what) {
  return '<header class="course-hero"><p class="course-kicker">COURSE UPDATE</p><h1>' + esc(HB()) + '</h1></header><div class="card"><h2>This activity is not yet built</h2><p>This part of the course is still being prepared. Please choose another chapter.</p><a class="btn" href="' + P() + 'chapters">Browse chapters</a></div>';
}`);
  between('function realPending(sectionId, what) {', 'function sectionOfModule(moduleId) {', String.raw`function realPending(sectionId, what) {
  const meta = sectionMeta(sectionId);
  const label = meta ? 'Chapter ' + meta.n + ' — ' + meta.title : shortSection(sectionId);
  return '<header class="course-hero"><p class="course-kicker">COMING SOON</p><h1>' + esc(label) + '</h1></header><div class="card"><h2>' + esc(what) + ' — not yet built</h2><p>This activity is not available yet. Please choose another activity in the chapter.</p><p><a class="btn" href="' + P() + 'chapter/' + esc(sectionId) + '">Back to the chapter</a></p></div>';
}`);

  //Readable source citations
  between('function sourceLine(factIds) {', '// ---- Learner views', String.raw`function sourceLine(factIds) {
  if (!_factPages) _factPages = factPageMap();
  const refs = (factIds || []).map((f) => _factPages[f]).filter(Boolean);
  const chapters = [...new Set(refs.map((r) => sectionMeta(r.section)?.n).filter(Boolean))];
  const pages = [...new Set(refs.map((r) => r.ref && (r.ref.printed_page || (r.ref.pdf_page ? "PDF " + r.ref.pdf_page : null))).filter(Boolean))];
  const chapter = chapters.length ? ", chapter " + chapters.join(", ") : "";
  return '<p class="muted source-line">Source: <a href="' + P() + 'dossier">' + esc(ST.name) + ' Driver Handbook' + esc(chapter) + '</a>' + (pages.length ? ', p. ' + esc(pages.join(', ')) : '') + '</p>';
}`);

  // State Picker (#/) + Coming Soon + Loading
  between('function vPicker() {', 'function vHome() {', String.raw`function vPicker() {
  const list = STATES || [];
  if (!list.length) {
    return '<header class="course-hero"><p class="course-kicker">STATE DIRECTORY</p><h1>Driver handbook written-test prep</h1></header><div class="card"><h2>No states available</h2><p>State courses are being loaded.</p></div>';
  }
  const open = list.filter((s) => s.status === "complete").length;
  const audioCount = list.filter((s) => s.status === "complete" && SUMMARY[s.code] && SUMMARY[s.code].audio).length;
  return '<header class="course-hero picker-hero"><p class="course-kicker">ALL 50 STATES + D.C. · CHAPTER 1 FREE</p><h1>Choose your state handbook course</h1>'
    + '<p class="course-intro">Every course is built from the official state driver manual. Chapter 1 is free in all ' + open + ' of ' + list.length + ' open jurisdictions.</p>'
    + '<div class="picker-toolbar" data-picker-tools>'
    + '<label class="picker-search-wrap"><span class="sr-only">Find your state</span><input type="search" data-picker-search placeholder="Search state or manual (e.g., North Dakota, ND)…" autocomplete="off"></label>'
    + '<div class="picker-filters" role="group" aria-label="Filter states">'
    + '<button type="button" class="filter-chip is-active" data-picker-filter="all">All (' + list.length + ')</button>'
    + (audioCount ? '<button type="button" class="filter-chip" data-picker-filter="audio">🎧 Narration included (' + audioCount + ')</button>' : '')
    + '</div></div></header>'
    + '<p class="picker-empty muted" data-picker-empty hidden>No matching state found. Try searching by full state name or two-letter code.</p>'
    + '<div class="picker-grid">'
    + list.map((s) => {
      const slug = slugOf(s);
      const sum = SUMMARY[s.code];
      const a = sum && sum.audio;
      const isFlagshipVideo = stateSupportsVideo(s);
      const head = '<div class="picker-card-top"><span class="state-monogram">' + esc(s.code) + '</span><div class="picker-title-wrap"><h2>' + esc(s.name) + (s.status === "complete" ? "" : " — coming soon") + '</h2></div>'
        + (s.status === "complete" ? (isFlagshipVideo ? '<span class="video-pill">🎬 Video + Audio</span>' : (a ? '<span class="audio-pill">🎧 Audio</span>' : '<span class="free-pill">Ch. 1 Free</span>')) : '<span class="soon-pill">Soon</span>') + '</div>'
        + '<p class="picker-handbook"><b>' + esc(s.handbook) + '</b> · ' + esc(s.test) + '</p>';
      if (s.status !== "complete") {
        return '<article class="card picker-card is-soon" data-state-card="' + esc(s.code) + '" data-state-status="' + esc(s.status) + '" data-has-audio="0" data-search="' + esc((s.name + ' ' + s.code + ' ' + s.handbook).toLowerCase()) + '">' + head
          + '<p class="muted picker-stats">Status: ' + esc(STATUS_LABEL[s.status] || "coming soon") + ' · what exists: ' + esc(whatExists(s)) + '</p>'
          + '<p class="muted picker-note">Not open yet — the lessons, flashcards and quizzes are being prepared.</p></article>';
      }
      if (!sum || !sum.ok) {
        return '<article class="card picker-card is-soon" data-state-card="' + esc(s.code) + '" data-state-status="unavailable" data-has-audio="0" data-search="' + esc((s.name + ' ' + s.code + ' ' + s.handbook).toLowerCase()) + '">' + head
          + '<p class="muted picker-stats">Course files are currently refreshing. Please reload in a moment.</p></article>';
      }
      return '<article class="card picker-card" data-state-card="' + esc(s.code) + '" data-state-status="complete" data-has-audio="' + (a ? '1' : '0') + '" data-search="' + esc((s.name + ' ' + s.code + ' ' + s.handbook).toLowerCase()) + '">' + head
        + '<p class="muted picker-stats">' + sum.chaptersBuilt + ' of ' + sum.chaptersTotal + ' chapters built' + (a ? ' · narration: ' + a.cards + ' cards, ' + a.slides + ' lesson slides, ' + a.recaps + ' recaps (' + a.clips + ' clips)' : ' · text lessons, flashcards & quizzes') + '</p>'
        + '<div class="picker-actions"><a class="btn" href="#/' + esc(slug) + '/">Open ' + esc(s.name) + '</a><a class="picker-details-link" href="/states/' + esc(slug) + '">Overview</a></div></article>';
    }).join("")
    + '</div>';
}
function vComingSoon(s) {
  return '<header class="course-hero"><p class="course-kicker">COMING SOON</p><h1>' + esc(s.name) + ' — coming soon</h1></header>'
    + '<div class="card"><h2>' + esc(s.handbook) + ' · ' + esc(s.test) + '</h2>'
    + '<p class="muted">Status: ' + esc(STATUS_LABEL[s.status] || "coming soon") + ' · what exists: ' + esc(whatExists(s)) + '</p>'
    + '<p>This course is not open yet. Nothing synthetic is shown in its place.</p>'
    + '<p><a class="btn" href="#/">Back to all states</a></p></div>';
}
function vNoState(slug) {
  return '<header class="course-hero"><p class="course-kicker">NOT FOUND</p><h1>Nothing here</h1></header><div class="card"><p>There is no state course <code>' + esc(slug) + '</code>.</p><p><a class="btn" href="#/">All states</a></p></div>';
}
function vLoading(what) {
  return '<div class="card loading-shell" role="status"><p class="course-kicker">LOADING COURSE</p><h1>Loading…</h1><p class="muted">Loading ' + esc(what) + '.</p></div>';
}`);

  // Unlocked Course Dashboard (vHome) & Chapters Roadmap (vChapters)
  between('function vHome() {', 'function vChapter(sectionId) {', String.raw`function customerOverview(isChapters) {
  const c = handbookCounts();
  if (!c.chapters) return realEmpty("course content");
  const builtIds = new Set(builtSections().map((s) => s.id));
  const saved = store.read();
  const progress = saved.progress || {};
  let completedLessons = 0;
  let resumeChapter = null;
  let resumeModule = null;
  const hasVideo = !!(ST && stateSupportsVideo(ST));
  for (const s of SECTIONS) {
    if (!builtIds.has(s.id)) continue;
    const mods = modulesReal(s.id);
    for (const m of mods) {
      const hasUnit = m.unit_id && sessionUnit(m.unit_id);
      if (!hasUnit) continue;
      const uProg = progress[m.unit_id];
      if (uProg && (uProg.lesson || (!hasVideo && uProg.read))) completedLessons++;
      else if (!resumeModule) { resumeChapter = s; resumeModule = m; }
    }
  }
  if (!resumeChapter) resumeChapter = builtSections()[0] || null;
  const pct = c.lessons ? Math.round(completedLessons / c.lessons * 100) : 0;
  const hasNarration = !!AUDIO_MANIFEST;
  const hasGate = typeof window !== "undefined" && !!window.NovaGate;
  const resumeUnit = resumeModule && resumeModule.unit_id ? resumeModule.unit_id : "";
  const resumeQuick = resumeUnit
    ? '<p class="module-quick-actions">'
      + (hasVideo ? '<a class="mod-quick-btn is-mint" href="' + P() + 'lesson/' + esc(resumeUnit) + '">▶ Video</a>' : '')
      + '<a class="mod-quick-btn' + (!hasVideo ? ' is-mint' : '') + '" href="' + P() + 'read/' + esc(resumeUnit) + '">📖 Read</a>'
      + '<a class="mod-quick-btn" href="' + P() + 'cards/' + esc(resumeUnit) + '">⚡ Cards</a>'
      + '<a class="mod-quick-btn" href="' + P() + 'quiz/' + esc(resumeUnit) + '">✓ Quiz</a>'
      + '</p>'
    : '';
  return '<header class="course-hero"><div class="hero-badges"><span class="state-monogram">' + esc(ST.code) + '</span>' + (hasGate ? '<span class="unlocked-pill">✓ Full course unlocked</span>' : '<span class="free-pill">★ Official Handbook Studio</span>') + (hasVideo ? '<span class="video-pill">🎬 ' + c.lessons + ' lesson videos</span>' : '') + (hasNarration ? '<span class="audio-pill">🎧 Teacher narration included</span>' : '') + '</div>'
    + '<h1>' + (isChapters ? 'Chapters — ' + esc(HB()) : esc(HB()) + ' — written-test prep') + '</h1>'
    + (!isChapters
      ? '<p class="course-intro course-real-note">' + esc(REAL_NOTE) + '</p>'
      : '<p class="course-intro">Study each chapter in order: ' + (hasVideo ? 'video walkthrough, page-flip reading, active-recall flashcards, and practice quiz.' : 'page-flip reading, active-recall flashcards, and practice quiz.') + '</p>')
    + '<p class="course-count-strip">' + c.chapters + ' of ' + c.total + ' chapters built · ' + c.cards + ' flashcards · ' + c.items + ' quiz items · ' + c.lessons + ' lessons (' + c.slides + ' slides)</p>'
    + '</header>'
    + '<div class="chapter-layout"><section class="chapter-modules" aria-label="Course chapters"><div class="section-label"><h2>Official handbook syllabus</h2><span>' + c.chapters + ' of ' + c.total + ' ready</span></div>'
    + SECTIONS.map((s) => {
      if (!builtIds.has(s.id)) {
        return '<div class="module-tile is-unavailable"><span class="module-index">' + String(s.n).padStart(2, '0') + '</span><div class="module-details"><h2>Chapter ' + s.n + ' — ' + esc(s.title) + '</h2><p class="muted">Not yet built — this chapter is still being prepared.</p></div><span class="module-open">Soon</span></div>';
      }
      const mods = modulesReal(s.id);
      const cards = mods.reduce((n, m) => n + (m.unit_id ? deckForUnit(m.unit_id).length : 0), 0);
      const lessonsInCh = mods.filter((m) => m.unit_id && sessionUnit(m.unit_id));
      const doneInCh = lessonsInCh.filter((m) => progress[m.unit_id] && (progress[m.unit_id].lesson || (!hasVideo && progress[m.unit_id].read))).length;
      const allDone = lessonsInCh.length > 0 && doneInCh === lessonsInCh.length;
      const m0 = lessonsInCh[0] || mods[0];
      const u0 = m0 && m0.unit_id ? m0.unit_id : "";
      const chQuick = u0
        ? '<div class="module-quick-actions">'
          + (hasVideo ? '<a class="mod-quick-btn is-mint" href="' + P() + 'lesson/' + esc(u0) + '">▶ Mod 1 Video</a>' : '')
          + '<a class="mod-quick-btn' + (!hasVideo ? ' is-mint' : '') + '" href="' + P() + 'read/' + esc(u0) + '">📖 Mod 1 Read</a>'
          + '<a class="mod-quick-btn" href="' + P() + 'cards/' + esc(u0) + '">⚡ Cards</a>'
          + '<a class="mod-quick-btn" href="' + P() + 'quiz/' + esc(u0) + '">✓ Quiz</a>'
          + '</div>'
        : '';
      return '<article class="module-tile chapter-roadmap-tile"><span class="module-index' + (allDone ? ' is-done' : '') + '">' + String(s.n).padStart(2, '0') + '</span><div class="module-details"><a class="module-hub-link" href="' + P() + 'chapter/' + esc(s.id) + '"><h2>Chapter ' + s.n + ' — ' + esc(s.title) + '</h2></a>'
        + '<div class="course-meta"><span>' + mods.length + ' module' + (mods.length === 1 ? '' : 's') + '</span><span>' + cards + ' flashcards</span><span>' + doneInCh + ' / ' + lessonsInCh.length + ' lessons complete</span></div>'
        + chQuick + '</div>'
        + '<a class="module-open" href="' + P() + 'chapter/' + esc(s.id) + '">All modules ' + hubIcon('arrow') + '</a></article>';
    }).join("")
    + (function () {
      const signCount = stateSignList(ST.code).length;
      const sProg = progress.__signs__ || {};
      const sQuizDone = Object.values(saved.results || {}).some((r) => r && String(r.formId || '').startsWith('signs:'));
      const sDone = (sProg.lesson ? 1 : 0) + (sProg.cards ? 1 : 0) + (sQuizDone ? 1 : 0);
      return '<article class="module-tile chapter-roadmap-tile is-road-signs-tile" data-road-signs-entry>'
        + '<span class="module-index is-signs-index' + (sDone === 3 ? ' is-done' : '') + '" aria-hidden="true">' + SIGN_YIELD_SVG + '</span>'
        + '<div class="module-details"><div class="chapter-row-head"><a class="module-hub-link" href="' + P() + 'signs"><h2>Road signs</h2></a><span class="free-pill">★ Free</span></div>'
        + '<div class="course-meta"><span>' + signCount + ' handbook signs</span><span>20-question sign test</span><span>' + sDone + ' / 3 steps complete</span></div>'
        + '<div class="module-quick-actions">'
        + '<a class="mod-quick-btn is-mint" href="' + P() + 'signs">🛑 Signs Hub</a>'
        + '<a class="mod-quick-btn" href="' + P() + 'signs/cards">⚡ Study cards</a>'
        + '<a class="mod-quick-btn" href="' + P() + 'signs/test">✓ Sign test</a>'
        + '</div></div>'
        + '<a class="module-open" href="' + P() + 'signs">Open signs ' + hubIcon('arrow') + '</a></article>';
    })()
    + '</section><aside class="course-side"><section class="course-summary-panel"><p class="course-kicker">OVERALL COURSE PROGRESS</p><div class="chapter-progress-number">' + completedLessons + '<span> / ' + c.lessons + '</span></div><p class="progress-caption">lessons completed across all chapters</p><div class="course-progress" role="progressbar" aria-label="Course lessons completed" aria-valuemin="0" aria-valuemax="' + c.lessons + '" aria-valuenow="' + completedLessons + '"><span class="course-progress-fill" style="width:' + pct + '%"></span></div>'
    + (resumeChapter ? '<div class="chapter-next"><p class="course-kicker">' + (completedLessons ? 'CONTINUE WHERE YOU LEFT OFF' : 'START HERE') + '</p><h3>Chapter ' + resumeChapter.n + ': ' + esc(resumeChapter.title) + '</h3><a class="btn" href="' + P() + (resumeModule ? 'module/' + esc(resumeModule.module_id) : 'chapter/' + esc(resumeChapter.id)) + '">' + (completedLessons ? 'Resume studying' : 'Start Chapter ' + resumeChapter.n) + ' ' + hubIcon('arrow') + '</a>' + resumeQuick + '</div>' : '')
    + '<p class="device-note">Progress and practice scores stay saved on this device.</p></section>'
    + '<section class="chapter-practice"><span class="practice-icon">' + hubIcon('quiz') + '</span><h3>Chapter practice tests</h3><p>Take full chapter practice sets with instant answer rationales.</p><a href="' + P() + 'practice">Open practice test center ' + hubIcon('arrow') + '</a><small>Practice only — no official pass claim.</small></section>'
    + '</aside></div>';
}
function vHome() { return customerOverview(false); }
function vChapters() { return customerOverview(true); }`);

  // Guided Lesson View (vLesson) + Active-Recall Flashcards View (vCards)
  between('function vLesson(unitId) {', '// ---- Synthetic sample', String.raw`function vLesson(unitId) {
  const unit = sessionUnit(unitId);
  if (!unit) {
    const sec = sectionOfUnit(unitId);
    return sec ? realPending(sec, "Lesson") : vMissing();
  }
  const moduleId = moduleForUnit(unitId);
  const secId = sectionOfUnit(unitId);
  const meta = secId ? sectionMeta(secId) : null;
  const modList = secId ? modulesReal(secId) : [];
  const modIndex = moduleId ? modList.findIndex((x) => x.module_id === moduleId) + 1 : 0;
  const modObj = moduleId ? modList.find((x) => x.module_id === moduleId) : null;
  const rawTitle = (unit.title && unit.title.text) || (modObj && modObj.title) || "Guided lesson";
  const displayTitle = hubCleanTitle(rawTitle, modIndex);
  const wx = unit.worked_example || {}, mc = unit.misconception || {}, sc = unit.self_check || {};
  const mcClaim = mc.claim || {}, mcFix = mc.correction || {};
  const slides = unit.slides || [];
  const whyHow = unit.why_how || [];
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const studyCrumb = hubStudyCrumb(meta, stateTitle, stateTitle);
  const crumbHref = meta ? (P() + 'chapter/' + esc(meta.id)) : (P() + 'chapters');
  return '<header class="course-hero study-hero">'
    + '<div class="plp-study-head-top is-light"><a class="plp-study-crumb" href="' + crumbHref + '">' + esc(studyCrumb) + '</a><span class="plp-badge-pos">Slide 1 of ' + Math.max(1, slides.length) + '</span></div>'
    + '<h1>Lesson: ' + esc(displayTitle) + '</h1>'
    + (AUDIO_MANIFEST ? '<p class="lesson-audio-note">' + hubIcon('audio') + ' <span>Narration audio: pre-recorded lessons and flashcards.</span></p>' : '')
    + '</header>'
    + slides.map((sl, i) => {
      const slideFacts = [...new Set([...((sl.title && sl.title.fact_ids) || []), ...((sl.lines || []).flatMap((l) => l.fact_ids || [])), ...((sl.narration && sl.narration.fact_ids) || [])])];
      const audioHtml = slideAudioHtml(unitId, sl).replace('<p class="muted">audio pending</p>', '');
      const visualHtml = window.NovaGate && window.NovaGate.visualForSlide
        ? window.NovaGate.visualForSlide(ST, unitId, i, slideFacts)
        : (window.NovaGate && window.NovaGate.signForFacts ? window.NovaGate.signForFacts(ST, slideFacts) : '');
      return '<section class="card lesson-step-card" data-lesson-page data-step-label="Slide ' + (i + 1) + '">'
        + '<div class="step-card-top"><span class="step-badge">Slide ' + (i + 1) + ' of ' + slides.length + '</span><span class="step-time">About ' + esc(String(sl.estimated_narration_seconds)) + 's</span></div>'
        + '<h2>' + esc(sl.title && sl.title.text) + '</h2>'
        + '<div class="teacher-box"><div class="teacher-box-head"><span class="teacher-label">Teacher says (about ' + esc(String(sl.estimated_narration_seconds)) + 's)</span>' + audioHtml + '</div>'
        + '<p class="teacher-text">' + esc(sl.narration && sl.narration.text) + '</p></div>'
        + visualHtml
        + ((sl.lines || []).length ? '<div class="key-phrases"><span class="key-phrases-label">Key handbook phrases</span><div class="phrase-chips">' + (sl.lines || []).map((l) => '<span class="phrase-chip">' + esc(l.text) + '</span>').join('') + '</div></div>' : '')
        + sourceLine(slideFacts)
        + '</section>';
    }).join('')
    + (whyHow.length ? '<section class="card lesson-step-card" data-lesson-page data-step-label="Key Rules">'
      + '<div class="step-card-top"><span class="step-badge">Rule Summary</span><span class="step-time">' + whyHow.length + ' key rule' + (whyHow.length === 1 ? '' : 's') + '</span></div>'
      + '<h2>Key rules from this section</h2>'
      + '<ol class="why-how-list">' + whyHow.map((w) => '<li class="why-how-item"><p data-why-how-text>' + esc(w.text) + '</p>' + sourceLine(w.fact_ids) + '</li>').join('') + '</ol>'
      + '</section>' : '')
    + '<section class="card lesson-step-card" data-lesson-page data-step-label="Example &amp; Trap">'
    + '<div class="step-card-top"><span class="step-badge">Real-World Application</span><span class="step-time">Scenario + Watch-out</span></div>'
    + '<h2>Worked example &amp; common trap</h2>'
    + (window.NovaGate && window.NovaGate.visualForUnit ? window.NovaGate.visualForUnit(ST, unitId, 'example') : '')
    + '<div class="scenario-grid">'
    + '<div class="scenario-panel"><span class="panel-kicker">WORKED EXAMPLE</span>'
    + '<div class="scenario-row"><b>Situation</b><p>' + esc(wx.scenario && wx.scenario.text) + '</p></div>'
    + '<div class="scenario-row"><b>Reasoning</b><p>' + esc(wx.reasoning && wx.reasoning.text) + '</p></div>'
    + '<div class="scenario-row is-outcome"><b>Safe outcome</b><p>' + esc(wx.result && wx.result.text) + '</p></div></div>'
    + '<div class="misconception-panel"><span class="panel-kicker">COMMON MISCONCEPTION</span>'
    + '<div class="trap-box is-false"><b>Myth / False</b><p>' + esc(mcClaim.text) + '</p></div>'
    + '<div class="trap-box is-true"><b>Handbook truth</b><p>' + esc(mcFix.text) + '</p></div>'
    + (unit.memory_support && unit.memory_support.text ? '<div class="memory-anchor"><b>Memory anchor:</b> ' + esc(unit.memory_support.text) + '</div>' : '')
    + '</div></div></section>'
    + '<section class="card lesson-step-card" data-lesson-page data-step-label="Quick Check">'
    + '<div class="step-card-top"><span class="step-badge">Final Step · Self-Check</span><span class="step-time">Check your recall</span></div>'
    + '<h2>Quick self-check</h2>'
    + '<p class="self-check-prompt">' + esc(sc.prompt && sc.prompt.text) + '</p>'
    + '<p><button type="button" data-reveal>Reveal answer</button></p>'
    + '<div hidden data-answer class="self-check-answer"><p><b>Answer:</b> ' + esc(sc.answer && sc.answer.text) + '</p><p><b>Why:</b> ' + esc(sc.rationale && sc.rationale.text) + '</p>' + (window.NovaGate && window.NovaGate.visualForUnit ? window.NovaGate.visualForUnit(ST, unitId, 'check') : '') + '</div>'
    + '<div class="lesson-finish-box" data-lesson-finish-slot><div class="lesson-next-links"><a class="btn" href="' + P() + 'cards/' + esc(unitId) + '">Continue to flashcards ' + hubIcon('arrow') + '</a>' + (moduleId ? '<a class="btn secondary-btn" href="' + P() + 'module/' + esc(moduleId) + '">Back to module hub</a>' : '') + '</div></div>'
    + '</section>';
}

function vRead(unitId) {
  const unit = sessionUnit(unitId);
  if (!unit) {
    const sec = sectionOfUnit(unitId);
    return sec ? realPending(sec, "Reading") : vMissing();
  }
  const moduleId = moduleForUnit(unitId);
  const secId = sectionOfUnit(unitId);
  const meta = secId ? sectionMeta(secId) : null;
  const modList = secId ? modulesReal(secId) : [];
  const modIndex = moduleId ? modList.findIndex((x) => x.module_id === moduleId) + 1 : 0;
  const modObj = moduleId ? modList.find((x) => x.module_id === moduleId) : null;
  const rawTitle = (unit.title && unit.title.text) || (modObj && modObj.title) || "Guided reading";
  const displayTitle = hubCleanTitle(rawTitle, modIndex);
  const wx = unit.worked_example || {}, mc = unit.misconception || {}, sc = unit.self_check || {};
  const mcClaim = mc.claim || {}, mcFix = mc.correction || {};
  const slides = unit.slides || [];
  const whyHow = unit.why_how || [];

  if (!_factPages) _factPages = factPageMap();
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const chNum = (meta && meta.n) || 1;
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const themeKey = themes[(themes.indexOf(baseTheme) + Math.max(1, chNum) - 1) % themes.length];
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const mobPrefix = meta ? ("CH " + String(meta.n).padStart(2, "0") + (modIndex ? " · M " + String(modIndex).padStart(2, "0") : "")) : stateCode;

  const hasRulesPage = whyHow.length > 0;
  const hasAppPage = Boolean((wx.scenario && wx.scenario.text) || mcClaim.text || mcFix.text || (unit.memory_support && unit.memory_support.text));
  const hasCheckPage = Boolean(sc.prompt && sc.prompt.text);
  const totalPages = slides.length + (hasRulesPage ? 1 : 0) + (hasAppPage ? 1 : 0) + (hasCheckPage ? 1 : 0);
  const initPct = totalPages ? Math.round(100 / totalPages) : 100;
  const studyCrumb = hubStudyCrumb(meta, stateTitle, stateTitle);
  const crumbHref = meta ? (P() + 'chapter/' + esc(meta.id)) : (P() + 'chapters');

  let pageCounter = 0;
  const slidePagesHtml = slides.map((sl, i) => {
    pageCounter++;
    const pNo = pageCounter;
    const slideFacts = [...new Set([...((sl.title && sl.title.fact_ids) || []), ...((sl.lines || []).flatMap((l) => l.fact_ids || [])), ...((sl.narration && sl.narration.fact_ids) || [])])];
    const visualHtml = window.NovaGate && window.NovaGate.visualForSlide
      ? window.NovaGate.visualForSlide(ST, unitId, i, slideFacts)
      : (window.NovaGate && window.NovaGate.signForFacts ? window.NovaGate.signForFacts(ST, slideFacts) : '');
    const audioSrc = slideAudioSrc(unitId, sl.slide_id);
    const rawBody = String((sl.narration && sl.narration.text) || "").trim();
    const paras = rawBody
      ? rawBody.split(/(?<=[.!?])\s+(?=[A-Z0-9"“])/).reduce((acc, s) => {
          const last = acc[acc.length - 1];
          if (last && (last + " " + s).length < 300) acc[acc.length - 1] = last + " " + s;
          else acc.push(s);
          return acc;
        }, [])
      : [];
    const slideTitle = (sl.title && sl.title.text) || ("Page " + pNo);
    const validLines = (sl.lines || []).filter((l) => {
      const t = String((l && l.text) || "").trim();
      if (!t || !/^[A-Z0-9"“]/.test(t)) return false;
      if (!/[.!?)"”]$/.test(t) && rawBody.toLowerCase().includes(t.toLowerCase())) return false;
      return true;
    });
    return '<section class="card plp-card-stage plp-read-stage" data-read-page data-read-kind="slide" data-step-label="' + esc(slideTitle) + '">'
      + '<div class="plp-card-grid ' + (visualHtml ? 'has-visual' : 'no-visual') + '">'
      + '<div class="plp-cream-box">'
      + '<div class="plp-read-top-card">'
      + '<div class="plp-read-head"><h2 class="plp-front-prompt plp-read-title">' + esc(slideTitle) + '</h2>'
      + (validLines.length ? '<div class="plp-read-points"><span class="plp-read-kicker">KEY HANDBOOK POINTS</span><ul class="plp-read-lines">' + validLines.map((l) => '<li>' + esc(l.text) + '</li>').join('') + '</ul></div>' : '')
      + '</div></div>'
      + '<div class="plp-read-body">'
      + '<div class="plp-read-prose">' + paras.map((p) => '<p>' + esc(p) + '</p>').join('') + '</div>'
      + (audioSrc ? '<div class="plp-read-audio-row"><button type="button" class="plp-audio-btn" data-slide-audio data-src="' + esc(audioSrc) + '" data-idle-label="▶ Listen to page" data-pause-label="⏸ Pause audio">▶ Listen to page</button></div>' : '')
      + sourceLine(slideFacts)
      + '</div></div>'
      + (visualHtml ? '<aside class="plp-companion-col"><div class="plp-visual-box">' + visualHtml + '</div></aside>' : '')
      + '</div></section>';
  }).join('');

  let rulesPageHtml = '';
  if (hasRulesPage) {
    pageCounter++;
    rulesPageHtml = '<section class="card plp-card-stage plp-read-stage" data-read-page data-read-kind="rules" data-step-label="Key Rules">'
      + '<div class="plp-card-grid no-visual"><div class="plp-cream-box">'
      + '<div class="plp-read-top-card">'
      + '<div class="plp-read-head"><h2 class="plp-front-prompt plp-read-title">Key rules from this section</h2></div>'
      + '</div>'
      + '<div class="plp-read-body"><ol class="plp-rules-list">'
      + whyHow.map((w, ri) => '<li class="plp-rule-card"><span class="plp-rule-idx">' + String(ri + 1).padStart(2, '0') + '</span><div class="plp-rule-copy"><p data-why-how-text>' + esc(w.text) + '</p>' + sourceLine(w.fact_ids) + '</div></li>').join('')
      + '</ol></div></div></div></section>';
  }

  let appPageHtml = '';
  if (hasAppPage) {
    pageCounter++;
    const exVisual = window.NovaGate && window.NovaGate.visualForUnit ? window.NovaGate.visualForUnit(ST, unitId, 'example') : '';
    appPageHtml = '<section class="card plp-card-stage plp-read-stage" data-read-page data-read-kind="example" data-step-label="Example &amp; Watch-Out">'
      + '<div class="plp-card-grid ' + (exVisual ? 'has-visual' : 'no-visual') + '"><div class="plp-cream-box">'
      + '<div class="plp-read-top-card">'
      + '<div class="plp-read-head"><h2 class="plp-front-prompt plp-read-title">Worked example &amp; exam watch-out</h2></div>'
      + '</div>'
      + '<div class="plp-read-body">'
      + ((wx.scenario && wx.scenario.text)
        ? '<div class="plp-scenario-card"><span class="plp-read-kicker">WORKED EXAMPLE</span>'
          + '<div class="plp-scenario-row"><b>Situation</b><p>' + esc(wx.scenario.text) + '</p></div>'
          + (wx.reasoning && wx.reasoning.text ? '<div class="plp-scenario-row"><b>Reasoning</b><p>' + esc(wx.reasoning.text) + '</p></div>' : '')
          + (wx.result && wx.result.text ? '<div class="plp-scenario-row is-outcome"><b>Safe outcome</b><p>' + esc(wx.result.text) + '</p></div>' : '')
          + '</div>'
        : '')
      + ((mcClaim.text || mcFix.text)
        ? '<div class="plp-trap-grid">'
          + (mcClaim.text ? '<div class="plp-trap-box is-false"><span class="plp-trap-tag">✕ MYTH / NOT TRUE</span><p>' + esc(mcClaim.text) + '</p></div>' : '')
          + (mcFix.text ? '<div class="plp-trap-box is-true"><span class="plp-trap-tag">✓ HANDBOOK TRUTH</span><p>' + esc(mcFix.text) + '</p></div>' : '')
          + '</div>'
        : '')
      + (unit.memory_support && unit.memory_support.text
        ? '<div class="plp-hook-box is-read-anchor"><div class="plp-hook-open"><span class="plp-hook-tag">★ MEMORY ANCHOR</span><p class="plp-hook-text">' + esc(unit.memory_support.text) + '</p></div></div>'
        : '')
      + '</div></div>'
      + (exVisual ? '<aside class="plp-companion-col"><div class="plp-visual-box">' + exVisual + '</div></aside>' : '')
      + '</div></section>';
  }

  let checkPageHtml = '';
  if (hasCheckPage) {
    pageCounter++;
    const ckVisual = window.NovaGate && window.NovaGate.visualForUnit ? window.NovaGate.visualForUnit(ST, unitId, 'check') : '';
    checkPageHtml = '<section class="card plp-card-stage plp-read-stage" data-read-page data-read-kind="check" data-read-final data-step-label="Quick Self-Check">'
      + '<div class="plp-card-grid no-visual"><div class="plp-cream-box">'
      + '<div class="plp-read-top-card">'
      + '<div class="plp-read-head"><h2 class="plp-front-prompt plp-read-title">Quick self-check</h2><p class="plp-check-prompt" data-fill-blank>' + esc(sc.prompt && sc.prompt.text) + '</p></div>'
      + '</div>'
      + '<div class="plp-read-body">'
      + '<div class="plp-check-actions"><button type="button" class="plp-flip-btn" data-reveal>Reveal answer</button></div>'
      + '<div hidden data-answer class="plp-rule-panel plp-check-answer"><span class="plp-rule-tag">✓ HANDBOOK ANSWER</span><p class="plp-rule-text">' + esc(sc.answer && sc.answer.text) + '</p>'
      + (sc.rationale && sc.rationale.text ? '<p class="plp-check-why"><b>Why:</b> ' + esc(sc.rationale.text) + '</p>' : '')
      + (ckVisual ? '<div class="plp-check-visual">' + ckVisual + '</div>' : '')
      + '</div>'
      + '<div class="plp-read-finish"><a class="btn plp-quiz-cta" href="' + P() + 'cards/' + esc(unitId) + '">Continue to Flashcards ' + hubIcon('arrow') + '</a>'
      + (moduleId ? '<a class="btn secondary-btn plp-hub-cta" href="' + P() + 'module/' + esc(moduleId) + '">Module Hub</a>' : '')
      + '</div></div></div></div></section>';
  }

  return '<div class="plp-deck is-plp-read" data-plp-theme="' + esc(themeKey) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + crumbHref + '">' + esc(studyCrumb) + '</a><span class="plp-badge-pos" data-plp-pos>Page 1 of ' + totalPages + '</span></div>'
    + '<h1>' + esc(displayTitle) + '</h1>'
    + '</header>'
    + slidePagesHtml
    + rulesPageHtml
    + appPageHtml
    + checkPageHtml
    + '<nav class="plp-deck-bar" aria-label="Reading page navigation" data-next-href="' + P() + 'cards/' + esc(unitId) + '">'
    + '<div class="plp-deck-bar-row">'
    + '<button type="button" class="plp-nav-btn" data-plp-prev>← Prev</button>'
    + '<div class="plp-jumper-strip" data-plp-jumper role="tablist" aria-label="Jump to page"></div>'
    + '<button type="button" class="plp-nav-btn is-next" data-plp-next>Next →</button>'
    + '</div>'
    + '<div class="plp-mint-track" aria-hidden="true"><span class="plp-mint-fill" data-plp-mint-fill style="width:' + initPct + '%"></span></div>'
    + '</nav>'
    + '</div>';
}

function vCards(unitId) {
  const list = deckForUnit(unitId);
  if (!list.length) {
    const sec = sectionOfUnit(unitId);
    return sec ? realPending(sec, "Flashcards") : vMissing();
  }
  const moduleId = moduleForUnit(unitId);
  const byCard = scriptsByCard();
  const recap = moduleId ? recapForModule(moduleId) : null;
  const sec = sectionOfUnit(unitId);
  const meta = sec ? sectionMeta(sec) : null;
  const modList = sec ? modulesReal(sec) : [];
  const modIndex = moduleId ? modList.findIndex((x) => x.module_id === moduleId) + 1 : 0;
  const modObj = moduleId ? modList.find((x) => x.module_id === moduleId) : null;
  const displayTitle = modObj ? hubCleanTitle(modObj.title, modIndex) : "Recall, then reveal";

  if (!_factPages) _factPages = factPageMap();
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const chNum = (meta && meta.n) || 1;
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const themeKey = themes[(themes.indexOf(baseTheme) + Math.max(1, chNum) - 1) % themes.length];
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const studyCrumb = hubStudyCrumb(meta, stateTitle, stateTitle);
  const crumbHref = meta ? (P() + 'chapter/' + esc(meta.id)) : (P() + 'chapters');
  const recMeta = (window.NovaGate && window.NovaGate.recapMeta && moduleId) ? window.NovaGate.recapMeta(ST, moduleId) : null;
  const baseRecapSrc = recap && recap.card_id ? recapAudioSrc(recap.card_id) : null;
  const recapSrc = (recMeta && recMeta.audio_recap) || baseRecapSrc || "";
  const recapBtnHtml = recapSrc
    ? '<button type="button" class="plp-audio-btn is-recap-audio" data-recap-audio data-src="' + esc(recapSrc) + '" data-idle-label="▶ Play Deck Recap" data-pause-label="⏸ Pause Recap">▶ Play Deck Recap</button>'
    : '';

  return '<div class="plp-deck is-plp-cards" data-plp-theme="' + themeKey + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + crumbHref + '">' + esc(studyCrumb) + '</a><span class="plp-badge-pos" data-plp-pos>Card 1 of ' + list.length + '</span></div>'
    + '<h1>' + esc(displayTitle) + '</h1>'
    + '</header>'
    + list.map((c, i) => {
      const teach = byCard[c.card_id] && byCard[c.card_id].segments && byCard[c.card_id].segments.teaching && byCard[c.card_id].segments.teaching.text;
      const ovMeta = (window.NovaGate && window.NovaGate.cardMeta)
        ? window.NovaGate.cardMeta(ST, c)
        : { kicker: c.high_yield ? "KEY TEST RULE" : "ACTIVE RECALL", pills: ["OFFICIAL RULE"], audio_q: null, audio_teach: null, isGenZ: false };
      const baseArc = cardAudioSrcs(c.card_id, sec);
      const qSrc = ovMeta.audio_q || (baseArc && baseArc.q) || "";
      const thinkSrc = (baseArc && baseArc.think) || "";
      const aSrc = (baseArc && baseArc.a) || "";
      const teachSrc = ovMeta.audio_teach || (baseArc && baseArc.teach) || "";
      const playBtn = (qSrc && thinkSrc && aSrc && teachSrc)
        ? '<button type="button" class="plp-audio-btn" data-card-audio data-idle-label="▶ Play Audio" data-q="' + esc(qSrc) + '" data-think="' + esc(thinkSrc) + '" data-a="' + esc(aSrc) + '" data-teach="' + esc(teachSrc) + '" data-pause-ms="' + esc(String(AUDIO_PAUSE_MS)) + '">▶ Play Audio</button>'
        : '';
      const signHtml = window.NovaGate ? window.NovaGate.signForCard(ST, c) : '';
      const sceneHtml = (!signHtml && window.NovaGate && window.NovaGate.visualForCard) ? window.NovaGate.visualForCard(ST, c) : '';
      const visualCombo = signHtml || sceneHtml;
      const pills = Array.isArray(ovMeta.pills) && ovMeta.pills.length ? ovMeta.pills : ["OFFICIAL RULE"];

      return '<section class="card flashcard-stage plp-card-stage" data-flashcard-page data-card-index="' + i + '" data-card-id="' + esc(c.card_id) + '">'
        + '<div class="plp-card-grid' + (visualCombo ? ' has-visual' : ' no-visual') + '">'
        + '<div class="plp-cream-box">'
        + '<div class="plp-front-card">'
        + '<div class="plp-beat-strip" aria-label="4-beat audio arc">'
        + '<span class="plp-beat-pill" data-beat-pill="q"><b>1</b><span class="plp-beat-word">QUESTION</span></span>'
        + '<span class="plp-beat-pill" data-beat-pill="think"><b>2</b><span class="plp-beat-word">THINK 3s</span></span>'
        + '<span class="plp-beat-pill" data-beat-pill="a"><b>3</b><span class="plp-beat-word">ANSWER</span></span>'
        + '<span class="plp-beat-pill" data-beat-pill="teach"><b>4</b><span class="plp-beat-word">COACH</span></span>'
        + '</div>'
        + '<div class="plp-front-zone">'
        + '<p class="flashcard-prompt plp-front-prompt" data-fill-blank>' + esc(c.front) + '</p>'
        + '</div>'
        + '<div class="flashcard-actions plp-action-row"><button type="button" data-recall class="btn-recall plp-flip-btn">Flip Card</button>' + playBtn + '</div>'
        + '<div class="recall-beat-box plp-beat-notice" data-beat-wrap><p class="muted" data-beat hidden>Take about 3 seconds to recall…</p></div>'
        + '</div>'
        + '<div hidden data-answer class="flashcard-back plp-back-zone">'
        + '<div class="plp-rule-panel"><span class="plp-panel-label">OFFICIAL HANDBOOK ANSWER</span><p class="plp-rule-text">' + esc(c.back) + '</p></div>'
        + (byCard[c.card_id] && teach
          ? '<details class="plp-coach-panel" data-plp-coach open><summary class="plp-panel-label">Why it matters</summary><p class="plp-coach-text">' + esc(teach) + '</p></details>'
          : '')
        + '<div class="plp-back-foot">'
        + '<div class="card-self-rate plp-rate-bar" data-self-rate></div>'
        + sourceLine(c.claims_fact_ids)
        + '</div>'
        + '</div>'
        + '</div>'
        + '<aside class="plp-companion-col" aria-label="Memory companion">'
        + (visualCombo ? '<div class="plp-visual-box">' + visualCombo + '</div>' : '')
        + '<div class="plp-hook-box">'
        + '<div class="plp-hook-head"><span class="plp-hook-kicker">★ MEMORY HOOK</span><span class="plp-hook-badge">' + (c.high_yield ? 'HIGH-YIELD' : 'QUICK LOCK') + '</span></div>'
        + '<div class="plp-hook-locked" data-plp-hook-locked>'
        + '<p class="plp-hook-tease">Call your shot first — flip the card or tap <b>Play Audio</b> to unlock the memory hook &amp; key triggers.</p>'
        + '<div class="plp-pill-row is-masked" aria-hidden="true">' + pills.map(() => '<span class="plp-key-pill is-masked-pill">LOCKED TRIGGER</span>').join('') + '</div>'
        + '</div>'
        + '<div class="plp-hook-open" data-plp-hook-open hidden>'
        + '<p class="plp-hook-quote">“' + esc(c.memory_hook) + '”</p>'
        + '<div class="plp-pill-row">' + pills.map((p) => '<span class="plp-key-pill">' + esc(p) + '</span>').join('') + '</div>'
        + '</div>'
        + '</div>'
        + '</aside>'
        + '</div>'
        + '</section>';
    }).join('')
    + (recap
      ? '<section class="card flashcard-stage recap-stage plp-card-stage plp-recap-stage" data-flashcard-page data-recap-page>'
        + '<div class="plp-cream-box is-recap-box">'
        + '<div class="plp-recap-body">'
        + '<h2>Deck recap</h2>'
        + '<p class="recap-narration plp-recap-narration">' + esc(recap.recap && recap.recap.narration_text) + '</p>'
        + ((recap.recap && recap.recap.hooks_spoken && recap.recap.hooks_spoken.length)
          ? '<div class="plp-recap-hooks"><span class="plp-hook-kicker">ALL ' + recap.recap.hooks_spoken.length + ' MEMORY HOOKS IN ONE SWEEP</span><ol class="plp-recap-hook-grid">'
            + recap.recap.hooks_spoken.map((h, hi) => '<li><span class="plp-recap-num">' + String(hi + 1).padStart(2, '0') + '</span><span>' + esc(h) + '</span></li>').join('')
            + '</ol></div>'
          : '')
        + '<div class="plp-recap-actions">' + recapBtnHtml + '<a class="btn plp-quiz-cta" href="' + P() + 'quiz/' + esc(unitId) + '">Continue to the quiz ' + hubIcon('arrow') + '</a>' + (moduleId ? '<a class="btn secondary-btn plp-hub-cta" href="' + P() + 'module/' + esc(moduleId) + '">Back to module hub</a>' : '') + '</div>'
        + '</div>'
        + '</div>'
        + '</section>'
      : '<div class="deck-finish-actions"><a class="btn" href="' + P() + 'quiz/' + esc(unitId) + '">Continue to the quiz ' + hubIcon('arrow') + '</a>' + (moduleId ? '<a class="btn secondary-btn" href="' + P() + 'module/' + esc(moduleId) + '">Back to module hub</a>' : '') + '</div>')
    + '<footer class="plp-deck-bar" aria-label="Flashcard deck navigation">'
    + '<div class="plp-deck-bar-row">'
    + '<button type="button" class="plp-nav-btn" data-plp-prev>← Prev</button>'
    + '<div class="plp-jumper-strip" data-plp-jumper role="tablist" aria-label="Jump to card"></div>'
    + '<button type="button" class="plp-nav-btn is-next" data-plp-next>Next →</button>'
    + '</div>'
    + '<div class="plp-deck-bar-tools">'
    + (AUDIO_MANIFEST ? '<button type="button" class="plp-ctrl-pill is-autoplay" data-plp-autoplay aria-pressed="false" title="Auto-Play Deck" aria-label="Auto-Play Deck"><span class="plp-ctrl-icon" aria-hidden="true">▶</span><span class="plp-ctrl-label">Auto-Play Deck</span></button>' : '')
    + '<button type="button" class="plp-ctrl-pill" data-plp-instant aria-pressed="false" title="3s Recall: ON" aria-label="3s Recall: ON"><span class="plp-ctrl-icon" aria-hidden="true">⏱</span><span class="plp-ctrl-label">3s Recall: ON</span></button>'
    + (AUDIO_MANIFEST ? '<span class="plp-audio-footnote muted">Narration audio: pre-recorded lessons and flashcards.</span>' : '')
    + '</div>'
    + '<div class="plp-mint-track" aria-hidden="true"><span class="plp-mint-fill" data-plp-mint-fill style="width:0%"></span></div>'
    + '</footer>'
    + '</div>';
}`);

  // Quiz, Practice Test Center, Results, and Settings
  between('function realQuizBlock(ids, formId, title, policyNote, practiceLabel) {', 'function factBlocks(md) {', String.raw`function customerFormTitle(form, idx, meta) {
  const raw = String((form && form.title) || '').trim();
  if (/^(first|second|third|fourth)\s+topic\s+practice$/i.test(raw)) {
    const letter = String.fromCharCode(65 + (idx || 0));
    return (meta ? meta.title + ' — ' : '') + 'Practice Set ' + letter;
  }
  return hubCleanTitle(raw || (form && form.form_id) || 'Practice test', idx ? idx + 1 : 0);
}

function realQuizBlock(ids, formId, title, policyNote, practiceLabel, crumbHtml, opts) {
  const byId = examItemsById();
  if (!_factPages) _factPages = factPageMap();
  const cfg = opts || {};
  const meta = cfg.meta || null;
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const chNum = (meta && meta.n) || 1;
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const themeKey = themes[(themes.indexOf(baseTheme) + Math.max(1, chNum) - 1) % themes.length];
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const validItems = ids.map((id) => byId[id]).filter(Boolean);
  const qTotal = validItems.length;
  const studyCrumb = hubStudyCrumb(meta, cfg.kind === "practice" ? "Practice tests" : stateTitle, stateTitle);
  const crumbHref = meta ? (P() + 'chapter/' + esc(meta.id)) : (cfg.kind === "practice" ? (P() + 'practice') : (P() + 'chapters'));

  return '<div class="plp-deck is-plp-test" data-plp-theme="' + themeKey + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + crumbHref + '">' + esc(studyCrumb) + '</a><span class="plp-badge-pos" data-plp-pos>Question 1 of ' + qTotal + '</span></div>'
    + '<h1>' + esc(title) + '</h1>'
    + '</header>'
    + '<form data-rquiz="' + esc(formId) + '" class="quiz-runner-form plp-test-form">'
    + '<div data-summary></div>'
    + validItems.map((it) => {
      const parsedStem = parseClozeRuleStem(it.stem);
      const stemHtml = parsedStem.isCloze
        ? '<span class="plp-cloze-eyebrow">Complete the rule</span><h2 class="quiz-stem plp-front-prompt" data-fill-blank data-formatted-blank="1">' + hubFormatBlankHtml(parsedStem.body) + '</h2>'
        : '<h2 class="quiz-stem plp-front-prompt" data-fill-blank>' + esc(it.stem) + '</h2>';
      return '<section class="card quiz-question-card plp-card-stage plp-quiz-stage" data-ritem="' + esc(it.item_id) + '" data-fact-ids="' + esc((it.fact_ids || []).join(",")) + '" data-correct="' + esc(it.correct_key) + '" data-why="' + esc(it.correct_rationale) + '" data-stem="' + esc(it.stem) + '">'
        + '<div class="plp-card-grid no-visual">'
        + '<div class="plp-cream-box">'
        + '<div class="plp-front-card plp-q-head">'
        + '<div class="plp-front-zone plp-q-stem-zone">' + stemHtml + '</div>'
        + '</div>'
        + '<div class="plp-q-body">'
        + '<ol class="choices plp-choices">' + (it.options || []).map((o) => '<li><button type="button" class="option plp-option" data-key="' + esc(o.key) + '" data-otext="' + esc(o.text) + '" data-orationale="' + esc(o.rationale || "") + '"><span class="option-badge plp-opt-key">' + esc(o.key) + '</span><span class="option-body plp-opt-text">' + esc(o.text) + '</span></button></li>').join("") + '</ol>'
        + '<div hidden data-feedback class="quiz-feedback plp-quiz-feedback"></div>'
        + '<div class="plp-q-foot">' + sourceLine(it.fact_ids) + '</div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</section>';
    }).join("")
    + '<div class="quiz-submit-bar plp-submit-bar" data-quiz-submit-bar><button type="submit" class="btn-check-answers plp-submit-btn">Check answers</button></div>'
    + (practiceLabel
      ? '<div class="plp-practice-disclaimer"><strong>' + esc(practiceLabel) + ' ·</strong> <span>Practice only — not an official test. No pass or fail is claimed; the score describes this attempt alone.</span></div>'
      : (policyNote ? '<p class="muted plp-test-policy-note">' + esc(policyNote) + '</p>' : ''))
    + '</form>'
    + '<footer class="plp-deck-bar" data-plp-quiz-bar aria-label="Question navigation">'
    + '<div class="plp-deck-bar-row">'
    + '<button type="button" class="plp-nav-btn" data-plp-prev>← Prev</button>'
    + '<div class="plp-jumper-strip" data-plp-jumper role="tablist" aria-label="Jump to question"></div>'
    + '<button type="button" class="plp-nav-btn is-next" data-plp-next>Next →</button>'
    + '</div>'
    + '<div class="plp-mint-track" aria-hidden="true"><span class="plp-mint-fill" data-plp-mint-fill style="width:0%"></span></div>'
    + '</footer>'
    + '</div>';
}

function vQuiz(unitId) {
  const quiz = moduleQuizForUnit(unitId);
  if (!quiz) {
    const sec = sectionOfUnit(unitId);
    return sec ? realPending(sec, "Quiz") : vMissing();
  }
  const moduleId = moduleForUnit(unitId);
  const secId = sectionOfUnit(unitId);
  const meta = secId ? sectionMeta(secId) : null;
  const modList = secId ? modulesReal(secId) : [];
  const modIndex = moduleId ? modList.findIndex((x) => x.module_id === moduleId) + 1 : 0;
  const modObj = moduleId ? modList.find((x) => x.module_id === moduleId) : null;
  const cleanTitle = hubCleanTitle(quiz.title || (modObj && modObj.title) || 'Module quiz', modIndex);
  return realQuizBlock(quiz.item_ids, "quiz:" + quiz.quiz_id, cleanTitle,
    "Select an answer for each question, then check your reasoning against the official handbook.", null, "", { meta, modIndex, kind: "quiz" })
    + '<div class="quiz-footer-links plp-out-links">' + (moduleId ? '<a class="btn secondary-btn" href="' + P() + 'module/' + esc(moduleId) + '">Back to module hub</a>' : '') + ' <a class="btn secondary-btn" href="' + P() + 'practice">Chapter practice tests</a></div>';
}

function vPractice(formId) {
  const forms = practiceForms();
  if (!forms.length) return realEmpty("practice questions");
  if (formId) {
    const f = forms.find((x) => x.form_id === formId);
    if (!f) return vMissing();
    const meta = f.section_id ? sectionMeta(f.section_id) : null;
    const siblingForms = forms.filter((x) => x.section_id === f.section_id);
    const idx = Math.max(0, siblingForms.findIndex((x) => x.form_id === f.form_id));
    const setLetter = String.fromCharCode(65 + idx);
    const displayTitle = customerFormTitle(f, idx, meta);
    return realQuizBlock(f.item_ids, "form:" + f.form_id, displayTitle,
      "Chapter practice test. Scores describe observed practice only — never licensing eligibility, driving competence, or predicted success.",
      displayTitle, "", { meta, setLetter, kind: "practice" })
      + '<div class="quiz-footer-links plp-out-links"><a class="btn secondary-btn" href="' + P() + 'practice">All practice sets</a> <a class="btn secondary-btn" href="' + P() + 'chapters">Browse chapters</a></div>';
  }
  const bySec = {};
  for (const f of forms) { (bySec[f.section_id] = bySec[f.section_id] || []).push(f); }
  const secEntries = Object.entries(bySec);
  const saved = store.read();
  const results = Object.values(saved.results || {});
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const stateBadge = stateCode ? (stateCode + " · " + stateTitle.toUpperCase()) : stateTitle.toUpperCase();

  return '<div class="plp-deck is-plp-hub" data-plp-theme="' + baseTheme + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame">'
    + '<div class="plp-quest-top">'
    + '<span class="plp-mobile-meta">' + esc(stateCode ? stateCode + ' · ' : '') + forms.length + ' PRACTICE SETS</span>'
    + '<div class="plp-quest-badges">'
    + '<span class="plp-badge-gold">' + esc(stateBadge) + '</span>'
    + '<span class="plp-badge-navy">PRACTICE TEST CENTER</span>'
    + '<span class="plp-badge-pos">' + forms.length + ' SETS · ' + secEntries.length + ' CHAPTER' + (secEntries.length === 1 ? '' : 'S') + '</span>'
    + '</div>'
    + '</div>'
    + '<div class="plp-sticker-row"><span class="plp-chapter-sticker">OFFICIAL HANDBOOK PRACTICE</span></div>'
    + '<h1>Practice tests — ' + esc(HB()) + '</h1>'
    + '<div class="plp-quest-controls"><p class="plp-audio-note plp-test-note">' + forms.length + ' practice tests across ' + secEntries.length + ' chapter' + (secEntries.length === 1 ? '' : 's') + '. Practice only — no official pass claim.</p></div>'
    + '</header>'
    + '<div class="practice-chapters-grid plp-hub-grid">'
    + (function () {
      const signCount = stateSignList(ST.code).length;
      const signAttempts = results.filter((r) => r && String(r.formId || '').startsWith('signs:'));
      const latestSign = signAttempts.length ? signAttempts[signAttempts.length - 1] : null;
      const hasSignTry = Boolean(latestSign && Array.isArray(latestSign.answers));
      return '<section class="card practice-chapter-card plp-cream-box plp-hub-chapter is-signs-practice-card" data-signs-practice-tile>'
        + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">★ FREE MODULE · ROAD SIGNS</span><span class="plp-ribbon-tag">20 QUESTIONS · FREE</span></div>'
        + '<div class="plp-hub-chapter-body">'
        + '<div class="practice-chapter-head"><div><h2>' + SIGN_YIELD_SVG + ' Road signs test</h2><p class="muted">The ' + signCount + ' signs the ' + esc(ST.name) + ' handbook expects you to know · ' + esc(SIGN_PROVENANCE) + '</p></div></div>'
        + '<div class="practice-form-tiles plp-form-tiles">'
        + '<div class="practice-form-tile plp-form-tile">'
        + '<div class="plp-form-tile-meta">'
        + '<div class="plp-form-tile-top"><h3>Road signs test</h3>'
        + (hasSignTry ? '<span class="plp-try-pill is-done">Latest: ' + latestSign.correctCount + '/' + latestSign.answers.length + '</span>' : '<span class="plp-try-pill">Free</span>')
        + '</div>'
        + '<p class="muted">20 questions (meaning + identification)' + (hasSignTry ? ' · Latest try: ' + latestSign.correctCount + ' of ' + latestSign.answers.length : '') + '</p>'
        + '</div>'
        + '<div class="plp-sign-practice-btns"><a class="btn plp-quiz-cta plp-set-cta" href="' + P() + 'signs/test">' + (latestSign ? 'Retake ' : 'Start ') + 'Road signs test ' + hubIcon('arrow') + '</a><a class="btn secondary-btn plp-set-cta" href="' + P() + 'signs">Study signs</a></div>'
        + '</div></div></div></section>';
    })()
    + secEntries.map(([sec, list]) => {
      const meta = sectionMeta(sec);
      const heading = meta ? 'Chapter ' + meta.n + ' — ' + meta.title : shortSection(sec);
      return '<section class="card practice-chapter-card plp-cream-box plp-hub-chapter">'
        + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">' + (meta ? 'CHAPTER ' + String(meta.n).padStart(2, '0') : 'HANDBOOK SECTION') + '</span><span class="plp-ribbon-tag">' + list.length + ' PRACTICE SET' + (list.length === 1 ? '' : 'S') + '</span></div>'
        + '<div class="plp-hub-chapter-body">'
        + '<div class="practice-chapter-head"><div><h2>' + esc(heading) + '</h2><p class="muted">Practice questions drawn from this chapter.</p></div></div>'
        + '<div class="practice-form-tiles plp-form-tiles">'
        + list.map((f, idx) => {
          const attempts = results.filter((r) => r && r.formId === 'form:' + f.form_id);
          const latest = attempts.length ? attempts[attempts.length - 1] : null;
          const cleanName = 'Practice Set ' + String.fromCharCode(65 + idx);
          const hasTry = Boolean(latest && Array.isArray(latest.answers));
          return '<div class="practice-form-tile plp-form-tile">'
            + '<div class="plp-form-tile-meta">'
            + '<div class="plp-form-tile-top"><h3>' + esc(cleanName) + '</h3>'
            + (hasTry ? '<span class="plp-try-pill is-done">Latest: ' + latest.correctCount + '/' + latest.answers.length + '</span>' : '<span class="plp-try-pill">Ready</span>')
            + '</div>'
            + '<p class="muted">' + (f.item_ids || []).length + ' questions' + (hasTry ? ' · Latest try: ' + latest.correctCount + ' of ' + latest.answers.length : '') + '</p>'
            + '</div>'
            + '<a class="btn plp-quiz-cta plp-set-cta" href="' + P() + 'practice/' + esc(f.form_id) + '">' + (latest ? 'Retake ' : 'Start ') + esc(cleanName) + ' ' + hubIcon('arrow') + '</a>'
            + '</div>';
        }).join('')
        + '</div></div></section>';
    }).join('')
    + '</div>'
    + '</div>';
}

function vResults(attemptId) {
  const r = getResult(attemptId);
  if (!r) return '<header class="course-hero"><p class="course-kicker">PRACTICE SUMMARY</p><h1>Results</h1></header><div class="card"><p>No practice attempt <code>' + esc(attemptId) + '</code> is stored in this browser. Scores live only here, on this device.</p><p><a class="btn" href="' + P() + 'practice">Take a practice test</a></p></div>';
  const missed = r.answers.filter((a) => !a.correct);
  const pct = r.answers.length ? Math.round(r.correctCount / r.answers.length * 100) : 0;
  const dateLabel = r.takenAt ? String(r.takenAt).slice(0, 10) : '';
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const stateBadge = stateCode ? (stateCode + " · " + stateTitle.toUpperCase()) : stateTitle.toUpperCase();

  return '<nav class="course-breadcrumb" aria-label="Breadcrumb"><a href="' + P() + 'practice">Practice tests</a><span aria-hidden="true">/</span><span aria-current="page">Attempt summary</span></nav>'
    + '<div class="plp-deck is-plp-results" data-plp-theme="' + baseTheme + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame">'
    + '<div class="plp-quest-top">'
    + '<span class="plp-mobile-meta">' + esc(stateCode ? stateCode + ' · ' : '') + 'SCORE ' + r.correctCount + '/' + r.answers.length + '</span>'
    + '<div class="plp-quest-badges">'
    + '<span class="plp-badge-gold">' + esc(stateBadge) + '</span>'
    + '<span class="plp-badge-navy">OBSERVED PRACTICE SUMMARY</span>'
    + '<span class="plp-badge-pos">' + pct + '% MATCHED</span>'
    + '</div>'
    + '</div>'
    + '<div class="plp-sticker-row"><span class="plp-chapter-sticker">ATTEMPT REVIEW</span></div>'
    + '<h1>' + esc(r.title) + '</h1>'
    + '</header>'
    + '<div class="card score-hero-card plp-cream-box plp-score-card">'
    + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">OBSERVED ATTEMPT SCORE</span><span class="plp-ribbon-tag">' + pct + '%</span></div>'
    + '<div class="score-hero-main plp-score-body"><div class="score-big">' + r.correctCount + '<span> of ' + r.answers.length + '</span></div>'
    + '<p class="score-caption">You answered <b>' + r.correctCount + ' of ' + r.answers.length + '</b> (' + pct + '%) in this practice set' + (dateLabel ? ', taken ' + esc(dateLabel) : '') + '.</p>'
    + '<div class="plp-mint-track plp-score-track"><span class="plp-mint-fill" style="width:' + pct + '%"></span></div>'
    + '<p class="muted score-disclaimer">This describes observed practice only — never licensing eligibility, driving competence, or predicted success.</p></div></div>'
    + (missed.length ? '<section class="missed-review-section plp-missed-list"><div class="plp-missed-header"><h2>Review these next (' + missed.length + ')</h2><span>Focus on the official handbook rule</span></div>'
      + missed.map((a) => {
        const hasOptWhy = (a.options || []).some((o) => o && o.rationale);
        const opts = hasOptWhy
          ? (a.options || []).map((o) => '<li class="' + (o.key === a.key ? 'is-right' : o.key === a.picked ? 'is-picked' : '') + '"><b>' + esc(o.key) + '.</b> ' + esc(o.text) + (o.rationale ? ' — <span class="muted">' + esc(o.rationale) + '</span>' : '') + '</li>').join("")
          : '';
        const vHtml = !a.signImg && window.NovaGate && window.NovaGate.visualForItem ? window.NovaGate.visualForItem(ST, a.itemId, a.factIds || []) : '';
        return '<article class="card missed-item-card plp-cream-box plp-missed-card">'
          + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">MISSED QUESTION</span><span class="plp-ribbon-tag">CORRECT: ' + esc(a.key) + '</span></div>'
          + '<div class="plp-missed-body">'
          + (a.signImg ? '<div class="plp-sign-q-frame is-missed-sign"><img src="' + esc(a.signImg) + '" alt="Road sign"></div>' : '')
          + '<h3 data-fill-blank>' + esc(a.stem) + '</h3>'
          + '<p class="missed-verdict">You chose <b>' + esc(a.picked || "(no answer)") + '</b> · Correct answer: <b>' + esc(a.key) + '</b></p>'
          + '<div class="plp-rule-panel"><span class="plp-panel-label">OFFICIAL HANDBOOK EXPLANATION</span><p class="plp-rule-text">' + esc(a.why) + '</p></div>'
          + (opts ? '<details class="plp-coach-panel plp-opt-breakdown" open><summary class="plp-panel-label">All option explanations</summary><ul class="feedback-options">' + opts + '</ul></details>' : '')
          + (vHtml ? '<details class="plp-coach-panel plp-explain-visual-panel"><summary class="plp-panel-label">Visual reference (optional)</summary><div class="plp-explain-visual">' + vHtml + '</div></details>' : '')
          + '</div></article>';
      }).join("") + '</section>'
      : '<div class="card clean-sweep-card plp-cream-box plp-score-card"><div class="plp-score-body"><h2>Clean sweep — every answer matched</h2><p>Every question in this set matched the official handbook. Revisit flashcards tomorrow to keep recall sharp.</p></div></div>')
    + '<div class="plp-recap-actions plp-results-actions">'
    + (String(r.formId || '').startsWith('signs:') ? '<a class="btn plp-quiz-cta" href="' + P() + 'signs/test">Retake sign test ' + hubIcon('arrow') + '</a> <a class="btn secondary-btn plp-hub-cta" href="' + P() + 'signs">Road signs hub</a> ' : '<a class="btn plp-quiz-cta" href="' + P() + 'practice">More practice tests ' + hubIcon('arrow') + '</a> ')
    + '<a class="btn secondary-btn plp-hub-cta" href="' + P() + 'chapters">Browse chapters</a></div>'
    + '</div>';
}

function vSettings() {
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";
  return '<div class="plp-deck is-plp-hub is-plp-settings" data-plp-theme="' + esc(baseTheme) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + P() + '">Overview</a><span class="plp-badge-pos">' + esc(stateCode || 'Course') + '</span></div>'
    + '<h1>Settings and about</h1>'
    + '<p class="plp-quest-sub">' + esc(ST.handbook) + ' · ' + esc(ST.test) + '</p>'
    + '</header>'
    + '<div class="settings-grid plp-settings-grid">'
    + '<div class="card plp-cream-box plp-settings-card"><div class="plp-hub-chapter-body"><h2>Your course</h2><p><b>' + esc(ST.handbook) + '</b></p><p>Chapter 1 is free in every state. Unlocking the full state course is a one-time $9.99 purchase for one year — never a recurring subscription.</p><p class="muted">Practice only; independent review is in progress. Not affiliated with any state licensing agency.</p><p class="plp-settings-actions"><a class="btn secondary-btn" href="' + P() + 'dossier">Handbook sources</a> <a class="btn secondary-btn" href="#/">Switch state</a></p></div></div>'
    + '<div class="card plp-cream-box plp-settings-card"><div class="plp-hub-chapter-body"><h2>Progress on this device</h2><p>Your completed lessons, flashcard visits, and practice attempts are saved locally in this browser for ' + esc(ST.name) + '.</p><p class="plp-settings-actions"><button id="reset-progress" class="secondary">Erase my study progress</button></p></div></div>'
    + '</div></div>';
}

function vMissing() {
  return '<header class="course-hero"><p class="course-kicker">NOT FOUND</p><h1>Nothing here</h1></header><div class="card"><p>That module or unit is not part of this course.</p><p><a class="btn" href="' + P() + 'chapters">Browse all chapters</a></p></div>';
}`);

  // Upgraded quiz grader with Neo-Pop score summary card, filter tabs, and road sign support
  between('function realGradeQuiz(form, formId, title) {', 'function synthGradeQuiz(form, formId, title) {', String.raw`function realGradeQuiz(form, formId, title) {
  form.classList.add("is-graded");
  const isMobile = typeof window !== "undefined" && typeof window.innerWidth === "number" && window.innerWidth <= 768;
  const answers = [];
  form.querySelectorAll("[data-ritem]").forEach((box) => {
    const correct = box.dataset.correct;
    const why = box.dataset.why || "";
    const stem = box.dataset.stem || box.dataset.ritem;
    const signImg = box.dataset.signImg || "";
    const factIds = (box.dataset.factIds || "").split(",").filter(Boolean);
    const pickedBtn = box.querySelector(".option[aria-pressed='true']");
    const picked = pickedBtn ? pickedBtn.dataset.key : null;
    const ok = picked === correct;
    box.dataset.gradedOutcome = ok ? "correct" : "missed";
    const qState = box.querySelector("[data-q-state]");
    if (qState) qState.textContent = ok ? "✓ CORRECT" : ("✗ ANSWER: " + correct);
    const options = [];
    box.querySelectorAll(".option").forEach((b) => {
      options.push({ key: b.dataset.key, text: b.dataset.otext || b.textContent || "", rationale: b.dataset.orationale || "" });
    });
    answers.push({ itemId: box.dataset.ritem, signImg, factIds, picked, correct: ok, stem, why, key: correct, options });
    const fb = box.querySelector("[data-feedback]");
    fb.hidden = false;
    const visualRaw = signImg ? "" : (window.NovaGate && window.NovaGate.visualForItem
      ? window.NovaGate.visualForItem(ST, box.dataset.ritem, factIds)
      : (window.NovaGate && window.NovaGate.signForFacts ? window.NovaGate.signForFacts(ST, factIds) : ""));
    const visualHtml = visualRaw
      ? '<details class="plp-coach-panel plp-explain-visual-panel"><summary class="plp-panel-label">Visual reference (optional)</summary><div class="plp-explain-visual">' + visualRaw + '</div></details>'
      : "";
    const hasOptWhy = options.some((o) => o && o.rationale);
    const optLines = hasOptWhy
      ? options.map((o) => '<li class="' + (o.key === correct ? 'is-right' : o.key === picked ? 'is-picked' : '') + '"><b>' + esc(o.key) + '.</b> ' + esc(o.text) + (o.rationale ? ' — <span class="muted">' + esc(o.rationale) + '</span>' : '') + '</li>').join("")
      : "";
    fb.innerHTML = (picked
      ? (ok ? '<p class="result-good plp-verdict-pill is-good">✓ Correct — option ' + esc(correct) + '</p>' : '<p class="result-bad plp-verdict-pill is-bad">✗ You chose ' + esc(picked) + ' · Correct answer: ' + esc(correct) + '</p>')
      : '<p class="result-bad plp-verdict-pill is-bad">No answer chosen · Correct answer: ' + esc(correct) + '</p>')
      + '<div class="plp-rule-panel feedback-why-box"><span class="plp-panel-label">' + (signImg ? 'WHY ' + esc(correct) + ' IS RIGHT' : 'WHY ' + esc(correct) + ' MATCHES THE HANDBOOK') + '</span><p class="plp-rule-text">' + esc(why) + '</p></div>'
      + (optLines ? '<details class="plp-coach-panel plp-opt-breakdown" data-plp-breakdown' + (isMobile ? '' : ' open') + '><summary class="plp-panel-label">All option explanations</summary><ul class="feedback-options">' + optLines + '</ul></details>' : '')
      + visualHtml;
    box.querySelectorAll(".option").forEach((b) => {
      b.disabled = true;
      if (b.dataset.key === correct) b.classList.add("picked-correct");
      else if (b.getAttribute("aria-pressed") === "true") b.classList.add("picked-wrong");
      else b.classList.add("dim");
    });
  });
  const correctCount = answers.filter((a) => a.correct).length;
  const missedCount = answers.length - correctCount;
  const pct = answers.length ? Math.round(correctCount / answers.length * 100) : 0;
  const attemptId = "attempt-" + Date.now().toString(36);
  saveResult({ attemptId, formId, title, answers, correctCount, takenAt: new Date().toISOString() });
  if (String(formId || "").startsWith("signs:") && ST) ensureSignSeed(ST.code, true);
  if (view && view.querySelector && view.querySelector(".step-bar") && lastSub) refreshStepBar(lastSub);
  syncSessionChrome(ST, lastSub);
  const submitBar = form.querySelector("[data-quiz-submit-bar]");
  if (submitBar) submitBar.hidden = true;
  const deckWrap = form.closest(".plp-deck");
  if (deckWrap) {
    const qBar = deckWrap.querySelector("[data-plp-quiz-bar]");
    if (qBar) qBar.hidden = true;
    const posEl = deckWrap.querySelector("[data-plp-pos]");
    if (posEl) posEl.textContent = "Score: " + correctCount + " of " + answers.length;
    const mobPos = deckWrap.querySelector("[data-plp-mobile-pos]");
    if (mobPos) {
      const pfx = mobPos.getAttribute("data-plp-mobile-prefix") || "";
      mobPos.textContent = (pfx ? pfx + " · " : "") + "SCORE " + correctCount + "/" + answers.length;
    }
    const xpFill = deckWrap.querySelector("[data-plp-xp-fill]");
    if (xpFill) xpFill.style.width = pct + "%";
    const xpVal = deckWrap.querySelector("[data-plp-xp-val]");
    if (xpVal) xpVal.textContent = correctCount + " / " + answers.length + " (" + pct + "%)";
  }
  const sumBox = form.querySelector("[data-summary]");
  sumBox.innerHTML = '<div class="card score-hero-card plp-cream-box plp-score-card">'
    + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">QUIZ COMPLETE · OBSERVED PRACTICE</span><span class="plp-ribbon-tag">' + pct + '% MATCHED</span></div>'
    + '<div class="score-hero-main plp-score-body">'
    + '<h2>You answered ' + correctCount + ' of ' + answers.length + ' (' + pct + '%)</h2>'
    + '<div class="plp-mint-track plp-score-track"><span class="plp-mint-fill" style="width:' + pct + '%"></span></div>'
    + '<p class="muted">Observed practice only — never licensing eligibility or predicted success.</p>'
    + '<div class="score-summary-actions">'
    + (missedCount > 0 ? '<div class="quiz-filter-pills" role="group" aria-label="Filter reviewed questions"><button type="button" class="filter-chip plp-filter-pill is-active" data-quiz-filter="all">All (' + answers.length + ')</button><button type="button" class="filter-chip plp-filter-pill" data-quiz-filter="missed">Missed (' + missedCount + ')</button></div>' : '')
    + '<div class="score-links"><button type="button" class="btn secondary-btn plp-hub-cta" data-quiz-retake>↻ Retake this set</button><a class="btn plp-quiz-cta" href="' + P() + 'results/' + attemptId + '">Summary &amp; next steps ' + hubIcon('arrow') + '</a></div>'
    + '</div></div></div>';
  sumBox.querySelectorAll("[data-quiz-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      sumBox.querySelectorAll("[data-quiz-filter]").forEach((b) => b.classList.toggle("is-active", b === btn));
      const mode = btn.dataset.quizFilter;
      form.querySelectorAll("[data-ritem]").forEach((box) => {
        box.hidden = mode === "missed" && box.dataset.gradedOutcome === "correct";
      });
    });
  });
  const retake = sumBox.querySelector("[data-quiz-retake]");
  if (retake) retake.addEventListener("click", () => route());
  sumBox.scrollIntoView({ behavior: "smooth", block: "start" });
}`);

  // Neo-Pop Module Step Bar + Video Theater (#/<st>/lesson/:unit on video states) + Page-Flip Reading flow
  between('const STEP_ROUTES = new Set(["lesson", "cards", "quiz"]);', '// STORE PATCH: read-only view helpers handed to gate.js.', String.raw`const STEP_ROUTES = new Set(["lesson", "read", "cards", "quiz"]);
const VIDEO_CACHE = {};
function stateSupportsVideo(s) {
  if (!s || !s.code) return false;
  if (typeof window !== "undefined" && window.NovaGate && window.NovaGate.hasVideo && window.NovaGate.hasVideo(s.code)) return true;
  if (typeof window !== "undefined" && Array.isArray(window.__PLP_VIDEO_STATES)) return window.__PLP_VIDEO_STATES.includes(s.code);
  if (s.code === "ND") return true;
  const cached = VIDEO_CACHE[s.code];
  return !!(cached && typeof cached.then !== "function" && cached.units);
}
function ensureVideoManifest(s) {
  if (!s) return Promise.resolve(null);
  const v = VIDEO_CACHE[s.code];
  if (v === null || (v && typeof v.then !== "function")) return Promise.resolve(v);
  if (v) return v;
  const root = trimSlash(s.video_root || ("video/" + slugOf(s)));
  const p = fetch(root + "/video-manifest.json", { cache: "no-store" })
    .then((r) => (r.ok ? r.json() : null)).catch(() => null)
    .then((m) => { VIDEO_CACHE[s.code] = m && m.units ? { ...m, root } : null; return VIDEO_CACHE[s.code]; });
  VIDEO_CACHE[s.code] = p;
  return p;
}
const fmtTime = (t) => { t = Math.max(0, Math.round(Number(t) || 0)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); };

function stepInfo(unitId) {
  const moduleId = moduleForUnit(unitId);
  const m = moduleId ? modulesReal().find((x) => x.module_id === moduleId) : null;
  const saved = store.read();
  const prog = (saved.progress || {})[unitId] || {};
  const quiz = moduleQuizForUnit(unitId);
  const quizDone = !!quiz && Object.values(saved.results || {}).some((r) => r && r.formId === "quiz:" + quiz.quiz_id);
  const hasUnit = !!sessionUnit(unitId);
  const hasVideo = stateSupportsVideo(ST) && hasUnit;
  return {
    moduleId,
    module: m,
    hasVideo,
    hasRead: hasUnit,
    hasCards: deckForUnit(unitId).length > 0,
    hasQuiz: !!quiz,
    videoDone: !!prog.lesson,
    readDone: !!(prog.read || (!hasVideo && prog.lesson)),
    cardsDone: !!prog.cards,
    quizDone
  };
}

function renderStepBar(sub) {
  if (!view || !view.appendChild || !document.createElement) return;
  const rawP0 = sub[0];
  if (rawP0 === "signs") {
    const saved = store.read();
    const prog = (saved.progress || {}).__signs__ || {};
    const quizDone = Object.values(saved.results || {}).some((r) => r && String(r.formId || "").startsWith("signs:"));
    const curKey = sub[1] === "cards" ? "cards" : sub[1] === "test" ? "quiz" : "lesson";
    const steps = [
      { key: "lesson", label: "Lesson", href: P() + "signs", has: true, done: !!prog.lesson },
      { key: "cards", label: "Flashcards", href: P() + "signs/cards", has: true, done: !!prog.cards },
      { key: "quiz", label: "Quiz", href: P() + "signs/test", has: true, done: quizDone }
    ];
    const idx = steps.findIndex((s) => s.key === curKey);
    const cur = idx >= 0 ? steps[idx] : steps[0];
    const next = steps.slice((idx >= 0 ? idx : 0) + 1).find((s) => s.has);
    const hubHref = P() + "chapters";
    const bar = document.createElement("nav");
    bar.className = "step-bar plp-step-bar";
    bar.setAttribute("aria-label", "Module steps");
    bar.innerHTML = '<div class="sb-steps">'
      + steps.map((s, i) => (i ? '<span class="sb-sep" aria-hidden="true">→</span>' : '')
        + '<a class="sb-step" href="' + esc(s.href) + '" data-state="' + (s.key === curKey ? "current" : s.done ? "done" : "todo") + '"'
        + (s.key === curKey ? ' aria-current="step"' : '')
        + '><span class="sb-dot" aria-hidden="true">' + (s.done && s.key !== curKey ? "✓" : (i + 1)) + '</span><span class="sb-label">' + esc(s.label) + '</span></a>').join('')
      + '</div>'
      + '<div class="sb-actions"><a class="btn secondary-btn plp-sb-hub" href="' + esc(hubHref) + '">Chapters</a>'
      + (curKey !== "quiz" && cur && !cur.done ? '<button class="btn secondary-btn plp-sb-mark" type="button" data-mark-done="' + esc(curKey) + '">✓ Mark done</button>' : '')
      + '<a class="btn plp-sb-next" href="' + esc(next ? next.href : hubHref) + '" data-next-step>' + esc(next ? "Next: " + next.label : "Finish module") + ' →</a></div>';
    view.appendChild(bar);
    const mark = bar.querySelector("[data-mark-done]");
    if (mark) {
      mark.addEventListener("click", () => {
        markDone("__signs__", curKey);
        refreshStepBar(sub);
      });
    }
    return;
  }
  const unitId = decodeURIComponent(sub[1] || "");
  const info = stepInfo(unitId);
  if (!info.module) return;
  const p0 = (!info.hasVideo && rawP0 === "lesson") ? "read" : rawP0;
  const steps = info.hasVideo
    ? [
        { key: "lesson", label: "Video", href: P() + "lesson/" + encodeURIComponent(unitId), has: info.hasVideo, done: info.videoDone },
        { key: "read", label: "Reading", href: P() + "read/" + encodeURIComponent(unitId), has: info.hasRead, done: info.readDone },
        { key: "cards", label: "Flashcards", href: P() + "cards/" + encodeURIComponent(unitId), has: info.hasCards, done: info.cardsDone },
        { key: "quiz", label: "Quiz", href: P() + "quiz/" + encodeURIComponent(unitId), has: info.hasQuiz, done: info.quizDone }
      ]
    : [
        { key: "read", label: "Reading", href: P() + "read/" + encodeURIComponent(unitId), has: info.hasRead, done: info.readDone },
        { key: "cards", label: "Flashcards", href: P() + "cards/" + encodeURIComponent(unitId), has: info.hasCards, done: info.cardsDone },
        { key: "quiz", label: "Quiz", href: P() + "quiz/" + encodeURIComponent(unitId), has: info.hasQuiz, done: info.quizDone }
      ];
  const idx = steps.findIndex((s) => s.key === p0);
  const cur = idx >= 0 ? steps[idx] : steps[0];
  const next = steps.slice((idx >= 0 ? idx : 0) + 1).find((s) => s.has);
  const hubHref = P() + "module/" + encodeURIComponent(info.moduleId);
  const bar = document.createElement("nav");
  bar.className = "step-bar plp-step-bar";
  bar.setAttribute("aria-label", "Module steps");
  bar.innerHTML = '<div class="sb-steps">'
    + steps.map((s, i) => (i ? '<span class="sb-sep" aria-hidden="true">→</span>' : '')
      + '<a class="sb-step" href="' + esc(s.href) + '" data-state="' + (s.key === p0 ? "current" : s.done ? "done" : "todo") + '"'
      + (s.has ? "" : ' aria-disabled="true"') + (s.key === p0 ? ' aria-current="step"' : '')
      + '><span class="sb-dot" aria-hidden="true">' + (s.done && s.key !== p0 ? "✓" : (i + 1)) + '</span><span class="sb-label">' + esc(s.label) + '</span></a>').join('')
    + '</div>'
    + '<div class="sb-actions"><a class="btn secondary-btn plp-sb-hub" href="' + esc(hubHref) + '">Module Hub</a>'
    + (p0 !== "quiz" && cur && !cur.done ? '<button class="btn secondary-btn plp-sb-mark" type="button" data-mark-done="' + esc(p0) + '">✓ Mark done</button>' : '')
    + '<a class="btn plp-sb-next" href="' + esc(next ? next.href : hubHref) + '" data-next-step>' + esc(next ? "Next: " + next.label : "Finish module") + ' →</a></div>';
  view.appendChild(bar);
  const mark = bar.querySelector("[data-mark-done]");
  if (mark) {
    mark.addEventListener("click", () => {
      markDone(unitId, p0);
      if (p0 === "read" && !info.hasVideo) markDone(unitId, "lesson");
      refreshStepBar(sub);
    });
  }
}
function refreshStepBar(sub) {
  if (!view || !view.querySelector) return;
  const old = view.querySelector(".step-bar");
  if (old) old.remove();
  renderStepBar(sub);
  syncSessionChrome(ST, sub);
}

let lpKeyHandler = null;
let READER = null, PLAYER = null;

function renderLessonPlayer(unitId, sub) {
  if (!view || !view.prepend || !view.appendChild || !document.createElement) return;
  const vm = VIDEO_CACHE[ST && ST.code];
  if (!vm || typeof vm.then === "function" || !vm.units || !vm.units[unitId]) return;
  if (view.querySelector(".is-plp-video")) return;
  if (lpKeyHandler) { document.removeEventListener("keydown", lpKeyHandler); lpKeyHandler = null; }

  const u = vm.units[unitId];
  const unit = sessionUnit(unitId);
  const moduleId = moduleForUnit(unitId);
  const secId = sectionOfUnit(unitId);
  const meta = secId ? sectionMeta(secId) : null;
  const modList = secId ? modulesReal(secId) : [];
  const modIndex = moduleId ? modList.findIndex((x) => x.module_id === moduleId) + 1 : 0;
  const rawTitle = (unit && unit.title && unit.title.text) || u.title || "Lesson";
  const cleanTitle = hubCleanTitle(rawTitle, modIndex);
  const slides = u.slides || [];
  const total = Number(u.duration) || 0;

  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const chNum = (meta && meta.n) || 1;
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const themeKey = themes[(themes.indexOf(baseTheme) + Math.max(1, chNum) - 1) % themes.length];
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const mobPrefix = meta ? ("CH " + String(meta.n).padStart(2, "0") + (modIndex ? " · M " + String(modIndex).padStart(2, "0") : "")) : stateCode;
  const saved = store.read();
  const alreadyWatched = !!((saved.progress || {})[unitId] && saved.progress[unitId].lesson);

  const segLabels = hubLessonSegmentLabels(unit, slides);
  const label = (i) => segLabels[i] || ("Segment " + (i + 1));

  [...view.children].forEach((c) => {
    if (!c.classList.contains("step-bar")) c.remove();
  });

  const studyCrumb = hubStudyCrumb(meta, stateTitle, stateTitle);
  const crumbHref = meta ? (P() + 'chapter/' + esc(meta.id)) : (P() + 'chapters');
  const deck = document.createElement("div");
  deck.className = "plp-deck is-plp-video";
  deck.setAttribute("data-plp-theme", themeKey);
  deck.setAttribute("data-plp-state", stateCode);
  deck.innerHTML = '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + crumbHref + '">' + esc(studyCrumb) + '</a><span class="plp-badge-pos" data-video-pos>Segment 1 of ' + Math.max(1, slides.length) + '</span></div>'
    + '<h1>' + esc(cleanTitle) + '</h1>'
    + '</header>'
    + '<section class="card plp-card-stage plp-video-stage lesson-player" aria-label="Lesson video">'
    + '<div class="plp-cream-box is-video-box">'
    + '<div class="lp-stage"><video playsinline preload="metadata" controls controlslist="nodownload"' + (u.poster ? ' poster="' + esc(u.poster) + '"' : '') + ' src="' + esc(u.file) + '"></video></div>'
    + '<div class="lp-progress" aria-hidden="true"><div class="lp-fill"></div>' + (total ? slides.map((s) => '<span class="lp-tick" style="left:' + (100 * (Number(s.start) || 0) / total).toFixed(2) + '%"></span>').join('') : '') + '</div>'
    + '<div class="lp-bar">'
    + '<button type="button" class="btn plp-video-play" data-lp-play>▶ Watch lesson</button>'
    + '<button type="button" class="secondary lp-skip-btn" data-lp-back title="Back 10 seconds">↶ 10s</button>'
    + '<button type="button" class="secondary lp-skip-btn" data-lp-fwd title="Forward 10 seconds">10s ↷</button>'
    + '<span class="lp-spacer"></span>'
    + '<label class="lp-meta lp-speed-label">Speed <select data-lp-rate><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option></select></label>'
    + '</div>'
    + '<div class="lp-chapters" aria-label="Video segments">' + slides.map((s, i) => '<button type="button" class="plp-video-seg" data-lp-idx="' + i + '" data-lp-seek="' + (Number(s.start) || 0) + '" aria-current="' + (i === 0 ? "true" : "false") + '"><span class="plp-seg-num">' + (i + 1) + '</span><span class="plp-seg-text">' + esc(label(i)) + '</span></button>').join('') + '</div>'
    + '<div class="lp-done"' + (alreadyWatched ? '' : ' hidden') + '>✓ Video lesson watched — continue to Page-Flip Reading next!</div>'
    + '<div class="plp-video-actions">'
    + '<a class="btn plp-quiz-cta" href="' + P() + 'read/' + encodeURIComponent(unitId) + '">Continue to Reading ' + hubIcon('arrow') + '</a>'
    + (!alreadyWatched ? '<button type="button" class="btn secondary-btn plp-hub-cta" data-lp-mark-watched>✓ Mark watched</button>' : '')
    + (moduleId ? '<a class="btn secondary-btn plp-hub-cta" href="' + P() + 'module/' + encodeURIComponent(moduleId) + '">Module Hub</a>' : '')
    + '</div>'
    + '</div></section>';

  const stepBarEl = view.querySelector(".step-bar");
  if (stepBarEl) view.insertBefore(deck, stepBarEl);
  else view.appendChild(deck);

  const video = deck.querySelector("video"), fill = deck.querySelector(".lp-fill"), playBtn = deck.querySelector("[data-lp-play]");
  const posEl = deck.querySelector("[data-video-pos]");
  const chapters = [...deck.querySelectorAll("[data-lp-idx]")];
  const markWatchedBtn = deck.querySelector("[data-lp-mark-watched]");
  let active = -1, finished = alreadyWatched;
  const idxAt = (t) => { let i = 0; for (let k = 0; k < slides.length; k++) if (t + 0.05 >= (Number(slides[k].start) || 0)) i = k; return i; };
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    chapters.forEach((b, k) => b.setAttribute("aria-current", k === i ? "true" : "false"));
    if (posEl) posEl.textContent = "Segment " + (i + 1) + " of " + Math.max(1, slides.length);
  };
  const completeVideo = () => {
    finished = true;
    markDone(unitId, "lesson");
    if (window.NovaGate && window.NovaGate.trackLessonComplete) window.NovaGate.trackLessonComplete(ST);
    const doneBanner = deck.querySelector(".lp-done");
    if (doneBanner) doneBanner.hidden = false;
    if (markWatchedBtn) markWatchedBtn.hidden = true;
    refreshStepBar(sub);
  };
  PLAYER = { video, seek: (i) => { const s = slides[i]; if (s) video.currentTime = Number(s.start) || 0; } };
  video.addEventListener("timeupdate", () => { if (total) fill.style.width = Math.min(100, 100 * video.currentTime / total).toFixed(2) + "%"; setActive(idxAt(video.currentTime)); });
  video.addEventListener("play", () => { stopAudio(); playBtn.textContent = "⏸ Pause video"; });
  video.addEventListener("pause", () => { playBtn.textContent = video.ended ? "↻ Replay video" : "▶ Resume video"; });
  video.addEventListener("ended", () => { completeVideo(); playBtn.textContent = "↻ Replay video"; });
  video.addEventListener("error", () => { deck.querySelector(".lp-stage").insertAdjacentHTML("beforeend", '<p class="muted" style="color:#fff;padding:12px">This lesson\'s video is not available right now. Continue to the Reading module next.</p>'); });
  playBtn.addEventListener("click", () => { if (video.paused) { if (finished && video.ended) video.currentTime = 0; video.play().catch(() => {}); } else video.pause(); });
  deck.querySelector("[data-lp-back]").addEventListener("click", () => { video.currentTime = Math.max(0, video.currentTime - 10); });
  deck.querySelector("[data-lp-fwd]").addEventListener("click", () => { video.currentTime = Math.min(total || video.duration || 1e9, video.currentTime + 10); });
  deck.querySelector("[data-lp-rate]").addEventListener("change", (e) => { video.playbackRate = Number(e.target.value) || 1; });
  if (markWatchedBtn) markWatchedBtn.addEventListener("click", completeVideo);
  chapters.forEach((b) => b.addEventListener("click", () => { video.currentTime = Number(b.dataset.lpSeek) || 0; setActive(Number(b.dataset.lpIdx)); if (video.paused) video.play().catch(() => {}); }));
  lpKeyHandler = (e) => {
    const tag = (e.target && e.target.tagName) || "";
    if (/^(INPUT|SELECT|TEXTAREA|BUTTON|A)$/.test(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === " " || e.key === "k") { e.preventDefault(); playBtn.click(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); video.currentTime = Math.max(0, video.currentTime - 10); }
    else if (e.key === "ArrowRight") { e.preventDefault(); video.currentTime = Math.min(total || video.duration || 1e9, video.currentTime + 10); }
    else if (e.key === "j" || e.key === "l") { e.preventDefault(); const n = Math.max(0, Math.min(slides.length - 1, active + (e.key === "l" ? 1 : -1))); chapters[n] && chapters[n].click(); }
  };
  document.addEventListener("keydown", lpKeyHandler);
  setActive(0);
}

let stepProgressListener = null;
function enhanceStudyFlow(sub) {
  READER = null; PLAYER = null;
  if (lpKeyHandler) { document.removeEventListener("keydown", lpKeyHandler); lpKeyHandler = null; }
  if (stepProgressListener && view && view.removeEventListener) {
    view.removeEventListener("nova:progress-updated", stepProgressListener);
    stepProgressListener = null;
  }
  if (!view || !view.prepend || !view.appendChild || !document.createElement) return;
  if (!ST || !sub || !sub[0]) return;
  const p0 = sub[0];
  if (p0 === "signs") {
    if (view.querySelector("[data-gate-buy]")) return;
    try { renderStepBar(sub); } catch (e) { console.warn("step bar:", e); }
    stepProgressListener = () => refreshStepBar(sub);
    if (view.addEventListener) view.addEventListener("nova:progress-updated", stepProgressListener);
    return;
  }
  const unitId = decodeURIComponent(sub[1] || "");
  if (!STEP_ROUTES.has(p0) || !unitId) return;
  if (view.querySelector("[data-gate-buy]")) return;

  const upgradeToRead = () => {
    view.innerHTML = vRead(unitId);
    wire(["read", unitId]);
    if (window.NovaGate) window.NovaGate.mount(ST, ["read", unitId], view, GATE_VIEW);
  };

  if (p0 === "lesson" && !stateSupportsVideo(ST)) {
    upgradeToRead();
    try { renderStepBar(["read", unitId]); } catch (e) { console.warn("step bar:", e); }
    syncSessionChrome(ST, ["read", unitId]);
    stepProgressListener = () => refreshStepBar(["read", unitId]);
    if (view.addEventListener) view.addEventListener("nova:progress-updated", stepProgressListener);
    return;
  }

  try { renderStepBar(sub); } catch (e) { console.warn("step bar:", e); }
  stepProgressListener = () => refreshStepBar(sub);
  if (view.addEventListener) view.addEventListener("nova:progress-updated", stepProgressListener);

  if (p0 === "lesson") {
    const gen = routeGen;
    ensureVideoManifest(ST).then((vm) => {
      if (gen !== routeGen) return;
      if (view.querySelector("[data-gate-buy]")) return;
      if (vm && vm.units && vm.units[unitId]) {
        try { renderLessonPlayer(unitId, sub); } catch (e) { console.warn("lesson player:", e); }
      } else {
        upgradeToRead();
        try { refreshStepBar(["read", unitId]); } catch (e) {}
      }
    });
  }
}`);

  // Unified header chrome + focused study-session header mode
  between('function setChrome(navState, nav) {', 'let routeGen = 0;', String.raw`let lastNavState = null, lastSub = null;
function setChrome(navState, nav) {
  const label = navState ? ((navState.short_title || navState.name + " Driver Handbook") + " — PassLearnersPermit") : "PassLearnersPermit — Official State Handbook Permit Prep";
  try { document.title = label; } catch { /* no-op */ }
  document.querySelectorAll("nav.main a").forEach((a) => {
    const k = a.dataset.nav;
    if (k === "store") {
      a.hidden = !!navState;
    } else if (k !== "states") {
      if (navState) { a.hidden = false; a.setAttribute("href", "#/" + slugOf(navState) + "/" + (k === "home" ? "" : k)); }
      else a.hidden = true;
    }
    if (k === nav) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function syncSessionChrome(navState, sub) {
  lastNavState = navState;
  lastSub = sub;
  if (typeof document === "undefined" || !document.getElementById) return;
  const brandSub = document.getElementById("brand-sub");
  const mainNav = document.querySelector && document.querySelector("nav.main");
  const sessBar = document.getElementById("session-header-bar");
  const isGated = !!(view && view.querySelector && view.querySelector("[data-gate-buy]"));
  const p0 = (sub && sub[0]) || "";
  const rawId = decodeURIComponent((sub && sub[1]) || "");
  const isUnitSession = !!(navState && STEP_ROUTES.has(p0) && rawId && !isGated && ST && ST.code === navState.code);
  const isSignsSession = !!(navState && p0 === "signs" && !isGated && ST && ST.code === navState.code);
  const isPracticeSession = !!(navState && p0 === "practice" && rawId && !isGated && ST && ST.code === navState.code);
  const inSession = isUnitSession || isSignsSession || isPracticeSession;

  if (document.body && document.body.classList) {
    document.body.classList.toggle("is-study-session", inSession);
  }

  if (brandSub) {
    if (!navState) {
      brandSub.textContent = "50 STATES + D.C. · CH. 1 FREE";
    } else if (isSignsSession) {
      brandSub.textContent = navState.code + " · ROAD SIGNS · FREE";
    } else if (isUnitSession) {
      const secId = sectionOfUnit(rawId);
      const meta = secId ? sectionMeta(secId) : null;
      const modId = moduleForUnit(rawId);
      const modIdx = modId && secId ? modulesReal(secId).findIndex((x) => x.module_id === modId) + 1 : 0;
      brandSub.textContent = navState.code + (meta ? " · CH. " + String(meta.n).padStart(2, "0") : "") + (modIdx ? " · MODULE " + String(modIdx).padStart(2, "0") : "");
    } else if (isPracticeSession) {
      brandSub.textContent = navState.code + " · PRACTICE TEST MODE";
    } else {
      brandSub.textContent = navState.code + " · " + String(navState.name || "").toUpperCase() + " MANUAL";
    }
  }

  if (mainNav && sessBar) {
    if (inSession) {
      mainNav.hidden = true;
      sessBar.hidden = false;
      if (isSignsSession) {
        const saved = store.read();
        const prog = (saved.progress || {}).__signs__ || {};
        const quizDone = Object.values(saved.results || {}).some((r) => r && String(r.formId || "").startsWith("signs:"));
        const activeKey = rawId === "cards" ? "cards" : rawId === "test" ? "quiz" : "lesson";
        const steps = [
          { key: "lesson", icon: "🛑", label: "Lesson", href: P() + "signs", done: !!prog.lesson },
          { key: "cards", icon: "⚡", label: "Cards", href: P() + "signs/cards", done: !!prog.cards },
          { key: "quiz", icon: "✓", label: "Quiz", href: P() + "signs/test", done: quizDone }
        ];
        sessBar.innerHTML = '<a class="session-exit-pill" href="' + esc(P() + "chapters") + '">← Chapters</a>'
          + '<nav class="session-step-pills" aria-label="Road signs session modes">'
          + steps.map((s) => {
              const cur = s.key === activeKey;
              const cls = "session-step-pill" + (cur ? " is-current" : "") + (s.done ? " is-done" : "");
              return '<a class="' + cls + '" href="' + esc(s.href) + '"' + (cur ? ' aria-current="step"' : '') + '>'
                + '<span class="ssp-icon" aria-hidden="true">' + s.icon + '</span>'
                + '<span class="ssp-label">' + esc(s.label) + '</span>'
                + (s.done && !cur ? '<span class="ssp-check" aria-label="completed">✓</span>' : '')
                + '</a>';
            }).join("")
          + '</nav>'
          + '<a class="session-chapters-pill" href="' + esc(P() + "practice") + '">Practice</a>';
      } else if (isUnitSession) {
        const info = stepInfo(rawId);
        const secId = sectionOfUnit(rawId);
        const modIdx = info.moduleId && secId ? modulesReal(secId).findIndex((x) => x.module_id === info.moduleId) + 1 : 0;
        const activeKey = (!info.hasVideo && p0 === "lesson") ? "read" : p0;
        const steps = info.hasVideo
          ? [
              { key: "lesson", icon: "🎬", label: "Video", href: P() + "lesson/" + encodeURIComponent(rawId), has: info.hasVideo, done: info.videoDone },
              { key: "read", icon: "📖", label: "Read", href: P() + "read/" + encodeURIComponent(rawId), has: info.hasRead, done: info.readDone },
              { key: "cards", icon: "⚡", label: "Cards", href: P() + "cards/" + encodeURIComponent(rawId), has: info.hasCards, done: info.cardsDone },
              { key: "quiz", icon: "✓", label: "Quiz", href: P() + "quiz/" + encodeURIComponent(rawId), has: info.hasQuiz, done: info.quizDone }
            ]
          : [
              { key: "read", icon: "📖", label: "Read", href: P() + "read/" + encodeURIComponent(rawId), has: info.hasRead, done: info.readDone },
              { key: "cards", icon: "⚡", label: "Cards", href: P() + "cards/" + encodeURIComponent(rawId), has: info.hasCards, done: info.cardsDone },
              { key: "quiz", icon: "✓", label: "Quiz", href: P() + "quiz/" + encodeURIComponent(rawId), has: info.hasQuiz, done: info.quizDone }
            ];
        const backHref = info.moduleId ? (P() + "module/" + encodeURIComponent(info.moduleId)) : (P() + "chapters");
        const backLabel = modIdx ? ("← Module " + modIdx) : "← Module";
        sessBar.innerHTML = '<a class="session-exit-pill" href="' + esc(backHref) + '">' + esc(backLabel) + '</a>'
          + '<nav class="session-step-pills" aria-label="Study session modes">'
          + steps.filter((s) => s.has).map((s) => {
              const cur = s.key === activeKey;
              const cls = "session-step-pill" + (cur ? " is-current" : "") + (s.done ? " is-done" : "");
              return '<a class="' + cls + '" href="' + esc(s.href) + '"' + (cur ? ' aria-current="step"' : '') + '>'
                + '<span class="ssp-icon" aria-hidden="true">' + s.icon + '</span>'
                + '<span class="ssp-label">' + esc(s.label) + '</span>'
                + (s.done && !cur ? '<span class="ssp-check" aria-label="completed">✓</span>' : '')
                + '</a>';
            }).join("")
          + '</nav>'
          + '<a class="session-chapters-pill" href="' + esc(P() + "chapters") + '">Chapters</a>';
      } else {
        sessBar.innerHTML = '<a class="session-exit-pill" href="' + esc(P() + "practice") + '">← Practice sets</a>'
          + '<span class="session-practice-badge">📝 Chapter Practice Test</span>'
          + '<a class="session-chapters-pill" href="' + esc(P() + "chapters") + '">Chapters</a>';
      }
    } else {
      mainNav.hidden = false;
      sessBar.hidden = true;
      sessBar.innerHTML = "";
    }
  }

  if (window.NovaGate && window.NovaGate.syncHeader) {
    window.NovaGate.syncHeader(navState);
  }
}`);
  once('  enhanceStudyFlow(sub);', '  enhanceStudyFlow(sub);\n  syncSessionChrome(navState, sub);');

  // Customer sources & reviewer route aliases (kept >2000 chars for harness checks)
  const cut = html.indexOf('// Header: brand, title and state-scoped nav links');
  if (cut < 0) throw new Error('customer source view anchor changed');
  const overrides = String.raw`
function customerSources() {
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";
  return '<div class="plp-deck is-plp-hub is-plp-sources" data-plp-theme="' + esc(baseTheme) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + P() + 'chapters">All chapters</a><span class="plp-badge-pos">' + SECTIONS.length + ' chapters</span></div>'
    + '<h1>Handbook sources</h1>'
    + '</header>'
    + '<div class="card plp-cream-box plp-sources-intro"><div class="plp-hub-chapter-body"><h2>' + esc(ST.handbook) + '</h2><p>Every lesson slide, active-recall flashcard, and practice question in this course is grounded in the official ' + esc(ST.name) + ' driver manual (' + esc(ST.handbook) + ') for ' + esc(ST.test) + ' preparation.</p><p class="muted">Use the official state handbook alongside this practice course. Practice scores describe your study session here; they do not establish licensing eligibility or predict an official test result.</p></div></div>'
    + '<div class="sources-chapter-grid plp-sources-grid">'
    + SECTIONS.map((c) => '<article class="card plp-cream-box source-chapter-card"><div class="plp-hub-chapter-body"><div class="source-chapter-head"><span class="module-index">' + String(c.n).padStart(2, '0') + '</span><div><h2>Chapter ' + c.n + ' — ' + esc(c.title) + '</h2><p class="muted">Source: ' + esc(ST.name) + ' Driver Handbook, chapter ' + c.n + '. Page citations appear directly beneath each lesson slide, flashcard, and quiz item.</p></div></div><a class="btn secondary-btn" href="' + P() + 'chapter/' + esc(c.id) + '">Open chapter</a></div></article>').join('')
    + '</div></div>';
}

function customerSignsHub() {
  if (!SIGNS_PKG) return vLoading("road signs");
  const signs = stateSignList(ST.code);
  const groups = SIGN_CATEGORIES.map((cat) => ({
    ...cat,
    items: signs.filter((s) => s.category === cat.id)
  })).filter((g) => g.items.length > 0);
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";
  const stateTitle = (ST && ST.name) || "Driver Handbook";
  const stateBadge = stateCode ? (stateCode + " · " + stateTitle.toUpperCase()) : stateTitle.toUpperCase();

  return '<nav class="course-breadcrumb" aria-label="Breadcrumb"><a href="' + P() + 'chapters">All chapters</a><span aria-hidden="true">/</span><span aria-current="page">Road signs</span></nav>'
    + '<div class="plp-deck is-plp-hub is-plp-signs-hub" data-plp-theme="' + esc(baseTheme) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame">'
    + '<div class="plp-quest-top">'
    + '<span class="plp-mobile-meta">' + esc((stateCode ? stateCode + " · " : "") + signs.length + " SIGNS · FREE") + '</span>'
    + '<div class="plp-quest-badges">'
    + '<span class="plp-badge-gold">' + esc(stateBadge) + '</span>'
    + '<span class="plp-badge-navy">★ FREE ROAD SIGNS MODULE</span>'
    + '<span class="plp-badge-pos">' + signs.length + ' HANDBOOK SIGNS</span>'
    + '</div>'
    + '</div>'
    + '<div class="plp-sticker-row"><span class="plp-chapter-sticker">' + SIGN_YIELD_SVG + ' ROAD SIGNS · FREE IN ALL 51 COURSES</span></div>'
    + '<h1>Road signs</h1>'
    + '<p class="plp-quest-sub">The ' + signs.length + ' signs the ' + esc(ST.name) + ' handbook expects you to know.</p>'
    + '<div class="plp-signs-hero-actions">'
    + '<a class="btn plp-quiz-cta" href="' + P() + 'signs/cards">Study cards ' + hubIcon("arrow") + '</a>'
    + '<a class="btn secondary-btn plp-hub-cta" href="' + P() + 'signs/test">Sign test</a>'
    + '</div>'
    + '</header>'
    + '<div class="plp-signs-groups">'
    + groups.map((g) => '<section class="card plp-cream-box plp-hub-chapter plp-sign-cat-card" data-sign-category="' + esc(g.id) + '">'
      + '<div class="plp-card-ribbon"><span class="plp-ribbon-left">' + esc(g.label.toUpperCase()) + '</span><span class="plp-ribbon-tag">' + g.items.length + ' SIGN' + (g.items.length === 1 ? '' : 'S') + '</span></div>'
      + '<div class="plp-hub-chapter-body">'
      + '<div class="plp-sign-cat-head"><h2>' + esc(g.rule) + '</h2></div>'
      + '<div class="plp-sign-grid">'
      + g.items.map((s) => s.image
        ? '<a class="plp-sign-tile" href="' + P() + 'signs/cards/' + esc(s.id) + '" data-sign-tile="' + esc(s.id) + '">'
          + '<span class="plp-sign-tile-img"><img src="' + esc(s.image.file) + '" alt="' + esc(s.name) + '" loading="lazy"></span>'
          + '<span class="plp-sign-tile-name">' + esc(s.name) + '</span>'
          + '</a>'
        : '<a class="plp-sign-tile is-text-sign" href="' + P() + 'signs/cards/' + esc(s.id) + '" data-sign-tile="' + esc(s.id) + '" data-sign-text-card="' + esc(s.id) + '">'
          + '<span class="plp-pic-coming">Picture coming</span>'
          + '<strong class="plp-sign-tile-name">' + esc(s.name) + '</strong>'
          + '<span class="plp-sign-tile-spec">' + esc(s.spec) + '</span>'
          + '<span class="plp-sign-tile-meaning">' + esc(s.meaning) + '</span>'
          + '</a>'
      ).join("")
      + '</div></div></section>'
    ).join("")
    + '</div>'
    + '<p class="plp-signs-provenance muted">' + esc(SIGN_PROVENANCE) + '</p>'
    + '</div>';
}

function customerSignsCards(startSignId) {
  if (!SIGNS_PKG) return vLoading("road sign flashcards");
  const signs = stateSignList(ST.code);
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";

  return '<div class="plp-deck is-plp-signs-cards" data-plp-theme="' + esc(baseTheme) + '" data-plp-state="' + esc(stateCode) + '" data-start-sign="' + esc(startSignId || "") + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + P() + 'signs">Road signs</a><span class="plp-badge-pos" data-plp-pos>Card 1 of ' + signs.length + '</span></div>'
    + '<h1>Road signs — Flashcards</h1>'
    + '</header>'
    + signs.map((s, i) => {
      const hbCards = stateHandbookCardsForSign(ST.code, s.id);
      const ruleHref = hbCards.length ? handbookRuleHref(hbCards) : "";
      const hook = shortSignSpec(s.spec);
      const catLabel = (SIGN_CAT_MAP[s.category] && SIGN_CAT_MAP[s.category].label) || s.category;
      const rulePill = signColourRule(s);
      const pills = [catLabel.toUpperCase(), rulePill.toUpperCase()];
      const mediaHtml = s.image
        ? '<div class="plp-sign-q-frame"><img src="' + esc(s.image.file) + '" alt="Road sign"></div>'
        : '<div class="plp-sign-text-card is-card-front" data-sign-text-card="' + esc(s.id) + '"><span class="plp-pic-coming">Picture coming</span><p class="plp-sign-spec-text">' + esc(s.spec) + '</p></div>';

      return '<section class="card flashcard-stage plp-card-stage plp-sign-card-stage" data-flashcard-page data-card-index="' + i + '" data-sign-id="' + esc(s.id) + '">'
        + '<div class="plp-card-grid is-sign-deck-grid">'
        + '<div class="plp-cream-box">'
        + '<div class="plp-front-card">'
        + '<div class="plp-front-zone is-sign-front-zone">'
        + mediaHtml
        + '<p class="flashcard-prompt plp-front-prompt is-sign-prompt">What does this sign mean?</p>'
        + '</div>'
        + '<div class="flashcard-actions plp-action-row"><button type="button" data-recall class="btn-recall plp-flip-btn">Flip Card</button></div>'
        + '<div class="recall-beat-box plp-beat-notice" data-beat-wrap><p class="muted" data-beat hidden>Take about 3 seconds to recall…</p></div>'
        + '</div>'
        + '<div hidden data-answer class="flashcard-back plp-back-zone">'
        + '<div class="plp-rule-panel"><span class="plp-panel-label">SIGN NAME &amp; MEANING</span><p class="plp-sign-answer-name">' + esc(s.name) + '</p><p class="plp-rule-text">' + esc(s.meaning) + '</p></div>'
        + (ruleHref ? '<p class="plp-sign-handbook-link"><a href="' + esc(ruleHref) + '" data-handbook-rule-link>See your handbook&#39;s rule ' + hubIcon("arrow") + '</a></p>' : '')
        + '<div class="plp-back-foot">'
        + '<div class="card-self-rate plp-rate-bar" data-self-rate></div>'
        + '<p class="muted source-line">' + esc(SIGN_PROVENANCE) + '</p>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '<aside class="plp-companion-col" aria-label="Shape and colour cue">'
        + '<div class="plp-hook-box">'
        + '<div class="plp-hook-head"><span class="plp-hook-kicker">★ SHAPE &amp; COLOUR HOOK</span><span class="plp-hook-badge">VISUAL CUE</span></div>'
        + '<div class="plp-hook-locked" data-plp-hook-locked>'
        + '<p class="plp-hook-tease">Call the sign first — flip the card to unlock the shape &amp; colour cue.</p>'
        + '<div class="plp-pill-row is-masked" aria-hidden="true">' + pills.map(() => '<span class="plp-key-pill is-masked-pill">LOCKED TRIGGER</span>').join('') + '</div>'
        + '</div>'
        + '<div class="plp-hook-open" data-plp-hook-open hidden>'
        + '<p class="plp-hook-quote">“' + esc(hook) + '”</p>'
        + '<div class="plp-pill-row">' + pills.map((p) => '<span class="plp-key-pill">' + esc(p) + '</span>').join('') + '</div>'
        + '</div>'
        + '</div>'
        + '</aside>'
        + '</div>'
        + '</section>';
    }).join("")
    + '<footer class="plp-deck-bar" aria-label="Flashcard deck navigation">'
    + '<div class="plp-deck-bar-row">'
    + '<button type="button" class="plp-nav-btn" data-plp-prev>← Prev</button>'
    + '<div class="plp-jumper-strip" data-plp-jumper role="tablist" aria-label="Jump to sign"></div>'
    + '<button type="button" class="plp-nav-btn is-next" data-plp-next>Next →</button>'
    + '</div>'
    + '<div class="plp-deck-bar-tools">'
    + '<button type="button" class="plp-ctrl-pill" data-plp-instant aria-pressed="false" title="3s Recall: ON" aria-label="3s Recall: ON"><span class="plp-ctrl-icon" aria-hidden="true">⏱</span><span class="plp-ctrl-label">3s Recall: ON</span></button>'
    + '</div>'
    + '<div class="plp-mint-track" aria-hidden="true"><span class="plp-mint-fill" data-plp-mint-fill style="width:0%"></span></div>'
    + '</footer>'
    + '<div class="deck-finish-actions plp-sign-deck-actions"><a class="btn plp-quiz-cta" href="' + P() + 'signs/test">Take the Sign test ' + hubIcon("arrow") + '</a><a class="btn secondary-btn plp-hub-cta" href="' + P() + 'signs">Back to Road signs</a></div>'
    + '</div>';
}

function customerSignsTest() {
  if (!SIGNS_PKG) return vLoading("road signs test");
  const seed = ensureSignSeed(ST.code, false);
  const items = pickSignQuizItems(ST.code, seed, 20);
  const qTotal = items.length;
  const themes = ["indigo", "royal", "violet", "berry", "teal"];
  const baseTheme = (ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : "indigo";
  const stateCode = (ST && ST.code) || "";

  return '<div class="plp-deck is-plp-test is-plp-signs-test" data-plp-theme="' + esc(baseTheme) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame is-study-header">'
    + '<div class="plp-study-head-top"><a class="plp-study-crumb" href="' + P() + 'signs">Road signs</a><span class="plp-badge-pos" data-plp-pos>Question 1 of ' + qTotal + '</span></div>'
    + '<h1>' + esc(ST.name) + ' Road signs test</h1>'
    + '</header>'
    + '<form data-rquiz="signs:' + esc(seed) + '" class="quiz-runner-form plp-test-form">'
    + '<div data-summary></div>'
    + items.map((it) => {
      const right = (it.options || []).find((o) => o.correct) || (it.options || [])[0] || { key: "A" };
      return '<section class="card quiz-question-card plp-card-stage plp-quiz-stage plp-sign-quiz-stage" data-ritem="' + esc(it.item_id) + '" data-sign-img="' + esc(it.image || "") + '" data-correct="' + esc(right.key) + '" data-why="' + esc(it.rationale || "") + '" data-stem="' + esc(it.stem) + '">'
        + '<div class="plp-card-grid no-visual">'
        + '<div class="plp-cream-box">'
        + '<div class="plp-front-card plp-q-head">'
        + '<div class="plp-front-zone plp-q-stem-zone is-sign-q-zone">'
        + (it.image ? '<div class="plp-sign-q-frame is-quiz-sign"><img src="' + esc(it.image) + '" alt="Road sign"></div>' : '')
        + '<h2 class="quiz-stem plp-front-prompt is-sign-q-stem">' + esc(it.stem) + '</h2>'
        + '</div>'
        + '</div>'
        + '<div class="plp-q-body">'
        + '<ol class="choices plp-choices">' + (it.options || []).map((o) => '<li><button type="button" class="option plp-option" data-key="' + esc(o.key) + '" data-otext="' + esc(o.text) + '" data-orationale=""><span class="option-badge plp-opt-key">' + esc(o.key) + '</span><span class="option-body plp-opt-text">' + esc(o.text) + '</span></button></li>').join("") + '</ol>'
        + '<div hidden data-feedback class="quiz-feedback plp-quiz-feedback"></div>'
        + '<div class="plp-q-foot"><p class="muted source-line">' + esc(SIGN_PROVENANCE) + '</p></div>'
        + '</div>'
        + '</div>'
        + '</div>'
        + '</section>';
    }).join("")
    + '<div class="quiz-submit-bar plp-submit-bar" data-quiz-submit-bar><button type="submit" class="btn-check-answers plp-submit-btn">Check answers</button></div>'
    + '<div class="plp-practice-disclaimer"><strong>Road signs test ·</strong> <span>Practice only — not an official test. No pass or fail is claimed; the score describes this attempt alone.</span></div>'
    + '</form>'
    + '<footer class="plp-deck-bar" data-plp-quiz-bar aria-label="Question navigation">'
    + '<div class="plp-deck-bar-row">'
    + '<button type="button" class="plp-nav-btn" data-plp-prev>← Prev</button>'
    + '<div class="plp-jumper-strip" data-plp-jumper role="tablist" aria-label="Jump to question"></div>'
    + '<button type="button" class="plp-nav-btn is-next" data-plp-next>Next →</button>'
    + '</div>'
    + '<div class="plp-mint-track" aria-hidden="true"><span class="plp-mint-fill" data-plp-mint-fill style="width:0%"></span></div>'
    + '</footer>'
    + '<div class="quiz-footer-links plp-out-links"><a class="btn secondary-btn" href="' + P() + 'signs">Back to Road signs</a> <a class="btn secondary-btn" href="' + P() + 'practice">Practice tests</a></div>'
    + '</div>';
}

vDossier = customerSources;
vModules = vChapters;
vRealCards = vChapters;
vRealQuiz = () => vPractice(null);
vRealLesson = vChapters;
vSignsHub = customerSignsHub;
vSignsCards = customerSignsCards;
vSignsTest = customerSignsTest;
`;
  html = html.slice(0, cut) + overrides + '\n' + html.slice(cut);
  return patchHubHtml(html);
}
