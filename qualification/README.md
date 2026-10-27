# Qualification definitions v0.4.0

This folder contains review-package definitions and labelled synthetic validator fixtures. No actual
qualification report, selected-state source, held-out fact list, cards, call, database or service is
created by these definitions or tests. Regular passenger-car written-test preparation is fixed; the
state and chapter remain pending. The first qualification is a text-first chapter. It makes no claim
about road-sign image recognition.

## Frozen criteria and separate instances

`CRITERIA-04-text-first.json` contains the immutable criteria: at least 25 genuine sourced cards,
exactly 15 presealed independent held-out checks, all 15 covered correctly, no contradiction,
qualifier loss or omitted held-out fact, source/page grounding, original spoken-form backs/hooks,
accounting and scoped independent evidence. Criteria contain no source, model, budget or held-out
values to fill. `RUBRIC-04-road-signs.json` is a legacy-name index, not a road-sign selection or result.

Copy `BINDING-04-text-first.template.json` into a new per-run instance only after state/source
selection. Fill that instance with actual source/page-map/extraction, adapter, prompt/header,
independent-author, budget and evidence pins. Commit its hash before the first attempt. Filling an
instance cannot alter criteria bytes. An amended criterion needs a declared new version/hash and
review. The package-preparation script refuses to overwrite a changed definition once it appears
in a sealed bundle's primary targets.

The schema in `QUALIFICATION-REPORT-04.schema.json` allows honest sparse FAIL/BLOCKED records. Its
PASS branch requires non-null evidence throughout. A structurally valid PASS is still insufficient:
`tools/qualify-04.mjs` independently resolves hashes and validates the frozen criterion, binding,
scope, chronology, coverage, provenance and reports. No boolean in a report grants execution.

## Decompression belongs to 05 sessions

`contracts/teaching-unit.schema.json` defines a local TeachingUnit collection. Every learner-facing
string is a `Span {text, fact_ids[]}`. Each unit has why/how, a worked example, an explicitly labelled
misconception/correction, memory support and an aligned self-check with answer/rationale. Its six to
eight slides include opening, trap/bridge, self-check and close. The script computes field counts,
fact-ID resolution, average narration length, word limits and slide counts; these are never
model-written acceptance totals.

Order Q rule 7 requires at least six slides per session, **average** narration of at least 400
characters and at least one trap/bridge. Titles contain at most six words; individual lines at most
15 words. Thirty-to-sixty-second estimates describe text cadence, not rendered audio. A uniform
slide-count vector fails when at least two units can be compared; a single-unit check reports that
comparison as non-applicable. The card converter does not author whole-unit teaching. Its separate
check is source-faithful backs and short memory hooks. The three-second recall beat belongs to
05 card-script segments, not CardDeck.

TeachingUnit references the **input** manifest hash and stable candidate lineage ID. It does not
embed the hash of a later manifest that contains its own output hash. Final candidate hashes belong
to post-seal auditor reports.

## Read-only validator API

```text
inspectQualification04({projectRoot, repoRoot, runConfigPath, registry, reportPath?})
  -> {role_id, qualification_status, report_status, report_ref, validation_errors, scope?}

validateJsonSchema(schema, value) -> string[] validation errors
evaluateHeldoutOutcomes(outcomes, expectedItems, minimumCovered=15) -> status/counts/errors
measureTeachingUnits(document, {factIds, schema}) -> computed per-unit metrics/errors
longestWordOverlap(sourceText, learnerFields) -> computed maximum/per-field lengths
word_limit_count(text) -> owner-compatible whitespace word count
overlap_tokens(text) -> frozen originality-policy tokens
```

From the hackathon folder:

```text
node tools/qualify-04.mjs
node tools/qualify-04.mjs --run-config runs/2026-10-27-rdmv-tx-class-c/run-config.json
node qualification/test-v04.mjs
node qualification/test-post-validation-receipt.mjs
```

These commands inspect saved data only. They make no requests, open no database and write no report
or registry flag. An absent actual report returns `not_qualified`, `report_status: absent` and exit
zero because inspection succeeded. Exit zero is not a qualification verdict. A present invalid
report returns nonzero. `--write`, `--go` and `--execute` are rejected.

The helper depends on the main checker's binding-integrity gate and on the existing
`tools/check-audit-independence.mjs` implementation. It excludes actor/session and provider-family
contributors to the candidate or authoring prompt. An OpenAI/GPT prompt author cannot become an
eligible held-out author simply by changing session. Both required audit families must independently
be eligible; missing actors/provenance or an incomplete lineage blocks the gate.

