# MUSE-PREVIEW-REPORT — dev preview build, 2026-10-27

## What was built

`app-preview/` standalone static app (inline ES modules + CSS, no bundler/npm)
plus `tools/preview/export-trace.mjs`:

- Learner screens (all 8, hash routes in `index.html`): home, chapter hub, lesson,
  flashcards, quiz, practice test, results, settings/about. Text-first, free-only,
  no auth, no audio player. Scores use observed-practice-only language.
  No Trace link anywhere in learner navigation (verified by grep).
- One synthetic sample chapter under `data/synthetic/` (fictional island of Nowhere;
  obviously fake placeholders, zero real driving rules). All three files VALIDATE
  against `schemas-strict/04-carddeck`, `05b-session-scripts`, `06-exambank` v0.4.0
  (ajv 2020, repo-local). Banner "SYNTHETIC SAMPLE — not Utah content" on every screen.
- Reviewer route `trace.html`: timeline per lineage, cost/token totals strip,
  per-check PASS/FAIL table with evidence, artifact sha256+bytes, approvals (1),
  lineage resets (2), jams (2). Rendered from `data/trace.json`.
- Exporter ran once against the real ledger (read-only `node:sqlite {readOnly:true}`):
  6 attempts, 226,477 prompt / 28,646 completion tokens, estimated $0.404842,
  ledger actual 404,842 micro-USD exact. No acceptance files exist on disk, so
  `acceptance` is null with reason on all 6 attempts. No secrets embedded.
- `data-embedded.js` / `trace-embedded.js`: generated identical-content fallbacks so
  double-click (`file://`) works where fetch is blocked.

## Commands run

- `node tools/preview/export-trace.mjs` → wrote `app-preview/data/trace.json`
- ajv-2020 validation of the 3 synthetic files → VALID × 3
- `node --check` on exporter + both inline modules + both embedded files → clean
- Node dependency-free DOM harness executing all 8 learner routes (fetch + embedded
  paths), reveal toggles, full quiz grading (3/3), results, progress reset, and the
  trace page → **21 passed, 0 failed**. The harness caught one real bug pre-report:
  the quiz summary `<div>` sat outside its `<form>`; fixed in `index.html`.
- `Get-FileHash` sha256 inventory for the README table.
- No network requests, no API calls, no installs. Nothing under `runs/` was written;
  ledger opened read-only. `tools/belt/pdf-text.mjs` untouched (no change needed).

## What I could not do

- **Live-browser / static-server smoke:** loopback `listen()` is denied in this
  sandbox (python `PermissionError 10013`, node `EACCES` on 127.0.0.1), so no HTTP
  reachability check or screenshot was possible. Covered instead by the DOM harness
  plus file-level assertions (banner/footer on every page, no auth/audio/paywall strings).
  Recommend one human double-click of `index.html` and `trace.html` as final sign-off.
- **Real belt content:** no accepted 04/05b/06 artifacts exist yet (stage 02 still
  HOLD on lineage 3), so learner screens show only the synthetic sample by design.
- `data-embedded.js` / `trace-embedded.js` must be regenerated after any data change
  (embed scripts used: one-off node scripts reading `data/*.json` → `window.__PREVIEW_EMBEDDED`,
  and `data/trace.json` → `window.__TRACE_EMBEDDED`).
