// Narration for VIDEO-SCRIPT.md v2: one MP3 per script row, one OpenAI TTS voice per lane, upbeat delivery.
// Default = dry run (prints rows, chars, $ estimate). `--go` mints to demo/narration/rNN.mp3. Reads OPENAI_API_KEY from env.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const SCRIPT = path.join(ROOT, 'submission/VIDEO-SCRIPT.md');
const OUT = path.join(ROOT, 'demo/narration'); fs.mkdirSync(OUT, { recursive: true });
const GO = process.argv.includes('--go');
const ONLY = process.argv.filter(a => /^r\d\d$/.test(a));

const VOICE = { FABLE: 'ash', MUSE: 'nova', SOL: 'echo', ARGON: 'shimmer', TERRA: 'sage' };
const STYLE = {
  FABLE: 'Upbeat documentary narrator. Warm, confident, brisk. Lands numbers cleanly. Not breathless.',
  MUSE: 'Bright, energetic, proud of the work but factual. Quick, clear, friendly.',
  SOL: 'Crisp, precise engineer, upbeat and direct. Clean delivery of technical terms.',
  ARGON: 'Lively, fast-moving builder voice. Enthusiastic about scale, honest about mistakes.',
  TERRA: 'Calm, warm painter voice with energy. Clear and a little wry.',
};
const MODEL = 'gpt-4o-mini-tts', PRICE_PER_1K_CHARS = 0.015; // $0.60 / 1M input chars + audio out ≈ $0.015/min; both tiny here

// parse table rows: | t | shot | voice | line | words |
const rows = [];
for (const line of fs.readFileSync(SCRIPT, 'utf8').split('\n')) {
  // v4 table: | rNN | shot | VOICE | line | caption | words |
  const m = /^\|\s*(r\d\d)\s*\|([^|]*)\|\s*([A-Z]+)\s*(?:`\[FABLE-DRAFT\]`)?\s*\|([^|]*)\|([^|]*)\|\s*(\d+)\s*\|\s*$/.exec(line);
  if (!m) continue;
  let text = m[4].trim()
    .replace(/\s*\(`[^)]*`(?:,\s*`[^)]*`)*\)\s*$/g, '')      // trailing (`receipt`, `receipt`)
    .replace(/\s*\([^()]*`[^()]*\)\s*$/g, '')                // any other trailing (…`…`)
    .replace(/`/g, '').replace(/\s+/g, ' ').trim();
  rows.push({ id: m[1], t: m[1], voice: m[3], text, caption: m[5].trim() });
}
if (rows.length !== 13) { console.log(`expected 13 rows, parsed ${rows.length}`); }
const todo = ONLY.length ? rows.filter(r => ONLY.includes(r.id)) : rows;
let chars = 0;
for (const r of todo) { chars += r.text.length; console.log(`${r.id} ${r.t} ${r.voice.padEnd(5)} ${VOICE[r.voice]}  ${r.text.length} ch  "${r.text.slice(0, 70)}…"`); }
console.log(`\n${todo.length} clips, ${chars} chars, ≈ $${(chars / 1000 * PRICE_PER_1K_CHARS).toFixed(3)} (${MODEL})`);
if (!GO) { console.log('dry run — add --go to mint'); process.exit(0); }

const key = process.env.OPENAI_API_KEY; if (!key) { console.log('OPENAI_API_KEY missing'); process.exit(1); }
for (const r of todo) {
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, voice: VOICE[r.voice], input: r.text, instructions: STYLE[r.voice], response_format: 'mp3', speed: 1.0 }),
  });
  if (!res.ok) { console.log(`${r.id} HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); continue; }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(OUT, `${r.id}.mp3`), buf);
  console.log(`${r.id} ${buf.length} bytes`);
}
fs.writeFileSync(path.join(OUT, 'LINES.json'), JSON.stringify(todo, null, 2));
console.log('done');
