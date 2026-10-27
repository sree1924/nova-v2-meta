# app-preview — Utah Driver Handbook learner course (Muse Code lane)

Standalone static web app. Plain HTML + inline ES modules + CSS. No bundler, no npm, no network calls.

## How to open

- Double-click `app-preview/index.html`, or
- serve the folder with any static file server and open the printed URL, e.g. `node tools/preview/static-serve.mjs` or `python -m http.server --directory app-preview`.

Both paths work: pages fetch `data/real/*.json` over HTTP when served, and fall back
to the generated `data-real-embedded.js` copy (identical content) when opened via `file://`.
`trace.html` (belt ledger trace, linked from home and settings) is a reviewer route;
it is NOT in the learner top nav.

## What is real vs synthetic

- **Real (belt ledger, accepted only):** every learner screen. The course is the whole
  Utah Driver Handbook — one chapter per handbook section in handbook order
  (sec01 … sec16). 15 of 16 chapters are built (sections with an accepted
  stage-03 KG), every one a full chain (lesson → flashcards → quiz per module
  plus chapter practice forms). Only Chapter 15 Vehicle Equipment is missing
  (its dossier STOPped at part E2; the chapter page honestly reads "not yet
  built"). Per chapter (modules · nodes · slides/lessons · flashcards ·
  quiz items · practice forms): Ch.1 Definitions 3 · 14 · 21/3 · 14 · 14 ·
  7+7; Ch.2 Licensing Requirements 3 · 17 · 22/3 · 17 · 18 · 9+9;
  Ch.3 Driver Education and Permits 3 · 19 · 21/3 · 19 · 19 · 9+10;
  Ch.4 License Types and ID Documents 3 · 22 · 21/3 · 22 · 22 · 8+8;
  Ch.5 Vision and Health 3 · 16 · 21/3 · 16 · 16 · 8+8;
  Ch.6 Examinations 3 · 14 · 21/3 · 14 · 14 · 7+7;
  Ch.7 Preparing Your Vehicle 4 · 26 · 28/4 · 26 · 26 · 13+13;
  Ch.8 Basic Driving 3 · 29 · 21/3 · 29 · 12 · 6+6;
  Ch.9 Rules of the Road 3 · 39 · 21/3 · 39 · 39 · 19+19;
  Ch.10 Alcohol and Drugs 3 · 24 · 21/3 · 24 · 24 · 8+8;
  Ch.11 Distractions and Challenges 3 · 27 · 21/3 · 27 · 27 · 13+13;
  Ch.12 Crashes and Insurance 3 · 22 · 21/3 · 22 · 22 · 11+11;
  Ch.13 Suspensions and Your Record 2 · 18 · 14/2 · 18 · 18 · 9+9;
  Ch.14 Sharing the Road 5 · 45 · 34/5 · 45 · 15 · 8+7;
  Ch.16 Towing 2 · 21 · 13/2 · 21 · 21 · 8+6.
  Every card carries its teaching script + deck recaps (353 scripts, 46 recaps).
  Home shows the aggregate counts from the exports (15 of 16 chapters ·
  353 flashcards · 307 quiz items · 46 lessons, 321 slides) with the REAL banner
  and the trace link. Section 9 keeps its
  unprefixed belt ids (m01, u01, card-F01, q01…, form-a/b); all other sections
  use the belt's per-section namespaced ids (sec05-m01, sec05-u01,
  sec05-card-…, sec05-itm-…, sec05-form-a/b) and are told apart by each export
  file's `section_id`. Every learner screen carries the banner
  "REAL — Utah Driver Handbook, belt-validated, audit pending" plus
  per-card/item/slide source links (fact id + handbook page + chapter).
  `data/real/manifest.json` (written by `node tools/preview/export-content.mjs`,
  accepted ledger tasks only, one `section_id` per file) lists 216 files.
  Practice forms are practice only — no official pass claim. Chapters without
  accepted artifacts render "not yet built" — no synthetic filler anywhere.
