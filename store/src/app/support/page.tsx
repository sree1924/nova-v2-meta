import type { Metadata } from "next";
import { REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";

export const metadata: Metadata = { title: "Support", alternates: { canonical: "/support" } };

export default function Support() {
  return (
    <div className="prose">
      <h1>Support</h1>
      <p>Email <a href={`mailto:${SUPPORT_EMAIL}`}><b>{SUPPORT_EMAIL}</b></a>. We reply by email.</p>
      <h2>Helpful to include</h2>
      <ul>
        <li>The email address on your PassLearnersPermit account.</li>
        <li>The state course you bought (or are asking about).</li>
        <li>For a content error: the chapter, the card or question text, and what the handbook says.</li>
      </ul>
      <h2>Common questions</h2>
      <ul>
        <li><b>What do I get for {"$9.99"}?</b> One state&apos;s full course — every built chapter&apos;s lessons, flashcards, module quizzes and chapter practice tests — for one year from purchase. One-time payment; nothing renews.</li>
        <li><b>Is there audio?</b> Narration audio: Utah only for now. Other states are text.</li>
        <li><b>I paid but the course is still locked.</b> Sign in with the same account you paid with, then reload the course. If it is still locked, email us with your account email.</li>
        <li><b>Refunds.</b> Full refund within {REFUND_WINDOW_DAYS} days of purchase — see the <a href="/refunds">refund policy</a>.</li>
        <li><b>Where is my progress stored?</b> In your browser on this device only. Clearing site data erases it.</li>
      </ul>
    </div>
  );
}
