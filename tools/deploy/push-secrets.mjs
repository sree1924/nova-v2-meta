#!/usr/bin/env node
// push-secrets.mjs — fleet-style secrets lane for passlearnerspermit.com.
//
// Founder saves key files under D:/nova/deploy/.secrets (same convention as the 65-store fleet):
//   vercel-token.txt                 one line, Vercel token (already there)
//   stripe-key.txt                   live sk_ (shared DataPig account; first line starting sk_ is used)
//   clerk-learners-permit.txt        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_…\nCLERK_SECRET_KEY=sk_live_…
//   stripe-learners-permit.txt       written by --stripe-setup: WEBHOOK_SECRET=, WEBHOOK_ID=, PRICE_ID=
//
// Values are NEVER printed. Every step reports names, ids and counts only.
//
//   node tools/deploy/push-secrets.mjs --check          validate token/keys, say which files are present
//   node tools/deploy/push-secrets.mjs --stripe-setup   find-or-create the $9.99 product/price + webhook endpoint
//   node tools/deploy/push-secrets.mjs --push           upsert Vercel Production env vars from the files
//   node tools/deploy/push-secrets.mjs --deploy         vercel deploy --prod from store/ (prints the URL only)
//   node tools/deploy/push-secrets.mjs --all            check → stripe-setup → push → deploy
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const SECRETS = "D:/nova/deploy/.secrets";
const LANE = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..", "..");
const STORE = path.join(LANE, "store");
const SITE = "https://passlearnerspermit.com";
const BRAND = "passlearnerspermit";
const TEAM_SLUG = "data-pig-llc";
const PROJECT = JSON.parse(fs.readFileSync(path.join(STORE, ".vercel", "project.json"), "utf8")); // projectId, orgId

const args = new Set(process.argv.slice(2));
const want = (f) => args.has("--all") || args.has(f);

function readFile(name) {
  const p = path.join(SECRETS, name);
  return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : null;
}
function readKV(name) {
  const t = readFile(name);
  if (t == null) return null;
  const kv = {};
  for (const l of t.split(/\r?\n/)) { const m = l.match(/^([A-Z0-9_]+)=(.*)$/); if (m) kv[m[1]] = m[2].trim(); }
  return kv;
}
const vercelToken = (readFile("vercel-token.txt") || "").trim();
const stripeKey = ((readFile("stripe-key.txt") || "").split(/\r?\n/).find((l) => l.startsWith("sk_")) || "").trim();
const clerk = readKV("clerk-learners-permit.txt");
let stripeLine = readKV("stripe-learners-permit.txt");

const mask = (v) => (v ? `${v.slice(0, 7)}… (${v.length} chars)` : "MISSING");

