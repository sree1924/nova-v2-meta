# app-preview — Utah Driver Handbook learner course (Muse Code lane)

Standalone static web app. Plain HTML + inline ES modules + CSS. No bundler, no npm, no network calls.

## How to open

- Double-click `app-preview/index.html`, or
- serve the folder and open the printed URL: `node tools/preview/serve.mjs [port]`
  (plain static app-preview/ on 127.0.0.1:4310 by default; no API endpoints,
  no network, no `.env` loading; `.env` returns 403). `node tools/preview/static-serve.mjs`
  and `python -m http.server --directory app-preview` work the same.

The learner loop is **lesson (the narrated "memory session") → flashcards → test**
(module quiz, then chapter practice forms). There is no spoken recall (founder
decision 2026-10-28: "just good old memory session, flashcards, test").

Both paths work: pages fetch each state's `data_root` (Utah: `data/real/*.json`) over
HTTP when served, and fall back to that state's generated embedded copy (Utah:
`data-real-embedded.js`, identical content) when opened via `file://`. The fallbacks are
injected on demand only when fetch fails, so a served page never downloads them.

## Multi-state shell (2026-10-28)

`#/` is a **state picker**; each state's course lives under `#/<xx>/` (`xx` = lowercase
state code). Everything state-specific resolves through one registry entry in
`data/states.json` (file:// fallback `states-embedded.js`, regenerate with
`node tools/preview/embed-states.mjs`, which also validates the shape):

```json
{ "code": "UT", "name": "Utah", "run_id": "2026-10-26-rdmv-ut-class-d",
  "handbook": "Utah Driver Handbook 2026-2027", "test": "Class D knowledge test",
  "data_root": "data/real", "audio_root": "audio", "audio_manifest": "audio/audio-manifest.json",
  "status": "complete", "authored_by": "muse-spark-1.3 via Meta Model API",
  "content_embedded": "data-real-embedded.js", "audio_embedded": "audio-manifest-embedded.js",
  "trace": "trace.html", "chapters": [{ "id": "sec01-definitions", "n": 1, "title": "Definitions" }, "…"] }
```

Optional fields: `content_embedded` (default `<data_root>-embedded.js`), `audio_embedded`
(default the audio manifest path with `-embedded.js`), `trace` (belt-trace page; omitted =
no trace link), `chapters` (handbook order + titles; omitted = the accepted KG sections in
slug order with humanized titles), `short_title` (default `<name> Driver Handbook`), `note`
(free text shown on a coming-soon card). `status` is `complete` | `building` | `sme_only`.
Only `complete` states get a link and load data; `building`/`sme_only` render on the picker
(and at `#/<xx>/`) as **coming soon** with what exists (`N handbook sections mapped` from
`chapters`, plus `note`), never as a broken link. The picker's counts come from each
complete state's content manifest (chapters with an accepted KG, accepted artifacts) and
audio manifest totals (cards, slides, recaps, clips). Utah's files did not move.

**Plugging in a new state (xx) — no code changes:**
1. `node tools/preview/export-content.mjs --run <run-id> --out app-preview/data/<xx>/real --embed app-preview/data/<xx>/real-embedded.js --label "<State> Driver Handbook"`
   (manifest paths are written as `data/<xx>/real/…`; `--out` must be a dedicated `real` folder).
2. Put the state's minted clips + `audio-manifest.json` under `app-preview/audio/<xx>/`, then
   `node tools/preview/embed-audio-manifest.mjs --manifest app-preview/audio/<xx>/audio-manifest.json --out app-preview/audio/<xx>/audio-manifest-embedded.js`.
   Manifest `file_ref`s in the fleet's `audio/<file>` form are rebased under `audio_root`.
3. Add one entry to `data/states.json` (`data_root` `data/<xx>/real`, `audio_root` `audio/<xx>`,
   `audio_manifest` `audio/<xx>/audio-manifest.json`, `status`, `chapters`), then
   `node tools/preview/embed-states.mjs`. A state can be registered as `building` before step 1–2.
Progress is namespaced per state (`nova-preview:v1:<xx>-handbook`; Utah keeps `nova-preview:v1:ut-handbook`).
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

