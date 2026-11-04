# PassLearnersPermit — 51 driver handbooks → 51 courses in 8 days, on one belt

**Meta Global AI Developer Hackathon, indie track · Oct 26 – Nov 3, 2026 · one human, five model lanes, one assembly line.**

- Live: **https://passlearnerspermit.com** — chapter 1 free in every state, $9.99 for one state for one year.
- Demo (2:58, the lanes tell it in their own words): **https://youtu.be/T_3b0C4A2uk**
- What shipped: **255,145 files · 188 GB** at the edge — 4,987 HD lesson videos, 234,656 narration clips, 37,967 flashcards,
  36,234 quiz items, 1,490 practice forms, 723 verified illustrations, 93 federal road signs, 50 states + DC. Every frame of it
  was made inside the event (`coordination/R2-LEDGER.md`, `coordination/DATASET-SEAL-2026-11-02.md`).

> No human wrote a card. Every learner-facing sentence traces through a ledger to one model attempt, its request, its raw
> response, the validator receipt that accepted it, and the handbook page it cites. The founder read only the mechanics,
> and he was the only gate.

This repo is the lane: the belt, the receipts, the lanes' own reports, the store, the submission package. The media is not
here (it is 188 GB and lives in Cloudflare R2); the handbook PDFs and every key are not here either.

---

## The belt

The belt was a contract before it was code. For each handbook chapter there are seven strict JSON schemas
(`schemas-strict/`), a compensating check for each (`tools/belt/checks/`), and one rule: an artifact exists only once a
validator has accepted it and the ledger holds its receipt (`runs/<run>/ledger/`). Models could try as often as the lineage
cap allowed. Nobody talks past a schema.

```text
15 register the handbook (pages, hashes, liveness)
02 dossier — 9 parts per section (facts with page anchors, confusables, exam facts, debts, DoD matrix)
16 deterministic compile → fact index (every FACT_ID → accepted wording + spoken form + page)
03 knowledge graph (modules, prerequisites, high-yield set, confusables)
04 flashcards (back == accepted wording, byte-exact; SRS tiers)
06 exam bank (4-option items, rationales, practice forms, module quizzes; no numeral without a verified fact)
05 teaching sessions (slides, worked example, misconception, self-check) + 4-movement card narration scripts
```

One Utah card, every attempt behind it, and the check that accepted it: `app-preview/trace.html` (served by
`node tools/preview/static-serve.mjs 4310`). An accepted artifact is immutable; the ledger is append-only with micro-USD
reservations per attempt (`runs/<run>/ledger/run.sqlite`).

## Muse — Meta's model did the three jobs that mattered

| role | what happened | receipt |
|---|---|---|
| **Author** | `muse-spark-1.3` authored **Utah** end to end through the **Model API** in strict `json_schema`: dossier → fact index → knowledge graph → cards → exam bank → teaching sessions. 16/16 chapters, **371 receipted calls, $44.09**. Then **nine more states** (TX CA FL NY VA KY OK CT IA) as **Muse Code under its subscription**: the belt emits the exact bound request as a packet, Muse authors it, the same validators ingest it — **$0 API**, 1.04 B operator tokens. | `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md`, `runs/2026-10-27-rdmv-ut-class-d-muse/`, `coordination/MUSE-TOKEN-LEDGER.md` |
| **Fact-checker** | Every compiled fact in all 51 states — **38,074** — re-read against only the page it cites, in strict JSON, with no vision. **664 flags: 444 meaning errors, 184 citation errors, 4 flat contradictions**; the 443 cards built on bad facts were hidden at point of sale and then surgically re-authored. Before the pass was trusted, three number swaps were planted in clean facts; it caught 3 of 3 with no false flags. | `coordination/FACT-CHECK/TRIAGE.md`, `coordination/FACT-CHECK/<ST>/report.md` (CT line 58 is the blowout-braking contradiction), `coordination/MUSE-API-SPEND.jsonl` |
| **Picture inspector** | Every illustration judged against five drawing rules (text, right-hand traffic, signal lenses, scene completeness, geometry): **636 verdicts, 610 approved, 72 rejected** and re-painted. A pickup on the wrong side of the yellow line is in `coordination/IMAGE-CHECK/held.html`. | `coordination/IMAGE-CHECK/results/`, `scratch/terra-dataset/national-fleet-700-visual-catalog.json` `summary.review_tally` |
| **Sign painter + judge** | `muse-image-1.0` painted the 93 federal (MUTCD) road signs; `muse-spark-1.3` judged them: 89 accepted, 4 withheld; meanings checked against the handbooks: 73 supported, 4 corrected. The free Road Signs module in every state is built from this set. | `coordination/SIGNS/qa-report.md`, `coordination/SIGNS/factcheck-report.md`, `app-preview/signs/` |
| **Operator, builder, reviewer** | `muse exec` ran the belt (`tools/belt/run-utah.mjs`) and wrote an operator report after every launch; Muse wrote the no-framework learner app in `app-preview/` and its own DOM harness (`tools/preview/verify-learner.cjs`, 22,592 routes). Spoken recall grades a learner's answer through **Muse Voice Transcribe** (parked at the freeze). | `coordination/MUSE-FULL-HANDBOOK-REPORT.md`, `coordination/MUSE-VOICE-RECALL-REPORT.md` |

Meta Model API, all purposes: 3,099 calls, $58.71 (`coordination/MUSE-API-SPEND.jsonl`).

