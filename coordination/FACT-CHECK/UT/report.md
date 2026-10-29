# Fact check — Utah (UT), Muse one call per section

Run 2026-10-26-rdmv-ut-class-d. Auditor muse-spark-1.3 via the Meta Model API — NOT independent (Muse wrote these dossiers). compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 374 |
| Supported | 322 |
| Partially supported | 39 |
| Not found on cited page | 13 |
| Contradicted | 0 |
| Exact cost | $0.3657 (75,350 input + 63,893 output tokens) |
| Cost per fact | $0.00098 |
| Projection, all 51 (37,967 facts) | $37.13 |
| Projection, states Muse can audit independently (33,681 facts) | $32.94 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-definitions | 14 | 10 | 4 | 2878 / 2351 | $0.0136 |
| sec02-licensing-requirements | 17 | 17 | 0 | 2175 / 3703 | $0.0185 |
| sec03-driver-education-permits | 19 | 10 | 9 | 3175 / 4395 | $0.0226 |
| sec04-license-types-id-documents | 22 | 14 | 8 | 5101 / 4060 | $0.0236 |
| sec05-vision-health | 16 | 14 | 2 | 2675 / 4903 | $0.0242 |
| sec06-examinations | 14 | 12 | 2 | 2978 / 2738 | $0.0154 |
| sec07-preparing-vehicle | 26 | 26 | 0 | 3373 / 2971 | $0.0168 |
| sec08-basic-driving | 29 | 29 | 0 | 6758 / 4387 | $0.0271 |
| sec09-rules-of-the-road | 39 | 31 | 8 | 7545 / 6104 | $0.0354 |
| sec10-alcohol-drugs | 24 | 20 | 4 | 4736 / 5012 | $0.0272 |
| sec11-distractions-challenges | 27 | 24 | 3 | 7156 / 3626 | $0.0244 |
| sec12-crashes-insurance | 22 | 22 | 0 | 4761 / 2371 | $0.0160 |
| sec13-suspensions-record | 18 | 16 | 2 | 3293 / 2961 | $0.0167 |
| sec14-sharing-the-road | 45 | 43 | 2 | 12468 / 5868 | $0.0405 |
| sec15-vehicle-equipment | 21 | 17 | 4 | 3445 / 5058 | $0.0258 |
| sec16-towing | 21 | 17 | 4 | 2833 / 3385 | $0.0179 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F02 | PARTIALLY_SUPPORTED | Head checks definition is not on page 11; it appears on page 12. | Limit this fact to blind spots on page 11 and cite head checks separately to page 12. |
| sec01-F06 | PARTIALLY_SUPPORTED | Denied and disqualification definitions are on page 11, not on cited page 13. | Cite revocation and suspension to page 13 and denied/disqualification to page 11. |
| sec01-F10 | NOT_FOUND_ON_PAGE | The personal motorized mobility device definition is not on page 12; it is on page 13. | Change citation to pdf page 13 where the definition appears. |
| sec01-F14 | PARTIALLY_SUPPORTED | Division definition is on page 11, not on cited page 12. | Cite operator and highway to page 12 and Division to page 11. |
| sec03-F04 | PARTIALLY_SUPPORTED | The page states observation may be required by school, not that it is required on every path. | All paths require 6 hours behind-the-wheel instruction and 6 hours of observation by a licensed instructor, which may be required by school. |
| sec03-F08 | PARTIALLY_SUPPORTED | The cited page states the 90-day holding and driver-education waiver but does not state the 40 hours with 10 after sunset. | Applicants 19+ who have never been licensed may be licensed if they hold a learner permit 90 days; complete driver education to waive the 90 days, per this page. |
| sec03-F09 | PARTIALLY_SUPPORTED | The cited page provides only the tail of the under-18 supervision rule, with the instructor and parent/guardian options stated on the prior page. | On this page, an adult age 21 or older may supervise if the parent/legal guardian is not licensed, with permission proof, and the adult is licensed. |
| sec03-F12 | PARTIALLY_SUPPORTED | The page also allows accompaniment by a licensed driver 21 in front and passenger exceptions do not include work or school travel. | Age 16 with a license: 12 am-5 am and immediate-family-only passengers for six months; exceptions include licensed driver 21, agriculture, work/school for nighttime, and emergency. |
| sec03-R02 | PARTIALLY_SUPPORTED | The page says observation may be required by school, not that it is always required. | Behind-the-wheel training needs 6 hours driving and 6 hours observation by a licensed instructor, which may be required by school. |
| sec03-R03 | PARTIALLY_SUPPORTED | The cited page does not state the 40 hours with 10 after sunset for ages 15 to 18. | This page requires completed driver education and 6-month holding at 16-17 and driver education at 18, without stating 40 hours. |
| sec03-R04 | PARTIALLY_SUPPORTED | The cited page states the 90-day and waiver rule but does not state the 40 hours with 10 after sunset. | Drivers 19+ must hold a learner permit 90 days unless completing approved driver education, per this page. |
| sec03-R05 | PARTIALLY_SUPPORTED | The cited page states the licensed-driver front-seat requirement but does not state immediate possession on this page. | The front-seat supervisor must be a licensed driver 21 or as table-listed; immediate possession is not stated on this page. |
| sec03-R06 | NOT_FOUND_ON_PAGE | The cited page lists fees and contains no holding-period rule. | Remove the claim from this page; holding periods are stated on the learner-permit holding-periods page, not the fees page. |
| sec04-F10 | NOT_FOUND_ON_PAGE | The cited page does not state any social-security document list. | Omit the social-security list unless sourced to the page that states it. |
| sec04-F11 | PARTIALLY_SUPPORTED | The page lists those items but does not state the two-document, 90-day, and bank-statement requirements in the provided text. | State only the residency items actually listed on the page and omit the two-document and 90-day rule unless sourced elsewhere. |
| sec04-F12 | PARTIALLY_SUPPORTED | The page exempts only a learner permit, not an ID card. | State proof of driving experience is not required when obtaining a learner permit. |
| sec04-F13 | NOT_FOUND_ON_PAGE | The cited page does not state limited-term identity documents or SAVE verification. | Omit the limited-term document list unless sourced to the page that states it. |
| sec04-F14 | PARTIALLY_SUPPORTED | The page states the sealed fingerprint-card requirement but does not state the primary, secondary, or SSN/ITIN lists. | State only that an original requires a sealed fingerprint card and photo, omitting the primary/secondary lists. |
| sec04-R04 | NOT_FOUND_ON_PAGE | The cited page does not list restriction codes. | Cite the page that actually lists endorsement and restriction codes. |
| sec04-R05 | NOT_FOUND_ON_PAGE | The cited page states identity proof but does not group identity, residence, and driving-experience proofs as a triad. | Omit the triad grouping or cite pages that state each proof. |
| sec04-R06 | PARTIALLY_SUPPORTED | The page states renewal timing but not replacement and address-change duties, which are on the next page. | Limit the grouping to renewal timing on this page or also cite the replacement/address-change page. |
| sec05-vision-health-R02 | PARTIALLY_SUPPORTED | Page 31 states the Class D vision rule and screening but does not list the eleven MAB health groups. | Class D requires 20/40 vision in one eye and at least 90° visual field with screening at the field office and at application if older than 65. |
| sec05-vision-health-R04 | PARTIALLY_SUPPORTED | Page 32 covers the review examination and hearing-officer decision but not the initial licence health questions and mailed FAE step. | After a review examination a hearing officer reviews the FAE and decides on restrictions, with privileges withdrawn only if safe operation is impossible under any conditions. |
| sec06-F09 | PARTIALLY_SUPPORTED | Lane changes and overall safe operation are not listed on page 33; they appear on page 34. | Cite pages 33-34 for the full list including lane changes and overall safe operation, or omit those items when citing only page 33. |
| sec06-F10 | NOT_FOUND_ON_PAGE | The one-per-day, three-failure fee, and six-month completion rules do not appear on page 35. | Change citation to pdf page 34 (printed page 24) where the practice, one-test-daily, three-attempt fee, and six-month rules appear. |
| F14 | PARTIALLY_SUPPORTED | The page adds an exception when the last car is more than 500 feet away that the fact omits. | Enter the shared center lane no more than 500 feet before the turn unless the last car is more than 500 feet from the intersection, after mirrors, signal and blind-spot check. |
| R09-06 | PARTIALLY_SUPPORTED | The cited page states acceleration-lane and exit rules but the one-vehicle-per-green meter rule completes on the next page. | Use acceleration lane to match speed; exit early and steady; metered ramp rule per page 41 allows one vehicle per green unless posted differently when meter-on sign is lit. |
| R09-08 | PARTIALLY_SUPPORTED | The cited page supports slow/scan and left-right-left but stop-behind-line, no lane change, and merge-right rules are on the next page. | Approach slow and scan and look left-right-left per page 41; stop-behind-line, no lane change in intersection, and merge-right steps are stated on page 42. |
| R09-09 | PARTIALLY_SUPPORTED | The cited page covers continuous-flow turns but diverging-diamond and thru-U-turn descriptions are on the next page. | Continuous-flow staged-signal procedure per page 42; diverging-diamond and thru-U-turn redirection details are stated on page 43. |
| R09-10 | PARTIALLY_SUPPORTED | The cited page supports crosswalk and shared-lane limits but yellow/white lane-division meanings are on the prior page. | Stop behind line and yield in crosswalk and limited shared-center entry per page 44; yellow versus white division meanings are stated on page 43. |
| R09-11 | PARTIALLY_SUPPORTED | The cited page states the basic law and defaults but hazard-slowing list and impeding citation are on the next page. | Basic reasonable-and-prudent law and area defaults per page 44; hazard slowing conditions and too-slow impeding citation are stated on page 45. |
| R09-14 | PARTIALLY_SUPPORTED | The cited page supports railroad and regulatory signs but guide, warning-diamond, and work-zone fine/flagger details are on other pages. | Railroad caution/stop discipline and regulatory commands per page 47; guide, warning-diamond, and work-zone orange with doubled fine and flagger obedience are on pages 46, 48-49. |
| R09-15 | NOT_FOUND_ON_PAGE | The cited page contains railroad, regulatory and route signs but no right-of-way priority rules. | Yield rules for prior arrival, left-turn oncoming, right-side tie, driveway, ramp, and occupants still inside are stated on page 50, not page 47. |
| sec10-F03 | NOT_FOUND_ON_PAGE | The statement is truncated to "Alcohol presec10-F03" and states no testable claim. | Replace with page statement: Alcohol and other impairing drugs reduce judgment, vision, color distinction, and reaction time. |
| sec10-F08 | PARTIALLY_SUPPORTED | Omits the 10-year prior-denial window and the or-until-age-21 whichever-is-longer qualifier. | A second or subsequent offense within 10 years results in losing privileges for two years or until age 21, whichever is longer. |
| sec10-F09 | NOT_FOUND_ON_PAGE | Page 53 states no 0.05 BAC or 0.04 CDL threshold. | Remove citation to this page; no BAC threshold is stated on this page. |
| sec10-F10 | PARTIALLY_SUPPORTED | Omits the different under-21 revocation exception stated on the same page. | For drivers 21 and older refusal revokes 18 months then 36 months; if under 21 revocation is two years or until 21 for first offense and 36 months or until 21 thereafter. |
| sec11-F07 | PARTIALLY_SUPPORTED | The statement omits the additional prior-violation trigger for the higher penalty stated on the page. | Texting is a Class C misdemeanor with maximum $100 fine, or Class B misdemeanor if bodily injury is inflicted or there is a previous violation. |
| sec11-R06 | NOT_FOUND_ON_PAGE | The cited page 69 does not discuss flooding water depths or turning around. | Cite page 68 for flooding: six inches reaches bottom causing loss of control/stalling, two feet can carry away most vehicles, turn around if flooded. |
| sec11-R12 | PARTIALLY_SUPPORTED | Page 70 supports dimming distances and lights but does not state longer following space or tinted-lens rule. | On page 70, dim within 500 feet oncoming and 300 feet following and use lights when 1,000 feet not discernible; cite page 71 for following distance and lenses. |
| sec13-F08 | NOT_FOUND_ON_PAGE | The two-year / until-age-21 duration language does not appear on cited page 81. | Move citation to pdf page 80, which states suspension may be for as long as two years or until 21st birthday. |
| sec13-F11 | PARTIALLY_SUPPORTED | Cited page 82 states only the later revocation items; the earlier items like manslaughter and repeat intoxicated control are on page 81. | Limit this fact to pdf page 82 items such as firearm discharge, explosive use, alcohol-restricted and interlock breaches, careless-driving revocation, handheld-device auto homicide, refusal, and two road-rage citations. |
| sec14-F24 | PARTIALLY_SUPPORTED | The page addresses only motorcycle signals, not bicycle signals. | Do not assume a motorcycle with a flashing turn signal will turn, as the signal may not have self-cancelled. |
| sec14-R01 | NOT_FOUND_ON_PAGE | The three-foot passing rule is not stated on the cited page; it appears on the next page. | Cite pdf page 85, which states Utah requires a minimum of three feet from any bicyclist or vulnerable user passed. |
| sec15-R03 | PARTIALLY_SUPPORTED | The summary omits the 80-inch width threshold, lamp counts and placement, and 500-foot night visibility. | Buses, RVs and trailers 80 inches or more wide must have two amber front lights and side lights plus two red rear lights, visible from 500 feet at night. |
| sec15-R04 | PARTIALLY_SUPPORTED | The summary omits the 350-foot high-beam and 100-foot low-beam distances and motorcycle exception. | Except motorcycles, vehicles need at least two white headlights shining 350 feet on high beam and 100 feet on low beam. |
| sec15-R05 | PARTIALLY_SUPPORTED | The summary omits the two-lamp requirement and the 500-foot in regular sunlight visibility standard. | Vehicles must have two red tail/stop lights on the rear visible from 500 feet to the rear in regular sunlight. |
| sec15-R06 | PARTIALLY_SUPPORTED | The summary omits lamp counts and 100-foot sunlight visibility and misstates front colors as pale. | Turn signals need two red, yellow or amber rear lights and two white, yellow or amber front lights visible from 100 feet in normal sunlight. |
| sec16-towing-F09 | PARTIALLY_SUPPORTED | The page says the flag "should" be placed, not that it must be set. | On a one-way street, the rear flag should be placed 200 feet to the rear. |
| sec16-towing-R02 | PARTIALLY_SUPPORTED | The page allows a red flag or other signal, not only a red flag. | A chain, rope, or cable tow link must carry a red flag or other signal at least 12 inches square. |
| sec16-towing-R03 | PARTIALLY_SUPPORTED | The page also prohibits unreasonable swerving and covers any towed vehicle, not only a trailer. | A driver must not operate a train of vehicles when any trailer or other towed vehicle whips or swerves dangerously or unreasonably from side to side. |
| sec16-towing-R04 | PARTIALLY_SUPPORTED | The statement omits the specific 80-inch width and 30-foot length thresholds. | A disabled vehicle at least 80 inches wide or 30 feet long stopped over 10 minutes must display warning devices. |

Full findings with verbatim handbook quotes: runs/2026-10-26-rdmv-ut-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
