# How the learner shell is built (current state, 2026-10-29)

One command rebuilds everything below from the belt ledgers and proves it:

```bash
node D:/nova/fb-ai-hackathon/tools/preview/rebuild-shell.mjs
```

`--dry` prints the plan, `--states TX,CA` limits the export to some states, `--no-store` stops before the store mirror. It is local only: no network, no model calls, no audio minting, no git. Exit 0 means every step passed and the completeness audit found no problems in any of the 51 jurisdictions.

## 1. What the shell is

The shell is one static page, `app-preview/index.html` (about 78 KB, plus `styles.css`), that serves a full course for every jurisdiction: 50 states and DC. It has no backend. It reads a state registry and, per state, a manifest of accepted belt artifacts, then renders everything in the browser.

| Route | What the learner sees |
|---|---|
| `#/` | State picker with per-state counts |
| `#/<xx>/chapters` | That state's chapters in handbook order |
| `#/<xx>/chapter/<id>`, `module`, `lesson` | The hub, the modules and the narrated lesson slides |
| `#/<xx>/cards` | Flashcards (front, back, memory hook) |
| `#/<xx>/quiz`, `practice`, `results` | Module quizzes, the two practice forms per chapter, scores |
| `#/<xx>/dossier` | The SME source dossier each fact cites |
| `#/synthetic-sample` | A labelled synthetic demo, never mixed with real content |

The learning loop per chapter is lesson, then flashcards, then test. There is no spoken recall.

The store at `store/` (Next.js 15, Clerk 7, Stripe 17) serves a mirror of this same page under `/app/`, with a paywall gate added. Section 6 covers it.

## 2. The input: one belt run per state

Each jurisdiction has one run directory, `runs/<run_id>/`, such as `runs/2026-10-28-rdmv-tx-class-c/`. The shell reads three things from it:

- **`ledger/run.sqlite`, the pointer of record.** Every belt task row has a status, and an accepted task names its accepted artifact. The belt writes these rows the same way for every author: Claude, Muse, Sol and the cloud sessions.
- **`run-config.json`.** It supplies the section list, the page ranges and section titles (which become chapters), and the safe exam-fact view.
- **The artifact files the ledger points to**, under `runs/<run_id>/artifacts/`.

The shell uses six learner stages per section:

| Stage | Artifact | Shown as |
|---|---|---|
| `02.dossier_sections` | SME dossier parts (C, C2, A, B, D, E, E2, F, G) or one complete envelope | dossier / citations |
| `03.combined_kg` | knowledge graph, modules, prerequisites | module structure |
| `04.cards` | flashcard decks and recaps | flashcards |
| `06.exam_bank` | exam items, practice forms, module quizzes | quizzes and practice tests |
| `05.sessions` | teaching units with narrated slides | lessons |
| `05.card_scripts` | per-card narration scripts | card audio script and highlight sync |

`16.compile` (the compiled fact registry) is not shown directly. Every card back is a byte copy of a compiled statement, and every lesson slide cites compiled fact ids.

## 3. The build, step by step (what rebuild-shell.mjs runs)

**Step 0, preflight.** The script needs Node 22.5 or newer for `node:sqlite`. Every state in `app-preview/data/states.json` must have its run dir, `run-config.json` and ledger.

**Step 1, disk pointers.** `tools/belt/mark-current-compiles.mjs` writes `runs/<run>/16/<section>/CURRENT.json`, naming the ledger's latest accepted compile for each section. Authors read it to find the registry the belt will bind. It is derived from the ledger, never edited by hand. The belt runner also rewrites it after every accepted compile.

**Step 2, export.** For each state, `tools/preview/onboard-state.mjs` runs four sub-steps:

1. `tools/preview/export-content.mjs` copies ledger-accepted learner artifacts into `app-preview/data/<xx>/real/<stage>/<task>__<attempt>.json` and writes `manifest.json`. It records each file's stage, section, task, attempt, artifact id, sha256 and bytes. The selection rules are in section 4.
2. It builds the chapter list from `run-config.json`: page ranges in handbook order, titles shortened to 64 characters or fewer.
3. It sets status from the export manifest. A state is `complete` only when every section has accepted 03, 04, 06, 05.sessions and 05.card_scripts. File presence is never enough.
4. It upserts the state's entry in `app-preview/data/states.json`.

Utah is the one exception. It was onboarded by hand before this tool existed, so it lives at `data/real` with its audio, and the script exports it with `export-content.mjs` directly.

**Step 3, registry embed and quarantine.**

