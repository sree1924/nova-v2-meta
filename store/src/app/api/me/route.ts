import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { activeOnly, readEntitlements } from "@/lib/entitlements";
import { ENT_COOKIE, ENT_COOKIE_TTL_S, signEntitlementCookie } from "@/lib/entitlementCookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cookieOpts = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/app" };

// GET /api/me -> {signedIn, entitlements}. Entitlements come fresh from Clerk publicMetadata
// (expired ones included, so the shell can say "your access ended"). Side effect: refreshes
// (or clears) the signed plp_ent cookie that middleware.ts checks on paid /app/** files.
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    const res = NextResponse.json({ signedIn: false, entitlements: {} }, { headers: { "Cache-Control": "private, no-store" } });
    res.cookies.set(ENT_COOKIE, "", { ...cookieOpts, maxAge: 0 });
    return res;
  }
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const entitlements = readEntitlements(user.publicMetadata);
    const res = NextResponse.json({ signedIn: true, entitlements }, { headers: { "Cache-Control": "private, no-store" } });
    const token = await signEntitlementCookie({ u: userId, e: activeOnly(entitlements), x: Date.now() + ENT_COOKIE_TTL_S * 1000 });
    if (token) res.cookies.set(ENT_COOKIE, token, { ...cookieOpts, maxAge: ENT_COOKIE_TTL_S });
    return res;
  } catch {
    return NextResponse.json({ error: "account_unavailable" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
