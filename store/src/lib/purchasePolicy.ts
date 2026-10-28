import { BRAND, CURRENCY, PRICE_CENTS, PRODUCT_TAG } from "./product";
import { isStateCode } from "./catalog";

export function purchaseMetadata(userId: string, state: string): Record<string, string> {
  return { state, userId, brand: BRAND, product: PRODUCT_TAG };
}

/** A Checkout Session is fulfillable only if every field matches what /api/checkout creates. */
export function validPurchase(session: {
  mode: string | null; status: string | null; payment_status: string;
  amount_total: number | null; currency: string | null;
  metadata: Record<string, string> | null; client_reference_id: string | null;
}, owner?: string) {
  const m = session.metadata;
  return session.mode === "payment" && session.status === "complete" && session.payment_status === "paid"
    && session.amount_total === PRICE_CENTS && session.currency === CURRENCY
    && !!m && m.brand === BRAND && m.product === PRODUCT_TAG && isStateCode(m.state)
    && !!m.userId && m.userId === session.client_reference_id
    && (!owner || owner === m.userId);
}
