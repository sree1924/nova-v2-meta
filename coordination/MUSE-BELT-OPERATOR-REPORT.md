# MUSE belt-operator report — Utah sec09 run, seventh launch 2026-10-27 (~11:36 MDT)

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs`; ledger read-only via
`node:sqlite {readOnly:true}` exactly as `export-trace.mjs` does; writes only under
`app-preview/`, `tools/preview/`, `coordination/` (this report). No `.env` contents
printed. No `tools/belt/*`, schemas, prompts, contracts touched. This report overwrites
the sixth-launch report per the brief; the prior tooling (export-trace, embed-trace,
export-content, `#/dossier` route) was reused, not rebuilt. No app-preview code edits
were needed this launch — re-running the exporters picked up the new acceptances.

## 1. Belt run (step 1) — B/D/E/E2/F accepted, STOP at 02/G ERROR, D/C2/A/C already accepted

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages 02`
Exit code: **1**. Full console output, verbatim:

```
UTAH RUN — section sec09-rules-of-the-road; stages 02; spent so far $3.402 / cap $30
  02.dossier_sections part C: already accepted — skipped
  02.dossier_sections part C2: already accepted — skipped
  02.dossier_sections part A: already accepted — skipped
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:14 (reset 1/2)
  02.dossier_sections part B: HOLD $0.088 — 02.FACT_LINES_CITED=FAIL  [spent $3.490]
  retry → 02.dossier_sections:B nonce 5
  02.dossier_sections part B: accepted $0.091  [spent $3.581]
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:15 (reset 1/2)
  02.dossier_sections part D: accepted $0.094  [spent $3.675]
  02.dossier_sections part E: accepted $0.089  [spent $3.764]
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:16 (reset 1/2)
  02.dossier_sections part E2: HOLD $0.094 — 02.FACT_LINES_CITED=FAIL  [spent $3.859]
  retry → 02.dossier_sections:E2 nonce 1
  02.dossier_sections part E2: HOLD $0.092 — 02.FACT_LINES_CITED=FAIL  [spent $3.950]
  retry → 02.dossier_sections:E2 nonce 2
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:17 (reset 2/2)
  02.dossier_sections part E2: HOLD $0.090 — 02.FACT_LINES_CITED=FAIL  [spent $4.040]
  retry → 02.dossier_sections:E2 nonce 3
  02.dossier_sections part E2: accepted $0.087  [spent $4.128]
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:18 (reset 1/2)
  02.dossier_sections part F: accepted $0.087  [spent $4.214]
  02.dossier_sections part G: HOLD $0.102 — 02.G_MATRIX=FAIL  [spent $4.316]
  retry → 02.dossier_sections:G nonce 1
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:19 (reset 1/2)
  02.dossier_sections part G: HOLD $0.099 — 02.G_MATRIX=FAIL  [spent $4.415]
  retry → 02.dossier_sections:G nonce 2
  02.dossier_sections part G: HOLD $0.104 — 02.G_MATRIX=FAIL  [spent $4.519]
  retry → 02.dossier_sections:G nonce 3
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:20 (reset 2/2)
  02.dossier_sections part G: HOLD $0.104 — 02.MARKET_SIGNAL=FAIL, 02.G_MATRIX=FAIL  [spent $4.624]
  retry → 02.dossier_sections:G nonce 4
  ERROR 02.dossier_sections part G: Dispatch remains HOLD: owner_implementation_closure_unsealed
STOP at 02.dossier_sections G: ERROR
```

Per-part ledger outcome this launch (USD = ledger actual per attempt; "spent" line is the runner's running total):

| Part | Result | USD |
|---|---|---|
| C | already accepted — skipped, $0 | 0 |
| C2 | already accepted — skipped, $0 | 0 |
| A | already accepted — skipped, $0 | 0 |
| B | HOLD (FACT_LINES_CITED) → retry nonce 5 → accepted | 0.088 + 0.091 |
| D | accepted first attempt | 0.094 |
| E | accepted first attempt | 0.089 |
| E2 | 3× HOLD (FACT_LINES_CITED) → accepted on nonce 3 | 0.094 + 0.092 + 0.090 + 0.087 |
| F | accepted first attempt | 0.087 |
| G | 4× HOLD (G_MATRIX ×3, then MARKET_SIGNAL + G_MATRIX) → ERROR `owner_implementation_closure_unsealed` → STOP | 0.102 + 0.099 + 0.104 + 0.104 |

Spend: $3.402 → $4.624 this launch (+$1.222). Cap headroom remaining: ~$25.38.
Section-09 stage-02 tally after this launch: 8 of 9 parts accepted (C, C2, A, B, D, E, E2, F). G has no accepted task.
Recurring HOLD signatures: `02.FACT_LINES_CITED=FAIL` (B once, E2 three times — retried through), `02.G_MATRIX=FAIL`
(G four times, unrecoverable by retry), final G attempt additionally `02.MARKET_SIGNAL=FAIL`.
The G ERROR is an owner-side validator closure (`owner_implementation_closure_unsealed`), not a content
deficiency the runner can retry around — per hard rules it was recorded, not retried.

## 2. Trace export (step 2) — exit 0, trace.html current

- `node tools/preview/export-trace.mjs` → exit **0** → `wrote app-preview\data\trace.json`,
  `attempts=41 prompt_tokens=2208977 completion_tokens=202930 estimated_usd=3.623677 actual_microusd_exact=4623677`.
  (First invocation printed exit 1 from the PowerShell host surfacing node's SQLite
  ExperimentalWarning on stderr; re-run with stderr suppressed exited 0 with identical output —
  the export itself succeeded both times.)
- `node tools/preview/embed-trace.mjs` → exit **0** → `wrote app-preview/trace-embedded.js attempts=41 estimated_usd=3.623677` (281,267 bytes).
- `app-preview/trace.html` loads `data/trace.json` via fetch with `window.__TRACE_EMBEDDED` fallback —
  both files regenerated, so the reviewer trace shows all 41 attempts, per-check rows
  (incl. the new B/D/E/E2/F acceptances and G HOLDs), and the totals strip:
  41 attempts · 2,208,977 prompt tokens · 202,930 completion tokens ·
  estimated $3.623677 · ledger actual 4,623,677 µUSD (= $4.623677, matches runner $4.624).
- Ledger task mix behind the 41 attempts: 8 × `02.dossier_sections` accepted (sec09 parts),
  3 × failed, remainder blocked (other sections' parts never dispatched), plus accepted
  15.sources and 19.learning_inputs rows; 29 tasks without attempts remain queued
  (20 × 02 other-section parts, 1 each of 03/04/05.sessions/05.card_scripts/06/07/08/09/19A).

## 3. Real content wiring (step 3) — exit 0, no code changes needed

- `node tools/preview/export-content.mjs` → exit **0** → `copied=8 skipped_non_accepted=28`.
  All 8 accepted sec09 dossier artifacts copied to `app-preview/data/real/02_dossier_sections/`
  with sha256 manifest (`app-preview/data/real/manifest.json`, `exported_at=2026-10-27T17:36:39.552Z`);
  `app-preview/data-real-embedded.js` regenerated for file:// fallback.
- The `#/dossier` reviewer route (from the prior launch, reused unchanged) renders each part's
  `sections[].markdown` FACT_ID blocks with provenance (task/attempt id, sha256, bytes).
  Verified artifact shapes match the view's fields (`envelope_scope.assigned_section_ids`,
  `sections[].{heading,chunk_id,fact_ids,learner_facing,markdown}`):
  C = 24 fact blocks, C2 = 15 fact blocks; A/B/D/E/E2/F carry short markdown (204–741 chars,
  0 FACT_ID blocks — that is the accepted artifact content, rendered faithfully, not a view gap).
- Banners: `#/dossier` shows `REAL — Utah Section 9, validated, audit pending`; every learner
  screen keeps `SYNTHETIC SAMPLE — not Utah content`. Learner screens (lesson, flashcards,
  quiz, practice) remain fully synthetic — see step 4.

## 4. Later stages (step 4) — NOT run: not enabled by the runner

Step 1 STOPped at `02.dossier_sections G: ERROR`, so the runner never reached `16.compile`,
let alone 03/04/06/05. Evidence the condition was not met: all of 03.combined_kg, 04.cards,
05.sessions, 05.card_scripts, 06.exam_bank remain `queued` with zero attempts in the
fresh trace export, and 16.compile requires all 9 dossier parts while G has no accepted task.
Running the step-4 command now would spend calls against an incomplete dossier, so per the
STOP/ERROR hard rule it was not attempted. Consequence: no 04 cards / 05 sessions / 06 items
exist to wire — flashcards, lesson, and quiz stay synthetic until a future launch accepts G
(owner must first reseal the `owner_implementation_closure_unsealed` validator closure)
and the runner enables 16 → 03 → 04/06/05.

## 5. Could-not-do list

1. Part G of stage 02: 4 HOLDs then owner-side ERROR; needs owner (Claude schema lane) action, not operator retry.
2. Step-4 stages (16/03/04/06/05.sessions/05.card_scripts): blocked behind G; not attempted.
3. Real learner screens: nothing to wire until 04/05/06 produce accepted artifacts.
4. No independent browser smoke of `#/dossier` rendering was run (no browser tool in this lane);
   wiring was verified structurally (manifest + artifact shapes + view field match), not visually.
