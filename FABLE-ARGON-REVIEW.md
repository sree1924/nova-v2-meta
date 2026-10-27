# v0.4.0 final review snapshot — 2026-10-27

**Review only. No belt/content calls.** Sol S1–S8 implementation and offline source registration are complete for handoff. The final owner04 mapping/collector compatibility defect is closed: the receipt suite passes 41/41, qualification predicates 24/24, owner tests 215/215 and fixture outcomes 81/81. The refreshed owner receipt is `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json`, SHA-256 `788950f6ebde2cbca7daebfbb6729fec340b20509fb93d31be1ca842e42eeb05`, with 46 matching implementation-closure files. The original correction request remains history at `coordination/CLAUDE-04-MAPPING-COMPATIBILITY-v0.4.0.md`. Do not interpret these local results, a hash seal, metadata acceptance or binding-integrity PASS as qualification or execution readiness.

Start with `coordination/S1-S8-VERIFY-v0.4.0.md`, `FB-DISPOSITION-v0.4.0.md`, `verification/LOCAL-TESTS-v0.4.0.json` and `verification/BUNDLE-VERIFY-v0.4.0.json`. Utah is confirmed, billing is credits, global authority remains DRY_RUN_ONLY, model_calls0, reservations0, lock released. Production chapter selection and stageGO remain absent. Review the positive collector metadata and the negative missing-source-guard result, alongside the retained pre-repair failure evidence. Roles 09/19/19A/21 remain planned executors; actual qualification and lineage-eligible independent audits remain pending.

The following earlier review brief remains context; this dated status supersedes older pending-owner, state-open, and no-controller/no-ledger statements.

# Fable and Argon Review Instructions

Version 0.4.0. Prepared October 26, 2026, America/Denver. **REVIEW ONLY; EXECUTION DISABLED.** Fable's actual v0.3.0 report is preserved unchanged with verdict REVISE. No v0.4.0 reviewer verdict is implied.

## Review objective

Challenge the proposed Nova V2 production belt and RDMV pilot as engineering contracts before implementation. Identify contradictions, missing responsibilities, unverifiable claims, failure modes, excessive scope and tests that cannot establish the stated result. Review against exact files and clause IDs; do not replace the project with a different concept.

The proposed pilot is regular non-commercial passenger-car driver's license written-test preparation. The state remains open; legacy candidate paths select no state. Planned implementation remains sequential control, SQLite, structured original teaching, two lineage-eligible distinct audit families, free dev preview and a separate reviewer trace. The animated floor remains deferred. This is package preparation only. Runtime independence excludes a family that authored the scoped candidate or its authoring prompt; named provider seats are not proof of eligibility.

## Read order

1. `REVIEW-BUNDLE.json` version 0.4.0, superseding 0.3.0, and every actual target hash. Check its declared missing owner targets/receipt status separately; a missing Claude deliverable is not a valid hash or a completed fix. Stop on changed pinned bytes; never silently re-pin them. The old manifest and all19old primary targets remain under `review-history/v0.3.0/`.
2. `reviews/FABLE-CONTRACT-REVIEW.md` and `FB-DISPOSITION-v0.4.0.md`, then `BELT-V2-CONTRACT.md`, section0/C01–C75. Distinguish actual local fixes from acceptance still awaiting Claude's adapter/post-validator receipts.
3. `RDMV-EXECUTION-BRIEF.md` and `RDMV-RUN-CONFIG.template.json`.
4. `contracts/bot-contract-bindings.json` and `tools/check-bot-contracts.mjs`. Read the full pinned canonical contracts for responsibilities under review; excerpts are not replacement contracts.
5. Local TeachingUnit/UiSpec schemas, media/finish/override/source policies, prompt-authorship pins, the ten reusable role bodies and separate controller header. Read frozen criteria, pending binding template, evidence-required report schema and qualifier. The historical road-sign rubric filename is now an index; first qualification is text-first, not a claimed image-recognition task.
6. The actual Claude adapter files, mapping manifest, post-validator and `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json` if received. Follow `CLAUDE-V0.4.0-SCHEMA-HANDOFF.md`; do not duplicate that lane or create a receipt in Claude's name. Then read the locked legacy candidate config and old fix packet as history. State stays open and the roster stays27/20.
7. Current local `AGENTS.md`, `INSTRUCTIONS.md`, `ENV-SETUP.md`, `RULES-REVIEW.md` and `BOARD.md` as context, then the parent manifest/belt/indexes/full relevant role contracts. These are source/context, not implementation receipts.

The bundle manifest hashes the review targets and lists contextual inputs separately. A target change after review requires a new version/hash and a declared delta review. Historical approvals cannot be moved onto new bytes.

## Local verification

Use the existing `D:/nova` workspace. The checker requires Node and read-only access to canonical `D:/nova/factory/` and `D:/nova/schemas/`. No dependency installation, credentials, model call, RabbitMQ instance or SQLite service is required for this configuration review. A separate public checkout without the pinned parent contracts cannot reproduce this check; that export remains an implementation/package requirement, not a completed capability.

From `D:/nova/fb-ai-hackathon`, run:

