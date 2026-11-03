// sign-qa.mjs — ONE Meta vision call per generated road-sign image: does the picture match the sign's spec
// (shape, colours, legend spelled exactly, symbol), is it a single front-facing sign on plain white, nothing extra?
// Usage: node tools/signs/sign-qa.mjs [--list coordination/SIGNS/sign-list.json] [--dir store/learner-assets/signs-raw]
//        [--only sign-stop] [--fresh] [--dry]
// Writes coordination/SIGNS/qa/<id>.json, coordination/SIGNS/qa-report.md, appends coordination/MUSE-API-SPEND.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const LIST = path.resolve(ROOT, opt('--list', 'coordination/SIGNS/sign-list.json'));
const DIR = path.resolve(ROOT, opt('--dir', 'store/learner-assets/signs-raw'));
const ONLY = opt('--only', null), DRY = has('--dry'), FRESH = has('--fresh');
const MODEL = 'muse-spark-1.3';
const PRICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/meta-pricing-snapshot.v0.4.0.json'), 'utf8')).models[MODEL];
const FFMPEG = path.join(ROOT, 'scratch/video-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const QA = path.join(ROOT, 'coordination/SIGNS/qa'); fs.mkdirSync(QA, { recursive: true });
const TMP = path.join(ROOT, 'coordination/SIGNS/.jpg-cache'); fs.mkdirSync(TMP, { recursive: true });

function loadKey() {
  if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY;
  const env = path.join(ROOT, '.env'); if (!fs.existsSync(env)) return null;
  for (const line of fs.readFileSync(env, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*(?:export\s+)?MODEL_API_KEY\s*=\s*"?([^"\s#]+)"?/); if (m) return m[1]; }
  return null;
}
const key = loadKey();
if (!key && !DRY) { console.error('MODEL_API_KEY absent'); process.exit(1); }

const v = (vals) => ({ type: 'object', additionalProperties: false, required: ['verdict', 'note'], properties: { verdict: { type: 'string', enum: vals }, note: { type: 'string' } } });
const schema = { type: 'object', additionalProperties: false, required: ['id', 'what_i_see', 'legend_read', 'shape_colour', 'legend_exact', 'symbol', 'single_clean', 'overall', 'summary'],
  properties: { id: { type: 'string' }, what_i_see: { type: 'string' }, legend_read: { type: 'string', description: 'The exact letters/numbers visible on the sign, or "none".' },
    shape_colour: v(['PASS', 'FAIL']), legend_exact: v(['PASS', 'FAIL', 'NOT_APPLICABLE']), symbol: v(['PASS', 'FAIL', 'NOT_APPLICABLE']), single_clean: v(['PASS', 'FAIL']),
    overall: { type: 'string', enum: ['ACCEPT', 'REJECT'] }, summary: { type: 'string' } } };
const system = `You are a strict QA reviewer of United States road-sign artwork for a learner's-permit course. You are shown ONE image and the spec of the sign it must depict.
Judge only what is visible. First transcribe any letters or numbers on the sign exactly as rendered (legend_read).
shape_colour: the sign's shape and colours match the spec (octagon/diamond/pentagon/circle/rectangle/triangle; red/yellow/orange/green/blue/brown/white/fluorescent yellow-green/black as specified).
legend_exact: every word is present, spelled exactly, no extra or garbled letters, no mirrored glyphs; NOT_APPLICABLE when the spec has no legend.
symbol: the pictogram matches the spec (arrow direction, figure, vehicle); NOT_APPLICABLE when the spec has no symbol. An arrow on a US sign has exactly ONE arrowhead unless the spec says two arrows or opposing arrows: a double-headed arrow is a FAIL. Count the heads.
single_clean: exactly one sign, front-facing, no pole/scenery/shadow/extra objects/watermarks, plain white background.
overall: ACCEPT only when every applicable check is PASS; otherwise REJECT. Return only the JSON object.`;

const toJpeg = (png) => { const out = path.join(TMP, path.basename(png, '.png') + '.w768.jpg'); if (!fs.existsSync(out) || FRESH) { const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', png, '-vf', 'scale=768:-2', '-q:v', '4', out], { encoding: 'utf8' }); if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr.slice(0, 200)); } return out; };

const signs = JSON.parse(fs.readFileSync(LIST, 'utf8')).signs.filter((s) => !ONLY || s.id === ONLY);
let total = 0; const results = [];
for (const s of signs) {
  const png = path.join(DIR, s.id + '.png'), outFile = path.join(QA, s.id + '.json');
  if (!fs.existsSync(png)) { console.log(`missing ${s.id}`); continue; }
  const sha = crypto.createHash('sha256').update(fs.readFileSync(png)).digest('hex');
  if (fs.existsSync(outFile) && !FRESH) { const old = JSON.parse(fs.readFileSync(outFile, 'utf8')); if (old.image_sha256 === sha) { results.push(old); console.log(`skip ${s.id} (same image reviewed)`); continue; } }
  const b64 = fs.readFileSync(toJpeg(png)).toString('base64');
  const user = [{ type: 'text', text: `id: ${s.id}\nname: ${s.name}\nspec: ${s.spec}\n\nReview the attached image against the spec.` }, { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'high' } }];
  const request = { model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_schema', json_schema: { name: 'sign_qa', strict: true, schema } }, max_completion_tokens: 3000, reasoning_effort: 'low' };
  console.log(`${s.id}: ${s.name}`);
  if (DRY) continue;
  const started = Date.now();
  const res = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(300000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(request) });
  const raw = await res.text(); let body = null; try { body = JSON.parse(raw); } catch {}
  const usage = body?.usage ?? {}; const inTok = usage.prompt_tokens ?? 0, outTok = usage.completion_tokens ?? 0;
  const usd = (inTok * PRICE.input_usd_per_million + outTok * PRICE.output_usd_per_million) / 1e6; total += usd;
  let result = null, parseError = null; try { result = JSON.parse(body?.choices?.[0]?.message?.content ?? ''); } catch (e) { parseError = String(e.message).slice(0, 200); }
  const record = { schema_version: 'nova-sign-qa.v1', id: s.id, name: s.name, spec: s.spec, model: MODEL, http_status: res.status, elapsed_ms: Date.now() - started, image_sha256: sha, usage, usd_priced: +usd.toFixed(6), parse_error: parseError, result, error_body: res.ok ? null : raw.slice(0, 1500) };
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n');
  fs.appendFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), JSON.stringify({ at: new Date().toISOString(), purpose: 'road-sign image QA (vision)', image_id: s.id, model: MODEL, http_status: res.status, prompt_tokens: inTok, completion_tokens: outTok, usd_priced: +usd.toFixed(6) }) + '\n');
  if (!res.ok) { console.log(`  HTTP ${res.status}: ${raw.slice(0, 300)}`); process.exit(1); }
  results.push(record);
  console.log(`  ${result ? result.overall : 'unparseable'} legend="${result?.legend_read ?? ''}" ${result ? result.summary : parseError} $${usd.toFixed(4)}`);
}
const acc = results.filter((r) => r.result?.overall === 'ACCEPT'), rej = results.filter((r) => r.result?.overall === 'REJECT');
const md = [`# Road-sign image QA — ${new Date().toISOString().slice(0, 10)}`, '', `${results.length} reviewed · ACCEPT ${acc.length} · REJECT ${rej.length} · spend this run $${total.toFixed(3)}`, '', '## Rejects', ...rej.map((r) => `- **${r.id}** (${r.name}): legend read "${r.result.legend_read}" — ${r.result.summary}`), '', '## Accepts', ...acc.map((r) => `- ${r.id}: ${r.result.legend_read}`)].join('\n');
fs.writeFileSync(path.join(ROOT, 'coordination/SIGNS/qa-report.md'), md + '\n');
console.log(`ACCEPT ${acc.length} / REJECT ${rej.length}; spend $${total.toFixed(3)}; report coordination/SIGNS/qa-report.md`);
