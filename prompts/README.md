# Prompt bodies and controller headers — v0.4.0

This is a review-only package. No runtime request, qualification, provider call or belt work has been performed. Execution stays disabled; state selection remains pending and the animated floor remains deferred.

## Two separately pinned inputs

The ten numbered Markdown files are mode-independent role bodies. Their metadata pins the full canonical contract and parent schema; any pilot adapter deviation is named by the bound overlay. They contain no package-level REVIEW ONLY instruction and do not grant execution authority.

controller-header.template.json is separate controller input. It defaults to mode review, execution_authorized false and unbound references. It records mode, scope, task, body identity, input bindings, intervention/candidate lineage, actor/provider identity, qualification and spend evidence. Only the controller renders an actual header after checking genuine applicable authority and every required binding. Filling a template, changing its mode or setting a boolean cannot create authority. The current file is not a rendered-request receipt.

For qualification or production the selected state/source/rights and task bindings must resolve to actual accepted files/hashes; unresolved references hold dispatch. The controller must use a normalized model-facing exam-fact view: {value,status,source_page}; unverified or page-unbound values become unknown/null. It never sends raw numeric hints with a detached verification-status sibling as accepted facts.

## Exact hash contract

1. A body is UTF-8 without BOM and uses LF line endings. Its final line is prompt_template_sha256: <64 lowercase hex characters>.
2. template_body_sha256 hashes every byte BEFORE that final footer line, including the body's terminal LF. The footer's own LF is excluded.
3. body_file_sha256 hashes the entire Markdown file including the footer and its LF. REVIEW-BUNDLE.json pins whole files.
4. header_sha256 hashes the actual rendered header serialized as recursive lexicographically sorted object keys, compact JSON, UTF-8/no BOM, and no terminal newline. Reject non-finite numbers, unsupported values and duplicate-key inputs.
5. The rendered request bytes are the ASCII prefix NOVA-REQUEST-v1 followed by LF, the serialized header, LF, and the exact body bytes without footer. rendered_request_sha256 hashes that complete sequence.
6. Record all four hashes in an external immutable request receipt. Do not embed a header's own hash inside the bytes being hashed. No actual request receipt is supplied by this package.

The controller verifies the body's declared contract/schema pins against the sealed bundle. Null adapter hashes remain explicit missing dependencies until Claude's actual schema files and projection/post-validator receipts arrive; do not replace a null with a guessed digest. After an actual adapter is accepted, update the named pin, recompute the body/footer and whole-file hash, and issue a declared bundle revision.

## Role boundaries and findings

- 02 retains the full master-SME A-G/C2/E2/G obligations and emits bounded section chunks for deterministic merge; no whole-handbook JSON-string monolith.
- 03 is one combined KG pass with named department_pass records, gap types, edge origin, emphasis basis, fact references and script-recomputed checks.
- 04 only converts accepted facts to source-true, speakable backs and six-word hooks. It owns neither decompression nor the recall timeline. A first text-only chapter needs no image-recognition claim.
- 05.sessions owns structured decompression in TeachingUnit: supported why/how, worked example, misconception/correction, memory support and answered/rationalized self-check, with all learner spans carrying fact_ids.
- 05.card_scripts owns question/think/3000-millisecond recall/answer/teaching segments and exact back AND hook equality. Text scripts are not rendered audio.
- 06 emits practice-only assessment under explicit canonical mirror-rule dispositions, with objective/page/fact provenance, option rationales and honest form/clone/reuse counts.
- 07/08 bind the same candidate manifest, scoped inputs and intervention lineage; actor plus provider-family independence and dated source evidence precede an audit. All assigned scoped reports must PASS with no unresolved blocking finding.
- 09 and 19A are deterministic tool-assisted SOP bodies, not measured Meta calls. UI-final precedes packaging; finish criteria replaces the inactive Playbook dependency. preview_ready is distinct from a deferred canonical production release.
- Order Q's SHA is a WHOLE-FILE pin. Owning bodies separately name section 1 and section 4 rules 1, 5, 6, 7, 9 and 15, with the exact applicable numerical gates and named practice/text-only dispositions.

The header records this editing actor's OpenAI-family provenance. Runtime independence checks use the actual scoped candidate and prompt lineage; this editing session cannot certify an OpenAI-family audit as independent. No file claims a completed third-party review.

## Ownership and preserved boundaries

Claude owns schemas-strict/**, its parent-to-adapter mapping/receipts and the deterministic post-validator. These prompt edits do not duplicate that lane or edit protected parent files. The other local schemas and policy artifacts have their own declared owners. Read full contracts rather than treating this index or a prompt excerpt as a replacement.

For a rendered qualification header, root run_id identifies the run, template_sha256 pins the ORIGINAL header-template file, and binding_sha256 pins the concrete qualification instance. task.run_id must agree with root run_id. Audit/packaging headers additionally bind candidate_manifest_ref/candidate_manifest_sha256; earlier authoring stages bind accepted input_manifest_sha256 and candidate_lineage_id instead of the hash of their own future output. These fields are null in the review template.
