# Fable Review Packet — Unified `.plp-deck` Testing Pages Theme (51 States, Zero Test-Time Images)

- **Date:** 2026-11-01
- **Full Implementation Report:** `coordination/ARGON-REPORTS/TESTING-PAGES-THEME-20261101.md`
- **Scope:** Unified PassLearnersPermit Neo-Pop `.plp-deck` frame extended from flashcards (`vCards`) to all four learner testing surfaces across all 51 states:
  1. **Module Quiz Runner** (`#/<state>/quiz/<unitId>`, `.plp-deck.is-plp-test`)
  2. **Chapter Practice Test Runner** (`#/<state>/practice/<formId>`, `.plp-deck.is-plp-test`)
  3. **Practice Test Center Hub** (`#/<state>/practice`, `.plp-deck.is-plp-hub`)
  4. **Graded Inline Score Summary (`realGradeQuiz`) & Attempt Summary Page** (`#/<state>/results/<attemptId>`, `.plp-deck.is-plp-results`)
- **Paid Model / TTS Spend:** `$0.000`
- **Untouched:** `runs/`, `app-preview/data/`, `app-preview/audio/`, `tools/belt/`, `store/learner-assets/visuals/`, and all official question stems, options, rationales, and handbook citations.

---

## 1. Key Design & Safety Invariants Implemented

1. **Zero Images on Live Test Modules (`ungradedImagesOnTest === 0`):**
   - Per founder direction, live ungraded quizzes and practice sets render **zero images** (`<div class="plp-card-grid no-visual">`, full-width single-column cream Neo-Pop test card on both desktop and mobile).
   - After grading (`realGradeQuiz`) and on Attempt Summary (`vResults`), if a mapped road sign or handbook visual exists, it is tucked inside a **collapsed** `<details class="plp-coach-panel plp-explain-visual-panel">` (`"Visual reference (optional)"`) inside the explanation (`open === false` by default).
2. **Mobile `<= 768px` Ergonomics (`R1` Discipline, `scrollWidth === 375`):**
   - On `.is-plp-test`, `.plp-quest-frame` collapses to a `30px` 1-line bar: `CH 01 · M 01 · Q 1/16` (or `CH 01 · SET A · Q 1/21`) + `0 / 16 ANS` meter.
   - Single cohesive cream Neo-Pop question card where **the Question Stem AND all 4 A/B/C/D options fit on Screen 1 at `375x812`** (`qHeadTop = 247` → `lastOptionBottom = 765 <= 812`).
   - Graded per-option rationales sit inside `<details class="plp-coach-panel plp-opt-breakdown" data-plp-breakdown>` (`"All option explanations"`), **collapsed on mobile (`<= 768px`)** and **open on desktop (`>= 769px`)**.
3. **51-State Data-Driven Frame (`S1` Discipline):**
   - Driven purely from `states.json` (`ST.code`, `ST.name`, optional `ST.theme` defaulting to `"indigo"` and rotating across chapters).
   - Zero hardcoded `"NORTH DAKOTA"` strings and zero banned game chrome (`CLASS D QUEST`, `LEVEL 1 ·`, `Spin Again`, `Locked (+25 XP)`).

---

## 2. Exact File Paths & SHA-256 Hashes

| Artifact | Path | Bytes | SHA-256 |
|---|---|---:|---|
| Argon Implementation Report | `D:/nova/fb-ai-hackathon/coordination/ARGON-REPORTS/TESTING-PAGES-THEME-20261101.md` | 9,718 | `818b3334c4e545e404672c69d06c25209d3fcecad0b56f1e0f7d4be5dce4b749` |
| Store UI Compiler (`realQuizBlock`, `vQuiz`, `vPractice`, `vResults`, `realGradeQuiz`) | `D:/nova/fb-ai-hackathon/store/learner-assets/customer-ui.mjs` | 87,659 | `63ce007068a8a0a1b1c855926c75877c990dac82b7c9f88258e85a23f6989533` |
| Store Runtime (`updatePlpHud`, quiz jumper, `<details>` sync) | `D:/nova/fb-ai-hackathon/store/learner-assets/gate.js` | 55,737 | `5519c3196284d77cceedb93063989aad039c4bbd709935d8a15be4b9e8d3386b` |
| Store Stylesheet (`.is-plp-test`, `.is-plp-hub`, `.is-plp-results`) | `D:/nova/fb-ai-hackathon/store/learner-assets/learner.css` | 88,135 | `f4b35e48570d57fbca8ccee067183e4875e4d4deff5ac595fa7dfda9c1795f9f` |
| Headless Chrome CDP Verification Script | `D:/nova/fb-ai-hackathon/scratch/store-local/verify-plp-testing-ui.mjs` | 17,122 | `6e9502dcf9e7741bc61862233209fbfd100eebb29d4f30446631e93ab489b0e5` |
| CDP Verification Metrics JSON (`0` errors) | `D:/nova/fb-ai-hackathon/scratch/store-local/plp-testing/ui-verification.json` | 2,613 | `03fc02ecddefcda2d4024d890bb0e7b391b2694555391da0a2a8726bb22cae8b` |

**9 Proof Screenshots (`D:/nova/fb-ai-hackathon/scratch/store-local/plp-testing/`):**
- Mobile `375x812`: `01-mobile-375-quiz-q1-ungraded.png`, `02-mobile-375-quiz-graded.png`, `03-mobile-375-practice-hub.png`
- Desktop `1440x960`: `04-desktop-1440-quiz-q1.png`, `05-desktop-1440-quiz-graded.png`, `06-desktop-1440-practice-hub.png`, `06b-desktop-1440-practice-runner.png`, `07-desktop-1440-results.png`, `08-desktop-1440-tx-quiz.png`

---

## 3. Verification Commands (Copy-Paste Reproducible)

```powershell
Set-Location D:\nova\fb-ai-hackathon
node tools\preview\sync-store.mjs --check
node tools\preview\verify-learner.cjs
node tools\preview\verify-learner.cjs --root=store/public/app
node scratch\store-local\verify-plp-testing-ui.mjs
```

- `sync-store.mjs --check`: **`copied 0 · unchanged 163658 · removed stale 0`** (`0` drift)
- `verify-learner.cjs`: **`RESULT: ALL CHECKS PASSED`**
- `verify-learner.cjs --root=store/public/app` (22,439 routes, 51 states): **`RESULT: ALL CHECKS PASSED`**
- `verify-plp-testing-ui.mjs`: **`ungradedImagesOnTest === 0`, `questionAndAllOptionsFitFirstScreen === true`, `failedResponses: []`, `consoleErrors: []`**
