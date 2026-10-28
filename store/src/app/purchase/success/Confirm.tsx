"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Result = { ok: true; state: string; expires: string } | { ok: false; error: string };

// Stripe success_url lands here; POST /api/checkout/confirm verifies the session with Stripe
// and grants the state (idempotent — the webhook may already have done it).
export default function Confirm() {
  const sessionId = useSearchParams().get("session_id") || "";
  const [res, setRes] = useState<Result | null>(null);
  useEffect(() => {
    let alive = true;
    const run = async (attempt: number): Promise<void> => {
      try {
        const r = await fetch("/api/checkout/confirm", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ sessionId }) });
        const j = await r.json();
        if (!alive) return;
        if (j.ok) { setRes({ ok: true, state: j.state, expires: j.expires }); return; }
        if (attempt < 3 && (r.status === 409 || r.status === 503)) { setTimeout(() => run(attempt + 1), 2000); return; }
        setRes({ ok: false, error: j.error || "HTTP " + r.status });
      } catch { if (alive) setRes({ ok: false, error: "network" }); }
    };
    if (/^cs_/.test(sessionId)) run(0); else setRes({ ok: false, error: "missing_session" });
    return () => { alive = false; };
  }, [sessionId]);
  if (!res) return <p>Confirming your purchase…</p>;
  if (!res.ok) {
    return (
      <div className="card">
        <h1>We could not confirm the purchase yet</h1>
        <p>If you were charged, your access will appear shortly once Stripe notifies us. Make sure you are signed in with the account you paid with, then open the course again.</p>
        <p className="muted">Reference: {res.error}. Still locked after a few minutes? Email <a href="mailto:support@passlearnerspermit.com">support@passlearnerspermit.com</a>.</p>
        <p><a className="btn" href="/app/">Open the course</a></p>
      </div>
    );
  }
  const xx = res.state.toLowerCase();
  return (
    <div className="card">
      <h1>Unlocked: {res.state}</h1>
      <p>Your full course is open until <b>{new Date(res.expires).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</b>. A Stripe receipt is on its way to your email.</p>
      <p><a className="btn" href={`/app/#/${xx}/`}>Start studying</a></p>
      <p className="muted">Changed your mind? Full refund within 7 days: email support@passlearnerspermit.com.</p>
    </div>
  );
}
