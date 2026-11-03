// r2-ledger.mjs — per-file trace of the sealed payload against the live R2 bucket. Founder 2026-11-03: "video by video trace
// on hash else we loop trying to find what exists". Source of truth = the 52 manifests (cdn_key, bytes, sha256); the bucket is
// listed once (rclone lsjson, fast-list) and every manifest entry is classified: PRESENT (size matches), SIZE_MISMATCH, MISSING.
// Writes coordination/R2-LEDGER.json (every file) + coordination/R2-LEDGER.md (per-state table) + coordination/R2-MISSING.txt
// (rclone --files-from list of what still has to go, relative to the payload root). $0, read-only on the bucket.
// Usage: node tools/deploy/r2-ledger.mjs            (list bucket + classify)
//        node tools/deploy/r2-ledger.mjs --state nd  (one state's detail printed)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RCLONE = 'C:/Users/varad/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.2-windows-amd64/rclone.exe';
const args = process.argv.slice(2);
const STATE = (() => { const i = args.indexOf('--state'); return i >= 0 ? args[i + 1].toLowerCase() : null; })();
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const rcloneEnv = { ...process.env, RCLONE_CONFIG_R2_TYPE: 's3', RCLONE_CONFIG_R2_PROVIDER: 'Cloudflare', RCLONE_CONFIG_R2_ENDPOINT: env.R2_ENDPOINT,
  RCLONE_CONFIG_R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID, RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY, RCLONE_CONFIG_R2_NO_CHECK_BUCKET: 'true' };

// 1. live bucket listing: key -> size
const t0 = Date.now();
const ls = spawnSync(RCLONE, ['lsjson', '-R', '--files-only', '--fast-list', '--no-mimetype', '--no-modtime', `r2:${env.R2_BUCKET}`], { env: rcloneEnv, encoding: 'utf8', maxBuffer: 1 << 30 });
if (ls.status !== 0) { console.error('bucket listing failed:', (ls.stderr || '').slice(0, 400)); process.exit(2); }
const live = new Map();
for (const o of JSON.parse(ls.stdout || '[]')) live.set(o.Path, o.Size);
const listSec = Math.round((Date.now() - t0) / 1000);

// 2. manifests
const units = [];
const sm = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/FABLE-DROPOFF/shared/shared-manifest.json'), 'utf8'));
units.push({ unit: 'shared', root: 'coordination/FABLE-DROPOFF/payload/shared/app', files: (sm.files || sm.entries) });
const q = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/FABLE-DROPOFF/QUEUE-STATUS.json'), 'utf8'));
for (const s of q.states.sort((a, b) => a.queue_position - b.queue_position)) {
  const st = s.code.toLowerCase();
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, `coordination/FABLE-DROPOFF/states/${st}/cdn-manifest.json`), 'utf8'));
  units.push({ unit: st, root: `coordination/FABLE-DROPOFF/payload/states/${st}/app`, files: m.files });
}

// 3. classify
const ledger = [], rows = [], missingByRoot = new Map();
let tot = { files: 0, present: 0, missing: 0, mismatch: 0, bytes: 0, bytesPresent: 0 };
for (const u of units) {
  const r = { unit: u.unit, files: u.files.length, present: 0, missing: 0, mismatch: 0, bytes: 0, bytesPresent: 0, videos: 0, videosPresent: 0 };
  for (const f of u.files) {
    const key = f.cdn_key, size = live.get(key);
    const status = size === undefined ? 'MISSING' : size === f.bytes ? 'PRESENT' : 'SIZE_MISMATCH';
    const isVideo = /\.mp4$/.test(f.rel_path);
    r.bytes += f.bytes; if (isVideo) r.videos++;
    if (status === 'PRESENT') { r.present++; r.bytesPresent += f.bytes; if (isVideo) r.videosPresent++; }
    else { if (status === 'MISSING') r.missing++; else r.mismatch++; if (!missingByRoot.has(u.root)) missingByRoot.set(u.root, []); missingByRoot.get(u.root).push(f.rel_path); }
    ledger.push({ unit: u.unit, key, rel: f.rel_path, bytes: f.bytes, sha256: f.sha256, tier: f.access_tier, status, live_bytes: size ?? null });
  }
  rows.push(r);
  for (const k of ['files', 'present', 'missing', 'mismatch', 'bytes', 'bytesPresent']) tot[k] += r[k];
}
const extra = [...live.keys()].filter((k) => !ledger.some((e) => e.key === k)).length;

// 4. write
const at = new Date().toISOString();
fs.writeFileSync(path.join(ROOT, 'coordination/R2-LEDGER.json'), JSON.stringify({ at, bucket: env.R2_BUCKET, list_seconds: listSec, totals: tot, extra_objects_in_bucket: extra, files: ledger }) + '\n');
const gb = (b) => (b / 1e9).toFixed(2);
const pct = (a, b) => b ? Math.round(100 * a / b) + '%' : '-';
const md = [`# R2 ledger — bucket ${env.R2_BUCKET} @ ${at} (bucket listed in ${listSec}s)`, '',
  `**${tot.present.toLocaleString()} / ${tot.files.toLocaleString()} files present (${pct(tot.present, tot.files)}), ${gb(tot.bytesPresent)} / ${gb(tot.bytes)} GB; missing ${tot.missing.toLocaleString()}, size-mismatch ${tot.mismatch}; objects in bucket not in any manifest: ${extra}.**`, '',
  '| unit | files | present | missing | mismatch | GB present / total | videos present / total | % |', '|---|---:|---:|---:|---:|---|---|---:|',
  ...rows.map((r) => `| ${r.unit} | ${r.files.toLocaleString()} | ${r.present.toLocaleString()} | ${r.missing.toLocaleString()} | ${r.mismatch} | ${gb(r.bytesPresent)} / ${gb(r.bytes)} | ${r.videosPresent} / ${r.videos} | ${pct(r.present, r.files)} |`), '',
  'Status per file (key, bytes, sha256, PRESENT/MISSING/SIZE_MISMATCH): `coordination/R2-LEDGER.json`. Resume list: `coordination/R2-MISSING.txt` (grouped by payload root).', ''].join('\n');
fs.writeFileSync(path.join(ROOT, 'coordination/R2-LEDGER.md'), md);
fs.writeFileSync(path.join(ROOT, 'coordination/R2-MISSING.txt'), [...missingByRoot].map(([root, rels]) => `# ${root}\n${rels.join('\n')}`).join('\n') + '\n');
console.log(md.split('\n').slice(0, 3).join('\n'));
if (STATE) { const r = rows.find((x) => x.unit === STATE); console.log(JSON.stringify(r)); for (const e of ledger.filter((e) => e.unit === STATE && e.status !== 'PRESENT').slice(0, 40)) console.log(`${e.status.padEnd(14)} ${e.bytes.toString().padStart(11)} ${e.key}`); }
else for (const r of rows.filter((r) => r.present)) console.log(`${r.unit.padEnd(7)} ${r.present}/${r.files} files  ${r.videosPresent}/${r.videos} videos  ${gb(r.bytesPresent)}/${gb(r.bytes)} GB`);
