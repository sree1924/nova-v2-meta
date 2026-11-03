# Argon Report — Road Signs Module (51 States, Free Funnel + Shared CDN Re-Stage)

- **Date:** `2026-11-02`
- **Brief:** `coordination/ARGON-ROAD-SIGNS-BRIEF-2026-11-01.md` (including `§0` 2026-11-02 addendum)
- **Branch / Workspace:** `sol/store-local` (`d:/nova/fb-ai-hackathon`)
- **Model Calls / Spend:** `0` model calls · `$0.00`
- **Git Commit Status:** Uncommitted on disk per brief (`git commit` not run)

---

## 1. Executive Summary & Unflattering Findings First

1. **All 51 states now ship a 100% free Road Signs module (`#/<st>/signs`, `#/<st>/signs/cards`, `#/<st>/signs/test`)** wired into both `app-preview/` (via `fetch` + `signs-embedded.js` `file://` fallback) and `store/public/app/` (via `tools/preview/sync-store.mjs`).
2. **Read-only package respected (`0` edits):**
   - `app-preview/data/signs/signs.json` (`93` signs), `by-state.json` (`51` states, `32–67` signs/state), `quiz.json` (`178` items), and `app-preview/signs/*.png` (`89` QA-accepted 1024×1024 PNGs) are completely untouched.
   - Zero `mutcd` codes (`R1-1`, `W1-1`, etc.) and zero `(verify)` strings ever reach learner DOM across all `22,592` audited store routes.
   - Provenance caption `"Sign standards: FHWA MUTCD 11th Ed."` appears on hub, flashcards, and quiz items; zero rule-stating copy was invented beyond `signs.json` `meaning`/`spec` and the brief's five MUTCD category colour-rule headers.
3. **4 withheld `image: null` signs (`sign-turn-right`, `sign-stop-ahead`, `sign-divided-highway-ends`, `sign-object-marker`):**
   - Render as structured text cards (`name` + `spec` + `meaning` on hub; `"Picture coming"` badge + `spec` on flashcard front, `name` + `meaning` on back) with **zero `<img>` tags** and **zero substitute illustrations**.
4. **Legacy 32-file `.gif` + `sign-map.json` set retired (`BUG-005 #5` closed):**
   - `tools/preview/sync-store.mjs` removed all `32` stale `.gif` + `sign-map.json` files from `store/public/app/signs/` and copied the `89` PNGs + `data/signs/{signs,by-state,quiz}.json` + `signs-embedded.js` into the `free` allowlist (`store/src/generated/free-paths.json`).
   - Replaced stale `.gif` references in `store/src/app/states/[slug]/page.tsx`, `store/src/components/HeroRecallDemo.tsx`, and `store/learner-assets/gate.js` with PNG sign assets (`sign-stop.png`, `sign-signal-ahead.png`) so zero broken `.gif` requests fire anywhere on storefront or app routes.
5. **Shared CDN bundle re-staged (`--include-shared`):**
   - `coordination/FABLE-DROPOFF/shared/shared-manifest.json` now stages `831` shared app files (`132.42 MB`), including all `89` `signs/*.png` (`6,717,332` bytes), all `3` `data/signs/*.json` (`745,004` bytes), and `signs-embedded.js` (`505,943` bytes) — every one tagged `access_tier: "free"`.
6. **Defects found & fixed in-pass (zero open Argon bugs):**
   - During initial 375px visual inspection, `.plp-sign-handbook-link a svg` lacked explicit `width`/`height` CSS dimensions (expanding inline SVG height on mobile card backs) and `.deck-finish-actions` sat above `.plp-deck-bar`. Fixed in `store/learner-assets/customer-ui.mjs` + `store/learner-assets/learner.css`, re-synced, and re-verified across all 24 screenshots. No new `A-BUG-NNN` tickets needed; `coordination/BUGS/BUG-005-carried-in-content-findings.md` `#5` marked closed.

---

## 2. File:Line Map

