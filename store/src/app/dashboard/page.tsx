import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STATES, stateByCode } from "@/lib/catalog";
import { activeOnly, isActive, readEntitlements, type Entitlements } from "@/lib/entitlements";
import { buyHref } from "@/lib/buy";
import { JOURNEY_COOKIE, appHomeFor } from "@/lib/journey";
import { localModeRequested } from "@/lib/localMode";
import { readLocalSession } from "@/lib/localSession";
import { PRICE_LABEL } from "@/lib/product";

export const metadata = { title: "Your dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

async function account(): Promise<{ signedIn: boolean; entitlements: Entitlements; label: string }> {
  if (localModeRequested()) {
    const s = await readLocalSession();
    return { signedIn: !!s, entitlements: s?.e || {}, label: "Test learner" };
  }
  const { auth, clerkClient } = await import("@clerk/nextjs/server");
  const { userId } = await auth();
  if (!userId) return { signedIn: false, entitlements: {}, label: "" };
  try {
    const user = await (await clerkClient()).users.getUser(userId);
    const name = user.firstName || user.username || user.primaryEmailAddress?.emailAddress || "";
    return { signedIn: true, entitlements: readEntitlements(user.publicMetadata), label: name };
  } catch {
    return { signedIn: true, entitlements: {}, label: "" };
  }
}

export default async function Dashboard() {
  const me = await account();
  if (!me.signedIn) redirect("/sign-in?redirect_url=" + encodeURIComponent("/dashboard"));

  const active = activeOnly(me.entitlements);
  const activeCodes = Object.keys(active);
  const remembered = stateByCode((await cookies()).get(JOURNEY_COOKIE)?.value || "");
  // The journey state: what they were looking at; else their newest pass; else nothing yet.
  const journey = remembered || (activeCodes.length ? stateByCode(activeCodes[activeCodes.length - 1]) : null);
  const unlocked = journey ? isActive(me.entitlements[journey.code]) : false;
  const until = journey && unlocked ? new Date(me.entitlements[journey.code]).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : null;

  return (
    <div className="checkout-shell" data-dashboard>
      <div className="card checkout-card">
        <span className="eyebrow">YOUR DASHBOARD{me.label ? ` · ${me.label.toUpperCase()}` : ""}</span>
        {journey ? (
          <>
            <div className="checkout-header-row">
              <span className="state-monogram">{journey.code}</span>
              <h1>Continue your {journey.name} journey</h1>
            </div>
            <p className="muted">
              {unlocked
                ? `Full ${journey.name} course unlocked until ${until}: ${journey.counts.chapters_built} chapters, lesson videos, flashcards and practice tests.`
                : `Chapter 1 of the ${journey.name} course is free. The full course is ${PRICE_LABEL} for one year, no subscription.`}
            </p>
            {unlocked && <span className="unlocked-badge">✓ {journey.code} pass active</span>}
            <div className="confirmed-actions">
              <a className="btn full" href={appHomeFor(journey.code)} data-journey-continue>
                Continue {journey.name} →
              </a>
              {!unlocked && (
                <a className="btn secondary full" href={buyHref(journey.code)} data-journey-unlock>
                  Unlock all {journey.counts.chapters_built} {journey.name} chapters — {PRICE_LABEL}
                </a>
              )}
            </div>
          </>
        ) : (
          <>
            <h1>Pick your state to start</h1>
            <p className="muted">Chapter 1 is free in every state. Your dashboard will remember where you left off.</p>
            <div className="confirmed-actions">
              <a className="btn full" href="/#states">Choose a state →</a>
            </div>
          </>
        )}
        {activeCodes.length > 0 && (
          <div className="dashboard-passes">
            <span className="eyebrow">YOUR PASSES</span>
            <ul className="dashboard-pass-list">
              {activeCodes.map((code) => {
                const s = stateByCode(code);
                return (
                  <li key={code}>
                    <a href={appHomeFor(code)}>{s ? s.name : code}</a>
                    <span className="micro muted"> · until {new Date(active[code]).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        <p className="micro checkout-foot">
          {journey ? <a href="/#states">Switch state</a> : <a href={appHomeFor(STATES[0].code)}>Open the study app</a>}
          {" · "}
          <a href="/support">Support</a>
        </p>
      </div>
    </div>
  );
}
