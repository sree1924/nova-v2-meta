
## JAM-UT-01 — 2026-10-27 ~09:55 MDT — first live dispatch consumed an attempt without a request
- Stage 02.dossier_sections / sec09-rules-of-the-road, founder approval GO-02.dossier_sections-2026-10-27T15-50-14-875Z.json (sha 3c8c1995…).
- Observed: dispatch returned HOLD unknown_provider_result; ledger model_calls row status unknown_provider_result, usage null; reservation $1.000000 parked in state unknown_provider_result; attempt_6401f7d6… status unknown_provider_result. NO HTTP request was sent: meta-client.mjs throws "MODEL_API_KEY is absent." at line 17, before the fetch at line 27; the runner shell had no MODEL_API_KEY in process.env (controller does not load .env; owner smoke/probe scripts do via dotenv).
- Retry with the key exported → HOLD unknown_provider_result_requires_reconciliation (dispatch.mjs:146-148). Correct per C25, but no operator reconciliation path exists for an attempt (controller `recover` is run-ownership only).
- Cost: $0 actual. Attempts: 1 of 2 consumed on this logical task.
- Asks of the builder (Sol): (1) preflight must HOLD before reserving/creating an attempt when the key env var is absent (or load .env explicitly); (2) the dispatcher catch around client.complete must classify pre-send exceptions (config/key/policy) as `failed_pre_send` with the reservation released, never as unknown_provider_result — only a thrown transport() counts as unknown; (3) add `reconcile-attempt --attempt <id> --proof <file> --proof-sha256 <sha>` accepting an operator proof {no_request_sent:true, evidence: client throw site + env state} → attempt failed_no_request, reservation released, event appended; (4) consider whether a no-request attempt should count against max_automatic_attempts (it should not).
- Runner state: run-config disarmed; approval artifact remains valid until 21:50Z; lock free.

## JAM-UT-02 — 2026-10-27 ~10:20 MDT — first real Meta call truncated by the output cap
- Attempt aafbd5e9… (task e7d48837…): HTTP 200, muse-spark-1.3, 25.2 s, prompt 56,264 tok, completion 8,000 tok of which 6,453 reasoning (reasoning_effort low), finish_reason=length, $0.104. Content stopped mid `sections[0]`.
- Cause: run-config limits.max_completion_tokens 8000 — reasoning tokens count against it. Fix: 30000 (≈ $0.20/call worst case).
- Side finding: the model chose `envelope_scope.kind: partial_chunk` with assigned_section_ids ["C"] on its own; the controller currently sends one call per --section; chunk plan vs. single-call dossier needs the builder's decision (S5).
- Lineage: two attempts on lineage 1 both operator errors (JAM-UT-01 env, JAM-UT-02 cap) → C28 cap hit → founder-authorized lineage reset to lineage:2 recorded at receipts/lineage-reset-02-lineage2.json.
- Prompt is 56k tokens with cached_tokens 0: consider prompt caching / trimming the master SME template for later stages (cost, not correctness).

## JAM-UT-03 — 2026-10-27 ~11:50 MDT — lineage 3 exhausted; whole-dossier single calls oscillate
- L3#1 (attempt 33c0cd30): HTTP 200, $0.104, 21.6 KB; C 16 facts/4538cp; HOLD: SCOPE_COMPLETENESS (partial_chunk but all nine sections), FACT_LINES_CITED (A exam fact uncited + G bookkeeping numerals), G_MATRIX (wrong line refs). 17/20.
- L3#2 (attempt 8cdf5afb): HTTP 200, $0.140, 13.4 KB; complete_dossier; C 11 facts/2619cp; B/C2/D/E/E2/F/G one-line stubs → TRUNCATION_GUARD, DEPTH_FLOOR, G_MATRIX. 17/20. Reasoning tokens 12,018 at reasoning_effort low.
- Pattern across L2#1, L3#1, L3#2: section C is consistently substantive; asking for all nine parts in one call degrades the rest. Design change (stop rule): dispatch one dossier part per call (`--part C` first), merge with mergeEnvelopes (role 16). Conventions rule `assigned_dossier_parts` added; dispatch/controller `--part` plumbing added by the runner.
- Spend to date: 6 live calls, ≈ $0.55 total.

