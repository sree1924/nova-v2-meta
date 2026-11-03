// Anonymous funnel events. This local prototype deliberately has no production sink yet.
// Keep account ids, email addresses, Stripe ids, lesson answers and scores out of this API.
import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { NextResponse } from "next/server";

export const FUNNEL_EVENTS = ["landing_view", "state_view", "free_chapter_start", "lesson_complete", "buy_panel_view", "signin_start", "checkout_start", "purchase", "refund"] as const;
export type FunnelEvent = (typeof FUNNEL_EVENTS)[number];
export interface TrackInput { event: FunnelEvent; state?: string; path: string; eventId: string; ref?: string; arm?: string }
interface Campaign { ref: string | null; arm: string | null }
interface CookieChange { name: string; value: string }
export interface TrackResult { recorded: boolean; duplicate?: boolean; eventId: string; cookies: CookieChange[] }
const ANON_COOKIE = "plp_anon";
const CAMPAIGN_COOKIE = "plp_campaign";
const COOKIE_AGE = 30 * 24 * 60 * 60;
const EVENT_ID = /^[A-Za-z0-9:_-]{8,160}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TAG = /^[A-Za-z0-9_-]{1,64}$/;
const STATES = new Set("AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(" "));
const file = path.join(process.cwd(), ".local-data", "funnel-events.jsonl");
let initialized = false;
const seen = new Set<string>();
let queue: Promise<unknown> = Promise.resolve();

function cookieMap(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of (req.headers.get("cookie") || "").split(";")) {
    const at = entry.indexOf("=");
    if (at < 0) continue;
    try { out[entry.slice(0, at).trim()] = decodeURIComponent(entry.slice(at + 1)); } catch { /* malformed cookie is ignored */ }
  }
  return out;
}

export function safeTrackingPath(raw: unknown): string | null {
  if (typeof raw !== "string" || raw.length > 500 || !raw.startsWith("/") || raw.startsWith("//") || /[\\\x00-\x20]/.test(raw)) return null;
  try {
    const u = new URL(raw, "https://local.invalid");
    if (u.origin !== "https://local.invalid") return null;
    // Queries can contain sign-in/session identifiers; never retain them.
    const hash = /^#\/[A-Za-z0-9/_%.-]*$/.test(u.hash) ? u.hash : "";
    return u.pathname + hash;
  } catch { return null; }
}

export function validateTrackInput(raw: unknown, authoritative = false): TrackInput | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (!FUNNEL_EVENTS.includes(v.event as FunnelEvent) || typeof v.eventId !== "string" || !EVENT_ID.test(v.eventId)) return null;
  if (!authoritative && (v.event === "purchase" || v.event === "refund")) return null;
  const safePath = safeTrackingPath(v.path);
  if (!safePath) return null;
  if (v.state !== undefined && (typeof v.state !== "string" || !STATES.has(v.state))) return null;
  if (v.ref !== undefined && (typeof v.ref !== "string" || !TAG.test(v.ref))) return null;
  if (v.arm !== undefined && (typeof v.arm !== "string" || !TAG.test(v.arm))) return null;
  return { event: v.event as FunnelEvent, eventId: v.eventId, path: safePath, ...(v.state ? { state: v.state as string } : {}), ...(v.ref ? { ref: v.ref as string } : {}), ...(v.arm ? { arm: v.arm as string } : {}) };
}

export function sameOriginRequest(req: Request): boolean {
  const origin = req.headers.get("origin");
  try { return !!origin && origin === new URL(req.url).origin && req.headers.get("sec-fetch-site") !== "cross-site"; } catch { return false; }
}

function campaignFromCookie(value: string | undefined): Campaign | null {
  if (!value || value.length > 400) return null;
  try {
    const c = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Record<string, unknown>;
    if (c.v !== 1 || !(c.ref === null || typeof c.ref === "string" && TAG.test(c.ref)) || !(c.arm === null || typeof c.arm === "string" && TAG.test(c.arm))) return null;
    return { ref: c.ref as string | null, arm: c.arm as string | null };
  } catch { return null; }
}

export async function recordEvent(req: Request, input: TrackInput, { authoritative = false } = {}): Promise<TrackResult> {
  const v = validateTrackInput(input, authoritative);
  if (!v) throw new Error("invalid_tracking_event");
  // An ephemeral serverless file is not an analytics backend. Production wiring is a later swap.
  if (process.env.NODE_ENV === "production") throw new Error("tracking_sink_not_configured");
  const incoming = cookieMap(req);
  const changes: CookieChange[] = [];
  const anon = UUID.test(incoming[ANON_COOKIE] || "") ? incoming[ANON_COOKIE] : randomUUID();
  if (anon !== incoming[ANON_COOKIE]) changes.push({ name: ANON_COOKIE, value: anon });
  const priorCampaign = campaignFromCookie(incoming[CAMPAIGN_COOKIE]);
  const campaign = priorCampaign || { ref: v.ref || null, arm: v.arm || null };
  if (!priorCampaign) changes.push({ name: CAMPAIGN_COOKIE, value: Buffer.from(JSON.stringify({ v: 1, ...campaign })).toString("base64url") });
  const entry = { event_id: v.eventId, at: new Date().toISOString(), event: v.event, state: v.state || null, path: v.path, anonymous_id: anon, ...campaign, environment: "local", synthetic: true, authoritative };
  const work = queue.catch(() => undefined).then(async () => {
    if (!initialized) {
      await mkdir(path.dirname(file), { recursive: true });
      let existing = "";
      try { existing = await readFile(file, "utf8"); } catch (e) { if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e; }
      for (const line of existing.split("\n")) {
        if (!line) continue;
        try { const row = JSON.parse(line) as { event_id?: string }; if (row.event_id) seen.add(row.event_id); } catch { /* preserve incomplete old lines; never rewrite the log */ }
      }
      initialized = true;
    }
    if (seen.has(v.eventId)) return { recorded: false, duplicate: true, eventId: v.eventId, cookies: changes };
    await appendFile(file, JSON.stringify(entry) + "\n", "utf8");
    seen.add(v.eventId);
    return { recorded: true, eventId: v.eventId, cookies: changes };
  });
  queue = work;
  return work;
}

export function attachTrackingCookies<T extends NextResponse>(res: T, result: TrackResult): T {
  for (const c of result.cookies) res.cookies.set(c.name, c.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: COOKIE_AGE });
  return res;
}
