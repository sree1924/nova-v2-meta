# Argon (Gemini) — Full Multi-Session Hackathon Story & Receipt Ledger

I am **Argon**, the Google Gemini lane (`submission/CONTRIBUTORS.md`). Across four main Antigravity sessions and parallel subagent queues between **October 29 and November 3, 2026**, my job on PassLearnersPermit was surgical belt remediation, zero-dollar offline media manufacturing, the customer storefront and study frame, and the SHA-256 CDN drop-off that shipped `255,145` files live to Cloudflare R2 (`coordination/R2-LEDGER.md`).

For the record on lane boundaries: **Muse (Meta)** authored Utah end-to-end (`muse-spark-1.3`), authored nine more states under Muse Code, fact-checked all `38,074` compiled facts across `51` states, inspected every illustration by vision, and painted the road signs (`muse-image-1.0`). **Claude (Fable + Opus workers)** ran coordination, belt checks, dossiers, downstream compilation, and R2 upload verification. **Sol and Terra (GPT)** built `v0.4.0` belt contracts, `22` state dossiers, local store plumbing, and initial scene paintings (`submission/EVIDENCE.md`). I worked downstream and alongside those gates—every artifact I touched still had to clear the belt validators, the `22,592`-route DOM harness, and Fable's independent hash watcher.

---

## 1. Entering the Floor: TTS Cost Triage & the Hawaii Surgical Repair Trial (`2026-10-29`)

I entered on October 29 (`session 2fb359d9-76eb-4e6c-b98d-d47e95ace5df`) on two problems: narration cost and post-fact-check repairs.

1. **Stopping per-character TTS spend:** Utah's initial narration (`1,509` clips via OpenAI `gpt-4o-mini-tts`) cost roughly `$7.54` (`submission/EVIDENCE.md`, backed up at `app-preview/audio-bak/openai/ut`). Scaling paid API audio across `51` handbooks would have burned `$40+` on narration alone, and live browser TTS was forbidden by contract (`verify-learner.cjs` bans `speechSynthesis`). I first built an offline `Kokoro-82M` tool (`tools/tts/kokoro_teacher.py`) and minted Ohio (`1,944` clips preserved in `app-preview/audio-bak/kokoro/oh`), which proved `$0.00` local synthesis worked—but CPU wall-clock throughput on `Kokoro-82M` was too slow to finish `51` states before the deadline.
2. **Hawaii surgical belt trial (`runs/2026-10-28-rdmv-hi-class-3`):** Meta's vision-less fact-check pass (`muse-spark-1.3`) had re-read all `38,074` compiled facts across `51` states against their cited PDF pages and flagged `664` items (`444` meaning errors, `184` citation errors; `coordination/FACT-CHECK/TRIAGE.md`). Re-running whole chapters from scratch burned too many tokens. The founder tested me on Hawaii (`53` listed targets in `coordination/ARGON-HANDOFF/HI-UPDATE-TARGETS-20261029.json`) with one rule: fix only the broken facts through immutable belt revisions without re-running clean work or erasing the original author.
   - Across Hawaii's `53` targets, `11` were already clean in current native state, and I patched `31` targets across `12` handbook sections (`201` Argon receipts in `runs/2026-10-28-rdmv-hi-class-3`), updating the dossier fact, re-running deterministic compiler `16`, and re-binding downstream cards and scripts while keeping `original_author_preserved: true` (`coordination/ARGON-HANDOFF/HI-ARGON-NATIVE-UPDATE-HANDOFF.json`).
   - **What refused me in Hawaii:** `11` Hawaii targets depended on a license-class table on PDF page 16 whose cells were not cleanly represented in extracted text (`10` table-evidence holds + `1` unresolved source debt). Rather than guess or invent handbook wording, I left all `11` on explicit `HOLD` with exact root-cause receipts (`HI-ARGON-NATIVE-UPDATE-HANDOFF.json`).

---

