# Muse belt-operator report — Utah third launch (2026-10-27 ~12:05 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 11:52 MDT second-launch report per instructions.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (`$LASTEXITCODE` 1; runner banner printed first).
Full console: `coordination/step1-sec09-full-console.log`. Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $5.654 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend)
- `16.compile`: **PASS** (`reused .../runs/2026-10-26-rdmv-ut-class-d/16-compiled-dossier.json` — the prior launch's immutability crash is gone)
- `lineage → 2026-10-26-rdmv-ut-class-d:lineage:23 (reset 1/2)`
- `03.combined_kg`: **accepted, $0.151** [spent $5.806]
- `ERROR 04.cards: Dispatch remains HOLD: accepted_inputs.blueprint_mnemonics`
- `STOP at 04.cards : ERROR`

Per-part USD this launch: 02 $0.00 (skipped), 16 $0.00 (reused), 03 $0.151 (one model call), 04/06/05 $0.00 (never dispatched).
Per instructions I did NOT retry and did NOT touch `tools/belt/*`.

Ledger state (read-only query, this launch): `02.dossier_sections` 9 accepted /
28 blocked / 1 failed / 20 queued / 2 retry_wait; `03.combined_kg` **1 accepted** /
6 blocked / 4 queued; `04.cards`, `05.sessions`, `05.card_scripts`,
`06.exam_bank`, `07/08/09`, `19A` queued (1 each); `15.sources` +
`19.learning_inputs` accepted; `16.compile` 1 accepted + **1 retry_wait**
(leftover of the prior crashed attempt — runner-side state, not mine to clear).

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → `wrote app-preview\data\trace.json`,
  `attempts=51 prompt_tokens=2737677 completion_tokens=325512
  estimated_usd=4.805527 actual_microusd_exact=5805527`. (Shell exit-code noise
  is the cosmetic PowerShell/SQLite-ExperimentalWarning artifact; the exporter
  printed success. Same artifact noted on prior launches.)
- `node tools/preview/embed-trace.mjs` → `wrote app-preview/trace-embedded.js
  attempts=51 estimated_usd=4.805527`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Totals card,
  per-attempt cards, lineage timeline, queued-stages list, and
  approvals/resets/jams sections all read from the new 51-attempt export
  (`exported_at 2026-10-27T17:57:22Z`).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → `copied=10 skipped_non_accepted=34`
  into `app-preview/data/real/`. 9 × `02_dossier_sections` + 1 ×
  `03_combined_kg` (`task_eb5a4df235e4c9b412ac11bf6b6ca701cffa9527b89d7ba1383ca8c6898fda73`,
  57,602 bytes). All 10 are ledger-`accepted` stage_output artifacts;
  manifest sha256s recomputed at copy time and re-verified after
  (10 files, 0 mismatches). Nothing from 04/05/06: no accepted tasks exist
  there, so no cards/sessions/exam items were wired — learner screens
  (lesson, flashcards, quiz, practice) stay fully synthetic.
- New `#/modules` reviewer route in `app-preview/index.html` (my lane):
  renders the accepted 03 KG generically — header card (3 modules · 39 nodes ·
  18 edges, task/attempt/sha256/bytes provenance, 39-step learning path),
  one card per module with its nodes (id, label, type, difficulty,
  confidence, high-yield / NEEDS REVIEW flags), and the 3 curriculum unit
  hints. Grouping smoke-checked in Node against the real file
  (m01:9/9, m02:15/15, m03:15/15). REAL banner
  ("REAL — Utah Section 9, validated, audit pending") on `#/modules` and
  `#/dossier`; SYNTHETIC banner everywhere else. `#/dossier` now shows an
  "Accepted knowledge graph" card linking to `#/modules`; settings reviewer
  section links both routes. Inline module passes `node --check`
  (extracted, 21,618 bytes); banner logic otherwise unchanged.
- `app-preview/README.md` updated to this launch (51 attempts, $4.805527 est /
  5,805,527 µUSD actual, 10 real files, `#/modules` documented, sha256 table
  regenerated and programmatically re-verified: 9/9 hashes match files).
- Step-4 conditional rerun (`--stages 16,03,04,...`) NOT attempted: 04.cards
  is HOLD (not enabled), 04/06/05 have no accepted artifacts, and rerunning
  would be a prohibited blind retry of the STOPped stage.

Real vs synthetic now: REAL = `#/dossier` (9 accepted sec09 dossier parts) +
`#/modules` (1 accepted sec09 combined KG) + `trace.html` (ledger data), all
under "REAL — Utah Section 9, validated, audit pending". SYNTHETIC = every
learner screen (Nowhere-island sample, banner kept).

## 4. Could not do

- Advance 04/06/05: `04.cards` dispatch remains HOLD on
  `accepted_inputs.blueprint_mnemonics` (runner-side gate). Needs whoever owns
  `tools/belt/` to resolve; operator lane cannot fix or retry it.
- Clear the leftover `16.compile` task in `retry_wait` from the prior crashed
  attempt (writes under `runs/` only through belt commands).
- Browser-render verification of `#/modules`: static smoke only (JSON parses,
  hashes match, module syntax-checks, grouping counts verified). No browser
  automation run.
