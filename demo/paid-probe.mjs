// Reproduce the entitled (paid) load of a state against the LIVE edge without touching any real account:
// mints an entitlement cookie with the Worker's own test helper (secret read from .env.cloudflare, never printed),
// then fetches the state's manifest and every file the shell would fetch, and reports status + timing.
// Usage: node demo/paid-probe.mjs [UT] [--parallel 12]
import fs from 'node:fs';
import path from 'node:path';
import { signEntitlementCookie, ENT_COOKIE } from '../tools/deploy/worker/src/gate.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const secret = env.ENTITLEMENT_COOKIE_SECRET; if (!secret) { console.log('no ENTITLEMENT_COOKIE_SECRET in .env.cloudflare'); process.exit(2); }
const CODE = (process.argv[2] && /^[A-Za-z]{2}$/.test(process.argv[2]) ? process.argv[2] : 'UT').toUpperCase();
const pi = process.argv.indexOf('--parallel'); const POOL = pi > 0 ? +process.argv[pi + 1] : 1;
const LIVE = 'https://passlearnerspermit.com/app/';

const states = await (await fetch(LIVE + 'data/states.json')).json();
const s = states.find((x) => x.code === CODE); if (!s) { console.log('no state ' + CODE); process.exit(2); }
const root = s.data_root.replace(/\/+$/, '');
const exp = new Date(Date.now() + 3600e3).toISOString();
const cookie = ENT_COOKIE + '=' + await signEntitlementCookie({ u: 'probe', e: { [CODE]: exp }, x: Date.now() + 3600e3 }, secret);
const H = { cookie, 'cache-control': 'no-store' };

const t0 = Date.now();
const mr = await fetch(LIVE + root + '/manifest.json', { headers: H }); const manifest = await mr.json();
const files = manifest.files || [];
console.log(`${CODE} root=${root} manifest ${mr.status} files=${files.length} pool=${POOL}`);
const statuses = {}; let bytes = 0; let slowest = 0; let next = 0; const times = [];
async function one(e) {
  const rel = e.file.startsWith(root + '/') ? e.file.slice(root.length + 1) : e.file;
  const t = Date.now();
  const r = await fetch(LIVE + root + '/' + rel, { headers: H });
  const buf = await r.arrayBuffer(); bytes += buf.byteLength;
  const dt = Date.now() - t; times.push(dt); slowest = Math.max(slowest, dt);
  statuses[r.status] = (statuses[r.status] || 0) + 1;
  if (r.status !== 200 && (statuses[r.status] <= 3)) console.log(`  ${r.status} ${rel.slice(0, 90)}`);
}
await Promise.all(Array.from({ length: Math.min(POOL, files.length) }, async () => { while (next < files.length) await one(files[next++]); }));
const total = (Date.now() - t0) / 1000; times.sort((a, b) => a - b);
console.log(`statuses ${JSON.stringify(statuses)}  bytes ${(bytes / 1e6).toFixed(1)} MB  total ${total.toFixed(1)}s  median ${times[Math.floor(times.length / 2)]}ms  slowest ${slowest}ms`);
