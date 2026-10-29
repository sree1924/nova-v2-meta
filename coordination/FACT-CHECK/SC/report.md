# Fact check — South Carolina (SC), Muse one call per section

Run 2026-10-28-rdmv-sc-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 799 |
| Supported | 783 |
| Partially supported | 16 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4544 (84,236 input + 82,134 output tokens) |
| Cost per fact | $0.00057 |
| Projection, all 51 (37,967 facts) | $21.59 |
| Projection, states Muse can audit independently (33,681 facts) | $19.15 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-drivers-license-part-1 | 65 | 61 | 4 | 8184 / 7898 | $0.0438 |
| sec02-drivers-license-part-2 | 67 | 67 | 0 | 7565 / 5660 | $0.0335 |
| sec03-state-laws-rules | 27 | 25 | 2 | 2699 / 3096 | $0.0165 |
| sec04-be-in-shape-to-drive | 63 | 62 | 1 | 7139 / 7415 | $0.0404 |
| sec05-before-you-drive | 57 | 57 | 0 | 6314 / 6441 | $0.0353 |
| sec06-basic-driving | 47 | 45 | 2 | 4553 / 4768 | $0.0260 |
| sec07-rules-of-the-road-part-1 | 52 | 52 | 0 | 5173 / 5151 | $0.0284 |
| sec08-rules-of-the-road-part-2 | 47 | 45 | 2 | 4014 / 5372 | $0.0278 |
| sec09-general-driving-part-1 | 53 | 51 | 2 | 5285 / 4913 | $0.0275 |
| sec10-general-driving-part-2 | 57 | 57 | 0 | 5683 / 6355 | $0.0341 |
| sec11-safe-driving-tips | 57 | 57 | 0 | 5840 / 5725 | $0.0316 |
| sec12-emergency-situations | 48 | 48 | 0 | 4591 / 3188 | $0.0193 |
| sec13-sharing-the-road-part-1 | 48 | 48 | 0 | 4888 / 3881 | $0.0226 |
| sec14-sharing-the-road-part-2 | 48 | 46 | 2 | 5467 / 5288 | $0.0293 |
| sec15-special-driving-situations | 63 | 62 | 1 | 6841 / 6983 | $0.0382 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F02 | PARTIALLY_SUPPORTED | Page 7 states the E and F moped/three-wheel rule but does not mention Class D holders for comparison. | Class E and Class F holders may also operate a moped or three-wheel vehicle, but not a two-wheel motorcycle with a detachable sidecar. |
| sec01-F27 | PARTIALLY_SUPPORTED | Page 12 states the passenger limit only for a conditional license, not for a special restricted license. | A conditional licensee may carry at most two passengers under 21 unless a licensed adult aged 21 or older rides along, except for family or students to and from school. |
| sec01-R02 | PARTIALLY_SUPPORTED | Page 6 states weight rating determines class but does not state that vehicle appearance does not decide. | Class D is limited to non-commercial passenger vehicles of no more than 26,000 pounds GVW, and the GVWR/GVW determines which class you need. |
| sec01-R07 | PARTIALLY_SUPPORTED | Page 10 requires written permission from any person in items 1-6, not only a parent, guardian or custodian. | The list ends with a responsible adult who assumes duties under SC Code §56-1-110 and has notarized written permission from a person listed in items 1-6. |
| sec03-F16 | PARTIALLY_SUPPORTED | Page 31 alone does not state the daytime limitation; the daytime condition appears on the prior page. | On page 30 the manual limits golf-cart operation to daytime, with the page 31 details about the gate, distance and road types under SC Code §56-2-105. |
| sec03-R07 | PARTIALLY_SUPPORTED | Page 31 alone does not state the daytime limitation; the daytime condition appears on the prior page. | On page 30 the manual limits golf-cart operation to daytime, with the four-miles-from-gate detail continuing on page 31. |
| sec04-R02 | PARTIALLY_SUPPORTED | The page does not state that out-of-state Form 412-NC is filed on paper. | An SC-licensed professional files electronically while an out-of-state professional completes Form 412-NC. |
| sec06-F23 | PARTIALLY_SUPPORTED | Page 56 does not state that push/pull is the preferred method; that statement is on page 55. | 2 and 10 o'clock is not recommended because it can be dangerous in vehicles equipped with airbags. |
| sec06-R05 | PARTIALLY_SUPPORTED | Page 56 states the low-speed use for hand-over-hand but does not state push/pull is preferred. | Use hand-over-hand steering when turning the wheel at low speeds, such as at an intersection or when parking the vehicle. |
| sec08-R04 | PARTIALLY_SUPPORTED | The page states the ideal-conditions maximum but does not state it is not a guarantee of safety. | Speed limit signs indicate the maximum legal speed allowed in ideal conditions. |
| sec08-R05 | PARTIALLY_SUPPORTED | The page states guide signs give information but does not on this page contrast them with laws to obey. | Guide signs are green, brown or blue and give information and direction. |
| sec09-F15 | PARTIALLY_SUPPORTED | Cited page 77 ends mid-sentence at 'turn hard left to' and does not state stopping when reaching the other side, which is on page 78. | Limit the statement to what page 77 states, or cite pages 77-78 for the full step including stopping on the other side. |
| sec09-F34 | PARTIALLY_SUPPORTED | Cited page 83 alone lists 'On any two-lane highway' but the explicit 'whether you are meeting the bus or traveling behind it' condition is stated on page 82, not page 83. | Cite pages 82-83 for both directions, or limit to page 83 wording: stop is required on any two-lane highway. |
| sec14-F31 | PARTIALLY_SUPPORTED | Page 124 alone does not state the orange and red triangle identifier, which appears on page 123. | A slow-moving vehicle travels at less than 25 mph; use caution when approaching and be sure it is safe before you pass. |
| sec14-R08 | PARTIALLY_SUPPORTED | Page 120 states the pull-over rule but does not state the comparison to the stopped-vehicle lane-change rule. | For a moving emergency vehicle with lights and siren on, yield by pulling over to the edge of the road. |
| sec15-F39 | PARTIALLY_SUPPORTED | The cited page ends at 'Stop as soon as you can safely' and does not state getting completely off the roadway, which is on the next page. | If the trailer begins to sway or whip, steer straight and reduce speed gradually; do not apply the brakes, never increase speed, and stop as soon as you can safely do so. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-sc-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
