# WARNING — Oklahoma downstream artifacts are NOT fact-audited

Status as of 2026-10-28 (cloud session, branch `cloud/ok-downstream`):

- Stages 03/04/06/05.sessions/05.card_scripts for all 13 sections passed the belt's deterministic schema and
  compensating checks only. **No statement in this run has been verified against the Oklahoma Driver Manual.**
  The independent 07 (coverage) and 08 (facts) audits are still pending. Do not publish or deploy from this run
  until they pass.
- Every card back, exam answer, lesson span and script answer is a verbatim accepted statement from the stage-16
  fact registries, which were Muse-authored. The following statements looked suspect while authoring and need a
  page check before anything downstream is trusted:
  - sec07-F05 — speeding fine "up to six hundred fifty-four dollars" (oddly specific)
  - sec12-F12 — "amphetamine drivers four times crash-prone"
  - sec01-F14 — "twenty-five percent of sixteen-year-olds crashing or ticketing in year one … all fifty states"
  - sec03-F10 — "rear seat runs twenty-six percent safer"
  - sec11-F07 / sec11-F09 — national distraction death and injury counts and "ten fatal crashes in two thousand nine"
  - sec11-F12 — floodwater weights and the two-foot float claim
  - sec10-F13 — "half the crashes strike guarded crossings and two-thirds in daylight"
  - sec01-F09 — "thirty days after the permit … or the next business day after the written exam" (ambiguous)
  - sec05-F11 — "mandatory one-year license revocation" for passing school-bus reds
  - sec02-F06 — the Service Oklahoma post-office box number
- Known byte-locked wording oddities (not altered): sec07 registry printed_page "4400"/"4411" for PDF pages 40–41;
  sec03-R08 "four-nine"; sec10-F03 glued statute cite; sec01-F03 "I ninety-four". Two Section 4 narrations exceed
  the 760-character founder ceiling (798 and 835) because sec04-F17 is a 702-character statement.
- Exam facts (question count, pass mark, time limit) are UNKNOWN for Oklahoma and every practice form says so.
  Nothing in this run may be used to assert them.

Full report: coordination/CLOUD-REPORTS/OK.md
