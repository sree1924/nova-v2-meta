# MUSE INTAKE REPORT — NY (New York, Class D) — 2026-10-28

Run: `runs/2026-10-28-rdmv-ny-class-d` · Handbook: New York State Driver's Manual (MV-21 5/23 per provenance) · Issuer: NYS DMV
URL: https://dmv.ny.gov/brochure/mv21.pdf · retrieved 2026-10-28T00:43:00Z · Ledger actual: **$0.000** (121 reservations, 0 microusd)

## Section map (physical PDF pages, verified vs extracted text)

| id | title | pages |
|---|---|---|
| sec01-driver-licenses | Ch 1 Driver Licenses | 6–18 |
| sec02-keep-your-license | Ch 2 How to Keep Your License | 19–23 |
| sec03-owning-a-vehicle | Ch 3 Owning a Vehicle | 24–28 |
| sec04-traffic-control | Ch 4 Traffic Control | 29–33 |
| sec05-intersections-and-turns | Ch 5 Intersections and Turns | 34–38 |
| sec06-how-to-pass | Ch 6 How to Pass | 39–41 |
| sec07-parallel-parking | Ch 7 Parallel Parking | 42–44 |
| sec08-defensive-driving | Ch 8 Defensive Driving | 45–53 |
| sec09-alcohol-and-other-drugs | Ch 9 Alcohol and Other Drugs | 54–60 |
| sec10-special-driving-conditions | Ch 10 Special Driving Conditions | 60–66 |
| sec11-sharing-the-road | Ch 11 Sharing the Road | 67–76 |
| sec12-traffic-crash | Ch 12 If You Are in a Traffic Crash | 77 |
| sec13-adas | Ch 13 ADAS | 78–79 |

p60 is shared by sec09/sec10 (Ch9 review questions + Ch10 head on one page). Skipped: pp1–5 (cover/logo, blank, donor notice, TOC), pp80–84 (office directory, call centers).

## Exam facts

20 questions, ≥14 correct to pass (70% is 14/20 arithmetic, not printed); 2 of 4 road-sign questions required; no time limit stated (null).
Physical p10, printed p10 (`10 | Driver's Manual` footer): "To pass the written test, you must correctly answer at least 14 of the 20 questions asked, but you must correctly answer two of the four questions about road signs."

## Issuer page

https://dmv.ny.gov/document/mv-21 — handbook's own download page (fallback: no dmv.ny.gov HTML renders the absolute PDF href; relative target observed resolving to the exact staged URL, bytes match). Excerpt contains the exact URL; statements cite Ch4–11 as Class D/DJ/E test material.

## Intake result

Spec + seed pre-existed from an earlier launch worker; I verified every field against handbook text (chapter banners→pages, exam verbatim, anchors, visual copy) and confirmed the seed (run-config, ledger, registry, liveness, receipts, pinned loop) rather than re-running it. No intake failures in my session.

## Phase 2 (02 + 16 only): ALL 13 SECTIONS DONE, exit 0

Prior worker: sec01–sec07(A–F). I authored sec07-G + all of sec08–sec13 (55 packets). Tasks: 117×02 accepted, 13×16.compile PASS.
HOLDs — mine: sec07-G n0 `02.LINEAGE=FAIL` (cap spent; re-copied lineage :34 on n1 → accepted). Inherited: sec01-C n0 `02.SCHEMA=FAIL`, n1 `02.LINEAGE=FAIL` → n2 accepted; sec01-C2 n0 `02.SCHEMA=FAIL` → n1 accepted.

## Could not verify

MV-21 (5/23) form id (absent from extracted text; RETRIEVAL provenance only); printed page numbers (extractor UNOBSERVED; "10" read from footer text); issuer-page live resolution (inherited, not re-fetched); Ch11 moped inspection/title chart cells (extraction-scrambled; stated as charted-per-class, mapping not asserted). One leftover `queued` 02 task is an intake dry-run row, benign.
