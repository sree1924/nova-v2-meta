# NOVA V2 — a Meta-operated production belt for exam-prep (Meta Global AI Developer Hackathon, Oct 26 – Nov 4, 2026)

**What this is.** One lane of NOVA — a one-person AI agent factory that shipped 65 exam-prep stores / 130 learning
"probes" between June and October 2026 — rebuilt so that **Meta's `muse-spark-1.3` executes the factory's role
contracts** and every step is visible: what the model was asked, what it returned, what it cost, and what accepted or
rejected it. The pilot product is **probe #66: a regular passenger-car written-test prep store, one state at a time,
starting with Utah.**

**What this is not.** Not a chatbot, not RAG over a handbook. The handbook is *fact authority only* — nothing from it
is reproduced; every learner-facing sentence is original, cites a page, and is checked by code and by non-Meta auditors.

## How it is made (the belt)

```
intake → 15 source registry (handbook hash, page map, liveness) → 02 SME dossier → 16 merge → 03 knowledge graph
→ 04 flashcards → 05 teaching units (why/how · worked example · misconception · memory hook · self-check) → 06 practice
exam → 19A curriculum units → 05 card scripts (ask → silent recall → answer → hook) → 07 coverage audit → 08 fact audit
→ 09 package → dev preview
```

- **Roles** are bounded contracts (inputs, outputs, definition of done, failure conditions). The active roster and each
  contract's pinned SHA-256 + excerpts: `contracts/bot-contract-bindings.json`. The canonical contract files live in the
  private NOVA repository and are referenced here by hash.
- **Meta Model API is the measured generator** (`muse-spark-1.3`, standard tier, strict JSON output). Prompts:
  `prompts/*.md` (bodies hashed; controller header rendered separately).
- **Strict adapters** (`schemas-strict/`) are the provider-facing JSON schemas, each a *pilot adapter* of a parent NOVA
  schema; every parent rule the strict subset cannot carry is restored as a named deterministic check
  (`tools/belt/post-validate.mjs`, 190+ checks across 10 stages). `schemas-strict/README.md` lists all 192 restored
  invariants.
- **Controller** (`tools/belt/controller.mjs`): sequential, `node:sqlite` ledger (WAL/FULL, append-only events,
  integer micro-USD), attempt persisted *before* every call, artifact → validate → independent accept in one transaction.
- **Audit** is by two non-Meta provider families; a generating model never approves its own output; a session that
  touched the candidate is disqualified from auditing it (`tools/check-audit-independence.mjs`).
- **Evidence**: `evidence/` (live smoke + strict-mode acceptance probe), `verification/` (fixture runs, tests, receipts),
  `coordination/` (hand-offs between the three agents: Sol/GPT builds, Claude validates, Muse Code operates + builds the
  preview), `reviews/` (independent contract review).

## Honest status

See `coordination/` for the current state. Execution is gated: no paid call runs without a per-stage founder approval
artifact; the checker (`node tools/check-bot-contracts.mjs --run-config runs/<run>/run-config.json`) prints every
blocker. "PASS" from local tools means *local deterministic validation*, never provider acceptance or a belt result.

## Reproduce the local checks (no API key needed)

```
npm install
node tools/belt/strict-lint.mjs                 # adapters obey Meta's strict-mode subset
node tools/belt/run-fixtures.mjs                # 81 fixtures incl. V1-citizenship projections and 9 negatives
node --test tests/belt/<stage>.test.mjs         # per-stage suites (211 tests)
node tools/check-bot-contracts.mjs --run-config runs/2026-10-26-rdmv-ut-class-d/run-config.json
```

With `MODEL_API_KEY` in `.env`: `npm run smoke` (one call) and `node tools/belt/probe-strict.mjs` (one tiny call per
adapter; ~$0.05 total).

## What is deliberately not here

`.env`, the Utah handbook PDF (`sources/private/`, fact authority only — fetch it from dld.utah.gov), raw model
responses, and NOVA's other lines, manifest and master prompt.

Contributors: Sridhar Varadarajulu (founder, architecture, gates) with Claude Code (Anthropic), Sol (GPT) and
Muse Code (Meta) as named agents; each agent's work is logged under its own identity.
