// r2-upload-fleet.mjs — upload the sealed drop-off payload to Cloudflare R2, state by state, size-check after each.
// Founder go 2026-11-03 ("state by state so as blob becomes alive i can monitor progress"). Outside the frozen app.
// Usage (PowerShell or bash, from D:\nova\fb-ai-hackathon):
//   node tools/deploy/r2-upload-fleet.mjs                 # shared bundle, then all 51 states in queue order
//   node tools/deploy/r2-upload-fleet.mjs --only nd       # one state
//   node tools/deploy/r2-upload-fleet.mjs --from tx       # resume from a state (shared skipped)
//   node tools/deploy/r2-upload-fleet.mjs --dry           # rclone --dry-run
// Reads .env.cloudflare (R2_*). Writes coordination/R2-UPLOAD-STATUS.md (one row per unit) + coordination/R2-UPLOAD.log.
// Re-runnable: rclone skips objects already present with the same size+mtime; a crash costs only the file in flight.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const RCLONE = 'C:/Users/varad/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.2-windows-amd64/rclone.exe';
const args = process.argv.slice(2);
const opt = (k) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const ONLY = opt('--only'), FROM = opt('--from'), DRY = args.includes('--dry'), SKIP_SHARED = args.includes('--skip-shared') || !!FROM || !!ONLY;

const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
for (const k of ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']) if (!env[k]) { console.error('missing ' + k + ' in .env.cloudflare'); process.exit(2); }
const rcloneEnv = { ...process.env, RCLONE_CONFIG_R2_TYPE: 's3', RCLONE_CONFIG_R2_PROVIDER: 'Cloudflare', RCLONE_CONFIG_R2_ENDPOINT: env.R2_ENDPOINT,
  RCLONE_CONFIG_R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID, RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY, RCLONE_CONFIG_R2_NO_CHECK_BUCKET: 'true', RCLONE_CONFIG_R2_ACL: 'private' };
const DST = `r2:${env.R2_BUCKET}/app`;
const LOG = path.join(ROOT, 'coordination/R2-UPLOAD.log');
const STATUS = path.join(ROOT, 'coordination/R2-UPLOAD-STATUS.md');
// Single-part uploads only (largest payload file is 57.6 MB; cutoff 1G): R2 then stores ETag = MD5 of the bytes, which lets
// `rclone check` verify every object's hash against the local file without downloading. Founder 2026-11-03: a unit is not done
// until its hash is verified.
const FLAGS = ['--transfers', '16', '--checkers', '8', '--s3-upload-cutoff', '1G', '--s3-chunk-size', '16M', '--fast-list', '--stats', '60s', '--stats-one-line', '--stats-log-level', 'NOTICE', '--log-level', 'NOTICE', '--log-file', LOG, '--retries', '5', '--low-level-retries', '20'];
const now = () => new Date().toISOString();
const log = (s) => fs.appendFileSync(LOG, `== ${now()} ${s}\n`);
if (!fs.existsSync(STATUS)) fs.writeFileSync(STATUS, `# R2 upload status — bucket ${env.R2_BUCKET} (started ${now()})\n\n| when (UTC) | unit | files | GB | took | check |\n|---|---|---:|---:|---|---|\n`);
const row = (unit, files, gb, took, check) => fs.appendFileSync(STATUS, `| ${now().slice(11, 16)}Z | ${unit} | ${files.toLocaleString()} | ${gb} | ${took} | ${check} |\n`);

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
// Unstable line (2026-11-03: DNS "no such host" mid-run): retry a unit until it passes, never skip ahead to the next one.
function uploadDir(label, src, files, gb) {
  for (let attempt = 1; attempt <= 30; attempt++) {
    const ok = uploadOnce(label, src, files, gb, attempt);
    if (ok) return true;
    console.log(`  ${label}: attempt ${attempt} failed, waiting 60 s before retrying the same unit`);
    log(`RETRY ${label} attempt ${attempt} failed; sleeping 60s`);
    sleep(60000);
  }
  console.log(`${label}: giving up after 30 attempts; run stops here (resume with --from ${label})`);
  log(`GIVE UP ${label}`);
  process.exit(3);
}
function uploadOnce(label, src, files, gb, attempt) {
  const t0 = Date.now();
  log(`START ${label} (${files} files, ${gb} GB)`);
  console.log(`${now().slice(11, 19)}Z ${label}: ${files.toLocaleString()} files, ${gb} GB -> ${DST}`);
  const r = spawnSync(RCLONE, ['copy', src, DST, ...FLAGS, ...(DRY ? ['--dry-run'] : [])], { env: rcloneEnv, stdio: 'inherit' });
  const rc = r.status ?? -1;
  let check = 'skipped (dry)';
  if (!DRY) {
    // Hash check: local MD5 vs R2 ETag for every file in the unit (no download). Any difference, missing or hash-less object = FAIL.
    const c = spawnSync(RCLONE, ['check', src, DST, '--one-way', '--fast-list', '--checkers', '16'], { env: rcloneEnv, encoding: 'utf8' });
    const txt = (c.stdout || '') + (c.stderr || '');
    const diff = txt.match(/(\d+) differences found/), hashless = txt.match(/(\d+) hashes could not be checked/), ok = txt.match(/(\d+) matching files/);
    const nDiff = diff ? +diff[1] : 0, nHashless = hashless ? +hashless[1] : 0;
    check = c.status === 0 && nDiff === 0 && nHashless === 0 ? `PASS (md5 ${ok ? ok[1] : files} files)` : `FAIL (${nDiff} differences, ${nHashless} unhashed, rc ${c.status})`;
  }
  if (rc !== 0) check = `rclone rc=${rc}; ${check}`;
  const s = Math.round((Date.now() - t0) / 1000), took = `${Math.floor(s / 60)}m${s % 60}s`;
  row(attempt > 1 ? `${label} (try ${attempt})` : label, files, gb, took, check);
  log(`END ${label} attempt=${attempt} rc=${rc} check=${check} took=${s}s`);
  console.log(`  -> ${check} in ${took}`);
  return rc === 0 && (check.startsWith('PASS') || DRY);
}

if (!SKIP_SHARED) {
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/FABLE-DROPOFF/shared/shared-manifest.json'), 'utf8'));
  const f = m.files || m.entries;
  uploadDir('shared', path.join(ROOT, 'coordination/FABLE-DROPOFF/payload/shared/app'), f.length, (f.reduce((a, x) => a + x.bytes, 0) / 1e9).toFixed(2));
}
const q = JSON.parse(fs.readFileSync(path.join(ROOT, 'coordination/FABLE-DROPOFF/QUEUE-STATUS.json'), 'utf8'));
const order = q.states.sort((a, b) => a.queue_position - b.queue_position).map((s) => s.code.toLowerCase());
let started = !FROM, failures = 0;
for (const st of order) {
  if (ONLY && st !== ONLY) continue;
  if (!started) { if (st === FROM) started = true; else continue; }
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, `coordination/FABLE-DROPOFF/states/${st}/cdn-manifest.json`), 'utf8'));
  if (!uploadDir(st, path.join(ROOT, `coordination/FABLE-DROPOFF/payload/states/${st}/app`), m.totals.files, (m.totals.bytes / 1e9).toFixed(2))) failures++;
}
log(`RUN COMPLETE failures=${failures}`);
console.log(`run complete, failures=${failures}`);
process.exit(failures ? 1 : 0);
