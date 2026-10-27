import {sha256, canonicalJson} from './atomic-file.mjs';
const escape = value => String(value ?? 'unknown').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function renderTrace(snapshot, {runId, mode = 'dry_run'} = {}) {
  const tasks = snapshot.tasks || [];
  const rows = tasks.map(task => {
    const id = task.taskId ?? task.task_id;
    const calls = (snapshot.model_calls || []).filter(call => (snapshot.attempts || []).some(a => (a.taskId ?? a.task_id) === id && (a.attemptId ?? a.attempt_id) === call.attempt_id));
    const identity = task.identity_json || {};
    const artifacts = (snapshot.artifacts || []).filter(a => a.task_id === id);
    const attempts = (snapshot.attempts || []).filter(a=>a.task_id===id);
    const reservations = (snapshot.reservations || []).filter(r=>r.task_id===id);
    const cost = !calls.length ? '0 — no model calls' : reservations.some(r=>r.actual_microusd==null) ? 'unknown; reserve retained' : reservations.reduce((sum,r)=>sum+r.actual_microusd,0)/1e6+' estimated/reported USD';
    const humanEdits = (snapshot.events || []).filter(e=>e.task_id===id && e.type==='intervention.recorded');
    return `<tr><td>${escape(task.stageId ?? task.stage_id)}</td><td>${escape(task.roleId ?? task.role_id)}</td><td>${escape(task.status)}</td><td>${calls.length ? escape(calls.map(c => c.metadata_json?.returned_model ?? 'unknown').join(', ')) : 'no model call'}</td><td>${calls.length ? escape(calls.map(c => c.usage_json?.total_tokens ?? 'unknown').join(', ')) : 'not applicable'}</td><td>${escape(cost)}</td><td>${calls.length ? escape(calls.map(c=>c.metadata_json?.latency_ms??'unknown').join(', ')) : 'not applicable'}</td><td>${attempts.length}</td><td>${humanEdits.length ? humanEdits.length+' recorded events' : 'not recorded'}</td><td>${escape(artifacts.map(a => a.sha256).join(', ') || 'none')}</td></tr>`;
  }).join('\n');
  const modelCalls = (snapshot.model_calls || []).length;
  const eventRows = (snapshot.events || []).map(e => `<tr><td>${escape(e.sequence)}</td><td>${escape(e.type)}</td><td>${escape(e.occurred_at)}</td></tr>`).join('\n');
  const snapshotHash = sha256(canonicalJson(snapshot));
  return `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'"><title>Nova reviewer trace</title><style>body{font:15px system-ui;background:#111827;color:#e5e7eb;margin:32px}h1{font-size:26px}p{max-width:900px}table{border-collapse:collapse;width:100%;margin:24px 0}td,th{border-bottom:1px solid #374151;text-align:left;padding:10px;overflow-wrap:anywhere}small{color:#94a3b8}code{overflow-wrap:anywhere}</style><h1>Nova reviewer trace — ${escape(runId)}</h1><p>Mode: <b>${escape(mode)}</b>. Recorded model calls: <b>${modelCalls}</b>. Queued work is a plan; saved source evidence does not establish factual or release acceptance. Animated floor remains deferred.</p><small>Committed SQLite snapshot SHA-256: <code>${snapshotHash}</code>. This static export is a reviewer surface. Earlier standalone smoke/probe receipts are outside this run ledger.</small><table><thead><tr><th>Stage</th><th>Role</th><th>Ledger state</th><th>Observed model</th><th>Tokens</th><th>USD</th><th>Elapsed ms</th><th>Attempts</th><th>Human edits</th><th>Artifact SHA-256</th></tr></thead><tbody>${rows}</tbody></table><h2>Committed events</h2><table><tr><th>Sequence</th><th>Event</th><th>Recorded time</th></tr>${eventRows}</table></html>`;
}