```text
node tools/check-bot-contracts.mjs
node tools/check-bot-contracts.mjs --run-config runs/2026-10-27-rdmv-tx-class-c/run-config.json
```

Run without `--write` or `--refresh-floor`: preserve all target bytes. Record both exit codes and actual outputs. Integrity can pass while execution remains NOT_READY_FOR_EXECUTION; missing owner adapters/receipts, state/source binding, qualification, lineage-eligible audit assignments and scripts remain explicit prerequisites. A configured model, planned script or schema filename is not executed evidence. The legacy candidate's proposed budgets/numerals are not authorized facts: verify the safe model-input policy strips unverified values. Neither run configuration confirms a state or grants spend.

Allowed local deterministic tests, all without model/network/controller/SQLite work:

```text
node --test tests/review-v0.4/sanitize-model-input.test.mjs tests/review-v0.4/render-request.test.mjs tests/review-v0.4/source-contracts.test.mjs
node --test tools/tests/check-audit-independence.test.mjs
node qualification/test-v04.mjs
```

These are synthetic interface/validator tests, not the three future controller fault tests or qualification. Do not run the definition generator, smoke script, belt or provider calls. Check criteria bytes remain unchanged by binding fills; a null PASS and omitted held-out facts must fail. Inspect the actual owner receipts for provider adapters and their post-invariants rather than treating these local tests as substitutes.

Optional dashboard parity uses an explicitly supplied `NOVA_FLOOR_PREVIEW_PATH`; it is not a pilot acceptance requirement. The old animated floor is retained/deferred, not updated or connected by this package. Neither a design preview nor a provider shirt proves an executed worker or audit. No model call, controller/SQLite service or qualification task is part of this review.

## Fable review focus

- Fidelity to full inherited contracts and explicit pilot applicability: retain the full workforce/history while distinguishing inactive 20A/media/sales work, distinct active 05 tasks, 19A grouping and blocking 07/08 acceptance.
- The difference between knowledge decompression, the proposed new DMV product and the reconstructed existing-probe application. Identify exactly which instruction needs reconciliation.
- The pruned `dmv-permit` intake disposition, state/licence/age/path/version fields, source rights and unknown baseline. Do not assume any has been resolved.
- Teaching craft and measurable acceptance: why/how, examples, misconceptions, assessments and visible/audio consistency.
- The separation of role, model, service and artifact; no missing seat, invented role 26, or claim that a written contract is an installed service.
- All 47 seats, 46 unchanged canonical pins plus local UI, actual 27 active/20 inactive, stage specializations, state-open binding and full-contract inheritance. Challenge proposed 02/19A/07/09 schema/media adaptations explicitly.
- Public contribution attribution, claim discipline, retained release authority and the limited later sales handoff.

## Argon review focus

- Sequential task identity, stable deduplication, single-writer ownership, bounded attempts and uncertain provider outcomes; do not demand deferred broker/distributed mechanics as pilot receipts.
- SQLite WAL/FULL, artifact/ledger transaction boundaries and crash reconciliation; inspect which larger outbox/ACK/fencing clauses are explicitly deferred.
- Correct transition ownership, budget reservations, uncertain provider outcomes, bounded retries and restart behaviour.
- Two candidate seals, scoped QA reports, exact-revision audit joins, stale evidence invalidation and independent retesting.
- Static trace event truth, usage/cost availability and misleading completion; animated live/replay/reconnect work remains deferred.
- Adequacy of the three active fault tests, preservation of twelve deferred tests, permitted write/tool envelope and public-export boundaries.
- Registry/contract/schema hash drift, exact bot/stage identity, missing-schema dispositions, default checker reproducibility and the separation of integrity from execution readiness.

Both reviewers should also challenge the other's area where evidence warrants it. These are complementary review assignments, not a claim that either model inherently has the required capability.

Keep the first passes independent: each reviewer seals their own report before reading the other report. Compare findings afterward and retain any disagreement with its evidence.

## Required finding format

For each actionable finding provide:

| Field | Required content |
|---|---|
| Finding ID | Stable reviewer-prefixed ID |
| Severity | Blocking, major or minor, with effect explained |
| Location | File hash and clause/section |
| Failure | A concrete scenario in which the contract fails or misleads |
| Evidence | Exact contradiction, source, dependency or reproducible test |
| Repair | A bounded change preserving the intended scope |
| Acceptance | What observation would close the finding |

Also return an overall verdict: `PASS_FOR_IMPLEMENTATION`, `PASS_WITH_NONBLOCKING_FINDINGS`, or `REVISE`. State the reviewed scope and exclusions. Unknown intake values can remain explicit configuration requirements; an unresolved authority/architecture contradiction must not be hidden inside a PASS.

Each report records actual reviewer/model identity, date, v0.4.0 target hashes, FB-01–FB-20 disposition/evidence, inspected inputs, real checker/test outputs, integrity/readiness conclusions and unexecuted checks. Disclose any contributed targets; self-authored targets require an untouched reviewer for independent acceptance. A missing owner receipt remains pending. A new verdict cannot select a state, approve spend or transfer v0.3.0 acceptance onto revised bytes.

