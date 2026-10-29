# Fact check — Rhode Island (RI), Muse one call per section

Run 2026-10-28-rdmv-ri-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 18 of 18 |
| Facts checked | 881 |
| Supported | 874 |
| Partially supported | 7 |
| Not found on cited page | 0 |
| Contradicted | 0 |
| Exact cost | $0.4824 (92,439 input + 86,322 output tokens) |
| Cost per fact | $0.00055 |
| Projection, all 51 (37,967 facts) | $20.79 |
| Projection, states Muse can audit independently (33,681 facts) | $18.44 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-messages-and-litter | 42 | 42 | 0 | 5226 / 4203 | $0.0244 |
| sec02-licensing | 71 | 71 | 0 | 9525 / 5980 | $0.0373 |
| sec03-distractions-drowsiness-emotions | 96 | 94 | 2 | 11289 / 8699 | $0.0511 |
| sec04-basic-driving | 95 | 95 | 0 | 9803 / 9156 | $0.0512 |
| sec05-highway-and-communications | 59 | 57 | 2 | 5860 / 6831 | $0.0364 |
| sec06-signals-and-markings | 50 | 50 | 0 | 5420 / 5135 | $0.0286 |
| sec07-emergencies | 70 | 69 | 1 | 6777 / 6950 | $0.0380 |
| sec08-sharing-with-motorcycles | 28 | 27 | 1 | 2671 / 3151 | $0.0167 |
| sec09-defensive-driving | 29 | 29 | 0 | 3059 / 2957 | $0.0164 |
| sec10-sharing-the-road | 69 | 69 | 0 | 7729 / 7154 | $0.0401 |
| sec11-traffic-laws | 28 | 28 | 0 | 2926 / 2985 | $0.0163 |
| sec12-alcohol-and-drugs | 67 | 66 | 1 | 7745 / 6236 | $0.0362 |
| sec13-collisions | 28 | 28 | 0 | 2305 / 2479 | $0.0134 |
| sec14-law-enforcement-stops | 24 | 24 | 0 | 2189 / 2268 | $0.0124 |
| sec15-equipment | 30 | 30 | 0 | 2467 / 3507 | $0.0180 |
| sec16-organ-donation | 19 | 19 | 0 | 1563 / 1529 | $0.0085 |
| sec17-miscellaneous-laws-work-zones | 32 | 32 | 0 | 3378 / 4038 | $0.0214 |
| sec18-signs | 44 | 44 | 0 | 2507 / 3064 | $0.0162 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec03-F080 | PARTIALLY_SUPPORTED | Page states to expect mistakes but does not on this page state to respond with courtesy rather than taking errors personally. | Expect other drivers to make mistakes; courtesy can be spread among drivers as easily as frustration and anger. |
| sec03-F096 | PARTIALLY_SUPPORTED | Page 25 alone states only the second clause; the first clause about not controlling traffic or others' actions is on the prior page. | You control your reaction to traffic. |
| sec05-F014 | PARTIALLY_SUPPORTED | Page states entering a tunnel or bridge, not the broader approach to a bridge or tunnel. | Avoid passing on a hill, curve, railroad crossing, intersection, where signs prohibit, over solid lines, or entering a tunnel or bridge. |
| sec05-F036 | PARTIALLY_SUPPORTED | Fact omits the page's specific within-100-feet signaling requirement. | Always signal before changing lanes soon enough to let others know, within 100 feet. |
| sec07-F038 | PARTIALLY_SUPPORTED | Page conditions the choice on likelihood of reducing impact, not on surrounding traffic situation. | Brake or accelerate quickly, doing whichever seems more likely to reduce the impact. |
| sec08-F018 | PARTIALLY_SUPPORTED | The page states older models lack self-cancelling signals and to use caution, but does not state that a flashing signal alone does not confirm a turn. | Older model motorcycles do not have self-cancelling turn signals, so use caution when attempting to pass them. |
| sec12-F002 | PARTIALLY_SUPPORTED | The page states judgment and skill are affected first but does not state this occurs before the drinker recognizes impairment. | Alcohol first affects the control of judgment and skill. |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-ri-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
