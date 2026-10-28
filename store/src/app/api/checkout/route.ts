import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";
import { stateByCode } from "@/lib/catalog";
import { isActive, readEntitlements } from "@/lib/entitlements";
import { purchaseMetadata } from "@/lib/purchasePolicy";
import { CURRENCY, PRICE_CENTS, PRODUCT_NAME, SITE_URL } from "@/lib/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/checkout?state=TX — signed-in only (401 otherwise). Creates a one-time $9.99
// Stripe Checkout Session for ONE state with metadata {state, userId, brand, product} and
// 303-redirects to it. Already entitled -> back to the course, no second charge.
// Idempotency key buckets repeat clicks (10 min) onto the same session.
export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const st = stateByCode(req.nextUrl.searchParams.get("state") || "");
  if (!st) return NextResponse.json({ error: "unknown_state" }, { status: 400 });
  if (!stripe) return NextResponse.json({ error: "billing_unavailable" }, { status: 503 });
  // Production return origin is configuration, never caller-controlled headers.
  const origin = process.env.VERCEL ? SITE_URL : req.nextUrl.origin;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if (isActive(readEntitlements(user.publicMetadata)[st.code])) {
      return NextResponse.redirect(origin + st.appPath, 303);
    }
    const meta = purchaseMetadata(userId, st.code);
    const priceId = process.env.STRIPE_PRICE_ID;
    const email = user.primaryEmailAddress?.emailAddress;
    const bucket = Math.floor(Date.now() / 600_000);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [priceId
        ? { price: priceId, quantity: 1 }
        : { quantity: 1, price_data: { currency: CURRENCY, unit_amount: PRICE_CENTS, product_data: { name: PRODUCT_NAME, description: `${st.name}: every built chapter of the ${st.handbook} course for one year from purchase. One-time payment.` } } }],
      custom_text: { submit: { message: `You are buying ${st.name} only, for one year from today. One-time payment, nothing renews. Full refund within 7 days by email.` } },
      success_url: origin + "/purchase/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/states/" + st.slug + "?checkout=cancelled",
      client_reference_id: userId,
      customer_email: email || undefined,
      metadata: meta,
      payment_intent_data: { metadata: meta },
      allow_promotion_codes: false,
    }, { idempotencyKey: `plp:${userId}:${st.code}:${bucket}` });
    if (session.status === "complete") return NextResponse.redirect(origin + "/purchase/success?session_id=" + encodeURIComponent(session.id), 303);
    if (session.status !== "open" || !session.url) return NextResponse.json({ error: "attempt_finished" }, { status: 409 });
    return NextResponse.redirect(session.url, 303);
  } catch {
    return NextResponse.json({ error: "checkout_unavailable" }, { status: 503 });
  }
}
