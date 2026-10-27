# app-preview — Utah Section 9 learner course (Muse Code lane)

Standalone static web app. Plain HTML + inline ES modules + CSS. No bundler, no npm, no network calls.

## How to open

- Double-click `app-preview/index.html`, or
- serve the folder with any static file server and open the printed URL, e.g. `python -m http.server --directory app-preview`.

Both paths work: pages fetch `data/real/*.json` over HTTP when served, and fall back
to the generated `data-real-embedded.js` copy (identical content) when opened via `file://`.
`trace.html` is the reviewer route (open it directly); it is NOT linked from learner navigation.

## What is real vs synthetic

- **Real (belt ledger, accepted only):** every learner screen. The course is Utah Driver
  Handbook Section 9, Rules of the Road — 3 modules from the accepted stage-03 KG
  (m01 freeway/flex/express 9 nodes · m02 intersections/markings/signals 15 nodes ·
  m03 learning spine 15 nodes), lessons from the accepted stage-05 sessions
  (u01 7 slides · u02 6 slides · u03 8 slides, narration shown as "teacher says" copy),
  flashcards from the accepted stage-04 cards (9 + 15 + 15, word-for-word, with
  stage-05 card_scripts teaching text and deck recaps), module quizzes plus 2 × 19
  practice forms from the accepted stage-06 exam bank. Every learner screen carries the
  banner "REAL — Utah Section 9, belt-validated, audit pending" plus per-card/item/slide
  source links (fact id + handbook page). `data/real/manifest.json`
  (written by `node tools/preview/export-content.mjs`, accepted ledger
  tasks only) lists 14 files. Practice forms are practice only — no official pass claim.
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
  `node tools/preview/export-trace.mjs` (85 attempts,
  5,760,508 prompt tokens, 784,701 completion tokens, estimated $10.535623,
  ledger actual 11,535,623 micro-USD; exported 2026-10-27T18:54:50Z).

## Learner routes (hash-based, in index.html)

`#/` home (course + 3 modules) · `#/chapters` module list · `#/module/:module` module hub
(Lesson → Flashcards → Quiz) · `#/lesson/:unit` lesson · `#/cards/:unit` flashcards
(3-second recall beat, text-first, no audio) · `#/quiz/:unit` module quiz ·
`#/practice` practice-form chooser · `#/practice/:form` practice form ·
`#/results/:attempt` results (device-local) · `#/settings` settings/about ·
`#/synthetic-sample` fictional comparison sample.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:ut-sec09`.

Reviewer routes (not in the top nav; linked from settings/about):
`#/dossier` source-dossier view — accepted stage-02 artifacts only, FACT_ID
blocks with task/attempt/sha256 provenance (9 accepted sec09 parts A, B, C, C2,
D, E, E2, F, G). `#/modules` module-structure view — the accepted stage-03
combined KG (3 modules, 39 nodes, 18 edges, learning path, unit hints,
provenance). `#/real-cards` real flashcards — the accepted stage-04 cards with provenance,
plus accepted stage-05 card_scripts narration (teaching text per card) under each answer.
`#/real-quiz` real quiz — the accepted stage-06 exam bank (39 items,
3 module quizzes, 2 practice forms), interactive with per-option rationales
and device-local results. `#/real-lesson` real lesson — the accepted stage-05 teaching units (3 units,
21 slides, narration copy, worked examples, misconceptions, self-checks).

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 5628d06107100f7f27249baedce755e067f32dab3e5446f1d51b3fca9cb31270 | 49093 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 25db7151c1f1d14799533d67cb3a60dbf2cbe69f1aaf20b28178d27f652cc9d4 | 599759 |
| data-real-embedded.js (generated) | bae2c3a621b893549dbc104fc1e04479945f0213ef98642e4c4a1f2a0c3e9aef | 268848 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 692ae24860938c4477d564530806bcdd7809e70816ec09ec6534885dfd74c744 | 816983 |
| data/real/manifest.json (generated) | c0fb791a2412d66e59e3c58eb8ee1a2c578af5213c906b180d8a8cf73b699856 | 10724 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).
Verify learner screens any time with `node tools/preview/verify-learner.cjs`
(DOM harness: executes the real inline module against the embedded fallback,
checks every route; exit 0 = pass).

Every page footer reads "dev preview — no production claims".
