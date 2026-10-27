# Muse full-handbook report — Utah 16/16 (2026-10-27 ~16:20 MDT)

Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($60 cap, stages 02/03/04/05.sessions/05.card_scripts/06, all 16 handbook sections).
Lane: belt operator + preview builder. Belt ONLY via `tools/belt/run-utah.mjs`;
writes ONLY under `runs/` via that command plus `app-preview/`, `tools/preview/`,
`coordination/`. No direct api.meta.ai calls, no key printed, no edits to
`tools/belt/*`, `schemas-strict/*`, `prompts/*`, `contracts/*`, `qualification/*`.

## 0. Headline

All 16 handbook sections are DONE and the learner app is the whole Utah Driver
Handbook: 16 of 16 chapters built, 374 flashcards, 328 quiz items, 48 lessons
(335 slides), 32 practice forms — every screen harness-verified byte-level
against the exports. This run's new work was sec15 (the last gap): 9 stages
accepted, $1.135 new spend. Total ledger spend $44.088 / $60 cap ($15.91 left).

## 1. Belt run (step 1)

Command (stages value quoted exactly as instructed):

`node tools/belt/run-utah.mjs --sections all --stages "02,16,03,04,06,05.sessions,05.card_scripts"`

Full console: `coordination/step1-full-handbook-console.log` (35,064 bytes, via Tee-Object).
Shell exit code was 1 for a PowerShell-only reason (node's SQLite
ExperimentalWarning on stderr becomes a NativeCommandError through `2>&1 | Tee-Object`);
the belt itself completed normally — SUMMARY below, all DONE, no STOP, no manual retry.
Banner at start: `spent so far $42.953 / cap $60`.

- sec01–sec14, sec16: every requested stage already accepted — skipped, $0.
- sec15-vehicle-equipment (the only live section): 02 parts E2/F/G accepted
  ($0.090/$0.085/$0.094, lineage reset 1/2 → lineage 134), 16.compile PASS,
  03 accepted $0.119, 04 HOLD (`finish_reason_not_stop`, auto-retried by the
  runner, retry accepted $0.117), 06 accepted $0.137, 05.sessions $0.124,
  05.card_scripts $0.160. DONE, spent $44.088.

SUMMARY block, verbatim:

```
SUMMARY spent $44.088 / cap $60
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
  sec15-vehicle-equipment: DONE
  sec16-towing: DONE
```

Per-section spend (ledger reservations, read-only; reported actual + open
reserved, micro-USD exact; sums to $44.088):

| section | USD (cumulative) | this run |
|---|---|---|
| sec01-definitions | 3.033284 | 0 |
| sec02-licensing-requirements | 2.620074 | 0 |
| sec03-driver-education-permits | 1.801324 | 0 |
| sec04-license-types-id-documents | 2.694480 | 0 |
| sec05-vision-health | 1.590322 | 0 |
| sec06-examinations | 2.882694 | 0 |
| sec07-preparing-vehicle | 2.154391 | 0 |
| sec08-basic-driving | 2.013489 | 0 |
| sec09-rules-of-the-road | 11.535623 | 0 |
| sec10-alcohol-drugs | 1.992798 | 0 |
| sec11-distractions-challenges | 2.114561 | 0 |
| sec12-crashes-insurance | 1.753091 | 0 |
| sec13-suspensions-record | 1.693141 | 0 |
| sec14-sharing-the-road | 2.168779 | 0 |
| sec15-vehicle-equipment | 2.319288 | 1.135 |
| sec16-towing | 1.720912 | 0 |

sec09 carries the early lineage-wall history ($11.54); the other fifteen ran
$1.59–$3.03 each. Cap NOT hit.

## 2. Trace + content exports (steps 2–3, export half)

- `node tools/preview/export-trace.mjs` initially failed with
  `SQLITE_CANTOPEN unable to open database file` on `SELECT * FROM tasks …
  ORDER BY created_at` — sandboxed SQLite cannot spill large sorts to temp
  files (`SQLITE_TMPDIR` is ignored on Windows; verified). Fixed in my lane:
  `tools/preview/export-trace.mjs` now selects unordered and sorts the small
  result sets in JS (same order, no TMP workaround needed). Re-ran → exit 0:
  `attempts=401 prompt_tokens=24986074 completion_tokens=2789556
  estimated_usd=43.088251 actual_microusd_exact=44088251`.
- `node tools/preview/embed-trace.mjs` → exit 0, attempts=401, same
  `exported_at 2026-10-27T22:16:28Z` (after the last acceptance 22:13:48Z).
  `trace.html` needs no edit: live `data/trace.json` fetch + embedded
  fallback both fresh. Trace reflects all sections: 401 attempts
  (252 accepted / 6 failed / 143 blocked), 134 lineages, 592 approvals,
  133 lineage resets, 3 jams; ledger actual $44.088251 ≈ runner $44.088.
