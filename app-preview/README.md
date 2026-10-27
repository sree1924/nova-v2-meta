# app-preview — standalone dev preview (Muse Code lane)

Standalone static web app. Plain HTML + inline ES modules + CSS. No bundler, no npm, no network calls.

## How to open

- Double-click `app-preview/index.html`, or
- serve the folder with any static file server and open the printed URL, e.g. `python -m http.server --directory app-preview`.

Both paths work: pages fetch `data/*.json` over HTTP when served, and fall back
to the generated `*-embedded.js` copies (identical content) when opened via `file://`.
`trace.html` is the reviewer route (open it directly); it is NOT linked from learner navigation.

## What is synthetic vs real

- **Synthetic (invented):** everything the learner sees — one sample chapter,
  `data/synthetic/`, about the fictional island of Nowhere (turquoise triangles,
  chartreuse hexagons). Every screen carries the banner
  "SYNTHETIC SAMPLE — not Utah content". The three files validate against the
  strict adapters (`04-carddeck`, `05b-session-scripts`, `06-exambank` v0.4.0).
  No real driving rules are asserted anywhere.
- **Real (belt ledger):** `data/trace.json` only — exported read-only from
  `runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite` plus per-attempt
  `{call-receipt, validation, reservation, request-envelope}.json` files.
  Raw prompts/responses are never embedded (sha256 + bytes only); secrets never printed;
  every unknown is null with a reason. Exported 2026-10-27 by
  `node tools/preview/export-trace.mjs` (85 attempts,
  5,760,508 prompt tokens, 784,701 completion tokens, estimated $10.535623,
  ledger actual 11,535,623 micro-USD; exported 2026-10-27T18:54:50Z).
- **Real learner content:** all 9 accepted parts of the stage-02 dossier
  plus the accepted stage-03 combined KG — `data/real/manifest.json`
  (written by `node tools/preview/export-content.mjs`, accepted ledger
  tasks only) lists 14 files (`02_dossier_sections` ×9, tasks accepted,
  sha256-verified: section C 24 FACT_ID blocks, section C2 15 FACT_ID
  blocks, sections A/B/D/E/E2/F/G structural prose with no FACT_ID blocks;
  `03_combined_kg` ×1: 3 modules, 39 nodes, 18 edges, 39-step learning
  path). The `#/dossier` reviewer route renders every part's FACT_ID blocks
  (full prose for sections without FACT_ID blocks) and the `#/modules`
  reviewer route renders the KG module structure (modules → nodes,
  learning path, unit hints, provenance), the `#/real-cards` reviewer
  route renders the accepted stage-04 cards (1 deck batch), and the
  `#/real-quiz` reviewer route renders the accepted stage-06 exam bank
  (39 items, 3 module quizzes, 2 practice forms, interactive with
  rationales), and the `#/real-lesson` reviewer route renders the
  accepted stage-05 teaching units (3 units u01–u03, 21 slides with
  narration copy, worked examples, misconception corrections,
  self-checks), and accepted stage-05 card_scripts (42 audio scripts,
  one per card for all 39 cards plus 3 recaps; teaching text plus
  script/mode/pacing provenance shown under each real-flashcard
  answer), all with the
  "REAL — Utah Section 9, validated, audit pending" banner (not lessons);
  every learner screen keeps the SYNTHETIC banner. All requested
  sec09 stages are now wired; anything else stays synthetic until
  the belt accepts it.

## Learner routes (hash-based, in index.html)

`#/` home · `#/chapters` chapter hub · `#/lesson/:unit` lesson ·
`#/cards/:unit` flashcards · `#/quiz/:unit` unit quiz · `#/practice` practice test ·
`#/results/:attempt` results (device-local) · `#/settings` settings/about.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:sample`.

Reviewer routes (not in the top nav; linked from settings/about):
`#/dossier` source-dossier view — accepted stage-02 artifacts only, FACT_ID
blocks with task/attempt/sha256 provenance. Currently shows all 9 accepted
sec09 parts (A, B, C, C2, D, E, E2, F, G); empty state for any part with no
accepted task. `#/modules` module-structure view — the accepted stage-03
combined KG (3 modules, 39 nodes, 18 edges, learning path, unit hints,
provenance); empty state until stage 03 has an accepted task.
`#/real-cards` real flashcards — the accepted stage-04 cards with provenance,
plus accepted stage-05 card_scripts narration (teaching text per card) under each answer.
`#/real-quiz` real quiz — the accepted stage-06 exam bank (39 items,
3 module quizzes, 2 practice forms), interactive with per-option rationales
and device-local results; empty state until stage 06 has an accepted task.
`#/real-lesson` real lesson — the accepted stage-05 teaching units (3 units,
21 slides, narration copy, worked examples, misconceptions, self-checks);
empty state until stage 05.sessions has an accepted task.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 8d6f3b16fbfe7fdc15077272b0358f52a4bf52f9218e38286eee4716b8c56a85 | 36483 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 25db7151c1f1d14799533d67cb3a60dbf2cbe69f1aaf20b28178d27f652cc9d4 | 599759 |
| data-real-embedded.js (generated) | e0858953c8531cbd0b5e3bca254140ed790159dc7088194786ec67755a48a314 | 268848 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 692ae24860938c4477d564530806bcdd7809e70816ec09ec6534885dfd74c744 | 816983 |
| data/real/manifest.json (generated) | 0009b8d4a3c28bf8a4384cf474e697ec9a218993ffb2c493452892736ce2267f | 10724 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).

Every page footer reads "dev preview — no production claims".
