// image-check-serve.mjs — static server for coordination/IMAGE-CHECK (review.html, held.html, .jpg-cache) that ALSO
// accepts POST /decisions {id: "KEEP"|"REJECT"} from held.html and writes coordination/IMAGE-CHECK/HELD-DECISIONS.json,
// so the founder's clicks land on disk whichever browser he uses. Loopback only. Usage: node tools/audit/image-check-serve.mjs [port]
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'coordination/IMAGE-CHECK');
const DEC = path.join(DIR, 'HELD-DECISIONS.json');
const port = Number(process.argv[2] ?? 4330);
const types = { '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json', '.js': 'text/javascript' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && url.pathname === '/decisions') {
    let body = '';
    req.on('data', (c) => { body += c; if (body.length > 1e6) req.destroy(); });
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body);
        // BUG-007 (2026-11-01): repaint.html posts {decisions:{...}}; held.html posts a flat map. Accept both and MERGE
        // with what is on disk so a page that loads with an empty store can never wipe decisions made elsewhere.
        const d = Object.assign({}, fs.existsSync(DEC) ? (JSON.parse(fs.readFileSync(DEC, 'utf8')).decisions || {}) : {}, parsed.decisions && typeof parsed.decisions === 'object' ? parsed.decisions : parsed);
        const clean = Object.fromEntries(Object.entries(d).filter(([k, v]) => /^[a-z0-9-]+$/.test(k) && ['KEEP', 'REJECT'].includes(v)));
        fs.writeFileSync(DEC, JSON.stringify({ saved_at: new Date().toISOString(), decisions: clean }, null, 2) + '\n');
        res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ ok: true, count: Object.keys(clean).length }));
      } catch (e) { res.writeHead(400); res.end(String(e.message)); }
    });
    return;
  }
  if (req.method === 'GET' && url.pathname === '/decisions') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(fs.existsSync(DEC) ? fs.readFileSync(DEC) : '{"decisions":{}}');
  }
  let file = path.resolve(DIR, '.' + decodeURIComponent(url.pathname === '/' ? '/held.html' : url.pathname));
  if (!file.startsWith(DIR) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`image-check on http://127.0.0.1:${port} (POST /decisions -> ${path.relative(ROOT, DEC)})`));
