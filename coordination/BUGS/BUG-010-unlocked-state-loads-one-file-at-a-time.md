# BUG-010 — unlocked state loads ~220 JSON files one at a time ("Loading…" for 40–60 s after purchase)

Status: CLOSED 2026-11-04 ~20:00Z — founder uploaded via hotfix-index-r2.mjs; edge cache purged by URL in the dashboard (API token lacks purge scope); live shell sha256 0f889a78477e2a35 (pool 32) matches local; entitled headless loads UT/NE/TX render in 3–7 s · Severity: P0 (first real purchase, learner sees "Loading
the Utah course" for about a minute and reads it as stuck) · Lane: Fable · Found: 2026-11-04, founder's own $9.99 Utah purchase.

## What happens
`loadReal()` in the app shell fetches every manifest file the visitor may load, with `await` inside a `for` loop. A free
visitor loads chapter 1 only (Utah: 14 of 224 files) and never notices. An entitled visitor loads all 224, sequentially,
each through the Worker and R2. Measured with a minted test cookie against the live edge (`demo/paid-probe.mjs UT`):
224 × 200 OK, 4.2 MB, **39.2 s** (median 173 ms per file) — before `loadAudio`, the deck overlay and the visuals even start.
Nothing fails; it is just slow enough to look dead. Every state is affected the same way (NE 214 files, TX 196).

## Fix
Fetch the same files through a pool of 12 concurrent requests. Same files, same insertion order, same `canLoad` gate, same
Worker decisions. Measured: **3.7 s** (`demo/paid-probe.mjs UT --parallel 12`). Patched in:
- `store/public/app/index.html` (the served shell; marker `HOTFIX 2026-11-04`)
- `app-preview/index.html` (builder source, so a re-stage keeps it)
Upload to the edge: `node D:\nova\fb-ai-hackathon\tools\deploy\hotfix-index-r2.mjs` (founder; copies `app/index.html` to R2,
purges the one URL, verifies the marker is live).

## Not changed
The Worker, the tier table, the data files, the seal of the state payloads. The shared bundle's `index.html` hash changes;
recorded in `coordination/DATASET-SEAL-2026-11-02.md` as hotfix 1.

## Follow-up (v2)
Per-chapter lazy loading (fetch a chapter when it is opened) would make the paid first paint the same as the free one.

## Lesson (2026-11-04)
Every pre-launch verification ran as a free visitor, which loads chapter 1 only. The paid path (all chapters, all files) was never exercised end to end until the founder's own purchase. Rule: before any launch, run `demo/paid-shell-probe.mjs <ST>` (entitled headless load) for at least three states.
