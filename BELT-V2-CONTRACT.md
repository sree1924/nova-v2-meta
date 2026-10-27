# Nova V2 Production Belt Contract Review Draft

Version 0.4.0. Prepared October 26, 2026, America/Denver. Status: **REVIEW REVISION — EXECUTION DISABLED; SCHEMA-OWNER RECEIPTS REQUIRED**.

This contract specifies a proposed Meta-operated production belt for regular passenger-car driver's license written/knowledge-test preparation, retaining Nova's named responsibilities, source-grounded artifacts, independent acceptance, and release authority. The v0.4.0 review profile proposes one sequential controller, a local SQLite ledger and a static trace page. Earlier broker, animated-floor and prod-store requirements remain visible as deferred history. The current deliverable is this review package; no production work is authorized by preparing it.

The contract is ready for review. It is not an implementation receipt, a catalog amendment, an approval signature, or authorization to publish. Required unresolved intake values are preserved in [the RDMV brief](RDMV-EXECUTION-BRIEF.md) and [configuration template](RDMV-RUN-CONFIG.template.json).

## 0 Pilot profile (hackathon window; v0.4.0 review revision)

**Authorization and precedence.** The founder has locked regular non-commercial passenger-car driver's license written-test preparation and explicitly left the state for later. Texas is a candidate, not a selected jurisdiction. The existing `runs/2026-10-27-rdmv-tx-class-c/run-config.json`, DL-7 references and `ui-rdmv-tx.md` name preserve that candidate's history; none confirms Texas. This profile is a review-only specification. It does not start a controller, qualify a model, generate content, install a service, move money, publish or schedule automatic execution at the event bell. `execution_enabled` remains false.

**Keep:** The animated floor will remain in the contract as deferred work. This is still package preparation only.

This section and C65–C75 govern pilot applicability where retained earlier clauses describe a larger or superseded system. Prefix `[DEFERRED_TO_V3 — pilot profile]` preserves the historical requirement while removing it from the pilot acceptance set. The explicit local override matrix in `contracts/pilot-overrides-v0.4.0.json` identifies inherited obligations and scoped replacements; it does not amend Nova's protected canonical contracts. State/source/rights selection and exact scope must still be fixed before affected generation. Schema/tool/model names and proposed dollar caps are configuration for review, not tested capabilities or spend authority.

| Area | v0.4.0 review profile obligation |
|---|---|
| Scope | Regular passenger-car written/knowledge preparation; exclude CDL, motorcycle, road skills and licensing eligibility claims. State stays pending. Hackathon-only candidate outside the Nova catalog; no manifest change. |
| Controller | One Node process, one task at a time; the tasks ledger is the queue. No RabbitMQ, distributed leases, transport ACKs or transactional outbox in the pilot. |
| Ledger | Local SQLite WAL/FULL using built-in `node:sqlite`; Node 22.13.1 experimental API status acknowledged, no native-addon build. Record tasks, attempts, calls, artifacts, events and reservations. This package implements no ledger. |
| Production | Meta authors the declared model-dependent tasks. 09 packaging and 19A reference/integrity work are deterministic tool-assisted tasks; their instructions do not imply model calls. KG specialties are substeps of one combined 03 pass. |
| Auditors | Two eligible, distinct non-generating provider families are required after actor/provider-family lineage checks. OpenAI and Anthropic names are candidates, not proof of eligibility; GPT-authored production prompts disqualify the OpenAI family for that candidate scope. Google remains unconfigured/inactive until an explicit qualified assignment. Fewer than two eligible families holds the task. |
| Learner product | Standalone Vite/Next dev preview under this folder; free-only, no Clerk, Stripe or real payments. Eight screens are specified by the local UI contract. Text-only pilot; audio production and scouting seats are inactive. |
| Observability | Static trace page generated from committed ledger data: stage, role, actual model/script, usage, estimated/actual USD, elapsed time, attempts, human edits and artifact hash. No live/replay robot runtime, WebSocket or reconnect transport required. |
| Blocking fault tests | (1) Duplicate command produces one accepted result; (2) crash after artifact write before ledger commit reconciles on resume; (3) source-supported auditor defect holds acceptance. No test result exists in this review package. |

At-least-once semantics still apply to provider calls; stable task keys (C19) and the ledger prevent double-accept. A timeout may leave provider execution or billing unknown; C25's warning against exactly-once claims and C29's reservation/uncertainty requirements remain active policy even though broker mechanics are deferred. Persist attempts before a call, durably publish artifacts, then conditionally commit acceptance, events and the next eligible task in SQLite. Recovery checks the single-writer lock, legal state and file hashes; a recoverable file alone never establishes acceptance.

The active graph is intake/evidence/early UI intent/static finish criteria → 01b recon → section-bounded 02 dossier → 16 compile → 17 enrich → accepted 19 learning inputs → combined 03/KG → 04 cards / 05 TeachingUnit / 06 practice sequentially → deterministic 19A units → 05 card-script segments → content seal → scoped 07/08 acceptance → UI-final draft/validate/improve/validate against that content seal → deterministic 09 package → 21 runtime → B5 free preview → release seal → B1 independent application QA → separate application-finish receipt and reviewer trace. The next stage consumes accepted inputs, never future reports. 09 consumes static finish criteria, not a future Playbook or B1 report. With 20/20A/20B inactive, only checks explicitly listed in the early media disposition are non-applicable; text-script parity and any later required visual evidence stay mandatory. The memory loop stays in scripts; no live or paid TTS is implied.

C13 retains the full historical graph subject to this explicit acyclic pilot order. C28 allows one active task; C54/C56 apply to scoped preview acceptance; sales stays inactive. The roster is **27 active and 20 inactive** of 47 existing seats, including the five KG substeps and local UI. This counts responsibilities, not processes or qualified executors. The old 23/24 packet count remains superseded.

**v0.4.0 review scope.** Fable's v0.3.0 report is preserved unchanged. C65–C75 and `FB-DISPOSITION-v0.4.0.md` track FB-01–FB-20. Claude owns the ten local schema adapters, mapping coverage, deterministic post-validator and their receipts; Sol does not duplicate those files. Until actual owner outputs pass the package checks, those dependencies remain pending. The first 04 qualification uses a text-first selected-state chapter; road-sign recognition is a separate later task requiring registered sign assets. No state, actual chapter, source corpus, qualification result or audit outcome is supplied by this revision.

## 1 Authority and scope

**C01 Authority.** Direct founder instructions govern this proposed experiment. Existing parent and local `AGENTS.md` instructions, the canonical factory manifest, master prompt, belt process, and role contracts retain their applicable authority. This local draft proposes adaptations; it does not amend the frozen factory surface. Never interpret its existence as permission to change protected files.

References:

- `D:/nova/factory/factory-manifest.json`
- `D:/nova/_MASTER-PROMPT.md`
- `D:/nova/factory/THE-BELT.md`
- `D:/nova/_RUN-1-BRIEF.md`
- `D:/nova/_PREFLIGHT-2026-06-11.md`
- `D:/nova/fb-ai-hackathon/AGENTS.md`
- `D:/nova/factory/workers/_INDEX.md`
- `D:/nova/factory/infra-roles/_INDEX.md`
- `D:/nova/factory/kg-department/_DEPT.md`
- `D:/nova/factory/build-crew/_INDEX.md`

**C02 Scope transition.** The reconstructed submitted application and earlier local instructions describe an existing-probe knowledge-decompression evaluation. The founder's later direction selects a DMV product made through a Meta-operated belt as the subject of this review package. Preserve that history and the current direction. Reviewers must identify its remaining effects on event eligibility, reuse, intake and baseline design before treating this as executable scope. Do not rewrite the historical application record to match the newer proposal. Preparing this package authorizes contract and configuration edits, not a production run.

**C03 Isolation.** Hackathon code and documents remain under `D:/nova/fb-ai-hackathon/`. Future product runs use an isolated directory under that project's `runs/`, with an explicit executor lock. Accepted Nova products and other runs are read-only. Do not run the ordinary parent `app` predev/prebuild chains, which regenerate multiple tenants. Protected shared contracts, schemas, tools, manifest and master prompt require the existing amendment mechanism if changes are actually needed.

**C04 Honest inventory.** Nova has role contracts, production artifacts, schemas and executable packaging/QA/media tools. The local Meta client package and smoke script are preparation components, not evidence of an end-to-end Meta factory. SQLite orchestration, role executors and the static trace/preview must each earn an implementation receipt. Pilot profile removes RabbitMQ from the receipt list entirely. The historical larger system's broker and connected factory floor remain deferred. Historical Postgres, pg-boss and Makefile descriptions do not establish installed functionality.

