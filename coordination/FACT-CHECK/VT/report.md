# Fact check — Vermont (VT), Muse one call per section

Run 2026-10-28-rdmv-vt-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 14 of 14 |
| Facts checked | 469 |
| Supported | 451 |
| Partially supported | 18 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3221 (65,044 input + 56,665 output tokens) |
| Cost per fact | $0.00069 |
| Projection, all 51 (37,967 facts) | $26.08 |
| Projection, states Muse can audit independently (33,681 facts) | $23.13 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing | 58 | 58 | 0 | 8969 / 5009 | $0.0325 |
| sec02-graduated-licensing | 28 | 28 | 0 | 3594 / 3188 | $0.0180 |
| sec03-vehicle-operation | 41 | 39 | 2 | 5358 / 4783 | $0.0270 |
| sec04-parking-roundabouts | 20 | 20 | 0 | 2802 / 1790 | $0.0111 |
| sec05-police-signals | 29 | 29 | 0 | 3811 / 3599 | $0.0201 |
| sec06-signs-markings | 33 | 30 | 3 | 4404 / 4535 | $0.0248 |
| sec07-sharing-road | 46 | 44 | 2 | 6153 / 5286 | $0.0302 |
| sec08-buses-railroads | 41 | 38 | 3 | 5913 / 4462 | $0.0264 |
| sec09-hazardous-conditions | 41 | 38 | 3 | 5691 / 6009 | $0.0327 |
| sec10-interstates | 31 | 29 | 2 | 3996 / 3170 | $0.0185 |
| sec11-impairment | 27 | 25 | 2 | 4126 / 3830 | $0.0214 |
| sec12-distraction | 20 | 20 | 0 | 2900 / 5149 | $0.0255 |
| sec13-points | 14 | 14 | 0 | 1394 / 1433 | $0.0078 |
| sec14-vehicle-ownership | 40 | 39 | 1 | 5933 / 4422 | $0.0262 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec03-R01 | PARTIALLY_SUPPORTED | The page states braking distance grows on wet, icy or gravel roads but does not state that only braking distance grows. | Reaction distance is before brakes are applied and braking distance is after, and the page states braking distance grows on wet, icy or gravel roads. |
| sec03-R04 | PARTIALLY_SUPPORTED | The cited page states the three-feet right-turn setup but does not state the within-one-foot centerline left-turn setup. | A right turn sets up about three feet from the right edge of the road. |
| sec06-R01 | PARTIALLY_SUPPORTED | The page states the sign is displayed on vehicles but does not state it is not on a post. | Warning signs are usually diamond shaped and yellow or green, while the cut-cornered triangle is displayed on slow-moving vehicles such as farm vehicles. |
| sec06-R02 | PARTIALLY_SUPPORTED | The page does not state that shape alone identifies the sign when the face is obscured. | A regulatory sign is a white rectangle stating what a driver must or must not do, whereas a warning sign is usually a yellow or green diamond warning of danger. |
| sec06-R06 | PARTIALLY_SUPPORTED | The page does not call work zone signs temporary or contrast them with permanent yellow warning diamonds. | Work zone signs are orange diamonds or rectangles warning of hazards ahead, and a flagger has legal authority to control traffic and must be obeyed. |
| sec07-R02 | PARTIALLY_SUPPORTED | Page 41 states the red-light stop rule but does not state the yellow-light prepare-to-stop rule. | Cite page 40 for yellow lights preparing to stop and page 41 for red lights requiring a stop. |
| sec07-R06 | PARTIALLY_SUPPORTED | Page 40 states the pedestrian left-side rule but does not state the bicyclist right-side rule. | Limit statement to pedestrians on page 40 or also cite page 42 for bicyclists riding on the right with traffic. |
| sec08-F19 | PARTIALLY_SUPPORTED | Page 44 states the never-go-around rule and hiding but the enter-a-blind-spot consequence is on page 45. | State only that you must never go around a backing truck and trailers can hide objects. |
| sec08-R03 | PARTIALLY_SUPPORTED | Page 45 states the mirror test for the rear blind spot but not for the side blind spots. | State the mirror test only for the rear blind spot on this page. |
| sec08-R04 | PARTIALLY_SUPPORTED | Page 45 states the orange-red triangle meaning but does not mention an orange diamond work zone. | State only that the orange and red triangle identifies a slow moving vehicle. |
| sec09-F05 | PARTIALLY_SUPPORTED | The page says 4 inches can make walking difficult and hide hazards, not that it can knock a walker down. | As little as 4 inches of running water can make it difficult to walk and can obstruct hazards from view. |
| sec09-R04 | PARTIALLY_SUPPORTED | Page 50 states the sunset/sunrise rule but does not state the 500-feet visibility rule on that page. | Page 50 requires headlights a half hour after sunset to a half hour before sunrise and when snow, rain, and fog limit visibility. |
| sec09-R06 | PARTIALLY_SUPPORTED | Page 48 does not state better traction in snow, only lack of good traction on ice. | Page 48 says even four-wheel or all-wheel drive vehicles do not have good traction on ice and to increase following distance to more than 4 seconds. |
| sec10-F01 | PARTIALLY_SUPPORTED | The cited page excerpt does not state looking toward the right edge of the highway. | Look at the highway until the bright lights have gone by and vision returns; this practice helps detect bicyclists or pedestrians near the edge. |
| sec10-R05 | PARTIALLY_SUPPORTED | The page states white should be on the right but does not state yellow is on the left. | A yellow edge line to your right means you are going the wrong way on a divided highway; the line to your right should be white. |
| sec11-R02 | PARTIALLY_SUPPORTED | The page states the 6-month loss but does not state it is separate from DUI conviction penalties. | Refusing the test costs the license for at least six months. |
| sec11-R04 | PARTIALLY_SUPPORTED | The page does not state that coffee/shower/exercise only change how awake you feel. | Only time at at least an hour per drink reduces alcohol's effects; coffee, cold showers and exercise will not sober a person up. |
| sec14-R01 | PARTIALLY_SUPPORTED | Page 66 states the 60-day and 24-hour requirements but does not state the 30-day name/address/color change requirement. | Limit this page-66 statement to the 60-day registration and 24-hour mailing requirements, and cite page 67 for the 30-day change notice. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-vt-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
