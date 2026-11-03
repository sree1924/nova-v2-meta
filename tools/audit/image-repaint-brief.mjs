// image-repaint-brief.mjs — writes the painter's re-paint brief from DISPOSITION.json REJECT rows:
// per image the catalog filename to drop as, what the reviewer saw, the rule/teaching failures, and the original prompt.
// Usage: node tools/audit/image-repaint-brief.mjs [--out coordination/TERRA-REPAINT-<n>-<date>.md]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const date = new Date().toISOString().slice(0, 10);
const allRows = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/IMAGE-CHECK/DISPOSITION.json'), 'utf8')).rows;
const rows = [...new Map(allRows.map((r) => [r.id, r])).values()].filter((r) => r.verdict === 'REJECT'); // latest row per id
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'scratch/terra-dataset/national-fleet-700-visual-catalog.json'), 'utf8'));
const byId = new Map(cat.scenes.map((s) => [s.id, s]));
const i = process.argv.indexOf('--out');
const OUT = path.resolve(ROOT, i >= 0 ? process.argv[i + 1] : `coordination/TERRA-REPAINT-${rows.length}-${date}.md`);

const items = rows.map((r) => {
  const s = byId.get(r.id);
  const res = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/IMAGE-CHECK/results', r.id + '.json'), 'utf8')).result;
  const fails = Object.entries(res.rules).filter(([, v]) => v.verdict === 'FAIL').map(([k, v]) => `${k}: ${v.note}`);
  return { id: r.id, file: s.file, slots: s.national_usage.total_slots, title: s.title, prompt: s.prompt, sees: res.what_i_see, fails, teach: res.teaching_correct, scene: res.scene_match, summary: res.summary };
}).sort((a, b) => b.slots - a.slots);

let md = `# Terra — ${items.length} re-paints (REJECT by review, ${date})

From: Fable (coordinator), on the founder's instruction. Founder: Sridhar.
Drop each new PNG into the flat \`scratch/video-samples/nd-all-lessons/visuals/\` folder under the ORIGINAL catalog
filename given below. The old \`.bad-\` file stays in \`_quarantine_regen/\` as history; the review pass will pick the
new file up. Ordered by how many learner slots the scene fills: fix the big ones first.

`;
for (const [n, r] of items.entries()) {
  md += `## ${n + 1}. ${r.id}  (slots: ${r.slots})
- **Drop as:** \`${r.file}\`
- **Title:** ${r.title}
- **What the reviewer saw:** ${r.sees}
${r.fails.length ? `- **Rule failures:** ${r.fails.join(' | ')}\n` : ''}${r.teach.verdict !== 'CORRECT' ? `- **Teaching ${r.teach.verdict}:** ${r.teach.note}\n` : ''}${r.scene.verdict !== 'MATCH' ? `- **Scene ${r.scene.verdict}:** ${r.scene.note}\n` : ''}- **Fix:** ${r.summary}
- **Original prompt:**
\`\`\`text
${r.prompt}
\`\`\`

`;
}
md += `Global rules (every image): ZERO text/letters/numbers; US right-hand traffic (yellow centerline on the LEFT of our lane,
white edge line on the RIGHT); no right-hand-drive cabins; no head-on cars sharing one lane; at most ONE lit lens per
traffic signal; 16:9; Neo-Pop cel-shaded style; exact catalog filename.
`;
fs.writeFileSync(OUT, md);
console.log(`${path.relative(ROOT, OUT)}: ${items.length} re-paints, ${items.reduce((s, r) => s + r.slots, 0)} learner slots`);
