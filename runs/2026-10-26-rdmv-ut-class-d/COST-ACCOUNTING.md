# Cost accounting — Utah Class D pilot (Section 9, Rules of the Road)

Two cost lines, kept apart on purpose (founder decision 2026-10-27 ~18:40Z):

| line | what it pays for | where it is measured | status |
|---|---|---|---|
| **Product cost** | every belt model call to `muse-spark-1.3` (stages 02/03/04/06/05), reserved and settled per attempt | `ledger/run.sqlite` → `node tools/preview/ledger-tail.mjs` / `app-preview/trace.html` | exact, per attempt, with receipts |
| **Operator cost** | Muse Code's own agent tokens as belt operator (reading briefs, running `run-utah.mjs`, wiring the preview, writing reports) | Meta billing page only (not in the ledger) | billed to the free credit until the Muse Code subscription ($20/mo) is active; flat thereafter |

## Credit meter (ground truth = billing page; lags up to 1 h)

| when (UTC) | free credit remaining | delta | ledger (belt) at that time | implied operator + probes |
|---|---|---|---|---|
| 2026-10-26 start | $142.00 | — | $0.00 | — |
| 2026-10-27 ~18:30 | $119.82 | $22.18 | $8.57 | ≈ $13.6 (16 `muse exec` launches ≈ $0.8 each; smoke + strict probe ≈ $0.10) |
| after subscription | _(fill from billing page)_ | | | from here on, credit delta = belt only |

## Belt (product) spend by stage — Section 9 only

Source: ledger, 2026-10-27 18:35Z. "attempts" counts every paid call, accepted or held; the held calls are the price of
tuning the conventions/validators on the first state. The second state (and every later section) should pay only the
accepted-call column.

| stage | accepted artifact | paid attempts | spend |
|---|---|---|---|
| 02 dossier (9 parts) | 9/9 | ~40 (incl. $1.00 booked for one timed-out call) | ≈ $5.7 |
| 16 compile | 2 (v1 + cleaned recompile) | 0 model calls | $0 |
| 03 knowledge graph | 1 (3 modules, 39 nodes) | 7 | ≈ $1.1 |
| 04 cards | 1 (39 cards, 3 decks) | 7 | ≈ $1.0 |
| 06 exam bank | 1 (39 items, 2 forms × 19, 3 quizzes) | 11 | ≈ $1.9 |
| 05 sessions | — (6 holds, lineage exhausted) | 6 | ≈ $0.9 |
| 05 card scripts | — (not reached) | 0 | $0 |
| **total** | | | **$9.70** |

Steady-state estimate once conventions are stable: one accepted call per stage ≈ $0.15 × 6 stages + 9 × $0.11 dossier parts
≈ **$1.9 per handbook section**; Utah's handbook has 16 sections in scope → ≈ $30 per state for the belt line, before audio.

## Rules
- Never report the ledger total as "spend" without the credit-meter line beside it.
- Product cost excludes operator cost by design; the subscription receipt is the operator line's evidence.
- Spend cap for this run ($30, standing authority) is read as ALL-IN against the credit meter, not belt-only.
