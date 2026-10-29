// Verifies that every file the belt resolves OUTSIDE the clone root exists at
// <parent>/<path> with the pinned sha256. Run from the clone root after
//   unzip -o coordination/cloud/parent-pins.zip -d ..
// Usage: node coordination/cloud/verify-parent-pins.mjs [--parent <dir>]   (default: parent of the clone root)
// Exit 0 = PASS (every pin present and byte-exact); exit 1 = FAIL with the missing/mismatched list.
// Sources of truth it reads (all inside the clone): contracts/bot-contract-bindings.json (role contracts,
// status != pinned_local resolve against the parent), prompts/*.md front matter (master_sme_ref), and the
// two schema files the controller and registrar load from ../schemas.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argv = process.argv.slice(2);
const pi = argv.indexOf('--parent');
const PARENT = pi >= 0 ? path.resolve(argv[pi + 1]) : path.dirname(ROOT);
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

const pins = []; // {path, sha256|null, why}
const bindings = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/bot-contract-bindings.json'), 'utf8'));
for (const r of bindings.roles || []) {
  const c = r.contract || {};
  if (!c.path || c.status === 'pinned_local') continue;
  pins.push({ path: c.path, sha256: c.sha256 || null, why: 'role ' + r.role_id + ' contract (controller plan step / dispatch)' });
}
for (const f of fs.readdirSync(path.join(ROOT, 'prompts')).filter((n) => n.endsWith('.md'))) {
  const t = fs.readFileSync(path.join(ROOT, 'prompts', f), 'utf8');
  const m = t.match(/^master_sme_ref: (.+)$/m), h = t.match(/^master_sme_file_sha256: ([a-f0-9]{64})$/m);
  if (m) pins.push({ path: m[1].trim(), sha256: h ? h[1] : null, why: 'prompts/' + f + ' master_sme_ref (every 02 dispatch)' });
}
pins.push({ path: 'schemas/learning-loop.schema.json', sha256: null, why: 'controller pin-learning-loop + intake-state registrar' });

const seen = new Set();
let fail = 0;
for (const p of pins) {
  if (seen.has(p.path)) continue;
  seen.add(p.path);
  const abs = path.join(PARENT, p.path);
  if (!fs.existsSync(abs)) { fail++; console.log('MISSING  ' + p.path + '  <- ' + p.why); continue; }
  const actual = sha(abs);
  if (p.sha256 && actual !== p.sha256) { fail++; console.log('MISMATCH ' + p.path + '  pinned ' + p.sha256.slice(0, 8) + ' actual ' + actual.slice(0, 8) + '  <- ' + p.why); continue; }
  console.log('ok       ' + p.path + '  ' + actual.slice(0, 8) + (p.sha256 ? '' : ' (presence only)'));
}
console.log((fail ? 'FAIL ' + fail + ' of ' : 'PASS ') + seen.size + ' parent pins under ' + PARENT);
process.exit(fail ? 1 : 0);
