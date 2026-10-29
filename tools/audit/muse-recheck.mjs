#!/usr/bin/env node
// muse-recheck.mjs — second pass on ONLY the flagged facts: one Muse call per section that has flags. Each flagged fact
// goes back with its first-pass issue and the cited page PLUS the pages either side (citation slips resolve there).
// Muse returns, per fact: still_wrong, kind (MEANING | CITATION | OK), a page-grounded corrected statement, the page
// that actually states it, and a short verbatim evidence quote.
//
//   node tools/audit/muse-recheck.mjs [--max-usd 10] [--states VA,HI] [--dry]
//
// Inputs : coordination/FACT-CHECK/TRIAGE.json (flagged rows), each run's CURRENT fact registry + private page text.
// Outputs: coordination/FACT-CHECK/<ST>/corrections.json (no handbook quotes) — the fix list the belt applies;
//          runs/<run>/sources/private/audits/muse-recheck/<section>-<stamp>.json (full, with quotes);
//          coordination/MUSE-API-SPEND.jsonl. Resumable (a section with a parsed result is reused). Single instance.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });
const a = process.argv.slice(2);
const opt = (k, d = null) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const CAP = Number(opt('--max-usd', '10')), DRY = a.includes('--dry');
const ONLY = opt('--states') ? new Set(opt('--states').toUpperCase().split(',')) : null;
const MODEL = 'muse-spark-1.3';
const PRICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/meta-pricing-snapshot.v0.4.0.json'), 'utf8')).models[MODEL];
const LOCK = path.join(ROOT, 'coordination/FACT-CHECK/.recheck.lock');
if (!DRY && fs.existsSync(LOCK)) { const pid = +fs.readFileSync(LOCK, 'utf8'); let alive = false; try { process.kill(pid, 0); alive = true; } catch {} if (alive) { console.error('REFUSED: recheck already running (pid ' + pid + ')'); process.exit(1); } }
if (!DRY) { fs.writeFileSync(LOCK, String(process.pid)); process.on('exit', () => { try { fs.rmSync(LOCK); } catch {} }); }

const triage = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/FACT-CHECK/TRIAGE.json'), 'utf8'));
const statesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/states.json'), 'utf8'));
const states = Array.isArray(statesRaw) ? statesRaw : statesRaw.states;
const groups = new Map(); // state|section -> rows
for (const r of triage.rows) { if (ONLY && !ONLY.has(r.state)) continue; const k = r.state + '|' + r.section; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r); }

const schema = { type: 'object', additionalProperties: false, required: ['rechecks'], properties: { rechecks: { type: 'array', items: { type: 'object', additionalProperties: false,
  required: ['fact_id', 'still_wrong', 'kind', 'corrected_statement', 'correct_pdf_page', 'evidence_quote', 'note'],
  properties: { fact_id: { type: 'string' }, still_wrong: { type: 'boolean' }, kind: { type: 'string', enum: ['MEANING', 'CITATION', 'OK'] },
    corrected_statement: { type: 'string' }, correct_pdf_page: { type: 'integer' }, evidence_quote: { type: 'string' }, note: { type: 'string' } } } } } };
const system = [
  'You are re-checking facts that a first audit pass flagged, for a driver-permit study course. Use ONLY the handbook page texts provided (the cited page and the pages either side). No outside knowledge.',
  'For each fact decide: kind OK = the statement is correct AND printed on its cited page (the first flag was wrong); CITATION = the statement is correct as written but is printed on a different provided page; MEANING = the statement is wrong, incomplete (missing a condition, exception, number or scope), or adds something no provided page says.',
  'still_wrong = true for MEANING and CITATION, false for OK.',
  'corrected_statement: for MEANING, one complete learner-readable sentence that states the page correctly in plain words (spell out numbers as words, no symbols, no "this sign"/"shown here"); for CITATION or OK, repeat the statement unchanged.',
  'correct_pdf_page: the physical PDF page number that states the corrected statement. evidence_quote: at most 25 verbatim words from that page. note: one short sentence on what changed ("" for OK).',
  'Return exactly one recheck per fact, in order. JSON only.',
].join('\n');

