# VA intake report — Muse Code, 2026-10-28 (Phase 1 + Phase 2 complete)

FINDING FIRST: all 15 sections DONE through 16.compile, exit 0, ledger $0.000.

## Intake result: REGISTERED (JAM-001 resolved outside this lane)
- Spec coordination/intake/VA.spec.json (pre-existing) verified against re-extracted text; run 2026-10-28-rdmv-va-class-std seeded + registered.
- JAM-001's Utah-only role-15 gate was lifted by the runner lane (multi-state profile now in tools/roles/15-register.mjs); exam_facts migrated to verified shape 04:06Z.
- Ledger actual $0.000 (belt SUMMARY spent $0.000 / cap $60; 0 model calls).

## Section map (15 sections, physical PDF pages; skipped p1 cover, p2 intro, p3-4 TOC, p37-38 samples, p39-40 back/blank)
| id | title | pages |
|---|---|---|
| sec01-testing-knowledge-road-vision | Testing: knowledge/road/vision | 5-6 |
| sec02-traffic-signals-lane-use | Signals, lane use, sign colors/shapes | 7-8 |
| sec03-regulatory-warning-signs | Regulatory + warning signs | 9-10 |
| sec04-railroad-work-zone-signs | Railroad crossings, work zones | 11-12 |
| sec05-pavement-markings-curbs-toll | Markings, lanes, toll, curbs | 13-15 |
| sec06-speed-stopping-school-bus | Speed, stopping, school buses | 16-17 |
| sec07-right-of-way-roundabouts | Yielding, roundabouts, lanes, passing | 18-19 |
| sec08-turning-signals-space-cushion | Turning, signals, space cushion | 20-21 |
| sec09-sharing-road-blind-spots | Blind spots, sharing the road | 22-23 |
| sec10-backing-parking-visibility-hazardous | Backing, parking, lights, hazards | 24-25 |
| sec11-dangerous-behaviors-crashes-deer | Impaired/distracted, crashes, deer | 26-27 |
| sec12-traffic-stops-seat-belts-airbags-child-seats | Stops, belts, air bags, child seats | 28-29 |
| sec13-penalties-suspension-alcohol | Suspension, revocation, alcohol law | 30-32 |
| sec14-license-types-learner-permit | Learner's permit, license types | 33-34 |
| sec15-registration-insurance-other-info | Registration, insurance, other info | 35-36 |

## Exam facts (physical p5, printed p3)
- Part 1: "You must correctly answer all ten traffic sign questions in part one of the exam before you can take part two of the exam."
- Part 2: "You must answer at least 80 percent of these questions correctly to pass part two." (value 80)
- Part-2 question count and time limit: NOT stated in handbook → null.

## Issuer page (brief-step-4 fallback, disclosed in spec)
- No official HTML page contains the absolute handbook URL (issuer emits site-relative hrefs; checked by prior operator).
- Used the handbook's own download URL; HEAD 200 application/pdf, 2334945 bytes = staged bytes; manual page links it as "Complete Manual" (DMV 39).

## Phase 2 (02,16): 15/15 sections DONE — 16.compile PASS each, final step exit 0
- This session authored 61 packets: sec09 A(n1),B,D,E,E2,F,G + sec10–sec15 all nine parts each (C: 11–20 FACT blocks each, all cited).
- Prior session's sec01–sec08 + sec09 C,C2 accepted as found; 135/135 parts accepted, 16/ dirs complete for all 15.

## Holds (1 total this session)
- 02.LINEAGE=FAIL on stale sec09-A n0 (packet manifest pre-dated the 04:06Z run-config migration); accepted on fresh n1. No other HOLDs.

## Could not verify
- Handbook edition date (none stated); part-2 count/limit (not stated); issuer liveness beyond prior HEAD+fetch.
- sec01–sec08 dossier content (prior session's, accepted, not re-audited); stages 03/04/05/06 and 07/08 out of scope this launch.
- No audio minted, no commits, no Model API calls, no edits outside the run dir + intake spec + this report.
