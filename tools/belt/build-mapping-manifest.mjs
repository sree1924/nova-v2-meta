// Builds schemas-strict/mapping-manifest.json from every schemas-strict/*.mapping.json present at run time.
//
// USAGE
//   node tools/belt/build-mapping-manifest.mjs              # verify pins, write the manifest, print a Markdown table
//   node tools/belt/build-mapping-manifest.mjs --no-write   # verify + print only
//   node tools/belt/build-mapping-manifest.mjs --strict     # also exit 1 when a stage-map stage has no mapping yet
//
// For each mapping it verifies adapter_schema.sha256 against the adapter's actual bytes (lane root) and
// parent_schema.sha256 against the parent's actual bytes (D:/nova, read-only) and against the stage-map pin,
// hashes every listed fixture, and indexes every dropped parent constraint. Writes:
//   schemas-strict/mapping-manifest.json
//   {version:"0.4.0", generated_from:[{path,sha256}], stages:{<stage_id>:{adapter, parent, adapter_kind, deviation_count,
//    dropped_constraint_count, compensating_checks:[ids], sentinels, fixtures:[{path,sha256,kind,expected_status}],
//    pin_ok, problems}}, dropped_parent_invariants_index:[{stage_id,json_pointer,keyword,compensating_check}],
//    missing_stages:[...], problems:[...]}
// Exit 1 on any hash mismatch / unreadable mapping / missing fixture (and, with --strict, missing stages); else 0.
// Tolerates stages whose mapping does not exist yet (sibling builders) and names them. Reads only; one write.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from './lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const NOVA = resolve(ROOT, '..');
const OUT_REL = 'schemas-strict/mapping-manifest.json';
const shaOrNull = (abs) => (existsSync(abs) ? sha256File(abs) : null);

