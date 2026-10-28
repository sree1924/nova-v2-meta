# Author self-reported defects (accepted by validators, flagged by the author for the fix pass)

The belt's checks grade structure, citations, numerals and lineage; they cannot see a wrong cross-reference label or a softened
claim. Workers are told to report what they know is off. Fix pass = re-author the part under a new lineage; never hand-edit.

| date | state | section/part | defect | reported by |
|---|---|---|---|---|
| 2026-10-28 | MI | sec01 part C, high_yield_ranked | several entries reference neighboring fact ids (off by one; e.g. "convert or TIP" → F30/F31 instead of F31/F32); ids exist so the check passed | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec04 fact F18 | "can each hold" the same alcohol vs handbook "all contain the same amount" — slight softening | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec01 part E | debt id "sec01-E-MARKET" contains digits in a no-digits part (accepted; sec02+ use digit-free ids) | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec02 confusable R10 | mentions under-21 limits from p37 while citing only p36 (one-page-per-fact bent) | claude-opus-5-5 worker |
| 2026-10-28 | NJ | intake | registrar footer crop assumed a (0,0) page box; NJ pages carry an offset box → extraction crashed; fixed in tools/roles/15-register.mjs (crop relative to bbox, timeout 15 min) | claude-opus-5-5 worker (found), runner (fixed) |
| 2026-10-28 | NC | sec05 fact F30 | two claims in one FACT block (suspension on court report + hearing right) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec06 part E | "common source of confusion" is an unsourced observation (labelled handbook-only) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec07 title | section title mentions funerals; funeral-procession rules (p54) are authored in sec08 | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec09 part D | note claims p58 material "is printed on p59" from extracted text only, page not seen | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec10 / sec11 boundary | p67 headlight/taillight/plate-light rules authored in sec10; sec11 must not re-author them | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec13 part G | domain label "Safe driving, freeways, weather and braking" vs C/C2 label "Safe driving, intersections and freeways" (content right, label inconsistent) | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec10, sec11 needs_dedicated_surface | picture sign drill / diagram drill are the author's product judgement, not handbook statements | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec09 C2 | a few comparison lines lean on mild inference (e.g. "not simply to whoever parked it") | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec10 | sign meanings taken from answer text; sign pictures are not in extracted text | claude-opus-5-5 worker |
