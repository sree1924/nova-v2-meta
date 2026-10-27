// export-trace.mjs — dev-preview trace exporter (Muse Code, preview lane).
//
// Reads runs/<run-id>/ledger/run.sqlite READ-ONLY (node:sqlite {readOnly:true})
// plus per-attempt files under runs/<run-id>/artifacts/<task>/<attempt>/
// ({call-receipt, validation, acceptance, reservation, request-envelope}.json),
// human-intervention records (approvals/, receipts/lineage-reset-*.json,
// jams.md), and writes app-preview/data/trace.json for the reviewer route.
//
// Makes NO network requests and NO model calls. Never prints secrets: raw
// prompt/response bodies are never embedded — only their sha256 + byte
// counts. Every unknown value is null with an entry in unknown_reasons.
//
// Usage: node tools/preview/export-trace.mjs [--run <run-id>] [--out <path>]
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const RUN_ID = opt('--run', '2026-10-26-rdmv-ut-class-d');
const OUT = path.resolve(ROOT, opt('--out', 'app-preview/data/trace.json'));
const RUN_DIR = path.join(ROOT, 'runs', RUN_ID);

const SECRET_KEY_RE = /(api[_-]?key|secret|bearer|passwd|password|authorization)/i;
function redact(value) {
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = SECRET_KEY_RE.test(k) ? '[redacted]' : redact(v);
    }
    return out;
  }
  return value;
}

function readJsonIfExists(p) {
  try {
    return { data: redact(JSON.parse(fs.readFileSync(p, 'utf8'))), present: true };
  } catch {
    return { data: null, present: false };
  }
}

function parseJams() {
  const p = path.join(RUN_DIR, 'jams.md');
  let raw = '';
  try {
    raw = fs.readFileSync(p, 'utf8');
  } catch {
    return { entries: [], note: 'jams.md absent' };
  }
  const entries = [];
  const parts = raw.split(/^## /m);
  for (const part of parts) {
    const text = part.trim();
    if (!text) continue;
    const nl = text.indexOf('\n');
    const title = nl >= 0 ? text.slice(0, nl).trim() : text;
    let body = nl >= 0 ? text.slice(nl + 1).trim() : '';
    let truncated = false;
    if (body.length > 4000) {
      body = body.slice(0, 4000);
      truncated = true;
    }
    entries.push({ jam_id: title.split(' — ')[0], title, body, body_truncated: truncated });
  }
  return { entries, note: entries.length + ' entries from jams.md' };
}

const db = new DatabaseSync(path.join(RUN_DIR, 'ledger', 'run.sqlite'), { readOnly: true });
const all = (sql, params = []) => db.prepare(sql).all(...params);

const runRow = all('SELECT * FROM runs WHERE run_id = ?', [RUN_ID])[0] || null;
// NOTE: no SQL ORDER BY — sandboxed SQLite cannot spill large sorts to temp
// files ("unable to open database file"); these sets are small, sort in JS.
const byCreated = (a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''));
const tasks = all('SELECT * FROM tasks WHERE run_id = ?', [RUN_ID]).sort(byCreated);
const attempts = all('SELECT * FROM attempts WHERE run_id = ?', [RUN_ID]).sort(byCreated);
const calls = all('SELECT * FROM model_calls WHERE run_id = ?', [RUN_ID]).sort(byCreated);
const reservations = all('SELECT * FROM reservations WHERE run_id = ?', [RUN_ID]).sort(byCreated);
const artifacts = all('SELECT * FROM artifacts WHERE run_id = ?', [RUN_ID]).sort(byCreated);
const taskById = new Map(tasks.map((t) => [t.task_id, t]));
const callByAttempt = new Map(calls.map((c) => [c.attempt_id, c]));
const resByAttempt = new Map(reservations.map((r) => [r.attempt_id, r]));
const artsByAttempt = new Map();
for (const a of artifacts) {
  if (!artsByAttempt.has(a.attempt_id)) artsByAttempt.set(a.attempt_id, []);
  artsByAttempt.get(a.attempt_id).push(a);
}

