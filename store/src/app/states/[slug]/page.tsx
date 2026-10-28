import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATES, stateBySlug } from "@/lib/catalog";
import { buyHref } from "@/lib/buy";
import { PRICE_LABEL, REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";

export const dynamicParams = false;
export function generateStaticParams() { return STATES.map((s) => ({ slug: s.slug })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const s = stateBySlug((await params).slug);
  if (!s) return {};
  const title = `${s.name} driver's permit practice test`;
  return {
    title: { absolute: `${title} — PassLearnersPermit` },
    description: `${s.name} learner's permit practice built from the ${s.handbook}: ${s.counts.chapters_built} chapters, ${s.counts.flashcards} flashcards, ${s.counts.quiz_items} practice questions. Chapter 1 free; full course ${PRICE_LABEL} for one year.`,
    alternates: { canonical: `/states/${s.slug}` },
    openGraph: { title, url: `/states/${s.slug}` },
  };
}

export default async function StatePage({ params }: { params: Promise<{ slug: string }> }) {
  const s = stateBySlug((await params).slug);
  if (!s) notFound();
  const c = s.counts;
  return (
    <>
      <h1>{s.name} driver&apos;s permit practice test</h1>
      <p className="lead">
        Prepare for the {s.name} {s.test} with a course built from the <b>{s.handbook}</b>: one chapter per handbook
        section, each with lessons, flashcards, module quizzes and chapter practice tests. Every card and question shows
        the handbook source it came from.
      </p>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Start free: Chapter {s.freeChapter.n} — {s.freeChapter.title}</h2>
        <p>The full lesson, flashcards and quiz for chapter {s.freeChapter.n}. No account needed.</p>
        <p><a className="btn" href={s.freeChapterPath}>Open the free chapter</a></p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Full {s.name} course — <span className="price">{PRICE_LABEL}</span></h2>
        <p><b>One state, one year.</b> Every built chapter of the {s.name} course for one year from purchase. One-time payment; no subscription, nothing renews.</p>
        <dl className="facts">
          <dt>Chapters</dt><dd>{c.chapters_built} of {c.chapters_total} handbook sections built</dd>
          <dt>Lessons</dt><dd>{c.lessons}</dd>
          <dt>Flashcards</dt><dd>{c.flashcards}{c.flashcards_held_back ? ` (${c.flashcards_held_back} more held back for a wording fix, not shown)` : ""}</dd>
          <dt>Practice questions</dt><dd>{c.quiz_items}, in {c.module_quizzes} module quizzes and {c.practice_forms} chapter practice tests</dd>
          <dt>Narration audio</dt><dd>{s.hasAudio ? "Included for every Utah chapter (chapter 1 narration is free). Narration audio: Utah only for now." : "Not included — narration audio: Utah only for now."}</dd>
          <dt>Built from</dt><dd>{s.handbook}{s.edition ? ` — edition: ${s.edition}` : ""}</dd>
        </dl>
        <p style={{ marginTop: 14 }}><a className="btn" href={buyHref(s.code)}>Buy {s.name} — {PRICE_LABEL}</a></p>
        <p className="muted">You sign in (or create an account) first, then pay on Stripe&apos;s secure checkout. Full refund within {REFUND_WINDOW_DAYS} days of purchase: email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
      </div>

      <h2>Chapters in the {s.name} course</h2>
      <ol className="chapters">
        {s.chapters.map((ch) => (
          <li key={ch.id}>
            {ch.title}
            {ch.id === s.freeChapter.id && <span className="tag free">Free</span>}
            {!ch.built && <span className="tag pending">not yet built</span>}
          </li>
        ))}
      </ol>

      <h2>Good to know</h2>
      <ul className="prose">
        <li>Practice only — this is not the official {s.name} test, and scores do not predict your result.</li>
        <li>Not affiliated with or endorsed by the State of {s.name} or any government agency. The handbook is the authority; check it for anything that matters.</li>
        <li>Written with AI models from the handbook text and machine-checked against it; an independent human audit is still pending. Report an error to {SUPPORT_EMAIL}.</li>
      </ul>
    </>
  );
}
