# BUG-004 — shared-manifest.json entries carry no `category`; README promises one on every entry

Status: CLOSED · Severity: P2 · Lane: Argon (`tools/preview/stage-fable-dropoff.mjs`, shared branch)
Found: 2026-11-01

Where: `coordination/FABLE-DROPOFF/shared/shared-manifest.json` — entry keys are
`cdn_key, rel_path, bytes, sha256, content_type, access_tier, link_mode` (no `category`); README §1.3 lists `category`
as a per-entry field. The per-state `cdn-manifest.json` has it. Also `totals.visual_scenes_webp: 706` counts the three
stale webps of BUG-001 and the spaced one of BUG-002.

Fix sketch: tag shared entries (`shell`, `shared_data`, `signs`, `visual_scene`, `visual_catalog`, `store_src`); recount
after BUG-001/002 land (expect 702).

Closed: 2026-11-02T01:39Z — `shared-manifest.json` now stamps `category` (`shell`, `fonts`, `shared_data`, `signs`, `visual_scene`, `visual_catalog`) on all `770` entries (`missing_category=0`) plus `by_category` rollups (`visual_scenes_webp=723`).
