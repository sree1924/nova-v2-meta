import { cookies, headers } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { ENT_COOKIE, ENT_COOKIE_TTL_S, signEntitlementCookie, verifyEntitlementCookie, type EntPayload } from "./entitlementCookie";
import { activeOnly } from "./entitlements";
import { localMutationAllowed, localRequestAllowed } from "./localMode";

export const LOCAL_COOKIE = "plp_local";
const opts = { httpOnly: true, secure: false, sameSite: "lax" as const };

export async function readLocalSession(req?: NextRequest): Promise<EntPayload | null> {
  const h = req?.headers || await headers();
  if (!localRequestAllowed(h)) return null;
  const token = req ? req.cookies.get(LOCAL_COOKIE)?.value : (await cookies()).get(LOCAL_COOKIE)?.value;
  const session = await verifyEntitlementCookie(token);
  return session?.u.startsWith("local_") ? session : null;
}

export function rejectLocalMutation(req: NextRequest) {
  return localMutationAllowed(req.headers) ? null : NextResponse.json({ error: "local_only_or_invalid_origin" }, { status: 403 });
}

export async function writeLocalCookies(res: NextResponse, session: EntPayload | null) {
  res.headers.set("Cache-Control", "private, no-store");
  if (!session) {
    res.cookies.set(LOCAL_COOKIE, "", { ...opts, path: "/", maxAge: 0 });
    res.cookies.set(ENT_COOKIE, "", { ...opts, path: "/app", maxAge: 0 });
    return res;
  }
  const token = await signEntitlementCookie({ ...session, e: activeOnly(session.e) });
  if (!token) throw new Error("Local session signing unavailable");
  res.cookies.set(LOCAL_COOKIE, token, { ...opts, path: "/", maxAge: ENT_COOKIE_TTL_S });
  res.cookies.set(ENT_COOKIE, token, { ...opts, path: "/app", maxAge: ENT_COOKIE_TTL_S });
  return res;
}
