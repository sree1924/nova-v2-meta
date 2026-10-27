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
const tasks = db.prepare('SELECT * FROM tasks WHERE run_id = ?').all(RUN_ID);
const attempts = db.prepare('SELECT * FROM attempts WHERE run_id = ?').all(RUN_ID);
const artifacts = db.prepare('SELECT * FROM artifacts WHERE run_id = ?').all(RUN_ID);
db.close();

const attemptById = new Map(attempts.map((a) => [a.attempt_id, a]));
const copied = [];
const skipped = [];
const wanted = new Set(); // relative paths that should exist after this run

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
    file: 'data/real/' + rel.replace(/\\/g, '/'),
    stage_id: task.stage_id,
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
    if (!wanted.has(path.relative(OUT_DIR, p))) fs.rmSync(p);
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
  banner_real: 'REAL — Utah Section 9, validated, audit pending',
  banner_synthetic: 'SYNTHETIC SAMPLE — not Utah content',
};
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

// file:// fallback: embed the manifest plus every copied artifact so the
// dossier route works when opened via double-click (fetch blocked).
const embeddedFiles = {};
for (const c of copied) {
  const rel = c.file.replace(/^data\/real\//, '');
  embeddedFiles[rel] = JSON.parse(fs.readFileSync(path.join(OUT_DIR, rel), 'utf8'));
}
const embedded = '// GENERATED by tools/preview/export-content.mjs — identical content fallback for file:// opens.\n'
  + '// Regenerate after re-running: node tools/preview/export-content.mjs.\n'
  + 'window.__REAL_EMBEDDED = ' + JSON.stringify({ manifest, files: embeddedFiles }) + ';\n';
fs.writeFileSync(path.join(ROOT, 'app-preview', 'data-real-embedded.js'), embedded);
console.log('copied=' + copied.length + ' skipped_non_accepted=' + skipped.length + ' -> ' + path.relative(ROOT, OUT_DIR) + '/manifest.json');
