# MUSE INTAKE CA REPORT (final, session 3) — 2026-10-28-rdmv-ca-class-c

## Section map (all pages = physical PDF pages; verified vs chapter headings)
| id | title | pages |
|---|---|---|
| sec01-california-drivers-license | California Driver's License | 7 |
| sec02-instruction-permit-and-drivers-license | Instruction Permit and Driver's License | 8-10 |
| sec03-testing-process | Testing Process | 11-13 |
| sec04-changing-replacing-renewing-license | Changing, Replacing, Renewing License | 14 |
| sec05-introduction-to-driving | Introduction to Driving | 15-18 |
| sec06-navigating-the-roads | Navigating the Roads | 19-38 |
| sec07-laws-and-rules-of-the-road | Laws and Rules of the Road | 39-62 |
| sec08-safe-driving | Safe Driving | 63-77 |
| sec09-alcohol-and-drugs | Alcohol and Drugs | 78-81 |
| sec10-financial-responsibility-insurance-collisions | Financial Responsibility, Insurance, Collisions | 82-84 |
| sec11-vehicle-registration-requirements | Vehicle Registration Requirements | 85 |
| sec12-driver-safety | Driver Safety | 86-87 |
| sec13-seniors-and-driving | Seniors and Driving | 88-89 |

## Exam facts (handbook states no counts/scores; all null by evidence)
- p11 (printed 5): "When you apply for an original driver's license, you must pass a knowledge test with multiple choice questions. You are allowed three attempts to pass before you must reapply." (verified in CA-pages.txt; line-wrapped)
- questions_to_pass / n_questions / time_limit: null — handbook silent, nothing imported.
- Issuer page: https://www.dmv.ca.gov/portal/driver-handbooks/ links `[English (PDF)](/portal/file/california-driver-handbook-pdf)` = exact staged URL (re-fetched 2026-10-28, confirmed).

## Intake result
- Spec `coordination/intake/CA.spec.json` pre-staged (sessions 1-2); I verified all 13 chapter boundaries, exam verbatim, issuer link, visual.json copy — adopted unchanged. Run registered; JAM-001 resolved by runner (role code), JAM-002 superseded.

## Stages 02+16: ALL 13 sections DONE through 16.compile (117/117 parts accepted)
- Sessions 1-2: sec01-sec05 + sec06 part C. This session: sec06 C2→G, sec07-sec13 all 9 parts each; 16/ outputs present for all 13. Ledger: **$0.000** spent / $60 cap. No api.meta.ai calls, no audio, no commits.

## Holds (2, both lineage staleness, both resolved same-session)
- sec06 C2 n0: `02.LINEAGE=FAIL` — n0 manifest predated the 04:06Z exam_facts migration; re-emitted identical content as n1 (fresh manifest) → accepted.
- sec09 C2 n0: `stale_lineage` — belt reset lineage 38→40 mid-authoring; re-emitted identical content → accepted.

## Could not verify
- Compile artifact internals beyond belt DONE + 16/ dir presence (16.compile is automatic; not hand-checked per section).
- Prior-session C parts for sec01-sec05 were accepted by the belt, not re-read by me (only their ids/shapes sampled for C2/G alignment).
