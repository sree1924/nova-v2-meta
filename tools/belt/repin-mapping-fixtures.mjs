// Recompute fixture (and context) sha256 pins inside every schemas-strict/*.mapping.json after fixture bytes change.
// Usage: node tools/belt/repin-mapping-fixtures.mjs [--check]   (--check reports drift without writing; exit 1 on drift)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from './lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const check = process.argv.includes('--check');
const map = JSON.parse(readFileSync(join(ROOT, 'schemas-strict/stage-map.json'), 'utf8'));
let drift = 0;
for (const [sid, st] of Object.entries(map.stages)) {
  const mp = join(ROOT, st.mapping);
  const m = JSON.parse(readFileSync(mp, 'utf8'));
  let changed = 0;
  for (const fx of m.fixtures ?? []) {
    for (const [pathKey, shaKey] of [['path', 'sha256'], ['context_path', 'context_sha256']]) {
      if (!fx[pathKey]) continue;
      const abs = join(ROOT, fx[pathKey]);
      if (!existsSync(abs)) { console.log(`${sid}: missing ${fx[pathKey]}`); drift++; continue; }
      const now = sha256File(abs);
      if (fx[shaKey] !== now) { drift++; changed++; if (!check) fx[shaKey] = now; }
    }
  }
  // adapter pin too (schemas may have been edited)
  const adapterNow = sha256File(join(ROOT, st.adapter_schema));
  if (m.adapter_schema?.sha256 !== adapterNow) { drift++; changed++; if (!check) m.adapter_schema.sha256 = adapterNow; }
  if (changed && !check) writeFileSync(mp, JSON.stringify(m, null, 2) + '\n');
  console.log(`${sid.padEnd(20)} ${changed ? (check ? 'DRIFT ' : 'repinned ') + changed : 'ok'}`);
}
if (check && drift) process.exit(1);
