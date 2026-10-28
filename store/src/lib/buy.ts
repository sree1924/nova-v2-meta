// Buy links from static pages: sign-in first (the sign-in page forwards an already
// signed-in visitor straight on), then GET /api/checkout?state=XX 303s to Stripe.
export const checkoutPath = (code: string) => `/api/checkout?state=${encodeURIComponent(code)}`;
export const buyHref = (code: string) => `/sign-in?redirect_url=${encodeURIComponent(checkoutPath(code))}`;

/** Only same-origin relative paths may be used as a post-sign-in destination. */
export function safeRedirect(v: unknown, fallback = "/app/"): string {
  if (typeof v !== "string" || !v.startsWith("/") || v.startsWith("//") || v.includes("\\") || v.length > 300) return fallback;
  return v;
}
