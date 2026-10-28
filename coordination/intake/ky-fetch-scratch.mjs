// scratch: fetch KSP driver-testing page, list manual hrefs (delete after intake)
const url = process.argv[2];
const at = new Date().toISOString();
const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 NovaBeltIntake/1.0' } });
const t = await r.text();
console.log('OBSERVED_AT', at);
console.log('HTTP', r.status, 'bytes', t.length);
const hrefs = [...t.matchAll(/Kentucky-Driver-Manual[^"'<>]*/g)].map((x) => x[0]);
console.log('MANUAL_HREFS', JSON.stringify([...new Set(hrefs)]));
const needle = 'Kentucky-Driver-Manual_Updated_7-23-26.pdf';
const i = t.indexOf(needle);
if (i >= 0) console.log('CONTEXT>>>', JSON.stringify(t.slice(Math.max(0, i - 700), i + 400)));
else console.log('EXACT_URL_NOT_FOUND');
const ti = t.indexOf('<title>');
if (ti >= 0) console.log('TITLE', JSON.stringify(t.slice(ti, ti + 200)));
