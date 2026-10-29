# Fact check — West Virginia (WV), Muse one call per section

Run 2026-10-28-rdmv-wv-class-e. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 16 of 16 |
| Facts checked | 694 |
| Supported | 684 |
| Partially supported | 10 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.5337 (147,254 input + 82,263 output tokens) |
| Cost per fact | $0.00077 |
| Projection, all 51 (37,967 facts) | $29.2 |
| Projection, states Muse can audit independently (33,681 facts) | $25.9 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-definitions | 49 | 49 | 0 | 8966 / 5564 | $0.0349 |
| sec02-license-eligibility-and-identity | 64 | 64 | 0 | 18800 / 7377 | $0.0549 |
| sec03-permits-and-graduated-licensing | 63 | 63 | 0 | 13331 / 7228 | $0.0474 |
| sec04-driver-responsibilities | 52 | 50 | 2 | 8318 / 6314 | $0.0372 |
| sec05-impaired-driving | 46 | 44 | 2 | 6423 / 4303 | $0.0263 |
| sec06-knowledge-examination | 27 | 27 | 0 | 4305 / 5330 | $0.0280 |
| sec07-traffic-signs | 46 | 46 | 0 | 10691 / 5051 | $0.0348 |
| sec08-signals-and-markings | 38 | 35 | 3 | 10553 / 5078 | $0.0348 |
| sec09-speed-and-right-of-way | 24 | 24 | 0 | 3199 / 2676 | $0.0154 |
| sec10-turning-and-parking | 38 | 38 | 0 | 8100 / 6460 | $0.0376 |
| sec11-lane-use-and-passing | 28 | 28 | 0 | 5923 / 3271 | $0.0213 |
| sec12-sharing-the-road | 44 | 44 | 0 | 9768 / 4452 | $0.0311 |
| sec13-highway-driving | 42 | 40 | 2 | 6245 / 4553 | $0.0272 |
| sec14-defensive-driving-and-weather | 46 | 46 | 0 | 7682 / 5783 | $0.0342 |
| sec15-safe-driving-practices | 39 | 38 | 1 | 13427 / 4186 | $0.0346 |
| sec16-emergencies-and-roadside-assistance | 48 | 48 | 0 | 11523 / 4637 | $0.0341 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec04-F08 | PARTIALLY_SUPPORTED | The page excerpt does not show the $25,000/$50,000/$25,000 amounts in readable text. | West Virginia law mandates motorists carry West Virginia liability insurance with minimum coverage as provided by law. |
| sec04-R05 | PARTIALLY_SUPPORTED | The page excerpt does not show the paired $25,000/$50,000 and $25,000 property amounts in readable text. | West Virginia law requires liability insurance with minimum coverage as provided by law. |
| sec05-F23 | PARTIALLY_SUPPORTED | The page states a fine range of $1000 to $3000, not only an upper limit. | DUI with serious bodily injury carries a fine of $1000 to $3000, jail of two to ten years, and a minimum revocation of sixty days. |
| sec05-R04 | PARTIALLY_SUPPORTED | The page shows fines of $1000-$3000 for second and $3000-$5000 for third, which is not a doubling of the range. | Second and third DUI offenses both carry a one-year minimum revocation, with jail of six to twelve months for second and one to three years for third, and fines of $1000-$3000 and $3000-$5000. |
| sec08-F24 | PARTIALLY_SUPPORTED | Page states broken lines to the left but does not state they are yellow. | Center left-turn lanes are recognized by the solid yellow lines nearest the through lanes and broken lines to the left of them. |
| sec08-R07 | PARTIALLY_SUPPORTED | Page states the center lane has broken lines to the left but does not state they are yellow. | A reversible lane bordered by double broken yellow lines is the only place to drive left of a yellow line, while a center left-turn lane with solid yellow outside and broken lines inside is for left turns only. |
| sec08-R10 | PARTIALLY_SUPPORTED | Page lists the sign shapes and track-number sign but does not state the round/diamond sign is advance warning and the crossbuck marks the crossing itself. | Railroad crossing signs may be round or diamond-shaped yellow with black symbols, or black letters on white bars in the shape of an X called a crossbuck, with a sign below indicating tracks when two or more. |
| sec13-F08 | PARTIALLY_SUPPORTED | The surcharge purpose clause is not on page 65; it continues on page 66. | Split the claim: cite page 65 for no fundamental alteration/undue burden, and cite page 66 for no surcharge to cover aids, services or modifications. |
| sec13-R10 | PARTIALLY_SUPPORTED | The no-surcharge purpose language is not completed on page 65; it continues on page 66. | Cite page 65 for the 48-hour contact rule and cite page 66 for the prohibition on charging for aids/services/modifications. |
| sec15-R04 | PARTIALLY_SUPPORTED | The page states the lap belt fit over the lower hips but does not state not the stomach. | Safety belts cut the chance of injury or death by 45 to 50 percent, and the lap belt should fit snugly over the lower part of the hips. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-wv-class-e/sources/private/audits/muse-fact-check/ (private, gitignored).
