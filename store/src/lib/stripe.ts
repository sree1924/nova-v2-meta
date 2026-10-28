// Server-only Stripe client. Null when STRIPE_SECRET_KEY is unset so importing this never
// throws at build time — every route checks for null and answers 503.
import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;
export const stripe: Stripe | null = key ? new Stripe(key) : null;
