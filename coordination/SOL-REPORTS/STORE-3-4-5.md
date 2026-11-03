# Store tasks 3–5 execution receipt — 2026-10-29

Executor: Codex learner-store worker, coordinated by the root store executor on `sol/store-local`.
Scope: local customer presentation only. No accepted content, belt, schemas, prompts, or production stores changed.

## Changes landed

- `tools/preview/sync-store.mjs` now builds the customer copy using tracked canonical assets from `store/learner-assets/`, including binary-safe copying and the generated server free-file allowlist. The authoring preview remains unchanged.
- `store/learner-assets/customer-ui.mjs` applies store-only banners, readable handbook chapter/page citations, module titles without raw identifiers, useful pending states, and customer settings/source pages. Internal task/model/build metadata stays out of customer route text. Text-only courses make no narration-provider claim.
- `store/learner-assets/gate.js` preserves entitlement and quarantine behavior; adds slide/card/question pagination and anonymous `free_chapter_start`, `buy_panel_view`, and explicit `lesson_complete` events through `/api/track`. Lesson completion writes the existing state-scoped progress shape. Opening a lesson no longer marks it complete.
- `store/learner-assets/learner.css` supplies responsive course layouts, accessible touch targets, readable source notes and study pagination.
- `tools/preview/verify-learner.cjs` preserves existing byte-exact content/audio and access-gate assertions and adds customer-text checks across the state routes, sign provenance/mapping checks, and optional `--customer-states=ID,TX,UT` for bounded follow-up verification. The lint recognizes factory-belt phrases while preserving legitimate seat-belt teaching.

## Verification

- `node tools/preview/sync-store.mjs --check`: passed all store patch anchors.
- Full store harness: **ALL CHECKS PASSED**, including **22,439 customer routes across all 51 jurisdictions**. Log: `scratch/store-customer-harness-final.log`.
- Targeted Idaho/Texas/Utah follow-up: **ALL CHECKS PASSED**, including **1,062 customer routes**, source-image SHA/domain checks and all five exact sign mappings. Log: `scratch/store-customer-signs.log`.
- JavaScript syntax checks passed for the canonical gate, customer transformer and harness.

The final browser-only pager refinement was made after those harness runs: worked examples and the self-check appear with the final slide; **Mark lesson complete** remains disabled until the final slide. Its syntax check passed. Root owns the final sync and actual browser walk. Browser acceptance and screenshot evidence are not claimed by this worker.

Pager review: `show()` selects the current slide and updates the completion button's disabled state; Previous/Next remain within bounds. The completion control is created before the initial `show()` call. A one-slide lesson therefore enables completion immediately; longer lessons require advancing to the end. Quiz submission exposes all questions and feedback for review. The minimal DOM harness checks content and markup rather than executing these browser controls.

## Exact road-sign scope and remaining work

One **unmodified official FHWA Figure 2B-1 illustration**, showing STOP/YIELD signs and supplementary plaques, is stored at `store/learner-assets/signs/fhwa-stop-yield.gif`. Attribution, download/source URLs, public-domain government-work note, byte hash and mappings are in `store/learner-assets/signs/sign-map.json`.

It appears in the answer area of exactly these Idaho cards, only when the current back matches the recorded wording byte-for-byte: `sec05-card-f05`, `sec05-card-f06`, `sec05-card-f07`, `sec05-card-f08`, `sec05-card-f09`. This is a small official reference diagram, not a newly authored or generated sign-recognition assessment. **Other signs and ambiguous “this sign” references remain unmapped. Task 5 is partial.**

## Release limits retained

Customer presentation and harness acceptance do not clear native QA. Idaho's final native coverage/fact/package stages remain unaccepted; the readiness inventory records 922 assessment-coverage gaps and current source debt, including the training-continuation and record-check-span findings. The existing content holds and quarantine are preserved. No whole-state factual clearance, complete exam coverage, or release approval is claimed.

**No audio was minted by this task.** No model/API spend, external publication, Git commit or push occurred in this worker's scope.
