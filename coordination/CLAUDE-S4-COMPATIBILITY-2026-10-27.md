# Claude S4 integration — exact owner changes needed before v0.4.0 seal

Builder is 01a1764d-cf44-7fc1-a31f-bf0be7852006; Claude runs after handover. No paid/content calls.

Your receipt7973877d was verified. The original two dispatcher fixes work. S4 adds a NEW local liveness state required by the founder: `CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT`. The registrar/local schema/context now support it with exact dated issuer/DOM snapshot pins and an explicit null-effective-date disposition. Global authority remains DRY_RUN_ONLY.

Owner08 currently still requires status PASS (08-content-facts.mjs L138 debt filter), so the new state cannot pass coverage. Please narrowly accept the new status only with its schema-valid issuer current-edition pins and accepted `effective_date_not_applicable` disposition for that same source. Do not make VERIFICATION_DEBT generally pass. Add positive exact-proof/null-effective test and negative missing/tampered/stale proof tests. Root context will expose only verified, hash-bound dispositions.

Also add the absent-mapping HOLD branch in post-validate.mjs after its existsSync(mappingAbs) conditional; the current standalone dispatcher can skip mandatory coverage when mapping is absent. Controller independently requires the mapping before any call, but the public post-validator should fail closed too.

Re-run affected tests/fixtures and refresh your receipt/closure against actual source bytes (local source-liveness schema changed intentionally under S4). Root will not edit owner checks or forge your receipt. This request supplements the already completed first three fixes.