| File | Lines | Responsibility |
| --- | --- | --- |
| `tools/preview/embed-signs.mjs` | `1–29` | Deterministic generator bundling `app-preview/data/signs/{signs,by-state,quiz}.json` into `window.__SIGNS_EMBEDDED` for `file://` preview + harness parity. |
| `app-preview/signs-embedded.js` | `1–2` | Generated `file://` fallback bundle (`505,943` bytes). |
| `app-preview/index.html` | `312–394` | `SIGN_PROVENANCE`, `SIGN_CATEGORIES` (6 ordered categories + colour rules), `SIGN_YIELD_SVG`, `loadSigns()`, `shortSignSpec()`, `handbookRuleHref()` (deep-link `#/<st>/cards/<unitId>/<cardId>`), `pickSignQuizItems()` (seeded PRNG, 10 `sign_meaning` + 10 `sign_name`). |
| `app-preview/index.html` | `863–884` | Free `"Road signs"` card with yield-triangle icon after last chapter on `vHome()` and `vChapters()`. |
| `app-preview/index.html` | `1085–1128` | Free `"Road signs test"` entry in `vPractice()` + sign-quiz grading/rationale support in `vResults()` & `realGradeQuiz()`. |
| `app-preview/index.html` | `1325–1413` | `vSignsHub()`, `vSignsCards(startSignId)` (zero audio buttons, `"Picture coming"` text card for `image: null`, `"See your handbook's rule"` link), and `vSignsTest()` (20 items, anti-spoiler `alt="Road sign"`). |
| `app-preview/index.html` | `1599–1648`, `1820–1851`, `1944` | `renderStepBar()` 3-step `Lesson → Flashcards → Quiz` flow for `signs` (`Lesson` = `#/<st>/signs`), `enhanceStudyFlow()` + `routeState()` wiring, startup `loadSigns()`. |
| `app-preview/styles.css` | `254–275` | Preview layout styles for `.sign-hub-grid`, `.sign-hub-tile`, `.is-text-sign`, `.sign-pic-coming`, `.sign-q-media`, and `<=480px` 2-column grid. |
| `store/learner-assets/customer-ui.mjs` | `294–306` | Free `"Road signs"` chapter-list row (`data-road-signs-entry`, yield-triangle icon, quick links) after the last chapter in `customerOverview()`. |
| `store/learner-assets/customer-ui.mjs` | `892–908`, `942–1005`, `1132–1189` | Free `"Road signs test"` card on `vPractice()` (`data-signs-practice-tile`), sign image rendering on `vResults()`, and `realGradeQuiz()` sign-attempt grading (`signs:<seed>`). |
| `store/learner-assets/customer-ui.mjs` | `1240–1318` | `renderStepBar()` & `syncSessionChrome()` 3-step session chrome (`Lesson` = `#/<st>/signs`, `Cards` = `#/<st>/signs/cards`, `Quiz` = `#/<st>/signs/test`). |
| `store/learner-assets/customer-ui.mjs` | `1695–1896` | Neo-Pop `customerSignsHub()`, `customerSignsCards()` (image inside `.plp-front-zone`, `"What does this sign mean?"`, zero audio controls, `3s Recall: ON`, shape+colour hook + category/colour-rule pills, `"See your handbook's rule"` link), and `customerSignsTest()` (`.plp-deck.is-plp-test`, 20 items, anti-spoiler sign frame). |
| `store/learner-assets/gate.js` | `84–144` | `hydrateSignIndex()` loading `data/signs/{signs,by-state}.json` (replaces retired `signs/sign-map.json`), `SIGN_YIELD_SVG`, `STATE_SIGN_COUNTS`. |
| `store/learner-assets/gate.js` | `291–304`, `347–350` | Signed-out `overview()` free `"Road signs"` tile (`data-gate-free="signs"`); `route()`/`after()` keep all `#/<st>/signs*` routes 100% free with no buy panel. |
| `store/learner-assets/gate.js` | `402–405`, `462–481` | `renderSignFigure()` & `signForCard()` updated to new PNG sign index (`Sign standards: FHWA MUTCD 11th Ed.`). |
| `store/learner-assets/gate.js` | `597–615` | `mount()` maps `signs/cards` → flashcard pager (`3s Recall: ON` default), `signs/test` → 1-question-at-a-time test runner, and deep-links `#/<st>/signs/cards/<signId>` + `#/<st>/cards/<unitId>/<cardId>` to the target card index. |
| `store/learner-assets/learner.css` | `6135–6477` | Neo-Pop Road Signs hub, colour-rule category cards, 2-col mobile / auto-fill desktop sign tiles, `"Picture coming"` text card, `.plp-sign-q-frame`, `.plp-sign-handbook-link`, `.plp-sign-deck-actions`, and `<=768px` first-screen constraints. |
| `tools/preview/sync-store.mjs` | `20–56`, `69–73`, `148–166`, `253–257`, `338–355` | Retired `SIGN_ASSETS` `.gif` list; added `signs-embedded.js`, `data/signs/*.json`, and `signs/*.png` to `copy` and `free` (`free-paths.json`); added `counts.road_signs` per state to `store/src/generated/catalog.json`. |
| `tools/preview/stage-fable-dropoff.mjs` | `155`, `199–204`, `676–685` | Added `signs-embedded.js` + `data/signs/*.json` (`signs_data`) + `signs/*.png` (`89` PNGs) to `stageSharedBundle()` and enabled standalone `--include-shared` execution. |
| `tools/preview/verify-learner.cjs` | `248–252`, `690–747`, `808–869` | Added embedded `signs-embedded.js` loader, Road Signs entry/hub/cards/test checks, 89-PNG store sign-dir assertion, signed-out free gate checks (`UT` + `TX`), and `mutcd`/`(verify)` customer-text lint across all `22,592` store routes. |
| `store/src/lib/catalog.ts` | `48–57`, `68`, `90`, `111` | Added `roadSigns` count and `signsPath` (`/app/#/<xx>/signs`) to `StateEntry`. |
| `store/src/app/states/[slug]/page.tsx` | `124–128`, `220–227`, `279–280` | Added `"Free: every road sign on the <State> test, with pictures. →"` funnel link, swapped showcase `.gif`s to `sign-stop.png` + `sign-signal-ahead.png`, and wired `StateChapterRoadmap` sign props. |
| `store/src/components/StateUnlockCard.tsx` | `147–170`, `241–273` | Appended free `"Road signs"` row with yield-triangle icon and direct `Signs Hub` / `Sign Cards` / `Sign Test` pills to `StateChapterRoadmap`. |
| `store/src/components/HeroRecallDemo.tsx` | `382–385` | Replaced legacy `mutcd-r1-1-stop.gif` with `/app/signs/sign-stop.png`. |
| `store/src/app/globals.css` | `2601–2615` | `.state-signs-free-line` typography & link styling on `/states/<slug>`. |
| `coordination/BUGS/BUG-005-carried-in-content-findings.md` | `12–19` | Recorded `BUG-005 #5` closed and `#4` UI text-card handling landed. |

