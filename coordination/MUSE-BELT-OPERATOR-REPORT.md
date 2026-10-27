# MUSE belt-operator report — Utah sec09 run, ninth launch 2026-10-27 (~11:50 MDT)

Operator: Muse Code (belt OPERATOR per founder rule 2026-10-27; Muse Code powered by Meta Muse Spark).
Authority: `runs/2026-10-26-rdmv-ut-class-d/approvals/STANDING-AUTHORITY-utah-full-run.json`
($30 Meta free-credit cap; stages 02 / 03 / 04 / 05.sessions / 05.card_scripts / 06).
Lane kept: belt only via `tools/belt/run-utah.mjs` (+ read-only ledger probes via
`node:sqlite {readOnly:true}` exactly as `export-trace.mjs` does); writes only under
`app-preview/` (regenerated data), `coordination/` (this report). No `.env` contents
printed. No `tools/belt/*`, schemas, prompts, contracts touched. This report overwrites
the eighth-launch report per the brief. Prior tooling (export-trace, embed-trace,
export-content, `#/dossier` route) was reused, not rebuilt. No app-preview code edits
were needed this launch.

## 0. Operator invocation fault (no spend, paper trail only)

The first step-1 attempt again passed `--stages` UNQUOTED through PowerShell
(`02,16,...` evaluated as an array literal, `02`→`2`). The runner failed fast with
`ERROR 2: Unknown artifact stage: 2` / `STOP at 2 : ERROR`, exit 1, before any model
call. Side effect: a second stray approval file
`runs/2026-10-26-rdmv-ut-class-d/approvals/GO-2-2026-10-27T17-44-02-676Z.json`
(next to last launch's `GO-2-2026-10-27T17-38-34-321Z.json`; both verified present,
both authorize no spend since stage `2` matches nothing). Re-ran with the stage list
double-quoted; that run is the launch recorded below. Lesson stands: always quote
`--stages "..."` in PowerShell.

## 1. Belt run (step 1) — 9/9 parts skipped, 16.compile PASS, STOP at 03 ERROR

Command: `node tools/belt/run-utah.mjs --section sec09-rules-of-the-road --stages "02,16,03,04,06,05.sessions,05.card_scripts"`
Exit code: **1**. Full console output, verbatim:

```
UTAH RUN — section sec09-rules-of-the-road; stages 02 → 16 → 03 → 04 → 06 → 05.sessions → 05.card_scripts; spent so far $4.732 / cap $30
  02.dossier_sections part C: already accepted — skipped
  02.dossier_sections part C2: already accepted — skipped
  02.dossier_sections part A: already accepted — skipped
  02.dossier_sections part B: already accepted — skipped
  02.dossier_sections part D: already accepted — skipped
  02.dossier_sections part E: already accepted — skipped
  02.dossier_sections part E2: already accepted — skipped
  02.dossier_sections part F: already accepted — skipped
  02.dossier_sections part G: already accepted — skipped
  16.compile: PASS
  03.combined_kg: HOLD $0.152 — 03.LINEAGE=FAIL  [spent $4.884]
  retry → 03.combined_kg: nonce 1
  03.combined_kg: HOLD $0.153 — HOLD  [spent $5.037]
  retry → 03.combined_kg: nonce 2
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:21 (reset 1/2)
  03.combined_kg: HOLD $0.154 — HOLD  [spent $5.191]
  retry → 03.combined_kg: nonce 3
  03.combined_kg: HOLD $0.156 — 03.KG01_GAPS=FAIL  [spent $5.347]
  retry → 03.combined_kg: nonce 4
  lineage → 2026-10-26-rdmv-ut-class-d:lineage:22 (reset 2/2)
  03.combined_kg: HOLD $0.152 — 03.KG01_GAPS=FAIL  [spent $5.500]
  retry → 03.combined_kg: nonce 5
  03.combined_kg: HOLD $0.154 — HOLD  [spent $5.654]
  retry → 03.combined_kg: nonce 6
  ERROR 03.combined_kg: LINEAGE_ATTEMPT_LIMIT: changing task/model/input IDs cannot reset attempts
STOP at 03.combined_kg : ERROR
```

Per-part outcome this launch: 8/9 dossier parts were already accepted before this
launch and G was accepted last launch, so **all 9 skipped, $0.00 new dossier spend**.
**16.compile: PASS** — the 41-error HOLD from last launch (registry-hash drift +
C.01/C2.01 fact-span indexing) is resolved on the owner side; no operator action
caused this. Ledger now shows `16.compile accepted 1`. Stage 02 for sec09 remains
complete (9/9 accepted).

