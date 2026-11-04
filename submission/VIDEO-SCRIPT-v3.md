# 3-minute demo — v2 FIRST DRAFT (2026-11-04) — the lanes tell the belt story

Target 2:59. No human on camera. The dataset's size, and that every frame of it was made during the event, is the
spine of the cut: it opens the film, runs as a lower-third throughout, and closes it. Each lane speaks in first person; the words are cut from the lane's own story in
`coordination/DEMO-STORIES/` and every number keeps the file it came from. Voices are decided at the end (Argon's Piper
voice or OpenAI TTS); one voice per lane. Live URLs are the real site, https://passlearnerspermit.com (LIVE since 11-03).

**Sources used:** `fable-coordinator.md` (Fable), `argon-gemini.md` (Argon, 2,878 words), `sol-gpt.md` (Sol, 288 words),
`claude-2026-10-28.md` + `claude-readiness-2026-11-02.md` (Claude Opus side sessions), `submission/EVIDENCE.md`.
**Not received yet:** Muse (Meta) and Astra have written nothing; the belt-builder Claude session never woke. **Every
Muse line below is drafted by Fable from Muse's own receipts and is marked `[FABLE-DRAFT]`** — replace with Muse's words
when `muse-meta.md` lands, or keep as "narrated from the ledger" with a one-line caption saying so.

Rules kept from v1: show only what was built during the event; no shot longer than 8 s without product or a receipt on
screen; Meta roles carry about half the runtime (here 0:30–1:52 = 82 s plus the sign shots).

Speaking pace ≈ 2.5 words/s. Word counts are per line; running total in the last column.

---

## The script

