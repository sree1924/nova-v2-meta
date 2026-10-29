# Fact check — Illinois (IL), Muse one call per section

Run 2026-10-28-rdmv-il-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 18 of 18 |
| Facts checked | 841 |
| Supported | 840 |
| Partially supported | 1 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4910 (89,832 input + 89,108 output tokens) |
| Cost per fact | $0.00058 |
| Projection, all 51 (37,967 facts) | $22.17 |
| Projection, states Muse can audit independently (33,681 facts) | $19.66 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-documents | 59 | 59 | 0 | 6759 / 6674 | $0.0368 |
| sec02-licensing-programs-fees | 34 | 34 | 0 | 3455 / 3078 | $0.0174 |
| sec03-driver-examinations | 36 | 36 | 0 | 3434 / 3523 | $0.0193 |
| sec04-young-drivers | 48 | 48 | 0 | 5795 / 4873 | $0.0280 |
| sec05-traffic-laws-stops-restraints-speed | 73 | 73 | 0 | 7595 / 6850 | $0.0386 |
| sec06-traffic-laws-lanes-turns-crossings | 60 | 60 | 0 | 5947 / 6617 | $0.0356 |
| sec07-traffic-laws-parking-additional | 34 | 34 | 0 | 3526 / 3387 | $0.0188 |
| sec08-sharing-the-road | 74 | 73 | 1 | 8497 / 9066 | $0.0492 |
| sec09-impaired-driving | 53 | 53 | 0 | 5754 / 5457 | $0.0304 |
| sec10-traffic-violations-crashes | 28 | 28 | 0 | 3402 / 3010 | $0.0170 |
| sec11-license-actions | 50 | 50 | 0 | 5592 / 5929 | $0.0322 |
| sec12-road-signs-shapes-regulatory | 37 | 37 | 0 | 3806 / 4265 | $0.0229 |
| sec13-road-signs-warnings-work-zones | 40 | 40 | 0 | 4450 / 3950 | $0.0223 |
| sec14-signals-markings-railroads | 46 | 46 | 0 | 4589 / 5506 | $0.0291 |
| sec15-safe-driving-weather | 50 | 50 | 0 | 5018 / 4752 | $0.0265 |
| sec16-hazards-equipment-failure | 31 | 31 | 0 | 3391 / 2958 | $0.0168 |
| sec17-vehicle-equipment | 36 | 36 | 0 | 3274 / 4116 | $0.0216 |
| sec18-vehicle-ownership-insurance | 52 | 52 | 0 | 5548 / 5097 | $0.0286 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec08-R07 | PARTIALLY_SUPPORTED | Omits the 28 mph assistance threshold stated for Class 3. | State Class 3 provides assistance up to 28 mph, engages only when pedaling, and requires operator age at least 16. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-il-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
