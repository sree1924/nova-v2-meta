# Fact check — Alaska (AK), Muse one call per section

Run 2026-10-28-rdmv-ak-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 18 of 18 |
| Facts checked | 787 |
| Supported | 784 |
| Partially supported | 3 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4122 (78,709 input + 73,828 output tokens) |
| Cost per fact | $0.00052 |
| Projection, all 51 (37,967 facts) | $19.88 |
| Projection, states Muse can audit independently (33,681 facts) | $17.64 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-licensing-and-examination | 79 | 79 | 0 | 9100 / 7252 | $0.0422 |
| sec02-financial-responsibility-and-crashes | 34 | 34 | 0 | 3277 / 2753 | $0.0158 |
| sec03-points-and-license-actions | 52 | 52 | 0 | 3591 / 3278 | $0.0184 |
| sec04-alcohol-and-drugs | 67 | 67 | 0 | 6849 / 5460 | $0.0318 |
| sec05-restraints-and-distractions | 42 | 42 | 0 | 4798 / 4120 | $0.0235 |
| sec06-vehicle-control-speed-and-signals | 51 | 51 | 0 | 4997 / 5045 | $0.0277 |
| sec07-turns-intersections-and-passing | 59 | 59 | 0 | 5307 / 5900 | $0.0317 |
| sec08-traffic-signs-and-work-zones | 44 | 44 | 0 | 3715 / 3832 | $0.0209 |
| sec09-sharing-the-road | 49 | 49 | 0 | 5341 / 4825 | $0.0272 |
| sec10-traffic-signals | 32 | 32 | 0 | 3516 / 2988 | $0.0171 |
| sec11-pavement-markings-and-railroads | 43 | 43 | 0 | 4602 / 4754 | $0.0260 |
| sec12-night-driving-and-highways | 46 | 46 | 0 | 4107 / 4474 | $0.0241 |
| sec13-weather-animals-and-skids | 33 | 32 | 1 | 3100 / 3702 | $0.0196 |
| sec14-parking-emergency-vehicles-and-emergencies | 49 | 49 | 0 | 4836 / 4098 | $0.0235 |
| sec15-equipment-and-large-vehicles | 39 | 39 | 0 | 3819 / 3723 | $0.0206 |
| sec16-flooding-and-efficient-driving | 39 | 37 | 2 | 4270 / 4600 | $0.0249 |
| sec17-maintenance-and-secured-loads | 16 | 16 | 0 | 2083 / 1944 | $0.0109 |
| sec18-driving-responsibilities | 13 | 13 | 0 | 1401 / 1080 | $0.0063 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec13-F033 | PARTIALLY_SUPPORTED | The page states the easy-acceleration note but does not state it is subject to the vehicle's instructions. | Front-wheel drive or four-wheel drive vehicles require easy acceleration to pull out of a skid. |
| sec16-F006 | PARTIALLY_SUPPORTED | Page says most vehicles, not many vehicles. | Two feet of moving water can carry away most vehicles, including pickup trucks and sport utility vehicles. |
| sec16-F015 | PARTIALLY_SUPPORTED | Page mentions safety and wear but does not mention reducing unnecessary braking. | Leave enough following distance to protect safety and prevent wear and tear on the vehicle. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ak-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
