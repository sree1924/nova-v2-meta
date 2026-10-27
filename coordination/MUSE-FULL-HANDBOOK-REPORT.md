# Muse full-handbook report — Utah all-sections run (2026-10-27)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 cap, stages 02/16/03/04/06/05.sessions/05.card_scripts, all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
preview work ONLY in `app-preview/` + `tools/preview/`. No key printed.
This overwrites the ninth-launch (sec09) and learner-screens reports' scope, not their evidence.

## 0. Headline

The full handbook run finished with **2 of 16 sections DONE** (sec05 new,
sec09 pre-existing), whole-command exit **non-zero**, total spend **$20.249 /
$30 cap**. One section (sec05-vision-health) went dossier → compile → KG →
cards → exam → sessions → card_scripts fully accepted ($1.590 new spend) and
is wired into the preview as Chapter 5. Everything accepted is wired; nothing
held, blocked, or busy is shown as real anywhere. The learner app is now the
whole handbook: 16 chapters in handbook order, 4 built, 12 honest
"not yet built" — verified by the DOM harness (`RESULT: ALL CHECKS PASSED`,
372 checks, 72 learner routes swept for synthetic leakage).

## 1. Belt chain (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Exit: **1**. Full console: `coordination/step1-full-handbook-console.log`
(249 lines). Per the rules the runner retried HOLDs itself and moved on at each
STOP; no section was retried by hand; no edits to `tools/belt/*`.

SUMMARY block, verbatim:

```
SUMMARY spent $20.249 / cap $30
  sec01-definitions: HOLD 16.compile
  sec02-licensing-requirements: STOP 04.cards  ERROR
  sec03-driver-education-permits: HOLD 16.compile
  sec04-license-types-id-documents: STOP 04.cards  ERROR
  sec05-vision-health: DONE
  sec06-examinations: HOLD 16.compile
  sec07-preparing-vehicle: STOP 02.dossier_sections C2 ERROR
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

## 2. Per-section outcome and USD

USD per section = runner banner deltas from the console log (start $11.536);
ledger authoritative total = **20,249,055 micro-USD ($20.249055)**,
model-price estimate $19.249055, **$9.751 of the $30 cap remaining**.

| section | outcome | new USD |
|---|---|---|
| sec01-definitions | dossier 9/9 accepted; 16.compile HOLD (fact spans lack explicit source anchors) → STOP | 1.268 |
| sec02-licensing-requirements | dossier 9/9, 16 PASS, 03 KG accepted; 04.cards 6× HOLD (ORIGINALITY, once +HOOK_LENGTH) → LINEAGE_ATTEMPT_LIMIT ERROR → STOP | 1.711 |
| sec03-driver-education-permits | dossier 9/9 accepted; 16.compile HOLD (envelope merge-hash mismatch) → STOP | 1.128 |
| sec04-license-types-id-documents | dossier 9/9, 16 PASS, 03 KG accepted; 04.cards 6× HOLD (BACK_SPOKEN_FORM + ORIGINALITY) → LINEAGE_ATTEMPT_LIMIT ERROR → STOP | 2.104 |
| sec05-vision-health | **DONE** — full chain accepted (1× 05.sessions HOLD → retry accepted) | 1.590 |
| sec06-examinations | dossier 9/9 accepted; 16.compile HOLD (multi-page spans need explicit fact split) → STOP | 0.824 |
| sec07-preparing-vehicle | part C accepted; part C2 BUDGET_CAP_EXCEEDED (role-level, not the $30 run cap) → STOP | 0.088 |
| sec08-basic-driving | STOP, 02 part C SEQUENTIAL_TASK_BUSY (no unknown attempt to reconcile) | 0.000 |
| sec09-rules-of-the-road | DONE, all stages already accepted — skipped | 0.000 |
| sec10–sec16 (7 sections) | STOP, 02 part C SEQUENTIAL_TASK_BUSY each | 0.000 |

New spend this run $8.713 ($11.536 → $20.249). Findings, unflattering first:
(a) the 04.cards ORIGINALITY wall stopped two sections after 12 paid HOLDs —
same failure shape as the old 05.card_scripts wall; (b) a role-level budget
cap tripped at $20.25 of $30 and the resulting busy attempt cascaded
SEQUENTIAL_TASK_BUSY STOPs through sec08 + sec10–sec16 ($0 spent, but 8
sections untouched); (c) three sections sit past dossier with compile HOLDs
needing dossier-side fixes the runner cannot self-heal. All of this is
runner/belt business recorded here, not retried — the wiring below covers
exactly what got accepted.

## 3. Trace export (step 2)

- `node tools/preview/export-trace.mjs` → exit 0: `wrote
  app-preview\data\trace.json`, `attempts=177 prompt_tokens=11089593
  completion_tokens=1267540 estimated_usd=19.249055
  actual_microusd_exact=20249055`.
- `node tools/preview/embed-trace.mjs` → exit 0: `wrote
  app-preview/trace-embedded.js attempts=177 estimated_usd=19.249055`.
- `trace.html` needed no edit: live `data/trace.json` fetch with
  `trace-embedded.js` file:// fallback (both wirings present, unchanged code).
  Exported 2026-10-27T19:51:29Z, after the last acceptance.

## 4. Real-content wiring (steps 3–4)

- `tools/preview/export-content.mjs` extended (preview lane): each manifest
  entry now carries `section_id` read from the ledger task's
  `config.section_ids[0]` (fallback: first secNN slug in the identity JSON).
  Run → exit 0: **copied=76 skipped_non_accepted=89**; `data-real-embedded.js`
  regenerated by the exporter (743,231 bytes). Accepted set by section:
  sec09 full (9×02 + 03 + 04 + 06 + 05.sessions + 05.card_scripts),
  **sec05 full (same 14)**, sec02/sec04 dossier 9 + KG each, sec01/sec03/sec06
  dossier 9 each, sec07 dossier part C only.
- `app-preview/index.html` extended (preview lane only): course = whole Utah
  Driver Handbook, 16 chapters in handbook order (`#/chapters`, `#/chapter/:section`);
  each built chapter = its KG modules with the lesson / flashcards / quiz /
  practice flow from the Section 9 build. Belt ids needed no remapping: the
  belt already namespaces non-sec09 ids (sec05-m01, sec05-u01,
  sec05-card-…, sec05-itm-…, sec05-form-a/b, sec05-quiz-…); Section 9 keeps
  unprefixed ids and is told apart by its export `section_id`. Module hubs
  show "not yet built" for steps with no accepted artifact (sec02/sec04:
  lesson, cards, quiz); those routes render an honest pending card, never
  filler. Reviewer routes (`#/dossier`, `#/modules`, `#/real-cards`,
  `#/real-quiz`, `#/real-lesson`) aggregate all sections with per-entry
  section tags. Progress namespace moved to `nova-preview:v1:ut-handbook`
  (syllabus changed; old sec09 namespace abandoned).
