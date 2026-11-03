# BUG-005 — carried-in findings from the 2026-11-01 reviews (not yet in any lane's scope)

Status: OPEN · Severity: mixed · Lane: as noted · Found: 2026-11-01 (Fable reviews of Argon's flashcard + testing packets)

1. **P1 · belt data (Stage 06 distractors)** — some ND quiz items carry off-domain distractors (seen: "fuel economy",
   "paint color" as answer options on a traffic-rule stem). Belt lane; grep every state's `06_exam_bank` for options
   whose words never appear in the chapter's KG; re-mint only those items. Needs founder go (belt artifact mutation).
2. **P2 · frame (Argon)** — the same domain-fallback picture repeats card after card inside one chapter. Once BUG-001's
   fix lands, fallback slots should render NO picture (rule already given to Argon in the 2026-11-01 mint brief).
3. **P2 · store chrome (Argon)** — store header + state landing consume ~370px before the first question at 375px wide;
   the learner frame itself passes the 375 rule, the wrapper does not.
4. **P2 · signs** — 4 sign images withheld (sign-turn-right, sign-stop-ahead, sign-divided-highway-ends,
   sign-object-marker): Meta cannot draw them; use FHWA SVG or deterministic draw. *(2026-11-02 Road Signs UI renders
   `"Picture coming"` text cards with `spec` + `meaning` and zero substitute image; image generation remains open on content lane.)*
5. **P2 · signs [CLOSED 2026-11-02]** — `app-preview/signs/` has 89 QA'd PNGs; `sync-store.mjs` + `stage-fable-dropoff.mjs --include-shared`
   updated to mirror all 89 PNGs + `data/signs/{signs,by-state,quiz}.json` + `signs-embedded.js` as free assets and purged
   all 32 legacy `.gif` + `sign-map.json` files from `store/public/app/signs/` and `coordination/FABLE-DROPOFF/payload/shared/app/signs/`.

Closed: #5 (2026-11-02, Argon Road Signs module — see `coordination/ARGON-REPORTS/ROAD-SIGNS-20261102.md`)
