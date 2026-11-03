# Argon Report — Unified `.plp-deck` Theme Applied to Learner Testing Pages (51 States)

- **Date:** 2026-11-01
- **Scope:** `store/learner-assets/{customer-ui.mjs,gate.js,learner.css}` synced to `store/public/app/` via `tools/preview/sync-store.mjs`, plus CDP verification suite `scratch/store-local/verify-plp-testing-ui.mjs` + `scratch/store-local/plp-testing/{ui-verification.json,*.png}`.
- **Surfaces Covered (All 51 States):**
  1. **Module Quiz Runner** (`#/<state>/quiz/<unitId>`, `.plp-deck.is-plp-test`)
  2. **Chapter Practice Test Runner** (`#/<state>/practice/<formId>`, `.plp-deck.is-plp-test`)
  3. **Practice Test Center Hub** (`#/<state>/practice`, `.plp-deck.is-plp-hub`)
  4. **Graded Inline Score Summary (`realGradeQuiz`) & Attempt Summary Page** (`#/<state>/results/<attemptId>`, `.plp-deck.is-plp-results`)
- **Founder Testing Visual Rule:** Zero images on live ungraded test modules (`ungradedImagesOnTest === 0`, full-width single-column `.plp-card-grid.no-visual`); any mapped sign/handbook visual is tucked inside a collapsed `<details class="plp-coach-panel plp-explain-visual-panel">` (`"Visual reference (optional)"`) inside post-grade explanations / missed-question review only.
- **Untouched:** `runs/`, `app-preview/data/`, `app-preview/audio/`, `tools/belt/`, `store/learner-assets/visuals/`, official question stems/options/rationales.
- **Paid Model / TTS Spend:** `$0.000`

---

## 1. Per-File Implementation (`file:line`)

### A. `store/learner-assets/customer-ui.mjs` (`lines 559–892`)
- **`realQuizBlock` (`lines 568–644`):**
  - Renders the data-driven `.plp-deck.is-plp-test` frame across all 51 states using `ST.code`, `ST.name`, chapter number/title, and optional `ST.theme` (default `"indigo"`, rotating across chapters `["indigo", "royal", "violet", "berry", "teal"]`).
  - Header badges: `<CODE> · <STATE NAME>` (gold), `CHAPTER <NN> · MODULE <MM>` or `CHAPTER <NN> · PRACTICE SET <A..Z>` (navy), `QUESTION 1 OF <N>` (white), plus `[data-plp-mobile-pos]` (`CH 01 · M 01 · Q 1/16`) and `[data-plp-xp-val]` (`0 / 16 ANS`) progress meter.
  - Preserves `<h1>${esc(title)}</h1>` (`line 607`) so base `app-preview/index.html` submit handler (`document.querySelector("#view h1")?.textContent`) records exact quiz/practice attempt titles in `localStorage` and `gate.js` quarantine `h1.after()` anchor remains intact.
  - Each question (`section.plp-card-stage.plp-quiz-stage[data-ritem]`, `lines 616–630`) renders a clean full-width `.plp-card-grid.no-visual` cream Neo-Pop stage (`0` test-time images) preserving verbatim `it.stem` (`data-fill-blank`), `data-correct`, `data-why`, `data-otext`, `data-orationale`, and handbook citation (`sourceLine(it.fact_ids)`).
  - Preserves mandatory practice-only disclaimer (`line 633`) on practice sets (`"Practice only — not an official test. No pass or fail is claimed; the score describes this attempt alone."`) and adds dark-navy `.plp-deck-bar[data-plp-quiz-bar]` (`lines 635–642`).
- **`vQuiz` (`lines 646–667`) & `vPractice(formId)` (`lines 669–687`):**
  - Pass structured `{ meta, modIndex, setLetter, kind }` metadata and clean breadcrumbs into `realQuizBlock`.
