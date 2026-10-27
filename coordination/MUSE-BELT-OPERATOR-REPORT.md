# MUSE belt-operator report — Utah sec09 run, fourth launch 2026-10-27 (~11:15 MDT)

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs`; ledger read-only via
`node:sqlite {readOnly:true}` exactly as `export-trace.mjs` does; writes only under
`app-preview/`, `tools/preview/`, `coordination/` (this report). No `.env` contents
printed. No `tools/belt/*`, schemas, prompts, contracts touched. This report overwrites
the third-launch report per the brief; the prior tooling (export-trace, embed-trace,
export-content, `#/dossier` route) was reused, not rebuilt.

## 1. Belt run (step 1) — STOP at 02/C, one new unknown_provider_result attempt, $0 new actual spend

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages 02`
Exit code: **1**. Full console output, verbatim:

```
(node:138968) ExperimentalWarning: SQLite is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
UTAH RUN — section sec09-rules-of-the-road; stages 02; spent so far $1.382 / cap $30
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:8 (reset 1/2)
  02.dossier_sections part C: HOLD — unknown_provider_result  [spent $2.382]
  retry → 02.dossier_sections:C nonce 1
  ERROR 02.dossier_sections part C: Rebind is blocked while an attempt or uncertain provider result remains active
STOP at 02.dossier_sections C: ERROR
```

Per-part status this launch: **part C only reached; C2/A/B/D/E/E2/F/G never dispatched.**
C went HOLD (`unknown_provider_result`, provider returned no usable result), the runner
minted retry nonce 1, then hit `Rebind is blocked while an attempt or uncertain provider
result remains active` and STOPped. Per the hard rule I did NOT retry after STOP:
recorded here and moved on. Dispatch/rebind gating belongs to the runner owner.

New ledger row this launch (read-only, from `trace.json` last attempt):
task `66351e35…`, attempt `c6d99687…`, lineage 8, `attempt_status`/`task_status` =
`unknown_provider_result`, `model_requested` = `muse-spark-1.3`, `model_returned` = null,
tokens/usd/elapsed/finish = null with `unknown_reasons` (no call-receipt.json, no ledger
usage), `reserved_microusd` = 1000000, `reservation_state` = `unknown_provider_result`,
`checks` = null, `error_ref` = `provider-unknown.json` (173 bytes), request envelope kept
(`request-envelope.json`, 9752 bytes). **Zero completed model calls, $0 new actual spend.**
The console `spent $2.382` line is a reservation-basis figure (+$1.00 reservation for the
uncertain attempt); ledger actual is unchanged at $1.381749 (see §2). `jams.md` logs the
lineage-8 reset (17:14:57Z, cause: attempt limit after HOLDs) and the C nonce-1 retry
(17:15:58Z, non-PASS: unknown_provider_result); `receipts/` has `lineage-reset-…-lineage8.json`
and two new binding receipts. Cap position: ~$1.38 / $30 actual (4.6%); ~$28.62 remaining.

Ledger task state after this launch (read-only `tasks GROUP BY stage_id,status`):

| stage | accepted | blocked | failed | queued | retry_wait | unknown_provider_result |
|---|---|---|---|---|---|---|
| 02.dossier_sections | 1 (part C, prior launch) | 11 | 1 | 7 | 1 | 1 (this launch) |
| 15.sources / 19.learning_inputs | 1 each | — | — | — | — | — |
| 03 / 04 / 05.sessions / 05.card_scripts / 06 / 07 / 08 / 09 | — | — | — | 1 each | — | — |

Attempts by status: accepted 3, blocked 11, failed 2, unknown_provider_result 1 (total 17).

## 2. Trace export (step 2) — done, exit 0, new attempt reflected

- `node tools/preview/export-trace.mjs` → exit 0:
  `wrote app-preview\data\trace.json attempts=17 prompt_tokens=758681
  completion_tokens=101976 estimated_usd=1.381749 actual_microusd_exact=1381749`.
  Attempts 16 → 17 is this launch's unknown_provider_result row; token and actual-USD
  totals unchanged (no completed call), which corroborates the $0-spend claim above.
  Totals row: `model_calls_completed` = 12, `reasoning_tokens_observed` = 55892,
  `reserved_microusd_total` = 15000000, `actual_usd_exact` = 1.381749.
- `node tools/preview/embed-trace.mjs` → exit 0:
  `wrote app-preview/trace-embedded.js attempts=17 estimated_usd=1.381749`.
- `trace.html` confirmed reflecting the new state: it `fetch("data/trace.json")` when
  served with `window.__TRACE_EMBEDDED` fallback for `file://`; both sources regenerated
  this launch (17 attempts). No edit needed.

## 3. Real-artifact wiring (step 3) — done; section C still the only REAL content

- `node tools/preview/export-content.mjs` → exit 0:
  `copied=1 skipped_non_accepted=11 -> app-preview\data\real/manifest.json`.
- Manifest (`app-preview/data/real/manifest.json`, exported 2026-10-27T17:16:12Z):
  1 accepted file, `02.dossier_sections`, task `205cb0ae`, 12,522 bytes,
  section C, lineage 5, attempt `3daea025`. `data-real-embedded.js` regenerated with it.
- Independent sha check this launch: `bytes=12522
  sha=3e0d33b96134fc711ef33e4799d6e057ad54288fe8e84dae168df90230fd58df` — matches the
  manifest sha256. Exit 0.
- No `index.html` / `#/dossier` edits: the route and data-shape handling from the prior
  launch already render this exact artifact (24 FACT_ID blocks, chunk `C.01`), and the
  bytes are unchanged. This launch's unknown_provider_result row carries no stage output,
  so there is nothing new to render.

## 4. Later stages (step 4) — NOT triggered, nothing run

Precondition "later stages already enabled by the runner" not met:
`03.combined_kg`, `04.cards`, `05.sessions`, `05.card_scripts`, `06.exam_bank`
(plus 07/08/09) are all still `queued` × 1 each (table in §1), and the runner STOPped at
02/C. The `16,03,04,06,05.sessions,05.card_scripts` command was therefore NOT run — the
brief conditions it on the runner having enabled those stages. No 04 cards / 05 sessions /
06 items exist to wire; the dossier view's "other accepted stages" section will list them
if they ever appear.

## 5. Real vs synthetic in the app (as shipped, unchanged)

- REAL: `#/dossier` section-C view (24 FACT_ID blocks with task/attempt/sha256
  provenance) under the "REAL — Utah Section 9, validated, audit pending" banner;
  `trace.html` (17-attempt ledger trace, $1.381749 actual, $15.00 reserved total).
- SYNTHETIC: every learner screen (home, chapters, lesson, cards, quiz, practice,
  results, settings) — fictional sample, SYNTHETIC banner.
- REVIEWER-EMPTY: `#/dossier` for every part except C until the belt accepts more.

## 6. Could not do / open items

- Parts C2/A/B/D/E/E2/F/G have no accepted artifact. This launch never reached them:
  STOP at part C on `unknown_provider_result` → rebind-blocked ERROR. Runner-owner
  matter, together with the standing C2 `02.MERGE_DETERMINISTIC` HOLDs from prior launches.
- No live-browser or static-server smoke this launch (sandbox loopback limits stand);
  rendering rests on the prior 9/9 harness against the same dossier functions and bytes
  (data shape unchanged). Recommend one human double-click of `app-preview/index.html`
  (`#/dossier`) and `app-preview/trace.html`.