- 2026-10-27T16:50:27.670Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:5 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:04:12.234Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:6 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:04:30.471Z retry nonce 02.dossier_sections:C2 → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL

- 2026-10-27T17:05:06.770Z retry nonce 02.dossier_sections:C2 → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL

- 2026-10-27T17:05:06.855Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:7 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.MERGE_DETERMINISTIC=FAIL,02.HIGH_YIELD_PER_DOMAIN=FAIL

- 2026-10-27T17:05:24.271Z retry nonce 02.dossier_sections:C2 → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.FACT_LINES_CITED=FAIL, 02.HIGH_YIELD_PER_DOMAIN=FAIL

- 2026-10-27T17:05:46.451Z retry nonce 02.dossier_sections:C2 → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL

- 2026-10-27T17:14:57.970Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:8 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:15:58.161Z retry nonce 02.dossier_sections:C → 1 after HOLD (sec09-rules-of-the-road); non-PASS: unknown_provider_result

- 2026-10-27T17:26:00Z lost-response reconciliation attempt_c6d99687 (02 part C, lineage 8): client timeout 60 s after send; charge assumed $1.00 (reserve); proof receipts/attempt-reconciliation-c6d99687-lost-response.json; fix = 240 s timeout + runner auto-reconcile (commit 14f6122)

- 2026-10-27T17:25:33.565Z retry nonce 02.dossier_sections:C2 → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:25:33.661Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:9 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:26:34.472Z retry nonce 02.dossier_sections:A → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.DEPTH_FLOOR=FAIL

- 2026-10-27T17:26:34.571Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:10 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.MERGE_DETERMINISTIC=FAIL,02.DEPTH_FLOOR=FAIL

- 2026-10-27T17:26:53.916Z retry nonce 02.dossier_sections:A → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 02.DEPTH_FLOOR=FAIL

- 2026-10-27T17:27:15.305Z retry nonce 02.dossier_sections:A → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 02.DEDICATED_SURFACE=FAIL, 02.DEPTH_FLOOR=FAIL

- 2026-10-27T17:27:15.387Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:11 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.DEDICATED_SURFACE=FAIL,02.DEPTH_FLOOR=FAIL

- 2026-10-27T17:27:47.044Z retry nonce 02.dossier_sections:A → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL

- 2026-10-27T17:28:13.425Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:12 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:28:30.937Z retry nonce 02.dossier_sections:B → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL

- 2026-10-27T17:28:45.400Z retry nonce 02.dossier_sections:B → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL, 02.CORPUS_STABILITY=FAIL

- 2026-10-27T17:28:45.485Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:13 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.MERGE_DETERMINISTIC=FAIL,02.DEDICATED_SURFACE=FAIL,02.CORPUS_STABILITY=FAIL

- 2026-10-27T17:28:59.985Z retry nonce 02.dossier_sections:B → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL

- 2026-10-27T17:29:18.167Z retry nonce 02.dossier_sections:B → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MERGE_DETERMINISTIC=FAIL, 02.DEDICATED_SURFACE=FAIL

