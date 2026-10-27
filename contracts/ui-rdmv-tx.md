# UI Architect — regular passenger-car written-test preparation

Version 0.4.0. Project-local review contract; no implementation or acceptance receipt exists.

The filename `ui-rdmv-tx.md` is a legacy Texas-candidate label, not a state selection. State selection remains open. This contract creates no canonical probe or parent-contract amendment.

## Inheritance and pilot dispositions
Read the full `factory/ui-architects/_MASTER-UI-TEMPLATE.md`: domain-stuck theme, media-intent, engine-player and consumer-grade laws remain applicable. Explicit pilot dispositions: free text-first web preview; narration, native binaries/store submission, push/background audio, monetization and animated factory operations are deferred, never represented as delivered. Native affordances remain specified. Unknown official exam settings use an accepted practice-only plan. No factual, source or rights gate is waived.

**Mission:** Design a domain-specific sign/rule study experience whose hero is a sign-recognition drill rather than a generic hub.
**Inputs:** Stage UI.early_intent consumes scoped product/audience intent, available source/rights reconnaissance and the pilot media disposition; it does not require a completed ContentCandidateManifest or consume its own output. Stage UI.final_spec consumes the accepted ContentCandidateManifest and exact graph/card/session/exam/unit-map hashes; SourceRegistry and dated liveness; accepted LearningLoop; the already frozen early media intent and road-sign media disposition; selected scope; `contracts/pilot-finish-criteria.json`. ProductPackage is not an input. Pending source/state/rights blocks instructional acceptance.
**Outputs:** UiSpec JSON conforming to `contracts/ui-spec.schema.json` version0.4.0, early media intent and screen bindings. A separate UIAcceptanceBundle references the exact spec and four external receipts: schema+independent semantics for validate_1 and validate_2. Role09 consumes the accepted spec.

## Intent and domain context
Learners recognize signs, recall rules, preserve exceptions, apply them in original examples and inspect official sources. Scores describe observed practice, never licensing eligibility, driving competence or predicted success. Audience/age/path/language/edition are configuration, currently pending. Design for short phone/laptop sessions without assuming a particular age or ESL cohort.

## Theme — Clear Road
Readable navy/light-neutral surfaces and restrained teal navigation; traffic colours only for verified semantic meaning, always paired with text/shape. Domain display typography plus Atkinson Hyperlegible body, original road-study emblem, generous spacing and a stable card frame. Tone is practical and reassuring without agency impersonation. Motion respects reduced-motion preferences.

## Eleven domain-UX decisions
1. Primary interaction: read, think, tap and manual reveal; learning/testing separate; no required learner speech.
2. HERO: `sign_recognition_drill` within Cards. Accepted graphics ask meaning/action, then reveal sourced answer/exception after recall. A verbal-only disposition offers a labelled page-sourced cue task, never a claimed visual-recognition measurement. Required missing assets block the affected item.
3. Density: one rule and its necessary qualifier/example together; never detach an exception.
4. Practice: official settings only when source-verified; otherwise declared product-policy count/threshold/timing and non-predictive scoring.
5. Progress: observed completion/missed work, namespaced by syllabus. No metrics on teaching surfaces or pass prediction.
6. Accessibility: keyboard/focus, semantic headings, readable contrast, sign descriptions, targets≥44px,320px reflow. An answer-revealing accessible alternative is labelled a different equivalent learning task.
7. Onboarding: chosen scope/source before study; first card within3taps. Pending identity blocks content. Syllabus changes invalidate bindings and namespace progress.
8. Visual/tone: domain affordances, human errors and restrained celebration; no factory jargon or false affiliation.
9. Affordances: sign meaning/action/exception comparison, source page, revisit lesson, recall/reveal and missed review; no assumed microphone or image generation.
10. Monetization: all free; no account, checkout, lead capture or paywall.
11. Mobile bundle: specify one Expo/React Native theme/runtime shared with web, targeting iOS+Android; offline_cache, background_audio, push, deep_link and install affordances and store-listing name/icon/screenshots/category. Native delivery/background audio/push/store submission are deferred. Planned cache/deep links are not implemented evidence; mobile web reflow/touch/keyboard remain required.

## Exactly eight routes
Seven learner routes form learner navigation. The eighth is reviewer-only and is absent from learner Home, navigation, onboarding, results and footer.

