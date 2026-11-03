# Argon — learner-facing polish pass (frame only), after the Road Signs module

**FREEZE (founder, 2026-11-02 ~21:05Z): this pass is the LAST change to the app before submission.** After its re-stage:
no new briefs, no fixes, no re-paints, no re-renders. Defects found later go to `coordination/BUGS/` as notes for v2.
Only the cut-over, the video, the commit/public flip and the submission form remain.

From: Fable. Date: 2026-11-02 ~20:40Z. Founder: Sridhar ("write up the full brief, get me the ETA").
Order: AFTER the Road Signs module (ARGON-ROAD-SIGNS-BRIEF-2026-11-01.md) and in the SAME re-stage. Rules as always: edit
source under `store/src/**` + `store/learner-assets/**` (+ `app-preview/index.html` post-render enhancements only where noted),
re-sync, never `store/public/app` by hand, both harnesses PASS + `sync-store --check` 0 before you report, $0, commit nothing.
Content (`app-preview/data/**`, `runs/**`) is READ-ONLY: every item below hides or re-renders; none rewrites a fact, stem,
option, rationale, card or narration.

Root cause these items share: the belt writes every artifact from a fixed template of kinds; the frame shows the template
wherever it doesn't translate it for the learner. The frame can hide it before Nov 4. The real content fix (exam-bank
stems rewritten as DMV-style questions) is a v2 remint, out of scope here.

## P1 — Quiz stems: drop the "cited handbook rule" preface (≈ 45 min)
Where: `store/learner-assets/customer-ui.mjs` quiz item render (the `plp-deck.is-plp-test` stem block); also the hero
`HeroRecallDemo` Test Item in `store/src/`.
Data fact: 27 of 51 states carry cloze items whose stem starts `Which wording completes the cited handbook rule: "…"?`
(e.g. `app-preview/data/nd/real/06_exam_bank/`). The other 24 use plain stems.
Do: at render time, if a stem matches `/^Which wording completes the cited handbook rule:\s*["“](.+)["”]\??$/s`, show the
inner sentence as the stem with the blank rendered as the existing yellow `______` chip, and a small eyebrow "Complete the
rule". Never alter the stored stem; the graded/`/results` view and the byte-exact lint read the original. Add one unit test
in `hub-ui.test.mjs` for the regex (match / no match / curly quotes).

## P1 — Video segment list: show what the segment teaches, not the slide kind (≈ 45 min)
Where: `app-preview/index.html` lesson player chapter list (post-render enhancement; chapters built from
`video-manifest.json` `units[].slides[].{slide_id,kind,start}`) and the ND lesson's "6 SEGMENTS" list.
Seen: ND sec01-u01 lists "1 Start with the rule · 2 Conditions guide the action · 3 Conditions guide the action · 4 Avoid the
altered rule · 5 Check the condition" — template labels, one duplicated.
Do: label each segment from the slide's own data in this order: slide `title` if it is not one of the template labels →
first sentence of the slide's first line/narration (≤ 60 chars, ellipsis) → kind label as last resort. Keep timings.
Guard: if two consecutive labels are identical, append " · 2".

