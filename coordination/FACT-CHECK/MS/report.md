# Fact check — Mississippi (MS), Muse one call per section

Run 2026-10-28-rdmv-ms-class-r. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 724 |
| Supported | 723 |
| Partially supported | 1 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3733 (64,737 input + 68,789 output tokens) |
| Cost per fact | $0.00052 |
| Projection, all 51 (37,967 facts) | $19.57 |
| Projection, states Muse can audit independently (33,681 facts) | $17.37 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-and-examination | 86 | 86 | 0 | 8120 / 6899 | $0.0395 |
| sec02-vehicle-equipment-and-preparation | 71 | 70 | 1 | 5522 / 6925 | $0.0363 |
| sec03-pavement-markings | 23 | 23 | 0 | 2192 / 2328 | $0.0126 |
| sec04-traffic-signs | 74 | 74 | 0 | 5685 / 7531 | $0.0391 |
| sec05-railroads-and-signals | 57 | 57 | 0 | 5364 / 4943 | $0.0277 |
| sec06-speed-signals-and-following | 33 | 33 | 0 | 2985 / 3137 | $0.0171 |
| sec07-lanes-and-passing | 30 | 30 | 0 | 3345 / 3757 | $0.0201 |
| sec08-turning | 31 | 31 | 0 | 3085 / 2784 | $0.0157 |
| sec09-right-of-way | 36 | 36 | 0 | 3570 / 3280 | $0.0184 |
| sec10-parking-and-night-driving | 43 | 43 | 0 | 3549 / 3493 | $0.0193 |
| sec11-restraints-and-emergencies | 49 | 49 | 0 | 4558 / 4857 | $0.0263 |
| sec12-interstates | 34 | 34 | 0 | 2839 / 3082 | $0.0166 |
| sec13-sharing-the-road | 42 | 42 | 0 | 3783 / 3740 | $0.0206 |
| sec14-vehicle-documentation | 34 | 34 | 0 | 2838 / 3350 | $0.0178 |
| sec15-impairment-and-license-consequences | 63 | 63 | 0 | 5322 / 5348 | $0.0294 |
| sec16-appendix-road-safety | 18 | 18 | 0 | 1980 / 3335 | $0.0166 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-F064 | PARTIALLY_SUPPORTED | Page says Avoid eating while driving, not an absolute Do not eat prohibition. | Avoid eating while driving. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ms-class-r/sources/private/audits/muse-fact-check/ (private, gitignored).
