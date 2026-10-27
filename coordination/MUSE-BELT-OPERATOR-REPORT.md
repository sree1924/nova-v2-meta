# Muse belt-operator report — Utah sixth launch (2026-10-27 ~12:15 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 handbook sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the ~12:10 MDT fifth-launch report per instructions.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (runner STOP; process exit code 1).
Full console: `coordination/step1-sec09-full-console.log`. Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $6.803 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend)
- `16.compile`: **PASS** (reused `runs/2026-10-26-rdmv-ut-class-d/16/cb74264f/16-compiled-dossier.json`)
- `03.combined_kg`: **already accepted — skipped** ($0 new spend)
- `04.cards`: **already accepted — skipped** ($0 new spend)
- `06.exam_bank` attempt 0: **HOLD $0.187** — `06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL` [spent $6.990]
- `retry → 06.exam_bank: nonce 1` → **HOLD $0.185** — `06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL` [spent $7.175]
- `retry → 06.exam_bank: nonce 2` → `lineage → 2026-10-26-rdmv-ut-class-d:lineage:27 (reset 1/2)` → **HOLD $0.187** — `06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL` [spent $7.362]
- `retry → 06.exam_bank: nonce 3` → **HOLD $0.187** — `06.OFFICIAL_MIRROR=FAIL` [spent $7.549]
- `retry → 06.exam_bank: nonce 4` → `lineage → 2026-10-26-rdmv-ut-class-d:lineage:28 (reset 2/2)` → **HOLD $0.141** — `06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL, 06.MODULE_QUIZ_COVERAGE=FAIL` [spent $7.690]
- `retry → 06.exam_bank: nonce 5` → **HOLD $0.187** — `06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL` [spent $7.877]
- `retry → 06.exam_bank: nonce 6` → `ERROR 06.exam_bank: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts`
- `STOP at 06.exam_bank : ERROR`

Per-part USD this launch: 02 $0.00 (skipped), 16 $0.00 (reused),
03 $0.00 (skipped), 04 $0.00 (skipped),
06 **$1.074** over 6 HOLD attempts (0.187+0.185+0.187+0.187+0.141+0.187),
05.sessions / 05.card_scripts $0.00 (never dispatched — downstream of the 06 STOP).
Runner banner: spent $6.803 → **$7.877** ($22.12 of cap remaining).
Cap NOT hit. Per instructions I did NOT retry manually
and did NOT touch `tools/belt/*`.

What changed vs the fifth launch: 04.cards is now accepted and skipped
(no new $0.145 spend). The blocker is the same stage but a different wall:
06.exam_bank now dispatches and retries by itself (6 HOLDs across lineages
26→27→28, both resets consumed) but every attempt fails post-validator checks
(`OFFICIAL_MIRROR` failed on all 6; `ANSWER_RATIONALE_AGREEMENT` on 5/6;
`OPTIONS_SHAPE` on 3/6; `MODULE_QUIZ_COVERAGE` on 1/6), and the 7th retry is
refused by the runner's own `LINEAGE_ATTEMPT_LIMIT`.

Ledger tail (read-only, this launch): 65 attempts in trace export (was 59;
+6 new 06 HOLD attempts), 15 accepted tasks unchanged
(`15.sources×1, 02.dossier_sections×9, 19.learning_inputs×1,
16.compile×2, 03.combined_kg×1, 04.cards×1`). No accepted 06/05 artifact exists.

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `wrote app-preview\data\trace.json`,
  `attempts=65 prompt_tokens=3787493 completion_tokens=504167
  estimated_usd=6.877082 actual_microusd_exact=7877082`. (The
  SQLite-ExperimentalWarning/RemoteException shell noise is the known cosmetic
  PowerShell artifact; the exporter printed success.)
- `node tools/preview/embed-trace.mjs` → exit 0: `wrote app-preview/trace-embedded.js
  attempts=65 estimated_usd=6.877082`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Totals card,
  per-attempt cards, lineage timeline, queued-stages list, and
  approvals/resets/jams sections all read from the new 65-attempt export
  (`exported_at 2026-10-27T18:21:04Z`).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: `copied=11
  skipped_non_accepted=46` (was 40; +6 new 06 HOLD attempts correctly
  excluded as non-accepted) into `app-preview/data/real/`
  (`exported_at 2026-10-27T18:21:07Z`; `data-real-embedded.js` regenerated
  by the exporter itself, verified fresh 12:21 local). Accepted set unchanged:
  9 × `02_dossier_sections` + 1 × `03_combined_kg` +
  1 × `04_cards` (`task_9a1c1e4b`, 43,969 bytes,
  39 cards in 3 decks across modules m01/m02/m03).
- No `index.html` edit needed this launch: the `#/dossier` (Source dossier
  reviewer view of section C FACT_ID blocks), `#/modules`, and `#/real-cards`
  routes from the previous launch already render every accepted artifact,
  with REAL banner ("REAL — Utah Section 9, validated, audit pending") on
  `#/dossier`, `#/modules`, `#/real-cards`, and SYNTHETIC banner on all
  synthetic learner screens. Nothing new was accepted, so nothing new to wire.
- Step-4 conditional rerun (`--stages 16,03,04,...`) NOT attempted:
  06.exam_bank STOPped with ERROR (not enabled/passing) and 06/05 have
  no accepted artifacts; rerunning would be a prohibited blind
  retry of the STOPped stage.

Real vs synthetic now: REAL = `#/dossier` (9 accepted sec09 dossier
parts) + `#/modules` (1 accepted sec09 combined KG) + `#/real-cards`
(39 accepted sec09 flashcards, 3 decks) + `trace.html` (65-attempt
ledger data), all under "REAL — Utah Section 9, validated, audit
pending". SYNTHETIC = lesson, synthetic flashcards, quiz, practice
(sample content, banners kept).

## 4. Could not do

- Advance 06/05: 06.exam_bank fails post-validator checks on all 6 attempts
  (`OFFICIAL_MIRROR` persistent across lineages 26/27/28) and the runner
  itself refuses further retries (`LINEAGE_ATTEMPT_LIMIT`, both resets
  consumed) — runner/validator-side behavior, needs whoever owns
  `tools/belt/*` and the 06 contract to resolve; operator lane cannot fix or
  retry it. 05.sessions / 05.card_scripts never dispatched (downstream
  of the 06 STOP).
- Browser-render verification of the preview: static checks only
  (trace.json 65 attempts, manifest 11 files / 46 skipped, embed scripts
  fresh 12:21 local). No browser automation run.
