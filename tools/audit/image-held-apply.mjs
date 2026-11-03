// image-held-apply.mjs — applies the founder's Keep/Reject decisions on HUMAN_REVIEW images (from held.html).
//   KEEP   -> quarantine/<base>.review-*.png  moves to  _approved/<file>          (catalog status verified_pass_human)
//   REJECT -> quarantine/<base>.review-*.png  renamed to <base>.bad-human-reject.png (status rejected_regen; joins the re-paint brief)
// Updates the catalog and DISPOSITION.json rows (verdict, human_override, to). Unknown ids or ids not held are refused.
// Usage: node tools/audit/image-held-apply.mjs --decisions '{"drv-284-...":"KEEP","drv-57-...":"REJECT"}'   [--dry]
//        node tools/audit/image-held-apply.mjs --file decisions.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const DRY = args.includes('--dry');
const rawDec = opt('--file') ? JSON.parse(fs.readFileSync(path.resolve(ROOT, opt('--file')), 'utf8')) : JSON.parse(opt('--decisions') || '{}');
const decisions = rawDec.decisions ?? rawDec; // accept the server's wrapped HELD-DECISIONS.json or a flat map
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const APPROVED = path.join(VIS, '_approved');
const QUAR = path.join(VIS, '_quarantine_regen');
const CATALOG = path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json');
const DISP = path.join(ROOT, 'coordination/IMAGE-CHECK/DISPOSITION.json');

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const byId = new Map(catalog.scenes.map((s) => [s.id, s]));
const disp = JSON.parse(fs.readFileSync(DISP, 'utf8'));
const rowById = new Map(disp.rows.map((r) => [r.id, r]));
const tally = { KEEP: 0, REJECT: 0, refused: 0 };
for (const [id, dec] of Object.entries(decisions)) {
  const row = rowById.get(id), s = byId.get(id);
  // Eligible: HUMAN_REVIEW, or a Meta REJECT the founder has not ruled on yet (the held page shows single-lens-only rejects).
  // --allow-approved: the founder overrules a Meta ACCEPT (explicit reject of an approved image).
  const eligible = row && (row.verdict === 'HUMAN_REVIEW' || (row.verdict === 'REJECT' && !row.human_override) || (args.includes('--allow-approved') && row.verdict === 'ACCEPT' && dec === 'REJECT'));
  if (!row || !s || !eligible || !['KEEP', 'REJECT'].includes(dec)) { console.log(`refused ${id} (${dec}): ${!row ? 'no disposition' : !eligible ? 'not open (' + row.verdict + (row.human_override ? ', human ' + row.human_override : '') + ')' : 'bad decision'}`); tally.refused++; continue; }
  const src = path.join(ROOT, row.to);
  if (!fs.existsSync(src)) { console.log(`refused ${id}: file missing at ${row.to}`); tally.refused++; continue; }
  const dest = dec === 'KEEP' ? path.join(APPROVED, s.file) : path.join(QUAR, path.basename(s.file, '.png') + '.bad-human-reject.png');
  console.log(`${dec.padEnd(6)} ${id} -> ${path.relative(VIS, dest).replace(/\\/g, '/')}`);
  tally[dec]++;
  if (DRY) continue;
  fs.renameSync(src, dest);
  s.status = dec === 'KEEP' ? 'verified_pass_human' : 'rejected_regen';
  s.output_path = dest.replace(/\//g, '\\');
  s.on_disk_now = dec === 'KEEP';
  s.qa_note = `${dec} by founder (human review after Meta HUMAN_REVIEW): ${s.qa_note || ''}`.slice(0, 600);
  s.review = { ...(s.review || {}), verdict: dec === 'KEEP' ? 'ACCEPT' : 'REJECT', human_override: dec, human_reviewed_at: new Date().toISOString() };
  row.verdict = dec === 'KEEP' ? 'ACCEPT' : 'REJECT';
  row.human_override = dec;
  row.reason = dec === 'KEEP' ? 'human-keep' : 'human-reject';
  row.to = path.relative(ROOT, dest).replace(/\\/g, '/');
  row.human_at = new Date().toISOString();
}
if (!DRY) {
  catalog.summary.review_tally = { approved: disp.rows.filter((x) => x.verdict === 'ACCEPT').length, rejected: disp.rows.filter((x) => x.verdict === 'REJECT').length, held_human_review: disp.rows.filter((x) => x.verdict === 'HUMAN_REVIEW').length, updated_at: new Date().toISOString() };
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(DISP, JSON.stringify(disp, null, 2) + '\n');
}
console.log(`${DRY ? 'DRY ' : ''}applied: keep ${tally.KEEP}, reject ${tally.REJECT}, refused ${tally.refused}; still held ${disp.rows.filter((x) => x.verdict === 'HUMAN_REVIEW').length}`);
