# Fact check — Virginia (VA), Muse one call per section

Run 2026-10-28-rdmv-va-class-std. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 449 |
| Supported | 386 |
| Partially supported | 44 |
| Not found on cited page | 19 |
| Contradicted | 0 |
| Exact cost | $0.3414 (58,994 input + 62,988 output tokens) |
| Cost per fact | $0.00076 |
| Projection, all 51 (37,967 facts) | $28.87 |
| Projection, states Muse can audit independently (33,681 facts) | $25.61 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-testing-knowledge-road-vision | 37 | 35 | 2 | 4262 / 4773 | $0.0256 |
| sec02-traffic-signals-lane-use | 35 | 31 | 4 | 4306 / 5649 | $0.0294 |
| sec03-regulatory-warning-signs | 39 | 37 | 2 | 3792 / 3943 | $0.0215 |
| sec04-railroad-work-zone-signs | 36 | 35 | 1 | 3702 / 3628 | $0.0200 |
| sec05-pavement-markings-curbs-toll | 40 | 40 | 0 | 4671 / 5095 | $0.0275 |
| sec06-speed-stopping-school-bus | 23 | 2 | 21 | 3017 / 4145 | $0.0214 |
| sec07-right-of-way-roundabouts | 25 | 1 | 24 | 3758 / 4921 | $0.0256 |
| sec08-turning-signals-space-cushion | 29 | 29 | 0 | 4056 / 3269 | $0.0190 |
| sec09-sharing-road-blind-spots | 28 | 28 | 0 | 4611 / 3108 | $0.0190 |
| sec10-backing-parking-visibility-hazardous | 31 | 31 | 0 | 4120 / 4154 | $0.0228 |
| sec11-dangerous-behaviors-crashes-deer | 29 | 29 | 0 | 4441 / 3627 | $0.0210 |
| sec12-traffic-stops-seat-belts-airbags-child-seats | 26 | 22 | 4 | 3645 / 4258 | $0.0227 |
| sec13-penalties-suspension-alcohol | 32 | 31 | 1 | 5121 / 4876 | $0.0271 |
| sec14-license-types-learner-permit | 19 | 15 | 4 | 2551 / 3235 | $0.0169 |
| sec15-registration-insurance-other-info | 20 | 20 | 0 | 2941 / 4307 | $0.0220 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R02 | PARTIALLY_SUPPORTED | Omits the page's 8-hour manual-course alternative for satisfying the three-failure requirement. | After three knowledge failures a fourth attempt requires classroom driver education, unless the applicant completes the 8-hour DMV-approved manual course as allowed by age rules. |
| sec01-R09 | PARTIALLY_SUPPORTED | Daylight window omits the half-hour buffers and adds regardless of correction not stated on page. | Daylight-only permits driving only from a half-hour after sunrise to a half-hour before sunset. |
| sec02-R01 | PARTIALLY_SUPPORTED | Omits the No Turn on Red sign, red-arrow, and yield conditions stated on the page. | Right on red is allowed after a complete stop and yield unless a No Turn on Red sign or red right arrow is displayed, while left on red requires one-way to one-way. |
| sec02-R02 | PARTIALLY_SUPPORTED | Omits the page's exception allowing turns at steady red arrows where posted signs permit it. | A steady red arrow requires stopping and not proceeding unless Right on Red Arrow After Stop or Left on Red Arrow After Stop signs permit it, while a flashing red arrow allows proceeding after stop and yield when clear. |
| sec02-R03 | PARTIALLY_SUPPORTED | Omits the page's allowance to go cautiously if unsafe to stop or already in the intersection. | A steady yellow requires stopping if not entered unless unsafe to stop, then going cautiously, while a flashing yellow requires only slowing and proceeding with caution. |
| sec02-R05 | PARTIALLY_SUPPORTED | Omits the page's unless-turns-are-allowed exception to remaining stopped at steady red. | A steady red requires remaining stopped while red unless turns are allowed, while a flashing red allows going after a complete stop and yield when clear. |
| sec03-F27 | PARTIALLY_SUPPORTED | The page says the bicycle sign means drive with caution, not slow down and be prepared to stop. | Pedestrian Crossing means slow down and be prepared to stop, while Bicycle Crossing/Bike Path means drive with caution; both may have a second arrow sign showing the actual location. |
| sec03-R10 | PARTIALLY_SUPPORTED | The page says the bicycle crossing means drive with caution, not slowing and stopping readiness. | Pedestrian Crossing means slow down and be prepared to stop, while Bicycle Crossing means drive with caution, while school zones add obeying the limit and signals from crossing guards. |
| sec04-F07 | PARTIALLY_SUPPORTED | The Right and Left Curves entry says only Slow down, not be prepared for the bend. | Sharp turns demand slowing and preparation, while Right and Left Curves says only Slow down. |
| sec06-F01 | PARTIALLY_SUPPORTED | The page states only 8 and 4 o'clock, not 3 and 9, and never mentions 10-and-2, hands-on-12, or airbags. | Place your hands at the 8 o'clock and 4 o'clock positions as stated on this page. |
| sec06-F02 | NOT_FOUND_ON_PAGE | The cited page contains no crash, death, or injury statistics. | Remove the claim; the cited page states no annual crash statistics. |
| sec06-F03 | NOT_FOUND_ON_PAGE | The cited page contains no statement about speeding causes, one-third of deaths, or 20 MPH versus 40 MPH fatality odds. | Remove the claim; the cited page states nothing about speeding fatality proportions. |
| sec06-F04 | NOT_FOUND_ON_PAGE | The cited page contains no statement about 60 MPH wall-like impacts or 30 MPH intrusion distance. | Remove the claim; the cited page states nothing about impact forces at 60 or 30 MPH. |
| sec06-F05 | PARTIALLY_SUPPORTED | The page supports obeying limits and slowing for school/work zones, construction, and bad weather, but never mentions local ordinances. | A speed limit is the maximum legal speed under ideal conditions; you must drive slower for school or work zone limits, construction, or bad weather. |
| sec06-F06 | NOT_FOUND_ON_PAGE | The cited page 16 states no unposted 55, 35, or 45 MPH maximums; those numbers appear only on the next page. | Remove the claim from this citation; page 16 states no unposted maximums. |
| sec06-F07 | NOT_FOUND_ON_PAGE | The cited page 17 does not state that a posted limit can be unsafe or list rain, fog, traffic, rough pavement, night vision, or construction as reasons to slow. | Remove the claim; page 17 states nothing about when a posted limit is unsafe. |
| sec06-F08 | NOT_FOUND_ON_PAGE | The cited page 17 contains no instruction about moving over, matching traffic pace, or impeding normal flow. | Remove the claim; page 17 states nothing about driving slower than traffic. |
| sec06-F09 | PARTIALLY_SUPPORTED | The page requires three factors, not two, and never mentions 55 MPH or reaction travel growing with speed. | Stopping distance is determined by three factors: perception time, reaction distance and braking distance. |
| sec06-F10 | PARTIALLY_SUPPORTED | The page says wet pavement can double braking distance, not total stopping distance, and never mentions snow or ice or ten times. | Wet pavement can double your braking distance; the page states no snow or ice multiplier. |
| sec06-F11 | NOT_FOUND_ON_PAGE | The cited page lists places where you must stop, not places where you must not stop for safety or no-stopping restrictions. | Remove the claim; page 17 states only where you must always stop. |
| sec06-F13 | PARTIALLY_SUPPORTED | The page supports stopping from any direction unless divided by a median or barrier, but never states a 45 MPH school bus maximum. | You must stop from any direction unless traveling opposite on a roadway with a median or barrier; the page states no 45 MPH bus limit. |
| sec06-F14 | NOT_FOUND_ON_PAGE | The cited page contains no statement about playgrounds, 15 or 25 MPH limits, or darting children. | Remove the claim; page 17 states nothing about playground speed limits. |
| sec06-R01 | PARTIALLY_SUPPORTED | The page states only 8-and-4 and never mentions 3-and-9, 10-and-2, hands-on-12, or airbag deployment zones. | Place your hands at the 8 o'clock and 4 o'clock positions; the page states no airbag rationale. |
| sec06-R02 | NOT_FOUND_ON_PAGE | The cited page 16 states no 55, 35, or 45 MPH unposted limits; those figures appear only on the next page. | Remove the claim from this citation; page 16 states no unposted limits. |
| sec06-R03 | NOT_FOUND_ON_PAGE | The cited page contains no statement about 20 to 40 MPH fatality odds or 60 and 30 MPH object impacts. | Remove the claim; page 16 states nothing about speed-doubling fatality odds or fixed-object impacts. |
| sec06-R04 | PARTIALLY_SUPPORTED | The page supports a legal ceiling and slowing for zones, construction, and weather, but never mentions local ordinances. | A speed limit is the maximum legal speed under ideal conditions; you must drive slower for school or work zones, construction, or bad weather. |
| sec06-R05 | NOT_FOUND_ON_PAGE | The cited page 17 does not state that a legal speed can be unsafe or require slowing for rain, fog, traffic, rough roads, darkness, or construction. | Remove the claim; page 17 states nothing about slowing below a legal speed. |
| sec06-R06 | NOT_FOUND_ON_PAGE | The cited page 17 contains no statement about moving over or impeding normal flow when slower than traffic. | Remove the claim; page 17 states nothing about driving slower than traffic. |
| sec06-R07 | PARTIALLY_SUPPORTED | The page lists three stopping factors, not two, and says wet pavement can double braking distance only, with no snow or ice tenfold rule. | Stopping involves perception time, reaction distance and braking distance; wet pavement can double your braking distance. |
| sec06-R09 | NOT_FOUND_ON_PAGE | The cited page contains no 45 MPH school bus cap and no 15 or 25 MPH playground zones. | Remove the claim; page 17 states no school bus maximum or playground limits. |
| sec07-F01 | PARTIALLY_SUPPORTED | The page does not mention parking areas and limits driveway yielding to entering from a private road or driveway. | Yield to pedestrians or bicyclists in a clearly marked crosswalk or at an unmarked intersection, and stop and yield to all traffic and pedestrians when entering from a private road or driveway. |
| sec07-F02 | NOT_FOUND_ON_PAGE | The cited page contains no statement about left turns yielding or green arrows. |  |
| sec07-F03 | PARTIALLY_SUPPORTED | The page mentions only private road or driveway, not parking lots or parking areas. | When entering a roadway from a private road or driveway, you must stop and yield to all traffic and pedestrians. |
| sec07-F04 | PARTIALLY_SUPPORTED | The page supports yielding to the right but never mentions a T-intersection or side road yielding to a through road. | When vehicles arrive at the same time at an intersection with no signs or signals, the driver on the left must allow the driver on the right to go first. |
| sec07-F05 | NOT_FOUND_ON_PAGE | The cited page contains no red-light versus green-light yielding rules for pedestrians and vehicles in the intersection. |  |
| sec07-F06 | PARTIALLY_SUPPORTED | The page supports pulling to the right edge and yielding to funeral processions but does not say to first leave an occupied intersection. | When police, fire, rescue or ambulance approach from behind using siren, lights or both, immediately yield, pull to the right edge and stop until passed; you must yield to funeral processions. |
| sec07-F07 | PARTIALLY_SUPPORTED | The page covers emergency vehicles, tow trucks, and flares/hazard lights but does not mention construction vehicles. | When approaching a stationary emergency vehicle or tow truck with flashing lights, change to a lane not next to it if reasonable, otherwise reduce speed; do the same lane change with caution for hazard lights, warning signs, or flares. |
| sec07-F08 | NOT_FOUND_ON_PAGE | The cited page contains no description of walk, don't-walk, or countdown pedestrian signals. |  |
| sec07-F09 | PARTIALLY_SUPPORTED | Page 19 supports slowing and yielding to pedestrians and vehicles already in the roundabout but does not state counter-clockwise travel, which is on page 18. | As you approach slow down; when you arrive yield to pedestrians and bicyclists and to any vehicles already in the roundabout, and when clear you may enter. |
| sec07-F10 | PARTIALLY_SUPPORTED | Page 19 supports staying in lane and using the right-turn signal but contains no statement about trucks needing extra room or not passing beside them. | While inside stay in your lane until ready to exit, use your right turn signal, and do not change lanes without checking the lane next to and behind you and blind spots. |
| sec07-F11 | PARTIALLY_SUPPORTED | The page supports mirror, signal, and blind-spot checks but does not mention planning early, setting speed, or speeding on entrance ramps. | Before changing lanes check side and rearview mirrors, use your turn signal, check for others moving into the lane, and glance over your shoulder for blind spots. |
| sec07-F12 | PARTIALLY_SUPPORTED | The page says return when you see the front of the passed vehicle, not specifically its headlights. | Check ahead, behind and blind spot, signal then accelerate to pass, and return to the right lane as soon as you can see the front of the passed vehicle in your rearview mirror. |
| sec07-F13 | PARTIALLY_SUPPORTED | The page supports hills, curves, intersections, railroad crossings, and stopped school buses but not the 100-foot bridge/tunnel rule or pedestrian crossings. | Passing is unlawful and unsafe on hills, curves, at intersections or railroad crossings except on roads with two or more lanes same direction, and when a school bus is stopped to load or unload. |
| sec07-F14 | PARTIALLY_SUPPORTED | The page mentions completing the pass before a No Passing zone but does not state double solid yellow or solid-side rules. | Complete the pass before you reach a No Passing zone; if still in the left lane when you reach the zone you are breaking the law. |
| sec07-R01 | NOT_FOUND_ON_PAGE | The cited page contains no statement about plain left turns or green-arrow left turns. |  |
| sec07-R02 | PARTIALLY_SUPPORTED | The page supports marked and unmarked crossings and driveways but never mentions parking areas. | You must yield to pedestrians or bicyclists crossing within a clearly marked crosswalk or at an unmarked intersection, and stop and yield when entering from a private road or driveway. |
| sec07-R03 | PARTIALLY_SUPPORTED | The page supports deferring to the right at simultaneous arrivals but never mentions T-junctions or through roads. | When vehicles arrive at the same time at an intersection with no signs or signals, the driver on the left must allow the driver on the right to go first. |
| sec07-R04 | NOT_FOUND_ON_PAGE | The cited page contains no red-light or green-light yielding rules for those still in the intersection. |  |
| sec07-R06 | NOT_FOUND_ON_PAGE | The cited page contains no walk, don't-walk, or countdown rules. |  |
| sec07-R07 | PARTIALLY_SUPPORTED | Page 19 supports yielding to vehicles in the roundabout, signs, and right-signal exit but does not state counter-clockwise travel. | Yield to any vehicles already in the roundabout, look for street and direction signs before entry, stay in lane inside, and use the right turn signal to exit. |
| sec07-R08 | PARTIALLY_SUPPORTED | Page 19 supports staying in lane but contains no statement about trucks swinging wider arcs or forbidding driving beside them. | While inside stay in your lane until ready to exit and do not change lanes without checking the lane next to and behind you and blind spots. |
| sec07-R09 | PARTIALLY_SUPPORTED | The page supports mirrors, signals, and blind-spot checks but does not mention ramp entries adding speed. | Before changing lanes check side and rearview mirrors, use your turn signal, and glance over your shoulder for blind-spot vehicles. |
| sec07-R10 | PARTIALLY_SUPPORTED | The page supports front-in-mirror return, hills, curves, intersections, and school buses but says front not headlights and omits pedestrian crossings. | Return when you see the front of the passed vehicle in your rearview mirror; passing is unlawful on hills, curves, at intersections or railroad crossings except with two or more same-direction lanes, and when a school bus is stopped. |
| sec07-R11 | PARTIALLY_SUPPORTED | The page supports hills, curves, and No Passing zones but does not state double-yellow, solid-side, or bridge/tunnel sight rules. | Passing is unlawful on hills and curves and you must complete the pass before you reach a No Passing zone. |
| sec12-F09 | PARTIALLY_SUPPORTED | Page says second offense could mean $500, not certain $500. | If convicted you will be fined $50; a second or subsequent offense could mean a $500 penalty. |
| sec12-R04 | PARTIALLY_SUPPORTED | Page says refusal may result in arrest or station trip, not certain arrest alone. | Sign the citation as no admission of guilt; refusal may result in arrest or being required to go to the police station. |
| sec12-R06 | PARTIALLY_SUPPORTED | Page says second offense could mean $500, not certain, and waiver also needs physical fitness grounds. | Waiver needs weight, physical fitness or medical reasons with signed statement carried; first offense $50, second could mean $500. |
| sec12-R11 | PARTIALLY_SUPPORTED | Page says 12-and-under back seat is safer, not a mandatory rule. | Rear-facing in front only if no back seat and no live passenger air bag; children 12 and under are safer buckled up in back. |
| sec13-F09 | PARTIALLY_SUPPORTED | The page states suspension for missing the clinic without specifying 90 days. | At 18+, 12 in 12 or 18 in 24 orders a clinic with suspension if skipped, while 18 in 12 or 24 in 24 suspends 90 days plus the clinic. |
| sec14-F04 | PARTIALLY_SUPPORTED | Page says violators may face adult penalties, not that they earn them definitely. | If convicted with BAC .08% or higher after illegally consuming alcohol, you may face the same penalties as an adult. |
| sec14-R03 | PARTIALLY_SUPPORTED | Page says may face adult penalties, not that violators definitely eat adult penalties. | Conviction after illegally consuming alcohol with BAC .08% or higher may bring the same penalties as an adult, while providing alcohol brings fine, suspension and jail. |
| sec14-R04 | PARTIALLY_SUPPORTED | Omits the up to/at least qualifiers for fines, jail, service and suspension amounts. | Suppliers face up to $2,500, suspension up to one year and 12 months in jail, while fake-ID users face at least $500, at least 50 hours, up to 12 months jail and suspension at least six months but not more than one year. |
| sec14-R08 | PARTIALLY_SUPPORTED | Page says home license should be accompanied by translation, not must pair. | AAA issues permits except to persons whose privilege is suspended or revoked, and a visitor's home license should be accompanied by a translation. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-va-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
