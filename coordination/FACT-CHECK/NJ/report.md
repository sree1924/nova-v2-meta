# Fact check — New Jersey (NJ), Muse one call per section

Run 2026-10-28-rdmv-nj-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 895 |
| Supported | 888 |
| Partially supported | 6 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5219 (122,935 input + 86,653 output tokens) |
| Cost per fact | $0.00058 |
| Projection, all 51 (37,967 facts) | $22.14 |
| Projection, states Muse can audit independently (33,681 facts) | $19.64 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-license-system-part-1 | 62 | 62 | 0 | 10513 / 6895 | $0.0424 |
| sec02-license-system-part-2 | 63 | 62 | 1 | 9918 / 6438 | $0.0398 |
| sec03-driver-testing | 60 | 59 | 1 | 7226 / 5774 | $0.0336 |
| sec04-driver-responsibility-part-1 | 73 | 72 | 1 | 9737 / 7971 | $0.0460 |
| sec05-driver-responsibility-part-2 | 74 | 74 | 0 | 8004 / 4731 | $0.0301 |
| sec06-safe-driving-rules-part-1 | 69 | 69 | 0 | 9705 / 7397 | $0.0436 |
| sec07-safe-driving-rules-part-2 | 68 | 68 | 0 | 9216 / 6404 | $0.0387 |
| sec08-defensive-driving-part-1 | 64 | 64 | 0 | 8121 / 6133 | $0.0362 |
| sec09-defensive-driving-part-2 | 72 | 72 | 0 | 9642 / 5746 | $0.0365 |
| sec10-drinking-drugs-health | 41 | 41 | 0 | 4870 / 3830 | $0.0224 |
| sec11-privileges-penalties-part-1 | 55 | 54 | 1 | 9297 / 6729 | $0.0402 |
| sec12-privileges-penalties-part-2 | 52 | 50 | 2 | 6937 / 5051 | $0.0301 |
| sec13-sharing-the-road | 55 | 55 | 0 | 8987 / 4857 | $0.0319 |
| sec14-vehicle-information | 35 | 34 | 1 | 4581 / 4021 | $0.0228 |
| sec15-driver-safety-signs | 52 | 52 | 0 | 6181 / 4676 | $0.0276 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-R06 | PARTIALLY_SUPPORTED | The cited page describes the instructor-purchase and validation rule but does not state it is the only road. | Option A, the early bird road, is a road where an approved instructor buys the permit and the MVC validates it only after the course. |
| sec04-R12 | PARTIALLY_SUPPORTED | Omits required conditions for front-seat placement such as no rear seat, too-small rear seat, medical monitoring, or carrying more children than fit in back. | A passenger-side switch is for people who must place an infant or child age 1 to 12 in front only for the listed reasons such as no rear seat, rear seat too small, medical monitoring, or transporting more children than fit in back. |
| sec11-R01 | PARTIALLY_SUPPORTED | Page 129 supports the 0.05% interlock threshold but does not state the 0.08% adult DUI limit. | An installed ignition interlock prevents the vehicle from starting if BAC exceeds 0.05%. |
| sec12-F05 | PARTIALLY_SUPPORTED | The provider fee is due prior to attending, not prior to scheduling. | Before scheduling with a private provider pay the MVC a $75 administration fee; pay the separate provider program fee prior to attending the class. |
| sec12-F21 | PARTIALLY_SUPPORTED | Omits the required condition that privileges remain in good standing. | Up to three points come off each year without a violation or suspension while privileges remain in good standing, never below zero. |
| sec14-F12 | PARTIALLY_SUPPORTED | The page requires 24-hour replacement for lost or damaged plates, not for lost or stolen plates as stated. | Report lost or stolen plates to police and MVC, retain complaint copy, and replace lost or damaged plates within 24 hours at an MVC Vehicle Center. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nj-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
