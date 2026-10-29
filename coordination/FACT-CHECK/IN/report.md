# Fact check — Indiana (IN), Muse one call per section

Run 2026-10-28-rdmv-in-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 10 of 10 |
| Facts checked | 580 |
| Supported | 572 |
| Partially supported | 7 |
| Not found on cited page | 1 |
| Contradicted | 0 |
| Exact cost | $0.3596 (77,957 input + 61,690 output tokens) |
| Cost per fact | $0.00062 |
| Projection, all 51 (37,967 facts) | $23.54 |
| Projection, states Muse can audit independently (33,681 facts) | $20.88 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-new-credential-part-1 | 62 | 61 | 1 | 8173 / 7997 | $0.0442 |
| sec02-new-credential-part-2 | 59 | 56 | 3 | 7350 / 7522 | $0.0412 |
| sec03-restrictions-endorsements | 48 | 48 | 0 | 5035 / 4531 | $0.0256 |
| sec04-indicators-placards-renewal | 51 | 49 | 2 | 6677 / 4918 | $0.0292 |
| sec05-points-suspensions-insurance | 62 | 62 | 0 | 8278 / 5200 | $0.0324 |
| sec06-traffic-signs-signals | 57 | 57 | 0 | 7385 / 5061 | $0.0307 |
| sec07-safe-operation-part-1 | 68 | 68 | 0 | 10425 / 6026 | $0.0386 |
| sec08-safe-operation-part-2 | 67 | 66 | 1 | 11034 / 7733 | $0.0467 |
| sec09-accidents-emergencies | 55 | 55 | 0 | 6605 / 6768 | $0.0370 |
| sec10-documents-teens-services | 51 | 50 | 1 | 6995 / 5934 | $0.0340 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R07 | PARTIALLY_SUPPORTED | The cited page does not state the learner's permit validity period. | An identification card and an MDC endorsement are valid for six years. |
| sec02-R03 | PARTIALLY_SUPPORTED | The cited page also requires no driving Monday through Friday before 5 a.m., which the statement omits. | Add that after 180 days a driver under 18 also may not drive Monday through Friday before 5 a.m., per the cited page. |
| sec02-R06 | NOT_FOUND_ON_PAGE | The cited page 16 does not state CDL validity or temporary-resident validity. | Cite page 14, which states a CDL is valid for four years and temporary-resident periods may differ. |
| sec02-R07 | PARTIALLY_SUPPORTED | The cited page states the probationary 911-only rule but does not state the hands-free/voice-operated exception for the all-driver texting rule. | Cite page 16 as well for the rule allowing hands-free or voice-operated use or 911 calls for texting/email. |
| sec04-R01 | PARTIALLY_SUPPORTED | The statement omits the required administrative penalty for both renewal tiers. | A license expired at least 180 days but not more than five years needs the administrative penalty plus knowledge exam and vision screening, while one expired five years or more also needs a driving skills exam. |
| sec04-R09 | PARTIALLY_SUPPORTED | The statement omits the page's requirement to carry a valid Indiana identification card while operating. | A person 15 or older without a license may operate a watercraft over 10 horsepower only after an approved boater course and while carrying a valid Indiana ID card, while someone under 15 may not operate one at all. |
| sec08-F04 | PARTIALLY_SUPPORTED | The fact says always stop but omits the page's exception for abandoned or removed tracks. | Vehicles carrying passengers for hire, school buses and vehicles hauling explosives or flammable liquids must stop 15 to 50 feet from the nearest rail, except at abandoned tracks with signs or where tracks have been removed. |
| sec10-R07 | PARTIALLY_SUPPORTED | The page also requires additional federal-agency lawful-status documents pertaining to the Notice of Action, which the statement omits. | A Form I-797 counts only if the BMV verifies DHS received it and has not denied action and with federal-agency lawful-status documents pertaining to it. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-in-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
