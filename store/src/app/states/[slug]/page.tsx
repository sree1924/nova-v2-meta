import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STATES, stateBySlug } from "@/lib/catalog";
import { buyHref } from "@/lib/buy";
import { PRICE_LABEL, REFUND_WINDOW_DAYS, SUPPORT_EMAIL } from "@/lib/product";
import { StateChapterRoadmap, StateUnlockCard } from "@/components/StateUnlockCard";
import { StateAudioPreview } from "@/components/StateAudioPreview";

export const dynamicParams = false;
export function generateStaticParams() {
  return STATES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const s = stateBySlug((await params).slug);
  if (!s) return {};
  return {
    title: { absolute: `${s.name} Learner's Permit Practice — PassLearnersPermit` },
    description: `Study the official ${s.handbook} with ${s.counts.chapters_built} chapters of ${
      s.video ? `${s.video.units} 1080p lesson videos, ` : ""
    }${s.counts.flashcards} active-recall flashcards, and practice tests. Chapter 1 free.`,
    alternates: { canonical: `/states/${s.slug}` },
  };
}

export default async function StatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const s = stateBySlug((await params).slug);
  if (!s) notFound();
  const local = process.env.STORE_LOCAL_MODE === "1";

  return (
    <div data-state-code={s.code}>
      <a className="back-link" href="/#states">
        ← All 51 state manuals
      </a>

      <section className="state-hero neo-state-hero">
        <div>
          <div className="state-hero-badges">
            <span className="neo-sticker">★ OFFICIAL HANDBOOK EDITION · {s.code}</span>
            {s.video && (
              <span className="pill pill-video">
                🎬 {s.video.units} HD videos ({Math.round((s.video.durationSeconds || 9600) / 60)} min)
              </span>
            )}
            {s.hasAudio && <span className="pill">🎧 Studio narration</span>}
            <span className="pill">🛑 MUTCD signs + scenes</span>
          </div>

          <h1>
            {s.name} permit prep,
            <br />
            <span className="neo-highlight">built to stick.</span>
          </h1>

          <p className="lead">
            Skip passive cramming. Master the official <b>{s.handbook}</b> ({s.test}) with{" "}
            {s.video ? "1080p visual walkthroughs, " : ""}
            page-flip reading, 4-beat recall cards, and explained DMV-style practice questions.
          </p>

          <div className="state-direct-launch" aria-label={`Start ${s.name} Chapter 1 free`}>
            <div className="hero-drill-label">
              START CHAPTER 1 ({s.freeChapter.title.toUpperCase()}) — 100% FREE, NO ACCOUNT
            </div>
            <div className="hero-drill-grid">
              {s.video ? (
                <a className="neo-drill-btn is-primary" href={s.firstLessonPath}>
                  <span className="drill-icon" aria-hidden="true">▶</span>
                  <span>
                    <strong>Lesson 1 Video</strong>
                    <small>{s.video.freeUnits} free in Ch. 1</small>
                  </span>
                </a>
              ) : (
                <a className="neo-drill-btn is-primary" href={s.firstReadPath}>
                  <span className="drill-icon" aria-hidden="true">📖</span>
                  <span>
                    <strong>Lesson 1 Reader</strong>
                    <small>Visual pages</small>
                  </span>
                </a>
              )}
              <a className="neo-drill-btn" href={s.firstReadPath}>
                <span className="drill-icon" aria-hidden="true">📖</span>
                <span>
                  <strong>Flip Reading</strong>
                  <small>Cited rules</small>
                </span>
              </a>
              <a className="neo-drill-btn" href={s.firstCardsPath}>
                <span className="drill-icon" aria-hidden="true">⚡</span>
                <span>
                  <strong>Recall Cards</strong>
                  <small>Memory hooks</small>
                </span>
              </a>
              <a className="neo-drill-btn" href={s.firstQuizPath}>
                <span className="drill-icon" aria-hidden="true">✓</span>
                <span>
                  <strong>Module 1 Quiz</strong>
                  <small>Instant why</small>
                </span>
              </a>
            </div>
          </div>

          <div className="actions state-sub-actions">
            <a className="btn secondary" href={s.freeChapterPath}>
              Open all Chapter 1 modules →
            </a>
            <a className="btn secondary" href="#curriculum">
              Full {s.counts.chapters_total}-chapter syllabus ↓
            </a>
          </div>
          <p className="muted state-signs-free-line">
            <a href={s.signsPath}>
              Free: every road sign on the {s.name} test, with pictures. →
            </a>
          </p>
        </div>

        <aside className="course-summary neo-summary-panel">
          <div className="summary-top-row">
            <span className="state-monogram">{s.code}</span>
            <span className="summary-handbook-tag">{s.test}</span>
          </div>
          <h2>Inside your {s.name} pass.</h2>
          <div className="stat-row">
            <div>
              <strong>{s.counts.chapters_built}</strong>
              <span>chapters</span>
            </div>
            <div>
              <strong>{s.video ? s.video.units : s.counts.lessons}</strong>
              <span>{s.video ? "HD videos" : "lessons"}</span>
            </div>
            <div>
              <strong>{s.counts.flashcards.toLocaleString("en-US")}</strong>
              <span>recall cards</span>
            </div>
            <div>
              <strong>{s.counts.quiz_items.toLocaleString("en-US")}</strong>
              <span>questions</span>
            </div>
          </div>
          <p className="muted summary-foot">
            {s.counts.practice_forms} full chapter practice tests ·{" "}
            {s.mappedVisualCards > 0 ? `${s.mappedVisualCards} visual cards · ` : ""}
            {s.hasAudio
              ? `${
                  s.audioClips
                    ? s.audioClips.toLocaleString("en-US") + " studio audio clips"
                    : "Pre-recorded narration"
                }`
              : "Complete written lessons, flashcards & quizzes"}
          </p>
        </aside>
      </section>

      {s.video && s.video.sampleVideo && (
        <section className="nd-video-showcase" aria-label="Sample narrated lesson video">
          <div className="nd-video-copy">
            <span className="neo-sticker">
              🎬 {s.video.units} FULL-COURSE VIDEOS · {Math.round((s.video.durationSeconds || 9626) / 60)} MIN TOTAL
            </span>
            <h2>Watch {s.name} Lesson 1 right here.</h2>
            <p className="muted">
              Every module kicks off with a custom-rendered 1080p lesson video synced to book-style reading pages, exam watch-outs, and exact handbook citations. All{" "}
              <b>{s.video.freeUnits} videos in Chapter 1</b> play free with zero sign-up.
            </p>
            <div className="nd-video-actions">
              <a className="btn neo-mint-btn" href={s.firstLessonPath}>
                Open Lesson 1 Video Theater →
              </a>
              <a className="btn secondary" href={s.firstReadPath}>
                Flip Lesson 1 Pages →
              </a>
            </div>
          </div>
          <div className="nd-video-frame">
            <video
              controls
              playsInline
              preload="metadata"
              poster={s.video.samplePoster ?? undefined}
              src={s.video.sampleVideo}
            />
            <div className="nd-video-caption">
              <span>
                Lesson 01 of {s.video.units} · {s.freeChapter.title}
              </span>
              <span>1080p HD · Free Ch. 1</span>
            </div>
          </div>
        </section>
      )}

      <section className="nd-sign-showcase" aria-label="Official road sign and scenario visuals included">
        <div className="nd-sign-copy">
          <span className="eyebrow">VISUAL ROAD SIGN &amp; SCENARIO TRAINING</span>
          <h2>
            {s.mappedVisualCards > 0
              ? `${s.mappedVisualCards} ${s.name} cards paired with verified road scenes & MUTCD signs.`
              : `Official FHWA MUTCD signs & verified driving scenes built in.`}
          </h2>
          <p className="muted">
            Don&apos;t memorize abstract text without seeing the intersection. Reading pages, recall cards, and quizzes pair unmodified public-domain U.S. Federal Highway Administration sign figures with custom driving-rule visuals.
          </p>
        </div>
        <div className="nd-sign-strip">
          {(s.sampleSigns.length >= 2
            ? s.sampleSigns.slice(0, 2)
            : [
                { id: "sign-stop", name: "STOP", category: "regulatory", src: "/app/signs/sign-stop.png" },
                { id: "sign-signal-ahead", name: "Signal Ahead", category: "warning", src: "/app/signs/sign-signal-ahead.png" },
              ]
          ).map((sg) => (
            <figure key={sg.id}>
              <img src={sg.src} alt={`${sg.name} road sign`} loading="lazy" />
              <figcaption>{sg.name}</figcaption>
            </figure>
          ))}
          <figure>
            <img
              src="/app/visuals/drv-02-knowledge-test-kiosk.webp"
              alt="Knowledge test station and locker rule"
              loading="lazy"
            />
            <figcaption>Testing Rules</figcaption>
          </figure>
          <figure>
            <img
              src="/app/visuals/drv-12-crosswalk-white-cane-yield.webp"
              alt="Pedestrian crosswalk yield rule"
              loading="lazy"
            />
            <figcaption>Right-of-Way</figcaption>
          </figure>
        </div>
      </section>

      {s.hasAudio && s.audioSamples && (
        <StateAudioPreview
          stateName={s.name}
          audioClips={s.audioClips}
          samples={s.audioSamples}
          freeChapterPath={s.firstCardsPath}
        />
      )}

      <div className="review-note" role="note">
        <span className="review-dot" aria-hidden="true" />
        <div>
          <b>Grounded in the {s.handbook} · machine-checked citations</b>
          <p>
            Every lesson slide, flashcard, and quiz explanation cites its chapter and page in the official manual. Machine-checked; independent review is ongoing.
            {s.code === "ID" ? " Some handbook topics still have source clarifications in progress." : ""}
          </p>
        </div>
      </div>

      <div className="curriculum-layout">
        <section id="curriculum">
          <span className="eyebrow">COMPLETE HANDBOOK SYLLABUS</span>
          <h2 className="section-title">Every chapter, in handbook order.</h2>
          <p className="muted">
            {s.video
              ? "Each module runs the same 4-step loop: 1080p video → page-flip reading → 4-beat recall cards → explained quiz."
              : "Each module runs the same focused loop: page-flip reading → 4-beat recall cards → explained quiz."}
          </p>
          <StateChapterRoadmap
            code={s.code}
            stateName={s.name}
            roadSigns={s.roadSigns}
            signsPath={s.signsPath}
            chapters={s.chapters}
            freeChapterId={s.freeChapter.id}
            firstLessonPath={s.firstLessonPath}
            firstReadPath={s.firstReadPath}
            firstCardsPath={s.firstCardsPath}
            firstQuizPath={s.firstQuizPath}
            hasVideo={!!s.video}
          />
        </section>

        <aside>
          <StateUnlockCard
            code={s.code}
            name={s.name}
            appPath={s.appPath}
            freeChapterPath={s.freeChapterPath}
            firstLessonPath={s.video ? s.firstLessonPath : s.firstReadPath}
            checkoutHref={buyHref(s.code)}
            priceLabel={PRICE_LABEL}
            refundDays={REFUND_WINDOW_DAYS}
            chaptersBuilt={s.counts.chapters_built}
            flashcards={s.counts.flashcards}
            quizItems={s.counts.quiz_items}
            hasAudio={s.hasAudio}
            audioClips={s.audioClips}
            videoUnits={s.video?.units ?? null}
            mappedVisualCards={s.mappedVisualCards}
            localMode={local}
          />
          <p className="source-note">
            Source: {s.handbook}
            {s.edition ? ` · ${s.edition === "(verify)" ? "Edition under review" : s.edition}` : ""}. Every card and question links back to its handbook section.
          </p>
        </aside>
      </div>

      <section className="course-note">
        <h2>Good to know before you start.</h2>
        <p>
          PassLearnersPermit provides independent written-test preparation and is not affiliated with the State of {s.name} or its licensing agency. Always treat the official {s.handbook} as the legal authority. Practice scores measure your study session here and do not guarantee an official exam result. Questions or feedback? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </p>
      </section>
    </div>
  );
}
