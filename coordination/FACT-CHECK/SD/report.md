# Fact check — SD (SD), Muse one call per section

Run 2026-10-28-rdmv-sd-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 18 of 18 |
| Facts checked | 991 |
| Supported | 989 |
| Partially supported | 2 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5517 (95,478 input + 101,738 output tokens) |
| Cost per fact | $0.00056 |
| Projection, all 51 (37,967 facts) | $21.14 |
| Projection, states Muse can audit independently (33,681 facts) | $18.75 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-emergency-notice | 13 | 13 | 0 | 1618 / 3516 | $0.0170 |
| sec02-licensing-requirements | 73 | 73 | 0 | 6743 / 6811 | $0.0374 |
| sec03-permits-and-tests | 49 | 49 | 0 | 4613 / 3794 | $0.0219 |
| sec04-driving-privileges | 77 | 77 | 0 | 6372 / 7694 | $0.0407 |
| sec05-fitness-to-drive | 91 | 91 | 0 | 8627 / 7743 | $0.0437 |
| sec06-vehicle-preparation | 62 | 62 | 0 | 5689 / 6504 | $0.0348 |
| sec07-occupant-protection | 51 | 51 | 0 | 5436 / 5202 | $0.0289 |
| sec08-basic-driving | 28 | 28 | 0 | 2699 / 3049 | $0.0163 |
| sec09-right-of-way-and-signs | 72 | 71 | 1 | 6517 / 7635 | $0.0406 |
| sec10-markings-and-lane-controls | 25 | 25 | 0 | 2160 / 2634 | $0.0139 |
| sec11-turning-and-intersections | 61 | 60 | 1 | 5396 / 6600 | $0.0348 |
| sec12-school-buses-and-parking | 29 | 29 | 0 | 2876 / 3139 | $0.0169 |
| sec13-lanes-and-traffic | 45 | 45 | 0 | 4539 / 4797 | $0.0261 |
| sec14-visual-search-and-speed | 62 | 62 | 0 | 6376 / 6060 | $0.0337 |
| sec15-space-and-communication | 76 | 76 | 0 | 8380 / 8285 | $0.0457 |
| sec16-emergencies-and-crashes | 63 | 63 | 0 | 5969 / 5961 | $0.0328 |
| sec17-sharing-the-road | 77 | 77 | 0 | 7999 / 8367 | $0.0456 |
| sec18-special-situations | 37 | 37 | 0 | 3469 / 3947 | $0.0211 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec09-R07 | PARTIALLY_SUPPORTED | Omits the alternative stopping location stated on the page. | When a train or railroad vehicle is approaching, stop behind the stop line or before the intersection is clear. |
| sec11-F18 | PARTIALLY_SUPPORTED | The page makes traffic-clear the condition for turning, not for stopping; stopping occurs when reaching the other side. | Signal left, check traffic and left blind spot, and when traffic is clear turn hard left to the other side and stop when you have reached the other side. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-sd-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
