# Claude schema lane — v0.4.0 / FB-01 and FB-02

Status: **REQUESTED THROUGH THIS WORKSPACE ARTIFACT; NO RECEIPT RECEIVED**. The founder asked that Claude monitor this handoff while Sol finishes the parallel package changes.
Prepared October 26, 2026, America/Denver. User explicitly assigned schema adapters and deterministic post-validation to Claude under F10. Sol is changing contracts, prompt bodies/headers, qualification interfaces and review packaging in parallel. This file does not claim that a message reached the external Claude Code session.

## Boundaries and ownership

- Work only inside `D:/nova/fb-ai-hackathon/`. Parent `D:/nova/factory`, `schemas`, `tools`, manifest, accepted products and parent runs are read-only.
- **Do not run the belt, smoke, qualification, generation, provider calls, services, ledger or preview.** Local deterministic schema/fixture tests are in scope. Execution remains false, state selection stays open, Texas remains provisional, and the animated floor stays in the contract as deferred work.
- Claude owns `schemas-strict/**`, the adapter mapping README/manifest, `tools/belt/post-validate.mjs` and its deterministic fixture tests/receipts. Do not edit Sol's ten prompts, contracts, qualification criteria, UI schema, bot checker/registry or bundle; return hashes and interfaces so Sol can pin them.
- Sol's qualification worker owns `qualification/**`, `contracts/teaching-unit.schema.json` and `tools/qualify-04.mjs`. Sol's UI/checker worker owns `contracts/ui-spec.schema.json`, the local UI contract, `tools/check-bot-contracts.mjs` and audit-independence checks. Consult those actual files rather than inventing a parallel TeachingUnit or UiSpec shape.
- The existing candidate run is owned by its current lock holder. No run mutation is requested by this handoff.

## Read first

1. `reviews/FABLE-CONTRACT-REVIEW.md`, especially FB-01/02 and cross-cutting FB-03/08/09/10/11/13/15/16/18.
2. `BELT-V2-CONTRACT.md` and `FB-DISPOSITION-v0.4.0.md` when present. These are being revised; request the final target hashes before sealing a receipt.
3. Full pinned parent contracts and schemas; all ten current `prompts/*.md` bodies.
4. `contracts/teaching-unit.schema.json`, `contracts/ui-spec.schema.json`, frozen qualification criteria and binding-instance template when present. These are dependencies, not permission to rewrite their owners' files.

## Required ten adapter outputs

Retain the existing prompt reference names to avoid gratuitous interface changes:

| Stage | Local adapter schema |
|---|---|
| 02 | `schemas-strict/02-sme-dossier-envelope.schema.json` |
| 03 | `schemas-strict/03-knowledge-graph.schema.json` |
| 04 | `schemas-strict/04-carddeck.schema.json` |
| 05.sessions | `schemas-strict/05b-session-scripts.schema.json` |
| 05.card_scripts | `schemas-strict/05-voicescripts.schema.json` |
| 06 | `schemas-strict/06-exambank.schema.json` |
| 07 | `schemas-strict/07-coverage-report.schema.json` |
| 08 | `schemas-strict/08-fact-report.schema.json` |
| 09 | `schemas-strict/09-product-package.schema.json` |
| 19A | `schemas-strict/19a-curriculum-unit-map.schema.json` |

Use **pilot adapter**, not a claim of mathematical subset compatibility, wherever the payload meaning differs from the parent. Record each parent hash, each exact field/rule deviation, its local overlay authority and its compensating validation. No fabricated counts, weights, image-scout success, audio provider, deployment or canonical `shipped` status.

## Required mapping and invariant coverage

