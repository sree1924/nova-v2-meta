// Builds a fresh explicitly named receipt in the shape tools/check-bot-contracts.mjs consumes
// (adapter_receipts[] with executed evidence refs + post_validator.api_mapping per prompt path).
// Usage: node tools/belt/build-receipt.mjs --out <new.json> --evidence-dir <new-directory>
//   --fixtures <results.json> --tests <results.json> --actor-id <actual actor>
//   --session-id <actual session> --model <actual model> --provider-family <actual provider>
//   [--authority-ref <existing local authority file>]
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
import { inside } from './atomic-file.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const rel = (p) => p.replace(/\\/g, '/');
const args = process.argv.slice(2);
const options={};
const required=['--out','--evidence-dir','--fixtures','--tests','--actor-id','--session-id','--model','--provider-family'];
const permitted=new Set([...required,'--authority-ref']);
try{
  for(let i=0;i<args.length;i+=2){
    const key=args[i],value=args[i+1];
    if(!permitted.has(key)||Object.hasOwn(options,key)||typeof value!=='string'||!value.trim()||value.startsWith('--'))throw new Error('Unknown, duplicate or missing argument: '+key);
    options[key]=value;
  }
  for(const key of required)if(!options[key])throw new Error('Required explicit '+key);
  const expected=/^(?:gpt-|o[134](?:-|$))/i.test(options['--model'])?'openai':/^claude-/i.test(options['--model'])?'anthropic':/^muse-/i.test(options['--model'])?'meta':null;
  if(expected&&options['--provider-family']!==expected)throw new Error('Contradictory provider/model identity');
}catch(error){console.error(JSON.stringify({status:'BLOCKED',message:error.message,writes_performed:0}));process.exit(2);}
const testsPath=rel(options['--tests']);
const out=inside(ROOT,options['--out']);
const evidenceDir=inside(ROOT,options['--evidence-dir']);
if(out===evidenceDir||existsSync(out)||existsSync(evidenceDir)){
  console.error(JSON.stringify({status:'BLOCKED',message:'Output receipt and evidence directory must both be fresh; existing owner evidence is immutable.',writes_performed:0}));process.exit(2);
}
const authorityFile=options['--authority-ref']?inside(resolve(ROOT,'..'),resolve(ROOT,options['--authority-ref'])):null;
const authorityRef=authorityFile?{path:rel(options['--authority-ref']),sha256:sha256File(authorityFile)}:null;

const stageMap = JSON.parse(readFileSync(join(ROOT, 'schemas-strict', 'stage-map.json'), 'utf8'));
const fixtureRunsPath=inside(ROOT,options['--fixtures']);
const fixtureRuns=JSON.parse(readFileSync(fixtureRunsPath,'utf8'));
const nodeTestsPath=inside(ROOT,testsPath);
const nodeTests=JSON.parse(readFileSync(nodeTestsPath,'utf8'));
const lint = lintAll();
const evidenceWrites=[];

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
  const parentActual = sha256File(join(resolve(ROOT,'..'), st.parent_schema.path));
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
  const evidenceAbs=inside(ROOT,join(evidenceDir,`${stage_id}.json`));
  if(dirname(evidenceAbs)!==evidenceDir)throw new Error('Stage evidence must be a direct child of the explicit evidence directory');
  const evidencePath=rel(evidenceAbs.slice(ROOT.length+1));
  const evidenceBytes = Buffer.from(JSON.stringify(evidence, null, 2) + '\n', 'utf8');
  evidenceWrites.push({path:evidenceAbs,bytes:evidenceBytes});
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
  artifact_type: 'BeltAdapterValidationReceipt', version: '0.4.0',
  author: { actor:options['--actor-id'], session_id:options['--session-id'], model:options['--model'], provider_family:options['--provider-family'], builders:'This receipt records the supplied operator identity. Underlying adapter authorship is not inferred.' },
  authority_ref:authorityRef,
  generated_note: 'Local deterministic adapter validation only. No model/endpoint call, content authoring, qualification, spend or execution GO is established by this receipt.',
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
  fixture_runs: fixtureRuns ? { path:rel(options['--fixtures']), sha256: sha256File(fixtureRunsPath), summary: fixtureRuns.summary ?? null } : null,
  node_tests: nodeTests ? { path: testsPath, sha256: sha256File(nodeTestsPath), summary: nodeTests.summary ?? null } : null,
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
const bytes = Buffer.from(JSON.stringify(receipt, null, 2) + '\n', 'utf8');
if(evidenceWrites.some(item=>item.path===out))throw new Error('Output receipt collides with a stage evidence path');
// All input reads and deterministic construction precede output publication. Never overwrite a foreign receipt.
mkdirSync(dirname(evidenceDir),{recursive:true});
mkdirSync(evidenceDir);
for(const item of evidenceWrites)writeFileSync(item.path,item.bytes,{flag:'wx'});
mkdirSync(dirname(out),{recursive:true});
writeFileSync(out,bytes,{flag:'wx'});
console.log(JSON.stringify({ written:rel(options['--out']), sha256: sha256Bytes(bytes), adapters: adapter_receipts.length, pass: adapter_receipts.filter(r => r.validation.status === 'PASS').length, gaps }, null, 2));
process.exit(gaps.length ? 1 : 0);
