// Runner orchestration for the founder-approved full Utah run (standing authority, $30 cap, no per-call ceremony).
// Usage:
//   node tools/belt/run-utah.mjs --section sec09-rules-of-the-road [--stages 02,16,03,04,06,05.sessions,05.card_scripts]
//                                [--parts C,C2,A,B,D,E,E2,F,G] [--max-resets 2] [--dry]
// Per dispatch: mints runs/<run>/approvals/GO-<stage>-<ts>.json from the standing authority (founder words verbatim,
// this dispatch's section id, usd_ceiling = min(1, remaining cap)), calls dispatchStage({go:true}), and on HOLD logs the
// non-PASS checks. When a lineage's attempts are spent, writes a lineage-reset receipt (cause = failing check ids) and
// bumps candidate_lineage_id — under the standing authority, logged in jams.md. Stops at the cap or at --max-resets.
// A HOLD leaves its logical task `blocked` (never re-attempted); the runner retries by bumping execution.retry_nonces[stage:part]
// in run-config, which mints a NEW logical task (dispatch.mjs retryNonce) — still counted against the lineage attempt cap.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const RUN = 'runs/2026-10-26-rdmv-ut-class-d';
const EXECUTOR = '2bdcad95-d4cc-467e-a88d-be4a6260cf03';
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const section = get('--section');
const stages = get('--stages', '02,16,03,04,06,05.sessions,05.card_scripts').split(',');
const parts = get('--parts', 'C,C2,A,B,D,E,E2,F,G').split(',');
const maxResets = Number(get('--max-resets', '2'));
const dry = args.includes('--dry');
if (!section) { console.error('--section required'); process.exit(2); }
if (!process.env.MODEL_API_KEY) { console.error('MODEL_API_KEY absent (.env)'); process.exit(2); }

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const readJ = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const writeJ = (p, v) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(v, null, 2) + '\n');
const standing = readJ(`${RUN}/approvals/STANDING-AUTHORITY-utah-full-run.json`);
const { dispatchStage, retryNonceKey } = await import(pathToFileURL(path.join(ROOT, 'tools/belt/dispatch.mjs')).href);
const { compileAcceptedDossier } = await import(pathToFileURL(path.join(ROOT, 'tools/belt/controller.mjs')).href);
const { DatabaseSync } = await import('node:sqlite');

const STAGE_IDS = { '02': '02.dossier_sections', '03': '03.combined_kg', '04': '04.cards', '06': '06.exam_bank', '05.sessions': '05.sessions', '05.card_scripts': '05.card_scripts' };

