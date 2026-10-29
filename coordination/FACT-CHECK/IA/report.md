# Fact check — IA (IA), Muse one call per section

Run 2026-10-28-rdmv-ia-class-c. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 17 of 17 |
| Facts checked | 630 |
| Supported | 611 |
| Partially supported | 19 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3941 (67,033 input + 73,006 output tokens) |
| Cost per fact | $0.00063 |
| Projection, all 51 (37,967 facts) | $23.75 |
| Projection, states Muse can audit independently (33,681 facts) | $21.07 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-drivers-license | 33 | 33 | 0 | 2369 / 2923 | $0.0154 |
| sec02-sign-basics-colors-shapes | 27 | 24 | 3 | 2071 / 3310 | $0.0167 |
| sec03-regulatory-warning-signs | 44 | 43 | 1 | 3982 / 3957 | $0.0218 |
| sec04-pedestrian-signals-railroad-work-zones | 47 | 45 | 2 | 4990 / 5946 | $0.0315 |
| sec05-lane-use-markings | 31 | 29 | 2 | 3506 / 4528 | $0.0236 |
| sec06-intersections-emergency-school-bus | 43 | 43 | 0 | 4452 / 4532 | $0.0248 |
| sec07-parking-move-over-clear-it | 31 | 30 | 1 | 2455 / 4521 | $0.0223 |
| sec08-vehicle-readiness | 42 | 42 | 0 | 4063 / 4683 | $0.0250 |
| sec09-driver-assistance-systems | 44 | 44 | 0 | 6167 / 4441 | $0.0266 |
| sec10-occupant-safety-distraction | 43 | 42 | 1 | 4262 / 4968 | $0.0264 |
| sec11-impairment-trip-planning | 23 | 23 | 0 | 2482 / 3287 | $0.0171 |
| sec12-vehicle-control-speed | 42 | 39 | 3 | 4436 / 5221 | $0.0277 |
| sec13-turning-lanes-passing | 42 | 41 | 1 | 3925 / 4408 | $0.0236 |
| sec14-defensive-driving-communication | 31 | 30 | 1 | 3346 / 3792 | $0.0203 |
| sec15-highways-interchanges-roundabouts | 33 | 33 | 0 | 5541 / 3442 | $0.0216 |
| sec16-rural-night-sharing-weather | 46 | 43 | 3 | 6236 / 6311 | $0.0346 |
| sec17-emergencies-crashes-law-enforcement | 28 | 27 | 1 | 2750 / 2736 | $0.0151 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec02-F05 | PARTIALLY_SUPPORTED | Page states only general warning and does not mention slowing down and staying alert. | Yellow means general warning. |
| sec02-R07 | PARTIALLY_SUPPORTED | Page states the octagon controls an intersection but does not state the triangle controls intersections. | The octagon demands a full stop at a controlled intersection and the triangle means yield the right of way. |
| sec02-R08 | PARTIALLY_SUPPORTED | Page does not describe the pennant as a sideways triangle or the diamond as four-sided. | The pennant is on the left marking a no-passing zone, while the diamond warns of special road hazards. |
| sec03-R01 | PARTIALLY_SUPPORTED | The page states the stop and yield rules but never uses or describes a two-point visibility maneuver. | The stop sign demands a full stop until crossing traffic clears, stopping at the stop line if present, while the yield sign requires slowing and yielding the right of way. |
| sec04-R08 | PARTIALLY_SUPPORTED | Omits the page's exceptions for officer/signal direction and EXEMPT signs. | Buses, hired rides, and hazmat haulers must stop 15 to 50 feet before the rails unless directed to proceed or the crossing is marked EXEMPT. |
| sec04-R12 | PARTIALLY_SUPPORTED | Page lists them as conveyances with pedestrian rights but does not state they are not vehicles. | Skateboards and scooters are listed as pedestrian conveyances covered by the pedestrian term. |
| sec05-F04 | PARTIALLY_SUPPORTED | Omits the third sign type, “Yield Here to Pedestrians and Bicycles,” listed on the page. | Yield lines mark where to yield for “Yield,” “Yield Here To Pedestrians,” or “Yield Here to Pedestrians and Bicycles” signs. |
| sec05-R07 | PARTIALLY_SUPPORTED | Omits the unless-instructed exception for the shoulder and overstates the left lane as exclusively for passing when page says generally. | Unless instructed by a device or official, never drive or pass on the shoulder; the left lane is generally used for passing. |
| sec07-R10 | PARTIALLY_SUPPORTED | Page says suspension is for up to one year, not a mandatory full year. | The slowdown sets no number, only reasonable and proper, while the penalty allows suspension for up to one year. |
| sec10-R14 | PARTIALLY_SUPPORTED | Hands-free is not voice-only for all uses because video streaming/calls are banned even with voice commands. | Hands-free generally requires no holding or manual interaction and voice activation for calls, but video streaming/calls remain banned even with voice commands. |
| sec12-F15 | PARTIALLY_SUPPORTED | The page says the 4- to 5-second rule applies at 40 mph, not past 40 mph. | At speeds of 40 mph a 4- to 5-second following distance is recommended, and 6 or more seconds when slippery or view-blocked. |
| sec12-R07 | PARTIALLY_SUPPORTED | The page specifies four- to five-seconds at 40 mph and six-plus when slippery/view-blocked, not five or six-plus generally. | At speeds of 40 mph use four- to five-seconds, and six or more seconds when slippery or view-blocked, and with ABS press hard and hold. |
| sec12-R12 | PARTIALLY_SUPPORTED | The statement omits the page's day/night, surfaced/unsurfaced, and truck qualifiers for the 50 and 60 mph limits. | 50 mph on unsurfaced secondaries sunset-sunrise and for all trucks on secondaries anytime; 60 mph on primaries, urban interstates, and secondaries including unpaved sunrise-sunset; 70 mph rural interstates. |
| sec13-R10 | PARTIALLY_SUPPORTED | The page requires checking the far lane for same-gap mergers but does not state that near checks miss them. | Check the far lane, if there is one, as someone in that lane may be planning to move into the same lane you want to enter. |
| sec14-R06 | PARTIALLY_SUPPORTED | Omits that sign is only possible (may) and omits flashing-lights alternative. | Slow rigs may display a slow-moving sign (an orange triangle or flashing lights), so spot early and slow safely. |
| sec16-F23 | PARTIALLY_SUPPORTED | Page says almost half of deaths are in vehicles, not most, and 6 inches sweeps SUVs/pickups. | Almost half of flash-flood deaths happen in vehicles, and as little as 6 inches may sweep away a vehicle including SUVs and pickups. |
| sec16-R01 | PARTIALLY_SUPPORTED | Page says be prepared to stop, not that bridges demand full stops. | Gravel oncoming hugs right through dust, while narrow one-vehicle bridges require being prepared to stop. |
| sec16-R10 | PARTIALLY_SUPPORTED | Omits the less-than-10-minutes time limit and mild-day 100-degree detail. | Parked cabins can soar above 160 degrees in less than 10 minutes, and Iowa law allows breaking glass to rescue trapped persons/animals. |
| sec17-R09 | PARTIALLY_SUPPORTED | The page supports hands on wheel and staying calm but does not state anything about arguing during stops. | Keep hands visible on the steering wheel, remain calm, and follow the officer's instructions. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ia-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
