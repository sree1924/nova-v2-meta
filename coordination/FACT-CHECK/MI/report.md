# Fact check — Michigan (MI), Muse one call per section

Run 2026-10-28-rdmv-mi-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 730 |
| Supported | 721 |
| Partially supported | 9 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4319 (81,232 input + 77,723 output tokens) |
| Cost per fact | $0.00059 |
| Projection, all 51 (37,967 facts) | $22.46 |
| Projection, states Muse can audit independently (33,681 facts) | $19.93 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-residency-licenses-real-id | 46 | 46 | 0 | 5507 / 5459 | $0.0301 |
| sec02-graduated-driver-licensing | 49 | 46 | 3 | 5486 / 6726 | $0.0354 |
| sec03-tests-permits-skills-renewal | 52 | 51 | 1 | 6767 / 5683 | $0.0326 |
| sec04-driving-record-points-alcohol | 53 | 53 | 0 | 5932 / 5186 | $0.0295 |
| sec05-distracted-driving-seat-belts-children | 47 | 47 | 0 | 5049 / 6033 | $0.0320 |
| sec06-speed-work-zones-emergency-school-bus | 52 | 52 | 0 | 5509 / 5194 | $0.0290 |
| sec07-right-of-way-passing | 52 | 52 | 0 | 5127 / 5556 | $0.0300 |
| sec08-lanes-turning-roundabouts | 46 | 44 | 2 | 4436 / 5518 | $0.0290 |
| sec09-railroad-crossings-parking | 53 | 53 | 0 | 5283 / 5069 | $0.0281 |
| sec10-traffic-signs | 64 | 64 | 0 | 5331 / 4320 | $0.0250 |
| sec11-pavement-markings-signals | 54 | 54 | 0 | 6363 / 6110 | $0.0339 |
| sec12-sharing-the-road | 54 | 53 | 1 | 6912 / 5850 | $0.0335 |
| sec13-safe-driving-freeways-weather | 54 | 54 | 0 | 7383 / 5515 | $0.0327 |
| sec14-stopping-night-emergencies-crashes | 54 | 52 | 2 | 6147 / 5504 | $0.0311 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-R04 | PARTIALLY_SUPPORTED | The page requires 6 months on Level 2 plus 12 clean months driving, not 12 months all on Level 2. | Level 2 looks back 90 days, while Level 3 needs 6 months on Level 2 and 12 consecutive clean months driving. |
| sec02-R10 | PARTIALLY_SUPPORTED | Page 18 states the 70 percent score for Segment 1 but does not state the Segment 2 score. | Segment 1 requires a minimum of 70 percent on the cited page; Segment 2 is stated on another page. |
| sec02-R11 | PARTIALLY_SUPPORTED | Page 20 states the 30-day adult practice but does not state the teen supervised-hours log. | Adults must practice at least 30 days on a TIP before the skills test; the teen-hours comparison is on another page. |
| sec03-F32 | PARTIALLY_SUPPORTED | The page says online filers only have the opportunity to update linked vehicle records, not that it updates automatically. | An online address change updates your license or ID and voter registration, with the opportunity to update vehicle records linked to your license account. |
| sec08-F27 | PARTIALLY_SUPPORTED | Fact omits the page's additional exception for other danger beyond collision. | Inside a roundabout stop only when it is the only way to safely avoid a collision or other danger. |
| sec08-R10 | PARTIALLY_SUPPORTED | Fact adds a causal link between the 15-foot limit and train overhang not stated on the page. | With a train coming stop no more than 50 feet or less than 15 feet from the tracks; trains overhang the tracks by at least three feet on each side. |
| sec12-R01 | PARTIALLY_SUPPORTED | Page 70 alone states the off-balance effect but does not state the wind-blast cause, which appears on page 69. | A vehicle can push a motorcyclist, scooter operator or bicyclist off balance, increasing the chances of a crash. |
| sec14-F16 | PARTIALLY_SUPPORTED | Page 78 ends mid-sentence at 'seat belt' and does not include 'buckled, until help arrives' on that page. | Limit the claim to what page 78 states: stay in the car with seat belt; cite page 79 for 'buckled, until help arrives.' |
| sec14-R13 | PARTIALLY_SUPPORTED | Page 81 does not state try to drive away or sound the horn; that instruction is on page 80. | Limit page-81 claim to stay inside the locked car and call for assistance; cite page 80 for drive away or sound horn. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-mi-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