- Home shows, counted from the exports: **4 of 16 chapters built ·
  55 flashcards · 55 quiz items · 6 lessons (42 slides)**, REAL banner, trace
  link. File:// fallback works via regenerated `data-real-embedded.js`
  (the harness forces that path — see below).
- `app-preview/README.md` rewritten (whole-handbook scope, per-chapter
  accepted inventory, fresh sha256 table).
- Verification: `node tools/preview/verify-learner.cjs` (rewritten from the
  sec09-only harness to the whole-handbook app; same filename) →
  **RESULT: ALL CHECKS PASSED** (exit 0): chapter count = sections with
  accepted KG (sec02, sec04, sec05, sec09); per chapter every
  lesson slide/narration/why-how/example/misconception/self-check, every card
  front/back/hook/teaching text, every quiz stem/option/rationale byte-exact
  against the exports; sec02/sec04 lesson/cards/quiz assert pending-not-filler;
  4 practice forms with exact item counts (19/19/8/8) and no pass claim;
  results round-trip; reviewer routes REAL + content; **zero "Nowhere" /
  "SYNTHETIC SAMPLE" hits on all 72 learner routes** (the single "Nowhere"
  string renders only on `#/synthetic-sample`). Inline module passes
  `node --check`.

## 5. What is real in the app / what I could not verify

REAL (banner "REAL — Utah Driver Handbook, belt-validated, audit pending"):
Ch.2 KG modules (3 modules, 17 nodes) + Ch.4 KG modules (3 modules, 22 nodes)
+ Ch.5 full course (3 units, 21 slides, 16 cards + 19 scripts, 16 items,
2×8 forms) + Ch.9 full course (3 units, 21 slides, 39 cards + 42 scripts,
39 items, 2×19 forms) + dossier reviewer view (64 accepted parts across
sec01–sec07, sec09) + trace.html (177-attempt ledger data). SYNTHETIC:
`#/synthetic-sample` only (Nowhere-island sample, banner kept). "Not yet
built" (not synthetic, not real): Ch.2/Ch.4 lesson+cards+quiz; Ch.1, 3, 6, 7,
8, 10–16 chapter pages.

Could not verify: real-browser rendering (no browser tooling in this lane —
layout at 375 px, keyboard tab order, 3-second recall beat timing are
structural only: valid markup, native buttons/links, unchanged mobile-first
CSS, `prefers-reduced-motion` branch present). Open `app-preview/index.html`
in a browser and click through Chapters 5 and 2 to confirm. Live-HTTP data
path: the harness forces the file:// embedded fallback; the fetch path is
unchanged code but was not served over HTTP. Grading clicks: exercised via
the stored-result round-trip, not simulated clicks. Audit: content is
belt-validated per the manifest; full audit still pending (banner says so).
