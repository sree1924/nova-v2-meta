# How Nova operates — briefing for Muse Code (and any coding agent in this folder)

Written 2026-10-26 by the founder's Claude Code session for Meta's Muse Code, which joined for the
Meta Global AI Developer Hackathon (build window 2026-10-27 → 2026-11-04). You are a *new* agent on an
operating factory. This file is the gist; the depth is in the files it points to. Read before acting.

## 1. The thesis (why this exists)

Nova is a one-person **AI agent factory** for exam-prep products. The frame is **inversion**: the human
is an *async resolver of artifacts*, never a live gate; LLM agents do the work inside bounded, schema-bound
role contracts; everything is filesystem-first — **a stage that wrote no file didn't happen.**
V1 produced 130 learning "probes" grouped into 65 stores. The canonical manifest records 20 online stores / 59 probes; production is distinct from verified online deployment. Built June–Oct 2026.
Examples: passmycitizenship.com · passmycna.com · passradtech.com · cdlexamcoach.com · passcosmetology.com.

Founder = Sridhar (enterprise architect). Terse lowercase messages = speed, not imprecision. He reviews
**mechanics, never content**; LLMs verify LLMs. He wants findings first, unflattering ones first, and to be
called out when work drifts into planning instead of state change. Planning is not traction.

## 2. The belt (the master process)

Authority: `D:/nova/factory/THE-BELT.md` (12 stages, raw cert → finished product). One line:

```
raw cert → 01 viability → 01b recon → 02 SME blueprint (+15 sources) → 16 compile → 17 enrich
→ 03 knowledge graph → {04 cards ∥ 05 sessions ∥ 06 exam} → 19A unit map
→ 05 scripts → 20B prosody → 20 audio → 07 coverage + 08 fact QA (both PASS) → 09 publish
→ 21 bundle+tenant → B5/B6 present at a URL → 22 success bar → ⛳ launch → signal → allocate
```

Every numbered token is a **role** with a contract in `D:/nova/factory/workers/NN-*.md` (what it consumes,
what it produces, which JSON schema in `D:/nova/schemas/` the output must validate against).
Rails wrap every step: 12 Registrar · 13 Schema Steward · 14 Validator (after every artifact) · 15 Evidence
Librarian · 18 Dynamic Facts · 19 Learning Science. `D:/nova/tools/validate-artifact.mjs` is the validator.

A probe's artifacts live in one run directory: `D:/nova/runs/<date>-<probe>/` — e.g. the citizenship
reference: `runs/2026-06-11-citizenship/` with `02-blueprint.md`, `03-knowledge-graph.json`,
`04-carddeck.json`, `05b-session-scripts.json`, `06-exambank.json`, `19-learning-loop.json`,
`20-audio-manifest.json`, `15-source-registry.json`, `07-coverage-report.json`, `08-fact-report.json`,
`09-product-package.json`. Status comes from `D:/nova/factory/factory-manifest.json` — never from file presence.

The learner loop every product implements: **session (narrated lesson) → memory hook → flashcards → hub → test**.
Audio is pre-generated narration (OpenAI TTS, paid per clip), never live TTS.

## 3. Floor laws (non-negotiable)

1. **Contracts are frozen during a run.** Friction = a jam logged to `jams.md`, never a stop, never an edit
   to the contract. Changes to `factory/`, `schemas/`, `sme-library/`, the manifest, or `tools/` need a root
   `AMENDMENT-ORDER*.md` with an `APPROVED-BY:` line (enforced by `tools/floor-guard.mjs`).
2. **Belts are isolated.** One probe = one run dir = one executor. Write only inside your own run dir.
3. **Concurrency is governed.** Minting requires holding `runs/<run>/EXECUTOR.lock.md`
   (`node tools/take-lock.mjs <run-id>`). Everyone else reads.
4. **Zero wrong facts.** Cite-or-`(verify)`. Official/issuer sources pass; everything else is flagged.
   Never fabricate. Primary-source weighting is load-bearing (domain weights come from the issuer blueprint).
5. **Money never moves without an explicit `--go`.** Minters default to a dry-run cost estimate.
6. **No new probes, no new roles, no new planning documents** when the ask is a state change.
7. **Shipped + reviewed trees are frozen** (prod freeze on the 65 stores). Patches go to v2 via the belt.

