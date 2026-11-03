# Fable → Argon — visual library is FINAL (2026-11-01 ~22:30Z merge)

**State of the library:** `store/learner-assets/visuals/` = **723 live WebPs**, every one `verified_*` in the catalog
(0 exceptions), 51 state shards rewritten, 0 dangling refs across 690 scenes / 108,983 slots, 25 scenes on domain
fallback (`fallback: true`, your gate skips them). Harnesses PASS on both roots. Your flashcard decks are untouched.

What changed vs. what you rendered against: 35 scenes replaced (OpenAI re-paints the founder kept), 8 stale WebPs pruned
(7 rejected scenes + the orphan id `mot-05-highway-weave-lane-merge`; the live loop is `mot-05-freeway-weave-lane-yield`).
Full id list: `coordination/IMAGE-CHECK/videos-affected-by-merge-2026-11-01.json` → `changed_scenes`.

## 1. Shared bundle — nothing to do
Your 22:33:56Z shared re-stage byte-matches the current library (I diffed all 723: 0 removed / 0 added / 0 changed).

## 2. BUG-008 — re-render 116 of 831 lesson videos (your lane, $0)
All 11 staged states' MP4s were rendered 17:43Z–22:23Z, before the merge, so 116 units still show a since-replaced or
since-pruned picture. Per state: ND 5 · TX 6 · CA 7 · FL 2 · NY 11 · PA 6 · IL 8 · **OH 36** (drv-608 reused in 32 units)
· GA 7 · NC 14 · MI 14. Exact unit ids: `rerender_units.<ST>` in the JSON above. At your measured pace that is ≈15–20 min.
After each state: refresh `video-manifest.json` sha/size for those units, re-run `stage-fable-dropoff.mjs --state <XX>`;
my watcher re-verifies every new READY.json automatically (all 11 so far: PASS, 0 issues).
NJ onward: render after this note and they are clean by construction.

## 3. BUG-003 / BUG-004 — shared bundle gaps (your lane)
`coordination/BUGS/BUG-003-shared-bundle-missing-embedded-js-and-fonts.md` (P0 for the CDN cut-over only: the bundle lacks
`states-embedded.js`, `data-embedded.js`, `fonts/**` that `index.html` / `learner.css` load; README names mjs files that are
inlined) and `BUG-004` (shared-manifest entries lack `category`). Local store is unaffected.

## 4. For your awareness
BUG-009 (Fable, P2): the 35 OpenAI re-paints are 3:2 (1280×854), shown with pale side bars in the 16:9 frame; your renderer
pads to 1280×720 so videos letterbox the same way. Accepted for the cut; may crop/pad later.

Log anything you find as `coordination/BUGS/A-BUG-NNN-slug.md` + a line in `INDEX.md`.
