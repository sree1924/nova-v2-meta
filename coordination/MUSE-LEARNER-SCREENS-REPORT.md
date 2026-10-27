# Muse learner-screens report — real Section 9 learner app (2026-10-27)

Lane: preview builder. Touched `app-preview/` + `tools/preview/` only.
No belt run, no `tools/belt/*`, `runs/*`, `prompts/*`, `contracts/*`, `schemas-strict/*` changes.
Re-ran `node tools/preview/export-content.mjs` (read-only ledger export): `copied=14 skipped_non_accepted=63` — embed fresh.

## What changed (`app-preview/index.html`, 36,483 → 49,093 bytes)

Every learner route now renders the accepted Section 9 artifacts; the fictional
Nowhere sample lives only under `#/synthetic-sample` (SYNTHETIC banner kept there).

- Home `#/`: course = Utah Driver Handbook Section 9, Rules of the Road; 3 modules
  with KG labels + real node counts. Progress stays per-browser localStorage under a
  new syllabus namespace `nova-preview:v1:ut-sec09` (old sample namespace abandoned).
- Module list `#/chapters` + new hub `#/module/:module`: Lesson → Flashcards → Quiz,
  matching the KG `curriculum_unit_hints` user_cycle (session > flashcards > module_hub,
  quiz chosen from the hub). Unit mapping from hints: m01→u01, m02→u02, m03→u03.
- Lesson `#/lesson/:unit`: accepted 05.sessions unit — slides in order with title,
  lines, "teacher says" narration panel + estimated seconds; then why/how, worked
  example, misconception + correction, memory support, self-check (prompt → reveal
  answer + rationale).
- Flashcards `#/cards/:unit`: accepted 04 deck, front → 3-second recall beat →
  back (accepted wording, esc-only) + memory hook + 05.card_scripts teaching text;
  deck recap at the end; text-first/no-audio footer note. Reduced-motion users skip
  the beat and reveal instantly.
- Quiz `#/quiz/:unit`: accepted 06 module quiz, options A–D; grading shows the
  correct rationale plus every per-option rationale; results render from the stored
  attempt (no re-lookup), review list included.
- Practice `#/practice` chooser + `#/practice/:form`: the two accepted forms
  (form-a / form-b, 19 items each), each labelled "practice form" with an explicit
  "No pass or fail is claimed" panel — no official pass language anywhere.
- Provenance: REAL banner ("REAL — Utah Section 9, belt-validated, audit pending")
  on every learner screen; per-card/item/slide "Source:" line with fact id(s) +
  handbook page (page map built from accepted card/item source_refs) linking to `#/dossier`.
- Reviewer routes (`#/dossier`, `#/modules`, `#/real-cards`, `#/real-quiz`,
  `#/real-lesson`) unchanged in behavior; stale "learner screens remain synthetic"
  copy corrected. Settings links the synthetic sample for comparison + reviewer routes.
- `app-preview/README.md` rewritten (real course, new routes, fresh sha256 table).

## Counts (harness-verified against the embedded fallback)

- Modules: 3 (m01 "Freeway, flex and express lanes" 9 nodes · m02 "Intersections,
  markings, signals, signs and right-of-way" 15 nodes · m03 "Section 9 learning
  spine" 15 nodes).
- Lesson slides: u01 7 · u02 6 · u03 8 (= 21); every slide title + line +
  narration + seconds asserted present.
- Flashcards: u01 9 · u02 15 · u03 15 (= 39); all 39 fronts + backs + hooks +
  teaching texts byte-exact (modulo HTML-escaping); 3/3 deck recaps present.
- Module quizzes: u01 9 · u02 15 · u03 15 (= 39); all stems + A–D texts +
  correct + per-option rationales asserted.
- Practice: 2 forms × 19 items (form-a q01–q19, form-b q20–q38; q39 lives only in
  the m03 module quiz — as accepted).
- "Nowhere"/"SYNTHETIC SAMPLE" sweep: zero hits on all 18 learner routes; the
  single "Nowhere" string in the file renders only on `#/synthetic-sample`.
- Harness: `node tools/preview/verify-learner.cjs` → `RESULT: ALL CHECKS PASSED`
  (exit 0, ~150 assertions). Inline module passes `node --check`.

## What I could not verify

- Real-browser rendering: no browser run (no browser tooling in this lane). Layout
  at 375 px, keyboard tab order, and the 3-second recall beat timing are verified
  only structurally (valid markup, native buttons/links, unchanged mobile-first CSS
  with 44 px targets, `prefers-reduced-motion` branch present). Open
  `app-preview/index.html` in a browser and click through one module to confirm.
- Live-HTTP data path: the harness forces the `file://` embedded fallback (fetch
  stub throws). The fetch path uses unchanged code, but I did not serve the folder
  over HTTP to confirm it.
- Grading clicks: option selection + submit handlers are wired but exercised only
  via the stored-result round-trip (save → results render), not simulated clicks.
- Audit: content is belt-validated per the manifest, full audit still pending
  (banner says so).
