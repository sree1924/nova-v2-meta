#!/usr/bin/env node
// rebuild-shell.mjs — rebuild the multi-state learner shell (app-preview/) and the store mirror
// (store/public/app/) from the belt ledgers, end to end, and prove the result.
// Runbook: coordination/SHELL-BUILD-RUNBOOK.md (what each step does and why).
//
//   node tools/preview/rebuild-shell.mjs                 # every state in app-preview/data/states.json
//   node tools/preview/rebuild-shell.mjs --states TX,CA  # only these states (shared steps still run)
//   node tools/preview/rebuild-shell.mjs --dry           # print the plan; write nothing
//   node tools/preview/rebuild-shell.mjs --no-store      # stop after the app-preview harness
//
// Local only: no network, no model calls, no audio minting, no git. Reads runs/<run>/ledger/run.sqlite
// (the pointer of record) and run-config.json; writes only app-preview/data/**, app-preview/*-embedded.js,
// runs/<run>/16/<section>/CURRENT.json, store/public/app/** and store/src/generated/**.
// Exit 0 = every step passed and the audit (always all 51 jurisdictions) reports no problems; exit 1 = a step failed.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const NO_STORE = args.includes('--no-store');
const si = args.indexOf('--states');
const ONLY = si >= 0 ? new Set(args[si + 1].toUpperCase().split(',').map((s) => s.trim()).filter(Boolean)) : null;
const today = new Date().toISOString().slice(0, 10);

const log = (s) => console.log(s);
const step = (n, title) => log(`\n== STEP ${n}: ${title}`);
const run = (label, script, argv, { allowFail = false, quiet = true } = {}) => {
  const shown = ['node', path.relative(ROOT, script).replace(/\\/g, '/'), ...argv].map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ');
  if (DRY) { log('  [dry] ' + shown); return { ok: true, out: '' }; }
  const r = spawnSync(process.execPath, [script, ...argv], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const out = (r.stdout || '') + (r.stderr || '');
  const ok = r.status === 0;
  const tail = out.trim().split('\n').filter((l) => !/ExperimentalWarning|trace-warnings/.test(l)).slice(-1)[0] || '';
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${quiet ? '' : ''} :: ${tail.slice(0, 160)}`);
  if (!ok && !allowFail) { log('\nSTOPPED: ' + label + ' failed.\n' + out.slice(-2000)); process.exit(1); }
  return { ok, out };
};
const P = (f) => path.join(ROOT, 'tools/preview', f);
const B = (f) => path.join(ROOT, 'tools/belt', f);

// ---- STEP 0: preflight --------------------------------------------------------------------------
step(0, 'preflight (node, registry, every run dir + ledger)');
const [maj, min] = process.versions.node.split('.').map(Number);
if (maj < 22 || (maj === 22 && min < 5)) { log('  FAIL node ' + process.versions.node + ' (need 22.5+ for node:sqlite)'); process.exit(1); }
const statesPath = path.join(ROOT, 'app-preview/data/states.json');
const statesRaw = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
const states = (Array.isArray(statesRaw) ? statesRaw : statesRaw.states || Object.values(statesRaw)).filter((s) => !ONLY || ONLY.has(s.code));
if (ONLY) for (const c of ONLY) if (!states.find((s) => s.code === c)) { log('  FAIL ' + c + ' is not in states.json; onboard it first with onboard-state.mjs'); process.exit(1); }
let bad = 0;
for (const s of states) {
  const rd = path.join(ROOT, 'runs', s.run_id);
  const miss = ['run-config.json', 'ledger/run.sqlite'].filter((f) => !fs.existsSync(path.join(rd, f)));
  if (miss.length) { bad++; log(`  FAIL ${s.code} ${s.run_id}: missing ${miss.join(', ')}`); }
}
if (bad) process.exit(1);
log(`  ok   node ${process.versions.node}; ${states.length} state(s); every run dir has run-config + ledger`);

// ---- STEP 1: CURRENT.json pointers (derived from the ledger) ------------------------------------
step(1, 'disk pointers 16/<section>/CURRENT.json from each ledger (latest accepted compile)');
run('mark-current-compiles', B('mark-current-compiles.mjs'), states.map((s) => 'runs/' + s.run_id));

// ---- STEP 2: export each state from its ledger --------------------------------------------------
step(2, 'export ledger-accepted learner artifacts into app-preview (newest accepted per stage+section; dossier per part)');
for (const s of states) {
  if (s.code === 'UT') {
    // Utah predates onboard-state: hand-onboarded at data/real with audio; export directly into it.
    run('UT export', P('export-content.mjs'), ['--run', s.run_id, '--out', 'app-preview/data/real', '--embed', 'app-preview/data-real-embedded.js', '--label', 'Utah Driver Handbook']);
    continue;
  }
  const a = ['--state', s.code, '--run', s.run_id];
  for (const [flag, key] of [['--name', 'name'], ['--handbook', 'handbook'], ['--test', 'test'], ['--authored-by', 'authored_by']]) if (s[key]) a.push(flag, s[key]);
  run(s.code + ' onboard', P('onboard-state.mjs'), a);
}

// ---- STEP 3: registry embed + point-of-sale quarantine ------------------------------------------
step(3, 'states-embedded.js (file:// fallback) + quarantine hold lists');
run('embed-states', P('embed-states.mjs'), []);
run('quarantine --write', P('quarantine.mjs'), ['--write']);

// ---- STEP 4: harness on app-preview --------------------------------------------------------------
step(4, 'learner harness on app-preview (routes, gates, content invariants)');
run('verify-learner (app-preview)', P('verify-learner.cjs'), []);

if (NO_STORE) { log('\n--no-store: stopping before the store mirror.'); process.exit(0); }

// ---- STEP 5: store mirror ------------------------------------------------------------------------
step(5, 'mirror app-preview -> store/public/app + store/src/generated (catalog, free paths, quarantine index)');
run('sync-store', P('sync-store.mjs'), []);
run('verify-learner (store mirror)', P('verify-learner.cjs'), ['--root=store/public/app']);

// ---- STEP 6: completeness audit ------------------------------------------------------------------
step(6, 'audit: ledger vs disk pointers vs shell export vs dossier parts vs store mirror');
const auditOut = `coordination/STATE-COMPLETENESS-AUDIT-${today}.md`;
const audit = run('state-audit', P('state-audit.mjs'), ['--out', auditOut]);
if (!DRY) {
  const m = audit.out.match(/(\d+)\/(\d+) jurisdictions fully complete; (\d+) with problems/);
  if (!m || m[3] !== '0') { log('\nSTOPPED: audit reports problems. See ' + auditOut); process.exit(1); }
  log(`\nDONE: ${m[1]}/${m[2]} complete; report ${auditOut}. Next: commit app-preview/, runs/*/16/*/CURRENT.json and the report (store/public/app is gitignored; deploy runs sync).`);
}
