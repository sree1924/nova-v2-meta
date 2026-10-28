// serve.mjs — local static server for app-preview/ (Muse Code, preview lane).
// Plain static files on 127.0.0.1:4310 (or the port argument). No API
// endpoints, no network, no .env loading. Usage:
//   node tools/preview/serve.mjs [port]
// Never serves .env (403). Unknown paths 404; non-GET/HEAD on a real file 405.
// The former POST /api/transcribe proxy is parked (not mounted) in
// tools/preview/transcribe-proxy.parked.mjs.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const laneRoot = path.resolve(here, '..', '..');
const root = path.join(laneRoot, 'app-preview');

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.md': 'text/plain; charset=utf-8', '.jsonl': 'application/x-ndjson; charset=utf-8', '.mp3': 'audio/mpeg' };

const server = http.createServer((req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url ?? '/').split('?')[0].split('#')[0]);
    if (path.basename(urlPath) === '.env') { res.writeHead(403); return res.end(); }
    let file = path.resolve(root, '.' + (urlPath === '/' ? '/index.html' : urlPath));
    if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { allow: 'GET, HEAD' }); return res.end(); }
    res.writeHead(200, { 'content-type': types[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch {
    if (!res.headersSent) res.writeHead(500);
    if (!res.writableEnded) res.end();
  }
});

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.argv[2] ?? 4310);
  server.listen(port, '127.0.0.1', () => console.log(`app-preview on http://127.0.0.1:${port}`));
}
