POST-STOP AMENDMENT — 2026-10-28. All Sol state authoring is STOPPED by founder order; this brief grants no resume. Future explicitly authorized runs follow D:/nova/AMENDMENT-ORDER-2026-10-28-sol-reauthor-reliability.md and the appended THE-BELT reliability rules. These supersede older unsafe helper/default/retry instructions below.

- Intake is plan-first: supply current_authority_ref {path,sha256}, matching explicit founder state_selection/evidence, actual_author, authoring_mode, actual visual observer identity and --executor-id. Optional standing_authority_ref must be genuine and scoped to the new run. No invented model, founder quotation or inherited Utah learning-loop probe. Transport provider/model/pricing remain separate from the actual author.
- For source_origin.kind official_web_assembly, provide collection_url, exact local_pdf_sha256, provenance_ref and real issuer domains. Preserve chapter URLs/hashes/page map, use null single-document retrieval and unknown official examination facts; no fake direct-download/current-edition receipt.
- Source registration returns legacy assessment status separately from native_acceptance. Require exact current native structural acceptance and policy-pin evidence; neither exit0 nor an old accepted registry proves a fresh revision accepted. Preserve assessment debt.
- Runner calls require explicit --executor-id and --author muse (thin/authentic native file transport). No API key is needed for the authenticated native file transport. --max-resets accepts only0; real HOLD/exception/stale pins/uncertain work stops. Accepted-only capacity advancement uses the existing immutable-cause native path, never failed resets.
- Before calling an authoring package clean or asking root to flip its row, report exact deterministic card/merged/high-yield node-to-item coverage and current card/script/visual-sync parity. Use tools/belt/completion-coverage.mjs through the current native accepted context; 07 now recomputes that join. Native06PASS is insufficient. No general typed assessment-gap waiver currently exists in the strict schema: missing required coverage is a reported FAIL, not an invented coverage_gaps field or blanket quarantine exception.
- Official-source disagreements require preserved debt and evidence reconciliation. Do not create a clinical/legal human gate without the actual legal/policy basis. Source/clinical/legal flags are never cleared by speech repair. Precheck originality and numeric units before submission; a discovered accepted defect uses a genuine immutable replacement plus affected descendants.
- Worker reports/private handoffs preserve actual usage evidence and proposed defect rows; ROOT alone mutates shared runtime/QUEUE/usage/defect logs. ROOT flips only its own row after verified completion. Fable alone onboards; report+row handoff remains the boundary.

SOL STATE WORKER — Codex (ChatGPT Pro subscription) authoring whole states through the Nova belt. Founder, 2026-10-28:
"have Sol pick up a bunch… 10 states not started… 5 threads SME… fill the queue as it's available." You own each of your
states END TO END: intake → SME dossiers + compile (stages 02, 16) → downstream (03 knowledge graph, 04 flashcards, 06 exam bank,
05.sessions, 05.card_scripts). Same belt, same validators, same ledger as the Muse-authored and Claude-authored states; the
only differences are who writes the JSON and the `authored_by` label. Workspace D:\nova\fb-ai-hackathon, absolute paths.

YOUR STATES: the rows in runs/_intake/QUEUE.json with "worker": "sol" and status "staged" (handbooks already downloaded to
runs/_intake/sources/private/<ST>.pdf by the scout; provenance in each row). Take them in queue order, FIVE at a time, one
thread per state; when a state finishes all stages, start the next staged "sol" state. Never two threads on one state.

