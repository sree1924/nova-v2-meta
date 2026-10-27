# Muse belt-operator report — Utah fourth launch (2026-10-27 ~12:05 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 12:05 MDT third-launch report per instructions.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (runner STOP; `RUNNER_EXIT=1` after Tee).
Full console: `coordination/step1-sec09-full-console.log`. Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $5.806 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend)
- `16.compile`: **PASS** (reused `runs/2026-10-26-rdmv-ut-class-d/16-compiled-dossier.json`)
- `03.combined_kg`: **already accepted — skipped** ($0 new spend)
- `04.cards`: **HOLD $0.142 — 04.BACK_FIDELITY=FAIL** [spent $5.948]
- `retry → 04.cards: nonce 1` → **HOLD $0.142 — 04.BACK_FIDELITY=FAIL** [spent $6.090]
- `retry → 04.cards: nonce 2` → `lineage → ...:lineage:24 (reset 1/2)` → **HOLD $0.143** [spent $6.233]
- `retry → 04.cards: nonce 3` → **HOLD $0.141** [spent $6.374]
- `retry → 04.cards: nonce 4` → `lineage → ...:lineage:25 (reset 2/2)` → **HOLD $0.143** [spent $6.517]
- `retry → 04.cards: nonce 5` → **HOLD $0.141** [spent $6.658]
- `retry → 04.cards: nonce 6` → `ERROR 04.cards: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts`
- `STOP at 04.cards : ERROR`

Per-part USD this launch: 02 $0.00 (skipped), 16 $0.00 (reused),
03 $0.00 (skipped), 04 $0.852 (6 HOLD attempts: 0.142+0.142+0.143+0.141+0.143+0.141),
06/05 $0.00 (never dispatched). Runner banner: spent $5.806 → **$6.658**
($23.34 of cap remaining). Cap NOT hit.
Per instructions I did NOT retry manually and did NOT touch `tools/belt/*`.

What changed vs the third launch: the `accepted_inputs.blueprint_mnemonics`
gate is gone — 04.cards now dispatches. The blocker moved one step down:
every 04 attempt HOLDs on the post-validator check `04.BACK_FIDELITY=FAIL`,
the runner burned both lineage resets (lineage:24, lineage:25), then hit
`LINEAGE_ATTEMPT_LIMIT` and STOPped. 06/05.sessions/05.card_scripts never
dispatched.

Ledger tail (read-only, this launch): all six 04.cards attempts
`task=blocked attempt=blocked` (nonces 0–5, lineages 23→24→25); accepted
set unchanged: `02.dossier_sections×9, 03.combined_kg×1, 15.sources×1,
16.compile×1, 19.learning_inputs×1`.

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `wrote app-preview\data\trace.json`,
  `attempts=57 prompt_tokens=3193174 completion_tokens=392177
  estimated_usd=5.658225 actual_microusd_exact=6658225`. (The
  SQLite-ExperimentalWarning/RemoteException shell noise is the known cosmetic
  PowerShell artifact; the exporter printed success.)
- `node tools/preview/embed-trace.mjs` → exit 0: `wrote app-preview/trace-embedded.js
  attempts=57 estimated_usd=5.658225`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Totals card,
  per-attempt cards, lineage timeline, queued-stages list, and
  approvals/resets/jams sections all read from the new 57-attempt export
  (`exported_at 2026-10-27T18:05:28Z`).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: `copied=10
  skipped_non_accepted=40` into `app-preview/data/real/`
  (`exported_at 2026-10-27T18:05:36Z`; `data-real-embedded.js` regenerated
  by the exporter itself, verified fresh 12:05 local). Same 10 accepted
  artifacts as last launch: 9 × `02_dossier_sections` + 1 ×
  `03_combined_kg` (`task_eb5a4df235e4c9b412ac11bf6b6ca701cffa9527b89d7ba1383ca8c6898fda73`,
  57,602 bytes). The 6 new 04 HOLD attempts are correctly among the 40
  skipped non-accepted. Nothing from 04/05/06: no accepted tasks exist
  there, so no cards/sessions/exam items were wired — learner screens
  (lesson, flashcards, quiz, practice) stay fully synthetic.
- `#/modules` reviewer route in `app-preview/index.html` (my lane, unchanged
  this launch): renders the accepted 03 KG — header card (3 modules ·
  39 nodes · 18 edges, task/attempt/sha256/bytes provenance, 39-step
  learning path), one card per module with its nodes, and the 3 curriculum
  unit hints. REAL banner ("REAL — Utah Section 9, validated, audit
  pending") on `#/modules` and `#/dossier`; SYNTHETIC banner everywhere
  else. `#/dossier` shows the "Accepted knowledge graph" card linking to
  `#/modules`. No app-preview edits were needed: the real set is unchanged,
  so existing wiring already reflects everything accepted.
- Step-4 conditional rerun (`--stages 16,03,04,...`) NOT attempted: 04.cards
  STOPped with ERROR (not enabled), 04/06/05 have no accepted artifacts,
  and rerunning would be a prohibited blind retry of the STOPped stage.

Real vs synthetic now: REAL = `#/dossier` (9 accepted sec09 dossier parts) +
`#/modules` (1 accepted sec09 combined KG) + `trace.html` (57-attempt ledger
data), all under "REAL — Utah Section 9, validated, audit pending".
SYNTHETIC = every learner screen (sample content, banner kept).

## 4. Could not do

- Advance 04/06/05: every 04.cards attempt HOLDs on `04.BACK_FIDELITY=FAIL`
  and both lineage resets are spent (`LINEAGE_ATTEMPT_LIMIT`). Runner-side
  gate/validator behavior — needs whoever owns `tools/belt/` to resolve;
  operator lane cannot fix or retry it.
- Browser-render verification of the preview: static checks only
  (trace.json parses, 57 attempts, manifest 10 files, embed scripts fresh).
  No browser automation run.
