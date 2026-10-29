# Fact check — OK (OK), Muse one call per section

Run 2026-10-28-rdmv-ok-class-d. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 13 of 13 |
| Facts checked | 358 |
| Supported | 349 |
| Partially supported | 9 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3217 (69,222 input + 55,344 output tokens) |
| Cost per fact | $0.00090 |
| Projection, all 51 (37,967 facts) | $34.12 |
| Projection, states Muse can audit independently (33,681 facts) | $30.27 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-how-to-apply-for-your-license | 44 | 44 | 0 | 11179 / 4865 | $0.0347 |
| sec02-license-restrictions-and-renewals | 23 | 23 | 0 | 3729 / 3126 | $0.0179 |
| sec03-requirements-for-oklahoma-drivers | 20 | 17 | 3 | 3341 / 4524 | $0.0234 |
| sec04-signs-signals-and-markings | 29 | 29 | 0 | 7167 / 7253 | $0.0398 |
| sec05-right-of-way-when-to-yield | 25 | 25 | 0 | 4152 / 3588 | $0.0204 |
| sec06-lane-usage-and-maneuvers | 36 | 36 | 0 | 6780 / 3523 | $0.0234 |
| sec07-basic-speed-rule | 21 | 21 | 0 | 2925 / 2360 | $0.0137 |
| sec08-stopping-and-following | 22 | 22 | 0 | 3978 / 3993 | $0.0219 |
| sec09-parking | 22 | 22 | 0 | 3595 / 3357 | $0.0188 |
| sec10-sharing-the-road | 36 | 35 | 1 | 8315 / 7119 | $0.0406 |
| sec11-driving-tips | 28 | 28 | 0 | 4903 / 3450 | $0.0208 |
| sec12-alcohol-drugs-and-driving | 28 | 28 | 0 | 4992 / 3117 | $0.0195 |
| sec13-violations-and-penalties | 24 | 19 | 5 | 4166 / 5069 | $0.0268 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec03-F02 | PARTIALLY_SUPPORTED | The page states the $25,000 limit as for two or more persons, which the fact omits or reinterprets. | State the minimums exactly as printed: $25,000 for injury or death of two or more persons, $50,000 for injury or death of two or more persons, $25,000 property damage, all per accident. |
| sec03-R02 | PARTIALLY_SUPPORTED | The page lists the $25,000 bodily limit as for two or more persons, not as a distinct single-person limit. | State the minimums exactly as printed: $25,000 for injury or death of two or more persons, $50,000 for injury or death of two or more persons, $25,000 property damage, all per accident. |
| sec03-R10 | PARTIALLY_SUPPORTED | The fact omits the page's if-equipped-with-passenger-airbag condition and the at-least qualifier for 26 percent. | If the car has a passenger-side airbag, put children under 12 in the back seat, and the back seat is at least 26 percent safer than the front seat. |
| sec10-F13 | PARTIALLY_SUPPORTED | The page says nearly half at guarded crossings, not half. | Nearly half the car/train collisions happen at crossings with lights, bells or gates and two-thirds happen in full daylight. |
| sec13-F04 | PARTIALLY_SUPPORTED | The page says some collisions, not all collisions. | Some collisions plus any in-state or out-of-state traffic convictions enter the driving record that Service Oklahoma keeps and forwards interstate. |
| sec13-F10 | PARTIALLY_SUPPORTED | The one-point catch-all excludes violations requiring suspension or revocation action, which the statement omits. | Add that all other violations score one excluding violations requiring suspension or revocation action. |
| sec13-R03 | PARTIALLY_SUPPORTED | The 7-year and $10,000 penalty is stated only for use, carry, borrow or buy of fake ID, not for issuers. | Fake-ID use, carry, borrow or buy threatens seven years and ten thousand dollars, and knowingly licensing the unentitled is separately a felony. |
| sec13-R04 | PARTIALLY_SUPPORTED | The page says some collisions, not all crashes, and does not call the record permanent. | Some collisions and any in-state or out-of-state convictions go on the driving record maintained and transferred interstate. |
| sec13-R10 | PARTIALLY_SUPPORTED | The one-point miscellany category excludes violations requiring suspension or revocation action, which the statement omits. | Reckless and school-bus failures score four while equipment and other violations excluding suspension or revocation violations score one. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ok-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