function attemptDir(taskId, attemptId) {
  return path.join(RUN_DIR, 'artifacts', taskId, attemptId);
}

const attemptRecords = attempts.map((a) => {
  const task = taskById.get(a.task_id) || null;
  const call = callByAttempt.get(a.attempt_id) || null;
  const res = resByAttempt.get(a.attempt_id) || null;
  const arts = artsByAttempt.get(a.attempt_id) || [];
  const dir = attemptDir(a.task_id, a.attempt_id);
  const receipt = readJsonIfExists(path.join(dir, 'call-receipt.json'));
  const validation = readJsonIfExists(path.join(dir, 'validation.json'));
  const acceptance = readJsonIfExists(path.join(dir, 'acceptance.json'));
  const reservationFile = readJsonIfExists(path.join(dir, 'reservation.json'));
  const envelope = readJsonIfExists(path.join(dir, 'request-envelope.json'));
  const unknownReasons = [];
  const unknown = (field, reason) => {
    unknownReasons.push({ field, reason });
    return null;
  };

  const usage = receipt.data?.usage || (call?.usage_json ? JSON.parse(call.usage_json) : null);
  const meta = call?.metadata_json ? JSON.parse(call.metadata_json) : null;
  const pricing = res?.pricing_ref_json ? JSON.parse(res.pricing_ref_json) : null;

  const promptTokens = usage?.prompt_tokens ?? unknown('prompt_tokens',
    receipt.present ? 'usage absent in call-receipt.json and ledger usage_json' : 'no call-receipt.json and no ledger usage for this attempt');
  const completionTokens = usage?.completion_tokens ?? unknown('completion_tokens',
    receipt.present ? 'usage absent in call-receipt.json and ledger usage_json' : 'no call-receipt.json and no ledger usage for this attempt');
  const reasoningTokens = usage?.completion_tokens_details?.reasoning_tokens
    ?? usage?.reasoning_tokens
    ?? unknown('reasoning_tokens', usage ? 'provider usage reports no reasoning-token split' : 'no usage record for this attempt');
  const cachedTokens = usage?.prompt_tokens_details?.cached_tokens
    ?? unknown('cached_tokens', usage ? 'provider usage reports no cache split' : 'no usage record for this attempt');

  const estimatedUsd = receipt.data?.estimated_usd
    ?? unknown('estimated_usd', 'no call-receipt.json with estimated_usd for this attempt');
  const modelRequested = receipt.data?.model_requested ?? meta?.model_requested
    ?? unknown('model_requested', 'no call receipt and no ledger model metadata');
  const modelReturned = receipt.data?.model_returned ?? meta?.returned_model
    ?? unknown('model_returned', 'provider returned no model name on record');
  const elapsedMs = receipt.data?.elapsed_ms ?? meta?.latency_ms
    ?? unknown('elapsed_ms', 'no call receipt with timing for this attempt');
  const finishReason = receipt.data?.finish_reason ?? meta?.finish_reason
    ?? unknown('finish_reason', 'provider reported no finish reason on record');

  const checks = validation.present && Array.isArray(validation.data?.checks)
    ? validation.data.checks.map((c) => ({
        check_id: c.check_id ?? null,
        status: c.status ?? null,
        evidence: c.evidence ?? null,
        metrics: c.metrics ?? null
      }))
    : unknown('checks', 'no validation.json for this attempt');
  const validationOverall = validation.present
    ? (validation.data?.status ?? unknown('validation_overall', 'validation.json has no status field'))
    : unknown('validation_overall', 'no validation.json for this attempt');

  const stageOutputs = arts
    .filter((r) => r.kind === 'stage_output')
    .map((r) => ({ artifact_id: r.artifact_id, kind: r.kind, status: r.status, path: r.path, sha256: r.sha256, bytes: r.bytes }));
  const rawResponses = arts
    .filter((r) => r.kind === 'raw_provider_response')
    .map((r) => ({ artifact_id: r.artifact_id, kind: r.kind, status: r.status, path: r.path, sha256: r.sha256, bytes: r.bytes }));
  const otherArtifacts = arts
    .filter((r) => r.kind !== 'stage_output' && r.kind !== 'raw_provider_response')
    .map((r) => ({ artifact_id: r.artifact_id, kind: r.kind, status: r.status, path: r.path, sha256: r.sha256, bytes: r.bytes }));

  let errorRef = null;
  if (a.error_ref_json) {
    try {
      const e = JSON.parse(a.error_ref_json);
      errorRef = { path: e.path ?? null, sha256: e.sha256 ?? null, bytes: e.bytes ?? null, reused: e.reused ?? null };
    } catch {
      errorRef = { path: null, sha256: null, note: 'error_ref_json unparseable' };
    }
  }

  return {
    attempt_id: a.attempt_id,
    attempt_no: a.attempt_no,
    task_id: a.task_id,
    stage_id: task?.stage_id ?? unknown('stage_id', 'ledger task row missing for attempt'),
    role_id: task?.role_id ?? call?.role_id ?? res?.role_id ?? unknown('role_id', 'no task, call or reservation row names a role'),
    lineage_id: task?.lineage_id ?? unknown('lineage_id', 'ledger task row missing for attempt'),
    attempt_status: a.status,
    task_status: task?.status ?? unknown('task_status', 'ledger task row missing for attempt'),
    executor_id: a.executor_id,
    generation: a.generation,
    created_at: a.created_at,
    updated_at: a.updated_at,
    model_requested: modelRequested,
    model_returned: modelReturned,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    reasoning_tokens: reasoningTokens,
    cached_tokens: cachedTokens,
    estimated_usd: estimatedUsd,
    estimated_usd_microusd: typeof estimatedUsd === 'number' ? Math.round(estimatedUsd * 1e6) : unknown('estimated_usd_microusd', 'no estimated_usd to convert'),
    reserved_microusd: res?.reserved_microusd ?? unknown('reserved_microusd', 'no ledger reservation for this attempt'),
    actual_microusd: res?.actual_microusd ?? unknown('actual_microusd', res ? 'reservation in state ' + res.state + ' reports no actual yet' : 'no ledger reservation for this attempt'),
    reservation_state: res?.state ?? unknown('reservation_state', 'no ledger reservation for this attempt'),
    elapsed_ms: elapsedMs,
    finish_reason: finishReason,
    http_status: receipt.data?.http_status ?? meta?.http_status ?? unknown('http_status', 'no HTTP status on record'),
    model_call_status: call?.status ?? unknown('model_call_status', 'no ledger model_calls row for this attempt'),
    checks,
    validation_overall: validationOverall,
    stage_outputs: stageOutputs,
    raw_responses: rawResponses,
    other_artifacts: otherArtifacts,
    request_envelope_ref: envelope.present
      ? { path: path.relative(RUN_DIR, path.join(dir, 'request-envelope.json')), ...(meta?.envelope_ref || meta?.request_sha256 ? { sha256: meta.envelope_ref?.sha256 ?? null, bytes: meta.envelope_ref?.bytes ?? null, request_sha256: meta.request_sha256 ?? null } : { note: 'hash recorded in ledger metadata only where present' }) }
      : { path: null, note: 'no request-envelope.json on disk for this attempt' },
    acceptance: acceptance.present ? acceptance.data : unknown('acceptance', 'no acceptance file present for this attempt'),
    error_ref: errorRef,
    unknown_reasons: unknownReasons
  };
});

