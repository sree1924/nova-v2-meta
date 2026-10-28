import type { Metadata } from "next";
import { REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";

export const metadata: Metadata = { title: "Refund policy", alternates: { canonical: "/refunds" } };

export default function Refunds() {
  return (
    <div className="prose">
      <h1>Refund policy</h1>
      <p><b>Full refund within {REFUND_WINDOW_DAYS} days of purchase.</b> Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> within {REFUND_WINDOW_DAYS} days of buying, from (or naming) the email address on your account, and tell us which state you bought. You do not need to give a reason.</p>
      <ul>
        <li>Refunds are issued by a person, by hand, to the original payment method through Stripe. Nothing is refunded automatically — a refund starts when we receive your email.</li>
        <li>Your bank decides how long the money takes to appear after we issue the refund.</li>
        <li>When a purchase is refunded, access to that state&apos;s paid chapters ends. Chapter 1 stays free.</li>
        <li>After {REFUND_WINDOW_DAYS} days, purchases are not refundable, except where the law requires otherwise.</li>
        <li>Each state is a separate purchase; refunding one does not affect another.</li>
      </ul>
    </div>
  );
}
