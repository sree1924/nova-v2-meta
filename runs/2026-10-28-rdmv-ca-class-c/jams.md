# jams — 2026-10-28-rdmv-ca-class-c

Seeded 2026-10-28T00:56:38.168Z by intake-state.mjs from 2026-10-26-rdmv-ut-class-d (spec coordination/intake/CA.spec.json); authoring mode muse_code_subscription.

## JAM-001 (2026-10-28T00:58Z, Muse Code CA operator) — intake blocked in frozen role code
`intake-state.mjs` wrote snapshot + receipts + run-config, then controller `plan --init-ledger --register-sources`
returned BLOCKED/CONTROLLER_ERROR: "This offline registration profile is restricted to the selected Utah run"
(thrown at tools/roles/15-register.mjs:109, `scope.jurisdiction !== 'US-UT'`). No spec edit can fix this honestly:
jurisdiction US-CA is factual. NOT retried further — deterministic frozen-code failure, not a spec failure.
Unblocks only via root AMENDMENT-ORDER + role-15 multi-state profile (runner/founder lane). Partial run dir kept
intact; Phase 2 (02/16 authoring) not started. Ledger actual $0.000, 0 model calls.

## JAM-001-RESOLVED (2026-10-28T~00:59Z, observed by Muse Code CA operator session 2)
tools/roles/15-register.mjs:109 now reads "Multi-state intake (2026-10-28): any founder-confirmed US jurisdiction
registers through this same offline profile" (US-UT restriction gone; floor fix in runner/founder lane, no
AMENDMENT-ORDER file visible at root to this operator). Controller steps completed 00:59:13–00:59:31Z:
ledger/run.sqlite + 15-registration-receipt.json (HOLD with standard verification_debt) +
15-source-registry/page-map/liveness all present. Prior-session spec verified field-by-field against the
extracted handbook text and a fresh issuer-page fetch; seed adopted as-is. Phase 2 started.

