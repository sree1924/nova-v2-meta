// Usage: node tools/preview/state-audit.mjs [--out coordination/STATE-COMPLETENESS-AUDIT-<date>.md]   (read-only; exit status not used)
// Per-state completeness audit: ledger (pointer of record) vs disk pointers vs shell export vs store mirror.
// Read-only. Prints one row per jurisdiction and writes a JSON + markdown report if --out <file.md> is given.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

import { fileURLToPath } from 'node:url';
const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = path.join(LANE, 'app-preview');
const STORE = path.join(LANE, 'store/public/app');
const outIdx = process.argv.indexOf('--out');
const OUT = outIdx > 0 ? process.argv[outIdx + 1] : null;
const ALL = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const LEARNER = ['03.combined_kg', '04.cards', '06.exam_bank', '05.sessions', '05.card_scripts'];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const statesRaw = JSON.parse(fs.readFileSync(path.join(APP, 'data/states.json'), 'utf8'));
const states = Array.isArray(statesRaw) ? statesRaw : (statesRaw.states || Object.values(statesRaw));
const quar = JSON.parse(fs.readFileSync(path.join(APP, 'data/quarantine-summary.json'), 'utf8'));
const hiddenBy = Object.fromEntries(quar.states.map((s) => [s.state, s.hidden]));
const queue = JSON.parse(fs.readFileSync(path.join(LANE, 'runs/_intake/QUEUE.json'), 'utf8')).queue;

const sectionOf = (t) => {
  try { const id = JSON.parse(t.identity_json || '{}'); const s = id?.config?.section_ids?.[0]; if (s) return s; } catch {}
  return ((t.identity_json || '').match(/sec\d\d[a-z0-9-]*/) || ['unknown'])[0];
};