The frozen criteria place NFKC/lowercase letter-or-number tokenization specifically under
`originality.normalization`; they do not apply it globally to hook/title/line word limits.
`overlap_tokens` preserves that exact originality algorithm. `word_limit_count` follows the owner's
documented common helper: whitespace chunks containing a Unicode letter/number; a contraction or
hyphenated chunk counts once, and a bare dash does not count. A contraction/hyphen fixture proves
agreement while leaving all numeric thresholds and frozen criteria bytes unchanged.

## Receipt interfaces for the future controller lane

No following receipt is supplied by this review package. Claude owns the actual strict adapters,
mapping manifest and deterministic post-validator under `schemas-strict/` and `tools/belt/`.

- The artifact-validation stage is **`04.cards`**, while the logical qualification task is
  **`04.qualification`**. Header, binding and evidence keep these separate. They never rename one
  stage to make a mismatched receipt pass.
- The unchanged Claude API returns `{status,stage_id,checks,errors,metrics}`. Its CLI adds
  `artifact_sha256`; `metrics.adapter_schema_sha256` identifies the actual schema. The collector
  wrapper `tools/wrap-post-validation-receipt.mjs` reads that saved result and existing files only;
  it does not call the owner API. Its schema is `qualification/POST-VALIDATION-RECEIPT.schema.json`.
  The wrapper supplies the qualifier's existing `output_sha256`, `schema_sha256`,
  `validator_sha256` and `mapping_sha256` fields, plus raw-result/context/source refs and an exact
  implementation closure. This changes no frozen qualification criterion or report schema.
- The instance pins the actual stage mapping `schemas-strict/04-carddeck.mapping.json`. The frozen
  criteria's generic README reference is the mapping-documentation pointer, not a requirement to
  use a documentation file instead of the owner's per-stage mapping. The stage map determines the
  executable schema/mapping/check-module paths; the collector verifies them rather than guessing.
- A collector PASS requires the exact artifact/schema hashes, `04.SCHEMA` and every mapped
  compensating check exactly once and PASS, no FAIL/HOLD/error, `strip_fixture_meta:false`, and no
  `_fixture` in a qualification artifact or fixture marker in the result. Aggregate PASS alone
  cannot hide an omitted named check. Unknown mapping format or absent mandatory mappings produces
  HOLD. The actual 04 mapping's top-level `checks` must contain the complete reviewed 22-ID set;
  the reader also understands explicit `compensating_checks` declarations for other stages.
  `deviations`/`dropped_constraints`/`sentinels` rows name `compensating_check` identifiers (including
  comma-separated descriptive strings), and `added_invariants` rows name `check` IDs.
  Current-stage row references must be declared by that list; explicit downstream references are
  identified separately and never claimed as current-stage checks. The narrowly recognized
  `/artifact_hash` omission maps to `COLLECTOR.ARTIFACT_HASH`, computed against the exact artifact
  bytes and the CLI's `artifact_sha256` (or the committed API snapshot described below).
  The removed `/$defs/sourceRef/properties/retrieved_at` format is accepted only with the specific
  source-ref replacement guarded by `04.PAGE_CITATIONS`, `04.PAGE_RESOLUTION` and `04.STRING_BOUNDS`.
  A nonempty source registry and dated, complete source-liveness receipts remain required context;
  downstream stage 08 liveness gates still apply. This is no general timestamp or liveness waiver.
  An unfamiliar disposition is a pending integration task, never silent acceptance.
- The wrapper pins all lane code/schema/map files, local imported helpers, actual Ajv package
  trees/transitive dependencies, package manifests/lockfile and the wrapper itself. The inspector
  recomputes that closure; a changed stage module, context, output, schema or mapping invalidates
  the receipt even when `post-validate.mjs` itself did not change. The binding instance must pin
  this closure before its commit and before the first attempt; the later wrapper must match that
  pre-attempt snapshot as well as current files. Hashes computed only after a validation cannot
  establish which implementation was used before an intervening edit.
