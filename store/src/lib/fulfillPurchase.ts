import { clerkClient } from "@clerk/nextjs/server";
import { stripe } from "./stripe";
import { validPurchase } from "./purchasePolicy";
import { oneYearFrom, readEntitlements } from "./entitlements";

type Purchases = Record<string, { session: string; at: string; expires: string } | null>;

// Shared by the signed webhook and the authenticated confirm route. Idempotent: a Checkout
// Session already recorded for its state is a no-op; webhook and confirm racing compute the
// same values. Expiry = one year from the session's creation (the purchase time).
export async function fulfillPurchase(sessionId: string, owner?: string) {
  if (!stripe) throw new Error("billing_unavailable");
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  if (!validPurchase(session, owner)) return { ok: false as const, error: "purchase_not_verified" };
  const piId = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!piId) return { ok: false as const, error: "payment_not_verified" };
  const pi = await stripe.paymentIntents.retrieve(piId, { expand: ["latest_charge"] });
  const charge = pi.latest_charge;
  // Paid sessions stay "paid" after a refund: never (re)grant a refunded or disputed purchase.
  if (pi.status !== "succeeded" || !charge || typeof charge === "string" || charge.refunded || charge.amount_refunded > 0 || charge.disputed) {
    return { ok: false as const, error: "payment_not_available" };
  }
  const userId = session.metadata!.userId;
  const state = session.metadata!.state;
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const ent = readEntitlements(user.publicMetadata);
  const purchases = ((user.publicMetadata as Record<string, unknown>).purchases || {}) as Purchases;
  if (purchases[state]?.session === session.id) {
    return { ok: true as const, state, expires: ent[state] ?? purchases[state]!.expires, granted: false };
  }
  const at = new Date(session.created * 1000);
  let expires = oneYearFrom(at).toISOString();
  if (ent[state] && Date.parse(ent[state]) > Date.parse(expires)) expires = ent[state];
  // Clerk deep-merges publicMetadata: only this state's keys are written.
  await client.users.updateUserMetadata(userId, { publicMetadata: {
    entitlements: { [state]: expires },
    purchases: { [state]: { session: session.id, at: at.toISOString(), expires } },
  } });
  return { ok: true as const, state, expires, granted: true };
}

/** Refund path: revoke a state only if the refunded session is the one that granted it. */
export async function revokePurchase(userId: string, state: string, sessionId: string) {
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const purchases = ((user.publicMetadata as Record<string, unknown>).purchases || {}) as Purchases;
  if (purchases[state]?.session !== sessionId) return false; // an older refund never revokes a newer purchase
  await client.users.updateUserMetadata(userId, { publicMetadata: { entitlements: { [state]: null }, purchases: { [state]: null } } });
  return true;
}
