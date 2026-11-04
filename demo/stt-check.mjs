// Transcribe each demo/narration/rNN.mp3 and compare with LINES.json (catches dropped sentences). Needs OPENAI_API_KEY.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const DIR = path.join(ROOT, 'demo/narration');
const lines = JSON.parse(fs.readFileSync(path.join(DIR, 'LINES.json'), 'utf8'));
const norm = s => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const key = process.env.OPENAI_API_KEY;
const report = [];
for (const r of lines) {
  const fd = new FormData();
  fd.append('file', new Blob([fs.readFileSync(path.join(DIR, `${r.id}.mp3`))], { type: 'audio/mpeg' }), `${r.id}.mp3`);
  fd.append('model', 'whisper-1'); fd.append('response_format', 'text');
  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: `Bearer ${key}` }, body: fd });
  const heard = (await res.text()).trim();
  const want = norm(r.text), got = norm(heard);
  const wantWords = want.split(' '), gotWords = got.split(' ');
  const lastWant = wantWords.slice(-4).join(' ');
  const tailOk = got.includes(lastWant);
  const ratio = (gotWords.length / wantWords.length).toFixed(2);
  report.push({ id: r.id, words: `${gotWords.length}/${wantWords.length}`, ratio, tailOk, lastWant, heardTail: gotWords.slice(-6).join(' ') });
  console.log(`${r.id} ${gotWords.length}/${wantWords.length} words  tail ${tailOk ? 'OK ' : 'MISSING'}  …${gotWords.slice(-6).join(' ')}`);
}
fs.writeFileSync(path.join(DIR, 'STT-CHECK.json'), JSON.stringify(report, null, 2));
