# Fact check — Massachusetts (MA), Muse one call per section

Run 2026-10-28-rdmv-ma-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 1243 |
| Supported | 1232 |
| Partially supported | 3 |
| Not found on cited page | 8 |
| Contradicted | 0 |
| Exact cost | $0.6434 (122,271 input + 115,416 output tokens) |
| Cost per fact | $0.00052 |
| Projection, all 51 (37,967 facts) | $19.65 |
| Projection, states Muse can audit independently (33,681 facts) | $17.43 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-license-basics-and-eligibility | 66 | 66 | 0 | 6473 / 6139 | $0.0342 |
| sec02-junior-license-and-identification | 69 | 69 | 0 | 6446 / 6953 | $0.0376 |
| sec03-permit-exam-and-practice | 59 | 59 | 0 | 6187 / 6128 | $0.0338 |
| sec04-license-testing-and-fees | 81 | 81 | 0 | 9732 / 7736 | $0.0450 |
| sec05-vehicle-and-occupant-safety | 74 | 74 | 0 | 7230 / 5497 | $0.0324 |
| sec06-defensive-driving-and-weather | 93 | 92 | 1 | 8159 / 8119 | $0.0447 |
| sec07-vulnerable-road-users | 70 | 70 | 0 | 6336 / 6559 | $0.0358 |
| sec08-violations-and-driving-records | 68 | 68 | 0 | 6223 / 5171 | $0.0298 |
| sec09-license-suspensions | 84 | 84 | 0 | 9841 / 8209 | $0.0472 |
| sec10-alcohol-drugs-and-license-retention | 55 | 55 | 0 | 5502 / 3919 | $0.0235 |
| sec11-speed-signals-and-signs | 122 | 119 | 3 | 9827 / 10484 | $0.0568 |
| sec12-markings-lanes-and-turns | 99 | 96 | 3 | 10175 / 10465 | $0.0572 |
| sec13-right-of-way-passing-and-sharing | 72 | 72 | 0 | 7739 / 8001 | $0.0437 |
| sec14-parking-pedestrians-and-bicycles | 106 | 102 | 4 | 9389 / 10236 | $0.0552 |
| sec15-emergency-vehicles-and-enforcement | 38 | 38 | 0 | 4155 / 3625 | $0.0206 |
| sec16-emergencies-crashes-and-green-driving | 87 | 87 | 0 | 8857 / 8175 | $0.0458 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec06-F24 | PARTIALLY_SUPPORTED | The cited page states the delay condition but not the loose-steering-wheel condition, which is on the prior page. | The steering wheel should not have a delay between wheel movement and tire response. |
| sec11-F57 | NOT_FOUND_ON_PAGE | The cited page text does not mention a Do Not Enter sign or description. | Omit the claim unless supported by another page that shows a Do Not Enter sign. |
| sec11-R14 | PARTIALLY_SUPPORTED | The page shows pedestrian-crossing captions but does not state supplemental plaques can show location or advance distance. | A pedestrian-symbol warning identifies a pedestrian crossing. |
| sec11-R27 | PARTIALLY_SUPPORTED | The page shows Added lane but does not state it means no merge is required versus a merge. | The illustrated added-lane warning indicates an additional lane. |
| sec12-F33 | NOT_FOUND_ON_PAGE | The page text lists Left turn but does not describe the straight-arm position. | State only that a left-turn hand signal must be made through the driver's-side window. |
| sec12-F34 | NOT_FOUND_ON_PAGE | The page text lists Right turn but does not describe the bent-upward arm position. | State only that a right-turn hand signal must be made through the driver's-side window. |
| sec12-F35 | NOT_FOUND_ON_PAGE | The page text lists Slow or stop but does not describe the downward arm position. | State only that a slow-or-stop hand signal must be made through the driver's-side window. |
| sec14-R50 | NOT_FOUND_ON_PAGE | The cited page lists only the label Left Cross without defining the maneuver. | State only that Left Cross is listed as a common crash scenario on the page. |
| sec14-R51 | NOT_FOUND_ON_PAGE | The cited page lists only the label Right Hook without defining the maneuver. | State only that Right Hook is listed as a common crash scenario on the page. |
| sec14-R52 | NOT_FOUND_ON_PAGE | The cited page lists only the label Drive Out without defining the maneuver. | State only that Drive Out is listed as a common crash scenario on the page. |
| sec14-R53 | NOT_FOUND_ON_PAGE | The cited page lists only the label Sideswipe without defining the maneuver. | State only that Sideswipe is listed as a common crash scenario on the page. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ma-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
