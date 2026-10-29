# Fact check — Washington (WA), Muse one call per section

Run 2026-10-28-rdmv-wa-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 646 |
| Supported | 635 |
| Partially supported | 11 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3894 (78,590 input + 68,511 output tokens) |
| Cost per fact | $0.00060 |
| Projection, all 51 (37,967 facts) | $22.89 |
| Projection, states Muse can audit independently (33,681 facts) | $20.3 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-getting-your-license | 44 | 41 | 3 | 5808 / 5049 | $0.0287 |
| sec02-exams-and-keeping-your-license | 42 | 39 | 3 | 5042 / 5233 | $0.0285 |
| sec03-vehicle-services-and-maintenance | 43 | 43 | 0 | 5764 / 4726 | $0.0273 |
| sec04-occupant-protection-and-vehicle-control | 43 | 40 | 3 | 5875 / 5756 | $0.0318 |
| sec05-driver-health-and-impairment | 46 | 46 | 0 | 6306 / 3843 | $0.0242 |
| sec06-decisions-distraction-respect | 45 | 45 | 0 | 6124 / 3441 | $0.0223 |
| sec07-sharing-the-road | 47 | 47 | 0 | 6450 / 5516 | $0.0315 |
| sec08-traffic-laws-signals-signs | 46 | 46 | 0 | 5352 / 4772 | $0.0270 |
| sec09-intersections-and-turning | 43 | 42 | 1 | 4995 / 4560 | $0.0256 |
| sec10-road-markings-and-zones | 52 | 51 | 1 | 5217 / 4823 | $0.0270 |
| sec11-parking-transporting-maritime | 53 | 53 | 0 | 5474 / 5273 | $0.0293 |
| sec12-speed-space-and-time | 44 | 44 | 0 | 5185 / 4766 | $0.0267 |
| sec13-focus-and-road-conditions | 48 | 48 | 0 | 5366 / 5016 | $0.0280 |
| sec14-failures-collisions-law-enforcement | 50 | 50 | 0 | 5632 / 5737 | $0.0314 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R03 | PARTIALLY_SUPPORTED | Page 26 states the 3-year teen requirement but does not state the adult requirement for comparison. | A teen's supervising driver needs 3 or more years of experience. |
| sec01-R04 | PARTIALLY_SUPPORTED | Page 28 states the 5-year adult requirement but does not state the teen requirement for comparison. | On the adult route that uses a permit, the supervising licensed driver must have 5 or more years of experience. |
| sec01-R09 | PARTIALLY_SUPPORTED | Page 29 states the farm-work area and no minimum age but does not state its relation to a first license. | An agricultural permit allows drivers under 18 to drive within a specific area for farm work with no minimum age for a juvenile agricultural permit. |
| sec02-R03 | PARTIALLY_SUPPORTED | Page 37 states the refusal suspension range but does not state the conviction suspension range for comparison. | Refusing to be tested could cost your driving privilege for 90 to 730 days, or until you reach age 21, whichever is longer. |
| sec02-R04 | PARTIALLY_SUPPORTED | Page 38 states the conviction suspension range but does not state the refusal suspension range for comparison. | A DUI conviction can include driving privileges suspended for 90 days to 4 years. |
| sec02-R10 | PARTIALLY_SUPPORTED | Page 36 states the license delay until 17 but does not state the under-21 impairment limits. | Minors who receive an alcohol, drug, or firearm offense run the risk of delaying their license until they are 17. |
| sec04-R03 | PARTIALLY_SUPPORTED | The page does not state that ABS is not a reason to follow more closely. | ABS allows steering during emergency braking but does not shorten stopping distance. |
| sec04-R05 | PARTIALLY_SUPPORTED | Page 58 does not state the 9 and 3 or 10 and 2 forward-driving positions. | The 12 position is recommended only when backing a vehicle. |
| sec04-R06 | PARTIALLY_SUPPORTED | Page 60 does not describe roll as side-to-side weight shift in turns. | Pitch shifts weight front to back: acceleration loads the rear and abrupt stopping loads the front. |
| sec09-F03 | PARTIALLY_SUPPORTED | Statement omits the required stop before yielding. | Before entering an intersection: stop and yield to pedestrians and traffic in the intersection, look in each direction multiple times, and check side mirrors and over shoulder. |
| sec10-R01 | PARTIALLY_SUPPORTED | The page states the color meanings but does not state that color must be answered before line style. | Yellow lines separate opposite-direction traffic and white lines separate same-direction traffic; dashed versus solid indicates whether crossing is allowed. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-wa-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
