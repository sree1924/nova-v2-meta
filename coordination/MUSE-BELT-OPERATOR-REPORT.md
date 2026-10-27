# Muse belt-operator report — Utah seventh launch (2026-10-27 ~12:26 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 handbook sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the ~12:15 MDT sixth-launch report per instructions.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (runner STOP; process exit code 1).
Full console: `coordination/step1-sec09-full-console.log`. Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $7.877 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend)
- `16.compile`: **PASS** (reused `runs/2026-10-26-rdmv-ut-class-d/16/cb74264f/16-compiled-dossier.json`)
- `03.combined_kg`: **already accepted — skipped** ($0 new spend)
- `04.cards`: **already accepted — skipped** ($0 new spend)
- `lineage → 2026-10-26-rdmv-ut-class-d:lineage:29 (reset 1/2)` → `06.exam_bank: HOLD $0.179 — 06.ANSWER_RATIONALE_AGREEMENT=FAIL` [spent $8.056]
- `retry → 06.exam_bank: nonce 7` → **HOLD $0.152** — `06.ID_INTEGRITY=FAIL, 06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL` [spent $8.208]
- `retry → 06.exam_bank: nonce 8` → `lineage → 2026-10-26-rdmv-ut-class-d:lineage:30 (reset 2/2)` → **HOLD $0.182** — `06.ANSWER_RATIONALE_AGREEMENT=FAIL` [spent $8.391]
- `retry → 06.exam_bank: nonce 9` → **HOLD $0.184** — `06.ANSWER_RATIONALE_AGREEMENT=FAIL` [spent $8.574]
- `retry → 06.exam_bank: nonce 10` → `ERROR 06.exam_bank: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts`
- `STOP at 06.exam_bank : ERROR`

Per-part USD this launch: 02 $0.00 (skipped), 16 $0.00 (reused),
03 $0.00 (skipped), 04 $0.00 (skipped),
06 **$0.697** over 4 HOLD attempts (0.179+0.152+0.182+0.184),
05.sessions / 05.card_scripts $0.00 (never dispatched — downstream of the 06 STOP).
Runner banner: spent $7.877 → **$8.574** ($21.43 of cap remaining).
Cap NOT hit. Per instructions I did NOT retry manually
and did NOT touch `tools/belt/*`.

What changed vs the sixth launch: same stage, same wall, narrower failure set.
06.exam_bank again dispatches and retries by itself (4 HOLDs across lineages
28→29→30, both resets consumed) but every attempt fails post-validator checks;
`06.ANSWER_RATIONALE_AGREEMENT` failed on all 4 attempts, with
`06.OPTIONS_SHAPE` + `06.ID_INTEGRITY` on 1/4. `06.OFFICIAL_MIRROR` (which
failed on all 6 sixth-launch attempts) did NOT appear this launch. The 5th
retry is refused by the runner's own `LINEAGE_ATTEMPT_LIMIT`.

Ledger tail (read-only, this launch): 69 attempts in trace export (was 65;
+4 new 06 HOLD attempts, now `06.exam_bank|task:blocked/att:blocked × 10`),
15 accepted tasks unchanged
(`15.sources×1, 02.dossier_sections×9, 19.learning_inputs×1,
16.compile×2, 03.combined_kg×1, 04.cards×1`). No accepted 06/05 artifact exists.

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `wrote app-preview\data\trace.json`,
  `attempts=69 prompt_tokens=4132469 completion_tokens=566744
  estimated_usd=7.574255 actual_microusd_exact=8574255`. (The
  SQLite-ExperimentalWarning/RemoteException shell noise is the known cosmetic
  PowerShell artifact; the exporter printed success.)
- `node tools/preview/embed-trace.mjs` → exit 0: `wrote app-preview/trace-embedded.js
  attempts=69 estimated_usd=7.574255`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Totals card,
  per-attempt cards, lineage timeline, queued-stages list, and
  approvals/resets/jams sections all read from the new 69-attempt export
  (`exported_at 2026-10-27T18:26:33Z`; lineages 1–30 present).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: `copied=11
  skipped_non_accepted=50` (was 46; +4 new 06 HOLD attempts correctly
  excluded as non-accepted) into `app-preview/data/real/`
  (`exported_at 2026-10-27T18:26:53Z`; `data-real-embedded.js` regenerated
  by the exporter itself, verified fresh 12:26 local, manifest + 04_cards
  present). Accepted set unchanged:
  9 × `02_dossier_sections` + 1 × `03_combined_kg` +
  1 × `04_cards`.
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
(accepted sec09 flashcards) + `trace.html` (69-attempt
ledger data), all under "REAL — Utah Section 9, validated, audit
pending". SYNTHETIC = lesson, synthetic flashcards, quiz, practice
(sample content, banners kept).

## 4. Could not do

- Advance 06/05: 06.exam_bank fails post-validator checks on all 4 attempts
  (`ANSWER_RATIONALE_AGREEMENT` persistent across lineages 29/30) and the runner
  itself refuses further retries (`LINEAGE_ATTEMPT_LIMIT`, both resets
  consumed) — runner/validator-side behavior, needs whoever owns
  `tools/belt/*` and the 06 contract to resolve; operator lane cannot fix or
  retry it. 05.sessions / 05.card_scripts never dispatched (downstream
  of the 06 STOP).
- Browser-render verification of the preview: static checks only
  (trace.json 69 attempts, manifest 11 files / 50 skipped, embed scripts
  fresh 12:26 local). No browser automation run.
