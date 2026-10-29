#!/usr/bin/env node
// muse-fact-check.mjs — ONE Muse (Meta Model API) call that fact-checks one handbook section and returns JSON findings.
// Pilot for the stage-08 independent fact audit, OUTSIDE the belt (no ledger task; spend is recorded below).
//
//   node tools/audit/muse-fact-check.mjs --state MI --section <section_id> [--dry] [--max-usd 1]
//
// Sends: the section's compiled facts (id, statement, cited PDF page) + the text of ONLY the cited handbook pages.
// Returns (strict JSON schema): one finding per fact — SUPPORTED | PARTIALLY_SUPPORTED | NOT_FOUND_ON_PAGE | CONTRADICTED,
// with a short verbatim evidence quote, the issue, and a page-grounded fix.
// Writes: runs/<run>/sources/private/audits/muse-fact-check/<section>-<stamp>.json (private: carries handbook quotes)
//         coordination/MUSE-API-SPEND.jsonl (one line: model, tokens, USD) and prints a summary.
// Never prints MODEL_API_KEY. Refuses when the pre-call estimate exceeds --max-usd (default $1). No retries.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });
const a = process.argv.slice(2);
const opt = (k, d = null) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const ST = (opt('--state') || '').toUpperCase(), SECTION = opt('--section'), DRY = a.includes('--dry'), MAX_USD = Number(opt('--max-usd', '1'));
if (!ST || !SECTION) { console.error('usage: --state XX --section <section_id> [--dry] [--max-usd 1]'); process.exit(2); }
const MODEL = 'muse-spark-1.3';
if (/contributor/i.test(MODEL)) throw new Error('contributor models are forbidden');
const PRICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/meta-pricing-snapshot.v0.4.0.json'), 'utf8')).models[MODEL];

const statesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/states.json'), 'utf8'));
const st = (Array.isArray(statesRaw) ? statesRaw : statesRaw.states).find((s) => s.code === ST);
if (!st) throw new Error('unknown state ' + ST);
const runDir = path.join(ROOT, 'runs', st.run_id);
const cur = JSON.parse(fs.readFileSync(path.join(runDir, '16', SECTION, 'CURRENT.json'), 'utf8'));
const reg = JSON.parse(fs.readFileSync(path.join(ROOT, cur.fact_registry), 'utf8'));
const facts = (Array.isArray(reg.facts) ? reg.facts : Object.values(reg.facts)).map((f) => ({ fact_id: f.fact_id, statement: f.statement ?? f.text, pdf_page: f.pdf_page, printed_page: f.printed_page ?? null }));
// --control: positive control. Plants wrong numbers in up to 3 facts (number word swapped); the auditor must not
// mark those SUPPORTED. Findings for planted facts are reported as CONTROL HIT / CONTROL MISS.
const CONTROL = a.includes('--control');
const planted = new Set();
if (CONTROL) {
  const SWAP = { one: 'four', two: 'five', three: 'seven', four: 'nine', five: 'two', six: 'three', seven: 'eleven', eight: 'twelve', nine: 'six', ten: 'forty',
    eleven: 'three', twelve: 'twenty', fifteen: 'fifty', sixteen: 'nineteen', eighteen: 'twenty-five', twenty: 'eighty', thirty: 'ninety', ninety: 'thirty', hundred: 'thousand' };
  for (const f of facts) {
    if (planted.size >= 3) break;
    const m = f.statement.match(new RegExp('\\b(' + Object.keys(SWAP).join('|') + ')\\b', 'i'));
    if (!m) continue;
    f.statement = f.statement.replace(m[0], SWAP[m[0].toLowerCase()]);
    planted.add(f.fact_id);
  }
}
const srcText = fs.readFileSync(path.join(runDir, 'sources/private/15-source-text.txt'), 'utf8');
const pageText = {};
for (const chunk of srcText.split(/\n(?==== PHYSICAL PDF PAGE )/)) { const m = chunk.match(/^=== PHYSICAL PDF PAGE (\d+)[^\n]*\n/); if (m) pageText[m[1]] = chunk.slice(m[0].length).trim(); }
const cited = [...new Set(facts.map((f) => String(f.pdf_page)))].sort((x, y) => x - y);
const pages = Object.fromEntries(cited.map((p) => [p, pageText[p] ?? '']));
const missingPages = cited.filter((p) => !pages[p]);

const schema = {
  type: 'object', additionalProperties: false, required: ['findings', 'summary'],
  properties: {
    findings: { type: 'array', items: { type: 'object', additionalProperties: false, required: ['fact_id', 'verdict', 'evidence_quote', 'issue', 'suggested_fix'],
      properties: { fact_id: { type: 'string' }, verdict: { type: 'string', enum: ['SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_FOUND_ON_PAGE', 'CONTRADICTED'] },
        evidence_quote: { type: 'string' }, issue: { type: 'string' }, suggested_fix: { type: 'string' } } } },
    summary: { type: 'object', additionalProperties: false, required: ['supported', 'partially_supported', 'not_found_on_page', 'contradicted'],
      properties: { supported: { type: 'integer' }, partially_supported: { type: 'integer' }, not_found_on_page: { type: 'integer' }, contradicted: { type: 'integer' } } },
  },
};
const system = [
  'You are an independent fact auditor for a driver-permit study course. You did not write these facts.',
  'For EACH fact, check its statement ONLY against the text of the handbook page it cites (pages are given by physical PDF page number). Never use outside knowledge, memory, or other states.',
  'Verdicts: SUPPORTED = the cited page states it (paraphrase is fine if the meaning, numbers, conditions and exceptions all match). PARTIALLY_SUPPORTED = mostly right but a number, condition, exception or scope differs or is missing. NOT_FOUND_ON_PAGE = the cited page does not state it. CONTRADICTED = the cited page says something incompatible.',
  'evidence_quote: a verbatim quote of at most 25 words from the cited page that decides the verdict ("" if nothing relevant is on the page). issue: one sentence ("" when SUPPORTED). suggested_fix: a corrected statement grounded only in the page ("" when SUPPORTED).',
  'Return exactly one finding per fact, in the same order, and a summary whose counts equal the findings. Output JSON only.',
].join('\n');
const user = JSON.stringify({ state: st.name, handbook: st.handbook, section_id: SECTION, facts, pages });
const request = { model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
  response_format: { type: 'json_schema', json_schema: { name: 'fact_check_findings', strict: true, schema } },
  max_completion_tokens: Math.min(32000, 2000 + facts.length * 300) };
