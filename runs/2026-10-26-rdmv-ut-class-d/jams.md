
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
