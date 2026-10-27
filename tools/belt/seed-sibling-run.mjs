#!/usr/bin/env node
// seed-sibling-run.mjs — clone a run's identity-free parts into a NEW run dir so the same handbook can be belted again under a
// different authoring mode (founder 2026-10-27: Model-API run = Utah centerpiece; everything after = Muse Code subscription).
// Copies run-config (new run_id/lineage, nonces reset, path refs rewritten), the standing authority, the private handbook
// snapshot, role-19 learning loop and the role-15 observation receipt; then initialises the ledger, registers the source and
// pins the learning loop through the controller. No model calls, $0.
//
//   node tools/belt/seed-sibling-run.mjs --from runs/2026-10-26-rdmv-ut-class-d --to 2026-10-27-rdmv-ut-class-d-muse --authoring muse_code_subscription
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const FROM = get('--from', 'runs/2026-10-26-rdmv-ut-class-d').replace(/\\/g, '/').replace(/\/$/, '');
const TO_ID = get('--to');
const AUTHORING = get('--authoring', 'muse_code_subscription');
const EXECUTOR = get('--executor-id', '2bdcad95-d4cc-467e-a88d-be4a6260cf03');
if (!TO_ID) { console.error('--to <new-run-id> required'); process.exit(2); }
const TO = `runs/${TO_ID}`;
const src = (p) => path.join(ROOT, FROM, p), dst = (p) => path.join(ROOT, TO, p);
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const readJ = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJ = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); };
const copy = (rel) => { fs.mkdirSync(path.dirname(dst(rel)), { recursive: true }); fs.copyFileSync(src(rel), dst(rel)); return rel; };
const rewrite = (s) => typeof s === 'string' ? s.split(FROM).join(TO) : s;

if (fs.existsSync(dst('run-config.json'))) { console.error(`${TO} already exists; refusing to overwrite`); process.exit(2); }
const fromId = readJ(src('run-config.json')).run_id;

// 1. private handbook snapshot + role-19 loop + role-15 observation receipt
const copied = [];
for (const rel of ['sources/private/Driver-Handbook-2026.pdf', 'sources/private/README.md', 'sources/private/SHA256', '19-learning-loop.json', 'receipts/15-passing-score-observation.json'])
  if (fs.existsSync(src(rel))) copied.push(copy(rel));
fs.writeFileSync(dst('.gitkeep'), '');

// 2. standing authority (same founder words and cap; run_id + authoring amendment)
const standingRel = 'approvals/STANDING-AUTHORITY-utah-full-run.json';
const standing = readJ(src(standingRel));
standing.run_id = TO_ID;
standing.amendments = [...(standing.amendments || []), { at: new Date().toISOString(), kind: 'authoring_mode', value: AUTHORING,
  founder_words: 'switch to muse authoring under subscription.. we can keep muse credit (2026-10-27)',
  effect: 'every producer dispatch is authored by Muse Code under its subscription; the Model API is not called; ledger actual per attempt = $0; validators, lineage policy and caps unchanged',
  derived_from: { run_id: fromId, path: `${FROM}/${standingRel}` } }];
writeJ(dst(standingRel), standing);
const standingRef = { path: `${TO}/${standingRel}`, sha256: sha(fs.readFileSync(dst(standingRel))) };

// 3. run-config: identity + refs
const cfg = readJ(src('run-config.json'));
cfg.run_id = TO_ID;
cfg.candidate_lineage_id = `${TO_ID}:lineage:1`;
delete cfg.candidate_lineage_reset_ref;
cfg.execution.retry_nonces = {};
cfg.execution.standing_authority_ref = standingRef;
cfg.execution.live_window = { armed_by: `founder standing authority 2026-10-27 (${AUTHORING})`, armed_at: new Date().toISOString() };
cfg.producer.authoring_mode = AUTHORING;
cfg.producer.authoring_note = 'Muse Code (muse-spark-1.3) authors every artifact under its subscription via tools/belt packets (dispatch.mjs emitAuthoringPacket / museFileTransport); no Model API call; ledger usage 0 → actual $0; same strict schemas, compensating checks, ledger and lineage policy as the Model-API run ' + fromId;
cfg.seeded_from = { run_id: fromId, at: new Date().toISOString(), by: 'tools/belt/seed-sibling-run.mjs', copied };
const walk = (v) => Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : rewrite(v);
const rewritten = walk(cfg);
// receipts referenced by path+sha must still verify after the path rewrite (same bytes, new location)
for (const [k, ref] of Object.entries(rewritten.scope?.passing_score_observation_ref ? { passing_score_observation_ref: rewritten.scope.passing_score_observation_ref } : {}))
  if (ref?.path && fs.existsSync(path.join(ROOT, ref.path))) rewritten.scope[k] = { ...ref, sha256: sha(fs.readFileSync(path.join(ROOT, ref.path))) };
// role-15 visual observation: the repo default names the source run's snapshot path; the same PDF (same sha256) lives at the
// new run's path, so a per-run copy with only source_document.path rewritten keeps the observation truthful.
const obsSrc = path.join(ROOT, 'coordination/ROLE15-VISUAL-OBSERVATION-v0.4.0.json');
if (fs.existsSync(obsSrc)) {
  const obs = readJ(obsSrc);
  obs.source_document.path = rewrite(obs.source_document.path);
  obs.copied_for_run = { run_id: TO_ID, from: 'coordination/ROLE15-VISUAL-OBSERVATION-v0.4.0.json', note: 'path rewritten to this run\'s private snapshot; sha256 and observations unchanged (same physical document)' };
  const obsRel = 'receipts/ROLE15-VISUAL-OBSERVATION.json';
  writeJ(dst(obsRel), obs);
  rewritten.scope.visual_observation_ref = { path: `${TO}/${obsRel}`, sha256: sha(fs.readFileSync(dst(obsRel))) };
  copied.push(obsRel);
}
writeJ(dst('run-config.json'), rewritten);
fs.writeFileSync(dst('jams.md'), `# jams — ${TO_ID}\n\nSeeded from ${fromId} on ${new Date().toISOString()} for authoring mode ${AUTHORING}.\n`);

// 4. ledger init + source registration + learning-loop pin (controller, no model calls)
const run = (label, cmdArgs) => {
  const r = spawnSync(process.execPath, ['tools/belt/controller.mjs', ...cmdArgs], { cwd: ROOT, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  console.log(`${label}: exit ${r.status}\n${out.split('\n').filter(Boolean).slice(-6).map((l) => '  ' + l.slice(0, 220)).join('\n')}`);
  return r.status === 0;
};
const ok1 = run('plan --init-ledger --register-sources', ['plan', '--run-config', `${TO}/run-config.json`, '--executor-id', EXECUTOR, '--init-ledger', '--register-sources']);
const ok2 = run('pin-learning-loop', ['pin-learning-loop', '--run-config', `${TO}/run-config.json`, '--executor-id', EXECUTOR]);
console.log(`\nSEEDED ${TO} (${AUTHORING}) from ${fromId}: copied ${copied.length} files; ledger ${ok1 ? 'initialised + source registered' : 'INIT FAILED'}; learning loop ${ok2 ? 'pinned' : 'PIN FAILED'}`);
process.exit(ok1 && ok2 ? 0 : 1);