---

## 3. Harness, Sync, Typecheck & Shared-Bundle Verification

All required gates ran clean (`exit 0`):

1. **`node tools/preview/sync-store.mjs --check` → `0` drift:**
   ```text
   sync-store (--check, nothing written): 173394 files (182664.3 MB) · copied 0 · unchanged 255159 · removed stale 0
     states: 51 complete · free paths 19356 · paid prefixes 204
   ```
2. **`node tools/preview/verify-learner.cjs` (`app-preview` `file://` fallback) → `ALL CHECKS PASSED`:**
   - Verified Road Signs entry points (`home`, `chapters`, `practice`), hub category grouping + colour-rule headers, `"Picture coming"` text cards (`0` `<img>`), flashcard prompt + handbook deep-link + `0` audio buttons, 20-question sign test, and `0` `mutcd` / `(verify)` leaks.
3. **`node tools/preview/verify-learner.cjs --root=store/public/app` → `ALL CHECKS PASSED`:**
   - `PASS STORE signs dir: 89 PNGs only, zero legacy .gif or sign-map.json`
   - `PASS gate: signed out home marks chapter 1 free, chapter 2 locked, road signs free`
   - `PASS gate: signed out Utah signs | signs/cards | signs/test is FREE (no buy panel)`
   - `PASS gate: signed out Texas signs | signs/cards | signs/test is FREE (no buy panel)`
   - `PASS STORE customer text: no builder terms or raw ids (22592 routes, all states)` (includes `signs`, `signs/cards`, `signs/test` across all 51 states + `mutcd`/`(verify)` regex)
4. **Next.js storefront TypeScript check (`tsc --noEmit`) → `exit 0`:**
   - `node store/node_modules/typescript/bin/tsc -p store/tsconfig.json --noEmit` passed with `0` errors.
