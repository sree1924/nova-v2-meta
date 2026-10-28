import fs from 'node:fs';
const o = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
for (const s of o.artifact.sections) {
  const md = s.markdown;
  console.log(s.chunk_id, 'cp:', [...md].length, 'blocks:', (md.match(/^\s*FACT_ID:/gm) || []).length);
}
