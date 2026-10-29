# jams — 2026-10-28-rdmv-hi-class-3

Seeded 2026-10-29T03:21:23.407Z by intake-state.mjs from 2026-10-26-rdmv-ut-class-d (spec coordination/intake/HI.spec.json); authoring mode muse_code_subscription.

## JAM-HI-01 — cloud environment path shims (2026-10-29, claude cloud session)
Receipts and tools embed Windows absolute paths. Local-only symlinks, listed in .git/info/exclude and never committed:
`C:/Users/varad/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe` → /usr/bin/python3 (pypdf 6.10.0, pdfplumber 0.11.9 pinned);
`D:/nova/fb-ai-hackathon` → the clone root. Parent-factory pins unzipped from coordination/cloud/factory-pins-full-belt.zip to ../factory (eleven hashes verified).

## JAM-HI-02 — learning loop not pinned at intake (2026-10-29)
intake-state.mjs: plan --init-ledger --register-sources exit 0 (source registered, liveness CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT, edition "HMG 5/2023");
pin-learning-loop exit 2: ENOENT ../schemas/learning-loop.schema.json (parent repo file, pinned 54f8a656…, 7334 bytes; role 19 also lists schemas/learning-model.schema.json 79de9048…, 3945 bytes).
Stage 02/16 need no learning loop (tools/belt/context.mjs NEEDS); 03/04/06/19A do. Resume: `node tools/belt/controller.mjs pin-learning-loop --run-config runs/2026-10-28-rdmv-hi-class-3/run-config.json --executor-id 2bdcad95-d4cc-467e-a88d-be4a6260cf03` once the schema is present.

## JAM-HI-03 — dirty text layer in the Hawaii PDF (2026-10-29)
Each physical page's pypdf text also carries the facing page's text (positioned outside the media box) and, on many pages, a superseded hidden layer clipped to a thin band (e.g. p12 hidden "1. Rules of the Road / 2. Vision / 3. Recognition of traffic control devices" vs visible "A vision test / A knowledge test … / A practical road test").
Dossier facts are authored only from the visible layer (clip-aware pdfminer pass: track `re W n` rects through q/Q, keep chars inside the clip and media box) and anchored to the page where the sentence is visibly printed.

- 2026-10-29T03:48:03.669Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:2 for 02.dossier_sections (sec01-licensing-exemptions-types-obtaining) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-licensing-exemptions-types-obtaining__A__n0 (lineage attempts exhausted)

- 2026-10-29T03:48:10.901Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:3 for 02.dossier_sections (sec01-licensing-exemptions-types-obtaining) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-licensing-exemptions-types-obtaining__D__n0 (lineage attempts exhausted)

- 2026-10-29T03:48:11.951Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:4 for 02.dossier_sections (sec01-licensing-exemptions-types-obtaining) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-licensing-exemptions-types-obtaining__E2__n0 (lineage attempts exhausted)

- 2026-10-29T03:48:13.028Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:5 for 02.dossier_sections (sec01-licensing-exemptions-types-obtaining) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-licensing-exemptions-types-obtaining__G__n0 (lineage attempts exhausted)

- 2026-10-29T03:52:35.028Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:6 for 02.dossier_sections (sec02-license-categories-tests-renewal) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-license-categories-tests-renewal__C2__n0 (lineage attempts exhausted)

- 2026-10-29T03:52:36.224Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:7 for 02.dossier_sections (sec02-license-categories-tests-renewal) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-license-categories-tests-renewal__B__n0 (lineage attempts exhausted)

- 2026-10-29T03:52:37.481Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:8 for 02.dossier_sections (sec02-license-categories-tests-renewal) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-license-categories-tests-renewal__E__n0 (lineage attempts exhausted)

- 2026-10-29T03:52:38.691Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:9 for 02.dossier_sections (sec02-license-categories-tests-renewal) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-license-categories-tests-renewal__F__n0 (lineage attempts exhausted)

- 2026-10-29T03:52:40.007Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:10 for 02.dossier_sections (sec03-vehicle-equipment-inspection) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-vehicle-equipment-inspection__C__n0 (lineage attempts exhausted)

- 2026-10-29T03:54:26.733Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:11 for 02.dossier_sections (sec03-vehicle-equipment-inspection) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-vehicle-equipment-inspection__A__n0 (lineage attempts exhausted)

- 2026-10-29T03:54:27.992Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:12 for 02.dossier_sections (sec03-vehicle-equipment-inspection) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-vehicle-equipment-inspection__D__n0 (lineage attempts exhausted)

- 2026-10-29T03:54:29.262Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:13 for 02.dossier_sections (sec03-vehicle-equipment-inspection) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-vehicle-equipment-inspection__E2__n0 (lineage attempts exhausted)

- 2026-10-29T03:54:30.527Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:14 for 02.dossier_sections (sec03-vehicle-equipment-inspection) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-vehicle-equipment-inspection__G__n0 (lineage attempts exhausted)

- 2026-10-29T03:56:14.570Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:15 for 02.dossier_sections (sec04-vehicle-registration-title) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-vehicle-registration-title__C2__n0 (lineage attempts exhausted)

- 2026-10-29T03:56:15.848Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:16 for 02.dossier_sections (sec04-vehicle-registration-title) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-vehicle-registration-title__B__n0 (lineage attempts exhausted)

- 2026-10-29T03:56:17.106Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:17 for 02.dossier_sections (sec04-vehicle-registration-title) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-vehicle-registration-title__E__n0 (lineage attempts exhausted)

- 2026-10-29T03:56:18.402Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:18 for 02.dossier_sections (sec04-vehicle-registration-title) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-vehicle-registration-title__F__n0 (lineage attempts exhausted)

- 2026-10-29T03:56:19.736Z lineage reset → 2026-10-28-rdmv-hi-class-3:lineage:19 for 02.dossier_sections (sec05-the-driver-emotional-medical-age) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-the-driver-emotional-medical-age__C__n0 (lineage attempts exhausted)
