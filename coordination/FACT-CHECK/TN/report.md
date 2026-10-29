# Fact check — Tennessee (TN), Muse one call per section

Run 2026-10-28-rdmv-tn-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 17 of 17 |
| Facts checked | 1266 |
| Supported | 1254 |
| Partially supported | 10 |
| Not found on cited page | 2 |
| Contradicted | 0 |
| Exact cost | $0.8386 (190,618 input + 141,252 output tokens) |
| Cost per fact | $0.00066 |
| Projection, all 51 (37,967 facts) | $25.15 |
| Projection, states Muse can audit independently (33,681 facts) | $22.31 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-your-license | 65 | 64 | 1 | 9755 / 7817 | $0.0454 |
| sec02-applying-for-your-license | 57 | 56 | 1 | 11644 / 5272 | $0.0370 |
| sec03-intermediate-licenses-gdl | 56 | 56 | 0 | 9912 / 6157 | $0.0386 |
| sec04-the-examinations | 54 | 54 | 0 | 7036 / 6011 | $0.0343 |
| sec05-getting-familiar-with-your-vehicle | 67 | 67 | 0 | 8954 / 7945 | $0.0450 |
| sec06-safety-belt-laws | 62 | 60 | 2 | 7980 / 7239 | $0.0407 |
| sec07-traffic-signs-and-signals | 84 | 84 | 0 | 12287 / 9207 | $0.0545 |
| sec08-rules-of-the-road-part-1 | 96 | 96 | 0 | 17768 / 10850 | $0.0683 |
| sec09-rules-of-the-road-part-2 | 98 | 98 | 0 | 17170 / 10723 | $0.0670 |
| sec10-interstate-driving | 70 | 66 | 4 | 9995 / 9582 | $0.0532 |
| sec11-night-and-inclement-weather | 87 | 87 | 0 | 10192 / 9065 | $0.0513 |
| sec12-alcohol-other-drugs-and-driving | 85 | 85 | 0 | 10873 / 8888 | $0.0514 |
| sec13-driving-responsibility | 89 | 89 | 0 | 10835 / 9266 | $0.0529 |
| sec14-defensive-driving-and-road-rage | 63 | 61 | 2 | 7017 / 8461 | $0.0447 |
| sec15-special-driving-conditions | 88 | 86 | 2 | 12521 / 10444 | $0.0600 |
| sec16-sharing-the-road-safely | 106 | 106 | 0 | 21601 / 10234 | $0.0705 |
| sec17-helping-new-drivers-learn | 39 | 39 | 0 | 5078 / 4091 | $0.0237 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F13 | PARTIALLY_SUPPORTED | The page requires 2 years of unrestricted driving experience generally, not specifically in a Class D vehicle. | Adding the For-Hire endorsement costs $4.50 and requires 2 years of unrestricted driving experience while operating a Class D vehicle. |
| sec02-F25 | PARTIALLY_SUPPORTED | Omits page's additional fees for GDL, motorcycle, and multiple types on top of $28. | A TDL/TID is $28 regardless of length up to five years, plus additional fees e.g., $5 GDL or $1 motorcycle apply. |
| sec06-R05 | PARTIALLY_SUPPORTED | The cited page states reduced possibility of injury from interior surfaces but the less-force/less-serious-injury clause continues on the next page. | State only what page 45 states about hostile surfaces, or cite page 46 for the less-force result. |
| sec06-R14 | PARTIALLY_SUPPORTED | The cited page states the child's lap-belt position but does not state the adult pelvis/thighs position on that page. | Cite page 45 for the adult lap-belt position and page 47 for the child's position. |
| sec10-F21 | PARTIALLY_SUPPORTED | The cited page states the ramp speed reduction but not maintaining speed until the deceleration lane, which appears on the prior page. | Reduce your speed to the exit ramp posted speed and slow to the posted limit for the road you will be entering. |
| sec10-R13 | PARTIALLY_SUPPORTED | The page states interstate traffic may move right to exit but does not state the entering driver moves left. | At a weaving interchange, vehicles already on the interstate may be moving right to exit while you enter, requiring both to yield and share. |
| sec10-R26 | NOT_FOUND_ON_PAGE | The cited page does not state HELP operators' removal authority or obedience requirement; that text is on the next page. | Cite the next page, which states HELP operators may remove obstructing vehicles and directions must be followed as a police officer's. |
| sec10-R28 | PARTIALLY_SUPPORTED | The page lists three fuses or reflectors, not three reflectors or flares. | A roadside kit should include the listed items including three fuses or reflectors for night-time emergencies, insurance and registration papers, and a cellular phone. |
| sec14-R03 | PARTIALLY_SUPPORTED | The page states the intentions phrase but does not state the added timing condition before you act on them. | Be reasonably sure of people’s intentions. |
| sec14-R10 | NOT_FOUND_ON_PAGE | The communicating definition is on the prior page; the cited page only continues with the word collision and turn-signal use. | Check the prior page for the communicating definition; cite that page instead of this page. |
| sec15-F38 | PARTIALLY_SUPPORTED | Page 114 states the prohibition but the steering-lock and loss-of-control consequence continues on the next page. | Never turn your vehicle's ignition to the "lock" position while the vehicle is in motion. |
| sec15-R44 | PARTIALLY_SUPPORTED | Page 115 cuts off mid-sentence and the closer-together completion is on the next page. | Wherever people or traffic gather, lower speed to have time to react in a crowded space. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-tn-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
