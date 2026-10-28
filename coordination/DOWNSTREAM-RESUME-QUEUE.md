# Downstream resume queue (held while the 5-hour Claude window is at its ceiling; resets ~2026-10-28 10:00Z per the usage card)

Rule: one writer per run. Resume the state's own finished worker (SendMessage, context intact) with the remaining section ids,
same brief, same step command, final full-range run. Workers may raise limits.max_request_bytes in THEIR run-config for file
transport (record JAM in jams.md; revert before any Model-API dispatch) — NJ and MO needed it.

## Waiting to resume (worker finished its half; nothing running on the run)
- AL sec08–13 (6 sections) — worker a13bf6cd6f2567fa5 (AL downstream sec01–07 done)
- MO sec07–17 (11 sections) — worker a632003ee908516ad (MO downstream sec01–06 done, 25q/80% verified)

## Running now (first or second halves)
IN(06–10) WI(07–12) NV(07–12) NC(09–16) OR(07–11) AZ(01–08) MN(01–07) SC(01–07) TN(01–08) WA(01–07) FL(01–06) VA(01–08) CA(01–07) NY(01–07)

## Fully downstream + onboarded in the shell
MI NJ TX MD CO (+ UT by hand)

## After downstream
1. Onboard each finished state: node tools/preview/onboard-state.mjs --state XX --run <run> [--handbook ..] [--test ..] [--authored-by ..]; verify-learner; commit.
2. Re-author pass for byte-locked garbled card backs (AUTHOR-SELF-REPORTED-DEFECTS.md rows tagged "byte-locked") — recompile 16 with the
   patched spokenize, then re-dispatch 04 + 05.card_scripts for affected sections (new lineage), and the lesson-claim sweep for CO/TX sec01–08.
3. Muse's 4 new states (scout agent ad57e1b585ace6d6f staging KY/LA/OK/CT or fallbacks): QUEUE rows worker=muse → restart
   coordination/queue-runner.ps1 -MaxParallel 4 (no -NoNew) → Claude downstream after.
4. Audio only on founder "audio go" (~$7.50/state).