- 2026-10-27T17:31:51.048Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:14 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:32:06.737Z retry nonce 02.dossier_sections:B → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:32:24.176Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:15 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:32:59.350Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:16 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:33:22.146Z retry nonce 02.dossier_sections:E2 → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:33:41.026Z retry nonce 02.dossier_sections:E2 → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:33:41.114Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:17 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:33:57.836Z retry nonce 02.dossier_sections:E2 → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T17:34:10.962Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:18 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T17:34:51.081Z retry nonce 02.dossier_sections:G → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T17:34:51.180Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:19 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T17:35:18.970Z retry nonce 02.dossier_sections:G → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T17:35:47.415Z retry nonce 02.dossier_sections:G → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T17:35:47.504Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:20 for 02.dossier_sections (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T17:36:15.563Z retry nonce 02.dossier_sections:G → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 02.MARKET_SIGNAL=FAIL, 02.G_MATRIX=FAIL

- 2026-10-27T17:45:20.610Z retry nonce 03.combined_kg: → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 03.LINEAGE=FAIL

- 2026-10-27T17:46:20.247Z retry nonce 03.combined_kg: → 2 after HOLD (sec09-rules-of-the-road); non-PASS: HOLD

- 2026-10-27T17:46:20.350Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:21 for 03.combined_kg (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: HOLD

- 2026-10-27T17:47:20.891Z retry nonce 03.combined_kg: → 3 after HOLD (sec09-rules-of-the-road); non-PASS: HOLD

- 2026-10-27T17:48:23.544Z retry nonce 03.combined_kg: → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 03.KG01_GAPS=FAIL

- 2026-10-27T17:48:23.683Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:22 for 03.combined_kg (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.KG01_GAPS=FAIL

- 2026-10-27T17:49:22.144Z retry nonce 03.combined_kg: → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 03.KG01_GAPS=FAIL

- 2026-10-27T17:50:17.686Z retry nonce 03.combined_kg: → 6 after HOLD (sec09-rules-of-the-road); non-PASS: HOLD

- 2026-10-27T17:59:00Z crashed-attempt reconciliation attempt_b473c3dd (16.compile, lineage 22): second compile identity after lineage reset collided with the immutable compiled dossier; $0; proof receipts/attempt-reconciliation-b473c3dd-crashed.json; fix = cross-lineage compile reuse by input_manifest_sha256 + try/catch in run-utah

- 2026-10-27T17:56:23.431Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:23 for 03.combined_kg (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T18:01:46.582Z retry nonce 04.cards: → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:02:30.676Z retry nonce 04.cards: → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:02:30.780Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:24 for 04.cards (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:03:17.609Z retry nonce 04.cards: → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:04:00.652Z retry nonce 04.cards: → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:04:00.776Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:25 for 04.cards (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:04:43.412Z retry nonce 04.cards: → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:05:25.417Z retry nonce 04.cards: → 6 after HOLD (sec09-rules-of-the-road); non-PASS: 04.BACK_FIDELITY=FAIL

- 2026-10-27T18:07:00Z 16 recompiled under 16/cb74264f/ (compiler fix: scaffold lines + " ." in 15 C2 statements; all 39 statements now spoken-form clean); supersedes the 17:44Z compile for downstream context; 04 failed 6x BACK_FIDELITY against the old wording ($0.85)

- 2026-10-27T18:07:55.906Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:26 for 04.cards (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T18:14:34.188Z retry nonce 06.exam_bank: → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:15:44.540Z retry nonce 06.exam_bank: → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:15:44.648Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:27 for 06.exam_bank (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 06.OPTIONS_SHAPE=FAIL,06.ANSWER_RATIONALE_AGREEMENT=FAIL,06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:16:56.363Z retry nonce 06.exam_bank: → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:18:10.174Z retry nonce 06.exam_bank: → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:18:10.291Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:28 for 06.exam_bank (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:18:43.903Z retry nonce 06.exam_bank: → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL, 06.MODULE_QUIZ_COVERAGE=FAIL

- 2026-10-27T18:20:06.386Z retry nonce 06.exam_bank: → 6 after HOLD (sec09-rules-of-the-road); non-PASS: 06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL, 06.OFFICIAL_MIRROR=FAIL

- 2026-10-27T18:22:26.059Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:29 for 06.exam_bank (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T18:23:29.966Z retry nonce 06.exam_bank: → 7 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ANSWER_RATIONALE_AGREEMENT=FAIL

- 2026-10-27T18:24:13.061Z retry nonce 06.exam_bank: → 8 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ID_INTEGRITY=FAIL, 06.OPTIONS_SHAPE=FAIL, 06.ANSWER_RATIONALE_AGREEMENT=FAIL

- 2026-10-27T18:24:13.172Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:30 for 06.exam_bank (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 06.ID_INTEGRITY=FAIL,06.OPTIONS_SHAPE=FAIL,06.ANSWER_RATIONALE_AGREEMENT=FAIL

- 2026-10-27T18:25:21.147Z retry nonce 06.exam_bank: → 9 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ANSWER_RATIONALE_AGREEMENT=FAIL

- 2026-10-27T18:26:28.678Z retry nonce 06.exam_bank: → 10 after HOLD (sec09-rules-of-the-road); non-PASS: 06.ANSWER_RATIONALE_AGREEMENT=FAIL

- 2026-10-27T18:31:02.956Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:31 for 06.exam_bank (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T18:32:40.158Z retry nonce 05.sessions: → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SLIDE_ARC=FAIL, 05.SELF_CHECK_ALIGNED=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:33:14.958Z retry nonce 05.sessions: → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SLIDE_COUNT=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:33:15.076Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:32 for 05.sessions (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.SLIDE_COUNT=FAIL,05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:33:51.043Z retry nonce 05.sessions: → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SLIDE_COUNT=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:34:20.011Z retry nonce 05.sessions: → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:34:20.138Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:33 for 05.sessions (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:34:47.888Z retry nonce 05.sessions: → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:35:19.204Z retry nonce 05.sessions: → 6 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SELF_CHECK_ALIGNED=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T18:40:17.274Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:34 for 05.sessions (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T18:40:49.347Z retry nonce 05.sessions: → 7 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SLIDE_ARC=FAIL, 05.NARRATION_DEPTH=FAIL

- 2026-10-27T18:42:16.128Z retry nonce 05.card_scripts: → 1 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:43:10.925Z retry nonce 05.card_scripts: → 2 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:43:11.038Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:35 for 05.card_scripts (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:44:08.569Z retry nonce 05.card_scripts: → 3 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:45:03.322Z retry nonce 05.card_scripts: → 4 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:45:03.462Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:36 for 05.card_scripts (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:46:01.873Z retry nonce 05.card_scripts: → 5 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:47:01.539Z retry nonce 05.card_scripts: → 6 after HOLD (sec09-rules-of-the-road); non-PASS: 05.SEGMENT_ORDER=FAIL

- 2026-10-27T18:53:53.265Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:37 for 05.card_scripts (sec09-rules-of-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:23:49.870Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:38 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:24:21.964Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:39 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:24:49.794Z retry nonce 02.dossier_sections:E@sec01-definitions → 1 after HOLD (sec01-definitions); non-PASS: 02.CORPUS_STABILITY=FAIL

- 2026-10-27T19:24:49.888Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:40 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.CORPUS_STABILITY=FAIL

- 2026-10-27T19:25:16.913Z retry nonce 02.dossier_sections:E2@sec01-definitions → 1 after HOLD (sec01-definitions); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:25:17.165Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:41 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:25:46.143Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:42 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:26:08.513Z retry nonce 02.dossier_sections:G@sec01-definitions → 1 after HOLD (sec01-definitions); non-PASS: 02.DEBT_TYPED=FAIL

- 2026-10-27T19:26:24.743Z retry nonce 02.dossier_sections:G@sec01-definitions → 2 after HOLD (sec01-definitions); non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T19:26:24.887Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:43 for 02.dossier_sections (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T19:26:45.644Z retry nonce 02.dossier_sections:G@sec01-definitions → 3 after HOLD (sec01-definitions); non-PASS: 02.G_MATRIX=FAIL

- 2026-10-27T19:27:09.969Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:44 for 02.dossier_sections (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:28:20.391Z retry nonce 02.dossier_sections:C2@sec02-licensing-requirements → 1 after HOLD (sec02-licensing-requirements); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:28:20.476Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:45 for 02.dossier_sections (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:29:09.967Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:46 for 02.dossier_sections (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 
