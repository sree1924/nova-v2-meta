// openai-image-gen.mjs — re-paint scenes through the OpenAI Images API (founder 2026-11-01: "regenerate in openai api").
// Mirrors tools/signs/meta-image-gen.mjs: a list of {id, prompt}, one PNG + one JSON receipt per id, dry cost line first,
// probe = ONE image unless --go, hard stop at --max-usd. Key = OPENAI_API_KEY from the shell (same as mint-tenant-audio.mjs).
// Usage: node tools/audit/openai-image-gen.mjs --list coordination/IMAGE-CHECK/repaint-list.json --out <dir>
//        [--only <id>] [--size 1536x1024] [--quality medium] [--model gpt-image-1.5] [--price 0.05] [--max-usd 1.00] [--go] [--fresh]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const LIST = path.resolve(ROOT, opt('--list', 'coordination/IMAGE-CHECK/repaint-list.json'));
const ONLY = opt('--only', null), DRY = has('--dry'), GO = has('--go'), FRESH = has('--fresh');
const MAX_USD = Number(opt('--max-usd', '0.10'));
const MODEL = opt('--model', 'gpt-image-1.5');
const SIZE = opt('--size', '1536x1024');
const QUALITY = opt('--quality', 'medium');
const OUT = path.resolve(ROOT, opt('--out', 'scratch/video-samples/nd-all-lessons/visuals/_openai_repaint'));
const PRICE_PER_IMAGE = Number(opt('--price', '0.05')); // (verify) — per-image at 1536x1024 medium; receipts carry real token usage
const API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
const KEY = process.env.OPENAI_API_KEY;
if (!KEY) { console.error('FATAL: OPENAI_API_KEY missing in the shell env'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });

const items = JSON.parse(fs.readFileSync(LIST, 'utf8')).filter((s) => !ONLY || s.id === ONLY);
const todo = items.filter((s) => FRESH || !fs.existsSync(path.join(OUT, s.id + '.png')));
console.log(`${todo.length} to make (${items.length - todo.length} already on disk) · ${MODEL} ${SIZE} ${QUALITY} · ~$${(todo.length * PRICE_PER_IMAGE).toFixed(2)} assumed (cap $${MAX_USD})`);
if (DRY) process.exit(0);

let spent = 0, made = 0;
for (const s of todo) {
  if (spent + PRICE_PER_IMAGE > MAX_USD) { console.log(`stop: next image would pass --max-usd ${MAX_USD}`); break; }
  const t0 = Date.now();
  const request = { model: MODEL, prompt: s.prompt, n: 1, size: SIZE, quality: QUALITY, output_format: 'png' };
  let res, body, err = null;
  try {
    res = await fetch(`${API_BASE}/images/generations`, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${KEY}` }, body: JSON.stringify(request) });
    body = await res.json().catch(() => null);
  } catch (e) { err = String(e); }
  const b64 = body?.data?.[0]?.b64_json;
  const pngPath = path.join(OUT, s.id + '.png');
  if (b64) fs.writeFileSync(pngPath, Buffer.from(b64, 'base64'));
  const receipt = { schema_version: 'nova-openai-image-gen.v1', id: s.id, model: MODEL, size: SIZE, quality: QUALITY, http_status: res?.status ?? null, elapsed_ms: Date.now() - t0, prompt: s.prompt, usage: body?.usage ?? null, usd_assumed: b64 ? PRICE_PER_IMAGE : 0, error: err || (b64 ? null : JSON.stringify(body?.error ?? body ?? '').slice(0, 500)), at: new Date().toISOString() };
  fs.writeFileSync(path.join(OUT, s.id + '.json'), JSON.stringify(receipt, null, 2) + '\n');
  if (b64) { spent += PRICE_PER_IMAGE; made++; console.log(`  ok ${Math.round(fs.statSync(pngPath).size / 1024)} KB in ${Math.round(receipt.elapsed_ms / 1000)}s -> ${path.relative(ROOT, pngPath)}`); }
  else console.log(`  FAIL ${s.id}: ${receipt.error}`);
  if (!GO) { console.log('probe done (one image); pass --go for the full list'); break; }
}
console.log(`made ${made}, assumed spend $${spent.toFixed(2)}`);
