# Fact check — Alabama (AL), Muse one call per section

Run 2026-10-28-rdmv-al-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 13 of 13 |
| Facts checked | 686 |
| Supported | 674 |
| Partially supported | 12 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4007 (79,534 input + 70,884 output tokens) |
| Cost per fact | $0.00058 |
| Projection, all 51 (37,967 facts) | $22.18 |
| Projection, states Muse can audit independently (33,681 facts) | $19.67 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-license-requirements-and-identification | 49 | 47 | 2 | 6950 / 5465 | $0.0319 |
| sec02-testing-renewal-and-license-classes | 46 | 46 | 0 | 6137 / 4857 | $0.0283 |
| sec03-losing-your-license-and-points | 41 | 41 | 0 | 5141 / 4377 | $0.0250 |
| sec04-driving-habits-turns-bicycles-motorcycles | 50 | 49 | 1 | 6654 / 5854 | $0.0332 |
| sec05-large-vehicles-parking-and-restraints | 43 | 43 | 0 | 4262 / 3969 | $0.0222 |
| sec06-driver-condition-phones-and-alcohol | 52 | 51 | 1 | 5505 / 5077 | $0.0285 |
| sec07-drugs-stopping-crashes-and-railroads | 61 | 59 | 2 | 6862 / 6822 | $0.0376 |
| sec08-regulatory-and-warning-signs | 67 | 67 | 0 | 6153 / 5188 | $0.0297 |
| sec09-guide-signs-markings-signals-roundabouts | 57 | 57 | 0 | 6322 / 5170 | $0.0299 |
| sec10-traffic-laws | 83 | 80 | 3 | 9383 / 10298 | $0.0555 |
| sec11-adjusting-to-driving-conditions | 64 | 64 | 0 | 8537 / 6634 | $0.0389 |
| sec12-freeways-and-vehicle-maintenance | 46 | 46 | 0 | 5025 / 3330 | $0.0204 |
| sec13-graduated-driver-license-summary | 27 | 24 | 3 | 2603 / 3843 | $0.0196 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F23 | PARTIALLY_SUPPORTED | Page allows foreign-born 15-year-olds with a US passport to use it instead of a birth certificate, so not every 15-year-old must show a certified US birth certificate. | A certified U.S. birth certificate is required for all 15-year-old applicants, except foreign-born applicants with a U.S. passport may use the passport to prove date of birth. |
| sec01-R09 | PARTIALLY_SUPPORTED | Cited page 12 states the Class M/B motor-driven-cycle rule but does not state the Class D/Y learner rule, which is on page 11. | Cite pages 11-12: Class D with Y is the learner license and Class M with B is limited to motor driven cycles for ages 14-15. |
| sec04-F30 | PARTIALLY_SUPPORTED | The cited page 27 does not state the intersections part, which appears on page 26. | Watch for cyclists when crossing sidewalks and when entering or leaving alleys or driveways. |
| sec06-R02 | PARTIALLY_SUPPORTED | Page 34 states the .05% impairment finding but does not state the .08% unlawful limit, which appears on the next page. | Research puts the start of impairment for most drivers at .05 percent. |
| sec07-F21 | PARTIALLY_SUPPORTED | The page states a tail wind makes a difference but does not state it lengthens the stop. | Wind direction and velocity affect stopping; drivers may not realize the difference a strong tail wind can make when trying to stop suddenly at high speed. |
| sec07-F46 | PARTIALLY_SUPPORTED | Page 42 alone does not state the more-than-one-track condition; it begins mid-sentence with are clear before crossing. | You must also stop if the crossing gate is lowered or when a train is approaching; the full multiple-track clearance rule spans pages 41-42. |
| sec10-F16 | PARTIALLY_SUPPORTED | Page 63 alone states only the destination one-way condition and omits the requirement stated on page 62 that the driver already be on a one-way street. | State only what page 63 says: after stopping you may turn left onto a one-way street with traffic moving from right to left, yielding to traffic and pedestrians. |
| sec10-F29 | PARTIALLY_SUPPORTED | Page 65 alone omits the opening condition on page 64 that the two vehicles enter an intersection not controlled by signs or signals from different roadways at about the same time. | Cite pages 64-65 together: if two vehicles enter an uncontrolled intersection from different roadways at about the same time, the vehicle on the left shall yield to the right. |
| sec10-F78 | PARTIALLY_SUPPORTED | Page 68 says backing on a public street is never advisable, not never prohibited as the fact states. | Except for backing into a parking place, it is never advisable to back on a public street or road. |
| sec13-F06 | PARTIALLY_SUPPORTED | The page also allows a licensed or certified driving instructor as supervisor, which the "only" claim omits. | A 15-year-old with a valid learner license may drive with a parent, guardian, licensed driver 21 or older in the front seat, or with a licensed or certified driving instructor in the front seat. |
| sec13-F12 | PARTIALLY_SUPPORTED | The page lists additional exceptions beyond those two, including workplace and school and religious events. | Late-night exceptions include riding with a licensee 21 or older with parental consent, a medical/fire/law-enforcement emergency, and going to or from regular workplace or school-sponsored or religious-sponsored events. |
| sec13-R02 | PARTIALLY_SUPPORTED | The summary omits the page's requirement that the supervisor occupy the front seat next to the driver. | A 15-year-old learner must be accompanied in the front seat by a parent, guardian, licensed driver 21 or older, or licensed/certified driving instructor, while restricted drivers may have only 1 nonfamily passenger. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-al-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
