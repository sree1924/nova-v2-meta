#!/usr/bin/env node
// rebuild-private-sources.mjs — rebuild a run's gitignored private source companions on THIS machine, byte-exact,
// from the handbook PDF (2026-10-29). Needed when a state's intake ran elsewhere (a cloud session): the committed
// registry pins sources/private/15-source-text.txt and 15-extraction-receipt.json by sha256, but private files never
// leave the machine that made them.
//
//   node tools/belt/rebuild-private-sources.mjs --run runs/<run_id> --pdf runs/_intake/sources/private/<ST>.pdf [--python <path>] [--dry]
//
// Uses the registrar's own extractor (tools/roles/15-register.mjs extractLocalPdf) and its exact text/receipt formula.
// Refuses unless: the PDF sha256 equals the registered source hash, the extracted text sha256 equals the registry's
// extracted_text_sha256, and the page-map sha256 equals the committed 15-page-map.json. Never overwrites a differing file.
// Also places the PDF at run-config scope.handbook_local_snapshot when that path is absent (same bytes, verified).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256, jsonBytes } from './atomic-file.mjs';
import { extractLocalPdf, DEFAULT_PYTHON } from '../roles/15-register.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const a = process.argv.slice(2);
const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
const run = opt('--run'), pdf = opt('--pdf'), python = opt('--python') || DEFAULT_PYTHON, dry = a.includes('--dry');
if (!run || !pdf) { console.error('usage: --run runs/<run_id> --pdf <path to handbook PDF> [--python <path>] [--dry]'); process.exit(2); }
const runDir = path.join(ROOT, run);
const cfg = JSON.parse(fs.readFileSync(path.join(runDir, 'run-config.json'), 'utf8'));
const registry = JSON.parse(fs.readFileSync(path.join(runDir, '15-source-registry.json'), 'utf8'));
const pageMapBytes = fs.readFileSync(path.join(runDir, '15-page-map.json'));
const src = registry.sources?.[0] ?? {};
const fail = (m) => { console.error('REFUSED: ' + m); process.exit(1); };

const pdfBytes = fs.readFileSync(pdf);
const sourceHash = sha256(pdfBytes);
if (src.snapshot_hash && sourceHash !== src.snapshot_hash) fail(`PDF sha256 ${sourceHash.slice(0, 12)} != registered ${String(src.snapshot_hash).slice(0, 12)}`);
const pageMapHash = sha256(pageMapBytes);
if (src.page_map_sha256 && pageMapHash !== src.page_map_sha256) fail(`15-page-map.json sha256 ${pageMapHash.slice(0, 12)} != registry ${src.page_map_sha256.slice(0, 12)}`);

const extraction = await extractLocalPdf(path.resolve(pdf), { pythonPath: python });
const combinedText = extraction.pages.map((p) => `\n=== PHYSICAL PDF PAGE ${p.pdf_page}; PRINTED ${p.printed_page ?? 'UNOBSERVED'} ===\n${p.text}\n`).join('');
const sourceTextHash = sha256(Buffer.from(combinedText, 'utf8'));
// The pin lives in 15-registration-receipt.json (run root); also accept the registry or a receipts/15-* file.
const registeredText = (() => {
  const files = [path.join(runDir, '15-registration-receipt.json'), path.join(runDir, '15-source-registry.json'),
    ...(fs.existsSync(path.join(runDir, 'receipts')) ? fs.readdirSync(path.join(runDir, 'receipts')).filter((x) => /^15-/.test(x)).map((x) => path.join(runDir, 'receipts', x)) : [])];
  for (const f of files) { if (!fs.existsSync(f)) continue; const m = fs.readFileSync(f, 'utf8').match(/"extracted_text_sha256":\s*"([a-f0-9]{64})"/); if (m) return m[1]; }
  return null;
})();
if (!registeredText) fail('no registered extracted_text_sha256 found for this run');
if (sourceTextHash !== registeredText) fail(`extracted text sha256 ${sourceTextHash.slice(0, 12)} != registered ${registeredText.slice(0, 12)} (tool versions ${JSON.stringify(extraction.tool_versions)})`);

const emptyPages = extraction.pages.filter((p) => !p.text.trim()).map((p) => p.pdf_page);
const extractionReceipt = {
  schema_version: 'nova.local.source-text-extraction.v0.4.0', role_id: '15', run_id: cfg.run_id,
  status: emptyPages.length ? 'HOLD' : 'PASS',
  status_scope: 'text_extraction_only_not_source_liveness_or_rights_clearance',
  source_document_sha256: sourceHash, extracted_text_sha256: sourceTextHash,
  page_map_sha256: pageMapHash, page_count: extraction.page_count,
  image_only_physical_pages: emptyPages, tool_versions: extraction.tool_versions,
  method: 'pypdf text extraction and pdfplumber physical footer crop; no OCR',
};
const plan = [
  { rel: 'sources/private/15-source-text.txt', bytes: Buffer.from(combinedText, 'utf8') },
  { rel: 'sources/private/15-extraction-receipt.json', bytes: Buffer.from(jsonBytes(extractionReceipt)) },
];
const snap = cfg.scope?.handbook_local_snapshot;
if (snap) plan.push({ rel: path.relative(runDir, path.resolve(ROOT, snap)), bytes: pdfBytes, abs: path.resolve(ROOT, snap) });
for (const p of plan) {
  const dest = p.abs ?? path.join(runDir, p.rel);
  const h = sha256(p.bytes);
  if (fs.existsSync(dest)) { const cur = sha256(fs.readFileSync(dest)); console.log(`${cur === h ? 'same' : 'DIFFERS (left untouched)'} ${path.relative(ROOT, dest)} ${h.slice(0, 12)}`); continue; }
  if (dry) { console.log(`would write ${path.relative(ROOT, dest)} ${h.slice(0, 12)}`); continue; }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, p.bytes);
  console.log(`wrote ${path.relative(ROOT, dest)} ${h.slice(0, 12)}`);
}
console.log(`OK text ${sourceTextHash.slice(0, 12)} == registered; receipt ${sha256(plan[1].bytes).slice(0, 12)}; tools ${JSON.stringify(extraction.tool_versions)}`);