- `tools/preview/embed-states.mjs` copies `states.json` into `states-embedded.js`. That copy is the fallback when the page is opened from disk, where fetch is blocked.
- `tools/preview/quarantine.mjs --write` scans every exported card back for known garbled spoken-number patterns. It writes a hold list to `data/<xx>/quarantine.json` and a total to `data/quarantine-summary.json`. The store hides those card ids at the point of sale. The artifacts themselves are never altered. A hidden fact keeps its exam item and its lesson citation.

**Step 4, harness on app-preview.** `tools/preview/verify-learner.cjs` loads the shell headless and walks every route for every state. It also checks content invariants for each complete state:

- exactly one deck artifact per section
- no duplicate card ids
- every card has a script
- every script's answer and `must_match_card_back` equal the card back, byte for byte

**Step 5, store mirror.** `tools/preview/sync-store.mjs` mirrors the shell into `store/public/app/`. It then generates `store/src/generated/catalog.json` (landing pages, sitemap, checkout), `store/src/generated/free-paths.json` (the middleware allowlist and paid prefixes) and `store/public/app/quarantine-index.json`. After that, the harness runs again against the mirror with `--root=store/public/app`, this time including the gate and quarantine checks.

**Step 6, completeness audit.** `tools/preview/state-audit.mjs --out coordination/STATE-COMPLETENESS-AUDIT-<date>.md` checks every jurisdiction against its ledger:

| Column | Passes when |
|---|---|
| ledger | every section has an accepted task at 16, 03, 04, 06, 05.sessions and 05.card_scripts, and each accepted artifact file exists |
| pointers | every `CURRENT.json` names the ledger's newest accepted compile, and its registry file matches its sha256 |
| shell | for each learner stage and section, exactly one exported file, which is the ledger's newest accepted task, with a matching sha256 |
| dossier | the exported dossier parts equal the ledger's current parts (rule in section 4) |
| store | the store mirror's manifest is byte-identical to the shell's |

The audit always covers all 51 jurisdictions, and it fails if a state is missing from the registry.

## 4. Selection rules (what counts as "the" artifact)

