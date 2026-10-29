#!/usr/bin/env node
// fact-check-state.mjs — run the one-call Muse fact check (tools/audit/muse-fact-check.mjs) over EVERY section of one
// state, under a total dollar cap, and write the state report with the exact measured cost.
//
//   node tools/audit/fact-check-state.mjs --state MI [--max-usd 2] [--dry] [--allow-same-family]
//
// --dry           : pre-call worst-case estimate for every section; sends nothing.
// --max-usd N     : hard total cap for this state (default 2). Stops before a call whose worst case would cross it.
// Resumable       : a section with an existing parsed findings file is reused, not re-sent.
// Independence    : refuses states whose SME dossiers Muse wrote (authored_by mentions muse), since Meta would be auditing
//                   Meta; --allow-same-family overrides (recorded in the report as NOT independent).
// Outputs:
//   coordination/FACT-CHECK/<ST>/report.json + report.md — counts, exact tokens and USD per section, every non-SUPPORTED
//     finding (fact id, verdict, issue, suggested fix; no handbook quotes), and a fleet projection from the real cost/fact.
//   Full findings with verbatim quotes stay in runs/<run>/sources/private/audits/muse-fact-check/ (gitignored).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const a = process.argv.slice(2);
const opt = (k, d = null) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const ST = (opt('--state') || '').toUpperCase(), MAX = Number(opt('--max-usd', '2')), DRY = a.includes('--dry'), SAME = a.includes('--allow-same-family'), FRESH = a.includes('--fresh'), EFFORT = opt('--reasoning', 'low');
const SINCE = new Date().toISOString().replace(/[:.]/g, '-'); // --fresh reuses only results written by this invocation
if (!ST) { console.error('usage: --state XX [--max-usd 2] [--dry] [--allow-same-family]'); process.exit(2); }
const statesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/states.json'), 'utf8'));
const states = Array.isArray(statesRaw) ? statesRaw : statesRaw.states;
const st = states.find((s) => s.code === ST);
if (!st) throw new Error('unknown state ' + ST);
const sameFamily = /muse/i.test(st.authored_by || '');
if (sameFamily && !SAME) { console.error(`REFUSED: ${ST} dossiers were written by Muse ("${st.authored_by}"); a Muse audit is not independent. Use Claude/Sol, or --allow-same-family.`); process.exit(1); }
const runDir = path.join(ROOT, 'runs', st.run_id);
const cfg = JSON.parse(fs.readFileSync(path.join(runDir, 'run-config.json'), 'utf8'));
const sections = Object.keys(cfg.scope.section_page_ranges);
const privDir = path.join(runDir, 'sources/private/audits/muse-fact-check');
const one = path.join(ROOT, 'tools/audit/muse-fact-check.mjs');
// One runner per state at a time (2026-10-29 duplicate-spend incident).
fs.mkdirSync(privDir, { recursive: true });
const LOCK = path.join(privDir, '.state.lock');
if (!DRY && fs.existsSync(LOCK)) {
  const pid = Number(fs.readFileSync(LOCK, 'utf8').trim()); let alive = false; try { process.kill(pid, 0); alive = true; } catch {}
  if (alive) { console.error(`REFUSED: ${ST} is already being fact-checked (pid ${pid}).`); process.exit(1); }
}
if (!DRY) { fs.writeFileSync(LOCK, String(process.pid)); process.on('exit', () => { try { if (fs.readFileSync(LOCK, 'utf8').trim() === String(process.pid)) fs.rmSync(LOCK); } catch {} }); }

const latestFor = (sec) => {
  if (!fs.existsSync(privDir)) return null;
  const f = fs.readdirSync(privDir).filter((n) => n.startsWith(sec + '-') && !n.includes('-CONTROL-') && n.endsWith('.json')).sort().pop();
  if (!f) return null;
  if (FRESH && f.slice(sec.length + 1) < SINCE) return null;
  const j = JSON.parse(fs.readFileSync(path.join(privDir, f), 'utf8'));
  return j.result && j.http_status === 200 ? { file: f, j } : null;
};
const worstCase = (sec) => {
  const r = spawnSync(process.execPath, [one, '--state', ST, '--section', sec, '--dry', '--max-usd', '1000', '--reasoning', EFFORT], { cwd: ROOT, encoding: 'utf8' });
  const m = (r.stdout || '').match(/(\d+) facts.*worst case \$([0-9.]+)/);
  return m ? { facts: +m[1], usd: +m[2] } : { facts: 0, usd: 0, error: (r.stderr || r.stdout).trim().slice(0, 200) };
};

