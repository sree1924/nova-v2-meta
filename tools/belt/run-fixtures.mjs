// Runs every mapping-listed fixture through the post-validator and records observed vs expected status.
//
// USAGE
//   node tools/belt/run-fixtures.mjs                      # all stages in schemas-strict/stage-map.json whose mapping exists
//   node tools/belt/run-fixtures.mjs --stage 09.package   # one stage (repeatable: --stage a --stage b)
//   node tools/belt/run-fixtures.mjs --no-write           # print only; do not write the verification file
//
// For each stage whose `mapping` file exists, every `fixtures[].path` is read, its optional sibling context
// `<fixture>.context.json` (or `<fixture>.json.context.json`) is resolved by tools/belt/lib/fixture-context.mjs
// ({"$load": path} → parsed object + loaded_refs hashes), and validateArtifact() from tools/belt/post-validate.mjs
// is called. `_fixture` metadata is stripped by the dispatcher. Output:
//   verification/BELT-FIXTURE-RUNS-v0.4.0.json
//   {ran_at_note, results:[{stage_id, fixture, sha256, context, context_sha256, expected, observed, match, checks:[{check_id,status}], errors}], summary, missing_stages}
// Exit 1 on any expected != observed (or an unreadable fixture); 0 otherwise. Stages without a mapping are listed
// under missing_stages and do not fail the run. Local deterministic only: no model, no endpoint, no network, no clock.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateArtifact, loadStageMap, LANE_ROOT } from './post-validate.mjs';
import { loadFixtureContext, resolveContext } from './lib/fixture-context.mjs';
import { sha256File } from './lib/hash.mjs';

const OUT_REL = 'verification/BELT-FIXTURE-RUNS-v0.4.0.json';
const rel = (abs) => abs.replace(/\\/g, '/').replace(LANE_ROOT.replace(/\\/g, '/') + '/', '');

export async function runFixtures({ stages: only = null } = {}) {
  const map = loadStageMap();
  const results = [];
  const missing_stages = [];
  const mapping_errors = [];
  for (const [stage_id, st] of Object.entries(map.stages)) {
    if (only && !only.includes(stage_id)) continue;
    const mappingAbs = join(LANE_ROOT, st.mapping);
    if (!existsSync(mappingAbs)) { missing_stages.push({ stage_id, missing: st.mapping }); continue; }
    let mapping;
    try { mapping = JSON.parse(readFileSync(mappingAbs, 'utf8')); } catch (e) { mapping_errors.push({ stage_id, error: `mapping unreadable: ${e.message}` }); continue; }
    for (const fx of mapping.fixtures ?? []) {
      const abs = join(LANE_ROOT, fx.path);
      const row = { stage_id, fixture: fx.path, sha256: null, context: null, context_sha256: null, kind: fx.kind ?? null, expected: fx.expected_status ?? null, observed: null, match: false, checks: [], errors: [] };
      try {
        if (!existsSync(abs)) throw new Error(`fixture missing on disk: ${fx.path}`);
        row.sha256 = sha256File(abs);
        const artifact = JSON.parse(readFileSync(abs, 'utf8'));
        // Mapping rows may name their context explicitly (context_path); otherwise use the sibling convention.
        const { context, context_path } = fx.context_path
          ? { context: resolveContext(JSON.parse(readFileSync(join(LANE_ROOT, fx.context_path), 'utf8'))), context_path: join(LANE_ROOT, fx.context_path) }
          : loadFixtureContext(abs);
        if (context_path) { row.context = rel(context_path); row.context_sha256 = sha256File(context_path); }
        // Fixture runs opt in to `_fixture` stripping explicitly; the dispatcher never strips by default.
        const r = await validateArtifact({ stage_id, artifact, context: { ...context, strip_fixture_meta: true } });
        row.observed = r.status;
        row.checks = r.checks.map(c => ({ check_id: c.check_id, status: c.status }));
        row.errors = r.errors;
      } catch (e) {
        row.observed = 'ERROR';
        row.errors.push(e.message);
      }
      row.match = row.expected === row.observed;
      results.push(row);
    }
  }
  const by = (k) => results.filter(r => r.observed === k).length;
  const summary = {
    stages_run: [...new Set(results.map(r => r.stage_id))],
    fixtures: results.length, matched: results.filter(r => r.match).length, mismatched: results.filter(r => !r.match).length,
    observed: { PASS: by('PASS'), FAIL: by('FAIL'), HOLD: by('HOLD'), ERROR: by('ERROR') },
    stages_missing_mapping: missing_stages.map(m => m.stage_id),
    mapping_errors: mapping_errors.length,
  };
  return { artifact_type: 'BeltFixtureRuns', version: '0.4.0', ran_at_note: 'local deterministic, no model/endpoint', results, summary, missing_stages, mapping_errors };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const stages = args.flatMap((a, i) => (a === '--stage' ? [args[i + 1]] : []));
  const report = await runFixtures({ stages: stages.length ? stages : null });
  if (!args.includes('--no-write')) {
    mkdirSync(join(LANE_ROOT, 'verification'), { recursive: true });
    let toWrite = report;
    const outAbs = join(LANE_ROOT, OUT_REL);
    if (stages.length && existsSync(outAbs)) {
      // --stage run: merge into the existing file, replacing only the rows of the stages just run.
      const prev = JSON.parse(readFileSync(outAbs, 'utf8'));
      const results = [...(prev.results ?? []).filter(r => !stages.includes(r.stage_id)), ...report.results];
      const by = (k) => results.filter(r => r.observed === k).length;
      toWrite = { ...report, results, merged_from_previous_run: true,
        summary: { ...report.summary, stages_run: [...new Set(results.map(r => r.stage_id))], fixtures: results.length,
          matched: results.filter(r => r.match).length, mismatched: results.filter(r => !r.match).length,
          observed: { PASS: by('PASS'), FAIL: by('FAIL'), HOLD: by('HOLD'), ERROR: by('ERROR') } } };
    }
    writeFileSync(outAbs, JSON.stringify(toWrite, null, 2) + '\n');
  }
  for (const r of report.results) console.log(`${r.match ? 'ok  ' : 'MISM'} ${r.stage_id.padEnd(20)} ${r.observed.padEnd(5)} (expected ${r.expected})  ${r.fixture}`);
  if (report.missing_stages.length) console.log(`stages without a mapping (skipped): ${report.missing_stages.map(m => m.stage_id).join(', ')}`);
  for (const m of report.mapping_errors) console.log(`mapping error ${m.stage_id}: ${m.error}`);
  console.log(JSON.stringify(report.summary));
  if (!args.includes('--no-write')) console.log(`wrote ${OUT_REL} sha256=${sha256File(join(LANE_ROOT, OUT_REL))}`);
  process.exit(report.summary.mismatched || report.mapping_errors.length ? 1 : 0);
}