## 4. What this folder is (your lane)

`D:/nova/fb-ai-hackathon/` is the **only** place hackathon code and docs live. The founder's later direction
selects the DMV pilot and bot-contract assignments as the current **review-package** scope. This supersedes
the earlier existing-probe scope for preparation; it does not authorize a production run, catalog mutation,
spend or publication. Preserve the reconstructed application as historical context. Read:
- `SOL-BELT-FIX-PACKET-2026-10-26.md` — requested F1–F9 changes, subject to the founder's later constraints.
- `reviews/FABLE-CONTRACT-REVIEW.md` and `FB-DISPOSITION-v0.4.0.md` — preserved v0.3.0 review and per-finding revision evidence.
- `CLAUDE-V0.4.0-SCHEMA-HANDOFF.md` — Claude monitors this schema/post-validator lane; return actual outputs through `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json`. Sol does not duplicate it.
- `runs/2026-10-27-rdmv-tx-class-c/run-config.json` — read-only provisional Texas candidate owned by its existing lock holder; the state is not selected.
- `REVIEW-BUNDLE.json` and `FABLE-ARGON-REVIEW.md` — versioned review targets and independent review instructions.
- `BELT-V2-CONTRACT.md`, `RDMV-EXECUTION-BRIEF.md`, `RDMV-RUN-CONFIG.template.json` and
  `contracts/bot-contract-bindings.json` — proposed DMV belt and assignments; configuration is not execution.
- `INSTRUCTIONS.md` — historical application scope: NOVA V2 = a controlled evaluation of Meta models inside the belt.
  One existing V1 probe → frozen baseline → Meta generates a *deeper* learning unit (why/how explanations,
  worked examples, misconception correction, aligned assessment) → independent verification → side-by-side.
- `RULES-REVIEW.md` — event rules as read 2026-10-26 (what must be built during the event, public repo,
  3-min video, scoring: impact 30 / Meta tooling 25 / engineering 20 / demo 25).
- `ENV-SETUP.md` — Model API facts: base `https://api.meta.ai/v1`, key env `MODEL_API_KEY`, model
  `muse-spark-1.3`, structured-output strict-subset rules, prices, rate limits.
- `tools/meta-smoke.mjs` — the first provenance-recording call (`npm run smoke`).

Current review revision v0.4.0 locks **regular non-commercial passenger-car written-test preparation**, with state
selection left for later. It is **review only**, with execution disabled. The sequential/SQLite/static-trace
profile is proposed implementation scope; two lineage-eligible distinct audit families are required, with
provider names/eligibility still pending. GPT-authored production prompts disqualify OpenAI for that scope.
Google stays parked until an explicit qualified assignment; fewer than two eligible families holds execution.
The animated floor remains in the contract as deferred work. Nothing here authorizes running the belt.
Claude's implementation handoff must satisfy the judgment requirements in `FABLE-ARGON-REVIEW.md`: resolve
instruction conflicts, use actual counts, inspect full contracts, preserve evidence/debt and never treat
configured/planned/qualified/executed as interchangeable states.

Separation that the experiment depends on: **measured generator = Meta Model API** calls made by code in
this folder, with full provenance (model, prompt hash, raw response, usage, latency, cost). **You and Claude
Code are engineering assistants** — logged separately, never the thing being measured, and a generating
model never approves its own output.

## 5. Do / don't

- DO read anything under `D:/nova` to understand it. DO reuse schemas and validators read-only.
- DO keep stable content IDs, source references, and model provenance on everything you generate.
- DON'T modify `D:/nova/factory`, `schemas`, `sme-library`, `tools`, `app`, `runs/*` of existing probes,
  or any deployed store. DON'T run `D:/nova/app` dev/build scripts (prehooks regenerate live tenants).
- DON'T commit, push, deploy, or publish anything — the founder owns those gates.
- DON'T put credentials, account state, or customer data in any file here; `.env` is gitignored.
- DON'T use `muse-spark-*-contributor` for Nova content (Meta may train on it); standard `muse-spark-1.3`.

## 6. How you'll be judged here

Same bar as every agent on this floor: did a file land, does it validate, is every fact sourced, is the cost
recorded, and could a stranger reproduce it from the run directory alone. Narration is not completion.
