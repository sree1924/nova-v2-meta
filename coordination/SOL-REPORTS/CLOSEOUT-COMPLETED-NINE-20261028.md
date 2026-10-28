# Completed-state closeout — 28 October 2026

Read-only batch on ID, KS, DE, NE, NM, PA, WY, ME and SD. Montana was excluded and continues its authorized repairs.

## Actionable findings

- **Idaho:** 1,030 served cards but 108 exam items; **922 card nodes and their fact claims have no exam item**.
- **Pennsylvania:** 993 served cards but 136 exam items; **857 card nodes and their fact claims have no exam item**.
- Total: **1,779 uncovered served cards**. Accepted banks contain no page-debt entries or separate typed-gap fields covering the omissions. This conflicts with prompts/06.md:22 one-item-per-studied-card coverage, although native06 does not currently enforce that requirement.
- **Nebraska legacy usage reconciliation:** recorded state delta rows sum to 77,788,608 tokens versus fixed main-session cumulative 75,453,391; difference **2,335,217 total / 2,249,856 cached**. Latest fixed sample and record ID agree. Earlier rows need attribution/overlap reconciliation; no row was edited and this is not an API-spend claim.

## Structural verification

All nine have all six authoring surfaces accepted across **137 mapped sections (822 section-stage units)**. Native artifact, validation, acceptance, fact-registry companion and transitive02 supersession/source bindings verify. Current card backs match accepted wording; exact card/recap script parity and cardinality pass; lesson fact-tag coverage passes. All nine report/completion pins and own Sol queue completion rows are present. All 2,308 native attempts remain accepted, reservations settled and ownership released. All 2,056 file-transport call receipts explicitly record model_api_called:false and credit_usd:0.

| State | Cards | Exam items | Cards without exam item | Binding/parity |
|---|---:|---:|---:|---|
| ID | 1030 | 108 | 922 | PASS |
| KS | 1328 | 1328 | 0 | PASS |
| DE | 1398 | 1398 | 0 | PASS |
| NE | 888 | 888 | 0 | PASS |
| NM | 652 | 653 | 0 | PASS |
| PA | 993 | 136 | 857 | PASS |
| WY | 975 | 976 | 0 | PASS |
| ME | 1056 | 1056 | 0 | PASS |
| SD | 991 | 991 | 0 | PASS |

## Editorial diagnostics, separate from coverage failures

- Repeated complete accepted statements occur in narration: PA286, WY85, NM40, SD1. Some are deliberate self-check restatement; counts alone do not establish that every flagged narration is defective. Exact pointers and samples are in the evidence JSON. PA samples concatenate source statements and repeat one, so teaching quality merits the re-author review.
- Many fronts are explicit completion prompts. Terminal prepositions were not classified as confirmed incomplete-front defects from the string heuristic alone.
- Two NE fact renderings say **and or or** for source and/or. This is derived-speech polish; raw source claims remain intact.

## Belt follow-up

The existing prompt06 coverage requirement needs an owner-qualified enforcement check in a future safe shared-code batch. No validator/schema/core patch is applied by this closeout. Reuse the proven one-shot caller, accepted-capacity cause receipts, same-module04 merge route and fresh-binding recovery; the three compiler fixes remain qualified. Do not rerun closed suites here.

## Usage and scope

Fixed main-worker samples total 571,651,529 tokens, including 558,422,784 cached input. Cached input is a subset, not added usage. Root/helper metrics are unavailable and remain null; this is not a subscription-percent or dollar estimate. Retained source/visual/currency/review metadata is unchanged.

No native authoring, re-mint, onboarding, export, shell/store edit or queue mutation occurred. No REAUTHOR report was written because no onboarded run was re-minted. Fable owns onboarding/re-onboarding. Montana receives only its own delta closeout after finishing; combine that with this batch.

Evidence: [final data](CLOSEOUT-COMPLETED-NINE-20261028-FINAL.json) and [pinned detailed evidence](CLOSEOUT-COMPLETED-NINE-20261028-v2.json). v1 remains a rejected collector draft; its supersession/prior-KG false positives were corrected in v2.
