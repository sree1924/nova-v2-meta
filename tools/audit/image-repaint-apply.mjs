// image-repaint-apply.mjs — applies founder Keep/Reject decisions on RE-PAINTS (repaint.html), where the new picture lives in
// a re-paint dir (default _openai_repaint) and the old rejected picture sits in _quarantine_regen.
//   KEEP   -> <new>/<id>.png copied to _approved/<file>; old quarantine file(s) moved to _quarantine_regen/_superseded/;
//             flat drop-dir copy removed when byte-identical; catalog status verified_pass_human.
//   REJECT -> flat drop-dir copy removed; catalog stays rejected_regen (on fallback); attempt recorded.
// Usage: node tools/audit/image-repaint-apply.mjs --file coordination/IMAGE-CHECK/decisions-2026-11-01-r8.json [--new _openai_repaint] [--source "OpenAI gpt-image-1.5"] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const DRY = args.includes('--dry');
const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, opt('--file')), 'utf8'));
const decisions = raw.decisions ?? raw;
const SOURCE = opt('--source', 'OpenAI gpt-image-1.5');
const VIS = path.join(ROOT, 'scratch/video-samples/nd-all-lessons/visuals');
const NEW = path.join(VIS, opt('--new', '_openai_repaint'));
const APPROVED = path.join(VIS, '_approved');
const QUAR = path.join(VIS, '_quarantine_regen');
const SUPERSEDED = path.join(QUAR, '_superseded');
const CATALOG = path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json');
const DISP = path.join(ROOT, 'coordination/IMAGE-CHECK/DISPOSITION.json');
const RESULTS = path.join(ROOT, 'coordination/IMAGE-CHECK/results');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, '/');

const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
const byId = new Map(catalog.scenes.map((s) => [s.id, s]));
const disp = JSON.parse(fs.readFileSync(DISP, 'utf8'));
const rowById = new Map(disp.rows.map((r) => [r.id, r]));
const qFiles = fs.readdirSync(QUAR).filter((f) => f.endsWith('.png'));
if (!DRY) fs.mkdirSync(SUPERSEDED, { recursive: true });
const tally = { KEEP: 0, REJECT: 0, refused: 0 };
const now = new Date().toISOString();
for (const [id, dec] of Object.entries(decisions)) {
  const s = byId.get(id), row = rowById.get(id);
  const newF = path.join(NEW, id + '.png');
  if (!s || !row || !['KEEP', 'REJECT'].includes(dec) || !fs.existsSync(newF)) { console.log(`refused ${id} (${dec}): ${!s ? 'not in catalog' : !row ? 'no disposition' : !fs.existsSync(newF) ? 'no re-paint file' : 'bad decision'}`); tally.refused++; continue; }
  if (!String(s.status).startsWith('rejected')) { console.log(`refused ${id}: status ${s.status} is not a reject`); tally.refused++; continue; }
  const resP = path.join(RESULTS, id + '.json');
  const res = fs.existsSync(resP) ? JSON.parse(fs.readFileSync(resP, 'utf8')) : null;
  const newSha = sha(newF);
  if (res && res.image_sha256 !== newSha) { console.log(`refused ${id}: vision result is for a different file (BUG-006 guard)`); tally.refused++; continue; }
  const flat = path.join(VIS, id + '.png');
  const flatSame = fs.existsSync(flat) && sha(flat) === newSha;
  const olds = qFiles.filter((f) => f.startsWith(id + '.'));
  const attempt = { source: SOURCE, file: rel(newF), sha256: newSha, meta_verdict: res?.result?.overall ?? null, meta_rule_failures: res ? Object.entries(res.result?.rules ?? {}).filter(([, v]) => v.verdict === 'FAIL').map(([k]) => k) : null, founder: dec, at: now };
  tally[dec]++;
  if (dec === 'KEEP') {
    const dest = path.join(APPROVED, s.file);
    console.log(`KEEP   ${id} -> ${rel(dest)}  (supersedes ${olds.length} quarantine file${olds.length === 1 ? '' : 's'}${flatSame ? ', drop copy removed' : ''})`);
    if (!DRY) {
      fs.copyFileSync(newF, dest);
      for (const f of olds) fs.renameSync(path.join(QUAR, f), path.join(SUPERSEDED, f));
      if (flatSame) fs.unlinkSync(flat);
      s.status = 'verified_pass_human'; s.output_path = dest.replace(/\//g, '\\'); s.on_disk_now = true;
      s.qa_note = `KEEP by founder (${SOURCE} re-paint; Meta ${attempt.meta_verdict}): ${res?.result?.summary ?? ''}`.slice(0, 600);
      s.review = { ...(s.review || {}), verdict: 'ACCEPT', meta_verdict: attempt.meta_verdict, human_override: 'KEEP', rule_failures: attempt.meta_rule_failures, scene_match: res?.result?.scene_match?.verdict ?? null, teaching: res?.result?.teaching_correct?.verdict ?? null, result_file: rel(resP), reviewed_at: res?.at ?? now, human_reviewed_at: now, repaint: attempt };
      row.verdict = 'ACCEPT'; row.meta_verdict = attempt.meta_verdict; row.human_override = 'KEEP'; row.reason = 'human-keep-repaint'; row.from = rel(newF); row.to = rel(dest); row.human_at = now;
    }
  } else {
    console.log(`REJECT ${id}  stays on fallback (${olds.map((f) => f.slice(id.length + 1, -4)).join(', ')}${flatSame ? '; drop copy removed' : ''})`);
    if (!DRY) {
      if (flatSame) fs.unlinkSync(flat);
      s.qa_note = `re-paint REJECT (${SOURCE}; Meta ${attempt.meta_verdict}: ${(attempt.meta_rule_failures || []).join(',') || 'none'}): ${s.qa_note || ''}`.slice(0, 600);
      s.review = { ...(s.review || {}), repaint_attempts: [...(s.review?.repaint_attempts || []), attempt] };
      row.repaint_attempts = [...(row.repaint_attempts || []), attempt];
    }
  }
}
if (!DRY) {
  catalog.summary.review_tally = { approved: disp.rows.filter((x) => x.verdict === 'ACCEPT').length, rejected: disp.rows.filter((x) => x.verdict === 'REJECT').length, held_human_review: disp.rows.filter((x) => x.verdict === 'HUMAN_REVIEW').length, updated_at: now };
  fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2) + '\n');
  fs.writeFileSync(DISP, JSON.stringify(disp, null, 2) + '\n');
}
const st = {}; for (const s of catalog.scenes) st[s.status] = (st[s.status] || 0) + 1;
console.log(`${DRY ? 'DRY ' : ''}applied: keep ${tally.KEEP}, reject ${tally.REJECT}, refused ${tally.refused}`);
console.log('catalog statuses:', JSON.stringify(st));
