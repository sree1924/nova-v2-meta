Sol — FACT FIX pass (founder, 2026-10-29: "fix the error"). Apply Muse's confirmed corrections through the belt. Never patch an accepted artifact or a shell file in place.

INPUT: coordination/FACT-CHECK/<ST>/corrections.json, one per state, from tools/audit/muse-recheck.mjs. Each entry has section, fact_id, kind, corrected_statement, correct_pdf_page and note.
- kind MEANING: the statement is wrong or incomplete. Its cards are already hidden at the point of sale.
- kind CITATION: the statement is right, but it cites the wrong page.
- kind OK: the first-pass flag was a false alarm. Ignore it.
The private evidence quotes are in runs/<run>/sources/private/audits/muse-recheck/.

ORDER: the 4 CONTRADICTED first (FL sec05-R07, NY sec10-R02, CT sec10-R04, CT sec11-R10; see coordination/FACT-CHECK/TRIAGE.md). Then states by MEANING count, highest first. One writer per run: claim with "SOL FACTFIX IN PROGRESS <ISO>" at the top of runs/<run>/jams.md, and remove it when done.

PER SECTION:
1. Re-author the 02 dossier part (C or C2) that holds the fact.
   - MEANING: rewrite the FACT block from corrected_statement, in your own words (no more than 12 consecutive words identical to the handbook). Anchor it on correct_pdf_page.
   - CITATION: change only the anchor and page; the wording stays.
   Use the belt's normal path: retry-nonce bump for that 02 part, run-utah --executor-id <id> --author muse --packet thin --stages 02 --parts <part> --remint 02.dossier_sections --sections <id>. Add a JAM line naming the fact ids.
2. Recompile 16 for the section (--stages 16). The runner moves CURRENT.json.
3. Re-mint 04.cards and 05.card_scripts for the section (nonce bump + --remint), so changed backs carry the new statement byte for byte.
4. Check every 06 exam item and 05.sessions slide that cites a MEANING fact id. If its wording states the old, wrong claim, re-mint that stage for the section the same way. If it only cites the id, leave it.
5. Re-check the section with Muse: node tools/audit/muse-fact-check.mjs --state XX --section <id>. When the fixed facts come back SUPPORTED, set "applied": true on those entries in corrections.json. That lifts their hold.
6. Tell the founder (or Fable from Saturday) which states are done. The coordinator rebuilds the shell with node tools/preview/rebuild-shell.mjs, which must exit 0 with 51/51.

INDEPENDENCE: the ten Muse-written states (UT TX CA FL VA NY CT KY IA OK) are fixed by you, not by Muse. The re-check in step 5 is labeled not independent for them.

RULES: never edit tools/belt, schemas, contracts or prompts without a founder-ACKed write barrier. No audio. No API spend except the step-5 re-checks (about $0.03 per section). Report each state to coordination/SOL-REPORTS/FACTFIX-<ST>.md: facts fixed, citations corrected, re-mints done, the re-check result, anything left open.
