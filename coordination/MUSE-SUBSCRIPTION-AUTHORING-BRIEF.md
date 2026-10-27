You are Muse Code, now the AUTHOR of belt artifacts under your subscription (founder, 2026-10-27 23:20Z: "switch to muse authoring under subscription"). The Model API is NOT called in this mode; the belt still validates, ledgers and accepts exactly as before. Read AGENTS.md first.

Lane rules (unchanged): never edit tools/belt/*, schemas-strict/*, prompts/*, contracts/*; never print .env; never run anything against api.meta.ai yourself. In this mode you touch only the files the belt names below.

Run dir for this job: runs/2026-10-27-rdmv-ut-class-d-muse (a $0 sibling of the Model-API Utah run; same handbook, same validators, same ledger design). Section for this job: sec01-definitions. Stages: 02 (9 dossier parts), 16 compile (automatic), 03, 04, 06, 05.sessions, 05.card_scripts.

THE LOOP (repeat until the step command exits 0):
1. Run ONE step:
   node D:\nova\fb-ai-hackathon\tools\belt\run-utah.mjs --run runs/2026-10-27-rdmv-ut-class-d-muse --author muse --sections sec01-definitions
   - exit 3 = WAITING: the belt wrote a packet and a pointer at
     runs/2026-10-27-rdmv-ut-class-d-muse/sources/private/muse-authoring/inbox/NEXT.json  (key, inbox path, outbox path, packet_sha256, previous_non_pass, required_checks)
   - exit 0 = the section is DONE (every stage accepted). Stop and report.
   - exit 1 = STOP/ERROR: read the console, write what you saw in coordination/MUSE-SUBSCRIPTION-AUTHORING-REPORT.md, stop.
2. Read the inbox packet named in NEXT.json. It contains `request` = exactly what the Model API would have received: request.messages (system then user: the stage prompt, the bound inputs, output_conventions, lineage_to_copy, accepted_fact_statements, the handbook page text) and request.response_format.json_schema.schema (STRICT).
3. AUTHOR the artifact yourself: produce the JSON object that satisfies the schema strictly (every required key present, no additional keys, exact enums/types/lengths) and every output_convention stated in the user message. Every statement must come from the handbook page text inside the request; never invent facts, page numbers or ids. Copy lineage_to_copy values verbatim where the schema asks for them. If `previous_non_pass` is non-empty, those check ids failed on your previous attempt for this task: read tools/belt/checks/<stage file>.mjs (read-only) to see exactly what each check tests, and fix those.
4. Write the outbox file at the path NEXT.json gives (outbox), as:
   { "key": "<key from NEXT.json>", "packet_sha256": "<packet_sha256 from NEXT.json>", "authored_by": "muse-code/muse-spark-1.3 (subscription)", "artifact": { ...your JSON... } }
   Write it atomically (write to <outbox>.tmp then rename). Do not edit the inbox packet.
5. Run the step command again. The belt ingests your outbox through the normal validator/ledger path at $0 and prints
   `accepted` or `HOLD — <check ids>`; it moves your outbox to done/ and emits the next packet. Go to 2.

Budget/limits: each HOLD costs nothing in credit but counts against the lineage attempt cap (the runner resets lineages for you, up to 2 times per stage). Do not spend effort on 03/04/05/06 conventions you can read: the user message carries them. If the same check fails three times in a row, stop and report instead of looping.

Honesty: in the report, list each stage with attempts, HOLD check ids, and the ledger lines (`node tools/preview/ledger-tail.mjs 5` works against the default run; for this run read runs/2026-10-27-rdmv-ut-class-d-muse/ledger via the step output). Sandbox note: ledger exports need TMP/TEMP/SQLITE_TMPDIR pointed at a workspace dir.

Deliverable: coordination/MUSE-SUBSCRIPTION-AUTHORING-REPORT.md (≤ 60 lines): stages accepted, attempts per stage, what held and why, total credit spent (expected $0.000), what you could not verify. Commit nothing. Stop when sec01 is DONE or when blocked as above.
