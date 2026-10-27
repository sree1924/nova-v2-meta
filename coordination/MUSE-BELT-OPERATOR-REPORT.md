# MUSE belt-operator report — Utah sec09 run, 2026-10-27

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs`; ledger read-only via
`node:sqlite {readOnly:true}`; writes only under `app-preview/` and `tools/preview/`.
No `.env` contents printed. No `tools/belt/*`, schemas, prompts, contracts touched.

## 1. Belt run (step 1) — STOPPED at stage 02 part C

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages 02`
Exit code: **1**. Full console output, verbatim:

```
UTAH RUN — section sec09-rules-of-the-road; stages 02; spent so far $0.755 / cap $30
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:5 (reset 1/2)
  02.dossier_sections part C: HOLD $0.112 — 02.SECTION_BOUNDS=FAIL, 02.G_MATRIX=FAIL  [spent $0.867]
  ERROR 02.dossier_sections part C: Task is not eligible for a new attempt: blocked
STOP at 02.dossier_sections C: ERROR
```

Per the brief I did NOT retry: recorded here and moved on. What this means:
one paid call was made on this turn (part C, ~$0.112, ~25 s class). The runner
reset lineage 4 → 5 first (`receipts/lineage-reset-02dossiersections-lineage5.json`,
cause: attempt limit after HOLDs; logged in `jams.md`), the part C attempt on the
new lineage HELD on `02.SECTION_BOUNDS` + `02.G_MATRIX`, and the following attempt
was refused by the controller (`blocked`), which `run-utah.mjs` surfaces as
`ERROR` → `STOP`. Parts C2/A/B/D/E/E2/F/G were never dispatched this turn.
Spend attributable to this turn: $0.755 → $0.867 (≈$0.112). Cap is not a concern
($29.13 remaining).

Ledger state after the run (`data/trace.json`, 10 attempts total):
`15.sources` accepted (registration, no model call, pre-existing) plus 9
`02.dossier_sections` attempts, NONE accepted:

| attempt (ledger order) | attempt_status / task_status | est. USD | validation | non-PASS checks |
|---|---|---|---|---|
| 02 #1 | failed / retry_wait | null (no receipt; released $1 reservation) | none | no validation.json |
| 02 #2 | failed / failed | $0.104330 | none | no validation.json |
| 02 #3 | blocked / blocked | $0.096769 | HOLD | CHUNK_IDENTITY, SECTION_BOUNDS, FACT_LINES_CITED, EXAM_FACT_STATUS, NUMERAL_LEAK |
| 02 #4 | blocked / blocked | $0.100225 | HOLD | LINEAGE, MERGE_DETERMINISTIC |
| 02 #5 | blocked / blocked | $0.103518 | HOLD | SCOPE_COMPLETENESS, FACT_LINES_CITED, G_MATRIX |
| 02 #6 | blocked / blocked | $0.139771 | HOLD | TRUNCATION_GUARD, DEPTH_FLOOR, G_MATRIX |
| 02 #7 | blocked / blocked | $0.097382 | HOLD | G_MATRIX |
| 02 #8 | blocked / blocked | $0.113074 | HOLD | DEDICATED_SURFACE |
| 02 #9 (this turn, part C) | blocked / blocked | $0.111829 | HOLD | SECTION_BOUNDS, G_MATRIX |

Each blocked attempt has a `stage_output` artifact on disk, but every owning
task is `blocked`, so **zero are eligible for the preview** (accepted-only rule).
`03/04/05/06/19A/07/08/09` tasks remain `queued` on lineage 1; two further
`02.dossier_sections` tasks are `queued` (lineages 1 and 4).

## 2. Trace export (step 2) — done, exit 0

`node tools/preview/export-trace.mjs` → `wrote app-preview/data/trace.json`
`attempts=10 prompt_tokens=458368 completion_tokens=69162 estimated_usd=0.866898 actual_microusd_exact=866898`.
`trace.html` needed no edit (it fetches `data/trace.json` when served), but its
`file://` fallback `trace-embedded.js` was stale (6 attempts). New owned tool
`tools/preview/embed-trace.mjs` regenerates it; ran clean
(`attempts=10 estimated_usd=0.866898`). Both trace paths now show 10 attempts,
6 approvals, 4 lineage resets, 3 jam entries. `node --check` clean on both scripts.

## 3. Real-artifact wiring (step 3) — done; result: nothing real to show (by design)

New owned tool `tools/preview/export-content.mjs` (read-only ledger,
`accepted` learner-stage `stage_output`s only → `app-preview/data/real/<stage>/`
+ `manifest.json` with recomputed sha256s; prunes files whose tasks leave
`accepted`; also refreshes the `file://` fallback `data-real-embedded.js`).
Run result: **copied=0 skipped_non_accepted=7** — the 7 blocked stage outputs
were correctly refused. Exit 0, `node --check` clean.

`index.html` gained a `#/dossier` reviewer route (linked only from settings/about,
never from learner nav): renders accepted stage-02 `sections[].markdown`
FACT_ID blocks with task/attempt/sha256 provenance, plus the
"REAL — Utah Section 9, validated, audit pending" banner. With today's empty
manifest it shows the empty state ("No accepted dossier parts yet") under a
neutral reviewer banner. All learner screens keep the SYNTHETIC banner, now
applied per-route. `styles.css` gained `.real-banner` / `.review-banner` /
`pre.fact`. `app-preview/README.md` updated (new totals, new route, fresh sha256
table). Verification: throwaway dependency-free DOM harness (10 checks:
banners, empty states on fetch + file paths, FACT_ID render against the real
envelope shape, settings link, chapters/cards regressions) — **10 passed,
0 failed**; harness deleted afterwards. Live-browser/HTTP smoke was impossible:
loopback `listen()` is denied in this sandbox (same blocker as the prior preview
report). Recommend one human double-click of `index.html` (`#/dossier`) and
`trace.html`.

## 4. Later stages (step 4) — NOT triggered, nothing run

Condition was "later stages already enabled by the runner": not met. `03/04/06/
05.sessions/05.card_scripts` tasks are still `queued`; the runner dispatched
nothing beyond 02, and `16.compile` cannot PASS with zero accepted dossier parts,
so I dispatched nothing further. No 04 cards / 05 sessions / 06 items exist to
wire; the dossier view lists any future non-02 accepted stages as "learner
wiring pending".

## 5. Real vs synthetic in the app (as shipped)

- REAL: `trace.html` (10-attempt ledger trace) and `data/real/manifest.json`
  (empty file list — an honest zero). Nothing else.
- SYNTHETIC: every learner screen (home, chapters, lesson, cards, quiz,
  practice, results, settings) — fictional Nowhere sample, unchanged.
- REVIEWER-EMPTY: `#/dossier` until the belt accepts a stage-02 part.

## 6. Could not do / open items

- Stage 02 part C (and C2/A/B/D/E/E2/F/G) has no accepted artifact; the
  recurring `02.G_MATRIX` / `02.SECTION_BOUNDS` HOLDs belong to the runner +
  validator owners, not this lane.
- No live-browser or static-server smoke (sandbox denies loopback listen).
- No later-stage dispatch (runner-owned; precondition absent).
