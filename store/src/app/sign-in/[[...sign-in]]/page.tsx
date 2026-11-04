import { redirect } from "next/navigation";
import { safeRedirect } from "@/lib/buy";
import { stateByCode } from "@/lib/catalog";
import { localModeRequested } from "@/lib/localMode";
import { readLocalSession } from "@/lib/localSession";
import { PRICE_LABEL } from "@/lib/product";

export const metadata = { title: "Sign in", robots: { index: false, follow: true } };

export default async function Page({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  // No explicit destination (header "Sign in", Clerk's own links) → the dashboard, which continues the remembered state.
  const destination = safeRedirect((await searchParams).redirect_url, "/dashboard");
  const stateMatch = destination.match(/[?&]state=([A-Za-z]{2})/);
  const targetState = stateMatch ? stateByCode(stateMatch[1]) : null;

  if (localModeRequested()) {
    if (await readLocalSession()) redirect(destination);
    return (
      <div className="checkout-shell">
        <div className="card checkout-card">
          <span className="eyebrow">STEP 1 OF 2 · LEARNER ACCOUNT</span>
          <h1>Continue as a test learner</h1>
          <p className="muted">
            {targetState
              ? `Sign in to unlock all ${targetState.counts.chapters_built} chapters of the ${targetState.name} course (${PRICE_LABEL} one-time pass).`
              : "Try the complete PassLearnersPermit store and study journey on this device."}
          </p>
          <div className="checkout-perks">
            <div>✓ Instant one-click test learner session (no email or password required)</div>
            <div>✓ Ties unlocked state courses to your signed local session cookie</div>
            <div>✓ Test full purchase unlock and instant 1-click refund revocation</div>
          </div>
          <form action="/api/local/session" method="post">
            <input type="hidden" name="redirect_url" value={destination} />
            <button className="btn neo-mint-btn full" type="submit">
              Continue as test learner →
            </button>
          </form>
          <p className="micro checkout-foot">
            Just want to try Chapter 1 first?{" "}
            <a href={targetState ? targetState.freeChapterPath : "/states/north-dakota"}>
              Chapter 1 is free without signing in
            </a>.
          </p>
        </div>
      </div>
    );
  }

  const { auth } = await import("@clerk/nextjs/server");
  const { SignIn } = await import("@clerk/nextjs");
  const { userId } = await auth();
  if (userId) redirect(destination);
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
      <SignIn
        forceRedirectUrl={destination}
        signUpForceRedirectUrl={destination}
        signUpUrl={"/sign-up?redirect_url=" + encodeURIComponent(destination)}
      />
    </div>
  );
}
