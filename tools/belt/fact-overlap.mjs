#!/usr/bin/env node
// fact-overlap.mjs — measure how much accepted handbook knowledge is shared across belt runs (states), from the compiled
// fact registries (16-fact-registry.json, latest per section per run). Founder question 2026-10-28: "its drivers license ...
// same repetitive content" → this is the number that decides what a reuse layer is worth. Read-only, no model calls.
//   node tools/belt/fact-overlap.mjs [runs/<a> runs/<b> ...]      (default: every runs/*/ with a 16/ dir)
// Output: coordination/FACT-OVERLAP-<date>.md + .json. Levels: exact (normalized string equal), near (token Jaccard ≥ 0.6),
// numeric-twin (same sentence shape, different numbers — the state-specific class), unique.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const argRuns = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const NEAR = Number((process.argv.find((a) => a.startsWith('--near=')) || '--near=0.6').split('=')[1]);
const runs = (argRuns.length ? argRuns : fs.readdirSync(path.join(LANE, 'runs')).filter((d) => fs.existsSync(path.join(LANE, 'runs', d, '16'))).map((d) => 'runs/' + d))
  .map((r) => r.replace(/\\/g, '/').replace(/\/$/, ''));

const STOP = new Set('a an the of to in on at for and or is are be by with as from that this it its you your must may can if when not no do does'.split(' '));
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9%$. ]+/g, ' ').replace(/\s+/g, ' ').trim();
const shape = (s) => norm(s).replace(/\d+(\.\d+)?/g, '#');
const toks = (s) => new Set(norm(s).split(' ').filter((t) => t && !STOP.has(t)));
const jaccard = (A, B) => { let i = 0; for (const t of A) if (B.has(t)) i++; return i / (A.size + B.size - i || 1); };

function latestRegistries(run) {
  const base = path.join(LANE, run, '16');
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const sec of fs.readdirSync(base)) {
    const dir = path.join(base, sec);
    if (!fs.statSync(dir).isDirectory()) continue;
    // section dir holds the latest registry; versioned sub-dirs (hash names) are older compiles
    const f = path.join(dir, '16-fact-registry.json');
    if (!fs.existsSync(f)) continue;
    const reg = JSON.parse(fs.readFileSync(f, 'utf8'));
    const facts = Object.values(reg.facts || {}).map((x) => ({ id: x.fact_id, text: x.spoken_statement || x.statement || x.text || '' })).filter((x) => x.text);
    if (/^[0-9a-f]{8}$/.test(sec)) continue; // versioned compile dir, not a section
    out.push({ section: sec, facts });
  }
  return out;
}

const corpus = runs.map((run) => ({ run, sections: latestRegistries(run) })).filter((r) => r.sections.length);
if (corpus.length < 2) { console.error('need at least two runs with compiled registries; have ' + corpus.map((c) => c.run).join(', ')); process.exit(2); }
const flat = corpus.map((c) => ({ run: c.run, facts: c.sections.flatMap((s) => s.facts.map((f) => ({ ...f, section: s.section, n: norm(f.text), sh: shape(f.text), tk: toks(f.text) }))) }));

const pairs = [];
for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) {
  const A = flat[i], B = flat[j];
  const bByNorm = new Map(B.facts.map((f) => [f.n, f])), bByShape = new Map();
  for (const f of B.facts) if (!bByShape.has(f.sh)) bByShape.set(f.sh, f);
  let exact = 0, near = 0, twin = 0, unique = 0; const examples = { exact: [], near: [], twin: [] };
  for (const a of A.facts) {
    if (bByNorm.has(a.n)) { exact++; if (examples.exact.length < 3) examples.exact.push(a.text); continue; }
    const t = bByShape.get(a.sh);
    if (t && t.n !== a.n) { twin++; if (examples.twin.length < 3) examples.twin.push([a.text, t.text]); continue; }
    let best = 0, bestF = null; for (const b of B.facts) { const s = jaccard(a.tk, b.tk); if (s > best) { best = s; bestF = b; } }
    if (best >= NEAR) { near++; if (examples.near.length < 3) examples.near.push([a.text, bestF.text, +best.toFixed(2)]); } else unique++;
  }
  pairs.push({ a: A.run, b: B.run, a_facts: A.facts.length, b_facts: B.facts.length, exact, near, numeric_twin: twin, unique_to_a: unique,
    shared_pct: +(((exact + near + twin) / (A.facts.length || 1)) * 100).toFixed(1), examples });
}
const date = new Date().toISOString().slice(0, 10);
const outJson = path.join(LANE, 'coordination', `FACT-OVERLAP-${date}.json`), outMd = path.join(LANE, 'coordination', `FACT-OVERLAP-${date}.md`);
fs.writeFileSync(outJson, JSON.stringify({ generated_at: new Date().toISOString(), runs: flat.map((f) => ({ run: f.run, facts: f.facts.length })), pairs }, null, 2) + '\n');
const md = [`# Fact overlap across belt runs — ${date}`, '', 'Accepted fact statements (compiled registries, latest per section). exact = same normalized sentence; near = token Jaccard ≥ ' + NEAR + '; numeric-twin = same sentence with different numbers (the state-specific class); unique = nothing comparable.', '',
  '| run | facts |', '|---|---|', ...flat.map((f) => `| ${f.run} | ${f.facts.length} |`), '',
  '| A | B | A facts | exact | near | numeric-twin | unique to A | shared % of A |', '|---|---|---|---|---|---|---|---|',
  ...pairs.map((p) => `| ${p.a.replace('runs/', '')} | ${p.b.replace('runs/', '')} | ${p.a_facts} | ${p.exact} | ${p.near} | ${p.numeric_twin} | ${p.unique_to_a} | ${p.shared_pct}% |`), ''];
for (const p of pairs) {
  md.push(`## ${p.a.replace('runs/', '')} vs ${p.b.replace('runs/', '')}`);
  for (const e of p.examples.exact) md.push(`- exact: "${e}"`);
  for (const [a, b] of p.examples.twin) md.push(`- numeric-twin: "${a}" ↔ "${b}"`);
  for (const [a, b, s] of p.examples.near) md.push(`- near (${s}): "${a}" ↔ "${b}"`);
  md.push('');
}
fs.writeFileSync(outMd, md.join('\n'));
console.log(`fact overlap: ${flat.length} runs, ${pairs.length} pairs → ${path.relative(LANE, outMd)}`);
for (const p of pairs) console.log(`  ${p.a.replace('runs/', '')} vs ${p.b.replace('runs/', '')}: exact ${p.exact} near ${p.near} twin ${p.numeric_twin} unique ${p.unique_to_a} of ${p.a_facts} → shared ${p.shared_pct}%`);
