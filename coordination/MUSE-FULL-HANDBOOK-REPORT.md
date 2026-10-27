# Muse full-handbook report — Utah all-sections run (2026-10-27 ~14:55 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($60 cap after the 20:06:33Z amendment; stages 02/16/03/04/06/05.sessions/05.card_scripts,
all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 14:35 full-handbook report; that report is preserved at
`coordination/history/MUSE-FULL-HANDBOOK-REPORT-2026-10-27T2035Z.md`.

## 0. Headline

sec01 is DONE (full chain, +5 learner artifacts) and sec07 gained its full
dossier + KG (+9 artifacts) — then a NEW systematic belt wall,
`Dispatch remains HOLD: owner_implementation_closure_unsealed`, STOPped
sec07@04.cards and sec08/sec10–sec16@02-part-C at $0 each. sec06 STOPped at
03 on the HIGH_YIELD_SET wall. **$2.841 new spend** ($23.145 → $25.986,
**$34.014 of the $60 cap remains**). The app needed no code changes — the new
sections' ids are collision-free — and the DOM harness passes on all 120
learner routes. **7 of 16 chapters built** (6 full courses + Ch.7 KG-only).

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **1**. Full console: `coordination/step1-full-handbook-console.log`
(225 lines, saved as clean UTF-8 from the observed process output —
PowerShell's `Tee-Object` mojibakes every em-dash/arrow again, so the file
was rewritten line-for-line after the run: 12,730 bytes).
Banner at launch: `spent so far $23.145 / cap $60`. ~10–12 min of dispatch
activity (first new ledger row 20:36:42Z, last 20:46:34Z) — far under the
estimate because 5 sections skipped and 8 STOPped at $0.

- sec01: nine 02 parts already accepted — skipped ($0); 16.compile PASS
  (reused file, new $0 ledger accept row); 03 accepted $0.113; 04 accepted
  $0.109; 06 accepted $0.125; 05.sessions accepted $0.128;
  05.card_scripts 3 HOLDs ($0.143/$0.141/$0.140 05.THINK_REF, lineage reset
  79) then accepted $0.142. `DONE sec01; spent $24.187`.
- sec02/sec03/sec04/sec05: everything already accepted — skipped; 16 PASS
  (reused). `DONE`, $0 each.
