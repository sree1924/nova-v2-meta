# Fact check — Georgia (GA), Muse one call per section

Run 2026-10-28-rdmv-ga-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 616 |
| Supported | 604 |
| Partially supported | 11 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4116 (91,619 input + 69,899 output tokens) |
| Cost per fact | $0.00067 |
| Projection, all 51 (37,967 facts) | $25.37 |
| Projection, states Muse can audit independently (33,681 facts) | $22.5 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-traffic-stops-and-general-licensing | 53 | 50 | 3 | 8334 / 7372 | $0.0417 |
| sec02-permits-class-c-and-documents | 45 | 45 | 0 | 7692 / 4472 | $0.0286 |
| sec03-testing-and-license-services | 56 | 55 | 1 | 9158 / 5827 | $0.0362 |
| sec04-right-of-way-and-passing | 48 | 47 | 1 | 7633 / 6304 | $0.0363 |
| sec05-turning-parking-and-speed | 43 | 43 | 0 | 4835 / 4036 | $0.0232 |
| sec06-work-zones-road-rules-and-phones | 52 | 50 | 2 | 8116 / 5292 | $0.0326 |
| sec07-teen-and-provisional-conditions | 36 | 36 | 0 | 5598 / 4478 | $0.0260 |
| sec08-sign-shapes-and-regulations | 29 | 29 | 0 | 3148 / 2788 | $0.0158 |
| sec09-warning-guide-and-work-signs | 38 | 38 | 0 | 3757 / 3627 | $0.0201 |
| sec10-signals-beacons-and-markings | 46 | 46 | 0 | 5424 / 5294 | $0.0293 |
| sec11-safety-guidelines | 59 | 58 | 1 | 9671 / 6859 | $0.0412 |
| sec12-sharing-the-road | 48 | 45 | 3 | 7313 / 5294 | $0.0316 |
| sec13-suspensions-alcohol-and-points | 43 | 42 | 1 | 8189 / 5498 | $0.0336 |
| sec14-crash-duties | 20 | 20 | 0 | 2751 / 2758 | $0.0152 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F10 | PARTIALLY_SUPPORTED | The page supports the sanction outcomes but does not state the officer may ask the driver to explain what happened. | A stop may end with a warning, traffic ticket which may include a fine, or arrest, with the officer typically explaining the action taken. |
| sec01-F17 | PARTIALLY_SUPPORTED | The page states the vehicle conditions disjunctively with or, not conjunctively requiring both ownership/lease and official business. | A federal employee operating a vehicle owned by or leased to the United States government or being operated on official business is exempt unless required to hold a state license. |
| sec01-F20 | PARTIALLY_SUPPORTED | The page says the license is issued in a foreign country by the armed forces of the United States, not by foreign armed forces. | An active-duty member returning with a valid license issued in a foreign country by the U.S. armed forces may use it for not more than 45 days after return. |
| sec04-R16 | PARTIALLY_SUPPORTED | The page also requires reducing speed to at least 10 mph below the limit or 25 mph, which the fact omits. | When a lane change is impossible, prohibited or unsafe, reduce speed as required and keep at least 3 feet from the bicycle. |
| sec06-R20 | PARTIALLY_SUPPORTED | Page 26 does not state the separate hearing-impairment prohibition. | The hands-free arrangements use a mounted holder, wireless equipment or headphones. |
| sec06-R24 | PARTIALLY_SUPPORTED | Statement omits the page's specific speed requirement of at least 10 mph less than limit or 25 mph. | If lane change is impossible, unlawful or unsafe, reduce to at least 10 mph less than the posted limit or 25 mph, whichever is more, and be prepared to stop. |
| sec11-F16 | PARTIALLY_SUPPORTED | The page gives a specific steering direction, not a general consider-conditions instruction, and the fact omits it. | If a skid begins, ease off the accelerator, steer in the direction of the skid, and lightly apply brakes only once control is regained. |
| sec12-F15 | PARTIALLY_SUPPORTED | Page 43 requires alertness for bicycle traffic but does not state the larger-vehicle assumption. | Because bicyclists may be on any road at any time, drivers must always be alert for bicycle traffic. |
| sec12-F21 | PARTIALLY_SUPPORTED | Page 44 also requires reducing speed to at least 10 mph below the limit or 25 mph, which the fact omits. | If a lane change is impossible, prohibited or unsafe, reduce speed to at least 10 mph less than the posted limit or 25 mph, whichever is more, and keep at least three feet at all times. |
| sec12-R16 | PARTIALLY_SUPPORTED | Page 45 lists Take Your Time and Stay Calm but does not state the checklist is incomplete. | Tips for trailering include Take Your Time and If You Lose Control, Stay Calm, among listed tips. |
| sec13-R03 | PARTIALLY_SUPPORTED | Page says 'any 4-point violation' for under-21, not 'at least 4 points'. | For a driver under 21, a conviction for any 4-point violation can cause suspension; for under 18, accumulation of 4 points within 12 months can do so. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ga-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