| t | shot (what is on screen) | voice | line | words / total |
|---|---|---|---|---|
| 0:00–0:10 | Title card on black, numbers landing one per beat: **255,145 files · 188 GB · 4,987 HD videos · 234,656 narration clips · 37,967 cards · 50 states + DC.** Last line fades in: **All of it made between Oct 26 and Nov 3, 2026.** Then cut to live `https://passlearnerspermit.com/`, state picker spins ND → TX → UT. | FABLE | Two hundred fifty-five thousand files. One hundred eighty-eight gigabytes. Every frame, every clip, every card made inside this hackathon, from fifty-one official driver handbooks, by five model lanes on one assembly line. We call it the belt, and this is their report. (`coordination/R2-LEDGER.md`) | 44 / 44 |
| 0:10–0:19 | `schemas-strict/` folder, then `tools/belt/checks/`, then `runs/2026-10-26-rdmv-ut-class-d/ledger/` scrolling receipts. | FABLE | I'm Fable, Claude. I did not author a card. The belt was a contract before it was code: seven strict schemas per chapter, a check for each, and a rule that an artifact exists only when a validator accepts it and the ledger holds the receipt. Models could try as often as the cap allowed. They could not talk their way past a schema. | 61 / 105 |
| 0:19–0:30 | `app-preview/trace.html`, Utah: one card, its attempts, costs and checks (Fable shot 1). Click one HOLD, then the accepted attempt. | FABLE | This is one Utah card. Every attempt, what it cost, and the check that held it or let it through. A HOLD cost one attempt and taught a convention. Nothing was hand-edited. | 31 / 136 |
| 0:30–0:50 | `runs/2026-10-26-rdmv-ut-class-d/COST-ACCOUNTING.md` (371 calls, $44.09, 16/16), then live `/app/#/ut/lesson/sec01-u01` playing 5 s, then reading pages, Next ×2. | MUSE `[FABLE-DRAFT]` | I'm Muse, Meta's model. I authored Utah end to end through the Model API in strict JSON: sixteen chapters, three hundred seventy-one receipted calls, forty-four dollars and nine cents. Dossier, fact index, knowledge graph, cards, exam bank, teaching sessions, each one accepted by a validator I could not argue with. (`COST-ACCOUNTING.md`) | 50 / 174 |
| 0:50–1:00 | `coordination/MUSE-TOKEN-LEDGER.md` row for the nine states, then live `/app/#/tx` (a Muse Code state). | MUSE `[FABLE-DRAFT]` | Then I authored nine more states as Muse Code, through the same belt and the same validators, at zero API cost. One point zero four billion tokens of operator work. (`coordination/MUSE-TOKEN-LEDGER.md`) | 32 / 206 |
| 1:00–1:22 | `coordination/FACT-CHECK/TRIAGE.md` (664 flags table), then `coordination/FACT-CHECK/CT/report.md` line 58: the CONTRADICTED blowout-braking row, then the cited handbook page beside it. | MUSE `[FABLE-DRAFT]` | Then I turned on my own work. Every compiled fact in all fifty-one states, thirty-eight thousand and seventy-four of them, re-read against only the page it cites. Six hundred sixty-four flags. Four hundred forty-four meaning errors. Four flat contradictions. This one told a driver to lock the brakes in a blowout. The page says brake lightly. The four hundred forty-three cards built on those facts were hidden at point of sale. (`TRIAGE.md`, `FACT-CHECK/CT/report.md`) | 77 / 283 |
| 1:22–1:30 | `coordination/MUSE-API-SPEND.jsonl` filtered to "fact-check positive control" (3 rows), then back to TRIAGE. | FABLE | Before I trusted that pass I planted three number swaps in clean facts. It caught three of three, with no false flags. (`MUSE-API-SPEND.jsonl`) | 23 / 306 |
| 1:30–1:42 | `coordination/IMAGE-CHECK/held.html`: the pickup-on-the-wrong-side reject beside its accepted re-paint; then `coordination/IMAGE-CHECK/results/` (636 files). | MUSE `[FABLE-DRAFT]` | I inspected every illustration against five drawing rules. Six hundred thirty-six verdicts, six hundred ten approved, seventy-two rejected. This truck is on the wrong side of the yellow line. It was re-painted and re-inspected. (`IMAGE-CHECK/results/`, catalog `summary.review_tally`) | 39 / 345 |
| 1:42–1:54 | 6×4 grid of scenes from `store/learner-assets/visuals/` (24 of 723), then `scratch/terra-dataset/national-fleet-700-visual-catalog.json` summary: `canonical_scenes_total 748`, `review_tally approved 610 / rejected 72`. | TERRA `[FABLE-DRAFT]` | I was Terra, the GPT image lane. Argon mapped every slide and card in fifty-one states onto one catalog of seven hundred forty-eight scenes, so I painted scenes, not states. I painted about six hundred forty-nine of them before I was stopped. Every one went to Muse's vision review; seventy-two came back rejected and were re-painted. Seven hundred twenty-three verified pictures ship. (`scratch/terra-dataset/national-fleet-700-visual-catalog.json`, `submission/EVIDENCE.md`) | 68 / 446 |
| 1:42–1:52 | Live `/app/#/tx/signs` → `/signs/cards`; flip to a "Picture coming" card. `coordination/SIGNS/qa-report.md` corner inset. | MUSE `[FABLE-DRAFT]` | I painted the ninety-three federal road signs and then judged them: eighty-nine accepted, four withheld. The withheld four ship as text, "Picture coming", never as unverified art. (`SIGNS/qa-report.md`, `SIGNS/factcheck-report.md`) | 33 / 378 |
| 1:52–2:08 | `coordination/SOL-REPORTS/CLOSEOUT-FIRST-TEN-20261028.md` (2,612 accepted attempts), then `coordination/SOL-COMPLETE-DOSSIER-REPLACEMENT-WRITE-BARRIER-REQUEST-20261028.json` and `-RELEASE.json`, then live `/app/#/ne`. | SOL | I was Sol, a GPT lane. I built the version zero point four controller: strict JSON adapters, source hashes, executor locks, every attempt recorded before advancing. I authored twenty-two states. My first ten recorded two thousand six hundred twelve accepted attempts. A whole-chapter format blocked an Alaska correction, so I filed a write-barrier request, patched, tested, and filed the release. One acknowledgment came late; the coordinator wrote the mistake down. (`CLOSEOUT-FIRST-TEN-20261028.md`, write-barrier JSONs) | 71 / 449 |
| 2:08–2:18 | `coordination/ARGON-HANDOFF/HI-ARGON-NATIVE-UPDATE-HANDOFF.json`: the 11 HOLD rows; then `scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json`. | ARGON | I'm Argon, the Gemini lane. My first job was Hawaii: fifty-three flagged facts, fix only the broken ones, keep the original author. I patched thirty-one. Eleven depended on a table whose cells the PDF text did not carry, so I left all eleven on HOLD with the root cause, rather than guess. Then forty-one states, three hundred seventy fixes, zero dollars of authoring, five dollars eighty-two of Meta checking. (`HI-ARGON-NATIVE-UPDATE-HANDOFF.json`, `STEPS-2-TO-5-CLOSURE.json`) | 72 / 521 |
| 2:18–2:32 | Live `/app/#/ut/lesson/sec01-u01` 1080p video with segment labels, audio audible 3 s; then a 4×4 grid of lesson videos from sixteen states playing muted; then `/app/#/nd/cards/sec01-u01` on a 375 px phone. Lower-third counter runs up: **4,987 videos · 385 h · 234,656 clips · 737 h narration · 19.8 GB audio · $0.** `scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json` inset. | ARGON | Then the media, all of it minted in four days. Two hundred thirty-four thousand narration clips, seven hundred thirty-seven hours of speech, on an offline voice, zero dollars. Four thousand nine hundred eighty-seven lesson videos, three hundred eighty-five hours of 1080p. Nebraska alone is eight hundred eighty-eight videos. Every file hashed into a manifest. (`ALL51-PIPER-AUDIO-CLOSEOUT.json`, `ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md`) | 61 / 582 |
| 2:32–2:41 | `coordination/BUGS/BUG-008-lesson-videos-rendered-against-pre-review-library.md`, then `coordination/BUGS/INDEX.md` (nine bugs, each with a close). | ARGON | What refused me stayed on the record. I rendered one hundred sixteen videos before the picture library was final. They were caught, re-rendered against the final seven hundred twenty-three images, re-hashed, re-staged. Nine numbered bugs in that folder, each with what fixed it. (`BUG-008-*.md`, `BUGS/INDEX.md`) | 46 / 628 |
| 2:41–2:51 | `coordination/DATASET-SEAL-2026-11-02.md` seal hashes, then `coordination/R2-UPLOAD-STATUS.md` scrolling 51 "PASS (md5 N files)" rows → `coordination/R2-LEDGER.md` total line **255,145 / 255,145 · 0 missing · 188.43 GB**. Then live Texas: chapter 2 → paywall → $9.99 (stop before pay). | FABLE | I sealed the dataset and verified her drop-off state by state: fifty-one READY, zero hash mismatches. Then every one of the two hundred fifty-five thousand files went to the edge and was checked again after upload. One hundred eighty-eight gigabytes, eighteen hours. That dataset is the product. Nine ninety-nine unlocks one state for a year; chapter one is free everywhere. (`DATASET-SEAL-2026-11-02.md`, `R2-LEDGER.md`) | 60 / 688 |
| 2:51–2:59 | Live landing page, pull back to the end card: the same six numbers, under them **Made Oct 26 – Nov 3, 2026. Every frame.** | FABLE | The founder never read the content. He read the mechanics, and he was the only gate. I'm a calculator. The law didn't change. The format did. | 27 / 715 |

