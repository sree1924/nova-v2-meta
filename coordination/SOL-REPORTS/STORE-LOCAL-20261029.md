# PassLearnersPermit local execution receipt — 2026-10-29

Status: customer-facing local preview implemented; Idaho release remains on hold. Branch: sol/store-local. Executor: Codex, current chat 01a18913-f0c0-7910-9a89-d42f32b06f35. This is an execution receipt, not a new plan or release approval.

## Completed

- Refreshed Idaho through native export selection from runs/2026-10-28-rdmv-id-class-d; corrected the display name to Idaho. Latest accepted sec11 correction is exported. Existing learner hold/quarantine remains.
- Built the customer home/state pages and store-only mobile lesson, flashcard and quiz presentation. The authoring shell's source content was preserved. Canonical assets now live in store/learner-assets and are reproduced by sync-store.
- Added localhost-only test sign-in, simulated purchase/unlock/refund/sign-out, signed entitlement cookies and immediate refund enforcement. No real Clerk/Stripe requests occur in local mode. Public-host/forwarded-host/cross-origin requests are refused; local mode is rejected by production configuration. Fixed Next's loopback URL normalization while retaining those checks.
- Added anonymous funnel events and first-visit ref/arm attribution, deduplication, local append-only synthetic-event sink, and privacy disclosure. Production analytics sink remains unconfigured.
- Added an official FHWA illustration with provenance and exact card-back matching for five Idaho STOP/YIELD cards. Other sign/interchange visuals remain incomplete.
- Added `npm run dev:local` in store for a loopback-only preview at http://127.0.0.1:4320.

## Audio delivered first

Founder explicitly selected reuse of the existing API key for FOUR Idaho samples, estimated $0.02 with a $0.10 cap. Exactly four Speech API calls succeeded; no retries or extra API tests. The samples use gpt-4o-mini-tts / nova, the existing fleet instructions, atempo 0.85, 128 kbps, 24 kHz mono. Original media are preserved. Decode/hash checks passed; no ASR or human-listening clearance is claimed.

Files: scratch/store-local/audio-ID/generated-samples/id-sec11-f14-{question,answer,teaching,lesson}.mp3. Evidence: sample-manifest.json and run-record.json in that folder. The source-backed answer includes the repaired signaling detail. The accepted question prompt remains awkward/incomplete; samples preserve accepted words verbatim rather than changing source artifacts.

Actual provider cost and token usage were not returned and remain null. The historical estimate is not an invoice. Full-course audio is not generated or wired. Deterministic inventory: 3,953 targets / 3,001 unique utterances / 795,837 exact spoken characters. No existing Utah clip exactly matched the Idaho recipe/text. GPT-Live subscription voice export is not exposed by this session; these four samples are honestly identified as Speech API output. OpenAI Developers is available; no new credential was created or written, and no subscription API credit benefit was claimed.

## Verification

- Production `npm run build`: exit 0, all 51 state paths compiled. Log: scratch/store-local/production-build.log. Final follow-up was a CSS-only local-banner spacing rule, then browser visual inspection.
- TypeScript: `npx tsc --noEmit --incremental false` passed.
- Final learner harness: all checks passed, including 22,439 customer routes across 51 states, source/card-script invariants, auth gates and official-sign mappings. Log: scratch/store-local/final-learner-harness.log. Last subsequent shell change added a loading indicator and neutral pre-load nav; the next actual browser journey passed.
- Audio extraction/pin/identity tests: 4/4 passed.
- Checkout worker's HTTP checks: 19 per state for ID/TX/UT (57 total), plus Host/origin/production guard checks passed. Actual browser validation exposed a loopback rewrite issue, which was fixed and rechecked.
- Actual 375px browser walkthrough: Idaho landing -> free chapter -> module -> eight lesson slides -> explicit completion -> card recall/reveal -> incorrect-answer rationale -> locked chapter two -> test learner -> simulate purchase -> Unlocked: Idaho through October 29, 2027 -> chapter two accessible -> refund -> chapter two locked again. Desktop 1280px home also inspected; no mobile horizontal overflow observed. Screenshots: scratch/store-local/screenshots/.
- `sync-store --check`: zero changed/stale files. `git diff --check` passed.
- Full read-only ledger/export audit: Idaho passes all current pins/mirror comparisons. Fleet result is 48/51 because CT, FL and NY have newer independently authored repairs not yet exported; those states were not changed by this task. Report: scratch/store-local/STATE-AUDIT-20261029.md. Structural parity is not factual/coverage clearance.

## Missing for release

Idaho has 1,030 minted facts/cards, 108 lessons and only 108 assessment items. Native coverage join reports 922 missing assessment targets; all 16 sections fail that coverage condition. Native 07.content_coverage, 08.content_facts and 09.package are not accepted. Compiled dossiers retain 53 unique section/claim IDs marked ship blocking, including source spans and visual interpretation. Existing all-fact checking excludes the lesson narration and exam items. Current report references: coordination/FACT-CHECK/ID/report.json, coordination/SOL-REPORTS/FACTFIX-ID.md and scratch/sol-state-coordinator/factfix-20261029/pilot-ID/NATIVE-HANDOFF.json. No release debt was cleared by this storefront work.

Only five official sign mappings exist. Full narration, remaining visual/source disposition, coverage/exam expansion, independent downstream fact QA, production configuration and actual live release verification remain. No commit, push, publication, real charge/refund, campaign or full audio batch was performed.

Preview process restarted via store/scripts/local-dev.mjs and left available to the founder. The executor lock is released after this receipt; normal future writes must claim ownership again.
