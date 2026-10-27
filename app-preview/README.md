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
  (sec01 … sec16). 4 of 16 chapters are built (sections with an accepted
  stage-03 KG): Chapter 2 Licensing Requirements (KG only: 3 modules, 17 nodes —
  lesson/cards/quiz show "not yet built"), Chapter 4 License Types and ID
  Documents (KG only: 3 modules, 22 nodes — lesson/cards/quiz "not yet built"),
  Chapter 5 Vision and Health (full chain: 3 modules, 16 nodes, 21 slides in
  3 lessons, 16 flashcards + teaching scripts + recaps, 16 quiz items,
  2 × 8 practice forms), Chapter 9 Rules of the Road (full chain: 3 modules,
  39 nodes, 21 slides in 3 lessons, 39 flashcards + teaching scripts + recaps,
  39 quiz items, 2 × 19 practice forms). Home shows the aggregate counts from
  the exports (4 of 16 chapters · 55 flashcards · 55 quiz items · 6 lessons,
  42 slides) with the REAL banner and the trace link. Section 9 keeps its
  unprefixed belt ids (m01, u01, card-F01, q01…, form-a/b); all other sections
  use the belt's per-section namespaced ids (sec05-m01, sec05-u01,
  sec05-card-…, sec05-itm-…, sec05-form-a/b) and are told apart by each export
  file's `section_id`. Every learner screen carries the banner
  "REAL — Utah Driver Handbook, belt-validated, audit pending" plus
  per-card/item/slide source links (fact id + handbook page + chapter).
  `data/real/manifest.json` (written by `node tools/preview/export-content.mjs`,
  accepted ledger tasks only, one `section_id` per file) lists 76 files.
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
  `node tools/preview/export-trace.mjs` (177 attempts,
  11,089,593 prompt tokens, 1,267,540 completion tokens, estimated $19.249055,
  ledger actual 20,249,055 micro-USD; exported 2026-10-27T19:51:29.378Z).

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
sec01, sec02, sec03, sec04, sec05, sec06, sec09, plus sec07 part C).
`#/modules` module-structure view — accepted stage-03 combined KGs per section
(sec02, sec04, sec05, sec09) with provenance. `#/real-cards` real flashcards —
accepted stage-04 cards with provenance (sec05, sec09),
plus accepted stage-05 card_scripts narration (teaching text per card) under each answer.
`#/real-quiz` real quiz — accepted stage-06 exam banks (sec05, sec09), interactive
with per-option rationales and device-local results. `#/real-lesson` real lesson —
accepted stage-05 teaching units (sec05, sec09) with provenance.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 223be6071f74077a87eb99bb6e0a2c971fe4007c57b99cd1d9fb18e1fe505838 | 57974 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 31259d5f6aebd883f3e62c2f582e329ec90e758fc9bf5b9637e0d839653b7445 | 1225786 |
| data-real-embedded.js (generated) | a02f05ef9c662d71253f93d8bb0add54d36edd0c624d39d7aa6f6f85cef0c673 | 743231 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 65d6659373ccfb189d3100dd9133946f79d4b448e431b13575332ebbe4d24fc3 | 1677751 |
| data/real/manifest.json (generated) | c92c60161ee93d015b55f4765739c8d8185bd5b857a7797b2a3d6bb8a3663fc4 | 59655 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).
Verify learner screens any time with `node tools/preview/verify-learner.cjs`
(DOM harness: executes the real inline module against the embedded fallback,
checks every chapter route against the exports; exit 0 = pass).

Every page footer reads "dev preview — no production claims".
