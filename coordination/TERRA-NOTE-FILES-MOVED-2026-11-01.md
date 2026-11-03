# Terra — nothing is missing. 106 of your files were MOVED on purpose, not deleted. Read this, then carry on.

From: Fable (coordinator), 2026-11-01, on the founder's instruction. Founder: Sridhar.

## What happened
The founder reviewed your first 20 and asked for every reviewed image to be sorted into its own folder. So a review
pass now runs over the drop folder and moves each image once it has a verdict:

- `scratch/video-samples/nd-all-lessons/visuals/_approved/`        — 95 images that PASSED review (unchanged bytes, same filename)
- `scratch/video-samples/nd-all-lessons/visuals/_quarantine_regen/` — 11 images that did not: 5 REJECT
  (filename gets `.bad-<rule>.png`, e.g. `drv-61-...bad-us-right-hand-traffic.png`) and 6 HUMAN_REVIEW
  (`.review-scene-partial.png`). That is the same quarantine folder and naming you already used for drv-05/drv-07.
- The flat `visuals/` folder keeps everything not yet reviewed (584 files right now) and is still where you DROP.

The review is the five drawing rules you were given plus "does it show the scene in the prompt" and "would a
learner learn the rule correctly," checked by Meta's vision model at ~$0.008 per image, then the founder's eyes.
Every verdict is written down: `coordination/IMAGE-CHECK/results/<id>.json`, the move log is
`coordination/IMAGE-CHECK/DISPOSITION.json`, and the catalog (`scratch/terra-dataset/national-fleet-700-visual-catalog.json`)
carries each scene's new `status`, `output_path` and a `review` block. The merge pointer gained `approved_directory`
and the merge resolves `_approved/` first, then `visuals/`; `merge_when_terra_done.py --check` reads 639/748 ready.

## What it means for you
1. **Keep dropping new PNGs into the flat `visuals/` folder exactly as before.** Same names from the catalog. Do not
   drop into `_approved/` (review moves them there) and do not touch `_quarantine_regen/`.
2. **Do not re-paint anything in `_approved/`.** Those are done.
3. **The 5 REJECTs are yours to re-paint** when you get to them — read the reason in the filename and the note in
   `coordination/IMAGE-CHECK/results/<id>.json` ("what_i_see", "rules", "summary"), then drop the new PNG under the
   ORIGINAL catalog filename into the flat `visuals/` folder. The old `.bad-` file stays in quarantine as history.
   Current five: drv-61 (through-road pickup on the wrong side of the yellow line), drv-66 (HAWK shows one red, needs
   the double red), drv-153 and drv-165 (more than one signal lens lit), drv-171 (wrong-side traffic).
4. **The 6 HUMAN_REVIEW files wait for the founder**; no action from you unless he says re-paint.
5. **The 99 catalog scenes that were never painted are still the queue** (`merge_when_terra_done.py --check` lists
   them). Lower priority than the five re-paints: the merge already has a fallback for each.
6. More files will move out of `visuals/` today as the review pass finishes (it is at 308 of 405). A file leaving
   the flat folder means it was reviewed, nothing else. If you ever want to confirm one, search its id in
   `coordination/IMAGE-CHECK/DISPOSITION.json`.

Rules unchanged: zero text, US right-hand traffic (yellow on the LEFT of our lane, white on the RIGHT), no RHD cabins,
no head-on same-lane cars, at most one lit lens per signal, 16:9, Neo-Pop cel-shaded style, same filename as the catalog.
