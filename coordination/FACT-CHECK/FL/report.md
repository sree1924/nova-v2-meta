# Fact check — Florida (FL), Muse one call per section

Run 2026-10-28-rdmv-fl-class-e. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 12 of 12 |
| Facts checked | 508 |
| Supported | 472 |
| Partially supported | 33 |
| Not found on cited page | 2 |
| Contradicted | 1 |
| Exact cost | $0.3947 (73,525 input + 71,243 output tokens) |
| Cost per fact | $0.00078 |
| Projection, all 51 (37,967 facts) | $29.5 |
| Projection, states Muse can audit independently (33,681 facts) | $26.17 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driver-licenses-id-cards | 64 | 60 | 4 | 10985 / 8139 | $0.0483 |
| sec02-driving-schools-test-providers | 30 | 30 | 0 | 4630 / 4590 | $0.0253 |
| sec03-driving-privilege | 57 | 53 | 4 | 9648 / 8155 | $0.0467 |
| sec04-you-the-driver | 20 | 18 | 2 | 3507 / 3085 | $0.0175 |
| sec05-your-vehicle | 33 | 26 | 7 | 5978 / 5826 | $0.0322 |
| sec06-traffic-controls | 59 | 53 | 6 | 9288 / 9514 | $0.0520 |
| sec07-driving-safety | 57 | 57 | 0 | 9392 / 8299 | $0.0470 |
| sec08-special-driving-situations | 22 | 22 | 0 | 2612 / 2219 | $0.0127 |
| sec09-handling-emergencies | 51 | 48 | 3 | 6400 / 6117 | $0.0340 |
| sec10-sharing-the-road-bicycles-cmv | 22 | 17 | 5 | 2706 / 4010 | $0.0204 |
| sec11-sharing-the-road-emergency-golf-carts | 40 | 36 | 4 | 3621 / 5075 | $0.0261 |
| sec12-sharing-the-road-motorcycles-pedestrians-school-bus | 53 | 52 | 1 | 4758 / 6214 | $0.0324 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F18 | PARTIALLY_SUPPORTED | Omits the one-violation-with-withheld-adjudication exception and the until-18th-birthday alternative. | Minors hold the permit 12 months or until 18 with no convictions, except one violation with withheld adjudication allowed, plus 50 hours with 10 at night and schooling. |
| sec01-F33 | PARTIALLY_SUPPORTED | Omits revoked, canceled, and missing-documentation bars to renewal. | Class E lasts 6 to 8 years; renewal needs old card and vision pass but is barred if ineligible, summons unanswered, license suspended/revoked/canceled, or documents missing. |
| sec01-R11 | PARTIALLY_SUPPORTED | Omits the allowed one violation with withheld adjudication, so clean-permit claim is overstated. | Teen licensure needs 12-month permit or until 18 with no convictions except one with withheld adjudication, plus 50/10 hours, adult certification, consent and schooling. |
| sec01-R19 | PARTIALLY_SUPPORTED | Omits revoked, canceled, and missing-documentation renewal bars. | Renewal spans 6 to 8 years with old card and vision pass, but bars the ineligible, summons-skippers, suspended/revoked/canceled drivers, and those missing documents. |
| sec03-F08 | PARTIALLY_SUPPORTED | Omits required 21-or-older companion for learner license and overstates work/companion excuse as applying to all. | Learner minors must be accompanied by a licensed driver age 21 or older and drive daylight only, then until 10 pm after 3 months; 16 and 17 curfews excused for work or 21-plus companion. |
| sec03-F20 | PARTIALLY_SUPPORTED | Page 31 ends mid-sentence on under-13 seating; rear-seat location is on next page, not cited page. | Rim driving is unlawful, belts must cross hips and chest not behind backs as airbags never substitute, and best seat fits child and car; under-13 rear seating is on next page. |
| sec03-R03 | PARTIALLY_SUPPORTED | Page says falsified card may lead to arrest, not that it forces arrest. | Missing proof requires court proof while showing a known-canceled or falsified card may lead to arrest, and 30-day suspensions allow plate seizure. |
| sec03-R13 | PARTIALLY_SUPPORTED | Page ends with Children under 13 should be without stating behind; rear-seat location is on next page. | Belts must cross hips and chest with airbags never substituting; page states children under 13 should be with remainder on next page. |
| sec04-F02 | PARTIALLY_SUPPORTED | Statement narrows dim-or-dark to after-dark and omits dawn, nighttime and full risky-times list. | Avoid wearing sunglasses in dim or dark conditions and avoid dusk, dawn, nighttime, bad weather, rush-hour traffic and fast-paced highways. |
| sec04-R04 | PARTIALLY_SUPPORTED | Statement omits designated school crossing from the handheld ban locations. | Texting is illegal while operating a motor vehicle, and handheld use is banned in a designated school crossing, school zone, or work zone. |
| sec05-F01 | PARTIALLY_SUPPORTED | Omits employment/school enrollment condition for 10-day rule and omits mobile-home and RV-trailer VIN exceptions. | Non-residents who take employment or enroll children in public school must register within 10 days; VIN verification is also not required for new vehicles, new/used mobile homes, and trailer-type RVs. |
| sec05-F05 | PARTIALLY_SUPPORTED | Omits the exception that stickers required by law are allowed and omits whistle from noisemakers. | Stickers/signs are banned except if required by law; siren, bell, or whistle are banned. |
| sec05-R01 | PARTIALLY_SUPPORTED | Omits employment/enrollment condition and omits new-vehicle, mobile-home and RV exceptions, stating only light trailers. | 10-day rule applies to employment/school enrollment cases; VIN verification is also excused for new vehicles, mobile homes, and trailer-type RVs, not only trailers under 2,000 pounds. |
| sec05-R04 | PARTIALLY_SUPPORTED | Omits that stickers/signs required by law are permitted. | Signs, posters, or stickers are banned except if required by law. |
| sec05-R07 | CONTRADICTED | Page states lane-keeping may correct by a combination of steering, braking and acceleration, not one axis only. | Lane-keeping may correct steering, brakes or accelerate one or more wheels, or a combination of both. |
| sec05-R13 | PARTIALLY_SUPPORTED | Omits the long-object exception to 15 feet and the specific cover and flag conditions. | Drawbar over 15 feet allowed for poles, pipes, machinery or inseparable objects; flag required if chain/rope/cable; cover required for loads that could fall or blow; lock chains for logs/pulpwood. |
| sec05-R14 | PARTIALLY_SUPPORTED | Omits 18-inch size, rain/smoke/fog trigger, reflector distances, side lamps, and always-on amber strobe details. | Day flags must be at least 18-inch red squares; night/rain/smoke/fog needs 500-foot lamps and 100-to-600-foot reflectors plus side lamps; log/pole loads need an always-on amber strobe visible rear and sides. |
| sec06-F10 | PARTIALLY_SUPPORTED | Page orders immediate turnaround only for Wrong Way, not for Do Not Enter. | Yield allows moving without stopping when clear; Do Not Enter bans entry and Wrong Way orders immediate turnaround. |
| sec06-F15 | PARTIALLY_SUPPORTED | The 350 to 500 feet distance applies only to Divided Highway Ends, not to starts. | Road-change signs include two-way, merges, lane drops, roundabouts and divided highway start/end, with only Divided Highway Ends 350 to 500 feet ahead. |
| sec06-R08 | PARTIALLY_SUPPORTED | Page does not order reversal for Do Not Enter; immediate turnaround is only for Wrong Way. | Stops halt fully with arrival order, yields slow without required stop when clear, Do Not Enter bans entry and Wrong Way orders immediate turnaround. |
| sec06-R09 | PARTIALLY_SUPPORTED | Page says fines doubled in active school and work zones, not only under lights. | Speed caps roads, exit speeds cap ramps, and fines double in active school and work zones. |
| sec06-R15 | PARTIALLY_SUPPORTED | Page does not say soft shoulders only require slowing; it bans leaving pavement except emergency. | Low spans bar tall vehicles, slippery surfaces require slow driving, soft shoulders ban leaving pavement except emergency, narrow bridges stay in lane, and one-lane bridges require checking clear. |
| sec06-R26 | PARTIALLY_SUPPORTED | Page says many buses/trucks are required to stop, not that buses always stop. | Crossers clear all tracks with room beyond and never race trains, with many buses/trucks required to stop. |
| sec09-F11 | PARTIALLY_SUPPORTED | Page 85 covers calling, parking far and lighting hazards but not spine-freezing or helmet rules. | Limit page 85 claim to call, park far and lit, and exit clear of traffic; cite page 86 for spine and helmet rules. |
| sec09-R09 | PARTIALLY_SUPPORTED | Page states only death carries a 4-year minimum, not all fleeing felonies. | Fleeing felonies step first, second, third by harm with a 4-year minimum only for death and 3-year license loss for all three. |
| sec09-R10 | PARTIALLY_SUPPORTED | Page 85 covers calling and parking far/lit but not spine or helmet rules. | Limit page 85 claim to calling anyway and parking far and lit; cite page 86 for freezing spines and keeping helmets on. |
| sec10-F04 | PARTIALLY_SUPPORTED | The page limits the high-beam and other rules with conditions the fact omits. | Drivers must not tailgate, must avoid high beams at night when a bicyclist is approaching, check for bicyclists before opening doors, and avoid horn-startling. |
| sec10-F05 | NOT_FOUND_ON_PAGE | The cited PDF p. 90 does not state the obedience, lane-position, left-turn, one-way, or signal rules. | Move citation to PDF p. 89, which states those bicyclist rules. |
| sec10-F12 | PARTIALLY_SUPPORTED | The fact omits the stopped-behind and drift-back and following conditions. | Do not tailgate; if stopped behind a CMV on an upgrade leave space and keep left so driver can see you, and do not use high beams when following a CMV at night. |
| sec10-R05 | NOT_FOUND_ON_PAGE | The cited PDF p. 90 does not state the slow-rider lane or full-lane rules. | Move citation to PDF p. 89, which states those lane-use rules. |
| sec10-R10 | PARTIALLY_SUPPORTED | The fact omits the stopped-behind and drift-back and following conditions. | Do not tailgate; if stopped behind a CMV on an upgrade leave space and keep left so driver can see you, and do not use high beams when following a CMV at night. |
| sec11-F12 | PARTIALLY_SUPPORTED | The page says headlights should be on or hazards may be used, not that every car must run one of them. | All vehicles in the procession should have headlights on or may use flashing hazard lights as a signal not to drive between them. |
| sec11-F21 | PARTIALLY_SUPPORTED | The page says seats should not be used, not that they must stay off or are banned. | Child passenger safety seats should not be used on golf carts or other low speed vehicles because car seats are not crash tested for LSVs. |
| sec11-R06 | PARTIALLY_SUPPORTED | The page tells drivers being passed to keep right, but does not say downgrade no-passing also requires keeping right. | Avoid passing a CMV on a downgrade, and when a CMV passes you keep to the right side of your lane and do not speed up. |
| sec11-R12 | PARTIALLY_SUPPORTED | The page says child seats should not be used, not that they are banned entirely, and it applies to LSVs too. | Day carts require brakes, mirror, steering, red reflectors and safe tires, night requires headlights, brake lights, signals and windshield, and child seats should not be used on golf carts or LSVs. |
| sec12-R01 | PARTIALLY_SUPPORTED | Page requires careful look, not looking twice over. | Watch for motorcycles and look carefully before pulling into an intersection or changing lanes. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-fl-class-e/sources/private/audits/muse-fact-check/ (private, gitignored).
