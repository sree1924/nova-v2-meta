# app-preview — Utah Driver Handbook learner course (Muse Code lane)

Standalone static web app. Plain HTML + inline ES modules + CSS. No bundler, no npm, no network calls.

## How to open

- Double-click `app-preview/index.html`, or
- serve the folder and open the printed URL. Spoken recall needs the dev
  server: `node tools/preview/serve.mjs` (static app-preview/ on
  127.0.0.1:4310 plus `POST /api/transcribe`, a dev proxy to Meta Voice
  Transcribe; needs `MODEL_API_KEY` in the lane-root `.env`). Plain static
  alternatives (`node tools/preview/static-serve.mjs`,
  `python -m http.server --directory app-preview`) work for everything except
  the "Say it" button, which reports the endpoint as unavailable.

Both paths work: pages fetch `data/real/*.json` over HTTP when served, and fall back
to the generated `data-real-embedded.js` copy (identical content) when opened via `file://`.
`trace.html` (belt ledger trace, linked from home and settings) is a reviewer route;
it is NOT in the learner top nav.

## What is real vs synthetic

- **Real (belt ledger, accepted only):** every learner screen. The course is the whole
  Utah Driver Handbook — one chapter per handbook section in handbook order
  (sec01 … sec16). All 16 chapters are built (sections with an accepted
  stage-03 KG), every one a full chain (lesson → flashcards → quiz per module
  plus chapter practice forms). Per chapter (modules · nodes · slides/lessons ·
  flashcards ·
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
  Ch.15 Vehicle Equipment 2 · 21 · 14/2 · 21 · 21 · 7+7;
  Ch.16 Towing 2 · 21 · 13/2 · 21 · 21 · 8+6.
  Every card carries its teaching script + deck recaps (422 scripts, 48 recaps).
  Home shows the aggregate counts from the exports (16 of 16 chapters ·
  374 flashcards · 328 quiz items · 48 lessons, 335 slides) with the REAL banner
  and the trace link. Section 9 keeps its
  unprefixed belt ids (m01, u01, card-F01, q01…, form-a/b); all other sections
  use the belt's per-section namespaced ids (sec05-m01, sec05-u01,
  sec05-card-…, sec05-itm-…, sec05-form-a/b) and are told apart by each export
  file's `section_id`. Every learner screen carries the banner
  "REAL — Utah Driver Handbook, belt-validated, audit pending" plus
  per-card/item/slide source links (fact id + handbook page + chapter).
  `data/real/manifest.json` (written by `node tools/preview/export-content.mjs`,
  accepted ledger tasks only, one `section_id` per file) lists 224 files.
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
  `node tools/preview/export-trace.mjs` (401 attempts,
  24,986,074 prompt tokens, 2,789,556 completion tokens, estimated $43.088251,
  ledger actual 44,088,251 micro-USD; exported 2026-10-27T22:16:28.297Z).

## Learner routes (hash-based, in index.html)

`#/` home (whole-handbook counts + built chapters + trace link) · `#/chapters`
all 16 chapters in handbook order · `#/chapter/:section` chapter hub ·
`#/module/:module` module hub (Lesson → Flashcards → Quiz, with "not yet built"
states where the belt has not accepted that artifact) · `#/lesson/:unit` lesson (each "Teacher says" block has a device-voice Listen button) ·
`#/cards/:unit` flashcards (3-second recall beat; "Say it" spoken recall via
the dev server; device-voice Listen button on each teaching script) ·
`#/quiz/:unit` module quiz · `#/practice` practice-form chooser (forms grouped by
chapter) · `#/practice/:form` practice form · `#/results/:attempt` results
(device-local) · `#/settings` settings/about · `#/synthetic-sample` fictional
comparison sample.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:ut-handbook`.

## Voice (dev server only, 2026-10-27)

- **"Say it" spoken recall** (flashcards, recall beat): records up to 10 s in
  the browser, re-encodes to 16 kHz mono WAV locally, and posts it to the dev
  proxy `POST /api/transcribe` (raw `audio/wav` body, 2 MB cap). The proxy
  forwards to Meta Voice Transcribe (`muse-voice-transcribe-1.0`,
  `PUSH_TO_TALK`) and returns `{transcript, elapsed_ms, model}`. The
  transcript is scored against the card back with a lenient normalized match
  (lowercase, punctuation stripped, numbers as digits and words both accepted;
  score = fraction of answer tokens heard, ≥ 0.6 = recalled), the card is
  marked recalled/missed in device-local progress, the answer reveals, and the
  transcript shows under it with the match score. The manual Recall button and
  keyboard path are unchanged; if the mic or endpoint is unavailable the
  button says why and never blocks the learner.
- **"Listen (device voice)"** (every lesson "Teacher says" block, every
  flashcard teaching script): reads that text with the browser's built-in
  `speechSynthesis` (prefers en-US, rate 0.95, $0). Clicking again or
  navigating cancels. Labeled in place "device voice — not minted narration";
  hidden entirely when `speechSynthesis` is absent.
- Honesty: the flashcard screen states "voice is transcribed by Meta Voice
  Transcribe via a local dev proxy; nothing is stored beyond this browser and
  the local log". Each proxy call appends one line (timestamp, bytes,
  elapsed_ms, status — never audio, never the key) to
  `data/voice-log.jsonl`. The server never serves `.env`.

Reviewer routes (not in the top nav; linked from settings/about):
`#/dossier` source-dossier view — accepted stage-02 artifacts only, FACT_ID
blocks with section/task/attempt/sha256 provenance (9 accepted parts each for
all 16 sections: C, C2, A, B, D, E, E2, F, G).
`#/modules` module-structure view — accepted stage-03 combined KGs per section
(all 16 sections) with provenance. `#/real-cards` real flashcards —
accepted stage-04 cards with provenance (all 16 sections),
plus accepted stage-05 card_scripts narration (teaching text per card) under each answer.
`#/real-quiz` real quiz — accepted stage-06 exam banks (all 16 sections),
interactive with per-option rationales and device-local results. `#/real-lesson` real lesson —
accepted stage-05 teaching units (all 16 sections) with provenance.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 72f17309aaf938312f4aa954bed99eda7c0524bf049fe41ece02a0dfc9bc7cb0 | 67634 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | dd30973edc111b5086240fe98e1c904307c41af25d0db4615b1d1bfa42cf47dc | 4780 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | fd17877b9c6abdd62dc248ec2c7aead9beee9d385ed191defbae61b697bc20c7 | 2705884 |
| data-real-embedded.js (generated) | 727c2717a4f09710fe2e4dc77e6b80ee38090bddaed942842447fd8f9485172f | 3290153 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | f586bd31b4afae4cb632cde14f65f239aeafde19f05725d74c8aaf0de1bb49d6 | 3718921 |
| data/real/manifest.json (generated) | 62250f0e3f5d0ee199e8f9a35528a8ee9e919cd34e7796512ab3f80536f956c3 | 174007 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`). Sandboxing note: the ledger's
large SQL ORDER BY sorts spill to temp files, which fail in a sandboxed
session (`SQLITE_CANTOPEN` errcode 14, and `SQLITE_TMPDIR` is ignored on
Windows) — so `export-trace.mjs` runs the selects unordered and sorts the
small result sets in JS; no TMP workaround is needed.
Verify learner screens any time with `node tools/preview/verify-learner.cjs`
(DOM harness: executes the real inline module against the embedded fallback,
checks every chapter route against the exports; exit 0 = pass).

Every page footer reads "dev preview — no production claims".
