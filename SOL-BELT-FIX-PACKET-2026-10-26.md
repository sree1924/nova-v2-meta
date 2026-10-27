# Belt fix packet for Sol — make v0.2.0 → v0.3.0 executable at the 2026-10-27 bell

From: Claude Code session 2bdcad95 (engineering assistant), 2026-10-26 evening, after running the checker
and reading every file in the v0.2.0 bundle. To: Sol (GPT), author of the packet. Founder decisions taken
today and binding on this packet: **DMV is a hackathon-only mint, not Nova canon** · **Texas Class C
knowledge test** (confirm or swap state — one field) · **scope cut below is proposed, awaiting his `go`**.

Ground truth: `node tools/check-bot-contracts.mjs` → `binding_integrity: PASS`, `execution_readiness:
NOT_READY_FOR_EXECUTION`, blockers = UI unbound · 2 missing schemas · 47 roles unqualified · 47 adapters
unconfigured · 27 model assignments null · 13 intake nulls · 5 budget nulls · execution_disabled.
RabbitMQ is **not installed** on the machine. Zero controller/ledger/worker code exists. 8 days, one person.

Format per fix: **where** (file:line) · **current** · **target** · **verify**. Do not edit anything under
`D:/nova/factory`, `schemas`, `tools` (parent), or the manifest. Re-pin `REVIEW-BUNDLE.json` as **0.3.0**
with `supersedes: "0.2.0"` after all edits; never silently refresh 0.2.0 hashes.

---

## F1 — Pilot profile: cut the belt to what runs in 8 days (contract)

**Where:** `BELT-V2-CONTRACT.md` — add a new §0 "Pilot profile v0.3.0 (hackathon window)" directly after
line 7, and mark the clauses below. Keep every deferred clause's text (history), prefix each with
`[DEFERRED_TO_V3 — pilot profile]`.

| Clause | Line | Current | Target |
|---|---|---|---|
| C23–C26 transport | 181–196 | "Run one local broker…", outbox, ACK ordering, fencing | `[DEFERRED_TO_V3]`. Pilot transport = **in-process sequential controller** (one Node process, one task at a time, the ledger is the queue). Add one sentence: "At-least-once semantics still apply to provider calls; stable task keys (C19) and the ledger prevent double-accept." |
| C21 SQLite | 173 | SQLite WAL/FULL, "one collector" | Keep. Add driver: **`node:sqlite`** (Node 22.13.1, experimental flag acknowledged) — no native build step. |
| C33 audit pool | 220 | OpenAI + Anthropic + Google | **OpenAI + Anthropic**; Google `inactive_for_pilot`. Rationale: two non-generating models already satisfy "a generating model never approves its own result". |
| C44 dev/prod | 248 | Clerk/Stripe prod variant + free taste tier | `[DEFERRED_TO_V3]`. Pilot ships **dev preview only** (standalone Vite/Next app under this folder, no auth, no money). |
| C46–C50 floor | 254–264 | animated role-based floor, live/replay, reconnect cursors | `[DEFERRED_TO_V3]`. Pilot = **static trace page** generated from the ledger (stage · role · model · usage · est/actual USD · elapsed · attempts · human edits · artifact hash). Honest, demoable, zero websockets. |
| C55 tests | 282–298 | 15 required tests | Keep **3 blocking**: duplicate command → one accepted result · crash after artifact write before ledger commit → resume reconciles · source-supported auditor defect → acceptance held. Mark the other 12 `[DEFERRED_TO_V3]`. |
| C57 sales handoff | 304 | later roles 22/10/B7/11/23/24 | Keep as text; roster seats go `inactive_for_pilot` (F4). |
| C04 inventory | 30 | lists RabbitMQ/SQLite/executors as "must earn receipts" | Add: "Pilot profile removes RabbitMQ from the receipt list entirely." |

**Verify:** `grep -c "DEFERRED_TO_V3" BELT-V2-CONTRACT.md` ≥ 6; §0 names the 3 kept tests and the 2 auditors.

## F2 — Intake: replace "Unresolved" with the Texas values (brief)

