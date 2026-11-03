# PassLearnersPermit — production deployment architecture (pure deployment, app frozen)

Fable, 2026-11-02 ~21:40Z. Constraint from the founder: the app is frozen after Argon's polish re-stage. Everything below is
infrastructure around the frozen bytes; the shell, store code and content do not change. Two build-config touches are called
out explicitly (§6) because Vercel cannot build the store as the repo stands.

## 0. The shape in one paragraph
One origin, `passlearnerspermit.com`, fronted by Cloudflare. Cloudflare routes `/app/*` (the 188 GB learner shell: 254,314 state
files + 831 shared files) to a **Worker that serves from an R2 bucket and enforces the same free/paid rule as the store's
middleware**, and passes everything else (`/`, `/states/*`, `/sign-in`, `/api/*`, `/app/` document) to **Vercel**, where the
Next.js store runs with Clerk and Stripe. The shell keeps making relative requests under `/app/`, so it never learns the
files moved. Cookies stay first-party. Nothing in the frozen app changes.

```
browser ──► Cloudflare DNS/proxy (passlearnerspermit.com, www)
             ├─ /app/<file>      ──► Worker "plp-app-gate" ──► R2 bucket plp-app (key = app/<rel_path>)
             │                        free (19,295 paths)  → 200, edge-cached
             │                        paid (204 prefixes)  → verify plp_ent cookie (HMAC-SHA256) → 200 / 401 / 403
             └─ everything else  ──► Vercel (Next 15 store: pages, /app/ document, /api/me, /api/checkout, webhook)
                                       Clerk (auth) · Stripe (one-time $9.99) · ENTITLEMENT_COOKIE_SECRET shared with the Worker
clerk.passlearnerspermit.com ──► Clerk (DNS-only CNAME, never proxied)
support@passlearnerspermit.com ──► Cloudflare Email Routing → founder inbox (refund mails must land: J8 lesson)
```

## 1. Why this split (and not the alternatives)
- **Vercel can't hold the payload.** 188 GB vs a 250 MB function trace limit and a few-GB deploy; Vercel Blob at 188 GB costs
  ≈ $4/month storage but egress-bills video (the fleet lesson: Blob stores default public, too).
- **R2 egress is free**; storage ≈ $2.80/month for 188 GB; the 254k uploads ≈ $1.15 once. Range requests work, so video seeks.
- **Same origin means zero app change.** The shell's `video/nd/sec02-u01.mp4` resolves to `/app/video/nd/…` on the same host;
  the `plp_ent` cookie (Path=/app, SameSite=Lax, HttpOnly) is sent automatically; `gate.js` keeps calling `/api/me` on Vercel.
  A separate `cdn.` host would have forced a cookie-domain change and a media base-URL change in the frozen shell.
- **One rule, two enforcers.** The Worker ports `middleware.ts gateAppAsset()` line for line: `free-paths.json` set → allow;
  longest `paid_prefixes` match → verify cookie (`"plp-ent-v1:" + ENTITLEMENT_COOKIE_SECRET`, HMAC-SHA256 over the base64url
  body, `x` expiry, `e[code]` active) → allow with `Cache-Control: private, no-store`; else 401 `sign_in_required` / 403
  `not_entitled`; unknown path 404. Same JSON error bodies, so `gate.js` behaves identically.

