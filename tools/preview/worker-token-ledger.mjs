#!/usr/bin/env node
// worker-token-ledger.mjs — one ledger for every worker's tokens (founder 2026-10-28: "keep a tracker on worker token used").
//   Muse launches: from coordination/MUSE-TOKEN-LEDGER.json (built by muse-token-ledger.mjs from --json transcripts).
//   Claude workers: appended at completion from the Agent tool's usage report (subagent_tokens / tool_uses / duration_ms).
//   Model API (Utah): from the belt ledger's reported usage (tools/preview/ledger-tail.mjs path), copied in as a row.
// Writes coordination/WORKER-TOKEN-LEDGER.json + .md. Tokens are what each platform reports; no dollars are imputed except
// the Model API row, whose dollars come from the belt ledger itself.
//   node tools/preview/worker-token-ledger.mjs                       # rebuild from sources
//   node tools/preview/worker-token-ledger.mjs --record '{"worker":"claude","model":"claude-opus-5-5","state":"WA","task":"state worker: intake + 4 sections","tokens":123456,"tool_uses":40,"duration_ms":600000}'
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COORD = path.join(LANE, 'coordination');
const CLAUDE_LOG = path.join(COORD, 'claude-agent-usage.jsonl');
const OUT_JSON = path.join(COORD, 'WORKER-TOKEN-LEDGER.json');
const OUT_MD = path.join(COORD, 'WORKER-TOKEN-LEDGER.md');
const args = process.argv.slice(2);
const recIdx = args.indexOf('--record');
if (recIdx >= 0) {
  const rec = JSON.parse(args[recIdx + 1]);
  rec.recorded_at = new Date().toISOString();
  fs.appendFileSync(CLAUDE_LOG, JSON.stringify(rec) + '\n');
  console.log('recorded', rec.worker, rec.state ?? '-', rec.tokens, 'tokens');
}
// refresh the Muse ledger first (numbers only)
try { execFileSync(process.execPath, [path.join(LANE, 'tools/preview/muse-token-ledger.mjs')], { stdio: 'ignore' }); } catch {}
const muse = fs.existsSync(path.join(COORD, 'MUSE-TOKEN-LEDGER.json')) ? JSON.parse(fs.readFileSync(path.join(COORD, 'MUSE-TOKEN-LEDGER.json'), 'utf8')) : { launches: [] };
const rows = [];
for (const l of muse.launches) {
  const st = (l.tag.match(/intake-([A-Z]{2})/) || [])[1] || (/(sec01|authoring)/.test(l.tag) ? 'UT' : null);
  const t = l.tokens_max_block || {};
  rows.push({ worker: 'muse', model: l.model || 'muse-spark-1.3', platform: 'Muse Code subscription', state: st, task: l.tag, started_at: l.started_at, ended_at: l.ended_at,
    input_tokens: t.input_tokens ?? null, cached_tokens: t.cached_tokens ?? null, output_tokens: t.output_tokens ?? null, reasoning_tokens: t.reasoning_tokens ?? null, tool_uses: l.tool_results ?? null, usd: 0, source: l.transcript });
}
if (fs.existsSync(CLAUDE_LOG)) for (const line of fs.readFileSync(CLAUDE_LOG, 'utf8').split('\n').filter(Boolean)) {
  const r = JSON.parse(line);
  rows.push({ worker: r.worker || 'claude', model: r.model || 'claude-opus-5-5', platform: r.platform || 'Anthropic subscription (Claude Code subagent)', state: r.state ?? null, task: r.task, started_at: r.started_at ?? null, ended_at: r.recorded_at,
    total_tokens: r.tokens ?? null, tool_uses: r.tool_uses ?? null, duration_ms: r.duration_ms ?? null, usd: 0, source: 'Agent tool usage report' });
}
// Model API row for Utah from the belt ledger (exact dollars)
try {
  const { DatabaseSync } = await import('node:sqlite');
  const db = new DatabaseSync(path.join(LANE, 'runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite'), { readOnly: true });
  const r = db.prepare("select count(*) n, sum(coalesce(actual_microusd,0)) usd from reservations where state='reported'").get();
  let toks = null; try { const u = db.prepare("select sum(json_extract(usage_json,'$.prompt_tokens')) i, sum(json_extract(usage_json,'$.completion_tokens')) o from model_calls").get(); toks = u; } catch {}
  rows.push({ worker: 'meta-model-api', model: 'muse-spark-1.3', platform: 'Meta Model API (free credit)', state: 'UT', task: 'belt authoring, 16 sections', input_tokens: toks?.i ?? null, output_tokens: toks?.o ?? null, calls: r.n, usd: +(r.usd / 1e6).toFixed(3), source: 'runs/2026-10-26-rdmv-ut-class-d/ledger/run.sqlite' });
  db.close();
} catch {}
const byWorker = {};
for (const r of rows) { const w = byWorker[r.worker] ??= { rows: 0, input_tokens: 0, output_tokens: 0, total_tokens: 0, usd: 0, states: new Set() }; w.rows++; w.input_tokens += r.input_tokens || 0; w.output_tokens += r.output_tokens || 0; w.total_tokens += (r.total_tokens || 0) + (r.input_tokens || 0) + (r.output_tokens || 0); w.usd += r.usd || 0; if (r.state) w.states.add(r.state); }
const summary = Object.fromEntries(Object.entries(byWorker).map(([k, v]) => [k, { ...v, states: [...v.states].sort() }]));
fs.writeFileSync(OUT_JSON, JSON.stringify({ schema_version: 'worker-token-ledger.v1', generated_at: new Date().toISOString(), policy: 'tokens as reported by each platform; $0 for subscriptions; Model API dollars from the belt ledger', summary, rows }, null, 2) + '\n');
const f = (n) => (n == null ? '—' : Number(n).toLocaleString('en-US'));
const md = [`# Worker token ledger — generated ${new Date().toISOString()}`, '', '| worker | platform | rows | input | output | total (claude agents) | $ | states |', '|---|---|---|---|---|---|---|---|',
  ...Object.entries(summary).map(([k, v]) => `| ${k} | ${rows.find((r) => r.worker === k)?.platform ?? ''} | ${v.rows} | ${f(v.input_tokens)} | ${f(v.output_tokens)} | ${f(v.total_tokens)} | $${v.usd.toFixed(2)} | ${v.states.join(' ')} |`), '',
  '| worker | model | state | task | input | cached | output | reasoning | total | tool uses | duration | $ |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.worker} | ${r.model} | ${r.state ?? '—'} | ${r.task} | ${f(r.input_tokens)} | ${f(r.cached_tokens)} | ${f(r.output_tokens)} | ${f(r.reasoning_tokens)} | ${f(r.total_tokens)} | ${f(r.tool_uses)} | ${r.duration_ms ? Math.round(r.duration_ms / 60000) + ' min' : '—'} | $${(r.usd ?? 0).toFixed(2)} |`), ''];
fs.writeFileSync(OUT_MD, md.join('\n'));
console.log(`worker ledger: ${rows.length} rows →`, Object.entries(summary).map(([k, v]) => `${k}: ${f(v.total_tokens)} tok, $${v.usd.toFixed(2)}, states ${v.states.join('/') || '-'}`).join(' | '));
