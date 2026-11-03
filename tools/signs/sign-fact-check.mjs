// sign-fact-check.mjs — fact-checks each sign's authored spec+meaning against OFFICIAL handbook text: the belt-accepted
// card backs (handbook-cited) across states that mention the sign. ONE Meta call per sign, strict JSON.
// Verdict per sign: SUPPORTED (official text agrees), CONTRADICTED (official text says otherwise → fix before shipping),
// NOT_COVERED (handbooks name the sign but do not state its meaning/shape → keep as MUTCD-sourced, flag (verify)).
// Usage: node tools/signs/sign-fact-check.mjs [--only sign-stop] [--max-snippets 8] [--dry]
// Writes coordination/SIGNS/factcheck/<id>.json + coordination/SIGNS/factcheck-report.md; appends MUSE-API-SPEND.jsonl.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const ONLY = opt('--only', null), DRY = args.includes('--dry'), FRESH = args.includes('--fresh');
const MAXS = Number(opt('--max-snippets', '8'));
const MODEL = 'muse-spark-1.3';
const PRICE = JSON.parse(fs.readFileSync(path.join(ROOT, 'contracts/meta-pricing-snapshot.v0.4.0.json'), 'utf8')).models[MODEL];
const OUT = path.join(ROOT, 'coordination/SIGNS/factcheck'); fs.mkdirSync(OUT, { recursive: true });
function loadKey() { if (process.env.MODEL_API_KEY) return process.env.MODEL_API_KEY; const env = path.join(ROOT, '.env'); if (!fs.existsSync(env)) return null; for (const line of fs.readFileSync(env, 'utf8').split(/\r?\n/)) { const m = line.match(/^\s*(?:export\s+)?MODEL_API_KEY\s*=\s*"?([^"\s#]+)"?/); if (m) return m[1]; } return null; }
const key = loadKey(); if (!key && !DRY) { console.error('MODEL_API_KEY absent'); process.exit(1); }

const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/SIGNS/sign-list.json'), 'utf8'));
// Gather official snippets: card backs (handbook-cited, belt-accepted) per state that mention the sign's terms.
const walk = (o, out) => { if (!o || typeof o !== 'object') return; if (Array.isArray(o)) { for (const x of o) walk(x, out); return; } if (typeof o.front === 'string' && typeof o.back === 'string') { out.push(o); return; } for (const v of Object.values(o)) walk(v, out); };
const cardsByState = {};
for (const st of fs.readdirSync(path.join(ROOT, 'app-preview/data'))) { const d = path.join(ROOT, 'app-preview/data', st, 'real/04_cards'); if (!fs.existsSync(d)) continue; const cards = []; for (const f of fs.readdirSync(d)) if (f.endsWith('.json')) walk(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')), cards); cardsByState[st.toUpperCase()] = cards; }
const snippetsFor = (s) => { const out = []; const seen = new Set(); for (const [st, cards] of Object.entries(cardsByState)) { for (const c of cards) { const t = c.back.toLowerCase(); if (!s.match_terms.some((x) => t.includes(x))) continue; const k = c.back.slice(0, 80); if (seen.has(k)) continue; seen.add(k); out.push({ state: st, card_id: c.card_id, back: c.back, page: c.source_ref?.printed_page ?? c.source_ref?.pdf_page ?? null }); if (out.length >= MAXS * 3) break; } if (out.length >= MAXS * 3) break; } // spread across states: take round-robin
  const byS = {}; for (const o of out) (byS[o.state] ||= []).push(o); const rr = []; while (rr.length < MAXS) { let added = false; for (const arr of Object.values(byS)) { if (arr.length && rr.length < MAXS) { rr.push(arr.shift()); added = true; } } if (!added) break; } return rr; };

const schema = { type: 'object', additionalProperties: false, required: ['id', 'meaning_verdict', 'spec_verdict', 'evidence', 'correction', 'summary'], properties: { id: { type: 'string' }, meaning_verdict: { type: 'string', enum: ['SUPPORTED', 'CONTRADICTED', 'NOT_COVERED'] }, spec_verdict: { type: 'string', enum: ['SUPPORTED', 'CONTRADICTED', 'NOT_COVERED'] }, evidence: { type: 'array', items: { type: 'string' } }, correction: { type: 'string', description: 'If CONTRADICTED: the corrected meaning or spec, worded from the official text. Else empty.' }, summary: { type: 'string' } } };
const system = `You are a fact-checker. You get an authored description of one US road sign (shape/colour spec and a one-sentence meaning) and several OFFICIAL snippets quoted from state driver handbooks that mention that sign. Judge ONLY against the snippets; do not use outside knowledge to approve.
meaning_verdict: SUPPORTED if at least one snippet states the same meaning or an action consistent with it; CONTRADICTED if a snippet states a different meaning or action; NOT_COVERED if the snippets name the sign but never state what it means.
spec_verdict: same, for the shape/colour/legend description.
evidence: quote the snippet card_ids you relied on. correction: only when CONTRADICTED, worded from the official text. Return only the JSON object.`;

let total = 0; const results = [];
for (const s of list.signs.filter((x) => !ONLY || x.id === ONLY)) {
  const outFile = path.join(OUT, s.id + '.json');
  if (fs.existsSync(outFile) && !FRESH) { results.push(JSON.parse(fs.readFileSync(outFile, 'utf8'))); console.log(`skip ${s.id}`); continue; }
  const snips = snippetsFor(s);
  const user = `id: ${s.id}\nname: ${s.name}\nauthored spec: ${s.spec}\nauthored meaning: ${s.meaning}\n\nOFFICIAL handbook snippets (${snips.length}):\n` + snips.map((x) => `[${x.card_id} | ${x.state}${x.page ? ' p.' + x.page : ''}] ${x.back}`).join('\n');
  const request = { model: MODEL, messages: [{ role: 'system', content: system }, { role: 'user', content: user }], response_format: { type: 'json_schema', json_schema: { name: 'sign_fact_check', strict: true, schema } }, max_completion_tokens: 2500, reasoning_effort: 'low' };
  console.log(`${s.id}: ${snips.length} official snippets from ${new Set(snips.map((x) => x.state)).size} states`);
  if (DRY) continue;
  const started = Date.now();
  const res = await fetch('https://api.meta.ai/v1/chat/completions', { method: 'POST', signal: AbortSignal.timeout(300000), headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key }, body: JSON.stringify(request) });
  const raw = await res.text(); let body = null; try { body = JSON.parse(raw); } catch {}
  const usage = body?.usage ?? {}; const inTok = usage.prompt_tokens ?? 0, outTok = usage.completion_tokens ?? 0; const usd = (inTok * PRICE.input_usd_per_million + outTok * PRICE.output_usd_per_million) / 1e6; total += usd;
  let result = null, parseError = null; try { result = JSON.parse(body?.choices?.[0]?.message?.content ?? ''); } catch (e) { parseError = String(e.message).slice(0, 200); }
  const record = { schema_version: 'nova-sign-fact-check.v1', id: s.id, name: s.name, spec: s.spec, meaning: s.meaning, model: MODEL, http_status: res.status, elapsed_ms: Date.now() - started, snippets: snips, usage, usd_priced: +usd.toFixed(6), parse_error: parseError, result, error_body: res.ok ? null : raw.slice(0, 1500) };
  fs.writeFileSync(outFile, JSON.stringify(record, null, 2) + '\n');
  fs.appendFileSync(path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl'), JSON.stringify({ at: new Date().toISOString(), purpose: 'road-sign meaning fact-check vs handbook cards', sign_id: s.id, model: MODEL, http_status: res.status, prompt_tokens: inTok, completion_tokens: outTok, usd_priced: +usd.toFixed(6) }) + '\n');
  if (!res.ok) { console.log(`  HTTP ${res.status}: ${raw.slice(0, 300)}`); process.exit(1); }
  results.push(record);
  console.log(`  meaning ${result?.meaning_verdict} · spec ${result?.spec_verdict} · ${result?.summary ?? parseError} $${usd.toFixed(4)}`);
}
const tally = (k) => results.reduce((m, r) => ((m[r.result?.[k] ?? 'ERROR'] = (m[r.result?.[k] ?? 'ERROR'] || 0) + 1), m), {});
const contra = results.filter((r) => r.result && (r.result.meaning_verdict === 'CONTRADICTED' || r.result.spec_verdict === 'CONTRADICTED'));
const notcov = results.filter((r) => r.result && r.result.meaning_verdict === 'NOT_COVERED');
const md = [`# Road-sign fact check vs official handbook text — ${new Date().toISOString().slice(0, 10)}`, '', `${results.length} signs · meaning ${JSON.stringify(tally('meaning_verdict'))} · spec ${JSON.stringify(tally('spec_verdict'))} · spend this run $${total.toFixed(3)}`, '', '## CONTRADICTED (fix before shipping)', ...contra.map((r) => `- **${r.id}** (${r.name}): ${r.result.summary}\n  - correction: ${r.result.correction}\n  - evidence: ${r.result.evidence.join(', ')}`), '', '## NOT_COVERED by handbooks (meaning stays MUTCD-sourced, flagged (verify))', ...notcov.map((r) => `- ${r.id}: ${r.result.summary}`)].join('\n');
fs.writeFileSync(path.join(ROOT, 'coordination/SIGNS/factcheck-report.md'), md + '\n');
console.log(`meaning ${JSON.stringify(tally('meaning_verdict'))} spec ${JSON.stringify(tally('spec_verdict'))}; contradicted ${contra.length}; spend $${total.toFixed(3)}; report coordination/SIGNS/factcheck-report.md`);