READ FIRST (they are the contract; follow them exactly, substituting your label):
  1. coordination/CLAUDE-STATE-WORKER-BRIEF.md   — Phase 1 intake spec + Phase 2 SME (stages 02,16), thin packets, hints H1–H8.
  2. coordination/CLAUDE-DOWNSTREAM-WORKER-BRIEF.md — stages 03/04/06/05.sessions/05.card_scripts, Utah hold hints.
  3. tools/belt/intake-state.mjs header (spec shape), tools/belt/checks/*.mjs (read-only; pre-check every outbox with them).

DELTAS FOR SOL (everything else as in those briefs):
  - authored_by on every outbox: "<your exact Codex model id> (ChatGPT Pro subscription, Sol state worker)". Never claim Claude or Muse.
  - Visual observation actor fields in the intake spec: actor_id "<model id> (Sol state worker)", provider_family "openai".
  - EDITION IS LOAD-BEARING (brief §5): pick the observation page that carries title + issuer + edition; without an edition the
    state's exam facts can never be asserted downstream. Image-only covers: say so; liveness then stays debt (honest).
  - Exam facts: verified only with the verbatim sentence + physical page; unknown ⇒ value null AND source_page null. Downstream
    official_mirror copies safe_run_config.exam_facts exactly; never hand-assert a pass mark or count.
  - Generated parts (A B D E E2 F G) may come from a script you write; C and C2 are ALWAYS written by you from the section's pages
    (one fact per block, one cited page, your own words, ≤ 12 consecutive words identical to the handbook, < 12,000 code points
    per chunk — split facts between C and C2, never drop them). Image-only content = typed debt, never a fact.
  - Lesson slides, teaching lines and why/how spans may contain NO reasoning, definitions, numbers or claims that are not in the
    compiled registry; pad narration only by restating cited facts. Nothing checks this automatically — it is on you.
  - Card backs are byte-equal to the compiled statement. If an accepted statement cannot pass a 04 check (slash, "+", "#", "psi",
    a picture-pointing phrase), do NOT alter it: record a MERGE onto a sibling card in the same module (merges[] with a written
    justification; see an accepted 04 artifact of Oregon sec06 or New Jersey sec01 for the shape). The fact keeps its node, exam
    item and lesson citation.
  - Dispatch preflight may refuse a large 05.card_scripts request on limits.max_request_bytes (640000) even though file transport
    costs $0. You may raise limits.max_request_bytes in YOUR run's run-config.json (New Jersey went to 800000; Missouri 700000),
    leave every money cap unchanged, and record a JAM line in runs/<run>/jams.md ("revert before any Model-API dispatch").
  - "Error: UNKNOWN … open run-config.json" = Windows file lock under concurrency; re-run the same step.
  - A step that is refused with LINEAGE_RESET means the belt reset the lineage between emit and ingest: re-run the step, re-author
    the SAME part from the fresh packet (copy lineage_to_copy verbatim), submit again.
  - Tokens: after each state (or each half), record your usage:
      node D:\nova\fb-ai-hackathon\tools\preview\worker-token-ledger.mjs --record '{"worker":"sol","model":"<model id>","state":"<ST>","task":"<what>","tokens":<n>,"tool_uses":<n>,"duration_ms":<n>}'
    (tokens = your session's total for that task as your client reports it; say "estimated" in task if it is).
  - Defects you notice (handbook contradictions, garbled extraction, your own wording drift) → append a row to
    coordination/AUTHOR-SELF-REPORTED-DEFECTS.md: | date | ST | where | what | <model id> Sol worker |

BOUNDARIES (hard): write only inside runs/<your run_id>/, coordination/intake/<ST>.spec.json, your own scratch folder, the ledger
rows and defect rows above. Never edit tools/belt/*, tools/roles/*, schemas-strict/*, prompts/*, contracts/*, app-preview/*,
other states' run dirs, or QUEUE.json rows that are not yours (you may flip your own row's status to "in_progress"/"complete").
Never print .env. Mint no audio. Commit nothing. Do not navigate any browser to a PDF.

REPORT per state (≤ 40 lines, to coordination/SOL-REPORTS/<ST>.md): sections mapped (id, title, pages), exam facts with page +
verbatim, liveness status, sections DONE per stage with counts (facts C/C2; nodes, cards, items, units/slides, scripts), merges and
why, holds with check ids, defects, what you could not verify, ledger actual (must read $0.000). Claude onboards finished states
into the shell from the ledger; you do not touch app-preview.
