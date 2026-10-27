# Nova × Muse — a Meta-operated factory that turns a state driver handbook into a study app

**Meta Global AI Developer Hackathon, Oct 26 – Nov 4, 2026.** This repo is the complete, auditable lane that built a
Utah DMV written-test prep app (the 66th product line of the Nova certification factory) with **Muse Code as the operator
and builder**, **muse-spark-1.3 as the only authoring model**, and a strict validation belt deciding what counts as real.

> Every learner-facing sentence in the app traces back through a ledger to one paid model call, its request, its raw
> response, the validator receipt that accepted it, and the handbook page it cites. Nothing was hand-edited.

## What Muse did

| role | how |
|---|---|
| **Operator of the belt** | `muse exec` runs `tools/belt/run-utah.mjs`: dispatches each stage to the Meta Model API, watches the deterministic validator, retries HOLDs under a bounded lineage policy, moves section by section through the handbook, and writes an operator report after every launch (`coordination/MUSE-BELT-OPERATOR-REPORT.md`, `coordination/MUSE-FULL-HANDBOOK-REPORT.md`). |
| **Builder of the app** | Muse wrote `app-preview/` (no framework, no network): home → module hub → lesson slides with "teacher says" narration → flashcards with a recall beat → module quiz → practice forms, all rendered from the ledger-accepted artifacts, with provenance links per card/item/slide (`coordination/MUSE-LEARNER-SCREENS-REPORT.md`). |
| **Its own reviewer** | Muse's DOM harness (`tools/preview/verify-learner.cjs`) asserts counts and byte-exact wording against the exports before it reports done. |
| **Spoken recall (next)** | Muse Voice Transcribe behind a local proxy so a learner can *say* the answer on a flashcard (`coordination/MUSE-VOICE-RECALL-BRIEF.md`). |

The human (founder) set the scope, the state, the budget, and three standing decisions; everything else was artifacts.

## What the belt is

```text
15 register the handbook (pages, hashes, liveness)
02 dossier — 9 parts per handbook section (facts with page anchors, confusables, exam facts, debts, DoD matrix)
16 deterministic compile → fact index (every FACT_ID → accepted wording + page)
03 knowledge graph (modules, prerequisites, high-yield set, confusables)
04 flashcards (back == accepted wording, byte-exact; spoken form; SRS tiers)
06 exam bank (4-option items, rationales, 2 practice forms, module quizzes; no numeral without a verified fact)
05 teaching sessions (6–8 slides, worked example, misconception, self-check) + card narration scripts
```

Each stage is a strict-mode JSON schema (`schemas-strict/`) plus compensating checks (`tools/belt/checks/`) the model cannot
talk its way past. A HOLD costs one call and teaches the conventions (`schemas-strict/output-conventions.json`); an accepted
artifact is immutable and ledgered (`runs/<run>/ledger/run.sqlite`, append-only events, micro-USD reservations per call).

## Proof, not claims

- `app-preview/trace.html` — the live trace: every attempt, its cost, its checks, accepted vs held, per section.
- `runs/2026-10-26-rdmv-ut-class-d/` — approvals, receipts, lineage resets, reconciliations, `jams.md` (what went wrong and when).
- `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md` — product cost (belt calls, from the ledger) kept apart from operator cost (Muse Code subscription).

Section 9 (Rules of the Road) end-to-end: 9 dossier parts, 39 facts, 3 modules, 39 cards, 39 items, 21 slides, 42 scripts —
**$11.54 of model calls including every held attempt while the conventions were being learned**; a stable section costs ≈ $2.
The remaining 15 sections run as one Muse launch (`coordination/MUSE-FULL-HANDBOOK-BRIEF.md`).

## Honest limits

- Content is **belt-validated, audit pending**: the independent fact/coverage auditors (roles 07/08) are not part of the pilot; the app says so on every screen.
- Text-first: narration is written, not spoken (Meta has no TTS; recall-by-voice uses Muse Voice Transcribe).
- The handbook PDF stays private (`runs/**/sources/private/`, gitignored); only page anchors and authored text are published.
- The free-credit dashboard counts Muse Code's own agent tokens until a subscription is active; see the cost doc for the split.

## Run it

```bash
npm install
node tools/preview/static-serve.mjs 4310      # http://localhost:4310  (the app, no build step)
node tools/belt/run-fixtures.mjs              # 81 validator fixtures, no model calls
node tools/belt/compile-check.mjs             # pure compile of the accepted dossier parts
```

A belt run needs `MODEL_API_KEY` in `.env` (see `ENV-SETUP.md`), a run-config with a standing authority artifact, and an
operator — ours is Muse: `muse exec --prompt-file coordination/MUSE-FULL-HANDBOOK-BRIEF.md …`.

## Credits and lineage

Belt contracts and controller: Sol (GPT) for Nova; validators, runner and conventions: Claude (Fable 5.1) as runner;
operation and app: Muse Code (muse-spark-1.3). Founder: Sridhar Varadarajulu. Nova's own factory, 65 live stores and the V1
corpus are **not** in this repo and were never sent to the Meta API.
