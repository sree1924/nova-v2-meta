# Fact check — District of Columbia (DC), Muse one call per section

Run 2026-10-28-rdmv-dc-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 676 |
| Supported | 666 |
| Partially supported | 7 |
| Not found on cited page | 3 |
| Contradicted | 0 |
| Exact cost | $0.3760 (70,731 input + 67,671 output tokens) |
| Cost per fact | $0.00056 |
| Projection, all 51 (37,967 facts) | $21.12 |
| Projection, states Muse can audit independently (33,681 facts) | $18.73 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-safe-driving-introduction | 51 | 49 | 2 | 5993 / 5160 | $0.0294 |
| sec02-examination-and-licensing | 50 | 50 | 0 | 4833 / 4244 | $0.0241 |
| sec03-licenses-and-permits | 41 | 41 | 0 | 4302 / 4669 | $0.0252 |
| sec04-services-and-responsibilities | 30 | 30 | 0 | 3066 / 2694 | $0.0153 |
| sec05-driver-information-part-one | 83 | 81 | 2 | 9143 / 8510 | $0.0476 |
| sec06-driver-information-part-two | 87 | 87 | 0 | 9579 / 8695 | $0.0489 |
| sec07-driver-information-part-three | 80 | 80 | 0 | 9177 / 6053 | $0.0372 |
| sec08-driving-rules | 44 | 43 | 1 | 3711 / 4499 | $0.0238 |
| sec09-parking-rules | 42 | 41 | 1 | 3811 / 5024 | $0.0261 |
| sec10-traffic-rules | 45 | 45 | 0 | 5377 / 3932 | $0.0234 |
| sec11-signals-and-signs | 30 | 30 | 0 | 3009 / 3510 | $0.0187 |
| sec12-sign-colors-and-shapes | 15 | 15 | 0 | 1429 / 1423 | $0.0078 |
| sec13-regulatory-signs | 51 | 48 | 3 | 4342 / 5753 | $0.0299 |
| sec14-pavement-markings | 27 | 26 | 1 | 2959 / 3505 | $0.0186 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F038 | PARTIALLY_SUPPORTED | The cited page states push-button and wait but does not mention a raised-hand indication. | The HAWK guide tells a pedestrian to push the button to call for WALK signal and wait. |
| sec01-F051 | PARTIALLY_SUPPORTED | The page says drivers should stop, not that they must stop. | At an RRFB crossing, a driver should come to a full and complete stop for pedestrians crossing the roadway. |
| sec05-F014 | PARTIALLY_SUPPORTED | The page states obey the speed limit and be courteous but does not state allowing other road users time and space. | A courteous driver obeys speed limits and remains patient. |
| sec05-F044 | PARTIALLY_SUPPORTED | The page says keep pets away from you and not on the lap, but does not mention driving controls. | Keep pets away from you as you drive, do not let them sit on your lap, and never leave a pet unattended in your vehicle. |
| sec08-F030 | PARTIALLY_SUPPORTED | The page states the complete stop requirement but does not state the additional yielding requirement in the right-on-red rule. | A permitted right turn on red requires making a complete stop before the crosswalk prior to approaching the intersection. |
| sec09-F018 | PARTIALLY_SUPPORTED | The fact omits the page's qualifier that the lamp requirement applies if the vehicle is so equipped. | A vehicle parked on a highway shoulder/side as listed must turn on hazard or parking lights (if the vehicle is so equipped). |
| sec13-F049 | NOT_FOUND_ON_PAGE | The page text only labels Right turn and does not describe arm position. | Remove specific arm-position claim; page text only labels Right turn without describing the gesture. |
| sec13-F050 | NOT_FOUND_ON_PAGE | The page text only labels Slow or Stop and does not describe arm position. | Remove specific arm-position claim; page text only labels Slow or Stop without describing the gesture. |
| sec13-F051 | NOT_FOUND_ON_PAGE | The page text only labels Left turn and does not describe arm position. | Remove specific arm-position claim; page text only labels Left turn without describing the gesture. |
| sec14-F015 | PARTIALLY_SUPPORTED | Page 58 states the no-crossing rule and HOV separation but does not state the general same-direction separation definition, which appears on page 57. | Double solid white lines separate same-direction lanes and often designate a special-use lane; you may not cross these lines. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-dc-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
