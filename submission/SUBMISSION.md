# PassLearnersPermit — submission copy (Meta Global AI Developer Hackathon, indie track)

Status: READY 2026-11-04 (video public, store live, repo public) · deadline 2026-11-04 21:00 EST (2026-11-05 02:00Z) · form submission is the founder's.
Every number here is sourced in `EVIDENCE.md`; do not raise a figure without a pointer.

## Project name
PassLearnersPermit — a Meta-verified learner-permit course for all 51 US jurisdictions

## Tagline (≤ 140 chars)
51 state driver handbooks → 51 complete study courses in 8 days, with Meta models as the author, the fact-checker and the picture inspector.

## Links
- Repository: https://github.com/sree1924/nova-v2-meta (PUBLIC since 2026-11-04; code + course JSON for all 51 states, no media, no keys)
- Video (3 min): https://youtu.be/T_3b0C4A2uk (PUBLIC, personal channel Sree V, uploaded 2026-11-04)
- Live store: https://passlearnerspermit.com (live since 2026-11-03; chapter 1 free in every state)
- Contributors: see `CONTRIBUTORS.md` (one human; AI tooling listed)

## What it is (impact — 30%)
A learner-permit study course for every US state and DC, built from each state's official driver handbook, sold at **$9.99 for
one state for one year**, with **chapter 1 free in every state**. Each chapter is one learning unit: lesson video → book-style
reading pages → flashcards with narration → module quiz; every state ends with full-length practice tests at the state's
published passing score.

Why it matters: the learner-permit test is the single most-taken high-stakes exam in the US (every new driver, every year),
the official handbooks are free but unreadable PDFs, and the paid prep market is full of unverified question banks. This course
is the opposite: **every learner-facing sentence traces to an accepted handbook page**, and the facts were independently
re-checked by a second model pass before anything shipped. Scale as built: 51 jurisdictions, 745 chapters, 4,987 learning
units, 37,967 flashcards, 36,234 quiz items, 1,490 practice forms, 4,987 lesson videos (385 hours), 723 verified illustrations,
93 federal road signs.

## How Meta models were used (Meta tooling — 25%)
Three distinct Meta roles, each receipted call by call in the repo:

1. **Author (Model API, `muse-spark-1.3`, strict JSON schema).** The Utah course is the centerpiece: 16 handbook chapters →
   dossier → compiled fact index → knowledge graph → flashcards → exam bank → teaching sessions, 371 receipted calls, $44.09
   of credit, every artifact accepted by a deterministic validator the model cannot talk past. Nine further states (TX CA FL NY
   VA KY OK CT IA) were authored by **Muse Code under its subscription** through the same belt and the same validators
   (`run-utah.mjs --author muse`; 1.04 B tokens of operator work, $0 API).
2. **Fact-checker (Model API, vision-less).** Every compiled fact in all 51 states (38,074) was re-read against only its cited
   handbook page by `muse-spark-1.3` in strict JSON: 664 flagged, re-checked, 444 meaning errors → the 443 affected cards were
   hidden at point of sale; 4 outright contradictions fixed first. A planted-error control (3/3 caught, 0 false flags) proved
   the checker before the fleet run. Cost ≈ $48 for the whole country.
3. **Picture inspector + sign painter.** Every illustration in the 723-scene library passed a `muse-spark-1.3` vision review
   against five drawing rules (zero text, US right-hand traffic, no right-hand-drive cabin, no head-on same-lane cars, one lit
   signal lens) plus scene-match and teaching-correctness; 636 verdicts, rejects re-painted and re-inspected, the founder
   ruling on HUMAN_REVIEW only. The 93 MUTCD sign images were generated with `muse-image-1.0` and QA'd by the same vision pass
   against the handbooks' sign meanings (73 supported, 4 contradicted and corrected, 16 not covered by any handbook text; 4 images
   withheld by QA and shipped as text cards rather than unverified art).

