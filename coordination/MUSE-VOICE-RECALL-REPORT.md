# MUSE-VOICE-RECALL-REPORT — spoken recall + device voice, 2026-10-27

## Run
`node tools/preview/serve.mjs` → app on http://127.0.0.1:4310
(+ `POST /api/transcribe`). Needs `MODEL_API_KEY` in lane-root `.env`.
(NB: 4310 was held by another process during this session; proof ran on 4311.)

## What works
- `tools/preview/serve.mjs`: static app-preview/ + ONE endpoint. Accepts
  multipart `audio` part or raw body (2 MB cap, 20 s upstream timeout),
  forwards as `request`+`audio` multipart to Meta Voice Transcribe
  (`muse-voice-transcribe-1.0`, WAV, `PUSH_TO_TALK`), returns
  `{transcript, elapsed_ms, model}`, logs one line per call to
  `app-preview/data/voice-log.jsonl` (ts/bytes/elapsed/status only).
  `.env` returns 403; key never logged. No other network.
- Flashcards: "Say it" per card — records ≤10 s (tap to stop), re-encodes
  to 16 kHz mono WAV in-browser, scores vs card back (lowercase, no
  punctuation, digits+number-words, ≥0.6 token recall), marks
  recalled/missed in device-local progress, reveals the answer with the
  transcript + score. Mic/endpoint failures degrade to a message; the
  manual Recall + keyboard path is untouched. Honesty sentence on screen.
- "Listen (device voice)" on every lesson "Teacher says" block and every
  flashcard teaching script: `speechSynthesis`, en-US preferred, rate
  0.95; re-click or navigate cancels; labeled "device voice — not minted
  narration"; hidden when `speechSynthesis` is absent. All banners kept.
- Harness `node tools/preview/verify-learner.cjs`: ALL CHECKS PASSED
  (244 routes + 20 voice checks: buttons, honesty strings, 5 match
  cases incl. 25/twenty-five both ways, both speechSynthesis branches).
- Static + 403 + full proxy path verified live over loopback (port 4311).

## Real-call log line (1 s synthetic 440 Hz sine WAV, 32044 bytes)
`{"ts":"2026-10-27T22:49:28.565Z","bytes":32044,"elapsed_ms":1158,"status":200,"chars":0}`
Response: `{"transcript":"","elapsed_ms":1158,"model":"muse-voice-transcribe-1.0"}`
— empty transcript for a sine tone, as expected; plumbing proven. One Meta
call total this session; no belt stages run; nothing committed.

## Could not verify
- Real microphone speech end-to-end (no mic in sandbox) and real-browser
  MediaRecorder/speechSynthesis behavior — covered by harness + code
  inspection only. Recommend one human pass: Say-it with speech, Listen
  on a lesson and a card, blocked-mic + stopped-server degradations.
- `data-embedded.js`/`data-real-embedded.js` regeneration not needed (no
  data files changed); `index.html` line endings normalized CRLF→LF.
