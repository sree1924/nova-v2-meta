import { FOOTER_BRAND, SUPPORT_EMAIL } from "@/lib/product";
import { STATES } from "@/lib/catalog";
import { localModeRequested } from "@/lib/localMode";
import { readLocalSession } from "@/lib/localSession";
import { activeOnly } from "@/lib/entitlements";
import { DynamicLessonLink } from "@/components/DynamicLessonLink";

function NeoPopShield() {
  return (
    <span className="brand-badge-pop" aria-hidden="true">
      <svg viewBox="0 0 36 36" fill="none">
        <rect x="2" y="2" width="32" height="32" rx="9" fill="#FFD23F" stroke="#111326" strokeWidth="2.6" />
        <path d="M10.5 26L15.4 10H20.6L25.5 26" stroke="#111326" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 13.5V25" stroke="#111326" strokeWidth="2.2" strokeDasharray="2.4 2.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export async function SiteHeader() {
  let account: React.ReactNode;
  if (localModeRequested()) {
    const session = await readLocalSession();
    const unlockedCodes = session ? Object.keys(activeOnly(session.e)) : [];
    account = session ? (
      <div className="header-account-cluster">
        <span className="account-badge">
          <span className="account-dot" aria-hidden="true" />
          {unlockedCodes.length ? `${unlockedCodes.join(", ")} Pass Active` : "Test Learner"}
        </span>
        <form action="/api/local/signout" method="post" className="inline-signout-form">
          <button type="submit" className="nav-ghost-btn">Sign out</button>
        </form>
      </div>
    ) : (
      <a className="nav-signin-btn" href="/sign-in">Sign in</a>
    );
  } else {
    const { Show, UserButton } = await import("@clerk/nextjs");
    account = (
      <>
        <Show when="signed-in"><UserButton /></Show>
        <Show when="signed-out"><a className="nav-signin-btn" href="/sign-in">Sign in</a></Show>
      </>
    );
  }
  const lessonRoutes = STATES.map((s) => ({
    code: s.code,
    name: s.name,
    slug: s.slug,
    href: s.video ? s.firstLessonPath : s.firstReadPath,
  }));
  return (
    <header className="site">
      <div className="wrap header-inner">
        <a className="brand" href="/">
          <NeoPopShield />
          <span className="brand-wordmark">
            PassLearnersPermit
            <small>50 STATES + D.C. · CH. 1 FREE</small>
          </span>
        </a>
        <nav aria-label="Site" className="header-nav">
          <a href="/#states" className="nav-featured-link">
            <span className="nav-live-dot" aria-hidden="true" />
            Pick Your State
            <em>51 LIVE</em>
          </a>
          <DynamicLessonLink states={lessonRoutes} variant="header" defaultCode="ND" />
          <a href="/app/#/">Study App</a>
          <a href="/support">Support</a>
          {account}
        </nav>
      </div>
      {localModeRequested() && (
        <div className="local-mode-bar" role="status">
          <div className="wrap local-mode-inner">
            <span className="local-tag">DEV SANDBOX</span>
            <span>1-click test sign-in · Simulated $9.99 unlock &amp; instant refund · $0 charged</span>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="footer-brand-head">
              <NeoPopShield />
              <b>{FOOTER_BRAND}</b>
            </div>
            <p className="footer-tagline">
              Visual, audio, and active-recall permit prep built page-for-page from official U.S. state driver manuals — all 50 states and Washington, D.C.
            </p>
          </div>
          <nav aria-label="Policies">
            <a href="/#states">All 51 States</a>
            <a href="/states/north-dakota">North Dakota</a>
            <a href="/states/texas">Texas</a>
            <a href="/states/california">California</a>
            <a href="/app/#/">Open Study App</a>
            <a href="/support">Support</a>
            <a href="/refunds">Refunds</a>
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </nav>
        </div>
        <div className="footer-disclaimer">
          Independent written-test preparation built from official state driver handbooks. Not affiliated with, endorsed by, or a substitute for any state DMV, DOT, or government licensing agency.
        </div>
      </div>
    </footer>
  );
}
