// meta-image-gen.mjs — generates ONE image per sign spec via Meta Model API images endpoint and records spend.
// Usage: node tools/signs/meta-image-gen.mjs --list coordination/SIGNS/sign-list.json [--only stop] [--dry] [--max-usd 0.05]
//        [--size 1024x1024] [--model muse-image-1.0] [--out learner-assets/signs-raw]
// Writes <out>/<id>.png (+ <id>.json receipt), appends coordination/MUSE-API-SPEND.jsonl. Never prints the key.
// Endpoint/pricing are (verify) from secondary sources: https://api.meta.ai/v1/images/generations, ~$0.01/image.
// The first real call is the probe; it stops after one image unless --go.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const LIST = path.resolve(ROOT, opt('--list', 'coordination/SIGNS/sign-list.json'));
const ONLY = opt('--only', null), DRY = has('--dry'), GO = has('--go'), FRESH = has('--fresh');
const MAX_USD = Number(opt('--max-usd', '0.05'));
const MODEL = opt('--model', 'muse-image-1.0');
if (/contributor/i.test(MODEL)) throw new Error('contributor models are forbidden');
const SIZE = opt('--size', '1024x1024');
const OUT = path.resolve(ROOT, opt('--out', 'store/learner-assets/signs-raw'));
const PRICE_PER_IMAGE = Number(opt('--price', '0.01')); // (verify) secondary sources
fs.mkdirSync(OUT, { recursive: true });

function loadKey() {
  if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY;
  const env = path.join(ROOT, '.env');
  if (!fs.existsSync(env)) return null;
  for (const line of fs.readFileSync(env, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*(?:export\s+)?MODEL_API_KEY\s*=\s*"?([^"\s#]+)"?/); if (m) return m[1]; }
  return null;
}
const key = loadKey();
if (!key && !DRY) { console.error('MODEL_API_KEY absent'); process.exit(1); }

const items = JSON.parse(fs.readFileSync(LIST, 'utf8')).filter((s) => !ONLY || s.id === ONLY);
let total = 0, made = 0;
for (const s of items) {
  const png = path.join(OUT, s.id + '.png');
  if (fs.existsSync(png) && !FRESH) { console.log(`skip ${s.id} (exists)`); continue; }
  if (PRICE_PER_IMAGE > MAX_USD) { console.error(`REFUSED: price $${PRICE_PER_IMAGE} > --max-usd ${MAX_USD}`); process.exit(1); }
  console.log(`${s.id}: ${s.prompt.slice(0, 90)}… -> ~$${PRICE_PER_IMAGE.toFixed(3)}`);
  if (DRY) continue;
  const request = { model: MODEL, prompt: s.prompt, n: 1, size: SIZE, response_format: 'b64_json' };
  const started = Date.now();
  const res = await fetch('https://api.meta.ai/v1/images/generations', { method: 'POST', signal: AbortSignal.timeout(180000),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(request) });
  const raw = await res.text();
  let body = null; try { body = JSON.parse(raw); } catch {}
  const d = body?.data?.[0] ?? null;
  let bytes = null;
  if (d?.b64_json) bytes = Buffer.from(d.b64_json, 'base64');
  else if (d?.url) { const r2 = await fetch(d.url); bytes = Buffer.from(await r2.arrayBuffer()); }
  const usd = res.ok && bytes ? PRICE_PER_IMAGE : 0;
  total += usd;
  const receipt = { schema_version: 'nova-sign-image-gen.v1', id: s.id, model: MODEL, model_returned: body?.model ?? null, size: SIZE, http_status: res.status,
    elapsed_ms: Date.now() - started, prompt: s.prompt, usage: body?.usage ?? null, usd_assumed: usd, price_basis: 'secondary sources $0.01/image (verify)',
    image_sha256: bytes ? crypto.createHash('sha256').update(bytes).digest('hex') : null, error_body: res.ok ? null : raw.slice(0, 1500), response_keys: body ? Object.keys(body) : null };
  fs.writeFileSync(path.join(OUT, s.id + '.json'), JSON.stringify(receipt, null, 2) + '\n');
  fs.appendFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), JSON.stringify({ at: new Date().toISOString(), purpose: 'road-sign image generation', image_id: s.id, model: MODEL, http_status: res.status, usd_priced: usd }) + '\n');
  if (!res.ok || !bytes) { console.log(`  HTTP ${res.status}: ${raw.slice(0, 500)}`); process.exit(1); }
  fs.writeFileSync(png, bytes);
  made++;
  console.log(`  ok ${(bytes.length / 1024).toFixed(0)} KB in ${Math.round(receipt.elapsed_ms / 1000)}s -> ${path.relative(ROOT, png)}`);
  if (!GO) { console.log('probe done (one image); pass --go for the full list'); break; }
}
console.log(`made ${made}, assumed spend $${total.toFixed(2)}`);
