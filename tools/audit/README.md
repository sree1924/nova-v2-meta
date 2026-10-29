# tools/audit — Muse fact check (one call per section)

Independent fact audit of the compiled facts against the handbook pages they cite, using muse-spark-1.3 on the Meta Model API. It runs outside the belt: there is no ledger task, and every call is logged in `coordination/MUSE-API-SPEND.jsonl`. This is the pilot for stage 08.

| File | What it does |
|---|---|
| `muse-fact-check.mjs` | ONE call for ONE section. Sends the section's facts (id, statement, cited PDF page) and the text of only the cited pages, and gets strict JSON back: one finding per fact, verdict SUPPORTED / PARTIALLY_SUPPORTED / NOT_FOUND_ON_PAGE / CONTRADICTED, with a verbatim evidence quote of 25 words or fewer, the issue, and a page-grounded fix. `--dry` prints the worst case and sends nothing. `--control` plants 3 wrong numbers and reports whether they were caught. `--reasoning low` is the default. |
| `fact-check-state.mjs` | Every section of one state, under a total `--max-usd` cap (default $2). Resumable; `--fresh` re-sends everything. Refuses states whose dossiers Muse wrote, because that audit would not be independent, unless `--allow-same-family` is passed. Writes `coordination/FACT-CHECK/<ST>/report.json` and `report.md`. |

```bash
node tools/audit/fact-check-state.mjs --state MI --dry
node tools/audit/fact-check-state.mjs --state MI --max-usd 2
```

Committed reports carry fact ids, verdicts, issues and fixes, but never handbook text. The full findings, with quotes, stay in `runs/<run>/sources/private/audits/muse-fact-check/`, which is gitignored.

## Measured on Michigan, 2026-10-29

| | |
|---|---|
| Facts checked | 730 (14 of 14 sections) |
| Flagged | 9: four wording or meaning problems, five citation-page precision |
| Exact cost | $0.43, or $0.00059 per fact, at reasoning effort low |
| Projection, all 51 (37,967 facts) | about $22 for one pass |
| Projection, states Muse can audit independently (33,681 facts) | about $20 |
| Positive control (3 planted wrong numbers) | caught 3 of 3 at default and at low effort, with no false flags |
| Total spent on all pilot calls so far | $1.40 (31 calls, including the default-effort pass and one failed call) |

## Lessons that are now defaults

- **Reasoning effort must be low.** At default effort, Muse spent 14,851 of 15,800 output tokens thinking on one section and returned truncated JSON. Low costs about half and still caught every planted error.
- **The output cap is 300 tokens per fact.** 160 truncated runs that had findings to report.
- **Any verdict other than SUPPORTED is a finding.** Muse labels a wrong number PARTIALLY_SUPPORTED, not CONTRADICTED.
- **Recall varies run to run.** The default-effort pass flagged three Michigan section-4 facts that the low-effort pass did not. For release, run two passes per section and take the union. That roughly doubles the projection, to about $45 for all 51.
- **Muse cannot independently audit what Muse wrote.** That rules out UT, TX, CA, FL, VA, NY, CT, KY, IA and OK. Claude or Sol must audit those states.

## Fix pipeline (2026-10-29)

| File | What it does |
|---|---|
| `fact-check-fleet.mjs` | First pass over all 51 states, several in parallel, under a fleet cap. Single instance (lock). |
| `triage.mjs` | Sorts first-pass flags into MEANING and CITATION from the auditor's issue text. A review aid that over-counts meaning. Writes `coordination/FACT-CHECK/TRIAGE.md`. |
| `muse-recheck.mjs` | Sends ONLY the flagged facts back to Muse, with the cited page and the pages either side. Gets back MEANING / CITATION / OK, a page-grounded corrected statement and the correct page. Writes `coordination/FACT-CHECK/<ST>/corrections.json`. Six sections in parallel, resumable, single instance. |
| `tools/preview/quarantine.mjs` | Hides every card that claims a fact confirmed MEANING-wrong, until its correction is marked `"applied": true`. |

Result on 2026-10-29: 38,074 facts checked, 664 flagged, re-checked to 444 MEANING (443 cards hidden), 184 CITATION and 36 OK. The corrections go back in through the belt per `coordination/SOL-FACT-FIX-BRIEF-2026-10-29.md`.

| Spend | |
|---|---|
| Pilot | $1.40 |
| Fleet first pass | about $35, including about $13 duplicated by two concurrent runs |
| Re-check | $4.25 |
| Total in `coordination/MUSE-API-SPEND.jsonl` | about $40.7 |

The re-check output floor must be at least 8,000 tokens. Small sections ran out of output while reasoning at the old 1,500 + 450 per fact.
