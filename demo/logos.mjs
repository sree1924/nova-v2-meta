// Render demo/gen/logos/*.svg → white 56 px PNGs on transparent (demo/gen/logos/<name>.png) with Chromium.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIR = path.join(ROOT, 'demo/gen/logos');
const browser = await chromium.launch();
for (const f of fs.readdirSync(DIR).filter(f => f.endsWith('.svg'))) {
  let svg = fs.readFileSync(path.join(DIR, f), 'utf8');
  if (!svg.includes('<svg')) { console.log(`${f}: not an svg, skipped`); continue; }
  svg = svg.replace(/fill="#[0-9a-fA-F]{3,6}"/g, 'fill="#ffffff"').replace('<svg ', '<svg fill="#ffffff" width="56" height="56" ');
  const page = await browser.newPage({ viewport: { width: 56, height: 56 } });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`);
  await page.screenshot({ path: path.join(DIR, f.replace('.svg', '.png')), omitBackground: true });
  await page.close();
  console.log(f, '→', f.replace('.svg', '.png'));
}
await browser.close();
