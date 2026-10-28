#!/usr/bin/env node
// queue-status.mjs — one-line-per-state progress of the multi-state SME pass (dossier parts accepted / total, sections
// compiled, holds, launch liveness) read straight from disk. No model calls.
//   node tools/belt/queue-status.mjs [--json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const json = process.argv.includes('--json');
const runs = fs.readdirSync(path.join(LANE, 'runs')).filter((d) => /^2026-10-28-rdmv-[a-z]{2}-/.test(d)).sort();
const rows = [];
for (const run of runs) {
  const st = run.match(/rdmv-([a-z]{2})-/)[1].toUpperCase();
  const cfgPath = path.join(LANE, 'runs', run, 'run-config.json');
  if (!fs.existsSync(cfgPath)) continue;
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const sections = Object.keys(cfg.scope?.section_page_ranges || {}).length;
  const total = sections * 9;
  const done = path.join(LANE, 'runs', run, 'sources', 'private', 'muse-authoring', 'done');
  const files = fs.existsSync(done) ? fs.readdirSync(done) : [];
  const accepted = files.filter((f) => f.startsWith('02.dossier_sections__') && f.includes('.accepted.')).length;
  const held = files.filter((f) => f.startsWith('02.dossier_sections__') && f.includes('.HOLD.')).length;
  const compiled = fs.existsSync(path.join(LANE, 'runs', run, '16')) ? fs.readdirSync(path.join(LANE, 'runs', run, '16')).filter((d) => d.startsWith('sec')).length : 0;
  // downstream stages accepted per section (from the done/ folder names, no ledger open)
  const ds = {};
  for (const st of ['03.combined_kg', '04.cards', '06.exam_bank', '05.sessions', '05.card_scripts']) ds[st] = files.filter((f) => f.startsWith(st + '__') && f.includes('.accepted.')).length;
  const dsStr = Object.values(ds).some((n) => n) ? ' ds ' + ['03', '04', '06', '05s', '05c'].map((k, i) => k + Object.values(ds)[i]).join('/') : '';
  const logs = fs.readdirSync(path.join(LANE, 'coordination')).filter((f) => f.startsWith(`muse-launch-intake-${st}`) && f.endsWith('.jsonl')).map((f) => path.join(LANE, 'coordination', f));
  let live = 'no-launch';
  if (logs.length) {
    const newest = logs.map((f) => ({ f, m: fs.statSync(f).mtimeMs })).sort((a, b) => b.m - a.m)[0];
    const ageMin = (Date.now() - newest.m) / 60000;
    let tail = ''; try { const fd = fs.openSync(newest.f, 'r'); const size = fs.fstatSync(fd).size; const len = Math.min(size, 300000); const buf = Buffer.alloc(len); fs.readSync(fd, buf, 0, len, size - len); fs.closeSync(fd); tail = buf.toString('utf8'); } catch {}
    live = /quota exhausted/i.test(tail) ? '429' : /"payload_type":"run\.terminal/.test(tail) ? 'exited' : ageMin < 20 ? 'running' : 'stale';
  }
  const report = fs.existsSync(path.join(LANE, 'coordination', `MUSE-INTAKE-${st}-REPORT.md`));
  rows.push({ state: st, run, sections, compiled, accepted, total, held, downstream: ds, downstream_str: dsStr, pct: total ? Math.round((accepted / total) * 100) : 0, live, report });
}
rows.sort((a, b) => b.pct - a.pct);
if (json) { console.log(JSON.stringify({ at: new Date().toISOString(), rows }, null, 2)); process.exit(0); }
console.log(`SME pass status ${new Date().toISOString().slice(11, 16)}Z`);
console.log('state  parts        compiled  held  %    launch');
for (const r of rows) console.log(`${r.state.padEnd(6)} ${String(r.accepted).padStart(3)}/${String(r.total).padEnd(4)}     ${String(r.compiled).padStart(2)}/${String(r.sections).padEnd(2)}     ${String(r.held).padStart(2)}   ${String(r.pct).padStart(3)}%  ${r.live}${r.report ? ' +report' : ''}${r.downstream_str || ''}`);
const staged = fs.existsSync(path.join(LANE, 'runs/_intake/sources/private')) ? fs.readdirSync(path.join(LANE, 'runs/_intake/sources/private')).filter((f) => /^[A-Z]{2}\.pdf$/.test(f)).map((f) => f.slice(0, 2)) : [];
const started = new Set(rows.map((r) => r.state));
console.log(`queued (staged, not started): ${staged.filter((s) => !started.has(s) && s !== 'UT').join(' ') || 'none'}`);