## 2 Product intent and intake

**C05 RDMV identity.** `rdmv` is a hackathon-only working experiment label outside the Nova catalog. It does not name an issuing agency, establish a new canonical probe ID, or prove a 66th live store. The canonical manifest currently places `dmv-permit` under `pruned.reason_weak_engine_fit`; that remains unchanged. The proposed run configuration records `hackathon_only_mint_outside_catalog`. Preserve its provenance and state-confirmation debt; do not silently reactivate the canonical probe or mint a replacement ID.

**C06 Required intake.** Before paid generation, freeze jurisdiction, issuing authority, licence/permit class, age band, first-time/renewal/transfer path, language, source editions and effective dates, product coverage, exclusions, exam facts, rights decisions, baseline availability, model assignments, budget, quality criteria and release intent. Unknown values remain null or explicitly unresolved. A model cannot supply defaults for missing jurisdiction or authority.

**C07 Preflight outcome.** Preflight emits a file containing every applicable check and its evidence. Missing configuration produces `awaiting_configuration`; a catalog conflict produces `catalog_conflict`; missing facts or rights evidence produces `verification_debt` or `rights_unresolved`. These are inspectable states, not new runtime founder approval gates. Resolve configuration in a batch before execution rather than asking the founder questions between stages.

**C08 Success claim.** The bounded engineering claim is that the declared Meta configuration can execute the scoped role graph, produce independently accepted outputs, and account for cost, elapsed time and human intervention. A sale, actual exam pass, learner improvement, repeatable commercial success, or model superiority requires its own measured evidence.

## 3 Workforce and responsibilities

**C09 Role identity.** A role is a bounded responsibility. A provider is an execution assignment. A service process is an implementation choice. Do not equate those three. Retain role IDs on every task, artifact receipt and floor worker. Add no numbered factory role.

Each operating-role binding inherits its existing 13-field intent-led contract and applicable 10-field machine interface; the V2 adapter must not discard required responsibilities or handoffs. Build roles retain their separate BuildRoleContract variant. Any proposed adaptation is recorded for review before it becomes a frozen run input.

The concrete bot-to-contract assignments are part of this contract under C59–C64 and in [the binding registry](contracts/bot-contract-bindings.json). They are configuration for review; a pinned responsibility is not a qualified executor or evidence of execution.

| Role | Responsibility | Required named output or evidence |
|---|---|---|
| 00 Orchestrator | Dependencies, locks, budgets, routing and gates | RunState, task graph, RoutingDecision, snapshots |
| 12 Factory Registrar | Canonical identity and scoped intake | Intake disposition, ProductLineContract reference, run identity |
| 01 Market Scout | Mintability and rank | MarketBrief including the recorded prune reason |
| 01b Competitive Intel Gatherer | Competitor and demand research | CompetitiveIntel and declared ContentDemandSpine scope |
| 02 SME Research Agent | Probe-specific official-source dossier | Blueprint prose with source anchors and structural hints |
| 15 Evidence Librarian | Independent evidence registry and pinned fetches | SourceRegistry, dated snapshots and hashes |
| 16 Blueprint Compiler | Research to structured input | Blueprint JSON and compile/diff evidence |
| 17 KG Input Enricher | Structural enrichment without new facts | EnrichedBlueprint and invariance evidence |
| 20A Image Scout | Pre-KG planning and post-KG targeted scouting | Separate pre/post ImageScoutPlan identities and rights records |
| 03 Knowledge Architect | Coordinates KG specialties | KnowledgeGraph and department-pass evidence |
| KG-01 Concept Extractor and Verifier | Extracts and verifies concepts | Verified concept evidence or embedded department block |
| KG-02 Ontologist | Taxonomy and relationships | Ontology evidence or embedded department block |
| KG-03 Dependency Mapper | Prerequisites, relationships and cycle checks | Edge/dependency evidence |
| KG-04 Weight and Difficulty Calibrator | Declared learning emphasis and difficulty | Weight/difficulty evidence with provenance |
| KG-05 Path Sequencer and Module Builder | Learning paths and stable modules | Sequencing, module IDs and curriculum unit hints |
| 19 Learning Science Calibrator | Learning-model and loop inputs | LearningModel and LearningLoop |
| 04 Flashcard Engineer | Cards, memory hooks and review metadata | CardDeck with stable IDs and source references |
| 05 Audio Narration Coach | Sessions and card narration scripts | SessionScripts and VoiceScripts as distinct stages |
| 06 Exam Author | Assessment items, answers and explanations | ExamBank with objectives, rationales and sources |
| 19A Curriculum Unit Grouper | Binds completed content into units | CurriculumUnitMap |
| 20B Prosody Director | Delivery instructions, never word changes | ProsodyScript keyed to approved script segments |
| 20 Audio Production Engineer | Prerecorded render and integrity checks | AudioAssetManifest and verified media bytes |
| 07 Coverage Auditor | Blocking completeness acceptance | CoverageReport |
| 08 Hallucination Auditor | Blocking source-grounded factual acceptance | FactReport and any required external-review dependency |
| 09 Product Publisher | Packages accepted content | ProductPackage |
| Probe UI Architect | Product theme and teaching presentation | Early media intent plus final double-gated UISpec |
| 21 Runtime Adapter | Explicit package-to-runtime mapping | RuntimeBundle and binding checks |
| B5 Frontend and App | Working learner journey | Application build and browser acceptance evidence |
| B6 SEO and Pages | Useful free discovery surface | Source-grounded pages and funnel handoff |
| 10A Search Operations | Technical search readiness | DiscoveryReport evidence applicable to release |
| 10B AI Discovery | Technical AI-discovery readiness | DiscoveryReport evidence; no inferred citations |
| B1 Build Lead | Integration and independent product-QA assignment | ProductQAReport, defects, fixes and independent retests |
| 25 Executive Assistant | Observability, Playbook and approval queue | FloorReport, ApprovalQueue and Product Playbook |

**C10 Continuous rails.** 12 registration, 13 Schema Steward, 14 Artifact Validator, 15 evidence, 18 Dynamic Facts Monitor and 19 learning science wrap the pipeline. Validation runs after each produced artifact. Role 18 separates changeable facts and records selective refresh dependencies. Role 25 reports; 00 owns workflow decisions.

**C11 Foundation division.** B1 integrates; B2 constructs database/platform support; B3 implements orchestration/backend; B4 implements provider integration; B8 implements rendering support; B9 supplies reproducible local setup. B5/B6 have product-facing responsibilities and B7 supplies measurement. All B1–B9 remain visible in the foundation workshop. They do not imply nine content-producing services on every run.

**C12 Execution styles.** Compilation, deterministic enrichment, schema checks, hashing, graph algorithms, packaging, transport, accounting and rendering are scripts where their contracts permit. Meta executes the measured model-dependent authoring and synthesis assignments. A tool-only station records no invented model call. KG-01 through KG-05 may execute as one declared combined pass with embedded intermediates, as Implementation A allows; show that truthfully instead of inventing five concurrent services.

## 4 Production graph and artifact gates

**C13 Choreography.** Freeze a dependency graph with the following order. Parallel work is allowed only after all its declared inputs have been accepted.

| Stage | Inputs and work | Required file and gate |
|---|---|---|
| Intake | Catalog disposition, frozen run configuration, lock and budget | IntakeReport, RunConfig, RunState; all blocking intake fields resolved |
| Viability | 01 supply/demand assessment | MarketBrief; preserve data-driven score and separately identify any authorized experimental override |
| Recon | 01b scoped competitor/demand work | CompetitiveIntel; competitors do not become factual authorities |
| SME | 02 with 15 source evidence | `02-blueprint.md`; draft → validate → improve → validate |
| Compile | 16 | `16-blueprint.json`; required fields and fact invariance |
| Enrich | 17 | `17-enriched-blueprint.json`; no unsupported new facts |
| Scout pre-KG | 20A plus early declared media intent | Pre-KG ImageScoutPlan |
| Learning inputs | Pin accepted 19 artifacts during preflight or execute a declared role-19 task | Validated LearningModel and LearningLoop; accepted hashes precede 03/04/06/19A/21 consumption |
| Graph | 03 and KG-01 through KG-05 | `03-knowledge-graph.json`; stable concept/module IDs and dependency checks |
| Scout post-KG | 20A targeted to completed graph | Post-KG ImageScoutPlan, linked to exact graph hash |
| Curriculum | Parallel 04 cards, 05 sessions, 06 exam, informed by 19 | CardDeck, SessionScripts, ExamBank; validate each before joining |
| Unit grouping | 19A consumes all required curriculum branches | CurriculumUnitMap with explicit unit-to-content bindings |
| Card scripts | 05 consumes accepted 04 backs | VoiceScripts; visible/audio word parity |
| Prosody | 20B | ProsodyScript; approved words unchanged |
| Media | 20 renders card/session media | AudioAssetManifest; referenced files, real bytes and applicable render-back checks |
| Content seal and audit | 07 coverage and 08 factual QA | ContentCandidateManifest, CoverageReport and FactReport; both PASS |
| Package and UI | 09 plus probe UI Architect | ProductPackage and final UISpec; UISpec draft → validate → improve → validate |
| Runtime | 21 | RuntimeBundle; explicit schema and unit mappings |
| Present | B5 learner app, B6 free SEO, applicable 10A/10B readiness | Working local preview and discovery readiness evidence |
| Separate and inspect | Self-contained application, 25 Playbook, B1 independent QA | ReleaseCandidateManifest, ProductQAReport, defect/retest receipts |
| Release packet | Dev/prod split and complete evidence | ReleasePacket with no unresolved blocking findings |
| Deployment | Existing external_publish gate | Genuine DeployApproval, exact-revision deployment receipt and live verification |

