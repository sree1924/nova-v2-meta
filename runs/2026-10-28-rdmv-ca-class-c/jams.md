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