## The other lanes, in their own words

Each lane that executed the belt wrote its own story; the demo video is cut from them. They are in
`coordination/DEMO-STORIES/` and the script that quotes them is `submission/VIDEO-SCRIPT.md`.

| lane | model | what it did on the belt | its story |
|---|---|---|---|
| **Fable** (coordinator) + Opus workers | Claude | Wrote the validators, runner and conventions; verified every lane's output independently (the drop-off watcher: 51/51 READY, 0 sha mismatches); Opus workers wrote dossiers for 16 states and downstream for all 50 non-Utah states; sealed and uploaded the dataset. Authored no card. | `coordination/DEMO-STORIES/fable-coordinator.md` |
| **Sol** | GPT | Built the v0.4.0 controller (strict JSON adapters, source hashes, every attempt recorded before advancing); authored 22 states' dossiers (first ten: 2,612 accepted attempts); the store's local mode. | `coordination/DEMO-STORIES/sol-gpt.md` |
| **Argon** | Gemini | Surgical post-fact-check fixes across 41 states (370 targets, $0 authoring, $5.82 of Meta checking, original author preserved); 234,656 narration clips on offline Piper at $0; 4,987 1080p lesson videos (385 h); the 51-state decks and the store frame; the hash-sealed CDN drop-off. | `coordination/DEMO-STORIES/argon-gemini.md` |
| **Terra** | GPT (image) | Painted scenes, not states: one catalog of 748 canonical scenes mapped onto every slide and card in 51 states; every picture went through Muse's review; 723 verified pictures ship. | `scratch/terra-dataset/` |

Nova's own factory, its 65 live stores and the V1 corpus are **not** in this repo and were never sent to the Meta API.

## What went wrong, on the record

Nine numbered bugs, each with what fixed it: `coordination/BUGS/INDEX.md`. Among them: rejected pictures still served
(BUG-001), the shared CDN bundle missing its boot files (BUG-003, caught by the independent watcher), 116 lesson videos
rendered before the picture library was final (BUG-008, all re-rendered and re-hashed). Nothing was hand-edited to close
a bug; the belt was re-run.

## The thesis, by design

- **No human reviewed the content, and that is the point.** A model wrote it, a second model pass re-read every fact
  against its cited page, a validator the model cannot argue with decided what exists, and every decision left a receipt.
  Meta's model was the one trusted to check everyone's work. The founder reviewed mechanics, never content, and the app says
  on every screen exactly what checked it.
- **Nothing is generated while a learner is in the room.** Every clip, picture and card was produced on the belt and
  hash-sealed before the learner arrives; the store plays files. The same money that would have bought one live session
  bought a permanent dataset.
- **The source stays sovereign.** The handbook PDFs never leave the private run folders; what ships is the page anchor and
  the authored, validated text, so every sentence can be checked against the page it cites, by anyone.
- **The human sets the frame, not the facts.** Store copy, prices and the free tier were the founder's. Everything else was
  an artifact that passed a check or did not exist.

## The dataset is the product

| | |
|---|---|
| state payloads | 254,314 files, 188.29 GB (18,509 free / 235,805 paid), hash-sealed per state (`coordination/DATASET-SEAL-2026-11-02.md`) |
| shared bundle | 831 files, 132.4 MB (scenes, embedded JS, fonts, signs) |
| upload | 255,145 / 255,145 files present in R2, 0 missing, 0 mismatches, md5-checked per state after upload (`coordination/R2-UPLOAD-STATUS.md`, `coordination/R2-LEDGER.md`) |
| serving | `passlearnerspermit.com/app/*` from a Cloudflare Worker over the bucket: free = section 01 of every state, paid behind the gate |
| store | Next.js on Vercel, Clerk auth, Stripe one-time checkout; `store/` (runs locally with no keys: `store/README.md`) |

## Run it

```bash
npm install
node tools/preview/static-serve.mjs 4310        # the learner app + trace.html, no network
node tools/preview/verify-learner.cjs           # Muse's DOM harness: counts, byte-exact wording, audio coverage
node tools/belt/run-fixtures.mjs                # 81 validator fixtures, no model calls
```

Belt, Model-API mode: `muse exec --prompt-file coordination/MUSE-FULL-HANDBOOK-BRIEF.md …` (needs `MODEL_API_KEY`, a
run-config and a standing authority artifact). Belt, subscription mode: `node tools/belt/run-utah.mjs --run runs/<run>
--author muse --sections <id>` emits a packet, Muse authors it, the same command ingests it
(`coordination/MUSE-SUBSCRIPTION-AUTHORING-BRIEF.md`). The demo video pipeline is `demo/` (Playwright captures, ffmpeg
assembly, per-lane narration; `submission/VIDEO-SCRIPT.md` has the rows).

## Submission package

`submission/SUBMISSION.md` (copy), `submission/EVIDENCE.md` (every number → file), `submission/CONTRIBUTORS.md`,
`submission/VIDEO-SCRIPT.md`, `submission/REPO-PUBLIC-CHECKLIST.md` (the secrets and media sweeps run before this repo went public).

Founder: Sridhar Varadarajulu (DataPig LLC). Belt contracts: Sol (GPT). Validators, runner, coordination: Claude (Fable 5.1,
Opus workers). Operation, authoring, fact-check, vision, signs: Muse (Meta). Media and store frame: Argon (Gemini). Scenes: Terra (GPT).