async function vercel(method, p, body) {
  const r = await fetch(`https://api.vercel.com${p}${p.includes("?") ? "&" : "?"}teamId=${PROJECT.orgId}`, {
    method, headers: { Authorization: `Bearer ${vercelToken}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${method} ${p} -> ${r.status} ${JSON.stringify(j.error || j).slice(0, 200)}`);
  return j;
}
async function stripe(method, p, form) {
  const r = await fetch(`https://api.stripe.com${p}`, {
    method, headers: { Authorization: `Bearer ${stripeKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const j = await r.json();
  if (j.error) throw new Error(`${method} ${p} -> ${j.error.message}`);
  return j;
}

async function check() {
  console.log("== check");
  console.log("vercel-token.txt          ", vercelToken ? "present" : "MISSING");
  console.log("stripe-key.txt            ", stripeKey ? `present (${stripeKey.startsWith("sk_live_") ? "LIVE" : "NOT live"})` : "MISSING");
  console.log("clerk-learners-permit.txt ", clerk ? `present: pk=${clerk.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? mask(clerk.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) : "MISSING"} sk=${clerk.CLERK_SECRET_KEY ? mask(clerk.CLERK_SECRET_KEY) : "MISSING"}` : "MISSING");
  console.log("stripe-learners-permit.txt", stripeLine ? `present: ${Object.keys(stripeLine).join(",")}` : "absent (run --stripe-setup)");
  if (vercelToken) {
    const u = await vercel("GET", "/v2/user");
    const pr = await vercel("GET", `/v9/projects/${PROJECT.projectId}`);
    console.log(`vercel: user=${u.user?.username} project=${pr.name} team=${TEAM_SLUG}`);
  }
  if (stripeKey) {
    const a = await stripe("GET", "/v1/account");
    console.log(`stripe: account=${a.id} name=${a.settings?.dashboard?.display_name || a.business_profile?.name || "?"} charges_enabled=${a.charges_enabled}`);
  }
  if (clerk?.CLERK_SECRET_KEY) {
    const r = await fetch("https://api.clerk.com/v1/instance", { headers: { Authorization: `Bearer ${clerk.CLERK_SECRET_KEY}` } });
    const j = await r.json().catch(() => ({}));
    console.log(`clerk: ${r.ok ? `instance env=${j.environment_type} id=${j.id}` : `secret key rejected (${r.status})`}`);
  }
}

async function stripeSetup() {
  console.log("== stripe-setup");
  if (!stripeKey) throw new Error("stripe-key.txt missing");
  // product + price (find by metadata.brand, else create)
  let product = (await stripe("GET", "/v1/products?active=true&limit=100")).data.find((p) => p.metadata?.brand === BRAND);
  if (!product) {
    product = await stripe("POST", "/v1/products", {
      name: "Driver's permit prep: one state, one year",
      description: "PassLearnersPermit — one US state, one year of access, chapter 1 free.",
      "metadata[brand]": BRAND, "metadata[product]": "state-year", statement_descriptor: "PASSLEARNERSPERMIT",
    });
    console.log("product: created", product.id);
  } else console.log("product: found", product.id);
  let price = (await stripe("GET", `/v1/prices?product=${product.id}&active=true&limit=10`)).data
    .find((p) => p.unit_amount === 999 && p.currency === "usd" && p.type === "one_time");
  if (!price) {
    price = await stripe("POST", "/v1/prices", { product: product.id, unit_amount: "999", currency: "usd", "metadata[brand]": BRAND });
    console.log("price: created", price.id, "999 usd one-time");
  } else console.log("price: found", price.id, "999 usd one-time");
  // Webhook: the NovaPrep account is at Stripe's cap of 16 live endpoints (hit 2026-11-03), so this
  // store receives events through the fleet relay (deploy/webhook-relay, route group=passlearnerspermit).
  // Its STRIPE_WEBHOOK_SECRET is therefore the RELAY endpoint's signing secret (.secrets/stripe-relay-whsec.txt).
  const relayFile = (readFile("stripe-relay-whsec.txt") || "").trim();
  const secret = (relayFile.match(/whsec_[A-Za-z0-9]+/) || [])[0];
  if (!secret) throw new Error(".secrets/stripe-relay-whsec.txt has no whsec_ value");
  const relay = (await stripe("GET", "/v1/webhook_endpoints?limit=100")).data.find((e) => e.url.includes("nova-webhook-relay"));
  console.log("webhook: via relay", relay ? `${relay.id} ${relay.status} ${relay.url}` : "(relay endpoint not found in Stripe!)");
  const out = `WEBHOOK_SECRET=${secret}\nWEBHOOK_ID=${relay?.id || "relay"}\nPRICE_ID=${price.id}\nPRODUCT_ID=${product.id}\nVIA=nova-webhook-relay\n`;
  fs.writeFileSync(path.join(SECRETS, "stripe-learners-permit.txt"), out);
  stripeLine = readKV("stripe-learners-permit.txt");
  console.log("wrote .secrets/stripe-learners-permit.txt (WEBHOOK_SECRET=relay whsec, WEBHOOK_ID, PRICE_ID, PRODUCT_ID)");
}

async function push() {
  console.log("== push (Vercel Production env)");
  const vars = {};
  if (clerk?.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) vars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = clerk.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (clerk?.CLERK_SECRET_KEY) vars.CLERK_SECRET_KEY = clerk.CLERK_SECRET_KEY;
  if (stripeKey) vars.STRIPE_SECRET_KEY = stripeKey;
  if (stripeLine?.WEBHOOK_SECRET) vars.STRIPE_WEBHOOK_SECRET = stripeLine.WEBHOOK_SECRET;
  if (stripeLine?.PRICE_ID) vars.STRIPE_PRICE_ID = stripeLine.PRICE_ID;
  vars.NEXT_PUBLIC_SITE_URL = SITE;
  const existing = (await vercel("GET", `/v9/projects/${PROJECT.projectId}/env?decrypt=false`)).envs || [];
  for (const [key, value] of Object.entries(vars)) {
    const cur = existing.filter((e) => e.key === key && (e.target || []).includes("production"));
    const type = key.startsWith("NEXT_PUBLIC_") ? "plain" : "encrypted";
    if (cur.length) {
      await vercel("PATCH", `/v9/projects/${PROJECT.projectId}/env/${cur[0].id}`, { value, type, target: ["production"] });
      console.log(`  ${key.padEnd(36)} updated`);
    } else {
      await vercel("POST", `/v10/projects/${PROJECT.projectId}/env?upsert=true`, { key, value, type, target: ["production"] });
      console.log(`  ${key.padEnd(36)} added`);
    }
  }
  const missing = ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "CLERK_SECRET_KEY", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID", "ENTITLEMENT_COOKIE_SECRET",
    "NEXT_PUBLIC_CLERK_SIGN_IN_URL", "NEXT_PUBLIC_CLERK_SIGN_UP_URL", "NEXT_PUBLIC_CLERK_KEYLESS_DISABLED", "NEXT_PUBLIC_SITE_URL"]
    .filter((k) => !(k in vars) && !existing.some((e) => e.key === k));
  console.log(missing.length ? `  STILL MISSING on Vercel: ${missing.join(", ")}` : "  all 10 production vars present");
}

function deploy() {
  console.log("== deploy (vercel deploy --prod from store/)");
  const out = execSync(`npx vercel@65.10.0 deploy --prod --yes --scope ${TEAM_SLUG} --token ${vercelToken}`, { cwd: STORE, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const m = out.match(/"url":\s*"([^"]+)"/) || out.match(/https:\/\/\S+\.vercel\.app/);
  console.log("  deployment:", m ? m[1] || m[0] : "(url not found in output)");
  const st = out.match(/"status":\s*"(\w+)"/);
  console.log("  status:", st ? st[1] : "?");
}

(async () => {
  try {
    if (want("--check")) await check();
    if (want("--stripe-setup")) await stripeSetup();
    if (want("--push")) await push();
    if (want("--deploy")) deploy();
    if (![...args].some((a) => ["--check", "--stripe-setup", "--push", "--deploy", "--all"].includes(a))) console.log("usage: --check | --stripe-setup | --push | --deploy | --all");
  } catch (e) { console.error("FAIL:", e.message); process.exit(1); }
})();
