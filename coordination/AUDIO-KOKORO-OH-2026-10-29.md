# Ohio narration, Kokoro-82M (2026-10-29), measured

Recipe: hexgrad/Kokoro-82M (Apache-2.0), voice af_heart, speed 0.95, 0.6 s pause between sentences, 0.9 headroom, mono 24 kHz MP3 at 48 kbps.
Command: node D:/nova/tools/mint-kokoro-audio.mjs --state OH --go --workers=2
Cost: $0, local CPU (14 cores, no GPU).

| Measure | Value |
|---|---|
| Clips | 1,943: 510 cards x 3, 52 recaps, 1 think cue, 360 lesson slides |
| Unique renders | 1,941 (2 exact duplicates copied) |
| Failures | 0 |
| Wall clock | 4 h 29 m 31 s (2026-10-29T23:44:27Z to 2026-10-30T04:13:58Z) |
| Finished audio | 8.70 h |
| Speed | 1.94x real time; two workers gave no gain over the trial's single-worker 1.9x |
| Disk | 185 MB |
| Dropped-text check | every clip's characters per second inside 8 to 22: 0 outliers, 0 suspect clips |

Learner harness: ALL PASS on app-preview and on the store mirror, which now carries audio/oh.
Clips are gitignored (app-preview/audio/*/*.mp3); only audio-manifest.json is tracked. A deployed store will need the clips hosted (for example Vercel Blob), because a build from git won't have them.

Fleet projection from Ohio: all 51 states hold about 35.6 M narration characters, about 85x Ohio. That is about 380 hours of this machine, roughly 16 days, or a few rented-GPU hours.
