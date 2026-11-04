# 3-minute demo — v6 (2026-11-04; v4 saved as VIDEO-SCRIPT-v4-SAVED.md + demo/out/final-cut-v4-2026-11-04-SAVED.mp4) — the lanes tell the belt story, numbers on screen

Founder brief for v4: too many numbers were spoken; keep them visual and speak only the significant ones. Cut to 3:00.
No HOLD / lock talk (a separate lane will count and fix holds). v3 is kept as `VIDEO-SCRIPT-v3.md`.

Numbers now live in three visual layers: the title/end cards, the persistent lower-third, and a **caption strip** at the
top of each row (the `caption` column) drawn by `demo/assemble.mjs`. Every caption figure keeps its receipt file in the
shot column. The spoken line keeps at most two numbers.

Voices: Fable=ash, Muse=nova, Sol=echo, Argon=shimmer, Terra=sage (OpenAI gpt-4o-mini-tts, upbeat). Tempo is auto-fitted
by `assemble.mjs --fit --target=178` (clamped 1.0–1.25×) so the whole cut lands under 3:00.

## The script

| t | shot (what is on screen) | voice | line | caption (on screen) | words |
|---|---|---|---|---|---|
| r01 | Title card on cream with the app icon: 255,145 files · 188 GB · 4,987 HD lesson videos · 234,656 narration clips · 37,967 flashcards · 50 states + DC · "All of it made between Oct 26 and Nov 3, 2026." Then live `https://passlearnerspermit.com/`, state picker ND → TX → UT. | FABLE | Fifty-one driver handbooks. Eight days. Five model lanes on one assembly line we call the belt. Every frame was made inside this hackathon, and this is their report. (`coordination/R2-LEDGER.md`) | — | 28 |
| r02 | `schemas-strict/`, `tools/belt/checks/`, `runs/2026-10-26-rdmv-ut-class-d/ledger/` listings, then `app-preview/trace.html` on an accepted Utah attempt (validation PASS, checks table). | FABLE | I'm Fable, Claude. The belt was a contract before code: strict schemas, a check for each, a receipt for every attempt. Nobody talks past a schema. | 7 strict schemas · 1 check each · 1 receipt per attempt | 23 |
| r03 | `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md`, live `/app/#/ut/lesson/sec01-u01` playing then reading pages, `coordination/MUSE-TOKEN-LEDGER.md`, live `/app/#/tx`. | MUSE `[FABLE-DRAFT]` | I'm Muse, Meta's model. I authored Utah through the Model API in strict JSON, every artifact accepted by a validator I could not argue with, then nine more states as Muse Code. (`COST-ACCOUNTING.md`, `MUSE-TOKEN-LEDGER.md`) | Utah: 371 receipted calls · $44.09 · 16/16 chapters  ·  +9 states as Muse Code, $0 API | 30 |
| r04 | `coordination/FACT-CHECK/TRIAGE.md`, then `coordination/FACT-CHECK/CT/report.md` line 58 (CONTRADICTED, blowout braking). | MUSE `[FABLE-DRAFT]` | Then I re-read every compiled fact in all fifty-one states against only the page it cites. Six hundred sixty-four flags, four contradictions. This one told a driver to lock the brakes in a blowout; the page says brake lightly. Those cards were hidden. (`TRIAGE.md`, `FACT-CHECK/CT/report.md`) | 38,074 facts · 664 flags · 444 meaning errors · 443 cards hidden · planted-error test 3/3 | 38 |
| r05 | `coordination/IMAGE-CHECK/held.html` (pickup on the wrong side beside its re-paint), `coordination/IMAGE-CHECK/results/` listing. | MUSE `[FABLE-DRAFT]` | I inspected every illustration against five drawing rules. This truck is on the wrong side of the line. Re-painted, re-inspected. (`IMAGE-CHECK/results/`) | 636 verdicts · 610 approved · 72 rejected → re-painted | 21 |
| r06 | 6×4 grid of scenes from `store/learner-assets/visuals/`, then the catalog summary (`scratch/terra-dataset/national-fleet-700-visual-catalog.json`). | TERRA `[FABLE-DRAFT]` | I was Terra, the GPT image lane. I painted scenes, not states: one catalog for all fifty-one, every picture through Muse's review. (`national-fleet-700-visual-catalog.json`, `submission/EVIDENCE.md`) | 748 canonical scenes · 723 verified pictures ship | 22 |
| r07 | Live `/app/#/tx/signs` hub → `/signs/cards`: a real sign card, flipped, then the next one. | MUSE `[FABLE-DRAFT]` | I painted the federal road signs and judged every one against the handbook's meaning before a learner saw it. (`coordination/SIGNS/qa-report.md`, `SIGNS/factcheck-report.md`) | 93 signs · 89 accepted · 73 meanings supported, 4 corrected | 20 |
| r08 | `coordination/SOL-REPORTS/CLOSEOUT-FIRST-TEN-20261028.md`, live `/app/#/ne`. | SOL | I was Sol, a GPT lane. I built the controller, every attempt recorded before advancing, and authored twenty-two states. One acknowledgment came late; the coordinator wrote it down. (`CLOSEOUT-FIRST-TEN-20261028.md`) | v0.4.0 controller · 22 states · 2,612 accepted attempts · $0 API | 27 |
| r09 | `scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json`, then `TRIAGE.md` again (the flags he fixed). | ARGON | I'm Argon, the Gemini lane. After the fact check I made the surgical fixes across forty-one states, only the flagged facts, original author kept. (`STEPS-2-TO-5-CLOSURE.json`) | 41 states · 370 fixes · $0 authoring · $5.82 of Meta checks | 24 |
| r10 | Live `/app/#/ut/lesson/sec01-u01` (1080p, muted), 4×4 grid of sixteen states' lessons, ND cards on a phone, `scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json`. | ARGON | Then the media, minted in four days: narration on an offline voice at zero dollars, lesson videos in 1080p, every file hashed. (`ALL51-PIPER-AUDIO-CLOSEOUT.json`, `ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md`) | 4,987 videos · 385 h · 234,656 clips · 737 h narration · $0 | 22 |
| r11 | `coordination/BUGS/BUG-008-*.md`, `coordination/BUGS/INDEX.md`. | ARGON | What went wrong stayed on the record: videos rendered too early were caught and re-rendered. Nine numbered bugs, each with its fix. (`BUG-008-*.md`, `BUGS/INDEX.md`) | BUG-008: 116 videos re-rendered · 9 bugs, 9 closes | 21 |
| r12 | `coordination/DATASET-SEAL-2026-11-02.md`, `coordination/R2-UPLOAD-STATUS.md` (51 PASS rows), `coordination/R2-LEDGER.md`, live Texas chapter 2 → $9.99. | FABLE | I sealed the dataset and checked every file again after upload. That dataset is the product. One state, one year, chapter one free. (`DATASET-SEAL-2026-11-02.md`, `R2-LEDGER.md`) | 51/51 READY · 255,145 / 255,145 files · 0 mismatches · 188 GB · $9.99 | 23 |
| r13 | Live landing page pull-back, the 16-state lesson grid, `coordination/R2-LEDGER.md` total line, then the end card (numbers, "Made Oct 26 – Nov 3, 2026. Every frame.", domain). | FABLE | Eight days ago this was fifty-one PDFs nobody reads. Tonight it's a live store with a price on it, a dataset at the edge, and a receipt for every file. Meta's models wrote it, checked it, and looked at every picture. One human read only the mechanics, and he was the only gate. The belt doesn't care how fast you move. It cares whether every byte matches its receipt. Fifty-one states, eight days, every frame made on the belt. | live: passlearnerspermit.com · $9.99 one state, one year · chapter 1 free | 79 |

378 spoken words (v6: strong close, 79 words over landing → lesson grid → R2 ledger → end card; tempo auto-fit ×1.03, runtime 2:58). At the measured 1.55 words/s that is ~209 s natural; `--target=178` sets the tempo (about 1.2×) so
narration + breaths land under 3:00. If a voice runs long, cut r04's "Those cards were hidden." and r08's last sentence first.

Dropped from v3 on the founder's brief: every HOLD / write-barrier / lock mention (Fable's "a HOLD cost one attempt",
Argon's eleven Hawaii HOLDs, Sol's write-barrier shots), the planted-error row as speech (it stays on screen in r04's
caption), and most spoken figures (they moved to captions).

## Build
`node demo/shots.mjs s03_trace` (accepted attempt) → `node demo/narrate.mjs --go` → `node demo/stt-check.mjs` →
`node demo/assemble.mjs --fit --target=178 --out=final-cut`. Pipeline notes live in `VIDEO-SCRIPT-v3.md`.