1. Unknown official exam count/weights/thresholds use nullable values plus status and source evidence. Keep authored pedagogic emphasis/product policy distinct. Verified-looking numerals with `(verify)` or missing official page evidence must fail publication/learner acceptance. Legacy candidate hints are not authorized facts.
2. 02 wraps section-wise prose while preserving role 16 compilation; bounded A–G chunks and deterministic merge prevent a whole-handbook string from truncating. Require explicit needs-dedicated-surface, high-yield, corpus-stability and blocked/debt outputs.
3. 03 preserves typed department evidence, source-bound confusables, edge origins and domain-emphasis checks. Null official weights cannot force fabricated numbers.
4. 04 remains a fact converter. Use an explicit `deferred:not_applicable_pilot` media disposition instead of inventing an ImageScoutPlan. Validate exact accepted back/hook fidelity, spoken form, source refs and deterministic SRS policy. Structured decompression lives in 05 TeachingUnit, not authored card backs.
5. 05.sessions adapts the owned TeachingUnit schema with fact-tagged spans and numeric depth metrics. 05.card_scripts exposes ordered question/think_ref/recall_pause_ms=3000/answer/teaching segments; answer equals accepted card back and teaching matches the accepted hook. No spoken stage directions.
6. 06 is an explicit practice-only pilot overlay when official mirror facts are unknown. Every item binds objective/page/fact IDs, answer/rationale agreement and option rationales. Never represent an authored practice setting as an official rule.
7. 07/08 echo exact `candidate_sha256`; input hashes must match their scoped candidate manifest. Extend legitimate route-back targets to include 02/13/15/08 where applicable. Reports require evidence, severity and unresolved-debt handling; every assigned scoped report must PASS, with no unresolved blocking finding. No majority-vote acceptance.
8. Text-only media disposition and early UI media intent are explicit artifacts. Missing or mismatched disposition blocks applicable acceptance. A late UISpec cannot retroactively supply 07's early media policy.
9. 19A includes module_hub and hub_options, pins mastery policy to LearningLoop, caps pilot status at preview_only, and computes integrity deterministically. Reject production_ready with orphans, fabricated counts or missing refs.
10. 09 exposes `pilot_status: preview_ready|blocked` plus status_reason. A legacy parent status may remain blocked with an honest scoped reason; it must not hide the pilot's successful preview. Reject an active OpenAI audio provider while role 20 is inactive. No auth/checkout/deployment/audio claims.

List **every** dropped parent conditional/allOf invariant in `schemas-strict/README.md` and a machine-readable mapping manifest. Restore it in a named deterministic check with tests. Provider keyword support is unverified until actual endpoint qualification; local schema validity alone must not claim provider acceptance.

**Hash-boundary correction:** author outputs created before the final content seal use `input_manifest_sha256` plus `candidate_lineage_id`; do not embed the digest of the final manifest that will contain that output. Only post-seal 07/08 reports echo the final `candidate_sha256`. TeachingUnit uses `{schema_version, input_manifest_sha256, candidate_lineage_id, source_registry_sha256, units[]}` as specified by the owned local schema. Candidate manifests never include their own digest or downstream QA reports in their hashed body. Qualification binding instances pin header templates; the rendered header and committed binding event live in the later report, avoiding another hash cycle.

**First-qualification scope:** v0.4.0 uses a text-first selected-state chapter for the first 04 qualification. No state/chapter is selected yet. Road-sign/image qualification is a later distinct task requiring Role 15's bound sign-intake/rights/applicability evidence. `contracts/sign-asset-intake.schema.json`, its unbound template and the verbal-cue media disposition supply the contract; they are not an actual sign list or visual-recognition PASS.

## Requested post-validator interface

Expose a pure, read-only validation function from `tools/belt/post-validate.mjs`. Prefer:

```text
validateArtifact({stage_id, artifact, context})
  -> {status: PASS|FAIL|HOLD, checks:[{check_id,status,evidence}], errors:[], metrics:{}}
```

`context` supplies accepted inputs, source/fact registry, candidate manifest, applicable schema/mapping hashes, media disposition, LearningLoop, actor/provider-family intervention lineage and policy references. No network, generation or hidden ledger writes. The CLI may read explicitly supplied fixture files and print JSON only; test receipts are separate files under the owned schema/test lane.

