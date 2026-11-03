// Customer chapter/module views. Source content, routes, gates and progress storage stay upstream.
export const CLOZE_RULE_STEM_RE = /^Which wording completes the cited handbook rule:\s*["“](.+)["”]\??$/s;

export const TEMPLATE_SLIDE_META_RE = /(?:stated conditions?|source-grounded|supported wording|rule being reviewed|opening rule|altered rule|tempting alternative|mistaken alternative|proposed alternative|proposed response|mistaken shortcut|practice mistake|complete (?:rule|guidance|instruction|requirement|scope)|full (?:rule|correction)|source distinction|module guidance|cases distinct|scopes distinct|keep the distinctions|conditions? and (?:required )?actions?|conditions? guide the action|connect (?:scope|the related|the stated|the requirements)|carry the (?:rule|conditions|scope)|rules to (?:carry forward|remember)|start with the rule|check the (?:condition|distinction)|check your (?:recall|understanding)|retain the|bring the (?:topic|guidance)|begin by keeping|here is a quick check|a misconception would|where learners slip|what to remember|do not mix these up|apply the (?:guide|guidance|distinction)|described in the guidance|identify the situation|scope and purpose|key rules part|common (?:trap|mistake)|closing recap|lesson close|quick check)/i;

export function parseClozeRuleStem(stem) {
  const raw = String(stem ?? '');
  const m = raw.match(CLOZE_RULE_STEM_RE);
  if (!m) return { isCloze: false, body: raw };
  return { isCloze: true, body: m[1] };
}

