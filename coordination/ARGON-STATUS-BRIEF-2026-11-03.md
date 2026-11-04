# Argon — where we stand (2026-11-03, ~21:00Z / 2 pm MDT)

From: Fable (coordinator). For: Argon (Gemini lane). Status brief, no work requested unless marked **ASK**.
Deadline: Meta Global AI Developer Hackathon, 2026-11-04 21:00 EST (2026-11-05 02:00Z) — ~29 h out.

## 1. The store is LIVE at https://passlearnerspermit.com
Cut over today, founder-driven, every gate passed:
- **Edge:** Cloudflare in front of the apex (Porkbun NS → Cloudflare). Worker `plp-app-gate` serves `/app/*` straight from the
  R2 bucket `plp-app` using **your drop-off contract** (free/paid tiers from `free-paths.json`, `plp_ent` cookie for paid).
  Free 200 / paid 401 / Range 206 verified on the real domain; the edge copies of `index.html`, `gate.js`, `states.json`,
  `quarantine-index.json` hash-match `store/public/app` exactly.
- **Store:** your frame on Vercel (project `passlearnerspermit`, DataPig LLC), Clerk production (email + Google sign-in, Google
  OAuth client under contact@datapig.cloud), Stripe live $9.99 one-time price. Checkout grants on the buyer-return path;
  webhooks route through the fleet relay (being redeployed as this is written).
- **Ops:** support@/admin@ forward to contact@datapig.cloud (SMTP RCPT 250 proven), Search Console verified + sitemap (56 URLs)
  submitted, Cloudflare Web Analytics on.
- **Live J-pass clean:** UT and ND chapter-1 lesson videos stream from R2 (214 s / 240 s), chapter 2+ shows the buy panel,
  "Unlock" → sign-in → checkout redirect intact, mobile 375 px no overflow.

## 2. Your drop-off, as uploaded (state by state, md5 per file, never "good" until the hash check passed)
| at 21:00Z | |
|---|---|
| states verified | 47 of 51 + shared (DE just landed; SD AK DC VT WY remain) |
| files / GB in R2 | ~231,000 / ~172 GB of 255,145 / 188.4 GB |
| errors / retries | 0 / 0 since 04:35Z |
| ETA RUN COMPLETE | ~22:00Z |
Your `QUEUE-STATUS.json` order drove the upload; every state's `cdn-manifest.json` sha256 set is what the ledger checks against.
Nothing in the payload needed a fix. NE (29.3 GB) took 2 h 25 m on its own.

## 3. Freeze holds — nothing in the app changed
The freeze you re-staged after the polish pass is intact. The only code edits today were outside the app: the store's checkout
metadata gained `group: passlearnerspermit` (relay routing), a `.vercelignore`, and deploy tooling under `tools/deploy/`.
Observed on live, logged for v2, **not fixed** (freeze):
- 3× 404 for `data/synthetic/*.json` — the sample fixture is not in the drop-off payload; the same content is embedded in
  `data-embedded.js`, so nothing breaks. Noted in `coordination/BUGS/` as a v2 line.
- Your banner is hidden on the state overview as well as elsewhere (brief said show once there). v2.
- BUG-005 (content carry-ins) and BUG-009 (3:2 re-paints) stay OPEN → v2.

## 4. Repo
`sree1924/nova-v2-meta` is committed and pushed, **code + JSON only** (no audio, video, images; history rewritten so none of it
exists in any old commit either). Your work is in it as yours (store frame, decks JSON, video manifests, drop-off manifests,
`coordination/ARGON-REPORTS/`). Still PRIVATE; the founder flips it public before the form goes in. `submission/CONTRIBUTORS.md`
lists you as the Gemini lane.

## 5. What is left (founder-owned)
3-minute video (A-game, "AI is a calculator, not a god; it can't change the law, it can change the format"), repo flip,
submission form. Optional: one real $9.99 test purchase on live.

## 6. ASK (only if you have idle capacity today; otherwise nothing)
- **ASK-1:** sanity-browse https://passlearnerspermit.com/app/#/ut and one Piper state in a real browser on your side and reply
  with anything that looks wrong in the frame on live (not the content). Reply in `coordination/ARGON-REPORTS/LIVE-LOOK-20261103.md`.
  No edits — report only. The freeze stands.

Next week, after the hackathon: the marketing funnel is the one tool the build did not produce. That will be the next brief.
