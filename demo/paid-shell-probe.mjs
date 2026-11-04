// Run the LIVE shell in headless Chromium with a minted entitlement cookie (same shape /api/me sets) and watch what the
// entitled load does: console errors, failed/slow requests, and whether "Loading…" clears. No real account involved.
// Usage: node demo/paid-shell-probe.mjs [UT]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { signEntitlementCookie, ENT_COOKIE } from '../tools/deploy/worker/src/gate.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const env = Object.fromEntries(fs.readFileSync(path.join(ROOT, '.env.cloudflare'), 'utf8').split(/\r?\n/).filter((l) => /^[A-Z0-9_]+=/.test(l)).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
const CODE = (process.argv[2] || 'UT').toUpperCase();
const exp = new Date(Date.now() + 3600e3).toISOString();
const token = await signEntitlementCookie({ u: 'probe', e: { [CODE]: exp }, x: Date.now() + 3600e3 }, env.ENTITLEMENT_COOKIE_SECRET);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addCookies([{ name: ENT_COOKIE, value: token, domain: 'passlearnerspermit.com', path: '/app', httpOnly: true, secure: true, sameSite: 'Lax' }]);
const page = await ctx.newPage();
// The shell learns entitlement from /api/me (Clerk session); answer it the way a paid learner's browser sees it.
await page.route('**/api/me', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: true, entitlements: { [CODE]: exp } }) }));
const t0 = Date.now(); const ts = () => ((Date.now() - t0) / 1000).toFixed(1) + 's';
const reqs = new Map(); const slow = []; const bad = [];
page.on('request', (r) => reqs.set(r.url(), Date.now()));
page.on('response', async (r) => { const u = r.url(); const dt = Date.now() - (reqs.get(u) || Date.now()); if (dt > 3000) slow.push(`${dt}ms ${r.status()} ${u.slice(0, 110)}`); if (r.status() >= 400) bad.push(`${r.status()} ${u.slice(0, 120)}`); });
page.on('requestfailed', (r) => bad.push(`FAILED ${r.failure()?.errorText} ${r.url().slice(0, 120)}`));
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console.log(`[console.${m.type()} @${ts()}] ${m.text().slice(0, 200)}`); });
page.on('pageerror', (e) => console.log(`[pageerror @${ts()}] ${String(e).slice(0, 300)}`));

await page.goto(`https://passlearnerspermit.com/app/#/${CODE.toLowerCase()}/`, { waitUntil: 'domcontentloaded' });
console.log(`loaded shell @${ts()}; hotfix marker in shell: ${await page.evaluate(() => document.documentElement.outerHTML.includes('HOTFIX 2026-11-04'))}`);
const me = await page.evaluate(async () => { try { const r = await fetch('/api/me', { credentials: 'same-origin' }); return r.status + ' ' + (await r.text()).slice(0, 160); } catch (e) { return 'ERR ' + e; } });
console.log('/api/me →', me);
let cleared = false;
await page.waitForTimeout(1500);
for (let i = 0; i < 24; i++) {
  const st = await page.evaluate(() => ({ hash: location.hash, loading: !!document.querySelector('.loading-shell'), header: (document.getElementById('header-account-slot') || {}).innerText || '', h1: (document.querySelector('#view h1') || {}).innerText || '', n: performance.getEntriesByType('resource').length }));
  console.log(`@${ts()} hash=${st.hash} loading=${st.loading} h1="${st.h1.slice(0, 50)}" header="${st.header.trim().slice(0, 30)}" resources=${st.n}`);
  if (!st.loading && /Utah|Chapter/i.test(st.h1)) { cleared = true; break; }
  await page.waitForTimeout(5000);
}
if (!cleared) {
  console.log('--- pending fetches:'); const pend = await page.evaluate(() => performance.getEntriesByType('resource').filter((e) => e.responseEnd === 0).map((e) => e.name.slice(0, 120)).slice(0, 10)); console.log(pend.join('\n') || '(none reported)');
}
console.log('--- bad responses:', bad.length); bad.slice(0, 12).forEach((b) => console.log('  ' + b));
console.log('--- slow (>3s):', slow.length); slow.slice(0, 8).forEach((b) => console.log('  ' + b));
await page.screenshot({ path: path.join(ROOT, 'demo/stills/paid-shell-probe.png') });
await browser.close();
