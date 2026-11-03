# BUG-006 — image-fact-check judged re-paints on the OLD picture (jpg cache keyed by basename only)

Status: FIXED 2026-11-01 · Severity: P1 (wrong verdicts, wasted spend) · Lane: Fable (`tools/audit/image-fact-check.mjs`)
Found: 2026-11-01 ~20:30Z — OpenAI re-paint verdict notes were word-for-word the Terra-original notes.

What
`.jpg-cache/<base>.w1280.jpg` was created once per scene id and never invalidated. Every re-paint dropped under the same id
(round 7 = 60 Meta re-paints, round 8 = 60 OpenAI re-paints) was downscaled from… nothing: the cached Terra jpg from
05:55 was sent to Meta vision again. `image_sha256` in the result was computed from the NEW png, so the sha check passed
while the model looked at the old picture. Rounds 7 and 8 verdicts (35/31 REJECT) are void; ≈$1.10 of vision spend wasted.
The founder's "all Meta are bad" was his own eyes on the page, so that call stands.

Fix
Cache name now includes the first 12 hex of the source png's sha256 (`<base>.<sha12>.w1280.jpg`). Round 8 re-run fresh.

Closed: 2026-11-01, fix in file; round 8 re-run is the proof.
