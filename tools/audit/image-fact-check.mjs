// image-fact-check.mjs — ONE Muse (Meta Model API) vision call per Terra illustration; strict-JSON verdict on the
// five drawing rules (zero text, US right-hand traffic, no RHD cabin, no head-on same-lane cars, single-bulb
// signals), scene match against the catalog prompt, and teaching correctness. Outside the belt.
// Usage: node tools/audit/image-fact-check.mjs --list coordination/IMAGE-CHECK/pilot-20.json [--only drv-53] [--dry]
//        [--max-usd 0.10] [--reasoning low] [--width 1280]
// Writes coordination/IMAGE-CHECK/results/<id>.json, appends coordination/MUSE-API-SPEND.jsonl. Never prints the key.
// Downscales each PNG to a JPEG (ffmpeg-static from the video studio) before sending; refuses if the per-call
// worst-case estimate exceeds --max-usd. Skips ids that already have a result unless --fresh.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const has = (k) => args.includes(k);
const LIST = path.resolve(ROOT, opt('--list', 'coordination/IMAGE-CHECK/pilot-20.json'));
const ONLY = opt('--only', null);
const DRY = has('--dry');
const FRESH = has('--fresh');
const MAX_USD = Number(opt('--max-usd', '0.10'));
const WIDTH = Number(opt('--width', '1280'));
const MODEL = 'muse-spark-1.3';
if (/contributor/i.test(MODEL)) throw new Error('contributor models are forbidden');
const PRICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/meta-pricing-snapshot.v0.4.0.json'), 'utf8')).models[MODEL];
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const FFMPEG = path.join(ROOT, 'scratch/video-tools/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe');
const OUT = path.join(ROOT, 'coordination/IMAGE-CHECK/results');
const TMP = path.join(ROOT, 'coordination/IMAGE-CHECK/.jpg-cache');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });

