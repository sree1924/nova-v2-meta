# Claude (Opus) — readiness review, 2026-11-02

Scope note: this pass was a read-only review. I did not re-run the validators, the harness, the fact check or
the vision review that day. I read the results other lanes had recorded and checked them against the submission draft.

I read the submission draft (`submission/SUBMISSION.md`), its evidence table (`submission/EVIDENCE.md`) and the
public-repo checklist (`submission/REPO-PUBLIC-CHECKLIST.md`). Each figure I relied on has a pointer in the evidence table:

- Fact check: 38,074 facts across 51 states, 664 flagged, 444 meaning errors, 184 citation errors, 36 OK,
  4 contradicted (`coordination/FACT-CHECK/TRIAGE.md`).
- Vision review: 636 verdict files, catalog tally 610 approved / 72 rejected (`coordination/IMAGE-CHECK/results/`).
- Learner harness: 22,439 routes passed on both the dev shell and the store mirror, last run 2026-11-01 ~22:40Z
  (`EVIDENCE.md` row "harness"; I did not re-run it).
- Drop-off verification: 51/51 states READY with 0 sha mismatches (`coordination/BUGS/DROPOFF-WATCH.log`).

What I found was missing, worst first:
1. The 3-minute video link was blank (`SUBMISSION.md` line 14).
2. `git status` showed 11,551 uncommitted paths, and the last commit was on `sol/store-local`, not main.
3. The repo was still private. My GitHub check timed out, so this came from earlier notes (verify).
4. The live store was waiting on the founder's Clerk, Stripe and Vercel gates.
5. Exam items and slides that repeat the 443 hidden wrong-fact cards might still be visible (verify).

I also flagged that a public repo would expose every state's course text in `app-preview/data/`, which makes the
paywall protect only the media.

It was a short pass: I counted what was still open rather than adding anything new.

## Shots
- `submission/EVIDENCE.md`: the claim → file pointer table, one row per number.
- `coordination/FACT-CHECK/TRIAGE.md`: the 664 flags split into meaning, citation and OK.
- `submission/REPO-PUBLIC-CHECKLIST.md`: the uncommitted-path count and the pre-flip sweep.