let spent = 0, plannedWorst = 0;
const rows = [];
for (const sec of sections) {
  const done = latestFor(sec);
  if (done) { rows.push({ sec, reused: true, rec: done.j, file: done.file }); spent += done.j.usd_priced || 0; continue; }
  const w = worstCase(sec);
  plannedWorst += w.usd;
  if (DRY) { rows.push({ sec, dry: true, facts: w.facts, worst_usd: w.usd, error: w.error }); continue; }
  if (spent + w.usd > MAX) { console.log(`STOP before ${sec}: spent $${spent.toFixed(4)} + worst case $${w.usd.toFixed(3)} > cap $${MAX}`); rows.push({ sec, skipped: 'cap' }); break; }
  const r = spawnSync(process.execPath, [one, '--state', ST, '--section', sec, '--max-usd', String(MAX), '--reasoning', EFFORT], { cwd: ROOT, encoding: 'utf8', maxBuffer: 16 << 20 });
  const out = (r.stdout || '') + (r.stderr || '');
  const fm = out.match(/findings file: (\S+)/);
  const rec = fm ? JSON.parse(fs.readFileSync(path.join(ROOT, fm[1]), 'utf8')) : null;
  spent += rec?.usd_priced || 0;
  console.log(`  ${sec}: ${rec?.result ? rec.result.findings.length + ' findings, ' + JSON.stringify(rec.result.summary) : 'FAILED ' + out.trim().split('\n').pop().slice(0, 160)} · $${(rec?.usd_priced ?? 0).toFixed(4)}`);
  rows.push({ sec, rec, file: fm ? path.basename(fm[1]) : null, failed: !rec?.result });
}

if (DRY) {
  const facts = rows.reduce((t, r) => t + (r.facts || 0), 0);
  console.log(`${ST} DRY: ${sections.length} sections, ${facts} facts, worst case total $${plannedWorst.toFixed(3)} (already done: ${rows.filter((r) => r.reused).length}, $${spent.toFixed(4)})`);
  process.exit(0);
}