5. **Shared CDN bundle re-staged (`node tools/preview/stage-fable-dropoff.mjs --include-shared`) → `exit 0`:**
   - Output: `staged shared bundle: 831 app files (132.4 MB) in 2039ms`
   - `coordination/FABLE-DROPOFF/shared/shared-manifest.json` breakdown:
     - `signs`: `89` files (`6,717,332` bytes) — all `access_tier: "free"`, zero `.gif` or `sign-map.json`
     - `signs_data`: `3` files (`745,004` bytes: `data/signs/{by-state,quiz,signs}.json`) — all `access_tier: "free"`
     - `shell`: `7` files (`1,057,962` bytes, including `signs-embedded.js` at `505,943` bytes) — all `access_tier: "free"`
     - Updated `store_configs` staged: `store/src/generated/free-paths.json` (`19,356` free paths) + `store/src/generated/catalog.json`.

---

## 4. Headless Chromium (`375×812` & `1440×900`) Verification & Screenshots

Captured via `scratch/store-local/verify-plp-road-signs-ui.mjs` against live Next.js storefront + signed-out store learner app (`failedResponses: []`, `consoleErrors: []`). Full metrics saved in `scratch/store-local/plp-road-signs/ui-verification.json`.

### Key Mobile (`375×812`) & Funnel Metrics

- **Horizontal overflow:** `document.documentElement.scrollWidth === 375` across every `375px` route (`hub`, `cards` front, `cards` back, `test` Q1, `test` graded, and `image: null` text-card front/back) for both `ND` and `TX`.
- **Signed-out free gate:** `gated: false` (`[data-gate-buy]` absent) on all Road Signs routes for `ND` (`42` signs) and `TX` (`51` signs).
- **375px Screen-1 fit:**
  - **Flashcard front (`#/nd/signs/cards`, `#/tx/signs/cards`):** Sign image `y = 236..360px`, prompt `"What does this sign mean?"` bottom `y = 401px`, `"Flip Card"` button bottom `y = 454px` (all well inside `812px` first screen; `0` audio buttons; `⏱3s Recall: ON`).
  - **Sign test Q1 (`#/nd/signs/test`, `#/tx/signs/test`):** Sign image `y = 229..341px`, stem `"Which sign is this?"` bottom `y = 381px`, Option A bottom `y = 457px` (`20` questions rendered, graded cleanly into `18 / 20 (90%)` summary).
  - **Text-card sign (`#/nd/signs/cards/sign-turn-right`, `image: null`):** `"Picture coming"` badge + `spec` (`"yellow diamond with a black right-angle turn arrow"`), `imgCountInsideCard === 0`, `fitsFirstScreen === true`, back reveals `"Turn (sharp)"` + `"A sharp turn ahead; slow down before it."` + `"See your handbook's rule →"` (`#/nd/cards/sec01-u01/sec01-card-sec01-F015`).
- **`/states/<slug>` funnel line & zero broken images:**
  - `/states/north-dakota`: `"Free: every road sign on the North Dakota test, with pictures. →"` → `/app/#/nd/signs` (`brokenImgs: []`, `hasLegacyGif: false`).
  - `/states/texas`: `"Free: every road sign on the Texas test, with pictures. →"` → `/app/#/tx/signs` (`brokenImgs: []`, `hasLegacyGif: false`).

### Screenshot Inventory (`scratch/store-local/plp-road-signs/`)

