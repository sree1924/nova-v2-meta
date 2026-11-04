# Founder sign-up checklist — passlearnerspermit.com production (2026-11-02)

All accounts under **contact@datapig.cloud**, company **DataPig LLC**. Do them in this order; A is the only one that blocks
the upload. Put every value in the env file in §F, never in chat. Tick each line when done.

## A. Cloudflare (blocks the upload — do first)
1. [ ] dash.cloudflare.com → Sign up → contact@datapig.cloud → verify email → My Profile → Authentication → enable 2FA.
2. [ ] Add a domain → `passlearnerspermit.com` → Free plan → Continue. Cloudflare imports the Porkbun records; leave them.
       It shows two nameservers (`*.ns.cloudflare.com`). Write them down. **Do NOT change nameservers at Porkbun yet** (last step, §G).
3. [ ] R2 Object Storage → Enable R2 → add the DataPig card (required even on the free tier).
4. [ ] R2 → Create bucket → name `plp-app` → location Automatic → Create. Open it → Settings → confirm **Public access: disabled**.
5. [ ] R2 → Manage R2 API Tokens → Create API token → name `plp-upload` → permission **Object Read & Write** →
       Specify bucket(s): `plp-app` → TTL: none → Create. Copy **Access Key ID**, **Secret Access Key**, and the endpoint
       `https://<account-id>.r2.cloudflarestorage.com` (shown once).
6. [ ] My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers** → add permission **Zone · DNS · Edit** →
       Zone Resources: Include · Specific zone · `passlearnerspermit.com` → Continue → Create → copy the token.
7. [ ] Workers & Pages → Overview → copy the **Account ID** (right column).
8. [ ] Email → Email Routing → Enable → Destination address: your inbox (verify the mail it sends) → Custom address
       `support@passlearnerspermit.com` → action Send to your inbox. (Activates when nameservers move in §G.)
9. [ ] Analytics & Logs → Web Analytics → Add a site → `passlearnerspermit.com` → enable **automatic setup** (proxy-injected,
       no code; this is the funnel counter since /api/track is off in production).

## B. Vercel (the store)
1. [ ] vercel.com → existing DataPig LLC team → Add New → Project → Import `sree1924/nova-v2-meta` (or the private store repo
       if you choose the split in DEPLOY-ARCHITECTURE §6) → **Root Directory: `store`** → Framework: Next.js → do not deploy yet.
2. [ ] Project → Settings → Environment Variables (Production) — add after C and D give you the values:
       `NEXT_PUBLIC_SITE_URL=https://passlearnerspermit.com`, `ENTITLEMENT_COOKIE_SECRET` (§F generates it),
       `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
       Never add `STORE_LOCAL_MODE`.
3. [ ] Settings → Domains → add `passlearnerspermit.com` and `www.passlearnerspermit.com`. Vercel shows a CNAME target
       (`cname.vercel-dns.com`) and possibly a TXT for verification. Write both down for §G.
4. [ ] Plan: Hobby forbids commercial use → the team should be on Pro ($20/mo) before the store sells.

## C. Clerk (sign-in)
1. [ ] dashboard.clerk.com → the existing DataPig account → Create application → name `PassLearnersPermit` →
       sign-in options: Email + Google (same as the fleet) → Create.
2. [ ] Top-right instance switcher → **Production** → Create production instance → domain `passlearnerspermit.com`.
3. [ ] Configure → Domains: Clerk lists CNAMEs (`clerk.`, `accounts.`, `clkmail.`, `clk._domainkey`, `clk2._domainkey`).
       Write them down for §G. They must be **DNS-only (grey cloud)** in Cloudflare, never proxied.
4. [ ] API Keys (production) → copy `pk_live_…` and `sk_live_…` → §F.
5. [ ] Paths: Sign-in URL `/sign-in` (the store has its own page). Leave sign-up default.

## D. Stripe (payment)
1. [ ] dashboard.stripe.com → DataPig LLC account → **Live mode** → Product catalog → Add product → name
       `PassLearnersPermit — one state, one year` → price **$9.99 one-time** → Save → copy the **Price ID** (`price_…`).
2. [ ] Settings → Business → Public details → statement descriptor **PASSLEARNERSPERMIT** (fleet lesson: never the citizenship one).
3. [ ] Developers → Webhooks → Add endpoint → `https://passlearnerspermit.com/api/stripe/webhook` → events:
       `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` → Add → Reveal **Signing secret** (`whsec_…`).
4. [ ] Developers → API keys → **Secret key** (`sk_live_…`) → §F. (Publishable key not needed; Checkout is server-side.)
5. [ ] Customer emails: Settings → Emails → enable successful-payment and refund receipts.

## E. Porkbun (nothing yet)
Only in §G. Until then the domain keeps resolving as it does today.

