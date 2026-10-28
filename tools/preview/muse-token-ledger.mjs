#!/usr/bin/env node
// muse-token-ledger.mjs — operator-token accounting for Muse Code launches (founder, 2026-10-28: "muse has to record token
// use even in subscription stuff"). Parses the --json launch transcripts (coordination/muse-launch-<tag>.jsonl, gitignored
// because tool outputs echo private handbook text) and writes ONLY the numbers to coordination/MUSE-TOKEN-LEDGER.json +
// MUSE-TOKEN-LEDGER.md (committed). Tokens are subscription allowance, not dollars: no $ is invented here.
//   node tools/preview/muse-token-ledger.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const COORD = path.join(LANE, 'coordination');
const OUT_JSON = path.join(COORD, 'MUSE-TOKEN-LEDGER.json');
const OUT_MD = path.join(COORD, 'MUSE-TOKEN-LEDGER.md');
const KEYS = ['input_tokens', 'cached_tokens', 'output_tokens', 'reasoning_tokens', 'total_tokens'];

function walk(v, acc, depth = 0) {
  if (!v || typeof v !== 'object' || depth > 8) return;
  if (Array.isArray(v)) { for (const x of v) walk(x, acc, depth + 1); return; }
  // A usage block is an object carrying at least input_tokens or output_tokens.
  if (Number.isFinite(v.input_tokens) || Number.isFinite(v.output_tokens)) {
    acc.push(Object.fromEntries(KEYS.filter((k) => Number.isFinite(v[k])).map((k) => [k, v[k]])));
  }
  for (const x of Object.values(v)) walk(x, acc, depth + 1);
}

const previous = fs.existsSync(OUT_JSON) ? JSON.parse(fs.readFileSync(OUT_JSON, 'utf8')) : { launches: [] };
const byTag = Object.fromEntries((previous.launches || []).map((l) => [l.tag, l]));
const launches = [];
for (const f of fs.readdirSync(COORD).filter((n) => /^muse-launch-.*\.jsonl$/.test(n)).sort()) {
  const tag = f.replace(/^muse-launch-/, '').replace(/\.jsonl$/, '');
  const lines = fs.readFileSync(path.join(COORD, f), 'utf8').split('\n').filter((l) => l.startsWith('{'));
  const usages = []; let model = null, toolResults = 0, failed = 0, sessionId = null;
  for (const l of lines) {
    let e; try { e = JSON.parse(l); } catch { continue; }
    sessionId ??= e.stream?.id ?? null;
    if (e.payload_type === 'tool.result') toolResults++;
    if (e.payload_type === 'task.lifecycle.failed') failed++;
    if (!model) { const m = l.match(/"model":"(muse-[a-z0-9.-]+)"/); if (m) model = m[1]; }
    walk(e.payload, usages);
  }
  // recorded_at is a stream sequence clock, not epoch time; the transcript file's own timestamps are the wall clock.
  const st = fs.statSync(path.join(COORD, f));
  const first = st.birthtimeMs || st.ctimeMs, last = st.mtimeMs;
  // Transcripts report cumulative usage per model response; the largest block per key is the launch total when cumulative,
  // and the sum when per-call. Muse emits one final cumulative block per run; take max as the conservative launch total and
  // keep the sum too so the reader can see both.
  const sum = {}, max = {};
  for (const u of usages) for (const [k, v] of Object.entries(u)) { sum[k] = (sum[k] || 0) + v; max[k] = Math.max(max[k] || 0, v); }
  const started = new Date(first).toISOString(), ended = new Date(last).toISOString();
  launches.push({ tag, transcript: `coordination/${f}`, session_id: sessionId, model, started_at: started, ended_at: ended, events: lines.length, tool_results: toolResults, tasks_failed: failed,
    usage_blocks: usages.length, tokens_max_block: max, tokens_sum_blocks: sum, billing: 'Muse Code subscription (Power Usage tier from 2026-10-28 ~00:30Z; High Usage before)', note: byTag[tag]?.note ?? null });
}
// Launches that pre-date --json (no transcript): carried from the previous ledger so history is not lost.
for (const l of previous.launches || []) if (!launches.find((x) => x.tag === l.tag)) launches.push(l);
launches.sort((a, b) => String(a.started_at).localeCompare(String(b.started_at)));
const totals = {};
for (const l of launches) for (const [k, v] of Object.entries(l.tokens_max_block || {})) totals[k] = (totals[k] || 0) + v;
const ledger = { schema_version: 'muse-token-ledger.v1', generated_at: new Date().toISOString(), source: 'muse exec --json transcripts (numbers only; transcripts stay private)', policy: 'operator cost = subscription allowance; recorded per launch; no dollar value is imputed', totals_max_block: totals, launches };
fs.writeFileSync(OUT_JSON, JSON.stringify(ledger, null, 2) + '\n');
const fmt = (n) => (n == null ? '—' : n.toLocaleString('en-US'));
const md = ['# Muse token ledger (operator cost, subscription)', '', `Generated ${ledger.generated_at}. Source: \`muse exec --json\` transcripts; only numbers are kept here.`, '',
  '| launch | started (UTC) | model | events | tool results | input | cached | output | reasoning |', '|---|---|---|---|---|---|---|---|---|',
  ...launches.map((l) => `| ${l.tag} | ${l.started_at ?? '—'} | ${l.model ?? '—'} | ${l.events ?? '—'} | ${l.tool_results ?? '—'} | ${fmt(l.tokens_max_block?.input_tokens)} | ${fmt(l.tokens_max_block?.cached_tokens)} | ${fmt(l.tokens_max_block?.output_tokens)} | ${fmt(l.tokens_max_block?.reasoning_tokens)} |`),
  '', `**Totals (max block per launch):** input ${fmt(totals.input_tokens)} · cached ${fmt(totals.cached_tokens)} · output ${fmt(totals.output_tokens)} · reasoning ${fmt(totals.reasoning_tokens)}`, '',
  'Launches before 2026-10-27 23:43Z ran without `--json` and have no transcript; their operator cost is visible only as the credit-meter delta before the subscription (see COST-ACCOUNTING.md) and as `muse usage` window percentages.', ''];
fs.writeFileSync(OUT_MD, md.join('\n'));
console.log(`token ledger: ${launches.length} launches → ${path.relative(LANE, OUT_JSON)}; totals`, JSON.stringify(totals));
