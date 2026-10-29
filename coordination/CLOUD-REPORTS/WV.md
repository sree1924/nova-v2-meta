# WV cloud report: run 2026-10-28-rdmv-wv-class-e (phases 2 + 3)

Branch `cloud/wv-full`. Belt re-run with `--stages 03,04,06,05.sessions,05.card_scripts` exits 0, all 16 sections DONE. Ledger actual: **$0.000** (`actual_spend_usd: 0`, file transport, no provider called, no audio minted).

## Sections done per stage
- 02 dossier (A B C C2 D E E2 F G) + 16 compile: 16 / 16.
- 03 KG, 04 cards, 06 exam bank, 05 sessions, 05 card scripts: 16 / 16. One commit per section.

## Exam facts as registered
- question_count, passing_percent, time_limit, format: all `unknown`, value null. safe_run_config registers none as verified.
- The handbook does state them on PDF page 34: "The knowledge examination has at least 25 questions" and "You must answer 19 out of the 25 questions correctly to pass the test. There is a time limit on the test". Carried only as cited knowledge facts sec06-F09, F10, R02. Not promoted to exam facts, because that needs a verified registration and a liveness receipt.

## Counts (all 16 sections)
| facts | KG nodes | edges | modules | cards | recaps | items | forms | quizzes | units | slides | scripts |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 694 | 694 | 943 | 81 | 694 | 81 | 694 | 32 | 81 | 81 | 608 | 775 |

## Merges, holds, retries
- Merges: 0. No spoken_statement variants. Every downstream packet was accepted on first dispatch.
- Holds: dispatch HOLD `owner_receipt_missing_or_stale`, because the adapter receipt ref was missing. Fixed by repinning `execution.adapter_validation_receipts_ref` to `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json` (JAM in jams.md). The VT run carries the same stale ref.
- One check failure: `02.LINEAGE` FAIL on sec01 C n0, because the repin changed the manifest. The belt re-emitted n1, which was accepted with the same content.
- Environment JAMs: a standing-authority copy, local Windows-path symlinks (in .git/info/exclude, never committed), and parent pins verified PASS 48.

## Generated vs hand-written
- Hand-written: C and C2 for all 16 sections, from that section's decoded pages. Also all card fronts, hooks and module titles.
- Script-generated, scripts kept in /tmp/wv: 02 parts A B D E E2 F G, and every 03/04/06/05 artifact. They are assembled from accepted statements plus the hand-written labels. Exam distractors are other accepted statements.

## Suspect or unverifiable facts
- The handbook PDF text has a font-encoding shift (code points 31 low). It was decoded deterministically for reading only. The registered page map is untouched.
- Omitted because the text is garbled: the DUI-with-death fine range, the lower fine bound for DUI with serious bodily injury, and the Courtesy Patrol phone number.
- DMV addresses and phone numbers are not carried.
- sec09 pages cover speed and signaling, not right-of-way. Right-of-way is in sec11.
- PDF page 24 (motorcycle) and the BRC paragraph on page 25 are excluded.
