import { NextRequest, NextResponse } from "next/server";
import { safeRedirect } from "@/lib/buy";
import { ENT_COOKIE_TTL_S } from "@/lib/entitlementCookie";
import { readLocalSession, rejectLocalMutation, writeLocalCookies } from "@/lib/localSession";
import { localUrl } from "@/lib/localMode";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const denied = rejectLocalMutation(req);
  if (denied) return denied;
  const form = await req.formData();
  const destination = safeRedirect(form.get("redirect_url"));
  const existing = await readLocalSession(req);
  const session = existing || { u: "local_" + crypto.randomUUID(), e: {}, x: Date.now() + ENT_COOKIE_TTL_S * 1000 };
  return writeLocalCookies(NextResponse.redirect(localUrl(req, destination), 303), session);
}