## Specific questions to answer

1. Can an executor determine every legal next step without asking the founder routine questions mid-run?
2. Does every successful stage have a real output, validation evidence and an appropriate consumer?
3. Can any crash, duplicate, stale lease or missing provider result create fake acceptance or unaccounted spend?
4. Can an old content PASS be mistaken for testing newer application code?
5. Can the same role's repeated phase be incorrectly deduplicated or skipped?
6. Can three model opinions outvote a source-supported defect or hide the same missing input?
7. Can the static trace invent completed work, hide unavailable usage or imply that the deferred animated floor is operational?
8. Is the RDMV source, rights and syllabus boundary sufficient for the claims the product will make?
9. Which capability is required for the first complete product, and which should stay outside the pilot?
10. What is the single most likely reason this contract would fail during a live demonstration?
11. Can any bot execute with a stale or missing contract/schema, a missing phase assignment or an unqualified model because binding integrity was mistaken for readiness?
12. Do the two active audit providers and inactive Google seat preserve 07/08 ownership, B1 independence, candidate boundaries and evidence requirements without implying a majority-vote truth gate?

## Review boundaries

Review targets and implementation are read-only. The actual assigned reviewer may create or update only their own designated report under `reviews/`; they must not edit the other reviewer's report or the contract being assessed. Do not run paid production calls, modify shared contracts or products, initialize/push a repository, deploy, publish, claim credits, operate real payments, or alter the canonical manifest. Proposed revisions belong in findings until the founder directs the next work. The current task requested a review-ready contract, not an implementation run.

Use `reviews/FABLE-CONTRACT-REVIEW-v0.4.0.md` and `reviews/ARGON-CONTRACT-REVIEW-v0.4.0.md` for actual new reviews. Never overwrite the original Fable report. First passes stay independent; a later disposition records each finding's evidence and scope. Do not represent implementation as ready while blocking owner evidence is absent.

## Claude implementation judgment requirements

These requirements apply to the later implementation handoff; they do not authorize implementation now.

1. Apply the founder's latest constraints: regular passenger-car written prep is fixed, state selection remains open, and this package is review only. A fix packet cannot override them or turn a proposed timestamp into permission to start.
2. Recompute quantities and inspect dependencies. Report the 27/20 role split and combined KG semantics; never force results to the packet's erroneous 23/24 expectation.
3. Read full pinned contracts and schemas. Make 02's prose/compiler split, 19A's tooling policy, 07's media exception and 09's preview-only adapter explicit. Do not fabricate production `shipped`, audio, strict-schema or qualification passes to satisfy a field.
4. Distinguish configured, planned, implemented, qualified and observed execution. `(verify)` debt, a candidate model ID, a planned script, an absent projection or a proposed budget is not supporting evidence. Validate the actual endpoint/tool/price/source before its later use; no credential inspection is needed for this package.
5. Preserve the sealed target bytes, existing run lock and protected parent surface. A necessary correction produces a declared revision and verification output; never silently re-pin 0.2.0/0.3.0 or overwrite another executor's run.
6. Keep the animated floor in the contract as deferred work. Build no broker, animated runtime, prod auth/checkout or sales work under this pilot profile. Do not execute the belt, qualification, paid smoke or provider call during package preparation.

## Handoff prompts

Fable:

```text
Review D:/nova/fb-ai-hackathon/REVIEW-BUNDLE.json version 0.4.0 following FABLE-ARGON-REVIEW.md. Verify every primary target hash, inspect section0/C01–C75, FB-01–FB-20 dispositions, local schemas/policies, separate body/header, frozen criteria/binding/report definitions and ten prompts, and run both read-only checker commands. Report each FB finding’s actual fix/acceptance evidence and pending owner outputs, preserve the state-open/review-only constraints and inspect the Claude judgment requirements. Apply the Fable focus while reporting any other evidenced defect. Keep your first pass independent of Argon. Write only D:/nova/fb-ai-hackathon/reviews/FABLE-CONTRACT-REVIEW-v0.4.0.md with your actual model identity, inspected hashes, findings, checker output, readiness distinction, exclusions and verdict. Do not edit reviewed files or start implementation.
```

Argon:

```text
Review D:/nova/fb-ai-hackathon/REVIEW-BUNDLE.json version 0.4.0 following FABLE-ARGON-REVIEW.md. Verify every primary target hash, inspect section0/C01–C75, FB-01–FB-20 dispositions, local schemas/policies, separate body/header, frozen criteria/binding/report definitions and ten prompts, and run both read-only checker commands. Report each FB finding’s actual fix/acceptance evidence and pending owner outputs, preserve the state-open/review-only constraints and inspect the Claude judgment requirements. Apply the Argon focus while reporting any other evidenced defect. Keep your first pass independent of Fable. Write only D:/nova/fb-ai-hackathon/reviews/ARGON-CONTRACT-REVIEW-v0.4.0.md with your actual model identity, inspected hashes, findings, checker output, readiness distinction, exclusions and verdict. Do not edit reviewed files or start implementation.
```
