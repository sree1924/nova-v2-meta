// Freeze a V1 reference run as the hackathon baseline: sha256 + bytes + mtime per artifact, array counts,
// and the source registry — read-only on the run, writes only under fb-ai-hackathon/baseline/<probe>/.
// Usage: node tools/freeze-baseline.mjs <run-dir> <probe-slug>
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const [runDir, probe] = process.argv.slice(2);
if (!runDir || !probe) { console.error('usage: freeze-baseline.mjs <run-dir> <probe-slug>'); process.exit(2); }

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'baseline', probe);
mkdirSync(outDir, { recursive: true });

// Belt artifacts only: NN-*.json / NN-*.md, plus the run's own learner-facing side files.
const ARTIFACT = /^(\d{2}[a-z]?-[a-z0-9-]+\.(json|md)|audio-segments\.json|current-facts\.json|english-practice\.json)$/i;
const files = readdirSync(runDir).filter(f => ARTIFACT.test(f) && !/backup/i.test(f)).sort();

const sha = buf => createHash('sha256').update(buf).digest('hex');
const arrayCounts = obj => {
  const out = {};
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      out[k] = v.length;
      // arrays of objects holding arrays (decks[*].cards, sessions[*].slides) → summed totals
      const inner = {};
      for (const el of v) if (el && typeof el === 'object') for (const [k2, v2] of Object.entries(el)) if (Array.isArray(v2)) inner[k2] = (inner[k2] ?? 0) + v2.length;
      for (const [k2, n] of Object.entries(inner)) out[`${k}[*].${k2}`] = n;
    }
    else if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v)) if (Array.isArray(v2)) out[`${k}.${k2}`] = v2.length;
    }
  }
  return out;
};

const artifacts = files.map(f => {
  const p = join(runDir, f);
  const buf = readFileSync(p);
  const st = statSync(p);
  const rec = { file: f, bytes: st.size, mtime: st.mtime.toISOString(), sha256: sha(buf) };
  if (f.endsWith('.json')) {
    try {
      const j = JSON.parse(buf.toString('utf8'));
      rec.schema_version = j.schema_version ?? null;
      rec.minted_by = j.minted_by ?? null;
      rec.counts = arrayCounts(j);
    } catch (e) { rec.parse_error = e.message; }
  }
  return rec;
});

let sources = null;
try {
  const sr = JSON.parse(readFileSync(join(runDir, '15-source-registry.json'), 'utf8'));
  sources = (sr.sources ?? []).map(s => ({
    id: s.id ?? s.source_id ?? null, title: s.title ?? s.name ?? null, url: s.url ?? null,
    tier: s.tier ?? s.source_tier ?? null, version: s.version ?? s.edition ?? s.accessed ?? s.retrieved_at ?? null,
  }));
} catch {}

const baseline = {
  kind: 'hackathon-baseline',
  probe,
  run_dir: runDir,
  frozen_at: new Date().toISOString(),
  frozen_by: 'fb-ai-hackathon/tools/freeze-baseline.mjs (Claude Code session 2bdcad95)',
  note: 'Pre-event record of the V1 reference as it exists on disk. Read-only; nothing in the run was modified. Historical PASS reports inside the run certify older bytes, not these — see INSTRUCTIONS.md "Recalculate baseline integrity".',
  artifact_count: artifacts.length,
  artifacts,
  sources,
  combined_sha256: sha(Buffer.from(artifacts.map(a => `${a.file}:${a.sha256}`).join('\n'))),
};

const outFile = join(outDir, 'BASELINE.json');
writeFileSync(outFile, JSON.stringify(baseline, null, 2));
console.log(`froze ${artifacts.length} artifacts → ${outFile}`);
console.log(`combined_sha256 ${baseline.combined_sha256}`);
for (const a of artifacts) console.log(`${a.sha256.slice(0, 12)}  ${String(a.bytes).padStart(8)}  ${a.file}  ${a.counts ? JSON.stringify(a.counts) : ''}`);