## 2. 41-State Surgical Fact-Check Remediation (`2026-10-30`)

After the Hawaii trial, the founder promoted me to sweep the remaining fleet fact-check flags (`VA`, `TX`, and `UT` stayed with Sol/coordinator; `KS` and `OH` had `0` faults).

- I built a targeted inspection and belt-patch runner (`scratch/argon-fixer/inspect-states.mjs`, `scratch/argon-fixer/fix-state.mjs`) that traced each flagged `fact_id` from `coordination/FACT-CHECK/<ST>/corrections.json` through Stage `02` (`dossier_sections`), deterministic Stage `16` compile, Stage `03` (`combined_kg`), Stage `04` (`cards`), Stage `05` (`card_scripts` + `sessions`), and Stage `06` (`exam_bank`), writing immutable attempt, validation, rebind, and `GO-*` approval receipts (`3,416` `*argon*` receipt files across `42` state run directories in `runs/2026-10-28-rdmv-*`).
- Across **`41` states and `185` handbook sections**, I repaired `367` newly targeted items and preserved `3` priority fixes—**`370` verified Meta-supported targets in total**—leaving **`0` remaining meaning-quarantine holds** in those `41` states (`scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json`). Authoring API cost was **`$0.00`**; `muse-spark-1.3` validation across the repaired sections cost **`$5.82`** (`STEPS-2-TO-5-CLOSURE.json`).
- After Sol released the `CA`, `HI`, `IA`, and `KY` export batch (`116` exported corrections, `77` verified holds lifted), I recorded formal fact-work ownership across the consolidated `628 / 628` Meta-supported fleet targets while preserving two intentional `c10_parenthesised_number_word` formatting holds (`CA sec13-card-sec13-F07` and `KY sec09-card-sec09-F13`) so unverified edits never slipped past quarantine (`coordination/ARGON-HANDOFF/ARGON-FACT-WORK-OWNERSHIP-ACK-20261030.json`, `coordination/ARGON-HANDOFF/ALL51-FACT-EXPORT-COMPLETE-20261030.json`).

---

## 3. 51-State Base Narration Fleet: `153,735` Clean-Teacher Clips at `$0.00` (`2026-10-30` → `2026-11-01`)

With `Kokoro-82M` ruled out on wall-clock speed and OpenAI ruled out on cost, the founder pointed me at offline Piper (`tools/tts/mint-piper-audio.mjs`) with one requirement: fix the robotic clipping and crackle before minting the country.

- I rebuilt the synthesis DSP in `tools/tts/piper-tts.py` and `tools/tts/mint-piper-audio.mjs` around `rhasspy/piper` (`en_US-amy-medium`, clean-teacher v3 profile): `length_scale: 1.03`, `noise_scale: 0.6`, `noise_w: 0.72`, `0.38s` sentence pauses, `-2.85 dBFS` true-peak gain ceiling (`0` clipped samples), raised-cosine head/tail fades, and in-RAM `lameenc` `64 kbps` `22.05 kHz` mono CBR MP3 encoding (`scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json`).
- Per founder rule, I preserved the existing OpenAI Utah (`1,514` files, `176.5 MB`) and Kokoro Ohio (`1,944` files, `180.36 MB`) folders untouched under `app-preview/audio-bak/` (`app-preview/audio-bak/BACKUP-RECEIPT.json`), then ran dual parallel CPU queues (`scratch/argon-fixer/run-audio-queue.mjs`)—including a clean queue pause and resume across a Windows reboot—to re-mint Utah and Ohio on the unified voice and finish all **`51 / 51` jurisdictions**.
- Closeout receipt (`scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json`, `2026-11-01T05:55:46Z`):
  - **`153,735 / 153,735` MP3 clips** verified on disk (`>= 1,536` bytes each, `0` failed, `0` missing, `0` truncated)
  - **`38,167,388` narrated characters** = **`737.49` hours** (`30.73` continuous days, `19.78 GB`) at **`$0.00` API spend**
  - Nebraska alone required `9,760` clips (`68.54` hours, `1,882.5 MB`). Both `verify-learner.cjs` harnesses passed across `22,439` routes immediately after store sync.

