# Muse full-handbook report — Utah all-sections re-run (2026-10-27 ~14:05 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/16/03/04/06/05.sessions/05.card_scripts, all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 13:55 full-handbook report; that run's console log is preserved at
`coordination/history/step1-full-handbook-console-2026-10-27T1951Z.log`.

## 0. Headline

This re-run added **nothing**: the belt command exited **1** at the first section
(sec01 16.compile threw "Explicit configuration reconciliation is required before
compile") and halted the whole run — no section after sec01 was reached, **$0.00
new spend** (still $20.249 / $30 cap). Per the brief I recorded the SUMMARY
verbatim and wired whatever is accepted. The accepted set is byte-identical to the
13:55 run (76 files), the whole-handbook app already covers all of it, and the DOM
harness still passes (`RESULT: ALL CHECKS PASSED`). Only the regenerated export
timestamps/hashes changed; `index.html` is untouched (sha256 unchanged).

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **1**. Full console: `coordination/step1-full-handbook-console.log`
(34 lines — the run died within seconds, not hours).
Banner: `spent so far $20.249 / cap $30` (unchanged from the 13:55 run).

- sec01: all nine 02.dossier_sections parts already accepted — skipped ($0);
  `16.compile: ERROR — Explicit configuration reconciliation is required before compile.`
  `STOP sec01-definitions: compile threw (an attempt may be left running — reconcile it)`
- The runner did NOT move to the next section: all 15 remaining sections
  report `not reached`. No lineage was minted, no dispatch made, ledger tail
  unchanged (last entry still 2026-10-27T19:51:06Z).

SUMMARY block, verbatim:

```
SUMMARY spent $20.249 / cap $30
  sec01-definitions: ERROR 16.compile
  sec02-licensing-requirements: not reached
  sec03-driver-education-permits: not reached
  sec04-license-types-id-documents: not reached
  sec05-vision-health: not reached
  sec06-examinations: not reached
  sec07-preparing-vehicle: not reached
  sec08-basic-driving: not reached
  sec09-rules-of-the-road: not reached
  sec10-alcohol-drugs: not reached
  sec11-distractions-challenges: not reached
  sec12-crashes-insurance: not reached
  sec13-suspensions-record: not reached
  sec14-sharing-the-road: not reached
  sec15-vehicle-equipment: not reached
  sec16-towing: not reached
```

Per the rules: no section retried by hand, no edits to `tools/belt/*`, nothing
written under `runs/`. The "attempt may be left running" state and the
configuration-reconciliation demand are belt-side and left for the belt owner —
flagging, not touching.

## 2. Per-section outcome and USD

This run: every section $0.00 new (sec01 ERROR, sec02–sec16 not reached).
Cumulative ledger (authoritative, via `tools/preview/ledger-tail.mjs`,
unchanged): **20,249,055 micro-USD ($20.249055)**, accepted
02.dossier_sections×64, 03.combined_kg×4, 04.cards×2, 05.card_scripts×2,
05.sessions×2, 06.exam_bank×2, 15.sources×1, 16.compile×5, 19.learning_inputs×1.
**$9.751 of the $30 cap remains.** Last accepted section state is the 13:55
picture: sec05 + sec09 DONE, sec02/sec04 KG-only, sec01/sec03/sec06 dossier-only,
sec07 part C only, sec08/sec10–sec16 nothing.

## 3. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `attempts=177
  prompt_tokens=11089593 completion_tokens=1267540 estimated_usd=19.249055
  actual_microusd_exact=20249055` (identical counts, new
  `exported_at 2026-10-27T20:06:17.089Z`).
- `node tools/preview/embed-trace.mjs` → exit 0: `attempts=177` (regenerated).
- `trace.html` verified by inspection: live `fetch("data/trace.json")` with
  `window.__TRACE_EMBEDDED` file:// fallback — no edit needed. Trace covers all
  sections (177 attempts across the run; nothing new to add this run).

## 4. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → node exit 0: **copied=76
  skipped_non_accepted=89** (identical set; manifest
  `exported_at 2026-10-27T20:06:36.105Z`, `data-real-embedded.js` regenerated
  743,231 bytes). Note: the first invocation surfaced exit 1 only because
  PowerShell's `2>&1` merge promoted node's SQLite ExperimentalWarning; a clean
  re-run shows node exit 0 and both files written — exporter is healthy.
- Manifest grouped by `section_id` (temporary probe, deleted after): sec01 9 ·
  sec02 10 · sec03 9 · sec04 10 · sec05 14 · sec06 9 · sec07 1 · sec09 14 = 76.
  Matches the 13:55 inventory exactly.
- `app-preview/index.html`: NO changes needed — the 13:55 whole-handbook build
  (16 chapters in handbook order, sec02/sec04/sec05/sec09 built from accepted
  KGs, 12 honest "not yet built", home aggregates 4 of 16 · 55 cards · 55 items ·
  6 lessons, REAL banner + trace link) already reflects every accepted artifact.
  sha256 unchanged (`223be607…5838`, 57,974 bytes).
- `app-preview/README.md`: refreshed the 4 regenerated-file hashes/bytes
  (trace.json, trace-embedded.js, real manifest, data-real-embedded.js), the
  trace `exported_at`, and fixed a 66-char typo in the 06-exambank synthetic
  hash. All static-file hashes re-verified clean.
- File:// fallback: current — both embeds regenerated after the last export and
  the harness forces the embedded path (see below).

## 5. Verification (step 5)

`node tools/preview/verify-learner.cjs` → **RESULT: ALL CHECKS PASSED**
(exit 0): chapter count = sections with accepted KG (sec02, sec04, sec05, sec09);
per chapter every lesson slide/narration/seconds/why-how/example/misconception/
self-check, every card front/back/hook/teaching text, every quiz
stem/option/rationale byte-exact against the exports; sec02/sec04
lesson/cards/quiz assert pending-not-filler; 4 practice forms (19/19/8/8) with
no pass claim; results round-trip; reviewer routes REAL + content; **zero
"Nowhere"/"SYNTHETIC SAMPLE" hits on all 72 learner routes** (the single
"Nowhere" string renders only on `#/synthetic-sample`).

## 6. What is real in the app / what I could not verify

REAL (banner "REAL — Utah Driver Handbook, belt-validated, audit pending"):
Ch.2 KG modules + Ch.4 KG modules + Ch.5 full course + Ch.9 full course +
dossier reviewer view (76 accepted files across sec01–sec07, sec09) + trace.html
(177-attempt ledger data). SYNTHETIC: `#/synthetic-sample` only. "Not yet
built": Ch.2/Ch.4 lesson+cards+quiz; Ch.1, 3, 6, 7, 8, 10–16 chapter pages.

Could not verify: real-browser rendering (no browser tooling in this lane —
layout, keyboard tab order, 3-second recall beat are structural only). Open
`app-preview/index.html` in a browser and click through Chapters 5 and 2.
Live-HTTP data path: harness forces the file:// embedded fallback; the fetch
path is unchanged code, not served over HTTP. Grading clicks: stored-result
round-trip only, not simulated clicks. Audit: belt-validated per the manifest;
full audit still pending (banner says so). Belt-side: the sec01 compile
reconciliation error and any left-running attempt were not investigated beyond
the console line (outside this lane).
