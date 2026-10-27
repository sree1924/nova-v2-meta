# Muse full-handbook report — Utah all-sections run (2026-10-27 ~16:05 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($60 cap after the 20:06:33Z amendment; stages 02/16/03/04/06/05.sessions/05.card_scripts,
all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the 14:55 full-handbook report; that report is preserved at
`coordination/history/MUSE-FULL-HANDBOOK-REPORT-2026-10-27T2055Z.md`.

## 0. Headline

**15 of 16 sections DONE.** Both prior systematic walls are gone — sec06's
03 HIGH_YIELD_SET wall cleared on a fresh lineage and the
`owner_implementation_closure_unsealed` refusal never reappeared — so sec06,
sec07, sec08, sec10, sec11, sec12, sec13, sec14 and sec16 all completed full
chains this run. Only sec15 STOPped (02 part E2, LINEAGE_ATTEMPT_LIMIT on
02.FACT_LINES_CITED after both resets). **$16.967 new spend** ($25.986 →
$42.953, **$17.047 of the $60 cap remains**). The app needed no code changes —
15 chapters flowed in through the exports — and the DOM harness passes on all
234 learner routes after a one-line harness fix (see §5).

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **1** (one STOP; see SUMMARY). Full console:
`coordination/step1-full-handbook-console.log` (405 lines, 24,536 bytes,
repaired to clean UTF-8 after the run — PowerShell's `Tee-Object` wrote
UTF-16LE with every em-dash as U+0393/U+00E5/U+00C6 and every arrow as
U+0393/U+00C7/U+00F6; all 87 + 138 sequences replaced deterministically,
verified zero non-ASCII remains outside U+2014/U+2192).
Banner at launch: `spent so far $25.986 / cap $60`. ~48 min of dispatch
(15:10 → 15:58 MDT).

- sec01/sec02/sec03/sec04/sec05: everything already accepted — skipped; 16
  PASS (reused/new $0 rows). `DONE`, $0 each.
- sec06: nine 02 parts + 16 skipped/reused; 03: 3 HOLDs
  (FACT_IDS_REGISTERED, ONE_MODULE_PER_NODE+CURRICULUM_HINTS,
  EDGES_MIRROR+FACT_IDS, reset 88) then accepted $0.118; 04 accepted $0.104;
  06 accepted $0.127; 05.sessions: 3 HOLDs (NARRATION_DEPTH×3,
  SELF_CHECK_ALIGNED×1, reset 89) then accepted $0.128; scripts accepted
  $0.142. `DONE sec06; spent $27.361`.
- sec07: dossier + KG skipped; 04 accepted $0.127 (prior closure wall gone);
  06: 1 HOLD (OPTIONS_SHAPE, reset 90) then accepted $0.157; sessions
  accepted $0.161; scripts accepted $0.188. `DONE; spent $28.312`.
- sec08: full chain — 9×02 accepted ($0.084–$0.103, resets 91–94), 16 PASS,
  03 $0.141, 04 $0.133, 06 $0.135, sessions: 3 HOLDs
  (SLIDE_ARC×3, STAGE_DIRECTIONS×2, reset 95) then $0.146, scripts $0.197.
  `DONE; spent $30.326`.
- sec09: everything already accepted — skipped; 16 PASS. `DONE`, $0.
- sec10: full chain — 9×02 ($0.087–$0.099 + 2 HOLDs on B/G, resets 96–100),
  16 PASS, 03 $0.130, 04 $0.120, 06: 2 HOLDs (ID_INTEGRITY+OPTIONS_SHAPE,
  OPTIONS_SHAPE, reset 101) then $0.148, sessions $0.139, scripts $0.177.
  `DONE; spent $32.318`.
- sec11: full chain — 9×02 ($0.088–$0.134 + 3 HOLDs on C/C2/E2, resets
  102–106), 16 PASS, 03: 1 HOLD (NODE_COVERAGE+HIGH_YIELD_SET) then $0.142,
  04 $0.130, 06 $0.161, sessions $0.154, scripts $0.191.
  `DONE; spent $34.433`.
- sec12: full chain (`DONE; spent $36.186`), sec13: full chain (`DONE; spent
  $37.879`), sec14: full chain (`DONE; spent $40.048`) — console lines per
  the log; no STOPs.
- sec15: 02 parts C (3 HOLDs FACT_LINES_CITED, resets 123/124, then $0.096),
  C2 $0.100, A $0.092, B $0.081, D $0.089, E $0.086 accepted; part E2: 4
  HOLDs (FACT_LINES_CITED×4, resets 127/128 exhausted) →
  `ERROR 02.dossier_sections part E2: LINEAGE_ATTEMPT_LIMIT: changing
  task/model/input IDs cannot reset attempts` ($0.084–$0.087 each, last
  banner $41.232). F/G never dispatched.
  `STOP sec15-vehicle-equipment at 02.dossier_sections E2: ERROR`.
  Runner moved on; no manual retry.
