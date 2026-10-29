# Fact check — PA (PA), Muse one call per section

Run 2026-10-28-rdmv-pa-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 999 |
| Supported | 996 |
| Partially supported | 0 |
| Not found on cited page | 3 |
| Contradicted | 0 |
| Exact cost | $0.5613 (104,548 input + 101,314 output tokens) |
| Cost per fact | $0.00056 |
| Projection, all 51 (37,967 facts) | $21.33 |
| Projection, states Muse can audit independently (33,681 facts) | $18.92 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-permit-and-license | 70 | 70 | 0 | 7629 / 7862 | $0.0430 |
| sec02-knowledge-and-road-tests | 43 | 43 | 0 | 4012 / 4329 | $0.0234 |
| sec03-traffic-signals | 50 | 50 | 0 | 4735 / 4911 | $0.0268 |
| sec04-regulatory-signs | 52 | 52 | 0 | 4826 / 4085 | $0.0234 |
| sec05-warning-signs | 77 | 77 | 0 | 7250 / 6407 | $0.0363 |
| sec06-guide-signs-and-markings | 66 | 66 | 0 | 5773 / 6287 | $0.0339 |
| sec07-preparing-and-driver-factors | 80 | 80 | 0 | 7372 / 8009 | $0.0433 |
| sec08-space-and-speed | 142 | 139 | 3 | 14317 / 14201 | $0.0783 |
| sec09-turning-merging-passing | 46 | 46 | 0 | 4797 / 4754 | $0.0262 |
| sec10-intersections-and-curves | 52 | 52 | 0 | 5562 / 9885 | $0.0490 |
| sec11-highways-and-parking | 40 | 40 | 0 | 3884 / 3560 | $0.0200 |
| sec12-sharing-and-work-zones | 85 | 85 | 0 | 10173 / 8455 | $0.0486 |
| sec13-driving-emergencies | 60 | 60 | 0 | 7046 / 6028 | $0.0344 |
| sec14-driving-record | 65 | 65 | 0 | 8806 / 5385 | $0.0339 |
| sec15-laws-and-restraints | 50 | 50 | 0 | 6791 / 5775 | $0.0330 |
| sec16-carbon-monoxide | 21 | 21 | 0 | 1575 / 1381 | $0.0078 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec08-R76 | NOT_FOUND_ON_PAGE | The cited page text does not describe the left-turn arm position. | Limit the claim to what the page states: use the illustrated hand signals if turn signals do not work. |
| sec08-R77 | NOT_FOUND_ON_PAGE | The cited page text does not describe the right-turn arm position. | Limit the claim to what the page states: use the illustrated hand signals if turn signals do not work. |
| sec08-R78 | NOT_FOUND_ON_PAGE | The cited page text does not describe the slowing-or-stopping arm position. | Limit the claim to what the page states: use the illustrated hand signals if turn signals do not work. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-pa-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
