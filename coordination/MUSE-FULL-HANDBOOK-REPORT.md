# Muse full-handbook report — Utah all-sections run (2026-10-27 ~14:35 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($60 cap after the 20:06:33Z amendment; stages 02/16/03/04/06/05.sessions/05.card_scripts,
all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 14:10 full-handbook report; that report is preserved at
`coordination/history/MUSE-FULL-HANDBOOK-REPORT-2026-10-27T2011Z.md`.

## 0. Headline

The first full-handbook run that gets past sec01: sec02/sec03/sec04 completed
the full chain (13 new accepted learner artifacts, +27 ledger attempts),
**$2.896 new spend** ($20.249 → $23.145, **$36.855 of the $60 cap remains**).
sec01 STOPped at 03 (HIGH_YIELD_SET wall, 6 HOLDs); sec06's 16.compile threw
LINEAGE_ATTEMPT_LIMIT and broke the section loop, so sec07–sec16 were not
reached. The whole-handbook app needed no code changes — the new sections'
ids are collision-free — and the DOM harness passes on all 90 learner routes.
5 of 16 chapters are now full courses.

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **1**. Full console: `coordination/step1-full-handbook-console.log`
(148 lines, restored as clean UTF-8 from the observed output — PowerShell's
`Tee-Object` wrote UTF-16 with every em-dash/arrow reference mojibake again,
so the file was rewritten line-for-line from the process output: 8,196 bytes,
73 em-dashes, 19 arrows).
Banner at launch: `spent so far $20.249 / cap $60`.

- sec01: nine 02 parts already accepted — skipped ($0); 16.compile PASS
  (reused file, $0); 03.combined_kg: 6 HOLDs ($0.118/$0.117/$0.133/$0.116/
  $0.126/$0.113 — HIGH_YIELD_SET×5, ONTOLOGY×1, FACT_IDS_REGISTERED×1,
  lineages 74/75) → LINEAGE_ATTEMPT_LIMIT. `STOP sec01 at 03 : ERROR`.
  Runner moved on; no manual retry.
- sec02: 02 skipped, 16 PASS, 03 already accepted; 04 accepted $0.109;
  06 accepted $0.130; 05.sessions 3 HOLDs ($0.129 STAGE_DIRECTIONS, $0.129
  + $0.128 SLIDE_ARC, lineage reset 76) then accepted $0.131;
  05.card_scripts accepted $0.153. `DONE sec02; spent $21.881`.
- sec03: 02 skipped, 16 PASS; 03 accepted $0.124; 04 accepted $0.114;
  06 accepted $0.138; lineage reset 77, 05.sessions accepted $0.133;
  05.card_scripts accepted $0.165. `DONE sec03; spent $22.554`.
- sec04: 02 skipped, 16 PASS, 03 already accepted; 04 accepted $0.123;
  06 accepted $0.149; 05.sessions accepted $0.143; 05.card_scripts accepted
  $0.175. `DONE sec04; spent $23.145`.
- sec05: everything already accepted — skipped; 16 PASS (new $0 ledger
  accept). `DONE sec05; spent $23.145`.
- sec06: nine 02 parts already accepted — skipped ($0); `16.compile: ERROR
  — LINEAGE_ATTEMPT_LIMIT` (throw, $0) → `STOP sec06: compile threw`.
  The throw broke the whole section loop: sec07–sec16 `not reached`.

SUMMARY block, verbatim:

