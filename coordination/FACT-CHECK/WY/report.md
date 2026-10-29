# Fact check — WY (WY), Muse one call per section

Run 2026-10-28-rdmv-wy-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 976 |
| Supported | 975 |
| Partially supported | 0 |
| Not found on cited page | 1 |
| Contradicted | 0 |
| Exact cost | $0.4728 (82,443 input + 87,000 output tokens) |
| Cost per fact | $0.00048 |
| Projection, all 51 (37,967 facts) | $18.39 |
| Projection, states Muse can audit independently (33,681 facts) | $16.32 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-and-tests | 60 | 60 | 0 | 4542 / 4370 | $0.0243 |
| sec02-permits-and-graduated-licenses | 48 | 48 | 0 | 4066 / 3743 | $0.0210 |
| sec03-driver-services | 38 | 38 | 0 | 3367 / 3738 | $0.0201 |
| sec04-loss-of-driving-privilege | 108 | 108 | 0 | 9889 / 9371 | $0.0522 |
| sec05-occupant-protection | 40 | 40 | 0 | 3573 / 3656 | $0.0200 |
| sec06-alcohol-drugs-and-traffic-stops | 84 | 84 | 0 | 7260 / 7801 | $0.0422 |
| sec07-speed-right-of-way-and-winter | 70 | 70 | 0 | 5683 / 8110 | $0.0416 |
| sec08-stopping-turns-and-backing | 56 | 56 | 0 | 4305 / 5295 | $0.0279 |
| sec09-passing-and-parking | 58 | 58 | 0 | 4845 / 5551 | $0.0296 |
| sec10-interstates-markings-and-crossings | 63 | 63 | 0 | 4903 / 4982 | $0.0273 |
| sec11-crashes-and-road-sharing | 67 | 67 | 0 | 6085 / 6708 | $0.0361 |
| sec12-defensive-driving | 51 | 51 | 0 | 4757 / 5074 | $0.0275 |
| sec13-special-conditions-and-emergencies | 87 | 87 | 0 | 6786 / 5515 | $0.0319 |
| sec14-hazards-work-zones-and-distraction | 65 | 64 | 1 | 5569 / 6351 | $0.0340 |
| sec15-definitions | 47 | 47 | 0 | 4196 / 3802 | $0.0214 |
| sec16-signs-and-signals | 34 | 34 | 0 | 2617 / 2933 | $0.0157 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec14-R24 | NOT_FOUND_ON_PAGE | Page 88 states cell phone use is dangerous but does not state it distracts from safe operation. | Using a cell phone while driving is dangerous. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-wy-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
