# Argon — Road Signs module in every state (wire the national package into the frame)

From: Fable (coordinator). Date: 2026-11-01. Founder: Sridhar (decided: "separate session in all 51, it's road signs").
Scope: shell routes + store wrapper only. The DATA is done and frozen for you: read it, never edit it. Same rules as
ARGON-WEBSITE-BRIEF-2026-11-01.md (edit the source, re-sync, never store/public/app by hand; both harnesses PASS before you report).
Order with your other work: after the flashcard/quiz stamp you are on; before any frame polish.

## 0. Addendum 2026-11-02 (founder: go now)
- Order: START NOW. The 51-state flashcard/video mint and drop-off are complete (51/51 verified), so this is your next task.
- Data re-checked 2026-11-02: `signs.json` 93 (4 CONTRADICTED meanings already corrected, e.g. road-closed), `by-state.json` 51,
  `quiz.json` 178, `signs/` 89 PNGs. Unchanged since this brief; still read-only for you.
- Store mirror today has `store/public/app/signs/` but NOT `data/signs/` → the sync-store copy set must add `data/signs/**`
  (see §2 Store gate). BUG-005 notes an "old sign set in store": replace it with this package, nothing else.
- Drop-off: `shared-manifest.json` currently lists only 32 sign files. After wiring, re-stage the shared bundle
  (`stage-fable-dropoff.mjs --include-shared`) so all 89 images + `data/signs/*.json` ride the CDN as FREE files. I re-verify.
- Report file: `coordination/ARGON-REPORTS/ROAD-SIGNS-20261102.md`. Log defects as `coordination/BUGS/A-BUG-NNN-slug.md`.

## 1. What exists (raw layer, closed 2026-11-01)

All under `app-preview/`:
- `data/signs/signs.json` — 93 signs. Per sign: `id`, `name`, `category` (regulatory | warning | school | work-zone | guide | services),
  `mutcd` + `mutcd_status: "(verify)"`, `spec` (shape/colour/legend, human-readable), `meaning` (one sentence, fact-checked
  against handbook text), `image` (`{file, sha256, generator, qa}` or **null** for 4 signs), `source_ref` (FHWA MUTCD, official),
  `states_mentioning`.
- `data/signs/by-state.json` — `states[XX].signs` = ordered sign ids that state's handbook mentions (32–67 per state, all 51 incl UT);
  `states[XX].handbook_cards[signId]` = up to 6 belt card ids from that state that mention the sign (link "your handbook's rule").
- `data/signs/quiz.json` — 178 items. `kind: "sign_meaning"` ("What does this sign mean?") and `"sign_name"` ("Which sign is this?"),
  `sign_id`, `image`, `stem`, `options[{key,text,correct}]`, `rationale`, `source_ref`. Only signs WITH an image have items.
- `signs/<id>.png` — 89 images, 1024x1024, white background, Meta-generated, each QA-ACCEPT (legend read back, shape/colour/symbol checked).
- 4 signs ship with `image: null` (sharp turn, stop ahead, divided highway ends, object marker): render them as a text card
  (name + spec + meaning) with a small "picture coming" note. NEVER substitute a scene illustration or an FHWA figure sheet.

Provenance you may show: footer/caption "Sign standards: FHWA MUTCD 11th Ed." Never show `mutcd` codes to learners (they are (verify)).

## 2. What to build

One module per state, same loop as the others, reached from the state's chapter list and the step bar:

**Route `#/<st>/signs`** (hub) — `.plp-deck.is-plp-hub` style. Title "Road signs". Intro line: "The <N> signs the <State> handbook
expects you to know." Grouped by category in this order: regulatory, warning, school, work-zone, guide, services, with the
category's one-line colour rule as the group header (e.g. "Red and white = you must obey", "Yellow diamond = warning ahead",
"Yellow-green pentagon = school", "Orange = work zone", "Green = guide, blue = services, brown = recreation"). Tiles: image (or
text card), name. Tap → the card view. Buttons: "Study cards" (starts the deck at the first sign) and "Sign test".

**Route `#/<st>/signs/cards`** — the `.plp-deck` flashcard frame you already have, fed from the package instead of 04 cards:
front = the image alone with "What does this sign mean?" (no name, no caption: the name is the answer); back = name + meaning;
memory hook = `spec` shortened to shape + colour (e.g. "Red octagon"); pills = category + the colour rule. Order = by-state order.
"See your handbook's rule" link under the back when `handbook_cards[signId]` is non-empty → opens the first of those cards.
Mobile order and flip default exactly as R1/R2 of ARGON-FLASHCARD-CHANGES-2026-11-01.md (image is the question, so it sits in the
question slot, not the companion rail). Narration: none for now (no audio minted for signs); hide the audio controls on this deck.

**Route `#/<st>/signs/test`** — the `.plp-deck.is-plp-test` quiz runner fed from `quiz.json` filtered to the state's sign ids,
20 items per attempt (random, seeded per attempt id, half `sign_meaning` half `sign_name` when available), graded like a module
quiz, results into the same attempt summary. Anti-spoiler: no caption on the image while answering (your existing rule).

**Entry points:** chapter list gets a "Road signs" entry after the last handbook chapter (icon: a yield triangle), the hub step
bar treats it as Lesson → Flashcards → Quiz with Lesson = the hub page itself (no video, no reading pages for v1). Practice Test
Center gets a "Road signs test" tile.

**Store gate:** Road signs is **free** in every state (it is the best SEO/funnel page we have: "<State> road signs test"). Add
`signs/**` and `data/signs/**` to the free paths in `store/learner-assets/gate.js` and to `tools/preview/sync-store.mjs` copy set.
`/states/<slug>` landing gets one line + link: "Free: every road sign on the <State> test, with pictures."

## 3. Rules

- Read-only on `app-preview/data/signs/**` and `app-preview/signs/**`. If a sign looks wrong to you, write it in your report; do not
  edit or swap the image. (The QA receipts are in `coordination/SIGNS/qa/<id>.json` if you want the reasoning.)
- No new copy that states a rule: `meaning` and `spec` are the only teaching text; the colour-rule headers above are the only
  additions and are MUTCD general facts.
- Customer jargon lint still applies (no "belt", "verified", "accepted"; "(verify)" never reaches the learner).
- 375px: image fits the first screen with the question; `scrollWidth === 375`.
- $0 spend. No model calls.

## 4. Proof + report

`coordination/ARGON-REPORTS/ROAD-SIGNS-20261101.md`: file:line map; screenshots at 375 and 1440 for hub, card front, card back,
test question, test graded, for ND and one other state (TX); `verify-learner.cjs` on app-preview and `--root=store/public/app`
PASS; `sync-store --check` 0 drift; the four image-less signs rendered as text cards (screenshot one). Commit nothing until the
founder's call on the mint; keep the work on disk.
