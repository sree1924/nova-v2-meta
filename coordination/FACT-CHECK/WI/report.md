# Fact check — Wisconsin (WI), Muse one call per section

Run 2026-10-28-rdmv-wi-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 12 of 12 |
| Facts checked | 612 |
| Supported | 601 |
| Partially supported | 11 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3248 (53,430 input + 60,711 output tokens) |
| Cost per fact | $0.00053 |
| Projection, all 51 (37,967 facts) | $20.15 |
| Projection, states Muse can audit independently (33,681 facts) | $17.88 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driving-test-requirements | 37 | 36 | 1 | 2997 / 4470 | $0.0227 |
| sec02-progression-of-licenses | 62 | 60 | 2 | 5889 / 6436 | $0.0347 |
| sec03-the-basics-part-1 | 63 | 63 | 0 | 5699 / 7038 | $0.0370 |
| sec04-the-basics-part-2 | 66 | 66 | 0 | 6217 / 5643 | $0.0318 |
| sec05-signs | 73 | 67 | 6 | 6800 / 7497 | $0.0404 |
| sec06-signals-markings-lanes | 62 | 62 | 0 | 5395 / 5889 | $0.0318 |
| sec07-driving-situations | 51 | 50 | 1 | 4420 / 5407 | $0.0285 |
| sec08-driving-conditions | 40 | 40 | 0 | 2987 / 3271 | $0.0176 |
| sec09-handling-emergencies | 41 | 41 | 0 | 3361 / 3565 | $0.0194 |
| sec10-dangerous-driving-behaviors | 36 | 36 | 0 | 2748 / 3097 | $0.0166 |
| sec11-sharing-the-road | 32 | 32 | 0 | 2652 / 3102 | $0.0165 |
| sec12-driving-privilege-and-other-info | 49 | 48 | 1 | 4265 / 5296 | $0.0278 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R09 | PARTIALLY_SUPPORTED | Page 6 states the skills-test appointment rule but does not state that the written tests are walk-in. | Cite page 5 for the walk-in rule for signs and knowledge tests, or limit this fact to page 6's appointment rule. |
| sec02-R02 | PARTIALLY_SUPPORTED | The cited page states the sponsor MV3001 but does not state the behind-the-wheel school also supplies a signed MV3001. | Cite pages 7 and 9 together: sponsor signs MV3001 and behind-the-wheel school provides signed MV3001. |
| sec02-R11 | PARTIALLY_SUPPORTED | The cited page states the 5 a.m. to 12 a.m. rule but does not state the 12 a.m. to 5 a.m. home-school-work limit. | Cite pages 10 and 11 together for both daytime and nighttime alone-driving rules. |
| sec05-R02 | PARTIALLY_SUPPORTED | Page 26 describes Sharp Turn but does not mention a Curved Road sign for gradual bends. | A Sharp Turn sign can point left or right and asks you to be ready to slow for the turn. |
| sec05-R04 | PARTIALLY_SUPPORTED | Page 27 describes Merge but does not describe Lane Ends, which is on another page. | A Merge sign shows a lane joining from the right or left; move over when it is safe. |
| sec05-R07 | PARTIALLY_SUPPORTED | Page 28 describes Reduced Speed Ahead but does not describe Slippery When Wet as a yellow warning. | Reduced Speed Ahead is a regulatory sign telling you to slow down. |
| sec05-R10 | PARTIALLY_SUPPORTED | Page 29 states the lane uses but does not tell drivers to always read the arrows on the sign. | In this example the far-left lane is used to only turn left and the right lane is to turn left or go straight. |
| sec05-R13 | PARTIALLY_SUPPORTED | Page 30 describes orange work signs but does not state that yellow signs warn of road hazards in general. | Orange signs warn that people are working on or near the road. |
| sec05-R16 | PARTIALLY_SUPPORTED | Page 32 describes blue service signs but does not state that green and brown signs point to destinations. | Blue signs point to services such as a hospital or camping. |
| sec07-R06 | PARTIALLY_SUPPORTED | Page 45 does not state the general middle-lane-for-straight rule; that rule is on page 43. | At a two-lane roundabout follow the pavement markings, arrows or signs to go straight. |
| sec12-F35 | PARTIALLY_SUPPORTED | The fact says classroom and behind-the-wheel training, but the page says classroom and/or behind-the-wheel training. | The program enables income-eligible teens to have their classroom and/or behind-the-wheel training paid for by the state. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-wi-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