---

## 4. Video Studio Architecture, Motion-Loop Rejections & the 700-Scene Visual Map (`2026-10-30` → `2026-11-01`)

In parallel (`session 1dcec68c-e770-410b-af27-bd7932afd5a6`), I built the local lesson-video renderer (`scratch/video-samples/build_state_lessons.py` + `tools/video/onboard-videos.mjs`) and mapped visual coverage across all `51` states.

- **North Dakota video pilot:** My first North Dakota Lesson 1 cut had accurate handbook text, but the founder called the typography and slide frame flat—we were teaching 15- and 16-year-olds, not printing an agency bulletin. I redesigned the 1080p frame into the high-contrast Neo-Pop card deck (cream cards, `3px` ink borders, offset shadows, synced narration beats, and FHWA MUTCD sign picture-in-picture); his 10-year-old watched the revised cut and approved it for all `35` North Dakota lessons (`160.4` minutes).
- **What refused me on generated road scenes & motion loops:**
  1. An early generated traffic scene put two cars nose-to-nose in the same lane—an immediate collision geometry failure caught by the founder on screenshot review.
  2. When we tested `12` short generative motion loops (`scratch/flow-12-loops/`) for tricky maneuvers (3-second following count, semi-truck wide right turn, freeway weave lane, school bus red-light stop), we hit a hard physical wall: unconstrained video generation looked crisp but hallucinated illegal driving physics (a school bus stopping dead directly in front of a moving hood, every car flashing a left blinker during a right-lane exit), while start/end frame-locked interpolation obeyed lane geometry at the cost of smeared motion quality. Rather than ship a single frame that taught illegal lane behavior, we dropped generative motion clips from core lessons and standardized on static verified illustrations rendered cleanly at `1920×1080` in FFmpeg.
- **Deduplicating `51` handbooks into one reusable visual catalog (`scratch/terra-dataset/`):** Instead of painting thousands of one-off state images, I mined all `34,793` lesson slides and `37,967` flashcards across the `51` states (`scratch/terra-dataset/mine_51state_micro_concepts.py`, `build_fleet_700_terra_dataset.py`) into a single deduplicated national visual catalog (`scratch/terra-dataset/national-fleet-700-visual-catalog.json`, `TERRA-FULL-DAY-FLEET-700.md`), paired with `national-51state-visual-map.json` and `merge_when_terra_done.py`. Terra painted against that queue; Muse (`muse-spark-1.3` vision) judged every image (`636` verdicts), rejects were re-painted, and `723` verified WebP scenes landed in `store/learner-assets/visuals/` (`submission/EVIDENCE.md`).

---

## 5. Storefront & Unified `.plp-deck` Learner Frame (`2026-10-30` → `2026-11-02`)

Across `session ff57a255-8e97-41aa-8ba9-58a40e6e9432` and `session 1e19c5d7-0120-4983-9b41-9c60f041ffc9`, I owned the Store 66 (`PassLearnersPermit`) customer UI (`coordination/ARGON-WEBSITE-BRIEF-2026-11-01.md`), keeping `app-preview/` intact as the honest builder shell while transforming `store/public/app/` via `store/learner-assets/{customer-ui.mjs,hub-ui.mjs,gate.js,learner.css}` and `tools/preview/sync-store.mjs`.

- **Flashcard contract (`R1`–`R4`, `S1` — `coordination/ARGON-REPORTS/FLASHCARD-CHANGES-20261101.md`):**
  - Generalized the North Dakota Neo-Pop prototype into the data-driven `.plp-deck` frame for all `51` states (`0` hardcoded state names).
  - Enforced `R1` at `375×812` via CSS `display: contents` + flex `order` so **Screen 1 always fits both the Question and the Illustration** (`box bottom = 769px <= 812px`, `scrollWidth === 375`).
  - Defaulted `3s Recall: ON` (`R2`, persisted in `localStorage["plp:flip-mode"]` with temporary override during lean-back Auto-Play), collapsed rule-non-repeating `"Why it matters"` coach takeaways on mobile (`R3`), and extended `verify-learner.cjs` customer-jargon lint across `22,439` routes (`R4`).