// .env is not auto-loaded (JAM-UT-01); read MODEL_API_KEY from it when the shell lacks it.
function loadKey() {
  if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY;
  const env = path.join(ROOT, '.env');
  if (!fs.existsSync(env)) return null;
  for (const line of fs.readFileSync(env, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?MODEL_API_KEY\s*=\s*"?([^"\s#]+)"?/);
    if (m) return m[1];
  }
  return null;
}

const RULES = [
  ['zero_text', 'ZERO text, letters, numbers or words anywhere (signs, plates, papers, screens must be blank shapes)'],
  ['us_right_hand_traffic', 'Strictly US right-hand traffic: vehicles drive on the RIGHT; yellow centerline on the LEFT of our lane; white edge line on the RIGHT'],
  ['no_rhd_cabin', 'No right-hand-drive cabins (no steering wheel on the right side of a car interior)'],
  ['no_head_on_same_lane', 'No two vehicles facing each other head-on inside the same lane'],
  ['single_bulb_signal', 'Any traffic signal shows at most ONE lit lens; the other lenses are dark'],
];

const verdict = (vals) => ({ type: 'object', additionalProperties: false, required: ['verdict', 'note'], properties: { verdict: { type: 'string', enum: vals }, note: { type: 'string' } } });
const schema = {
  type: 'object', additionalProperties: false,
  required: ['id', 'what_i_see', 'rules', 'scene_match', 'teaching_correct', 'overall', 'summary'],
  properties: {
    id: { type: 'string' },
    what_i_see: { type: 'string', description: 'One or two sentences describing the picture literally, before judging it.' },
    rules: { type: 'object', additionalProperties: false, required: RULES.map((r) => r[0]),
      properties: Object.fromEntries(RULES.map((r) => [r[0], verdict(['PASS', 'FAIL', 'NOT_APPLICABLE'])])) },
    scene_match: verdict(['MATCH', 'PARTIAL', 'MISMATCH']),
    teaching_correct: verdict(['CORRECT', 'QUESTIONABLE', 'WRONG']),
    overall: { type: 'string', enum: ['ACCEPT', 'REJECT', 'HUMAN_REVIEW'] },
    summary: { type: 'string' },
  },
};

const system = `You are a strict visual QA reviewer for a US learner's-permit course. You are shown ONE illustration plus the title and the exact prompt it was painted from.
Judge only what is visible. Do not invent details. Be literal and specific; cite positions (left/right, foreground/background).
Rules every image must satisfy:
${RULES.map((r, i) => `${i + 1}. ${r[0]}: ${r[1]}`).join('\n')}
Mark a rule NOT_APPLICABLE only when the subject is absent (no signal present, no car interior shown, etc).
scene_match: does the picture show the situation the title and prompt describe? MATCH / PARTIAL (key element missing or wrong) / MISMATCH.
teaching_correct: would a learner who studies this picture learn the rule correctly? Flag wrong geometry (e.g. car stopped past the stop line, yielding vehicle shown with priority, wrong wheel direction on a hill), impossible physics, or a scene that teaches the opposite of its title.
overall: ACCEPT when every applicable rule PASSes, scene_match is MATCH and teaching is CORRECT. REJECT when any rule FAILs or teaching is WRONG. HUMAN_REVIEW otherwise.
Return only the JSON object.`;

function toJpeg(file) {
  // BUG-006 (2026-11-01): the cache was keyed by basename only, so a re-paint dropped under the same id was judged on the
  // OLD downscaled jpg. Key by the source bytes' sha so a changed PNG always gets a fresh jpg.
  const srcSha = crypto.createHash('sha256').update(fs.readFileSync(path.join(VIS, file))).digest('hex').slice(0, 12);
  const out = path.join(TMP, path.basename(file, path.extname(file)) + `.${srcSha}.w${WIDTH}.jpg`);
  if (!fs.existsSync(out)) {
    const r = spawnSync(FFMPEG, ['-v', 'error', '-y', '-i', path.join(VIS, file), '-vf', `scale=${WIDTH}:-2`, '-q:v', '4', out], { encoding: 'utf8' });
    if (r.status !== 0) throw new Error('ffmpeg failed for ' + file + ': ' + (r.stderr || '').slice(0, 300));
  }
  return out;
}

const key = loadKey();
if (!key && !DRY) { console.error('MODEL_API_KEY absent (shell env and .env)'); process.exit(1); }
const items = JSON.parse(fs.readFileSync(LIST, 'utf8')).filter((s) => !ONLY || s.id === ONLY || s.id.startsWith(ONLY + '-'));
let total = 0;
for (const s of items) {
  const outFile = path.join(OUT, s.id + '.json');
  if (fs.existsSync(outFile) && !FRESH) { console.log(`skip ${s.id} (result exists)`); continue; }
  const jpg = toJpeg(s.file);
  const b64 = fs.readFileSync(jpg).toString('base64');
  const user = [
    { type: 'text', text: `id: ${s.id}\ntitle: ${s.title}\nprompt the image was painted from:\n${s.prompt}\n\nReview the attached image.` },
    { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + b64, detail: 'high' } },
  ];
  const request = { model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    response_format: { type: 'json_schema', json_schema: { name: 'image_review', strict: true, schema } },
    max_completion_tokens: Number(opt('--max-out', '4000')), reasoning_effort: opt('--reasoning', 'low') };
  // Image tokens are provider-defined; assume a generous 2,000 per image plus text at ~3.6 bytes/token.
  const textBytes = Buffer.byteLength(system) + Buffer.byteLength(user[0].text);
  const estIn = Math.ceil(textBytes / 3.6) + 2000, estOut = request.max_completion_tokens;
  const estUsd = (estIn * PRICE.input_usd_per_million + estOut * PRICE.output_usd_per_million) / 1e6;
  console.log(`${s.id}: jpeg ${(fs.statSync(jpg).size / 1024).toFixed(0)} KB, ~${estIn} tok in est, cap ${estOut} out -> worst case $${estUsd.toFixed(3)}`);
  if (estUsd > MAX_USD) { console.error(`REFUSED: worst-case $${estUsd.toFixed(3)} > --max-usd ${MAX_USD}`); process.exit(1); }
  if (DRY) continue;
  const started = Date.now();
  const res = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(300000),
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(request) });
  const raw = await res.text();
  let body = null; try { body = JSON.parse(raw); } catch {}
  const usage = body?.usage ?? {};
  const inTok = usage.prompt_tokens ?? usage.input_tokens ?? 0, outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;
  const usd = (inTok * PRICE.input_usd_per_million + outTok * PRICE.output_usd_per_million) / 1e6;
  total += usd;
  let result = null, parseError = null;
  try { result = JSON.parse(body?.choices?.[0]?.message?.content ?? ''); } catch (e) { parseError = String(e.message).slice(0, 200); }
  const record = { schema_version: 'nova-image-fact-check.v1', id: s.id, file: s.file, title: s.title, model: MODEL, model_returned: body?.model ?? null,
    image_sha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(VIS, s.file))).digest('hex'), sent_width: WIDTH,
    http_status: res.status, finish_reason: body?.choices?.[0]?.finish_reason ?? null, elapsed_ms: Date.now() - started,
    usage, usd_priced: Number(usd.toFixed(6)), price_basis: 'contracts/meta-pricing-snapshot.v0.4.0.json', parse_error: parseError, result,
    error_body: res.ok ? null : raw.slice(0, 2000) };
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n');
  fs.appendFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), JSON.stringify({ at: new Date().toISOString(), purpose: 'image fact-check pilot (vision, outside belt)', image_id: s.id, model: MODEL, http_status: res.status, prompt_tokens: inTok, completion_tokens: outTok, usd_priced: Number(usd.toFixed(6)) }) + '\n');
  if (!res.ok) { console.log(`  HTTP ${res.status}: ${raw.slice(0, 400)}`); process.exit(1); }
  if (!result) { console.log(`  HTTP 200 but unparseable (${record.finish_reason}): ${parseError}`); continue; }
  const fails = Object.entries(result.rules).filter(([, v]) => v.verdict === 'FAIL').map(([k]) => k);
  console.log(`  ${result.overall.padEnd(12)} scene ${result.scene_match.verdict} teach ${result.teaching_correct.verdict}${fails.length ? ' FAIL:' + fails.join(',') : ''} | in ${inTok} out ${outTok} $${usd.toFixed(4)} ${Math.round(record.elapsed_ms / 1000)}s`);
  console.log(`  ${result.summary}`);
}
console.log(`total priced this run: $${total.toFixed(4)}`);
