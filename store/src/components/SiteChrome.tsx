import { Show, UserButton } from "@clerk/nextjs";
import { FOOTER_BRAND, SUPPORT_EMAIL } from "@/lib/product";

export function SiteHeader() {
  return (
    <header className="site">
      <div className="wrap">
        <a className="brand" href="/">PassLearnersPermit</a>
        <nav aria-label="Site">
          <a href="/#states">States</a>
          <a href="/app/">Open the course</a>
          <a href="/support">Support</a>
          <Show when="signed-in"><UserButton /></Show>
          <Show when="signed-out"><a href="/sign-in">Sign in</a></Show>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div><b>{FOOTER_BRAND}</b></div>
        <nav aria-label="Policies">
          <a href="/support">Support</a>
          <a href="/refunds">Refunds</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </nav>
        <div>Practice material built from official state driver handbooks. Not affiliated with, endorsed by, or a substitute for any state DMV or government agency.</div>
      </div>
    </footer>
  );
}