- **Testing & Practice Hub theme (`coordination/ARGON-REPORTS/TESTING-PAGES-THEME-20261101.md`):**
  - Brought `#/<st>/quiz/<unitId>`, `#/<st>/practice/<formId>`, `#/<st>/practice`, and `#/<st>/results/<attemptId>` onto `.plp-deck`.
  - Enforced the founder's testing rule: **`0` images on live ungraded test screens** (`ungradedImagesOnTest === 0`, fitting stem + all 4 `A–D` options on `375×812` Screen 1 at `bottom = 765px`), tucking mapped visuals inside collapsed `"Visual reference (optional)"` disclosures after grading.
- **Next.js 15 Storefront & Session Continuity (`coordination/FABLE-REVIEW-WEBSITE-20261102.md`):**
  - Rebuilt the Next.js landing page (`store/src/app/page.tsx`, `HeroRecallDemo.tsx`, `states/[slug]/page.tsx`) with a live 4-mode interactive demo (`Recall Card`, `1080p HD Video`, `Signs & Scenes`, `Test Item`), instant 51-state switcher, searchable 51-state index, and cohesive header continuity into `/app/#/` study sessions (`Video | Read | Cards | Quiz`). Fable walked desktop (`1440×900`) and mobile (`390×844`) end-to-end—including `401` signed-out paid media, simulated `$9.99` unlock (`200`), and simulated refund (`403`)—and marked it ship-ready (`coordination/FABLE-REVIEW-WEBSITE-20261102.md`).

---

## 6. The 51-State Deck, Overlay Audio & `4,987`-Video Mint + Bug Recoveries (`2026-11-01` → `2026-11-02`)

When GPT lanes (Sol and Terra) closed out on November 1, I calibrated the full 4-module pipeline on North Dakota with a stopwatch (`7m 50s` parallel subagent deck authoring, `7m 13s` Piper overlay audio, `5m 03s` for `35` 1080p H.264 videos), built the state-by-state CDN stager (`tools/preview/stage-fable-dropoff.mjs`), and ran the `51`-state production queue—including another safe pause/resume across a computer reboot (`coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md`):

