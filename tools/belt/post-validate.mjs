// Deterministic post-validator for the v0.4.0 pilot adapters (Claude lane).
// API:  validateArtifact({stage_id, artifact, context}) -> {status, checks, errors, metrics}
// CLI:  node tools/belt/post-validate.mjs --stage <stage_id> --artifact <file.json> [--context <file.json>] [--json]
// Pure: reads only the files named on the command line plus schemas-strict/*; no network, no writes, no clock.
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256File } from './lib/hash.mjs';
import { mappedCompensatingChecks } from '../wrap-post-validation-receipt.mjs';   // Sol's shared mapping reader (static import: closure-traceable)

const here = dirname(fileURLToPath(import.meta.url));
export const LANE_ROOT = resolve(here, '..', '..');           // D:/nova/fb-ai-hackathon
const STAGE_MAP_PATH = join(LANE_ROOT, 'schemas-strict', 'stage-map.json');

export function loadStageMap() {
  return JSON.parse(readFileSync(STAGE_MAP_PATH, 'utf8'));
}

const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true });
addFormats(ajv);
const compiled = new Map();

function compileAdapter(schemaRel) {
  if (compiled.has(schemaRel)) return compiled.get(schemaRel);
  const abs = join(LANE_ROOT, schemaRel);
  if (!existsSync(abs)) return null;
  const schema = JSON.parse(readFileSync(abs, 'utf8'));
  const validate = ajv.compile(schema);
  const entry = { validate, sha256: sha256File(abs), abs };
  compiled.set(schemaRel, entry);
  return entry;
}

function stripFixtureMeta(artifact) {
  if (artifact && typeof artifact === 'object' && !Array.isArray(artifact) && '_fixture' in artifact) {
    const { _fixture, ...rest } = artifact;
    return { artifact: rest, fixture_meta: _fixture };
  }
  return { artifact, fixture_meta: null };
}

export async function validateArtifact({ stage_id, artifact, context = {} }) {
  const map = loadStageMap();
  const stage = map.stages[stage_id];
  const checks = [];
  const errors = [];
  const metrics = {};
  if (!stage) {
    return { status: 'HOLD', checks, errors: [`unknown stage_id ${stage_id}`], metrics };
  }
  // Fixture metadata is stripped ONLY when the caller opts in (fixture runners/tests). Real runs never set it,
  // so a `_fixture` key in a production artifact fails the adapter schema (additionalProperties:false).
  const strip = context.strip_fixture_meta === true;
  const { artifact: body, fixture_meta } = strip ? stripFixtureMeta(artifact) : { artifact, fixture_meta: null };
  if (fixture_meta) metrics.fixture_kind = fixture_meta.kind ?? 'unknown';

  // 1. adapter schema (layer 1)
  const adapter = compileAdapter(stage.adapter_schema);
  if (!adapter) {
    checks.push({ check_id: `${stage.prefix}.SCHEMA`, status: 'HOLD', evidence: `adapter schema missing: ${stage.adapter_schema}` });
  } else {
    const ok = adapter.validate(body);
    metrics.adapter_schema_sha256 = adapter.sha256;
    checks.push({
      check_id: `${stage.prefix}.SCHEMA`,
      status: ok ? 'PASS' : 'FAIL',
      evidence: ok ? `validates against ${stage.adapter_schema}` : `${adapter.validate.errors.length} schema error(s): ` +
        adapter.validate.errors.slice(0, 8).map(e => `${e.instancePath || '/'} ${e.message}`).join('; '),
      metrics: ok ? undefined : { error_count: adapter.validate.errors.length },
    });
  }

  // 2. compensating checks (layer 2)
  const modAbs = join(LANE_ROOT, stage.checks_module);
  if (!existsSync(modAbs)) {
    checks.push({ check_id: `${stage.prefix}.CHECKS_MODULE`, status: 'HOLD', evidence: `checks module missing: ${stage.checks_module}` });
  } else {
    const mod = await import(pathToFileURL(modAbs).href);
    if (typeof mod.run !== 'function') {
      errors.push(`${stage.checks_module} does not export run()`);
    } else {
      try {
        const out = await mod.run(body, { ...context, stage, lane_root: LANE_ROOT });
        for (const c of out ?? []) {
          if (!c || !c.check_id || !['PASS', 'FAIL', 'HOLD'].includes(c.status)) { errors.push(`malformed check from ${stage.checks_module}: ${JSON.stringify(c).slice(0, 120)}`); continue; }
          checks.push(c);
          if (c.metrics) for (const [k, v] of Object.entries(c.metrics)) metrics[`${c.check_id}.${k}`] = v;
        }
      } catch (e) {
        errors.push(`checks module threw: ${e.message}`);
      }
    }
  }

  // Fail closed: every compensating check the stage mapping names must be emitted. A checks module that silently
  // omits one cannot yield PASS. Required ids come from Sol's shared parser so both sides read the mapping identically.
  try {
    const mappingAbs = join(LANE_ROOT, stage.mapping);
    if (existsSync(mappingAbs)) {
      const mapped = mappedCompensatingChecks(JSON.parse(readFileSync(mappingAbs, 'utf8')), stage_id);
      const emitted = new Set(checks.map(c => c.check_id));
      const missing = (mapped.check_ids ?? []).filter(id => !emitted.has(id));
      if (mapped.status !== 'PASS') checks.push({ check_id: `${stage.prefix}.REQUIRED_CHECKS_MAPPING`, status: 'HOLD', evidence: `mapping unparseable for required checks: ${mapped.validation_errors.join('; ').slice(0, 300)}` });
      else if (missing.length) checks.push({ check_id: `${stage.prefix}.REQUIRED_CHECKS_MISSING`, status: 'FAIL', evidence: `${missing.length} mapped check(s) not emitted: ${missing.join(', ')}` });
      metrics.required_checks = (mapped.check_ids ?? []).length;
      metrics.required_checks_missing = missing.length;
    }
  } catch (e) {
    checks.push({ check_id: `${stage.prefix}.REQUIRED_CHECKS_MAPPING`, status: 'HOLD', evidence: `required-check enforcement unavailable: ${e.message.slice(0, 200)}` });
  }

  const status = errors.length || checks.some(c => c.status === 'FAIL') ? 'FAIL'
    : checks.some(c => c.status === 'HOLD') ? 'HOLD' : 'PASS';
  return { status, stage_id, checks, errors, metrics };
}

// ---- CLI ----
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const get = (flag) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : undefined; };
  const stage_id = get('--stage');
  const artifactPath = get('--artifact');
  const contextPath = get('--context');
  if (!stage_id || !artifactPath) {
    console.error('usage: node tools/belt/post-validate.mjs --stage <stage_id> --artifact <file.json> [--context <file.json>]');
    process.exit(2);
  }
  const artifact = JSON.parse(readFileSync(artifactPath, 'utf8'));
  const context = contextPath ? JSON.parse(readFileSync(contextPath, 'utf8')) : {};
  const result = await validateArtifact({ stage_id, artifact, context });
  result.artifact_sha256 = sha256File(artifactPath);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.status === 'PASS' ? 0 : result.status === 'FAIL' ? 1 : 2);
}
