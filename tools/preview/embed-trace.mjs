// embed-trace.mjs — preview-lane helper (Muse Code, preview lane).
//
// Regenerates app-preview/trace-embedded.js from app-preview/data/trace.json
// (written by export-trace.mjs) so trace.html shows current attempts when
// opened via file:// where fetch() is blocked. Makes no network requests,
// no model calls, never embeds secrets (trace.json already holds hashes only).
//
// Usage: node tools/preview/embed-trace.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = path.join(ROOT, 'app-preview', 'data', 'trace.json');
const OUT = path.join(ROOT, 'app-preview', 'trace-embedded.js');

const raw = fs.readFileSync(SRC, 'utf8');
const trace = JSON.parse(raw); // validates JSON before embedding
const embedded = '// GENERATED from app-preview/data/trace.json — identical content fallback for file:// opens.\n'
  + '// Regenerate after re-running: node tools/preview/export-trace.mjs, then node tools/preview/embed-trace.mjs.\n'
  + 'window.__TRACE_EMBEDDED = ' + JSON.stringify(trace) + ';\n';
fs.writeFileSync(OUT, embedded);
console.log('wrote app-preview/trace-embedded.js'
  + ' attempts=' + (trace.totals?.attempts ?? '?')
  + ' estimated_usd=' + (trace.totals?.estimated_usd ?? '?'));