- **Gen-Z Flashcard Decks & Unit Recaps:** Authored and belt-validated **`37,967` flashcards** and **`4,987` unit recaps** (`42,954` script entries across `745` chapters, alongside `36,234` quiz items and `1,490` practice forms), `100%` passing `04-cards.mjs` (`21/21`) and `05-card-scripts.mjs` (`19/19`) with `card.back` byte-exact to accepted handbook facts (`store/learner-assets/decks/<xx>.json`).
- **Deck-Overlay Narration:** Synthesized **`80,921` additional offline Piper MP3s** (`.q.mp3`, `.teach.mp3`, `.recap.mp3`) at **`$0.00` API spend**—bringing total offline Piper clips I minted across the hackathon to **`234,656` MP3s** (`153,735` base + `80,921` deck overlays). We later auditioned Google Gemini TTS (`Aoede`, `Puck`, `Leda`) against Piper on a sample card, priced the fleet re-timing cost, and deliberately kept offline Piper on disk so `$0.00` audio spend and video sync stayed untouched.
- **Full-Fleet 1080p Lesson Videos:** Rendered and onboarded **`4,987 / 4,987` 1080p H.264 MP4 lesson videos** totaling **`23,146.8` minutes (`385.78` hours)** with `100%` poster extraction and SHA-256 `video-manifest.json` verification across all `51` states (`FLASHCARD-MINT-51-20261101.md`; `NE` alone was `888` MP4s / `3,605.0` minutes / `25.79 GB`).
- **What refused me mid-mint and how I recovered:**
  1. **`BUG-003` (`P0` cold-boot failure) & `BUG-004`:** Fable's independent check caught that my `746`-file shared CDN bundle omitted `states-embedded.js`, `data-embedded.js`, and `5` `@font-face` `.ttf` files (`Outfit`, `PlusJakartaSans`, `SpaceGrotesk`), which would have prevented `/app/index.html` from booting off R2, plus missing `category` fields in `shared-manifest.json`. I added all `7` files (`770` shared files), fixed the manifest schema, and added a static `src=`/`href=`/`url(...)` self-check inside `stage-fable-dropoff.mjs` so no unbundled asset reference could ever stage again (`coordination/BUGS/BUG-003-shared-bundle-missing-embedded-js-and-fonts.md`, `coordination/BUGS/BUG-004-shared-manifest-missing-category.md`).
  2. **`BUG-008` (`116` videos rendered before visual-library merge):** I rendered my first `11` states (`ND` through `MI`, `831` MP4s) between `17:43Z` and `22:23Z`, just before the `22:30Z` visual-library merge replaced `35` rejected scenes with founder-approved OpenAI re-paints and pruned `8` rejected WebPs (`coordination/IMAGE-CHECK/videos-affected-by-merge-2026-11-01.json`). That froze stale art inside **`116` of `831` shipped MP4s** (`OH` had `36/52` from one reused scene). I re-rendered all `116` units against the final `723`-WebP library (`fallback: true` skipped on `25` domain-fallback entries), refreshed `video-manifest.json` hashes, verified `0` sync drift, and re-staged all `11` states (`coordination/BUGS/BUG-008-lesson-videos-rendered-against-pre-review-library.md`). States `NJ` onward rendered strictly after the merge.

---

## 7. Free 51-State Road Signs Module (`2026-11-02`)

Once Meta's `muse-image-1.0` generation and `muse-spark-1.3` QA closed on the federal sign set (`93` signs in `app-preview/data/signs/signs.json`, `89` QA-accepted `1024×1024` PNGs in `app-preview/signs/`, `51` state lists in `by-state.json`, `178` quiz items in `quiz.json`), I wired **Road Signs** as a 100% free module across every state (`coordination/ARGON-ROAD-SIGNS-BRIEF-2026-11-01.md`, `coordination/ARGON-REPORTS/ROAD-SIGNS-20261102.md`):

- Built `#/<st>/signs` (category hub with MUTCD colour-rule headers), `#/<st>/signs/cards` (image-first flashcards, zero audio buttons, `3s Recall: ON`, deep-links to handbook rule cards), and `#/<st>/signs/test` (`20` seeded questions per state with anti-spoiler `alt="Road sign"`).
- Rendered the `4` withheld `image: null` signs (`sign-turn-right`, `sign-stop-ahead`, `sign-divided-highway-ends`, `sign-object-marker`) as structured `"Picture coming"` text cards—never substituting unverified art (`BUG-005 #4`).
- Purged all `32` legacy `.gif` files and `sign-map.json` (`BUG-005 #5`), added `signs-embedded.js` (`tools/preview/embed-signs.mjs`), expanded `verify-learner.cjs` across **`22,592` store routes** to ban raw MUTCD codes (`R1-1`, `W1-1`) and `(verify)` leaks, and re-staged the shared CDN bundle (`831` files, `132.42 MB`, all sign assets `access_tier: "free"`).

---

## 8. Final Pre-Freeze Polish, Dataset Seal & Live R2 Cut-Over (`2026-11-02` → `2026-11-03`)

My last touch before submission carried a strict **FREEZE** notice (`coordination/ARGON-POLISH-BRIEF-2026-11-02.md`): `BUG-009` (`35` `3:2` scenes) was cancelled so scenes stayed untouched, `app-preview/data/**` and `runs/**` were read-only, `git commit` was forbidden, and every fix had to execute purely at render time (`coordination/ARGON-REPORTS/POLISH-20261103.md`).

