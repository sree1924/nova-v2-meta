#!/usr/bin/env node
// onboard-state.mjs — put a belt-finished state into the multi-state shell (app-preview).
//
//   node tools/preview/onboard-state.mjs --state MI --run 2026-10-28-rdmv-mi-class-std [--name Michigan]
//     [--handbook "What Every Driver Must Know (October 2025)"] [--test "Operator license knowledge test"]
//     [--authored-by "claude-opus-5-5 via Anthropic subscription (belt file transport)"] [--dry]
//
// Steps (all local, no network, no model calls):
//   1. export-content.mjs --run <run> --out app-preview/data/<xx>/real --embed app-preview/data/<xx>/real-embedded.js
//      (copies ONLY ledger-accepted learner artifacts; re-runnable; removes files that left `accepted`).
//   2. chapters from run-config scope.section_page_ranges (handbook order) + scope.section_titles (shortened for the picker).
//   3. status from the export manifest: complete = every section has accepted 03/04/06/05.sessions/05.card_scripts;
//      building = some downstream accepted; sme_only = none yet. Never claims complete from file presence alone.
//   4. states.json entry upserted (UT entry never touched), then embed-states.mjs regenerates states-embedded.js.
// Audio: new states have no minted narration until the founder's "audio go"; the shell tolerates a missing audio manifest
// (narration shows as written copy). audio_root / audio_manifest are reserved under audio/<xx>/.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (k, d = null) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const DRY = args.includes('--dry');
const WITH_EMBED = args.includes('--with-embed'); // embedded copies are ~5 MB per state; the served demo fetches data_root, so default off
const ST = (opt('--state') || '').toUpperCase();
const RUN = opt('--run');
if (!/^[A-Z]{2}$/.test(ST) || !RUN) { console.error('usage: --state XX --run <run_id>'); process.exit(2); }
if (ST === 'UT') { console.error('Utah is onboarded by hand (data/real + audio); refusing'); process.exit(2); }
const xx = ST.toLowerCase();
const runDir = path.join(ROOT, 'runs', RUN);
const cfg = JSON.parse(fs.readFileSync(path.join(runDir, 'run-config.json'), 'utf8'));
const STATE_NAMES = {AL: 'Alabama', AZ: 'Arizona', CA: 'California', CO: 'Colorado', FL: 'Florida', IN: 'Indiana', MD: 'Maryland', MI: 'Michigan', MN: 'Minnesota', MO: 'Missouri', NC: 'North Carolina', NJ: 'New Jersey', NV: 'Nevada', NY: 'New York', OR: 'Oregon', SC: 'South Carolina', TN: 'Tennessee', TX: 'Texas', VA: 'Virginia', WA: 'Washington', WI: 'Wisconsin', UT: 'Utah'};
const name = opt('--name') || STATE_NAMES[ST] || ST;

// 1. export accepted artifacts
const outRel = `app-preview/data/${xx}/real`;
const embedRel = `app-preview/data/${xx}/real-embedded.js`;
const label = opt('--handbook') || cfg.scope?.handbook_edition?.split(' (')[0] || `${name} driver handbook`;
if (!DRY) {
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/preview/export-content.mjs'), '--run', RUN, '--out', outRel, '--embed', embedRel, '--label', `${name}: ${label}`], {cwd: ROOT, encoding: 'utf8'});
  if (r.status !== 0) { console.error(r.stdout, r.stderr); process.exit(r.status ?? 1); }
  process.stdout.write(r.stdout.split('\n').filter((l) => /copied=/.test(l)).join('\n') + '\n');
  // export-content's --embed DEFAULTS to app-preview/data-real-embedded.js (Utah's file) when omitted — always pass the
  // state's own path, then drop it unless --with-embed (2026-10-28: an omitted --embed clobbered Utah's embedded copy).
  if (!WITH_EMBED) fs.rmSync(path.join(ROOT, embedRel), {force: true});
}
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, outRel, 'manifest.json'), 'utf8'));

// 2. chapters in handbook order
const ranges = cfg.scope?.section_page_ranges || {};
const titles = cfg.scope?.section_titles || {};
// Picker titles: the run-config titles are long comma lists ("Air bags, seat belts, child restraints, …"); keep the list
// up to ~64 characters, cutting at a comma or word boundary, never just the first item (which lost the chapter's meaning).
const shorten = (t, id) => {
  let s = String(t || '').replace(/\s*\([^)]*\)/g, '').split(';')[0].trim();
  if (!s) s = id.replace(/^sec\d+-?/, '').split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  if (s.length > 64) {
    const cut = s.slice(0, 64);
    const at = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf(' '));
    s = cut.slice(0, at > 24 ? at : 64).replace(/[,\s]+$/, '') + '…';
  }
  return s[0].toUpperCase() + s.slice(1);
};
const chapters = Object.keys(ranges).map((id, i) => ({id, n: i + 1, title: shorten(titles[id], id)}));

// 3. status from the manifest (accepted artifacts only)
const stages = ['03.combined_kg', '04.cards', '06.exam_bank', '05.sessions', '05.card_scripts'];
const bySec = {};
for (const f of manifest.files || []) { if (!bySec[f.section_id]) bySec[f.section_id] = new Set(); bySec[f.section_id].add(f.stage_id); }
const full = chapters.filter((c) => stages.every((s) => bySec[c.id]?.has(s)));
const any = chapters.filter((c) => stages.some((s) => bySec[c.id]?.has(s)));
const status = full.length === chapters.length && chapters.length ? 'complete' : any.length ? 'building' : 'sme_only';

// 4. upsert states.json
const statesPath = path.join(ROOT, 'app-preview/data/states.json');
const states = JSON.parse(fs.readFileSync(statesPath, 'utf8'));
const prev = states.find((s) => s.code === ST) || {};
const entry = {
  code: ST, name, run_id: RUN,
  handbook: opt('--handbook') || prev.handbook || label,
  test: opt('--test') || prev.test || cfg.scope?.exam_name || 'Knowledge test',
  data_root: `data/${xx}/real`, audio_root: `audio/${xx}`, audio_manifest: `audio/${xx}/audio-manifest.json`,
  status,
  authored_by: opt('--authored-by') || prev.authored_by || 'claude-opus-5-5 via Anthropic subscription (belt file transport)',
  ...(WITH_EMBED ? {content_embedded: `data/${xx}/real-embedded.js`} : {}),
  chapters,
  note: status === 'complete'
    ? `${chapters.length} handbook chapters belt-accepted through every learner stage (knowledge graph, flashcards, exam bank, lessons, narration scripts). Narration audio not yet minted.`
    : `${full.length}/${chapters.length} chapters through every learner stage; ${any.length} started. Belt downstream still running.`,
};
const idx = states.findIndex((s) => s.code === ST);
if (idx >= 0) states[idx] = {...prev, ...entry}; else states.push(entry);
if (!DRY) {
  fs.writeFileSync(statesPath, JSON.stringify(states, null, 2) + '\n');
  const e = spawnSync(process.execPath, [path.join(ROOT, 'tools/preview/embed-states.mjs')], {cwd: ROOT, encoding: 'utf8'});
  if (e.status !== 0) { console.error(e.stdout, e.stderr); process.exit(e.status ?? 1); }
}
console.log(JSON.stringify({state: ST, run: RUN, status, chapters: chapters.length, full_stack: full.length, started: any.length, files: (manifest.files || []).length, dry: DRY}));