**Where:** `RDMV-EXECUTION-BRIEF.md:18–27` (the disposition table) and `:62` ("Neither state below has been selected").
**Current:** 7 rows "Unresolved"; examples section says no state selected.
**Target:** copy values verbatim from `runs/2026-10-27-rdmv-tx-class-c/run-config.json` → `scope`:
US-TX · Texas DPS Driver License Division · Class C knowledge test · first_time, all ages (sub-paths `(verify)`
from DL-7) · en · full_knowledge_test · **DL-7 Rev. Jan 2026, © 2026 Texas DPS,
`https://www.dps.texas.gov/internetforms/Forms/DL-7.pdf`**, notice recorded verbatim ("Download and/or copy
the document for personal use. Commercial sales or reproduction for commercial purposes is expressly
prohibited.") · exam facts: pass 70% `(verify in PDF)`, question count **null** `(verify — not on dps.texas.gov;
prep sites claim 30)`. Rights posture: handbook = fact authority only, nothing reproduced; **MUTCD sign designs
= US federal public domain (17 USC §105)** for the visual layer; all items labelled practice, never "actual".
Replace the Utah/CA example table with the single Texas row set. Keep the sentence that none of this is a
legal determination.
**Verify:** `grep -c "Unresolved" RDMV-EXECUTION-BRIEF.md` == 0; `grep -c "(verify)"` ≥ 3 (honesty preserved).

## F3 — Checker reads only the template (tool)

**Where:** `tools/check-bot-contracts.mjs:208` — `const configPath=path.join(here,'RDMV-RUN-CONFIG.template.json');`
**Current:** hard-coded template → intake/budget blockers can never clear.
**Target:** `--run-config <path>` CLI flag (default = template). Resolve relative to `fb-ai-hackathon/`.
Treat a string containing `(verify)` as **resolved-with-debt**: report it under a new non-blocking
`verification_debt_fields[]`, not under `unresolved_run_intake`.
**Verify:** `node tools/check-bot-contracts.mjs --run-config runs/2026-10-27-rdmv-tx-class-c/run-config.json`
→ no `unresolved_run_intake`, no `unresolved_provider_budgets`, `verification_debt_fields` lists ≥ 4.

## F4 — Bindings: activate the pilot roster, park the rest (registry + checker)

**Where:** `contracts/bot-contract-bindings.json` → `roles[].execution` and `roles[].assignment_status`;
`review_bots[]`; checker lines 231–240 (blocker derivation).

**Target roster:**

| Seats | `assignment_status` | `execution.lane` | `provider_proposal` / `model` | `adapter_status` |
|---|---|---|---|---|
| 02, 03, KG-01..05, 04, 05, 06, 09, 19A | `active_pilot` | `meta_authoring` | `meta` / **`muse-spark-1.3`** | `configured_pending_smoke` |
| 01b | `active_pilot` | `meta_authoring` | `meta` / `muse-spark-1.3` (recon only, never fact authority) | `configured_pending_smoke` |
| 00, 12, 13, 14, 15, 16, 17, 19, 21 | `active_pilot` | `tool_assisted` | `script` / `null` + new field `script_ref` (e.g. `tools/roles/15-evidence.mjs`, may not exist yet → `status:"planned"`) | `script` |
| 07, 08 | `active_pilot` | `independent_audit` | assigned via `review_bots` | `configured_pending_smoke` |
| B1, B5 | `active_pilot` | `build_engineering` | `claude-code` / `muse-code` (engineering assistants, logged separately) | `assistant` |
| 01, 10, 10A, 10B, 11, 20, 20A, 20B, 22, 23, 24, B2, B3, B4, B6, B7, B8, B9 | **`inactive_for_pilot`** | unchanged | unchanged | unchanged |
| `audit-openai` | `active_pilot` | — | model: founder-pinned OpenAI model id via existing `OPENAI_API_KEY` `(verify id)` | `configured_pending_smoke` |
| `audit-claude` | `active_pilot` | — | model: `claude-opus-5-5` via Claude Code session (logged as auditor, never as generator) | `configured_pending_smoke` |
| `audit-google` | `inactive_for_pilot` | — | null | `not_configured` |

Add `pilot_profile: "0.3.0"` at registry top level. Keep every `contract.sha256` pin untouched.

**Checker target (lines 231–240):** compute `role_qualification_pending`, `role_adapter_configuration_pending`,
`authoring_or_review_model_configuration_pending` **only over `assignment_status === "active_pilot"`**;
a `tool_assisted` seat with `adapter_status:"script"` is configured (model may be null);
`configured_pending_smoke` counts as configured; `qualification_status` is cleared **only** by F7's report.
Print `inactive_for_pilot: [ids]` as information.
**Verify:** checker shows `roles_active: 23`, `inactive_for_pilot: 24`, adapter/model blockers = 0,
`role_qualification_pending.count` = 23 (expected until F7 runs), still `NOT_READY_FOR_EXECUTION`.

## F5 — UI seat: bind a project-local contract (no parent edit)

**Where:** roster line `BELT-V2-CONTRACT.md:358` + the `UI` entry in bindings (`contract.status:"unresolved_template"`);
checker `:180–181`.
**Current:** `factory/ui-architects/<selected-probe>.md` template, unbound.
**Target:** create **`contracts/ui-rdmv-tx.md`** (project-local; mirrors the probe-UI contract shape used in
`factory/ui-architects/` — read one, e.g. the citizenship one, for the field list): theme name, learner,
8 screens (home · chapter hub · lesson · cards · quiz · practice test · results · trace), sign-graphics rule
(MUTCD renderings only), free-only tier. Pin its sha256 in bindings; `contract.status:"pinned_local"`.
Checker: accept `pinned_local` when the path starts with `contracts/` under `fb-ai-hackathon/`.
**Verify:** checker `unbound_roles: []`.

## F6 — Role 13's two missing schemas: record non-applicability

**Where:** `BELT-V2-CONTRACT.md:386` (C63) and bindings `roles[role_id=13].schema_refs[]` for
`schemas/teaching-presentation.schema.json`, `schemas/teaching.schema.json`.
**Target:** `status:"absent_not_applicable_pilot"` + `reason:"no active_pilot stage consumes a
TeachingPresentation artifact; sessions validate against schemas/session-scripts (05b) and the dev preview
reads tenantData shapes directly"`. Checker downgrades these from `execution_blockers` to `notes[]`.
**Verify:** checker `missing_schema_paths: []`, `notes` lists both with the reason.

