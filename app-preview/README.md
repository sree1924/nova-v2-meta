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
  `node tools/preview/export-trace.mjs` (6 attempts, 226,477 prompt tokens,
  28,646 completion tokens, estimated $0.404842, ledger actual 404,842 micro-USD).

## Learner routes (hash-based, in index.html)

`#/` home · `#/chapters` chapter hub · `#/lesson/:unit` lesson ·
`#/cards/:unit` flashcards · `#/quiz/:unit` unit quiz · `#/practice` practice test ·
`#/results/:attempt` results (device-local) · `#/settings` settings/about.
Free-only, no auth, no audio player. Scores describe observed practice only.
Progress lives in `localStorage` under `nova-preview:v1:sample`.

## Files (sha256, 2026-10-27 build)

| file | sha256 | bytes |
|---|---|---|
| index.html | 082a9bf489498109b5876ba3b7ec7b2812c96c9ce145f12481289a0b07687e57 | 14865 |
| trace.html | 6d4501a1dfad55d54ed0f30d0eb77cf4ca0a5fe7a22c5e9eb04880098631e325 | 6662 |
| styles.css | d823223e042ce0631784f554a4cfbb560b853eb3153925e1e32b85d06de66c4d | 4012 |
| data-embedded.js (generated) | c84fa9dbcf7eea8de9cc04509752ab2b33924a0df106507190e6e78ad75e6eaf | 15625 |
| trace-embedded.js (generated) | 6c96165506688ea0f8dfabe761ca1bbca8fdfd967cb1029f1501654f3936fbb3 | 38339 |
| data/manifest.json | c0b86c105fbf9b71514d41bf2aa3a3881e863c32bf2f8cf94747aef470afd21 | 578 |
| data/trace.json (generated) | bc65b827bee5b553e5eea8fb44b74bbfbecc72e3eb3b5f29f94f4a270433cfa2 | 50583 |
| data/synthetic/04-carddeck.synthetic.json | 0b180dcf649357a0af65ad81d0fa9e0e0cc8950366c35213a765efd127adc08b | 4718 |
| data/synthetic/05b-session-scripts.synthetic.json | faa656715d57040de79dc457be06922224eb43ab8317319eabdf2041d4d73d35 | 3676 |
| data/synthetic/06-exambank.synthetic.json | b6ae8486eb7ecca2265f27b30d514210cd71653e2fbd405605606e75c93f57ce686 | 6382 |

Regenerate after data changes: `node tools/preview/export-trace.mjs`, then the two
embed steps (commands in `coordination/MUSE-PREVIEW-REPORT.md`).

Every page footer reads "dev preview — no production claims".
