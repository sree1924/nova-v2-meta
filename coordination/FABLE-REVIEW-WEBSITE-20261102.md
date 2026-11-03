# Fable review — Argon website handoff (Gen-Z Neo-Pop store + unified /app/ shell), 2026-11-02 ~20:05Z

Verdict: **PASS, ship-ready for the local build**, with 1 claim I could not reach, 2 content notes and 1 required follow-up
before the CDN cut-over. Walked in the built-in pane at 1440×900 and 390×844 against `http://127.0.0.1:4320` (dev:local).

## Reproducible checks (ran myself)
| check | result |
|---|---|
| `sync-store.mjs --check` | 0 drift (173,301 files, 51 complete, 19,295 free paths, 204 paid prefixes, 39 hidden ids) |
| `node --test store/learner-assets/hub-ui.test.mjs` | 8 / 8 |
| `verify-learner.cjs` (app-preview) | ALL CHECKS PASSED |
| `verify-learner.cjs --root=store/public/app` | ALL CHECKS PASSED |
| `npx tsc --noEmit --incremental false` (store) | exit 0 |

## Walkthrough, desktop 1440×900
- **Home `/`**: 4 hero tabs all live. Recall Card flips; HD Video streams `/app/video/<st>/…mp4` at 1920×1080 (played 3 s);
  Signs & Scenes shows a handbook scene + a sign; Test Item grades a click (B marked, 3 states coloured). `#hero-state-select`
  has 51 options; ND→DC→PA→WY re-point every drill link live: DC `sec01-m01-unit`, PA `sec01-module-01` + `sec01-u01`,
  WY `sec01-m01-unit`. `#states` explorer: search box, 306 pills, 51 states linked.
- **Landing pages** ND / DC / PA: chapter-1 launch bar (lesson/read/cards/quiz), 1080p showcase video, 3-track narration
  (`/app/audio/nd/sessions/…mp3`), 11-chapter curriculum links, $9.99 sidebar; DC and PA launch the ids claimed.
- **Header continuity** on `/app/#/`, `#/nd/`, chapter, module: `y = 0`, height 76.4, `max-width 1180px`, `min-height 74px`,
  shield SVG + wordmark present, `#brand-sub` = `50 STATES + D.C. · CH. 1 FREE` → `ND · NORTH DAKOTA MANUAL` → in session
  `ND · CH. 01 · MODULE 01`. Chapter-1 module tiles carry the 4 drill pills (`#/nd/lesson|read|cards|quiz/sec01-u01`).
- **Session mode** (`body.is-study-session` true on lesson / read / cards / quiz / practice): nav swaps to
  `← Module 1` + Video / Read / Cards / Quiz + Chapters + unlock pill. `#banner.real-banner` sits at y 1475, below `main#view`
  (y 76) and above `footer.site` (y 1510) — claim holds (by geometry; it is a body child, not reparented).
- Lesson: video plays, `✓ Mark watched` present. Read: 9 pages, Prev/Next, `▶ Listen to page` ×6, 8 handbook visuals.
  Cards: 16 cards, `⏱3s Recall: ON`, Flip Card, Play Audio, XP meter. Quiz: 16 items, **0 images during the test**.
  Practice: `#/nd/practice` → Set A → 21 questions, session mode.
- **Gate / unlock / refund** (local mode): locked chapter 2 shows `.gate-buy-card`; `HEAD /app/video/nd/sec02-u01.mp4` → **401**
  signed out, free `sec01-u01.mp4` → 200. `Unlock ND · $9.99` → `/sign-in?redirect_url=/api/checkout?state=ND` → test-learner
  → `/purchase/local?state=ND` ($0.00 simulated) → `/purchase/success` → `/api/me` `{ND: 2027-11-02…}`, paid mp4 → 200,
  header pill `ND Pass Active`, `#/nd/lesson/sec02-u01` plays (1920×1080), overview shows 22 chapter links, no gate.
  `/states/north-dakota` → `Simulate refund (revoke access)` → `/api/me` entitlements `{}` immediately, paid mp4 → **403**,
  chapter 2 gate card back, pill back to `Unlock ND · $9.99`, chapter 1 still free and playing.

## Walkthrough, mobile 390×844
`scrollWidth === 390` on `/`, `/states/north-dakota`, lesson, cards, quiz, settings, dossier, support, refunds, terms, privacy.
Session pills `← Module 1 | Video | Read | Cards | Quiz` on one row, right edge 372 px, no element clipped (screenshots taken).
Cards: question + Flip/Play on the first screen.

## Not verified by me
1. **Graded quiz summary, missed filter, `/results/<attemptId>`.** Two real clicks on `Check answers (2 of 10 answered)` did
   not grade (the "8 still unanswered… click again to grade now" notice stayed). Either grading needs all answers or my second
   click missed. Argon: attach the graded-summary + `/results/…` screenshot, or confirm partial grading is intentional.

## Notes (not blockers)
2. The Signs & Scenes tab and the landing sign showcase use the OLD FHWA figure gifs (`/app/signs/fig2b_01.gif`, `fig4d_12.gif`),
   not the 89-image Meta sign package. The Road Signs brief (GO today) replaces that set — fold the showcase swap into it.
3. Storefront header `Free Ch. 1 Video` is hard-wired to `/app/#/nd/lesson/sec01-u01` regardless of the picked state (minor).
4. `#/nd/settings` and `#/nd/dossier` render without `.plp-deck` (themed via page styles); fine visually, just not the deck class.
5. Banner copy "Machine-checked; independent review in progress" is builder-adjacent wording — founder's call, known.
6. Card count 37,928 in the handoff = 37,967 − 39 quarantined; consistent.

## Required follow-up before cut-over
- The staged shared bundle (`coordination/FABLE-DROPOFF/payload/shared/`) was last re-staged 2026-11-01 22:33Z — **before** this
  store/shell work. `learner.css`, `customer-ui.mjs`, `hub-ui.mjs`, `gate.js`, `index.html` in the mirror are newer. Argon: run her
  own step 4 (`stage-fable-dropoff.mjs --state ND --include-shared` + `--verify ND`); my watcher re-verifies ND and I diff the
  shared manifest against the mirror.

Nothing committed; media untouched; app-preview/runs untouched as claimed (spot-checked via sync drift = 0).