export function buildMappingManifest() {
  const stageMap = JSON.parse(readFileSync(join(ROOT, 'schemas-strict', 'stage-map.json'), 'utf8'));
  const byMappingPath = Object.fromEntries(Object.entries(stageMap.stages).map(([id, st]) => [st.mapping, id]));
  const files = readdirSync(join(ROOT, 'schemas-strict')).filter(f => f.endsWith('.mapping.json')).sort();
  const generated_from = [{ path: 'schemas-strict/stage-map.json', sha256: sha256File(join(ROOT, 'schemas-strict', 'stage-map.json')) }];
  const stages = {};
  const index = [];
  const problems = [];
  for (const f of files) {
    const relPath = `schemas-strict/${f}`;
    const abs = join(ROOT, relPath);
    generated_from.push({ path: relPath, sha256: sha256File(abs) });
    let m;
    try { m = JSON.parse(readFileSync(abs, 'utf8')); } catch (e) { problems.push(`${relPath}: unreadable (${e.message})`); continue; }
    const stage_id = m.stage_id ?? byMappingPath[relPath] ?? f;
    const sp = [];
    const st = stageMap.stages[stage_id];
    if (!st) sp.push(`stage_id ${stage_id} not in stage-map`);
    else if (st.mapping !== relPath) sp.push(`stage-map expects mapping ${st.mapping}`);
    const adapterPath = m.adapter_schema?.path;
    const adapterActual = adapterPath ? shaOrNull(join(ROOT, adapterPath)) : null;
    if (!adapterActual) sp.push(`adapter missing on disk: ${adapterPath}`);
    else if (adapterActual !== m.adapter_schema.sha256) sp.push(`adapter sha256 pinned ${m.adapter_schema.sha256} != actual ${adapterActual}`);
    if (st && adapterPath && st.adapter_schema !== adapterPath) sp.push(`stage-map adapter ${st.adapter_schema} != mapping adapter ${adapterPath}`);
    const parentPath = m.parent_schema?.path;
    const parentActual = parentPath ? shaOrNull(join(NOVA, parentPath)) : null;
    if (!parentActual) sp.push(`parent missing: ${parentPath}`);
    else {
      if (parentActual !== m.parent_schema.sha256) sp.push(`parent sha256 pinned ${m.parent_schema.sha256} != actual ${parentActual}`);
      if (st && st.parent_schema?.sha256 !== m.parent_schema.sha256) sp.push(`parent pin differs from stage-map (${st.parent_schema?.sha256})`);
    }
    const fixtures = (m.fixtures ?? []).map(fx => {
      const sha = shaOrNull(join(ROOT, fx.path));
      if (!sha) sp.push(`fixture missing: ${fx.path}`);
      return { path: fx.path, sha256: sha, kind: fx.kind ?? null, expected_status: fx.expected_status ?? null };
    });
    const checkIds = new Set([...(m.compensating_checks ?? []),
      ...(m.deviations ?? []).map(d => d.compensating_check), ...(m.dropped_constraints ?? []).map(d => d.compensating_check)].filter(Boolean));
    for (const d of m.dropped_constraints ?? []) {
      index.push({ stage_id, json_pointer: d.json_pointer, keyword: d.keyword, compensating_check: d.compensating_check ?? null });
      if (!d.compensating_check) sp.push(`dropped constraint ${d.json_pointer} has no compensating_check`);
    }
    stages[stage_id] = {
      mapping: { path: relPath, sha256: sha256File(abs) },
      adapter: { path: adapterPath ?? null, sha256_pinned: m.adapter_schema?.sha256 ?? null, sha256_actual: adapterActual },
      parent: { path: parentPath ?? null, sha256_pinned: m.parent_schema?.sha256 ?? null, sha256_actual: parentActual },
      adapter_kind: m.adapter_kind ?? null,
      deviation_count: (m.deviations ?? []).length,
      dropped_constraint_count: (m.dropped_constraints ?? []).length,
      compensating_checks: [...checkIds].sort(),
      sentinels: m.sentinels ?? [],
      fixtures,
      unexecuted_count: (m.unexecuted ?? []).length,
      pin_ok: sp.length === 0,
      problems: sp,
    };
    problems.push(...sp.map(p => `${stage_id}: ${p}`));
  }
  const missing_stages = Object.keys(stageMap.stages).filter(id => !stages[id]);
  return { artifact_type: 'StrictAdapterMappingManifest', version: '0.4.0', generated_note: 'local deterministic; hashes over exact bytes; no model/endpoint', generated_from, stages, dropped_parent_invariants_index: index, missing_stages, problems };
}

export function toMarkdown(man) {
  const rows = ['| stage | adapter_kind | pin_ok | deviations | dropped | checks | fixtures (expected) |', '|---|---|---|---|---|---|---|'];
  for (const [id, s] of Object.entries(man.stages)) {
    const fx = s.fixtures.map(f => f.expected_status).reduce((m, k) => ((m[k] = (m[k] ?? 0) + 1), m), {});
    rows.push(`| ${id} | ${s.adapter_kind} | ${s.pin_ok ? 'yes' : 'NO'} | ${s.deviation_count} | ${s.dropped_constraint_count} | ${s.compensating_checks.length} | ${s.fixtures.length} ${JSON.stringify(fx)} |`);
  }
  let md = rows.join('\n');
  if (man.missing_stages.length) md += `\n\nMissing (no mapping yet): ${man.missing_stages.join(', ')}`;
  if (man.problems.length) md += `\n\nProblems:\n${man.problems.map(p => `- ${p}`).join('\n')}`;
  return md;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const man = buildMappingManifest();
  console.log(toMarkdown(man));
  if (!args.includes('--no-write')) {
    writeFileSync(join(ROOT, OUT_REL), JSON.stringify(man, null, 2) + '\n');
    console.log(`\nwrote ${OUT_REL} sha256=${sha256File(join(ROOT, OUT_REL))}`);
  }
  process.exit(man.problems.length || (args.includes('--strict') && man.missing_stages.length) ? 1 : 0);
}
