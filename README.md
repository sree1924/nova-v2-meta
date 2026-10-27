# Nova × Muse — a Meta-operated factory that turns a state driver handbook into a study app

**Meta Global AI Developer Hackathon, Oct 26 – Nov 4, 2026.** This repo is the complete, auditable lane that built a
Utah DMV written-test prep app (the 66th product line of the Nova certification factory) with **Muse Code as operator,
builder and author**, **muse-spark-1.3 as the only authoring model**, and a strict validation belt deciding what counts as real.

> Every learner-facing sentence in the app traces back through a ledger to one model attempt, its request, its raw
> response, the validator receipt that accepted it, and the handbook page it cites. Nothing was hand-edited.

**State of the lane (2026-10-28 00:00Z):** all 16 Utah handbook chapters built and verified — 48 modules, 374 flashcards,
328 quiz items, 48 lessons / 335 slides, 32 practice forms; 1,509 narration clips minted; spoken recall live; harness
`ALL CHECKS PASSED` on 244 learner routes.

## What Muse did

| role | how |
|---|---|
| **Operator of the belt** | `muse exec` runs `tools/belt/run-utah.mjs`: dispatches each stage, watches the deterministic validator, retries HOLDs under a bounded lineage policy, moves section by section through the handbook, and writes an operator report after every launch (`coordination/MUSE-FULL-HANDBOOK-REPORT.md`). |
| **Builder of the app** | Muse wrote `app-preview/` (no framework, no build): home → chapter → module hub → lesson slides with narration → flashcards with a recall beat → module quiz → practice forms, all rendered from the ledger-accepted artifacts, with provenance per card/item/slide. |
| **Author under subscription** | After Utah, the belt switched to **Muse Code subscription authoring**: the belt emits the exact bound request as a packet, Muse authors the artifact herself (no Model API call), and the belt ingests it through the same validators and ledger at **$0** (`tools/belt/dispatch.mjs` → `emitAuthoringPacket` / `museFileTransport`; `run-utah.mjs --author muse`). The proof run is `runs/2026-10-27-rdmv-ut-class-d-muse/` (Section 1 re-authored at $0; see its ledger). |
| **Spoken recall** | `tools/preview/serve.mjs` proxies the learner's microphone audio to **Muse Voice Transcribe**; "Say it" on every flashcard grades the spoken answer against the accepted card back (`coordination/MUSE-VOICE-RECALL-REPORT.md`). |
| **Its own reviewer** | Muse's DOM harness (`tools/preview/verify-learner.cjs`) asserts counts, byte-exact wording and audio coverage against the exports before it reports done. |

The human (founder) set the scope, the state, the budget and a handful of standing decisions; everything else was artifacts.

## Two engines, one belt

| | Utah (centerpiece) | every state after |
|---|---|---|
| who authors | muse-spark-1.3 via the **Meta Model API** (strict `json_schema`) | **Muse Code under its subscription** (same model, no API call) |
| what it cost | **$44.09** of credit, 371 receipted calls, 16/16 sections | **$0** on the credit; subscription tokens only |
| what is identical | strict schemas (`schemas-strict/`), compensating checks (`tools/belt/checks/`), append-only ledger, lineage caps, acceptance policy | same |
| why both | per-call receipts make the audit trail legible; subscription authoring makes 50 states affordable | |

Per-section spend fell from $11.54 (the first section, where the conventions were learned) to $2.17 average over the other
fifteen — `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md` has the full table and the 50-state projection.

## What the belt is

```text
15 register the handbook (pages, hashes, liveness)
02 dossier — 9 parts per handbook section (facts with page anchors, confusables, exam facts, debts, DoD matrix)
16 deterministic compile → fact index (every FACT_ID → accepted wording + spoken form + page)
03 knowledge graph (modules, prerequisites, high-yield set, confusables)
04 flashcards (back == accepted wording, byte-exact; SRS tiers)
06 exam bank (4-option items, rationales, 2 practice forms, module quizzes; no numeral without a verified fact)
05 teaching sessions (6–8 slides, worked example, misconception, self-check) + 4-movement card narration scripts
```

