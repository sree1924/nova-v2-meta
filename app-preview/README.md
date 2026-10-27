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
  `node tools/preview/export-trace.mjs` (16 attempts, 12 model calls completed,
  758,681 prompt tokens, 101,976 completion tokens, estimated $1.381749,
  ledger actual 1,381,749 micro-USD).
- **Real learner content:** section C of the stage-02 dossier —
  `data/real/manifest.json` (written by
  `node tools/preview/export-content.mjs`, accepted ledger tasks only) lists
  1 file (`02_dossier_sections`, task accepted, sha256-verified, 24 FACT_ID
  blocks). The `#/dossier` reviewer route renders its FACT_ID blocks with the
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
blocks with task/attempt/sha256 provenance. Currently shows section C (1
accepted part); empty state for any part with no accepted task.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 9abb97d3c0fd0cd648ce542efcde2a3567cc395385665ddcc6f5229a2f505254 | 19247 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 16e765d3e698e3eaae1a4f5f60510d10e45c91b9e4d7ea2c7519a08584df622d | 106908 |
| data-real-embedded.js (generated) | d18e07109699a2336a94126266b30371ab1ca75dfe0601ac161e388a8df7ddf4 | 12022 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bf2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 38da468cab67c5a46fb806849052c171412f65337cdf3274a28e0391e0ac1026 | 143228 |
| data/real/manifest.json (generated) | 33d21d93de38547fc9e5641f57fb536f1ba7b09c2ec96937f1d2d3fb36fc7ceb | 1273 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).

Every page footer reads "dev preview — no production claims".
