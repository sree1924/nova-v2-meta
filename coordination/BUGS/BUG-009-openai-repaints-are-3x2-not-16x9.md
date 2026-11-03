# BUG-009 — the 35 OpenAI re-paints are 3:2 (1536×1024 → 1280×854 WebP), library standard is 16:9 (1280×720)

Status: OPEN · Severity: P2 (cosmetic; pale side bars) · Lane: Fable (`tools/audit/openai-image-gen.mjs`, merge)
Found: 2026-11-01 ~22:40Z — merge printed `Aspect Warnings : 35`.

What
`gpt-image-1.5` offers 1024², 1536×1024 and 1024×1536 only; 1536×1024 is 3:2. The merge writes static scenes at source
aspect (only motion loops get the 1280×720 pad), so 35 live WebPs are 1280×854. The shell frame is `aspect-ratio: 16/9`
with `object-fit: contain` on a `#f5f7f0` background, so these show ~5.5% pale bars on each side instead of cropping.
Lesson videos that pick these scenes up on re-render will letterbox the same way (renderer pads to 1280×720).

Ids: the 35 KEEP entries in `coordination/IMAGE-CHECK/decisions-2026-11-01-r8.json`.

Fix sketch (later sweep, $0)
Either (a) center-crop the 35 source PNGs to 1536×864 and re-merge — risks clipping signals at the top/bottom edge, so
eyeball each; or (b) have the merge pad statics to 1280×720 with a blurred-edge fill like the motion loops; or (c) accept.
Founder has not been asked; shipping as-is for the hackathon cut.

Closed: —
