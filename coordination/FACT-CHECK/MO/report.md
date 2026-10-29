# Fact check — Missouri (MO), Muse one call per section

Run 2026-10-28-rdmv-mo-class-f. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 17 of 17 |
| Facts checked | 990 |
| Supported | 979 |
| Partially supported | 10 |
| Not found on cited page | 1 |
| Contradicted | 0 |
| Exact cost | $0.5523 (106,535 input + 98,618 output tokens) |
| Cost per fact | $0.00056 |
| Projection, all 51 (37,967 facts) | $21.18 |
| Projection, states Muse can audit independently (33,681 facts) | $18.79 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driver-license-part-1 | 63 | 63 | 0 | 9005 / 7926 | $0.0449 |
| sec02-driver-license-part-2 | 62 | 62 | 0 | 9681 / 5887 | $0.0371 |
| sec03-driver-examination | 54 | 53 | 1 | 5486 / 6122 | $0.0329 |
| sec04-rules-of-the-road | 58 | 57 | 1 | 7093 / 4593 | $0.0284 |
| sec05-sharing-the-road | 79 | 79 | 0 | 9115 / 6760 | $0.0401 |
| sec06-parking | 36 | 36 | 0 | 3069 / 3720 | $0.0196 |
| sec07-highway-driving | 53 | 51 | 2 | 5450 / 6625 | $0.0350 |
| sec08-markings-signals-signs-part-1 | 69 | 69 | 0 | 6961 / 6394 | $0.0359 |
| sec09-markings-signals-signs-part-2 | 55 | 54 | 1 | 5520 / 6365 | $0.0340 |
| sec10-everyday-safe-driving | 72 | 72 | 0 | 8537 / 5664 | $0.0347 |
| sec11-special-driving-conditions | 65 | 65 | 0 | 6221 / 4917 | $0.0287 |
| sec12-alcohol-drugs-driving | 70 | 70 | 0 | 7609 / 7912 | $0.0431 |
| sec13-point-system | 47 | 43 | 4 | 3743 / 5274 | $0.0271 |
| sec14-titling-registration | 54 | 54 | 0 | 5233 / 5706 | $0.0308 |
| sec15-mandatory-insurance | 55 | 55 | 0 | 5063 / 5293 | $0.0288 |
| sec16-inspections-equipment | 60 | 58 | 2 | 5425 / 5261 | $0.0291 |
| sec17-distracted-driving | 38 | 38 | 0 | 3324 / 4199 | $0.0220 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec03-R13 | NOT_FOUND_ON_PAGE | Page 21 does not state the enough-time-to-check-traffic rule. | Cite pdf page 22 instead, which states the examiner allows enough time to look for traffic. |
| sec04-F37 | PARTIALLY_SUPPORTED | The page separately prohibits stopping except to avoid a crash, and separately prohibits changing lanes and passing, not as exceptions to stopping. | Inside a roundabout stay right of the island and do not stop except to avoid a crash, and do not change lanes or pass any vehicle. |
| sec07-R03 | PARTIALLY_SUPPORTED | The cited page states only the right-shoulder check when returning; the left-shoulder check for passing is on a different page. | Before moving back to the right lane, look over your right shoulder to check your blind spot and signal. |
| sec07-R10 | PARTIALLY_SUPPORTED | The page refers only to Chapter 8 and does not name the everyday driving chapter or spacing method. | Keep a safe distance between you and the vehicle in front of you (refer to Chapter 8). |
| sec09-R05 | PARTIALLY_SUPPORTED | The cited page states the round advance warning sign but does not mention the X-shaped crossbuck. | The railroad advance warning sign is round and tells you a crossing is ahead. |
| sec13-F19 | PARTIALLY_SUPPORTED | The page refers to requirements on Page 71 and does not name the alcohol and drugs chapter. | For an intoxication-related point suspension or revocation, you must submit the reinstatement requirements on Page 71. |
| sec13-R05 | PARTIALLY_SUPPORTED | The page introduces the list as examples of some violations, not as the exhaustive set of 12-point violations. | The guide gives as examples that leaving the scene, a felony involving a motor vehicle, obtaining a license by misrepresentation, and operating with a suspended or revoked license each carry 12 points. |
| sec13-R06 | PARTIALLY_SUPPORTED | The cited page states the 90, 90, 180-day school-bus periods but does not state the 30, 60, 90-day point-suspension periods. | On this page, school-bus suspensions are 90 days for a first offense, 90 days for a second within 5 years, and 180 days for a third or subsequent within 5 years. |
| sec13-R07 | PARTIALLY_SUPPORTED | The second offense within 5 years remains 90 days, the same as the first, so it does not raise the period. | The second offense within 5 years carries 90 days and the third or subsequent offense within 5 years carries 180 days. |
| sec16-F31 | PARTIALLY_SUPPORTED | Fact says "at night" but page specifies the light period as from 1/2 hour after sunset until 1/2 hour before sunrise. | A projection over 5 feet needs a 16-inch square red flag by day and a red light from 1/2 hour after sunset until 1/2 hour before sunrise. |
| sec16-F32 | PARTIALLY_SUPPORTED | Fact says "at night" but page specifies lights are required from 1/2 hour after sunset until 1/2 hour before sunrise. | When towing within 15 feet, both vehicles must have lights on from 1/2 hour after sunset until 1/2 hour before sunrise. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-mo-class-f/sources/private/audits/muse-fact-check/ (private, gitignored).
