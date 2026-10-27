You are Muse Code, preview builder. Read AGENTS.md first. You own app-preview/ and tools/preview/ only. Do not touch tools/belt/*, tools/audio/*, runs/*, prompts/*, contracts/*, schemas-strict/*; never print .env; no belt stages, no Model API calls.

Founder decision (2026-10-27 23:10Z): NO device voice. Narration is pre-generated audio minted by the Nova fleet recipe (OpenAI gpt-4o-mini-tts, voice "nova"; NOT a Meta model — say so honestly where audio is mentioned). The clips are on disk now.

Inputs (read-only):
- app-preview/audio/audio-manifest.json — AudioAssetManifest: `entries[]` {kind, id, section, file_ref, bytes, sha256, unit_id?, slide_id?}, `think` {section_id → think file name}, `pause_ms` (3000), `totals` (clips, cards, cards_complete, cards_missing_voice, slides, slides_with_audio, sessions_missing_audio), `minted_by` (provider/model/voice/pace, not_a_meta_model: true), `runtime_policy: play_pre_generated_files_only`.
- Clip naming: flashcard = `audio/<card_id>.q.mp3` (question), `audio/<think file>` (shared per section), `audio/<card_id>.a.mp3` (answer), `audio/<card_id>.teach.mp3` (teaching); recap scripts = `audio/<card_id>.recap.mp3`; lesson slide = `audio/sessions/<unit_id>.<slide_id>.mp3`.

Do, in this order:
1. REMOVE the device-voice "Listen (device voice)" buttons and all speechSynthesis code and its harness checks. Keep "Say it" (spoken recall) exactly as it is.
2. Lesson slides: a Play/Pause button per slide bound to its `sessions/<unit_id>.<slide_id>.mp3` when the manifest has it; auto-advance is NOT wanted (learner taps). Show a small "narration · pre-generated (OpenAI TTS, not a Meta model)" label once per lesson, not per slide.
3. Flashcards: a Play button that runs the four-movement arc from the manifest: question clip → shared think clip → wait `pause_ms` → answer clip → teaching clip, in that order, honoring the existing reveal beat (the answer stays hidden until the answer clip starts or the learner reveals manually). Recap cards play their single recap clip. A card with any movement missing shows "audio pending" and the text path is untouched.
4. One HTMLAudioElement at a time; navigating away stops playback; no autoplay on route load; never fetch a clip the manifest does not list.
5. Coverage gate in the harness (tools/preview/verify-learner.cjs): read the manifest and assert `cards_missing_voice === 0` and `sessions_missing_audio === 0`, assert every learner route that renders a card/slide references the manifest file_ref for it, and assert no `speechSynthesis` string remains in app-preview/. Keep ALL CHECKS PASSED.
6. app-preview/README.md: replace the device-voice section with the minted-audio description (provider, voice, clip counts from the manifest, "not a Meta model"). Do not edit the root README.md.
7. Verify over HTTP with your DOM harness; also fetch three clips (one slide, one card q, one think) through tools/preview/serve.mjs and assert 200 + audio/mpeg. Write coordination/MUSE-AUDIO-PLAYBACK-REPORT.md (≤ 50 lines): what changed, harness result, clip fetch proof, what you could not verify (real playback in a browser needs a human ear). Commit nothing. Stop.
