# Argon Report — Flashcard Frame Changes (`R1`–`R4`, `S1`)

- **Date:** 2026-11-01
- **Spec:** `coordination/ARGON-FLASHCARD-CHANGES-2026-11-01.md`
- **Scope:** `store/learner-assets/{customer-ui.mjs,gate.js,learner.css}`, `tools/preview/verify-learner.cjs`, `scratch/nd-genz-cards/{build-nd-sec01-deck.mjs,render-deck-overlay-audio.mjs}`, `store/learner-assets/decks/nd-sec01-genz.json`, `store/learner-assets/decks/audio/nd/*.{teach,recap}.mp3` (offline Piper TTS, `\$0.00` spend), synced to `store/public/app/` via `tools/preview/sync-store.mjs`.
- **Untouched:** `runs/`, `app-preview/data/`, `app-preview/audio/`, `tools/belt/`, `store/learner-assets/visuals/`, official `card.back` / lesson / quiz text.

---

## 1. Per-Item Changes (`file:line`)

### `R1` — Mobile Order (`<= 768px`) & One-Line Header Chrome
- **`store/learner-assets/customer-ui.mjs` (`vCards`, lines `427–461`, `484–528`):**
  - Added compact mobile header position badge `[data-plp-mobile-pos]` (`CH 01 · M 01 · CARD 1/16`), icon/label spans inside `[data-plp-autoplay]` and `[data-plp-instant]`, and compact `.plp-beat-word` spans around the 4 beat numbers (`1` `2` `3` `4`).
  - Wrapped the front prompt/actions inside `.plp-front-card` (`line 487`) and the self-rate + source row inside `.plp-back-foot` (`line 507`) so desktop keeps its exact two-column `.plp-card-grid` while mobile (`<= 768px`) interleaves children via CSS `display: contents` + `order`.
- **`store/learner-assets/gate.js` (`updatePlpHud`, lines `659–663`):**
  - Live-updates `[data-plp-mobile-pos]` on every card/recap step (`CH 01 · M 01 · CARD X/Y` / `RECAP`).
- **`store/learner-assets/learner.css` (`@media (max-width: 768px)`, lines `2954–3333`):**
  - Collapses `.plp-quest-frame` (`height: 38px`) into a single horizontal bar: `CH 01 · M 01 · CARD 1/16` + XP value (`0 / 400 XP`, bar hidden) + `[▶]` Auto-Play icon + `[⏱]` Flip-mode icon.
  - Visually hides `<h1>` (`sr-only`, `lines 2996–3006`, preserving `gate.js` quarantine `h1.after()` anchor) and hides `.plp-audio-note` (`display: none`, preserving DOM narration marker count `=== 1` for `verify-learner.cjs`).
  - Sets `display: contents` on `.plp-cream-box`, `.plp-back-zone:not([hidden])`, and `.plp-companion-col` (`lines 3061–3074`) and enforces strict top-to-bottom flex `order`:
    1. One-line header (`y = 204px`, `height = 38px`)
    2. Question box `.plp-front-card` (`order: 1`, `y = 252..529px`, compact `1` `2` `3` `4` beat strip)
    3. Illustration `.plp-visual-box` (`order: 2`, `img y = 553..720px`, box bottom `769px <= 812px` — **both Question and Picture fit on Screen 1 at `375x812`**; `.visual-source-tag` `ILLUSTRATION` hidden at `lines 3170–3172`, `figcaption` visible)
    4. Official answer `.plp-rule-panel` (`order: 3`, `y = 779px`) → Memory hook + pills `.plp-hook-box` (`order: 4`, `y = 933px`)
    5. Coach takeaway `.plp-coach-panel` (`order: 5`, `y = 1134px`, collapsed `<details>` `"Why it matters"`)
    6. Rate row + source `.plp-back-foot` (`order: 6`, `y = 1187px`) → Pager `.plp-deck-bar` (`y = 1341px`).

### `R2` — Instant Flip Default `OFF` + `localStorage` (`plp:flip-mode`) Persistence
- **`store/learner-assets/customer-ui.mjs` (`line 459`):**
  - Renders `[data-plp-instant]` in default OFF state: `aria-pressed="false"`, no `is-instant-on` class, label `"⏱ 3s Recall: ON"`.