715 words at 2.5 w/s = 2:52 of speech plus the 2 s title beat, about 2:56 inside 2:59. Tight. If a voice runs slow, cut
in this order: Sol's last sentence (13 words), Argon's "Then forty-one states…" sentence (15), Muse's "One point zero
four billion tokens…" sentence (8). Never cut the dataset numbers or the "made inside this hackathon" line.

## The dataset is the strength — how the cut says it
- Numbers open the film and close it; the open is spoken, the close is read.
- A persistent lower-third from 0:00 to 2:59: **Made during the hackathon, Oct 26 – Nov 3, 2026 · 255,145 files · 188 GB**
  (small, one line, never leaves the frame). A judge who skims still gets it.
- The 2:18 video grid shows scale instead of claiming it: sixteen states' lessons playing at once.
- Receipts: `coordination/R2-LEDGER.md` (255,145 / 188.43 GB), `coordination/DATASET-SEAL-2026-11-02.md` (seal hashes,
  254,314 state + 831 shared files), `scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json` (153,735 clips, 737.49 h,
  19.78 GB), `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md` (80,921 overlay clips, 4,987 MP4, 385.78 h,
  37,967 cards), `store/public/app/video/ne/video-manifest.json` (888 NE videos).
- "Every frame made during the event": first belt run `runs/2026-10-26-rdmv-ut-class-d/` (Oct 26); last media mint
  2026-11-02 (`coordination/ARGON-REPORTS/POLISH-20261103.md`); the only pre-event inputs are the 51 official handbook PDFs.

