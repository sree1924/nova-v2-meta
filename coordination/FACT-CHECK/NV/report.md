# Fact check — Nevada (NV), Muse one call per section

Run 2026-10-28-rdmv-nv-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 12 of 12 |
| Facts checked | 654 |
| Supported | 649 |
| Partially supported | 5 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4217 (84,477 input + 74,381 output tokens) |
| Cost per fact | $0.00064 |
| Projection, all 51 (37,967 facts) | $24.48 |
| Projection, states Muse can audit independently (33,681 facts) | $21.72 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-getting-your-license-part-1 | 59 | 57 | 2 | 7738 / 7328 | $0.0408 |
| sec02-getting-your-license-part-2 | 65 | 64 | 1 | 10228 / 7810 | $0.0460 |
| sec03-buckle-up | 29 | 28 | 1 | 2956 / 3327 | $0.0178 |
| sec04-signs-signals-markings | 63 | 62 | 1 | 7963 / 7963 | $0.0438 |
| sec05-right-of-way-speed-freeways | 66 | 66 | 0 | 8339 / 8180 | $0.0452 |
| sec06-defensive-driving-turning-parking | 71 | 71 | 0 | 10244 / 6249 | $0.0394 |
| sec07-driver-assistance-systems | 38 | 38 | 0 | 5026 / 3358 | $0.0206 |
| sec08-special-driving-conditions | 58 | 58 | 0 | 7004 / 5519 | $0.0322 |
| sec09-sharing-the-road | 55 | 55 | 0 | 6761 / 7282 | $0.0394 |
| sec10-towing | 58 | 58 | 0 | 7949 / 7921 | $0.0436 |
| sec11-insurance-driving-record | 44 | 44 | 0 | 4564 / 4017 | $0.0228 |
| sec12-dui-suspensions | 48 | 48 | 0 | 5705 / 5427 | $0.0302 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec01-F05 | PARTIALLY_SUPPORTED | The fact omits the limited-term immigration-document exception stated on the same page. | A first-time license issued to someone under 65 lasts eight years and expires on the holder's birthday unless limited-term immigration documents are presented. |
| sec01-R01 | PARTIALLY_SUPPORTED | The summary omits the limited-term immigration-document exception and first-time qualifier details on the page. | A first-time license for someone under 65 runs eight years unless limited-term immigration documents are used; a license at 65 or older runs four years and an ID runs eight years. |
| sec02-R07 | PARTIALLY_SUPPORTED | Page 15 states the permit-hold and passenger rules but does not state the crash- and conviction-free rule. | Cite pages 14-15 for all three rules: the six-month crash-free requirement is only on page 14. |
| sec03-R02 | PARTIALLY_SUPPORTED | Omits the page's limiting condition that the rule applies only if conditions present a significant risk to health and safety. | Never leave a child aged 7 or younger unattended if conditions present a significant risk to health and safety unless supervised within sight by someone at least 12. |
| sec04-R14 | PARTIALLY_SUPPORTED | The page does not state white lines always separate same-direction traffic, as white is also used for edges, crosswalks and stop lines. | White lane lines separate same-direction traffic while yellow lines separate opposite-direction traffic; solid white also marks edges, crosswalks and stop lines. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nv-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
