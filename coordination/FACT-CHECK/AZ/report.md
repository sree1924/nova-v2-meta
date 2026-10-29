# Fact check — Arizona (AZ), Muse one call per section

Run 2026-10-28-rdmv-az-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 22 of 22 |
| Facts checked | 1169 |
| Supported | 1152 |
| Partially supported | 17 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.6262 (101,854 input + 117,387 output tokens) |
| Cost per fact | $0.00054 |
| Projection, all 51 (37,967 facts) | $20.34 |
| Projection, states Muse can audit independently (33,681 facts) | $18.04 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-name-address-records-road-test | 42 | 41 | 1 | 4490 / 4878 | $0.0263 |
| sec02-insurance-residency-voter-donor | 46 | 46 | 0 | 4200 / 4801 | $0.0257 |
| sec03-license-classes-permits-graduated | 51 | 51 | 0 | 5674 / 7034 | $0.0370 |
| sec04-before-you-drive-belts-child-seats | 45 | 43 | 2 | 4417 / 5508 | $0.0289 |
| sec05-equipment-defensive-driving-scanning | 53 | 50 | 3 | 4730 / 6104 | $0.0319 |
| sec06-space-cushion-signaling-passing | 55 | 52 | 3 | 4783 / 6647 | $0.0342 |
| sec07-no-passing-roundabouts-parking | 54 | 53 | 1 | 4459 / 4932 | $0.0265 |
| sec08-prohibited-parking-freeway-driving | 57 | 57 | 0 | 4850 / 6526 | $0.0338 |
| sec09-signal-lights-intersections-right-of-way | 48 | 48 | 0 | 4165 / 5129 | $0.0270 |
| sec10-pedestrian-rules-turns-emergency-vehicles | 54 | 53 | 1 | 4699 / 4437 | $0.0247 |
| sec11-speed-adjustment-traffic-signs | 49 | 49 | 0 | 3737 / 4880 | $0.0254 |
| sec12-guide-signs-work-zones-pavement-markings | 53 | 53 | 0 | 4254 / 4674 | $0.0252 |
| sec13-curbs-lanes-turning-rules | 45 | 45 | 0 | 3555 / 4367 | $0.0230 |
| sec14-two-way-left-turn-light-rail-walking | 48 | 48 | 0 | 3591 / 4316 | $0.0228 |
| sec15-sharing-road-bicycles-motorcycles-trucks | 56 | 54 | 2 | 4778 / 5966 | $0.0313 |
| sec16-braking-stopping-weather-dust-storms | 57 | 57 | 0 | 4748 / 5541 | $0.0295 |
| sec17-floods-fog-snow-night-wrong-way | 69 | 69 | 0 | 5397 / 6538 | $0.0345 |
| sec18-impairment-road-rage-medical-fatigue | 61 | 61 | 0 | 5133 / 5554 | $0.0300 |
| sec19-suspension-points-penalties | 63 | 62 | 1 | 5071 / 4790 | $0.0267 |
| sec20-dui-penalties-ignition-interlock | 49 | 49 | 0 | 4934 / 3987 | $0.0231 |
| sec21-vehicle-emergencies-avoiding-crashes | 56 | 56 | 0 | 4911 / 4531 | $0.0254 |
| sec22-crash-procedures-traffic-stops | 58 | 55 | 3 | 5278 / 6247 | $0.0331 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R02 | PARTIALLY_SUPPORTED | Page 6 states the online address-change process but does not state the name-change office and dual-identification requirement, which is on page 7. | Cite page 7 for the name-change office requirement, or limit this fact to the address-change online process on page 6. |
| sec04-F09 | PARTIALLY_SUPPORTED | The page allows only a lap belt where only a lap belt is installed, so a lap-and-shoulder belt is not required for every front occupant. | Each front-seat occupant must have the lap and shoulder belt fastened while moving, or if only a lap belt is installed where sitting, that lap belt fastened. |
| sec04-R06 | PARTIALLY_SUPPORTED | Page 20 states the shoulder-belt protection but does not state on that page that the lap belt prevents ejection. | On this page, the shoulder belt keeps the head and chest from striking the dashboard or windshield. |
| sec05-F36 | PARTIALLY_SUPPORTED | The page also permits hands-free and voice-to-text use, so reporting an emergency is not the only allowed use. | A wireless device may be used while driving to report an emergency, and hands-free or voice-to-text use is also permitted. |
| sec05-R07 | PARTIALLY_SUPPORTED | Page 23 states the foresight and anticipation parts but not the constantly aware and planning ahead wording, which is on page 22. | On page 23, foresight is sizing up traffic situations quickly and being prepared to correct, while defensive driving includes anticipating dangers and taking the right action to avoid contact. |
| sec05-R11 | PARTIALLY_SUPPORTED | The page also allows hands-free and voice-to-text operation, so emergency reporting is not the single allowed use. | A wireless device may be used while driving to report an emergency, and hands-free or voice-to-text use is also allowed; otherwise pull off and stop to use a phone or text. |
| sec06-F16 | PARTIALLY_SUPPORTED | Page 26 does not state gradually slowing down; that phrase appears on page 25. | Give additional cushion between you and the vehicle ahead so you can brake more slowly to accommodate the tailgater's reaction time and braking. |
| sec06-F42 | PARTIALLY_SUPPORTED | The page lists additional permitted cases beyond a left-turning driver, so turning left is not the only condition. | Passing on the right is permitted only when safe and a listed condition is met, including when the other driver is turning left. |
| sec06-R04 | PARTIALLY_SUPPORTED | Page 26 does not state gradually slowing down; that wording is on page 25. | Give additional cushion ahead when tailgated so you can brake more slowly for the tailgater's reaction time. |
| sec07-F10 | PARTIALLY_SUPPORTED | The page says to get in the appropriate lane, not specifically the right lane. | Decide where you are going before you reach a roundabout, follow the signs and get in the appropriate lane for your exit. |
| sec10-F17 | PARTIALLY_SUPPORTED | The fact states the fine as "00" instead of the $500 stated on the page. | If running a red light leads to a crash with life-threatening injuries to another driver or passenger, you may be fined up to $500 and your driving privilege may be suspended for three months, plus possible community service. |
| sec15-F01 | PARTIALLY_SUPPORTED | The page states the prohibition near overhead power lines but does not specify children. | Do not fly kites or airplane models near the overhead power lines. |
| sec15-F18 | PARTIALLY_SUPPORTED | The word Most for this sentence appears on the prior page, not on the cited page. | Car/motorcycle crashes are the result of a car turning in front of a motorcycle, usually because the driver did not see it or misjudged distance and speed. |
| sec19-R07 | PARTIALLY_SUPPORTED | Page 63 states the 2-point value but does not state the controlled-access highway ground for MVD action. | Split the claim by page: cite page 63 for the 2-point value and page 64 for wrong-way driving on a controlled-access highway as a ground for MVD action. |
| sec22-F45 | PARTIALLY_SUPPORTED | Page 74 alone does not state contacting the officer's agency or the inappropriate-conduct context, which appear on page 73. | If you believe the officer acted inappropriately you may contact the officer's agency and request to speak to a supervisor as soon as possible after the stop. |
| sec22-R01 | PARTIALLY_SUPPORTED | The statement omits the additional page condition that movement must not cause further damage or increase traffic hazards. | Crashed vehicles with no serious injury or fatality shall be removed if safely operable under its own power and movement does not cause further damage or increase hazards. |
| sec22-R11 | PARTIALLY_SUPPORTED | Page 74 alone does not state the agency-contact and inappropriate-conduct context, which appear on page 73. | If you believe the officer acted inappropriately you may contact the officer's agency and request to speak to a supervisor as soon as possible after the stop. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-az-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
