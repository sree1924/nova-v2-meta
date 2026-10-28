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
