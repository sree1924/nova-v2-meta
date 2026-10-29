# Fact check — Hawaii (HI), Muse one call per section

Run 2026-10-28-rdmv-hi-class-3. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 17 of 17 |
| Facts checked | 710 |
| Supported | 651 |
| Partially supported | 49 |
| Not found on cited page | 10 |
| Contradicted | 0 |
| Exact cost | $0.5295 (138,356 input + 83,895 output tokens) |
| Cost per fact | $0.00075 |
| Projection, all 51 (37,967 facts) | $28.31 |
| Projection, states Muse can audit independently (33,681 facts) | $25.12 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-exemptions-types-obtaining | 52 | 46 | 6 | 8389 / 6835 | $0.0395 |
| sec02-license-categories-tests-renewal | 51 | 39 | 12 | 30783 / 3972 | $0.0554 |
| sec03-vehicle-equipment-inspection | 39 | 37 | 2 | 4779 / 5060 | $0.0275 |
| sec04-vehicle-registration-title | 35 | 32 | 3 | 6903 / 4346 | $0.0271 |
| sec05-the-driver-emotional-medical-age | 26 | 25 | 1 | 2967 / 3013 | $0.0165 |
| sec06-traffic-laws-rules-regulations | 50 | 43 | 7 | 10600 / 6986 | $0.0429 |
| sec07-pavement-markings | 34 | 30 | 4 | 3491 / 3721 | $0.0202 |
| sec08-traffic-signals | 29 | 26 | 3 | 2917 / 3537 | $0.0187 |
| sec09-traffic-signs-warning-guide-construction | 38 | 34 | 4 | 3990 / 4845 | $0.0256 |
| sec10-crash-procedures-insurance-financial-responsibility | 26 | 24 | 2 | 2787 / 2719 | $0.0150 |
| sec11-alcohol-and-other-drugs | 32 | 30 | 2 | 3414 / 4301 | $0.0225 |
| sec12-driving-habits-defensive-driving-safety-belts | 47 | 44 | 3 | 8549 / 6786 | $0.0395 |
| sec13-backing-lanes-speed-turns-passing-brakes | 56 | 55 | 1 | 12030 / 5710 | $0.0393 |
| sec14-parking-signals-traffic-mix-weather | 50 | 48 | 2 | 9831 / 5640 | $0.0363 |
| sec15-freeway-driving-emergency-procedures | 51 | 48 | 3 | 10787 / 5748 | $0.0379 |
| sec16-sharing-road-trucks-trailers-buses-motorcycles | 46 | 45 | 1 | 8987 / 4883 | $0.0320 |
| sec17-pedestrian-and-bicycle-safety | 48 | 45 | 3 | 7152 / 5793 | $0.0336 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F01 | PARTIALLY_SUPPORTED | The fact omits the page's requirement that you be employed by the federal government. | You are exempt when you are employed by and driving a federal-government-owned non-commercial vehicle and possess a valid federal-agency license. |
| sec01-R02 | PARTIALLY_SUPPORTED | The cited page states the class 3 age and graduated-program requirement but does not state the provisional age-16 and permit-period requirement. | On this page, a class 3 license requires age 17 and, if under 18, completion of the graduated licensing program. |
| sec01-R03 | PARTIALLY_SUPPORTED | The cited page states the 6-month provisional requirement but does not state the 180-day permit requirement. | On this page, a driver under 18 must hold the provisional license at least 6 months before class 3 eligibility. |
| sec01-R06 | PARTIALLY_SUPPORTED | The cited page states the limited-purpose limits but does not state that a REAL ID license works as federal identification. | On this page, the limited-purpose license is not acceptable for official federal purposes and does not establish eligibility for employment, voter registration or public benefits. |
| sec01-R08 | PARTIALLY_SUPPORTED | The page requires two residence proofs but does not say legal name, birth date, presence and SSN each need one separate document. | Applicants must provide documents proving legal name, date of birth, legal presence, SSN, and two proofs of Hawaii principal residence. |
| sec01-R11 | PARTIALLY_SUPPORTED | The cited page states class 1 for mopeds and class 2 for motorcycles with tests but does not describe class 3. | On this page, class 1 is for mopeds and class 2 for motorcycles, each requiring a special knowledge test and off-street skills test. |
| sec02-F04 | PARTIALLY_SUPPORTED | The page states the six-month hold but omits the numeric minimum age. | You must hold a provisional license for six months before applying for a driver's license; the page states no numeric minimum age. |
| sec02-F06 | PARTIALLY_SUPPORTED | The page supports the weight and passenger limits but does not mention autocycles in the class 3 description. | Class 3 covers any single vehicle with a GVWR of 18,000 pounds or less and vehicles designed to transport 15 or fewer passengers including the driver. |
| sec02-F23 | NOT_FOUND_ON_PAGE | The cited page contains no text about duplicate licenses. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F24 | NOT_FOUND_ON_PAGE | The cited page contains no text about address changes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F25 | NOT_FOUND_ON_PAGE | The cited page contains no text about name changes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F26 | NOT_FOUND_ON_PAGE | The cited page contains no text about disabilities or medical fitness. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F27 | NOT_FOUND_ON_PAGE | The cited page contains no text about medical reports or restricted licenses. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F28 | NOT_FOUND_ON_PAGE | The cited page contains no text about withdrawal of licenses. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F29 | NOT_FOUND_ON_PAGE | The cited page contains no text about letter restriction codes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-F30 | NOT_FOUND_ON_PAGE | The cited page contains no text about numbered restriction codes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-R03 | NOT_FOUND_ON_PAGE | The cited page contains no text about address or name changes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec02-R11 | NOT_FOUND_ON_PAGE | The cited page contains no text about restriction codes. | No correction can be grounded in the cited page because it contains no relevant text. |
| sec03-F05 | PARTIALLY_SUPPORTED | The statement omits the page's exceptions for ambulances and new vehicles. | All motor vehicles must have a PMVI at least once a year, except ambulances every six months and new vehicles not until two years after initial inspection on first sale. |
| sec03-R08 | PARTIALLY_SUPPORTED | The page states the hand-signal rule for directional signals but does not state any rule about brake lamps or head lamps having no hand-signal substitute. | If the directional signals fail, use hand signals until you can have them repaired. |
| sec04-F09 | PARTIALLY_SUPPORTED | Page 21 states the 30-day notice but does not state the in-writing and old/new address, license, make and VIN details on that page. | On the cited page, whenever the address is changed the owner must within 30 days notify the appropriate county agency; for full notice contents see the continuation on the next page. |
| sec04-R04 | PARTIALLY_SUPPORTED | Page 23 supports the temporary-permit limit but does not state the Hawaii annual twelfth-month expiry on that page. | On the cited page, a permit allows operation up to its expiration date but never beyond twelve months; the annual twelfth-month expiry is stated on the first-registration page, not this page. |
| sec04-R05 | PARTIALLY_SUPPORTED | Page 22 supports the new-vehicle rule but does not state the used-vehicle title, registration and notarized bill rule on that page. | On the cited page, Hawaii accepts for a new vehicle from another jurisdiction either the manufacturer's certificate of origin or a notarized bill of sale; cite the later page for used-vehicle requirements. |
| sec05-R07 | PARTIALLY_SUPPORTED | Page states driver is the only element that can gather information and act, but does not state environment and vehicle are conditions the driver must manage. | The driver is the only one of the three elements who can gather information, apply skill, knowledge, experience and judgment, and take action. |
| sec06-F02 | PARTIALLY_SUPPORTED | The page says slower traffic should, not must, use the extreme right lane. | When moving slower than other traffic you should drive in the extreme right lane. |
| sec06-F05 | PARTIALLY_SUPPORTED | The page requires two or more lanes in each direction, not just in your direction. | You may pass on the right on a paved street or highway with two or more lanes marked for traffic in each direction. |
| sec06-F29 | PARTIALLY_SUPPORTED | The page says you should not drive between procession vehicles, not must not. | You should not drive your vehicle between the vehicles in a funeral procession. |
| sec06-R02 | PARTIALLY_SUPPORTED | The cited page states the 100-foot rule but does not state the 700 to 1000 feet hill/curve rule. | Passing is banned within 100 feet of an intersection, railroad crossing, narrow bridge, viaduct or tunnel; the 700 to 1000 feet hill/curve rule is on a different page. |
| sec06-R04 | PARTIALLY_SUPPORTED | The page does not state that left-turn yield applies regardless of who arrived first. | At simultaneous arrival yield to the car on the right, while a left-turning driver yields to oncoming traffic close enough to be a hazard. |
| sec06-R07 | PARTIALLY_SUPPORTED | The cited page does not state the right-shoulder ban; it is on another page. | Passing on the right is allowed when the vehicle ahead is turning left or on the listed multilane roads; do not pass on the right shoulder per the no-passing rules. |
| sec06-R11 | PARTIALLY_SUPPORTED | The cited page states the emblem rule but does not state the no-passing pennant rule. | The slow-moving emblem rule is as stated; the yellow no passing zone pennant on the left side is stated on another page. |
| sec07-R02 | PARTIALLY_SUPPORTED | The cited page states the double solid white rule but does not state the single solid white rule. | Split the claim: cite page 34 for the single solid white rule and page 35 for the double solid white rule. |
| sec07-R03 | PARTIALLY_SUPPORTED | The cited page states the yellow-line rule but does not state the white-line rule. | Cite page 33 for yellow lines separating opposite directions and page 34 for white lines separating same direction. |
| sec07-R05 | PARTIALLY_SUPPORTED | The cited page states the two-way left turn lane rule but does not state the double solid yellow rule. | Cite page 36 for the two-way left turn lane and page 33 for double solid yellow lines allowing crossing only for a left turn. |
| sec07-R09 | PARTIALLY_SUPPORTED | The cited page states the railroad crossing markings but does not state the red marking rule. | Cite page 38 for railroad crossing markings and page 35 for red markings indicating a roadway that must not be entered. |
| sec08-R01 | PARTIALLY_SUPPORTED | Omits the page's condition that traffic is moving to the left and the stop requirement for the left turn, and adds any street. | After stopping, right on red is allowed unless prohibited, and left on red is allowed from a one-way into a one-way where traffic is moving to the left unless prohibited. |
| sec08-R07 | PARTIALLY_SUPPORTED | Page 41 states the Red X rule but does not state the red arrow rule on that page. | A Red X means you must not use that lane because it is used by opposite-direction traffic; cite page 40 for the red arrow meaning. |
| sec08-R09 | PARTIALLY_SUPPORTED | Page 40 states the green-light yield rule but does not state the right-on-red yield rule on that page. | A green light requires yielding to pedestrians and vehicles already in the intersection; cite page 39 for yielding to all pedestrians and vehicles on right turn on red. |
| sec09-R02 | PARTIALLY_SUPPORTED | The page qualifies yellow as almost always diamond, which the statement omits. | Yellow warns of hazardous conditions and almost always appears on a diamond, while orange warns of road work on rectangular or diamond signs. |
| sec09-R05 | PARTIALLY_SUPPORTED | The cited page states pass with care ends the zone but does not state do not pass begins one. | A pass with care sign indicates the end of a no-passing zone, while a do not pass sign indicates locations on two- or three-lane roads where passing is prohibited. |
| sec09-R07 | PARTIALLY_SUPPORTED | The cited page supports the exclusion-sign part but does not state the other-regulatory-sign wording on that page. | An exclusion sign uses a red circle, with or without a diagonal slash, to restrict or prohibit vehicles, movements or other activity. |
| sec09-R11 | PARTIALLY_SUPPORTED | The cited page states the location/service function but does not state the green, blue, brown or yellow colors. | Guide and information signs contain information regarding your location and the location of places and services. |
| sec10-R01 | PARTIALLY_SUPPORTED | Page 54 states the $5,000 medical-bill lawsuit threshold but does not state the $3,000 crash-reporting threshold. | For bodily injury you can sue or be sued only when medical bills exceed $5,000, among other conditions stated on the page. |
| sec10-R10 | PARTIALLY_SUPPORTED | Page 53 states suspension for safety-responsibility non-compliance but does not state forfeiture of registration for insurance-law violations. | The penalty for non-compliance with the safety responsibility law is suspension of the driver's license. |
| sec11-R02 | PARTIALLY_SUPPORTED | The cited page states the .02 zero-tolerance rule but does not state the .08 administrative-revocation rule. | The under-the-influence threshold is .08 percent or more, while the zero-tolerance threshold for drivers under 21 is .02 or more. |
| sec11-R03 | PARTIALLY_SUPPORTED | The cited page states the 30-day permit for .08 or refusal but does not state the one-, two- or four-year refusal revocation periods. | A test showing .08 or more or refusing the test results in license taken away with a 30-day temporary driving permit. |
| sec12-F07 | PARTIALLY_SUPPORTED | The cited page 58 does not state driving with one arm out the window; that phrase is on page 57. | The inattentive driver talks to a passenger while gesturing, pays little attention to traffic, daydreams or gazes off the road when alone, and forfeits safety. |
| sec12-F33 | PARTIALLY_SUPPORTED | The cited page does not mention a mother or before birth; it only shows Use lap-shoulder belt Low and snug. | Use the lap-shoulder belt low and snug, and after birth the baby rides in a car safety seat and is never carried in arms. |
| sec12-R10 | PARTIALLY_SUPPORTED | The cited page lists Infant facing forward as a mistake and Infant position but does not state rearward. | A baby rides in an infant seat or convertible seat in the infant position, while facing an infant forward is a listed common mistake. |
| sec13-R02 | PARTIALLY_SUPPORTED | The cited page states the two-second count but does not state the rear-tires stopping gap. | State only the two-second minimum following interval on this page; cite page 70 for the rear-tires stopping gap. |
| sec14-R03 | PARTIALLY_SUPPORTED | The cited page supports the hazard-flasher claim but does not state the every-turn-and-lane-change rule. | Hazard flashers warn of a vehicle in a hazardous position and must never be used while moving. |
| sec14-R04 | PARTIALLY_SUPPORTED | The cited page supports the 18-inch start and 2-foot clearance but does not state the 12-inch curb rule. | Parallel parking starts 18 inches from the front car and ends with bumpers at least two feet from neighbors. |
| sec15-F23 | PARTIALLY_SUPPORTED | The cited page states greater steering effort but does not state never give up on steering. | Partial loss of steering control with power steering may occur, requiring greater effort on the steering wheel to control direction. |
| sec15-R03 | PARTIALLY_SUPPORTED | The cited page states the opposite-direction procedure but does not state the missed-exit rule. | Needing the opposite direction means going to the next exit, leaving and re-entering; the missed-exit continue-to-next-exit rule is on the next page. |
| sec15-R05 | PARTIALLY_SUPPORTED | The page assigns the right-edge glance to bright oncoming lights, not to dawn and dusk generally. | During dawn/dusk turn low beams on so others see you; if an approaching vehicle's lights are too bright, flash once and look at the right edge. |
| sec16-R10 | PARTIALLY_SUPPORTED | The cited page states the turning-in-front cause but does not state that intersections are where it most often happens. | Limit the claim to page 89: over two-thirds of car/motorcycle crashes result from a car driver turning in front of the motorcyclist. |
| sec17-R03 | PARTIALLY_SUPPORTED | The cited page states the 3-foot passing rule but does not state the 3-foot parked-car rule. | A driver passing a bicyclist keeps at least three feet of clearance until safely past. |
| sec17-R06 | PARTIALLY_SUPPORTED | The cited page states waiting for the next cycle but does not state the prohibition on entering when vehicles are close by. | A pedestrian should wait for the next cycle when the green has been showing for a while. |
| sec17-R09 | PARTIALLY_SUPPORTED | The cited page states walking on the left facing traffic but does not state riding on the right with traffic. | A pedestrian walks on the left side facing oncoming traffic. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-hi-class-3/sources/private/audits/muse-fact-check/ (private, gitignored).