1. **Accepted only.** A task that is not `accepted` in the ledger is never copied, and a file whose task left `accepted` is pruned on the next export.
2. **Newest accepted wins, per stage and section.** A re-mint (a retry-nonce bump) creates a new task and leaves the old one accepted in the ledger. The exporter keeps only the newest by `created_at`, so a refreshed deck never sits next to the old one.
3. **Dossiers are kept per part.** A section can have one accepted task per dossier part, or one complete envelope (`config.dossier_parts = []`, Sol's replacement format). The exporter keeps the newest task for each part list. A part older than the section's newest complete envelope is dropped, because the envelope replaces it. Today 42 states are per-part, 6 are complete envelopes (AR RI ND DC IL MA), and 3 mix both (MS AK NH).
4. **Section identity** comes from the task's `config.section_ids[0]`, or else the first `secNN-…` slug in its identity. Tasks without a section are never collapsed.

## 5. On-disk layout of the built shell

```
app-preview/
  index.html, styles.css            the shell (one page)
  states-embedded.js                registry fallback for file:// opens
  data/states.json                  the registry: one entry per jurisdiction
  data/quarantine-summary.json      hidden-card totals per state
  data/<xx>/real/manifest.json      accepted artifacts for state xx (Utah: data/real/)
  data/<xx>/real/02_dossier_sections/ 03_combined_kg/ 04_cards/ 05_sessions/ 05_card_scripts/ 06_exam_bank/
  data/<xx>/quarantine.json         card ids held back at point of sale
  audio/                            Utah's minted narration only (other states: none until "audio go")
  data-embedded.js, data/synthetic/ the synthetic sample route
  trace.html                        reviewer-only belt trace (never mirrored to the store)
```

A registry entry looks like this (Texas):

```json
{"code":"TX","name":"Texas","run_id":"2026-10-28-rdmv-tx-class-c",
 "handbook":"Texas Driver Handbook (DL-7, Rev. Jan 2026)","test":"Class C knowledge test",
 "data_root":"data/tx/real","audio_root":"audio/tx","audio_manifest":"audio/tx/audio-manifest.json",
 "status":"complete","authored_by":"<who wrote which layer>","chapters":[{"id":"sec01-…","n":1,"title":"…"}]}
```

Adding a state means adding one entry and its export folder. The page needs no code changes.

## 6. How the browser loads a state

1. Fetch `data/states.json`, or read `window.__STATES_EMBEDDED` when opened from disk.
2. On `#/<xx>/…`, fetch that state's `data_root/manifest.json`, then the files it lists, grouped by stage: dossier, kg, cards, exam, sessions, scripts. Fall back to `<data_root>-embedded.js` when fetch is blocked. Only the states the learner opens are loaded.
3. Build the course view model from those artifacts alone. Nothing synthetic is ever mixed into a real state. A complete state with no export shows an explicit message instead of sample data.
4. Audio: Utah plays minted narration from `audio/`. Every other state shows the narration as written copy until audio is minted.

### The store wrapper

- **`sync-store.mjs`** copies the shell, the registry, each complete state's `data_root`, Utah's audio (mp3 files and the manifest only), the quarantine lists and the synthetic-route support files. It never copies `trace.html`, the trace data, the file:// fallbacks or anything parked. It patches the store copy of `index.html` to load `gate.js`.
- **`store/public/app/gate.js`** is the only hand-written file in the mirror, and the sync never touches it. It fetches `/api/me` and the quarantine index before the first route. Chapter 1 of every state is free. Chapters 2 and up render the buy panel unless the learner holds an unexpired entitlement for that state. It hides quarantined card ids from decks, scripts and recaps.
- **`store/src/middleware.ts`** enforces the same rule on the server. Free-allowlist files are served openly. Every other `/app/` file belongs to one state's paid prefix and needs the signed `plp_ent` cookie that `/api/me` mints.
- **Purchase:** `/api/checkout?state=XX` creates a $9.99 one-time Checkout Session, giving one state for one year. The webhook and the confirm route write the Clerk entitlement with an expiry one year out, and a refund revokes it.
- **Pages:** the landing pages `/` and `/states/<slug>`, plus the sitemap, are generated from `catalog.json`, so all 51 states get a page.

Run it locally:

```bash
cd D:/nova/fb-ai-hackathon/store && npm run dev
```

It serves http://localhost:4320. `npm run build` checks that the mirror exists first. `store/public/app/` is gitignored, so a deploy has to run the sync.

## 7. Common operations

- **Rebuild everything after any belt change:** `node tools/preview/rebuild-shell.mjs`
- **Add a newly finished state:**

```bash
node tools/preview/onboard-state.mjs --state XX --run <run_id> --name "<Name>" --authored-by "<who wrote which layer>"
```

Then run `rebuild-shell.mjs --states XX`. The shared steps (quarantine, harness, sync, audit) always run for every state.
- **After a re-mint or re-author in one state:** `rebuild-shell.mjs --states XX`. The newest-accepted rule picks up the new decks and scripts on its own.
- **Check without changing anything:** `node tools/preview/state-audit.mjs`
- **Commit after a rebuild:** `app-preview/`, `runs/*/16/*/CURRENT.json` and the audit report. `store/public/app/` stays out of git.

## 8. Current state and known limits

Measured by `rebuild-shell.mjs` on 2026-10-29 (see the final section).

- **19A unit maps are closed (2026-10-29).** `tools/belt/unit-map.mjs` is the deterministic executor the belt requires for 19A. It builds one unit per knowledge-graph module from each section's accepted inputs, validates it, and accepts it into the ledger. Every section of all 51 is accepted, $0, and the audit now checks 19A too. The shell does not read 19A.
- **Not fact-audited.** Every artifact passed the belt's deterministic checks only. The independent source audits (stages 07 and 08) have not run on any state. They are scheduled for the end.
- **Audio exists for Utah only.** The other 50 jurisdictions show narration as text until audio is minted on the founder's "audio go".
- **Exam facts:** the shell shows a pass mark or question count only where the state's safe view has it verified. Everywhere else it says unknown. The internal mastery bar is not an official pass mark.
- **Utah's pilot layout:** its section 9 compile sits in a versioned folder at the top of `16/`, and its pointer is `16/sec09-rules-of-the-road/CURRENT.json` with `current_version_dir: "../1399aa11"`.
- **Runner flags changed with Sol's 2026-10-29 belt amendments.** Any `run-utah.mjs` call now needs `--executor-id <id>` and an explicit `--author`. The briefs are updated.
- **Store landing pages:** one per jurisdiction, 51, generated from `catalog.json`.

## Measured result

Full run on 2026-10-29: `node tools/preview/rebuild-shell.mjs` exited 0. All 59 steps passed: preflight, pointers, 51 exports, embed, quarantine, harness on app-preview, store sync, harness on the store mirror, audit.

| Measure | Value |
|---|---|
| Jurisdictions live | 51 of 51 (50 states + DC) |
| Flashcards | 37,967 |
| Hidden at point of sale | 42 |
| Exam items | 36,234 |
| Learner harness, app-preview and store mirror | all checks passed |
| Completeness audit | 51/51, 0 problems (coordination/STATE-COMPLETENESS-AUDIT-2026-10-29.md) |

Out of scope by design: the five territories (Puerto Rico would need a Spanish course), motorcycle and CDL permits, and non-English handbook editions.
