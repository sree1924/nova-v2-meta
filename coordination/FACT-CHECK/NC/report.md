# Fact check — North Carolina (NC), Muse one call per section

Run 2026-10-28-rdmv-nc-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 820 |
| Supported | 801 |
| Partially supported | 19 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4682 (88,520 input + 84,135 output tokens) |
| Cost per fact | $0.00057 |
| Projection, all 51 (37,967 facts) | $21.68 |
| Projection, states Muse can audit independently (33,681 facts) | $19.23 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-testing-license-classes | 53 | 51 | 2 | 5525 / 5089 | $0.0285 |
| sec02-graduated-licensing-restrictions | 52 | 46 | 6 | 5187 / 6897 | $0.0358 |
| sec03-insurance-real-id-renewal | 54 | 51 | 3 | 6375 / 7095 | $0.0381 |
| sec04-alcohol-and-the-law | 41 | 40 | 1 | 3773 / 3792 | $0.0208 |
| sec05-points-suspensions-restoration | 60 | 59 | 1 | 6368 / 5305 | $0.0305 |
| sec06-driver-condition-occupant-protection | 57 | 57 | 0 | 6781 / 4916 | $0.0294 |
| sec07-pedestrians-school-buses-emergency-vehicles | 54 | 54 | 0 | 6694 / 5309 | $0.0309 |
| sec08-speed-curves-turning-following | 43 | 42 | 1 | 4207 / 6224 | $0.0317 |
| sec09-passing-backing-parking-roundabouts | 54 | 53 | 1 | 6320 / 5365 | $0.0307 |
| sec10-railroad-crossings-interstate-driving | 52 | 51 | 1 | 6592 / 5206 | $0.0304 |
| sec11-vehicle-equipment-defensive-driving | 50 | 50 | 0 | 5241 / 4878 | $0.0273 |
| sec12-hazardous-driving-conditions | 53 | 53 | 0 | 6010 / 4758 | $0.0277 |
| sec13-emergencies-and-crashes | 51 | 51 | 0 | 4755 / 4602 | $0.0255 |
| sec14-traffic-signals | 38 | 38 | 0 | 3566 / 3821 | $0.0207 |
| sec15-traffic-signs-pavement-markings | 50 | 48 | 2 | 4367 / 5250 | $0.0278 |
| sec16-sharing-the-road | 58 | 57 | 1 | 6759 / 5628 | $0.0324 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R01 | PARTIALLY_SUPPORTED | Page states the permit supervision rule but does not state that a licensed driver may drive alone. | The permit holder must be accompanied by a person licensed for that vehicle seated beside the permit holder. |
| sec01-R07 | PARTIALLY_SUPPORTED | Page 12 alone does not list commercial Class A, B and C to show the letters are shared. | North Carolina has a regular driver license and a commercial driver license, and most drivers need only Regular Class C. |
| sec02-F19 | PARTIALLY_SUPPORTED | The page states the one-passenger rule but also allows a second under-21 non-household passenger for school trips and a household exception. | When driving unsupervised there may be one under-21 non-household passenger, plus one other such passenger if a student driven directly to or from school, unless all passengers are household members. |
| sec02-F21 | PARTIALLY_SUPPORTED | The page limits the mixed household/non-household ban to when driving unsupervised, which the fact omits. | There is no under-21 limit if all passengers are household members; when driving unsupervised, under-21 household members may not be in the vehicle with under-21 non-household members. |
| sec02-R02 | PARTIALLY_SUPPORTED | Page 15 states unsupervised driving is allowed but does not state on that page that Level Two is the first such level. | Level Two allows driving without supervision from 5 a.m. until 9 p.m. and at any time when driving directly to or from work or a volunteer emergency service if a member. |
| sec02-R04 | PARTIALLY_SUPPORTED | Page 15 states the six-month Level Two hold but does not state the nine-month Level One period for comparison. | Level Two must be held at least six months before applying for a Full Provisional License. |
| sec02-R09 | PARTIALLY_SUPPORTED | The page states the school-discipline triggers but does not state that traffic violations are excluded. | License loss occurs if a student receives suspension for more than 10 consecutive days or alternative educational assignment due to discipline for more than 10 consecutive days. |
| sec02-R10 | PARTIALLY_SUPPORTED | The page states driving outside a restriction counts as driving without a license but does not characterize it as not a minor infraction. | If your license is restricted, you must only drive within the limits of the restriction; otherwise you are considered to be driving without a license. |
| sec03-F31 | PARTIALLY_SUPPORTED | The statement omits the additional mail-renewal requirement for Social Security number/legal presence shown on the page. | Add that NCDMV must have a record of Social Security number or U.S. government legal presence document. |
| sec03-R08 | PARTIALLY_SUPPORTED | Page 28 states the five-year photo rule but does not state the eight-year military photo rule. | Cite page 29 for the military eight-year photo rule, or limit the statement to the five-year civilian rule on page 28. |
| sec03-R09 | PARTIALLY_SUPPORTED | Page 30 states the age-based durations but does not mention the knowledge test date. | State only that license duration depends on age at issuance: 8 years for 18-65 and 5 years for 66 and older. |
| sec04-R07 | PARTIALLY_SUPPORTED | Page 35 states the under-21 any-amount rule but does not state the adult per se comparison on that page. | A driver under 21 convicted of driving with any amount of alcohol or drugs in their body has their license revoked for one year. |
| sec05-R03 | PARTIALLY_SUPPORTED | Page 36 states reinstatement does not pertain to insurance points but does not state insurers use their own point system. | Reinstatement cancels all previous driver license points, which does not pertain to insurance points. |
| sec08-R04 | PARTIALLY_SUPPORTED | Page 55 states the farther-ahead and two-second-rule requirements but does not state on that page that stopping distance grows with speed. | On page 55, allow safe distance under the two-second rule and see farther ahead as speed rises to allow enough distance for stopping. |
| sec09-R04 | PARTIALLY_SUPPORTED | Omits the page's condition that moving right is required if the passing driver blows the horn. | When being passed, help the other driver: if they blow the horn move to the right edge, and never increase speed. |
| sec10-F25 | PARTIALLY_SUPPORTED | Page 65 states the crash risk but not the because-clause about riding to the right, which is on the prior page. | A cyclist going straight through an intersection is at risk from a motorist turning right. |
| sec15-F01 | PARTIALLY_SUPPORTED | The cited page states signs are divided into three types but only names Regulatory Signs on that page. | Shape and color let you identify highway signs at a glance, and traffic signs are divided into three types, including Regulatory Signs. |
| sec15-R06 | PARTIALLY_SUPPORTED | The cited page supports the pentagon school-zone part but does not mention the stop octagon or yield triangle shapes. | The five-sided pentagon sign warns of a school zone or a school crossing. |
| sec16-R03 | PARTIALLY_SUPPORTED | Cited page states the pedestrian left-side rule but does not state the bicyclist ride-with-traffic rule. | Pedestrians should walk on the left side of the road facing traffic. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nc-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
