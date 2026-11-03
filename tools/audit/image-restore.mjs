// image-restore.mjs — moves wrongly-quarantined images back to _approved and records why (false positive of a rule).
// Usage: node tools/audit/image-restore.mjs --ids drv-ref-a,drv-ref-b --reason "deterministic diagram: text is by design" [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry');
const ids = (opt('--ids') || '').split(',').filter(Boolean);
const reason = opt('--reason') || 'restored by coordinator';
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const APPROVED = path.join(VIS, '_approved');
const CATALOG = path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json');
const DISP = path.join(ROOT, 'coordination/IMAGE-CHECK/DISPOSITION.json');
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const byId = new Map(catalog.scenes.map((s) => [s.id, s]));
const disp = JSON.parse(fs.readFileSync(DISP, 'utf8'));
let n = 0;
for (const id of ids) {
  const rows = disp.rows.filter((r) => r.id === id), row = rows[rows.length - 1], s = byId.get(id);
  if (!row || !s || row.verdict === 'ACCEPT') { console.log(`skip ${id}: ${!row ? 'no row' : 'already ACCEPT'}`); continue; }
  const src = path.join(ROOT, row.to), dest = path.join(APPROVED, s.file);
  if (!fs.existsSync(src)) { console.log(`skip ${id}: missing ${row.to}`); continue; }
  console.log(`RESTORE ${id} (${row.verdict}: ${row.reason}) -> _approved/${s.file}`);
  n++;
  if (DRY) continue;
  fs.renameSync(src, dest);
  s.status = 'verified_pass_restored'; s.output_path = dest.replace(/\//g, '\\'); s.on_disk_now = true;
  s.qa_note = `RESTORED by coordinator (${reason}); earlier: ${s.qa_note || ''}`.slice(0, 600);
  s.review = { ...(s.review || {}), verdict: 'ACCEPT', human_override: 'RESTORE', restore_reason: reason, restored_at: new Date().toISOString() };
  disp.rows.push({ ...row, round: (row.round || 1) + 1, verdict: 'ACCEPT', meta_verdict: row.meta_verdict, human_override: 'RESTORE', from: row.to, to: path.relative(ROOT, dest).replace(/\\/g, '/'), reason: 'restore: ' + reason, at: new Date().toISOString() });
}
if (!DRY && n) { fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n'); fs.writeFileSync(DISP, JSON.stringify(disp, null, 2) + '\n'); }
console.log(`${DRY ? 'DRY ' : ''}restored ${n} of ${ids.length}`);