- **Synthetic (invented):** one screen only, `#/synthetic-sample` — the old sample about
  the fictional island of Nowhere (turquoise triangles, chartreuse hexagons), kept for
  comparison and linked from settings. It keeps the
  "SYNTHETIC SAMPLE — not Utah content" banner. No synthetic content appears anywhere
  in the learner path.
- **Ledger trace:** `data/trace.json` — exported read-only from
  `runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite` plus per-attempt
  `{call-receipt, validation, reservation, request-envelope}.json` files.
  Raw prompts/responses are never embedded (sha256 + bytes only); secrets never printed;
  every unknown is null with a reason. Exported 2026-10-27 by
  `node tools/preview/export-trace.mjs` (391 attempts,
  24,378,737 prompt tokens, 2,700,997 completion tokens, estimated $41.952703,
  ledger actual 42,952,703 micro-USD; exported 2026-10-27T22:04:22.166Z).

## Learner routes (hash-based, in index.html)

`#/` home (whole-handbook counts + built chapters + trace link) · `#/chapters`
all 16 chapters in handbook order · `#/chapter/:section` chapter hub ·
`#/module/:module` module hub (Lesson → Flashcards → Quiz, with "not yet built"
states where the belt has not accepted that artifact) · `#/lesson/:unit` lesson ·
`#/cards/:unit` flashcards (3-second recall beat, text-first, no audio) ·
`#/quiz/:unit` module quiz · `#/practice` practice-form chooser (forms grouped by
chapter) · `#/practice/:form` practice form · `#/results/:attempt` results
(device-local) · `#/settings` settings/about · `#/synthetic-sample` fictional
comparison sample.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:ut-handbook`.

Reviewer routes (not in the top nav; linked from settings/about):
`#/dossier` source-dossier view — accepted stage-02 artifacts only, FACT_ID
blocks with section/task/attempt/sha256 provenance (9 accepted parts each for
every section except sec15's 6: C, C2, A, B, D, E).
`#/modules` module-structure view — accepted stage-03 combined KGs per section
(every section except sec15) with provenance. `#/real-cards` real flashcards —
accepted stage-04 cards with provenance (every section except sec15),
plus accepted stage-05 card_scripts narration (teaching text per card) under each answer.
`#/real-quiz` real quiz — accepted stage-06 exam banks (every section except sec15),
interactive with per-option rationales and device-local results. `#/real-lesson` real lesson —
accepted stage-05 teaching units (every section except sec15) with provenance.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 223be6071f74077a87eb99bb6e0a2c971fe4007c57b99cd1d9fb18e1fe505838 | 57974 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 304e45f1ce0b0d07c6e363afbbd780d4557a154300ac773b82a50e26c751a690 | 2639746 |
| data-real-embedded.js (generated) | 4ff4565a29d5147109d59ba9c9e53325931efd01ba06110c2c9996747366aa16 | 3143544 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 36a6a18583d79ed2f8a81d05cc5705c0d0e3f373e1781255a1ad0a907726e9af | 3628602 |
| data/real/manifest.json (generated) | 03a50931f03b5022eefc7b7d458641162377b0884cad69e2fbdec52adf78a0e4 | 167832 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`). In a sandboxed session the
ledger's ORDER BY sorts spill to temp files, which the sandbox blocks at the
system temp dir (`SQLITE_CANTOPEN` errcode 14); prefix each node call with
`$env:TMP="$pwd/.tmp-sqlite-diag"; $env:TEMP=$env:TMP; $env:SQLITE_TMPDIR=$env:TMP`
(creating that dir first) and remove it afterwards.
Verify learner screens any time with `node tools/preview/verify-learner.cjs`
(DOM harness: executes the real inline module against the embedded fallback,
checks every chapter route against the exports; exit 0 = pass).

Every page footer reads "dev preview — no production claims".
