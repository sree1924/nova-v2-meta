FOLLOW-UP MESSAGE for a cloud session that is already running and blocked on a missing parent file (HI at Phase 1 step 7; WV/VT at the first Phase 2 dispatch). One block, same for every session; paste it into that session's chat.

----- paste from here -----
UNBLOCK (final, complete): every file the belt resolves outside the clone root is now in ONE archive on main, and a script proves the set is complete instead of a hand-typed hash list. Do exactly this, in order:
1. git fetch origin && git merge origin/main   (your branch keeps its commits; main only adds coordination/cloud/parent-pins.zip and coordination/cloud/verify-parent-pins.mjs).
2. From the clone root: unzip -o coordination/cloud/parent-pins.zip -d ..   (it lands ../factory/..., ../sme-library/_MASTER-SME-TEMPLATE.md and ../schemas/learning-loop.schema.json; it is safe to run over the earlier zips).
3. node coordination/cloud/verify-parent-pins.mjs   — it reads contracts/bot-contract-bindings.json, prompts/*.md and the controller's schema paths, and checks each pinned file under ../ by sha256. It must print "PASS 48 parent pins". If it prints FAIL, stop and paste its output in your report; do not improvise paths or edit any tool.
4. Resume exactly where you stopped: HI → node tools/belt/intake-state.mjs --spec coordination/intake/HI.spec.json (spec unchanged), then Phase 2 and 3 as in your prompt. WV / VT → the first Phase 2 command: node tools/belt/run-utah.mjs --run runs/<your run id> --author muse --packet thin --sections all --stages 02,16.
Everything else in your original prompt stands: one step per command, exit 3 = packet, pre-check every outbox, commit + push per section, ledger actual $0.000, mint no audio, report early if credit runs low.
----- paste to here -----
