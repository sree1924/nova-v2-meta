import type { Metadata } from "next";
import { STATES } from "@/lib/catalog";
import { PRICE_LABEL, REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";

export const metadata: Metadata = { title: "Support", alternates: { canonical: "/support" } };

export default function Support() {
  const videoCount = STATES.filter((s) => !!s.video).length;

  return (
    <div className="prose">
      <span className="eyebrow">LEARNER HELP &amp; REFUNDS</span>
      <h1>Support</h1>
      <p className="lead">
        Need a hand with your account, a refund, or a handbook question? Email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>
          <b>{SUPPORT_EMAIL}</b>
        </a>{" "}
        and we&apos;ll take care of it.
      </p>

      <div className="card">
        <h2>Helpful details to include</h2>
        <ul>
          <li>The email address on your PassLearnersPermit account.</li>
          <li>The state course you unlocked (or are studying).</li>
          <li>If reporting a handbook update or wording question: the chapter number, card or question text, and what your official manual states.</li>
        </ul>
      </div>

      <h2>Common questions</h2>
      <div className="faq-stack">
        <div className="card">
          <h3>What do I get for {PRICE_LABEL}?</h3>
          <p>
            One state&apos;s complete course — every built chapter&apos;s 1080p lesson videos, page-flip reading lessons, pre-recorded studio narration, active-recall flashcards, module quizzes, and chapter practice tests — for 12 full months from purchase. It is a single one-time payment; nothing ever auto-renews.
          </p>
        </div>
        <div className="card">
          <h3>Which courses include video lessons and narration audio?</h3>
          <p>
            Pre-recorded studio narration for reading pages, 4-beat active-recall flashcards, and deck recaps is live across <b>all {STATES.length} jurisdictions</b> (50 states + Washington, D.C.), and 1080p visual lesson videos are included across <b>{videoCount} courses</b>.
          </p>
        </div>
        <div className="card">
          <h3>I paid, why does my chapter still look locked?</h3>
          <p>
            Make sure you&apos;re signed in with the same account used at checkout, then reload the course page. If access doesn&apos;t appear within a couple of minutes, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
          </p>
        </div>
        <div className="card">
          <h3>How do refunds work?</h3>
          <p>
            You can request a full refund within {REFUND_WINDOW_DAYS} days of purchase — no hoops. See our <a href="/refunds">refund policy</a> for details.
          </p>
        </div>
        <div className="card">
          <h3>Where is my study progress saved?</h3>
          <p>
            Completed lessons, flashcard visits, and practice scores are saved privately in your browser on this device. Clearing browser storage resets local progress.
          </p>
        </div>
      </div>
    </div>
  );
}
