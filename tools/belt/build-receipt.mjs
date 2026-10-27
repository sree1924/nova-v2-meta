// Builds coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json in the shape tools/check-bot-contracts.mjs consumes
// (adapter_receipts[] with executed evidence refs + post_validator.api_mapping per prompt path).
// Usage: node tools/belt/build-receipt.mjs [--tests verification/BELT-NODE-TESTS-v0.4.0.json]
// Inputs it reads (all local): schemas-strict/stage-map.json, schemas-strict/*.schema.json, *.mapping.json,
// verification/BELT-FIXTURE-RUNS-v0.4.0.json (from run-fixtures.mjs), strict-lint report (computed here),
// and the optional node-test summary. It writes one evidence file per stage under verification/adapter-evidence/.
// "PASS" in this receipt = local deterministic validation of an adapter against its fixtures and lint —
// never provider acceptance, never a belt or qualification result.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Bytes, canonicalJson } from './lib/hash.mjs';
import { lintAll } from './strict-lint.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const rel = (p) => p.replace(/\\/g, '/');
const args = process.argv.slice(2);
const testsPath = (() => { const i = args.indexOf('--tests'); return i >= 0 ? args[i + 1] : 'verification/BELT-NODE-TESTS-v0.4.0.json'; })();

const stageMap = JSON.parse(readFileSync(join(ROOT, 'schemas-strict', 'stage-map.json'), 'utf8'));
const fixtureRunsPath = join(ROOT, 'verification', 'BELT-FIXTURE-RUNS-v0.4.0.json');
const fixtureRuns = existsSync(fixtureRunsPath) ? JSON.parse(readFileSync(fixtureRunsPath, 'utf8')) : null;
const nodeTests = existsSync(join(ROOT, testsPath)) ? JSON.parse(readFileSync(join(ROOT, testsPath), 'utf8')) : null;
const lint = lintAll();

mkdirSync(join(ROOT, 'verification', 'adapter-evidence'), { recursive: true });

