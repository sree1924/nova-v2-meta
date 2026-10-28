#!/usr/bin/env node
// reregister-source.mjs — re-run role-15 source registration on a run that has ALREADY executed (ledger bound in execute
// mode), reusing the run's existing binding/mode/budget exactly as compileAcceptedDossier does. `plan --register-sources`
// claims the run in dry_run mode with the plan budget and therefore refuses (RUN_BINDING_CHANGED) once a run has dispatched.
// Why this exists (2026-10-28): tools/roles/15-register.mjs was patched (curly-apostrophe title matching) and the 15.sources
// task identity hashes that script, so a re-run mints a NEW registration task; the old one stays accepted in history.
// Use only at a worker boundary (no step in flight for the run): downstream packets re-key on the new registry pin.
//   node tools/belt/reregister-source.mjs --run runs/<run> --executor-id <uuid>
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const get = (k, d = null) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const RUN = get('--run');
const EXECUTOR = get('--executor-id');
if (!RUN || !EXECUTOR) { console.error('usage: --run runs/<run> --executor-id <uuid>'); process.exit(2); }

const {loadRun, registerSource} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/controller.mjs')).href);
const {openLedger} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/ledger.mjs')).href);
const {acquireExecutorLock} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/executor-lock.mjs')).href);
const {inside} = await import(pathToFileURL(path.join(ROOT, 'tools/belt/atomic-file.mjs')).href);

const loaded = loadRun({projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`});
const before = JSON.parse(fs.readFileSync(path.join(loaded.runDir, '15-source-registry.json'), 'utf8')).sources[0];
const lockHandle = acquireExecutorLock({runDir: loaded.runDir, runId: loaded.config.run_id, executorId: EXECUTOR});
let ledger, fence;
try {
  ledger = openLedger({dbPath: inside(loaded.runDir, loaded.config.execution?.ledger?.path || 'ledger/run.sqlite'), lockHandle});
  const previous = ledger.getRun(loaded.config.run_id);
  if (!previous) throw new Error('run has no ledger binding; use plan --init-ledger --register-sources instead');
  fence = ledger.claimRun({runId: loaded.config.run_id, bindingSha256: previous.binding_sha256, mode: previous.mode, budget: previous.budget_json});
  const result = await registerSource({projectRoot: ROOT, loaded, ledger, fence, lockHandle});
  const after = JSON.parse(fs.readFileSync(path.join(loaded.runDir, '15-source-registry.json'), 'utf8')).sources[0];
  const liveness = JSON.parse(fs.readFileSync(path.join(loaded.runDir, '15-source-liveness.json'), 'utf8'));
  console.log(JSON.stringify({run: loaded.config.run_id, registration: result.status ?? result, reused: result.reused ?? null,
    is_official: {before: before.is_official, after: after.is_official}, trust_tier: {before: before.trust_tier, after: after.trust_tier},
    liveness: liveness.status, edition: liveness.edition}, null, 1));
} finally { if (fence && ledger) ledger.releaseRun(fence); ledger?.close(); lockHandle.release(); }
