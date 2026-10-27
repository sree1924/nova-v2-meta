# MUSE-AUDIO-PLAYBACK-REPORT (2026-10-27, preview lane)

## What changed
- `app-preview/index.html`: removed all device-voice code (`speechSynthesis`,
  `speakText`, `data-listen` buttons). Added minted-clip player: per-slide
  Play/Pause, per-card Play running question → think cue → 3000 ms pause →
  answer (reveals on start) → teaching, per-recap Play, "audio pending" when
  any movement is missing. One shared `HTMLAudioElement`, stop on navigate,
  no autoplay, plays only manifest `file_ref`s. "Say it" untouched.
- `app-preview/audio-manifest-embedded.js` (new, generated): file:// fallback
  for the manifest; loader tries fetch first. Generator:
  `tools/preview/embed-audio-manifest.mjs`.
- `tools/preview/verify-learner.cjs`: coverage gate — manifest totals
  (`cards_missing_voice`/`sessions_missing_audio` = 0, files-only policy,
  not-a-Meta-model), per-unit file_ref assertions for all 374 cards + 48
  recaps + 335 slides, label-once checks, `speechSynthesis`/`data-listen`
  sweep of app-preview/. "Say it" + voice-match checks kept.
- `tools/preview/serve.mjs`, `static-serve.mjs`: `.mp3` → `audio/mpeg`.
- `app-preview/styles.css`, `app-preview/README.md`: new button selectors;
  device-voice section replaced with minted-audio description (OpenAI
  `gpt-4o-mini-tts`, voice `nova`, 1,509 clips, not a Meta model).

## Harness result
`node tools/preview/verify-learner.cjs` → **ALL CHECKS PASSED**, zero FAIL
lines (2,643 output lines, 244 learner routes swept).

## Clip fetch proof (serve.mjs :4317, then stopped)
- `audio/sessions/sec01-u01.sec01-u01-s01.mp3`: 200, audio/mpeg, 215229 B = manifest
- `audio/card-F01.q.mp3`: 200, audio/mpeg, 38973 B = manifest
- `audio/_think.mp3`: 200, audio/mpeg, 20109 B = manifest
- `index.html`: 200, text/html. Probe kept outside the repo (scratch only).

## Could not verify
Real audible playback needs a human ear in a browser: open
`node tools/preview/serve.mjs`, visit a lesson + flashcards, tap Play.
Commit nothing — done. Stop.
