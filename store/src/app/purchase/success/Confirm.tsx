"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Result = { ok: true; state: string; code?: string; expires: string } | { ok: false; error: string };

export default function Confirm({ localMode = false }: { localMode?: boolean }) {
  const params = useSearchParams();
  const sessionId = params.get("session_id") || "";
  const localState = localMode ? params.get("state") || "" : "";
  const [res, setRes] = useState<Result | null>(null);

  useEffect(() => {
    let alive = true;
    const run = async (attempt: number): Promise<void> => {
      try {
        const r = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(localMode ? { state: localState } : { sessionId }),
        });
        const j = await r.json();
        if (!alive) return;
        if (j.ok) {
          setRes({ ok: true, state: j.state, code: j.code, expires: j.expires });
          return;
        }
        if (attempt < 3 && (r.status === 409 || r.status === 503)) {
          setTimeout(() => run(attempt + 1), 2000);
          return;
        }
        setRes({ ok: false, error: j.error || "HTTP " + r.status });
      } catch {
        if (alive) setRes({ ok: false, error: "network" });
      }
    };
    if (localMode ? /^[A-Z]{2}$/.test(localState) : /^cs_/.test(sessionId)) run(0);
    else setRes({ ok: false, error: "missing_session" });
    return () => {
      alive = false;
    };
  }, [sessionId, localMode, localState]);

  if (!res) {
    return (
      <div className="checkout-shell">
        <div className="card checkout-card">
          <span className="eyebrow">ACTIVATING ACCESS</span>
          <h1>Confirming your course unlock…</h1>
          <p className="muted">Setting up your 12-month state handbook pass.</p>
        </div>
      </div>
    );
  }

  if (!res.ok) {
    return (
      <div className="checkout-shell">
        <div className="card checkout-card">
          <span className="eyebrow">CHECKING STATUS</span>
          <h1>We could not confirm the purchase yet</h1>
          <p>
            If you were charged, your access will appear shortly once Stripe notifies us. Make sure you are signed in with the account you paid with, then open the course again.
          </p>
          <p className="muted">
            Reference: {res.error}. Still locked after a few minutes? Email{" "}
            <a href="mailto:support@passlearnerspermit.com">support@passlearnerspermit.com</a>.
          </p>
          <a className="btn full" href="/app/">
            Open the study app
          </a>
        </div>
      </div>
    );
  }

  const xx = (res.code || res.state).toLowerCase();
  const formattedExp = new Date(res.expires).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="checkout-shell">
      <div className="card checkout-card is-confirmed">
        <div className="checkout-header-row">
          <span className="state-monogram">{(res.code || xx).toUpperCase()}</span>
          <div>
            <span className="unlocked-badge">✓ Course Unlocked</span>
            <h1>{res.state} is ready to study</h1>
          </div>
        </div>

        <p>
          Every chapter, guided lesson, active-recall flashcard deck, and practice test in your{" "}
          <b>{res.state}</b> course is unlocked until <b>{formattedExp}</b>.{" "}
          {localMode
            ? "This was a simulated local unlock — no payment was taken."
            : "A Stripe receipt has been sent to your email."}
        </p>

        <div className="confirmed-actions">
          <a className="btn full" href={`/app/#/${xx}/`}>
            Open {res.state} course →
          </a>
          <a className="btn secondary full" href={`/app/#/${xx}/chapters`}>
            Jump to all chapters
          </a>
        </div>

        {localMode ? (
          <form action="/api/local/refund" method="post" className="local-refund-form">
            <input type="hidden" name="state" value={res.code} />
            <button className="btn secondary full" type="submit">
              Simulate refund (immediately revokes access)
            </button>
          </form>
        ) : (
          <p className="micro checkout-foot">
            Changed your mind? Full refund within 7 days: email support@passlearnerspermit.com.
          </p>
        )}
      </div>
    </div>
  );
}
