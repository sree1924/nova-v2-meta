# BUG-002 — scene id contains a space → webp name and state-map key disagree → broken image in 4 states

Status: OPEN · Severity: P1 (blank/broken picture) · Lane: Fable (catalog + merge)
Found: 2026-11-01 18:40Z

Where
- Catalog id: `drv-292-evacuation-route-blue-circle- hurricane` (trailing `- hurricane`, with a space) in
  `scratch/terra-dataset/national-fleet-700-visual-catalog.json`, status `verified_pass_meta_vision`.
- Store file: `store/learner-assets/visuals/drv-292-evacuation-route-blue-circle- hurricane.webp` (space in filename).
- State maps reference `drv-292-evacuation-route-blue-circle-` (truncated at the space) — 4 states / 13 slots.
- Also present in `coordination/FABLE-DROPOFF/payload/shared/app/visuals/` with the space → bad CDN key.

What
The merge script splits the id on whitespace somewhere between catalog and map (map key truncated) while the file copy
uses the raw id. The `<img src>` the shell builds from the map key does not match any file.

Fix sketch
Rename the catalog id to `drv-292-evacuation-route-blue-circle-hurricane` (and the PNG in `_approved/`), delete the
spaced webp, re-run merge `--apply` + sync-store. Add a catalog lint: ids match `^[a-z0-9-]+$`.

Closed: 2026-11-01 ~22:45Z. Id renamed to `drv-292-evacuation-route-blue-circle-hurricane` in catalog + `_approved/`;
merge raises on any whitespace id; post-merge check: 0 webps with whitespace, 0 dangling map refs. Catalog lint regex
still TODO in the catalog writer (merge guard covers the ship path).