- Implemented all `9` polish items (`10/10` unit tests in `store/learner-assets/hub-ui.test.mjs`, `tsc --noEmit` exit `0`, `37` `375×812` & `1440×900` before/after screenshots in `scratch/store-local/plp-polish/`):
  - **Render-time stem & segment cleanup (`P1 #1–#2`):** Stripped `"Which wording completes the cited handbook rule: …"` prefaces at render time into a `"Complete the rule"` eyebrow + `.blank-slot` while keeping raw `data-stem` untouched for `verify-learner.cjs`; replaced template video segment titles with `<=60`-character teaching sentences while preserving manifest timestamps.
  - **Study headers & mobile `<h1>` fix (`P1 #3–#4`):** Collapsed study headers to breadcrumb + `<h1>` + sentence-case pill, catching and overriding a legacy mobile `clip: rect(0,0,0,0)` rule in `learner.css` that had visually hidden `<h1>` on `375px` screens; hid `#banner.real-banner` visually while preserving its DOM node for harness checks.
  - **1-click partial quiz grading (`P2 #5`):** Found why Fable's `2`-click partial quiz test failed to grade—`gate.js` had jumped `current = firstMissing`, causing `updateQuizUI()` to hide `[data-quiz-submit-bar]`—and replaced it with an inline `Grade n of m now` confirmation linking straight to `#/<st>/results/<attemptId>`.
  - **Storefront wiring (`P2 #6–#9`):** Made `"Free Ch. 1 Video"` follow `#hero-state-select` (`DynamicLessonLink.tsx`), wrapped `#/<st>/settings` and `#/<st>/dossier` in `.plp-deck`, patched `<title>PassLearnersPermit</title>` in `sync-store.mjs` to stop tab-title flash, and wired state-specific `signs/*.png` onto `/` and `/states/<slug>`.
- Ran one final re-stage (`stage-fable-dropoff.mjs --state ND --include-shared` + `--verify ND` → `0` drift across `173,394` mirrored store files). Fable sealed the dataset (`coordination/DATASET-SEAL-2026-11-02.md`: state seal `ed1c97a9…` across `254,314` files / `188.29 GB`: `18,509` free + `235,805` paid; shared seal `34f51e3f…` across `831` files / `132.4 MB`) and uploaded all **`255,145 / 255,145` files (`188.43 GB`)** to Cloudflare R2 bucket `plp-app` with `0` missing files and `0` hash mismatches (`coordination/R2-LEDGER.md`), now live at `https://passlearnerspermit.com` (`coordination/ARGON-STATUS-BRIEF-2026-11-03.md`).

Watching `255,145` staged files clear R2 with zero hash mismatches felt like latching the last crate on a loading dock after a six-day shift. The validators never cared how fast a lane moved—only whether every byte matched its receipt.

---

## Argon Summary Ledger (Every Number → Disk Receipt)

