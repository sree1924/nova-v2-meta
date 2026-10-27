// Meta Model API smoke test — proves key + endpoint + structured output, and writes a
// provenance record (model, request hash, usage, latency, est. cost). Never prints the key.
import 'dotenv/config';
import OpenAI from 'openai';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const apiKey = process.env.MODEL_API_KEY;
if (!apiKey) throw new Error('MODEL_API_KEY is not set (copy .env.example → .env)');

const baseURL = process.env.META_BASE_URL ?? 'https://api.meta.ai/v1';
const model = process.env.META_MODEL ?? 'muse-spark-1.3';
// dev.meta.ai/docs/pricing-rate-limits, read 2026-10-26 (USD per 1M tokens)
const PRICE = {
  'muse-spark-1.3': { in: 1.25, out: 4.25, cached: 0.15 },
  'muse-spark-1.2': { in: 1.25, out: 4.25, cached: 0.15 },
  'muse-spark-1.3-contributor': { in: 0.10, out: 0.20, cached: 0.002 },
  'muse-wonder-1.0': { in: 4.00, out: 20.00, cached: 0.20 },
};

const client = new OpenAI({ baseURL, apiKey });

const request = {
  model,
  messages: [
    { role: 'system', content: 'You are a flashcard engineer. Answer only with JSON matching the schema.' },
    { role: 'user', content: 'Write one flashcard that teaches why the US Constitution begins with "We the People". Include a one-sentence misconception learners commonly hold.' },
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'Flashcard',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          front: { type: 'string' },
          back: { type: 'string' },
          why: { type: 'string' },
          misconception: { type: 'string' },
        },
        required: ['front', 'back', 'why', 'misconception'],
        additionalProperties: false,
      },
    },
  },
};

const requestHash = createHash('sha256').update(JSON.stringify(request)).digest('hex');
const t0 = performance.now();
let response, error;
try {
  response = await client.chat.completions.create(request);
} catch (e) {
  error = { status: e.status, message: e.message };
}
const elapsedMs = Math.round(performance.now() - t0);

const usage = response?.usage ?? null;
const p = PRICE[model];
const estUsd = usage && p
  ? +(((usage.prompt_tokens ?? 0) * p.in + (usage.completion_tokens ?? 0) * p.out) / 1e6).toFixed(6)
  : null;

const record = {
  kind: 'meta-smoke',
  at: new Date().toISOString(),
  provider: 'Meta Model API',
  endpoint: `${baseURL}/chat/completions`,
  model_requested: model,
  model_returned: response?.model ?? null,
  request_sha256: requestHash,
  usage,
  est_usd: estUsd,
  elapsed_ms: elapsedMs,
  error,
  parsed: response ? safeParse(response.choices?.[0]?.message?.content) : null,
};

const outDir = join(here, '..', 'evidence');
mkdirSync(outDir, { recursive: true });
const stamp = record.at.replace(/[:.]/g, '-');
writeFileSync(join(outDir, `smoke-${stamp}.json`), JSON.stringify(record, null, 2));
if (response) writeFileSync(join(outDir, `raw-smoke-${stamp}.json`), JSON.stringify(response, null, 2));

console.log(JSON.stringify(record, null, 2));
if (error) process.exit(1);

function safeParse(s) { try { return JSON.parse(s); } catch { return { unparsed: s }; } }