- `node tools/preview/export-content.mjs` → exit 0:
  `copied=224 skipped_non_accepted=143`, manifest `exported_at
  2026-10-27T22:16:33Z`; `data-real-embedded.js` regenerated (3,290,153
  bytes). Manifest proves 16 sections × 14 files (9× 02 dossier + 03 KG +
  04 cards + 06 exam + 05 sessions + 05 card_scripts), each with `section_id`.
- Global id check: 48 modules / 48 units / 374 cards / 328 items / 32 forms /
  48 quizzes with ZERO cross-section collisions. sec09 keeps unprefixed ids
  (m01/u01/card-F01/form-a); the other fifteen use belt namespaced ids
  (secNN-m01, secNN-card-…, secNN-form-a/b); the app keys sec09 by export
  `section_id`.

## 3. Learner app (steps 3–4, app half)

The whole-handbook extension of `app-preview/index.html` and the
whole-handbook edition of `tools/preview/verify-learner.cjs` were already in
the tree from concurrent lane work (mtimes 13:53 / 16:05, before my run
finished); I verified them against the fresh exports rather than rewriting
them. My app-lane writes this session: the export-trace ORDER BY fix, the
regenerated exports/embeds, and `app-preview/README.md` (16/16 counts,
Ch.15 line, 224 files, 401-attempt trace stats, fresh sha256 table).

What is real in the app (all harness-verified, see §4):

- Home `#/`: `16 of 16 chapters built · 374 flashcards · 328 quiz items ·
  48 lessons (335 slides)` counted from the exports, REAL banner, trace link.
- `#/chapters`: all 16 chapters in handbook order, each a chapter card.
- `#/chapter/:section` × 16: that section's KG modules (2–5 per chapter)
  with lesson/flashcards/quiz counts from the accepted artifacts.
- Per module: `#/module/:module` hub (Lesson → Flashcards → Quiz),
  `#/lesson/:unit` (slides + teacher narration + why/how + worked example +
  misconception + memory support + self-check), `#/cards/:unit` (accepted
  wording + hook + 05.card_scripts teaching text + deck recap),
  `#/quiz/:unit` (accepted stems, A–D, correct + per-option rationales).
- `#/practice` + 32 `#/practice/:form` (2 per chapter, grouped by chapter),
  practice-only language, no official pass claim anywhere.
- Reviewer routes (`#/dossier` 144 dossier parts, `#/modules` 16 KGs,
  `#/real-cards`, `#/real-quiz`, `#/real-lesson`) render all 16 sections.
- `file://` fallback works: the harness forces the embedded path (fetch stub
  throws) and every check below ran through it; embeds regenerated after the
  final export.
- No "not yet built" chapter remains (all 16 have accepted KGs), but the
  honest pending states are still in the code and harness-covered.
- The fictional Nowhere sample lives ONLY under `#/synthetic-sample`
  (SYNTHETIC banner); zero `Nowhere`/`SYNTHETIC SAMPLE` on any learner route.
  (Lowercase "nowhere" is ordinary English inside accepted sec08/sec14 exam
  options and renders — the sweep is case-sensitive by design.)

## 4. Verification (step 5, harness)

`node tools/preview/verify-learner.cjs` → `RESULT: ALL CHECKS PASSED`
(exit 0), run twice after the final exports. Coverage: bootstrap REAL+
synthetic; home aggregates + trace link; 16 chapters in handbook order;
per built chapter the module/lesson/cards/quiz text asserted byte-exact
(modulo HTML-escaping) against the embedded exports — slide titles, lines,
narrations, seconds, why/how, worked examples, misconceptions, memory
supports, self-checks, all 374 fronts/backs/hooks/teaching texts, all 48
module quizzes' stems/options/rationales, all 32 practice forms' item counts;
results round-trip; settings trace/synthetic links; 5 reviewer routes;
global Nowhere/SYNTHETIC sweep over 244 learner routes — clean.

## 5. What I could not verify

- Real-browser rendering: no browser run (no browser tooling in this lane).
  Layout at 375 px, keyboard tab order, and the 3-second recall beat timing
  are verified only structurally (valid markup, native buttons/links,
  unchanged mobile-first CSS, `prefers-reduced-motion` branch present). Open
  `app-preview/index.html` in a browser and click through one non-sec09
  chapter to confirm.
- Live-HTTP data path: the harness forces the `file://` embedded fallback.
  The fetch path uses unchanged code, but I did not serve the folder over
  HTTP to confirm it. (`node tools/preview/static-serve.mjs` is the runner.)
- Grading clicks: option selection + submit handlers are exercised only via
  the stored-result round-trip, not simulated clicks.
- Audit: content is belt-validated per the manifest; full audit still pending
  (banner says so).