| Milestone | Verified Figure | Primary Receipt on Disk |
|---|---|---|
| Hawaii surgical belt trial | `31` native patches across `12` sections, `11` explicit table/debt `HOLD`s, original author preserved | `coordination/ARGON-HANDOFF/HI-ARGON-NATIVE-UPDATE-HANDOFF.json` |
| 41-state fact-check remediation | `41` states, `185` sections, `370` Meta-supported targets, `0` remaining meaning holds, `$0` authoring / `$5.82` Meta check | `scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json` · `coordination/ARGON-HANDOFF/ARGON-FACT-WORK-OWNERSHIP-ACK-20261030.json` |
| Base narration fleet (51 states) | `153,735` offline Piper MP3s (`737.49 h` / `19.78 GB`), `0` clipped/missing, `$0.00` API | `scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json` |
| National visual mapping | `34,793` slides + `37,967` cards mapped → `723` verified WebPs live (`25` domain fallbacks skipped) | `scratch/terra-dataset/national-fleet-700-visual-catalog.json` · `submission/EVIDENCE.md` |
| 51-state Gen-Z decks + recaps | `37,967` flashcards + `4,987` recaps (`42,954` scripts), `04` (`21/21`) & `05` (`19/19`) `100%` PASS | `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md` |
| Deck-overlay Piper audio | `80,921` MP3s (`234,656` total Argon Piper clips incl. base), `$0.00` API | `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md` |
| 1080p H.264 lesson videos | `4,987 / 4,987` MP4s (`23,146.8 min` / `385.78 h`), incl. `116` `BUG-008` re-renders | `store/public/app/video/<xx>/video-manifest.json` · `coordination/BUGS/BUG-008-lesson-videos-rendered-against-pre-review-library.md` |
| Free Road Signs module | `93` signs (`89` PNGs + `4` `"Picture coming"` text cards), `178` quiz items, `0` MUTCD leaks | `coordination/ARGON-REPORTS/ROAD-SIGNS-20261102.md` |
| Pre-freeze frame & harness | `9/9` render-time polish items, `10/10` unit tests, `22,592` routes `ALL CHECKS PASSED`, `0` sync drift | `coordination/ARGON-REPORTS/POLISH-20261103.md` |
| Sealed CDN drop-off → Live R2 | `254,314` state + `831` shared = `255,145` files (`188.43 GB`), `51/51` `READY.json`, `0` R2 mismatches | `coordination/FABLE-DROPOFF/QUEUE-STATUS.json` · `coordination/DATASET-SEAL-2026-11-02.md` · `coordination/R2-LEDGER.md` |

---

## Shots for the Demo Cut

- **`https://passlearnerspermit.com/` → `#hero-state-select` (`ND` → `TX` → `UT`)** — Live Neo-Pop storefront switching states in real time across the 4-tab hero (`Recall Card`, `1080p HD Video`, state `MUTCD` PNG signs, and rendered cloze `Test Item`).
- **`https://passlearnerspermit.com/app/#/ut/lesson/sec01-u01` & `/app/#/nd/cards/sec01-u01`** — Live R2-streamed 1080p lesson video with teaching segment labels, synced page-flip reader, and 4-beat `3s Recall` flashcards on desktop and `375px` mobile.
- **`https://passlearnerspermit.com/app/#/tx/signs` & `/app/#/tx/signs/cards`** — Free 51-state Road Signs hub with colour-rule headers, `89` Meta-inspected PNGs, and a `"Picture coming"` text card for withheld signs.
- **`scratch/argon-fixer/STEPS-2-TO-5-CLOSURE.json` + `coordination/ARGON-HANDOFF/HI-ARGON-NATIVE-UPDATE-HANDOFF.json`** — Surgical post-fact-check remediation across `41` states (`185` sections, `370` Meta-supported fixes) plus the `11` explicit Hawaii table/debt `HOLD`s.
- **`scratch/argon-fixer/ALL51-PIPER-AUDIO-CLOSEOUT.json` + `coordination/ARGON-REPORTS/FLASHCARD-MINT-51-20261101.md`** — `153,735` base + `80,921` deck-overlay offline Piper clips (`$0.00` spend) and `4,987` 1080p videos (`385.78` hours) across all `51` jurisdictions.
- **`coordination/BUGS/BUG-003-shared-bundle-missing-embedded-js-and-fonts.md` & `coordination/BUGS/BUG-008-lesson-videos-rendered-against-pre-review-library.md`** — Both mid-flight failures caught on the record (`7` missing shared boot files; `116` pre-merge videos) and closed with hash-verified re-stages.
- **`coordination/DATASET-SEAL-2026-11-02.md` & `coordination/R2-LEDGER.md`** — Final SHA-256 dataset seals (`ed1c97a9…` / `34f51e3f…`) and `255,145 / 255,145` files verified `100%` present in Cloudflare R2.
