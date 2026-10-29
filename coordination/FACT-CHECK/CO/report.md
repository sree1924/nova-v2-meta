# Fact check — Colorado (CO), Muse one call per section

Run 2026-10-28-rdmv-co-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 622 |
| Supported | 613 |
| Partially supported | 9 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3825 (71,061 input + 69,094 output tokens) |
| Cost per fact | $0.00061 |
| Projection, all 51 (37,967 facts) | $23.35 |
| Projection, states Muse can audit independently (33,681 facts) | $20.71 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-tests-minor-drivers | 52 | 49 | 3 | 5815 / 6129 | $0.0333 |
| sec02-license-loss-seat-belts-impaired-driving | 43 | 43 | 0 | 4568 / 4806 | $0.0261 |
| sec03-impairment-effects-before-you-drive | 29 | 29 | 0 | 3287 / 2925 | $0.0165 |
| sec04-basic-driving | 28 | 28 | 0 | 3277 / 3661 | $0.0197 |
| sec05-traffic-signals-signs | 42 | 42 | 0 | 4323 / 4282 | $0.0236 |
| sec06-pavement-markings-lane-controls | 45 | 45 | 0 | 4848 / 5100 | $0.0277 |
| sec07-right-of-way | 37 | 36 | 1 | 3645 / 3796 | $0.0207 |
| sec08-speed-turning-parking | 46 | 46 | 0 | 5234 / 5271 | $0.0289 |
| sec09-freeway-changing-lanes-passing | 39 | 39 | 0 | 3931 / 4068 | $0.0222 |
| sec10-hills-night-weather-snow | 32 | 32 | 0 | 3255 / 3774 | $0.0201 |
| sec11-seasonal-mountain-rural-construction-tips | 46 | 45 | 1 | 5334 / 4874 | $0.0274 |
| sec12-sharing-road-trucks-school-buses | 48 | 48 | 0 | 7220 / 4450 | $0.0279 |
| sec13-railroad-light-rail-bicyclists | 45 | 44 | 1 | 4902 / 6042 | $0.0318 |
| sec14-motorcycles-pedestrians-careless-driving | 45 | 44 | 1 | 5200 / 5190 | $0.0286 |
| sec15-aggressive-driving-emergencies-crashes | 45 | 43 | 2 | 6222 / 4726 | $0.0279 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F19 | PARTIALLY_SUPPORTED | Page 4 states the right-turn position but is cut off before stating the left-most position, which appears on page 5. | When turning right, start from the right-most portion of your lane; the left-turn starting position is stated on the next page. |
| sec01-R04 | PARTIALLY_SUPPORTED | Page 4 states the next-business-day wait for the drive test but does not state that it does not apply to the written test. | A failed drive test can be retaken on the next business day. |
| sec01-R05 | PARTIALLY_SUPPORTED | Page 4 states the right-turn position but is cut off before stating the left-most starting position. | For a right turn begin from the right-most part of your lane; the left-turn rule continues on the next page. |
| sec07-F01 | PARTIALLY_SUPPORTED | The page excerpt confirms fewer conflicts but does not state that troublesome left-turn movements are what is eliminated. | With a DDI, movements of four-way interchanges are eliminated, which allows for fewer conflicts with other vehicles. |
| sec11-F01 | PARTIALLY_SUPPORTED | The page does not state that melting snow and ice are at their most dangerous. | Slippery roads reduce tire grip and lengthen stopping distance when snow or ice begins to melt. |
| sec13-F33 | PARTIALLY_SUPPORTED | The page says to look for oncoming motorcyclists, not an oncoming bicyclist/cyclist. | To avoid the left-turn crash, look for oncoming motorcyclists on the shoulder, lane edge or behind vehicles and judge distance and speed. |
| sec14-F17 | PARTIALLY_SUPPORTED | Omits traffic conditions as a reason a bicyclist may be unable to signal. | Bicyclists must signal but may be unable to if skill level or road or traffic conditions require both hands on the handlebars. |
| sec15-R06 | PARTIALLY_SUPPORTED | Omits the no drugs or alcohol condition for Move It Law and the full qualifying conditions for Accident Alert Status. | Move It Law requires drivable vehicle, no drugs/alcohol and no injuries on a divided highway; Accident Alert requires no alcohol/drugs, no injuries and drivable vehicles with report within 24 hours. |
| sec15-R08 | PARTIALLY_SUPPORTED | Omits the one-lane-each-direction trigger and the stationary-vehicle-with-hazards scope for the slow-down branch. | Move over if safe; if not safe or on a one-lane-each-direction road, slow to at least 20 mph below the posted limit for any stationary vehicle with hazards flashing. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-co-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