const adapter_receipts = [];
const api_mapping = [];
const gaps = [];
for (const [stage_id, st] of Object.entries(stageMap.stages)) {
  const schemaAbs = join(ROOT, st.adapter_schema);
  const mappingAbs = join(ROOT, st.mapping);
  const checksAbs = join(ROOT, st.checks_module);
  const exists = { schema: existsSync(schemaAbs), mapping: existsSync(mappingAbs), checks: existsSync(checksAbs) };
  api_mapping.push({ prompt_path: st.prompt_path, stage_id, exported_function: 'validateArtifact', checks_module: st.checks_module, checks_module_sha256: exists.checks ? sha256File(checksAbs) : null });
  if (!exists.schema || !exists.mapping || !exists.checks) { gaps.push({ stage_id, missing: Object.entries(exists).filter(([, v]) => !v).map(([k]) => k) }); continue; }

  const mapping = JSON.parse(readFileSync(mappingAbs, 'utf8'));
  const schemaFile = st.adapter_schema.split('/').pop();
  const lintRow = lint[schemaFile] ?? { ok: false, violations: [{ rule: 'not linted' }] };
  const runs = (fixtureRuns?.results ?? []).filter(r => r.stage_id === stage_id);
  const runsOk = runs.length > 0 && runs.every(r => r.expected === r.observed);
  const parentActual = sha256File(join('D:/nova', st.parent_schema.path));
  const parentPinOk = parentActual === st.parent_schema.sha256 && mapping.parent_schema?.sha256 === st.parent_schema.sha256;
  const testRow = nodeTests?.files?.find(f => f.stage_id === stage_id) ?? null;   // exact stage match only (05.sessions ≠ 05.card_scripts)
  const testsOk = testRow ? testRow.fail === 0 && testRow.pass > 0 : null;

  const status = lintRow.ok && runsOk && parentPinOk && testsOk !== false ? 'PASS' : 'FAIL';
  const evidence = {
    artifact_type: 'AdapterValidationEvidence', version: '0.4.0', stage_id,
    adapter_schema: { path: st.adapter_schema, sha256: sha256File(schemaAbs) },
    mapping: { path: st.mapping, sha256: sha256File(mappingAbs), adapter_kind: mapping.adapter_kind, deviations: (mapping.deviations ?? []).length, dropped_constraints: (mapping.dropped_constraints ?? []).length, sentinels: mapping.sentinels ?? [] },
    parent_schema: { path: st.parent_schema.path, sha256_pinned: st.parent_schema.sha256, sha256_actual: parentActual, pin_ok: parentPinOk },
    strict_lint: lintRow,
    fixture_runs: runs,
    node_tests: testRow,
    verdict: status,
    meaning: 'Local deterministic validation of the adapter + compensating checks against committed fixtures. Not provider acceptance, not a belt/qualification result.',
  };
  const evidencePath = `verification/adapter-evidence/${stage_id}.json`;
  const evidenceBytes = Buffer.from(JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  writeFileSync(join(ROOT, evidencePath), evidenceBytes);
  adapter_receipts.push({
    stage_id, prompt_path: st.prompt_path,
    schema_ref: st.adapter_schema, schema_sha256: sha256File(schemaAbs),
    mapping_ref: st.mapping, mapping_sha256: sha256File(mappingAbs),
    adapter_kind: mapping.adapter_kind,
    validation: { status, executed: true, evidence_ref: { path: evidencePath, sha256: sha256Bytes(evidenceBytes) } },
  });
  if (status !== 'PASS') gaps.push({ stage_id, reason: { lint_ok: lintRow.ok, fixtures_ok: runsOk, parent_pin_ok: parentPinOk, tests_ok: testsOk } });
}

const consumed = ['CLAUDE-V0.4.0-SCHEMA-HANDOFF.md', 'contracts/pilot-overrides-v0.4.0.json', 'contracts/media-disposition.json', 'contracts/source-fact-policy.json', 'contracts/pilot-finish-criteria.json', 'contracts/teaching-unit.schema.json', 'contracts/source-liveness-receipt.schema.json', 'schemas-strict/CONVENTIONS.md', 'schemas-strict/stage-map.json']
  .filter(p => existsSync(join(ROOT, p))).map(p => ({ path: p, sha256: sha256File(join(ROOT, p)) }));

const receipt = {
  artifact_type: 'ClaudeSchemaReceipt', version: '0.4.0',
  author: { actor: 'Claude Code', session_id: '2bdcad95-d4cc-467e-a88d-be4a6260cf03', model: 'claude-fable-5-1', provider_family: 'anthropic', builders: 'four claude-opus-5-5 subagents authored stage files under the conventions; integration, lint, fixture runs and this receipt were executed by the session' },
  generated_note: 'Local deterministic work only. No model/endpoint call, no belt, no qualification, no spend. Execution remains disabled; state selection open; animated floor deferred.',
  handoff_targets_consumed: consumed,
  adapter_receipts,
  post_validator: {
    path: 'tools/belt/post-validate.mjs', sha256: sha256File(join(ROOT, 'tools/belt/post-validate.mjs')),
    api: 'validateArtifact({stage_id, artifact, context}) -> {status: PASS|FAIL|HOLD, checks:[{check_id,status,evidence,metrics?}], errors:[], metrics:{}}; CLI: node tools/belt/post-validate.mjs --stage <id> --artifact <file> [--context <file>] (exit 0 PASS / 1 FAIL / 2 HOLD)',
    api_mapping,
    strict_lint: { path: 'tools/belt/strict-lint.mjs', sha256: sha256File(join(ROOT, 'tools/belt/strict-lint.mjs')) },
    hash_lib: { path: 'tools/belt/lib/hash.mjs', sha256: sha256File(join(ROOT, 'tools/belt/lib/hash.mjs')) },
  },
  mapping_manifest: existsSync(join(ROOT, 'schemas-strict/mapping-manifest.json')) ? { path: 'schemas-strict/mapping-manifest.json', sha256: sha256File(join(ROOT, 'schemas-strict/mapping-manifest.json')) } : null,
  fixture_runs: fixtureRuns ? { path: 'verification/BELT-FIXTURE-RUNS-v0.4.0.json', sha256: sha256File(fixtureRunsPath), summary: fixtureRuns.summary ?? null } : null,
  node_tests: nodeTests ? { path: testsPath, sha256: sha256File(join(ROOT, testsPath)), summary: nodeTests.summary ?? null } : null,
  // Full dependency closure (lane code + local imports + ajv trees + lockfiles + shared context artifacts), as observed by
  // Sol's read-only inspector; the checker compares this listed set against its own observation to seal the closure.
  implementation_closure: await (async () => {
    try {
      const { inspectImplementationClosure } = await import('../inspect-implementation-closure.mjs');
      const obs = inspectImplementationClosure({ projectRoot: ROOT });
      return { files: (obs.observed_files ?? []).map(f => ({ path: f.path, sha256: f.sha256, bytes: f.bytes })), missing_files: obs.missing_files ?? [], inspector: 'tools/inspect-implementation-closure.mjs', inspector_sha256: sha256File(join(ROOT, 'tools/inspect-implementation-closure.mjs')) };
    } catch (e) { return { files: [], error: `closure inspector unavailable: ${e.message}` }; }
  })(),
  remaining_gaps: gaps,
  unexecuted: [
    'Provider strict-mode acceptance of each adapter (api.meta.ai) — requires the first authorized qualification call; local ajv validity is not provider acceptance.',
    'Checks that return HOLD without context (fact registry, candidate manifest, learning loop, intervention lineage, now_utc) have been exercised only with synthetic context fixtures.',
    'No V1 projection exists for 05.sessions (TeachingUnit) or 19A.units; synthetic fixtures only.',
  ],
};
mkdirSync(join(ROOT, 'coordination'), { recursive: true });
const out = join(ROOT, 'coordination', 'CLAUDE-SCHEMA-RECEIPT-v0.4.0.json');
const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n', 'utf8');
writeFileSync(out, bytes);
console.log(JSON.stringify({ written: rel('coordination/CLAUDE-SCHEMA-RECEIPT-v0.4.0.json'), sha256: sha256Bytes(bytes), adapters: adapter_receipts.length, pass: adapter_receipts.filter(r => r.validation.status === 'PASS').length, gaps }, null, 2));
process.exit(gaps.length ? 1 : 0);
