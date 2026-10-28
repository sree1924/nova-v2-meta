import type { Metadata } from "next";
import { COMPANY, SUPPORT_EMAIL } from "@/lib/product";

export const metadata: Metadata = { title: "Privacy policy", alternates: { canonical: "/privacy" } };

export default function Privacy() {
  return (
    <div className="prose">
      <h1>Privacy policy</h1>
      <p>PassLearnersPermit is operated by {COMPANY}. This page says what we collect and why.</p>
      <h2>What we collect</h2>
      <ul>
        <li><b>Account (only if you sign in):</b> your email address and sign-in details, held by our sign-in provider, Clerk. On your account record we store which states you bought and when that access ends.</li>
        <li><b>Payments (only if you buy):</b> processed by Stripe. Stripe holds your payment details; we receive the purchase record (amount, date, state bought, your account id and email), never your full card number.</li>
        <li><b>Study progress and practice scores:</b> stored only in your browser on your device. We do not receive them.</li>
        <li><b>Server logs:</b> our host (Vercel) keeps standard request logs (such as IP address and pages requested) for security and operations.</li>
      </ul>
      <h2>Cookies</h2>
      <ul>
        <li>Clerk&apos;s sign-in cookies, to keep you signed in.</li>
        <li>One cookie of ours (<code>plp_ent</code>), set after sign-in, that tells the course which states your account has unlocked. It expires within 12 hours and is refreshed when you open the course.</li>
        <li>No advertising cookies and no third-party ad trackers.</li>
      </ul>
      <h2>What we do not do</h2>
      <ul>
        <li>We do not sell your personal information.</li>
        <li>We do not use your data for advertising.</li>
      </ul>
      <h2>Your choices</h2>
      <p>To see, correct or delete your account data, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from your account email. Payment records may be kept as long as tax and accounting rules require.</p>
    </div>
  );
}
