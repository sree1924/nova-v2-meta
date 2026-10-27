# MUSE belt-operator report — Utah sec09 run, eighth launch 2026-10-27 (~11:39 MDT)

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27; Muse Code powered by Meta Muse Spark).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs` + `tools/belt/controller.mjs`
(plus one read-only `compileAcceptedDossier` import for full HOLD text — HOLD path
writes nothing, 0 model calls); ledger read-only via `node:sqlite {readOnly:true}`
exactly as `export-trace.mjs` does; writes only under `app-preview/`,
`tools/preview/` (none needed), `coordination/` (this report). No `.env` contents
printed. No `tools/belt/*`, schemas, prompts, contracts touched. This report overwrites
the seventh-launch report per the brief; the prior tooling (export-trace, embed-trace,
export-content, `#/dossier` route) was reused, not rebuilt. No app-preview code edits
were needed this launch — re-running the exporters picked up the new acceptance.

## 0. Operator invocation fault (no spend, paper trail only)

First attempt of the step-1 command passed `--stages` UNQUOTED through PowerShell,
which evaluated `02,16,03,...` as an array literal and stripped leading zeros
(`02`→`2`). The runner then failed fast with `ERROR 2: Unknown artifact stage: 2`
/ `STOP at 2 : ERROR` before any model call. Side effect: one stray approval file
`runs/2026-10-26-rdmv-ut-class-d/approvals/GO-2-2026-10-27T17-38-34-321Z.json`
(minted pre-dispatch, authorizes nothing spent). Re-ran with the stage list
single-quoted; that run is the launch recorded below. Lesson for future launches:
always quote `--stages '...'` in PowerShell.

## 1. Belt run (step 1) — G ACCEPTED first attempt, STOP at 16.compile HOLD

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages '02,16,03,04,06,05.sessions,05.card_scripts'`
Exit code: **1**. Full console output, verbatim:

```
UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $4.624 / cap $30
  02.dossier_sections part C: already accepted — skipped
  02.dossier_sections part C2: already accepted — skipped
  02.dossier_sections part A: already accepted — skipped
  02.dossier_sections part B: already accepted — skipped
  02.dossier_sections part D: already accepted — skipped
  02.dossier_sections part E: already accepted — skipped
  02.dossier_sections part E2: already accepted — skipped
  02.dossier_sections part F: already accepted — skipped
  02.dossier_sections part G: accepted $0.109  [spent $4.732]
  16.compile: HOLD — ["Envelope source registry hash differs from accepted registry","F01: expected exactly one explicit fact marker in C.01; found 0","F02: expected exactly one explicit fact marker in C.01; found 0","F03: expected exactly one explicit fact marker in C.01; found 0","F04: expected exactly one explicit fa
STOP: compile not PASS
```

(The compile line is truncated at 300 chars by the runner; full text captured
separately — see below.)

Per-part outcome this launch: 8/9 parts skipped (already accepted), **G accepted
first attempt, $0.109, no HOLD**. The `owner_implementation_closure_unsealed`
validator closure that blocked G for four HOLDs last launch is evidently resealed
on the owner side — no operator action caused this; the runner just dispatched
and it passed.

Spend: $4.624 → $4.732 this launch (+$0.108 ledger actual; G reserved $0.109).
Cap headroom remaining: ~$25.27.
Section-09 stage-02 tally after this launch: **9 of 9 parts accepted**
(C, C2, A, B, D, E, E2, F, G). Stage 02 for sec09 is complete.

### 16.compile HOLD — full reasons (41 errors, 0 model calls, deterministic)

Obtained via a read-only `compileAcceptedDossier()` call (same function the
runner calls; HOLD path returns before any lock/ledger write), JSON verbatim:

```
status: HOLD
1.  Envelope source registry hash differs from accepted registry
2-25. F01..F24: expected exactly one explicit fact marker in C.01; found 0  (24 items)
26-40. R09-01..R09-15: expected exactly one explicit fact marker in C2.01; found 0  (15 items)
41. No unambiguously located accepted fact spans were indexed
model_calls: 0
```

Notes for the owner (Claude schema lane), not operator findings to act on:
the accepted C artifact's markdown visibly contains `FACT_ID: F01 | anchor: A01`
style markers (confirmed in the exported copy), yet the compile span indexer
counts 0 in C.01 — the mismatch is inside the compile gate's span-location
logic and/or the envelope-vs-registry hash, i.e. owner-side contract behavior,
not content the runner can retry around. Per the STOP hard rule the chain was
not re-driven. A re-run of compile alone would deterministically reproduce this
HOLD (no artifact changed since), so it was captured once, not looped.

## 2. Trace export (step 2) — exit 0, trace.html current

- `node tools/preview/export-trace.mjs` → exit **0** → `wrote app-preview\data\trace.json`,
  `attempts=42 prompt_tokens=2269597 completion_tokens=210640 estimated_usd=3.732220 actual_microusd_exact=4732220`.
  (+1 attempt vs last launch = the G acceptance; ledger actual $4.732220 matches
  runner $4.732. PowerShell file-redirect was used to dodge the known host
  quirk that surfaces node's SQLite ExperimentalWarning on stderr as exit 1;
  the export itself is unaffected.)
- `node tools/preview/embed-trace.mjs` → exit **0** → `wrote app-preview/trace-embedded.js attempts=42 estimated_usd=3.73222`.
- `app-preview/trace.html` loads `data/trace.json` via fetch with
  `window.__TRACE_EMBEDDED` fallback — both files regenerated, so the reviewer
  trace shows all 42 attempts and the totals strip: 42 attempts ·
  2,269,597 prompt tokens · 210,640 completion tokens · estimated $3.732220 ·
  ledger actual 4,732,220 µUSD (= $4.732220).
- Remaining queued (no attempts): 20 × 02 other-section parts plus 03/04/05.sessions/05.card_scripts/06/07/08/09/19A singletons — unchanged except sec09-G leaving the queue.

## 3. Real content wiring (step 3) — exit 0, no code changes needed

- `node tools/preview/export-content.mjs` → exit **0** → `copied=9 skipped_non_accepted=28`
  (was 8/28 — the delta is exactly the newly accepted G artifact).
  All 9 accepted sec09 dossier artifacts sit under
  `app-preview/data/real/02_dossier_sections/` with sha256 manifest
  (`app-preview/data/real/manifest.json`, `exported_at=2026-10-27T17:40:25.210Z`);
  `app-preview/data-real-embedded.js` regenerated (50,918 bytes) for file:// fallback.
- New G artifact verified structurally against the view's fields:
  `task_6da24bd8…/attempt_6afd03b5…` (lineage:20, 7,620 bytes, sha256
  `b0c001ac…f64e96b`), `envelope_scope.assigned_section_ids=["G"]`,
  one section `G.01` (438 markdown chars, 0 fact_ids — same short-part shape as
  A/B/D/E/E2/F, rendered faithfully, not a view gap). The `#/dossier` reviewer
  route iterates manifest files generically, so G renders with provenance
  (task/attempt id, sha256, bytes) with no view edit.
- Banners: `#/dossier` shows `REAL — Utah Section 9, validated, audit pending`
  (now across all 9 parts C/C2/A/B/D/E/E2/F/G); every learner screen keeps
  `SYNTHETIC SAMPLE — not Utah content`. Learner screens (lesson, flashcards,
  quiz, practice) remain fully synthetic — see step 4.

## 4. Later stages (step 4) — NOT run: compile gate HOLDs, condition not met

Step 1 STOPped at `16.compile: HOLD`, so the runner never reached 03/04/06/05 —
the brief's step-4 condition ("later stages ... already enabled by the runner")
is false. 03.combined_kg, 04.cards, 05.sessions, 05.card_scripts, 06.exam_bank
remain `queued` with zero attempts in the fresh trace export. Running the step-4
command now would spend model calls with no compiled dossier to build from, so
per the STOP hard rule it was not attempted. Consequence: no 04 cards /
05 sessions / 06 items exist to wire — flashcards, lesson, and quiz stay
synthetic until the owner resolves the 41 compile errors and a future launch
carries 16 → 03 → 04/06/05 to acceptance.

## 5. Could-not-do list

1. 16.compile HOLD (41 errors: registry-hash drift + C.01/C2.01 fact-span
   indexing): owner-side gate behavior; needs Claude schema-lane action, not operator retry.
2. Step-4 stages (03/04/06/05.sessions/05.card_scripts): blocked behind compile; not attempted.
3. Real learner screens: nothing to wire until 04/05/06 produce accepted artifacts.
4. No independent browser smoke of `#/dossier` G rendering was run (no browser
   tool in this lane); wiring verified structurally (manifest + artifact shape +
   generic view iteration), not visually.
5. Stray `GO-2-*.json` approval from the unquoted first invocation: harmless
   (authorizes no spend, stage `2` matches nothing), left in place — belt-owned
   directory, not mine to clean.
