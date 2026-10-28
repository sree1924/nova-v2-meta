import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { fulfillPurchase, revokePurchase } from "@/lib/fulfillPurchase";
import { BRAND } from "@/lib/product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/stripe/webhook — Stripe-signed. The DataPig Stripe account is shared by the fleet,
// so only sessions whose metadata.brand is this store's are touched.
//   checkout.session.completed / async_payment_succeeded -> fulfillPurchase (idempotent)
//   charge.refunded (full refund) -> revoke that state if this purchase granted it
export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "no_signature" }, { status: 400 });
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "webhook_unconfigured" }, { status: 503 });
  let event: Stripe.Event;
  try { event = stripe.webhooks.constructEvent(await req.text(), sig, secret); }
  catch { return NextResponse.json({ error: "bad_signature" }, { status: 400 }); }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.metadata?.brand === BRAND) await fulfillPurchase(session.id);
    }
    if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded && charge.payment_intent) {
        const piId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent.id;
        const pi = await stripe.paymentIntents.retrieve(piId);
        if (pi.metadata.brand === BRAND && pi.metadata.userId && pi.metadata.state) {
          const sessions = await stripe.checkout.sessions.list({ payment_intent: piId, limit: 1 });
          if (sessions.data[0]) await revokePurchase(pi.metadata.userId, pi.metadata.state, sessions.data[0].id);
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "fulfillment_unavailable" }, { status: 500 }); // Stripe retries
  }
  return NextResponse.json({ received: true });
}