```
SUMMARY spent $23.145 / cap $60
  sec01-definitions: STOP 03.combined_kg  ERROR
  sec02-licensing-requirements: DONE
  sec03-driver-education-permits: DONE
  sec04-license-types-id-documents: DONE
  sec05-vision-health: DONE
  sec06-examinations: ERROR 16.compile
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

Per the rules: no STOPped section retried by hand, no edits to `tools/belt/*`,
nothing written under `runs/`. Belt-side flags for the belt owner (not
touching): (a) the sec01 03 HIGH_YIELD_SET wall persists across two fresh
lineages; (b) a 16.compile LINEAGE_ATTEMPT_LIMIT *throw* still breaks the
whole section loop instead of continuing to the next section (sec06's throw
parked sec07–sec16, including the already-complete sec09's no-op pass).

## 2. Per-section outcome and USD

New spend this run (console banner deltas; per-call figures are 3-decimal
display): sec01 **$0.723** (STOP 03) · sec02 **$0.909** (DONE) · sec03
**$0.673** (DONE) · sec04 **$0.591** (DONE) · sec05 **$0.000** (DONE, skipped)
· sec06 **$0.000** (ERROR 16.compile, no dispatch) · sec07–sec16 **$0.000**
(not reached). Run total **$2.896**.

Cumulative ledger (authoritative, via `tools/preview/ledger-tail.mjs`):
**23,145,262 micro-USD ($23.145262)** — matches the runner banner $23.145.
Accepted: 02.dossier_sections×64, 03.combined_kg×5, 04.cards×5,
05.card_scripts×5, 05.sessions×5, 06.exam_bank×5, 15.sources×1,
16.compile×10, 19.learning_inputs×1. **$36.855 of the $60 cap remains.**

Accepted section state: sec02/sec03/sec04/sec05/sec09 DONE (full chain:
9×02 + 03 + 04 + 06 + 05.sessions + 05.card_scripts); sec01/sec06
dossier-only (9 parts each, no KG); sec07 part C only; sec08/sec10–sec16
nothing accepted.

## 3. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `attempts=204
  prompt_tokens=12697489 completion_tokens=1476089 estimated_usd=22.145262
  actual_microusd_exact=23145262` (+27 attempts over the 14:10 export;
  `exported_at 2026-10-27T20:27:51.543Z`; 77 lineages incl. this run's
  74/75/76/77).
- `node tools/preview/embed-trace.mjs` → exit 0: `attempts=204` (regenerated,
  verified to contain the new `exported_at`).
- `trace.html` verified without edit: live `fetch("data/trace.json")` with
  `window.__TRACE_EMBEDDED` file:// fallback (file hash unchanged
  `6d4501a1…`). Trace covers all reached sections (204 attempts, 77 lineages).

## 4. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: **copied=89
  skipped_non_accepted=98** (+13: sec03 KG + sec02/03/04 × 04/06/sessions/
  scripts; manifest `exported_at 2026-10-27T20:27:56.002Z`,
  `data-real-embedded.js` regenerated, 1,134,991 bytes).
- Manifest grouped by `section_id` (temporary probe, deleted after): sec01 9 ·
  sec02 14 · sec03 14 · sec04 14 · sec05 14 · sec06 9 · sec07 1 · sec09 14 = 89.
- Cross-section id audit (temporary probe, deleted after): 15 KG module_ids,
  15 hint unit_ids, 113 card_ids, 114 item_ids, 10 form_ids, 15 quiz_ids —
  **zero collisions**; sec09 keeps unprefixed ids (m01/u01/…), all other
  sections use namespaced ids (sec02-m01…); every card/quiz/session unit_id
  resolves to a KG hint; 128 scripts, 0 orphans, 15 recaps (one per module).
- `app-preview/index.html`: NO changes needed — the whole-handbook build
  already groups by each export file's `section_id` and renders all five
  built chapters (16 chapters in handbook order, 11 honest "not yet built",
  home aggregates 5 of 16 · 113 cards · 114 items · 15 lessons/106 slides,
  REAL banner + trace link). sha256 unchanged (`223be607…5838`, 57,974 bytes).
- `app-preview/README.md`: refreshed chapter inventory (Ch.2/3/4 now full
  chains with node/slide/card/item/form counts), trace stats (204 attempts),
  and the 4 regenerated-file hashes (trace-embedded.js `1e11f5ca…`,
  data-real-embedded.js `25f8d600…`, trace.json `cd58d9df…`, real manifest
  `056e2285…`). All static + synthetic hashes re-verified clean.
- File:// fallback: current — both embeds regenerated after the last export
  and the harness forces the embedded path (see below).

## 5. Verification (step 5)

`node tools/preview/verify-learner.cjs` → **RESULT: ALL CHECKS PASSED**
(exit 0): chapter count = sections with accepted KG (sec02, sec03, sec04,
sec05, sec09); per chapter every lesson slide/narration/seconds/why-how/
example/misconception/self-check, every card front/back/hook/teaching text,
every quiz stem/option/rationale byte-exact against the exports; 10 practice
forms (sec02 9/9, sec03 9/10, sec04 8/8, sec05 8/8, sec09 19/19) with no pass
claim; results round-trip; reviewer routes REAL + content; **zero
"Nowhere"/"SYNTHETIC SAMPLE" hits on all 90 learner routes** (the single
"Nowhere" string renders only on `#/synthetic-sample`).

## 6. What is real in the app / what I could not verify

REAL (banner "REAL — Utah Driver Handbook, belt-validated, audit pending"):
Ch.2/Ch.3/Ch.4/Ch.5/Ch.9 full courses (lesson → flashcards → quiz per module
+ chapter-grouped practice forms) + dossier reviewer view (89 accepted files
across sec01–sec07, sec09) + trace.html (204-attempt ledger data). SYNTHETIC:
`#/synthetic-sample` only. "Not yet built": Ch.1, 6, 7, 8, 10–16 chapter pages.

Could not verify: real-browser rendering (no browser tooling in this lane —
layout, keyboard tab order, 3-second recall beat are structural only). Open
`app-preview/index.html` in a browser and click through Chapters 3 and 4 (new
this run). Live-HTTP data path: harness forces the file:// embedded fallback;
the fetch path is unchanged code, not served over HTTP. Grading clicks:
stored-result round-trip only, not simulated clicks. Audit: belt-validated per
the manifest; full audit still pending (banner says so). Belt-side: the sec01
03 HIGH_YIELD_SET wall and the sec06 compile-throw loop break were not
investigated beyond the console lines (outside this lane).
