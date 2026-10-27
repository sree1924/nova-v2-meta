# MUSE belt-operator report — Utah sec09 run, sixth launch 2026-10-27 (~11:30 MDT)

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs`; ledger read-only via
`node:sqlite {readOnly:true}` exactly as `export-trace.mjs` does; writes only under
`app-preview/`, `tools/preview/`, `coordination/` (this report). No `.env` contents
printed. No `tools/belt/*`, schemas, prompts, contracts touched. This report overwrites
the fifth-launch report per the brief; the prior tooling (export-trace, embed-trace,
export-content, `#/dossier` route) was reused, not rebuilt.

## 1. Belt run (step 1) — C2 + A accepted, STOP at 02/B, D/E/E2/F/G undispatched

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages 02`
Exit code: **1**. Full console output, verbatim:

```
(node:130116) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
UTAH RUN — section sec09-rules-of-the-road; stages 02; spent so far $2.382 / cap $30
  02.dossier_sections part C: already accepted — skipped
  02.dossier_sections part C2: HOLD $0.101 — 02.FACT_LINES_CITED=FAIL  [spent $2.482]
  retry → 02.dossier_sections:C2 nonce 5
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:9 (reset 1/2)
  02.dossier_sections part C2: accepted $0.097  [spent $2.579]
  02.dossier_sections part A: HOLD $0.095 — 02.MERGE_DETERMINISTIC=FAIL, 02.DEPTH_FLOOR=FAIL  [spent $2.674]
  retry → 02.dossier_sections:A nonce 1
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:10 (reset 1/2)
  02.dossier_sections part A: HOLD $0.089 — 02.DEPTH_FLOOR=FAIL  [spent $2.763]
  retry → 02.dossier_sections:A nonce 2
  02.dossier_sections part A: HOLD $0.087 — 02.DEDICATED_SURFACE=FAIL, 02.DEPTH_FLOOR=FAIL  [spent $2.851]
  retry → 02.dossier_sections:A nonce 3
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:11 (reset 2/2)
  02.dossier_sections part A: HOLD $0.101 — 02.MERGE_DETERMINISTIC=FAIL  [spent $2.951]
  retry → 02.dossier_sections:A nonce 4
  02.dossier_sections part A: accepted $0.094  [spent $3.045]
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:12 (reset 1/2)
  02.dossier_sections part B: HOLD $0.090 — 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL  [spent $3.135]
  retry → 02.dossier_sections:B nonce 1
  02.dossier_sections part B: HOLD $0.087 — 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL, 02.CORPUS_STABILITY=FAIL  [spent $3.222]
  retry → 02.dossier_sections:B nonce 2
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:13 (reset 2/2)
  02.dossier_sections part B: HOLD $0.088 — 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL  [spent $3.310]
  retry → 02.dossier_sections:B nonce 3
  02.dossier_sections part B: HOLD $0.092 — 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL  [spent $3.402]
  retry → 02.dossier_sections:B nonce 4
  ERROR 02.dossier_sections part B: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts
STOP at 02.dossier_sections B: ERROR
```

Per-part status this launch:

| part | result | USD (as printed) |
|---|---|---|
| C | already accepted — skipped, $0 | $0.000 |
| C2 | HOLD (`02.FACT_LINES_CITED=FAIL`) → retry nonce 5, lineage reset 1/2 → **accepted** | $0.101 + $0.097 |
| A | 4 HOLDs → nonces 1–4, lineage resets 1/2 then 2/2 → **accepted** | $0.095 + $0.089 + $0.087 + $0.101 + $0.094 |
| B | 4 HOLDs → nonces 1–4, lineage resets 1/2 then 2/2 → **ERROR `LINEAGE_ATTEMPT_LIMIT`** → STOP | $0.090 + $0.087 + $0.088 + $0.092 |
| D / E / E2 / F / G | never dispatched (STOP at B) | $0.000 |

New spend this launch ≈ **$1.02** (console `$2.382` → `$3.402`). Cap position:
**$3.402 / $30** console (reservation basis; 11.3%), ~$26.60 remaining.
Per the hard rule I did NOT retry after STOP: recorded here and moved on.

Notable vs the fifth launch: the rebind block is gone — C2 dispatched immediately,
and the ledger no longer carries any `unknown_provider_result` row (attempts by
status are now accepted 5 / blocked 20 / failed 3; the parked fourth-launch row
was reconciled by the runner, no operator action). The runner's own HOLD-retry
+ lineage-reset path worked for C2 (1 retry) and A (4 retries) and stayed within
the `--max-resets` bound (2/2 max on A and B).

Ledger task state after this launch (read-only `tasks GROUP BY stage_id,status`),
02 rows: accepted 3 (parts C, C2, A) · blocked 20 · failed 1 · queued 13 ·
retry_wait 2. `15.sources` / `19.learning_inputs` accepted × 1 each (unchanged).
`03.combined_kg`, `04.cards`, `05.sessions`, `05.card_scripts`, `06.exam_bank`
(plus 07/08/09/19A) still queued × 1 each.

## 2. Trace export (step 2) — done, exit 0, new attempts reflected

- `node tools/preview/export-trace.mjs` → exit 0:
  `wrote app-preview\data\trace.json attempts=28 prompt_tokens=1421879
  completion_tokens=147021 estimated_usd=2.402190 actual_microusd_exact=3402190`.
  Attempts 17 → 28 (+11: C2 ×2, A ×5, B ×4 — exactly this launch's dispatches),
  which corroborates the spend claim above. (Figure recorded verbatim:
  `estimated_usd=2.402190` alongside `actual_microusd_exact=3402190`; the console
  "spent $3.402" tracks the actual-micro figure.)
- `node tools/preview/embed-trace.mjs` → exit 0:
  `wrote app-preview/trace-embedded.js attempts=28 estimated_usd=2.40219`.
- `trace.html` confirmed reflecting the ledger: it `fetch("data/trace.json")`
  when served, with `window.__TRACE_EMBEDDED` fallback for `file://`; both
  sources regenerated this launch with attempts=28. No edit needed — the page
  renders checks, USD, and attempt cards from that data.

## 3. Real-artifact wiring (step 3) — done; C + C2 + A now REAL, no app edits

- `node tools/preview/export-content.mjs` → exit 0:
  `copied=3 skipped_non_accepted=20 -> app-preview\data\real/manifest.json`
  (was copied=1 / skipped=11). `data-real-embedded.js` regenerated by the same
  command (file:// fallback), verified to embed all three artifacts.
- Manifest (`app-preview/data/real/manifest.json`, exported 2026-10-27T17:29:27Z):
  3 accepted `02.dossier_sections` files — task `205cb0ae…` (C, lineage 5,
  12,522 bytes) · task `4dfcf795…` (C2, lineage 9, 10,832 bytes) ·
  task `4591e0f5…` (A, lineage 11, 4,459 bytes).
- Independent sha check this launch: recomputed sha256 of each copied file —
  MATCH on all three (bytes equal manifest bytes).
- Artifact shape re-verified against the generic `#/dossier` renderer (it maps
  over every manifest entry, so no `index.html` edit was needed):
  C.01 "C — Rules of the Road", 24 fact_ids / 24 `FACT_ID:` blocks ·
  C2.01 "C2 — KG handoff hints", 15 fact_ids / 15 `FACT_ID:` blocks
  (`learner_facing: false`) · A.01 "A — Exam authority", 0 fact_ids / 0 blocks —
  exam-authority metadata, mostly `unknown` with verification debt
  (`VD-A-two`, `VD-A-edition`), except the passing threshold 80
  (`verified`, handbook pdf-0033). The dossier page shows A as a
  heading-plus-provenance card with "0 fact blocks", which is what the artifact
  contains — nothing held or blocked is displayed.

## 4. Later stages (step 4) — NOT triggered, nothing run

Precondition "later stages already enabled by the runner" not met:
`03.combined_kg`, `04.cards`, `05.sessions`, `05.card_scripts`, `06.exam_bank`
are all still `queued` × 1 each (table in §1), and the runner STOPped at 02/B.
The `16,03,04,06,05.sessions,05.card_scripts` command was therefore NOT run.
No 04 cards / 05 sessions / 06 items exist to wire; the dossier view's "other
accepted stages" section will list them if they ever appear.

## 5. Real vs synthetic in the app (as shipped)

- REAL: `#/dossier` section-C view (24 FACT_ID blocks), C2 view (15 FACT_ID
  blocks, marked KG-handoff / not learner-facing), and A exam-authority card
  (verified 80 passing threshold; everything else unknown-with-debt) — all with
  task/attempt/sha256 provenance under the
  "REAL — Utah Section 9, validated, audit pending" banner;
  `trace.html` (28-attempt ledger trace).
- SYNTHETIC: every learner screen (home, chapters, lesson, cards, quiz,
  practice, results, settings) — fictional sample, SYNTHETIC banner.
- REVIEWER-EMPTY: `#/dossier` for every part except C/C2/A until the belt
  accepts more.

## 6. Could not do / open items

- Parts B/D/E/E2/F/G have no accepted artifact. B exhausted its lineage
  (resets 2/2, then `LINEAGE_ATTEMPT_LIMIT` on nonce 4 after repeated
  `02.MERGE_DETERMINISTIC` + `02.DEDICATED_SURFACE` HOLDs, one with
  `02.CORPUS_STABILITY`). D/E/E2/F/G were never dispatched (STOP at B).
  Runner-owner matter: whether B's lineage may be reset again under the
  standing authority, or B needs a contract-side fix, is outside this
  operator lane. Standing A HOLDs are resolved (A accepted); B HOLDs remain
  the open check signature.
- No live-browser or static-server smoke this launch; rendering rests on the
  regenerated data files plus the shape verification in §3 (dossier renderer
  unchanged and generic over manifest entries). Recommend one human
  double-click of `app-preview/index.html` (`#/dossier`, now 3 real parts) and
  `app-preview/trace.html` (28 attempts).
