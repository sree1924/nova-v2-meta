// ONE place for the product's commercial facts. gate.js (public/app/gate.js) mirrors
// PRICE_LABEL and SUPPORT_EMAIL — change both together.
// Founder decisions 2026-10-28: one state for one year, $9.99, one-time Stripe Checkout,
// no bundles, no subscriptions; free = state picker + chapter 1 of every state + Utah's
// chapter 1 narration.
export const BRAND = "passlearnerspermit";          // Stripe metadata brand (shared DataPig Stripe account)
export const PRODUCT_TAG = "state-year-v1";         // Stripe metadata product
export const SITE_NAME = "PassLearnersPermit";
export const COMPANY = "DataPig LLC";
export const FOOTER_BRAND = "PassLearnersPermit by DataPig LLC";
export const SUPPORT_EMAIL = "support@passlearnerspermit.com";
export const PRICE_CENTS = 999;
export const PRICE_LABEL = "$9.99";
export const CURRENCY = "usd";
export const PRODUCT_NAME = "Driver's permit prep: one state, one year";
export const REFUND_WINDOW_DAYS = 7;
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://passlearnerspermit.com").replace(/\/+$/, "");