- **`store/learner-assets/gate.js` (`lines 536–542`, `681–727`, `855–866`, `922–930`):**
  - Defaults `savedFlipPref = false` unless `localStorage.getItem("plp:flip-mode") === "instant"`, setting `plpInstantFlip = savedFlipPref`.
  - Clicking `[data-plp-instant]` toggles `savedFlipPref`, writes `"instant"` or `"recall"` to `localStorage.setItem("plp:flip-mode", ...)`, and stops Auto-Play if active.
  - `setAutoPlay(on)` (`line 706`) temporarily forces `plpInstantFlip = true` while lean-back Auto-Play runs, and restores `plpInstantFlip = savedFlipPref` when stopped.

### `R3` — Say the Rule Once + `"Why it matters"` Disclosure
- **`scratch/nd-genz-cards/build-nd-sec01-deck.mjs` (`lines 37–396`, `476`, `558–580`):**
  - Replaced rule-restating coach paragraphs across all 42 ND `sec01` cards (`F001`–`F042`) with concise 1-sentence WHY / exam-trap takeaways (e.g., Card 1: `"Do not get bounced at the front desk before question one."`).
  - Added template rule `formatStoreCoachWhy(spec)` (`lines 382–391`) stripping trailing `<Cue>: <hook>` duplicates and throwing at build time if `memory_hook` is repeated in the store coach text, while `formatBeltTeaching(spec)` (`lines 393–396`) keeps belt `05-card-scripts.mjs` (`05.SELF_EQUALITY` / `05.CARD_PARITY`) 19/19 green.
  - Re-rendered all 45 updated offline Piper MP3 clips (`42` `.teach.mp3` + `3` `.recap.mp3`) via `scratch/nd-genz-cards/render-deck-overlay-audio.mjs --only-teach-recap` (`\$0.00`).
- **`store/learner-assets/customer-ui.mjs` (`lines 504–506`) & `store/learner-assets/gate.js` (`lines 818–826`, `1068`):**
  - Rendered Coach inside `<details class="plp-coach-panel" data-plp-coach open><summary class="plp-panel-label">Why it matters</summary>...</details>`.
  - `syncCoachDisclosures()` sets `det.open = window.innerWidth > 768` on mount and viewport resize (collapsed on mobile `<= 768px`, open on desktop `>= 769px`).

### `R4` — Trim Game Words + Customer-Jargon Lint
- **`store/learner-assets/customer-ui.mjs` (`lines 424–426`, `443`, `453`):**
  - Dropped `ND · CLASS D QUEST` → data-driven `<CODE> · <STATE NAME>` (e.g. `ND · NORTH DAKOTA`, `TX · TEXAS`).
  - Dropped `LEVEL 1 ·` → `CHAPTER <N> · <CHAPTER TITLE>` (e.g. `CHAPTER 1 · LICENSING AND TESTING`).
- **`store/learner-assets/gate.js` (`lines 951–961`):**
  - Renamed self-rate prompt & buttons: `"How well did you recall it?"`, `"↻ Show again"`, and `"✓ Got it (+25 XP) →"` (`"✓ Got it (+25 XP)"` on last item).
