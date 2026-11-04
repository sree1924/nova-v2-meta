// HOTFIX 2026-11-04 — upload the patched app shell (store/public/app/index.html) to R2 as app/index.html and verify live.
// Why: an unlocked state fetched ~220 JSON files one at a time through the edge (39 s for Utah before audio/overlays);
// the shell now fetches them in a pool of 12 (3.7 s measured with demo/paid-probe.mjs). Same files, same gate.
// Usage (founder, external-publish gate):  node D:\nova\fb-ai-hackathon\tools\deploy\hotfix-index-r2.mjs
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const RCLONE = 'C:/Users/varad/AppData/Local/Microsoft/WinGet/Packages/Rclone.Rclone_Microsoft.Winget.Source_8wekyb3d8bbwe/rclone-v1.75.2-windows-amd64/rclone.exe';
const SRC = path.join(ROOT, 'store/public/app/index.html');
const MARK = 'HOTFIX 2026-11-04';
if (!fs.readFileSync(SRC, 'utf8').includes(MARK)) { console.error('local index.html does not carry the hotfix marker; refusing'); process.exit(2); }

const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
for (const k of ['R2_ENDPOINT', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET']) if (!env[k]) { console.error('missing ' + k + ' in .env.cloudflare'); process.exit(2); }
const rcloneEnv = { ...process.env, RCLONE_CONFIG_R2_TYPE: 's3', RCLONE_CONFIG_R2_PROVIDER: 'Cloudflare', RCLONE_CONFIG_R2_ENDPOINT: env.R2_ENDPOINT,
  RCLONE_CONFIG_R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID, RCLONE_CONFIG_R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY, RCLONE_CONFIG_R2_NO_CHECK_BUCKET: 'true' };
const DST = `r2:${env.R2_BUCKET}/app/index.html`;

const r = spawnSync(RCLONE, ['copyto', SRC, DST, '--s3-no-check-bucket'], { env: rcloneEnv, stdio: 'inherit' });
if (r.status !== 0) { console.error('rclone rc=' + r.status); process.exit(r.status || 1); }
console.log('uploaded app/index.html to R2');
// 2026-11-04: gate.js ships with the shell (state-journey cookie + dashboard sign-in link). Edge caches it 1 h — purge by URL after.
const GATE = path.join(ROOT, 'store/public/app/gate.js');
const g = spawnSync(RCLONE, ['copyto', GATE, `r2:${env.R2_BUCKET}/app/gate.js`, '--s3-no-check-bucket'], { env: rcloneEnv, stdio: 'inherit' });
if (g.status !== 0) { console.error('rclone (gate.js) rc=' + g.status); process.exit(g.status || 1); }
console.log('uploaded app/gate.js to R2');

// Optional edge-cache purge for the one URL (CLOUDFLARE_API_TOKEN + zone id in .env.cloudflare; skipped if absent).
const ZONE = env.CLOUDFLARE_ZONE_ID || 'a893c88a887fbac05eae199f76245909';
if (env.CLOUDFLARE_API_TOKEN) {
  const p = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/purge_cache`, { method: 'POST', headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: ['https://passlearnerspermit.com/app/index.html', 'https://passlearnerspermit.com/app/'] }) });
  console.log('cache purge: HTTP ' + p.status);
}

for (let i = 0; i < 6; i++) {
  const t = await (await fetch('https://passlearnerspermit.com/app/index.html', { headers: { 'cache-control': 'no-cache' } })).text();
  if (t.includes(MARK)) { console.log('LIVE: edge now serves the hotfixed shell'); process.exit(0); }
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('edge still serving the old shell after 30 s — purge or wait for the cache TTL, then re-run this script');
process.exit(3);
