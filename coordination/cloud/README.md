# Cloud-session pins

factory-workers-pins.zip — byte-exact copies of the four parent-factory role contracts the belt verifies by hash
(contracts/bot-contract-bindings.json pins them at ../factory/workers/ relative to the lane root):

| file | bytes | sha256 (prefix) |
|---|---|---|
| factory/workers/03-knowledge-architect.md | 6841 | 8c66430a |
| factory/workers/04-flashcard-engineer.md | 11430 | ce0ce218 |
| factory/workers/05-voice-coach.md | 15349 | 714aad6d |
| factory/workers/06-exam-author.md | 12677 | 689fcac8 |

Cloud recipe: from the clone root run `mkdir -p ../factory/workers && unzip -o coordination/cloud/factory-workers-pins.zip -d ../factory/workers`
then verify with `sha256sum ../factory/workers/*.md`. Zipped (not committed as text) so Windows/Linux line-ending normalization
cannot change the bytes. These are private factory contracts; the lane repo is private.

2026-10-29 — factory-pins-full-belt.zip: ALL seven contracts a full-belt cloud session needs, in factory/ layout (workers/02 03 04 05 06 + infra-roles/15 19). From the clone root: unzip -o coordination/cloud/factory-pins-full-belt.zip -d .. then sha256sum ../factory/workers/*.md ../factory/infra-roles/*.md — expect f68613a8 (02) 8c66430a (03) ce0ce218 (04) 714aad6d (05) 689fcac8 (06) 726ccc46 (15) e0480375 (19). The four-worker zip above is enough only for downstream-only sessions (KY/IA/OK pattern). Hawaii's first session blocked at registration on the missing 15/19/02 pins; see CLOUD-REPORTS/HI.md.
2026-10-29 (second round): the registrar's plan step verifies a pinned contract for EVERY stage in the stage map, so the zip now carries eleven: workers 02 03 04 05 06 07 08 09 + infra-roles 15 19 19a (hashes in CLOUD-UNBLOCK-PINS-2026-10-29.md). HI's second attempt blocked on 19a/07/08/09; see CLOUD-REPORTS/HI.md.

2026-10-29 (final): parent-pins.zip REPLACES both earlier zips. It carries every file the belt resolves against the parent of the clone root: 46 role contracts (all non-local entries in contracts/bot-contract-bindings.json), sme-library/_MASTER-SME-TEMPLATE.md (pinned by prompts/02.md, verified on every 02 dispatch), schemas/learning-loop.schema.json (loaded by intake-state and the controller). verify-parent-pins.mjs derives the list from those same sources and checks presence + sha256 under ../ ; proof on 2026-10-29: PASS 48 against the unzipped archive, FAIL 48/48 against an empty parent, PASS 48 against D:\nova. Cloud recipe: unzip -o coordination/cloud/parent-pins.zip -d .. && node coordination/cloud/verify-parent-pins.mjs
