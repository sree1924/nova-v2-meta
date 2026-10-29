# Fact check — New Hampshire (NH), Muse one call per section

Run 2026-10-28-rdmv-nh-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 11 of 11 |
| Facts checked | 506 |
| Supported | 501 |
| Partially supported | 5 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.2913 (56,630 input + 51,889 output tokens) |
| Cost per fact | $0.00058 |
| Projection, all 51 (37,967 facts) | $21.86 |
| Projection, states Muse can audit independently (33,681 facts) | $19.39 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driving-in-new-hampshire | 33 | 33 | 0 | 4141 / 3324 | $0.0193 |
| sec02-license-information | 38 | 38 | 0 | 4963 / 3482 | $0.0210 |
| sec03-dangerous-driving | 51 | 51 | 0 | 5626 / 5693 | $0.0312 |
| sec04-before-driving | 31 | 29 | 2 | 3524 / 4036 | $0.0216 |
| sec05-basic-driving | 82 | 81 | 1 | 8912 / 7953 | $0.0449 |
| sec06-rules-of-the-road | 58 | 57 | 1 | 6041 / 5396 | $0.0305 |
| sec07-general-driving-and-parking | 60 | 60 | 0 | 6852 / 5776 | $0.0331 |
| sec08-driving-safely | 27 | 27 | 0 | 2704 / 2687 | $0.0148 |
| sec09-accidents-financial-responsibility | 23 | 22 | 1 | 2467 / 2878 | $0.0153 |
| sec10-driving-emergencies | 31 | 31 | 0 | 3327 / 3695 | $0.0199 |
| sec11-sharing-the-road | 72 | 72 | 0 | 8073 / 6969 | $0.0397 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec04-F013 | PARTIALLY_SUPPORTED | Page 17 states the under-18 requirement and all-ages recommendation but does not mention child-safety-law exceptions. | State only that restraints are required under age 18 and recommended at all ages, citing page 17, and cite page 18 for exceptions. |
| sec04-F014 | PARTIALLY_SUPPORTED | Page 17 is cut off mid-sentence and does not state the under-the-arm or behind-the-back prohibition, which continues on page 18. | Cite pages 17-18 for the full shoulder-belt placement rule including not wearing it under the arm or behind the back. |
| sec05-F028 | PARTIALLY_SUPPORTED | Page 21 states inappropriate horn use could scare, but the anger element appears on page 22, not page 21. | Use the horn only when needed to communicate with other road users, because inappropriate use could scare another road user. |
| sec06-F037 | PARTIALLY_SUPPORTED | Page specifies trucks carrying flammable or hazardous material, not all vehicles. | Buses carrying passengers and trucks carrying flammable or hazardous material must stop at railroad crossings even when no train is coming. |
| sec09-F001 | PARTIALLY_SUPPORTED | The page limits the watch to illegal acts and errors of other drivers, not all other road users generally. | Defensive driving means watching for illegal acts and driving errors of other drivers and adjusting driving accordingly to avoid a crash. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nh-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
