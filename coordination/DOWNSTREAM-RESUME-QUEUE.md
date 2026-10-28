# Downstream resume queue (held while the 5-hour Claude window is at its ceiling; resets ~2026-10-28 10:00Z per the usage card)

Rule: one writer per run. Resume the state's own finished worker (SendMessage, context intact) with the remaining section ids,
same brief, same step command, final full-range run. Workers may raise limits.max_request_bytes in THEIR run-config for file
transport (record JAM in jams.md; revert before any Model-API dispatch) — NJ and MO needed it.

## Waiting to resume (worker finished its half; nothing running on the run)
- SC sec08–15 (8 sections) — worker a8b01213dda90a469
- FL sec07–12 (6 sections) — worker ae0947802147f1360 (the AL-first worker, now FL downstream)
- AL sec08–13 (6 sections) — worker a13bf6cd6f2567fa5 (AL downstream sec01–07 done)
- MO sec07–17 (11 sections) — worker a632003ee908516ad (MO downstream sec01–06 done, 25q/80% verified)

## Running now (first or second halves)
IN(06–10) WI(07–12) NV(07–12) NC(09–16) OR(07–11) AZ(01–08) MN(01–07) TN(01–08) WA(01–07) VA(01–08) CA(01–07) NY(01–07)

## Fully downstream + onboarded in the shell
MI NJ TX MD CO OR (+ UT by hand)

## After downstream
1. Onboard each finished state: node tools/preview/onboard-state.mjs --state XX --run <run> [--handbook ..] [--test ..] [--authored-by ..]; verify-learner; commit.
2. Re-author pass for byte-locked garbled card backs (AUTHOR-SELF-REPORTED-DEFECTS.md rows tagged "byte-locked") — recompile 16 with the
   patched spokenize, then re-dispatch 04 + 05.card_scripts for affected sections (new lineage), and the lesson-claim sweep for CO/TX sec01–08.
3. Muse's 4 new states (scout agent ad57e1b585ace6d6f staging KY/LA/OK/CT or fallbacks): QUEUE rows worker=muse → restart
   coordination/queue-runner.ps1 -MaxParallel 4 (no -NoNew) → Claude downstream after.
4. Audio only on founder "audio go" (~$7.50/state).

## 11:25Z 2026-10-28 budget note
Weekly Claude 76% (jumped 9 pts in 75 min: resumed workers re-read large contexts). Live now: MO NC AL SC FL VA WA NY MN TN AZ CT.
Done + onboarded: MI NJ TX MD CO OR IN WI NV CA (+UT). HOLD Claude downstream for Muse's KY/IA/OK (and AZ sec16–22 if budget
< 15 pts remain when it comes up) until Saturday's reset (2026-10-31 13:00Z) unless the founder says otherwise. Sol's 10 states =
her downstream. Re-author pass (wrong-meaning BAC backs first: AL sec06, NV sec12, IN sec05, CO sec02) after the reset.

## 12:45Z 2026-10-28
Fully downstream + onboarded (18): MI NJ TX MD CO OR IN WI NV CA FL MO NC VA NY AL WA SC (+UT). Running: AZ (sec09-15, then 16-22), MN (08-14), TN (sec05 remint + 08-17), CT (08-12). Muse SME done: KY IA (downstream HELD for budget), OK 10/13. Sol: 10 in progress, none complete.

## 14:20Z 2026-10-28 — DOWNSTREAM COMPLETE for the original 22 + CT (23 live incl. UT). Muse SME done for KY IA OK (downstream held to Saturday). Sol: KS SME done, 9 in progress. Next after the Saturday reset: KY/IA/OK downstream, re-author pass (wrong-meaning backs first), fidelity audit (CT first), audio on founder go.
