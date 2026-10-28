import type { Metadata } from "next";
import { STATES } from "@/lib/catalog";
import { PRICE_LABEL, REFUND_WINDOW_DAYS } from "@/lib/product";

export const metadata: Metadata = {
  title: { absolute: "Driver's permit practice test by state — PassLearnersPermit" },
  alternates: { canonical: "/" },
};

export default function Home() {
  const totalCards = STATES.reduce((n, s) => n + s.counts.flashcards, 0);
  const totalItems = STATES.reduce((n, s) => n + s.counts.quiz_items, 0);
  return (
    <>
      <h1>Driver&apos;s permit practice test, built from your state&apos;s handbook</h1>
      <p className="lead">
        Study for your learner&apos;s permit written test chapter by chapter: a short lesson, flashcards and a quiz for
        every module, then chapter practice tests. Every course is built from that state&apos;s official driver handbook,
        and every card and question shows the handbook source it came from.
      </p>
      <p>
        <a className="btn" href="#states">Choose your state</a>
        <a className="btn secondary" href="/app/">Open the course</a>
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Chapter 1 is free in every state</h2>
        <p>The lesson, flashcards and quiz for chapter 1 of every state course are free — no account needed.</p>
        <p><span className="price">{PRICE_LABEL}</span> for the full course of <b>one state, for one year</b>. One-time payment; no subscription, nothing renews. Full refund within {REFUND_WINDOW_DAYS} days of purchase by emailing support.</p>
        <p className="muted">Narration audio: Utah only for now. Every other state is text: lessons, flashcards and questions.</p>
      </div>

      <h2 id="states">Choose your state</h2>
      <p className="muted">{STATES.length} state courses · {totalCards.toLocaleString("en-US")} flashcards · {totalItems.toLocaleString("en-US")} practice questions in all.</p>
      <ul className="grid">
        {STATES.map((s) => (
          <li key={s.code}>
            <a href={`/states/${s.slug}`}>{s.name}<span>{s.counts.chapters_built} chapters · {s.counts.flashcards} cards{s.hasAudio ? " · narrated" : ""}</span></a>
          </li>
        ))}
      </ul>

      <h2>How it works</h2>
      <ol className="prose">
        <li><b>Lesson.</b> Each module starts with a short lesson in plain language, with a worked example and the common mistake to avoid.</li>
        <li><b>Flashcards.</b> Recall the answer first, then reveal it, with a memory hook and its handbook source.</li>
        <li><b>Quiz.</b> Module quizzes explain why each answer is right or wrong; chapter practice tests mix the whole chapter.</li>
      </ol>

      <h2>What we do not claim</h2>
      <ul className="prose">
        <li>This is practice material, not the official test. Scores describe your practice only; they do not predict your result.</li>
        <li>We are not affiliated with any state DMV or government agency. Your state&apos;s handbook is the authority; each course names the handbook edition it was built from.</li>
        <li>The courses were written with AI models from the handbook text and machine-checked against it; an independent human audit is still pending. If you find an error, email support and we will fix it.</li>
      </ul>
    </>
  );
}
