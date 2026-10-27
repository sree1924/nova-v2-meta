# S1–S8 implementation and verification — v0.4.0

Sol build handoff; Claude runs; Muse builds preview. Builder session `01a1764d-cf44-7fc1-a31f-bf0be7852006`. Runner session `2bdcad95-d4cc-467e-a88d-be4a6260cf03`. **Zero actual model calls and zero reservations.** Lock released. This seals a review snapshot, not full belt readiness.

**Remaining owner blocker:** final `qualification/test-post-validation-receipt.mjs` exits1;04mapping no longer activates mandatory dated-source collector checks. See [Claude correction request](CLAUDE-04-MAPPING-COMPATIBILITY-v0.4.0.md). No failed check waived.

## S1 — IMPLEMENTED_LOCAL_TESTS_PASS

Dispatch prepares accepted/hash-bound inputs, production envelope, capped reservation, dispatching call, raw response and reported usage; only HTTP200/stop content reaches validation. Saved-output replay and unknown-result holds tested.

Code: `tools/belt/controller.mjs:261`, `tools/belt/dispatch.mjs:69`.

Verify output: 148 controller tests pass; final02 dry preflight PASS, render_only true, proposed USD1 reserved:false; model_calls0.

## S2 — IMPLEMENTED_LOCAL_TESTS_PASS

Per-run/stage GO file verifies exact hash, founder words, section IDs and USD ceiling; cumulative stage caps atomically reserved. Global authority remains DRY_RUN_ONLY.

Code: `tools/belt/execution-policy.mjs:28`, `tools/belt/ledger.mjs:162`.

Verify output: Controller policy/ledger fixtures pass. Actual approval absent; approval_policy BLOCKED with explicit_go_absent; zero reservations.

## S3 — REGISTERED_METADATA_ONLY

Canonical Role15 source registry/page map/liveness generated through controller registration and ledger-recorded. Exact legacy SQLite, original lock, ad-hoc findings and old trace quarantined privately with hashes.

Code: `tools/belt/controller.mjs:95`, `tools/roles/15-register.mjs:95`.

Verify output: Actual ledger:15.sources accepted(metadata only),10queued tasks,1native attempt,1legacy import,0calls/0reserves. Overall registration HOLD.

## S4 — IMPLEMENTED_WITH_EXPLICIT_DEBT

Dated exact rendered issuer DOM evidence consumed; current edition ref set; effective date null with accepted disposition; CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT. Overall registration remains HOLD; no rights/factual audit fabricated.

Code: `tools/roles/15-register.mjs:257`, `tools/belt/checks/08-content-facts.mjs:1`.

Verify output: Registrar tests pass; owner215 tests pass inclS4compatibility. Source/liveness canonical hashes recorded.

## S5 — IMPLEMENTED_SYNTHETICALLY_VERIFIED

Deterministic16 uses owner mergeEnvelopes/mergeSections, resolves exact fact spans into fact registry and CompiledDossierPilot for03.17 is n/a_pilot in pinned overlay.

Code: `tools/belt/compile.mjs:72`, `tools/belt/controller.mjs:158`.

Verify output: 5compile tests pass within148. No real02accepted artifact exists, so no actual16content compiled.

## S6 — IMPLEMENTED_SYNTHETICALLY_VERIFIED

Assembles accepted inputs, fact/source registries, canonical input manifest, media/overlay/policy/finish criteria, safe exam facts and intervention lineage; controller passes now_utc.

Code: `tools/belt/context.mjs:93`, `tools/belt/context.mjs:236`.

Verify output: 6context tests pass within148; actual02 dry context complete (preflight PASS).

## S7 — RELEASED_HANDOVER_READY

This builder chosen:01a1764d-cf44-7fc1-a31f-bf0be7852006. OtherSol01a17a94 must write nothing further. Exact old lock archived using founder explicit handover. Builder released; Claude2bdcad95-d4cc-467e-a88d-be4a6260cf03 acquires through standard native lock on authorized operation.

Code: `tools/belt/executor-lock.mjs:16`, `tools/belt/reconcile-legacy.mjs:1`.

Verify output: Actual ledger ownership released; EXECUTOR.lock.md absent. Claude has NOT been claimed to have acquired it. No age heuristic.

## S8 — IMPLEMENTED_LOCAL_TESTS_PASS

02accept requires validation PASS plus every unique mapped check PASS and no errors; kind deterministic_validation_only, auditors pending07/08. No audit acceptance implied.

Code: `tools/belt/dispatch.mjs:129`, `tools/belt/artifact-task.mjs:1`.

Verify output: Acceptance, missing/duplicate check, malformed/truncated provider response, idempotence and recovery fixtures pass; no real02content accepted.

## Commands and observed outputs

See `verification/LOCAL-TESTS-v0.4.0.json` for actual commands/output. Controller148/148, review30/30, qualification predicates24/24, owner215/215. Fixture81/81 expected outcomes matched (13PASS/59FAIL/9HOLD; not81accepted candidates). Receipt regression exits1 and remains blocking.

Actual commands:

```powershell
node tools/belt/finalize-dry-build.mjs --reconcile-legacy --run-config runs/2026-10-26-rdmv-ut-class-d/run-config.json --executor-id 01a1764d-cf44-7fc1-a31f-bf0be7852006 --python C:/Users/varad/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe
# DRY_RUN_COMPLETE; model_calls:0; reservations:0; lock released
node tools/belt/controller.mjs dispatch --run-config runs/2026-10-26-rdmv-ut-class-d/run-config.json --executor-id 01a1764d-cf44-7fc1-a31f-bf0be7852006 --stage 02.dossier_sections --section pdf:33
# DRY_DISPATCH_ENVELOPE; preflight PASS; approval BLOCKED; model_calls:0
node tools/check-bot-contracts.mjs --run-config runs/2026-10-26-rdmv-ut-class-d/run-config.json
# binding_integrity PASS; PINNED_EXECUTED_RECEIPTS_PRESENT; LISTED_HASHES_MATCH_ONLY
# NOT_READY_FOR_EXECUTION remains true
```

`pdf:33` is an interface verification page, not a selected production chapter. Current config uses credits and pins latest owner receipt. Ledger preserves mint-time config2545810a… for provenance; an authorized live dispatch performs explicit hash-bound rebind without erasing history. Do not re-run finalizer on the healthy native ledger.

Global authority stays DRY_RUN_ONLY. NoGOartifact exists. Role15 metadata acceptance is not factual/liveness acceptance. Independent OpenAI+Anthropic API audits are intended; actual prompt/intervention lineage must pass the independence policy (OpenAI prompt ancestry currently prevents assuming eligibility). A Claude Code session touching the candidate cannot count as an independent auditor. Animated floor remains deferred.