export function buildLessonSegmentLabels(unit, manifestSlides) {
  const uSlides = (unit && Array.isArray(unit.slides)) ? unit.slides : [];
  const mSlides = Array.isArray(manifestSlides) ? manifestSlides : [];
  const count = mSlides.length || uSlides.length;
  const trunc60 = (str) => {
    const clean = String(str || '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
    if (!clean) return '';
    if (clean.length <= 60) return clean;
    const cut = clean.slice(0, 59);
    const wordCut = cut.replace(/[,;:\s]+\S*$/, '').trim();
    return (wordCut.length >= 24 ? wordCut : cut.trim()) + '…';
  };
  const usedSentences = new Set();
  const pickSentence = (text) => {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    const parts = raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [raw];
    let firstValid = '';
    for (const part of parts) {
      const s = part.trim();
      if (!s || s.length < 10) continue;
      if (!/^[A-Z0-9"“]/.test(s)) continue;
      if (TEMPLATE_SLIDE_META_RE.test(s)) continue;
      const cand = trunc60(s);
      if (!cand) continue;
      if (!firstValid) firstValid = cand;
      if (!usedSentences.has(cand)) return cand;
    }
    return firstValid;
  };
  const kindFallback = (k, idx) => {
    const raw = String(k || '').replace(/_/g, ' ').trim();
    if (!raw) return 'Segment ' + (idx + 1);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const baseLabels = [];
  for (let i = 0; i < count; i++) {
    const sl = uSlides[i] || null;
    const ms = mSlides[i] || null;
    const title = sl && sl.title && sl.title.text ? String(sl.title.text).trim() : '';
    let chosen = '';
    if (title && !TEMPLATE_SLIDE_META_RE.test(title)) {
      chosen = trunc60(title);
    }
    if (!chosen && sl && Array.isArray(sl.lines)) {
      for (const ln of sl.lines) {
        const s = pickSentence(ln && ln.text);
        if (s) { chosen = s; break; }
      }
    }
    if (!chosen && sl && sl.narration && sl.narration.text) {
      chosen = pickSentence(sl.narration.text);
    }
    if (!chosen && sl && Array.isArray(sl.lines) && sl.lines[0] && sl.lines[0].text) {
      const firstLine = String(sl.lines[0].text).trim();
      if (firstLine && !TEMPLATE_SLIDE_META_RE.test(firstLine)) {
        chosen = trunc60(firstLine.charAt(0).toUpperCase() + firstLine.slice(1));
      }
    }
    if (!chosen) {
      chosen = kindFallback(ms && ms.kind ? ms.kind : (sl && sl.kind), i);
    }
    usedSentences.add(chosen);
    baseLabels.push(chosen);
  }
  const out = [];
  let prevBase = null;
  let dupRun = 1;
  for (let i = 0; i < baseLabels.length; i++) {
    const base = baseLabels[i];
    if (base === prevBase) {
      dupRun += 1;
      out.push(base + ' · ' + dupRun);
    } else {
      prevBase = base;
      dupRun = 1;
      out.push(base);
    }
  }
  return out;
}

export function patchHubHtml(html) {
  const replaceFunction = (start, end, replacement) => {
    const at = html.indexOf(start), until = html.indexOf(end, at);
    if (at < 0 || until < 0 || html.indexOf(start, at + 1) >= 0) throw new Error('hub patch anchor changed: ' + start);
    html = html.slice(0, at) + replacement + '\n\n' + html.slice(until);
  };
  const helpers = String.raw`
const CLOZE_RULE_STEM_RE = /^Which wording completes the cited handbook rule:\s*["“](.+)["”]\??$/s;
const TEMPLATE_SLIDE_META_RE = /(?:stated conditions?|source-grounded|supported wording|rule being reviewed|opening rule|altered rule|tempting alternative|mistaken alternative|proposed alternative|proposed response|mistaken shortcut|practice mistake|complete (?:rule|guidance|instruction|requirement|scope)|full (?:rule|correction)|source distinction|module guidance|cases distinct|scopes distinct|keep the distinctions|conditions? and (?:required )?actions?|conditions? guide the action|connect (?:scope|the related|the stated|the requirements)|carry the (?:rule|conditions|scope)|rules to (?:carry forward|remember)|start with the rule|check the (?:condition|distinction)|check your (?:recall|understanding)|retain the|bring the (?:topic|guidance)|begin by keeping|here is a quick check|a misconception would|where learners slip|what to remember|do not mix these up|apply the (?:guide|guidance|distinction)|described in the guidance|identify the situation|scope and purpose|key rules part|common (?:trap|mistake)|closing recap|lesson close|quick check)/i;
function parseClozeRuleStem(stem) {
  const raw = String(stem == null ? '' : stem);
  const m = raw.match(CLOZE_RULE_STEM_RE);
  if (!m) return { isCloze: false, body: raw };
  return { isCloze: true, body: m[1] };
}
function hubFormatBlankHtml(text) {
  const s = String(text == null ? '' : text);
  if (!/\bblank\b|_{3,}/.test(s)) return esc(s);
  return s.split(/(?:\bblank\b|_{3,})/).map((p) => esc(p)).join('<span class="blank-slot" aria-label="blank">______</span>');
}
function hubSentenceCase(title, stateName) {
  const raw = String(title || '').trim();
  if (!raw) return '';
  let out = raw.toLowerCase();
  out = out.charAt(0).toUpperCase() + out.slice(1);
  out = out.replace(/\b(dui|dwi|owi|bac|cdl|dmv|dot|bmv|mva|rmv|mvc|dps|dds|dol|mvd|ada|gdl|hov|atv|rv|id)\b/gi, (m) => m.toUpperCase());
  if (stateName) {
    const escaped = String(stateName).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    out = out.replace(new RegExp('\\b' + escaped + '\\b', 'gi'), stateName);
  }
  return out;
}
function hubStudyCrumb(meta, fallback, stateName) {
  if (meta) return 'Chapter ' + meta.n + ' · ' + hubSentenceCase(meta.title, stateName);
  return fallback || stateName || 'Driver handbook';
}
function hubLessonSegmentLabels(unit, manifestSlides) {
  const uSlides = (unit && Array.isArray(unit.slides)) ? unit.slides : [];
  const mSlides = Array.isArray(manifestSlides) ? manifestSlides : [];
  const count = mSlides.length || uSlides.length;
  const trunc60 = (str) => {
    const clean = String(str || '').replace(/\s+/g, ' ').trim().replace(/[.!?]+$/, '').trim();
    if (!clean) return '';
    if (clean.length <= 60) return clean;
    const cut = clean.slice(0, 59);
    const wordCut = cut.replace(/[,;:\s]+\S*$/, '').trim();
    return (wordCut.length >= 24 ? wordCut : cut.trim()) + '…';
  };
  const usedSentences = new Set();
  const pickSentence = (text) => {
    const raw = String(text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    const parts = raw.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [raw];
    let firstValid = '';
    for (const part of parts) {
      const s = part.trim();
      if (!s || s.length < 10) continue;
      if (!/^[A-Z0-9"“]/.test(s)) continue;
      if (TEMPLATE_SLIDE_META_RE.test(s)) continue;
      const cand = trunc60(s);
      if (!cand) continue;
      if (!firstValid) firstValid = cand;
      if (!usedSentences.has(cand)) return cand;
    }
    return firstValid;
  };
  const kindFallback = (k, idx) => {
    const raw = String(k || '').replace(/_/g, ' ').trim();
    if (!raw) return 'Segment ' + (idx + 1);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };
  const baseLabels = [];
  for (let i = 0; i < count; i++) {
    const sl = uSlides[i] || null;
    const ms = mSlides[i] || null;
    const title = sl && sl.title && sl.title.text ? String(sl.title.text).trim() : '';
    let chosen = '';
    if (title && !TEMPLATE_SLIDE_META_RE.test(title)) chosen = trunc60(title);
    if (!chosen && sl && Array.isArray(sl.lines)) {
      for (const ln of sl.lines) {
        const s = pickSentence(ln && ln.text);
        if (s) { chosen = s; break; }
      }
    }
    if (!chosen && sl && sl.narration && sl.narration.text) chosen = pickSentence(sl.narration.text);
    if (!chosen && sl && Array.isArray(sl.lines) && sl.lines[0] && sl.lines[0].text) {
      const firstLine = String(sl.lines[0].text).trim();
      if (firstLine && !TEMPLATE_SLIDE_META_RE.test(firstLine)) chosen = trunc60(firstLine.charAt(0).toUpperCase() + firstLine.slice(1));
    }
    if (!chosen) chosen = kindFallback(ms && ms.kind ? ms.kind : (sl && sl.kind), i);
    usedSentences.add(chosen);
    baseLabels.push(chosen);
  }
  const out = [];
  let prevBase = null;
  let dupRun = 1;
  for (let i = 0; i < baseLabels.length; i++) {
    const base = baseLabels[i];
    if (base === prevBase) {
      dupRun += 1;
      out.push(base + ' · ' + dupRun);
    } else {
      prevBase = base;
      dupRun = 1;
      out.push(base);
    }
  }
  return out;
}
function hubPlural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
function hubCleanTitle(rawTitle, partNum) {
  const s = String(rawTitle || '').trim();
  const m = s.match(/^(.*?)(?:\s+continuation(?:\s+[a-z0-9]+)?|\s+[—–-]\s*(?:[A-Z]\b)?)+(?:\s+(practice))?\s*$/i);
  if (!m || !m[1].trim()) return s;
  const base = m[1].trim();
  const isPractice = !!m[2];
  return base + (partNum ? ' · Part ' + partNum : '') + (isPractice ? ' Quiz' : '');
}
function hubTopicPreview(deck) {
  if (!Array.isArray(deck) || !deck.length || !deck[0] || !deck[0].back) return '';
  const snippets = [];
  for (let i = 0; i < deck.length && snippets.length < 2; i++) {
    const b = String(deck[i].back || '').trim();
    if (!b) continue;
    const firstClause = b.split(/[.;]/)[0].trim();
    const short = firstClause.length > 74 ? firstClause.slice(0, 71).replace(/\s+\S*$/, '') + '…' : firstClause;
    if (short && !snippets.includes(short)) snippets.push(short);
  }
  return snippets.length ? snippets.join(' · ') : '';
}
function hubIcon(kind) {
  const drawings = {
    video: '<polygon points="10 8 16 12 10 16 10 8"/><rect x="3" y="5" width="18" height="14" rx="3"/>',
    read: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/>',
    lesson: '<path d="M12 6c-3-2-6-2-9-1v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1Z"/><path d="M12 6v14"/>',
    cards: '<rect x="6" y="7" width="14" height="14" rx="3"/><path d="M16 3H6a3 3 0 0 0-3 3v10"/><path d="M10 12h6m-6 4h4"/>',
    quiz: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="m8 9 1.5 1.5L12 8m2 2h2M8 15h8"/>',
    audio: '<path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/>',
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    check: '<path d="m5 12 4 4L19 6"/>'
  };
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (drawings[kind] || drawings.arrow) + '</svg>';
}
function hubModuleData(m, saved) {
  const unit = m.unit_id ? sessionUnit(m.unit_id) : null;
  const deck = m.unit_id ? deckForUnit(m.unit_id) : [];
  const quiz = m.unit_id ? moduleQuizForUnit(m.unit_id) : null;
  const progress = (saved.progress || {})[m.unit_id] || {};
  const attempts = quiz ? Object.values(saved.results || {}).filter((r) => r && r.formId === 'quiz:' + quiz.quiz_id) : [];
  const latest = attempts.length ? attempts[attempts.length - 1] : null;
  return { m, unit, deck, quiz, progress, quizAttempted: attempts.length > 0, latestAttempt: latest };
}
function hubBreadcrumb(meta, moduleTitle) {
  return '<nav class="course-breadcrumb" aria-label="Breadcrumb"><a href="' + P() + 'chapters">All chapters</a><span aria-hidden="true">/</span>'
    + (moduleTitle ? '<a href="' + P() + 'chapter/' + esc(meta.id) + '">Chapter ' + esc(meta.n) + '</a><span aria-hidden="true">/</span><span aria-current="page">Module</span>' : '<span aria-current="page">Chapter ' + esc(meta.n) + '</span>') + '</nav>';
}
function hubCountPills(d) {
  const hasNarration = typeof AUDIO_MANIFEST !== 'undefined' && !!AUDIO_MANIFEST;
  return '<div class="course-meta"><span>' + hubIcon('lesson') + hubPlural(d.unit ? d.unit.slides.length : 0, 'slide') + '</span><span>' + hubIcon('cards') + hubPlural(d.deck.length, 'flashcard') + '</span><span>' + hubIcon('quiz') + hubPlural(d.quiz ? d.quiz.item_ids.length : 0, 'question') + '</span>' + (hasNarration ? '<span class="audio-pill">' + hubIcon('audio') + 'Audio</span>' : '') + '</div>';
}
function hubStatus(label, state, active) {
  return '<span class="module-status' + (active ? ' is-done' : '') + '"><span class="status-dot" aria-hidden="true"></span>' + label + ': ' + state + '</span>';
}
`;
  const chapter = String.raw`
function vChapter(sectionId) {
  const meta = sectionMeta(sectionId);
  if (!meta) return vMissing();
  const mods = modulesReal(sectionId);
  if (!mods.length) return '<h1>Chapter ' + esc(meta.n) + ' — ' + esc(meta.title) + '</h1><div class="card"><h2>Not yet built</h2><p>This chapter is still being prepared. Please choose another chapter.</p><a class="btn" href="' + P() + 'chapters">Back to all chapters</a></div>';
  const saved = store.read();
  const rows = mods.map((m) => hubModuleData(m, saved));
  const hasNarration = typeof AUDIO_MANIFEST !== 'undefined' && !!AUDIO_MANIFEST;
  const hasVideo = (typeof ST !== 'undefined' && ST && stateSupportsVideo(ST));
  const isLessonDone = (d) => !!(d.unit && (d.progress.lesson || (!hasVideo && d.progress.read)));
  const availableLessons = rows.filter((d) => d.unit);
  const completedLessons = availableLessons.filter(isLessonDone).length;
  const nextLesson = rows.find((d) => d.unit && !isLessonDone(d));
  const nextModule = nextLesson || rows.find((d) => d.m.unit_id);
  const nextIndex = nextModule ? rows.indexOf(nextModule) + 1 : 0;
  const cardCount = rows.reduce((n, d) => n + d.deck.length, 0);
  const percent = availableLessons.length ? Math.round(completedLessons / availableLessons.length * 100) : 0;
  return hubBreadcrumb(meta)
    + '<header class="course-hero"><p class="course-kicker">CHAPTER ' + String(meta.n).padStart(2, '0') + '</p><h1>' + esc(meta.title) + '</h1><p class="course-intro">Jump straight into any module activity below, or open its step-by-step hub: ' + (hasVideo ? 'video walkthrough, page-flip reading, active-recall flashcards, and module quiz.' : 'page-flip reading, active-recall flashcards, and module quiz.') + '</p><div class="course-meta chapter-meta"><span>' + hubPlural(mods.length, 'module') + '</span><span>' + hubPlural(availableLessons.length, 'lesson') + '</span><span>' + hubPlural(cardCount, 'flashcard') + '</span>' + (hasVideo ? '<span class="video-pill">🎬 Lesson videos included</span>' : '') + (hasNarration ? '<span class="audio-pill">' + hubIcon('audio') + 'Teacher narration included</span>' : '') + '</div></header>'
    + '<div class="chapter-layout"><section class="chapter-modules" aria-labelledby="chapter-modules-title"><div class="section-label"><h2 id="chapter-modules-title">Your modules</h2><span>1-click launch or open hub</span></div>'
    + rows.map((d, i) => {
      const available = !!d.m.unit_id;
      const displayTitle = hubCleanTitle(d.m.title, i + 1);
      const preview = hubTopicPreview(d.deck);
      const lDone = isLessonDone(d);
      const rDone = !!(d.unit && d.progress.read);
      const headHtml = available
        ? '<a class="module-hub-link" href="' + P() + 'module/' + esc(d.m.module_id) + '" aria-label="Open module hub: ' + esc(d.m.title) + '"><h3>' + esc(displayTitle) + '</h3></a>'
        : '<h3>' + esc(displayTitle) + '</h3>';
      const quickHtml = available
        ? '<div class="module-quick-actions">'
          + (hasVideo && d.unit ? '<a class="mod-quick-btn is-mint" href="' + P() + 'lesson/' + esc(d.m.unit_id) + '">▶ Video</a>' : '')
          + (d.unit ? '<a class="mod-quick-btn' + (!hasVideo ? ' is-mint' : '') + '" href="' + P() + 'read/' + esc(d.m.unit_id) + '">📖 Read</a>' : '')
          + (d.deck.length ? '<a class="mod-quick-btn" href="' + P() + 'cards/' + esc(d.m.unit_id) + '">⚡ Cards</a>' : '')
          + (d.quiz ? '<a class="mod-quick-btn" href="' + P() + 'quiz/' + esc(d.m.unit_id) + '">✓ Quiz</a>' : '')
          + '</div>'
        : '';
      return '<article class="module-tile' + (!available ? ' is-unavailable' : '') + '"><span class="module-index' + (lDone ? ' is-done' : '') + '">' + String(i + 1).padStart(2, '0') + '</span><div class="module-details">' + headHtml
        + (preview ? '<p class="module-preview">' + esc(preview) + '</p>' : '')
        + hubCountPills(d)
        + '<div class="module-statuses">'
        + (hasVideo
          ? hubStatus('Video', d.unit ? (d.progress.lesson ? 'watched' : 'not started') : 'coming soon', !!(d.unit && d.progress.lesson))
            + hubStatus('Reading', d.unit ? (rDone ? 'read' : 'not started') : 'coming soon', rDone)
          : hubStatus('Reading', d.unit ? (lDone ? 'complete' : 'not started') : 'coming soon', lDone))
        + hubStatus('Cards', d.deck.length ? (d.progress.cards ? 'opened' : 'not opened') : 'coming soon', !!(d.deck.length && d.progress.cards))
        + hubStatus('Quiz', d.quiz ? (d.quizAttempted ? 'attempted' : 'not attempted') : 'coming soon', d.quizAttempted) + '</div>'
        + quickHtml + '</div>' + (available ? '<a class="module-open" href="' + P() + 'module/' + esc(d.m.module_id) + '">Hub ' + hubIcon('arrow') + '</a>' : '<span class="module-open">Soon</span>') + '</article>';
    }).join('') + '</section><aside class="course-side"><section class="course-summary-panel"><p class="course-kicker">YOUR CHAPTER PROGRESS</p><div class="chapter-progress-number">' + completedLessons + '<span> / ' + availableLessons.length + '</span></div><p class="progress-caption">lessons completed</p><div class="course-progress" role="progressbar" aria-label="Lessons completed" aria-valuemin="0" aria-valuemax="' + availableLessons.length + '" aria-valuenow="' + completedLessons + '"><span class="course-progress-fill" style="width:' + percent + '%"></span></div>'
    + (nextModule ? '<div class="chapter-next"><p class="course-kicker">' + (nextLesson ? 'NEXT LESSON' : 'KEEP PRACTICING') + '</p><h3>' + esc(hubCleanTitle(nextModule.m.title, nextIndex)) + '</h3><a class="btn" href="' + P() + 'module/' + esc(nextModule.m.module_id) + '">' + (completedLessons ? 'Continue learning' : 'Start learning') + ' ' + hubIcon('arrow') + '</a></div>' : '<p>The lessons are still being prepared.</p>')
    + '<p class="device-note">Progress is saved on this device.</p></section><section class="chapter-practice"><span class="practice-icon">' + hubIcon('quiz') + '</span><h3>Ready for a mix?</h3><p>Try practice questions from this chapter.</p><a href="' + P() + 'practice">Choose a practice form ' + hubIcon('arrow') + '</a><small>Practice only — no official pass claim.</small></section></aside></div>';
}
`;
  const module = String.raw`
function vModule(moduleId) {
  const m = modulesReal().find((x) => x.module_id === moduleId);
  if (!m || !m.unit_id) return vMissing();
  const meta = sectionMeta(m.section_id);
  if (!meta) return vMissing();
  const saved = store.read(), d = hubModuleData(m, saved);
  const modList = modulesReal(m.section_id);
  const moduleNumber = modList.findIndex((x) => x.module_id === moduleId) + 1;
  const displayTitle = hubCleanTitle(m.title, moduleNumber);
  const preview = hubTopicPreview(d.deck);
  const hasNarration = typeof AUDIO_MANIFEST !== 'undefined' && !!AUDIO_MANIFEST;
  const hasVideo = (typeof ST !== 'undefined' && ST && stateSupportsVideo(ST));
  const latestScore = d.quiz && d.latestAttempt && Array.isArray(d.latestAttempt.answers) ? ' · Latest try: ' + d.latestAttempt.correctCount + ' of ' + d.latestAttempt.answers.length : '';

  const themes = ['indigo', 'royal', 'violet', 'berry', 'teal'];
  const chNum = (meta && meta.n) || 1;
  const baseTheme = (typeof ST !== 'undefined' && ST && ST.theme && themes.includes(ST.theme)) ? ST.theme : 'indigo';
  const themeKey = themes[(themes.indexOf(baseTheme) + Math.max(1, chNum) - 1) % themes.length];
  const stateCode = (typeof ST !== 'undefined' && ST && ST.code) || '';
  const stateTitle = (typeof ST !== 'undefined' && ST && ST.name) || 'Driver Handbook';

  const videoDone = !!(d.unit && d.progress.lesson);
  const readDone = !!(d.unit && (d.progress.read || (!hasVideo && d.progress.lesson)));
  const cardsDone = !!(d.deck.length && d.progress.cards);
  const activityRows = hasVideo
    ? [
        {kind:'video', title:'Video Lesson', stepTag:'STEP 1 · WATCH', detail:d.unit ? '1080p narrated lesson video walking through ' + hubPlural(d.unit.slides.length, 'segment') + ' with visual handbook scenes.' : 'The video lesson is coming soon.', status:d.unit ? (videoDone ? 'Watched' : 'Not started') : 'Coming soon', active:videoDone, available:!!d.unit, path:'lesson/', label:videoDone ? 'Rewatch video' : 'Watch video'},
        {kind:'read', title:'Reading', stepTag:'STEP 2 · READ', detail:d.unit ? hubPlural(d.unit.slides.length, 'concept page') + ' + key rules, worked example, watch-out & quick self-check in page-flip format' + (hasNarration ? ' with audio.' : '.') : 'The reading pages are coming soon.', status:d.unit ? (d.progress.read ? 'Read' : 'Not started') : 'Coming soon', active:!!(d.unit && d.progress.read), available:!!d.unit, path:'read/', label:d.progress.read ? 'Flip pages again' : 'Open reading'},
        {kind:'cards', title:'Flashcards', stepTag:'STEP 3 · RECALL', detail:hubPlural(d.deck.length, 'card') + ' to recall from memory, then reveal with memory hooks' + (hasNarration ? ' and 4-beat audio.' : '.'), status:d.deck.length ? (cardsDone ? 'Opened' : 'Not opened') : 'Coming soon', active:cardsDone, available:!!d.deck.length, path:'cards/', label:cardsDone ? 'Drill again' : 'Drill flashcards'},
        {kind:'quiz', title:'Quiz', stepTag:'STEP 4 · TEST', detail:d.quiz ? hubPlural(d.quiz.item_ids.length, 'practice question') + ' with handbook explanations' + latestScore + '.' : 'The quiz is coming soon.', status:d.quiz ? (d.quizAttempted ? 'Attempted' : 'Not attempted') : 'Coming soon', active:d.quizAttempted, available:!!d.quiz, path:'quiz/', label:d.quizAttempted ? 'Retake quiz' : 'Take module quiz'}
      ]
    : [
        {kind:'read', title:'Lesson Reading', stepTag:'STEP 1 · READ', detail:d.unit ? hubPlural(d.unit.slides.length, 'concept page') + ' + key rules, worked example, watch-out & quick self-check in page-flip format' + (hasNarration ? ' with audio.' : '.') : 'The reading pages are coming soon.', status:d.unit ? (readDone ? 'Complete' : 'Not started') : 'Coming soon', active:readDone, available:!!d.unit, path:'read/', label:readDone ? 'Review reading' : 'Open reading'},
        {kind:'cards', title:'Flashcards', stepTag:'STEP 2 · RECALL', detail:hubPlural(d.deck.length, 'card') + ' to recall from memory, then reveal with memory hooks' + (hasNarration ? ' and 4-beat audio.' : '.'), status:d.deck.length ? (cardsDone ? 'Opened' : 'Not opened') : 'Coming soon', active:cardsDone, available:!!d.deck.length, path:'cards/', label:cardsDone ? 'Drill again' : 'Drill flashcards'},
        {kind:'quiz', title:'Quiz', stepTag:'STEP 3 · TEST', detail:d.quiz ? hubPlural(d.quiz.item_ids.length, 'practice question') + ' with handbook explanations' + latestScore + '.' : 'The quiz is coming soon.', status:d.quiz ? (d.quizAttempted ? 'Attempted' : 'Not attempted') : 'Coming soon', active:d.quizAttempted, available:!!d.quiz, path:'quiz/', label:d.quizAttempted ? 'Retake quiz' : 'Take module quiz'}
      ];

  const availRows = activityRows.filter((a) => a.available);
  const doneCount = availRows.filter((a) => a.active).length;
  const availCount = availRows.length;
  const hubPct = availCount ? Math.round((doneCount / availCount) * 100) : 0;
  const pendingActivity = activityRows.find((a) => a.available && !a.active);
  const next = pendingActivity || activityRows.find((a) => a.available);
  const reviewMode = !!next && !pendingActivity;

  const nextHeadlines = {video:'Watch the visual walkthrough.', read:'Read the handbook pages.', cards:'Make the rules stick.', quiz:'Test what you know.'};
  const nextDescriptions = {
    video:'Start with the narrated 1080p lesson video to see each traffic rule and handbook scenario in motion.',
    read:'Flip through clean one-concept pages with handbook illustrations, key rules, exam watch-outs, and a quick self-check.',
    cards:'Bring each rule to mind before flipping the card. Memory hooks and coaching takeaways lock it in.',
    quiz:'Answer handbook-grounded multiple-choice questions and review every option explanation.'
  };
  const nextLabels = {video:'Watch video lesson', read:'Start page-flip reading', cards:'Continue with flashcards', quiz:'Take module quiz'};
  const reviewLabels = {video:'Rewatch video lesson', read:'Revisit reading pages', cards:'Review flashcards', quiz:'Try the quiz again'};

  const stateBadge = stateCode ? (stateCode + ' · ' + stateTitle.toUpperCase()) : stateTitle.toUpperCase();
  const mobPrefix = 'CH ' + String(meta.n).padStart(2, '0') + ' · M ' + String(moduleNumber).padStart(2, '0');

  const loopHtml = hasVideo
    ? '<div class="plp-study-loop" aria-label="Study sequence"><span class="plp-loop-pill">1 · Video Lesson</span><i aria-hidden="true">→</i><span class="plp-loop-pill">2 · Reading</span><i aria-hidden="true">→</i><span class="plp-loop-pill">3 · Flashcards</span><i aria-hidden="true">→</i><span class="plp-loop-pill">4 · Quiz</span></div>'
    : '<div class="plp-study-loop" aria-label="Study sequence"><span class="plp-loop-pill">1 · Lesson Reading</span><i aria-hidden="true">→</i><span class="plp-loop-pill">2 · Flashcards</span><i aria-hidden="true">→</i><span class="plp-loop-pill">3 · Quiz</span></div>';

  return hubBreadcrumb(meta, displayTitle)
    + '<div class="plp-deck is-plp-module" data-plp-theme="' + esc(themeKey) + '" data-plp-state="' + esc(stateCode) + '">'
    + '<header class="plp-quest-frame">'
    + '<div class="plp-quest-top">'
    + '<span class="plp-mobile-meta">' + esc(mobPrefix + ' · HUB') + '</span>'
    + '<div class="plp-quest-badges">'
    + '<span class="plp-badge-gold">' + esc(stateBadge) + '</span>'
    + '<span class="plp-badge-navy">CHAPTER ' + String(meta.n).padStart(2, '0') + ' · MODULE ' + String(moduleNumber).padStart(2, '0') + '</span>'
    + '<span class="plp-badge-pos">' + doneCount + ' OF ' + availCount + ' COMPLETE</span>'
    + '</div>'
    + '<div class="plp-xp-meter" aria-label="Module completion">'
    + '<span class="plp-xp-bolt" aria-hidden="true">★</span>'
    + '<div class="plp-xp-track"><span class="plp-xp-fill" style="width:' + hubPct + '%"></span></div>'
    + '<span class="plp-xp-val">' + doneCount + ' / ' + availCount + ' DONE</span>'
    + '</div>'
    + '</div>'
    + '<div class="plp-sticker-row"><span class="plp-chapter-sticker">CHAPTER ' + chNum + ' · ' + esc(meta.title.toUpperCase()) + '</span></div>'
    + loopHtml
    + '<h1>' + esc(displayTitle) + '</h1>'
    + '<p class="plp-quest-sub">' + (preview ? esc(preview) : 'Learn the handbook rule, flip through the pages, lock it into memory, then test yourself.') + '</p>'
    + '</header>'
    + (next
      ? '<section class="card plp-hub-next-card"><div class="plp-card-ribbon"><span class="plp-ribbon-left">' + (reviewMode ? '★ MODULE COMPLETE · KEEP IT FRESH' : '▶ UP NEXT · ' + esc(next.stepTag)) + '</span><span class="plp-ribbon-tag">' + doneCount + ' / ' + availCount + ' FINISHED</span></div>'
        + '<div class="plp-hub-next-body"><div class="plp-hub-next-copy"><h2>' + esc(reviewMode ? 'All steps visited — pick any activity to review.' : nextHeadlines[next.kind]) + '</h2><p>' + esc(reviewMode ? 'Progress stays saved on this device. Jump back into video, reading pages, flashcards, or the module quiz anytime.' : nextDescriptions[next.kind]) + '</p>'
        + '<div class="plp-hub-next-actions"><a class="btn plp-quiz-cta" href="' + P() + next.path + esc(m.unit_id) + '">' + (reviewMode ? reviewLabels[next.kind] : nextLabels[next.kind]) + ' ' + hubIcon('arrow') + '</a><a class="btn secondary-btn plp-hub-cta" href="' + P() + 'chapter/' + esc(m.section_id) + '">← Chapter ' + esc(meta.n) + '</a></div></div>'
        + '<span class="plp-hub-next-badge" aria-hidden="true">' + hubIcon(next.kind) + '</span></div></section>'
      : '')
    + '<section class="plp-module-grid" aria-label="Module learning steps">'
    + activityRows.map((a, i) => {
      const isNext = !!(next && next.kind === a.kind && !reviewMode);
      return '<article class="card plp-module-step-card' + (a.active ? ' is-done' : '') + (isNext ? ' is-next' : '') + '">'
        + '<div class="plp-module-step-top"><span class="plp-module-step-num">' + String(i + 1).padStart(2, '0') + '</span><span class="plp-module-step-tag">' + esc(a.stepTag) + '</span><span class="plp-module-step-status' + (a.active ? ' is-done' : '') + '">' + (a.active ? '✓ ' : '') + esc(a.status) + '</span></div>'
        + '<div class="plp-module-step-body"><h2>' + (i + 1) + ' · ' + esc(a.title) + '</h2><p>' + esc(a.detail) + '</p></div>'
        + '<div class="plp-module-step-foot">' + (a.available ? '<a class="btn ' + (isNext ? 'plp-quiz-cta' : 'secondary-btn plp-set-cta') + '" href="' + P() + a.path + esc(m.unit_id) + '">' + esc(a.label) + ' ' + hubIcon('arrow') + '</a>' : '<span class="muted">Coming soon</span>') + '</div>'
        + '</article>';
    }).join('')
    + '</section>'
    + '</div>';
}
`;
  replaceFunction('function vChapter(sectionId) {', 'function sectionOfUnit(unitId) {', helpers + chapter);
  replaceFunction('function vModule(moduleId) {', 'function vLesson(unitId) {', module);
  return html;
}
