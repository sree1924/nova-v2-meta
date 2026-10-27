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
  `node tools/preview/export-trace.mjs` (51 attempts,
  2,737,677 prompt tokens, 325,512 completion tokens, estimated $4.805527,
  ledger actual 5,805,527 micro-USD; exported 2026-10-27T17:57:22Z).
- **Real learner content:** all 9 accepted parts of the stage-02 dossier
  plus the accepted stage-03 combined KG — `data/real/manifest.json`
  (written by `node tools/preview/export-content.mjs`, accepted ledger
  tasks only) lists 12 files (`02_dossier_sections` ×9, tasks accepted,
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
  rationales), all with the
  "REAL — Utah Section 9, validated, audit pending" banner (not lessons);
  every learner screen keeps the SYNTHETIC banner. The real lesson stays
  unwired until stage 05.sessions has an accepted task; all other
  parts/panels remain synthetic until the belt accepts them.

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
`#/real-cards` real flashcards — the accepted stage-04 cards with provenance.
`#/real-quiz` real quiz — the accepted stage-06 exam bank (39 items,
3 module quizzes, 2 practice forms), interactive with per-option rationales
and device-local results; empty state until stage 06 has an accepted task.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 38ee2b10cb9bfe28731c6434e9626c6ddc3965b760c83cff035d189091e2046e | 22689 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | c864b32d7dd77369c0c5045be514b969ac4fc64235f3f78c0ab8279cfe1fceee | 4509 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | ef3db744b67f957b59d0b7aba341cad7bf1959da99a98c85c20ff93a2ebdc239 | 344284 |
| data-real-embedded.js (generated) | 14fae7b6e99cda038eae7a4b4a5c0a8c9d5a222bcff035113cec61d93c83058a | 90861 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bfb2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | 36fd5a6f078b662cc0819ef1336124c479389c0d43ef94ef4cdc0475a5ac1c22 | 466656 |
| data/real/manifest.json (generated) | eae593ab6f4de4367792c5ecf036dfdc8c82bd08267dbe3ddfbe8889f0c3ae58 | 7852 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then
`node tools/preview/embed-trace.mjs`, and `node tools/preview/export-content.mjs`
(which also refreshes `data-real-embedded.js`).

Every page footer reads "dev preview — no production claims".
