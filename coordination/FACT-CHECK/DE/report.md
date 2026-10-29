# Fact check — DE (DE), Muse one call per section

Run 2026-10-28-rdmv-de-class-d. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 18 of 18 |
| Facts checked | 1398 |
| Supported | 1395 |
| Partially supported | 3 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.7117 (136,022 input + 127,443 output tokens) |
| Cost per fact | $0.00051 |
| Projection, all 51 (37,967 facts) | $19.33 |
| Projection, states Muse can audit independently (33,681 facts) | $17.15 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-definitions | 47 | 47 | 0 | 4736 / 3887 | $0.0224 |
| sec02-license-identity | 94 | 94 | 0 | 10181 / 5947 | $0.0380 |
| sec03-graduated-licensing | 54 | 54 | 0 | 5618 / 5100 | $0.0287 |
| sec04-class-d-examination | 69 | 68 | 1 | 7599 / 7075 | $0.0396 |
| sec05-driving-privileges | 75 | 75 | 0 | 6736 / 6774 | $0.0372 |
| sec06-impaired-distracted-driving | 124 | 123 | 1 | 11854 / 7893 | $0.0484 |
| sec07-equipment-registration | 171 | 171 | 0 | 13056 / 15602 | $0.0826 |
| sec08-signals-signs | 108 | 108 | 0 | 9522 / 8666 | $0.0487 |
| sec09-traffic-laws | 123 | 123 | 0 | 10885 / 12259 | $0.0657 |
| sec10-parking-speed | 63 | 63 | 0 | 5222 / 5734 | $0.0309 |
| sec11-sharing-road | 90 | 90 | 0 | 9306 / 8876 | $0.0494 |
| sec12-before-driving | 86 | 86 | 0 | 9516 / 9029 | $0.0503 |
| sec13-basic-driving | 59 | 59 | 0 | 6314 / 6161 | $0.0341 |
| sec14-communication-speed | 56 | 55 | 1 | 5911 / 6129 | $0.0334 |
| sec15-night-visibility | 37 | 37 | 0 | 3879 / 3845 | $0.0212 |
| sec16-sharing-space | 56 | 56 | 0 | 5795 / 5835 | $0.0320 |
| sec17-driver-fitness | 31 | 31 | 0 | 3689 / 2904 | $0.0170 |
| sec18-emergencies-collisions | 55 | 55 | 0 | 6203 / 5727 | $0.0321 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec04-R08 | PARTIALLY_SUPPORTED | Page 43 alone states the inspection occurs but does not name the examiner as the actor on that page. | A basic vehicle safety inspection is conducted before the road exam begins. |
| sec06-F23 | PARTIALLY_SUPPORTED | The page states increasing time between drinks slows effects but does not state it is not permission to drive. | Increasing the interval between drinks is described as a way to slow alcohol's effects. |
| sec14-F09 | PARTIALLY_SUPPORTED | Page limits first sharp-blast case to a child or older person, not someone generally. | Use a sharp horn warning when a child or older person is about to walk, run, or ride into the street, another vehicle may hit you, or your out-of-control vehicle moves toward someone. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-de-class-d/sources/private/audits/muse-fact-check/ (private, gitignored).
