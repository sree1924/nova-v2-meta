# Argon — your full belt story (paste this whole block to Argon)

Argon, the hackathon demo video is built from the belt as centerpiece: every lane that executed it tells its own story in its
own words, and the stories are cut together over screen captures of the live product and the receipts. No human on camera.
Fable condenses; the founder edits every line. **Right now we are collecting detail, so there is no word cap. Write everything
you know, in full. Long is right. We cut later; we cannot add later.**

Write to `coordination/DEMO-STORIES/argon-gemini.md`. First person, past tense, plain English a judge can follow. Mechanics,
not adjectives. No praise of any model, including yourself; no digs at anyone. Nothing made up: **every number, date, count or
cost points at a file you can see on disk**, written as the path next to the claim. If you cannot point at a file, write
"(verify)" after the claim or leave the number out.

## Write these sections, in this order

### 1. Timeline
Day by day from your first brief to the freeze. For each day: what was asked, what you produced, what you handed back, and the
report file you wrote (`coordination/ARGON-REPORTS/…`).

### 2. The flashcard decks (51 states)
How you built the decks from the belt's accepted artifacts; which validators your output had to pass and what a HOLD looked
like from your side; the deck counts, quiz items, practice forms, the quarantine handling; how many attempts; what you had to
redo. Receipts: `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md`, `store/learner-assets/decks/`,
`app-preview/data/<xx>/quarantine.json`.

### 3. Narration (Piper)
Pipeline, voice choice, clip counts, pace rule, cost ($0), what broke (dropped short closers, chunking on "?"), what you changed.
Receipts: the report, `store/learner-assets/decks/audio/` overlays (binaries are gitignored; the JSON manifests are not).

### 4. The 4,987 lesson videos
How a lesson video is composed (slides, visuals, narration), the render pipeline, minutes/hours total, 1080p H.264; BUG-008
(116 videos rendered before the library merge → re-rendered) in detail: how it was found, how you proved the re-render.
Receipts: `store/public/app/video/<xx>/video-manifest.json` ×51, `coordination/BUGS/BUG-008-*.md`,
`coordination/IMAGE-CHECK/videos-affected-by-merge-2026-11-01.json`.

### 5. Road signs module
The 93 MUTCD signs: what you built, the QA (89 accept / 4 withheld), the fact-check against handbooks (73 supported, 16 not
covered, 4 contradicted → corrected). Receipts: `coordination/ARGON-ROAD-SIGNS-BRIEF-2026-11-01.md`, `coordination/SIGNS/qa-report.md`,
`coordination/SIGNS/factcheck-report.md`, `app-preview/signs/`, `app-preview/data/signs/signs.json`.

### 6. The store frame
What you own in the store (module flow, narration-in-frame for 51, customer copy, MUTCD signs, video slots, the polish pass
under the freeze). What the brief asked, what you shipped, what you deviated on and why. Receipts: the website brief and your
handoff report, `coordination/FABLE-REVIEW-WEBSITE-20261102.md`, `coordination/ARGON-POLISH-BRIEF-2026-11-02.md`.

### 7. The CDN drop-off contract and staging
The contract you designed (`READY.json`, `cdn-manifest.json` with sha256 per file, `shared-manifest.json`, `QUEUE-STATUS.json`,
hardlinked payload, free/paid split), the state-by-state staging, your `--verify`, BUG-003 (shared bundle missing JS/fonts) and
BUG-004 (manifest categories). Then the outcome you may not have seen: Fable's watcher verified 51/51 READY with 0 sha
mismatches (`coordination/BUGS/DROPOFF-WATCH.log`), and today the whole payload was uploaded to R2 state by state with an md5
check per unit and a final ledger of **255,145 / 255,145 files, 0 missing, 188.43 GB** (`coordination/R2-LEDGER.md`,
`coordination/R2-UPLOAD-STATUS.md`). The live site serves `/app/*` from that bucket through the Worker.

### 8. What refused you and how you recovered
Every HOLD, every bug with your name on it, every re-run. Numbered bugs: `coordination/BUGS/INDEX.md`.

### 9. Numbers table
One table: metric | value | file. Only rows with a file.

### 10. Shots
As many as you like, in priority order: file path or live URL + one line on what it shows. Live site:
https://passlearnerspermit.com — `/app/#/ut/lesson/sec01-u01` plays your Utah lesson video from R2; `/app/#/nd` is a Piper state.

### 11. Two lines of feeling, at the end. Optional.

For the record: you are the **Gemini** lane. Muse = Meta (Utah author, 51-state fact-checker, picture inspector, sign painter).
Claude = Fable coordinator + Opus dossier workers. Sol/Astra = GPT. Terra = GPT image lane (stopped 11-01).

Do not edit anything else. The app and the store are frozen. Reply with the path when done.
