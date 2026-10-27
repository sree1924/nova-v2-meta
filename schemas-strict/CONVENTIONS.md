# schemas-strict — adapter conventions (Claude lane, v0.4.0)

Owner: Claude Code (session 2bdcad95). Scope: `schemas-strict/**`, `tools/belt/**`, `tests/belt/**`,
`coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json`. Parent `D:/nova/schemas/*` are read-only and never edited.
Review-only package: nothing here dispatches a model call.

## Two layers, by design

1. **Provider-facing adapter** `schemas-strict/<stage>.schema.json` — the JSON Schema sent to Meta as
   `response_format.json_schema.schema` with `strict: true`. It carries ONLY what Meta's documented strict
   subset accepts (read 2026-10-26, dev.meta.ai/docs/structured-output):
   - root is a plain object; `additionalProperties: false` on **every** object; every object's `required`
     lists **every** key in `properties`;
   - no `allOf`, no `oneOf`, no `if/then/else`, no `$ref` cycles (we use **no `$ref` at all**), depth ≤ 10;
   - nullable = `{"anyOf":[{<type>},{"type":"null"}]}` (anyOf is allowed below the root);
   - keywords we deliberately **do not rely on** in the adapter because provider support is unverified:
     `minLength`, `maxLength`, `minItems`, `maxItems`, `pattern`, `format`, `const`, `uniqueItems`,
     `minimum`, `maximum`, `contains`. They may appear **only** if also restored as a check (see 2).
     `enum` is allowed (≤ 1000 values).
2. **Compensating checks** `tools/belt/checks/<stage>.mjs` — every parent rule the adapter dropped or
   weakened (bounds, patterns, consts, `allOf`/`if-then` invariants, cross-field agreement) is restored
   as a named deterministic check. The dispatcher `tools/belt/post-validate.mjs` runs schema → checks.

An adapter is a **`strict_subset`** when every document it accepts is also accepted by the parent, or a
**`pilot_adapter`** when payload meaning differs (sentinels for fields DMV cannot honestly fill). The kind
is declared in the mapping file; "subset" is never claimed when a sentinel exists.

## Files per stage

| File | Purpose |
|---|---|
| `schemas-strict/<stage>.schema.json` | the adapter (layer 1) |
| `schemas-strict/<stage>.mapping.json` | parent pin, adapter_kind, every deviation/dropped constraint → `compensating_check`, sentinels, fixtures |
| `tools/belt/checks/<stage>.mjs` | `export const stage_id`; `export function run(artifact, context) → Check[]` |
| `tools/belt/project/<stage>.mjs` | optional `export function projectV1(parentArtifact, opts) → artifact` for the V1 fixture |
| `tools/belt/fixtures/<stage>/v1-projected.json` | projected V1 citizenship artifact (**fixture/reference, never a DMV result**) or absent with `HOLD` recorded in mapping |
| `tools/belt/fixtures/<stage>/synthetic-*.json` | clearly synthetic interface fixtures incl. negatives |
| `tests/belt/<stage>.test.mjs` | `node --test`; asserts positive fixture PASS and each negative FAIL/HOLD |

Stage ids are the prompts' `stage_id` values: `02.dossier_sections`, `03.combined_kg`, `04.cards`,
`05.sessions`, `05.card_scripts`, `06.exam_bank`, `07.content_coverage`, `08.content_facts`,
`09.package`, `19A.units` (see `stage-map.json`).

## Check contract

```ts
type Check = { check_id: string;            // "<STAGE>.<NAME>" e.g. "04.BACK_SPOKEN_FORM"
               status: "PASS"|"FAIL"|"HOLD"; // HOLD = needed context/binding absent; never guess
               evidence: string;             // what was observed, with pointers/counts
               metrics?: Record<string, number|string|boolean|null> }
```
`run(artifact, context)` is pure: no network, no writes, no clock. `context` keys (all optional; a check
that needs one and lacks it returns HOLD): `accepted_inputs`, `fact_registry` (`{facts:{<fact_id>:{...}}}`),
`source_registry`, `candidate_manifest`, `input_manifest_sha256`, `media_disposition`, `learning_loop`,
`intervention_lineage`, `overlay` (pilot-overrides), `policy` (source-fact-policy), `finish_criteria`,
`exam_facts_view` (normalized `{value,status,source_page}` per fact).

Aggregate status: any FAIL → FAIL; else any HOLD → HOLD; else PASS. The schema check is `<STAGE>.SCHEMA`.

## Sentinel vocabulary (pilot_adapter only)

- `"deferred:not_applicable_pilot"` — a parent-required reference the pilot cannot produce honestly
  (image scout plans, audio manifests, deploy refs). Allowed only where `media-disposition.json` or the
  overlay names the non-applicability; the compensating check verifies that binding.
- Official numbers: `{ "value": null|number, "status": "unknown"|"verified"|"authored", "source_page": null|string }`
  — never a bare number for an unverified fact (source-fact-policy.json).
- Pilot status: `pilot_status: "preview_ready"|"blocked"` beside legacy `status: "blocked"`.

## Hash discipline

Adapters and fixtures are hashed with sha256 over exact bytes. Fixture generators record the source
artifact path + sha256 and every transformation decision inside the fixture under `_fixture` (which the
adapter schema does **not** allow — so fixtures are validated with `_fixture` stripped; the dispatcher does
this when `context.strip_fixture_meta === true`, the default for CLI runs on files under `tools/belt/fixtures/`).
