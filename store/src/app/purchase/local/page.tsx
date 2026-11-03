import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { localRequestAllowed } from "@/lib/localMode";
import { readLocalSession } from "@/lib/localSession";
import { stateByCode } from "@/lib/catalog";
import { PRICE_LABEL, REFUND_WINDOW_DAYS } from "@/lib/product";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complete unlock", robots: { index: false, follow: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (!localRequestAllowed(await headers())) notFound();
  const state = stateByCode((await searchParams).state || "");
  if (!state) notFound();
  if (!(await readLocalSession())) {
    redirect("/sign-in?redirect_url=" + encodeURIComponent("/purchase/local?state=" + state.code));
  }

  return (
    <div className="checkout-shell">
      <div className="card checkout-card">
        <div className="checkout-header-row">
          <span className="state-monogram">{state.code}</span>
          <div>
            <span className="eyebrow">STEP 2 OF 2 · ORDER SUMMARY</span>
            <h1>{state.name} Full Course Pass</h1>
          </div>
        </div>

        <div className="order-summary-box">
          <div className="order-line">
            <div>
              <strong>{state.handbook}</strong>
              <span>
                All {state.counts.chapters_built} chapters · {state.video ? `${state.video.units} HD lesson videos · ` : ""}{state.counts.lessons} lessons · {state.counts.flashcards} flashcards · {state.counts.practice_forms} practice tests
                {state.hasAudio ? ` · ${state.audioClips?.toLocaleString("en-US") ?? "Full"} audio clips` : ""}
              </span>
            </div>
            <strong className="order-price">{PRICE_LABEL}</strong>
          </div>
          <div className="order-meta-row">
            <span>12 months full access · One-time payment · Never auto-renews</span>
            <span>{REFUND_WINDOW_DAYS}-day full refund</span>
          </div>
        </div>

        <div className="local-preview-callout">
          <b>Local preview checkout — $0.00 charged.</b> Confirming below issues your signed 1-year {state.name} entitlement cookie immediately so you can study Chapters 2–{state.counts.chapters_total}.
        </div>

        <form action="/api/local/purchase" method="post">
          <input type="hidden" name="state" value={state.code} />
          <button className="btn neo-mint-btn full" type="submit">
            Unlock {state.name} course ({PRICE_LABEL} simulated) →
          </button>
        </form>

        <p className="micro checkout-foot">
          <a href={"/states/" + state.slug}>← Return to {state.name} overview</a>
        </p>
      </div>
    </div>
  );
}
