// Strict-acceptance probe: does api.meta.ai accept each adapter schema as response_format json_schema strict:true?
// Sends ONE tiny request per adapter with a prompt that asks for a minimal placeholder document, records
// accepted / HTTP 400 (schema rejected) / other, usage, latency, est. cost. This is a DRY TEST of schema acceptance,
// not content generation; outputs are discarded except for the provenance record.
// Usage: node tools/belt/probe-strict.mjs [--stage <id>]... [--model muse-spark-1.3]
import 'dotenv/config';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from './lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, '..', '..');
const apiKey = process.env.MODEL_API_KEY;
if (!apiKey) throw new Error('MODEL_API_KEY is not set (copy .env.example → .env)');
const baseURL = process.env.META_BASE_URL ?? 'https://api.meta.ai/v1';
const args = process.argv.slice(2);
const model = (() => { const i = args.indexOf('--model'); return i >= 0 ? args[i + 1] : (process.env.META_MODEL ?? 'muse-spark-1.3'); })();
if (/-contributor/.test(model)) throw new Error('contributor-tier models are prohibited for Nova content');
const only = args.flatMap((a, i) => (a === '--stage' ? [args[i + 1]] : []));
const PRICE = { 'muse-spark-1.3': { in: 1.25, out: 4.25 }, 'muse-spark-1.2': { in: 1.25, out: 4.25 }, 'muse-wonder-1.0': { in: 4.0, out: 20.0 } }[model] ?? null;

const client = new OpenAI({ baseURL, apiKey });
const map = JSON.parse(readFileSync(join(ROOT, 'schemas-strict/stage-map.json'), 'utf8'));
const results = [];
for (const [stage_id, st] of Object.entries(map.stages)) {
  if (only.length && !only.includes(stage_id)) continue;
  const schemaPath = join(ROOT, st.adapter_schema);
  const schema = JSON.parse(readFileSync(schemaPath, 'utf8'));
  const request = {
    model,
    messages: [
      { role: 'system', content: 'You are a schema-conformance probe. Return the smallest document that satisfies the response schema. Use placeholder strings like "probe", zeros, empty arrays where allowed, and null where allowed. Invent no facts.' },
      { role: 'user', content: `Stage ${stage_id}: emit a minimal conforming document.` },
    ],
    response_format: { type: 'json_schema', json_schema: { name: stage_id.replace(/[^A-Za-z0-9_]/g, '_'), strict: true, schema } },
    max_completion_tokens: 4000,
    reasoning_effort: 'minimal',
  };
  const row = { stage_id, adapter_schema: st.adapter_schema, adapter_sha256: sha256File(schemaPath), request_sha256: sha256Canonical({ ...request, response_format: { schema_sha256: sha256File(schemaPath) } }), model_requested: model };
  const t0 = performance.now();
  try {
    const res = await client.chat.completions.create(request);
    row.outcome = 'ACCEPTED';
    row.model_returned = res.model ?? null;
    row.usage = res.usage ?? null;
    row.finish_reason = res.choices?.[0]?.finish_reason ?? null;
    const content = res.choices?.[0]?.message?.content ?? '';
    try { JSON.parse(content); row.output_parsed = true; } catch { row.output_parsed = false; }
    row.output_bytes = Buffer.byteLength(content, 'utf8');
  } catch (e) {
    row.outcome = e.status === 400 ? 'REJECTED_400' : `ERROR_${e.status ?? 'network'}`;
    row.error = { status: e.status ?? null, message: String(e.message).slice(0, 600) };
  }
  row.elapsed_ms = Math.round(performance.now() - t0);
  row.est_usd = row.usage && PRICE ? +(((row.usage.prompt_tokens ?? 0) * PRICE.in + (row.usage.completion_tokens ?? 0) * PRICE.out) / 1e6).toFixed(6) : null;
  results.push(row);
  console.log(`${row.outcome.padEnd(13)} ${stage_id.padEnd(20)} ${row.elapsed_ms}ms ${row.usage ? `${row.usage.prompt_tokens}/${row.usage.completion_tokens} tok` : ''} ${row.est_usd ?? ''} ${row.error ? row.error.message.slice(0, 160) : ''}`);
}
const record = { kind: 'strict-acceptance-probe', at: new Date().toISOString(), provider: 'Meta Model API', endpoint: `${baseURL}/chat/completions`, model_requested: model, results, summary: { accepted: results.filter(r => r.outcome === 'ACCEPTED').length, rejected_400: results.filter(r => r.outcome === 'REJECTED_400').length, other: results.filter(r => !/ACCEPTED|REJECTED_400/.test(r.outcome)).length, est_usd_total: +results.reduce((a, r) => a + (r.est_usd ?? 0), 0).toFixed(6) } };
mkdirSync(join(ROOT, 'evidence'), { recursive: true });
const out = join(ROOT, 'evidence', `strict-probe-${record.at.replace(/[:.]/g, '-')}.json`);
writeFileSync(out, JSON.stringify(record, null, 2));
console.log(JSON.stringify(record.summary), '→', out.replace(/\\/g, '/').split('/fb-ai-hackathon/')[1]);
