// plp-app-gate — Cloudflare Worker serving /app/* for passlearnerspermit.com from the R2 bucket, enforcing the store's
// free/paid rule at the edge (see gate.js). Everything else on the host is Vercel's; this Worker is routed only on /app/*.
// Free objects: edge-cached, public. Paid objects: signed plp_ent cookie (HMAC, shared secret with the store), never cached.
// Error bodies are the same JSON the store's middleware returns, so gate.js in the shell behaves identically.
import FREE_PATHS from '../free-paths.json';
import { makeTierRule, decide, cacheControlFor, edgeCacheable } from './gate.js';

const classify = makeTierRule(FREE_PATHS);
const MIME = { html: 'text/html; charset=utf-8', css: 'text/css; charset=utf-8', js: 'text/javascript; charset=utf-8', mjs: 'text/javascript; charset=utf-8',
  json: 'application/json; charset=utf-8', mp3: 'audio/mpeg', mp4: 'video/mp4', webm: 'video/webm', webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', svg: 'image/svg+xml', ico: 'image/x-icon', woff2: 'font/woff2', woff: 'font/woff', ttf: 'font/ttf', txt: 'text/plain; charset=utf-8', xml: 'application/xml', webmanifest: 'application/manifest+json', csv: 'text/csv' };
const mimeFor = (key) => MIME[(key.split('.').pop() || '').toLowerCase()] || 'application/octet-stream';
const deny = (status, error, extra) => new Response(JSON.stringify({ error, ...(extra || {}) }), { status, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/app/')) return deny(404, 'not_found');
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
    let rel;
    try { rel = decodeURIComponent(url.pathname.slice('/app/'.length)); } catch { return deny(400, 'bad_path'); }
    const d = await decide(rel, request.headers.get('cookie'), classify, env.ENTITLEMENT_COOKIE_SECRET);
    if (d.status !== 200) return deny(d.status, d.error, d.state ? { state: d.state } : undefined);

    const key = 'app/' + (rel === '' ? 'index.html' : rel);
    const free = d.tier === 'free';
    const cacheable = edgeCacheable(rel, free); // the shell is never edge-cached (hotfixes must land on next reload)
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cache = caches.default;
    if (cacheable) {
      const hit = await cache.match(cacheKey);
      if (hit) return request.method === 'HEAD' ? new Response(null, hit) : hit;
    }
    const range = request.headers.get('range');
    const obj = await env.BUCKET.get(key, range ? { range: request.headers } : undefined);
    if (!obj) return deny(404, 'not_found');
    const headers = new Headers();
    headers.set('content-type', obj.httpMetadata?.contentType || mimeFor(key));
    headers.set('etag', obj.httpEtag);
    headers.set('accept-ranges', 'bytes');
    headers.set('x-content-type-options', 'nosniff');
    headers.set('cache-control', cacheControlFor(rel, free));
    let status = 200;
    if (range && obj.range) {
      const { offset, length } = obj.range;
      const end = (offset ?? 0) + (length ?? obj.size - (offset ?? 0)) - 1;
      headers.set('content-range', `bytes ${offset ?? 0}-${end}/${obj.size}`);
      headers.set('content-length', String(end - (offset ?? 0) + 1));
      status = 206;
    } else {
      headers.set('content-length', String(obj.size));
    }
    const res = new Response(request.method === 'HEAD' ? null : obj.body, { status, headers });
    if (cacheable && status === 200 && request.method === 'GET') ctx.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  },
};
