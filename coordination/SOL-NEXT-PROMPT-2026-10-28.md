Sol — one message, three parts, in this order (founder, 2026-10-28 evening; the store sells Friday).

PART 0 — NOTICE. Shell onboarding is the coordinator's step, never yours: do not run export-content, onboard-state, embed-states, sync-store, or edit app-preview/* or store/*. Your nine finished runs (ID KS DE NE PA WY ME SD NM) are already in the shell from their ledgers. Flip NM's QUEUE row to complete when your report is final. Finish MT (write coordination\SOL-REPORTS\MT.md, flip its row) and stop; I onboard it. From here on, every state ends with report + row flip, then you stop. Full note: coordination\SOL-NOTICE-ONBOARDING-2026-10-28.md.

PART 1 — RE-AUTHOR PASS (do this before the 15 new states). Brief: coordination\SOL-REAUTHOR-PASS-BRIEF.md, followed exactly (recompile 16 → nonce bump + --remint 04.cards → nonce bump + --remint 05.card_scripts; 03/06/05.sessions stay accepted; never alter an accepted artifact in place). Targets, worst first, with hidden-card counts from app-preview\data\quarantine-summary.json and the run ids (all under D:\nova\fb-ai-hackathon\runs\):
  MO 45  2026-10-28-rdmv-mo-class-f
  NJ 32  2026-10-28-rdmv-nj-class-d
  NV 32  2026-10-28-rdmv-nv-class-c
  AL 22  2026-10-28-rdmv-al-class-d
  UT 21  2026-10-26-rdmv-ut-class-d
  MN 21  2026-10-28-rdmv-mn-class-d
  NC 20  2026-10-28-rdmv-nc-class-c
  IN 20  2026-10-28-rdmv-in-class-std
  MI 18  2026-10-28-rdmv-mi-class-std
  SC 18  2026-10-28-rdmv-sc-class-d
  WA 16  2026-10-28-rdmv-wa-class-std
  AZ 14  2026-10-28-rdmv-az-class-d
  OR 10  2026-10-28-rdmv-or-class-c
  TN 9   2026-10-28-rdmv-tn-class-d
  WI 8   2026-10-28-rdmv-wi-class-d
  CO 7   2026-10-28-rdmv-co-class-std
  MD 6   2026-10-28-rdmv-md-class-c
  FL 4   2026-10-28-rdmv-fl-class-e
  CT 3   2026-10-28-rdmv-ct-class-d
  NE 2   2026-10-28-rdmv-ne-class-o
  TX CA VA NY KY NM 1 each  (tx-class-c, ca-class-c, va-class-std, ny-class-d, ky-class-d, nm-class-std)
The per-state list of affected card ids and classes is app-preview\data\<xx>\quarantine.json; only the sections named there need recompiling. Five threads, one state per thread, one writer per run: claim with the line "SOL REAUTHOR IN PROGRESS <ISO time>" at the top of runs\<run_id>\jams.md and remove it when done. Report each state to coordination\SOL-REPORTS\REAUTHOR-<ST>.md and append to coordination\REAUTHOR-LOG.md; I re-onboard and regenerate the quarantine after each report. Stop the pass when every state in the list has a report.

PART 2 — ROUND 2, the 14 remaining jurisdictions (HI went to a Claude cloud session), end to end, five threads, same rules as coordination\SOL-STATE-WORKER-BRIEF.md and the Claude briefs it points to. Your rows in runs\_intake\QUEUE.json are "worker": "sol", status "staged": IL OH GA MA first, then LA AR MS WV, then NH RI VT AK ND DC. Handbooks are in runs\_intake\sources\private\<ST>.pdf with <ST>-pages.txt extracted; provenance is in the row and <ST>.url.txt (IL GA MA NH LA DC were founder manual downloads because the sites block scripts; OH was assembled from the issuer's own web chapters, see OH-provenance.json). Where the row says "class not verified", the intake spec states the class the handbook itself names, or marks it unknown — never guess. Per state: Phase 1 intake spec (coordination\intake\<ST>.spec.json) + intake-state.mjs; Phase 2 --stages 02,16; Phase 3 --stages 03,04,06,05.sessions,05.card_scripts; then flip the row to complete and write coordination\SOL-REPORTS\<ST>.md. Standing rules unchanged: pre-check every outbox with the stage check modules, card backs byte-equal to the compiled statement, merge at 04 when a back cannot pass (coordination\NM-03-TEXT-LOCAL-SYMBOL-OWNER-RESPONSE.json), official_mirror copies the safe view exactly, lessons claim nothing beyond the registry, typed gaps + dynamic quarantine for flagged facts (coordination\DE-06-CAPABILITY-OWNER-RESPONSE.json), ledger actual $0.000, no audio, commit nothing, no edits to tools\belt or schemas without a write-barrier request. Record tokens per state with tools\preview\worker-token-ledger.mjs --record (worker "sol").