If an existing interface is more suitable, record its exact import/export/CLI contract in the receipt before Sol integrates it. Do not make Sol guess an undocumented entry point.

## Acceptance and receipt

Provide:

- Ten schema files and their SHA-256 values; parent pins unchanged.
- Mapping README/manifest hashes, named compensating checks, script/API hash and per-adapter validation receipts.
- A projected V1 reference fixture per adapter, labelled as a fixture/reference rather than a DMV production result. Preserve input hashes and transformation decisions. Where a V1 artifact is inapplicable, report HOLD rather than manufacturing provenance; add a clearly synthetic interface fixture separately.
- Negative tests: unknown weights with no fabricated number accepted in the adapter; production_ready+orphans rejected; inactive audio provider rejected; source-debt numeral leak rejected; mismatched candidate hash rejected; to_worker02 accepted in the adapter; five-slide lesson rejected; card answer/hook/segment mismatch rejected; preview_ready represented honestly.
- Actual commands, exit codes, per-check observed outputs and unexecuted checks. No model/endpoint or belt success claim follows from these local tests.

Write the receipt to `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json` with actual author/session/model identity, target hashes, output paths/hashes, test commands/results, deviations and remaining gaps. Sol will validate the returned bytes and integrate the pins. FB-01/02 remain pending until the actual files and required evidence exist.

The run configuration points to that receipt through `execution.adapter_validation_receipts_ref:{path,sha256}`. Its hash stays null until your real receipt exists. Each adapter's receipt must bind the actual schema and fixture hashes; file presence plus a schema pin alone is not an adapter-validation receipt.

The current integration checker expects `adapter_receipts[]` (or `schemas[]`) entries with `{schema_ref,schema_sha256,validation:{status:"PASS",executed:true,evidence_ref:{path,sha256}}}`, plus `post_validator:{path:"tools/belt/post-validate.mjs",sha256,api_mapping:[{prompt_path,exported_function},...]}` covering all ten stage prompts. These are actual receipt fields, not pre-filled successes. If your implementation uses a different documented shape, return it explicitly for integration rather than inventing matching fields.

**09 acceptance boundary:** `pilot_status:preview_ready` has `status_scope:content_package`, meaning accepted for isolated local assembly after07/08/UISpec/joins. A later application-QA/finish receipt binds the immutable package/code/config bytes. Do not require09 to consume B1's later result or rewrite the package after B1; that would create a hash/dependency cycle. The static finish-criteria file defines both scopes before either task.

## Live integration notes after the first owner files appeared

Sol inspected `CONVENTIONS.md`, the dispatcher and stage map read-only. The asynchronous `validateArtifact({stage_id,artifact,context})` API and stage names match; no alternate post-validator is being built.

1. **Actual raw-result shape:** keep your API. Our qualifier will consume the saved result (`status`, `stage_id`, `checks`, `errors`, `metrics`; CLI `artifact_sha256`; `metrics.adapter_schema_sha256`) inside a collector-written metadata wrapper. You do not need to add our older top-level hash aliases to your dispatcher.
2. **Qualification stage boundary:** `04.qualification` is the logical assignment; `04.cards` is the artifact-validation stage. Our binding/receipt interface is being adjusted to distinguish them. The specific mapping pin is `schemas-strict/04-carddeck.mapping.json`.
3. **Fixture stripping:** production/qualification validation must default to `strip_fixture_meta:false` and reject unexpected `_fixture`. Explicit stripping is for identified reference fixtures only. The initial dispatcher stripped by default, whereas the convention described a narrower fixture-path exception. Please align the owner implementation before its final receipt; Sol will not edit that file.
4. **No aggregate-only acceptance:** every compensating check named by the mapping must appear in the result with PASS, alongside the schema check. A missing mapping/check or an empty check-module result cannot establish a complete PASS. Our qualification receipt reader will also check this coverage for04.
5. **Implementation closure:** receipt pins must cover stage map, adapters, mappings, check modules, imported libraries and package/lockfile dependencies, in addition to the dispatcher. A changed check module cannot reuse a validator-only digest.
6. **Official versus authored numbers:** unverified official values stay null/unknown; authored emphasis or practice settings belong in explicitly labelled product-policy fields. An `authored` status must never promote an official count/weight/passing line.
7. **Existing local metrics:** `tools/qualify-04.mjs` exports `measureTeachingUnits`; it may be reused by your05checks rather than duplicated. Frozen criteria and report-schema bytes stay unchanged while the separate receipt wrapper/binding interface is aligned.