**C14 Repeated responsibilities.** Use distinct stage IDs for `20A.pre_kg` and `20A.post_kg`, and for `05.sessions` and `05.card_scripts`. Reusing a role ID does not make those tasks equivalent. Audio script generation consumes accepted card backs; role 21 consumes the sealed CurriculumUnitMap and must not infer grouping from filenames or deck order.

**C15 UI dependency.** Declare early UI media intent and voice-profile inputs before scouts/prosody require them. Final UISpec remains independently double-gated at packaging. Any later change affecting an early assumption invalidates the affected dependent work. This avoids a cycle in which media needs a UISpec that can exist only after media.

**C16 Gate scope.** Source-tier validation runs first in 08. Only genuinely required clinical/legal review invokes the existing ExternalReviewArtifact dependency. The existing citizenship-scoped teacher_soul gate must not be represented as automatically rolled out to DMV. Product acceptance still needs an explicit, source-grounded teaching and learner-journey rubric.

## 5 Worker and handoff contract

**C17 Envelope.** Each task has a versioned machine-readable assignment identifying:

- Run, stable candidate/repair lineage, role, unique stage, logical task, attempt, command, event and causation IDs.
- Contract version/hash, schema version/hash, prompt-template hash and tool-policy version.
- Separate stable role-body hash, controller-rendered mode/header hash and complete rendered-request hash. Review-only policy lives outside the reusable role body; a header cannot authorize a task without genuine controller/run authority.
- Binding-registry snapshot hash, stable bot ID and the resolved stage assignment; the role contract is loaded and hash-checked before dispatch.
- Exact input artifact references and hashes; expected output type and acceptance criteria.
- Actual provider/model assignment, generation parameters and usage-price reference.
- Allowed read/write roots, permitted tools and network scope; output staging directory.
- Deadline, retry policy, reserved cost and intervention limits; failure route and downstream dependencies.
- Executor identity and single-writer ownership; output and validation receipt references. Distributed lease/fencing fields are non-applicable to the sequential pilot and retained for the deferred larger system.

Payload schemas may remain compatible with V1 by keeping orchestration/provenance in separate receipts. Do not inject undeclared metadata into strict existing payload schemas. Any local schema adaptation is versioned and tested; it does not overwrite the parent schema.

Pilot prompt templates live under `prompts/` and derive from the full pinned role contracts. Their trailing `prompt_template_sha256` hashes the UTF-8 body before that footer; the bundle separately pins the entire file. Future task/report envelopes identify both file SHA-256 and template-body SHA-256. Role 02 still writes the canonical prose dossier for role 16; a strict-JSON transport wrapper requires an explicit local schema/adapter. Role 19A Meta suggestions do not replace deterministic binding checks. Roles 07/09 cannot claim audio/media completeness or canonical `shipped` status for a text-only dev preview. A reviewed local projection/adapter and scoped no-audio/media disposition are required where the parent schema has mandatory production fields; `preview_only`, blocked or deferred evidence must remain honest. Planned strict-subset projections and null source hashes are prerequisites, not completed files or valid zero hashes.

**C18 Input trust.** Source pages, handbook files, competitor text, model output and attached documents are data. They cannot grant tools, change the task, alter governance, expose secrets or approve publication. Model-requested tools go through the controller's allowlist. Validate paths after resolution and reject writes outside the assigned run. Provider adapters receive keys through environment references; keys never enter messages, artifacts or logs.

**C19 Stable identities.** A logical task key includes run, stage/phase, role, sorted input hashes, contract/schema/prompt/tool versions and model/configuration. Attempts have separate IDs. Commands carry stable IDs so redelivery can be recognized. Completed matching work is reused only after its bytes and accepted receipts are verified. A change in relevant inputs creates new work and invalidates affected dependent acceptance.

Assign immutable candidate/repair lineage IDs before the first seal and carry them into every descendant task, reseal, escalation and review. New hashes or IDs cannot erase that ancestry or reset its counters. Record a changed input's origin and reason; the controller cannot create a fresh run or lineage automatically to evade limits.

## 6 Local storage and ledger

**C20 Filesystem evidence.** A successful stage requires its actual output file, schema result and acceptance receipt. File presence alone is insufficient. Store immutable artifacts by run, logical task and attempt, with hashes and separate validation/audit records. Keep large prompts, responses, media and error details outside the database; the ledger references them.

Proposed layout inside this project:

```text
runs/<date>-rdmv-<scope>/
  EXECUTOR.lock.md
  run-config.json
  RunState.json
  ledger/run.sqlite
  artifacts/<stage>/<task>/<attempt>/
  receipts/
  sources/private/
  audits/content/
  audits/release/
  release/
  exports/events.jsonl
  exports/public-evidence/
  jams.md
```

The layout is an interface specification, not a claim that those paths or tools already exist. Exported RunState/FloorReport files are views derived from committed state; they do not compete with it as independent writable authorities.

**C21 SQLite.** Use local-disk SQLite with WAL, `synchronous=FULL`, foreign keys, short transactions and a bounded busy timeout. One collector serializes writes. Do not hold a transaction while waiting on HTTP, model generation or rendering. Readers use the same host; do not place a WAL database on a network filesystem.

