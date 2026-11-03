# BUG-001 — two human-REJECTED scenes and one never-reviewed scene are live in the store + state maps

Status: OPEN · Severity: P1 (learner sees a picture the founder rejected as wrong) · Lane: Fable (visual merge)
Found: 2026-11-01 18:40Z, while verifying Argon's ND drop-off bundle (shared payload = 706 webps, catalog says 705 approved).

Where
- `store/learner-assets/visuals/drv-325-white-lane-arrows-mandatory-only-vs-shared.webp` — catalog status `rejected_regen`
  (human reject), referenced by 31 state maps / 133 slots.
- `store/learner-assets/visuals/drv-400-scanning-left-right-left-at-every-intersection.webp` — `rejected_regen`
  (founder: "Reject both", drv-400 + drv-514), referenced by 40 state maps / 240 slots.
- `store/learner-assets/visuals/drv-415-left-turn-yield-to-oncoming-bicyclist-speed-trap.webp` — catalog status
  `queued_for_terra` = Terra painted it, nobody (Meta or human) ever reviewed it; 5 states / 7 slots.
- Copied into `coordination/FABLE-DROPOFF/payload/shared/app/visuals/` by Argon's stager, so they would ship on the CDN.

What
`scratch/terra-dataset/merge_when_terra_done.py --apply` resolves a scene from `_approved/` then the flat drop dir, and
never deletes a webp that an earlier merge wrote. drv-325/400 were merged before they were rejected (their PNGs moved to
`_quarantine_regen/` afterwards); drv-415's PNG still sits in the flat drop dir, so the resolver picked it up as if approved.
The state maps were regenerated against whatever webp existed, so all three are wired into slots.

Proof
`node -e` over catalog + `visuals/state/*.json` (2026-11-01): statuses above; slot counts above. drv-514 (also rejected)
is correctly absent — its webp was never written.

**Scope correction 2026-11-01 19:10Z (worse than first logged):** the merge resolved ANY PNG in the flat drop dir regardless
of catalog status. Tabulating catalog × disk: **124 `queued_for_terra` scenes (Terra painted, never reviewed by Meta or
human) and 7 `rejected_regen` scenes whose re-paint landed back in the drop dir unreviewed** were all live in the store.
So the "705 approved" figure I reported earlier was 463 reviewed + 113 verified wave-1/ref/mot + ~131 unreviewed. The
three ids above were the only ones I could see from the diff against the catalog; the rest were hidden because their
status never said "pass" in the first place.

Fix sketch (Fable lane, ~5 min, $0)
1. Merge resolver: accept a scene ONLY from `_approved/` (drop dir no longer a source) — catalog `status` must start with
   `verified_pass`.
2. Delete the three webps; re-run `--apply`; slots fall back to the domain fallback scene; re-run sync-store; Argon
   re-stages `--include-shared`.
3. Add a post-merge assert: every webp in `store/learner-assets/visuals/` has a `verified_pass*` catalog row.

Closed: 2026-11-01 ~22:45Z. Resolver accepts a scene only when its catalog status starts with `verified_` (searching
`_approved/` then the drop dir); stale webps pruned on every merge (8 pruned this run, incl. the orphan
`mot-05-highway-weave-lane-merge`); whitespace-id guard. Round 6 reviewed all 131 unreviewed (91 Meta ACCEPT + founder
22 KEEP / 18 REJECT), 60 rejects re-painted (Meta → founder rejected all; OpenAI gpt-image-1.5 → Meta 32 ACCEPT / 3 HR /
25 REJECT; founder: keep all 35). Merge `--apply` 2026-11-01 ~22:30Z: **723 live WebPs, every one `verified_*` in the
catalog (checked: 0 exceptions), 0 dangling refs across 690 scenes / 108,983 slots, 25 scenes on domain fallback.**
Harnesses PASS (learner-assets + store/public/app). Follow-on: BUG-008 (videos rendered against the pre-review library).