These notes are integration requirements for the final owner receipt, not claims about completed owner checks or permission to execute the belt.

**Local integration freeze handshake:** Sol is finishing the collector reader's actual04mapping/API-snapshot alignment. Frozen criteria/report-schema bytes stay unchanged, but `tools/qualify-04.mjs` and its metadata wrapper are still being finalized. Before taking the final implementation-closure snapshot, check `coordination/SOL-INTEGRATION-READY-v0.4.0.json` for their final hashes. Tests can proceed in the meantime; rerun affected local tests and seal against the matching final bytes. This prevents an otherwise valid owner receipt from immediately becoming stale because an imported helper was still changing. Sol will not modify your owner files.

## Final integration feedback — receipt received 2026-10-26 23:04:46 UTC

The original receipt is preserved byte-for-byte at `coordination/history/CLAUDE-SCHEMA-RECEIPT-v0.4.0-2026-10-26T230446Z.json`. Local shared helpers are now held steady: `coordination/SOL-INTEGRATION-READY-v0.4.0.json` has the final hashes. Please finish these already-requested integration requirements and refresh your owner receipt, tests and closure:

1. The receipt closure pins `tools/check-audit-independence.mjs` to old `7f70b657...`; actual final hash is `3d1f580da26e14bdc41b0be9110b34b525fc4b1b1f26bbcfe07fcbc19eb616df`. The final guard prevents human/issuer/script provenance from being counted as model auditors. Reconsume READY and refresh closure rather than reverting the guard.
2. Dispatcher still uses `context.strip_fixture_meta !== false`, stripping `_fixture` by default. Default must retain/reject unexpected metadata; explicit identified fixture calls may opt in. Add a negative default/production test plus an explicit fixture positive test.
3. Dispatcher currently aggregates whatever checks a module returns without enforcing mapped mandatory check coverage. Load the stage mapping, require every named compensating/schema check exactly once with a valid status, fail/HOLD on missing/duplicate/unknown mandatory dispositions, and add negative tests showing missing mandatory results cannot PASS. Existing mapping special dispositions must be handled narrowly and explicitly, not through broad waiver.

Sol will independently rerun the local synthetic suites and owner tests, then integrate and seal the review-only bundle. No belt/models/DB/spend authorized. Sol will not edit your owner files or receipt.

## Founder-authorized controller build — current dry-only boundary

Founder directly told Sol: "finish our side.. build controller sqlite ledger and role 15 registration, coordinate claude fixes and seal v0.4.0.. keep it dry run no content calls till i say go". Sol is implementing only orchestration/ledger/local Role15 registration plus deterministic tests. Muse owns app-preview. No smoke, strict probe or content API calls are part of Sol’s work; existing smoke/strict receipts are read-only evidence.

Your owner lane remains the previously listed two dispatcher corrections plus exact-byte receipt/closure refresh against SOL-INTEGRATION-READY-v0.4.0.json. Do not duplicate the controller or ledger. Please return your refreshed receipt after the controls/tests actually pass. The current receipt is still stale, contrary to the newer orchestration handoff’s claim that it is already accepted. Sol will not overwrite owner code/receipt or silently waive either required control.
