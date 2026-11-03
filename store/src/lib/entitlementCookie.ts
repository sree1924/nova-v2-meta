// Signed, short-lived entitlement cookie for the static learner shell under /app/.
//
// Why: the shell (public/app/index.html) is plain HTML with no Clerk JS, so its Clerk
// session token is not refreshed after ~60 s. /api/me (called by gate.js at page load,
// right after Clerk's middleware has refreshed the session on the document request)
// mints this cookie from the user's Clerk publicMetadata; middleware.ts then checks it on
// every paid /app/** file request without calling Clerk.
//
// Format: base64url(JSON {u: userId, e: {TX: iso}, x: expiresAtMs}) "." base64url(HMAC-SHA256).
// Key: ENTITLEMENT_COOKIE_SECRET, else CLERK_SECRET_KEY (domain-separated). HttpOnly,
// Secure in production, SameSite=Lax, Path=/app. Edge-safe (Web Crypto only).
export const ENT_COOKIE = "plp_ent";
export const ENT_COOKIE_TTL_S = 12 * 60 * 60;

export interface EntPayload { u: string; e: Record<string, string>; x: number }

const enc = new TextEncoder();
const b64url = (bytes: Uint8Array) => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string) => {
  const t = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(t);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};

async function hmacKey(): Promise<CryptoKey | null> {
  const local = process.env.STORE_LOCAL_MODE === "1" && process.env.NODE_ENV !== "production";
  // Public, deliberately dev-only fallback: local mode additionally requires a loopback host.
  const secret = process.env.ENTITLEMENT_COOKIE_SECRET || process.env.CLERK_SECRET_KEY || (local ? "plp-local-harness-not-a-production-secret-v1" : "");
  if (!secret) return null;
  return crypto.subtle.importKey("raw", enc.encode("plp-ent-v1:" + secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signEntitlementCookie(p: EntPayload): Promise<string | null> {
  const key = await hmacKey();
  if (!key) return null;
  const body = b64url(enc.encode(JSON.stringify(p)));
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  return body + "." + b64url(sig);
}

export async function verifyEntitlementCookie(v: string | undefined | null, now = Date.now()): Promise<EntPayload | null> {
  if (!v || v.length > 4096) return null;
  const [body, sig, extra] = v.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const key = await hmacKey();
  if (!key) return null;
  try {
    const okSig = await crypto.subtle.verify("HMAC", key, fromB64url(sig), enc.encode(body));
    if (!okSig) return null;
    const p = JSON.parse(new TextDecoder().decode(fromB64url(body))) as EntPayload;
    if (!p || typeof p.u !== "string" || typeof p.x !== "number" || p.x <= now || !p.e || typeof p.e !== "object") return null;
    return p;
  } catch { return null; }
}
