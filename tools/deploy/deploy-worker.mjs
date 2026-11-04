// Deploy the plp-app-gate Worker (tools/deploy/worker) with wrangler, authenticated by CLOUDFLARE_API_TOKEN /
// CLOUDFLARE_ACCOUNT_ID from .env.cloudflare (never printed), then verify the live headers on the shell.
// Usage (founder, external-publish gate):  node D:\nova\fb-ai-hackathon\tools\deploy\deploy-worker.mjs
// The existing route (passlearnerspermit.com/app/*) and the ENTITLEMENT_COOKIE_SECRET stay attached to the script name.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..', '..');
const WORKER = path.join(ROOT, 'tools/deploy/worker');
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
for (const k of ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID']) if (!env[k]) { console.error('missing ' + k + ' in .env.cloudflare'); process.exit(2); }

const t = spawnSync('node', ['--test', 'test/gate.test.mjs'], { cwd: WORKER, encoding: 'utf8' });
const pass = /# pass (\d+)/.exec(t.stdout)?.[1], fail = /# fail (\d+)/.exec(t.stdout)?.[1];
console.log(`worker tests: pass ${pass} fail ${fail}`);
if (fail !== '0') { console.error('tests failing; not deploying'); process.exit(1); }

const r = spawnSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['-y', 'wrangler@4', 'deploy'], {
  cwd: WORKER, stdio: 'inherit', shell: process.platform === 'win32',
  env: { ...process.env, CLOUDFLARE_API_TOKEN: env.CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID: env.CLOUDFLARE_ACCOUNT_ID, WRANGLER_SEND_METRICS: 'false' },
});
if (r.status !== 0) { console.error('wrangler deploy rc=' + r.status); process.exit(r.status || 1); }

for (let i = 0; i < 6; i++) {
  const res = await fetch('https://passlearnerspermit.com/app/index.html', { headers: { 'cache-control': 'no-cache' } });
  const cc = res.headers.get('cache-control') || '';
  console.log(`live shell: HTTP ${res.status} cache-control="${cc}" cf-cache-status=${res.headers.get('cf-cache-status')}`);
  if (/no-cache/.test(cc)) { console.log('LIVE: shell is served no-cache; hotfixes now land on the next reload'); process.exit(0); }
  await new Promise((r) => setTimeout(r, 5000));
}
console.log('edge still serving a cached shell; purge https://passlearnerspermit.com/app/index.html once in the dashboard, then re-check');
process.exit(3);
