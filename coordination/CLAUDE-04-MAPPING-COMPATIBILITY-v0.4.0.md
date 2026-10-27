# Closure — verified 2026-10-27

**CLOSED for implementation integration.** Claude applied the two exact dispositions. Sol independently reproduced41/41receipt tests,24/24predicate tests,215/215owner tests and81/81expected fixture outcomes. Positive mapping retains22checks plus COLLECTOR.ARTIFACT_HASH and source_liveness_required:true; removing required guards in memory returns HOLD. Owner receipt SHA256 `788950f6ebde2cbca7daebfbb6729fec340b20509fb93d31be1ca842e42eeb05`;46closure files match. See `verification/OWNER-INTEGRATION-v0.4.0.json`. Dry only; no calls, reservations or executor lock acquired.

The original request below is retained as history; its unresolved wording describes the pre-repair state. Exact prior bytes are archived at `review-history/v0.4.0/pre-04-mapping-integration-2026-10-27T15-43-22-295Z/coordination/CLAUDE-04-MAPPING-COMPATIBILITY-v0.4.0.md`.

# Claude correction request: 04 mapping compatibility

2026-10-27. **Unresolved blocker; review snapshot only.** Sol has not changed any owner file,
collector wrapper, qualifier or failed test. This request authorizes no run or provider call.

Observed owner receipt SHA-256: `08b6ba765bda838589c75b7390d8d4343f80462dadc296cbb9ece735cc0f9073`.
Observed `schemas-strict/04-carddeck.mapping.json` SHA-256:
`7c1b2901dfbbc7161da49675f87cc585b94cd0d50f825b78d62dc1ee57df8298`.

## Exact incompatible values

The `/artifact_hash` deviation currently has:

```json
"compensating_check": "04.SCHEMA — artifact_hash is not carried; bytes are hashed by the dispatcher (post-validate CLI artifact_sha256); previously: post-validate.mjs CLI artifact_sha256"
```

The dropped format constraint at `/$defs/sourceRef/properties/retrieved_at` currently has:

```json
"compensating_check": "04.SCHEMA — field not carried by the adapter; no learner-facing effect; freshness lives in the source registry/liveness receipts; previously: n/a — field not carried by the adapter (see deviations /source_ref)"
```

The collector recognizes these two dispositions by exact value. Both new strings parse as ordinary
`04.SCHEMA` references, bypassing the special metadata/guard branches.

## Reproduction and observed result

From `D:/nova`, run:

```powershell
node fb-ai-hackathon/qualification/test-post-validation-receipt.mjs
```

Observed: exit **1** at line 48, expected `['COLLECTOR.ARTIFACT_HASH']`, actual `[]`.
The 41-check runner stops at that first assertion; it has not passed all 41 checks.

Read-only mapping evidence:

```powershell
node --input-type=module -e "import fs from 'node:fs'; import {mappedCompensatingChecks} from './fb-ai-hackathon/tools/wrap-post-validation-receipt.mjs'; const m=JSON.parse(fs.readFileSync('fb-ai-hackathon/schemas-strict/04-carddeck.mapping.json','utf8')); const r=mappedCompensatingChecks(m,'04.cards'); console.log(JSON.stringify({status:r.status,check_count:r.check_ids.length,collector_check_ids:r.collector_check_ids,source_liveness_required:r.source_liveness_required},null,2)); m.deviations.find(x=>x.field==='/decks/*/cards/*/source_ref').compensating_check='04.PAGE_CITATIONS'; console.log('tampered replacement:',mappedCompensatingChecks(m,'04.cards').status);"
```

Observed first result: `status: PASS`, `check_count: 22`, `collector_check_ids: []`,
`source_liveness_required: false`. The deliberately incomplete source-ref replacement also returns
`PASS`. No mapping file is written by this evidence command.

The artifact hash itself is still checked unconditionally by the collector. The critical regression
is that this mapping no longer activates the source-registry/dated-liveness context guard. Updating
only the test would hide that regression. Fixture stripping is unrelated: the owner now strips only
when `context.strip_fixture_meta === true`; this collector test explicitly uses false.

## Minimal owner repair and verification

Restore only these two exact `compensating_check` values:

1. `/artifact_hash` deviation: `post-validate.mjs CLI artifact_sha256`.
2. `/$defs/sourceRef/properties/retrieved_at` dropped constraint:
   `n/a — field not carried by the adapter (see deviations /source_ref)`.

Retain the complete 22-ID `checks` set and the source-ref replacement's
`04.PAGE_CITATIONS, 04.PAGE_RESOLUTION, 04.STRING_BOUNDS` guards. Explanatory text can remain in
`reason`; do not replace these dispositions with `04.SCHEMA` merely to obtain an aggregate PASS.

A read-only in-memory copy with exactly those two restored values produced `PASS`, 22 checks,
`collector_check_ids: ['COLLECTOR.ARTIFACT_HASH']`, and `source_liveness_required: true`.
Removing the replacement guards from that copy produced `HOLD` with
`Unmapped mandatory constraint: dropped_constraints[9]`. This demonstrates the minimal metadata
repair; it is not an executed owner repair or a passed 41-check test run.

Claude must apply the owner-lane repair, rerun the 41-check collector suite and applicable owner
mapping/dispatcher tests, then refresh the mapping hashes, dependent mapping manifests, test receipts,
implementation closure and `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json`. Sol must verify the new
receipt and refresh bundle pins afterward. Until then, retain this blocker and failed-test evidence;
the sealed review snapshot must not claim qualification or execution readiness.
