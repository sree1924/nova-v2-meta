#!/usr/bin/env node
// triage.mjs — sort every non-SUPPORTED fact-check finding into MEANING (the statement is wrong or incomplete) vs
// CITATION (the statement is right but its cited page is not the page that states it). Automatic, from the auditor's
// own issue text; a review aid, not a verdict. CONTRADICTED is always MEANING.
//   node tools/audit/triage.mjs   ->  coordination/FACT-CHECK/TRIAGE.md + TRIAGE.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(ROOT, 'coordination/FACT-CHECK');
const statesRaw = JSON.parse(fs.readFileSync(path.join(ROOT, 'app-preview/data/states.json'), 'utf8'));
const states = Array.isArray(statesRaw) ? statesRaw : statesRaw.states;
// Signals that the problem is WHERE the fact is printed, not WHAT it says.
const CITE = /(appears|stated|is|are|found|given|listed|printed|located|shown|continues|covered) on (the )?(an?other|previous|preceding|next|following|prior|earlier|later|adjacent|facing)? ?page|on page \d+[^.]*(not|rather than) (on )?(page )?\d+|page \d+ (does not|doesn't) (state|include|mention|contain)[^.]*(page \d+|elsewhere|another page|a different page)|ends mid|cut off|mid-sentence|split across|spans? (two|multiple|both) pages|other page|different page|cited page (only|alone)|alone (does not|doesn't) state|not on the cited page but|on the facing page/i;
const rows = [];
for (const s of states) {
  const f = path.join(DIR, s.code, 'report.json');
  if (!fs.existsSync(f)) continue;
  const r = JSON.parse(fs.readFileSync(f, 'utf8'));
  for (const g of r.flagged) {
    const kind = g.verdict === 'CONTRADICTED' ? 'MEANING' : CITE.test(`${g.issue} ${g.suggested_fix}`) ? 'CITATION' : 'MEANING';
    rows.push({ state: s.code, independent: r.independent, section: g.section, fact_id: g.fact_id, verdict: g.verdict, kind, issue: g.issue, suggested_fix: g.suggested_fix });
  }
}
const by = (k) => rows.filter((x) => x.kind === k);
const perState = states.map((s) => ({ state: s.code, meaning: rows.filter((x) => x.state === s.code && x.kind === 'MEANING').length, citation: rows.filter((x) => x.state === s.code && x.kind === 'CITATION').length, contradicted: rows.filter((x) => x.state === s.code && x.verdict === 'CONTRADICTED').length }));
fs.writeFileSync(path.join(DIR, 'TRIAGE.json'), JSON.stringify({ generated_at: new Date().toISOString(), method: 'regex on auditor issue text; review aid', totals: { flagged: rows.length, meaning: by('MEANING').length, citation: by('CITATION').length, contradicted: rows.filter((x) => x.verdict === 'CONTRADICTED').length }, per_state: perState, rows }, null, 2) + '\n');
const esc = (t) => String(t).replace(/\|/g, '/').replace(/\n/g, ' ');
const md = [
  '# Fact-check triage — fleet first pass', '',
  `${rows.length} flagged facts, sorted automatically from the auditor's issue note (review aid, not a verdict).`, '',
  '| Kind | Count | What it means | Fix path |', '|---|---|---|---|',
  `| MEANING | ${by('MEANING').length} | the statement is wrong, missing a condition/exception, or adds something the page does not say | re-author the fact through the belt (02 part → 16 compile → re-mint 04/05 scripts); hide the card meanwhile |`,
  `| CITATION | ${by('CITATION').length} | the statement is right but printed on a neighbouring page, or spans two pages | correct the cited page in the dossier; no learner-facing wording change |`,
  `| of which CONTRADICTED | ${rows.filter((x) => x.verdict === 'CONTRADICTED').length} | the page says the opposite | fix first |`, '',
  '## Per state', '', '| State | Meaning | Citation | Contradicted |', '|---|---|---|---|',
  ...perState.map((p) => `| ${p.state} | ${p.meaning} | ${p.citation} | ${p.contradicted} |`), '',
  '## Contradicted (fix first)', '', '| State | Fact | Issue | Suggested fix |', '|---|---|---|---|',
  ...rows.filter((x) => x.verdict === 'CONTRADICTED').map((x) => `| ${x.state} | ${x.fact_id} | ${esc(x.issue)} | ${esc(x.suggested_fix)} |`), '',
  '## Meaning findings', '', '| State | Fact | Verdict | Issue | Suggested fix |', '|---|---|---|---|---|',
  ...by('MEANING').filter((x) => x.verdict !== 'CONTRADICTED').map((x) => `| ${x.state} | ${x.fact_id} | ${x.verdict} | ${esc(x.issue)} | ${esc(x.suggested_fix)} |`), '',
  '## Citation findings', '', '| State | Fact | Issue |', '|---|---|---|',
  ...by('CITATION').map((x) => `| ${x.state} | ${x.fact_id} | ${esc(x.issue)} |`), '',
];
fs.writeFileSync(path.join(DIR, 'TRIAGE.md'), md.join('\n'));
console.log(`flagged ${rows.length}: MEANING ${by('MEANING').length} (contradicted ${rows.filter((x) => x.verdict === 'CONTRADICTED').length}), CITATION ${by('CITATION').length}`);
