# Fact check — Oregon (OR), Muse one call per section

Run 2026-10-28-rdmv-or-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 11 of 11 |
| Facts checked | 675 |
| Supported | 669 |
| Partially supported | 6 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3367 (64,848 input + 60,157 output tokens) |
| Cost per fact | $0.00050 |
| Projection, all 51 (37,967 facts) | $18.94 |
| Projection, states Muse can audit independently (33,681 facts) | $16.8 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-testing | 52 | 48 | 4 | 4710 / 4840 | $0.0265 |
| sec02-signs-and-traffic-signals | 70 | 70 | 0 | 6267 / 6447 | $0.0352 |
| sec03-lane-travel-part-1 | 72 | 72 | 0 | 7706 / 7270 | $0.0405 |
| sec04-lane-travel-part-2 | 59 | 59 | 0 | 5723 / 5720 | $0.0315 |
| sec05-turns-and-intersections | 64 | 64 | 0 | 5913 / 5387 | $0.0303 |
| sec06-sharing-the-road-part-1 | 71 | 71 | 0 | 7917 / 5877 | $0.0349 |
| sec07-sharing-the-road-part-2 | 60 | 59 | 1 | 5436 / 7128 | $0.0371 |
| sec08-parking-and-stopping | 48 | 47 | 1 | 3928 / 4217 | $0.0228 |
| sec09-safe-responsible-driving-part-1 | 66 | 66 | 0 | 6143 / 4246 | $0.0257 |
| sec10-safe-responsible-driving-part-2 | 56 | 56 | 0 | 5678 / 4120 | $0.0246 |
| sec11-other-important-information | 57 | 57 | 0 | 5427 / 4905 | $0.0276 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R04 | PARTIALLY_SUPPORTED | The cited page states the office translator rule but does not state the drive-test vehicle translator rule. | Limit the claim to the office rule on this page: only those being tested and authorized translators are allowed in the testing area. |
| sec01-R06 | PARTIALLY_SUPPORTED | The cited page states the online desktop/laptop requirement but does not state the office touch-screen rule. | Limit the claim to this page: the online test must be taken on a desktop or laptop with keyboard, mouse and webcam. |
| sec01-R08 | PARTIALLY_SUPPORTED | The page states the corrective-lens notation but does not expressly state that wearing lenses cannot cause failure. | State only what the page gives: if you take the test while wearing glasses or contacts, your privilege will indicate corrective lenses are required. |
| sec01-R13 | PARTIALLY_SUPPORTED | The cited page states the weather-conditional items but does not list brake lights and horn as always-required items. | State only what this page gives: traction tires or chains, wipers, headlights, taillights and defroster are required if weather conditions require. |
| sec07-R11 | PARTIALLY_SUPPORTED | Page 67 does not state the freeway portion about keeping moving through narrowed or shifted lanes. | Limit the statement to two-lane road flaggers/automated devices on page 67, or cite page 68 for the freeway portion. |
| sec08-R02 | PARTIALLY_SUPPORTED | The page states the yield requirement but does not state that signaling does not give priority. | Pulling out of a parking spot, check blind spots and mirrors and yield to all other traffic. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-or-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
