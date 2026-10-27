# Muse belt-operator report — Utah fifth launch (2026-10-27 ~12:10 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 12:05 MDT fourth-launch report per instructions.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (runner STOP; `RUNNER_EXIT=1` after Tee).
Full console: `coordination/step1-sec09-full-console.log`. Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $6.658 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend)
- `16.compile`: **PASS** (reused `runs/2026-10-26-rdmv-ut-class-d/16/cb74264f/16-compiled-dossier.json`)
- `03.combined_kg`: **already accepted — skipped** ($0 new spend)
- `lineage → 2026-10-26-rdmv-ut-class-d:lineage:26 (reset 1/2)`
- `04.cards`: **accepted $0.145** [spent $6.803]
- `ERROR 06.exam_bank: Dispatch remains HOLD: request_byte_limit`
- `STOP at 06.exam_bank : ERROR`

Per-part USD this launch: 02 $0.00 (skipped), 16 $0.00 (reused),
03 $0.00 (skipped), 04 $0.145 (first-attempt accept, no retry),
06/05 $0.00 (never dispatched — 06 STOPped at dispatch).
Runner banner: spent $6.658 → **$6.803** ($23.20 of cap remaining).
Cap NOT hit. Per instructions I did NOT retry manually
and did NOT touch `tools/belt/*`.

What changed vs the fourth launch: the `04.BACK_FIDELITY=FAIL` wall
is gone — 04.cards accepted on attempt 1 under a fresh lineage
(lineage:26, reset 1/2). The blocker moved one step down: 06.exam_bank
cannot even dispatch (`request_byte_limit` HOLD at dispatch time, no
task row minted past the initial queued placeholder), so 06/05.sessions/
05.card_scripts never dispatched.

Ledger tail (read-only, this launch): 95 tasks / 59 attempts /
15 accepted (`15.sources×1, 02.dossier_sections×9,
19.learning_inputs×1, 16.compile×2, 03.combined_kg×1,
04.cards×1` — new: `task_9a1c1e4b` accepted at lineage:26).
No new 06 task row exists beyond the initial queued placeholder.

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `wrote app-preview\data\trace.json`,
  `attempts=59 prompt_tokens=3270242 completion_tokens=403544
  estimated_usd=5.802870 actual_microusd_exact=6802870`. (The
  SQLite-ExperimentalWarning/RemoteException shell noise is the known cosmetic
  PowerShell artifact; the exporter printed success.)
- `node tools/preview/embed-trace.mjs` → exit 0: `wrote app-preview/trace-embedded.js
  attempts=59 estimated_usd=5.80287`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Totals card,
  per-attempt cards, lineage timeline, queued-stages list, and
  approvals/resets/jams sections all read from the new 59-attempt export
  (`exported_at 2026-10-27T18:08:43Z`).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: `copied=11
  skipped_non_accepted=40` into `app-preview/data/real/`
  (`exported_at 2026-10-27T18:08:49Z`; `data-real-embedded.js` regenerated
  by the exporter itself, verified fresh 12:08 local). 11 accepted
  artifacts: 9 × `02_dossier_sections` + 1 × `03_combined_kg` +
  **1 × `04_cards` (new this launch: `task_9a1c1e4b`, 43,969 bytes,
  39 cards in 3 decks across modules m01/m02/m03)**.
- New this launch in `app-preview/index.html` (my lane): `#/real-cards`
  route (`vRealCards()`) rendering the accepted 04.cards decks —
  recall/reveal cards with front, back, memory hook, module/node/
  difficulty/high-yield, and page-sourced official-tier provenance
  per card. `#/dossier` links to it via an "Accepted flashcards" card;
  settings reviewer section links it too. REAL banner
  ("REAL — Utah Section 9, validated, audit pending") on `#/dossier`,
  `#/modules`, and `#/real-cards`; SYNTHETIC banner on all synthetic
  learner screens. Inline module script parse-checked (`vm.Script` OK).
- Step-4 conditional rerun (`--stages 16,03,04,...`) NOT attempted:
  06.exam_bank STOPped with ERROR at dispatch (not enabled), 06/05 have
  no accepted artifacts, and rerunning would be a prohibited blind
  retry of the STOPped stage.

Real vs synthetic now: REAL = `#/dossier` (9 accepted sec09 dossier
parts) + `#/modules` (1 accepted sec09 combined KG) + `#/real-cards`
(39 accepted sec09 flashcards, 3 decks) + `trace.html` (59-attempt
ledger data), all under "REAL — Utah Section 9, validated, audit
pending". SYNTHETIC = lesson, synthetic flashcards, quiz, practice
(sample content, banners kept).

## 4. Could not do

- Advance 06/05: 06.exam_bank dispatch HOLDs on `request_byte_limit`
  before minting any task — runner-side dispatch-gate behavior, needs
  whoever owns `tools/belt/*` to resolve; operator lane cannot fix or
  retry it. 05.sessions / 05.card_scripts never dispatched (downstream
  of the 06 STOP).
- Browser-render verification of the preview: static checks only
  (index.html script parses, trace.json 59 attempts, manifest 11 files,
  embed scripts fresh). No browser automation run.