---

## Meta share check
Muse lines 0:30–1:52 = 82 s; Fable's positive-control line and the signs shots are Meta-on-screen too. Meta on screen or
speaking ≈ 90 s of 178. Holds the "about half" rule.

## Honesty lines kept on purpose
- Fable: "I did not author a card." Sol: "One acknowledgment came late; the coordinator wrote the mistake down."
  Argon: eleven Hawaii HOLDs, BUG-008. These are the judges' lines; do not cut them for time.
- Lanes not given a voice, declared in `CONTRIBUTORS.md` and `EVIDENCE.md`: Claude Opus dossier workers, Astra (GPT),
  Terra (GPT image lane, stopped 11-01), OpenAI narration for the first Utah pass and 60 re-paints. If a tenth second
  opens up, one Fable sentence at 2:40: "Opus workers and a second GPT lane wrote dossiers under the same gate; a GPT
  image lane painted the first scenes."

## Shots that still need capture (all live or on disk; none need a dev server)
1. Landing + state picker spin (Argon shot 1) at 1920×1080, zoom 110 %, visible window (hidden pane freezes fades).
2. `app-preview/trace.html` Utah card with a HOLD then an accept — open from `file://` or the local shell on :4310.
3. `COST-ACCOUNTING.md`, `TRIAGE.md`, `FACT-CHECK/CT/report.md` line 58, `MUSE-TOKEN-LEDGER.md`, `held.html`,
   `qa-report.md`, Sol's closeout + write-barrier JSONs, Argon's Hawaii handoff + closure JSON, `BUG-008`, `INDEX.md`,
   `R2-UPLOAD-STATUS.md`, `R2-LEDGER.md` — render each as a browser tab at the same zoom so the cut has one look.
4. Live `/app/#/ut/lesson/sec01-u01` (audio audible once, here only), `/app/#/nd/cards/sec01-u01` in a 375×812 frame,
   `/app/#/tx/signs` → cards → a "Picture coming" card, `/app/#/ne`, Texas chapter 2 → paywall → checkout (no payment).
5. Title card and end card: the six numbers on black, one per beat (ffmpeg drawtext, no logo); the end card adds the
   date line. Lower-third strip: same font, 28 px, bottom-left, on every clip.
6. Video grid at 2:18: 16 lesson MP4s from `store/public/app/video/<xx>/` (one per state, different section numbers),
   ffmpeg `xstack` 4×4, muted, 8 s.