// ---- report ----
const done = rows.filter((r) => r.rec?.result);
const tally = { supported: 0, partially_supported: 0, not_found_on_page: 0, contradicted: 0 };
let facts = 0, tin = 0, tout = 0;
const flagged = [];
const perSection = done.map((r) => {
  const s = r.rec.result.summary; for (const k of Object.keys(tally)) tally[k] += s[k] || 0;
  facts += r.rec.result.findings.length; tin += r.rec.usage?.prompt_tokens || 0; tout += r.rec.usage?.completion_tokens || 0;
  for (const f of r.rec.result.findings) if (f.verdict !== 'SUPPORTED') flagged.push({ section: r.sec, fact_id: f.fact_id, verdict: f.verdict, issue: f.issue, suggested_fix: f.suggested_fix });
  return { section: r.sec, facts: r.rec.result.findings.length, summary: s, prompt_tokens: r.rec.usage?.prompt_tokens, completion_tokens: r.rec.usage?.completion_tokens, usd: r.rec.usd_priced, finish_reason: r.rec.finish_reason, reused: !!r.reused };
});
const usd = perSection.reduce((t, s) => t + (s.usd || 0), 0);
const perFact = facts ? usd / facts : 0;
// Fleet projection from the REAL cost per fact: independent-auditable states (non-Muse dossiers) and all 51.
const fleetFacts = (filter) => states.filter(filter).reduce((t, s) => {
  try { const q = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview', s.code === 'UT' ? 'data/ut' : s.data_root.replace(/\/real$/, ''), 'quarantine.json'), 'utf8')); return t + (q.total_cards || 0); } catch { return t; }
}, 0);
const allFacts = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/quarantine-summary.json'), 'utf8')).states.reduce((t, s) => t + (s.total_cards || 0), 0);
const museStates = states.filter((s) => /muse/i.test(s.authored_by || '')).map((s) => s.code);
const museFacts = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/quarantine-summary.json'), 'utf8')).states.filter((s) => museStates.includes(s.state)).reduce((t, s) => t + (s.total_cards || 0), 0);
const report = {
  schema_version: 'nova-fact-check-state-report.v1', generated_at: new Date().toISOString(), state: ST, run_id: st.run_id, auditor: 'muse-spark-1.3 (Meta Model API), one call per section, reasoning_effort ' + EFFORT,
  independent: !sameFamily, scope: 'compiled facts vs the handbook pages they cite (card backs are byte copies of these facts); exam items and lesson narration not checked in this pass',
  sections_total: sections.length, sections_done: done.length, facts_checked: facts, tally, flagged_count: flagged.length,
  cost: { exact_usd: Number(usd.toFixed(4)), prompt_tokens: tin, completion_tokens: tout, usd_per_fact: Number(perFact.toFixed(6)), price_basis: 'contracts/meta-pricing-snapshot.v0.4.0.json (priced from reported tokens)' },
  projection: { all_51_facts: allFacts, all_51_usd: Number((allFacts * perFact).toFixed(2)), independent_by_muse_facts: allFacts - museFacts, independent_by_muse_usd: Number(((allFacts - museFacts) * perFact).toFixed(2)), muse_authored_states_need_claude_or_sol: museStates },
  per_section: perSection, flagged,
};
const outDir = path.join(ROOT, 'coordination/FACT-CHECK', ST);
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2) + '\n');
const md = [
  `# Fact check — ${st.name} (${ST}), Muse one call per section`, '',
  `Run ${st.run_id}. Auditor muse-spark-1.3 via the Meta Model API${sameFamily ? ' — NOT independent (Muse wrote these dossiers)' : ' — independent of the authors'}. ${report.scope}.`, '',
  '| Measure | Value |', '|---|---|',
  `| Sections checked | ${done.length} of ${sections.length} |`, `| Facts checked | ${facts} |`,
  `| Supported | ${tally.supported} |`, `| Partially supported | ${tally.partially_supported} |`, `| Not found on cited page | ${tally.not_found_on_page} |`, `| Contradicted | ${tally.contradicted} |`,
  `| Exact cost | $${usd.toFixed(4)} (${tin.toLocaleString()} input + ${tout.toLocaleString()} output tokens) |`, `| Cost per fact | $${perFact.toFixed(5)} |`,
  `| Projection, all 51 (${allFacts.toLocaleString()} facts) | $${report.projection.all_51_usd} |`,
  `| Projection, states Muse can audit independently (${(allFacts - museFacts).toLocaleString()} facts) | $${report.projection.independent_by_muse_usd} |`, '',
  `States Muse cannot audit independently (Claude or Sol must): ${museStates.join(' ')}.`, '',
  '## Per section', '', '| Section | Facts | Supported | Flagged | Tokens in / out | Cost |', '|---|---|---|---|---|---|',
  ...perSection.map((s) => `| ${s.section} | ${s.facts} | ${s.summary.supported} | ${s.facts - s.summary.supported} | ${s.prompt_tokens} / ${s.completion_tokens} | $${(s.usd || 0).toFixed(4)} |`), '',
  '## Findings to resolve (any verdict other than SUPPORTED)', '',
  ...(flagged.length ? ['| Fact | Verdict | Issue | Suggested fix |', '|---|---|---|---|', ...flagged.map((f) => `| ${f.fact_id} | ${f.verdict} | ${String(f.issue).replace(/\|/g, '/')} | ${String(f.suggested_fix).replace(/\|/g, '/')} |`)] : ['None.']), '',
  'Full findings with verbatim handbook quotes: runs/' + st.run_id + '/sources/private/audits/muse-fact-check/ (private, gitignored).', '',
];
fs.writeFileSync(path.join(outDir, 'report.md'), md.join('\n'));
console.log(`\n${ST}: ${done.length}/${sections.length} sections, ${facts} facts, flagged ${flagged.length}; exact $${usd.toFixed(4)} ($${perFact.toFixed(5)}/fact); all-51 projection $${report.projection.all_51_usd}; report coordination/FACT-CHECK/${ST}/report.md`);
