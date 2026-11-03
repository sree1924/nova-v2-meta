// image-sort.mjs — moves reviewed Terra images out of the flat drop folder by verdict and keeps the JSON in step:
//   ACCEPT                -> visuals/_approved/<file>
//   REJECT / HUMAN_REVIEW -> visuals/_quarantine_regen/<id>.<bad|review>-<slug>.png   (existing quarantine convention)
// Verdict = coordination/IMAGE-CHECK/results/<id>.json (Meta vision), overridden by coordination/IMAGE-CHECK/human-overrides.json
// ({ "<id>": "ACCEPT" | "REJECT" }) when present. Updates national-fleet-700-visual-catalog.json (status, output_path,
// on_disk_now, qa_note, review) and writes coordination/IMAGE-CHECK/DISPOSITION.json (one row per moved image).
// Only images that HAVE a result are touched; the merge pointer gains approved_directory so the merge keeps resolving them.
// Usage: node tools/audit/image-sort.mjs [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DRY = process.argv.includes('--dry');
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const APPROVED = path.join(VIS, '_approved');
const QUAR = path.join(VIS, '_quarantine_regen');
const RES = path.join(ROOT, 'coordination/IMAGE-CHECK/results');
const CATALOG = path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json');
const POINTER = path.join(ROOT, 'scratch/terra-dataset/terra-merge-pointer.json');
const DISP = path.join(ROOT, 'coordination/IMAGE-CHECK/DISPOSITION.json');
const OVR = path.join(ROOT, 'coordination/IMAGE-CHECK/human-overrides.json');
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'unspecified';

const overrides = fs.existsSync(OVR) ? JSON.parse(fs.readFileSync(OVR, 'utf8')) : {};
const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const byId = new Map(catalog.scenes.map((s) => [s.id, s]));
const disp = fs.existsSync(DISP) ? JSON.parse(fs.readFileSync(DISP, 'utf8')) : { schema_version: 'nova-image-disposition.v1', rows: [] };
const done = new Set(disp.rows.map((r) => r.id));
if (!DRY) { fs.mkdirSync(APPROVED, { recursive: true }); fs.mkdirSync(QUAR, { recursive: true }); }

const tally = { ACCEPT: 0, REJECT: 0, HUMAN_REVIEW: 0, skipped: 0 };
for (const f of fs.readdirSync(RES).filter((x) => x.endsWith('.json')).sort()) {
  const r = JSON.parse(fs.readFileSync(path.join(RES, f), 'utf8'));
  if (!r.result) { tally.skipped++; continue; }
  const src = path.join(VIS, r.file);
  if (!fs.existsSync(src)) { tally.skipped++; continue; }
  // A re-painted image: the id was filed before, but a NEW file sits in the drop folder with a newer result → round 2.
  const prior = disp.rows.filter((x) => x.id === r.id);
  if (prior.length) {
    const resultAt = fs.statSync(path.join(RES, f)).mtime.toISOString();
    if (resultAt <= prior[prior.length - 1].at) { tally.skipped++; continue; }
  }
  const round = prior.length + 1;
  const meta = r.result.overall;
  const human = overrides[r.id] ?? null;
  const final = human ?? meta;
  const fails = Object.entries(r.result.rules).filter(([, v]) => v.verdict === 'FAIL').map(([k]) => k);
  const reason = fails[0] || (r.result.teaching_correct.verdict !== 'CORRECT' ? 'teaching-' + r.result.teaching_correct.verdict.toLowerCase() : 'scene-' + r.result.scene_match.verdict.toLowerCase());
  let dest;
  if (final === 'ACCEPT') dest = path.join(APPROVED, r.file);
  else dest = path.join(QUAR, `${path.basename(r.file, '.png')}.${final === 'REJECT' ? 'bad' : 'review'}-${slug(reason)}.png`);
  tally[final]++;
  console.log(`${final.padEnd(12)} ${r.id}${human ? ' (human override of ' + meta + ')' : ''} -> ${path.relative(VIS, dest).replace(/\\/g, '/')}`);
  if (DRY) continue;
  fs.renameSync(src, dest);
  const s = byId.get(r.id);
  if (s) {
    s.status = final === 'ACCEPT' ? 'verified_pass_meta_vision' : final === 'REJECT' ? 'rejected_regen' : 'held_human_review';
    s.output_path = dest.replace(/\//g, '\\');
    s.on_disk_now = final === 'ACCEPT';
    s.qa_note = `${final} by Meta vision (${r.model_returned || r.model})${human ? ', human override' : ''}: ${r.result.summary}`;
    s.review = { verdict: final, meta_verdict: meta, human_override: human, scene_match: r.result.scene_match.verdict, teaching: r.result.teaching_correct.verdict, rule_failures: fails, result_file: `coordination/IMAGE-CHECK/results/${f}`, reviewed_at: new Date().toISOString() };
  }
  disp.rows.push({ id: r.id, round, verdict: final, meta_verdict: meta, human_override: human, from: path.relative(ROOT, src).replace(/\\/g, '/'), to: path.relative(ROOT, dest).replace(/\\/g, '/'), reason, usd: r.usd_priced, at: new Date().toISOString() });
}
if (!DRY) {
  const latest = [...new Map(disp.rows.map((x) => [x.id, x])).values()]; // last row per id wins
  catalog.summary.review_tally = { approved: latest.filter((x) => x.verdict === 'ACCEPT').length, rejected: latest.filter((x) => x.verdict === 'REJECT').length, held_human_review: latest.filter((x) => x.verdict === 'HUMAN_REVIEW').length, updated_at: new Date().toISOString() };
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(DISP, JSON.stringify(disp, null, 2) + '\n');
  const ptr = JSON.parse(fs.readFileSync(POINTER, 'utf8'));
  if (!ptr.terra_drop_contract.approved_directory) {
    ptr.terra_drop_contract.approved_directory = APPROVED.replace(/\\/g, '/');
    ptr.terra_drop_contract.approved_note = 'Reviewed-and-approved scenes live here (tools/audit/image-sort.mjs); the merge resolves approved_directory first, then drop_directory. Quarantined files never resolve (renamed with .bad-/.review- suffix).';
    fs.writeFileSync(POINTER, JSON.stringify(ptr, null, 2) + '\n');
  }
}
console.log(`${DRY ? 'DRY ' : ''}tally: approved ${tally.ACCEPT}, rejected ${tally.REJECT}, held ${tally.HUMAN_REVIEW}, skipped ${tally.skipped}; disposition rows ${disp.rows.length}`);