| # | File | State / Subject | Viewport | Route / State |
| --- | --- | --- | --- | --- |
| 01 | `scratch/store-local/plp-road-signs/01-nd-375-hub.png` | North Dakota (`42` signs) | `375×812` | `#/nd/signs` — Hub (colour-rule groups, 2-col tiles, step bar) |
| 02 | `scratch/store-local/plp-road-signs/02-nd-1440-hub.png` | North Dakota (`42` signs) | `1440×900` | `#/nd/signs` — Hub desktop |
| 03 | `scratch/store-local/plp-road-signs/03-nd-375-card-front.png` | North Dakota (`STOP`) | `375×812` | `#/nd/signs/cards` — Card 1 front (image + question + Flip Card on Screen 1, zero audio controls) |
| 04 | `scratch/store-local/plp-road-signs/04-nd-375-card-back.png` | North Dakota (`STOP`) | `375×812` | `#/nd/signs/cards` — Card 1 back (name + meaning + hook/pills + `"See your handbook's rule →"` + provenance) |
| 05 | `scratch/store-local/plp-road-signs/05-nd-1440-card-front.png` | North Dakota (`STOP`) | `1440×900` | `#/nd/signs/cards` — Card 1 front desktop |
| 06 | `scratch/store-local/plp-road-signs/06-nd-1440-card-back.png` | North Dakota (`STOP`) | `1440×900` | `#/nd/signs/cards` — Card 1 back desktop |
| 07 | `scratch/store-local/plp-road-signs/07-nd-375-test-q1.png` | North Dakota (`20` items) | `375×812` | `#/nd/signs/test` — Question 1 (unlabeled sign image + stem + options) |
| 08 | `scratch/store-local/plp-road-signs/08-nd-375-test-graded.png` | North Dakota (`20` items) | `375×812` | `#/nd/signs/test` — Graded (`18 of 20 (90%)`, All/Missed filter, rationales) |
| 09 | `scratch/store-local/plp-road-signs/09-nd-1440-test-q1.png` | North Dakota (`20` items) | `1440×900` | `#/nd/signs/test` — Question 1 desktop |
| 10 | `scratch/store-local/plp-road-signs/10-nd-1440-test-graded.png` | North Dakota (`20` items) | `1440×900` | `#/nd/signs/test` — Graded desktop |
| 11 | `scratch/store-local/plp-road-signs/11-tx-375-hub.png` | Texas (`51` signs) | `375×812` | `#/tx/signs` — Hub mobile |
| 12 | `scratch/store-local/plp-road-signs/12-tx-1440-hub.png` | Texas (`51` signs) | `1440×900` | `#/tx/signs` — Hub desktop |
| 13 | `scratch/store-local/plp-road-signs/13-tx-375-card-front.png` | Texas (`STOP`) | `375×812` | `#/tx/signs/cards` — Card 1 front mobile |
| 14 | `scratch/store-local/plp-road-signs/14-tx-375-card-back.png` | Texas (`STOP`) | `375×812` | `#/tx/signs/cards` — Card 1 back mobile |
| 15 | `scratch/store-local/plp-road-signs/15-tx-1440-card-front.png` | Texas (`STOP`) | `1440×900` | `#/tx/signs/cards` — Card 1 front desktop |
| 16 | `scratch/store-local/plp-road-signs/16-tx-1440-card-back.png` | Texas (`STOP`) | `1440×900` | `#/tx/signs/cards` — Card 1 back desktop |
| 17 | `scratch/store-local/plp-road-signs/17-tx-375-test-q1.png` | Texas (`20` items) | `375×812` | `#/tx/signs/test` — Question 1 mobile |
| 18 | `scratch/store-local/plp-road-signs/18-tx-375-test-graded.png` | Texas (`20` items) | `375×812` | `#/tx/signs/test` — Graded mobile |
| 19 | `scratch/store-local/plp-road-signs/19-tx-1440-test-q1.png` | Texas (`20` items) | `1440×900` | `#/tx/signs/test` — Question 1 desktop |
| 20 | `scratch/store-local/plp-road-signs/20-tx-1440-test-graded.png` | Texas (`20` items) | `1440×900` | `#/tx/signs/test` — Graded desktop |
| 21 | `scratch/store-local/plp-road-signs/21-text-sign-375-front.png` | Text sign (`sign-turn-right`, `image: null`) | `375×812` | `#/nd/signs/cards/sign-turn-right` — Front (`"Picture coming"` + `spec`, zero `<img>`) |
| 22 | `scratch/store-local/plp-road-signs/22-text-sign-375-back.png` | Text sign (`sign-turn-right`, `image: null`) | `375×812` | `#/nd/signs/cards/sign-turn-right` — Back (`"Turn (sharp)"` + meaning + handbook deep-link) |
| 23 | `scratch/store-local/plp-road-signs/23-text-sign-1440-front.png` | Text sign (`sign-turn-right`, `image: null`) | `1440×900` | `#/nd/signs/cards/sign-turn-right` — Front desktop |
| 24 | `scratch/store-local/plp-road-signs/24-text-sign-1440-back.png` | Text sign (`sign-turn-right`, `image: null`) | `1440×900` | `#/nd/signs/cards/sign-turn-right` — Back desktop |