| ID/path | Audience | Behaviour |
|---|---|---|
| home / | learner | Scope/edition/free entry; no Trace link; unbound study blocked. |
| chapter_hub /chapters | learner | Accepted unit map; lesson/cards/quiz choices, not the hero. |
| lesson /lesson/:unit | learner | Structured teaching, example, misconception, memory support/self-check and fact-bound source. |
| cards /cards/:unit | learner | Sign-recognition hero or honest verbal fallback; recall/reveal, answer/hook, source. |
| quiz /quiz/:unit | learner | Unit practice, supported rationales and missed review. |
| practice /practice | learner | Cumulative authored practice under declared product policy. |
| results /results/:attempt | learner | Recomputed observations and useful next study step. |
| trace /review/trace | reviewer | Static committed-ledger view, separate reviewer entry only. |

## Media intent and bindings
Early `media_intent` declares density, domain style, permitted roles, avoid list and per-module media_required/treatment/reason before content audits. Narration is unavailable for the pilot. Each card/slide declares a permitted media role; none has a reason. Optional graphics stay optional; required visual evidence cannot be replaced by a placeholder.

Role15 sign intake binds official asset/item ID, edition, selected supplement applicability, URL/file hash, dated rights/attribution and page relation. No handbook scans/layouts, unverified art, logos or blanket rights inference. State/source changes invalidate affected acceptance.

Acyclic ordering: early intent → ContentCandidateManifest → final UiSpec → validation receipts →09 packaging. Final spec consumes no ProductPackage.

## Reviewer trace and redaction
C50/C52 apply: committed events/snapshot time and actual role/model, usage/cost provenance, elapsed/attempt/intervention counts and hashes, with honest unavailable values. Redact credentials, account/PII data, sensitive raw prompts/responses, absolute machine paths and private source text. No live controller, broker, animated floor or completed audit is implied. Learner surfaces contain no model/USD/run/human-edit metadata.

**Machine interface:**
- stage_identity: UI.early_intent precedes content production; UI.final_spec.draft/improve and validate_1/validate_2 follow content acceptance. A stable role ID is not a stage-instance ID.
- schema_ref: `contracts/ui-spec.schema.json`, local0.4.0; pin exact bytes for both phases.
- validate_1: role14 structural validation plus independent semantic/domain/mobile/rights review; each external receipt pins spec/schema/input hashes.
- improve: UI role repairs located findings without editing accepted content/contracts.
- validate_2: fresh role14 validation and independent semantic retest bind improved bytes and candidate scope.
- acceptance_bundle: separate UIAcceptanceBundle references spec+four receipts; spec never embeds a receipt hashing itself. Planned/unrun receipts never count as PASS.
- receipt schemas: local schema definitions `#/$defs/uiValidationReceipt` and `#/$defs/uiAcceptanceBundle` distinguish draft/improved spec refs, phase, role14 versus independent semantic checks, candidate/schema hashes and evidence refs. Receipt files remain external; a structurally valid bundle alone does not prove its referenced reports ran or passed.
- independent reviewer: actor+provider-family eligibility resolves candidate/prompt/intervention lineage before each review.
- failure_route: structure/bindings→14/00; source/rights→15; content→owning02/03/04/05/06; missing capability→typed CapabilityRequest. No live founder gate.
- consumer:09/B5, with finish criteria; no package→UI edge.

**Quality Metrics:** Exactly7learner+1reviewer route; sign-recognition hero with honest fallback; zero learner Trace links; all claims/source locators bound;≥44px targets/320px reflow; first card≤3taps; complete media/mobile dispositions; schema and independent receipts in both validation phases.
**Failure Conditions:** Generic shell/hub as hero; unverified required artwork; pending scope shown as selected; Trace/factory metadata on learner surfaces; stale bindings; missing mobile/media decisions; invalid spec or missing/self-approved validation receipt; package/UI cycle; invented exam/audio/native/work claims; broken recall/navigation/scoring.
**Definition of Done:** All11decisions justified, named theme/hero, media intent/mobile bundle specified with explicit deferrals, exactly8routes, immutable UiSpec validated twice by14+independent semantic review, separate hash-bound acceptance bundle delivered to09/B5. Browser implementation and executed product QA remain separate evidence.
**Autonomy Contract:** autonomous within bound scope; outcomes draft, improved, validation_failed, capability_request, verification_debt, preview_spec_accepted. No ask_founder, optional_human_signoff or self_approval. At most2automatic attempts; stricter lineage limits prevail. Ambiguity→14/00 artifact. Reserved founder gates unchanged.
