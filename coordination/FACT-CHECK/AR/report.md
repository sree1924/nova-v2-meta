# Fact check — Arkansas (AR), Muse one call per section

Run 2026-10-28-rdmv-ar-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 728 |
| Supported | 721 |
| Partially supported | 7 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3981 (69,759 input + 73,161 output tokens) |
| Cost per fact | $0.00055 |
| Projection, all 51 (37,967 facts) | $20.76 |
| Projection, states Muse can audit independently (33,681 facts) | $18.42 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-license | 50 | 50 | 0 | 5240 / 4698 | $0.0265 |
| sec02-arkansas-law | 76 | 75 | 1 | 7978 / 7768 | $0.0430 |
| sec03-work-zones | 48 | 48 | 0 | 5247 / 4362 | $0.0251 |
| sec04-signals-signs | 44 | 44 | 0 | 3980 / 4392 | $0.0236 |
| sec05-railroad-crossings | 33 | 33 | 0 | 2719 / 3380 | $0.0178 |
| sec06-lanes-turns | 32 | 30 | 2 | 2910 / 3860 | $0.0200 |
| sec07-right-of-way | 25 | 25 | 0 | 2215 / 2711 | $0.0143 |
| sec08-parking | 29 | 29 | 0 | 2243 / 2199 | $0.0121 |
| sec09-vehicle-operation-distraction | 39 | 39 | 0 | 3816 / 3523 | $0.0197 |
| sec10-observation-backing | 32 | 32 | 0 | 3058 / 3198 | $0.0174 |
| sec11-lights-conditions | 52 | 51 | 1 | 4489 / 5186 | $0.0277 |
| sec12-traffic-space | 82 | 82 | 0 | 7827 / 8035 | $0.0439 |
| sec13-trucks | 26 | 26 | 0 | 2507 / 2528 | $0.0139 |
| sec14-bicycles-motorcycles | 46 | 43 | 3 | 4631 / 5982 | $0.0312 |
| sec15-fitness | 56 | 56 | 0 | 5695 / 5573 | $0.0308 |
| sec16-emergencies-crashes | 58 | 58 | 0 | 5204 / 5766 | $0.0310 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-F23 | PARTIALLY_SUPPORTED | The statement omits the page's knowingly mental-state requirement. | A person shall not knowingly smoke tobacco in a motor vehicle with a child younger than 14 as a passenger. |
| sec06-F24 | PARTIALLY_SUPPORTED | The page limits the stop-line rule to approaching a stop sign, which the fact omits. | When approaching a stop sign, stop at the stop line if present, making a complete stop before reaching the line. |
| sec06-R08 | PARTIALLY_SUPPORTED | The page states the far-left lane is intended for passing but does not state it must not be used as the normal through lane. | When passing vehicles on multi-lane roads, the far-left lane is intended for passing slower vehicles. |
| sec11-F14 | PARTIALLY_SUPPORTED | The page limits the sharp-blast warning to a child or older person, not to someone generally. | Sound a sharp horn blast when a child or older person is about to walk, run, or ride into the street or another car is in danger of hitting you. |
| sec14-F06 | PARTIALLY_SUPPORTED | Page states traffic conditions, not road conditions, as reason for riding away from right edge. | A bicyclist riding away from the lane's right edge may be accounting for traffic conditions or preparing a left turn. |
| sec14-R01 | PARTIALLY_SUPPORTED | Page states riders are easily injured, not specifically seriously injured. | A bicycle rider is exposed and can be easily injured in a collision. |
| sec14-R02 | PARTIALLY_SUPPORTED | Page states oncoming bicycle traffic is often overlooked but does not state the scanning-for-larger-vehicles reason on that page. | Oncoming bicycle traffic is often overlooked. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ar-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