const spendLog = path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl');
const started = new Date().toISOString();
const spent = () => fs.readFileSync(spendLog, 'utf8').trim().split('\n').map((l) => JSON.parse(l)).filter((j) => j.at >= started && j.purpose === 'fact-check recheck (flagged only)').reduce((t, j) => t + j.usd_priced, 0);
const perState = {};
let worstTotal = 0, calls = 0;
let STOP = false, dryFacts = 0;
const handle = async (k, rows) => {
  if (STOP) return;
  const [code, section] = k.split('|');
  const st = states.find((s) => s.code === code);
  const runDir = path.join(ROOT, 'runs', st.run_id);
  const privDir = path.join(runDir, 'sources/private/audits/muse-recheck');
  const prev = fs.existsSync(privDir) && fs.readdirSync(privDir).filter((n) => n.startsWith(section + '-')).sort().pop();
  let rec = prev ? JSON.parse(fs.readFileSync(path.join(privDir, prev), 'utf8')) : null;
  if (!rec?.result) {
    const cur = JSON.parse(fs.readFileSync(path.join(runDir, '16', section, 'CURRENT.json'), 'utf8'));
    const reg = JSON.parse(fs.readFileSync(path.join(ROOT, cur.fact_registry), 'utf8'));
    const byId = new Map((Array.isArray(reg.facts) ? reg.facts : Object.values(reg.facts)).map((f) => [f.fact_id, f]));
    const src = fs.readFileSync(path.join(runDir, 'sources/private/15-source-text.txt'), 'utf8');
    const pageText = {}; for (const c of src.split(/\n(?==== PHYSICAL PDF PAGE )/)) { const m = c.match(/^=== PHYSICAL PDF PAGE (\d+)[^\n]*\n/); if (m) pageText[m[1]] = c.slice(m[0].length).trim(); }
    const facts = rows.map((r) => { const f = byId.get(r.fact_id); return { fact_id: r.fact_id, statement: f?.statement ?? f?.text ?? '', cited_pdf_page: f?.pdf_page ?? null, first_pass_verdict: r.verdict, first_pass_issue: r.issue }; }).filter((f) => f.statement);
    const want = new Set(); for (const f of facts) for (const d of [-1, 0, 1]) if (pageText[String(f.cited_pdf_page + d)]) want.add(String(f.cited_pdf_page + d));
    const pages = Object.fromEntries([...want].sort((x, y) => x - y).map((p) => [p, pageText[p]]));
    const request = { model: MODEL, reasoning_effort: 'low', max_completion_tokens: Math.min(24000, Math.max(8000, 3000 + facts.length * 700)),
      messages: [{ role: 'system', content: system }, { role: 'user', content: JSON.stringify({ state: st.name, handbook: st.handbook, section_id: section, facts, pages }) }],
      response_format: { type: 'json_schema', json_schema: { name: 'fact_rechecks', strict: true, schema } } };
    const worst = (Math.ceil(Buffer.byteLength(JSON.stringify(request)) / 3.6) * PRICE.input_usd_per_million + request.max_completion_tokens * PRICE.output_usd_per_million) / 1e6;
    worstTotal += worst;
    if (DRY) { dryFacts += facts.length; return; }
    if (spent() + worst > CAP) { console.log(`CAP: stop before ${code} ${section} (spent $${spent().toFixed(2)})`); STOP = true; return; }
    const res = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(600000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.MODEL_API_KEY }, body: JSON.stringify(request) });
    const raw = await res.text(); let body = null; try { body = JSON.parse(raw); } catch {}
    const u = body?.usage ?? {}; const usd = ((u.prompt_tokens || 0) * PRICE.input_usd_per_million + (u.completion_tokens || 0) * PRICE.output_usd_per_million) / 1e6;
    let result = null; try { result = JSON.parse(body?.choices?.[0]?.message?.content ?? ''); } catch {}
    calls++;
    rec = { schema_version: 'nova-muse-recheck.v1', state: code, run_id: st.run_id, section_id: section, model: MODEL, http_status: res.status, finish_reason: body?.choices?.[0]?.finish_reason ?? null,
      request_sha256: crypto.createHash('sha256').update(JSON.stringify(request)).digest('hex'), fact_registry: cur.fact_registry, usage: u, usd_priced: Number(usd.toFixed(6)), facts_sent: facts, result, error_body: res.ok ? null : raw.slice(0, 1500) };
    fs.mkdirSync(privDir, { recursive: true });
    fs.writeFileSync(path.join(privDir, `${section}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`), JSON.stringify(rec, null, 2) + '\n');
    fs.appendFileSync(spendLog, JSON.stringify({ at: new Date().toISOString(), purpose: 'fact-check recheck (flagged only)', state: code, section_id: section, model: MODEL, http_status: res.status, prompt_tokens: u.prompt_tokens || 0, completion_tokens: u.completion_tokens || 0, usd_priced: Number(usd.toFixed(6)) }) + '\n');
    console.log(`${code} ${section}: ${facts.length} flagged -> ${result ? result.rechecks.filter((x) => x.kind === 'MEANING').length + ' meaning, ' + result.rechecks.filter((x) => x.kind === 'CITATION').length + ' citation, ' + result.rechecks.filter((x) => x.kind === 'OK').length + ' ok' : 'FAILED ' + (rec.finish_reason || res.status)} $${usd.toFixed(4)}`);
  }
  if (rec?.result) {
    const out = (perState[code] ??= []);
    for (const x of rec.result.rechecks) out.push({ section, fact_id: x.fact_id, kind: x.kind, still_wrong: x.still_wrong, corrected_statement: x.corrected_statement, correct_pdf_page: x.correct_pdf_page, note: x.note });
  }
};
const PAR = Number(opt('--parallel', '6'));
const queue = [...groups];
await Promise.all(Array.from({ length: DRY ? 1 : PAR }, async () => { while (queue.length && !STOP) { const [k, rows] = queue.shift(); await handle(k, rows); } }));
if (DRY) { console.log(`DRY: ${groups.size} sections with flags, worst case $${worstTotal.toFixed(2)}`); process.exit(0); }
for (const [code, list] of Object.entries(perState)) {
  if (!Array.isArray(list)) continue;
  const f = path.join(ROOT, 'coordination/FACT-CHECK', code, 'corrections.json');
  fs.writeFileSync(f, JSON.stringify({ schema_version: 'nova-fact-corrections.v1', state: code, generated_at: new Date().toISOString(), source: 'Muse recheck of first-pass flags; apply through the belt (02 fact block -> 16 -> 04/05 remint), never in place',
    counts: { meaning: list.filter((x) => x.kind === 'MEANING').length, citation: list.filter((x) => x.kind === 'CITATION').length, ok: list.filter((x) => x.kind === 'OK').length }, corrections: list }, null, 2) + '\n');
}
const all = Object.values(perState).filter(Array.isArray).flat();
console.log(`\nRECHECK: ${calls} new calls, spent $${spent().toFixed(2)}; facts ${all.length}: MEANING ${all.filter((x) => x.kind === 'MEANING').length}, CITATION ${all.filter((x) => x.kind === 'CITATION').length}, OK ${all.filter((x) => x.kind === 'OK').length}`);
