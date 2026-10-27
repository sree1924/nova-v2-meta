# Belt orchestration handoff → Sol (founder order 2026-10-26 evening: "give pass on belt to sol")

From Claude Code (session 2bdcad95, schema/post-validator owner). Sol now owns **orchestration**: the controller,
ledger, Meta client, task envelopes, Role 15 registration, and the run `runs/2026-10-26-rdmv-ut-class-d/`.
Claude keeps `schemas-strict/**`, `tools/belt/post-validate.mjs` (+checks/fixtures/tests), `tools/belt/probe-strict.mjs`,
`tools/meta-smoke.mjs`, and the reviewer role. Muse Code = operator (runs your commands in her sandbox) + builds
`app-preview/`. Meta Model API = the measured generator. Nobody approves their own output.

## Founder decisions tonight
- **State = Utah.** Class D regular passenger-car, first-time never-licensed path, English. Intake with sources is in
  `runs/2026-10-26-rdmv-ut-class-d/run-config.json`. `passing_percent` is **unknown** (not on dld.utah.gov) — resolve from the PDF or keep null.
- **Tonight = dry test, then start Utah.** Dry test = `npm run smoke` + `node tools/belt/probe-strict.mjs`. Then Role 15 → 02 (one chapter) → validate.
  A full belt pass tonight is not realistic; first stages with provenance are.
- The build window opened **today** (Oct 26); everything in this folder is event-time work.

## What exists for you to call (do not re-implement)
| Piece | Path | Interface |
|---|---|---|
| Adapters (10) | `schemas-strict/<stage>.schema.json` | send as `response_format.json_schema.schema`, `strict:true`; names/paths in `schemas-strict/stage-map.json` |
| Post-validator | `tools/belt/post-validate.mjs` | `import { validateArtifact } from '../../tools/belt/post-validate.mjs'` → `validateArtifact({stage_id, artifact, context})` → `{status PASS|FAIL|HOLD, checks[], errors[], metrics}`; CLI `--stage --artifact [--context]`, exit 0/1/2 |
| Context contract | `schemas-strict/CONVENTIONS.md` §"Check contract" | keys: `accepted_inputs`, `fact_registry`, `source_registry`, `candidate_manifest`, `input_manifest_sha256`, `media_disposition`, `learning_loop`, `intervention_lineage`, `overlay`, `policy`, `finish_criteria`, `exam_facts_view`, `now_utc` (checks never read the clock) |
| Mapping + required checks | `schemas-strict/<stage>.mapping.json`, `mapping-manifest.json` | every mapping names its `compensating_check` ids; your wrapper already parses them |
| Fixture contexts (examples of a full context) | `tools/belt/fixtures/<stage>/*.context.json` | copy the shape for real runs; `{"$load": path}` resolved by `tools/belt/lib/fixture-context.mjs` |
| Strict-acceptance probe | `tools/belt/probe-strict.mjs [--stage id]` | one tiny call per adapter; writes `evidence/strict-probe-*.json`; **run this before any content call** |
| Smoke | `npm run smoke` | first provenance record; `evidence/smoke-*.json` |
| Hash lib | `tools/belt/lib/hash.mjs` | `sha256File`, `sha256Bytes`, `canonicalJson`, `sha256Canonical` (matches your header canonicalization) |
| Receipt | `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json` `7bbab6f8…` | already `PINNED_EXECUTED_RECEIPTS_PRESENT` in your checker; pin the ten `schema_sha256` into prompts |

## What you build (controller lane)
1. `tools/belt/controller.mjs` — sequential; reads run-config; `node:sqlite` ledger (`runs/<run>/ledger/run.sqlite`, WAL, synchronous FULL;
   tables runs/tasks/attempts/model_calls/artifacts/events/reservations); claims `EXECUTOR.lock.md` with your actual executor id;
   refuses to dispatch while `execution_enabled:false` or `spend_mode:dry_run` without `--go`.
2. Task envelope per C17 + your `prompts/controller-header.template.json`; render with `tools/render-request.mjs`; persist attempt **before** the call.
3. Meta client: `https://api.meta.ai/v1/chat/completions`, `Authorization: Bearer $MODEL_API_KEY`, `response_format` = adapter,
   `max_completion_tokens`, `reasoning_effort`; record returned `model`, `usage`, latency, retries, `finish_reason`; `(verify)` any
   `length` finish as truncation → route_back, never accept. Reserve cost before, reconcile after (C29).
4. After every artifact: write temp → fsync → rename → `validateArtifact` → commit acceptance+event in one transaction → next task.
   HOLD/FAIL never advance. Keep the full raw response as an artifact file; ledger references it by hash.
5. Role 15 (script, tool_assisted): hash the local PDF (`sources/private/Driver-Handbook-2026.pdf`), page count, front-matter
   edition/effective date/notice verbatim, build the page map, write `15-source-registry.json` and a `source-liveness` receipt
   (`contracts/source-liveness-receipt.schema.json`) with `retrieved_at` = tonight. The PDF is never copied outside `sources/private`.
6. Stage 02 for **one chapter** (your pick with the founder; text-first, not road signs), validated through
   `02.dossier_sections`; then 16/17 scripts, then 03. Stop there tonight unless everything is green and the founder says go on.
7. Static trace page from the ledger (stage · role · model · usage · USD · elapsed · attempts · human edits · artifact hash).

## Order of operations tonight
`.env` key (founder) → `npm run smoke` → `node tools/belt/probe-strict.mjs` (fix any REJECTED_400 with me — adapter edits are my lane) →
Sol pins hashes + seals 0.4.0 → Role 15 on Utah → founder `--go` → 02 chapter → validate → 16/17 → 03 → validate → stop, report.

Everything paid is gated on the founder's `--go`. Contributor-tier models are prohibited. Nothing outside this folder is written.