- 2026-10-28T01:11:36.661Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:2 for 02.dossier_sections (sec01-california-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-california-drivers-license__A__n0 (lineage attempts exhausted)

- 2026-10-28T01:13:08.783Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:3 for 02.dossier_sections (sec01-california-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-california-drivers-license__D__n0 (lineage attempts exhausted)

- 2026-10-28T01:13:52.756Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:4 for 02.dossier_sections (sec01-california-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-california-drivers-license__E2__n0 (lineage attempts exhausted)

- 2026-10-28T01:14:34.054Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:5 for 02.dossier_sections (sec01-california-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec01-california-drivers-license__G__n0 (lineage attempts exhausted)

- 2026-10-28T01:16:10.564Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:6 for 02.dossier_sections (sec02-instruction-permit-and-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-instruction-permit-and-drivers-license__C2__n0 (lineage attempts exhausted)

- 2026-10-28T01:17:24.979Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:7 for 02.dossier_sections (sec02-instruction-permit-and-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-instruction-permit-and-drivers-license__B__n0 (lineage attempts exhausted)

- 2026-10-28T01:18:27.198Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:8 for 02.dossier_sections (sec02-instruction-permit-and-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-instruction-permit-and-drivers-license__E__n0 (lineage attempts exhausted)

- 2026-10-28T01:19:18.513Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:9 for 02.dossier_sections (sec02-instruction-permit-and-drivers-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec02-instruction-permit-and-drivers-license__F__n0 (lineage attempts exhausted)

- 2026-10-28T01:20:14.196Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:10 for 02.dossier_sections (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-testing-process__C__n0 (lineage attempts exhausted)

- 2026-10-28T01:22:03.242Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:11 for 02.dossier_sections (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-testing-process__A__n0 (lineage attempts exhausted)

- 2026-10-28T01:22:56.234Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:12 for 02.dossier_sections (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-testing-process__D__n0 (lineage attempts exhausted)

- 2026-10-28T01:23:40.902Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:13 for 02.dossier_sections (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-testing-process__E2__n0 (lineage attempts exhausted)

- 2026-10-28T01:24:33.973Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:14 for 02.dossier_sections (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec03-testing-process__G__n0 (lineage attempts exhausted)

- 2026-10-28T01:25:41.439Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:15 for 02.dossier_sections (sec04-changing-replacing-renewing-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-changing-replacing-renewing-license__C2__n0 (lineage attempts exhausted)

- 2026-10-28T01:26:39.790Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:16 for 02.dossier_sections (sec04-changing-replacing-renewing-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-changing-replacing-renewing-license__B__n0 (lineage attempts exhausted)

- 2026-10-28T01:27:28.438Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:17 for 02.dossier_sections (sec04-changing-replacing-renewing-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-changing-replacing-renewing-license__E__n0 (lineage attempts exhausted)

- 2026-10-28T01:28:16.887Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:18 for 02.dossier_sections (sec04-changing-replacing-renewing-license) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec04-changing-replacing-renewing-license__F__n0 (lineage attempts exhausted)

- 2026-10-28T01:29:12.422Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:19 for 02.dossier_sections (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-introduction-to-driving__C__n0 (lineage attempts exhausted)

- 2026-10-28T01:30:44.723Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:20 for 02.dossier_sections (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-introduction-to-driving__A__n0 (lineage attempts exhausted)

- 2026-10-28T01:31:41.138Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:21 for 02.dossier_sections (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-introduction-to-driving__D__n0 (lineage attempts exhausted)

- 2026-10-28T01:32:32.336Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:22 for 02.dossier_sections (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-introduction-to-driving__E2__n0 (lineage attempts exhausted)

- 2026-10-28T01:33:36.870Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:23 for 02.dossier_sections (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec05-introduction-to-driving__G__n0 (lineage attempts exhausted)

- 2026-10-28T01:39:25.934Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:24 for 02.dossier_sections (sec06-navigating-the-roads) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec06-navigating-the-roads__C2__n0 (lineage attempts exhausted)

- 2026-10-28T04:06:19.215Z exam_facts migrated to the verified object shape (question_count/passing_percent/time_limit/format bound to the registered source); provenance in scope.exam_facts_provenance

- 2026-10-28T04:55:33.512Z retry nonce 02.dossier_sections:C2@sec06-navigating-the-roads → 1 after HOLD (sec06-navigating-the-roads); non-PASS: 02.LINEAGE=FAIL

- 2026-10-28T04:56:09.576Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:25 for 02.dossier_sections (sec06-navigating-the-roads) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec06-navigating-the-roads__A__n0 (lineage attempts exhausted)

- 2026-10-28T04:57:14.418Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:26 for 02.dossier_sections (sec06-navigating-the-roads) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec06-navigating-the-roads__D__n0 (lineage attempts exhausted)

- 2026-10-28T04:58:17.740Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:27 for 02.dossier_sections (sec06-navigating-the-roads) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec06-navigating-the-roads__E2__n0 (lineage attempts exhausted)

- 2026-10-28T04:59:15.577Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:28 for 02.dossier_sections (sec06-navigating-the-roads) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec06-navigating-the-roads__G__n0 (lineage attempts exhausted)

- 2026-10-28T05:05:54.300Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:29 for 02.dossier_sections (sec07-laws-and-rules-of-the-road) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec07-laws-and-rules-of-the-road__C2__n0 (lineage attempts exhausted)

- 2026-10-28T05:07:27.826Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:30 for 02.dossier_sections (sec07-laws-and-rules-of-the-road) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec07-laws-and-rules-of-the-road__B__n0 (lineage attempts exhausted)

- 2026-10-28T05:08:16.148Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:31 for 02.dossier_sections (sec07-laws-and-rules-of-the-road) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec07-laws-and-rules-of-the-road__E__n0 (lineage attempts exhausted)

- 2026-10-28T05:09:00.972Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:32 for 02.dossier_sections (sec07-laws-and-rules-of-the-road) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec07-laws-and-rules-of-the-road__F__n0 (lineage attempts exhausted)

- 2026-10-28T05:09:50.376Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:33 for 02.dossier_sections (sec08-safe-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec08-safe-driving__C__n0 (lineage attempts exhausted)

- 2026-10-28T05:12:17.564Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:34 for 02.dossier_sections (sec08-safe-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec08-safe-driving__A__n0 (lineage attempts exhausted)

- 2026-10-28T05:13:11.051Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:35 for 02.dossier_sections (sec08-safe-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec08-safe-driving__D__n0 (lineage attempts exhausted)

- 2026-10-28T05:14:01.312Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:36 for 02.dossier_sections (sec08-safe-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec08-safe-driving__E2__n0 (lineage attempts exhausted)

- 2026-10-28T05:14:46.323Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:37 for 02.dossier_sections (sec08-safe-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec08-safe-driving__G__n0 (lineage attempts exhausted)

- 2026-10-28T05:16:03.767Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:38 for 02.dossier_sections (sec09-alcohol-and-drugs) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec09-alcohol-and-drugs__C2__n0 (lineage attempts exhausted)

- 2026-10-28T05:16:31.403Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:39 for 16.compile (sec03-testing-process) under standing authority; cause: compile attempt cap on shared lineage (sec03-testing-process)

- 2026-10-28T05:16:32.437Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:40 for 16.compile (sec06-navigating-the-roads) under standing authority; cause: compile attempt cap on shared lineage (sec06-navigating-the-roads)

- 2026-10-28T05:17:47.200Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:41 for 02.dossier_sections (sec09-alcohol-and-drugs) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec09-alcohol-and-drugs__B__n0 (lineage attempts exhausted)

- 2026-10-28T05:18:40.888Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:42 for 02.dossier_sections (sec09-alcohol-and-drugs) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec09-alcohol-and-drugs__E__n0 (lineage attempts exhausted)

- 2026-10-28T05:19:35.794Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:43 for 02.dossier_sections (sec09-alcohol-and-drugs) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec09-alcohol-and-drugs__F__n0 (lineage attempts exhausted)

- 2026-10-28T05:20:25.437Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:44 for 02.dossier_sections (sec10-financial-responsibility-insurance-collisions) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec10-financial-responsibility-insurance-collisions__C__n0 (lineage attempts exhausted)

- 2026-10-28T05:21:51.066Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:45 for 02.dossier_sections (sec10-financial-responsibility-insurance-collisions) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec10-financial-responsibility-insurance-collisions__A__n0 (lineage attempts exhausted)

- 2026-10-28T05:22:38.956Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:46 for 02.dossier_sections (sec10-financial-responsibility-insurance-collisions) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec10-financial-responsibility-insurance-collisions__D__n0 (lineage attempts exhausted)

- 2026-10-28T05:23:36.595Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:47 for 02.dossier_sections (sec10-financial-responsibility-insurance-collisions) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec10-financial-responsibility-insurance-collisions__E2__n0 (lineage attempts exhausted)

- 2026-10-28T05:24:41.336Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:48 for 02.dossier_sections (sec10-financial-responsibility-insurance-collisions) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec10-financial-responsibility-insurance-collisions__G__n0 (lineage attempts exhausted)

- 2026-10-28T05:25:59.557Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:49 for 02.dossier_sections (sec11-vehicle-registration-requirements) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec11-vehicle-registration-requirements__C2__n0 (lineage attempts exhausted)

- 2026-10-28T05:27:07.633Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:50 for 02.dossier_sections (sec11-vehicle-registration-requirements) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec11-vehicle-registration-requirements__B__n0 (lineage attempts exhausted)

- 2026-10-28T05:27:58.473Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:51 for 02.dossier_sections (sec11-vehicle-registration-requirements) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec11-vehicle-registration-requirements__E__n0 (lineage attempts exhausted)

- 2026-10-28T05:28:43.123Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:52 for 02.dossier_sections (sec11-vehicle-registration-requirements) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec11-vehicle-registration-requirements__F__n0 (lineage attempts exhausted)

- 2026-10-28T05:29:38.020Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:53 for 02.dossier_sections (sec12-driver-safety) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec12-driver-safety__C__n0 (lineage attempts exhausted)

- 2026-10-28T05:30:48.049Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:54 for 02.dossier_sections (sec12-driver-safety) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec12-driver-safety__A__n0 (lineage attempts exhausted)

- 2026-10-28T05:31:41.546Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:55 for 02.dossier_sections (sec12-driver-safety) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec12-driver-safety__D__n0 (lineage attempts exhausted)

- 2026-10-28T05:32:35.940Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:56 for 02.dossier_sections (sec12-driver-safety) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec12-driver-safety__E2__n0 (lineage attempts exhausted)

- 2026-10-28T05:33:31.114Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:57 for 02.dossier_sections (sec12-driver-safety) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec12-driver-safety__G__n0 (lineage attempts exhausted)

- 2026-10-28T05:34:42.722Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:58 for 02.dossier_sections (sec13-seniors-and-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec13-seniors-and-driving__C2__n0 (lineage attempts exhausted)

- 2026-10-28T05:35:35.914Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:59 for 02.dossier_sections (sec13-seniors-and-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec13-seniors-and-driving__B__n0 (lineage attempts exhausted)

- 2026-10-28T05:36:34.740Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:60 for 02.dossier_sections (sec13-seniors-and-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec13-seniors-and-driving__E__n0 (lineage attempts exhausted)

- 2026-10-28T05:37:29.799Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:61 for 02.dossier_sections (sec13-seniors-and-driving) under standing authority; cause: proactive reset before authoring packet 02.dossier_sections__sec13-seniors-and-driving__F__n0 (lineage attempts exhausted)

- 2026-10-28T06:17:34.859Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:62 for 16.compile (sec12-driver-safety) under standing authority; cause: compile attempt cap on shared lineage (sec12-driver-safety)

- 2026-10-28T06:35:33.306Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:63 for 03.combined_kg (sec03-testing-process) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec03-testing-process__-__n0 (lineage attempts exhausted)

- 2026-10-28T06:43:10.657Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:64 for 03.combined_kg (sec05-introduction-to-driving) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec05-introduction-to-driving__-__n0 (lineage attempts exhausted)

- 2026-10-28T06:55:19.743Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:65 for 03.combined_kg (sec07-laws-and-rules-of-the-road) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec07-laws-and-rules-of-the-road__-__n0 (lineage attempts exhausted)

- 2026-10-28T10:17:14.783Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:66 for 03.combined_kg (sec09-alcohol-and-drugs) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec09-alcohol-and-drugs__-__n0 (lineage attempts exhausted)

- 2026-10-28T10:23:35.742Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:67 for 03.combined_kg (sec11-vehicle-registration-requirements) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec11-vehicle-registration-requirements__-__n0 (lineage attempts exhausted)

- 2026-10-28T10:29:03.485Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:68 for 03.combined_kg (sec13-seniors-and-driving) under standing authority; cause: proactive reset before authoring packet 03.combined_kg__sec13-seniors-and-driving__-__n0 (lineage attempts exhausted)

- 2026-10-28T23:19:22.275Z SOL CA current compiler reproduces exact accepted sec13 registry; sec13-F07 phone garble unfixable. Zero remints/nonce/lineage/config/tasks/attempts/calls; 0/1 hidden fixed. Existing raw/source/status/debt/IDs/merges and all accepted stages unchanged. Actual/reserved/uncertain $0. coordination/SOL-REPORTS/REAUTHOR-CA.md; scratch/sol-reauthor/ca/NATIVE-HANDOFF.json

- 2026-10-29T16:40:00.598Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:69 for 19A.units (sec03-testing-process) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section

- 2026-10-29T16:40:01.386Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:70 for 19A.units (sec05-introduction-to-driving) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section

- 2026-10-29T16:40:01.783Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:71 for 19A.units (sec07-laws-and-rules-of-the-road) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section

- 2026-10-29T16:40:02.350Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:72 for 19A.units (sec09-alcohol-and-drugs) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section

- 2026-10-29T16:40:02.974Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:73 for 19A.units (sec11-vehicle-registration-requirements) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section

- 2026-10-29T16:40:03.757Z lineage reset → 2026-10-28-rdmv-ca-class-c:lineage:74 for 19A.units (sec13-seniors-and-driving) under standing authority; cause: one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section
