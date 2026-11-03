import { NextRequest, NextResponse } from "next/server";
import { localModeRequested } from "@/lib/localMode";
import { readLocalSession, rejectLocalMutation, writeLocalCookies } from "@/lib/localSession";
import { stateByCode } from "@/lib/catalog";
import { isActive } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/checkout/confirm {sessionId} — the buyer's return path. Verifies the session with
// Stripe (owner must be the signed-in user) and grants idempotently; the webhook does the same.
export async function POST(req: NextRequest) {
  if (localModeRequested()) {
    const denied = rejectLocalMutation(req);
    if (denied) return denied;
    const session = await readLocalSession(req);
    if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    let input: { state?: string };
    try { input = await req.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
    const state = stateByCode(input.state || "");
    if (!state || !isActive(session.e[state.code])) return NextResponse.json({ ok: false, error: "not_unlocked" }, { status: 409 });
    return writeLocalCookies(NextResponse.json({ ok: true, state: state.name, code: state.code, expires: session.e[state.code], localMode: true }), session);
  }
  const { auth } = await import("@clerk/nextjs/server");
  const { fulfillPurchase } = await import("@/lib/fulfillPurchase");
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { sessionId?: unknown };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "bad_json" }, { status: 400 }); }
  if (typeof body?.sessionId !== "string" || !/^cs_[a-zA-Z0-9_]{1,200}$/.test(body.sessionId)) {
    return NextResponse.json({ error: "bad_session_id" }, { status: 400 });
  }
  try {
    const result = await fulfillPurchase(body.sessionId, userId);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch {
    return NextResponse.json({ error: "confirmation_unavailable" }, { status: 503 });
  }
}
