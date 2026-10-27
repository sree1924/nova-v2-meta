# Muse belt-operator report — Utah second launch (2026-10-27 ~11:52 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 sections).
Lane: belt operator. Ran belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **non-zero** (Node threw; runner banner printed first).
Full console: `coordination/step1-sec09-full-console.log` (3,890 bytes).
Exact output:

- Banner: `UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $5.654 / cap $30`
- `02.dossier_sections` parts C, C2, A, B, D, E, E2, F, G: **already accepted — skipped** (9/9, $0 new spend this launch; acceptances are from the prior launch)
- Then STOP at the 16→03 handoff. Exact error:
  `Error: Immutable artifact already exists with different bytes: 16-compiled-dossier.json`
  at `writeImmutable (tools/belt/atomic-file.mjs:38)` via
  `compileAcceptedDossier (tools/belt/controller.mjs:177)` via `run-utah.mjs:149`.
- Per-part USD this launch: $0.00 (no model calls; everything skipped before the crash).

What this means: the runner recompiled the 9 accepted dossier parts into
`16-compiled-dossier.json` and the fresh bytes differ from the file already on
disk (written 11:44 AM, prior launch), so the immutability guard refused the
write. Stages 03/04/06/05.sessions/05.card_scripts never dispatched.
Per instructions I did NOT retry and did NOT touch `tools/belt/*`.

Ledger state (read-only query, this launch): `02.dossier_sections` 9 accepted /
28 blocked / 1 failed / 20 queued / 2 retry_wait; `03.combined_kg` 6 blocked /
4 queued; `04.cards`, `05.sessions`, `05.card_scripts`, `06.exam_bank`,
`07/08/09`, `19A` queued; `16.compile` 1 accepted + **1 running** (leftover of
the crashed step-1 attempt — runner-side state, not mine to clear);
`15.sources` + `19.learning_inputs` accepted. Spend: ledger actual
5,654,209 µUSD ($5.654209) vs receipt-estimated $4.654209 across 50 attempts.
Step-4 conditional rerun (`--stages 16,03,...`) NOT attempted: no 03/04/06/05
artifact is accepted yet, and it would re-hit the identical 16 compile guard —
a prohibited blind retry.

## 2. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → `wrote app-preview\data\trace.json`,
  `attempts=50 prompt_tokens=2670584 completion_tokens=309641
  estimated_usd=4.654209 actual_microusd_exact=5654209`. (Shell exit code is a
  cosmetic PowerShell/SQLite-ExperimentalWarning artifact; the exporter wrote
  and printed successfully.)
- `node tools/preview/embed-trace.mjs` → `attempts=50 estimated_usd=4.654209`.
- `trace.html` needs no edit: it fetches `data/trace.json` live with the
  regenerated `trace-embedded.js` as file:// fallback. Confirmed totals card,
  per-attempt cards (tokens/USD/checks), lineage timeline, queued-stages list,
  and approvals/resets/jams sections all read from the new 50-attempt export
  (`exported_at 2026-10-27T17:52:40Z`).

## 3. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → `copied=9 skipped_non_accepted=34`
  into `app-preview/data/real/`. All 9 `02_dossier_sections` files are
  ledger-`accepted` stage_output artifacts; manifest sha256s recomputed at copy
  time and re-verified after (9 files, 0 mismatches). Nothing from 03/04/05/06:
  no accepted tasks exist there, so no cards/sessions/exam items were wired —
  learner screens (lesson, flashcards, quiz, practice) stay fully synthetic.
- `#/dossier` renders all 9 parts generically (no rebuild): C = 24 FACT_ID
  blocks, C2 = 15 FACT_ID blocks, A/B/D/E/E2/F/G = structural prose with zero
  FACT_ID blocks ( verified per-file; that is the dossier's real shape, not a
  gap). Two minimal `index.html` fixes in my lane: sections without FACT_ID
  blocks now show their full prose instead of an empty card, and the chunk
  label falls back to `chunk_index/chunk_total` (envelope_scope carries no
  chunk_id). Inline module passes `node --check`; banner logic unchanged
  (REAL on `#/dossier`, SYNTHETIC everywhere else).
- `app-preview/README.md` updated to this launch (50 attempts, $4.654209 est /
  5,654,209 µUSD actual, 9 dossier files, regenerated sha256 table).

Real vs synthetic now: REAL = `#/dossier` (9 accepted sec09 dossier parts,
"REAL — Utah Section 9, validated, audit pending") + `trace.html` (ledger
data). SYNTHETIC = every learner screen (Nowhere-island sample, banner kept).

## 4. Could not do

- Advance 03/04/06/05: blocked by the `16-compiled-dossier.json` immutability
  crash (runner/tooling side). Needs whoever owns `tools/belt/` to reconcile
  the recompile-vs-stored-bytes mismatch; operator lane cannot fix it.
- Clear the leftover `16.compile` task stuck in `running` from the crashed
  attempt (writes under `runs/` only through belt commands).
- Browser-render verification of `#/dossier`: static-file smoke only
  (JSON parses, hashes match, module syntax-checks). No browser automation run.
