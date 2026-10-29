// export-content.mjs — preview-lane content exporter (Muse Code, preview lane).
//
// Copies ONLY accepted learner-stage artifacts into the dev preview:
// ledger tasks (read READ-ONLY via node:sqlite {readOnly:true}, exactly as
// export-trace.mjs does) whose status is `accepted`, stage_id in
// {02.dossier_sections, 03.combined_kg, 04.cards, 05.sessions,
//  05.card_scripts, 06.exam_bank}, kind = stage_output.
//
// Each artifact.json lands at:
//   app-preview/data/real/<stage>/<task_id>__<attempt_id>.json
// plus app-preview/data/real/manifest.json listing every copied file with
// its sha256 (recomputed at copy time) and ledger status. Files for tasks
// that later leave `accepted` are removed on the next run, so the preview
// can never show a stale non-accepted artifact as real.
//
// Makes NO network requests and NO model calls. Never prints secrets.
// Anything not copied stays synthetic in the app by design.
//
// Usage: node tools/preview/export-content.mjs [--run <run-id>] [--out <dir>]
//          [--embed <file>] [--label <handbook label>]
// Defaults export Utah exactly as before (run 2026-10-26-rdmv-ut-class-d ->
// app-preview/data/real + app-preview/data-real-embedded.js). Another state
// for the multi-state shell (app-preview/data/states.json):
//   node tools/preview/export-content.mjs --run <run-id> --out app-preview/data/<xx>/real
//     --embed app-preview/data/<xx>/real-embedded.js --label "<State> Driver Handbook"
// Manifest file paths are written relative to app-preview/ (data/<xx>/real/...),
// so the app resolves them through the state's data_root.
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const RUN_ID = opt('--run', '2026-10-26-rdmv-ut-class-d');
const OUT_DIR = path.resolve(ROOT, opt('--out', 'app-preview/data/real'));
const RUN_DIR = path.join(ROOT, 'runs', RUN_ID);
const APP_DIR = path.join(ROOT, 'app-preview');
const EMBED_FILE = path.resolve(ROOT, opt('--embed', 'app-preview/data-real-embedded.js'));
const LABEL = opt('--label', 'Utah Driver Handbook');
// Prefix of every manifest file path, relative to app-preview/ ("data/real/" for Utah).
const FILE_PREFIX = path.relative(APP_DIR, OUT_DIR).split(path.sep).join('/') + '/';
// The prune step below deletes unlisted files under OUT_DIR, so OUT_DIR must
// be a dedicated ".../real" folder inside app-preview/ (never app-preview/ or audio/).
if (FILE_PREFIX.startsWith('../') || path.isAbsolute(FILE_PREFIX) || path.basename(OUT_DIR) !== 'real') {
  console.error('--out must be a dedicated "real" folder inside app-preview/ (e.g. app-preview/data/<xx>/real)');
  process.exit(2);
}

// Learner stages whose outputs the preview may render. Registration (15),
// compile (16) and QA (07/08) outputs are reviewer material, not learner
// content, and are never copied here.
const LEARNER_STAGES = new Set([
  '02.dossier_sections',
  '03.combined_kg',
  '04.cards',
  '05.sessions',
  '05.card_scripts',
  '06.exam_bank',
]);

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex');
const stageDir = (stageId) => stageId.replace(/[^A-Za-z0-9]+/g, '_');

const db = new DatabaseSync(path.join(RUN_DIR, 'ledger', 'run.sqlite'), { readOnly: true });
const tasks = db.prepare('SELECT *, identity_json FROM tasks WHERE run_id = ?').all(RUN_ID);
// Section each task belongs to: config.section_ids[0] when present, else the
// first secNN slug in the identity JSON, else "unknown". Lets the preview
// group per-task export files by handbook section.
const sectionOf = (task) => {
  try {
    const id = JSON.parse(task.identity_json || '{}');
    const fromConfig = id && id.config && id.config.section_ids && id.config.section_ids[0];
    if (fromConfig) return fromConfig;
    const m = (task.identity_json || '').match(/sec\d\d[a-z-]*/);
    if (m) return m[0];
  } catch { /* fall through to unknown */ }
  return 'unknown';
};
const sectionByTask = new Map(tasks.map((t) => [t.task_id, sectionOf(t)]));
const attempts = db.prepare('SELECT * FROM attempts WHERE run_id = ?').all(RUN_ID);
const artifacts = db.prepare('SELECT * FROM artifacts WHERE run_id = ?').all(RUN_ID);
db.close();

const attemptById = new Map(attempts.map((a) => [a.attempt_id, a]));
const copied = [];
const skipped = [];
const wanted = new Set(); // relative paths that should exist after this run

