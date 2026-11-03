# Fable CDN / Prod Drop-Off Queue (`coordination/FABLE-DROPOFF/`)

This directory is Argon's deterministic handoff queue for **Fable** (owner of Vercel, Clerk, CDN/R2 asset hosting, and Stripe).

Whenever a state completes all 4 Learning Hub modules (`Video` + `Reading` + `Gen-Z Flashcards & Piper Audio` + `Quiz`) and passes belt + store harnesses with `0` sync drift, `tools/preview/stage-fable-dropoff.mjs` stages its complete `/app/**` asset bundle here and writes `states/<xx>/READY.json` **atomically last**.

---

## 1. Queue Contract for Fable

1. **Watch / Poll Marker:** `coordination/FABLE-DROPOFF/states/<xx>/READY.json`
   - Never ingest a state directory unless `READY.json` exists and `status === "READY_FOR_FABLE"`.
   - `READY.json` pins `paths.cdn_manifest_sha256` so Fable can verify `cdn-manifest.json` integrity in one hash check.
2. **Staged Upload Tree (Zero-Copy NTFS Hardlinks, Gitignored):**
   - **Per-state `/app/**` files:** `coordination/FABLE-DROPOFF/payload/states/<xx>/app/`
     - Contains exact `/app/<rel_path>` layout (`video/<xx>/*.mp4`, `video/<xx>/*.jpg`, `video/<xx>/video-manifest.json`, `decks/<xx>.json`, `decks/audio/<xx>/*.mp3`, `audio/<xx>/**`, `data/<xx>/**`, `visuals/state/<xx>.json`).
   - **Shared fleet `/app/**` + Next.js generated gate files:** `coordination/FABLE-DROPOFF/payload/shared/`
     - `app/` holds `index.html` (`customer-ui.mjs` and `hub-ui.mjs` are inlined at build time by `sync-store.mjs`), `styles.css`, `learner.css`, `gate.js`, `states-embedded.js`, `data-embedded.js`, `fonts/**` (`5` `.ttf` files), `quarantine-index.json`, `data/states.json`, `signs/**`, and all `723` `visuals/*.webp` scenes + `visuals/visual-catalog.json`.
     - `store-src/` holds `src/generated/free-paths.json`, `src/generated/catalog.json`, and `src/middleware.ts`.
3. **Free vs. Paid CDN Gating (`cdn-manifest.json`):**
   - Every file entry in `states/<xx>/cdn-manifest.json` carries:
     - `cdn_key` (e.g. `"app/video/nd/sec01-u01.mp4"`, `"app/decks/audio/nd/sec02-card-sec02-F001.q.mp3"`)
     - `access_tier`: `"free"` (Chapter 1 taste tier + manifests, public allowlist) or `"paid"` (Chapters 2+, requires valid Clerk/Stripe `plp_ent` entitlement cookie for that state)
     - `bytes`, `sha256`, `content_type`, `category`
4. **Master 51-State Queue Ledger:** `coordination/FABLE-DROPOFF/QUEUE-STATUS.json`
   - Tracks queue order (`#1 ND` -> `#2 TX` -> `#3 CA` -> `#4 FL` -> `#5 NY` ... -> `#51 UT`), counts, MB, and timestamps.

---

## 2. CLI Commands

```bash
# Stage a newly passed state (+ refresh shared bundle when gate/free-paths change)
node tools/preview/stage-fable-dropoff.mjs --state ND --include-shared

# Verify staged payload integrity against READY.json + cdn-manifest.json
node tools/preview/stage-fable-dropoff.mjs --verify ND

# Inspect 51-state queue ledger
node tools/preview/stage-fable-dropoff.mjs --status
```