const rows = [];
for (const code of ALL) {
  const st = states.find((s) => s.code === code);
  const r = { code, author: '', run: st?.run_id || '', problems: [] };
  const q = queue.find((x) => x.state === code);
  { const L = st?.authored_by || ''; const base = /^gpt-6.1-sol/.test(L) ? 'sol' : /^intake: gpt-6.1-sol/.test(L) ? 'sol+cloud' : /^Claude cloud/.test(L) ? 'cloud' : /^claude-opus/.test(L) ? 'claude' : /^SME dossiers: muse/.test(L) && /Claude cloud/.test(L) ? 'muse+cloud' : /^SME dossiers: muse/.test(L) ? 'muse+claude' : /Meta Model API/.test(L) ? 'muse-api' : '?'; r.author = base + (/refreshed by gpt-6.1-sol/.test(L) && base !== 'sol' ? '+solfix' : ''); }
  if (!st) { r.problems.push('not in states.json'); rows.push(r); continue; }
  if (st.status !== 'complete') r.problems.push('shell status ' + st.status);
  const runDir = path.join(LANE, 'runs', st.run_id);
  const dbPath = path.join(runDir, 'ledger/run.sqlite');
  if (!fs.existsSync(dbPath)) { r.problems.push('no ledger'); rows.push(r); continue; }
  const cfg = JSON.parse(fs.readFileSync(path.join(runDir, 'run-config.json'), 'utf8'));
  const secs = (cfg.scope.sections || Object.keys(cfg.scope.section_page_ranges || {})).map((x) => (typeof x === 'string' ? x : x.id));
  r.sections = secs.length;
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const tasks = db.prepare('SELECT task_id, stage_id, status, identity_json, accepted_artifact_id, created_at, updated_at FROM tasks').all();
  const arts = new Map(db.prepare('SELECT artifact_id, path, sha256 FROM artifacts').all().map((a) => [a.artifact_id, a]));
  // newest accepted task per stage+section (created_at), same rule as export-content.mjs
  const newest = new Map();
  for (const t of tasks) {
    if (t.status !== 'accepted') continue;
    const k = t.stage_id + '|' + sectionOf(t);
    const cur = newest.get(k);
    if (!cur || String(t.created_at) > String(cur.created_at)) newest.set(k, t);
  }
  // 1) ledger completeness + pointer of record (accepted_artifact_id resolves to a file on disk)
  let ledgerSlots = 0, ledgerOk = 0, ptrMissing = 0;
  for (const stg of ['16.compile', ...LEARNER]) for (const s of secs) {
    ledgerSlots++;
    const t = newest.get(stg + '|' + s);
    if (!t) { r.problems.push(`ledger: ${stg} ${s} not accepted`); continue; }
    ledgerOk++;
    const a = arts.get(t.accepted_artifact_id);
    if (!a) { ptrMissing++; r.problems.push(`ledger pointer: ${stg} ${s} accepted_artifact_id unresolved`); continue; }
    const abs = path.isAbsolute(a.path) ? a.path : path.join(runDir, a.path);
    if (!fs.existsSync(abs)) { ptrMissing++; r.problems.push(`ledger pointer: ${stg} ${s} artifact file missing ${a.path}`); }
  }
  r.ledger = `${ledgerOk}/${ledgerSlots}`;
  // 2) disk pointer CURRENT.json == ledger's newest accepted 16.compile
  let curOk = 0, curBad = 0;
  for (const s of secs) {
    const f = path.join(runDir, '16', s, 'CURRENT.json');
    const t = newest.get('16.compile|' + s);
    if (!fs.existsSync(f)) { curBad++; r.problems.push(`CURRENT.json missing ${s}`); continue; }
    const c = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (t && c.task_id !== t.task_id) { curBad++; r.problems.push(`CURRENT.json ${s} names ${String(c.task_id).slice(5, 13)} but ledger newest is ${t.task_id.slice(5, 13)}`); continue; }
    const reg = path.join(LANE, c.fact_registry || '');
    if (!c.fact_registry || !fs.existsSync(reg) || sha(reg) !== c.fact_registry_sha256) { curBad++; r.problems.push(`CURRENT.json ${s} registry file/sha mismatch`); continue; }
    curOk++;
  }
  r.pointers = `${curOk}/${secs.length}`;
  // 3) shell export == ledger newest accepted, exactly one per learner stage+section
  const manPath = path.join(APP, st.data_root, 'manifest.json');
  let expOk = 0, expSlots = 0;
  if (!fs.existsSync(manPath)) r.problems.push('shell manifest missing');
  else {
    const man = JSON.parse(fs.readFileSync(manPath, 'utf8'));
    for (const stg of LEARNER) for (const s of secs) {
      expSlots++;
      const files = (man.files || []).filter((f) => f.stage_id === stg && f.section_id === s);
      const t = newest.get(stg + '|' + s);
      if (files.length !== 1) { r.problems.push(`shell: ${stg} ${s} has ${files.length} artifacts`); continue; }
      if (t && files[0].task_id !== t.task_id) { r.problems.push(`shell: ${stg} ${s} exports older task`); continue; }
      const fp = path.join(APP, files[0].file.replace(/^\.?\//, ''));
      if (!fs.existsSync(fp) || sha(fp) !== files[0].sha256) { r.problems.push(`shell: ${stg} ${s} file/sha mismatch`); continue; }
      expOk++;
    }
    // 3b) SME dossier: per section, newest accepted task per part list; parts older than the newest
    //     COMPLETE envelope are superseded. Expected set computed from the ledger, compared to the export.
    const partsOf = (t) => { try { const p = JSON.parse(t.identity_json).config.dossier_parts; return Array.isArray(p) && p.length ? [...p].sort().join('+') : 'COMPLETE'; } catch { return 'COMPLETE'; } };
    const exp02 = new Map();
    for (const t of tasks) {
      if (t.stage_id !== '02.dossier_sections' || t.status !== 'accepted') continue;
      const k = sectionOf(t) + '|' + partsOf(t);
      const c = exp02.get(k);
      if (!c || String(t.created_at) > String(c.created_at)) exp02.set(k, t);
    }
    const want = new Set();
    for (const [k, t] of exp02) {
      const [s, p] = k.split('|');
      const comp = exp02.get(s + '|COMPLETE');
      if (p !== 'COMPLETE' && comp && String(comp.created_at) > String(t.created_at)) continue;
      want.add(t.task_id);
    }
    const got = new Set((man.files || []).filter((f) => f.stage_id === '02.dossier_sections').map((f) => f.task_id));
    const missing02 = [...want].filter((x) => !got.has(x)).length, extra02 = [...got].filter((x) => !want.has(x)).length;
    r.dossier = `${got.size - extra02}/${want.size}`;
    if (missing02 || extra02) r.problems.push(`dossier: ${missing02} part(s) missing, ${extra02} superseded part(s) exported`);
    const dossierSecs = new Set((man.files || []).filter((f) => f.stage_id === '02.dossier_sections').map((f) => f.section_id));
    if (secs.some((s) => !dossierSecs.has(s))) r.problems.push('dossier: a section has no dossier export');
    // 4) store mirror identical manifest
    const sm = path.join(STORE, st.data_root, 'manifest.json');
    r.store = fs.existsSync(sm) && sha(sm) === sha(manPath) ? 'same' : 'DIFF';
    if (r.store !== 'same') r.problems.push('store mirror manifest differs or missing');
  }
  r.shell = `${expOk}/${expSlots}`;
  r.hidden = hiddenBy[code] ?? '?';
  db.close();
  rows.push(r);
}

const pad = (s, n) => String(s).padEnd(n);
console.log(pad('ST', 4) + pad('author', 20) + pad('secs', 5) + pad('ledger', 10) + pad('pointers', 9) + pad('shell', 9) + pad('dossier', 9) + pad('store', 6) + pad('hidden', 7) + 'status');
for (const r of rows) console.log(pad(r.code, 4) + pad(r.author, 20) + pad(r.sections ?? '-', 5) + pad(r.ledger ?? '-', 10) + pad(r.pointers ?? '-', 9) + pad(r.shell ?? '-', 9) + pad(r.dossier ?? '-', 9) + pad(r.store ?? '-', 6) + pad(r.hidden ?? '-', 7) + (r.problems.length ? 'FAIL: ' + r.problems.slice(0, 2).join(' | ') + (r.problems.length > 2 ? ` (+${r.problems.length - 2})` : '') : 'OK'));
const fails = rows.filter((r) => r.problems.length);
console.log(`\n${rows.length - fails.length}/${rows.length} jurisdictions fully complete; ${fails.length} with problems`);
if (OUT) {
  const md = ['| State | Author | Sections | Ledger slots | Disk pointers | Shell slots | Store | Hidden | Status |', '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.code} | ${r.author} | ${r.sections ?? '-'} | ${r.ledger ?? '-'} | ${r.pointers ?? '-'} | ${r.shell ?? '-'} | ${r.store ?? '-'} | ${r.hidden} | ${r.problems.length ? 'FAIL: ' + r.problems.join('; ') : 'OK'} |`)];
  fs.writeFileSync(OUT, md.join('\n') + '\n');
  fs.writeFileSync(OUT.replace(/\.md$/, '.json'), JSON.stringify({ generated_at: new Date().toISOString(), rows }, null, 2) + '\n');
}