// Re-mints (2026-10-28 re-author pass): a retry-nonce bump mints a NEW logical
// task for the same stage+section and the older task stays `accepted` in the
// ledger. The preview must show exactly one artifact per stage+section — the
// newest accepted task — or the old garbled deck sits next to the refreshed one.
// Tasks whose section cannot be determined are never collapsed.
// 02.dossier_sections is the exception (fix 2026-10-29): a section legitimately has one accepted task
// PER DOSSIER PART (C, C2, A, B, ...), or one COMPLETE envelope (config.dossier_parts = []) that replaces
// them. Key 02 by section + part list; a part task older than the section's newest complete envelope is
// superseded by it.
const partsOf = (task) => {
  try { const p = JSON.parse(task.identity_json || '{}')?.config?.dossier_parts; return Array.isArray(p) && p.length ? [...p].sort().join('+') : 'COMPLETE'; }
  catch { return 'COMPLETE'; }
};
const keyOf = (t, section) => t.stage_id + '|' + section + (t.stage_id === '02.dossier_sections' ? '|' + partsOf(t) : '');
const winners = new Map(); // key -> newest accepted task
for (const t of tasks) {
  if (t.status !== 'accepted' || !LEARNER_STAGES.has(t.stage_id)) continue;
  const section = sectionByTask.get(t.task_id) || 'unknown';
  if (section === 'unknown') continue;
  const key = keyOf(t, section);
  const cur = winners.get(key);
  if (!cur || String(t.created_at || '') > String(cur.created_at || '')) winners.set(key, t);
}
const supersededTask = (task) => {
  const section = sectionByTask.get(task.task_id) || 'unknown';
  if (section === 'unknown') return false;
  const w = winners.get(keyOf(task, section));
  if (w && w.task_id !== task.task_id) return true;
  if (task.stage_id === '02.dossier_sections' && partsOf(task) !== 'COMPLETE') {
    const complete = winners.get('02.dossier_sections|' + section + '|COMPLETE');
    if (complete && String(complete.created_at || '') > String(task.created_at || '')) return true;
  }
  return false;
};

for (const art of artifacts) {
  if (art.kind !== 'stage_output') continue;
  const attempt = attemptById.get(art.attempt_id);
  const task = tasks.find((t) => t.task_id === attempt?.task_id);
  if (!task || !attempt) { skipped.push({ artifact_id: art.artifact_id, reason: 'ledger task or attempt row missing' }); continue; }
  if (!LEARNER_STAGES.has(task.stage_id)) continue; // not learner content
  if (task.status !== 'accepted') {
    skipped.push({ artifact_id: art.artifact_id, stage_id: task.stage_id, task_status: task.status, reason: 'task not accepted — never copied' });
    continue;
  }
  if (supersededTask(task)) {
    skipped.push({ artifact_id: art.artifact_id, stage_id: task.stage_id, task_status: task.status, reason: 'superseded by a newer accepted task for the same stage+section (re-mint)' });
    continue;
  }
  const src = path.join(RUN_DIR, art.path);
  let buf;
  try {
    buf = fs.readFileSync(src);
  } catch {
    skipped.push({ artifact_id: art.artifact_id, stage_id: task.stage_id, reason: 'artifact file absent on disk: ' + art.path });
    continue;
  }
  JSON.parse(buf.toString('utf8')); // must be JSON before it can ship
  const rel = stageDir(task.stage_id) + '/' + task.task_id + '__' + attempt.attempt_id + '.json';
  wanted.add(rel);
  const dest = path.join(OUT_DIR, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  copied.push({
    file: FILE_PREFIX + rel.replace(/\\/g, '/'),
    stage_id: task.stage_id,
    section_id: sectionByTask.get(task.task_id) || 'unknown',
    task_id: task.task_id,
    attempt_id: attempt.attempt_id,
    lineage_id: task.lineage_id,
    task_status: task.status,
    artifact_id: art.artifact_id,
    sha256: sha256(buf),
    bytes: buf.length,
  });
}

// Prune previously copied files whose tasks are no longer accepted.
const prune = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { prune(p); continue; }
    if (f.name === 'manifest.json') continue;
    if (!wanted.has(path.relative(OUT_DIR, p).replace(/\\/g, '/'))) fs.rmSync(p);
  }
};
prune(OUT_DIR);

const manifest = {
  manifest_format: 'preview-real-content.v1',
  run_id: RUN_ID,
  exported_at: new Date().toISOString(),
  exporter: 'tools/preview/export-content.mjs (read-only ledger export, accepted-only, no model calls)',
  policy: 'only ledger tasks with status accepted in learner stages are copied; everything else stays synthetic',
  files: copied,
  skipped_non_accepted: skipped.length,
  banner_real: 'REAL — ' + LABEL + ', validated, audit pending',
  banner_synthetic: 'SYNTHETIC SAMPLE — not ' + LABEL.replace(/ Driver Handbook$/, '') + ' content',
};
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// file:// fallback: embed the manifest plus every copied artifact so the
// dossier route works when opened via double-click (fetch blocked).
const embeddedFiles = {};
for (const c of copied) {
  const rel = c.file.slice(FILE_PREFIX.length);
  embeddedFiles[rel] = JSON.parse(fs.readFileSync(path.join(OUT_DIR, rel), 'utf8'));
}
const embedded = '// GENERATED by tools/preview/export-content.mjs — identical content fallback for file:// opens.\n'
  + '// Regenerate after re-running: node tools/preview/export-content.mjs.\n'
  + 'window.__REAL_EMBEDDED = ' + JSON.stringify({ manifest, files: embeddedFiles }) + ';\n';
fs.mkdirSync(path.dirname(EMBED_FILE), { recursive: true });
fs.writeFileSync(EMBED_FILE, embedded);
console.log('copied=' + copied.length + ' skipped_non_accepted=' + skipped.length + ' -> ' + path.relative(ROOT, OUT_DIR) + '/manifest.json');
