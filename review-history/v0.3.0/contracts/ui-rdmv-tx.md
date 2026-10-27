# UI Architect — RDMV Regular Driver Written-Test Preparation

Version 0.3.0. Prepared October 26, 2026, America/Denver. Status: **PROJECT-LOCAL PILOT CONTRACT; NO IMPLEMENTATION RECEIPT**.

The filename `ui-rdmv-tx.md` is retained from the Texas candidate packet. It does not select Texas. The founder fixed regular noncommercial passenger-car driver-licence written/knowledge-test preparation; the state will be selected later. This local binding creates no canonical probe and changes no parent UI contract.

## ⚑ INTENT

Design a clear free study preview: text lesson → memory support → recall cards → chapter hub → chapter quiz, plus cumulative practice. The learner can understand a rule, distinguish an exception, practise application and inspect its source. A reviewer can inspect actual execution independently of learner progress. A design screenshot or trace alone does not establish a working learner journey. No screen promises a licence, road competence, agency endorsement or pass probability.

## DOMAIN CONTEXT

audience: regular passenger-car written-test learners; age band, application path and language are selected-state configuration, currently Pending (verify).

study moment: short phone/laptop sessions; do not assume an ESL, teenage, adult-only or Texas audience.

content: original explanations, examples, misconceptions, memory support, cards and authored practice questions from pinned official selected-state sources. This contract supplies no driving rules, thresholds, exam weights or handbook passages.

template: text-first, state-bound, free-only dev preview. Roles 20/20A/20B are inactive; 05 supplies text scripts only. No narrated lesson, audio player, microphone or live TTS is implied.

## 🎨 THEME — "Clear Road"

Palette: readable navy/off-white with restrained teal progress. Reserve traffic colours for meaningful status and verified sign artwork; pair status with words/shapes.

Type: large plain text, generous spacing, short paragraphs, semantic headings and predictable controls.

Imagery: item-level verified MUTCD/Standard Highway Signs renderings and approved original teaching diagrams only. No DL-7 scans, handbook layouts, unverified art, third-party photos or agency seals.

Motion: optional and restrained. The pilot trace is a static timestamped ledger view; no animated robot floor or live progress is implied.

Voice: patient, practical and direct. Explain source-supported why/how, retain qualifiers and offer useful retry/review paths.

Mood: focused and capable; the learner understands the next step and the limits of practice results.

## DOMAIN-UX DECISIONS

1. **Interaction:** text-first teaching; explicit manual recall/reveal. Preserve ask → silent recall beat → answer → memory hook in text. A recall pause is not audio and starts no model call.
2. **HERO screen:** chapter hub with accepted state/edition, next lesson and lesson → cards → quiz path. Home explains written-test scope and free access.
3. **Density:** one coherent teaching idea/example at a time. Keep essential qualifiers/exceptions visible beside the rule.
4. **Exam sim:** authored chapter quizzes and cumulative practice. Use official count/threshold/timing only when verified for the selected path; otherwise label declared practice settings.
5. **Progress:** observed completions, attempts and missed items by syllabus identity. No eligibility, driving competence or predicted-pass score.
6. **Accessibility:** responsive layouts, keyboard operation, visible focus, semantic headings, contrast, labelled controls and meaningful graphic descriptions. Provide an explicitly labelled equivalent accessible task when a description would reveal a visual-recognition answer.
7. **Onboarding:** show configured state/class/path/language/edition before study. Pending configuration displays a labelled preview and blocks unbound content; never default to Texas. State/version changes invalidate affected bindings and namespace/reset progress.
8. **Visual/tone:** calm, readable and practical; errors lead to supported explanations and targeted review. No official-agency visual impersonation.
9. **Affordances:** back/next, return to hub, source links, recoverable errors/empty states, manual reveal, missed review and separate trace access. Label cached/planned work.
10. **Monetization:** all screens free-only. No Clerk, Stripe, checkout, paid tier, price, required account or lead capture. No deployment is implied.

## REQUIRED EIGHT SCREENS

