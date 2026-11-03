# BUG-003 — FABLE-DROPOFF shared bundle omits 7 files the shell loads on every page

Status: CLOSED · Severity: P0 for the CDN cut-over (app would not boot from the payload) · Lane: Argon (`tools/preview/stage-fable-dropoff.mjs`)
Found: 2026-11-01 18:45Z, independent verify of the shared payload.

Where
`coordination/FABLE-DROPOFF/payload/shared/app/` and `coordination/FABLE-DROPOFF/shared/shared-manifest.json` (746 files).

What is missing
- `states-embedded.js` and `data-embedded.js` — both are `<script src=…>` in `index.html` (the same `index.html` that IS in
  the bundle) and both are in `free-paths.json`'s free set.
- `fonts/Outfit-Bold.ttf`, `fonts/Outfit-ExtraBold.ttf`, `fonts/PlusJakartaSans-Bold.ttf`, `fonts/PlusJakartaSans-SemiBold.ttf`,
  `fonts/SpaceGrotesk-Bold.ttf` — `learner.css` `@font-face src: url("fonts/…")`.
All seven exist in `store/public/app/`; the stager's shared-tree selector does not include them.

Also (P2, doc): README §1.2 says `app/` holds `customer-ui.mjs` and `hub-ui.mjs`. It does not, and should not — sync-store
inlines both into `index.html` (0 external refs). Fix the README, not the bundle.

Proof
`grep -o 'src="[^"]*"' payload/shared/app/index.html` → data-embedded.js, states-embedded.js, gate.js;
`ls payload/shared/app` → no embedded js, no fonts/; shared-manifest rel_paths matching /embedded|fonts\// → [].

Fix sketch
Add `states-embedded.js`, `data-embedded.js`, `fonts/**` to the shared copy set (tier free); re-run `--include-shared`; bump
shared-manifest. Add a stager self-check: every `src=`/`url(` referenced from `index.html`/`*.css` in the bundle must be in
the bundle or a per-state tree.

Closed: 2026-11-02T01:39Z — `stage-fable-dropoff.mjs` now stages `states-embedded.js`, `data-embedded.js`, and `fonts/*.ttf` (`770` total shared app files, `125.4 MB`), enforces a static `src=`/`href=`/`url(...)` self-check across `index.html`, `styles.css`, and `learner.css`, and `coordination/FABLE-DROPOFF/README.md` §1.2 documents that `customer-ui.mjs` / `hub-ui.mjs` are inlined into `index.html`.
