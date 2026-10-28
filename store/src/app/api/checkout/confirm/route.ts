import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fulfillPurchase } from "@/lib/fulfillPurchase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/checkout/confirm {sessionId} — the buyer's return path. Verifies the session with
// Stripe (owner must be the signed-in user) and grants idempotently; the webhook does the same.
export async function POST(req: NextRequest) {
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