## 2. Components and owners
| component | what | owner | gate |
|---|---|---|---|
| Cloudflare zone | nameservers moved from Porkbun; apex + `www` proxied; SSL Full (strict) | founder (account) → Fable (records) | external_publish |
| R2 bucket `plp-app` | 254,314 + 831 objects, keys exactly `cdn_key` from the manifests (`app/…`) | Fable uploads with founder's R2 API token | external_publish |
| Worker `plp-app-gate` | ≈150 lines: route `/app/*`, R2 get with Range, tier rule, cookie HMAC, cache headers | Fable writes + deploys (wrangler, founder's token) | external_publish |
| Vercel project | root dir `store/`, framework Next.js, env vars below; domain `passlearnerspermit.com` via Cloudflare CNAME | founder creates; Fable configures | external_publish |
| Clerk production instance | pk_live/sk_live, domain `passlearnerspermit.com`, `clerk.` CNAMEs DNS-only | founder | launch_commit |
| Stripe | product + price $9.99 one-time, webhook `https://passlearnerspermit.com/api/stripe/webhook` → signing secret; descriptor PASSLEARNERSPERMIT (fleet lesson 10-03) | founder | launch_commit |
| Email | Cloudflare Email Routing `support@` → founder inbox; verify RCPT 250 (J8) | founder | launch_commit |
| GSC | property + `sitemap.xml` submission after live | founder | after publish |

Vercel env (production): `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`,
`STRIPE_WEBHOOK_SECRET`, `ENTITLEMENT_COOKIE_SECRET` (generate 32 random bytes; the SAME value goes to the Worker secret),
`NEXT_PUBLIC_SITE_URL=https://passlearnerspermit.com`. Never `STORE_LOCAL_MODE` (next.config refuses it in production anyway).

## 3. Upload plan (the long pole: this line measured 2.0–2.4 MB/s)
| tier | files | bytes | at 2.2 MB/s |
|---|---|---|---|
| shared bundle (shell, visuals, signs, fonts) | 831 | 125 MB | 1 min |
| free (chapter 1 of every state) | 18,509 | 12.9 GB | ≈ 1.6 h |
| paid | 235,805 | 175.4 GB | ≈ 22 h |

Order: shared → free → paid, so the site is fully browsable for a visitor and a judge within 2 hours of starting, while paid
files land behind the gate (a buyer in that window could hit a missing paid video; the Worker returns 404 for a missing
object, `gate.js` shows its existing fallback; acceptable for the first hours, and the state payloads are uploaded in queue
order ND → TX → CA … so the big states land first).
Tool: `rclone` (S3 backend, R2 endpoint), `--transfers 32 --checkers 16 --s3-upload-concurrency 8 --fast-list`, source =
`coordination/FABLE-DROPOFF/payload/{shared,states/<xx>}/app/` → `r2:plp-app/app/`. Resumable: re-running skips by size+mtime.
Verify after: `rclone check --size-only` over the manifests (all 255k) + sha256 spot-check of every ~50th object by download,
then a browser pass through the J1–J8 store-close recipe on the live host (chapter-1 play, paid 401 signed-out, buy, play,
refund, 403). State payloads are final now; only the shared bundle waits for Argon's polish re-stage (≈ 22:30Z) — the paid
upload can start before that and the 125 MB shared re-upload at the end takes a minute.
If the line is the bottleneck: start tonight = done ≈ 22:00Z Nov 3, 28 h before the deadline. A 100 Mbps line would do it in
4 h; a cloud box can't help (the bytes are here).

## 4. Request flow on the live host (what a learner's browser actually does)
1. `GET /states/texas` → Vercel page (Clerk middleware runs, session refreshed).
2. `GET /app/` → Vercel rewrites to `/app/index.html` (served from the 4-file shell stub in the repo, §6) — same bytes as the
   R2 copy; `gate.js` runs, calls `GET /api/me` → Vercel mints `plp_ent` from Clerk metadata.
3. `GET /app/learner.css`, `/app/states-embedded.js`, `/app/data/tx/…`, `/app/visuals/…` → Worker → R2, free → edge cache.
4. `GET /app/video/tx/sec02-u01.mp4` (Range) → Worker: paid prefix `video/tx/` → cookie verify → R2 range → `private, no-store`.
5. Buy: `/api/checkout?state=TX` → Stripe Checkout → webhook grants `publicMetadata.entitlements.TX` → `/purchase/success`
   → `/api/me` re-mints the cookie → step 4 now 200. Refund → webhook revokes → next `/api/me` clears → 403.

## 5. Caching, security, cost
- Free objects: `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`; edge cache on; a re-stage purges by prefix.
  Paid: never cached at the edge (`private, no-store`); Range passthrough.
- Worker reads only R2; no secrets besides the cookie HMAC key; bad paths (`..`, `\`, NUL) → 400, same as middleware.
- `/api/track` throws `tracking_sink_not_configured` in production by design (telemetry.ts) → the store's funnel events will
  500 in prod logs until the Upstash sink is wired (fleet precedent 09-05). Not a blocker; the client ignores failures. Log it.
- Monthly: R2 ≈ $2.80 storage + pennies; Worker free tier (10 M req/mo); Vercel Hobby/Pro per plan; Clerk free tier; Stripe per sale.

## 6. The two build-config touches (not app logic; needed or Vercel cannot build)
1. `store/scripts/check-sync.mjs` (prebuild) requires `public/app/index.html`, `gate.js`, `data/states.json`,
   `quarantine-index.json`; `public/app/` is gitignored. Fix without touching app logic: **un-ignore exactly those four files**
   (≈ 1 MB) so the Vercel build sees them; they are byte-identical to the shared bundle copies (the Worker serves every other
   `/app/*` path). Alternative with zero repo change: Vercel build command `node scripts/fetch-shell.mjs && npm run build`
   pulling the four from R2 by the shared manifest. I'd un-ignore: fewer moving parts at 3 a.m.
2. Vercel project root = `store/`; `outputFileTracingExcludes` already excludes `public/app/**`; `.vercelignore` not needed.
Public-repo note (standing open decision 10-28): `app-preview/data/**` (all chapters' cards/items JSON) is tracked and will be
public when the lane repo flips. Paid *media* (video, audio) is not in git. If that exposure matters, Vercel should deploy from
a private `sree1924/passlearnerspermit` holding only `store/`; the public lane repo stays the hackathon record. Founder's call.

## 6b. Status 2026-11-03 07:40Z — Worker DEPLOYED to preview, gate verified against the real bucket
- Code: `tools/deploy/worker/` (`src/gate.js` pure rule + cookie verify, `src/index.js` R2 serving, `test/gate.test.mjs` 9/9,
  `free-paths.json` synced from `store/src/generated`). `wrangler deploy` → `https://plp-app-gate.plp-app-gate.workers.dev`,
  binding `BUCKET=plp-app`, secret `ENTITLEMENT_COOKIE_SECRET` set (same value as `.env.cloudflare`, to be copied into Vercel).
- Live checks (12/12 as specified): free doc/video/webp 200 + edge cache headers; paid signed-out 401 `sign_in_required`; forged
  401; valid ND cookie 200 `private, no-store`; ND cookie on TX 403 `not_entitled`; expired 401; Range → 206 with Content-Range;
  traversal 404 (edge normalises `..` before the Worker); unknown 404. Error bodies byte-identical to middleware.ts.
- NOT yet routed on passlearnerspermit.com (cut-over gate). Route line is commented in `wrangler.toml`.
- Upload: run 2 in progress, 12 units hash-verified by 07:10Z, 0 errors; ETA ≈ 22:00Z.

## 7. Order of operations (after Argon's re-stage; wall clock)
| when | step | who |
|---|---|---|
| T0 (tonight) | founder: Cloudflare account → add zone → R2 bucket `plp-app` → API token (R2 read/write + Workers); hand token via env, never chat | founder |
| T0+15 min | Fable: install rclone, 1-state probe (ND, 2,478 files) with size check, then start shared → free → paid upload in the background | Fable |
| T0+1 h | Fable: write + deploy Worker `plp-app-gate`, route `passlearnerspermit.com/app/*`; test with a test cookie on a `*.workers.dev` preview against ND | Fable |
| T0+2 h | founder: Vercel project (root `store/`), env vars, Clerk prod instance + CNAMEs, Stripe price + webhook, Email Routing | founder |
| T0+3 h | Fable: un-ignore the 4 shell files, push (this is the lane commit; repo may flip public the same moment), Vercel build green on preview URL | Fable, founder go |
| T0+4 h | Porkbun → Cloudflare nameservers; Vercel domain verified; Clerk CNAMEs DNS-only; SSL Full strict | founder + Fable |
| when upload finishes (≈ T0+24 h) | `rclone check` + sha spot-check; live J1–J8 pass; GSC sitemap; `live-verify by deployed SHA` | Fable, founder approves publish |
| Nov 4 | video, submission form with the live URL | founder |

Gates respected: nothing above runs until the founder says go on the cut-over (external_publish); keys arrive only via
environment; the Worker and the un-ignore are the only new code, both outside the frozen app.