// Human interventions: approvals, lineage resets, jams.
const interventions = { approvals: [], lineage_resets: [], jams: parseJams() };
try {
  const apprDir = path.join(RUN_DIR, 'approvals');
  for (const f of fs.readdirSync(apprDir)) {
    if (!f.endsWith('.json')) continue;
    const { data, present } = readJsonIfExists(path.join(apprDir, f));
    if (present) {
      interventions.approvals.push({
        file: 'approvals/' + f,
        stage_id: data.stage_id ?? null,
        founder_words: data.founder_words ?? null,
        founder: data.founder ?? null,
        recorded_at: data.recorded_at ?? null,
        expires_at: data.expires_at ?? null,
        usd_ceiling: data.usd_ceiling ?? null
      });
    }
  }
} catch { /* approvals dir absent */ }
try {
  const recDir = path.join(RUN_DIR, 'receipts');
  for (const f of fs.readdirSync(recDir)) {
    if (!f.startsWith('lineage-reset-') || !f.endsWith('.json')) continue;
    const { data, present } = readJsonIfExists(path.join(recDir, f));
    if (present) interventions.lineage_resets.push({ file: 'receipts/' + f, ...data });
  }
  interventions.lineage_resets.sort((a, b) => String(a.recorded_at || '').localeCompare(String(b.recorded_at || '')));
} catch { /* receipts dir absent */ }