- **`tools/preview/verify-learner.cjs` (`line 729`):**
  - Extended customer `jargon` lint regex across all 22,439 store routes with `|\bclass d quest\b|\blevel \d+\s*·|\bspin again\b|\blocked \(\+25 xp\)` (word-bounded so DC's official `"Class D questions"` and GDL `"Level 1 license"` text pass cleanly while banned game chrome fails).

### `S1` — Unified Store Card Frame (`.plp-deck` / `plp-` Across All 51 States)
- **`store/learner-assets/customer-ui.mjs` (`lines 419–550`), `store/learner-assets/gate.js` (`lines 535–895`), `store/learner-assets/learner.css` (`lines 2–36`, `2024–3333`):**
  - Renamed `.nd-neopop-deck` / `nd-*` / `"ND *"` fonts → `.plp-deck` / `plp-*` / `"PLP *"` across all three source files (`0` leftover `nd-neopop` / `data-nd-` / `--nd-` selectors).
  - Removed the `if (ST && ST.code === "ND")` branch and `"NORTH DAKOTA"` fallback string; `.plp-deck` now drives state code (`ST.code`), state name (`ST.name`), chapter metadata, and optional per-state `ST.theme` (default `"indigo"`, rotating cleanly across chapters) from `states.json` for all 51 jurisdictions.

---

## 2. Proof Screenshots & Headless Chrome CDP Verification (`scratch/store-local/plp-flashcards/`)

Automated CDP verification script: `scratch/store-local/verify-plp-flashcards-ui.mjs`  
Machine-readable receipt: `scratch/store-local/plp-flashcards/ui-verification.json` (`failedResponses: []`, `consoleErrors: []`).

| Screenshot | Viewport | What It Proves |
|---|---|---|
| `scratch/store-local/plp-flashcards/01-mobile-375-card1-unflipped.png` | `375x812` | **R1 + R2:** Fresh profile (`plp:flip-mode === null`), `3s Recall: ON`, answer hidden, 1-line header (`38px`), Question (`y=252..529`) + Illustration (`img y=553..720`, box `bottom=769 <= 812`) **both on Screen 1**, `ILLUSTRATION` tag hidden, caption visible, `scrollWidth === 375`. |
| `scratch/store-local/plp-flashcards/02-mobile-375-card1-flipped.png` | `375x812` (full) | **R1 + R3 + R4:** Strict Y-order (`header 204 < question 252 < picture 539 < answer 779 < hook 933 < Why it matters 1134 < rate/source 1187 < pager 1341`), `"Why it matters"` collapsed (`open === false`), concise coach text without hook duplicate, `"↻ Show again"` + `"✓ Got it (+25 XP) →"`, `scrollWidth === 375`. |
| `scratch/store-local/plp-flashcards/03-mobile-375-card4-unflipped.png` | `375x812` | **R1 + R2 (no-image card):** Card 4 (`F004`) unflipped, `CH 01 · M 01 · CARD 4/16`, zero empty image box (`visualBoxCount === 0`), `scrollWidth === 375`. |
| `scratch/store-local/plp-flashcards/04-mobile-375-card4-flipped.png` | `375x812` (full) | **R1 + R3 + R4 (no-image card):** Card 4 flipped, official answer → hook + pills → collapsed `"Why it matters"` → rate row + source → pager, `scrollWidth === 375`. |
| `scratch/store-local/plp-flashcards/05-desktop-1440-card1-unflipped.png` | `1440x960` | **Desktop + R2 + R4:** Two-column layout preserved, `ND · NORTH DAKOTA`, `CHAPTER 1 · LICENSING AND TESTING`, `⏱ 3s Recall: ON`, answer hidden on open. |
| `scratch/store-local/plp-flashcards/06-desktop-1440-card1-flipped.png` | `1440x960` (full) | **Desktop + R3 + R4:** Flipped two-column layout, `"Why it matters"` open on desktop (`open === true`) with concise 1-sentence WHY (`"Do not get bounced at the front desk before question one."`), `"↻ Show again"` / `"✓ Got it (+25 XP) →"`. |
| `scratch/store-local/plp-flashcards/07-desktop-1440-tx-card1-s1-frame.png` | `1440x960` | **S1 Cross-State:** Texas (`#/tx/cards/sec01-u01`) rendered in `.plp-deck` (`TX · TEXAS`, `data-plp-state="TX"`, `data-plp-theme="indigo"`, `containsNorthDakota === false`); Utah (`#/ut/cards/sec01-u01`) also verified (`UT · UTAH`, `containsNorthDakota === false`). |

**R2 Persistence & Auto-Play Restore Receipt (`ui-verification.json`):**
- Toggling `[data-plp-instant]` sets `localStorage["plp:flip-mode"] = "instant"` (`aria-pressed="true"`).
- Across `Page.reload()`, `aria-pressed === "true"` persists, Card 1 opens unrevealed (`answerHiddenBeforeClick === true`), and clicking `Flip Card` reveals immediately (`answerRevealedImmediatelyOnFlipClick === true`, skipping the 3s beat).
- Starting Auto-Play while in `"recall"` mode temporarily forces `aria-pressed="true"` while keeping `localStorage["plp:flip-mode"] === "recall"`, and stopping Auto-Play restores `aria-pressed="false"`.

---

## 3. Harness & Sync Results

1. **Belt Card + Script Validators (`scratch/nd-genz-cards/build-nd-sec01-deck.mjs`):**
   - `04.cards checks: 21/21 PASS`
   - `05.card_scripts checks: 19/19 PASS`
2. **Preview Harness (`node tools/preview/verify-learner.cjs`):**
   - `RESULT: ALL CHECKS PASSED`
3. **Store Customer Harness (`node tools/preview/verify-learner.cjs --root=store/public/app`):**
   - `PASS STORE customer text: no builder terms or raw ids (22439 routes, all states)`
   - `RESULT: ALL CHECKS PASSED`
4. **Store Sync Drift Check (`node tools/preview/sync-store.mjs --check`):**
   - `sync-store (--check, nothing written): 163347 files (22812.3 MB) · copied 0 · unchanged 163658 · removed stale 0` (`0` drift).
