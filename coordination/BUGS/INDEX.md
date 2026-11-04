# BUGS index (one line per bug; newest last)

| id | sev | lane | status | one line |
|---|---|---|---|---|
| BUG-001 | P1 | Fable | CLOSED | merge served any drop-dir PNG regardless of status (131 unreviewed + 2 human-rejected live); resolver now `verified_*`-only + prune; 22:30Z merge: 723 live, 0 unverified, 0 dangling |
| BUG-002 | P1 | Fable | CLOSED | drv-292 id had a space → truncated map key → broken image; renamed, whitespace guard in merge, 0 whitespace webps |
| BUG-003 | P0* | Argon | CLOSED | shared drop-off bundle now includes `states-embedded.js`, `data-embedded.js`, `fonts/**` (770 app files) + static `src=`/`url(` self-check + README fix |
| BUG-004 | P2 | Argon | CLOSED | `shared-manifest.json` now stamps `category` + `by_category` across all 770 entries (`visual_scenes_webp=723`) |
| BUG-006 | P1 | Fable | FIXED | image-fact-check jpg cache keyed by basename → rounds 7+8 re-paints judged on the OLD Terra picture; cache now sha-keyed, round 8 re-run |
| BUG-007 | P1 | Fable | FIXED | :4330 server dropped repaint.html decisions (page posts `{decisions:{}}`, server filtered flat map → saved `{}`); now accepts both shapes and merges with disk |
| BUG-008 | P1 | Argon | CLOSED | all 116/831 affected lesson videos across ND..MI re-rendered against 723-WebP library, manifests refreshed, `sync-store --check` 0 drift, all 11 `READY.json` re-staged & `VERIFY PASS` |
| BUG-009 | P2 | Fable | OPEN | 35 OpenAI re-paints are 3:2 (1280×854) in a 16:9 contain frame → pale side bars; crop/pad/accept later |
| BUG-005 | mixed | belt/Argon/signs | OPEN | carried-in: off-domain distractors, repeated fallback picture, 370px store chrome, 4 withheld signs, old sign set in store |

*P0 only for the CDN cut-over; local store unaffected.

## ND drop-off verify (2026-11-01 18:40Z, independent of Argon's `--verify`)
cdn-manifest sha matches READY.json · 2,478 files = manifest = disk, 0 extra · bytes 1,594,574,663 match · 0 missing ·
0 sha mismatches (all files < 2 MB hashed + every ~6th video) · 256 free = chapter-1 only (243 sec01 + 13 manifests/
quarantine/think) · 0 paid file in the free allowlist · ND paid prefixes present (`data/nd/real/`, `audio/nd/`, `video/nd/`,
`decks/audio/nd/`). **ND payload itself: PASS.** Shared bundle: BUG-003/004.

## FLEET DROP-OFF COMPLETE (2026-11-02 18:11Z)
51/51 states READY_FOR_FABLE, every READY.json independently verified by Fable's watcher: 0 issues, 0 missing, 0 sha mismatches, free tier = section 01 only. States payload 254314 files / 188.29 GB (18509 free / 235805 paid; 4987 lesson videos, 37967 flashcards); shared bundle 770 files / 125.4 MB (723 scenes, embedded JS + fonts). Nothing picked up to a CDN yet (external_publish gate = founder).
| BUG-010 | P0 | Fable | CLOSED | unlocked state fetched ~220 JSON files one at a time (Utah 39 s before audio/overlays → "Loading…" after purchase); shell now fetches in a pool of 12 (3.7 s); founder uploads `app/index.html` via tools/deploy/hotfix-index-r2.mjs |
