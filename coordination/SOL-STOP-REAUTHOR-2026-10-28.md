Sol — change of plan (founder, 2026-10-28 ~22:30Z). STOP the re-author pass (Part 1) now. A deterministic tool will do the byte refresh; the coordinator runs it. You keep MT and the 14 round-2 states (Part 2), nothing else.

Hand-back, before you touch anything else:
1. Finish or abandon only the belt step that is mid-flight (never leave a half-written outbox: either complete the step to accepted, or delete the .tmp and let the task stay as the belt left it). Then remove every "SOL REAUTHOR IN PROGRESS" claim line from runs/<run_id>/jams.md.
2. Write coordination/SOL-REPORTS/REAUTHOR-HANDBACK.md: one block per run you touched (run_id; sections you recompiled at 16; sections where 04.cards was re-minted and accepted; sections where 05.card_scripts was re-minted and accepted; the retry nonces you bumped, with their current values; any step that is accepted at 04 but not yet at 05; any HOLD you hit with its check ids; any merge you recorded, with card ids). If you touched nothing, say so in one line.
3. Do not commit (same checkout as the coordinator; the coordinator commits your hand-back and run-dir changes as yours).

Then continue Part 2 only: MT to completion, then the 14 states in the stated order. Everything else in coordination/SOL-NEXT-PROMPT-2026-10-28.md Part 0 and Part 2 still applies.
