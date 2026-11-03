import { NextRequest, NextResponse } from "next/server";
import { stateByCode } from "@/lib/catalog";
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
  const existed = !!session.e[state.code];
  delete session.e[state.code];
  const res = await writeLocalCookies(NextResponse.redirect(localUrl(req, "/states/" + state.slug + "?refund=simulated"), 303), session);
  if (existed) {
    const tracked = await recordEvent(req, { event: "refund", state: state.code, path: "/states/" + state.slug, eventId: crypto.randomUUID() }, { authoritative: true });
    attachTrackingCookies(res, tracked);
  }
  return res;
}
