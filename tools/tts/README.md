# tools/tts — state narration, $0, offline

Founder plan (2026-10-30):
- **Before the hackathon:** Piper Amy in the "brisk" teacher voice for every state.
- **OpenAI TTS:** fixes in the existing store only.
- **After the hackathon:** Kokoro af_heart runs as a slow, complete rebuild and replaces Piper in the public store.

**DO NOT START the Piper fleet run until the Sol fact-fix pass has finished** (founder, 2026-10-30).

| File | What it does |
|---|---|
| `piper-tts.py` | Piper engine, same command-line and job-list contract as `D:/nova/tools/tts/kokoro-tts.py`. Synthesizes one sentence at a time, puts true silence between sentences, keeps headroom, and refuses to write any clip that clips (Piper's built-in pause feature clipped and buzzed in 1.4.2). Settings: en_US-amy-medium, length 1.08, noise 0.65, noise_w 0.75, pause 0.35 s. |
| `mint-piper-audio.mjs` | A copy, kept in this repo, of `D:/nova/tools/mint-kokoro-audio.mjs` that drives `piper-tts.py`. It builds the same job lists (cards x3, recaps, the think cue, lesson slides), skips existing clips, dedupes identical text, and writes `app-preview/audio/<st>/audio-manifest.json`. The manifest labels the provider as Piper, with the licence marked unverified and founder-accepted. |
| `piper_teacher.py`, `kokoro_teacher.py` | Single-file teacher samplers used to pick the voice. |

## Run (when the founder says go)

```bash
node D:/nova/fb-ai-hackathon/tools/tts/mint-piper-audio.mjs --state ND
node D:/nova/fb-ai-hackathon/tools/tts/mint-piper-audio.mjs --state ND --go --workers=2
node D:/nova/fb-ai-hackathon/tools/tts/mint-piper-audio.mjs --state ND --go --sections=<first section id>
```

The first command is a dry run: it counts the clips and writes nothing. The third limits the run to one section, which is how to do chapter 1 for every state first.

1. **Time one state first.** North Dakota is small: 1,491 clips, about 356,000 characters. Record the wall-clock time and project the fleet from it before starting the other states.
2. **Then chapter 1 for every state, then the full courses.** Skip OH, which is already Kokoro, and UT, which is OpenAI.
3. **After any run:** sync the store mirror and run both harnesses with `node tools/preview/rebuild-shell.mjs`. Clips are gitignored (`app-preview/audio/*/*.mp3`); only `audio-manifest.json` is committed. Deploying will need the clips hosted, for example on Vercel Blob.

Measured so far:
- **Piper Amy brisk:** a 38.4 s sample came out with 0 clipped samples. Fleet speed is not measured yet.
- **Kokoro on Ohio:** 8.7 h of audio in 4 h 29 m (1.94x real time), 0 failures.