function spentUsd() {
  const db = new DatabaseSync(path.join(ROOT, RUN, 'ledger/run.sqlite'), { readOnly: true });
  try { const r = db.prepare("select coalesce(sum(case when state='reported' then actual_microusd when state in ('reserved','unknown_provider_result') then reserved_microusd else 0 end),0) m from reservations").get(); return r.m / 1e6; }
  finally { db.close(); }
}
function mintApproval(stageId, usdCeiling) {
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const rel = `${RUN}/approvals/GO-${stageId}-${ts}.json`;
  const approval = { schema_version: 'nova-stage-approval.v0.4.0', run_id: standing.run_id, stage_id: stageId, section_ids: [section], founder_words: standing.founder_words, founder: standing.founder, derived_from_standing_authority: { path: `${RUN}/approvals/STANDING-AUTHORITY-utah-full-run.json`, sha256: sha(fs.readFileSync(path.join(ROOT, `${RUN}/approvals/STANDING-AUTHORITY-utah-full-run.json`))) }, recorded_by: { actor_id: 'claude-code-runner', session_id: EXECUTOR }, recorded_at: new Date().toISOString(), expires_at: standing.expires_at, usd_ceiling: usdCeiling, content_calls_authorized: true };
  writeJ(rel, approval);
  return { path: rel, sha256: sha(fs.readFileSync(path.join(ROOT, rel))) };
}
function resetLineage(stageId, cause) {
  const cfgPath = `${RUN}/run-config.json`; const cfg = readJ(cfgPath);
  const from = cfg.candidate_lineage_id; const n = Number(from.split(':').pop()) + 1; const to = `${standing.run_id}:lineage:${n}`;
  const rel = `${RUN}/receipts/lineage-reset-${stageId.replace(/[^A-Za-z0-9]/g, '')}-lineage${n}.json`;
  writeJ(rel, { schema_version: 'nova-lineage-reset.v0.4.0', run_id: standing.run_id, stage_id: stageId, from_lineage: from, to_lineage: to, authority: 'standing authority (founder, $30 cap, no per-call ceremony)', founder_words: standing.founder_words, cause, recorded_by: { actor_id: 'claude-code-runner', session_id: EXECUTOR }, recorded_at: new Date().toISOString() });
  cfg.candidate_lineage_id = to; cfg.candidate_lineage_reset_ref = { path: rel, sha256: sha(fs.readFileSync(path.join(ROOT, rel))), previous: cfg.candidate_lineage_reset_ref?.path ?? null };
  writeJ(cfgPath, cfg);
  fs.appendFileSync(path.join(ROOT, RUN, 'jams.md'), `\n- ${new Date().toISOString()} lineage reset → ${to} for ${stageId} (${section}) under standing authority; cause: ${cause}\n`);
  return to;
}
function bumpRetryNonce(stageId, partIds, np) {
  const cfgPath = `${RUN}/run-config.json`; const cfg = readJ(cfgPath);
  const key = retryNonceKey(stageId, partIds); cfg.execution.retry_nonces ??= {};
  cfg.execution.retry_nonces[key] = (cfg.execution.retry_nonces[key] ?? 0) + 1;
  cfg.execution.retry_nonces_note = 'per stage+part retry counter: each bump after a HOLD mints a NEW logical task (the held task stays blocked); the lineage attempt cap (C28) still bounds spend and triggers lineage resets';
  writeJ(cfgPath, cfg);
  fs.appendFileSync(path.join(ROOT, RUN, 'jams.md'), `\n- ${new Date().toISOString()} retry nonce ${key} → ${cfg.execution.retry_nonces[key]} after HOLD (${section}); non-PASS: ${np.join(', ')}\n`);
  console.log(`  retry → ${key} nonce ${cfg.execution.retry_nonces[key]}`);
}
function nonPass(result) {
  try { if (result.validation?.path) { const v = JSON.parse(fs.readFileSync(result.validation.path, 'utf8')); return v.checks.filter(c => c.status !== 'PASS').map(c => `${c.check_id}=${c.status}`); } } catch {}
  return [result.reason ?? result.status];
}
async function runStage(stageId, partIds) {
  let resets = 0;
  for (;;) {
    const spent = spentUsd(); const remaining = standing.usd_cap_total - spent;
    if (remaining < 0.25) { console.log(`CAP: spent $${spent.toFixed(3)} of $${standing.usd_cap_total}; stopping`); return { status: 'CAP' }; }
    const approvalRef = mintApproval(stageId, Math.min(1, remaining));
    const label = `${stageId}${partIds.length ? ' part ' + partIds.join('+') : ''}`;
    if (dry) { console.log(`DRY ${label} approval ${approvalRef.path}`); return { status: 'DRY' }; }
    let r;
    try { r = await dispatchStage({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, stageId, sectionIds: [section], partIds, approvalRef, go: true }); }
    catch (e) {
      if (/LINEAGE_ATTEMPT_LIMIT/.test(e.message) && resets < maxResets) { resets++; const to = resetLineage(stageId, `attempt limit after HOLDs; last non-PASS: ${(global.__last ?? []).join(',')}`); console.log(`  lineage → ${to} (reset ${resets}/${maxResets})`); continue; }
      if (/not eligible for a new attempt/.test(e.message)) { bumpRetryNonce(stageId, partIds, global.__last ?? ['blocked_task']); continue; }
      console.log(`  ERROR ${label}: ${e.message.slice(0, 200)}`); return { status: 'ERROR', error: e.message };
    }
    const np = nonPass(r); global.__last = np;
    console.log(`  ${label}: ${r.status}${r.estimated_usd != null ? ` $${r.estimated_usd.toFixed(3)}` : ''}${r.status !== 'accepted' ? ' — ' + np.join(', ') : ''}  [spent $${spentUsd().toFixed(3)}]`);
    if (r.status === 'accepted' || r.reused) return r;
    if (r.reason === 'unknown_provider_result_requires_reconciliation') return { status: 'NEEDS_RECONCILE' };
    // HOLD: the ledger marks the logical task `blocked`, and a blocked task never gets a second attempt. A retry is a NEW
    // logical task (bounded by the lineage attempt cap, which dispatchStage still enforces → LINEAGE_ATTEMPT_LIMIT → reset path).
    bumpRetryNonce(stageId, partIds, np);
  }
}

console.log(`UTAH RUN — section ${section}; stages ${stages.join(' → ')}; spent so far $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total}`);
for (const st of stages) {
  if (st === '16') {
    const c = await compileAcceptedDossier({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR });
    console.log(`  16.compile: ${c.status}${c.reason ? ' — ' + c.reason : ''}${c.errors ? ' — ' + JSON.stringify(c.errors).slice(0, 300) : ''}`);
    if (c.status !== 'PASS') { console.log('STOP: compile not PASS'); process.exit(1); }
    continue;
  }
  const stageId = STAGE_IDS[st] ?? st;
  const partList = stageId === '02.dossier_sections' ? parts.map(p => [p]) : [[]];
  for (const partIds of partList) {
    const r = await runStage(stageId, partIds);
    if (!['accepted'].includes(r.status) && !r.reused) { console.log(`STOP at ${stageId} ${partIds.join('+')}: ${r.status}`); process.exit(1); }
  }
}
console.log(`DONE section ${section}; spent $${spentUsd().toFixed(3)}`);
