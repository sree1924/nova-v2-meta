// Lints every adapter in schemas-strict/ against the Meta strict-subset rules (CONVENTIONS.md §1).
// node tools/belt/strict-lint.mjs            -> prints a JSON report; exit 1 on any violation
// import { lintSchema } from './strict-lint.mjs'
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const FORBIDDEN = new Set(['allOf', 'oneOf', 'if', 'then', 'else', '$ref', 'not', 'patternProperties', 'dependentSchemas', 'dependentRequired', 'unevaluatedProperties', 'propertyNames']);
// Allowed only when the mapping file names a compensating check for the same pointer.
const SOFT = new Set(['minLength', 'maxLength', 'minItems', 'maxItems', 'pattern', 'format', 'const', 'uniqueItems', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'contains', 'minContains', 'maxContains', 'multipleOf', 'minProperties', 'maxProperties']);

export function lintSchema(schema, { compensated = new Set() } = {}) {
  const violations = [];
  const soft = [];
  let maxDepth = 0;
  if (!schema || schema.type !== 'object') violations.push({ pointer: '', rule: 'root must be type object' });
  if (Array.isArray(schema.anyOf) || Array.isArray(schema.enum)) violations.push({ pointer: '', rule: 'root must not use anyOf/enum' });

  const walk = (node, pointer, depth) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach((n, i) => walk(n, `${pointer}/${i}`, depth)); return; }
    maxDepth = Math.max(maxDepth, depth);
    for (const key of Object.keys(node)) {
      if (FORBIDDEN.has(key)) violations.push({ pointer, rule: `forbidden keyword ${key}` });
      if (SOFT.has(key)) (compensated.has(pointer) ? soft : violations).push({ pointer, rule: `${key} requires a compensating check (pointer not listed in mapping.dropped_constraints)` });
    }
    if (node.type === 'object' || node.properties) {
      if (node.additionalProperties !== false) violations.push({ pointer, rule: 'additionalProperties must be false' });
      const props = Object.keys(node.properties ?? {});
      const req = new Set(node.required ?? []);
      const missing = props.filter(p => !req.has(p));
      if (missing.length) violations.push({ pointer, rule: `required must list every property; missing: ${missing.join(',')}` });
      for (const [p, sub] of Object.entries(node.properties ?? {})) walk(sub, `${pointer}/properties/${p}`, depth + 1);
    }
    if (node.items) walk(node.items, `${pointer}/items`, depth + 1);
    if (Array.isArray(node.anyOf)) node.anyOf.forEach((s, i) => walk(s, `${pointer}/anyOf/${i}`, depth));
    if (Array.isArray(node.enum) && node.enum.length > 1000) violations.push({ pointer, rule: 'enum > 1000 values' });
  };
  walk(schema, '', 1);
  if (maxDepth > 10) violations.push({ pointer: '', rule: `nesting depth ${maxDepth} > 10` });
  return { ok: violations.length === 0, violations, soft_compensated: soft, max_depth: maxDepth };
}

export function lintAll() {
  const dir = join(ROOT, 'schemas-strict');
  const out = {};
  for (const f of readdirSync(dir).filter(f => f.endsWith('.schema.json'))) {
    const schema = JSON.parse(readFileSync(join(dir, f), 'utf8'));
    const mappingPath = join(dir, f.replace('.schema.json', '.mapping.json'));
    let compensated = new Set();
    try {
      const m = JSON.parse(readFileSync(mappingPath, 'utf8'));
      compensated = new Set((m.dropped_constraints ?? []).map(d => d.json_pointer));
    } catch { /* no mapping yet → every soft keyword is a violation */ }
    out[f] = lintSchema(schema, { compensated });
  }
  return out;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const report = lintAll();
  console.log(JSON.stringify(report, null, 2));
  process.exit(Object.values(report).every(r => r.ok) ? 0 : 1);
}
