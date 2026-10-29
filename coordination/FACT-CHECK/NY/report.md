# Fact check — New York (NY), Muse one call per section

Run 2026-10-28-rdmv-ny-class-d. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 13 of 13 |
| Facts checked | 386 |
| Supported | 351 |
| Partially supported | 34 |
| Not found on cited page | 0 |
| Contradicted | 1 |
| Exact cost | $0.4014 (91,591 input + 67,504 output tokens) |
| Cost per fact | $0.00104 |
| Projection, all 51 (37,967 facts) | $39.48 |
| Projection, states Muse can audit independently (33,681 facts) | $35.02 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driver-licenses | 58 | 54 | 4 | 15063 / 8777 | $0.0561 |
| sec02-keep-your-license | 39 | 35 | 4 | 7559 / 6197 | $0.0358 |
| sec03-owning-a-vehicle | 36 | 34 | 2 | 7146 / 5046 | $0.0304 |
| sec04-traffic-control | 30 | 28 | 2 | 5455 / 5434 | $0.0299 |
| sec05-intersections-and-turns | 29 | 24 | 5 | 6127 / 5802 | $0.0323 |
| sec06-how-to-pass | 22 | 22 | 0 | 3738 / 3385 | $0.0191 |
| sec07-parallel-parking | 21 | 18 | 3 | 4006 / 4096 | $0.0224 |
| sec08-defensive-driving | 33 | 27 | 6 | 10477 / 8120 | $0.0476 |
| sec09-alcohol-and-other-drugs | 27 | 25 | 2 | 8538 / 3584 | $0.0259 |
| sec10-special-driving-conditions | 29 | 23 | 6 | 8932 / 7162 | $0.0416 |
| sec11-sharing-the-road | 30 | 30 | 0 | 10438 / 5837 | $0.0379 |
| sec12-traffic-crash | 16 | 16 | 0 | 2158 / 1924 | $0.0109 |
| sec13-adas | 16 | 15 | 1 | 1954 / 2140 | $0.0115 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R10 | PARTIALLY_SUPPORTED | Page 13 states the 50/15/10 practice targets but does not state the six-month permit hold rule. | Practice targets 50 hours with 15 after sunset and 10 hours in moderate to heavy traffic is recommended; page 13 does not address the six-month hold. |
| sec01-R12 | PARTIALLY_SUPPORTED | Page 14 states the course does not meet the safe-driving requirement but does not state point relief or premium cuts. | The Point & Insurance Reduction Program does NOT meet the safe-driving course requirement; point and premium effects are not stated on this page. |
| sec01-R13 | PARTIALLY_SUPPORTED | Page 15 states point, timing and discount terms but does not state separation from test eligibility. | Point relief up to four points every 18 months and minimum 10% premium reduction for three years; page 15 does not address test eligibility. |
| sec01-R16 | PARTIALLY_SUPPORTED | Page 17 states the quarter-mile motorcycle supervision rule but does not state the car front-seat rule. | Motorcycle supervisors must remain within one-quarter mile of a passenger-free rider; the car front-seat requirement is not stated on this page. |
| sec02-F02 | PARTIALLY_SUPPORTED | The statement omits that the six-month holding period excludes any suspension or revocation time. | A junior permit must be held for a minimum of six months, excluding any suspension or revocation time, before a road test can be scheduled. |
| sec02-R04 | PARTIALLY_SUPPORTED | Page 21 supports the refusal scale but does not state the 90-day DWAI suspension to one-year aggravated revocation substance scale. | Refusals scale from one year to 18 months to until age 21 on page 21; the DWAI to aggravated-DWI substance scale is on page 20, not page 21. |
| sec02-R06 | PARTIALLY_SUPPORTED | Page 22 supports the 11-point rule but does not state the six-points-in-18-months monetary assessment. | Eleven points in 24 months brings mailed suspension on page 22; the six-points-in-18-months assessment is on page 23, not page 22. |
| sec02-R08 | PARTIALLY_SUPPORTED | Page 23 states the civil-penalty amounts but does not state the one-year no-insurance revocation or refusal revocation periods. | Page 23 requires $750 for no-insurance and $500, or $750 on a five-year repeat, for refusals before relicensing; revocation lengths are stated elsewhere. |
| sec03-F05 | PARTIALLY_SUPPORTED | Page 24 does not state the repossession risk, which appears on page 25. | Before accepting any title, check its face for lien holders and demand a lender release; cite page 25 for repossession risk. |
| sec03-R01 | PARTIALLY_SUPPORTED | Page 24 never states there is no matching title deadline. | Registration allows road use while title proves ownership, and new residents must register within 30 days. |
| sec04-R01 | PARTIALLY_SUPPORTED | The page states the stop-line/crosswalk/sight-point order only for the STOP sign, not for YIELD. | Stop requires stopping before the stop line, crosswalk, or sight point in that order and both yield right-of-way; the page does not state the same location order for Yield. |
| sec04-R08 | PARTIALLY_SUPPORTED | Page 30 states the dead-signal stop-sign fallback but does not state the flashing-red equivalence, which is on another page. | On this page, a dead signal requires stopping as for a stop sign then following right-of-way unless an officer directs otherwise. |
| sec05-F08 | PARTIALLY_SUPPORTED | Page cites Chapter 8, not a defensive chapter. | Circle entrants yield to traffic already in the circle, with roundabout technique in Chapter 8. |
| sec05-F22 | PARTIALLY_SUPPORTED | Page limits business-district ban to New York City, not any city. | U-turns are illegal in business districts of New York City, at NO U-TURN signs, on limited-access expressways, in school zones, and without 500-foot visibility both ways. |
| sec05-R03 | PARTIALLY_SUPPORTED | Page limits no-light move-over protection to parkways and controlled-access highways, not every road. | Move Over separately protects any shoulder-parked vehicle on a parkway or controlled-access highway, plus lighted emergency/hazard and blue-green-light vehicles. |
| sec05-R05 | PARTIALLY_SUPPORTED | Page limits business-district ban to New York City, not any city business district. | U-turns die on limited-access expressways, in school zones, in business districts of New York City and at posted signs. |
| sec05-R06 | PARTIALLY_SUPPORTED | Page gives the numbered right-stop, left-sweep, right-back, left-exit script but does not state it is the only numbered maneuver. | Three-point turns follow the fixed right-stop, left-sweep, right-back and left-exit script on the page. |
| sec07-F07 | PARTIALLY_SUPPORTED | Page 42 ends mid-sentence and does not state backing to the rear vehicle or turning wheels away from the curb. | To pull away, make sure wheels are straight and back up; the direction to turn wheels away from the curb is on the next page. |
| sec07-F12 | PARTIALLY_SUPPORTED | The 50-foot railroad rule is stated for parking only, not for parking or standing jointly. | Parking or standing is barred in the listed driveway, crosswalk, light/sign, firehouse and cut-curb places; parking is barred within 50 feet of a railroad crossing. |
| sec07-R03 | PARTIALLY_SUPPORTED | The page states right-shoulder first and left-shoulder last but says nothing about ordinary lane-change habits. | The six-step exit begins with a right-shoulder rear-window check and ends with a left-shoulder check before entering traffic. |
| sec08-F12 | PARTIALLY_SUPPORTED | The page says fines are up to $50, not a flat $50. | The driver faces a fine of up to $50 if unbelted, a passenger 16 or older faces a fine of up to $50, and the driver faces $25 to $100 plus three points for each unrestrained passenger under 16. |
| sec08-F20 | PARTIALLY_SUPPORTED | The young-people, shift-worker and sleep-disorder risk groups are not on page 51, they are on page 52. | On this page at-risk drivers are those deprived of sleep, driving long distances without breaks, driving at normal sleep times, on medication or alcohol, alone, on long rural or boring roads, and frequent travelers. |
| sec08-F22 | PARTIALLY_SUPPORTED | The page says fines are up to the stated amounts, not flat amounts. | A first hand-held call brings a fine of up to $200 and five points, first texting a fine of up to $200, second within 18 months up to $250, third or subsequent within 18 months up to $450, with junior and probationary 120-day suspension then revocation of at least one year. |
| sec08-R02 | PARTIALLY_SUPPORTED | The page states the rule for any unposted limit and gives only an expressway example for unreasonable speed, not rural-only and either-limit coverage. | If no limit is posted drive no more than 55 mph, the New York City limit is 25 mph unless otherwise posted, and even speed below a posted limit can be ticketed as not reasonable for conditions. |
| sec08-R03 | PARTIALLY_SUPPORTED | The page states the two-second and three-or-four-second rules but never states it is the only condition-growing gap in the chapter. | Use the two-second rule, increasing to at least three or four seconds in bad weather and when following large trucks. |
| sec08-R06 | PARTIALLY_SUPPORTED | The page states yield-at-entry and circle priority but contains no comparison to normal intersections. | Approaching vehicles must wait for a gap in circulating flow, look left, and yield because traffic in the roundabout has the right-of-way. |
| sec09-F12 | PARTIALLY_SUPPORTED | Page states using a license as proof of age triggers suspension, not lending a license to another. | Using a driver license or Non-Driver ID as proof of age to illegally purchase alcohol requires suspension of driving privilege. |
| sec09-R06 | PARTIALLY_SUPPORTED | Page says food slows absorption somewhat, so grouping food with coffee/exercise as having no effect omits that distinction. | Only time reduces BAC; coffee, exercise and cold showers cannot reduce BAC, while food only slows absorption somewhat. |
| sec10-F04 | PARTIALLY_SUPPORTED | The page also requires empty school buses to stop, which the statement omits. | School buses with or without passengers, other buses with passengers, and vehicles with explosives or flammable cargo must stop at all railroad crossings. |
| sec10-F16 | PARTIALLY_SUPPORTED | The cited page is cut off at Areas where there have been many and does not state the sign rule. | Two-thirds of deer-vehicle collisions occur October through December with dawn-dusk peaks and group travel; the sign rule is on the next page. |
| sec10-R01 | PARTIALLY_SUPPORTED | The cited page requires gates fully raised and lights off but does not mention bells stopping. | On the cited page, gated crossings hold until gates are completely raised and lights are off; the bell-stopped condition is on the next page. |
| sec10-R02 | CONTRADICTED | The page orders get-out and get-away first and calling third, not calling before anything else. | Get everyone out first, get away from the tracks even if no train is seen, then locate the Emergency Notification System sign and call. |
| sec10-R03 | PARTIALLY_SUPPORTED | The cited page does not state the 45-degree angle, which appears on the earlier page. | Run toward the general direction the train is coming from and avoid running down the track with the train due to debris. |
| sec10-R06 | PARTIALLY_SUPPORTED | The cited page states the low-beam distances and weather rule but does not state high beams serve empty dark roads. | Use low beam within 500 feet of oncoming traffic, within 200 feet of a vehicle ahead, and in rain fog or snow where high beams reflect. |
| sec13-R01 | PARTIALLY_SUPPORTED | Page 78 states the two modes but does not label warning systems as alert-only and assist systems as intervention-only. | State only what page 78 states: safety features may provide alerts such as sounds or vibration or may take control such as adjusting braking or steering. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ny-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
