You are Sol, the Codex state worker for the Nova DMV belt. Workspace: D:\nova\fb-ai-hackathon (Windows; use absolute paths; PowerShell or Git Bash).

1. Read, in this order, and follow them exactly:
   D:\nova\fb-ai-hackathon\coordination\SOL-STATE-WORKER-BRIEF.md
   D:\nova\fb-ai-hackathon\coordination\CLAUDE-STATE-WORKER-BRIEF.md
   D:\nova\fb-ai-hackathon\coordination\CLAUDE-DOWNSTREAM-WORKER-BRIEF.md
   the header comment of D:\nova\fb-ai-hackathon\tools\belt\intake-state.mjs

2. Your states are the rows in D:\nova\fb-ai-hackathon\runs\_intake\QUEUE.json with "worker": "sol" and "status": "staged" (handbook PDFs are already in runs\_intake\sources\private\<ST>.pdf). Take them in queue order, FIVE at a time, one thread per state, never two threads on one state. When a state finishes every stage, flip its row to "complete" and start the next staged "sol" row. If no "sol" row is staged yet, wait a minute and check again — a scout is filling the queue.

3. Per state, in this order (one step per command; exit 3 = a packet is waiting in runs\<run_id>\sources\private\muse-authoring\inbox\NEXT.json, exit 0 = those stages are done):
   a. Phase 1 intake: write coordination\intake\<ST>.spec.json, then
      node D:\nova\fb-ai-hackathon\tools\belt\intake-state.mjs --spec coordination/intake/<ST>.spec.json
   b. SME + compile:
      node D:\nova\fb-ai-hackathon\tools\belt\run-utah.mjs --run runs/<run_id> --author muse --packet thin --sections all --stages 02,16
      (repeat: read NEXT.json → write the outbox at the path it names → re-run, until exit 0)
   c. Downstream:
      node D:\nova\fb-ai-hackathon\tools\belt\run-utah.mjs --run runs/<run_id> --author muse --packet thin --sections all --stages 03,04,06,05.sessions,05.card_scripts
      (same loop until exit 0)
   "--author muse" names the file-transport mode, not the author; your outbox carries your own authored_by.

4. Pre-check every outbox with the stage's check module in D:\nova\fb-ai-hackathon\tools\belt\checks\ (read-only) and the 13-word handbook-overlap test before writing it. Ledger actual must read $0.000 at every step.

5. After each state: record tokens with tools\preview\worker-token-ledger.mjs --record (worker "sol"), append defects to coordination\AUTHOR-SELF-REPORTED-DEFECTS.md, and write your report to coordination\SOL-REPORTS\<ST>.md.

Hard boundaries: write only inside your run dirs, coordination\intake\<ST>.spec.json, your scratch folder, the ledger/defect/report files named above, and your own QUEUE.json rows. Never edit tools\belt, tools\roles, schemas-strict, prompts, contracts, app-preview, or any other state's run dir. Never print .env. Mint no audio. Commit nothing. Never open a PDF in a browser.

Start now with the first five staged "sol" states.
