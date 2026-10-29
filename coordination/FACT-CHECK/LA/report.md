# Fact check — Louisiana (LA), Muse one call per section

Run 2026-10-28-rdmv-la-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 17 of 17 |
| Facts checked | 1128 |
| Supported | 1122 |
| Partially supported | 6 |
| Not found on cited page | 3 |
| Contradicted | 0 |
| Exact cost | $0.6409 (128,999 input + 112,851 output tokens) |
| Cost per fact | $0.00057 |
| Projection, all 51 (37,967 facts) | $21.57 |
| Projection, states Muse can audit independently (33,681 facts) | $19.14 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-documents | 60 | 60 | 0 | 6390 / 4791 | $0.0283 |
| sec02-permits-tests-records | 101 | 99 | 2 | 9720 / 9361 | $0.0519 |
| sec03-highway-transportation | 58 | 57 | 1 | 6319 / 5894 | $0.0329 |
| sec04-signs-work-zones | 89 | 89 | 0 | 7740 / 9087 | $0.0483 |
| sec05-signals-markings | 56 | 56 | 0 | 4595 / 5546 | $0.0293 |
| sec06-basic-driving-safety | 108 | 108 | 0 | 15797 / 10373 | $0.0638 |
| sec07-defensive-driver-fitness | 59 | 59 | 0 | 7087 / 6462 | $0.0363 |
| sec08-scanning-spacing-parking | 89 | 88 | 1 | 10565 / 9435 | $0.0533 |
| sec09-passing-night-age | 72 | 71 | 1 | 7857 / 7150 | $0.0402 |
| sec10-sharing-the-road | 57 | 55 | 2 | 6736 / 6476 | $0.0359 |
| sec11-traffic-laws | 72 | 72 | 0 | 7702 / 6986 | $0.0393 |
| sec12-crossings-laws-fraud | 57 | 57 | 0 | 5790 / 5017 | $0.0286 |
| sec13-interstate-rural | 74 | 74 | 0 | 9642 / 7323 | $0.0432 |
| sec14-hazards-emergencies | 73 | 76 | -3 | 11463 / 8007 | $0.0484 |
| sec15-offenses-impairment | 46 | 46 | 0 | 6096 / 5402 | $0.0306 |
| sec16-trailer-safety | 24 | 24 | 0 | 2069 / 2177 | $0.0118 |
| sec17-registration-insurance | 33 | 31 | 2 | 3431 / 3364 | $0.0186 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-F17 | PARTIALLY_SUPPORTED | The page says “sibling” without stating the sibling must be licensed. | A learner-stage driver must be accompanied by a licensed adult aged at least twenty-one or a sibling aged at least eighteen. |
| sec02-F22 | PARTIALLY_SUPPORTED | The page says “sibling” without stating the sibling must be licensed. | An intermediate driver may not drive from 11:00 p.m. to 5:00 a.m. unless accompanied by a licensed adult aged at least twenty-one or a sibling aged at least eighteen. |
| sec03-R09 | NOT_FOUND_ON_PAGE | The cited page does not mention exit-only access; it defines Limited, Partial, and Full Access highways. | The guide defines Limited Access as limited to signed exits, Partial Access as allowing street access but not driveways, and Full Access as allowing driveways and any other access. |
| sec08-F36 | NOT_FOUND_ON_PAGE | Page 70 alone does not state that total stopping distance includes perception, reaction and braking distances. | Cite page 69 for the three-part definition; page 70 only states the vehicle travels a minimum of 268 feet at 50 mph until stopped. |
| sec09-R07 | PARTIALLY_SUPPORTED | The page states the prohibition but does not state the hiding reason. | Do not pass a vehicle stopped at a crosswalk. |
| sec10-F09 | PARTIALLY_SUPPORTED | Page 85 advises extra caution and reduced speed in wet, windy, icy weather but does not state instability or extra space there. | Use extra caution and reduce speed near bicyclists in wet, windy, or icy weather. |
| sec10-F22 | PARTIALLY_SUPPORTED | Page 87 states missed in a quick look, but the blind-spot wording is split with the prior page. | A motorcycle can be missed in a quick look due to its smaller size. |
| sec17-R01 | PARTIALLY_SUPPORTED | The statement omits the 10-day deadline stated on the page. | Louisiana law requires you to correct the address on your registration within 10 days after a move. |
| sec17-R15 | NOT_FOUND_ON_PAGE | The page does not direct readers to consult the agency for current title, registration, plate and service fees generally. | For specific fee information on commercial vehicles, motorcycles, special license plates, license plate transfers, etc., contact your local Office of Motor Vehicles or visit www.expresslane.org. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-la-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