const sum = (rows, key) => rows.reduce((n, r) => n + (typeof r[key] === 'number' ? r[key] : 0), 0);
const lineageIds = [...new Set(attemptRecords.map((r) => r.lineage_id).filter(Boolean))];
const totals = {
  attempts: attemptRecords.length,
  model_calls_completed: attemptRecords.filter((r) => r.model_call_status === 'completed').length,
  prompt_tokens: sum(attemptRecords, 'prompt_tokens'),
  completion_tokens: sum(attemptRecords, 'completion_tokens'),
  reasoning_tokens_observed: attemptRecords.filter((r) => typeof r.reasoning_tokens === 'number').reduce((n, r) => n + r.reasoning_tokens, 0),
  estimated_usd: Math.round(sum(attemptRecords, 'estimated_usd') * 1e6) / 1e6,
  actual_microusd_exact: attemptRecords.filter((r) => typeof r.actual_microusd === 'number').reduce((n, r) => n + r.actual_microusd, 0),
  reserved_microusd_total: sum(attemptRecords, 'reserved_microusd')
};
totals.actual_usd_exact = totals.actual_microusd_exact / 1e6;

const trace = {
  trace_format: 'preview-trace.v1',
  run_id: RUN_ID,
  run_status: runRow?.status ?? null,
  run_mode: runRow?.mode ?? null,
  budget: runRow?.budget_json ? JSON.parse(runRow.budget_json) : null,
  exported_at: new Date().toISOString(),
  exporter: 'tools/preview/export-trace.mjs (read-only ledger export, no model calls)',
  ledger_path: 'runs/' + RUN_ID + '/ledger/run.sqlite',
  totals,
  lineages: lineageIds.map((id) => ({
    lineage_id: id,
    attempts: attemptRecords.filter((r) => r.lineage_id === id).map((r) => r.attempt_id)
  })),
  attempts: attemptRecords,
  tasks_without_attempts: tasks.filter((t) => !attempts.some((a) => a.task_id === t.task_id)).map((t) => ({
    task_id: t.task_id, stage_id: t.stage_id, role_id: t.role_id, lineage_id: t.lineage_id, status: t.status
  })),
  interventions,
  honesty: {
    unknown_policy: 'every unknown is null with a reason in unknown_reasons',
    secrets_policy: 'raw prompts/responses never embedded; only sha256 + bytes. Secret-like keys redacted.',
    cost_basis: 'estimated_usd from provider call receipts; actual_microusd_exact from ledger reservations (micro-USD integers)'
  }
};

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(trace, null, 2) + '\n');
console.log('wrote ' + path.relative(ROOT, OUT));
console.log('attempts=' + trace.attempts.length
  + ' prompt_tokens=' + totals.prompt_tokens
  + ' completion_tokens=' + totals.completion_tokens
  + ' estimated_usd=' + totals.estimated_usd.toFixed(6)
  + ' actual_microusd_exact=' + totals.actual_microusd_exact);
db.close();
