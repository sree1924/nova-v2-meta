// The learner's chosen state, remembered across sign-up/sign-in so /dashboard can offer "Continue your <State> journey".
// Written client-side (landing hero, state pages, the app shell); read server-side on /dashboard. Not an entitlement.
export const JOURNEY_COOKIE = "plp_state";
const MAX_AGE_S = 365 * 24 * 60 * 60;

export function rememberState(code: string): void {
  if (typeof document === "undefined") return;
  const c = String(code || "").toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return;
  document.cookie = `${JOURNEY_COOKIE}=${c}; path=/; max-age=${MAX_AGE_S}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
}

export const appHomeFor = (code: string) => `/app/#/${String(code).toLowerCase()}/`;