- The CLI path consumes the owner result with its artifact hash. The API path requires a saved
  pre-invocation snapshot produced by the pure metadata helper
  `capturePostValidationInvocation({projectRoot,artifactPath,contextPath,invocationId,collectorSequence,capturedAt})`.
  It reads artifact/context/full implementation-closure pins, requires `04.cards` and
  `strip_fixture_meta:false`, and returns metadata only. The caller must persist and commit it
  **before** the unchanged owner API call. Its contract is
  `qualification/POST-VALIDATION-INVOCATION.schema.json`; this package creates no actual snapshot.
  The later wrapper accepts optional `invocationSnapshotRef:{path,sha256}` (CLI:
  `--invocation-snapshot <saved-path>`), pins both snapshot and raw result, and compares the saved
  pre-invocation pins against current files. Missing or changed snapshot evidence returns HOLD.
  A bare API result cannot obtain acceptance merely by hashing files after the call.
  Binding instances do not pin later
  validation results/wrappers; the report pins them, keeping the hash graph acyclic.
- API qualification additionally needs three unique immutable events in the report's existing
  ledger export: `validation.invocation.committed` < `validation.started` < `validation.completed`.
  All carry matching run/lineage/invocation, `stage_id:04.qualification`,
  `artifact_validation_stage_id:04.cards`, `snapshot_sha256`, `artifact_sha256`, `context_sha256`
  and `implementation_closure_sha256`. The commit sequence equals the snapshot's
  `collector_sequence`; completion also pins `raw_result_sha256` and
  `post_validation_receipt_sha256`. `occurred_at` times must follow snapshot capture ≤ commit ≤
  start ≤ completion ≤ report completion. These are saved-evidence interfaces, not a controller,
  event writer or an authorization to execute one.
- The source text extraction receipt echoes `status: PASS`, `source_document_sha256`,
  `extracted_text_sha256` and `page_map_sha256`. The full registered UTF-8 text enables deterministic
  overlap checks without printing restricted source passages.
- The actual rendered controller header pins `template_sha256` and `binding_sha256`; its mode is
  `qualification`, its run matches, and `execution_authorized` requires the returned, hashed
  `authority_ref` with matching run/mode, status `approved`/`authorized` and source
  `founder`/`explicit_go_invocation`. This automatically recorded invocation receipt captures the
  existing contract and explicit `--go` authority; it creates no new founder reserved gate or live
  question. Config execution must independently be enabled. The pending review header/template
  grants no authority.
- The held-out file has exactly 15 unique item IDs. Its author call receipt echoes the actor,
  session, provider family, returned model and held-out output hash. A separate qualified identity
  receipt and candidate/prompt-lineage check are required. A controller self-attestation is
  insufficient.
- A `heldout.sealed` event records held-out/criteria/auditor-call hashes. A
  `qualification.binding.committed` event records the instance hash. Both must appear in the
  immutable ledger export, with the same run/lineage, at sequences strictly less than the first
  `attempt.started` event for role `04`, stage `04.qualification`. That attempt pins the binding
  and held-out hashes. UTC timestamps must also satisfy seal ≤ start ≤ completion.
- The binding contains a stable commit-event ID and the original header-template pin. The **report**
  contains the binding-commit event, rendered header and later ledger-export refs. Placing these
  receipt hashes back inside the instance would create a hash cycle.
- Every model-call receipt covers one physical dispatch, including retries. It pins the actual
  rendered request, header/body hashes and raw response; records role/stage/run/lineage, actual
  returned model, known usage, estimated/reported USD and positive elapsed time. Totals must reconcile.
  Hidden held-out refs/item IDs cannot appear in the rendered generator request.
- The candidate manifest contains the actual output ref/hash. Every scoped auditor report echoes
  that manifest SHA, the actual actor and PASS; stale/different hashes or an unresolved blocking
  finding cannot be aggregated into acceptance.

Per-item held-out outcomes are `covered_correct`, `qualifier_loss`, `contradicted` or `not_covered`.
A zero-contradiction deck that omits the tested facts fails. Every `covered_correct` item identifies
actual candidate card IDs and resolving evidence. Every required check must be executed and PASS;
no sampled/unrun check becomes exhaustive acceptance.

## Synthetic test scope

`fixtures/*.synthetic.json` are conspicuously wrapped test data and cannot serve as qualification
reports or source authority. They contain generic text and fabricated identifiers only. The test
runner reads them without writes and exercises null-PASS rejection, held-out omissions/qualifier
loss, the structured teaching fields/depth/fact-resolution constraints, source overlap, spoken-form
lint, provider-family exclusion, frozen-criteria stability and absent-report behaviour. A full live
qualification remains unexecuted and depends on selected sources, bound Claude adapters/validators,
independent receipts and separate execution authority.
