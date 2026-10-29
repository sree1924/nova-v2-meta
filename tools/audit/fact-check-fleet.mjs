#!/usr/bin/env node
// fact-check-fleet.mjs — first-pass Muse fact check over every state (one pass, reasoning low), N states in parallel,
// under a fleet dollar cap. Muse-authored states run with --allow-same-family and are labelled NOT independent.
//
//   node tools/audit/fact-check-fleet.mjs [--max-usd 30] [--per-state-usd 2] [--parallel 4] [--states MI,TX]
//
// Stops launching new states once the logged spend (coordination/MUSE-API-SPEND.jsonl, this run only) reaches the cap.
// Writes coordination/FACT-CHECK/FLEET-SUMMARY.md + .json from the per-state reports.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const a = process.argv.slice(2);
const opt = (k, d) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : d; };
const CAP = Number(opt('--max-usd', '30')), PER = opt('--per-state-usd', '2'), PAR = Number(opt('--parallel', '4'));
const statesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/states.json'), 'utf8'));
let states = (Array.isArray(statesRaw) ? statesRaw : statesRaw.states);
if (opt('--states', null)) { const want = new Set(opt('--states').toUpperCase().split(',')); states = states.filter((s) => want.has(s.code)); }
// One fleet at a time (2026-10-29: two concurrent fleets re-sent ~400 sections, ~$13 duplicate spend).
const LOCK = path.join(ROOT, 'coordination/FACT-CHECK/.fleet.lock');
fs.mkdirSync(path.dirname(LOCK), { recursive: true });
if (fs.existsSync(LOCK)) {
  const pid = Number(fs.readFileSync(LOCK, 'utf8').trim());
  let alive = false; try { process.kill(pid, 0); alive = true; } catch {}
  if (alive) { console.error(`REFUSED: another fact-check fleet is running (pid ${pid}); wait for it or stop it first.`); process.exit(1); }
}
fs.writeFileSync(LOCK, String(process.pid));
process.on('exit', () => { try { if (fs.readFileSync(LOCK, 'utf8').trim() === String(process.pid)) fs.rmSync(LOCK); } catch {} });
const spendLog = path.join(ROOT, 'coordination/MUSE-API-SPEND.jsonl');
const startedAt = new Date().toISOString();
const spentSince = () => { if (!fs.existsSync(spendLog)) return 0; return fs.readFileSync(spendLog, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((j) => j.at >= startedAt).reduce((t, j) => t + (j.usd_priced || 0), 0); };
const queue = states.map((s) => s.code);
const results = {};
const runOne = (code) => new Promise((resolve) => {
  const st = states.find((s) => s.code === code);
  const args = [path.join(ROOT, 'tools/audit/fact-check-state.mjs'), '--state', code, '--max-usd', PER];
  if (/muse/i.test(st.authored_by || '')) args.push('--allow-same-family');
  const p = spawn(process.execPath, args, { cwd: ROOT });
  let out = ''; p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  p.on('close', (rc) => { const last = out.trim().split('\n').filter((l) => !/Warning|trace-warnings/.test(l)).pop() || ''; results[code] = { rc, last }; console.log(`${code} rc=${rc} :: ${last.slice(0, 200)} | fleet spend $${spentSince().toFixed(2)}`); resolve(); });
});
const workers = Array.from({ length: PAR }, async () => {
  while (queue.length) {
    if (spentSince() >= CAP) { console.log(`CAP reached ($${spentSince().toFixed(2)} >= $${CAP}); not launching ${queue.join(' ')}`); queue.length = 0; break; }
    await runOne(queue.shift());
  }
});
await Promise.all(workers);

// ---- fleet summary from the per-state reports ----
const rows = [];
for (const s of states) {
  const f = path.join(ROOT, 'coordination/FACT-CHECK', s.code, 'report.json');
  if (!fs.existsSync(f)) { rows.push({ code: s.code, missing: true }); continue; }
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  rows.push({ code: s.code, independent: r.independent, sections: `${r.sections_done}/${r.sections_total}`, facts: r.facts_checked, flagged: r.flagged_count, tally: r.tally, usd: r.cost.exact_usd });
}
const tot = rows.filter((r) => !r.missing).reduce((t, r) => ({ facts: t.facts + r.facts, flagged: t.flagged + r.flagged, usd: t.usd + r.usd }), { facts: 0, flagged: 0, usd: 0 });
const incomplete = rows.filter((r) => r.missing || (r.sections && r.sections.split('/')[0] !== r.sections.split('/')[1]));
fs.writeFileSync(path.join(ROOT, 'coordination/FACT-CHECK/FLEET-SUMMARY.json'), JSON.stringify({ generated_at: new Date().toISOString(), pass: 'first pass, one call per section, muse-spark-1.3 reasoning low', totals: tot, rows }, null, 2) + '\n');
const md = ['# Fact check — fleet first pass (Muse, one call per section)', '',
  `Generated ${new Date().toISOString()}. Each state's details: coordination/FACT-CHECK/<ST>/report.md.`, '',
  '| Measure | Value |', '|---|---|', `| States reported | ${rows.filter((r) => !r.missing).length} of ${states.length} |`, `| Facts checked | ${tot.facts.toLocaleString()} |`, `| Flagged | ${tot.flagged} |`, `| Exact cost (sum of state reports) | $${tot.usd.toFixed(2)} |`,
  `| Incomplete states | ${incomplete.length ? incomplete.map((r) => r.code + (r.sections ? ' ' + r.sections : ' none')).join(', ') : 'none'} |`, '',
  '| State | Independent | Sections | Facts | Flagged | Partially | Not on page | Contradicted | Cost |', '|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => r.missing ? `| ${r.code} | — | not run | | | | | | |` : `| ${r.code} | ${r.independent ? 'yes' : 'NO (Muse wrote the facts)'} | ${r.sections} | ${r.facts} | ${r.flagged} | ${r.tally.partially_supported} | ${r.tally.not_found_on_page} | ${r.tally.contradicted} | $${r.usd.toFixed(3)} |`), ''];
fs.writeFileSync(path.join(ROOT, 'coordination/FACT-CHECK/FLEET-SUMMARY.md'), md.join('\n'));
console.log(`\nFLEET: ${rows.filter((r) => !r.missing).length}/${states.length} states, ${tot.facts} facts, ${tot.flagged} flagged, $${tot.usd.toFixed(2)}; incomplete: ${incomplete.map((r) => r.code).join(' ') || 'none'}; this run spent $${spentSince().toFixed(2)}`);
