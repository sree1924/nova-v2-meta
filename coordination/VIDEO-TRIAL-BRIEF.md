VIDEO TRIAL — lesson video from the teacher script, cost and time vs audio (founder, 2026-10-29). Goal: learn whether a narrated lesson video per module costs about the same as audio: $0 in money, measured in machine time.

WHAT TO MAKE: ONE lesson video for Ohio, chapter 1, first module.
- Picture: the lesson slides.
- On-screen text: each slide's `lines`.
- Sound: each slide's narration in the locked Kokoro teacher voice. That is af_heart at speed 0.95 with 0.6 s pauses, using D:/nova/tools/tts/kokoro-tts.py.
- Brand: "PassLearnersPermit". Not Nova, not citizenship.
- Content: verbatim. No new teaching, facts, numbers or images.

INPUTS (read-only):
- The Ohio lesson file: D:/nova/fb-ai-hackathon/app-preview/data/oh/real/manifest.json. Take the entry with stage_id "05.sessions" and section_id starting "sec01". Inside it, units[0].slides[] holds title, lines[] and narration (a string, or an object holding the text).
- Narration audio: the Ohio mint is RUNNING NOW, writing to app-preview/audio/oh/. Do NOT start a second Kokoro mint, and do not write into that folder. Either wait until app-preview/audio/oh/audio-manifest.json exists and reuse its session clips, or render this module's slide narration yourself with kokoro-tts.py into the trial folder below.

TOOLS: reuse the existing deterministic studio at D:/nova/video-studio. It rasterizes slides with resvg and the studio fonts, holds each frame for its clip's length, and composes with ffmpeg-static. No stock assets, no AI images, no network.
- build-lessons-from-05b.mjs turns slides plus clips into lesson packages. It expects the older "05b" tenant shape.
- build-youtube-videos.mjs composes the mp4 from a config.
- Do NOT edit video-studio's existing files: other stores use them. Put any adapter (Ohio 05.sessions to the lesson-package shape) and any config under D:/nova/fb-ai-hackathon/tools/video/, and pass it with --config.

OUTPUT: D:/nova/fb-ai-hackathon/video-samples/ is gitignored. Never commit mp4s or audio.

MEASURE AND REPORT to D:/nova/fb-ai-hackathon/coordination/VIDEO-TRIAL-REPORT.md:
1. Video length, file size, resolution, and render wall-clock time (time each step: narration if you made it, rasterizing, composing).
2. Render seconds per minute of finished video, and the same figure for audio alone (from the Ohio mint log once it finishes, or your own narration timing).
3. A fleet projection: Ohio has 52 modules and 360 slides. All 51 states have about 750 modules and about 5,000 slides. Give hours on this machine (14 cores, no NVIDIA GPU) and the disk space needed.
4. A short listen-and-watch check: text readable on a phone, audio in sync with each slide, no cut-off sentence endings.
5. PRICE CHECK ONLY, NO GENERATION: what an AI-generated presenter video (a talking teacher) would cost per minute from Google's current video-generation offering and one other provider. Cite the official pricing pages with dates, multiply out for about 750 modules, and spend nothing.

RULES: $0 spend. No paid API calls. No changes outside tools/video/, video-samples/ and the report. Commit nothing; the coordinator reviews and commits.