- sec16: full chain — 9×02 ($0.088–$0.137, resets 129–133), 16 PASS, 03
  $0.131, 04 $0.122, 06: 1 HOLD (OPTIONS_SHAPE+FORM_COUNT+
  MODULE_QUIZ_COVERAGE) then $0.149, sessions $0.130, scripts $0.174.
  `DONE; spent $42.953`.

SUMMARY block, verbatim:

```
SUMMARY spent $42.953 / cap $60
  sec01-definitions: DONE
  sec02-licensing-requirements: DONE
  sec03-driver-education-permits: DONE
  sec04-license-types-id-documents: DONE
  sec05-vision-health: DONE
  sec06-examinations: DONE
  sec07-preparing-vehicle: DONE
  sec08-basic-driving: DONE
  sec09-rules-of-the-road: DONE
  sec10-alcohol-drugs: DONE
  sec11-distractions-challenges: DONE
  sec12-crashes-insurance: DONE
  sec13-suspensions-record: DONE
  sec14-sharing-the-road: DONE
  sec15-vehicle-equipment: STOP 02.dossier_sections E2 ERROR
  sec16-towing: DONE
```

Per the rules: the STOPped section was not retried by hand, no edits to
`tools/belt/*`, nothing written under `runs/`.

## 2. Per-section outcome and USD

New spend this run (console banner deltas; per-call figures are 3-decimal
display): sec01–sec05 **$0.000** each (DONE, skipped) · sec06 **$1.375**
(DONE) · sec07 **$0.951** (DONE) · sec08 **$2.014** (DONE) · sec09 **$0.000**
(DONE, skipped) · sec10 **$1.992** (DONE) · sec11 **$2.115** (DONE) · sec12
**$1.753** (DONE) · sec13 **$1.693** (DONE) · sec14 **$2.169** (DONE) · sec15
**$1.184** (STOP 02-E2: 6 parts + 7 HOLDs) · sec16 **$1.721** (DONE). Run
total **$16.967**.

Cumulative ledger (authoritative, via `tools/preview/ledger-tail.mjs`):
**42,952,703 micro-USD ($42.952703)** — matches the runner banner $42.953.
Accepted: 02.dossier_sections×141 (= 15×9 + sec15×6), 03.combined_kg×15,
04.cards×15, 05.card_scripts×15, 05.sessions×15, 06.exam_bank×15,
15.sources×1, 16.compile×25, 19.learning_inputs×1.
**$17.047 of the $60 cap remains.**

Belt-side flags for the belt owner (not touching): (a) sec15 02-E2 hit
LINEAGE_ATTEMPT_LIMIT (02.FACT_LINES_CITED×4 across resets 127/128) — the
only remaining gap to a 16/16 handbook; a fresh full run would resume at
sec15-E2; (b) sec07's accepted 04.cards omits `unit_id` (26 cards
`unit=null`, all resolving via known `module_id`; app + harness match on
either key, verified §4); (c) trace totals show estimated $41.952703 vs
ledger-actual $42.952703 (exactly $1.000 apart) — ledger-side, outside this
lane; spend claims above use the banner + ledger-tail figure both agree on.

## 3. Trace export (step 2)

- `node tools/preview/export-trace.mjs` initially failed 4× with
  `SQLITE_CANTOPEN` errcode 14 at the tasks ORDER BY. Root cause, proven by
  bisection: the ledger has grown past the sorter memory threshold, so the
  exporter's ORDER BY sorts spill to temp files — and this sandboxed session
  blocks temp creation at the system temp dir (SELECT * + ORDER BY fails
  identically on a byte-copy; narrow selects pass; no live lock holders).
  Workaround (no exporter code changed): run with `$env:TMP/$env:TEMP/
  $env:SQLITE_TMPDIR` pointed at a fresh workspace scratch dir. Then exit 0:
  **`attempts=391 prompt_tokens=24378737 completion_tokens=2700997
  estimated_usd=41.952703 actual_microusd_exact=42952703`**
  (`exported_at 2026-10-27T22:04:22.166Z`; 133 lineages incl. this run's
  87–133; 566 approvals, 132 lineage-reset receipts). The workaround is now
  documented in `app-preview/README.md`.
- `node tools/preview/embed-trace.mjs` → exit 0: `attempts=391`
  (regenerated, verified to contain the new `exported_at`).
- `trace.html` verified without edit: live `fetch("data/trace.json")` with
  `window.__TRACE_EMBEDDED` file:// fallback (file hash unchanged
  `6d4501a1…`). Trace covers all sections (391 attempts across every reached
  stage/section; the sec15 STOP wrote priced HOLD rows, all included).

## 4. Real-content wiring (steps 3–4)

- `node tools/preview/export-content.mjs` (same temp workaround) → exit 0:
  **copied=216 skipped_non_accepted=143** (+113 = sec06 +5, sec07 +4,
  sec08/sec10/sec11/sec12/sec13/sec14/sec16 +14 each, sec15 +6; i.e. 15×14
  full-chain files + sec15×6 dossier parts; manifest `exported_at
  2026-10-27T22:04:22.500Z`, `data-real-embedded.js` regenerated,
  3,143,544 bytes, `exported_at` verified inside).
