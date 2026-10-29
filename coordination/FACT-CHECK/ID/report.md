# Fact check — ID (ID), Muse one call per section

Run 2026-10-28-rdmv-id-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 1030 |
| Supported | 1026 |
| Partially supported | 4 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5195 (88,521 input + 96,189 output tokens) |
| Cost per fact | $0.00050 |
| Projection, all 51 (37,967 facts) | $19.15 |
| Projection, states Muse can audit independently (33,681 facts) | $16.99 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-basics | 60 | 60 | 0 | 5501 / 5779 | $0.0314 |
| sec02-applicant-requirements | 80 | 80 | 0 | 6078 / 7032 | $0.0375 |
| sec03-credentials-and-testing | 116 | 116 | 0 | 9041 / 9426 | $0.0514 |
| sec04-vehicle-equipment | 73 | 73 | 0 | 5290 / 6894 | $0.0359 |
| sec05-traffic-signs | 72 | 72 | 0 | 5524 / 6271 | $0.0336 |
| sec06-signals-and-markings | 52 | 52 | 0 | 4001 / 4302 | $0.0233 |
| sec07-intersections | 51 | 51 | 0 | 4225 / 5417 | $0.0283 |
| sec08-traffic-laws | 85 | 83 | 2 | 6544 / 8258 | $0.0433 |
| sec09-passing-and-spacing | 50 | 50 | 0 | 4194 / 5573 | $0.0289 |
| sec10-parking-and-freeways | 49 | 49 | 0 | 4000 / 3695 | $0.0207 |
| sec11-driving-task | 61 | 60 | 1 | 5739 / 5719 | $0.0315 |
| sec12-sharing-the-road | 77 | 77 | 0 | 8233 / 7613 | $0.0426 |
| sec13-road-conditions | 68 | 68 | 0 | 6261 / 6826 | $0.0368 |
| sec14-emergencies | 49 | 49 | 0 | 4892 / 5174 | $0.0281 |
| sec15-driving-record | 44 | 44 | 0 | 4540 / 4171 | $0.0234 |
| sec16-impairment | 43 | 42 | 1 | 4458 / 4039 | $0.0227 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec08-R22 | PARTIALLY_SUPPORTED | The page states yielding to cross traffic only, not to pedestrians with the right of way. | At a steady red light, you may turn right after stopping and yielding to cross traffic, unless otherwise posted. |
| sec08-R23 | PARTIALLY_SUPPORTED | The page states yielding for cross-traffic only, not for pedestrians. | When turning left from a one-way street onto a one-way street, you may proceed from a steady red light after stopping and yielding for cross-traffic, unless otherwise posted. |
| sec11-F14 | PARTIALLY_SUPPORTED | The statement omits the required five seconds or 100 feet signaling duration stated on the page. | Begin by checking mirrors and signaling for the required five seconds or 100 feet before moving. |
| sec16-F03 | PARTIALLY_SUPPORTED | The page states absorption takes longer on a full stomach but does not state that food does not establish safe driving. | Food in the stomach slows absorption compared with an empty stomach: on an empty stomach it takes place almost immediately, on a full stomach it takes somewhat longer. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-id-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