- **`vPractice()` Hub (`lines 688–741`):**
  - Upgrades the top-nav `"Practice tests"` chooser to `.plp-deck.is-plp-hub` with `.plp-hub-chapter` cream cards, coral ribbons (`CHAPTER 01` · `N PRACTICE SETS`), tactile `.plp-form-tile` cards (`Ready` / `Latest: X/Y` pills), and mint `.plp-set-cta` buttons (`Start Practice Set A →` / `Retake Practice Set A →`), keeping `> 2000` chars and zero official pass-mark claims for `vRealQuiz`.
- **`vResults(attemptId)` (`lines 743–793`):**
  - Upgrades `#/<state>/results/<attemptId>` to `.plp-deck.is-plp-results` with observed `.plp-score-card` (`X of Y`, mint progress bar, observed-practice disclaimer) and `.plp-missed-card` review cards (`<h3 data-fill-blank>`, `.plp-rule-panel` handbook explanation, `<details>` option explanations, and optional collapsed `"Visual reference (optional)"` `<details>`).
- **`realGradeQuiz` (`lines 806–894`):**
  - Adds `form.classList.add("is-graded")`, updates each question's `[data-q-state]` ribbon (`✓ CORRECT` / `✗ ANSWER: <KEY>`), wraps per-option rationales in `<details class="plp-coach-panel plp-opt-breakdown" data-plp-breakdown>` (collapsed on mobile `<= 768px`, open on desktop), tucks any mapped sign/illustration inside a collapsed `<details class="plp-coach-panel plp-explain-visual-panel">` (`"Visual reference (optional)"`), hides `[data-quiz-submit-bar]` and `[data-plp-quiz-bar]`, updates header HUD to `SCORE: X OF Y` / `X / Y (Z%)`, and renders the Neo-Pop `.plp-score-card` with `All` / `Missed` filter pills, `↻ Retake this set`, and `Summary & next steps →`.

### B. `store/learner-assets/gate.js` (`lines 521–545`, `647–710`, `849–859`, `1023–1118`)
- Enables `plpDeck` on `quiz` and `practice` routes (`line 522`) and hides legacy `.study-nav-shell` via `.is-plp-hidden`.
- Extends `updatePlpHud()` (`lines 657–678`) for `quiz` / `practice` (`QUESTION X OF Y`, mobile `CH 01 · M 01 · Q X/Y`, `X / Y ANS` meter, mint progress bar, and jumper pill states `.is-current` / `.is-got` / `.is-seen`).
- Syncs `[data-plp-breakdown]` `<details>` disclosures across mobile/desktop viewports (`lines 850–856`).
- Wires `[data-plp-prev]`, `[data-plp-next]`, and `1..N` `.plp-jump-pill` buttons (`lines 1028–1050`), updates `[data-q-state]` (`SELECTED: <KEY>`) and `updatePlpHud()` on option click (`lines 1055–1061`), and hides `[data-plp-quiz-bar]` upon grading (`lines 1113–1114`).

### C. `store/learner-assets/learner.css` (`lines 3059–3075`, `3336–3925`)
- Full-width single-column `.plp-quiz-stage .plp-card-grid.no-visual { grid-template-columns: minmax(0, 1fr); }` (`lines 3357–3359`) on both desktop and mobile.
- Tactile Neo-Pop `.plp-option` cards (`lines 3385–3465`): `3px` ink borders, `4px` offset shadows, gold selected state (`aria-pressed="true"`), mint `.picked-correct`, coral `.picked-wrong`, dimmed unselected options.
- Clean `.plp-explain-visual` styling (`lines 3586–3617`) inside the optional collapsed `"Visual reference (optional)"` `<details>`.
- **Mobile `<= 768px` discipline (`lines 3808–3925`):**
  - `.is-plp-test` uses a `30px` 1-line header (`CH 01 · M 01 · Q 1/16` + `0 / 16 ANS`) with `scrollWidth === 375`.
  - Single cohesive `.plp-cream-box` question card where **Question Stem + all 4 A/B/C/D options fit on Screen 1 at `375x812`** (`qHeadTop: 247` → `lastOptionBottom: 765 <= 812`).