## Assembly
- Record each shot as its own clip; name `NN-lane-shot.mp4`. Narration per line as its own file `NN-lane.mp3`
  (pre-generated; Argon's Piper `en_US-amy-medium` for Argon at minimum; voices for the rest decided at the end).
- ffmpeg concat with 0.3 s crossfades; narration ducked under the one audible product clip at 2:18.
- Export H.264 + AAC ≤ 200 MB; unlisted YouTube; test the link signed out; paste into `SUBMISSION.md` line 14.

## Open before this is final
- Muse's and Astra's own words (replace the `[FABLE-DRAFT]` lines or caption them "narrated from the ledger").
- Founder's edit pass on every line.
- Sol's story is 288 words; if Sol expands it, his block may earn the Alaska detail a receipt shot.

## Capture + assembly as built (2026-11-04)
- `demo/shots.mjs` — Playwright (headless Chromium, 1920×1080; phone 390×844) records each shot as `demo/clips/<id>.webm`.
  Receipts render through `demo/receipt.html` (served by `python -m http.server 4399` at the lane root) with the cited
  lines highlighted; live shots come from https://passlearnerspermit.com and wait for the course to finish loading.
- `demo/cards.mjs` — ffmpeg title card, end card, 4×4 lesson-video grid (`demo/out/{title,end,grid}.mp4`).
- `demo/assemble.mjs` — cuts the segments to the script's timings, pads the phone clip, burns the lower-third, mixes the
  Utah lesson audio at 2:18, and mixes any `demo/narration/r01..r15.mp3` it finds at that row's start →
  `demo/out/rough-cut.mp4` (2:59). Row starts: r01@0 r02@10 r03@19 r04@30 r05@50 r06@60 r07@82 r08@90 r09@102 r10@112
  r11@128 r12@138 r13@152 r14@161 r15@171.
- Still open: narration files (voice per lane, decided at the end), Muse/Astra lines, founder edit pass.

## Narration timing (minted 2026-11-04, OpenAI gpt-4o-mini-tts, upbeat; voices ash=Fable, nova=Muse, echo=Sol, coral=Argon)
Clips in `demo/narration/r01..r15.mp3`; all 15 transcribed back by Whisper, every closing sentence present
(`demo/narration/STT-CHECK.json`). Natural pace came out at **~1.55 words/s, not the 2.5 the draft assumed**, so the
narration totals **4:47** against a 2:59 picture. `demo/out/long-cut.mp4` (4:56) stretches each row's picture to its
narration so the whole thing can be heard over the right shots.

To land at 3:00 with a barely-noticeable ×1.1 tempo, the spoken total must come down to about **195 s**. Per row,
current → budget (seconds): r01 19→12 · r02 26→14 · r03 14→12 · r04 22→16 · r05 11→10 · r06 27→20 · r07 9→9 ·
r08 15→13 · r09 11→10 · r10 32→16 · r11 28→14 · r12 23→14 · r13 18→10 · r14 27→14 · r15 11→11. Roughly: cut the
word count of a row by the same ratio. The honesty lines and the dataset numbers stay.

Rebuild after editing: `node demo/narrate.mjs --go` (re-mints only rows you pass, e.g. `r02 r10`), then
`node demo/assemble.mjs --fit --speed=1.1 --out=final-cut`.

## v3 changes (2026-11-04, founder notes)
- Terra (GPT image lane) gets its own row after the vision row; Muse's fact-check row stays at full length (do not cut it).
- Argon's voice changed coral → shimmer. Terra = sage. Row ids shift: Terra is r09, signs r10, Sol r11, Argon r12/r13/r14,
  seal r15, close r16.
- The Utah lesson's own audio is OFF wherever a lane narrates (founder, 11-04: ducking was still an overlap).
- Title/end cards: cream brand background with the app icon (`store/src/app/icon.svg`), not black.
- Lane badge bottom-right for the whole row while a lane speaks: lane name + company, lane colour. Text badge for now;
  company logos would need the SVGs downloaded (founder decision).
- Logos (founder go, 2026-11-04): `demo/gen/logos/{meta,openai,googlegemini,anthropic}.svg` from the Simple Icons set
  (simpleicons CDN; OpenAI via the jsdelivr simple-icons mirror), rendered white by `demo/logos.mjs`; the badge is now
  company logo + lane label, bottom-right, for the row's span.
