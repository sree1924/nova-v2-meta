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
  `node tools/preview/export-trace.mjs` (50 attempts,
  2,670,584 prompt tokens, 309,641 completion tokens, estimated $4.654209,
  ledger actual 5,654,209 micro-USD; exported 2026-10-27T17:52:40Z).
- **Real learner content:** all 9 accepted parts of the stage-02 dossier —
  `data/real/manifest.json` (written by
  `node tools/preview/export-content.mjs`, accepted ledger tasks only) lists
  9 files (`02_dossier_sections`, tasks accepted, sha256-verified: section C
  24 FACT_ID blocks, section C2 15 FACT_ID blocks, sections A/B/D/E/E2/F/G
  structural prose with no FACT_ID blocks). The `#/dossier` reviewer route
  renders every part's FACT_ID blocks (full prose for sections without
  FACT_ID blocks) with the
  "REAL — Utah Section 9, validated, audit pending" banner (not a lesson);
  every learner screen keeps the SYNTHETIC banner. All other parts/panels
  remain synthetic until the belt accepts them.

## Learner routes (hash-based, in index.html)

`#/` home · `#/chapters` chapter hub · `#/lesson/:unit` lesson ·
`#/cards/:unit` flashcards · `#/quiz/:unit` unit quiz · `#/practice` practice test ·
`#/results/:attempt` results (device-local) · `#/settings` settings/about.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:sample`.

Reviewer route (not in the top nav; linked from settings/about):
`#/dossier` source-dossier view — accepted stage-02 artifacts only, FACT_ID
blocks with task/attempt/sha256 provenance. Currently shows all 9 accepted
sec09 parts (A, B, C, C2, D, E, E2, F, G); empty state for any part with no
accepted task.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 1e942f1c86513de855f095ce4b5e068532d00b687c6ffc104ef1b710f3d7cded | 19411 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | fbb46fcb5c5fbb2bc474a521a7a7a77f8eca35dca255c9c0018f77dbb47e0f56 | 336101 |
| data-real-embedded.js (generated) | 362f5e70cc2512e9be4710f97550696c9ef696d5ce9b3e35e92cdc2f05495348 | 50918 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 203a79757413b4849412d82fe3a710012da858dea502811a08f86fae39762837 | 455567 |
| data/real/manifest.json (generated) | ea5ff84a285f6eb2ae99587f367e9feeb93639432d46ec5ead398873510caa72 | 7129 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).

Every page footer reads "dev preview — no production claims".