- sec06: nine 02 parts already accepted — skipped ($0); 16.compile PASS
  (reused — the prior run's compile ERROR is gone); 03.combined_kg: 6 HOLDs
  ($0.115/$0.115/$0.114/$0.117/$0.109/$0.113 — HIGH_YIELD_SET×6, lineages
  80/81) → LINEAGE_ATTEMPT_LIMIT. `STOP sec06 at 03 : ERROR`.
  Runner moved on; no manual retry.
- sec07: 02 part C already accepted; C2/A/B/D/E/E2/F/G accepted ($0.112/
  $0.091/$0.085/$0.088/$0.080/$0.085/$0.087/$0.097, lineage resets 82/83/84);
  16.compile PASS (new); 03: 2 HOLDs ($0.120/$0.122 HIGH_YIELD_SET) then
  accepted $0.147 (reset 85); `ERROR 04.cards: Dispatch remains HOLD:
  owner_implementation_closure_unsealed` ($0). `STOP sec07 at 04 : ERROR`.
- sec08: `ERROR 02 part C: Dispatch remains HOLD:
  owner_implementation_closure_unsealed` ($0). `STOP sec08`.
- sec09: everything already accepted — skipped; 16 PASS (reused).
  `DONE sec09; spent $25.986`.
- sec10/sec11/sec12/sec13/sec14/sec15/sec16: same 02-part-C closure
  ERROR ($0 each). All `STOP`.

SUMMARY block, verbatim:

```
SUMMARY spent $25.986 / cap $60
  sec01-definitions: DONE
  sec02-licensing-requirements: DONE
  sec03-driver-education-permits: DONE
  sec04-license-types-id-documents: DONE
  sec05-vision-health: DONE
  sec06-examinations: STOP 03.combined_kg  ERROR
  sec07-preparing-vehicle: STOP 04.cards  ERROR
  sec08-basic-driving: STOP 02.dossier_sections C ERROR
  sec09-rules-of-the-road: DONE
  sec10-alcohol-drugs: STOP 02.dossier_sections C ERROR
  sec11-distractions-challenges: STOP 02.dossier_sections C ERROR
  sec12-crashes-insurance: STOP 02.dossier_sections C ERROR
  sec13-suspensions-record: STOP 02.dossier_sections C ERROR
  sec14-sharing-the-road: STOP 02.dossier_sections C ERROR
  sec15-vehicle-equipment: STOP 02.dossier_sections C ERROR
  sec16-towing: STOP 02.dossier_sections C ERROR
```

Per the rules: no STOPped section retried by hand, no edits to `tools/belt/*`,
nothing written under `runs/`. Belt-side flags for the belt owner (not
touching): (a) the `owner_implementation_closure_unsealed` refusal is new,
systematic, and $0 — it blocks EVERY dispatch from sec07-04 onward, so the
next full run will park at the same wall until it is fixed belt-side; the 8
refusals wrote no attempt rows (the +27 in-run attempts are fully explained
by the 25 priced calls + 2 compile accepts below); (b) the sec06 03
HIGH_YIELD_SET wall persists across two fresh lineages (same signature as
sec01's old wall, which this run cleared).

## 2. Per-section outcome and USD

New spend this run (console banner deltas; per-call figures are 3-decimal
display): sec01 **$1.042** (DONE, full chain) · sec02–sec05 **$0.000** each
(DONE, skipped) · sec06 **$0.684** (STOP 03) · sec07 **$1.115** (STOP 04:
02s $0.725 + 03 $0.389) · sec08 **$0.000** (STOP 02-C) · sec09 **$0.000**
(DONE, skipped) · sec10–sec16 **$0.000** each (STOP 02-C). Run total **$2.841**.

Cumulative ledger (authoritative, via `tools/preview/ledger-tail.mjs`):
**25,985,878 micro-USD ($25.985878)** — matches the runner banner $25.986.
Accepted: 02.dossier_sections×72 (+8), 03.combined_kg×7 (+2),
04.cards×6 (+1), 05.card_scripts×6 (+1), 05.sessions×6 (+1),
06.exam_bank×6 (+1), 15.sources×1, 16.compile×15 (+2 in-run: sec01 rebind
row + sec07 new PASS; +3 concurrent post-run, see §3), 19.learning_inputs×1.
**$34.014 of the $60 cap remains.**

Accepted section state: sec01/sec02/sec03/sec04/sec05/sec09 DONE (full chain:
9×02 + 03 + 04 + 06 + 05.sessions + 05.card_scripts); sec07 dossier + KG
(9×02 + 03, no cards/exam/sessions/scripts); sec06 dossier-only (9 parts);
sec08/sec10–sec16 nothing accepted. The run started on lineage 78 (minted
out-of-run at $0 — launch banner still $23.145); in-run resets minted 79–85.

## 3. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0, run twice. First export:
  `attempts=231` (204 + 27 in-run). While exporting, three $0 16.compile
  accepts landed from concurrent belt-side activity (20:49:59Z, lineages
  85/85/86 — not this run; spent and learner counts unchanged), so the
  export was re-run: **`attempts=234 prompt_tokens=14331660
  completion_tokens=1663830 estimated_usd=24.985878
  actual_microusd_exact=25985878`** (`exported_at 2026-10-27T20:52:13.671Z`;
  86 lineages incl. this run's 79–85; 85 lineage-reset receipts).
- `node tools/preview/embed-trace.mjs` → exit 0 after each export:
  `attempts=234` (regenerated, verified to contain the new `exported_at`).
- `trace.html` verified without edit: live `fetch("data/trace.json")` with
  `window.__TRACE_EMBEDDED` file:// fallback (file hash unchanged
  `6d4501a1…`). Trace covers all sections (234 attempts: 117+ accepted
  rows across every reached stage; the 8 closure refusals wrote no rows).

## 4. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` → exit 0: **copied=103
  skipped_non_accepted=109** (+14: sec01 × 03/04/06/sessions/scripts +
  sec07 8×02 + sec07 03; manifest `exported_at 2026-10-27T20:50:00.935Z`,
  `data-real-embedded.js` regenerated, 1,331,756 bytes). Re-checked after
  the concurrent compiles: learner-stage counts unchanged, export current.
- Manifest grouped by `section_id` (temporary probe, deleted after): sec01 14 ·
  sec02 14 · sec03 14 · sec04 14 · sec05 14 · sec06 9 · sec07 10 · sec09 14 = 103.
- Cross-section id audit (temporary probe, deleted after): 22 KG module_ids,
  22 hint unit_ids, 127 card_ids, 128 item_ids, 12 form_ids, 18 quiz_ids —
  **zero collisions**; sec09 keeps unprefixed ids (m01/u01/…), all other
  sections use namespaced ids (sec01-m01…); every card/quiz/session unit_id
  resolves to a KG hint; 127 scripts, 0 orphans, 18 recaps (one per module
  of the six full-chain sections).
- `app-preview/index.html`: NO changes needed — the whole-handbook build
  already groups by each export file's `section_id` and renders all seven
  built chapters (16 chapters in handbook order, 9 honest "not yet built",
  home aggregates 7 of 16 · 127 cards · 128 items · 18 lessons/127 slides,
  REAL banner + trace link; sec07's 4 KG modules render chapter + module
  hubs with honest pending lesson/cards/quiz). sha256 unchanged
  (`223be607…5838`, 57,974 bytes).
- `app-preview/README.md`: refreshed chapter inventory (Ch.1 full chain:
  3 modules, 14 nodes, 21 slides/3 lessons, 14 cards, 14 items, 2×7 forms;
  Ch.7 KG-only: 4 modules, 26 nodes), trace stats (234 attempts), and the 4
  regenerated-file hashes (trace-embedded.js `24f9e711…`,
  data-real-embedded.js `5784b3c7…`, trace.json `12d3cc47…`, real manifest
  `ee07247a…`). All static + synthetic hashes re-verified clean.
- File:// fallback: current — both embeds regenerated after the last export
  and the harness forces the embedded path (see below).

## 5. Verification (step 5)

`node tools/preview/verify-learner.cjs` → **RESULT: ALL CHECKS PASSED**
(exit 0, run twice — same result — against the final learner bytes):
built chapters = sections with accepted KG (sec01, sec02, sec03, sec04,
sec05, sec07, sec09); home aggregates byte-exact (7 of 16 · 127 · 128 ·
18/127); per chapter every lesson slide/narration/seconds/why-how/
example/misconception/self-check, every card front/back/hook/teaching text,
every quiz stem/option/rationale byte-exact against the exports; sec07's
pending lesson/cards/quiz render "not yet built" (never filler); 12 practice
forms (sec01 7/7, sec02 9/9, sec03 9/10, sec04 8/8, sec05 8/8, sec09 19/19)
with no pass claim; results round-trip; reviewer routes REAL + content;
**zero "Nowhere"/"SYNTHETIC SAMPLE" hits on all 120 learner routes** (the
single "Nowhere" string renders only on `#/synthetic-sample`).

## 6. What is real in the app / what I could not verify

REAL (banner "REAL — Utah Driver Handbook, belt-validated, audit pending"):
Ch.1/Ch.2/Ch.3/Ch.4/Ch.5/Ch.9 full courses (lesson → flashcards → quiz per
module + chapter-grouped practice forms), Ch.7 partial (4 KG modules with
hubs; lesson/cards/quiz pending) + dossier reviewer view (103 accepted
files across sec01–sec07, sec09) + trace.html (234-attempt ledger data).
SYNTHETIC: `#/synthetic-sample` only. "Not yet built": Ch.6, 8, 10–16
chapter pages.

Could not verify: real-browser rendering (no browser tooling in this lane —
layout, keyboard tab order, 3-second recall beat are structural only). Open
`app-preview/index.html` in a browser and click through Chapters 1 and 7 (new
this run). Live-HTTP data path: harness forces the file:// embedded fallback;
the fetch path is unchanged code, not served over HTTP. Grading clicks:
stored-result round-trip only, not simulated clicks. Audit: belt-validated
per the manifest; full audit still pending (banner says so). Belt-side: the
closure refusal and the sec06 03 wall were not investigated beyond the
console lines (outside this lane); the three concurrent post-run compile
accepts are included in the trace but their purpose is unknown to this lane.
