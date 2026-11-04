// Render store/src/app/icon.svg to demo/gen/icon.png (transparent, 360 px) with Chromium.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const svg = fs.readFileSync(path.join(ROOT, 'store/src/app/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 360 }, deviceScaleFactor: 1 });
await page.setContent(`<html><body style="margin:0;background:#F6F1E7">${svg.replace('<svg ', '<svg width="360" height="360" ')}</body></html>`);
await page.screenshot({ path: path.join(ROOT, 'demo/gen/icon.png') });
await browser.close();
console.log('demo/gen/icon.png');
