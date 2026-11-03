// gate.js — PassLearnersPermit store gate & interactive study layer for the learner shell.
//
// Loaded by the store copy of index.html (STORE PATCH, tools/preview/sync-store.mjs).
// It never exists in app-preview/, so the preview shell stays ungated.
// Price and copy mirror store/src/lib/product.ts — keep them in step.
(function () {
  "use strict";
  var PRICE = "$9.99";
  var SUPPORT = "support@passlearnerspermit.com";
  var ME = { signedIn: false, entitlements: {} };
  var QUARANTINE = {};   // code -> Set(card ids)
  var HIDDEN = {};       // code -> [{card_id, unit_id, module_id}] actually hidden
  var SIGNS_BY_ID = {};       // signId -> { id, name, file }
  var CARD_TO_SIGN = {};      // stateCode -> { cardId: signId }
  var STATE_SIGN_COUNTS = {}; // stateCode -> number
  var SIGN_YIELD_SVG = '<svg class="sign-yield-icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><polygon points="12,21 2,4 22,4" fill="#ffffff" stroke="#d62828" stroke-width="3" stroke-linejoin="round"/></svg>';
  var VISUAL_CATALOG = { scenes: {} };
  var STATE_VISUALS = {};
  var STATE_VISUAL_PROMISES = {};
  var DECK_OVERLAYS = {};
  var DECK_OVERLAY_PROMISES = {};
  var cleanupKeyHandler = null;
  var cleanupAutoTimer = 0;

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var getJson = function (url) {
    return fetch(url, { cache: "no-store", credentials: "same-origin" }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  };

  function hydrateSignIndex(sDoc, bDoc) {
    if (sDoc && Array.isArray(sDoc.signs)) {
      sDoc.signs.forEach(function (sg) {
        if (sg && sg.id && sg.image && sg.image.file) {
          SIGNS_BY_ID[sg.id] = { id: sg.id, name: String(sg.name || "Road sign"), file: String(sg.image.file) };
        }
      });
    }
    var stMap = (bDoc && bDoc.states) || {};
    Object.keys(stMap).forEach(function (code) {
      var entry = stMap[code] || {};
      var list = Array.isArray(entry.signs) ? entry.signs : [];
      STATE_SIGN_COUNTS[code] = list.length;
      var c2s = {};
      var hb = entry.handbook_cards || {};
      list.forEach(function (signId) {
        if (!SIGNS_BY_ID[signId]) return;
        var cids = hb[signId];
        if (!Array.isArray(cids)) return;
        cids.forEach(function (cid) {
          if (cid && !c2s[cid]) c2s[cid] = signId;
        });
      });
      CARD_TO_SIGN[code] = c2s;
    });
  }
  try {
    if (typeof window !== "undefined" && window.__SIGNS_EMBEDDED) {
      hydrateSignIndex(window.__SIGNS_EMBEDDED.signs, window.__SIGNS_EMBEDDED.byState);
    }
  } catch (e) {}

  var ready = Promise.all([
    Promise.all([
      getJson("data/signs/signs.json").catch(function () { return null; }),
      getJson("data/signs/by-state.json").catch(function () { return null; })
    ]).then(function (pair) {
      if (pair && pair[0] && pair[1]) hydrateSignIndex(pair[0], pair[1]);
    }),
    getJson("visuals/visual-catalog.json").then(function (cat) { if (cat && typeof cat === "object" && cat.scenes) VISUAL_CATALOG = cat; }, function () {}),
    getJson("/api/me").then(function (m) {
      ME = { signedIn: !!(m && m.signedIn), entitlements: (m && m.entitlements && typeof m.entitlements === "object") ? m.entitlements : {} };
    }, function () { /* offline / no API: treated as signed out */ }),
    getJson("quarantine-index.json").then(function (q) {
      var st = (q && q.states) || {};
      Object.keys(st).forEach(function (code) {
        QUARANTINE[code] = new Set(((st[code] && st[code].cards) || []).map(function (c) { return c && c.id; }).filter(Boolean));
      });
    }, function () { /* no index: nothing held back */ })
  ]).then(function () { return ME; });

  function firstChapterId(s) {
    var ch = (s && s.chapters) || [];
    if (!ch.length) return null;
    var best = ch[0];
    ch.forEach(function (c) { if ((c.n || 0) < (best.n || 0)) best = c; });
    return best.id;
  }
  function expiry(code) {
    var iso = ME.entitlements && ME.entitlements[code];
    var t = iso ? Date.parse(iso) : NaN;
    return isFinite(t) ? t : null;
  }
  function entitled(code) { var t = expiry(code); return t !== null && t > Date.now(); }
  function isFree(s, sectionId) { return !!sectionId && sectionId === firstChapterId(s); }
  function canLoad(s, sectionId) { return isFree(s, sectionId) || entitled(s.code); }

  function applyDeckOverlay(s, files) {
    var ov = s && s.code ? DECK_OVERLAYS[String(s.code).toUpperCase()] : null;
    if (!ov || !files) return;
    var ovCards = ov.cards || {};
    var ovScripts = ov.scripts || {};
    var ovRecaps = ov.recaps || {};
    Object.keys(files).forEach(function (rel) {
      var doc = files[rel];
      if (!doc || typeof doc !== "object") return;
      if (Array.isArray(doc.decks)) {
        var nextDecks = doc.decks.map(function (d) {
          if (!d || !Array.isArray(d.cards)) return d;
          return Object.assign({}, d, {
            cards: d.cards.map(function (c) {
              var m = c && ovCards[c.card_id];
              if (!m || m.expected_back !== c.back) return c;
              return Object.assign({}, c, { front: m.front, memory_hook: m.memory_hook });
            })
          });
        });
        var nextRecaps = Array.isArray(doc.recaps) ? doc.recaps.map(function (r) {
          var rm = r && ovRecaps[r.module_id];
          if (!rm || !Array.isArray(r.recap_hooks)) return r;
          return Object.assign({}, r, {
            recap_hooks: r.recap_hooks.map(function (h, idx) {
              return rm.hooks_spoken && rm.hooks_spoken[idx] ? Object.assign({}, h, { text: rm.hooks_spoken[idx] }) : h;
            })
          });
        }) : doc.recaps;
        files[rel] = Object.assign({}, doc, { decks: nextDecks, recaps: nextRecaps });
      }
      if (Array.isArray(doc.audio_scripts)) {
        files[rel] = Object.assign({}, files[rel], {
          audio_scripts: files[rel].audio_scripts.map(function (a) {
            if (!a) return a;
            if (a.is_recap && ovRecaps[a.module_id]) {
              var rm = ovRecaps[a.module_id];
              return Object.assign({}, a, {
                recap: { hooks_spoken: rm.hooks_spoken, narration_text: rm.narration_text }
              });
            }
            var sm = ovScripts[a.card_id];
            var cm = ovCards[a.card_id];
            if (!sm || !cm || a.must_match_card_back !== cm.expected_back || !a.segments) return a;
            return Object.assign({}, a, {
              must_match_memory_hook: sm.must_match_memory_hook,
              visual_sync: sm.visual_sync || a.visual_sync,
              segments: Object.assign({}, a.segments, {
                question: Object.assign({}, a.segments.question, { lead_in: sm.lead_in, text: sm.question_text }),
                teaching: Object.assign({}, a.segments.teaching, { text: sm.teaching_text })
              })
            });
          })
        });
      }
    });
  }

  function hideQuarantined(s, files) {
    applyDeckOverlay(s, files);
    var q = QUARANTINE[s.code];
    HIDDEN[s.code] = [];
    if (!q || !q.size) return;
    var seen = new Set();
    Object.keys(files).forEach(function (rel) {
      var doc = files[rel];
      if (!doc || typeof doc !== "object") return;
      if (Array.isArray(doc.decks)) {
        files[rel] = Object.assign({}, doc, {
          decks: doc.decks.map(function (d) {
            if (!d || !Array.isArray(d.cards)) return d;
            return Object.assign({}, d, {
              cards: d.cards.filter(function (c) {
                if (!c || !q.has(c.card_id)) return true;
                if (!seen.has(c.card_id)) { seen.add(c.card_id); HIDDEN[s.code].push({ card_id: c.card_id, unit_id: c.unit_id || null, module_id: c.module_id || null }); }
                return false;
              })
            });
          })
        });
      }
      if (Array.isArray(doc.audio_scripts)) {
        files[rel] = Object.assign({}, files[rel], {
          audio_scripts: doc.audio_scripts.filter(function (a) { return !(a && q.has(a.card_id)); })
        });
      }
    });
  }

  // ---------------------------------------------------------------- buy panel
  function stateName(s) { return (s && s.name) || ""; }
  function stateHasAudio(s, api) {
    if (!s) return false;
    if (s.status === "complete") return true;
    return !!(api && api.hasAudio && api.hasAudio());
  }
  function stateHasVideo(s) {
    var code = typeof s === "string" ? s : (s && s.code);
    if (!code) return false;
    var list = (typeof window !== "undefined" && Array.isArray(window.__PLP_VIDEO_STATES)) ? window.__PLP_VIDEO_STATES : ["ND"];
    return list.indexOf(String(code).toUpperCase()) >= 0;
  }
  function checkoutHref(s) { return "/api/checkout?state=" + encodeURIComponent(s.code); }
  function buyHref(s) {
    return ME.signedIn ? checkoutHref(s) : "/sign-in?redirect_url=" + encodeURIComponent(checkoutHref(s));
  }
  function buyPanel(s, lead, api) {
    var exp = expiry(s.code);
    var lapsed = exp !== null && exp <= Date.now();
    var hasAudio = stateHasAudio(s, api);
    var hasVideo = stateHasVideo(s);
    var freeId = firstChapterId(s);
    var slug = String(s.code || "").toLowerCase();
    var ch1Mods = (freeId && api && api.modulesReal) ? api.modulesReal(freeId) : [];
    var firstUnit = (ch1Mods && ch1Mods[0] && ch1Mods[0].unit_id) || "";
    var freeStartHref = firstUnit
      ? ("#/" + esc(slug) + "/" + (hasVideo ? "lesson/" : "read/") + esc(firstUnit))
      : (freeId ? "#/" + esc(slug) + "/chapter/" + esc(freeId) : "");
    return '<section class="card gate-buy-card" data-gate-buy="' + esc(s.code) + '">'
      + '<div class="gate-buy-top"><span class="course-kicker">FULL STATE COURSE · ONE-TIME UNLOCK</span><span class="gate-price-pill">' + PRICE + ' · 1 year</span></div>'
      + '<h2>' + esc(lead || ("Unlock the full " + stateName(s) + " course")) + " — " + PRICE + '</h2>'
      + (lapsed ? '<p class="gate-lapsed">Your ' + esc(stateName(s)) + " access ended on " + esc(new Date(exp).toISOString().slice(0, 10)) + '. Unlocking again starts a new full year.</p>' : '')
      + '<p class="gate-lead"><b>One state, one year, no subscription.</b> Every built chapter of the official ' + esc(s.handbook) + ' course — guided lessons, active-recall flashcards, module quizzes, and chapter practice tests — for one year from purchase. Nothing ever auto-renews.</p>'
      + '<ul class="gate-feature-list">'
      + '<li>✓ Chapter 1 stays free — every card and question cites its handbook chapter and page</li>'
      + (hasVideo ? '<li>✓ 1080p narrated lesson videos included with synced page-flip reading</li>' : '')
      + '<li>✓ ' + (hasAudio ? 'Narration audio included — pre-recorded teacher lessons and flashcards' : 'Text lessons, active-recall flashcards, and chapter practice tests (narration is not included yet)') + '</li>'
      + '<li>✓ Full 7-day refund — email <a href="mailto:' + SUPPORT + '">' + SUPPORT + '</a></li>'
      + '</ul>'
      + '<div class="gate-cta-row"><a class="btn gate-buy-btn" data-gate-cta href="' + esc(buyHref(s)) + '">' + (ME.signedIn ? "Unlock " + esc(stateName(s)) + " — " + PRICE : "Sign in to unlock " + esc(stateName(s)) + " — " + PRICE) + '</a>'
      + (freeStartHref ? '<a class="btn secondary-btn" href="' + freeStartHref + '">Start Chapter 1 free →</a>' : '')
      + '</div>'
      + '<p class="muted gate-fineprint">Practice only — not an official test, not affiliated with any state agency.</p>'
      + '</section>';
  }

  // ------------------------------------------------------------------ routes
  function sectionOfRoute(sub, api) {
    var p0 = sub[0] || "", id = decodeURIComponent(sub[1] || "");
    if (p0 === "chapter") return { known: !!api.sectionMeta(id), section: id };
    if (p0 === "module") return { known: true, section: api.sectionOfModule(id) };
    if (p0 === "lesson" || p0 === "read" || p0 === "cards" || p0 === "quiz") return { known: true, section: api.sectionOfUnit(id) };
    if (p0 === "practice" && sub[1]) {
      var f = api.practiceForms().filter(function (x) { return x.form_id === id; })[0];
      return { known: true, section: f ? f.section_id : null };
    }
    return null;
  }
  function builtSet(api) {
    var m = api.manifest();
    var out = new Set();
    ((m && m.files) || []).forEach(function (e) { if (e.stage_id === "03.combined_kg") out.add(e.section_id); });
    return out;
  }
  function overview(s, api, isChapters) {
    var built = builtSet(api);
    var free = firstChapterId(s);
    var secs = api.sections();
    var hasAudio = stateHasAudio(s, api);
    var hasVideo = stateHasVideo(s);
    var ch1Mods = (free && api.modulesReal) ? api.modulesReal(free) : [];
    var u0 = (ch1Mods && ch1Mods[0] && ch1Mods[0].unit_id) || "";
    var quickCh1 = u0
      ? '<div class="module-quick-actions">'
        + (hasVideo ? '<a class="mod-quick-btn is-mint" href="' + api.P() + 'lesson/' + esc(u0) + '">▶ Lesson 1 Video</a>' : '')
        + '<a class="mod-quick-btn' + (!hasVideo ? ' is-mint' : '') + '" href="' + api.P() + 'read/' + esc(u0) + '">📖 Flip Reading</a>'
        + '<a class="mod-quick-btn" href="' + api.P() + 'cards/' + esc(u0) + '">⚡ Flashcards</a>'
        + '<a class="mod-quick-btn" href="' + api.P() + 'quiz/' + esc(u0) + '">✓ Quiz</a>'
        + '</div>'
      : '';
    return '<header class="course-hero"><div class="hero-badges"><span class="state-monogram">' + esc(s.code) + '</span><span class="free-pill">★ Chapter 1 Free Preview</span>' + (hasVideo ? '<span class="video-pill">🎬 1080p lesson videos</span>' : '') + (hasAudio ? '<span class="audio-pill">🎧 Narration audio included</span>' : '') + '</div>'
      + '<h1>' + (isChapters ? "Chapters — " : "") + esc(api.HB()) + (isChapters ? "" : " — written-test prep") + '</h1>'
      + (!isChapters ? '<p class="course-intro course-real-note">' + esc(api.realNote()) + '</p>' : '')
      + '<p class="course-intro">Chapter 1 is completely free — ' + (hasVideo ? '1080p video walkthroughs, page-flip reading, ' : 'page-flip reading, ') + 'flashcards, and module quizzes. Unlock all ' + secs.length + ' chapters of the ' + esc(stateName(s)) + ' course for ' + PRICE + ' (one year, no subscription).</p>'
      + '</header>'
      + buyPanel(s, null, api)
      + '<section class="chapter-modules locked-roadmap" aria-label="Course chapters"><div class="section-label"><h2>Official handbook chapters</h2><span>Chapter 1 free · Chapters 2–' + secs.length + ' in full course</span></div>'
      + secs.map(function (c) {
        var idxBadge = '<span class="module-index">' + String(c.n).padStart(2, "0") + '</span>';
        var head = '<h2>Chapter ' + esc(c.n) + ' — ' + esc(c.title) + '</h2>';
        if (!built.has(c.id)) {
          return '<div class="module-tile is-unavailable">' + idxBadge + '<div class="module-details">' + head + '<p class="muted">Not yet built — this chapter is being prepared.</p></div><span class="module-open">Soon</span></div>';
        }
        if (c.id === free) {
          return '<div class="module-tile is-free-chapter" data-gate-free="' + esc(c.id) + '">' + idxBadge + '<div class="module-details"><div class="chapter-row-head">' + head + '<span class="free-pill">Free chapter</span></div><p class="muted">Open immediately — jump straight into Lesson 1 below or view all Chapter 1 modules.</p>' + quickCh1 + '</div><a class="btn" href="' + api.P() + 'chapter/' + esc(c.id) + '">All modules →</a></div>';
        }
        return '<div class="module-tile is-locked-chapter" data-gate-locked="' + esc(c.id) + '">' + idxBadge + '<div class="module-details"><div class="chapter-row-head">' + head + '<span class="locked-pill">Full course</span></div><p class="muted">Included with the full ' + esc(stateName(s)) + ' course (' + PRICE + ', one year).</p></div><a class="module-lock-cta" href="' + esc(buyHref(s)) + '">Unlock →</a></div>';
      }).join("")
      + (function () {
        var signCount = STATE_SIGN_COUNTS[s.code] || 0;
        return '<div class="module-tile is-free-chapter is-road-signs-tile" data-road-signs-entry data-gate-free="signs">'
          + '<span class="module-index is-signs-index" aria-hidden="true">' + SIGN_YIELD_SVG + '</span>'
          + '<div class="module-details"><div class="chapter-row-head"><h2>Road signs</h2><span class="free-pill">★ Free module</span></div>'
          + '<p class="muted">' + (signCount ? 'The ' + signCount + ' signs the ' + esc(stateName(s)) + ' handbook expects you to know' : 'Every road sign in the ' + esc(stateName(s)) + ' handbook') + ' — hub, flashcards, and 20-question sign test.</p>'
          + '<div class="module-quick-actions">'
          + '<a class="mod-quick-btn is-mint" href="' + api.P() + 'signs">🛑 Signs Hub</a>'
          + '<a class="mod-quick-btn" href="' + api.P() + 'signs/cards">⚡ Study cards</a>'
          + '<a class="mod-quick-btn" href="' + api.P() + 'signs/test">✓ Sign test</a>'
          + '</div></div>'
          + '<a class="btn" href="' + api.P() + 'signs">Open signs →</a></div>';
      })()
      + '</section>';
  }
  function route(s, sub, api) {
    if (!s || entitled(s.code)) return null;
    var p0 = sub[0] || "";
    var note = api.realNote();
    if (p0 === "") return { html: overview(s, api, false), nav: "home", banner: "real", bannerText: note };
    if (p0 === "chapters") return { html: overview(s, api, true), nav: "chapters", banner: "real", bannerText: note };
    var r = sectionOfRoute(sub, api);
    if (!r) return null;
    if (p0 === "chapter" && !r.known) return null;
    if (r.section && isFree(s, r.section)) return null;
    var meta = r.section ? api.sectionMeta(r.section) : null;
    var title = meta ? "Chapter " + meta.n + " — " + meta.title : "This part of the " + stateName(s) + " course";
    return {
      html: '<nav class="course-breadcrumb" aria-label="Breadcrumb"><a href="' + api.P() + 'chapters">All chapters</a><span aria-hidden="true">/</span><span aria-current="page">' + esc(meta ? "Chapter " + meta.n : "Full course") + '</span></nav>'
        + '<header class="course-hero"><p class="course-kicker">LOCKED CHAPTER · FULL COURSE</p><h1>' + esc(title) + '</h1>'
        + '<p class="course-intro">This chapter is part of the full ' + esc(stateName(s)) + ' course. Want to try the format first? <a href="' + api.P() + 'chapter/' + esc(firstChapterId(s)) + '">Start Chapter 1 free</a>.</p></header>'
        + buyPanel(s, "Unlock all " + api.sections().length + " " + stateName(s) + " chapters", api),
      nav: p0 === "practice" ? "practice" : "chapters",
      banner: "real",
      bannerText: note
    };
  }

  // ------------------------------------------------------------ post-render
  var TRACE_LINK = /\s?<a href="trace\.html">How it was made — belt trace<\/a>/g;
  var FREE_CLAIM = "Everything is free, with no account.";
  function after(s, sub, html, api) {
    var out = String(html).replace(TRACE_LINK, "");
    if (!s || !sub) return out;
    out = out.split(FREE_CLAIM).join("Chapter 1 of every state is free. The full state course is a one-time " + PRICE + " purchase for one year, tied to your account.");
    var p0 = sub[0] || "";
    if (p0 === "cards" && sub[1]) {
      var unit = decodeURIComponent(sub[1]);
      var mod = api.moduleForUnit(unit);
      var n = (HIDDEN[s.code] || []).filter(function (c) { return c.unit_id === unit || (mod && c.module_id === mod); }).length;
      if (n) out = out.replace("</h1>", '</h1>\n  <p class="muted heldback-pill" data-gate-heldback="' + n + '">' + n + " card" + (n === 1 ? "" : "s") + " held back for a wording fix</p>");
    }
    if (p0 === "real-cards") {
      var all = (HIDDEN[s.code] || []).length;
      if (all) out = out.replace("</h1>", '</h1>\n  <p class="muted heldback-pill" data-gate-heldback="' + all + '">' + all + " card" + (all === 1 ? "" : "s") + " held back for a wording fix</p>");
    }
    if (!entitled(s.code) && ((p0 === "practice" && !sub[1]) || ["dossier", "modules", "real-cards", "real-quiz", "real-lesson"].indexOf(p0) >= 0)) {
      out += buyPanel(s, "Chapters 2 and up are in the full " + stateName(s) + " course", api);
    }
    return out;
  }

  // Store footer
  function footer() {
    try {
      var f = document.querySelector && document.querySelector("footer.site");
      if (!f) return;
      f.innerHTML = 'PassLearnersPermit by DataPig LLC · <a href="/">Store Home</a> · <a href="/app/#/">All 51 Courses</a> · <a href="/support">Support</a> · <a href="/refunds">Refunds</a> · <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a>'
        + " · Practice only. Independent review in progress.";
    } catch (e) { /* no DOM (harness) */ }
  }
  try {
    if (document.readyState === "loading" && document.addEventListener) document.addEventListener("DOMContentLoaded", footer);
    else footer();
  } catch (e) { /* no DOM (harness) */ }

  function banner(s, kind, text) {
    if (kind === "synthetic") return text;
    return "Built from " + (s ? "the " + stateName(s) + " Driver Handbook" : "official driver handbooks") + ". Machine-checked; independent review in progress.";
  }

  function ensureDeckOverlay(s) {
    if (!s || !s.code) return Promise.resolve(null);
    var code = String(s.code).toUpperCase();
    if (Object.prototype.hasOwnProperty.call(DECK_OVERLAYS, code)) return Promise.resolve(DECK_OVERLAYS[code]);
    if (DECK_OVERLAY_PROMISES[code]) return DECK_OVERLAY_PROMISES[code];
    var slug = code.toLowerCase();
    DECK_OVERLAY_PROMISES[code] = getJson("decks/" + slug + ".json").catch(function () {
      return slug === "nd" ? getJson("decks/nd-sec01-genz.json").catch(function () { return null; }) : null;
    }).then(function (ov) {
      DECK_OVERLAYS[code] = (ov && typeof ov === "object" && ov.cards) ? ov : null;
      return DECK_OVERLAYS[code];
    });
    return DECK_OVERLAY_PROMISES[code];
  }

  function ensureStateVisuals(s) {
    if (!s || !s.code) return Promise.resolve(null);
    var code = String(s.code).toUpperCase();
    if (STATE_VISUALS[code]) return Promise.resolve(STATE_VISUALS[code]);
    if (STATE_VISUAL_PROMISES[code]) return STATE_VISUAL_PROMISES[code];
    STATE_VISUAL_PROMISES[code] = getJson("visuals/state/" + code.toLowerCase() + ".json").then(function (doc) {
      STATE_VISUALS[code] = (doc && typeof doc === "object") ? doc : { cards: {}, slides: {}, units: {}, items: {} };
      return STATE_VISUALS[code];
    }, function () {
      STATE_VISUALS[code] = { cards: {}, slides: {}, units: {}, items: {} };
      return STATE_VISUALS[code];
    });
    return STATE_VISUAL_PROMISES[code];
  }

  function renderSignFigure(sign) {
    if (!sign || !sign.file) return "";
    return '<figure class="road-sign"><div class="road-sign-frame"><img src="' + esc(sign.file) + '" alt="' + esc(sign.name || "Road sign") + '" loading="lazy"></div><figcaption><span class="sign-source-tag">FHWA MUTCD</span> <span>Sign standards: FHWA MUTCD 11th Ed.</span></figcaption></figure>';
  }
  function renderSceneFigure(sceneId) {
    if (!sceneId || !VISUAL_CATALOG || !VISUAL_CATALOG.scenes) return "";
    if (String(sceneId).indexOf("ref-") === 0) return "";
    var meta = VISUAL_CATALOG.scenes[sceneId];
    if (!meta || !meta.file) return "";
    var isMotion = !!meta.video || String(sceneId).indexOf("mot-") === 0;
    var tag = isMotion ? "Motion Rule Loop" : "Illustration";
    var cls = isMotion ? "visual-source-tag is-motion" : "visual-source-tag";
    var title = String(meta.title || "Driving Safety Illustration");
    if (meta.video) {
      return '<figure class="course-visual is-motion"><div class="course-visual-frame"><video src="' + esc(meta.video) + '" poster="' + esc(meta.file) + '" autoplay loop muted playsinline preload="metadata" aria-label="' + esc(title) + '"></video></div><figcaption><span class="' + cls + '">' + esc(tag) + '</span> <span>' + esc(title) + '</span></figcaption></figure>';
    }
    return '<figure class="course-visual"><div class="course-visual-frame"><img src="' + esc(meta.file) + '" alt="' + esc(title) + '" loading="lazy"></div><figcaption><span class="' + cls + '">' + esc(tag) + '</span> <span>' + esc(title) + '</span></figcaption></figure>';
  }
  function fallbackPillsForCard(card) {
    var hook = String((card && card.memory_hook) || "").trim();
    if (!hook) return ["OFFICIAL RULE", "ACTIVE RECALL"];
    var clauses = hook.split(/[,;—–-]+/).map(function (p) { return p.trim(); }).filter(Boolean);
    if (clauses.length >= 2) {
      return clauses.slice(0, 3).map(function (p) {
        return p.split(/\s+/).slice(0, 3).join(" ").toUpperCase();
      });
    }
    var words = hook.split(/\s+/).filter(Boolean);
    var out = [];
    for (var i = 0; i < words.length && out.length < 3; i += 2) {
      out.push(words.slice(i, i + 2).join(" ").toUpperCase());
    }
    return out.length ? out : ["OFFICIAL RULE"];
  }
  function cardMeta(s, card) {
    if (!s || !card) return { kicker: "ACTIVE RECALL", pills: ["OFFICIAL RULE"], audio_q: null, audio_teach: null, isGenZ: false };
    var ov = s.code ? DECK_OVERLAYS[String(s.code).toUpperCase()] : null;
    var m = ov && ov.cards && ov.cards[card.card_id];
    if (m && m.expected_back === card.back) {
      return {
        kicker: m.kicker || (card.high_yield ? "KEY TEST RULE" : "ACTIVE RECALL"),
        pills: Array.isArray(m.pills) && m.pills.length ? m.pills : fallbackPillsForCard(card),
        audio_q: m.audio_q || null,
        audio_teach: m.audio_teach || null,
        isGenZ: true
      };
    }
    return {
      kicker: card.high_yield ? "KEY TEST RULE" : "ACTIVE RECALL",
      pills: fallbackPillsForCard(card),
      audio_q: null,
      audio_teach: null,
      isGenZ: false
    };
  }
  function recapMeta(s, moduleId) {
    if (!s || !moduleId) return null;
    var ov = s.code ? DECK_OVERLAYS[String(s.code).toUpperCase()] : null;
    return (ov && ov.recaps && ov.recaps[moduleId]) || null;
  }
  function signForCard(s, card) {
    if (!s || !card || !card.card_id) return "";
    var c2s = CARD_TO_SIGN[s.code];
    var signId = c2s && c2s[card.card_id];
    if (signId && SIGNS_BY_ID[signId]) return renderSignFigure(SIGNS_BY_ID[signId]);
    return "";
  }
  function visualForCard(s, card) {
    if (!s || !card) return "";
    var sv = STATE_VISUALS[s.code];
    var cEntry = sv && sv.cards && sv.cards[card.card_id];
    if (!cEntry || cEntry.fallback || !cEntry.scene) return "";
    return renderSceneFigure(cEntry.scene);
  }
  function signForFacts() {
    return "";
  }
  function visualForSlide(s, unitId, slideIndex) {
    if (!s) return "";
    var sv = STATE_VISUALS[s.code];
    var list = sv && sv.slides && sv.slides[unitId];
    var slEntry = Array.isArray(list) ? list[slideIndex] : null;
    return (slEntry && !slEntry.fallback && slEntry.scene) ? renderSceneFigure(slEntry.scene) : "";
  }
  function visualForUnit(s, unitId, slot) {
    if (!s || !unitId || !slot) return "";
    var sv = STATE_VISUALS[s.code];
    var uEntry = sv && sv.units && sv.units[unitId];
    if (!uEntry || uEntry[slot + "_fallback"] || !uEntry[slot]) return "";
    return renderSceneFigure(uEntry[slot]);
  }
  function visualForItem(s, itemId) {
    if (!s) return "";
    var sv = STATE_VISUALS[s.code];
    var itEntry = sv && sv.items && itemId ? sv.items[itemId] : null;
    return (itEntry && !itEntry.fallback && itEntry.scene) ? renderSceneFigure(itEntry.scene) : "";
  }

  // --------------------------------------------------- interactive DOM mount
  var lastVisit = null, visitId = 0;
  function track(event, s, path, id) {
    try {
      var req = fetch("/api/track", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: event, state: s && s.code, path: path, eventId: id })
      });
      if (req && req.catch) req.catch(function () {});
    } catch (e) {}
  }

  function formatFillBlanks(view) {
    Array.prototype.slice.call(view.querySelectorAll("[data-fill-blank]")).forEach(function (el) {
      if (el.dataset.formattedBlank) return;
      el.dataset.formattedBlank = "1";
      var raw = el.textContent || "";
      if (!/\bblank\b/.test(raw)) return;
      var trimmed = raw.replace(/^[“"]([\s\S]*)[”"]$/, "$1");
      var parts = trimmed.split(/\bblank\b/);
      el.innerHTML = parts.map(function (p) { return esc(p); }).join('<span class="blank-slot" aria-label="blank">______</span>');
    });
    Array.prototype.slice.call(view.querySelectorAll("[data-why-how-text]")).forEach(function (el) {
      if (el.dataset.formattedRule) return;
      el.dataset.formattedRule = "1";
      var raw = el.textContent || "";
      var prefix = "Apply the whole statement, including its condition: ";
      if (raw.indexOf(prefix) === 0) {
        el.innerHTML = '<span class="rule-cond-badge">Rule</span> ' + esc(raw.slice(prefix.length));
      }
    });
  }

  function wirePickerSearch(view) {
    var tools = view.querySelector("[data-picker-tools]");
    if (!tools) return;
    var input = tools.querySelector("[data-picker-search]");
    var buttons = Array.prototype.slice.call(tools.querySelectorAll("[data-picker-filter]"));
    var cards = Array.prototype.slice.call(view.querySelectorAll("[data-state-card]"));
    var empty = view.querySelector("[data-picker-empty]");
    var mode = "all";
    function apply() {
      var q = ((input && input.value) || "").trim().toLowerCase();
      var shown = 0;
      cards.forEach(function (card) {
        var hay = card.getAttribute("data-search") || "";
        var audioOk = mode !== "audio" || card.getAttribute("data-has-audio") === "1";
        var queryOk = !q || hay.indexOf(q) >= 0;
        var vis = audioOk && queryOk;
        card.hidden = !vis;
        if (vis) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    }
    if (input) input.addEventListener("input", apply);
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        mode = btn.getAttribute("data-picker-filter") || "all";
        buttons.forEach(function (b) { b.classList.toggle("is-active", b === btn); });
        apply();
      });
    });
  }

  function mount(s, sub, view, api) {
    if (cleanupKeyHandler) {
      try { window.removeEventListener("keydown", cleanupKeyHandler); } catch (e) {}
      cleanupKeyHandler = null;
    }
    if (cleanupAutoTimer) {
      try { clearTimeout(cleanupAutoTimer); } catch (e) {}
      cleanupAutoTimer = 0;
    }
    if (!view || !view.querySelectorAll || !document.createElement) return;
    if (!s || !sub) {
      wirePickerSearch(view);
      return;
    }

    formatFillBlanks(view);
    (function syncBreakdowns() {
      var mob = false;
      try { mob = typeof window !== "undefined" && typeof window.innerWidth === "number" && window.innerWidth <= 768; } catch (e) {}
      Array.prototype.slice.call(view.querySelectorAll(".plp-opt-breakdown")).forEach(function (det) {
        det.open = !mob;
      });
    })();

    var path = "/app/" + (location.hash || "#/");
    var changed = lastVisit !== path;
    if (changed) { lastVisit = path; visitId++; }
    var key = "course:" + Date.now().toString(36) + ":" + visitId;
    if (changed && view.querySelector("[data-gate-buy]")) track("buy_panel_view", s, path, key + ":buy");
    if (changed && sub[0] === "chapter" && sub[1] === firstChapterId(s)) track("free_chapter_start", s, path, key + ":free");

    var rawP0 = sub[0] || "";
    var p0 = rawP0 === "signs"
      ? (sub[1] === "cards" ? "cards" : sub[1] === "test" ? "quiz" : "signs-hub")
      : rawP0;
    var selector = p0 === "cards" ? "[data-flashcard-page]" : p0 === "read" ? "[data-read-page]" : (p0 === "quiz" || p0 === "practice") ? "[data-ritem]" : null;
    var pages = selector ? Array.prototype.slice.call(view.querySelectorAll(selector)) : [];
    if (!pages.length || !pages[0].parentNode) return;

    var current = 0;
    if (rawP0 === "signs" && sub[1] === "cards" && sub[2]) {
      var targetSignId = decodeURIComponent(sub[2]);
      var signIdx = pages.findIndex(function (pg) { return pg.getAttribute("data-sign-id") === targetSignId; });
      if (signIdx >= 0) current = signIdx;
    } else if (rawP0 === "cards" && sub[2]) {
      var targetCardId = decodeURIComponent(sub[2]);
      var cardIdx = pages.findIndex(function (pg) { return pg.getAttribute("data-card-id") === targetCardId; });
      if (cardIdx >= 0) current = cardIdx;
    }
    var lastShown = -1;
    var graded = false;
    var doneBtn = null;
    var plpDeck = (p0 === "cards" || p0 === "read" || p0 === "quiz" || p0 === "practice") ? view.querySelector(".plp-deck") : null;
    var FLIP_MODE_KEY = "plp:flip-mode";
    var savedFlipPref = false;
    try {
      savedFlipPref = typeof localStorage !== "undefined" && localStorage.getItem(FLIP_MODE_KEY) === "instant";
    } catch (e) {}
    var plpInstantFlip = savedFlipPref;
    var plpAutoPlay = false;
    var revealedCards = {};
    var seenPages = {};
    seenPages[current] = true;
    var readDoneSaved = false;
    var plpJumpBtns = [];

    // Build top study navigation bar
    var shellBar = document.createElement("div");
    shellBar.className = "study-nav-shell" + (plpDeck ? " is-plp-hidden" : "");

    var progressTrack = document.createElement("div");
    progressTrack.className = "study-step-track";
    var progressFill = document.createElement("span");
    progressFill.className = "study-step-fill";
    progressTrack.appendChild(progressFill);
    shellBar.appendChild(progressTrack);

    var holder = document.createElement("div");
    holder.className = "study-pager";
    holder.setAttribute("aria-label", "Study navigation");
    var prev = document.createElement("button");
    prev.type = "button";
    prev.className = "secondary pager-btn";
    prev.textContent = "← Previous";
    var status = document.createElement("span");
    status.className = "pager-status";
    status.setAttribute("aria-live", "polite");
    var next = document.createElement("button");
    next.type = "button";
    next.className = "pager-btn";
    next.textContent = "Next →";
    holder.appendChild(prev);
    holder.appendChild(status);
    holder.appendChild(next);
    shellBar.appendChild(holder);

    // Optional step pills (lesson steps or quiz question dots)
    var pillStrip = null;
    var pillButtons = [];
    if (p0 === "lesson" || p0 === "quiz" || p0 === "practice") {
      pillStrip = document.createElement("div");
      pillStrip.className = "step-pill-strip";
      pillStrip.setAttribute("role", "tablist");
      pages.forEach(function (pg, idx) {
        var pill = document.createElement("button");
        pill.type = "button";
        pill.className = "step-dot" + (p0 === "lesson" ? " is-lesson-pill" : "");
        pill.textContent = p0 === "lesson" ? (pg.getAttribute("data-step-label") || ("Step " + (idx + 1))) : String(idx + 1);
        pill.addEventListener("click", function () {
          if (graded) return;
          current = idx;
          show();
        });
        pillButtons.push(pill);
        pillStrip.appendChild(pill);
      });
      shellBar.appendChild(pillStrip);
    }

    // Flashcard confidence counter
    var confidenceNote = null;
    var ratings = {};
    if (p0 === "cards") {
      confidenceNote = document.createElement("div");
      confidenceNote.className = "deck-confidence-bar";
      confidenceNote.hidden = true;
      shellBar.appendChild(confidenceNote);
    }

    pages[0].parentNode.insertBefore(shellBar, pages[0]);

    function answeredCount() {
      if (p0 !== "quiz" && p0 !== "practice") return 0;
      return pages.filter(function (pg) { return !!pg.querySelector(".option[aria-pressed='true']"); }).length;
    }

    function updateQuizUI() {
      if (p0 !== "quiz" && p0 !== "practice") return;
      var ansCount = answeredCount();
      pillButtons.forEach(function (pill, idx) {
        var hasPick = !!pages[idx].querySelector(".option[aria-pressed='true']");
        pill.classList.toggle("is-answered", hasPick);
        pill.classList.toggle("is-current", idx === current);
      });
      var submitBar = view.querySelector("[data-quiz-submit-bar]");
      var submitBtn = submitBar && submitBar.querySelector(".btn-check-answers");
      if (submitBtn) {
        submitBtn.textContent = ansCount === pages.length
          ? "Check all " + pages.length + " answers"
          : "Check answers (" + ansCount + " of " + pages.length + " answered)";
      }
      if (submitBar && !graded) {
        var hasOpenConfirm = !!submitBar.querySelector("[data-partial-confirm]:not([hidden])");
        submitBar.hidden = !(hasOpenConfirm || current === pages.length - 1 || ansCount > 0);
      }
    }

    var cardTotal = (p0 === "cards" && pages.length && pages[pages.length - 1].hasAttribute("data-recap-page"))
      ? pages.length - 1
      : pages.length;

    function updatePlpHud() {
      if (!plpDeck) return;
      var xpFillEl = plpDeck.querySelector("[data-plp-xp-fill]");
      var xpValEl = plpDeck.querySelector("[data-plp-xp-val]");
      var posEl = plpDeck.querySelector("[data-plp-pos]");
      var mobPosEl = plpDeck.querySelector("[data-plp-mobile-pos]");
      var mintFillEl = plpDeck.querySelector("[data-plp-mint-fill]");
      var plpPrevBtn = plpDeck.querySelector("[data-plp-prev]");
      var plpNextBtn = plpDeck.querySelector("[data-plp-next]");

      if (p0 === "read") {
        var mobXpEl = plpDeck.querySelector("[data-plp-xp-val-mob]");
        var seenCount = Object.keys(seenPages).length;
        var readPct = pages.length > 0 ? Math.round((seenCount / pages.length) * 100) : 0;
        if (xpFillEl) xpFillEl.style.width = readPct + "%";
        if (xpValEl) xpValEl.textContent = seenCount + " / " + pages.length + " READ";
        if (mobXpEl) mobXpEl.textContent = seenCount + " / " + pages.length + " READ";
        if (posEl) posEl.textContent = "Page " + (current + 1) + " of " + pages.length;
        if (mobPosEl) {
          var rPrefix = mobPosEl.getAttribute("data-plp-mobile-prefix") || "";
          mobPosEl.textContent = (rPrefix ? rPrefix + " · " : "") + "P " + (current + 1) + "/" + pages.length;
        }
        if (mintFillEl) mintFillEl.style.width = Math.round(((current + 1) / pages.length) * 100) + "%";
        if (plpPrevBtn) plpPrevBtn.disabled = current === 0;
        if (plpNextBtn) {
          plpNextBtn.disabled = false;
          plpNextBtn.textContent = current === pages.length - 1 ? "Flashcards →" : "Next →";
        }
        plpJumpBtns.forEach(function (jb, idx) {
          jb.classList.toggle("is-current", idx === current);
          jb.classList.toggle("is-got", !!seenPages[idx] && idx !== current);
          jb.classList.toggle("is-seen", !!seenPages[idx]);
        });
        return;
      }

      if (p0 === "quiz" || p0 === "practice") {
        if (graded) return;
        var ansCount = answeredCount();
        var ansPct = pages.length > 0 ? Math.round((ansCount / pages.length) * 100) : 0;
        if (xpFillEl) xpFillEl.style.width = ansPct + "%";
        if (xpValEl) xpValEl.textContent = ansCount + " / " + pages.length + " ANS";
        if (posEl) posEl.textContent = "Question " + (current + 1) + " of " + pages.length;
        if (mobPosEl) {
          var qPrefix = mobPosEl.getAttribute("data-plp-mobile-prefix") || "";
          mobPosEl.textContent = (qPrefix ? qPrefix + " · " : "") + "Q " + (current + 1) + "/" + pages.length;
        }
        if (mintFillEl) mintFillEl.style.width = Math.round(((current + 1) / pages.length) * 100) + "%";
        if (plpPrevBtn) plpPrevBtn.disabled = current === 0;
        if (plpNextBtn) plpNextBtn.disabled = current === pages.length - 1;
        plpJumpBtns.forEach(function (jb, idx) {
          var hasPick = !!pages[idx].querySelector(".option[aria-pressed='true']");
          jb.classList.toggle("is-current", idx === current);
          jb.classList.toggle("is-got", hasPick && idx !== current);
          jb.classList.toggle("is-seen", hasPick);
        });
        return;
      }

      var xpCount = 0;
      for (var ci = 0; ci < cardTotal; ci++) {
        if (revealedCards[ci] || ratings[ci]) xpCount++;
      }
      var xpVal = xpCount * 25;
      var xpMax = cardTotal * 25;
      var xpPct = cardTotal > 0 ? Math.round((xpCount / cardTotal) * 100) : 0;
      if (xpFillEl) xpFillEl.style.width = xpPct + "%";
      if (xpValEl) xpValEl.textContent = xpVal + " / " + xpMax + " XP";

      var isRecap = pages[current] && pages[current].hasAttribute("data-recap-page");
      if (posEl) {
        posEl.textContent = isRecap ? "Deck recap" : ("Card " + (current + 1) + " of " + cardTotal);
      }
      if (mobPosEl) {
        var mobPrefix = mobPosEl.getAttribute("data-plp-mobile-prefix") || "";
        mobPosEl.textContent = (mobPrefix ? mobPrefix + " · " : "") + (isRecap ? "RECAP" : ("CARD " + (current + 1) + "/" + cardTotal));
      }
      if (mintFillEl) {
        mintFillEl.style.width = Math.round(((current + 1) / pages.length) * 100) + "%";
      }
      if (plpPrevBtn) plpPrevBtn.disabled = current === 0;
      if (plpNextBtn) plpNextBtn.disabled = current === pages.length - 1;

      plpJumpBtns.forEach(function (jb, idx) {
        jb.classList.toggle("is-current", idx === current);
        jb.classList.toggle("is-got", ratings[idx] === "got");
        jb.classList.toggle("is-again", ratings[idx] === "again");
        jb.classList.toggle("is-seen", !!revealedCards[idx] && !ratings[idx]);
      });
    }

    function syncInstantBtn() {
      var plpInstantBtn = plpDeck && plpDeck.querySelector("[data-plp-instant]");
      if (!plpInstantBtn) return;
      plpInstantBtn.setAttribute("aria-pressed", plpInstantFlip ? "true" : "false");
      plpInstantBtn.classList.toggle("is-instant-on", plpInstantFlip);
      var labelText = plpInstantFlip ? "Instant Flip: ON" : "3s Recall: ON";
      plpInstantBtn.setAttribute("title", labelText);
      plpInstantBtn.setAttribute("aria-label", labelText);
      var ic = plpInstantBtn.querySelector(".plp-ctrl-icon");
      var lb = plpInstantBtn.querySelector(".plp-ctrl-label");
      if (ic && lb) {
        ic.textContent = plpInstantFlip ? "⚡" : "⏱";
        lb.textContent = labelText;
      } else {
        plpInstantBtn.textContent = (plpInstantFlip ? "⚡ " : "⏱ ") + labelText;
      }
    }

    function setAutoPlay(on) {
      plpAutoPlay = !!on;
      if (cleanupAutoTimer) {
        try { clearTimeout(cleanupAutoTimer); } catch (e) {}
        cleanupAutoTimer = 0;
      }
      // Lean-back mode forces instant while running and restores saved flip-mode after (R2)
      plpInstantFlip = plpAutoPlay ? true : savedFlipPref;
      syncInstantBtn();
      var autoBtn = plpDeck && plpDeck.querySelector("[data-plp-autoplay]");
      if (autoBtn) {
        autoBtn.classList.toggle("is-playing", plpAutoPlay);
        autoBtn.setAttribute("aria-pressed", plpAutoPlay ? "true" : "false");
        var aLabel = plpAutoPlay ? "Stop Auto-Play" : "Auto-Play Deck";
        autoBtn.setAttribute("title", aLabel);
        autoBtn.setAttribute("aria-label", aLabel);
        var aIc = autoBtn.querySelector(".plp-ctrl-icon");
        var aLb = autoBtn.querySelector(".plp-ctrl-label");
        if (aIc && aLb) {
          aIc.textContent = plpAutoPlay ? "⏹" : "▶";
          aLb.textContent = aLabel;
        } else {
          autoBtn.textContent = (plpAutoPlay ? "⏹ " : "▶ ") + aLabel;
        }
      }
      if (!plpAutoPlay && api && api.stopAudio) {
        try { api.stopAudio(); } catch (e) {}
      }
    }

    function playActivePageForAuto() {
      if (!plpAutoPlay || !pages[current]) return;
      var active = pages[current];
      var cBtn = active.querySelector("[data-card-audio]");
      if (cBtn) {
        if (!cBtn.classList.contains("is-playing")) cBtn.click();
        return;
      }
      var rBtn = active.querySelector("[data-recap-audio]");
      if (rBtn) {
        if (!rBtn.classList.contains("is-playing")) rBtn.click();
        return;
      }
      setAutoPlay(false);
    }

    function markReadComplete() {
      if (readDoneSaved || !sub[1]) return;
      readDoneSaved = true;
      var unitId = decodeURIComponent(sub[1] || "");
      var storageKey = s.code === "UT" ? "nova-preview:v1:ut-handbook" : "nova-preview:v1:" + s.code.toLowerCase() + "-handbook";
      try {
        var saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
        saved.progress = saved.progress || {};
        saved.progress[unitId] = saved.progress[unitId] || {};
        saved.progress[unitId].read = true;
        if (!stateHasVideo(s)) saved.progress[unitId].lesson = true;
        localStorage.setItem(storageKey, JSON.stringify(saved));
      } catch (e) {}
      track("lesson_complete", s, path, key + ":read");
      if (view && view.dispatchEvent && typeof CustomEvent === "function") {
        try { view.dispatchEvent(new CustomEvent("nova:progress-updated")); } catch (e) {}
      }
    }

    function show() {
      if (graded) return;
      var pageChanged = lastShown >= 0 && lastShown !== current;
      if (pageChanged && api && api.stopAudio) {
        try { api.stopAudio(); } catch (e) {}
      }
      lastShown = current;
      seenPages[current] = true;
      pages.forEach(function (page, i) { page.hidden = i !== current; });
      prev.disabled = current === 0;
      next.disabled = current === pages.length - 1;
      var pct = Math.round(((current + 1) / pages.length) * 100);
      progressFill.style.width = pct + "%";

      if (p0 === "lesson") {
        var stepName = pages[current].getAttribute("data-step-label") || ("Step " + (current + 1));
        status.textContent = stepName + " · " + (current + 1) + " of " + pages.length;
        pillButtons.forEach(function (p, idx) { p.classList.toggle("is-current", idx === current); });
      } else if (p0 === "read") {
        var rStep = pages[current].getAttribute("data-step-label") || ("Page " + (current + 1));
        status.textContent = rStep + " · Page " + (current + 1) + " of " + pages.length;
        if (current === pages.length - 1) markReadComplete();
        if (pageChanged && plpDeck && plpDeck.scrollIntoView) {
          try {
            var rect = plpDeck.getBoundingClientRect();
            if (rect && rect.top < 0) plpDeck.scrollIntoView({ block: "start", behavior: "smooth" });
          } catch (e) {}
        }
      } else if (p0 === "cards") {
        var isRecap = pages[current].hasAttribute("data-recap-page");
        status.textContent = isRecap ? "Deck recap · Complete" : "Card " + (current + 1) + " of " + cardTotal;
      } else {
        status.textContent = "Question " + (current + 1) + " of " + pages.length + " · " + answeredCount() + " answered";
      }

      if (doneBtn && doneBtn.dataset.alreadyDone !== "1") {
        doneBtn.disabled = current !== pages.length - 1;
      }
      updateQuizUI();
      updatePlpHud();
    }

    prev.addEventListener("click", function () { if (current > 0) { if (plpAutoPlay) setAutoPlay(false); current--; show(); } });
    next.addEventListener("click", function () { if (current < pages.length - 1) { if (plpAutoPlay) setAutoPlay(false); current++; show(); } });

    // Lesson explicit completion button
    if (p0 === "lesson") {
      var storageKey = s.code === "UT" ? "nova-preview:v1:ut-handbook" : "nova-preview:v1:" + s.code.toLowerCase() + "-handbook";
      var alreadyDone = false;
      try {
        var existing = JSON.parse(localStorage.getItem(storageKey) || "{}");
        alreadyDone = !!(existing.progress && existing.progress[sub[1]] && existing.progress[sub[1]].lesson);
      } catch (e) {}

      doneBtn = document.createElement("button");
      doneBtn.type = "button";
      doneBtn.className = "complete-lesson" + (alreadyDone ? " is-completed" : "");
      doneBtn.textContent = alreadyDone ? "✓ Lesson completed" : "✓ Mark lesson complete";
      if (alreadyDone) {
        doneBtn.disabled = true;
        doneBtn.dataset.alreadyDone = "1";
      }
      var slot = view.querySelector("[data-lesson-finish-slot]");
      if (slot) slot.insertBefore(doneBtn, slot.firstChild);
      else view.appendChild(doneBtn);

      doneBtn.addEventListener("click", function () {
        if (doneBtn.disabled) return;
        try {
          var saved = JSON.parse(localStorage.getItem(storageKey) || "{}");
          saved.progress = saved.progress || {};
          saved.progress[sub[1]] = saved.progress[sub[1]] || {};
          saved.progress[sub[1]].lesson = true;
          localStorage.setItem(storageKey, JSON.stringify(saved));
        } catch (e) {}
        track("lesson_complete", s, path, key + ":complete");
        doneBtn.disabled = true;
        doneBtn.dataset.alreadyDone = "1";
        doneBtn.classList.add("is-completed");
        doneBtn.textContent = "✓ Lesson complete — ready for flashcards!";
      });
    }

    // Page-flip Reading deck jumper & prev/next controls
    if (p0 === "read" && plpDeck) {
      var rPrev = plpDeck.querySelector("[data-plp-prev]");
      var rNext = plpDeck.querySelector("[data-plp-next]");
      var rJumper = plpDeck.querySelector("[data-plp-jumper]");
      var rBar = plpDeck.querySelector(".plp-deck-bar");
      var nextStepHref = rBar ? rBar.getAttribute("data-next-href") : null;
      if (rPrev) rPrev.addEventListener("click", function () { prev.click(); });
      if (rNext) {
        rNext.addEventListener("click", function () {
          if (current < pages.length - 1) {
            next.click();
          } else if (nextStepHref) {
            markReadComplete();
            location.hash = nextStepHref;
          }
        });
      }
      if (rJumper) {
        pages.forEach(function (pg, idx) {
          var jb = document.createElement("button");
          jb.type = "button";
          jb.className = "plp-jump-pill";
          jb.textContent = String(idx + 1);
          var lbl = pg.getAttribute("data-step-label") || ("Page " + (idx + 1));
          jb.setAttribute("aria-label", "Jump to page " + (idx + 1) + ": " + lbl);
          jb.setAttribute("title", "Page " + (idx + 1) + ": " + lbl);
          jb.addEventListener("click", function () {
            current = idx;
            show();
          });
          plpJumpBtns.push(jb);
          rJumper.appendChild(jb);
        });
      }
    }

    // Flashcard recall/instant controls, disclosure sync & self-rating buttons
    if (p0 === "cards") {
      var syncCoachDisclosures = function () {
        var isMobile = false;
        try { isMobile = typeof window !== "undefined" && typeof window.innerWidth === "number" && window.innerWidth <= 768; } catch (e) {}
        Array.prototype.slice.call(view.querySelectorAll("[data-plp-coach]")).forEach(function (det) {
          det.open = !isMobile;
        });
      };
      syncCoachDisclosures();

      if (plpDeck) {
        var plpPrev = plpDeck.querySelector("[data-plp-prev]");
        var plpNext = plpDeck.querySelector("[data-plp-next]");
        var plpJumper = plpDeck.querySelector("[data-plp-jumper]");
        var plpInstantBtn = plpDeck.querySelector("[data-plp-instant]");
        var plpAutoBtn = plpDeck.querySelector("[data-plp-autoplay]");

        syncInstantBtn();

        if (plpPrev) plpPrev.addEventListener("click", function () { prev.click(); });
        if (plpNext) plpNext.addEventListener("click", function () { next.click(); });
        if (plpJumper) {
          pages.forEach(function (pg, idx) {
            var jb = document.createElement("button");
            jb.type = "button";
            var isRec = pg.hasAttribute("data-recap-page");
            jb.className = "plp-jump-pill" + (isRec ? " is-recap-pill" : "");
            jb.textContent = isRec ? "★ Recap" : String(idx + 1);
            jb.setAttribute("aria-label", isRec ? "Jump to deck recap" : ("Jump to card " + (idx + 1)));
            jb.addEventListener("click", function () {
              if (graded) return;
              if (plpAutoPlay) setAutoPlay(false);
              current = idx;
              show();
            });
            plpJumpBtns.push(jb);
            plpJumper.appendChild(jb);
          });
        }
        if (plpInstantBtn) {
          plpInstantBtn.addEventListener("click", function () {
            if (plpAutoPlay) setAutoPlay(false);
            savedFlipPref = !savedFlipPref;
            plpInstantFlip = savedFlipPref;
            try {
              localStorage.setItem(FLIP_MODE_KEY, savedFlipPref ? "instant" : "recall");
            } catch (e) {}
            syncInstantBtn();
          });
        }
        if (plpAutoBtn) {
          plpAutoBtn.addEventListener("click", function () {
            if (plpAutoPlay) {
              setAutoPlay(false);
            } else {
              setAutoPlay(true);
              playActivePageForAuto();
            }
          });
          view.addEventListener("nova:card-arc-ended", function () {
            if (!plpAutoPlay || graded) return;
            if (cleanupAutoTimer) { try { clearTimeout(cleanupAutoTimer); } catch (e) {} }
            cleanupAutoTimer = setTimeout(function () {
              cleanupAutoTimer = 0;
              if (!plpAutoPlay || graded) return;
              if (current < pages.length - 1) {
                current++;
                show();
                playActivePageForAuto();
              } else {
                setAutoPlay(false);
              }
            }, 650);
          });
          view.addEventListener("nova:recap-ended", function () {
            if (plpAutoPlay) setAutoPlay(false);
          });
        }
      }

      pages.forEach(function (cardEl, idx) {
        if (cardEl.hasAttribute("data-recap-page")) return;
        var recallBtn = cardEl.querySelector("[data-recall]");
        var beatWrap = cardEl.querySelector("[data-beat-wrap]");
        var beatEl = cardEl.querySelector("[data-beat]");
        var ansEl = cardEl.querySelector("[data-answer]");
        var hookLocked = cardEl.querySelector("[data-plp-hook-locked]");
        var hookOpen = cardEl.querySelector("[data-plp-hook-open]");

        var syncCardRevealed = function () {
          if (!ansEl || ansEl.hidden) return;
          revealedCards[idx] = true;
          cardEl.classList.add("is-revealed");
          if (hookLocked) hookLocked.hidden = true;
          if (hookOpen) hookOpen.hidden = false;
          updatePlpHud();
        };

        if (recallBtn && beatWrap && ansEl) {
          var skipBtn = document.createElement("button");
          skipBtn.type = "button";
          skipBtn.className = "skip-beat-btn";
          skipBtn.hidden = true;
          skipBtn.textContent = "Show answer now";
          beatWrap.appendChild(skipBtn);
          recallBtn.addEventListener("click", function () {
            if (plpDeck && plpInstantFlip) {
              setTimeout(function () { skipBtn.click(); }, 0);
              return;
            }
            setTimeout(function () {
              if (ansEl.hidden) skipBtn.hidden = false;
            }, 40);
          });
          skipBtn.addEventListener("click", function () {
            skipBtn.hidden = true;
            if (beatEl) beatEl.hidden = true;
            ansEl.hidden = false;
            recallBtn.disabled = true;
            recallBtn.textContent = "Answer shown";
            syncCardRevealed();
          });
          // Hide skip button & unlock companion hook once the answer reveals
          var obs = typeof MutationObserver !== "undefined" ? new MutationObserver(function () {
            if (!ansEl.hidden) {
              skipBtn.hidden = true;
              syncCardRevealed();
            }
          }) : null;
          if (obs) obs.observe(ansEl, { attributes: true, attributeFilter: ["hidden"] });
        }

        var rateSlot = cardEl.querySelector("[data-self-rate]");
        if (rateSlot) {
          var rateLabel = document.createElement("span");
          rateLabel.className = "self-rate-prompt";
          rateLabel.textContent = "How well did you recall it?";
          var btnAgain = document.createElement("button");
          btnAgain.type = "button";
          btnAgain.className = "secondary rate-btn is-again-btn";
          btnAgain.textContent = "↻ Show again";
          var btnGot = document.createElement("button");
          btnGot.type = "button";
          btnGot.className = "rate-btn is-got-it";
          btnGot.textContent = idx < pages.length - 1 ? "✓ Got it (+25 XP) →" : "✓ Got it (+25 XP)";
          var updateConfidence = function (val) {
            ratings[idx] = val;
            revealedCards[idx] = true;
            btnAgain.classList.toggle("is-selected", val === "again");
            btnGot.classList.toggle("is-selected", val === "got");
            var gotCount = Object.keys(ratings).filter(function (k) { return ratings[k] === "got"; }).length;
            var againCount = Object.keys(ratings).filter(function (k) { return ratings[k] === "again"; }).length;
            if (confidenceNote) {
              confidenceNote.hidden = false;
              confidenceNote.textContent = "Session check: " + gotCount + " solid · " + againCount + " marked for another look";
            }
            updatePlpHud();
          };
          btnAgain.addEventListener("click", function () {
            if (plpAutoPlay) setAutoPlay(false);
            updateConfidence("again");
            if (current < pages.length - 1) { current++; show(); }
          });
          btnGot.addEventListener("click", function () {
            if (plpAutoPlay) setAutoPlay(false);
            updateConfidence("got");
            if (current < pages.length - 1) { current++; show(); }
          });
          rateSlot.appendChild(rateLabel);
          rateSlot.appendChild(btnAgain);
          rateSlot.appendChild(btnGot);
        }
      });
    }

    // Quiz & Practice live option state + Neo-Pop jumper + submit guard
    if (p0 === "quiz" || p0 === "practice") {
      var form = pages[0].closest("form");
      var partialBox = null;
      var confirmedPartial = false;

      function hidePartialConfirm() {
        if (partialBox) partialBox.hidden = true;
        var mainSubmit = view.querySelector("[data-quiz-submit-bar] .btn-check-answers");
        if (mainSubmit) mainSubmit.hidden = false;
      }

      if (plpDeck) {
        var qPrev = plpDeck.querySelector("[data-plp-prev]");
        var qNext = plpDeck.querySelector("[data-plp-next]");
        var qJumper = plpDeck.querySelector("[data-plp-jumper]");
        if (qPrev) qPrev.addEventListener("click", function () { prev.click(); });
        if (qNext) qNext.addEventListener("click", function () { next.click(); });
        if (qJumper) {
          pages.forEach(function (pg, idx) {
            var jb = document.createElement("button");
            jb.type = "button";
            jb.className = "plp-jump-pill";
            jb.textContent = String(idx + 1);
            jb.setAttribute("aria-label", "Jump to question " + (idx + 1));
            jb.addEventListener("click", function () {
              if (graded) return;
              current = idx;
              show();
            });
            plpJumpBtns.push(jb);
            qJumper.appendChild(jb);
          });
        }
      }

      pages.forEach(function (pg, idx) {
        var qState = pg.querySelector("[data-q-state]");
        pg.querySelectorAll(".option").forEach(function (opt) {
          opt.addEventListener("click", function () {
            if (qState) qState.textContent = "SELECTED: " + (opt.dataset.key || "");
            hidePartialConfirm();
            updateQuizUI();
            updatePlpHud();
            status.textContent = "Question " + (current + 1) + " of " + pages.length + " · " + answeredCount() + " answered";
          });
        });
        // Add quick "Next question →" button inside each non-final question card
        if (idx < pages.length - 1) {
          var qNextWrap = document.createElement("div");
          qNextWrap.className = "question-next-row plp-q-next-row";
          var qNextBtn = document.createElement("button");
          qNextBtn.type = "button";
          qNextBtn.className = "secondary question-next-btn plp-q-next-btn";
          qNextBtn.textContent = "Next question →";
          qNextBtn.addEventListener("click", function () {
            if (current < pages.length - 1) { current++; show(); }
          });
          qNextWrap.appendChild(qNextBtn);
          var fb = pg.querySelector("[data-feedback]");
          if (fb && fb.parentNode) fb.parentNode.insertBefore(qNextWrap, fb);
        }
      });

      if (form) {
        form.addEventListener("submit", function (e) {
          var ansCount = answeredCount();
          var fromConfirmBtn = !!(e.submitter && e.submitter.hasAttribute && e.submitter.hasAttribute("data-confirm-grade"));
          if (fromConfirmBtn) confirmedPartial = true;
          if (ansCount < pages.length && !confirmedPartial) {
            e.preventDefault();
            e.stopImmediatePropagation();
            var submitBar = view.querySelector("[data-quiz-submit-bar]");
            var mainSubmit = submitBar && submitBar.querySelector(".btn-check-answers");
            if (submitBar) {
              submitBar.hidden = false;
              if (mainSubmit) mainSubmit.hidden = true;
              if (!partialBox) {
                partialBox = document.createElement("div");
                partialBox.className = "plp-partial-confirm";
                partialBox.setAttribute("data-partial-confirm", "");
                submitBar.appendChild(partialBox);
              }
              var rem = pages.length - ansCount;
              partialBox.hidden = false;
              partialBox.innerHTML = '<p class="plp-partial-copy"><b>' + ansCount + ' of ' + pages.length + ' answered</b> · ' + rem + ' question' + (rem === 1 ? '' : 's') + ' still unanswered.</p>'
                + '<div class="plp-partial-actions">'
                + '<button type="submit" class="btn plp-quiz-cta plp-grade-now-btn" data-confirm-grade>Grade ' + ansCount + ' of ' + pages.length + ' now</button>'
                + '<button type="button" class="btn secondary-btn plp-keep-answering-btn" data-keep-answering>Keep answering</button>'
                + '</div>';
              if (partialBox.scrollIntoView) partialBox.scrollIntoView({ behavior: "instant", block: "nearest" });
              var confirmBtn = partialBox.querySelector("[data-confirm-grade]");
              var keepBtn = partialBox.querySelector("[data-keep-answering]");
              if (confirmBtn) {
                confirmBtn.addEventListener("click", function () {
                  confirmedPartial = true;
                });
              }
              if (keepBtn) {
                keepBtn.addEventListener("click", function () {
                  hidePartialConfirm();
                  var firstMissing = pages.findIndex(function (pg) { return !pg.querySelector(".option[aria-pressed='true']"); });
                  if (firstMissing >= 0) {
                    current = firstMissing;
                    show();
                  }
                });
              }
            }
            return;
          }
          hidePartialConfirm();
          graded = true;
          pages.forEach(function (p) {
            p.hidden = false;
            var qNextRow = p.querySelector(".question-next-row");
            if (qNextRow) qNextRow.hidden = true;
          });
          shellBar.hidden = true;
          var qBarEl = plpDeck && plpDeck.querySelector("[data-plp-quiz-bar]");
          if (qBarEl) qBarEl.hidden = true;
          setTimeout(function () { try { window.scrollTo(0, 0); } catch (err) {} }, 25);
        }, true);
      }
    }

    // Keyboard shortcuts (Left/Right arrows, Space to flip flashcard)
    cleanupKeyHandler = function (ev) {
      if (graded || ev.altKey || ev.ctrlKey || ev.metaKey) return;
      var tag = (ev.target && ev.target.tagName) ? ev.target.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (ev.key === "ArrowRight" && current < pages.length - 1) {
        ev.preventDefault();
        if (plpAutoPlay) setAutoPlay(false);
        current++;
        show();
      } else if (ev.key === "ArrowLeft" && current > 0) {
        ev.preventDefault();
        if (plpAutoPlay) setAutoPlay(false);
        current--;
        show();
      } else if (ev.key === " " && p0 === "cards" && tag !== "button" && tag !== "a") {
        var activeCard = pages[current];
        if (!activeCard) return;
        var skip = activeCard.querySelector(".skip-beat-btn");
        var recall = activeCard.querySelector("[data-recall]");
        if (skip && !skip.hidden) {
          ev.preventDefault();
          skip.click();
        } else if (recall && !recall.disabled) {
          ev.preventDefault();
          recall.click();
        }
      }
    };
    try { window.addEventListener("keydown", cleanupKeyHandler); } catch (e) {}

    show();
  }

  function syncHeader(s) {
    try {
      if (typeof document === "undefined" || !document.getElementById) return;
      var slot = document.getElementById("header-account-slot");
      if (!slot) return;
      if (s && s.code) {
        var slug = String(s.code).toLowerCase();
        if (entitled(s.code)) {
          slot.innerHTML = '<a class="hdr-pass-badge is-unlocked" href="#/' + esc(slug) + '/"><span class="hdr-live-dot" aria-hidden="true"></span>' + esc(s.code) + ' Pass Active</a>';
        } else {
          slot.innerHTML = '<a class="hdr-unlock-pill" href="' + esc(buyHref(s)) + '">Unlock ' + esc(s.code) + ' · ' + PRICE + '</a>';
        }
        return;
      }
      var activeCodes = Object.keys(ME.entitlements || {}).filter(function (c) { return entitled(c); });
      if (ME.signedIn) {
        slot.innerHTML = '<span class="hdr-pass-badge"><span class="hdr-live-dot" aria-hidden="true"></span>'
          + (activeCodes.length ? esc(activeCodes.join(", ")) + ' Pass Active' : 'Test Learner') + '</span>';
      } else {
        slot.innerHTML = '<a class="hdr-signin-pill" href="/sign-in?redirect_url=%2Fapp%2F%23%2F">Sign in</a>';
      }
    } catch (e) { /* no DOM in harness */ }
  }

  window.NovaGate = {
    ready: ready,
    canLoad: canLoad,
    route: route,
    after: after,
    hideQuarantined: hideQuarantined,
    banner: banner,
    mount: mount,
    syncHeader: syncHeader,
    formatFillBlanks: formatFillBlanks,
    trackLessonComplete: function (s) {
      var path = "/app/" + (location.hash || "#/");
      track("lesson_complete", s, path, "course:" + Date.now().toString(36) + ":complete");
    },
    hasVideo: function (code) {
      return stateHasVideo(code);
    },
    ensureDeckOverlay: ensureDeckOverlay,
    ensureStateVisuals: ensureStateVisuals,
    signForCard: signForCard,
    signForFacts: signForFacts,
    visualForCard: visualForCard,
    visualForSlide: visualForSlide,
    visualForUnit: visualForUnit,
    visualForItem: visualForItem,
    cardMeta: cardMeta,
    recapMeta: recapMeta,
    _state: function () {
      return {
        me: ME,
        quarantine: Object.keys(QUARANTINE).reduce(function (o, k) { o[k] = QUARANTINE[k].size; return o; }, {}),
        hidden: HIDDEN
      };
    }
  };
})();
