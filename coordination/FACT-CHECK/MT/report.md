# Fact check — MT (MT), Muse one call per section

Run 2026-10-28-rdmv-mt-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 927 |
| Supported | 919 |
| Partially supported | 8 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5257 (98,892 input + 94,615 output tokens) |
| Cost per fact | $0.00057 |
| Projection, all 51 (37,967 facts) | $21.53 |
| Projection, states Muse can audit independently (33,681 facts) | $19.1 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-and-documents | 105 | 105 | 0 | 11879 / 10400 | $0.0590 |
| sec02-graduated-licensing-and-records | 44 | 44 | 0 | 5704 / 4065 | $0.0244 |
| sec03-vehicle-equipment | 96 | 96 | 0 | 9421 / 10318 | $0.0556 |
| sec04-occupant-protection | 32 | 31 | 1 | 3169 / 3777 | $0.0200 |
| sec05-signs-and-school-zones | 78 | 78 | 0 | 7160 / 6953 | $0.0385 |
| sec06-signals-and-markings | 60 | 57 | 3 | 6607 / 7378 | $0.0396 |
| sec07-driving-and-sharing-rules | 58 | 57 | 1 | 7758 / 6598 | $0.0377 |
| sec08-parking-and-insurance | 54 | 52 | 2 | 5331 / 5382 | $0.0295 |
| sec09-basic-driving-and-observation | 60 | 59 | 1 | 7796 / 7715 | $0.0425 |
| sec10-communication-and-speed | 105 | 105 | 0 | 9959 / 10016 | $0.0550 |
| sec11-sharing-space | 76 | 76 | 0 | 7337 / 7795 | $0.0423 |
| sec12-driver-fitness | 71 | 71 | 0 | 8415 / 6949 | $0.0401 |
| sec13-emergencies-and-crashes | 68 | 68 | 0 | 6824 / 5729 | $0.0329 |
| sec14-penalties-and-records | 20 | 20 | 0 | 1532 / 1540 | $0.0085 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec04-F11 | PARTIALLY_SUPPORTED | The page states driver responsibility but does not mention legal exceptions on this page. | Montana makes the driver responsible for ensuring each occupant is properly buckled or in a child safety seat. |
| sec06-R01 | PARTIALLY_SUPPORTED | Page 40 states the dead-signal and flashing-red stop rules but does not state the flashing-yellow caution rule. | Limit the claim to page 40: a dead signal and a flashing red both require a stop-sign style stop. |
| sec06-R08 | PARTIALLY_SUPPORTED | Page 42 states circulating traffic has right-of-way but does not discuss all-way-stop first-arrived expectations. | State only that traffic already circulating holds the right-of-way over entering traffic. |
| sec06-R09 | PARTIALLY_SUPPORTED | Page 42 forbids passing inside a single-lane roundabout but does not address passing rules outside the circle. | State only that passing is forbidden after entering a single-lane roundabout. |
| sec07-F38 | PARTIALLY_SUPPORTED | The fact omits the page's exceptions for passing on the right and entering through red. | Outsiders yield to the procession and must not split or join it for advantage, pass it on the right unless it is in the farthest left lane, or enter through red while crossing its path. |
| sec08-R04 | PARTIALLY_SUPPORTED | The page states extra caution for youngsters but does not state that trained riders are expected to know the rules. | Many bicyclists under 15 have not taken safety training and are unaware of road rules, so use extra caution with youngsters on bikes. |
| sec08-R06 | PARTIALLY_SUPPORTED | The page requires night lights with dimmed headlights but does not state that day parking needs no lights. | Vehicles parked on a roadway or shoulder during hours of darkness must have front and rear lights visible for 500 feet, with headlights dimmed if on. |
| sec09-R09 | PARTIALLY_SUPPORTED | Page states texting combines three loads but does not compare other distractions to fewer channels. | Texting involves simultaneous manual, visual, and cognitive distraction. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-mt-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
