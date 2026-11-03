# Argon — flashcard frame changes before stamping ND chapters 2–11

From: Fable (coordinator). Date: 2026-11-01. Founder: Sridhar (reviewed the ND sec01 deck, approved these changes).
Scope: `store/learner-assets/` only (customer-ui.mjs `vCards`, gate.js `mount`, learner.css `.nd-neopop-deck`).
Runs IN PARALLEL with your chapters 2–11 stamp: the frame is shared code, the cards are data, so nothing here
re-stamps a card and the stamp never waits on this. Same rules as ARGON-WEBSITE-BRIEF-2026-11-01.md (edit the
source, re-sync, never store/public/app by hand; both harnesses PASS before you report).

Verdict on sec01: the desktop card is the best screen the store has. The phone version buries the two things
that make it good. Four changes, two of them required before stamping.

## REQUIRED (do first, same day)

### R1. Mobile order: question → picture → answer → hook. Chrome collapses to one line.
Today at 375px (scratch/store-local/nd-flashcards/06-mobile-375-card1-flipped.png) the question starts ~700 px
down, after: quest badge, chapter pill, card counter, XP bar, level sticker, H1, audio notice, Auto-Play, Instant
Flip. The illustration and the memory hook land about THREE screens below the question. The picture that does the
selling is below the fold on the device that sells (learner-permit traffic is teens and parents on phones).

Target at ≤ 768px, top to bottom:
1. One-line header: `CH 01 · M 01 · CARD 1/16` + XP value (no bar). No quest badge, no level sticker, no H1
   (the breadcrumb already says Flashcards). Audio notice gone (the Play button is the notice). Auto-Play and
   flip mode become two small icons on that same line or inside the card ribbon.
2. The question (cream box, beat strip can shrink to the 4 numbers).
3. The illustration (when the card has one) — directly under the question, before the answer, so it is on the
   first or second screen. No `ILLUSTRATION` tag on mobile; caption stays.
4. Answer (official) → memory hook + pills.
5. Coach takeaway LAST, collapsed behind a "Why it matters" disclosure (see R3).
6. Lock row, source line, pager.
Desktop (≥ 1024px) layout stays as it is. Do it with CSS order/grid areas on the existing DOM where you can
(`.nd-card-grid.has-visual` already knows whether a visual exists); if the rail must move in the DOM, keep the
desktop two-column result pixel-identical to 02-desktop-card1-flipped-illustrated.png.
Proof: 375px screenshots of card 1 (with image) and card 4 (no image), flipped and unflipped, showing the question
AND the picture on the first screen; `scrollWidth === 375`.

### R2. Instant Flip default OFF.
gate.js:536 `var ndInstantFlip = true;` → `false`, and the pill renders in its "⏱ 3s Recall: ON" state
(customer-ui.mjs:452 currently hard-codes `is-instant-on` / `aria-pressed="true"` / "⚡ Instant Flip: ON").
A card that opens with its answer showing is not a flashcard; retrieval is the point of lesson → cards → quiz.
Remember the learner's choice in localStorage (`plp:flip-mode`) so a learner who prefers instant keeps it.
Auto-Play Deck stays as the lean-back mode and may force instant while it runs, restoring the setting after.
Proof: fresh profile opens card 1 with the answer hidden; toggling persists across a reload.

## RECOMMENDED (do after R1/R2 if time allows; otherwise after Nov 4)

### R3. Say the rule once.
Official answer, then Coach Takeaway restating it in more words, then the hook restating it again. On mobile that
is a screen of scroll that teaches nothing new. Keep Coach only where it adds the WHY or the trap (sec01 card 1's
"Do not get bounced at the front desk before question one" is the keeper; "Lock in: Legal status, name, birthday,
address" duplicates the hook, drop it). Put Coach behind a "Why it matters" disclosure, collapsed on mobile, open
on desktop. This is a template rule in the generator (scratch/nd-genz-cards/build-nd-sec01-deck.mjs), not
per-card editing: the belt checks (04.BACK_FIDELITY etc.) are untouched because the official back is unchanged.

### R4. Trim the game words.
Keep the XP meter and the lock button. Drop `ND · CLASS D QUEST`, `LEVEL 1 ·`, and rename `Spin Again` →
`Show again`, `Locked (+25 XP)` → `Got it (+25 XP)`. A teen tolerates the quest words; the parent paying $9.99
reads them as a toy. Also add them to the customer-jargon lint in tools/preview/verify-learner.cjs so they
cannot come back.

## STRUCTURAL (before any second state gets this frame)

### S1. This is the store's card frame, not North Dakota's.
It is named `.nd-neopop-deck`, with `nd-` on every class and "NORTH DAKOTA" as a fallback string
(customer-ui.mjs:446). It must be ONE frame for 51 states, driven by data (state code, theme, chapter meta),
or we end up with 51 skins. Rename to `.plp-deck` / `plp-` (one sed, both files, plus learner.css selectors),
pull the state name from `states.json`, and make the theme key a per-state field with a default. Do this before
chapters 2–11 if it costs under an hour; otherwise immediately after, before any non-ND state is touched.

## Report
coordination/ARGON-REPORTS/FLASHCARD-CHANGES-20261101.md: what changed per item (file:line), the mobile and
desktop screenshots, harness results (verify-learner on app-preview and --root=store/public/app), sync --check
0 drift. Commit as yourself on main with the sec01 stamp or separately; do not wait for me to review before
starting chapters 2–11.