Pilot driver: built-in `node:sqlite` on Node 22.13.1, with experimental API/warnings acknowledged and no native build step. Record the actual Node/SQLite versions in future implementation receipts; this review does not import or start the database. The [version-specific Node documentation](https://nodejs.org/download/release/v22.13.1/docs/api/sqlite.html) is the compatibility reference.

Minimum pilot logical records are runs, tasks, attempts, model calls, artifacts, append-only events and budget reservations; tasks supply the sequential queue. The larger system's outbox is deferred with C23–C26. Audit reports are immutable artifacts with indexed candidate/scope/verdict references. Uniqueness constraints protect event, command and accepted-task identity. B1 must test transactional and recovery behaviour rather than assuming a database library guarantees it.

**C22 File publication.** Write a temporary artifact, flush its bytes, verify it, publish it using atomic rename and the supported platform persistence operations, then commit its reference. Files and SQLite do not share a transaction. Recovery reconciles orphan files, missing files and hash mismatches. Keep suspicious evidence for inspection; never infer a PASS from a recoverable file.

## 7 RabbitMQ delivery and recovery

[DEFERRED_TO_V3 — pilot profile]

**C23 Transport.** Run one local broker for the pilot. Use durable production/auditor queues, persistent messages, bounded prefetch, publisher confirms and manual consumer acknowledgements. Publish work commands with `mandatory` routing and correlate returned messages with command IDs. A confirmation alone cannot establish routing to a queue. Separate commands from any event-feed transport. The UI cannot consume worker assignments. Queue messages contain compact IDs and immutable references, not full corpora or credentials.

[DEFERRED_TO_V3 — pilot profile]

**C24 Completion order.**

1. Persist the attempt before the provider request or consequential tool operation.
2. Produce and durably publish the required artifact or failed-attempt evidence.
3. In one SQLite transaction, condition acceptance on the current controller generation, valid task lease/fencing token and legal task state; then commit the verified artifact reference, attempt outcome, event, controller-approved transition and next-command outbox entry where applicable.
4. Return the durable commit receipt to the consuming worker.
5. That original consumer ACKs the delivery on its own channel.
6. The outbox publisher sends pending commands with mandatory routing, correlates returns/nacks/confirms, and marks dispatch successful only when routing and confirmation succeed. An unroutable command remains pending/failed for bounded repair. A crash between publish and recording dispatch may cause duplicate delivery; consumers handle it by stable identity.

[DEFERRED_TO_V3 — pilot profile]

**C25 Delivery semantics.** At-least-once delivery is expected. Do not promise exactly-once model calls, exactly-once billing or immunity to disk loss. Duplicate completed commands produce no second accepted output. In-flight duplicates cannot acquire a second valid lease. If a provider accepted a call before a timeout or crash, record `unknown_provider_result`; retain reserved cost and use an explicit retry policy. Use provider idempotency only when that exact endpoint documents and verifies it.

[DEFERRED_TO_V3 — pilot profile]

**C26 Failure control.** Retry transient delivery failures with bounded backoff. Poison or structurally invalid work is quarantined rather than requeued forever. Reconnect recovery preserves pending work and attempts. Controller restarts verify the run lock/fencing generation, ledger integrity, artifact hashes and pending outbox before dispatch. Lock age alone does not establish that another executor is dead.

Acquire a new monotonic controller generation through an atomic ownership operation on restart. Every completion, workflow transition, reservation and outbox authorization uses a conditional write against that current generation and task lease. Expired or superseded workers receive no acceptance/next-work receipt. Retain their isolated artifacts and valid cost evidence as history without advancing the workflow. Transport redelivery, provider requests and candidate remediation have separate bounded counters; a redelivery that makes a new provider request also consumes a generation attempt.

## 8 Workflow state and budgets

**C27 States.** Run states include draft, preflight, awaiting_configuration, running, awaiting_review_artifact, paused_budget, quarantined, release_ready, publish_blocked, deploying, live_verified and failed. Task states distinguish queued, claimed, running, output_saved, validating, awaiting_audit, accepted, route_back, retry_wait, blocked, quarantined, failed and unknown_provider_result. Define legal transitions in code and reject stale or unauthorized events.

Model completion is not artifact acceptance. Content acceptance is not application acceptance. Release readiness is not deployment or market validation. The controller enforces those distinctions; the visualization cannot change them.

**C28 Bounded pilot.** Default structural limits for v0.4.0 review are one probe/run and one active task at a time, including curriculum and audit calls, two automatic attempts per logical task, and one remediation cycle across the root candidate lineage. An existing stricter contract wins. A second failure routes to declared escalation or a parked state; no third cheap attempt or silent gate reduction. Allow at most one separately budgeted stronger-model escalation attempt per stage/input lineage. Changing model, task ID, attempt ID or candidate hash never resets the lineage counters. A source/input change must record its cause and keep the declared overall run limits.

**C29 Money and time.** Total, per-provider, per-call and per-role limits must be set before spend. Use dry-run estimates by default and the existing explicit `--go` spend convention. Reserve a conservative maximum before dispatch; reconcile reported usage afterward. Missing usage or uncertain results remain unknown and retain a bounded reserve. Record currency, price source/date and whether cost is estimated or actually reported. Credits are context, not proof of available balance or a hard billing cap. No unlimited call may be dispatched because a provider is absent from the budget table.

The collector atomically checks spent plus outstanding reservations against every applicable cap, then records the reservation and authorizes the corresponding ledger-queue task in that transaction. The larger system's outbox command is deferred. No job may use an unprotected read-then-reserve sequence. Reconciliation and reservation release are attributable ledger transactions. Preflight requires monetary per-call limits, per-role limits, token limits, applicable retry limits and deadlines; a token cap does not substitute for a monetary cap.

**C30 Intervention.** Record architecture choices, corrections, overrides, manual edits, source additions and gate resolutions as attributable human events. Separate engineering-assistant work from measured production work. Measure actual effort where observed; mark unavailable effort unknown rather than manufacturing a low-intervention percentage.

## 9 Meta execution and independent review

**C31 Meta lane.** The measured authoring executor is a qualified standard Meta model through the documented Model API or an explicitly selected permitted Meta openweights provider. Honour the local prohibition on Contributor mode for Nova content. Configuration pins the request model and records the returned model/provider identity. Requalify incompatible endpoint/schema behaviour; strict-schema projection is an adapter, not evidence that the content is true.

Muse Code, Fable, Argon, Codex or other engineering assistants may help construct or review the apparatus when permitted. Their assistance is separately logged. Running an engineering assistant does not establish that measured product generation used Meta.

**C32 Qualification.** Criteria are frozen separately in qualification/CRITERIA-04-text-first.json. The pending binding-instance template references their hash and records selected-state source, model, adapter and independently committed held-out evidence. The legacy RUBRIC-04-road-signs filename is an index only; the first task is a text-first selected-state chapter. No state, chapter or source is selected here. PASS requires fifteen covered-correct held-out outcomes, zero omissions/contradictions/qualifier loss, exact card/source/hook checks, real accounting and hashed evidence. Ledger seal sequence precedes the first attempt; timestamp or controller self-attestation alone is insufficient. tools/qualify-04.mjs validates existing evidence read-only and makes no call. Missing, nullable or mismatched PASS evidence fails. Other roles retain bounded independently accepted first-artifact qualification policy, not current qualification. No report or qualification run is created by this package.

**C33 Audit pool.** Require two eligible distinct provider families for the assigned content-review scopes, supplementing07/08/B1. Eligibility is evaluated at actor, session and provider-family level against exact candidate semantic-byte and authoring-prompt lineage. A family that authored or edited those bytes/prompts cannot approve that scope. A new Claude session does not cure a Claude-family candidate edit; GPT-authored candidate prompts disqualify the OpenAI family. Existing provider/model strings are candidates only. Google remains unconfigured/inactive until an explicit qualified assignment; do not silently activate it or claim two eligible auditors where only one remains. Missing lineage, a missing actor identity or fewer than two eligible families yields HOLD before dispatch. Tool/schema implementation authorship alone is not semantic content authorship unless that tool supplies or changes the candidate's meaning; record transformations and their actual semantic authors. No actual candidate lineage or eligible pair exists in this review package.

**C34 Two candidate boundaries.** Content QA binds to a ContentCandidateManifest covering exact source, graph, curriculum, scripts, media, schema and configuration hashes. It runs before packaging/runtime. Product QA binds to a later ReleaseCandidateManifest covering the assembled code, configuration, content, assets and relevant services. Early 07/08 reports do not claim to have tested later code.

The final release audit bundle contains current 07/08 evidence, B1 executed product-QA evidence and the required independent-provider reports. Each report declares the exact candidate identity and its scoped input hashes. Reusing an unchanged content report through a later release requires a deterministic delta receipt proving the relevant content is unchanged. The provider review panel may inspect different declared scopes; unanimous prose cannot replace source or test evidence.

**C35 Findings and repair.** Reports identify check, severity, exact artifact/hash/revision, source or reproducible test evidence and repair route. Every assigned scoped report must PASS against the same candidate seal, with no unresolved blocking finding. A split, missing report, stale hash or supported factual defect holds acceptance; there is no majority vote. The qualified measured Meta executor performs assigned generated-content repairs; engineering-assistant edits are recorded in the intervention ledger. A semantic edit invalidates affected acceptance and the editing actor/provider family becomes ineligible for that scope. Retest independently on the new seal.

**C36 Invalidation.** Changed facts invalidate affected graph/content, assessments, narration/media, audits and packages. Changed unit bindings invalidate assembly and applicable learner checks. Changed code/UI/configuration invalidates applicable B1, discovery and release checks. Retain prior reports as history, mark their current applicability explicitly, and rerun only the necessary dependency closure. Never modify a report's candidate hash to make stale acceptance appear current.

## 10 RDMV learning and source acceptance

**C37 Source authority and rights.** Use the selected issuing agency's current handbook, eligibility and testing material as factual authority. Competitors inform demand only. Snapshot retrieval dates, effective dates, URL/locator, hash, jurisdiction and source tier. Separate source authority from permission to copy/adapt text or media. Record item-specific rights and permitted uses before reproduction or public packaging. State government publication is not a federal-public-domain shortcut.

**C38 Coverage and teaching.** Derive selected-state coverage from official objectives or explicitly labelled handbook sections; never invent official weights. Structured decompression lives in the 05.sessions TeachingUnit adapter: why/how, worked example, misconception/correction, memory support and aligned self-check/rationale, with fact-tagged learner spans. The local schema and deterministic metrics give each promise a machine-checkable home. CardDeck remains a faithful converter. Keep thresholds, exceptions and qualifiers exact, and require every claim on its cited snapshot page; parametric knowledge is not a source. The practice-only 06 overlay governs unknown official exam facts.

**C39 Assessment boundaries.** Official sample questions establish only what their issuer says they establish. Do not present authored questions as leaked, actual or exhaustive exam questions. Do not infer complete coverage, universal passing thresholds, pass probabilities or learner readiness from sample-test scores. Every item binds to an objective and source; its answer and rationale agree, distractors are checked, and ambiguity is resolved before acceptance.

**C40 Product boundary.** The first pilot is the declared knowledge-preparation product. Licensing eligibility, required courses, supervised practice, vision checks, road skills and actual licensing outcomes remain distinct. Do not claim official affiliation or qualification to drive from completing this product. Product copy and learner progress use the frozen scope and appropriate source-supported language.

## 11 Runtime media and release acceptance

**C41 Learning loop.** Preserve the applicable source-grounded session → memory hook → flashcards → hub → assessment path and the canonical YouTube entry when a real catalog is included. Missing video must skip cleanly. The selected syllabus controls content, limits and progress; jurisdiction or version switches cannot leave stale content or scores behind.

**C42 Audio and visuals.** Pre-generate narration; do not introduce live TTS. Card scripts consume approved card backs. Prosody changes delivery, not words. Verify source/media rights, real files, hashes, segment bindings, applicable loudness/pause constraints and render-back fidelity. No facade assets or references to missing clips. Any media scope omission is declared before acceptance and reconciled with the inherited product requirements.

**C43 Application QA.** Independent B1 assignment tests actual arrival, first study minute, navigation, lesson/card/audio/test behaviour, missed review, progress persistence, version consistency, mobile and keyboard use, error states and the stated free/paid boundary. Declare test accounts, environment and checked scope. Tool response 200, a screenshot or a clean build alone is not product acceptance.

[DEFERRED_TO_V3 — pilot profile]

**C44 Dev and prod.** The dev preview remains free of Clerk/Stripe friction. The prod variant uses the applicable Clerk auth and one-time Stripe model with its free taste tier. Test configuration and webhooks independently; do not perform real money operations by default. Separate the app, generate its Product Playbook, resolve blocking findings, and bind acceptance to exact source/build/content hashes.

**C45 Reserved gates.** Preserve exactly the existing founder-facing reserved gates: launch_commit/LaunchApproval, genuinely required clinical/legal review/ExternalReviewArtifact, and external_publish/DeployApproval. They consume genuine returned artifacts and do not become live questions. Fable/Argon contract review and automatic quality checks are not new founder permission gates. A missing publish approval leaves a ready release packet in publish_blocked; it does not invite a fabricated signature or a blocked infinite loop.

## 12 Factory floor and evidence

[DEFERRED_TO_V3 — pilot profile]

**C46 Role-based floor.** The visualization shows the actual V1 departments and role IDs, continuous rails, build workshop, repeated 20A/05 responsibilities and separate review pool. In live mode provider shirts identify actual execution identity; design preview labels proposed assignments. Each selected bot exposes its assigned contract path/hash, required inputs/output, acceptance and failure route, qualification state and applicable stage specialization. Scripted operations are machines. Foundation contracts are visibly separate from per-product work. It must remain usable when every role is idle, blocked or disconnected.

[DEFERRED_TO_V3 — pilot profile]

**C47 Event truth.** Robots and conveyors respond only to committed events in live mode. The floor cannot mark work accepted, dispatch unauthorized tasks or consume the worker queues. Display queued, working, output saved, awaiting inspection, accepted, repair and blocked as distinct states. Mark stale/disconnected feeds. Every inspection exposes the input, output, provider/model, usage, duration, attempts and current finding references.

[DEFERRED_TO_V3 — pilot profile]

**C48 Replay.** The live feed supports a collector-assigned sequence cursor, duplicate suppression and reconnect catch-up. Replay and design preview are labelled prominently and cannot issue work or spend. Per-run JSONL is derived from committed events, not independently double-written truth. Video may compress a real recorded run if elapsed time and replay status remain clear. Never fabricate a live result to improve the demo.

[DEFERRED_TO_V3 — pilot profile]

**C49 Event fields.** Version the event envelope: event/run/task/stage/role/attempt/command/causation IDs; collector sequence and UTC occurrence/commit times; provider/model/request identity; contract/schema/prompt/input/output hashes; artifact references; state transition and evidence; queue/execution duration; reported usage; estimated/reported cost; retries, errors and human intervention. Missing values are nullable and carry an availability reason. Distinguish counters that overlap so cached/reasoning tokens are not double-counted.

Measure local elapsed durations with a monotonic clock. Use UTC for dates and the collector sequence plus causation for replay ordering; wall-clock timestamps alone do not establish causal order. Money accounting uses a declared integer micro-unit or exact-decimal representation rather than binary floating-point totals.

[DEFERRED_TO_V3 — pilot profile]

**C50 Efficient logging.** Persist lifecycle changes and individual completed calls rather than every streamed token. Keep bulk text and binaries in referenced files. Snapshot model-facing prompts, responses and tool results as permitted; do not demand or invent hidden chain-of-thought. Redact credentials and sensitive material before public export. Capture errors and accounting events without sampling them away. Checkpoint and back up SQLite through a supported consistent method; never copy an active database while omitting relevant WAL state.

## 13 Public contribution and evaluation

**C51 Contribution record.** Inventory pre-event Nova methods, contracts, source code, assets and the local setup/smoke scaffold separately from event-built work. The public repository and demonstration must identify the new contribution. Verify actual repository visibility; package metadata is not visibility evidence. The dated [rules review](RULES-REVIEW.md) records that meaningful Meta use is explicit, a blanket other-LLM ban was not found, and indie reuse remains unresolved. Resolve applicable reuse and scope conditions before importing prior code into the entry.

**C52 Public evidence.** Publish only permitted source material, code, assets and sanitized run evidence. Keep credentials, private source copies, account data and customer data out of the public package. Preserve locators and hashes when a source snapshot cannot be redistributed. Make reproduction instructions explicit about any externally obtained inputs, model access, costs, cached assets and measured versus unexecuted checks.

**C53 Baseline honesty.** No DMV V1 artifact was verified for this draft. Do not call a new experiment a historical DMV V1→V2 improvement. If a control is built from Nova's prior method during the event, label its creation date, inputs and model accurately. An overall workflow comparison and a same-task model comparison answer different questions. Claims of Meta superiority need matched tasks/prompts/budgets and acceptance conditions; instructional ratings do not establish learner outcome gains.

## 14 Acceptance and failure injection

**C54 Definition of done.** Package-level pilot_status preview_ready means content and validated UiSpec are accepted for local assembly; it is not application or deployment acceptance. The later application-preview receipt binds immutable package/runtime/code/config/assets and independent B1 checks, three actual fault-test receipts, source/rights/coverage/accounting and all applicable acceptance. It never mutates the accepted09package or becomes an input to it. Static finish criteria are defined beforehand. No candidate, successful test or live product exists by virtue of this review package.

Minimum acceptance predicates are no missing required artifact/source/media references, complete coverage of the declared objectives, no unresolved known factual/jurisdiction/version error, checked answer/rationale agreement for every assessment item, no unresolved blocking audit or product defect, and executed evidence for every required check. Record the factual review method and audited scope. An unexecuted or sampled check cannot be relabelled exhaustive; no universal correctness or learner-outcome guarantee follows from a PASS report.

**C55 Required tests.** The pilot has exactly three blocking fault tests: duplicate command, crash after artifact write before ledger commit, and source-supported auditor defect. Execute and save their results before claiming the corresponding capability. The other twelve rows are deferred history. All tests are unexecuted in this review package; other active factual, schema, rights and product-acceptance obligations still apply.

| Test | Required observed outcome |
|---|---|
| Duplicate command (pilot; outbox replay deferred) | One accepted logical result; no unaccounted provider attempt; stable command deduplication |
| [DEFERRED_TO_V3 — pilot profile] Unroutable command with a publisher confirmation | Mandatory-return handling prevents a false dispatched state; bounded routing repair preserves the pending work |
| Crash after artifact write before ledger commit | Reconciled files/state; no invented acceptance or lost committed handoff |
| [DEFERRED_TO_V3 — pilot profile] Crash after publish before outbox sent marker; before ACK | Redelivery is handled safely; no second accepted output |
| [DEFERRED_TO_V3 — pilot profile] Provider timeout after possible acceptance | Explicit uncertain outcome and cost reserve; bounded retry decision |
| [DEFERRED_TO_V3 — pilot profile] Broker loss, SQLite busy/disk-full, process restart | Inspectable backlog and bounded failure; resume only after integrity checks |
| [DEFERRED_TO_V3 — pilot profile] Expired/stale worker and concurrent completion | Fencing rejects stale ownership and conflicting accepted writes |
| [DEFERRED_TO_V3 — pilot profile] Wrong state, stale rule, missing exception or unsupported answer | Appropriate source/coverage gate fails with evidence |
| [DEFERRED_TO_V3 — pilot profile] Broken unit/media link, voice mismatch or inconsistent rationale | Validation/QA blocks packaging or release |
| [DEFERRED_TO_V3 — pilot profile] Accepted artifact or source version changes | Dependency-aware invalidation; stale reports cannot pass the new candidate |
| Source-supported dissent from one auditor | No majority override; defect is repaired or acceptance remains held |
| [DEFERRED_TO_V3 — pilot profile] Source text asks to change permissions or leak credentials | Treated as data; unauthorized action rejected and recorded |
| [DEFERRED_TO_V3 — pilot profile] Floor stream interruption, duplicate events and absent usage | Stale/unavailable state shown honestly; replay recovers ordered progress |
| [DEFERRED_TO_V3 — pilot profile] Publish without approval or real-charge operation without spend authority | Rejected and recorded; ready packet remains inspectable |
| [DEFERRED_TO_V3 — pilot profile] Reproduction from clean permitted inputs | Declared artifacts and checks reproduced within recorded scope and differences |

## 15 Delivery and later sales boundary

**C56 Reviewable deliverables.** The v0.4.0 package pins revised contracts, typed policies, ten reusable bodies and separate header, local TeachingUnit/UiSpec schemas, frozen qualification criteria plus pending binding instance/report schema, read-only checkers and pure fixture-test evidence. Claude-owned adapters/post-validator and their actual receipts must be pinned when received; missing files stay declared pending. Preserve the v0.3.0 bytes/report rather than carrying its verdict onto revised content. Future execution deliverables remain actual scoped artifacts, separate content/release seals, independent audits, application QA, accounting and fault receipts. The animated floor remains deferred.

**C57 Later sales handoff.** The production output supplies a verified manifest of actual coverage, features, prices/access policy when configured, supported scope, source versions and current release status. Later roles 22 Sales Signal, 10 Launch/Growth, B7 Signal/Data, 11 Outcomes, 23 Objections and 24 Portfolio Allocation consume it. They cannot advertise unverified features or manufacture customer results. Marketing execution, launch approval and conversion claims retain their own rules; none is a substitute for production acceptance.

**C58 Review handoff.** Fable and Argon review the exact v0.4.0 target hashes and FB-01 through FB-20 disposition/evidence. An awaiting-Claude package is labelled as such; it is not an all-findings-closed or execution-ready result. Their existing reports remain immutable historical evidence. The founder arranges review sessions; no message or reviewer signature is fabricated.

## 16 Bot contract assignments

**C59 Binding authority and drift.** `contracts/bot-contract-bindings.json` is the machine-readable assignment registry for this draft. It declares 47 existing role seats: 46 pinned canonical contracts and one pinned project-local UI contract. It also retains the existing 07/08/B1 contract family for three registered provider bots, with Google inactive for the pilot. The full canonical contract bytes, their amendments, applicable schemas and this reviewed V2 overlay govern each assignment. Extracted snippets and dashboard summaries aid inspection; they never replace the full contract or establish execution order.

Each role entry records a stable `bot_id`, existing `role_id`, contract path, SHA-256 and byte count, proposed execution lane, provider/model and qualification state, schema references, acceptance/failure excerpts, stage specializations and restrictions. Resolve canonical `factory/` and `schemas/` paths relative to `D:/nova`; resolve `pinned_local` `contracts/` paths under `D:/nova/fb-ai-hackathon`. Selected run-configuration references resolve relative to that configuration's directory. Missing files, hash drift and pending state/source bindings remain explicit. Never silently refresh a frozen run's pins or borrow another probe's contract.

The package checker defaults to read-only validation of the saved registry against its declared role roster and actual canonical files. It needs no personal dashboard path, API key, broker or paid call. Optional preview-parity checks are labelled separately. `--write` is a package-maintenance operation outside review and outside a frozen run; reviewers must not use it to make a mismatch disappear. Pin the final registry hash in the run assignment envelope and REVIEW-BUNDLE.json, rather than introducing a circular hash between this contract and the registry.

**C60 Assigned role bots.** The roster retains47seats,27 active and 20 inactive. Meta authors the declared model-dependent stages.09 and 19A are deterministic tool-assisted responsibilities with planned scripts; their role instructions are not billed as Meta generation. UI is pinned locally and state/source-bound.07/08require actual lineage-eligible provider assignments. No role is marked executed or qualified without scoped evidence.

<!-- BOT-ASSIGNMENT-ROSTER:START -->
| Role / bot | Pilot status | Proposed execution responsibility | Pinned contract |
|---|---|---|---|
| 00 Orchestrator · `nova-role-00` | `active_pilot` | Tool-assisted | `factory/workers/00-orchestrator.md` |
| 01 Market Scout · `nova-role-01` | `inactive_for_pilot` | Meta authoring | `factory/workers/01-market-scout.md` |
| 01b Competitive Intel Gatherer · `nova-role-01b` | `active_pilot` | Meta authoring | `factory/workers/01b-competitive-intel-gatherer.md` |
| 02 SME Research Agent · `nova-role-02` | `active_pilot` | Meta authoring | `factory/workers/02-sme-research-agent.md` |
| 03 Knowledge Architect · `nova-role-03` | `active_pilot` | Meta authoring | `factory/workers/03-knowledge-architect.md` |
| 04 Flashcard Engineer · `nova-role-04` | `active_pilot` | Meta authoring | `factory/workers/04-flashcard-engineer.md` |
| 05 Audio Narration Coach · `nova-role-05` | `active_pilot` | Meta authoring | `factory/workers/05-voice-coach.md` |
| 06 Exam Author · `nova-role-06` | `active_pilot` | Meta authoring | `factory/workers/06-exam-author.md` |
| 07 Coverage Auditor · `nova-role-07` | `active_pilot` | Independent audit | `factory/workers/07-coverage-auditor.md` |
| 08 Hallucination Auditor · `nova-role-08` | `active_pilot` | Independent audit | `factory/workers/08-hallucination-auditor.md` |
| 09 Product Publisher · `nova-role-09` | `active_pilot` | Tool-assisted deterministic | `factory/workers/09-product-publisher.md` |
| 10 Launch & Growth · `nova-role-10` | `inactive_for_pilot` | Meta authoring | `factory/workers/10-launch-growth.md` |
| 10A Search Operations · `nova-role-10a` | `inactive_for_pilot` | Meta authoring | `factory/workers/10a-search-operations.md` |
| 10B AI Discovery · `nova-role-10b` | `inactive_for_pilot` | Meta authoring | `factory/workers/10b-ai-discovery.md` |
| 11 Outcomes Analyst · `nova-role-11` | `inactive_for_pilot` | Meta authoring | `factory/workers/11-outcomes-analyst.md` |
| 12 Factory Registrar · `nova-role-12` | `active_pilot` | Tool-assisted | `factory/infra-roles/12-factory-registrar.md` |
| 13 Schema Steward · `nova-role-13` | `active_pilot` | Tool-assisted | `factory/infra-roles/13-schema-steward.md` |
| 14 Artifact Validator · `nova-role-14` | `active_pilot` | Tool-assisted | `factory/infra-roles/14-artifact-validator.md` |
| 15 Evidence Librarian · `nova-role-15` | `active_pilot` | Tool-assisted | `factory/infra-roles/15-evidence-librarian.md` |
| 16 Blueprint Compiler · `nova-role-16` | `active_pilot` | Tool-assisted | `factory/infra-roles/16-blueprint-compiler.md` |
| 17 KG Input Enricher · `nova-role-17` | `active_pilot` | Tool-assisted | `factory/infra-roles/17-kg-input-enricher.md` |
| 18 Dynamic Facts Monitor · `nova-role-18` | `inactive_for_pilot` | Tool-assisted | `factory/infra-roles/18-dynamic-facts-monitor.md` |
| 19 Learning Science Calibrator · `nova-role-19` | `active_pilot` | Tool-assisted | `factory/infra-roles/19-learning-science-calibrator.md` |
| 19A Curriculum Unit Grouper · `nova-role-19a` | `active_pilot` | Tool-assisted deterministic | `factory/infra-roles/19a-curriculum-unit-grouper.md` |
| 20 Audio Production Engineer · `nova-role-20` | `inactive_for_pilot` | Tool-assisted | `factory/infra-roles/20-audio-production-engineer.md` |
| 20A Image Scout · `nova-role-20a` | `inactive_for_pilot` | Meta authoring | `factory/infra-roles/20a-image-scout.md` |
| 20B Prosody Director · `nova-role-20b` | `inactive_for_pilot` | Meta authoring | `factory/infra-roles/20b-prosody-director.md` |
| 21 Runtime Adapter · `nova-role-21` | `active_pilot` | Tool-assisted | `factory/infra-roles/21-runtime-adapter.md` |
| 22 Sales Signal Agent · `nova-role-22` | `inactive_for_pilot` | Meta authoring | `factory/infra-roles/22-sales-signal-agent.md` |
| 23 Objection Miner · `nova-role-23` | `inactive_for_pilot` | Meta authoring | `factory/infra-roles/23-objection-miner.md` |
| 24 Portfolio Allocator · `nova-role-24` | `inactive_for_pilot` | Meta authoring | `factory/infra-roles/24-portfolio-allocator.md` |
| 25 Executive Assistant · `nova-role-25` | `inactive_for_pilot` | Tool-assisted | `factory/infra-roles/25-executive-assistant.md` |
| KG-01 Concept Extractor & SME-Verifier · `nova-role-kg-01` | `active_pilot` | Meta authoring | `factory/kg-department/kg-01-concept-extractor-verifier.md` |
| KG-02 Ontologist / Structure Architect · `nova-role-kg-02` | `active_pilot` | Meta authoring | `factory/kg-department/kg-02-ontologist.md` |
| KG-03 Dependency Mapper · `nova-role-kg-03` | `active_pilot` | Meta authoring | `factory/kg-department/kg-03-dependency-mapper.md` |
| KG-04 Weight & Difficulty Calibrator · `nova-role-kg-04` | `active_pilot` | Meta authoring | `factory/kg-department/kg-04-weight-difficulty-calibrator.md` |
| KG-05 Path Sequencer & Module Builder · `nova-role-kg-05` | `active_pilot` | Meta authoring | `factory/kg-department/kg-05-path-sequencer.md` |
| UI Probe UI Architect · `nova-role-ui` | `active_pilot` | Meta authoring | `contracts/ui-rdmv-tx.md` |
| B1 Build Lead / Engine GC · `nova-role-b1` | `active_pilot` | Build engineering | `factory/build-crew/B1-build-lead.md` |
| B2 Database / Platform · `nova-role-b2` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B2-database-platform.md` |
| B3 Orchestrator / Backend · `nova-role-b3` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B3-orchestrator-backend.md` |
| B4 Agent Integration · `nova-role-b4` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B4-agent-integration.md` |
| B5 Frontend / App · `nova-role-b5` | `active_pilot` | Build engineering | `factory/build-crew/B5-frontend-app.md` |
| B6 SEO / Pages · `nova-role-b6` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B6-seo-pages.md` |
| B7 Signal / Data · `nova-role-b7` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B7-signal-data.md` |
| B8 Media / Audio · `nova-role-b8` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B8-media-audio.md` |
| B9 Local Setup / Bash-IaC · `nova-role-b9` | `inactive_for_pilot` | Build engineering | `factory/build-crew/B9-local-setup-bashiac.md` |
<!-- BOT-ASSIGNMENT-ROSTER:END -->

No row creates a new factory role, separate service or qualified model. The registry pins the exact bytes of every concrete path above; the bundle pins the registry itself. The complete B1–B9 workshop and later sales roles are included for ownership visibility without activating later work.

**C61 Stage-specific execution assignments.** A reusable role contract is resolved into a separate run assignment for every distinct phase. At minimum preserve `02` draft/improve, `20A.pre_kg`/`20A.post_kg`, `05.sessions`/`05.card_scripts`, and UI early media/voice intent versus final UISpec draft/improve. These responsibilities reuse their role bot; they do not share one completion receipt. KG specialties may be declared substeps of the combined 03 pass, with their intermediate evidence retained.

Before dispatch, record the registry snapshot hash, bot/role/stage IDs, full contract/schema hashes, accepted input refs, expected output, acceptance checks, failure route, tool/write boundaries, deadlines, bounded retries, budget and qualified executor. Tool-only stages identify the script/version; model stages identify the actual endpoint/model and qualification evidence. For role 20 separately name the audio-render provider. Never infer it from a Meta shirt or text-model assignment. Validate and accept the produced artifact before authorizing the next task. A replacement executor must satisfy the same pinned assignment; changing executor or meaningful configuration follows C19/C36 invalidation and C28 lineage limits.

**C62 Independent-provider bots.** The three existing provider seats are candidates subject to C33/C68 actor/session and provider-family exclusions. The earlier OpenAI/Anthropic pair is not presumed eligible. GPT-authored authoring prompts exclude OpenAI for their candidate scope. Google stays inactive/unconfigured until an explicit qualified assignment; fewer than two eligible families remains a configuration blocker, never a reason to waive independence. Actual calls, model IDs and evidence are absent.

| Bot | Proposed provider | Eligible existing responsibilities | Required run-specific disposition |
|---|---|---|---|
| `audit-openai` | OpenAI | 07 coverage, 08 factual QA, B1 product-QA assignment | Model, scope, candidate seal, tools, rubric, budget and blocking criteria |
| `audit-claude` | Anthropic / Claude | 07 coverage, 08 factual QA, B1 product-QA assignment | Model, scope, candidate seal, tools, rubric, budget and blocking criteria |
| `audit-google` | Google — `inactive_for_pilot` | Retained 07/08/B1 eligibility; no pilot work | Future reviewed activation required |

Eligibility does not assign every provider every check, certify a completed review or substitute for the 07/08/B1 owners. Coverage requires completeness evidence; factual review requires applicable source access; product QA requires executed application checks. A text-only review cannot satisfy browser, payment, media or service acceptance. Preserve B1's existing named independent tester binding and implementer/tester separation; the provider pool does not automatically reassign it. Fable/Argon review of this contract is separate from later product acceptance. Required independent provider calls must actually occur within their declared scopes before counting them in the release evidence.

**C63 Binding and schema applicability.** The local UI contract and UiSpec schema are actual project files. Role13 teaching-schema absences retain only their explicit scoped disposition; structured decompression now has its own local TeachingUnit schema and must be validated, not waved away. Existing canonical scripts/schema shapes apply only through declared payload mappings. All ten provider references are pilot adapters where meaning changes; their actual hashes, dropped-invariant coverage and Claude test receipts are required before dispatch. A saved registry can pass integrity while reporting missing implementation, qualification, lineage or state/source configuration. Binding integrity never authorizes execution.

**C64 Review acceptance for assignments.** Verify all 47 seats, 46 unchanged canonical pins plus local UI, actual 27/20 split, deterministic 09/19A, eligible-auditor policy, separate body/header hashes, structured teaching/qualification schemas and explicit pilot overrides. Run the two read-only checker commands; retain actual outputs, missing dependencies and all unexecuted checks. Local pure fixture tests are not the three future controller fault tests or a production result. No stale candidate/report/prompt pin may pass, and no provider change resets retries or weakens acceptance.

## 17 v0.4.0 enforceable artifact and review interfaces

**C65 Structured decompression (FB-03).** Role 05.sessions owns the local `TeachingUnit` artifact defined by `contracts/teaching-unit.schema.json`, adapted into its provider schema by Claude. Each unit has source-bound objectives, why/how spans, a worked example, misconception and correction, memory support, self-check prompt/answer/rationale, and a complete slide sequence. Learner content is structured as text/fact-ID spans; required spans resolve 100% to accepted source facts. Navigation chrome and controller metadata are outside instructional spans. Qualitative length alone is insufficient. Deterministic metrics check required component counts, fact resolution and Order Q depth limits; source-grounded 08 review checks meaning. Role 04 remains a converter of accepted facts with sourced spoken-form backs/hooks. Its qualification grades card coverage/fidelity/hooks, not an undeclared unit-level teaching claim.

**C66 Prompt-body/header boundary (FB-04).** Each role file contains only reusable task instructions and bound-input placeholders. Controller mode, current state, review/qualification/production authority, execution-enabled status, candidate scope, tool policy and actual refs are rendered from `prompts/controller-header.template.json` outside that body. Pin body, rendered header and complete request independently. The package and default header remain review-only/execution-disabled. Removing review-mode prose from a reusable body grants no execution authority. Pre-seal output uses an input-manifest hash plus stable candidate lineage ID. The final content manifest includes those output hashes; only later 07/08 reports echo its final digest. Do not introduce a self-hash or downstream-QA dependency cycle.

**C67 Frozen criteria and scoped qualification instance (FB-05).** Qualification criteria, required tests and PASS predicates are immutable versioned bytes pinned now. State/source/model/schema/held-out bindings live in a separate instance referencing that criteria hash. Filling instance values must not modify criteria. The independent held-out seal and auditor-call receipt are committed to the actual ledger with a sequence strictly before the first generation attempt; report self-attestation is insufficient. Fifteen item outcomes distinguish covered_correct, qualifier_loss, contradicted and not_covered; PASS requires 15 covered_correct and zero errors/omissions. Null evidence cannot validate as PASS. `tools/qualify-04.mjs` performs read-only evidence validation; it makes no call and writes no qualification report. No report exists now. TeachingUnit structural metrics are checked separately from 04 conversion. Bounded first-artifact qualification for other roles remains scoped, independently accepted and never presumed complete.

**C68 Independence and intervention evidence (FB-06).** 07/08 assignments bind an actual intervention ledger and the authoring-prompt provenance pin. Inspect every semantic candidate edit and every prompt used to produce that scope. Enforce C33 at actor/session plus normalized provider family. Missing lineage fails closed. A Claude-edited card rejects audit-claude for that scope; a GPT-authored production prompt rejects the OpenAI family. Deterministic fixture tests demonstrate those exclusions without qualifying a real auditor. Required-family availability remains a configuration prerequisite; neither the checker nor the review packet invents an eligible pair. Contract-review reports are not substituted for product-audit calls.

**C69 Text-first qualification and conditional sign intake (FB-07).** The first 04 qualification binds a text-first selected-state chapter. It neither requires missing images nor claims visual sign-recognition competence. Road-sign/image tasks are separate and cannot dispatch until role 15 registers a bound sign list, schema `contracts/sign-asset-intake.schema.json`: sign/item ID, official edition, state-supplement applicability, asset URL/local bytes/hash, page/fact refs and item-level rights/liveness evidence. Capture the current FHWA rights statement with retrieval date; do not assume blanket state-handbook or third-party rights. The unbound template is not a sign list. Every text cue still binds a selected-handbook fact/page. Enabling an image or sign-recognition task requires that real intake and early required-slot disposition before 04/07/UI consumption.

**C70 Nullable official facts and explicit practice overlay (FB-08/09).** Every official numeric fact uses a typed value/status/source-page binding. `(verify)`, absent page/snapshot/liveness evidence or an unconfirmed scope means UNKNOWN; the model-facing value is null. Raw candidate run-configs are never rendered wholesale into prompts. `tools/sanitize-model-input.mjs` creates a whitelisted safe view and does not promote candidate hints. Mastery thresholds resolve through an accepted LearningLoop ref as product policy, never an exam fact. `contracts/pilot-overrides-v0.4.0.json#/role_overrides/06` explicitly replaces the inherited exact-count/official-weight/passing-line/prediction obligations only for this practice-only pilot. 07 audits that local disposition while retaining exact source truth, honest actual counts, distractor quality and needs-review gates. No canonical parent file is changed.

**C71 Candidate-scoped QA, media and fresh sources (FB-10/11/12).** Every bound audit artifact hash must belong to the declared candidate manifest. Both content reports echo the same final candidate_sha256; mismatch or stale scope yields HOLD. Require every assigned scoped report PASS with no unresolved blocking finding. Legitimate adapter routes include 02/13/15/08 and existing owners. 07/09 consume the pinned early `contracts/media-disposition.json`, owned by 00/13, listing exactly which text-only checks are non-applicable; a late final UiSpec cannot invent this exception. 08 Step 1 resolves the registered source tier for every claim. Applicable sources require dated liveness/current-edition issuer evidence and resolved effective-date policy; stale or unknown applicability produces VerificationDebt, not PASS. `contracts/source-liveness-receipt.schema.json` defines evidence shape; the post-validator and independent source audit enforce actual bindings/freshness.

**C72 Retained craft, Order Q and exact word parity (FB-13/14/15/16).** The full contracts and override matrix enumerate retained/adapted requirements. 02 preserves A–G headers, ranked high-yield/known-or-authored emphasis, needs_dedicated_surface and typed corpus-volatility/blocked outcomes through bounded chunks and deterministic merge. 03 preserves typed KG gaps, edge origin, domain-emphasis checks and source refs for both sides of each confusable explanation. 19A is deterministic, with script-computed integrity, module_hub/hub_options and a preview_only ceiling. Order Q whole-file hash is labelled as such; prompts name applicable standing rules 1/5/6/7/9/15. Check needs_review zero, disclosed mock overlap, item-clone handling, at least six slides and average 400 narration characters, title/line limits, fresh source and titled-promise counts. Spoken-form 04 backs/hooks avoid unsafe unit abbreviations/symbols. 05 card scripts expose ordered question/think_ref/recall_pause_ms 3000/answer/teaching; answer and hook match accepted 04 text after declared meaning-preserving normalization. Stage directions are not narration. No audio-render receipt is implied by a text-script check.

**C73 Deterministic package, UiSpec validation and separate reviewer trace (FB-17/18/19/20).** 09 and 19A are tool-assisted. The local override matrix lists 09 SOP dispositions and names static finish criteria before packaging. Early UI intent precedes content inspection; final UI consumes the sealed content and validation receipts before 09 consumes UiSpec. 09 does not wait on a future Playbook or product QA. Its adapter carries pilot_status preview_ready/blocked plus status_scope content_package and an honest legacy parent blocked/status_reason. Later application readiness is a separate version-bound receipt after 21/B5/B1; do not rewrite the package after testing it. `contracts/ui-spec.schema.json` supplies the local oracle; draft → validate1 → improve → validate2 requires role 14 and independent evidence. Inherit the master template's media_intent/mobile_bundle/autonomy/failures/DoD/metrics. The domain hero is an evidence-bound sign-recognition drill; it remains unavailable until required assets exist. Seven learner routes exclude model/cost/intervention metadata; the eighth Trace route is reviewer-only with C50/C52 redaction and no learner navigation link. Use selected-state handbook wording throughout active bodies; legacy candidate filenames are labelled history and choose no state.

**C74 Claude adapter/post-validator lane (FB-01/02).** Claude owns the ten provider adapters, complete parent↔pilot deviation mappings, dropped-conditional invariant coverage, post-validator and per-adapter test receipts under the isolated hackathon folder. Meaning-changing outputs are explicitly pilot adapters, not false mathematical-subset claims. Sol supplies local TeachingUnit/UiSpec and policy contracts, prompt bodies and qualification interfaces without duplicating that owner lane. The handoff is `CLAUDE-V0.4.0-SCHEMA-HANDOFF.md`; the actual response is `coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json`. No placeholder receipt, nullable hash or file-presence check proves validation. Required tests include unknown weights without fabricated numbers, orphan-ready rejection, inactive-audio rejection, to_worker 02, exact candidate membership, five-slide rejection, exact back/hook segments and honest preview status. Keep these findings pending until the files, hashes and executed local test evidence actually exist. Local fixture validation never claims Meta endpoint acceptance, qualification or belt execution.

**C75 Revised review bundle and findings disposition.** Preserve the v0.3.0 manifest and its 19 target bytes under `review-history/v0.3.0/`, and preserve Fable's report unchanged. Bundle 0.4.0 supersedes 0.3.0 with newly pinned target bytes, a per-finding disposition and actual verification outputs. A revised package does not transfer Fable's old verdict onto new bytes. Missing Claude outputs yield an awaiting-owner status rather than a false all-findings-closed claim. State selection, actual sources, provider eligibility, model/tool availability, future qualification and execution authority remain separate prerequisites. The animated floor stays deferred. This is review-package work only.

## 18 Technical and source references

- [RabbitMQ reliability](https://www.rabbitmq.com/docs/reliability)
- [RabbitMQ acknowledgements and confirms](https://www.rabbitmq.com/docs/confirms)
- [RabbitMQ dead lettering](https://www.rabbitmq.com/docs/dlx)
- [SQLite WAL](https://www.sqlite.org/wal.html)
- [SQLite backup](https://www.sqlite.org/backup.html)
- [Meta API quickstart](https://dev.meta.ai/docs/quickstart)
- [Meta structured output](https://dev.meta.ai/docs/cookbook/structured-output)
- [Participant guide](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/details)
- [Waiver](https://cerebralvalley.ai/e/meta-ai-developer-hackathon/waiver)

These links support technical verification. The reviewed contract and pinned per-run configuration define the actual implementation obligations; later documentation changes require an explicit compatibility decision.
