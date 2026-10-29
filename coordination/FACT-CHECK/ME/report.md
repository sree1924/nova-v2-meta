# Fact check — ME (ME), Muse one call per section

Run 2026-10-28-rdmv-me-class-c. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 11 of 11 |
| Facts checked | 1055 |
| Supported | 1051 |
| Partially supported | 2 |
| Not found on cited page | 2 |
| Contradicted | 0 |
| Exact cost | $0.5564 (104,758 input + 100,114 output tokens) |
| Cost per fact | $0.00053 |
| Projection, all 51 (37,967 facts) | $20.02 |
| Projection, states Muse can audit independently (33,681 facts) | $17.76 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-your-drivers-license | 112 | 112 | 0 | 11457 / 9757 | $0.0558 |
| sec02-state-laws-and-rules | 90 | 90 | 0 | 7284 / 8401 | $0.0448 |
| sec03-ready-to-drive | 119 | 119 | 0 | 14368 / 11884 | $0.0685 |
| sec04-before-you-drive | 41 | 41 | 0 | 4618 / 3927 | $0.0225 |
| sec05-getting-started | 49 | 48 | 1 | 4398 / 5640 | $0.0295 |
| sec06-rules-of-the-road | 136 | 136 | 0 | 10454 / 10116 | $0.0561 |
| sec07-general-driving | 116 | 116 | 0 | 10842 / 12700 | $0.0675 |
| sec08-managing-time-and-space | 149 | 148 | 1 | 15842 / 12656 | $0.0736 |
| sec09-avoiding-crashes | 66 | 65 | 1 | 6961 / 6527 | $0.0364 |
| sec10-sharing-the-road | 106 | 106 | 0 | 10720 / 10682 | $0.0588 |
| sec11-special-driving-challenges | 71 | 70 | 1 | 7814 / 7824 | $0.0430 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec05-F19 | NOT_FOUND_ON_PAGE | Page 44 ends mid-sentence at '3-' and does not state the over-25-mph rule. | Cite PDF page 45 which states third gear in 3-speed transmissions is generally used for all speeds over 25 mph. |
| sec08-F16 | NOT_FOUND_ON_PAGE | The cited page does not describe a five-sided pedestrian symbol above a directional arrow. | Omit the illustration detail; state only that a 5-sided sign means you are in a school zone. |
| sec09-R06 | PARTIALLY_SUPPORTED | Page 97 does not state holding the wheel firmly; that instruction appears on page 98. | If wheels leave the pavement, remain calm and slow gradually; grip the wheel firmly per page 98. |
| sec11-R33 | PARTIALLY_SUPPORTED | The cited page 119 lists only three exceptions and omits the manufacturer-installed outside seat exception, which appears on page 120. | Limit the statement to the three exceptions on page 119, or cite page 120 for the belted manufacturer-installed outside seat exception. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-me-class-c/sources/private/audits/muse-fact-check/ (private, gitignored).
