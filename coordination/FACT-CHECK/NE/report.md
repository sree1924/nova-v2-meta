# Fact check — NE (NE), Muse one call per section

Run 2026-10-28-rdmv-ne-class-o. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 888 |
| Supported | 886 |
| Partially supported | 2 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4381 (80,329 input + 79,463 output tokens) |
| Cost per fact | $0.00049 |
| Projection, all 51 (37,967 facts) | $18.73 |
| Projection, states Muse can audit independently (33,681 facts) | $16.62 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-path | 63 | 63 | 0 | 6874 / 5689 | $0.0328 |
| sec02-application-and-testing | 115 | 115 | 0 | 12062 / 8486 | $0.0511 |
| sec03-license-responsibilities | 121 | 121 | 0 | 10174 / 10959 | $0.0593 |
| sec04-alcohol-and-restraints | 71 | 71 | 0 | 5580 / 6724 | $0.0356 |
| sec05-health-and-police-stops | 44 | 44 | 0 | 3585 / 3596 | $0.0198 |
| sec06-insurance-and-equipment | 33 | 33 | 0 | 2805 / 2822 | $0.0155 |
| sec07-traffic-signals | 45 | 45 | 0 | 3706 / 4666 | $0.0245 |
| sec08-traffic-signs | 84 | 84 | 0 | 6292 / 6446 | $0.0353 |
| sec09-pavement-markings | 31 | 31 | 0 | 2876 / 3457 | $0.0183 |
| sec10-right-of-way | 35 | 34 | 1 | 3565 / 3744 | $0.0204 |
| sec11-speed-and-passing | 39 | 39 | 0 | 3345 / 3702 | $0.0199 |
| sec12-turning-parking-and-railroads | 55 | 55 | 0 | 4971 / 5626 | $0.0301 |
| sec13-special-driving-conditions | 82 | 81 | 1 | 7693 / 7021 | $0.0395 |
| sec14-sharing-the-road | 52 | 52 | 0 | 5247 / 4857 | $0.0272 |
| sec15-crash-response | 18 | 18 | 0 | 1554 / 1668 | $0.0090 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec10-R10 | PARTIALLY_SUPPORTED | The page states the pull-to-the-right-and-stop rule but does not state that opposing traffic across a median need not stop. | Remove the median exception and retain only the pull parallel to the right edge and stop clear of intersections unless directed otherwise. |
| sec13-R42 | PARTIALLY_SUPPORTED | Page 74 states the three-second timing test but the adversity longer-gap rule is on page 75, not page 74. | Limit the statement to the three-second timing test on page 74, or cite page 75 for the adversity increase. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ne-class-o/sources/private/audits/muse-fact-check/ (private, gitignored).
