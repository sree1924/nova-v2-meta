STATE=NY

You are Muse Code, belt operator AND author under your subscription. Read AGENTS.md first. Founder order (2026-10-28): "do five states parallel... no audio minting until I say go". Your state for this launch is given on the first line of the prompt that follows this brief (STATE=XX). Do only that state.

Lane rules: never edit tools/belt/*, tools/roles/*, schemas-strict/*, prompts/*, contracts/*; never print .env; never call api.meta.ai yourself; mint no audio; commit nothing. You write: coordination/intake/<ST>.spec.json, the belt's authoring outboxes, and your report.

The five states and their staged official handbooks (retrieved by the runner, see runs/_intake/RETRIEVAL.json for url/time/issuer):
  TX runs/_intake/sources/private/TX.pdf  Texas Driver Handbook (DL-7)        Class C knowledge test     run_id 2026-10-28-rdmv-tx-class-c
  CA runs/_intake/sources/private/CA.pdf  California Driver's Handbook         Class C knowledge test     run_id 2026-10-28-rdmv-ca-class-c
  FL runs/_intake/sources/private/FL.pdf  Florida Driver License Handbook      Class E knowledge exam     run_id 2026-10-28-rdmv-fl-class-e
  NY runs/_intake/sources/private/NY.pdf  New York State Driver's Manual MV-21 Class D permit test       run_id 2026-10-28-rdmv-ny-class-d
  VA runs/_intake/sources/private/VA.pdf  Virginia Driver's Manual (DMV 39)    Class standard knowledge   run_id 2026-10-28-rdmv-va-class-std

PHASE 1 — INTAKE SPEC (read the handbook, write the spec; no model API, no guessing):
1. Extract the text: node D:\nova\fb-ai-hackathon\tools\belt\handbook-text.mjs runs/_intake/sources/private/<ST>.pdf --out runs/_intake/sources/private/<ST>-pages.txt   (private; never copy handbook text anywhere else). Use --grep "pass|percent|questions|correct" to locate the knowledge-test facts fast.
2. Section map: from the table of contents and the chapter headings, list the chapters a first-time applicant is tested on, in handbook order, as ids sec01-<kebab-topic> … each with its PHYSICAL PDF page numbers (the "PHYSICAL PDF PAGE n" header, not the printed page). Rules: 1–30 pages per section (split a long chapter into sec05a/sec05b style ids: sec05-xxx-part-1, sec05-xxx-part-2); skip covers, TOC, index, forms, commercial/motorcycle chapters; every page you include must be real handbook prose or rules. Aim for 10–18 sections.
3. Exam facts: find the page that states the knowledge test's passing score / question count (verbatim sentence + physical page + printed page). If the handbook does not state it, set value null and say so in the note — do NOT import it from memory.
4. Issuer page: fetch (curl) ONE official page on the issuer's own domain that links this exact handbook URL (issuer_page.url). Save in the spec: url, domains (e.g. ["dps.texas.gov"]), observed_at_utc, observed_statements (verbatim sentences about the test or permit, if any), and excerpt = the rendered text/HTML fragment that CONTAINS the exact handbook URL string. If no official page links the exact URL, use the handbook's own download URL page and say so.
5. visual_observation: the runner supplies coordination/intake/<ST>.visual.json (page-1 title/issuer/edition observed in a rendered viewer). Copy its object into your spec unchanged. If the file is missing, stop and report.
6. Write coordination/intake/<ST>.spec.json exactly in the shape documented at the top of tools/belt/intake-state.mjs (read that header). handbook_pdf = the staged path; retrieved_at_utc and handbook_url from RETRIEVAL.json; state/jurisdiction/issuing_authority/license class from the table above (refine the issuer name from the handbook cover if it differs).
7. Seed the run: node D:\nova\fb-ai-hackathon\tools\belt\intake-state.mjs --spec coordination/intake/<ST>.spec.json
   Exit 0 = registered. If it fails, read the error, fix the spec (not the tool), re-run after deleting runs/<run_id>/ with: node -e "require('fs').rmSync('runs/<run_id>',{recursive:true,force:true})". Three failures → stop and report.

PHASE 2 — SME DOSSIERS + COMPILE under the subscription (stages 02 and 16 only; NO 03/04/05/06 this launch):
   node D:\nova\fb-ai-hackathon\tools\belt\run-utah.mjs --run runs/<run_id> --author muse --sections all --stages 02,16
   The loop is the one you know from coordination/MUSE-SUBSCRIPTION-AUTHORING-BRIEF.md: exit 3 = a packet is waiting at runs/<run_id>/sources/private/muse-authoring/inbox/NEXT.json → author the artifact strictly to the packet's schema + conventions from the handbook text in the packet → write the outbox → re-run the command. Repeat until exit 0 (all sections DONE through compile) or you are blocked. Report every HOLD check id. Never two authoring commands at once for the same run.

Report: coordination/MUSE-INTAKE-<ST>-REPORT.md (≤ 60 lines): section map table (id, title, pages), exam facts with page + verbatim, issuer page used, intake result, sections DONE through 16.compile, holds, what you could not verify. Ledger actual must read $0.000 throughout. Stop when done.
