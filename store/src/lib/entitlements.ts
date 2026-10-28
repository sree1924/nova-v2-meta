// Per-state entitlements live in Clerk publicMetadata:
//   entitlements: { "TX": "<ISO expiry, one year from purchase>" }
//   purchases:    { "TX": { session: "cs_…", at: "<ISO purchase time>", expires: "<ISO>" } }
// `purchases` makes fulfillment idempotent (same Checkout Session = no-op) and lets the
// refund webhook revoke only the purchase it refers to.
// Edge-safe (no Node APIs): imported by middleware.ts.
const CODE = /^[A-Z]{2}$/;

export type Entitlements = Record<string, string>;

export function readEntitlements(publicMetadata: unknown): Entitlements {
  const m = (publicMetadata && typeof publicMetadata === "object" ? (publicMetadata as Record<string, unknown>).entitlements : null) as Record<string, unknown> | null;
  const out: Entitlements = {};
  if (!m || typeof m !== "object") return out;
  for (const [k, v] of Object.entries(m)) {
    if (CODE.test(k) && typeof v === "string" && Number.isFinite(Date.parse(v))) out[k] = new Date(Date.parse(v)).toISOString();
  }
  return out;
}

export const isActive = (iso: string | undefined | null, now = Date.now()) => !!iso && Date.parse(iso) > now;

export function activeOnly(e: Entitlements, now = Date.now()): Entitlements {
  const out: Entitlements = {};
  for (const [k, v] of Object.entries(e)) if (isActive(v, now)) out[k] = v;
  return out;
}

/** Same calendar date one year later (UTC); Feb 29 rolls to Mar 1. */
export function oneYearFrom(d: Date): Date {
  const x = new Date(d.getTime());
  x.setUTCFullYear(x.getUTCFullYear() + 1);
  return x;
}
