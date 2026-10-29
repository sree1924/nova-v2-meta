# Fact check — North Dakota (ND), Muse one call per section

Run 2026-10-28-rdmv-nd-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 11 of 11 |
| Facts checked | 404 |
| Supported | 402 |
| Partially supported | 2 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.2467 (53,173 input + 42,402 output tokens) |
| Cost per fact | $0.00061 |
| Projection, all 51 (37,967 facts) | $23.18 |
| Projection, states Muse can audit independently (33,681 facts) | $20.57 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-and-testing | 42 | 42 | 0 | 5658 / 4553 | $0.0264 |
| sec02-documents-and-young-drivers | 38 | 38 | 0 | 5698 / 3673 | $0.0227 |
| sec03-regulatory-and-warning-signs | 32 | 31 | 1 | 3690 / 3423 | $0.0192 |
| sec04-signals-and-markings | 36 | 36 | 0 | 4610 / 3831 | $0.0220 |
| sec05-right-of-way-and-turns | 40 | 40 | 0 | 4849 / 4625 | $0.0257 |
| sec06-speed-passing-and-parking | 43 | 43 | 0 | 4798 / 3279 | $0.0199 |
| sec07-driving-skills | 48 | 48 | 0 | 5761 / 5300 | $0.0297 |
| sec08-emergency-situations | 34 | 34 | 0 | 5042 / 3769 | $0.0223 |
| sec09-impairment | 21 | 21 | 0 | 3157 / 2418 | $0.0142 |
| sec10-pedestrians-and-recreation | 37 | 36 | 1 | 4479 / 3633 | $0.0210 |
| sec11-parent-coaching | 33 | 33 | 0 | 5431 / 3898 | $0.0234 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec03-F001 | PARTIALLY_SUPPORTED | The cited page defines regulatory signs but does not state the functions of warning signs or guide signs. | Regulatory signs control and regulate traffic and give mandatory instructions to the driver. |
| sec10-F003 | PARTIALLY_SUPPORTED | The page does not include the added condition to report only when it is safe to do so. | Anyone can report impaired driving to law enforcement by dialing 911. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nd-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
