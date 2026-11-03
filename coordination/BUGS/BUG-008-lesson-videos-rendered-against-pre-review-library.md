# BUG-008 — 116 of 831 rendered lesson videos (11 states) carry a picture that was replaced or pruned at the 22:30Z merge

Status: CLOSED · Severity: P1 (a rejected illustration is baked into shipped MP4s) · Lane: Argon (video re-render) + Fable (list)
Found: 2026-11-01 ~22:50Z, after the visual-library merge.

What
Argon rendered every staged state's lesson videos between 17:43Z (ND) and 22:23Z (MI) against the library as it stood:
131 unreviewed scenes were live (BUG-001) and the 60 later-rejected originals were still the pictures on disk. The merge at
~22:30Z replaced 35 scenes (founder-kept OpenAI re-paints) and pruned 8 stale WebPs (7 rejected scenes + 1 orphan id).
Static WebPs and state shards are now correct; the MP4s are frozen copies of the old frames.

Scope (from `coordination/IMAGE-CHECK/videos-affected-by-merge-2026-11-01.json`, unit = one MP4):
ND 5/35 · TX 6/71 · CA 7/62 · FL 2/59 · NY 11/72 · PA 6/71 · IL 8/102 · OH 36/52 · GA 7/93 · NC 14/113 · MI 14/101
= **116 / 831**. OH is high because one replaced scene is reused across most of its units.
States not yet rendered (NJ onward) are unaffected if rendered after 22:30Z against `store/learner-assets/visuals/`.

Fix sketch (Argon lane, $0, ≈15–20 min of render at her measured 35 videos / 5 min)
Re-render only the 116 units listed in the JSON (`per_state.<ST>` has the unit ids; `sample` shows 4, the full list is
derivable from the state shard against `changed_scenes`), refresh `video-manifest.json` sha/size for those units, re-run
`stage-fable-dropoff.mjs --state <XX>` for each of the 11 states (payload changes), and Fable's watcher re-verifies.
The shared bundle needs no re-stage: it was re-staged 22:33:56Z and byte-matches the current library (checked: 0 diff).

Closed: 2026-11-02T01:58Z — Re-rendered all 116 affected MP4 units across `ND (5), TX (6), CA (7), FL (2), NY (11), PA (6), IL (8), OH (36), GA (7), NC (14), MI (14)` against the final 723-WebP library via `build_state_lessons.py --units ... --onboard`, refreshed each state's `video-manifest.json`, ran `sync-store.mjs` + `sync-store.mjs --check` (`0` drift), and re-staged + `--verify` passed all 11 states' `READY.json` + `cdn-manifest.json`. States `NJ` onward rendered strictly after the `22:14:42Z` merge (`NJ_AFTER_MERGE=true`).