`#/` state picker (one card per `data/states.json` entry) · `#/ut/` Utah home
(whole-handbook counts + built chapters + trace link) · `#/ut/chapters`
all 16 chapters in handbook order · `#/ut/chapter/:section` chapter hub ·
`#/ut/module/:module` module hub (Lesson → Flashcards → Quiz, with "not yet built"
states where the belt has not accepted that artifact) · `#/ut/lesson/:unit` lesson (Play/Pause per "Teacher says" slide) ·
`#/ut/cards/:unit` flashcards (Recall, then reveal: 3-second recall beat; Play
runs question → think cue → answer → teaching) ·
`#/ut/quiz/:unit` module quiz · `#/ut/practice` practice-form chooser (forms grouped by
chapter) · `#/ut/practice/:form` practice form · `#/ut/results/:attempt` results
(device-local) · `#/ut/settings` settings/about · `#/synthetic-sample` fictional
comparison sample (global, not state-scoped). Reviewer routes are prefixed the same way
(`#/ut/dossier`, `#/ut/modules`, `#/ut/real-cards`, `#/ut/real-quiz`, `#/ut/real-lesson`).
**Legacy redirects (this release only):** every old unprefixed route (`#/chapters`,
`#/chapter/…`, `#/module/…`, `#/lesson/…`, `#/cards/…`, `#/quiz/…`, `#/practice[/…]`,
`#/results/…`, `#/settings`, and the five reviewer routes) is rewritten in place to its
`#/ut/…` equivalent (history.replaceState, no extra history entry). `#/` itself is now the picker.
Free-only, no auth, one shared audio element for narration. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:ut-handbook` (per-state key, unchanged for Utah).

## Narration (2026-10-27; spoken recall removed 2026-10-28)

- **Minted narration** (every lesson slide, every flashcard, every deck
  recap): pre-generated MP3 clips minted by the Nova fleet recipe — OpenAI
  `gpt-4o-mini-tts`, voice `nova`, deliberately unhurried pace (atempo 0.85);
  **not a Meta model**. 1,509 clips on disk: 374 cards × (question + answer +
  teaching), 48 deck recaps, 335 lesson slides, 4 shared think cues
  (`cards_missing_voice: 0`, `sessions_missing_audio: 0`). Lesson slides get a
  Play/Pause button each (no auto-advance); flashcards get one Play button
  running question → shared think cue → 3,000 ms pause → answer → teaching,
  revealing the answer when the answer clip starts; recaps play one clip. One
  shared `HTMLAudioElement`; navigating stops playback; no autoplay; the app
  only plays a `file_ref` listed in `audio/audio-manifest.json`
  (`runtime_policy: play_pre_generated_files_only`). Labeled in place
  "narration · pre-generated (OpenAI TTS, not a Meta model)". Works over any
  static server or `file://` (fallback copy `audio-manifest-embedded.js`,
  regenerate with `node tools/preview/embed-audio-manifest.mjs`).
- No model runs in the learner path: narration is pre-generated files, the
  app makes no API calls, and no learner audio is captured. The former
  spoken-recall code is parked, not loaded by any page and not mounted by any
  server: browser half `app-preview/parked/voice-recall.js`, server half
  `tools/preview/transcribe-proxy.parked.mjs` (Meta Voice Transcribe proxy;
  needs `MODEL_API_KEY`; candidate for a later onboarding/marketing agent).

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

## Files (sha256, 2026-10-28 multi-state shell build; index.html + styles.css re-hashed after spoken-recall removal)

| file | sha256 | bytes |
|---|---|---|
| index.html | fd8702a2f950f1b53322e6c3668b3fc9e629b6c7b17136cb56c66fda531db138 | 77961 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | e53f28b7c7eb1fb05b848fb06534e504eb0f32bb04b3aa778ff9e379ea8ff4cb | 4744 |
| parked/voice-recall.js (parked, not loaded) | 80856d74821ad9f8cccb51a27296ce85c3f9935ac73e7352f550e3aeaf07b2ec | 9831 |
| data/states.json (state registry) | c9f5d143103119d9943c85433bad2d30ae4e525a18d35a561c823e4e4c4f6bcd | 1850 |
| states-embedded.js (generated) | 87afcc5ae278ed0ffc5018b427c9c873cd51052e85479167e96f7a57cb608e51 | 1750 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | fd17877b9c6abdd62dc248ec2c7aead9beee9d385ed191defbae61b697bc20c7 | 2705884 |
| data-real-embedded.js (generated) | 727c2717a4f09710fe2e4dc77e6b80ee38090bddaed942842447fd8f9485172f | 3290153 |
| audio-manifest-embedded.js (generated) | da085990e3c633809056d60af19b07654328a40f4988f982023f884259966e86 | 775424 |
| audio/audio-manifest.json (fleet input, read-only) | 69d657eb47071e3d92d17a36abe28cccdb846355d4bbdc3c6f11a21eaf335347 | 949622 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | f586bd31b4afae4cb632cde14f65f239aeafde19f05725d74c8aaf0de1bb49d6 | 3718921 |
| data/real/manifest.json (generated) | 62250f0e3f5d0ee199e8f9a35528a8ee9e919cd34e7796512ab3f80536f956c3 | 174007 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`). After the fleet re-mints
audio: `node tools/preview/embed-audio-manifest.mjs` (refreshes
`audio-manifest-embedded.js`). Sandboxing note: the ledger's
large SQL ORDER BY sorts spill to temp files, which fail in a sandboxed
session (`SQLITE_CANTOPEN` errcode 14, and `SQLITE_TMPDIR` is ignored on
Windows) — so `export-trace.mjs` runs the selects unordered and sorts the
small result sets in JS; no TMP workaround is needed.
Verify learner screens any time with `node tools/preview/verify-learner.cjs`
(DOM harness: executes the real inline module, lets it inject each state's embedded
fallbacks exactly as a file:// open does, asserts the picker, the legacy redirects and
every prefixed Utah route against the exports; exit 0 = pass). Add
`--http=http://127.0.0.1:4311` with `node tools/preview/serve.mjs 4311` running to run the
same suite through the fetch path instead.

Every page footer reads "dev preview — no production claims".
