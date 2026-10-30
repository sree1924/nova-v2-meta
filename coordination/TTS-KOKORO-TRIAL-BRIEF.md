TTS TRIAL — Kokoro-82M against Piper Amy (founder, 2026-10-29). Goal: a free, offline TEACHER voice for 51 state courses. Voice is last in the store plan and paid TTS (about $400) is ruled out.

WORKSPACE: D:\nova\fb-ai-hackathon. Touch only tools/tts/ and tts-samples/. tts-samples/ is gitignored; never commit audio. Do not edit anything else, and commit nothing.

INPUT: tts-samples/sample-text.txt. This is one real Texas lesson slide, 554 characters and 5 sentences. Every sample reads this text, so the comparison is like for like.

SETUP: pip install kokoro soundfile. On Windows, install espeak-ng too; Kokoro uses it for words its dictionary lacks. The only download needed is the Kokoro-82M weights and voices from the official hexgrad/Kokoro-82M repo on Hugging Face. Read the model card and record the licence of the model AND of the voices you use. We sell this course, so commercial use must be allowed.

RUN the ready script tools/tts/kokoro_teacher.py. Like tools/tts/piper_teacher.py, it synthesizes one sentence at a time, inserts true silence between sentences, keeps headroom, and refuses to write a clipped file. That matters: Piper's built-in pause feature clipped about 8,800 samples and buzzed. Make this grid:

  voices: af_heart, af_bella, af_nicole, bf_emma (if one fails to load, say so and continue)
  speed:  0.95 and 0.90
  pause:  0.6 (the default)

  python tools/tts/kokoro_teacher.py --text-file tts-samples/sample-text.txt --out tts-samples/kokoro-<voice>-<speed>.wav --voice <voice> --speed <speed>

LISTEN-CHECK each file, writing one line per file:
- Numbers read naturally ("ninety days", "sixteen").
- No mispronounced words.
- No buzz, clicks or cut-off sentence endings. TTS engines sometimes drop a short final sentence, so check the last one.

REPORT to coordination/TTS-KOKORO-TRIAL-REPORT.md:
1. A table: file, voice, speed, audio seconds, generation seconds, real-time factor, clipped samples (must be 0), your one-line listen note.
2. The licence of the model and of each voice used, with the model-card URL.
3. Install problems you hit on Windows and how you fixed them.
4. Your pick for a teacher tone, and why.
5. A rough time estimate for the whole fleet from the real-time factor. Measured fleet volume (2026-10-29): 34,793 lesson slides (about 20.0 million characters) plus 37,967 flashcards and 4,987 recaps (about 15.5 million characters).

Reference files for comparison: tts-samples/amy-teacher-v2-natural.wav and amy-teacher-v2-measured.wav (Piper Amy, 0 clipped).