## F7 — Qualification: define what flips `not_qualified` → `qualified`

**Where:** new `qualification/RUBRIC-04-road-signs.json` + a one-paragraph C32 addendum at `BELT-V2-CONTRACT.md:218`.
**Target rubric (frozen before any call):** task = Role 04 CardDeck for **one DL-7 chapter: road signs**
(≥ 25 cards); inputs = DL-7 pages for that chapter (hash) + MUTCD sign list; output must validate against a
**strict-subset projection** of `schemas/carddeck.schema.json` (projection file hashed, lives under
`schemas-strict/`, parent untouched); blocking checks: 0 facts contradicting DL-7 on a 15-item held-out
list written **by the auditor, not the generator**; every card cites a DL-7 page; no handbook sentence
reproduced verbatim (> 12-word overlap = fail); usage + cost + latency recorded; ≤ 2 attempts.
Passing writes `qualification/QUALIFICATION-REPORT-04.json` (hash, model returned, usage, verdict); the
checker reads it and sets `qualification_status:"qualified"` for 04 only — other roles qualify by their own
first accepted artifact (`qualified_by_first_accepted_artifact`), stated in the C32 addendum.
**Verify:** rubric file exists, hashed in bundle; checker reports `qualification_source` per active role.

## F8 — Prompt templates for the active authoring roles (Sol's real contribution)

**Where:** new `prompts/<role>.md` for **02, 03 (combined KG-01..05 pass), 04, 05 (sessions), 05 (card scripts),
06, 09, 19A** and audit prompts for **07, 08**.
**Target:** each derived from the **full** pinned contract (not the excerpt): role intent · inputs (artifact
refs by hash) · output = named strict JSON schema · the Sol memory-loop canon for 04/05 (ask → silent recall
beat → answer aloud → hook; AMENDMENT-ORDER-Q §1) · DMV-specific rules: exact qualifiers/thresholds/exceptions,
cite DL-7 page per fact, `(verify)` over invention, MUTCD sign names, practice-not-actual language,
no handbook text reproduction. Each file ends with a `prompt_template_sha256` line computed over the body
(C17 requires the hash in every task envelope). Decompression bar per unit (C38/brief §"Required learning
unit"): why/how · worked example · misconception · memory support · aligned assessment with rationale.
**Verify:** 10 files; each ≤ 6 KB; each names its `schema_ref`; hashes listed in REVIEW-BUNDLE 0.3.0.

## F9 — Pointers and bundle

- `AGENTS.md:60–66` — add `runs/2026-10-27-rdmv-tx-class-c/run-config.json` and this packet to the read list.
- `INSTRUCTIONS.md:5–7` — one sentence: "v0.3.0 pilot profile applies for the build window."
- `REVIEW-BUNDLE.json` → `version:"0.3.0"`, `supersedes:"0.2.0"`, re-hash all primary targets **plus**
  `contracts/ui-rdmv-tx.md`, `qualification/RUBRIC-04-road-signs.json`, `prompts/*.md`, the run-config.
**Verify:** my hash check (`node -e` over `primary_targets`) prints `OK` for every row.

## F10 — Division of labor at the bell (so nobody double-writes)

| Who | Owns tomorrow | Writes only under |
|---|---|---|
| **Sol (GPT)** | F1–F9 tonight; then 07/08 audit prompts refinement as artifacts land | `*.md`, `contracts/`, `prompts/`, `qualification/RUBRIC*`, `REVIEW-BUNDLE.json` |
| **Claude Code** | controller (sequential) · `node:sqlite` ledger · Meta client w/ provenance · strict-schema projector · Role 15 DL-7 register (hash, page map, notice) · trace page | `tools/belt/`, `schemas-strict/`, `runs/2026-10-27-rdmv-tx-class-c/**` (lock holder) |
| **Muse Code** | runs the F7 qualification task through the controller · dev preview app | `app-preview/`, `runs/.../qualification/` (via controller only) |
| **Founder** | `tx` confirm · `go` on F1 cut · `MODEL_API_KEY` in `.env` · `--go` on each paid stage · no gates otherwise | — |

Execution is **disabled** until: checker on the real run-config shows only `qualification_pending` +
`execution_disabled`; `npm run smoke` green; founder `go`. Then F7 runs first. Nothing else before that.
