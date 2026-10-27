# MUSE belt-operator report — Utah sec09 run, second launch 2026-10-27

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs`; ledger read-only via
`node:sqlite {readOnly:true}`; writes only under `app-preview/`, `tools/preview/`,
`coordination/` (this report), `tests/.tmp/` (throwaway harnesses).
No `.env` contents printed. No `tools/belt/*`, schemas, prompts, contracts touched.
(`git status` was unavailable — dubious-ownership sandbox block — so the lane
claim rests on the command list below, not on a diff.)

## 1. Belt run (step 1) — part C ACCEPTED; STOP at part C2

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages 02`
Exit code: **1**. Full console output, verbatim:

```
UTAH RUN — section sec09-rules-of-the-road; stages 02; spent so far $0.867 / cap $30
  02.dossier_sections part C: accepted $0.103  [spent $0.970]
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:6 (reset 1/2)
  02.dossier_sections part C2: HOLD $0.095 — 02.MERGE_DETERMINISTIC=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL  [spent $1.065]
  retry → 02.dossier_sections:C2 nonce 1
  02.dossier_sections part C2: HOLD $0.120 — 02.MERGE_DETERMINISTIC=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL  [spent $1.185]
  retry → 02.dossier_sections:C2 nonce 2
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:7 (reset 2/2)
  02.dossier_sections part C2: HOLD $0.095 — 02.MERGE_DETERMINISTIC=FAIL, 02.FACT_LINES_CITED=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL  [spent $1.280]
  retry → 02.dossier_sections:C2 nonce 3
  02.dossier_sections part C2: HOLD $0.102 — 02.MERGE_DETERMINISTIC=FAIL  [spent $1.382]
  retry → 02.dossier_sections:C2 nonce 4
  ERROR 02.dossier_sections part C2: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts
STOP at 02.dossier_sections C2: ERROR
```

Per-part status this turn (console + ledger read-only probe agree to the micro-USD):

| part | result | USD (ledger actual) | failing checks |
|---|---|---|---|
| C | **accepted** (task `205cb0ae`, lineage 5) | $0.102954 | none (validation PASS) |
| C2 nonce 1 (lineage 6) | HOLD → task blocked | $0.095003 | MERGE_DETERMINISTIC, HIGH_YIELD_PER_DOMAIN |
| C2 nonce 2 (lineage 6) | HOLD → task blocked | $0.120010 | MERGE_DETERMINISTIC, HIGH_YIELD_PER_DOMAIN |
| C2 nonce 3 (lineage 7) | HOLD → task blocked | $0.094833 | MERGE_DETERMINISTIC, FACT_LINES_CITED, HIGH_YIELD_PER_DOMAIN |
| C2 nonce 4 (lineage 7) | HOLD → task blocked | $0.102051 | MERGE_DETERMINISTIC |
| A / B / D / E / E2 / F / G | never dispatched | $0 | runner STOPped at C2 |

Spend: $0.867 → $1.382 this turn (+$0.514851 = exact sum of the 5 ledger
actuals above). Cap usage 4.6%; ~$28.62 remaining. Per the hard rule I did NOT
retry after STOP: recorded here and moved on. The retry-nonce + lineage-reset
machinery worked as briefed (resets 1/2 → lineage 6, 2/2 → lineage 7); the
`--max-resets 2` bound is now exhausted, so the next launch starts at lineage 7
with C2 nonce at 4 and one queued 02 task each on lineages 5/6/7.
Recurring `02.MERGE_DETERMINISTIC` HOLDs on C2 belong to the runner +
validator owners, not this lane.

## 2. Trace export (step 2) — done, exit 0

- `node tools/preview/export-trace.mjs` → exit 0:
  `wrote app-preview\data\trace.json attempts=16 prompt_tokens=758681
  completion_tokens=101976 estimated_usd=1.381749 actual_microusd_exact=1381749`.
- `node tools/preview/embed-trace.mjs` → exit 0:
  `wrote app-preview/trace-embedded.js attempts=16 estimated_usd=1.381749`.
- `trace.html` confirmed by inspection: fetches `data/trace.json` when served
  (16 attempts, $1.381749, 12 model calls completed), `trace-embedded.js`
  fallback for `file://` regenerated with the same 16 attempts. No edit needed.

## 3. Real-artifact wiring (step 3) — done; section C is now REAL

- `node tools/preview/export-content.mjs` first run → **crashed**:
  `ENOENT ... app-preview\data\real\02_dossier_sections\task_205c...__attempt_3dae....json`
  at line 130. Root cause (preview-lane bug, latent while `copied=0`): the
  `prune()` step compared `path.relative(OUT_DIR, p)` (backslashes on Windows)
  against `wanted` entries (forward slashes), so it deleted the just-copied
  file and the embed step re-read a missing path. Fix (one line, owned file):
  normalize with `.replace(/\\/g, '/')` before the `wanted.has(...)` check.
  `node --check` clean. No maintained test added: the repo has no harness for
  `tools/preview` (only `npm run smoke` + stage-validator suites), so per
  proportionate practice the re-run below is the verification; disclosed here.
- Re-run → exit 0: `copied=1 skipped_non_accepted=11`.
  Manifest (`app-preview/data/real/manifest.json`, sha re-verified against file
  bytes: match): 1 accepted file, `02.dossier_sections`, task `205cb0ae`,
  12,522 bytes, section C (`C.01`, "Rules of the Road"), 1 section,
  24 `fact_ids`, 6,092-char markdown. `data-real-embedded.js` refreshed
  (12,022 bytes, contains the task id).
- `index.html` `#/dossier` needed two minimal data-shape fixes (owned lane;
  taste preflight loaded, no styling touched):
  1. chunk line fell back to empty (`envelope_scope` carries
     `chunk_index/chunk_total`, not `chunk_id`) → falls back to the sections'
     `chunk_id` ("C.01").
  2. preamble block before the first `FACT_ID:` rendered as an untitled
     "block" card → filter to `^FACT_ID: ` lines (exactly the 24 `fact_ids`).
- Verification: throwaway harness `tests/.tmp/dossier-check.mjs` extracts the
  REAL `vDossier`/`factBlocks`/`esc` code from `index.html` and runs it against
  the exported manifest + artifact — **9 passed, 0 failed** (part-C heading,
  C.01 chunk, sha256 provenance, 24 fact `<pre>` blocks, F01 first, no
  file-missing card, no empty state, empty-manifest state preserved, embedded
  fallback contains the task). Harness left in `tests/.tmp/` (scratch, not
  committed, not part of the app).
- `app-preview/README.md` refreshed: trace totals (16 attempts, $1.381749),
  real-content section (section C, 24 FACT_ID blocks), dossier-route note, and
  the sha256/bytes table (recomputed; untouched files match their old hashes).

## 4. Later stages (step 4) — NOT triggered, nothing run

Precondition "later stages already enabled by the runner" not met: `03/04/05/
05.card_scripts/06/19A/07/08/09` tasks are all still `queued` on lineage 1
(confirmed in the fresh `trace.json`), and the runner STOPped at 02/C2. No
`16.compile`, no 04 cards / 05 sessions / 06 items exist to wire; the dossier
view's "other accepted stages" section will list them if they ever appear.

## 5. Real vs synthetic in the app (as shipped)

- REAL: `#/dossier` section-C view (24 FACT_ID blocks with task/attempt/sha256
  provenance) under the "REAL — Utah Section 9, validated, audit pending"
  banner; `trace.html` (16-attempt ledger trace, $1.381749).
- SYNTHETIC: every learner screen (home, chapters, lesson, cards, quiz,
  practice, results, settings) — fictional Nowhere sample, SYNTHETIC banner.
- REVIEWER-EMPTY: `#/dossier` for every part except C until the belt accepts more.

## 6. Could not do / open items

- Parts C2/A/B/D/E/E2/F/G have no accepted artifact; C2's recurring
  `02.MERGE_DETERMINISTIC` (+`HIGH_YIELD_PER_DOMAIN`, `FACT_LINES_CITED`)
  HOLDs and the exhausted `--max-resets 2` bound are runner/validator-owner
  matters. Next launch resumes at lineage 7.
- No live-browser or static-server smoke: loopback `listen()` is denied in
  this sandbox (same blocker as the prior report). Rendering is proven by the
  9/9 harness against the real functions + real bytes, not by a browser.
- Recommend one human double-click of `app-preview/index.html` (`#/dossier`)
  and `app-preview/trace.html`.
