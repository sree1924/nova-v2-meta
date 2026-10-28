# Author self-reported defects (accepted by validators, flagged by the author for the fix pass)

The belt's checks grade structure, citations, numerals and lineage; they cannot see a wrong cross-reference label or a softened
claim. Workers are told to report what they know is off. Fix pass = re-author the part under a new lineage; never hand-edit.

| date | state | section/part | defect | reported by |
|---|---|---|---|---|
| 2026-10-28 | MI | sec01 part C, high_yield_ranked | several entries reference neighboring fact ids (off by one; e.g. "convert or TIP" → F30/F31 instead of F31/F32); ids exist so the check passed | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec04 fact F18 | "can each hold" the same alcohol vs handbook "all contain the same amount" — slight softening | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec01 part E | debt id "sec01-E-MARKET" contains digits in a no-digits part (accepted; sec02+ use digit-free ids) | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec02 confusable R10 | mentions under-21 limits from p37 while citing only p36 (one-page-per-fact bent) | claude-opus-5-5 worker |
| 2026-10-28 | NJ | intake | registrar footer crop assumed a (0,0) page box; NJ pages carry an offset box → extraction crashed; fixed in tools/roles/15-register.mjs (crop relative to bbox, timeout 15 min) | claude-opus-5-5 worker (found), runner (fixed) |
| 2026-10-28 | NC | sec05 fact F30 | two claims in one FACT block (suspension on court report + hearing right) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec06 part E | "common source of confusion" is an unsourced observation (labelled handbook-only) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec07 title | section title mentions funerals; funeral-procession rules (p54) are authored in sec08 | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec09 part D | note claims p58 material "is printed on p59" from extracted text only, page not seen | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec10 / sec11 boundary | p67 headlight/taillight/plate-light rules authored in sec10; sec11 must not re-author them | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec13 part G | domain label "Safe driving, freeways, weather and braking" vs C/C2 label "Safe driving, intersections and freeways" (content right, label inconsistent) | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec10, sec11 needs_dedicated_surface | picture sign drill / diagram drill are the author's product judgement, not handbook statements | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec09 C2 | a few comparison lines lean on mild inference (e.g. "not simply to whoever parked it") | claude-opus-5-5 worker |
| 2026-10-28 | MI | sec10 | sign meanings taken from answer text; sign pictures are not in extracted text | claude-opus-5-5 worker |
| 2026-10-28 | CO | sec12 facts F33–F40 | sourced from an old-format spread embedded on p23 (printed 29/30); current p24 text differs ("serious legal consequences" vs specific penalties); debts sec12-D-C01/C02 | claude-opus-5-5 worker |
| 2026-10-28 | CO | p25, p27 tables | handbook tables mix "bicyclist"/"motorcyclist"; restated for bicyclists only, noted in part D | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec15 C dynamic line + F note | "set locally / posted on site" for school-zone speed cuts is the author's inference | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec11 part D | fuel-saving bullets cited to p69 (A02); most are on p70 (facts cite correctly) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec15 vs sec10 | railroad signs taught twice (new wording in sec15) | claude-opus-5-5 worker |
| 2026-10-28 | NC | sec12 C2 R01 | "only when a sign lists it" — handbook does not say "only" | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec14 fact F37 (p182) | ties the supervisor request to disagreeing with an officer; guide ties it to concerns about conduct (R09 states it correctly) — re-author | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec14 glossary | "tourniquet" definition is general knowledge, not printed on p177 | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec14 R01, sec12 R10, sec13 F34 | added comparison / "left turn" paraphrase / "stomping" paraphrase not in the guide's words | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec12, sec10 memory aids | mnemonic invented; line-rule aid simplifies (center-turn-lane crossing covered by F15) | claude-opus-5-5 worker |
| 2026-10-28 | WA | sec10 C n0 | 02.LINEAGE hold caused by the exam_facts config migration mid-run (expected rebind); n1 accepted | runner |
| 2026-10-28 | NJ | sec04 C (p44) | youngest-child car-seat rule kept in the manual's own ambiguous wording ("under age two and those...") — debt NJ-BELT-D-UNDERTWO | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec05 (p55) | deceleration "about 14 feet per second" repeated as printed (not a deceleration unit) — NJ-CTRL-D-DECEL | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec06 (p64) | speed-limit graphic extracted as alternating lines; road-type pairing needs a rendered-page check — NJ-ROAD-D-LIMITS | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec04 C / sec08 C2 | idling fact repeated from two pages (52, 101) in different words | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec09–sec14 part E | unsourced audience lines ("new drivers and parents often fear...") labelled manual-only observation; corrected only in sec15 | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec10 C glossary | defines "ignition interlock" before its own pages do (definition is p129 in sec11) | claude-opus-5-5 worker |
| 2026-10-28 | NJ | sec12 | Notice of Scheduled Suspension "12 to 14 points within 24 months" kept as the manual's ambiguous wording — NJ-PTS-D-NOTICE | claude-opus-5-5 worker |
| 2026-10-28 | NJ | pp116/117 | drink graphic says 86 proof, body text 80 proof — NJ-DUI-D-PROOF (nothing taught) | claude-opus-5-5 worker |
| 2026-10-28 | IN | p15 vs p16 | manual contradicts itself on phone use (any device banned vs texting/email only unless hands-free) — IN-LICENSE-D-PHONE | claude-opus-5-5 worker |
| 2026-10-28 | IN | p18 vs p10 | restriction code J means two different things — IN-RESTRICT-D-JCODE | claude-opus-5-5 worker |
| 2026-10-28 | IN | intake | edition "Published July 2026" is on the back cover (p84); registrar accepted edition only from page 1 → liveness VERIFICATION_DEBT; registrar relaxed (front matter 1–12 or last 3 pages) for states registered after 05:35Z | claude-opus-5-5 worker (found), runner (fixed) |
| 2026-10-28 | MI | sec04 F42, sec13 F04 (compiler) | accepted wording contains a URL slash ("Michigan.gov/NewDrivers"); compile.mjs spokenize emits no spoken form → 04.BACK_FIDELITY vs 04.BACK_SPOKEN_FORM cannot both pass; sec04 cards blocked until the compiler is fixed and the section recompiled | claude-opus-5-5 downstream worker |
| 2026-10-28 | MI | sec02 F25, sec03 F37 | spokenize turned "Michigan.gov/SOS" into "Michigan.gov or SOS"; cards repeat it (accepted) — re-author after the compiler fix | claude-opus-5-5 downstream worker |
| 2026-10-28 | MI | sec05 F25 vs F29/R06 | car-seat rule stated as "under 8 OR under 4'9\"" vs "until 8 or 4'9\", whichever first"; no exam item depends on it | claude-opus-5-5 downstream worker |
| 2026-10-28 | MI | sec02 decks | module titles carry digits ("Level 1/2/3"); quizzes given digit-free titles | claude-opus-5-5 downstream worker |
| 2026-10-28 | MI | card scripts | audience set to "Adult" by the author's choice (inputs did not specify) | claude-opus-5-5 downstream worker |