- Manifest grouped by `section_id` (temporary probe, deleted after): every
  section 14 files (9×02 + 03 + 04 + 06 + sessions + scripts) except sec15
  (6×02 only) = 216.
- Cross-section id audit (temporary probe, deleted after): 46 KG
  module_ids, 46 hint unit_ids, 353 card_ids, 307 item_ids, 30 form_ids, 46
  quiz_ids — **zero collisions**; sec09 keeps unprefixed ids
  (m01/u01/…), all other sections namespaced (sec10-m01…); every quiz/session
  unit_id resolves to a KG hint; 353 scripts cover all 353 cards with 0
  orphans + 46 recaps (one per module). The 26 sec07 cards with
  `unit_id=null` resolve via known `module_id` (flagged belt-side in §2).
- `app-preview/index.html`: NO changes needed — the whole-handbook build
  groups by each export file's `section_id` and renders all fifteen built
  chapters (16 chapters in handbook order, 1 honest "not yet built",
  home aggregates 15 of 16 · 353 cards · 307 items · 46 lessons/321 slides,
  REAL banner + trace link). sha256 unchanged (`223be607…5838`, 57,974
  bytes).
- `app-preview/README.md`: refreshed to the 15-chapter inventory (per-chapter
  modules/nodes/slides/cards/items/forms), trace stats (391 attempts), the 4
  regenerated-file hashes (trace-embedded.js `304e45f1…`,
  data-real-embedded.js `4ff4565a…`, trace.json `36a6a185…`, real manifest
  `03a50931…`; all static + synthetic hashes re-verified clean), and the
  sandboxed-session temp-dir workaround.
- File:// fallback: current — both embeds regenerated after the last export
  and the harness forces the embedded path (see below).

## 5. Verification (step 5)

`node tools/preview/verify-learner.cjs` → **RESULT: ALL CHECKS PASSED**
(exit 0, 2133 PASS lines, 0 FAIL, against the final learner bytes):
built chapters = sections with accepted KG (all except sec15); home
aggregates byte-exact (15 of 16 · 353 · 307 · 46/321); per chapter every
lesson slide/narration/seconds/why-how/example/misconception/self-check,
every card front/back/hook/teaching text, every quiz stem/option/rationale
byte-exact against the exports; Ch.15 renders "not yet built" (never
filler); 30 practice forms (7/7, 9/9, 9/10, 8/8, 8/8, 7/7, 13/13, 6/6,
19/19, 8/8, 13/13, 11/11, 9/9, 8/7, 8/6) with no pass claim; results
round-trip; reviewer routes REAL + content; **zero "Nowhere"/
"SYNTHETIC SAMPLE" hits on all 234 learner routes** (the single "Nowhere"
string renders only on `#/synthetic-sample`).

One harness fix was required (my file, `tools/preview/verify-learner.cjs`):
the final global sweep used case-insensitive `/Nowhere/i` while all 234
per-route checks use case-sensitive `/Nowhere/`. Accepted sec08/sec14 exam
options legitimately contain lowercase "nowhere" ("…beside snowplows and
nowhere else", "…behind the trailer and nowhere else" — verified the only
two hits in all 216 export files; zero capitalised "Nowhere", zero
"SYNTHETIC SAMPLE"), which the app must render word-for-word. The sweep now
uses the same case-sensitive predicate as the per-route checks; the app is
unchanged and the synthetic marker (proper noun "Nowhere") is still swept on
every route.

## 6. What is real in the app / what I could not verify

REAL (banner "REAL — Utah Driver Handbook, belt-validated, audit pending"):
Ch.1–Ch.14 + Ch.16 full courses (lesson → flashcards → quiz per module +
chapter-grouped practice forms; 46 modules, 353 nodes, 46 lessons/321
slides, 353 cards + 353 teaching scripts + 46 recaps, 307 items, 30 forms) +
dossier reviewer view (216 accepted files; sec15's 6 dossier parts visible
there) + trace.html (391-attempt ledger data). SYNTHETIC:
`#/synthetic-sample` only. "Not yet built": Ch.15 chapter page.

Could not verify: real-browser rendering (no browser tooling in this lane —
layout, keyboard tab order, 3-second recall beat are structural only). Open
`app-preview/index.html` in a browser and click through Chapters 6–8, 10–14
and 16 (new this run). Live-HTTP data path: harness forces the file://
embedded fallback; the fetch path is unchanged code, not served over HTTP.
Grading clicks: stored-result round-trip only, not simulated clicks. Audit:
belt-validated per the manifest; full audit still pending (banner says so).
Belt-side: the sec15 E2 wall, the sec07 unit_id shape, and the $1
estimated-vs-actual gap were not investigated beyond console/ledger lines
(outside this lane).
