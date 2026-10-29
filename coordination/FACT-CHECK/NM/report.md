# Fact check — NM (NM), Muse one call per section

Run 2026-10-28-rdmv-nm-class-std. Auditor muse-spark-1.3 via the Meta Model API — independent of the authors. compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass.

| Measure | Value |
|---|---|
| Sections checked | 15 of 15 |
| Facts checked | 654 |
| Supported | 648 |
| Partially supported | 5 |
| Not found on cited page | 1 |
| Contradicted | 0 |
| Exact cost | $0.3502 (61,394 input + 64,340 output tokens) |
| Cost per fact | $0.00054 |
| Projection, all 51 (37,967 facts) | $20.33 |
| Projection, states Muse can audit independently (33,681 facts) | $18.03 |

States Muse cannot audit independently (Claude or Sol must): UT TX CA FL VA NY CT KY IA OK.

## Per section

| Section | Facts | Supported | Flagged | Tokens in / out | Cost |
|---|---|---|---|---|---|
| sec01-license-and-restraints | 57 | 57 | 0 | 4586 / 5356 | $0.0285 |
| sec02-traffic-signals | 22 | 22 | 0 | 2537 / 2209 | $0.0126 |
| sec03-traffic-signs | 50 | 50 | 0 | 4912 / 5256 | $0.0285 |
| sec04-markings-and-lane-controls | 34 | 34 | 0 | 2852 / 2735 | $0.0152 |
| sec05-lane-use-and-turning | 19 | 19 | 0 | 2319 / 1949 | $0.0112 |
| sec06-right-of-way | 29 | 29 | 0 | 2845 / 2441 | $0.0139 |
| sec07-speed-and-parking | 53 | 52 | 1 | 4011 / 4394 | $0.0237 |
| sec08-basic-driving-and-scanning | 84 | 84 | 0 | 6295 / 7848 | $0.0412 |
| sec09-lights-and-communication | 42 | 39 | 3 | 4464 / 4634 | $0.0253 |
| sec10-road-and-traffic-conditions | 57 | 57 | 0 | 5972 / 5396 | $0.0304 |
| sec11-space-and-passing | 38 | 38 | 0 | 3909 / 3826 | $0.0211 |
| sec12-bicycles-trucks-and-rvs | 38 | 38 | 0 | 3733 / 3436 | $0.0193 |
| sec13-fitness-and-impairment | 57 | 57 | 0 | 5138 / 5197 | $0.0285 |
| sec14-emergency-control | 43 | 42 | 1 | 4082 / 6287 | $0.0318 |
| sec15-collisions-and-insurance | 31 | 30 | 1 | 3739 / 3376 | $0.0190 |

## Findings to resolve (any verdict other than SUPPORTED)

| Fact | Verdict | Issue | Suggested fix |
|---|---|---|---|
| sec07-R28 | PARTIALLY_SUPPORTED | Page 15 ends mid-sentence at 'You should travel on the right-' with the slower-traffic condition continuing on the next page. | Cite pages 15-16 together, or revise to match only what page 15 states, since the full condition completes on page 16. |
| sec09-F19 | PARTIALLY_SUPPORTED | The cited page lists the example but does not state the in-danger sharp-blast condition, which is on the prior page. | On this page alone, the example is listed as a bullet continuing the prior page's sharp-blast guidance; cite page 21 for the danger condition. |
| sec09-F20 | PARTIALLY_SUPPORTED | The cited page lists the example but does not state the in-danger sharp-blast condition, which is on the prior page. | On this page alone, the example is listed as a bullet continuing the prior page's sharp-blast guidance; cite page 21 for the danger condition. |
| sec09-F21 | PARTIALLY_SUPPORTED | The cited page lists the example but does not state the in-danger sharp-blast condition, which is on the prior page. | On this page alone, the example is listed as a bullet continuing the prior page's sharp-blast guidance; cite page 21 for the danger condition. |
| sec14-F16 | NOT_FOUND_ON_PAGE | Page 34 states only up to shifting to neutral and does not state pulling off the road or turning off the engine. | Change citation to the page containing 'Pull off the road when safe to do so. Turn off the engine.' |
| sec15-R09 | PARTIALLY_SUPPORTED | Page 37 ends mid-sentence at 'carried in' and does not state 'in the vehicle at all times' on that page. | The Act requires that proof of insurance be carried (remainder of sentence continues on next page). |

Full findings with verbatim handbook quotes: runs/2026-10-28-rdmv-nm-class-std/sources/private/audits/muse-fact-check/ (private, gitignored).