Each stage is a strict-mode JSON schema plus compensating checks the model cannot talk its way past. A HOLD costs one
attempt and teaches the conventions (`schemas-strict/output-conventions.json`); an accepted artifact is immutable and
ledgered (`runs/<run>/ledger/run.sqlite`, append-only events, micro-USD reservations per attempt).

## Narration audio (not a Meta model)

Meta has no text-to-speech. Narration is **pre-generated** with the Nova fleet recipe — OpenAI `gpt-4o-mini-tts`, voice
`nova`, unhurried pace — by `tools/audio/mint-utah-audio.mjs`, which reads only the ledger-accepted exports: 335 lesson
slides, 374 cards × (question / shared think cue / answer / teaching), 48 recaps. 1,509 clips, dry-run estimate $7.54,
zero failures, coverage gate 0 missing (`app-preview/audio/audio-manifest.json`, sha256 per clip). The app plays files
only; nothing is synthesized live. The app says so on screen.

## Proof, not claims

- `app-preview/trace.html` — the live trace: every attempt, its cost, its checks, accepted vs held, per section.
- `runs/2026-10-26-rdmv-ut-class-d/` — approvals, receipts, lineage resets, reconciliations, `jams.md` (what went wrong and when).
- `runs/2026-10-27-rdmv-ut-class-d-muse/` — the $0 subscription-authoring run (same handbook, same validators).
- `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md` — product cost (belt, from the ledger) kept apart from operator cost (subscription).
- `coordination/MUSE-*-REPORT.md` — Muse's own reports per launch, including what she could not verify.

## Honest limits

- Content is **belt-validated, audit pending**: the independent fact/coverage auditors (roles 07/08) are not part of the pilot; the app says so on every screen.
- Narration is OpenAI TTS, not Meta; spoken recall is Meta (Muse Voice Transcribe) and costs cents.
- The handbook PDF stays private (`runs/**/sources/private/`, gitignored); only page anchors and authored text are published. Subscription packets carry handbook text, so they live there too.
- Subscription authoring is slower than the API (it runs inside Muse's usage window); that is the trade for $0.
- Real-microphone recall and real-ear audio review were not machine-verified; the harness covers plumbing and coverage.

## Run it

```bash
npm install
node tools/preview/serve.mjs 4310               # app + spoken-recall proxy at http://127.0.0.1:4310 (needs MODEL_API_KEY in .env)
node tools/preview/static-serve.mjs 4310        # app only, no network
node tools/preview/verify-learner.cjs           # DOM harness: content, wording, audio coverage, voice checks
node tools/belt/run-fixtures.mjs                # 81 validator fixtures, no model calls
node tools/audio/mint-utah-audio.mjs            # narration dry run (prints clip count + $); --go to mint (OPENAI_API_KEY)
```

Belt, Model-API mode: `muse exec --prompt-file coordination/MUSE-FULL-HANDBOOK-BRIEF.md …` (needs `MODEL_API_KEY`, a
run-config and a standing authority artifact). Belt, subscription mode: one step per call —
`node tools/belt/run-utah.mjs --run runs/<run> --author muse --sections <id>` emits a packet (exit 3), Muse authors it,
the same command ingests it (`coordination/MUSE-SUBSCRIPTION-AUTHORING-BRIEF.md`).

## Credits and lineage

Belt contracts and controller: Sol (GPT) for Nova; validators, runner, conventions, audio adapter and subscription mode:
Claude (Fable 5.1) as runner; operation, app, spoken recall and subscription authoring: Muse Code (muse-spark-1.3).
Founder: Sridhar Varadarajulu. Nova's own factory, 65 live stores and the V1 corpus are **not** in this repo and were
never sent to the Meta API.