Stage 03 (`03.combined_kg`) then burned **6 HOLD attempts, ~$0.15–0.16 each**:
non-PASS checks seen were `03.LINEAGE=FAIL`, bare `HOLD`, and `03.KG01_GAPS=FAIL`.
Both standing-authority lineage resets were consumed (lineage 21, 22, logged in
`jams.md` by the runner), and the 7th dispatch hit `LINEAGE_ATTEMPT_LIMIT` →
`ERROR` → `STOP`. Ledger task tally for 03 after this launch: `blocked 6`,
`queued 4`, zero accepted.

Spend: $4.732 → $5.654 this launch (+$0.922 ledger actual). Cap headroom
remaining: ~$24.35.

## 2. Trace export (step 2) — exit 0, trace.html current

- `node tools/preview/export-trace.mjs` → exit **0** → `wrote app-preview\data\trace.json`,
  `attempts=49 prompt_tokens=2670584 completion_tokens=309641 estimated_usd=4.654209 actual_microusd_exact=5654209`.
  (+7 attempts vs last launch's 42: 6 are this launch's 03 HOLD attempts; the 7th
  is one additional ledger attempt row not dispatched by this launch — source not
  chased, flagged, not assumed. Ledger actual $5.654209 matches runner $5.654.
  PowerShell file-redirect was used to dodge the known host quirk that surfaces
  node's SQLite ExperimentalWarning on stderr.)
- `node tools/preview/embed-trace.mjs` → exit **0** → `wrote app-preview/trace-embedded.js attempts=49 estimated_usd=4.654209`.
- `app-preview/trace.html` loads `data/trace.json` via fetch with
  `window.__TRACE_EMBEDDED` fallback (unchanged code) — both files regenerated, so
  the reviewer trace shows all 49 attempts and the totals strip: 49 attempts ·
  2,670,584 prompt tokens · 309,641 completion tokens · estimated $4.654209 ·
  ledger actual 5,654,209 µUSD (= $5.654209).
- Remaining queued (no attempts): 20 × 02 other-section parts plus 03/04/05.sessions/05.card_scripts/06/07/08/09/19A singletons — unchanged (03 gained blocked tasks, not queue entries).

## 3. Real content wiring (step 3) — exit 0, no code changes needed

- `node tools/preview/export-content.mjs` → exit **0** → `copied=9 skipped_non_accepted=34`
  (was 9/28 — copied stable at the 9 accepted sec09 dossier artifacts; +6 skipped =
  the six new 03 HOLD attempts' non-accepted artifacts, correctly never copied).
  All 9 accepted sec09 dossier artifacts sit under
  `app-preview/data/real/02_dossier_sections/` with sha256 manifest
  (`app-preview/data/real/manifest.json`, `exported_at=2026-10-27T17:50:30.432Z`);
  `app-preview/data-real-embedded.js` regenerated for file:// fallback.
- The `#/dossier` reviewer route iterates manifest files generically, so all 9 parts
  (C/C2/A/B/D/E/E2/F/G) render with provenance and no view edit.
- Banners: `#/dossier` shows `REAL — Utah Section 9, validated, audit pending`;
  every learner screen keeps `SYNTHETIC SAMPLE — not Utah content`. Learner screens
  (lesson, flashcards, quiz, practice) remain fully synthetic — see step 4.

## 4. Later stages (step 4) — NOT run: STOP at 03, condition not met

Step 1 STOPped at `03.combined_kg: ERROR`, so the runner never reached 04/06/05 —
the brief's step-4 condition ("later stages ... already enabled by the runner")
is false. Ledger confirms: 03 `blocked 6 / queued 4` (zero accepted), 04.cards /
05.sessions / 05.card_scripts / 06.exam_bank all `queued` with zero attempts.
Running the step-4 command now would immediately re-hit `LINEAGE_ATTEMPT_LIMIT`
on 03 and spend model calls with no combined KG to build from, so per the STOP
hard rule it was not attempted. Consequence: no 04 cards / 05 sessions / 06 items
exist to wire — flashcards, lesson, and quiz stay synthetic until the owner
resolves the 03 gate (`03.LINEAGE`, `03.KG01_GAPS`) and a future launch carries
03 → 04/06/05 to acceptance.

## 5. Could-not-do list

1. 03.combined_kg gate (`03.LINEAGE=FAIL`, `03.KG01_GAPS=FAIL`, then lineage
   attempt-limit): owner-side gate behavior; both standing-authority resets are
   consumed for this lineage path — needs Claude schema-lane action, not operator retry.
2. Step-4 stages (03/04/06/05.sessions/05.card_scripts): blocked behind 03; not attempted.
3. Real learner screens: nothing to wire until 03/04/05/06 produce accepted artifacts.
4. No independent browser smoke of `#/dossier` rendering was run (no browser
   tool in this lane); wiring verified structurally (manifest + ledger states +
   generic view iteration), not visually.
5. Stray `GO-2-*.json` approvals (11:38 last launch + 11:44 this launch): harmless
   (authorize no spend, stage `2` matches nothing), left in place — belt-owned
   directory, not mine to clean.
