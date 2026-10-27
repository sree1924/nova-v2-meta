
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

- 2026-10-27T19:29:37.759Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:47 for 02.dossier_sections (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:30:06.017Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:48 for 02.dossier_sections (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:31:17.739Z retry nonce 04.cards:@sec02-licensing-requirements → 1 after HOLD (sec02-licensing-requirements); non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:31:33.762Z retry nonce 04.cards:@sec02-licensing-requirements → 2 after HOLD (sec02-licensing-requirements); non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:31:33.889Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:49 for 04.cards (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:31:52.839Z retry nonce 04.cards:@sec02-licensing-requirements → 3 after HOLD (sec02-licensing-requirements); non-PASS: 04.HOOK_LENGTH=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:32:12.857Z retry nonce 04.cards:@sec02-licensing-requirements → 4 after HOLD (sec02-licensing-requirements); non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:32:12.963Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:50 for 04.cards (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:32:29.546Z retry nonce 04.cards:@sec02-licensing-requirements → 5 after HOLD (sec02-licensing-requirements); non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:32:48.302Z retry nonce 04.cards:@sec02-licensing-requirements → 6 after HOLD (sec02-licensing-requirements); non-PASS: 04.ORIGINALITY=FAIL

- 2026-10-27T19:33:52.001Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:51 for 02.dossier_sections (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:34:22.149Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:52 for 02.dossier_sections (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:34:33.810Z retry nonce 02.dossier_sections:D@sec03-driver-education-permits → 1 after HOLD (sec03-driver-education-permits); non-PASS: 02.CORPUS_STABILITY=FAIL

- 2026-10-27T19:34:49.074Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:53 for 02.dossier_sections (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:35:12.501Z retry nonce 02.dossier_sections:E2@sec03-driver-education-permits → 1 after HOLD (sec03-driver-education-permits); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:35:12.611Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:54 for 02.dossier_sections (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:35:39.132Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:55 for 02.dossier_sections (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:36:13.194Z retry nonce 02.dossier_sections:G@sec03-driver-education-permits → 1 after HOLD (sec03-driver-education-permits); non-PASS: 02.MARKET_SIGNAL=FAIL

- 2026-10-27T19:36:35.556Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:56 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:37:20.144Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:57 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:37:48.903Z retry nonce 02.dossier_sections:B@sec04-license-types-id-documents → 1 after HOLD (sec04-license-types-id-documents); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:37:49.003Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:58 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:38:00.065Z retry nonce 02.dossier_sections:B@sec04-license-types-id-documents → 2 after HOLD (sec04-license-types-id-documents); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:38:12.348Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:59 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:38:45.331Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:60 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:38:57.963Z retry nonce 02.dossier_sections:E2@sec04-license-types-id-documents → 1 after HOLD (sec04-license-types-id-documents); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T19:39:13.280Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:61 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:39:25.708Z retry nonce 02.dossier_sections:F@sec04-license-types-id-documents → 1 after HOLD (sec04-license-types-id-documents); non-PASS: 02.CORPUS_STABILITY=FAIL

- 2026-10-27T19:39:38.487Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:62 for 02.dossier_sections (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:41:01.301Z retry nonce 04.cards:@sec04-license-types-id-documents → 1 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:41:26.381Z retry nonce 04.cards:@sec04-license-types-id-documents → 2 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:41:26.526Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:63 for 04.cards (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.BACK_SPOKEN_FORM=FAIL,04.ORIGINALITY=FAIL

- 2026-10-27T19:41:49.029Z retry nonce 04.cards:@sec04-license-types-id-documents → 3 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:42:12.211Z retry nonce 04.cards:@sec04-license-types-id-documents → 4 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:42:12.321Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:64 for 04.cards (sec04-license-types-id-documents) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 04.BACK_SPOKEN_FORM=FAIL,04.ORIGINALITY=FAIL

- 2026-10-27T19:42:33.525Z retry nonce 04.cards:@sec04-license-types-id-documents → 5 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:42:57.785Z retry nonce 04.cards:@sec04-license-types-id-documents → 6 after HOLD (sec04-license-types-id-documents); non-PASS: 04.BACK_SPOKEN_FORM=FAIL, 04.ORIGINALITY=FAIL

- 2026-10-27T19:43:55.968Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:65 for 02.dossier_sections (sec05-vision-health) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:44:23.763Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:66 for 02.dossier_sections (sec05-vision-health) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:44:48.060Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:67 for 02.dossier_sections (sec05-vision-health) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:45:13.515Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:68 for 02.dossier_sections (sec05-vision-health) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:47:21.461Z retry nonce 05.sessions:@sec05-vision-health → 1 after HOLD (sec05-vision-health); non-PASS: 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T19:48:41.907Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:69 for 02.dossier_sections (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:49:17.318Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:70 for 02.dossier_sections (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:49:46.763Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:71 for 02.dossier_sections (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:50:12.279Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:72 for 02.dossier_sections (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T19:50:50.806Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:73 for 02.dossier_sections (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T20:06:33.310Z founder amendment: standing cap $30 → $60 ("cap $60 go finish all 16"); per-role sub-caps already raised; Muse operator tokens on subscription

- 2026-10-27T20:17:23.847Z retry nonce 03.combined_kg:@sec01-definitions → 1 after HOLD (sec01-definitions); non-PASS: 03.ONTOLOGY=FAIL, 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:17:50.133Z retry nonce 03.combined_kg:@sec01-definitions → 2 after HOLD (sec01-definitions); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:17:50.251Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:74 for 03.combined_kg (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:18:25.279Z retry nonce 03.combined_kg:@sec01-definitions → 3 after HOLD (sec01-definitions); non-PASS: 03.FACT_IDS_REGISTERED=FAIL

- 2026-10-27T20:18:53.330Z retry nonce 03.combined_kg:@sec01-definitions → 4 after HOLD (sec01-definitions); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:18:53.437Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:75 for 03.combined_kg (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:19:25.901Z retry nonce 03.combined_kg:@sec01-definitions → 5 after HOLD (sec01-definitions); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:19:48.180Z retry nonce 03.combined_kg:@sec01-definitions → 6 after HOLD (sec01-definitions); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:21:06.800Z retry nonce 05.sessions:@sec02-licensing-requirements → 1 after HOLD (sec02-licensing-requirements); non-PASS: 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T20:21:33.072Z retry nonce 05.sessions:@sec02-licensing-requirements → 2 after HOLD (sec02-licensing-requirements); non-PASS: 05.SLIDE_ARC=FAIL

- 2026-10-27T20:21:33.323Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:76 for 05.sessions (sec02-licensing-requirements) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.SLIDE_ARC=FAIL

- 2026-10-27T20:21:59.399Z retry nonce 05.sessions:@sec02-licensing-requirements → 3 after HOLD (sec02-licensing-requirements); non-PASS: 05.SLIDE_ARC=FAIL

- 2026-10-27T20:24:41.517Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:77 for 05.sessions (sec03-driver-education-permits) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T20:36:42.116Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:78 for 16.compile (sec06-examinations) under standing authority; cause: compile attempt cap on shared lineage (sec06-examinations)

- 2026-10-27T20:40:04.502Z retry nonce 05.card_scripts:@sec01-definitions → 1 after HOLD (sec01-definitions); non-PASS: 05.THINK_REF=FAIL

- 2026-10-27T20:40:29.097Z retry nonce 05.card_scripts:@sec01-definitions → 2 after HOLD (sec01-definitions); non-PASS: 05.THINK_REF=FAIL

- 2026-10-27T20:40:29.258Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:79 for 05.card_scripts (sec01-definitions) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.THINK_REF=FAIL

- 2026-10-27T20:40:51.623Z retry nonce 05.card_scripts:@sec01-definitions → 3 after HOLD (sec01-definitions); non-PASS: 05.THINK_REF=FAIL

- 2026-10-27T20:41:42.339Z retry nonce 03.combined_kg:@sec06-examinations → 1 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:42:07.140Z retry nonce 03.combined_kg:@sec06-examinations → 2 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:42:07.266Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:80 for 03.combined_kg (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:42:32.499Z retry nonce 03.combined_kg:@sec06-examinations → 3 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:42:59.327Z retry nonce 03.combined_kg:@sec06-examinations → 4 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:42:59.446Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:81 for 03.combined_kg (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:43:19.625Z retry nonce 03.combined_kg:@sec06-examinations → 5 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:43:43.546Z retry nonce 03.combined_kg:@sec06-examinations → 6 after HOLD (sec06-examinations); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:44:32.311Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:82 for 02.dossier_sections (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T20:44:57.518Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:83 for 02.dossier_sections (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T20:45:17.142Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:84 for 02.dossier_sections (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T20:46:09.724Z retry nonce 03.combined_kg:@sec07-preparing-vehicle → 1 after HOLD (sec07-preparing-vehicle); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:46:34.633Z retry nonce 03.combined_kg:@sec07-preparing-vehicle → 2 after HOLD (sec07-preparing-vehicle); non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:46:34.740Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:85 for 03.combined_kg (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T20:49:59.373Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:86 for 16.compile (sec04-license-types-id-documents) under standing authority; cause: compile attempt cap on shared lineage (sec04-license-types-id-documents)

- 2026-10-27T21:06:22.542Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:87 for 16.compile (sec03-driver-education-permits) under standing authority; cause: compile attempt cap on shared lineage (sec03-driver-education-permits)

- 2026-10-27T21:06:55.144Z retry nonce 03.combined_kg:@sec06-examinations → 7 after HOLD (sec06-examinations); non-PASS: 03.FACT_IDS_REGISTERED=FAIL

- 2026-10-27T21:07:23.102Z retry nonce 03.combined_kg:@sec06-examinations → 8 after HOLD (sec06-examinations); non-PASS: 03.ONE_MODULE_PER_NODE=FAIL, 03.FACT_IDS_REGISTERED=FAIL, 03.CURRICULUM_HINTS=FAIL

- 2026-10-27T21:07:23.322Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:88 for 03.combined_kg (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 03.ONE_MODULE_PER_NODE=FAIL,03.FACT_IDS_REGISTERED=FAIL,03.CURRICULUM_HINTS=FAIL

- 2026-10-27T21:07:52.973Z retry nonce 03.combined_kg:@sec06-examinations → 9 after HOLD (sec06-examinations); non-PASS: 03.EDGES_MIRROR=FAIL, 03.FACT_IDS_REGISTERED=FAIL

- 2026-10-27T21:09:17.192Z retry nonce 05.sessions:@sec06-examinations → 1 after HOLD (sec06-examinations); non-PASS: 05.NARRATION_DEPTH=FAIL

- 2026-10-27T21:09:42.891Z retry nonce 05.sessions:@sec06-examinations → 2 after HOLD (sec06-examinations); non-PASS: 05.NARRATION_DEPTH=FAIL, 05.SELF_CHECK_ALIGNED=FAIL

- 2026-10-27T21:09:43.023Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:89 for 05.sessions (sec06-examinations) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.NARRATION_DEPTH=FAIL,05.SELF_CHECK_ALIGNED=FAIL

- 2026-10-27T21:10:09.014Z retry nonce 05.sessions:@sec06-examinations → 3 after HOLD (sec06-examinations); non-PASS: 05.NARRATION_DEPTH=FAIL

- 2026-10-27T21:12:02.071Z retry nonce 06.exam_bank:@sec07-preparing-vehicle → 1 after HOLD (sec07-preparing-vehicle); non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:12:45.413Z retry nonce 06.exam_bank:@sec07-preparing-vehicle → 2 after HOLD (sec07-preparing-vehicle); non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:12:45.609Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:90 for 06.exam_bank (sec07-preparing-vehicle) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:15:09.479Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:91 for 02.dossier_sections (sec08-basic-driving) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:15:34.730Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:92 for 02.dossier_sections (sec08-basic-driving) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:15:59.786Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:93 for 02.dossier_sections (sec08-basic-driving) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:16:21.298Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:94 for 02.dossier_sections (sec08-basic-driving) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:18:28.807Z retry nonce 05.sessions:@sec08-basic-driving → 1 after HOLD (sec08-basic-driving); non-PASS: 05.SLIDE_ARC=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T21:18:53.453Z retry nonce 05.sessions:@sec08-basic-driving → 2 after HOLD (sec08-basic-driving); non-PASS: 05.SLIDE_ARC=FAIL, 05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T21:18:53.639Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:95 for 05.sessions (sec08-basic-driving) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 05.SLIDE_ARC=FAIL,05.STAGE_DIRECTIONS=FAIL

- 2026-10-27T21:19:22.325Z retry nonce 05.sessions:@sec08-basic-driving → 3 after HOLD (sec08-basic-driving); non-PASS: 05.SLIDE_ARC=FAIL

- 2026-10-27T21:21:17.617Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:96 for 02.dossier_sections (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:21:47.101Z retry nonce 02.dossier_sections:B@sec10-alcohol-drugs → 1 after HOLD (sec10-alcohol-drugs); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:21:47.267Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:97 for 02.dossier_sections (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:22:14.220Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:98 for 02.dossier_sections (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:22:42.309Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:99 for 02.dossier_sections (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:23:13.983Z retry nonce 02.dossier_sections:G@sec10-alcohol-drugs → 1 after HOLD (sec10-alcohol-drugs); non-PASS: 02.MARKET_SIGNAL=FAIL

- 2026-10-27T21:23:14.244Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:100 for 02.dossier_sections (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.MARKET_SIGNAL=FAIL

- 2026-10-27T21:24:41.697Z retry nonce 06.exam_bank:@sec10-alcohol-drugs → 1 after HOLD (sec10-alcohol-drugs); non-PASS: 06.ID_INTEGRITY=FAIL, 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:25:14.421Z retry nonce 06.exam_bank:@sec10-alcohol-drugs → 2 after HOLD (sec10-alcohol-drugs); non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:25:14.642Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:101 for 06.exam_bank (sec10-alcohol-drugs) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:27:16.983Z retry nonce 02.dossier_sections:C@sec11-distractions-challenges → 1 after HOLD (sec11-distractions-challenges); non-PASS: 02.MARKET_SIGNAL=FAIL

- 2026-10-27T21:27:54.560Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:102 for 02.dossier_sections (sec11-distractions-challenges) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:28:28.377Z retry nonce 02.dossier_sections:C2@sec11-distractions-challenges → 1 after HOLD (sec11-distractions-challenges); non-PASS: 02.MARKET_SIGNAL=FAIL

- 2026-10-27T21:28:42.398Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:103 for 02.dossier_sections (sec11-distractions-challenges) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:29:06.541Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:104 for 02.dossier_sections (sec11-distractions-challenges) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:29:35.265Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:105 for 02.dossier_sections (sec11-distractions-challenges) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:29:42.811Z retry nonce 02.dossier_sections:E2@sec11-distractions-challenges → 1 after HOLD (sec11-distractions-challenges); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:29:59.238Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:106 for 02.dossier_sections (sec11-distractions-challenges) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:30:49.859Z retry nonce 03.combined_kg:@sec11-distractions-challenges → 1 after HOLD (sec11-distractions-challenges); non-PASS: 03.NODE_COVERAGE=FAIL, 03.HIGH_YIELD_SET=FAIL

- 2026-10-27T21:33:30.598Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:107 for 02.dossier_sections (sec12-crashes-insurance) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:34:23.128Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:108 for 02.dossier_sections (sec12-crashes-insurance) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:34:53.059Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:109 for 02.dossier_sections (sec12-crashes-insurance) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:35:26.926Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:110 for 02.dossier_sections (sec12-crashes-insurance) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:35:39.189Z retry nonce 02.dossier_sections:E2@sec12-crashes-insurance → 1 after HOLD (sec12-crashes-insurance); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:35:53.333Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:111 for 02.dossier_sections (sec12-crashes-insurance) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:37:17.806Z retry nonce 04.cards:@sec12-crashes-insurance → 1 after HOLD (sec12-crashes-insurance); non-PASS: 04.ATOMIC_CLUSTER=FAIL

- 2026-10-27T21:39:07.186Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:112 for 02.dossier_sections (sec13-suspensions-record) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:39:24.419Z retry nonce 02.dossier_sections:C@sec13-suspensions-record → 1 after HOLD (sec13-suspensions-record); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:39:44.994Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:113 for 02.dossier_sections (sec13-suspensions-record) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:40:32.011Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:114 for 02.dossier_sections (sec13-suspensions-record) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:40:55.487Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:115 for 02.dossier_sections (sec13-suspensions-record) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:41:19.945Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:116 for 02.dossier_sections (sec13-suspensions-record) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:42:58.852Z retry nonce 06.exam_bank:@sec13-suspensions-record → 1 after HOLD (sec13-suspensions-record); non-PASS: 06.OPTIONS_SHAPE=FAIL

- 2026-10-27T21:44:14.969Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:117 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:44:47.214Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:118 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:44:59.816Z retry nonce 02.dossier_sections:A@sec14-sharing-the-road → 1 after HOLD (sec14-sharing-the-road); non-PASS: 02.CORPUS_STABILITY=FAIL

- 2026-10-27T21:45:13.977Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:119 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:45:33.923Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:120 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:46:00.473Z retry nonce 02.dossier_sections:E2@sec14-sharing-the-road → 1 after HOLD (sec14-sharing-the-road); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:46:00.613Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:121 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:46:22.042Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:122 for 02.dossier_sections (sec14-sharing-the-road) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 

- 2026-10-27T21:48:02.683Z retry nonce 06.exam_bank:@sec14-sharing-the-road → 1 after HOLD (sec14-sharing-the-road); non-PASS: 06.ID_INTEGRITY=FAIL, 06.OPTIONS_SHAPE=FAIL, 06.FORM_OVERLAP=FAIL

- 2026-10-27T21:50:19.585Z retry nonce 02.dossier_sections:C@sec15-vehicle-equipment → 1 after HOLD (sec15-vehicle-equipment); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:50:19.715Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:123 for 02.dossier_sections (sec15-vehicle-equipment) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:50:37.681Z retry nonce 02.dossier_sections:C@sec15-vehicle-equipment → 2 after HOLD (sec15-vehicle-equipment); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:51:07.506Z retry nonce 02.dossier_sections:C@sec15-vehicle-equipment → 3 after HOLD (sec15-vehicle-equipment); non-PASS: 02.FACT_LINES_CITED=FAIL

- 2026-10-27T21:51:07.618Z lineage reset → 2026-10-26-rdmv-ut-class-d:lineage:124 for 02.dossier_sections (sec15-vehicle-equipment) under standing authority; cause: attempt limit after HOLDs; last non-PASS: 02.FACT_LINES_CITED=FAIL
