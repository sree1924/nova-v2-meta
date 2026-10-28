import type { Metadata } from "next";
import { COMPANY, PRICE_LABEL, REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";

export const metadata: Metadata = { title: "Terms of use", alternates: { canonical: "/terms" } };

export default function Terms() {
  return (
    <div className="prose">
      <h1>Terms of use</h1>
      <p>PassLearnersPermit is operated by {COMPANY}. By using the site you agree to these terms.</p>
      <h2>What the product is</h2>
      <ul>
        <li>Study material for the regular passenger-car learner&apos;s permit written (knowledge) test, one course per state.</li>
        <li>Each course is built from that state&apos;s official driver handbook. Each course names the handbook and edition it was built from; where we could not confirm an edition date, the course says &quot;(verify)&quot;. Handbooks and laws change — the current official handbook is always the authority.</li>
        <li>The lessons, flashcards and questions were written with AI models from the handbook text and machine-checked against it. An independent human audit is still pending, so errors are possible. Report errors to {SUPPORT_EMAIL}.</li>
        <li>Narration audio: Utah only for now. Narration is pre-generated audio, not a live voice.</li>
        <li>Practice tests are practice only. They are not the official test, and a practice score does not predict whether you will pass.</li>
        <li>We are not affiliated with, endorsed by, or acting for any state DMV or government agency.</li>
      </ul>
      <h2>Free and paid access</h2>
      <ul>
        <li>Chapter 1 of every state course is free, without an account.</li>
        <li>A purchase ({PRICE_LABEL}, one-time) unlocks one state&apos;s full course for one year from the moment of purchase, for the account that bought it. It does not renew and is not a subscription.</li>
        <li>Access is personal to your account. Do not share your account or redistribute the course content.</li>
        <li>Refunds: full refund within {REFUND_WINDOW_DAYS} days of purchase by email — see the <a href="/refunds">refund policy</a>.</li>
      </ul>
      <h2>Accounts and payments</h2>
      <ul>
        <li>Sign-in is provided by Clerk; payments are processed by Stripe. We never see or store your full card number.</li>
        <li>We may suspend access obtained by fraud, chargeback abuse or account sharing.</li>
      </ul>
      <h2>No warranty</h2>
      <p>The site is provided as is. To the extent the law allows, {COMPANY} is not liable for test outcomes or for decisions made from the material; use the official handbook for anything that matters.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></p>
    </div>
  );
}
