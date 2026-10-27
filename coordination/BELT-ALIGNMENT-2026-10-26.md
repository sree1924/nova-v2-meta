# Belt alignment — Sol builds, Claude runs (founder order, 2026-10-26 ~00:10 MDT 10-27)

Read by Sol (builder) and Claude (runner). Founder: "u run the belt... sol makes belt... fix the belt with better
instruction first u and sol align then we can start." This is that alignment. Format: **where** · **current** · **target** · **owner**.
Nothing paid runs until every S-item is closed and the founder's `--go` is recorded as an artifact (A2).

**What's good in Sol's build (keep):** ledger discipline (WAL/FULL, `BEGIN IMMEDIATE`, append-only events/artifacts triggers,
integer micro-USD, reservation → model_call → settle), `runArtifactTask` (persist → validate → independent accept → single
acceptance transaction, fixture-meta rejection, recovery of saved output), `createMetaClient` (no retries, unknown-result
code, strict adapter required, bound token cap), `sanitizeModelInput` safe view, prompt hash-drift guard (and the ten
`schema_sha256` pins are now in the prompts — verified). Role 15 resolved the Utah passing score: **80%**, PDF p33 (§6.A).

## S — Sol (builder) must close before Claude runs

| # | Where | Current | Target |
|---|---|---|---|
| S1 | `tools/belt/controller.mjs:131-137` | `--go` **always throws** "requires a separately reviewed bound-task activation"; there is no dispatch path. `runArtifactTask` and `createMetaClient` exist but nothing wires produce→validate→accept. | Implement `dispatch --run-config <p> --executor-id <id> --stage <stage_id> [--section <id>] [--go]`: resolve dependencies (accepted upstream artifacts by stage order), assemble **context** per `schemas-strict/CONVENTIONS.md` §Check contract (see S6), render request via `renderRequest` with `mode:'production'` (or `'qualification'` for 04), reserve budget (`max_call_usd`, pricing ref), `recordModelCall dispatching`, call `metaClient.complete`, settle with reported usage (micro-USD from the pricing snapshot), save raw response as an artifact, parse `choices[0].message.content` → artifact, `validate` = `validateArtifact({stage_id, artifact, context})` from `tools/belt/post-validate.mjs`, `requiredChecks` = the stage mapping's compensating check ids, `accept` = S8. `finish_reason !== 'stop'` or HTTP ≠ 200 → `failAttempt` with the raw body saved; never parse a truncated body. |
| S2 | `tools/belt/execution-policy.mjs:5-30` + `contracts/execution-authority.v0.4.0.json` | Authority is a single global file: `content_calls_authorized:false`, `run_id:null`, `approval_ref:null`. No per-stage scope. | Authority becomes **per-run, per-stage, artifact-bound**: `runs/<run>/approvals/GO-<stage>-<ts>.json` (founder's words verbatim, recorded_by, stage_id, section ids, usd ceiling for this go, `content_calls_authorized:true`) written by the runner when the founder says go in chat; policy verifies `run_id` match, stage match, ceiling ≤ run caps, file hash. The global file stays `DRY_RUN_ONLY` and is no longer consulted for live dispatch once a per-stage approval exists. |
| S3 | `tools/belt/controller.mjs:55` vs run dir | Controller expects `15-source-registry.json`, `15-page-map.json`, `15-source-liveness.json` in the run dir; the run actually has `15-source-registry.json`, `receipts/source-liveness-*.json`, `role15-findings.json`, page map embedded in the registry (written by an earlier path). | One convention: re-run Role 15 **through** `--register-sources` so the three canonical files exist and are ledger-recorded; remove or quarantine the ad-hoc `role15-findings.json`/`trace.html` (or record them as superseded). |
| S4 | `tools/roles/15-register.mjs:204-219` | By design never sets `issuer_current_edition_ref` / `effective_date`; liveness stays `VERIFICATION_DEBT`, which makes 08 HOLD forever under `source-fact-policy.freshness`. | Consume the runner-supplied **`receipts/issuer-current-edition-confirmation.json`** (exists now: dld.utah.gov/learner-permit fetched and hashed; it links the exact PDF URL; handbook snapshot sha pinned) → set `issuer_current_edition_ref {path,sha256}`; keep `effective_date: null` with the recorded disposition ("edition current per issuer page on <date>; no single effective date stated; front-matter law dates are contextual"). Liveness `status: CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT`. 08's freshness check accepts that status with the dated receipt. |
| S5 | `tools/belt/controller.mjs:89` `planned_only_stages: ['16.compile','17.enrich',…]` | 03 would consume the 02 envelope with no compile/enrich step. | Deterministic 16 = `mergeEnvelopes`/`mergeSections` from `tools/belt/checks/02-dossier-sections.mjs` (already exported, byte-reproducible) producing the 03 input + fact registry (fact_id → text, section, pdf_page); 17 = pass-through hint enrichment or explicitly `n/a_pilot` in the overlay. Record whichever in `contracts/pilot-overrides-v0.4.0.json`. |
| S6 | (new) context assembler | None. Checks HOLD without context. | `tools/belt/context.mjs` building, per stage: `accepted_inputs` (by stage), `fact_registry` (from S5), `source_registry` (15), `input_manifest_sha256` (canonical hash of the accepted-input refs), `media_disposition`, `overlay`, `policy`, `finish_criteria`, `exam_facts_view` (from `sanitizeModelInput`), `now_utc` (controller clock, passed in — checks never read a clock), `intervention_lineage` (prompt authorship + any human edits), `candidate_manifest` for 07/08/09. Shapes: copy `tools/belt/fixtures/<stage>/*.context.json`. |
| S7 | `EXECUTOR.lock.md` (run dir) vs `tools/belt/executor-lock.mjs:8-14` | On-disk lock is a plain `holder:` record held by `01a17a94…`; your `readExecutorLock` requires a ```json block``` and `acquire` refuses on EEXIST. | When S1–S6 are done: release your lock; Claude acquires through your tool with `--executor-id 2bdcad95-d4cc-467e-a88d-be4a6260cf03`. No age heuristics; explicit handover only. |
| S8 | acceptance for tonight | `accept` is required but undefined for 02. | For 02 tonight: `accept` = `{status: validation.status==='PASS' && every mapped check PASS ? 'PASS' : 'HOLD', kind:'deterministic_validation_only', auditors:'pending 07/08'}`. Label it so nobody reads "accepted" as "audited". 07/08 acceptance (two non-Meta providers) is a later task. |
| S9 | `tools/roles/15-register.mjs:18` | Hard path to a Codex-runtime Python with pypdf/pdfplumber. | Acceptable tonight; record as an environment dependency in the registry's `decoder`; fallback is Muse's `tools/belt/pdf-text.mjs` (per-font ToUnicode CMap). |

## C — Claude (runner) — done or does now

| # | Item | Status |
|---|---|---|
| C1 | run-config: `candidate_lineage_id`, `limits.per_role_usd_caps`, `limits.max_completion_tokens: 8000` | **done** (your policy required them) |
| C2 | `receipts/issuer-current-edition-confirmation.json` — dld.utah.gov/learner-permit fetched, hashed, links the exact handbook URL, snapshot sha pinned | **done** (input to S4) |
| C3 | Records each founder `go` as `approvals/GO-<stage>-<ts>.json` (S2), flips `execution_enabled`/`spend_mode` for that dispatch only, runs `dispatch`, runs `post-validate` independently of the controller's own call, reports status + USD per stage, flips back. | at go time |
| C4 | Pins the founder's credits/card choice as `producer.billing_mode` | awaiting founder |
| C5 | Validates every artifact; never edits controller code; files jams to `jams.md` | continuous |

## First paid run plan (after S1–S8)
1. Section pick for 02: **one text-first chapter** — proposed "Right-of-way" (or whatever the page map names it); not road signs.
2. Founder: "go 02" + credits/card → C3 writes the approval → `dispatch --stage 02.dossier_sections --section <id> --go`.
3. `post-validate` → PASS → 16 (merge) → 03 → validate → **stop, report** (cost, tokens, elapsed, checks). 04 qualification is a separate go.
4. Everything that FAILs/HOLDs is reported with the check ids; no retry beyond `max_automatic_attempts (2)`; no gate lowered.

Open founder decisions: credits vs card (C4); which 02 section.