## F. Hand-off file (never paste secrets in chat)
Create `D:\nova\fb-ai-hackathon\.env.cloudflare` (gitignored by `.env.*`) with these lines filled in:
```
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
R2_ENDPOINT=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=plp-app
```
Vercel/Clerk/Stripe values go straight into Vercel's env UI (§B.2). `ENTITLEMENT_COOKIE_SECRET`: generate once with
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
put it in Vercel AND in `.env.cloudflare` as `ENTITLEMENT_COOKIE_SECRET=` (the Worker needs the same value).
Then say **"cloudflare in"** → Fable installs rclone + wrangler, probes with North Dakota, starts the upload, deploys the Worker.

## G. Cut-over night (after the upload verifies; founder go = external_publish)
1. [ ] Cloudflare DNS: `@` CNAME → `cname.vercel-dns.com` (proxied), `www` CNAME → same (proxied); Clerk CNAMEs from §C.3 (DNS-only);
       Vercel TXT if given. Fable adds these with the token; you approve the list first.
2. [ ] SSL/TLS → **Full (strict)** (anything else loops with Vercel).
3. [ ] Porkbun → Domain → Nameservers → replace the four `*.ns.porkbun.com` with **`kay.ns.cloudflare.com`** and
       **`yahir.ns.cloudflare.com`** (assigned 2026-11-02 ~23:10Z). Propagation: minutes to an hour.
       Imported Porkbun records to clean up first (in Cloudflare DNS): delete the three parking `A` records (207.207.210.x), the
       `*` wildcard CNAME and `www` CNAME to uixie.porkbun.com, the two `_acme-challenge` TXTs. Keep MX fwd1/fwd2.porkbun.com
       + SPF only if support@ forwarding was set up at Porkbun; otherwise switch to Cloudflare Email Routing.
4. [ ] Vercel → Domains shows Valid; Clerk → Domains shows Verified; Email Routing shows Active; send a test mail to support@
       and confirm it lands (J8).
5. [ ] Live J1–J8: chapter 1 plays signed out · paid video 401 · sign in · $9.99 live purchase with a real card · plays · refund
       in Stripe · 403 · refund email received. Then GSC property + sitemap.

Reference: `coordination/DEPLOY-ARCHITECTURE-2026-11-02.md`.

## G1 DONE — nameservers moved to Cloudflare (2026-11-03 15:4xZ)
- Porkbun authoritative NS for passlearnerspermit.com set to kay.ns.cloudflare.com + yahir.ns.cloudflare.com (founder go: "wrap it up on dns in porkbun"; driven in his Chrome).
- Verisign RDAP confirms registry delegation = KAY/YAHIR. Public resolvers still cache the Porkbun set (TTL); Cloudflare zone a893c88a… was `pending`, activation re-check requested.
- Cloudflare zone records at cut-over = exact mirror of Porkbun (3 parking A proxied, * + www CNAME uixie proxied, MX fwd1/fwd2, SPF, 2 acme TXT). Mail forwarding unaffected. Site still parks until DNS cleanup + Vercel CNAME (G2).

