import { NextRequest, NextResponse } from "next/server";
import { stateByCode } from "@/lib/catalog";
import { isActive, oneYearFrom } from "@/lib/entitlements";
import { readLocalSession, rejectLocalMutation, writeLocalCookies } from "@/lib/localSession";
import { attachTrackingCookies, recordEvent } from "@/lib/telemetry";
import { localUrl } from "@/lib/localMode";

export const runtime = "nodejs";
export async function POST(req: NextRequest) {
  const denied = rejectLocalMutation(req);
  if (denied) return denied;
  const session = await readLocalSession(req);
  if (!session) return NextResponse.json({ error: "sign_in_required" }, { status: 401 });
  const form = await req.formData();
  const state = stateByCode(String(form.get("state") || ""));
  if (!state) return NextResponse.json({ error: "unknown_state" }, { status: 400 });
  const alreadyActive = isActive(session.e[state.code]);
  if (!alreadyActive) session.e[state.code] = oneYearFrom(new Date()).toISOString();
  const res = await writeLocalCookies(NextResponse.redirect(localUrl(req, "/purchase/success?local=1&state=" + state.code), 303), session);
  if (!alreadyActive) {
    const tracked = await recordEvent(req, { event: "purchase", state: state.code, path: "/purchase/success", eventId: crypto.randomUUID() }, { authoritative: true });
    attachTrackingCookies(res, tracked);
  }
  return res;
}
