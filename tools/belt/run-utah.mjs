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
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
// --run <runs/...> picks the run dir (default: the Utah Model-API run). --author muse switches every dispatch to Muse Code
// subscription authoring: each call to this script is ONE STEP — ingest the outbox Muse wrote (if present) through the normal
// validator/ledger path at $0, then emit the next packet and exit 3 (WAITING). Exit 0 = every requested section DONE.
const RUN = get('--run', 'runs/2026-10-26-rdmv-ut-class-d').replace(/\\/g, '/').replace(/\/$/, '');
const EXECUTOR = '2bdcad95-d4cc-467e-a88d-be4a6260cf03';
const author = get('--author', null);
const stepMode = author === 'muse';
// --packet thin (v2): state/section context layers written once, few-KB part packets (dispatch.mjs emitThinPacket). Default = full.
const packetMode = get('--packet', 'full');
// --remint <stageId> (2026-10-28, Tennessee sec05): do NOT skip this stage for the listed --sections even though a version is
// already accepted. With execution.retry_nonces bumped for that stage+section the dispatcher mints a NEW logical task (the old
// accepted artifact stays in history); without a bumped nonce the dispatcher just returns the accepted one (reused). Used to
// re-mint 04.cards with a merge when an accepted card back can never pass a later stage's check.
const remintStage = get('--remint', null);
if (!['full', 'thin'].includes(packetMode)) { console.error(`unknown --packet ${packetMode}; supported: full, thin`); process.exit(2); }
if (author && !stepMode) { console.error(`unknown --author ${author}; supported: muse`); process.exit(2); }
const stages = get('--stages', '02,16,03,04,06,05.sessions,05.card_scripts').split(',');
const parts = get('--parts', 'C,C2,A,B,D,E,E2,F,G').split(',');
const maxResets = Number(get('--max-resets', '2'));
const dry = args.includes('--dry');
// --section <id> runs one section; --sections all|a,b,c runs several in handbook order (per-section belt, 2026-10-27).
const sectionsArg = get('--sections');
const allSections = Object.keys(JSON.parse(fs.readFileSync(path.join(path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..'), RUN, 'run-config.json'), 'utf8')).scope.section_page_ranges);
const sections = sectionsArg ? (sectionsArg === 'all' ? allSections : sectionsArg.split(',')) : (get('--section') ? [get('--section')] : []);
if (!sections.length) { console.error('--section <id> or --sections all|a,b required'); process.exit(2); }
for (const s of sections) if (!allSections.includes(s)) { console.error(`unknown section ${s}; known: ${allSections.join(', ')}`); process.exit(2); }
let section = sections[0]; // current section; helpers below read it
if (!process.env.MODEL_API_KEY) { console.error('MODEL_API_KEY absent (.env)'); process.exit(2); }

const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const readJ = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const writeJ = (p, v) => fs.writeFileSync(path.join(ROOT, p), JSON.stringify(v, null, 2) + '\n');
const standing = readJ(`${RUN}/approvals/STANDING-AUTHORITY-utah-full-run.json`);
const { dispatchStage, retryNonceKey, emitAuthoringPacket, emitThinPacket, museFileTransport, readAuthoringOutbox, authoringKey, authoringPaths } = await import(pathToFileURL(path.join(ROOT, 'tools/belt/dispatch.mjs')).href);
const { compileAcceptedDossier, reconcileAttempt } = await import(pathToFileURL(path.join(ROOT, 'tools/belt/controller.mjs')).href);
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
  const key = retryNonceKey(stageId, partIds, [section]); cfg.execution.retry_nonces ??= {};
  cfg.execution.retry_nonces[key] = (cfg.execution.retry_nonces[key] ?? 0) + 1;
  cfg.execution.retry_nonces_note = 'per stage+part retry counter: each bump after a HOLD mints a NEW logical task (the held task stays blocked); the lineage attempt cap (C28) still bounds spend and triggers lineage resets';
  writeJ(cfgPath, cfg);
  fs.appendFileSync(path.join(ROOT, RUN, 'jams.md'), `\n- ${new Date().toISOString()} retry nonce ${key} → ${cfg.execution.retry_nonces[key]} after HOLD (${section}); non-PASS: ${np.join(', ')}\n`);
  console.log(`  retry → ${key} nonce ${cfg.execution.retry_nonces[key]}`);
}
// Parts already accepted under ANY task identity/lineage (the validator closure may have been resealed since) are not re-bought.
function acceptedParts(stageId) {
  const db = new DatabaseSync(path.join(ROOT, RUN, 'ledger/run.sqlite'), { readOnly: true });
  try {
    const rows = db.prepare("select identity_json from tasks where stage_id=? and status='accepted'").all(stageId).map(r => JSON.parse(r.identity_json)).filter(i => JSON.stringify(i?.config?.section_ids ?? []) === JSON.stringify([section]));
    if (stageId === '02.dossier_sections') return rows.map(i => JSON.stringify(i?.config?.dossier_parts ?? []));
    // Downstream stages are "done" only if accepted over the section's CURRENT compile (its fact registry sha is among the task's
    // pinned inputs); a recompile (compiler fix) makes them due again, and the latest accepted wins downstream.
    const reg = sectionRegistries();
    if (!reg) return rows.map(i => JSON.stringify(i?.config?.dossier_parts ?? []));
    return rows.filter(i => (i.inputs ?? []).some(ref => reg.equivalent.has(ref.sha256))).map(i => JSON.stringify(i?.config?.dossier_parts ?? []));
  }
  finally { db.close(); }
}
// All accepted compiles of this section; "equivalent" = registries whose FACT-ID SET equals the latest one (a wording-only
// recompile keeps downstream valid; a recompile that reclassifies facts (e.g. R-entries → kg_hints) makes downstream due again).
function sectionRegistries() {
  try {
    const db = new DatabaseSync(path.join(ROOT, RUN, 'ledger/run.sqlite'), { readOnly: true });
    try {
      const comps = db.prepare("select t.task_id, t.identity_json, t.updated_at from tasks t where t.stage_id='16.compile' and t.status='accepted'").all()
        .filter(r => { const ids = JSON.parse(r.identity_json)?.config?.section_ids; return (Array.isArray(ids) && ids.length ? ids : ['sec09-rules-of-the-road'])[0] === section; })
        .sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
      if (!comps.length) return null;
      const regs = comps.map(cmp => { const art = db.prepare("select path, sha256 from artifacts where task_id=? and path like '%16-fact-registry.json'").get(cmp.task_id); if (!art) return null; try { const f = JSON.parse(fs.readFileSync(path.isAbsolute(art.path) ? art.path : path.join(ROOT, RUN, art.path), 'utf8')); return { sha: art.sha256, ids: Object.keys(f.facts ?? {}).sort().join(',') }; } catch { return null; } }).filter(Boolean);
      if (!regs.length) return null;
      const current = regs[0];
      return { current: current.sha, equivalent: new Set(regs.filter(r => r.ids === current.ids).map(r => r.sha)) };
    } finally { db.close(); }
  } catch { return null; }
}
// Attempts already booked on (lineage, stage) — the C28 cap counts these across all logical tasks of the stage.
function lineageAttempts(stageId, lineageId) {
  const db = new DatabaseSync(path.join(ROOT, RUN, 'ledger/run.sqlite'), { readOnly: true });
  try { return db.prepare('select count(*) c from attempts a join tasks t on t.task_id=a.task_id where t.lineage_id=? and t.stage_id=?').get(lineageId, stageId).c; }
  finally { db.close(); }
}
function reconcileLostResponse(stageId) {
  const db = new DatabaseSync(path.join(ROOT, RUN, 'ledger/run.sqlite'), { readOnly: true });
  let row, events, unknownFile;
  try {
    row = db.prepare("select a.attempt_id, a.task_id, r.reserved_microusd from attempts a join reservations r on r.attempt_id=a.attempt_id where a.status='unknown_provider_result' order by a.created_at desc limit 1").get();
    if (!row) return null;
    events = db.prepare("select type, occurred_at, payload_json from events where attempt_id=? and type in ('model_call.dispatching','model_call.unknown_provider_result') order by occurred_at").all(row.attempt_id);
  } finally { db.close(); }
  const dir = path.join(ROOT, RUN, 'artifacts', row.task_id, row.attempt_id);
  try { unknownFile = JSON.parse(fs.readFileSync(path.join(dir, 'provider-unknown.json'), 'utf8')); } catch { unknownFile = null; }
  const t0 = events.find(e => e.type === 'model_call.dispatching')?.occurred_at, t1 = events.find(e => e.type === 'model_call.unknown_provider_result')?.occurred_at;
  const rel = `${RUN}/receipts/attempt-reconciliation-${row.attempt_id.slice(8, 16)}-lost-response.json`;
  writeJ(rel, { schema_version: 'nova-attempt-reconciliation.v0.4.0', run_id: standing.run_id, task_id: row.task_id, attempt_id: row.attempt_id, kind: 'lost_response',
    request_sent: true, response_received: false, no_request_sent: false, charge_assumed_microusd: row.reserved_microusd,
    evidence: { dispatching_at: t0 ?? null, unknown_at: t1 ?? null, elapsed_ms: t0 && t1 ? Date.parse(t1) - Date.parse(t0) : null, provider_unknown_file: unknownFile, raw_response_present: fs.existsSync(path.join(dir, 'raw-response.json')),
      reading: 'transport threw after send (client timeout/abort); provider may have generated and charged; no usage is known, so the full reserve is booked as spent' },
    disposition: 'attempt → failed, reservation → reported at the reserve (worst case), model_call → failed/LOST_RESPONSE; task → retry_wait|failed; the part is re-dispatched as a new logical task if still needed',
    authority: 'standing authority (founder, $30 cap, no per-call ceremony)', founder_words: standing.founder_words,
    recorded_by: { actor_id: 'claude-code-runner', session_id: EXECUTOR }, recorded_at: new Date().toISOString() });
  const proofRef = { path: path.posix.relative(RUN, rel), sha256: sha(fs.readFileSync(path.join(ROOT, rel))) }; // run-dir relative for the ledger
  fs.appendFileSync(path.join(ROOT, RUN, 'jams.md'), `\n- ${new Date().toISOString()} lost-response reconciliation ${row.attempt_id.slice(0, 24)} (${stageId}, ${section}): charge assumed $${(row.reserved_microusd / 1e6).toFixed(2)}; proof ${rel}\n`);
  return { attemptId: row.attempt_id, proofRef };
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
    // Muse subscription authoring: dispatch only when Muse's outbox for this exact task identity exists; otherwise emit the
    // packet and hand the step back (WAITING). The ingest goes through dispatchStage unchanged, with a file transport.
    let transport = null, outboxKey = null;
    if (stepMode) {
      const cfg0 = readJ(`${RUN}/run-config.json`);
      const nonce = cfg0.execution?.retry_nonces?.[retryNonceKey(stageId, partIds, [section])] ?? 0;
      const key = authoringKey(stageId, [section], partIds, nonce);
      const ap = authoringPaths(path.join(ROOT, RUN), key);
      const fileTransport = museFileTransport({ runDir: path.join(ROOT, RUN), key });
      const maxPerLineage = cfg0.limits?.max_automatic_attempts_per_logical_task ?? 2;
      let got = readAuthoringOutbox(path.join(ROOT, RUN), key);
      // The lineage attempt cap (C28: 2 attempts per lineage+stage) trips on every third task; in Model-API mode the runner
      // resets the lineage and re-dispatches in the same loop. In authoring mode the outbox was written against the OLD
      // lineage block, so ingesting it would fail 02.LINEAGE by construction (A n0 / B n0, 2026-10-27 23:35Z). So: reset the
      // lineage BEFORE emitting when the cap is already spent, and treat an outbox authored under a superseded lineage as stale.
      let previousNonPass = global.__last ?? [];
      if (got.ok) {
        let packetLineage = null;
        try { packetLineage = JSON.parse(fs.readFileSync(ap.inbox, 'utf8')).candidate_lineage_id ?? null; } catch {}
        const stale = (packetLineage && packetLineage !== cfg0.candidate_lineage_id) || lineageAttempts(stageId, cfg0.candidate_lineage_id) >= maxPerLineage;
        if (stale) {
          try { fs.renameSync(ap.outbox, path.join(ap.done, `${key}.stale_lineage.${Date.now()}.json`)); } catch {}
          console.log(`  ${label}: outbox authored under ${packetLineage ?? 'an exhausted lineage'} — lineage moves on; re-emitting the packet (content may be reused, lineage block must be re-copied)`);
          previousNonPass = ['LINEAGE_RESET: lineage_to_copy changed since you authored; re-copy candidate_lineage_id and input_manifest_sha256 from THIS packet (your content can stay)'];
          got = { ok: false, reason: 'stale_lineage' };
        }
      }
      if (!got.ok) {
        if (lineageAttempts(stageId, readJ(`${RUN}/run-config.json`).candidate_lineage_id) >= maxPerLineage) {
          const to = resetLineage(stageId, `proactive reset before authoring packet ${key} (lineage attempts exhausted)`);
          console.log(`  lineage → ${to} (proactive, before authoring)`);
        }
        if (!['outbox_absent', 'stale_lineage'].includes(got.reason)) console.log(`  ${label}: outbox unusable (${got.reason}) — re-emitting packet`);
        const emit = packetMode === 'thin' ? emitThinPacket : emitAuthoringPacket;
        const e = emit({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, stageId, sectionIds: [section], partIds, previousNonPass, transport: fileTransport });
        const rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
        console.log(`  ${label}: ${e.status} ${packetMode} packet ${key} (${Math.round(e.request_bytes / 1024)} KB${e.full_request_bytes ? ` vs ${Math.round(e.full_request_bytes / 1024)} KB full` : ''})${e.layers ? ` layers: state ${e.layers.state.rewritten ? 'written' : 'unchanged'}, section ${e.layers.section.rewritten ? 'written' : 'unchanged'}` : ''}${e.blockers.length ? ' blockers ' + e.blockers.join(',') : ''}`);
        console.log(`    → read ${rel(e.inbox)}, author the artifact under the Muse Code subscription, write ${rel(e.outbox)}, re-run this command`);
        return { status: 'WAITING', key, inbox: e.inbox, outbox: e.outbox };
      }
      transport = fileTransport; outboxKey = key;
    }
    try { r = await dispatchStage({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, stageId, sectionIds: [section], partIds, approvalRef, go: true, ...(transport ? { transport } : {}) }); }
    catch (e) {
      if (/LINEAGE_ATTEMPT_LIMIT/.test(e.message) && resets < maxResets) { resets++; const to = resetLineage(stageId, `attempt limit after HOLDs; last non-PASS: ${(global.__last ?? []).join(',')}`); console.log(`  lineage → ${to} (reset ${resets}/${maxResets})`); continue; }
      if (/not eligible for a new attempt/.test(e.message)) { bumpRetryNonce(stageId, partIds, global.__last ?? ['blocked_task']); continue; }
      if (/BUDGET_CAP|budget cap|cap exceeded/i.test(e.message)) { console.log(`CAP: ${e.message.slice(0, 160)}`); return { status: 'CAP' }; }
      if (/SEQUENTIAL_TASK_BUSY|Rebind is blocked while an attempt or uncertain provider result remains active/.test(e.message)) {
        // Another task is parked unknown_provider_result (lost response on an earlier part): reconcile it, then retry this dispatch.
        const lost = reconcileLostResponse(stageId);
        if (!lost) { console.log(`  ERROR ${label}: ${e.message.slice(0, 200)} (no unknown attempt found to reconcile)`); return { status: 'ERROR', error: e.message }; }
        const rc = await reconcileAttempt({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, attemptId: lost.attemptId, proofRef: lost.proofRef });
        console.log(`  reconciled lost response ${lost.attemptId.slice(0, 24)}: ${rc.status} charge assumed $${rc.charge_assumed_usd}; task ${rc.task_status}`);
        continue;
      }
      console.log(`  ERROR ${label}: ${e.message.slice(0, 200)}`); return { status: 'ERROR', error: e.message };
    }
    const np = nonPass(r); global.__last = np;
    if (outboxKey) {
      // Consumed: park the outbox under done/ with its verdict so the same key can never be ingested twice.
      const ap = authoringPaths(path.join(ROOT, RUN), outboxKey);
      try { fs.renameSync(ap.outbox, path.join(ap.done, `${outboxKey}.${r.status}.${Date.now()}.json`)); } catch {}
    }
    console.log(`  ${label}${outboxKey ? ' [muse subscription, $0]' : ''}: ${r.status}${r.estimated_usd != null ? ` $${r.estimated_usd.toFixed(3)}` : ''}${r.status !== 'accepted' ? ' — ' + np.join(', ') : ''}  [spent $${spentUsd().toFixed(3)}]`);
    if (r.status === 'accepted' || r.reused) return r;
    if (r.reason === 'budget_cap') { console.log(`CAP: reservation refused — ${r.detail ?? 'budget cap'} (spent $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total})`); return { status: 'CAP' }; }
    if (r.reason === 'unknown_provider_result_requires_reconciliation' || r.reason === 'unknown_provider_result') {
      const lost = reconcileLostResponse(stageId);
      if (!lost) return { status: 'NEEDS_RECONCILE' };
      const rc = await reconcileAttempt({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, attemptId: lost.attemptId, proofRef: lost.proofRef });
      console.log(`  reconciled lost response ${lost.attemptId.slice(0, 24)}: ${rc.status} charge assumed $${rc.charge_assumed_usd}; task ${rc.task_status}`);
      bumpRetryNonce(stageId, partIds, ['LOST_RESPONSE']);
      continue;
    }
    // HOLD: the ledger marks the logical task `blocked`, and a blocked task never gets a second attempt. A retry is a NEW
    // logical task (bounded by the lineage attempt cap, which dispatchStage still enforces → LINEAGE_ATTEMPT_LIMIT → reset path).
    bumpRetryNonce(stageId, partIds, np);
  }
}

// One section at a time, every stage; a section that STOPs is recorded and the run moves to the next section (the ledger keeps
// the per-task state, so a later launch resumes exactly where each section left off). Exit 1 if any section did not finish.
const outcomes = {};
console.log(`UTAH RUN — ${sections.length} section(s): ${sections.join(', ')}; stages ${stages.join(' → ')}; spent so far $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total}`);
sectionLoop: for (section of sections) {
  console.log(`\n=== ${section} ===`);
  for (const st of stages) {
    if (st === '16') {
      let c;
      // The compile may need to re-bind the ledger to a changed run-config (cap amendments); it does so under a GO minted from
      // the standing authority, exactly like a dispatch.
      // The C28 lineage attempt cap counts compile tasks too; several sections' compiles share a lineage, so on
      // LINEAGE_ATTEMPT_LIMIT (thrown before any attempt row exists) reset the lineage and compile again, like a dispatch.
      for (let tries = 0; ; tries++) {
        try { c = await compileAcceptedDossier({ projectRoot: ROOT, runConfigPath: `${RUN}/run-config.json`, executorId: EXECUTOR, sectionIds: [section], approvalRef: dry ? null : mintApproval('16.compile', Math.min(1, standing.usd_cap_total - spentUsd())) });; break; }
        catch (e) {
          if (/LINEAGE_ATTEMPT_LIMIT/.test(e.message) && tries < 2) { const to = resetLineage('16.compile', `compile attempt cap on shared lineage (${section})`); console.log(`  16.compile: lineage → ${to}`); continue; }
          console.log(`  16.compile: ERROR — ${e.message.slice(0, 300)}`); console.log(`STOP ${section}: compile threw`); outcomes[section] = 'ERROR 16.compile'; c = null; break;
        }
      }
      if (!c) continue sectionLoop;
      console.log(`  16.compile: ${c.status}${c.reused ? ' (reused ' + (c.reused_from ?? 'accepted compile') + ')' : ''}${c.reason ? ' — ' + c.reason : ''}${c.errors ? ' — ' + JSON.stringify(c.errors).slice(0, 300) : ''}`);
      if (c.status !== 'PASS') { console.log(`STOP ${section}: compile not PASS`); outcomes[section] = 'HOLD 16.compile'; continue sectionLoop; }
      // Point 16/<section>/CURRENT.json at the ledger's latest accepted compile (founder 2026-10-28: "keep new version only";
      // older versions stay as immutable history, this is what gets read).
      try { const { markCurrentCompiles } = await import(pathToFileURL(path.join(ROOT, 'tools/belt/mark-current-compiles.mjs')).href); const m = markCurrentCompiles(RUN).find((x) => x.section === section); if (m && m.version !== '.') console.log(`  16.compile: CURRENT → ${m.version}`); } catch (e) { console.log(`  (current-compile pointer not written: ${e.message.slice(0, 120)})`); }
      continue;
    }
    const stageId = STAGE_IDS[st] ?? st;
    const partList = stageId === '02.dossier_sections' ? parts.map(p => [p]) : [[]];
    const done = acceptedParts(stageId);
    for (const partIds of partList) {
      if (done.includes(JSON.stringify(partIds)) && !(remintStage && stageId === remintStage)) { console.log(`  ${stageId}${partIds.length ? ' part ' + partIds.join('+') : ''}: already accepted — skipped`); continue; }
      if (remintStage && stageId === remintStage && done.includes(JSON.stringify(partIds))) console.log(`  ${stageId}: --remint requested; dispatching despite an accepted version (new logical task only if execution.retry_nonces was bumped)`);
      const r = await runStage(stageId, partIds);
      if (r.status === 'CAP') { outcomes[section] = 'CAP'; break sectionLoop; }
      if (r.status === 'WAITING') { outcomes[section] = `WAITING ${stageId} ${partIds.join('+')} → ${r.key}`; console.log(`WAITING ${section}: packet ${r.key} emitted; author it, then re-run --step`); break sectionLoop; }
      if (!['accepted'].includes(r.status) && !r.reused) { console.log(`STOP ${section} at ${stageId} ${partIds.join('+')}: ${r.status}`); outcomes[section] = `STOP ${stageId} ${partIds.join('+')} ${r.status}`; continue sectionLoop; }
    }
  }
  outcomes[section] = 'DONE';
  console.log(`DONE ${section}; spent $${spentUsd().toFixed(3)}`);
}
console.log(`\nSUMMARY spent $${spentUsd().toFixed(3)} / cap $${standing.usd_cap_total}`);
for (const s of sections) console.log(`  ${s}: ${outcomes[s] ?? 'not reached'}`);
if (Object.values(outcomes).some(v => String(v).startsWith('WAITING'))) process.exit(3);
process.exit(Object.values(outcomes).every(v => v === 'DONE') && Object.keys(outcomes).length === sections.length ? 0 : 1);
