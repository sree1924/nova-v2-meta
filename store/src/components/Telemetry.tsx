"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

type ClientEvent = "landing_view" | "state_view" | "free_chapter_start" | "lesson_complete" | "buy_panel_view" | "signin_start" | "checkout_start";
type Tracker = (event: ClientEvent, state?: string, path?: string, eventId?: string) => Promise<void>;
declare global { interface Window { PLPTrack?: Tracker } }
let pending: Promise<void> = Promise.resolve();
const sent = new Set<string>();
const TAG = /^[A-Za-z0-9_-]{1,64}$/;

function campaignTags() {
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref") || "", arm = params.get("arm") || "";
  return { ...(TAG.test(ref) ? { ref } : {}), ...(TAG.test(arm) ? { arm } : {}) };
}

const track: Tracker = (event, state, path = window.location.pathname + window.location.hash, eventId = crypto.randomUUID()) => {
  if (sent.has(eventId)) return pending;
  sent.add(eventId);
  const body = JSON.stringify({ event, ...(state ? { state } : {}), path, eventId, ...campaignTags() });
  pending = pending.catch(() => undefined).then(async () => {
    try { await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "same-origin", body, keepalive: true }); } catch { /* analytics never blocks studying */ }
  });
  return pending;
};

function codeFromUrl(url: URL): string | undefined {
  let destinationState: string | null = null;
  const redirect = url.searchParams.get("redirect_url");
  if (redirect && redirect.startsWith("/") && !redirect.startsWith("//")) {
    try { const dest = new URL(redirect, url.origin); if (dest.origin === url.origin) destinationState = dest.searchParams.get("state"); } catch { /* ignore malformed sign-in destination */ }
  }
  const raw = url.searchParams.get("state") || destinationState || url.hash.match(/^#\/([a-z]{2})(?:\/|$)/i)?.[1];
  return raw && /^[a-z]{2}$/i.test(raw) ? raw.toUpperCase() : undefined;
}

/** Mount once in the store layout. The static /app/ course instruments its own learning events. */
export default function Telemetry() {
  const pathname = usePathname();
  const prior = useRef("");
  useEffect(() => {
    window.PLPTrack = track;
    if (prior.current === pathname) return;
    prior.current = pathname;
    const url = new URL(window.location.href);
    const code = document.querySelector<HTMLElement>("[data-state-code]")?.dataset.stateCode || codeFromUrl(url);
    if (pathname === "/") void track("landing_view", undefined, pathname);
    else if (pathname.startsWith("/states/") && code) void track("state_view", code, pathname);
    else if (pathname === "/purchase/local") void track("checkout_start", code, pathname);
    else if (pathname.startsWith("/sign-in")) void track("signin_start", code, pathname);
  }, [pathname]);

  useEffect(() => {
    const clicked = (event: MouseEvent) => {
      const a = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
      if (!a) return;
      let url: URL;
      try { url = new URL(a.href, window.location.origin); } catch { return; }
      if (url.origin !== window.location.origin) return;
      const code = a.dataset.stateCode || codeFromUrl(url) || document.querySelector<HTMLElement>("[data-state-code]")?.dataset.stateCode;
      const explicit = a.dataset.trackEvent as ClientEvent | undefined;
      if (explicit) { void track(explicit, code, window.location.pathname); return; }
      // The course reports free_chapter_start when the free chapter actually opens.
      // Reporting this parent-page click too would count one study start twice.
      // Sign-in and checkout entry views report their own starts, avoiding click + view duplicates.
    };
    document.addEventListener("click", clicked);
    return () => document.removeEventListener("click", clicked);
  }, []);
  return null;
}
