CLOUD DOWNSTREAM PROMPT TEMPLATE — copy the whole block below into a new Claude cloud session on sree1924/nova-v2-meta after
replacing the three placeholders: {{ST}} (two-letter code, e.g. IA), {{RUN}} (run id, e.g. 2026-10-28-rdmv-ia-class-c),
{{N}} (section count, e.g. 17). Current targets: IA → 2026-10-28-rdmv-ia-class-c (17 sections); OK → 2026-10-28-rdmv-ok-class-d (13 sections).
Kentucky's session cost about $42 of cloud credit; budget accordingly.

----- paste from here -----
You are a Claude cloud session working in a fresh clone of github.com/sree1924/nova-v2-meta (branch main). This repo is the Nova DMV written-test prep lane for the Meta hackathon, separate from nova-fleet. Use paths relative to the repo root.

CONTEXT: a belt (tools/belt/run-utah.mjs) mints learner artifacts per handbook section through strict schema checks and a SQLite ledger. Authoring runs under a $0 "file transport": the belt emits a packet, you write an outbox JSON, the belt validates and accepts it. State {{ST}} (run_id {{RUN}}) has its SME dossiers and compiled fact registries (stages 02 and 16) accepted and committed, including the run's ledger at runs/{{RUN}}/ledger/run.sqlite. You own this run end to end for the DOWNSTREAM stages. Founder rules: zero wrong facts, cite-or-flag, honest labels, mint no audio, commit only inside the run dir. Kentucky was done this way already; coordination/CLOUD-REPORTS/KY.md is the model report.

SETUP (do all of it before the first belt step; none of it needs the founder):
1. `git pull origin main`, then `git checkout -b cloud/{{st}}-downstream` (lowercase code).
2. `node --version` must be 22.5 or newer (node:sqlite); otherwise install Node 22 (nvm install 22 && nvm use 22). Run `npm install` (the belt needs dotenv).
3. Parent-factory role contracts (verified by hash at ../factory/workers relative to the clone root): `mkdir -p ../factory/workers && unzip -o coordination/cloud/factory-workers-pins.zip -d ../factory/workers && sha256sum ../factory/workers/*.md` — expect 8c66430a… (03), ce0ce218… (04), 714aad6d… (05), 689fcac8… (06).
4. Private sources (gitignored, rebuilt locally): read the {{ST}} row in runs/_intake/QUEUE.json, `curl -L -A "Mozilla/5.0" -o runs/_intake/sources/private/{{ST}}.pdf "<handbook_url>"`, check `sha256sum` equals the row's sha256, copy it to the path named by runs/{{RUN}}/run-config.json scope.handbook_local_snapshot, then `node tools/belt/handbook-text.mjs runs/_intake/sources/private/{{ST}}.pdf --out runs/_intake/sources/private/{{ST}}-pages.txt` (pip install pypdf pdfplumber if asked). The registered page map must match the re-extraction; mismatch = stop and report.
5. Windows paths: some receipts embed absolute D:/nova/fb-ai-hackathon/... paths. If a step fails on such a path, create a local, git-ignored symlink so that path resolves to the clone root and retry. Never commit it.
6. Export MODEL_API_KEY=file-transport-no-key in the shell (the belt's key preflight; no provider is ever called under the file transport).

TASK: run DOWNSTREAM for ALL {{N}} sections of {{ST}}, in handbook order, stages 03 knowledge graph → 04 flashcards → 06 exam bank → 05.sessions (lessons) → 05.card_scripts (narration scripts). First read coordination/CLAUDE-DOWNSTREAM-WORKER-BRIEF.md and follow it exactly. Read each stage's check module once, read-only: tools/belt/checks/03-combined-kg.mjs, 04-cards.mjs, 06-exam-bank.mjs, 05-sessions.mjs, 05-card-scripts.mjs. Pre-check every outbox against the stage's check module before writing it. One step per command:

  node tools/belt/run-utah.mjs --run runs/{{RUN}} --author muse --packet thin --sections all --stages 03,04,06,05.sessions,05.card_scripts

exit 3 = a packet is waiting at runs/{{RUN}}/sources/private/muse-authoring/inbox/NEXT.json: read it (layers.state once, layers.section once per section, the small delta), author the artifact to the schema, write {"key","packet_sha256","authored_by":"claude (Anthropic cloud session, downstream worker)","artifact"} to the outbox path NEXT.json names (write .tmp then rename), re-run the command. exit 0 = all done. "--author muse" names the file-transport mode, not the author. The compiled registry per section is the one named in runs/{{RUN}}/16/<section>/CURRENT.json.

RULES:
- Card backs are byte-equal to the compiled statement. If an accepted statement cannot pass a 04 check (slash, +, #, *, "psi", glued units like "fifty-five-mph", a picture-pointing phrase, "the real exam"), do NOT alter it: record a MERGE of that node onto a sibling card in the same module (merges[] with a written justification) so the fact keeps its node, exam item and lesson citation.
- official_mirror copies safe_run_config.exam_facts exactly; unknown stays unknown; never assert a pass mark or question count.
- Exam items: 4 options keyed A–D, unique, each with a rationale; correct_rationale names the correct option; wrong options may use only numbers that appear in that section's facts; 2 practice forms per section with "practice" in the title and no digits.
- Lessons: 6–8 slides per unit, close slide last, narration 520–760 characters; narration and why/how spans may contain NO reasoning, definitions, numbers or claims that are not in the compiled registry (pad only by restating cited facts); every slide cites fact ids; lines[] per slide; no stage directions ("pause", "beat", "silence", "fade in").
- Card scripts: one per card plus recaps; must_match_card_back byte-equal to the card back; segments question / recall_pause_ms / answer / teaching / think_ref.
- The belt waives request-size and cost-estimate preflight under the file transport. If a dispatch still holds on size, raise limits.max_request_bytes in runs/{{RUN}}/run-config.json and add a JAM line to runs/{{RUN}}/jams.md (money caps unchanged).
- If a check fails twice, read the check source before the third try; three in a row → stop and report.
- Scratch helpers go in /tmp/{{st}}-ds, never in the repo. Never edit tools/belt, tools/roles, schemas-strict, prompts, contracts, app-preview or any other run. Mint no audio.

PERSISTENCE: after each section completes all five stages, `git add runs/{{RUN}}` (this includes the tracked ledger), commit on cloud/{{st}}-downstream, and push. Never commit anything outside that run dir except the usage ledger at the end: node tools/preview/worker-token-ledger.mjs --record '{"worker":"claude","model":"<your model id>","state":"{{ST}}","task":"cloud downstream all sections","tokens":<n>,"tool_uses":<n>,"duration_ms":<n>}' then commit coordination/claude-agent-usage.jsonl and coordination/WORKER-TOKEN-LEDGER.* and push.

FINAL REPORT (≤ 40 lines, also written to coordination/CLOUD-REPORTS/{{ST}}.md and committed): sections done per stage; counts (nodes, cards, items, units/slides, scripts); merges and why; holds with check ids; byte-locked spoken-number defects (fact ids); suspect Muse-authored facts you noticed; what you could not verify; branch and final commit; ledger actual (must read $0.000).
----- paste to here -----