const reqBytes = Buffer.byteLength(JSON.stringify(request));
const estIn = Math.ceil(reqBytes / 3.6), estOut = request.max_completion_tokens;
const estUsd = (estIn * PRICE.input_usd_per_million + estOut * PRICE.output_usd_per_million) / 1e6;
console.log(`${ST} ${SECTION}: ${facts.length} facts, ${cited.length} cited pages${missingPages.length ? ' (MISSING ' + missingPages.join(',') + ')' : ''}, request ${reqBytes} bytes ~${estIn} tok in, cap ${estOut} out -> worst case $${estUsd.toFixed(3)}`);
if (missingPages.length) { console.error('REFUSED: cited pages absent from the private source text'); process.exit(1); }
if (estUsd > MAX_USD) { console.error(`REFUSED: worst-case estimate $${estUsd.toFixed(3)} > --max-usd ${MAX_USD}`); process.exit(1); }
if (DRY) process.exit(0);
const key = process.env.MODEL_API_KEY;
if (!key) { console.error('MODEL_API_KEY absent'); process.exit(1); }

const started = Date.now();
const res = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(600000),
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(request) });
const raw = await res.text();
let body = null; try { body = JSON.parse(raw); } catch {}
const usage = body?.usage ?? {};
const inTok = usage.prompt_tokens ?? usage.input_tokens ?? 0, outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;
const usd = (inTok * PRICE.input_usd_per_million + outTok * PRICE.output_usd_per_million) / 1e6;
let result = null, parseError = null;
try { result = JSON.parse(body?.choices?.[0]?.message?.content ?? ''); } catch (e) { parseError = String(e.message).slice(0, 200); }
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = path.join(runDir, 'sources/private/audits/muse-fact-check');
fs.mkdirSync(outDir, { recursive: true });
const record = { schema_version: 'nova-muse-fact-check-pilot.v1', state: ST, run_id: st.run_id, section_id: SECTION, model: MODEL, model_returned: body?.model ?? null,
  http_status: res.status, finish_reason: body?.choices?.[0]?.finish_reason ?? null, elapsed_ms: Date.now() - started,
  request_sha256: crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex'), fact_registry: cur.fact_registry, fact_registry_sha256: cur.fact_registry_sha256,
  usage, usd_priced: Number(usd.toFixed(6)), price_basis: 'contracts/meta-pricing-snapshot.v0.4.0.json', parse_error: parseError, result,
  error_body: res.ok ? null : raw.slice(0, 2000) };
const outFile = path.join(outDir, `${SECTION}${CONTROL ? '-CONTROL' : ''}-${stamp}.json`);
fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n');
fs.appendFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), JSON.stringify({ at: new Date().toISOString(), purpose: CONTROL ? 'fact-check positive control (planted errors)' : 'fact-check pilot (outside belt)', state: ST, section_id: SECTION, model: MODEL, http_status: res.status, prompt_tokens: inTok, completion_tokens: outTok, usd_priced: Number(usd.toFixed(6)) }) + '\n');
console.log(`HTTP ${res.status} finish ${record.finish_reason} in ${Math.round(record.elapsed_ms / 1000)}s; tokens in ${inTok} out ${outTok}; priced $${usd.toFixed(4)}`);
console.log('findings file: ' + path.relative(ROOT, outFile).replace(/\\/g, '/'));
if (!res.ok) { console.log('error: ' + raw.slice(0, 400)); process.exit(1); }
if (!result) { console.log('unparseable output: ' + parseError); process.exit(1); }
console.log('summary: ' + JSON.stringify(result.summary) + ` (findings ${result.findings.length} of ${facts.length} facts)`);
for (const f of result.findings.filter((x) => x.verdict !== 'SUPPORTED')) console.log(`  ${f.verdict.padEnd(19)} ${f.fact_id}${planted.has(f.fact_id) ? ' [planted]' : ''}: ${f.issue}`);
if (CONTROL) {
  const by = Object.fromEntries(result.findings.map((f) => [f.fact_id, f.verdict]));
  const hits = [...planted].filter((id) => by[id] && by[id] !== 'SUPPORTED');
  console.log(`CONTROL: planted ${planted.size} wrong facts (${[...planted].join(', ')}); caught ${hits.length}/${planted.size}${hits.length === planted.size ? ' — PASS' : ' — MISS: ' + [...planted].filter((id) => !hits.includes(id)).join(', ')}`);
}
