# MUSE Iowa intake report — IA (run 2026-10-28-rdmv-ia-class-c)

Resume: prior attempt r0 (session 01a1814b) seeded the run, wrote the spec, and
completed sec01–sec04 + sec05(A–E) before dying on subscription quota (429).
I verified Phase 1, ingested its orphaned sec05-E2 outbox, and authored the rest.

## Section map (physical PDF pages)

| id | title | pages |
|----|-------|-------|
| sec01-drivers-license | Driver's License (1.1-1.3) | 4-5 |
| sec02-sign-basics-colors-shapes | Sign Basics: Colors/Shapes (2.1) | 6-7 |
| sec03-regulatory-warning-signs | Regulatory/Warning Signs (2.2-2.3) | 8-9 |
| sec04-pedestrian-signals-railroad-work-zones | Ped/Signals/RR/Work Zones (2.4-2.11) | 10-14 |
| sec05-lane-use-markings | Markings/Lane Use (2.12-2.19) | 15-17 |
| sec06-intersections-emergency-school-bus | Intersections/EV/Bus (2.20-2.24) | 18-20 |
| sec07-parking-move-over-clear-it | Parking/Move Over/Clear It (2.25-2.28) | 21-22 |
| sec08-vehicle-readiness | Maintenance/Seats/Mirrors (3.1-3.2) | 23-25 |
| sec09-driver-assistance-systems | ADAS (3.3) | 26-33 |
| sec10-occupant-safety-distraction | Belts/Distraction (3.4-3.7) | 34-36 |
| sec11-impairment-trip-planning | OWI/Drowsy/511 (3.8-3.10) | 37-38 |
| sec12-vehicle-control-speed | Control/Speed (4.1-4.6) | 39-42 |
| sec13-turning-lanes-passing | Turning/Lanes/Passing (4.7-4.10) | 43-46 |
| sec14-defensive-driving-communication | Defensive/Traffic/Signals (4.11-4.13) | 47-49 |
| sec15-highways-interchanges-roundabouts | Highways/Roundabouts (5.1-5.5+) | 50-55 |
| sec16-rural-night-sharing-weather | Rural/Night/Weather (5.6-5.13) | 56-61 |
| sec17-emergencies-crashes-law-enforcement | Emergencies/Crashes/LE (5.14-5.16) | 62-64 |

## Exam facts (handbook states none — all null, genuine absence)

- passing score: null. Closest line, p5 (printed 5): "• Pass the knowledge test."
- question count: null. time limit: null. Full-text search over all 68
  extracted pages found no count, score/percent, or limit; p5/p65 only plug
  the online practice test. Nothing imported from memory.

## Issuer page

No separate official page links the exact handbook URL, so the spec uses the
handbook's own download URL page: https://iowadot.gov/media/7308/download?inline
(domains ["iowadot.gov"], observed 2026-10-28T07:00:00Z); excerpt contains the
exact URL string. Provenance: RETRIEVAL.json IA row (68 pp, retrieved
2026-10-28T06:53:22Z); visual_observation is local_pdf_text_observation.

## Intake result

Registered: run-config + 17-section run exists; intake-state exit 0 (r0).
I re-verified spec shape, page ranges, and exam-fact nulls; no re-seed needed.

## Authoring (stages 02 + 16 only)

All 17 sections DONE through 16.compile (final run exit 0). Parts per
section: C, C2, A, B, D, E, E2, F, G — every part accepted, zero open debts,
zero external reviews, all exam facts terminal-unknown in every envelope.

## Holds (1)

- sec11-B n0: 02.FACT_LINES_CITED=FAIL (digit "511" in uncited part-B prose).
  Fixed on n1 with digit-free wording; accepted. No other HOLDs.

## Could not verify

- Official knowledge-test count/score/limit: absent from the handbook by
  full-text search; remains terminal unknown, not a debt.
- Ledger file is SQLite (run.sqlite); spend verified via belt output only.

## Ledger

Actual $0.000 throughout (every part "accepted $0.000"; final SUMMARY
spent $0.000 / cap $60). No audio minted. No commits. No model-API calls.
