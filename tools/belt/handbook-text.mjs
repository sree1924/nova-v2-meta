#!/usr/bin/env node
// handbook-text.mjs — print a handbook PDF's page texts using the SAME local extractor role 15 registers with (pypdf +
// pdfplumber footer crop, no OCR, no network). For intake: section page maps, exam facts and passing-score pages must be
// read from these physical pages. Output is private handbook text: write it only under runs/<run>/sources/private/ or scratch.
//   node tools/belt/handbook-text.mjs <pdf> [--pages 1-20] [--grep "regex"] [--out file]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const { extractLocalPdf } = await import(pathToFileURL(path.join(ROOT, 'tools/roles/15-register.mjs')).href);
const args = process.argv.slice(2);
const pdf = args.find((a) => !a.startsWith('--'));
const get = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!pdf || !fs.existsSync(pdf)) { console.error('usage: node tools/belt/handbook-text.mjs <pdf> [--pages a-b] [--grep regex] [--out file]'); process.exit(2); }
const range = get('--pages'); const grep = get('--grep'); const out = get('--out');
const ex = await extractLocalPdf(path.resolve(pdf));
const pages = ex.pages || [];
let [a, b] = range ? range.split('-').map(Number) : [1, pages.length];
if (!b) b = a;
const re = grep ? new RegExp(grep, 'i') : null;
const lines = [`# ${path.basename(pdf)} · pages ${pages.length} · sha256 ${ex.sha256 ?? '-'} · extractor ${JSON.stringify(ex.tool_versions ?? ex.decoder ?? '-')}`];
for (const p of pages) {
  const n = p.pdf_page ?? p.page;
  if (n < a || n > b) continue;
  const text = String(p.text ?? '').replace(/\r/g, '');
  if (re && !re.test(text)) continue;
  if (re) { for (const l of text.split('\n')) if (re.test(l)) lines.push(`p${n} (printed ${p.printed_page ?? '?'}): ${l.trim().slice(0, 220)}`); }
  else lines.push(`\n=== PHYSICAL PDF PAGE ${n}; PRINTED ${p.printed_page ?? '?'} ===\n${text}`);
}
if (out) { fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true }); fs.writeFileSync(out, lines.join('\n') + '\n'); console.log(`wrote ${out} (${pages.length} pages)`); }
else console.log(lines.join('\n'));
