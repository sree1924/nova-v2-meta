import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import FREE from "@/generated/free-paths.json";
import { ENT_COOKIE, verifyEntitlementCookie } from "@/lib/entitlementCookie";
import { isActive } from "@/lib/entitlements";
import { localModeRequested, localRequestAllowed, localUrl } from "@/lib/localMode";

// /app/** = the static learner shell (public/app, mirrored by tools/preview/sync-store.mjs).
// Free allowlist (generated): the shell, registries/manifests, quarantine lists, and every
// file of each state's chapter 1 (+ Utah's chapter-1 narration). Everything else under /app/
// belongs to one state (longest paid prefix) and needs an unexpired entitlement for it,
// proven by the signed plp_ent cookie that /api/me mints. Same rule as gate.js canLoad().
const FREE_SET = new Set<string>(FREE.free);
const PAID = FREE.paid_prefixes as { prefix: string; code: string }[];

const deny = (status: number, error: string, extra?: Record<string, string>) =>
  NextResponse.json({ error, ...extra }, { status, headers: { "Cache-Control": "private, no-store" } });

async function gateAppAsset(req: NextRequest, raw: string) {
  let rel: string;
  try { rel = decodeURIComponent(raw); } catch { return deny(400, "bad_path"); }
  if (rel.includes("..") || rel.includes("\\") || rel.includes("\0")) return deny(400, "bad_path");
  if (FREE_SET.has(rel)) return NextResponse.next();
  const owner = PAID.find((p) => rel.startsWith(p.prefix));
  if (!owner) return deny(404, "not_found");
  const ent = await verifyEntitlementCookie(req.cookies.get(localModeRequested() ? "plp_local" : ENT_COOKIE)?.value);
  if (!ent) return deny(401, "sign_in_required", { state: owner.code });
  if (!isActive(ent.e[owner.code])) return deny(403, "not_entitled", { state: owner.code });
  const res = NextResponse.next();
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}

// Clerk runs on pages, API routes and the shell document (/app/), so a signed-in visitor's
// session is refreshed on page load before gate.js calls /api/me.
const shellDocument = (req: NextRequest) => {
  const p = req.nextUrl.pathname;
  const target = (path: string) => localModeRequested() ? localUrl(req, path) : new URL(path, req.url);
  if (p === "/app") return NextResponse.redirect(target("/app/" + req.nextUrl.search), 308);
  if (p === "/app/") return NextResponse.rewrite(target("/app/index.html"));
};

export default async function middleware(req: NextRequest, ev: NextFetchEvent) {
  if (localModeRequested() && !localRequestAllowed(req.headers)) return deny(403, "local_mode_requires_loopback");
  const p = req.nextUrl.pathname;
  if (p.startsWith("/app/") && p !== "/app/" && p !== "/app/index.html") return gateAppAsset(req, p.slice("/app/".length));
  if (localModeRequested()) return shellDocument(req) || NextResponse.next();
  const { clerkMiddleware } = await import("@clerk/nextjs/server");
  return clerkMiddleware(async (_auth, request) => shellDocument(request))(req, ev);
}

export const config = {
  matcher: [
    "/((?!_next|app/|[^?]*\\.(?:html?|css|js(?!on)|json|mp3|jpe?g|gif|png|svg|ico|webp|woff2?|ttf|csv|webmanifest|xml|txt)).*)",
    "/(api|trpc)(.*)",
    "/app",
    "/app/:path*",
  ],
};
