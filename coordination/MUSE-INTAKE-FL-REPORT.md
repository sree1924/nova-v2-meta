# MUSE INTAKE REPORT — FL (Florida, Class E)

run_id `2026-10-28-rdmv-fl-class-e`. Handbook: Official Florida Driver License Handbook rev. 08/2023, 104 physical pages, issuer Florida Department of Highway Safety and Motor Vehicles. Ledger actual $0.000 throughout; no Model API calls; no audio.

## Section map (physical PDF pages)
| id | title | pages |
|---|---|---|
| sec01-driver-licenses-id-cards | Driver Licenses & ID Cards | 11–23 |
| sec02-driving-schools-test-providers | Driving Schools & Test Providers | 25–29 |
| sec03-driving-privilege | Your Driving Privilege | 31–39 |
| sec04-you-the-driver | You the Driver | 41–44 |
| sec05-your-vehicle | Your Vehicle | 45–50 |
| sec06-traffic-controls | Traffic Controls | 51–65 |
| sec07-driving-safety | Driving Safety | 67–78 |
| sec08-special-driving-situations | Special Driving Situations | 79–81 |
| sec09-handling-emergencies | Handling Emergencies | 83–88 |
| sec10-sharing-the-road-bicycles-cmv | Bicyclists, CMVs | 89–90 |
| sec11-sharing-the-road-emergency-golf-carts | Emergency/Funeral, Golf Carts, LSVs | 92–93 |
| sec12-sharing-the-road-motorcycles-pedestrians-school-bus | Motorcycles, Pedestrians, School Bus | 95–97 |

## Exam facts (verified against extracted text this session)
- Question count 50, physical p28 / printed p20. Verbatim: "The Class E Knowledge Exam consists of 50 multiple-choice questions about: 1. Florida traffic laws, 2. Safe driving practices, and 3. Identifying traffic controls."
- Passing score/percent, time limit: NOT stated anywhere in the handbook (full-text grep confirms) → value null per lane rule, never imported.
- Issuer page (from prior-session spec, not re-fetched): https://www.flhsmv.gov/resources/handbooks-manuals-es/ — the Spanish handbooks index, the only official page using the exact www-form handbook URL.

## Intake result
Seeded 2026-10-28T00:58:50Z (prior session); receipt/visual/registry/liveness present. This session verified edition marker (rev. 08/2023 on pp 3,5,7…), exam verbatim on p28, and absence of any passing-score statement.

## Phase 2 (stages 02,16 only)
- sec01–sec10: DONE before this session (accepted artifacts + PASS compiles in run dir).
- This session authored sec11 (C,C2,A,B,D,E,E2,F,G) and sec12 (same nine), all accepted; 16.compile PASS for both. Final step: exit 0, all 12 sections DONE, spent $0.000 / cap $60.
- HOLDs this session: one — sec11 part C n0 `02.LINEAGE=FAIL` (packet emitted pre-exam_facts-migration carried a stale input_manifest_sha256; re-copied lineage block into n1, accepted). All other 17 packets accepted first try.

## Could not verify
- Printed page numbers for assigned pages beyond p28 (page_map marks several UNOBSERVED; physical pages used throughout).
- Passing score / time limit remain unknown — correctly null, not externally verifiable from the handbook.
- Issuer-page excerpt accepted from the prior-session spec; I did not re-curl the page this session.
