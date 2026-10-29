# Fact check — Maryland (MD), Muse one call per section

Run 2026-10-28-rdmv-md-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 12 of 12 |
| Facts checked | 574 |
| Supported | 569 |
| Partially supported | 5 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.3207 (60,716 input + 57,602 output tokens) |
| Cost per fact | $0.00056 |
| Projection, all 51 (37,967 facts) | $21.21 |
| Projection, states Muse can audit independently (33,681 facts) | $18.82 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-driving-tests-requirements | 32 | 31 | 1 | 2968 / 3088 | $0.0168 |
| sec02-licensing-requirements-process | 44 | 44 | 0 | 5677 / 4425 | $0.0259 |
| sec03-basic-driving | 43 | 42 | 1 | 5385 / 4910 | $0.0276 |
| sec04-traffic-signals | 32 | 31 | 1 | 3475 / 3664 | $0.0199 |
| sec05-traffic-signs | 57 | 57 | 0 | 4186 / 4220 | $0.0232 |
| sec06-pavement-markings | 40 | 40 | 0 | 3777 / 3475 | $0.0195 |
| sec07-driving-situations-conditions | 72 | 71 | 1 | 7831 / 7234 | $0.0405 |
| sec08-dangerous-driving-behaviors | 43 | 43 | 0 | 4479 / 4094 | $0.0230 |
| sec09-sharing-the-road | 64 | 64 | 0 | 7573 / 7322 | $0.0406 |
| sec10-crashes-traffic-stops | 44 | 44 | 0 | 4563 / 4646 | $0.0254 |
| sec11-restrictions-violations-penalties | 47 | 46 | 1 | 4880 / 5667 | $0.0302 |
| sec12-other-important-information | 56 | 56 | 0 | 5922 / 4857 | $0.0280 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-R02 | PARTIALLY_SUPPORTED | The page lists binocular vision as a separate bullet but does not define it as both eyes working together. | Binocular vision is listed as a separate requirement, and the page says the MVA or your eye doctor can explain what it means. |
| sec03-R03 | PARTIALLY_SUPPORTED | Page states exceeding limit is illegal but does not state the even-if-traffic-is-faster exception on this page. | Driving below the posted limit for conditions is allowed, but driving any faster than the posted limit is illegal. |
| sec04-R01 | PARTIALLY_SUPPORTED | Page 17 states the steady-red rule but does not state the flashing-red proceed-when-clear rule. | Cite page 18 for the flashing-red part: after stopping, yield and proceed when the way is clear. |
| sec07-R02 | PARTIALLY_SUPPORTED | Page 30 states the hydroplaning no-brake rule but does not state the skid brake-after-traction rule on that page. | On page 30: in a hydroplane do not apply brakes; the skid brake-after-traction rule is not on this page. |
| sec11-F08 | PARTIALLY_SUPPORTED | The page lists job as only one of four nighttime exceptions, not the sole exception. | A Provisional License holder may drive unsupervised from 12:00 midnight to 5:00 a.m. only for job, organized volunteer program, official school activity, or athletic event/training trips. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-md-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
