# Cost accounting — Utah Class D, full handbook (16 sections)

Final as of 2026-10-27 22:17Z (belt complete, 16/16 sections accepted). Source of every belt number below:
`runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite` (reservations × tasks, read-only), the same ledger the app's
`trace.html` renders.

Two cost lines, kept apart on purpose (founder decision 2026-10-27 ~18:40Z):

| line | what it pays for | where it is measured | status |
|---|---|---|---|
| **Product cost** | every belt model call to `muse-spark-1.3` (stages 02/03/04/06/05), reserved and settled per attempt, micro-USD | `ledger/run.sqlite` → `node tools/preview/ledger-tail.mjs` / `app-preview/trace.html` | **$44.088 exact**, 371 paid calls, receipts per attempt |
| **Operator cost** | Muse Code's own agent tokens as belt operator and app builder (reading briefs, running `run-utah.mjs`, wiring the preview, harness, reports) | Muse Code subscription ($15/mo, active from 2026-10-27 ~19:00Z; `muse usage` shows the "High Usage" tier being consumed) | flat; before the subscription it drew on the free credit (see meter) |

## Credit meter (ground truth = Meta billing page; lags up to 1 h)

| when (UTC) | free credit remaining | delta | ledger (belt) at that time | implied operator + probes |
|---|---|---|---|---|
| 2026-10-26 start | $142.00 | — | $0.00 | — |
| 2026-10-27 ~18:30 | $119.82 | $22.18 | $8.57 | ≈ $13.6 (16 `muse exec` launches ≈ $0.8 each; smoke + strict probe ≈ $0.10) |
| 2026-10-27 ~19:00 | subscription active | | | from here on, credit delta = belt only (plus the ASR plumbing proof, cents) |
| 2026-10-27 ~23:00 | $83.38 | $36.44 since 18:30 | $44.088 (+$35.52 since 18:30) | ≈ $0.9 since the subscription went in — credit delta ≈ belt only, as designed |

Standing authority: $30 cap amended to $60 (2026-10-27, `approvals/STANDING-AUTHORITY-utah-full-run.json`). Belt closed at
$44.088 — $15.91 under the cap.

## Belt (product) spend by stage — all 16 sections

"calls" counts every paid attempt, accepted or held. Held calls are the price of teaching the conventions
(`schemas-strict/output-conventions.json`) on the first state; see the per-section table for how fast that price fell.

| stage | accepted artifacts | paid calls | spend |
|---|---|---|---|
| 02 dossier (9 parts × 16 sections) | 144 / 144 | 204 | $20.09 |
| 16 compile (deterministic) | 26 (incl. versioned recompiles) | 0 model calls | $0.00 |
| 03 knowledge graph | 16 | 40 | $5.19 |
| 04 cards | 16 | 36 | $4.55 |
| 06 exam bank | 16 | 33 | $5.06 |
| 05 sessions | 16 | 33 | $4.67 |
| 05 card scripts | 16 | 25 | $4.53 |
| **total** | **224 + 26 compiles** | **371** | **$44.088** |

## Belt spend by section — the learning curve

| section | paid calls | spend | note |
|---|---|---|---|
| sec09 rules-of-the-road | 80 | $11.54 | first section; conventions and validators were tuned here |
| sec01 definitions | 28 | $3.03 | |
| sec06 examinations | 26 | $2.88 | |
| sec04 license-types-id-documents | 24 | $2.69 | |
| sec02 licensing-requirements | 24 | $2.62 | |
| sec15 vehicle-equipment | 22 | $2.32 | one E2 hold (citation rule), fixed between launches |
| sec14 sharing-the-road | 17 | $2.17 | largest section (5 modules, 45 cards) |
| sec07 preparing-vehicle | 18 | $2.15 | |
| sec11 distractions-challenges | 18 | $2.12 | |
| sec08 basic-driving | 17 | $2.01 | |
| sec10 alcohol-drugs | 18 | $1.99 | |
| sec03 driver-education-permits | 17 | $1.80 | |
| sec12 crashes-insurance | 16 | $1.75 | |
| sec16 towing | 15 | $1.72 | |
| sec13 suspensions-record | 16 | $1.69 | |
| sec05 vision-health | 15 | $1.59 | |

Excluding the learning section: 15 sections, $32.55, **$2.17 per section average**, 19 calls per section against a
floor of ~15 accepted calls (9 dossier parts + 5 learner stages + retries).

## What this predicts for the next state

| line | per state (≈16 handbook sections) | basis |
|---|---|---|
| Belt (product), conventions already stable | **≈ $35** | 16 × $2.17; no learning section |
| Belt, first-of-kind state with a different handbook shape | ≈ $45–50 | one learning section at ~$11 |
| Operator (Muse Code) | $0 marginal | subscription, flat |
| Narration audio (optional, not Meta) | ≈ $12–15 | OpenAI TTS via the Nova minter at ~$0.005/clip; Meta has no TTS |
| Spoken recall (Muse Voice Transcribe) | cents | $0.18 / audio-hour, learner-driven |

50 states at belt-only ≈ $1,750; with narration ≈ $2,500.

## Rules
- Never report the ledger total as "spend" without the credit-meter line beside it.
- Product cost excludes operator cost by design; the subscription receipt is the operator line's evidence.
- The spend cap (standing authority) is read as ALL-IN against the credit meter, not belt-only.
- No Nova V1 artifact (the 65 live stores, citizenship) was ever sent to the Meta API; this ledger is Utah only.