## Cloudflare side CLOSED (2026-11-03 ~16:05Z, driven in founder Chrome on his go)
- Zone a893c88a… ACTIVE (nameservers kay/yahir confirmed at Verisign).
- SSL/TLS = Full (strict); Universal SSL Active; Always Use HTTPS ON (http://…/app/ -> 301 https).
- Worker route `passlearnerspermit.com/app/*` -> plp-app-gate ADDED. Live edge test (resolved via kay.ns.cloudflare.com, --resolve 104.21.34.4): /app/ 200 html 210 KB; /app/data/states.json 200 (cf-cache HIT on 2nd hit); free audio-manifest.json 200; free video sec01-u01.mp4 200 (26.9 MB) + Range 0-1023 -> 206; paid sec02-u01.mp4 -> 401; paid dossier json -> 401. Unknown path -> 404.
- Web Analytics enabled for passlearnerspermit.com, automatic (proxy-injected) beacon, no store code change.
- STILL OPEN on Cloudflare (needs Vercel first): G2 DNS swap — delete 3 parking A + * and www CNAME (uixie), add CNAME @ -> cname.vercel-dns.com (proxied) and www; add Clerk CNAMEs DNS-only. Until then apex still parks at Porkbun while /app/* already serves from R2.

## LIVE — passlearnerspermit.com (2026-11-03 ~16:55Z, founder-driven cut-over)
- Vercel: project passlearnerspermit (DataPig LLC), CLI deploy from local store/ (no git), 10 prod env vars via tools/deploy/push-secrets.mjs (.secrets convention). Apex+www attached; cert issued (DNS-only window ~90 s, then re-proxied).
- Cloudflare: CNAME @ and www -> cname.vercel-dns.com PROXIED; Worker route /app/* -> plp-app-gate; Full (strict); Always HTTPS; Web Analytics auto-beacon; Clerk 5 CNAMEs DNS-only.
- Clerk: app "Pass Learners Permit", prod instance, DNS 3/3 verified, Google SSO on custom creds (GCP project passlearnerspermit under contact@datapig.cloud, consent screen IN PRODUCTION, client clerk-signin). Live test: /sign-in -> Continue with Google -> Google consent for passlearnerspermit.com with our privacy/terms links, redirect_uri accepted. Not signed in (founder account).
- Stripe: product prod_VYsEMFpd0u3X66, price price_1UXkTzCpwGHoR4RKowAJEGBi ($9.99 one-time). Webhooks via the fleet relay (16-endpoint cap): store metadata.group added, relay routes regenerated (66) — RELAY NOT REDEPLOYED YET (awaiting founder go). Until then: grants via buyer-return confirm path only; refund-revoke + async payments wait.
- Known: /api/track 503 in prod by design (Web Analytics covers funnel).
- Open: relay deploy; support@ RCPT 250 proof (Porkbun forwarding, MX unchanged); GSC property + sitemap; live J1-J8 pass.

## Mail PROVEN (2026-11-03 ~17:10Z)
- Porkbun forwards created: support@ and admin@passlearnerspermit.com -> contact@datapig.cloud (fleet pattern, deploy/BRAND-EMAIL-FORWARDS-2026-07-16.md).
- SMTP probe at fwd1.porkbun.com: RCPT support@ 250, admin@ 250, negative control nobody-zz@ 554 (J8 satisfied; sent nothing).

## GSC DONE (2026-11-03 ~17:08Z)
- Domain property sc-domain:passlearnerspermit.com verified (TXT google-site-verification=… added to the Cloudflare zone via API; verified first try) under contact@datapig.cloud.
- Sitemap https://passlearnerspermit.com/sitemap.xml submitted (56 URLs; status "Couldn't fetch" is the first-poll placeholder — fetch as Googlebot returns 200 application/xml; robots.txt allows / and lists the sitemap).

## Live J-pass (2026-11-03 ~17:15Z, real domain, built-in browser + curl)
- J1 landing/state pages 200 (/, /states/utah, /states/texas, /states/california); policy pages 200 (/support /refunds /terms /privacy) with support@passlearnerspermit.com + one-year copy.
- J2 shell: /app/#/ut loads from R2 (chapter list, ch1 free, ch2-16 "Full course"); UT lesson sec01-u01 video 206 from R2, duration 214 s, readyState 4; ND (Piper state) lesson video 240 s ready 4.
- J7 paywall: "Unlock" -> /sign-in?redirect_url=/api/checkout?state=UT; unauth /api/checkout 401; paid /app file 401.
- Mobile 375px: no horizontal overflow, overview renders.
- Console: /api/track 503 (by design); 3x 404 for data/synthetic/*.json (sample fixture not in the CDN payload; same content is embedded in data-embedded.js — harmless, noted for v2).
- Pending: J8 done earlier (RCPT 250); real $9.99 test purchase on live = founder decision (real card, real charge).

## Relay DEPLOYED (2026-11-03 20:53Z, founder go "both")
- deploy/webhook-relay tests 10/10; `vercel deploy --prod --archive=tgz` -> https://nova-webhook-relay-lewekl36r-data-pig-llc.vercel.app (prod alias nova-webhook-relay.vercel.app).
- Post-check: routes 65 -> 66; caregiver and part-107 resolve unchanged; passlearnerspermit resolves by metadata.group AND by success_url domain fallback; junk body -> 200. Store /api/stripe/webhook answers (unsigned -> 400).
- Refund path now: refund in Stripe dashboard -> charge.refunded -> relay -> store revokes the state (plp_ent cookie expires within 12 h).

## DATASET IN R2 — COMPLETE (2026-11-03 22:47Z RUN COMPLETE failures=0; ledger 22:58Z)
- 51 states + shared uploaded state by state, every unit md5-verified by `rclone check` after upload; 0 retries, 0 give-ups across the run (04:35Z -> 22:47Z, ~18 h at ~3.3 MB/s; NE 29.3 GB took 2h25m).
- Full ledger (`tools/deploy/r2-ledger.mjs`, bucket listing vs all 51 cdn-manifests + shared): **255,145 / 255,145 present, 0 missing, 0 size mismatch, 188,426,371,152 bytes** (= 188.43 GB, matches the manifests byte for byte). Per-state table in coordination/R2-LEDGER.md; R2-MISSING.txt empty.
- The live Worker was already serving from this bucket during the upload; every state is now fully backed.