Also built on Meta: **Muse Voice Transcribe** spoken recall (built and verified end to end), and Muse Code as the
belt *operator* for the Utah run (it dispatched stages, read validator holds and retried under a bounded lineage policy).

Not Meta, stated plainly: narration audio is pre-generated TTS (OpenAI for the first Utah pass, offline Piper for the fleet);
35 of 723 illustrations were re-painted with OpenAI's image model after Meta's re-paints were rejected by eye; the remaining
41 states' chapter dossiers were authored by Claude and GPT agents through the identical belt and validators, and then
fact-checked by Meta; the flashcard decks, videos, audio and store frame were built by a Gemini agent against the same
validators.

## How it was built (engineering — 20%)
- **The belt.** Seven strict-schema stages per handbook chapter (`schemas-strict/`), each with compensating checks
  (`tools/belt/checks/`), an append-only SQLite ledger with per-attempt micro-USD reservations, lineage caps, immutable
  accepted artifacts, and a deterministic compile step that turns accepted facts into byte-exact flashcard backs and spoken
  forms. A HOLD costs one attempt and teaches a convention; nothing is hand-edited.
- **Scale mechanics.** Thin authoring packets (232 KB → ~3 KB per part), a queue runner with 429-aware pausing, file-transport
  authoring so any agent (Meta, Claude, GPT) is a drop-in author under the same gate, and a one-command shell rebuild
  (pointers → 51 exports → embed → quarantine → harness → store sync → audit).
- **Verification you can click.** `app-preview/trace.html` shows every attempt, cost and check; a DOM harness asserts counts,
  byte-exact wording and audio coverage over 22,439 routes on both the dev shell and the store mirror; a CDN drop-off contract
  (`coordination/FABLE-DROPOFF/`) hashes all 254,314 payload files and splits free/paid tiers, independently re-verified per
  state (51/51 PASS).
- **Store.** Next.js 15 + Clerk + Stripe wrapper over the shell: server-side signed-cookie paywall on every paid file, webhook
  grant, refund revoke, 51 indexable landing pages, quarantine gate hiding known-bad cards.

## Demo (25%)
https://youtu.be/T_3b0C4A2uk (2:58). No human on camera: the model lanes that ran the belt tell it in their own words,
over the live product and the receipts. Muse carries the centre: authoring Utah, re-reading 38,074 facts (the Connecticut
blowout-braking contradiction on screen), inspecting pictures, judging signs. Then Terra, Sol and Argon in turn, the bug
ledger, the hash-sealed dataset going to the edge, and the $9.99 gate. Every figure appears on screen with its receipt file;
the script with every line and shot is `VIDEO-SCRIPT.md`, the lanes' full reports are `coordination/DEMO-STORIES/`.

## Built during the event
The lane repo was created 2026-10-26; everything in it (belt validators, runner, all 51 state runs, the shell, the store,
the audio, the videos, the drop-off contract) was built Oct 26 – Nov 4. Nova's pre-existing factory, its 65 live stores and
its V1 corpus are **not** in this repo and were never sent to a Meta model. Reused from the founder's earlier work by
reference only: the Next/Clerk/Stripe store pattern and the audio-minting recipe.

## By design
- No human reviewed the content, and that is the thesis: a model wrote it, Meta's model re-read every fact against its
  cited page, a validator decided what exists, and every decision left a receipt. The 443 cards hidden by the fact check were
  re-authored surgically through the same belt (370 targets across 41 states); anything still quarantined stays hidden.
- Nothing is generated while a learner is present: narration, pictures and cards are pre-generated and hash-sealed; the app
  plays files.
- The ten Meta-authored states were cross-checked by the Claude and GPT lanes, and the 41 Claude/GPT-authored states were
  fact-checked by Meta, so no state's content was judged only by its own author.
- Passing scores and question counts appear only where the handbook states them; otherwise the course says so.
