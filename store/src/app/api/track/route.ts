import { NextRequest, NextResponse } from "next/server";
import { attachTrackingCookies, recordEvent, sameOriginRequest, validateTrackInput } from "@/lib/telemetry";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function POST(req: NextRequest) {
  if (!sameOriginRequest(req)) return NextResponse.json({ error: "same_origin_required" }, { status: 403, headers });
  if (!(req.headers.get("content-type") || "").startsWith("application/json")) return NextResponse.json({ error: "json_required" }, { status: 415, headers });
  if (Number(req.headers.get("content-length") || "0") > 2048) return NextResponse.json({ error: "event_too_large" }, { status: 413, headers });
  let raw: unknown;
  try { const body = await req.text(); if (body.length > 2048) return NextResponse.json({ error: "event_too_large" }, { status: 413, headers }); raw = JSON.parse(body); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400, headers }); }
  const input = validateTrackInput(raw);
  if (!input) return NextResponse.json({ error: "invalid_event" }, { status: 400, headers });
  try {
    const result = await recordEvent(req, input);
    return attachTrackingCookies(NextResponse.json({ ok: true, eventId: result.eventId, duplicate: !!result.duplicate }, { headers }), result);
  } catch {
    return NextResponse.json({ error: "tracking_unavailable" }, { status: 503, headers });
  }
}