---

## 2. Proof Screenshots & Headless Chrome CDP Receipt (`scratch/store-local/plp-testing/`)

Automated script: `scratch/store-local/verify-plp-testing-ui.mjs`  
Machine-readable receipt: `scratch/store-local/plp-testing/ui-verification.json` (`failedResponses: []`, `consoleErrors: []`).

| Screenshot | Viewport | What It Proves |
|---|---|---|
| `scratch/store-local/plp-testing/01-mobile-375-quiz-q1-ungraded.png` | `375x812` | `scrollWidth === 375`, `30px` 1-line header (`CH 01 · M 01 · Q 1/16` + `0 / 16 ANS`), `ungradedImagesOnTest === 0`, **Question + all 4 options (`A..D`) fit on Screen 1** (`lastOptionBottom = 765 <= 812`). |
| `scratch/store-local/plp-testing/02-mobile-375-quiz-graded.png` | `375x812` (full) | Graded mobile view (`15 of 16 (94%)`), `.plp-score-card`, `[data-plp-quiz-bar]` hidden, `"All option explanations"` and `"Visual reference (optional)"` both collapsed (`open === false`), `scrollWidth === 375`. |
| `scratch/store-local/plp-testing/03-mobile-375-practice-hub.png` | `375x812` | Mobile Practice Test Center Hub (`#/nd/practice`, `.is-plp-hub`), visible `h1`, Practice Set A/B tiles, `scrollWidth === 375`. |
| `scratch/store-local/plp-testing/04-desktop-1440-quiz-q1.png` | `1440x960` | Full-width clean desktop written-test card (`ungradedImagesOnTest === 0`, `cleanNoVisualStage === true`), `ND · NORTH DAKOTA` + `CHAPTER 01 · MODULE 01` badges. |
| `scratch/store-local/plp-testing/05-desktop-1440-quiz-graded.png` | `1440x960` (full) | Graded desktop view, `"All option explanations"` open (`open === true`), `"Visual reference (optional)"` collapsed (`open === false`). |
| `scratch/store-local/plp-testing/06-desktop-1440-practice-hub.png` | `1440x960` | Desktop Practice Test Center Hub (`#/nd/practice`) with Practice Set A/B cards. |
| `scratch/store-local/plp-testing/06b-desktop-1440-practice-runner.png` | `1440x960` | Chapter Practice Test Runner (`#/nd/practice/sec01-form-a`), `ungradedImagesOnPracticeTest === 0`, 21 questions, mandatory practice-only disclaimer present. |
| `scratch/store-local/plp-testing/07-desktop-1440-results.png` | `1440x960` (full) | Attempt Summary (`#/nd/results/<attemptId>`, `.is-plp-results`), `15 of 16` hero card, missed-question review card with gold `[ ______ ]` fill-in-blank pill, handbook rule box, option explanations, and collapsed `"Visual reference (optional)"`. |
| `scratch/store-local/plp-testing/08-desktop-1440-tx-quiz.png` | `1440x960` | Cross-state `S1` proof on Texas (`#/tx/quiz/sec01-u01`): `TX · TEXAS` badge, `ungradedImagesOnTest === 0`, `containsNorthDakota === false` (Utah `#/ut/quiz/sec01-u01` also verified: `UT · UTAH`, `containsNorthDakota === false`). |

---

## 3. Harness & Sync Results

1. **Preview Harness (`node tools/preview/verify-learner.cjs`):** `RESULT: ALL CHECKS PASSED`
2. **Store Customer Harness (`node tools/preview/verify-learner.cjs --root=store/public/app`):** `PASS STORE customer text: no builder terms or raw ids (22439 routes, all states)` → `RESULT: ALL CHECKS PASSED`
3. **Store Sync Drift Check (`node tools/preview/sync-store.mjs --check`):** `copied 0 · unchanged 163658 · removed stale 0` (`0` drift).
