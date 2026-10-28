# MUSE INTAKE REPORT — CT (Connecticut, Class D)

run_id: 2026-10-28-rdmv-ct-class-d. No Model API calls, no audio, ledger $0.000 throughout.

## Phase 1 — intake spec (pre-seeded; verified, not re-seeded)
- `coordination/intake/CT.spec.json` + run dir existed from a prior session; verified and resumed.
- Handbook: Connecticut Driver's Manual, Revised March 2023, CT DMV; 60 physical pages.
- Provenance: QUEUE.json row (no CT.url.txt): handbook_url portal.ct.gov/dmv/-/media/dmv/dmv-pdfs/drivers-manual-english.pdf?rev=ef19ff753d5642378c6371a379d5b95b, retrieved 2026-10-28T06:49:17Z, sha256 7f79ea70….
- Issuer page: https://portal.ct.gov/dmv/licenses-permits-ids/ct-drivers-manuals (portal.ct.gov) — page HTML contains the exact handbook URL with ?rev= token; describes it as Revised 3/2023.
- Visual lines confirmed on physical p3: issuer "Compiled by the Connecticut Department of Motor Vehicles, with the assistance", edition "Revised March 2023". No title line on p3, so no title observation (deviation from brief noted, intake accepted).
- Skips verified: p12 blank; p31–34 teen-parent agreement forms; p55 directory, p56 study answers, p57+ back matter.

## Exam facts
- 25 questions, 20 correct to pass (80 = 20/25 arithmetic, not printed). No time limit stated.
- Verbatim (physical p7, printed p5): "The knowledge test consists of 25 questions and you need 20 correct answers to pass."

## Section map (physical pages)
| id | title | pages |
|---|---|---|
| sec01-learner-permit-knowledge-test | learner's permit, Class D, knowledge/vision tests | 6–8 |
| sec02-licensing-road-test-restrictions | adult applicants, road test, fees, teen restrictions | 9–11 |
| sec03-before-you-drive | equipment, seatbelt, cell/insurance laws | 13–15 |
| sec04-driving-basics-sharing-road | basics, work zones, sharing road | 16–21 |
| sec05-space-cushion-maneuvers | space cushion, lanes, passing, turning | 22–26 |
| sec06-hazardous-aggressive-driving | hazardous conditions, aggressive driving | 27–28 |
| sec07-distractions-fatigue | distractions, drowsy driving | 29–30 |
| sec08-alcohol-drugs-law | impairment, DUI law, police stops | 35–37 |
| sec09-rules-of-road | speed, right-of-way, parking, lights | 38–40 |
| sec10-emergencies-collisions | signaling, failures, skids, crash duties | 41–44 |
| sec11-pavement-markings-signals | markings, lights, arrows, HAWK | 45–47 |
| sec12-traffic-signs | shapes, colors, regulatory/warning/guide/railroad | 48–54 |

## Phase 2 — stages 02+16 (this session)
- Final belt run exit 0: all 12 sections DONE, every 16.compile PASS.
- Authored 31 packets, each accepted on first attempt: sec09 E,E2,F,G; sec10–12 full C,C2,A,B,D,E,E2,F,G (sec01–08 were DONE on arrival).
- HOLDs: none. previous_non_pass was [] on every packet.
- Fact counts authored: sec10 C 30 / C2 10; sec11 C 19 / C2 10; sec12 C 29 / C2 11. Official study questions on pp 43–44, 54 excluded per no-reproduction gate.

## Could not verify
- Issuer-page excerpt re-fetch (accepted the recorded snapshot; network fetch of portal.ct.gov not repeated).
- Downstream stages 03/04/05/06 (out of scope this launch); 07/08 fact QA pending.
