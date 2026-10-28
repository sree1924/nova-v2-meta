#!/usr/bin/env node
// mark-current-compiles.mjs — write 16/<section>/CURRENT.json naming the ledger's LATEST ACCEPTED compile for that section
// (founder 2026-10-28: "keep new version only"). Accepted compiles are hash-pinned and immutable, so older versions stay on
// disk as history; this pointer is what humans and tools read to find the one that is current. Downstream stages already
// follow the ledger (latest accepted per stage+section), so this changes discoverability, not behavior.
//   node tools/belt/mark-current-compiles.mjs runs/<run> [runs/<run> ...]      (no args = every runs/2026-10-2*-rdmv-* dir)
import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

export function markCurrentCompiles(runRel) {
  const runDir = path.join(LANE, runRel);
  const dbPath = path.join(runDir, 'ledger', 'run.sqlite');
  if (!fs.existsSync(dbPath)) return [];
  const db = new DatabaseSync(dbPath, { readOnly: true });
  const out = [];
  try {
    const tasks = db.prepare("select task_id, identity_json, updated_at from tasks where stage_id='16.compile' and status='accepted' order by updated_at desc").all();
    const seen = new Set();
    for (const t of tasks) {
      let secs = []; try { secs = JSON.parse(t.identity_json)?.config?.section_ids || []; } catch {}
      const sec = secs[0] || 'sec09-rules-of-the-road';
      if (seen.has(sec)) continue;
      seen.add(sec);
      const art = db.prepare("select path, sha256 from artifacts where task_id=? and path like '%16-fact-registry.json'").get(t.task_id);
      if (!art) continue;
      const abs = path.isAbsolute(art.path) ? art.path : (fs.existsSync(path.join(runDir, art.path)) ? path.join(runDir, art.path) : path.join(LANE, art.path));
      if (!fs.existsSync(abs)) continue;
      const secRoot = path.join(runDir, '16', sec);
      if (!fs.existsSync(secRoot)) continue;
      const versionDir = path.relative(secRoot, path.dirname(abs)).replace(/\\/g, '/') || '.';
      const pointer = { current_version_dir: versionDir, fact_registry: path.relative(LANE, abs).replace(/\\/g, '/'), fact_registry_sha256: art.sha256, compiled_dossier: path.relative(LANE, path.join(path.dirname(abs), '16-compiled-dossier.json')).replace(/\\/g, '/'), accepted_at: t.updated_at, task_id: t.task_id, note: 'latest accepted compile per the ledger; other version dirs here are immutable history' };
      const file = path.join(secRoot, 'CURRENT.json');
      const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
      const next = JSON.stringify(pointer, null, 2) + '\n';
      if (prev !== next) fs.writeFileSync(file, next);
      out.push({ section: sec, version: versionDir, changed: prev !== next });
    }
  } finally { db.close(); }
  return out;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const runs = args.length ? args : fs.readdirSync(path.join(LANE, 'runs')).filter((d) => /^2026-10-2\d-rdmv-/.test(d) && fs.existsSync(path.join(LANE, 'runs', d, '16'))).map((d) => 'runs/' + d);
  for (const r of runs) {
    const res = markCurrentCompiles(r.replace(/\\/g, '/').replace(/\/$/, ''));
    const versioned = res.filter((x) => x.version !== '.');
    console.log(`${r}: ${res.length} sections marked${versioned.length ? ' · versioned: ' + versioned.map((x) => x.section.slice(0, 5) + '→' + x.version).join(' ') : ''}`);
  }
}
