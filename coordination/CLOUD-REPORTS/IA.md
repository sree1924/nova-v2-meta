# IA downstream — cloud session report (Claude, 2026-10-28)

Run `2026-10-28-rdmv-ia-class-c`, branch `cloud/ia-downstream`. All 17 sections DONE through 03 → 04 → 06 → 05.sessions → 05.card_scripts; belt exit 0; every one of the 85 downstream tasks accepted on its first dispatch (0 belt HOLDs, 0 retry nonces, 0 lineage resets other than the belt's proactive pre-authoring resets :78–:85; the one `blocked` attempt in the ledger is a pre-existing 02.dossier_sections row, not mine).

**Counts (ledger-accepted artifacts):** 630 KG nodes / 1036 edges / 75 modules; 628 cards + 75 recaps (2 merges); 630 exam items, 34 practice forms (2 per section, disjoint), 75 module quizzes; 75 teaching units / 528 slides; 703 card scripts (628 card + 75 recap). Per section: sec01 33 facts, sec02 27, sec03 44, sec04 47, sec05 31, sec06 43, sec07 31, sec08 42, sec09 44, sec10 43, sec11 23, sec12 42, sec13 42, sec14 31, sec15 33, sec16 46, sec17 28.

**Merges (back byte-locked to an accepted statement that cannot pass 04.DEICTIC_VISUAL; node, item and lesson citations kept):**
- sec03-F32 → card sec03-F27 ("this sign" in the statement)
- sec04-F07 → card sec04-F06 ("those signs" in the statement)

**Holds:** none on the belt. Precheck (read-only run of the stage check modules on the belt's own assembled context) and generator-side lints caught and I fixed before writing: a backward prerequisite edge in sec04 (F22→R10) and sec09 (F28→R16, node reordered), a 16-word node label in sec06-F22 and long labels in sec16/sec17, a single-fact unit whose narration fell under 520 chars (padding now draws on sibling-unit facts), and my own over-strict "official" guard that wrongly rejected sec05-F13 ("device or official"); reduced to the belt's four BANNED_ITEM patterns.

**Byte-locked spoken-number / wording defects in accepted registries (not altered):** sec06-R12, sec09-F16, sec10-F17, sec12-F11, sec12-F12, sec12-F22 lack a terminal period; sec11-F04 carries "321J point six" and sec11-F15 the literal "511ia.org" (digits), so their exam rationales use a digit-free restatement while card backs keep the bytes. Longest compound statements, each one card back: sec12-F24 (274 chars), sec09-F03, sec05-F11, sec16-F18.

**official_mirror:** every form copies the safe view exactly: question count, passing and time all `unknown`/null, passing_unit `unknown`, status NOT_APPLICABLE_PRACTICE_ONLY; no pass mark or count asserted anywhere in learner text. All item stems/options/rationales use spelled-out numbers (facts are status `authored`).

**Suspect Muse-authored facts noticed (flag, not verified):** sec14-F01 "ninety-four percent of serious crashes trace to human choices" (NHTSA figure, not obviously Iowa text); sec16-F09 "seventy-eight percent of truck-crash deaths"; sec16-F18 cabin "one hundred sixty degrees within ten minutes"; sec07-F20 "roughly two point eight percent" per blocked minute; sec04-F01 dates the conveyance law to "twenty twenty-four"; sec03-F05 cites the matching handbook page inside the statement. sec04-F22, sec09-F03 and sec10-F28 are list-style compound statements worth a page check.

**Not verified by me:** source entailment of any accepted statement against the handbook pages (07/08 audits remain pending); I authored only from the compiled registries and never altered a statement. Every "why", trap and misconception is a restatement of cited facts; narration padding is verbatim restatement ("Once more:", "In short:").

**Environment facts for the next cloud session:** `npm install` needed (dotenv); `MODEL_API_KEY=file-transport-no-key` on the command line only (no .env, no API call); factory pins from coordination/cloud/factory-workers-pins.zip unzipped to ../factory/workers (four hashes verified); private sources rebuilt byte-exact (PDF sha d63dc184…, text sha 9598d6b1…, receipt sha 45657378…) only after pinning pypdf 6.10.0 / pdfplumber 0.11.9 (pypdf 6.17 mismatched 3 of 68 page hashes); extractor needs a `C:/Users/varad/.../python.exe` symlink and the belt a `D:/nova/fb-ai-hackathon/...` symlink tree plus backslash-named links inside the run dir (all local-only, .git/info/exclude; note in jams.md). Scratch generators/specs lived in /tmp/ia-ds, never in the repo. No audio minted.

**Branch / commits:** cloud/ia-downstream, one commit per section (b61fbb720 … 817852f83) plus this report; pushed. **Ledger actual: $0.000** (239 reservations, all reported at $0; cap $60 untouched).