| Screen | Required behaviour | Acceptance evidence |
|---|---|---|
| Home | State/edition, written-test scope/exclusions, free study entry, source/trace links. Pending fields prevent unbound content loading. | Visitor identifies scope; no invented agency, state, count or price. |
| Chapter hub | Accepted chapters/objectives, version, completion/missed work, lesson/cards/quiz/practice links. | Bind through accepted CurriculumUnitMap, never filename/deck order. |
| Lesson | Original explanation, why/how where applicable, example, misconception, memory support and source locators. Text only. | Required sections render; qualifiers survive; next step binds correctly. |
| Cards | Question, silent recall prompt, manual reveal, answer, teaching hook, navigation and progress. | Initial answer concealment, reveal and keyboard operation work; accepted card IDs match. |
| Quiz | Chapter-aligned authored practice, submission, explained answers and missed review. | Supported unambiguous answer/rationale; results return to the correct chapter. |
| Practice test | Cumulative items from declared coverage; practice settings separate from verified official settings. | No actual/exhaustive/official-length claim without evidence; results use attempted items. |
| Results | Observed score/count, explanations, missed review and next study step. | Correct recomputation; no guaranteed pass, probability or driving-readiness claim. |
| Trace | Static ledger-derived stage/role/model, usage availability, estimated/reported USD, elapsed, attempts, human edits and hashes; run/snapshot time. | Planned/unrun versus observed events and replay are explicit; configuration never implies executed audits or success. |

## STATE-AGNOSTIC INPUTS AND BINDINGS

Before content binds, accept jurisdiction/agency, regular noncommercial class equivalence, audience/path, language, edition/effective date, rights, coverage and exam-fact policy. Pending fields remain explicit. Conditional Texas configuration is neither selected syllabus nor accepted source registry.

Use stable concept/unit/card/item IDs and accepted source locators. Pin UI/input/schema hashes in assignments and release evidence. State/source changes invalidate affected acceptance; progress/scores cannot leak across syllabi. Every instructional paragraph traces to accepted source evidence. A link is not an automatic fact PASS. Trace rows identify actual provider/model or an availability reason; a ledger view cannot approve work.

## GRAPHICS AND RIGHTS

The [FHWA MUTCD FAQ](https://mutcd.fhwa.dot.gov/knowledge/faqs/faq_general.htm) describes online MUTCD material as public domain and requests source references. This supports identified MUTCD items, not blanket clearance for state handbooks, every SHS file, logos, photos or third-party art.

For each rendering, record official URL, edition, sign/item ID, hash, provenance, rights evidence/attribution and selected-state applicability. Preserve meaning/proportions and provide accurate accessible descriptions. Missing required rights or applicability blocks the asset. Use no DL-7 scans. Label layout placeholders and exclude them from instructional acceptance; a lesson needing missing artwork is not complete.

## ARTIFACT AND SCHEMA INTERFACE

Read existing parent schemas without modifying them; their presence does not validate candidate output:

- `D:/nova/schemas/knowledge-graph.schema.json`
- `D:/nova/schemas/carddeck.schema.json`
- `D:/nova/schemas/session-script.schema.json`
- `D:/nova/schemas/exambank.schema.json`
- `D:/nova/schemas/curriculum-unit-map.schema.json`
- `D:/nova/schemas/product-package.schema.json`
- `D:/nova/schemas/runtime-bundle.schema.json`

Declare the exact schema/payload mapping for each screen. In particular, do not assume `session-script.schema.json` is the 05b session-collection schema. Proposed local UiSpec/screen-binding/trace schemas require versioned local decisions and tests before becoming machine-validation gates. No existing parent UI schema or canonical teaching compatibility is invented here. Provider strict-subset projections live locally, pin the parent, and remain subject to applicable full-artifact validation.

## UI OUTPUT, FAILURE ROUTES AND ACCEPTANCE

Supply early media/voice intent (text-only), final UiSpec draft/improvement and screen-to-artifact bindings. The implementation must deliver eight working screens, a reproducible dev build and actual browser/keyboard/mobile evidence. Documents and planned files are not execution receipts.

Block acceptance for unbound state/path/source, unsupported facts, missing required coverage, unverified required graphics, stale hashes, invalid card/item bindings, false official claims, fabricated trace/usage or broken flow. Repair the owning artifact and retest its affected dependency closure within lineage limits; no generator approves itself.

Independent product QA checks every screen against exact hashes: navigation, manual recall/reveal, practice scoring, missed review, persistence and errors. Test state switching only if implemented; otherwise verify the single-state build rejects mixed-state data. Preserve the independent tester binding or record its reviewed local adaptation; two provider names do not establish executed product QA.

This project-local review contract authorizes no implementation run, model call, service, spend, catalog change, public deployment or marketing execution.