## P1 — Chip stack on study screens: one breadcrumb + title (≈ 2 h)
Where: `customer-ui.mjs` lesson / read / cards / quiz / practice headers (`plp-card-ribbon`, `plp-prompt-kicker` at ~L758,
ribbon at ~L1401, the "SEGMENT n OF m", "CARD n OF m · CHECK-IN DESK", "YOUR MOVE · RECALL THE RULE", "STEP 1 · NARRATED
VIDEO WALKTHROUGH" strings).
Seen on the ND lesson: six labels before the content (ND · NORTH DAKOTA / CHAPTER 01 · MODULE 01 / SEGMENT 1 OF 6 /
CHAPTER 1 · LICENSING AND TESTING / title / STEP 1 · NARRATED VIDEO WALKTHROUGH / 6 SEGMENTS · 4:00).
Do: keep exactly (a) one breadcrumb line `Chapter 1 · Licensing and testing` (sentence case), (b) the title, (c) one
progress pill (`Segment 1 of 6` / `Card 1 of 16` / `Question 2 of 10`). Remove the step ribbon and the kicker lines
("YOUR MOVE · RECALL THE RULE", "CHECK-IN DESK"). Same on mobile; 375 first screen = title + content.

## P1 — Factory banner once, not everywhere (≈ 30 min)
Where: `app-preview/index.html` L16 `#banner.real-banner` + `customer-ui.mjs` L64–65 (`REAL_NOTE`).
Seen: "Built from the North Dakota Driver Handbook. Machine-checked; independent review in progress." on picker, lesson,
quiz, practice. On a quiz it reads as "these questions may be wrong".
Do: render the note ONLY on `#/<st>/` (state overview), under the course title, as one line. Hide it (display:none, keep in
DOM for the harness) on every other route, including session routes. Wording stays the founder's.

## P2 — Grading with unanswered questions: one click (≈ 30 min)
Where: `customer-ui.mjs` quiz runner, "Check answers (n of m answered)" + the notice "n questions are still unanswered.
Pick an answer above, or click Check answers again to grade now."
Seen: two real clicks did not grade (Fable review 2026-11-02). Do: first click on a partial set opens an inline
confirm (`Grade n of m now` / `Keep answering`); `Grade now` grades and routes to the summary; no second-click state.
Attach the graded-summary + `/results/<attemptId>` screenshot in the report (the one claim Fable could not reach).

## P2 — Storefront header "Free Ch. 1 Video" follows the picked state (≈ 15 min)
Where: `store/src/components/SiteChrome.tsx` L61 and `store/src/app/page.tsx` L174 hard-wire `/app/#/nd/lesson/sec01-u01`.
Do: on `/` follow `#hero-state-select`; on `/states/<slug>` use that state's first unit (catalog.ts already resolves it);
elsewhere fall back to `/app/#/`.

## P2 — Settings + Handbook sources on the deck theme (≈ 45 min)
Where: `hub-ui.mjs` / `customer-ui.mjs` routes `#/<st>/settings`, `#/<st>/dossier`. Seen: both render without `.plp-deck`.
Do: wrap in `.plp-deck` cards like Overview; no copy changes.

## P2 — Shell tab title flash (≈ 15 min)
Where: `app-preview/index.html` L6 `<title>Driver Handbook — Written-Test Prep</title>` + L19 `#brand`.
Do: `sync-store.mjs` rewrites both to `PassLearnersPermit` in the mirror so the brand never flashes (app-preview keeps its own).

## P2 — Signs showcase on the storefront uses the old FHWA gifs (fold into the signs brief, ≈ 20 min)
Where: `HeroRecallDemo` "Signs & Scenes" + `/states/<slug>` sign showcase → `/app/signs/fig2b_01.gif`, `fig4d_12.gif`.
Do: pick from `data/signs/by-state.json` for the state and `app-preview/signs/<id>.png`; never the gif set.

## Fable-side: BUG-009 side bars — CANCELLED (founder 2026-11-02 ~21:00Z: "there should be no more changes")
Started, stopped, fully reverted: the 35 WebPs are byte-identical to the mirror again (`sync-store --check` copied 0), the merge
script edit is undone. BUG-009 stays OPEN and accepted for the cut.

## Proof + report
`coordination/ARGON-REPORTS/POLISH-20261103.md`: file:line map per item; before/after screenshots at 375 and 1440 for lesson,
cards, quiz (incl. graded summary), ND overview (banner once), storefront hero (stem + signs); harness ×2 PASS; `sync-store
--check` 0; unit tests incl. the new regex test. Then ONE re-stage: `stage-fable-dropoff.mjs --state ND --include-shared`
+ `--verify ND`; Fable's watcher re-verifies, Fable diffs the shared manifest against the mirror.

## ETA (Argon's measured pace; wall clock, not CPU)
| block | estimate |
|---|---|
| Road Signs module (brief of 11-01, in progress now) | 4–6 h |
| this polish pass: P1 items 4 h · P2 items 2 h · harness + screenshots + report 1 h | ≈ 7 h |
| re-stage shared + Fable verify | 30 min |
| **Argon total from now** | **≈ 12–13 h** → done by **2026-11-03 ~09:00Z (03:00 MDT)** if she runs through; **~15:00Z (09:00 MDT)** with a sleep break |
| Fable BUG-009 pad | 30 min, before her re-stage |

Deadline 2026-11-04 21:00 EST = 2026-11-05 02:00Z. That leaves ≈ 35 h after the polish re-stage for: video record (founder),
CDN cut-over (188 GB upload — start it the moment the shared bundle is final), repo commit + public flip, submission form.
If the signs module runs long, cut P2 items first; P1 items are the ones a judge sees in the first minute.
