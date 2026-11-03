import type { Metadata } from "next";
import { STATES } from "@/lib/catalog";
import { PRICE_LABEL, REFUND_WINDOW_DAYS } from "@/lib/product";
import { HeroRecallDemo, type HeroStateOption } from "@/components/HeroRecallDemo";
import { StateExplorer } from "@/components/StateExplorer";
import { DynamicLessonLink } from "@/components/DynamicLessonLink";

export const metadata: Metadata = {
  title: { absolute: "PassLearnersPermit — Official State Handbook Permit Prep" },
  description:
    "Pass your state learner's permit test with 1080p lesson videos, page-flip reading, 4-beat active-recall flashcards, official MUTCD road signs, and explained practice quizzes. Chapter 1 free in all 50 states + D.C.",
  alternates: { canonical: "/" },
};

export default function Home() {
  const totalVideos = STATES.reduce((sum, s) => sum + (s.video?.units ?? 0), 0);
  const videoStateCount = STATES.filter((s) => !!s.video).length;
  const totalClips = STATES.reduce((sum, s) => sum + (s.audioClips ?? 0), 0);
  const totalCards = STATES.reduce((sum, s) => sum + s.counts.flashcards, 0);
  const totalQuestions = STATES.reduce((sum, s) => sum + s.counts.quiz_items, 0);

  const heroStates: HeroStateOption[] = STATES.map((s) => ({
    code: s.code,
    name: s.name,
    slug: s.slug,
    freeChapterTitle: s.freeChapter.title,
    chaptersBuilt: s.counts.chapters_built,
    flashcards: s.counts.flashcards,
    quizItems: s.counts.quiz_items,
    audioClips: s.audioClips,
    videoUnits: s.video?.units ?? null,
    sampleVideo: s.video?.sampleVideo ?? null,
    samplePoster: s.video?.samplePoster ?? null,
    sampleSlideAudio: s.audioSamples?.slide ?? null,
    sampleCard: s.sampleCard,
    sampleSigns: s.sampleSigns,
    sampleQuiz: s.sampleQuiz,
    freeChapterPath: s.freeChapterPath,
    firstModulePath: s.firstModulePath,
    firstLessonPath: s.firstLessonPath,
    firstReadPath: s.firstReadPath,
    firstCardsPath: s.firstCardsPath,
    firstQuizPath: s.firstQuizPath,
  }));

  return (
    <>
      <HeroRecallDemo states={heroStates} defaultCode="ND" priceLabel={PRICE_LABEL} />

      <section className="neo-stat-belt" aria-label="Nationwide dataset highlights">
        <div className="neo-stat-pill">
          <strong>{totalVideos.toLocaleString("en-US")}+</strong>
          <span>1080p Videos ({videoStateCount} states)</span>
        </div>
        <div className="neo-stat-pill">
          <strong>{totalCards.toLocaleString("en-US")}</strong>
          <span>Active-Recall Cards</span>
        </div>
        <div className="neo-stat-pill">
          <strong>723</strong>
          <span>Driving Scenes + MUTCD Signs</span>
        </div>
        <div className="neo-stat-pill">
          <strong>{totalClips.toLocaleString("en-US")}</strong>
          <span>Studio Audio Clips</span>
        </div>
        <div className="neo-stat-pill is-gold">
          <strong>{PRICE_LABEL}</strong>
          <span>1-Year Pass · No Subscription</span>
        </div>
      </section>

      <section className="section-block" id="how-it-works">
        <div className="section-heading">
          <div>
            <span className="eyebrow">BUILT FOR SHORT SESSIONS &amp; REAL RETENTION</span>
            <h2 className="section-title">Four fast steps per module.</h2>
          </div>
          <span className="neo-loop-chip">1 · Video → 2 · Read → 3 · Cards → 4 · Quiz</span>
        </div>

        <div className="steps-grid steps-grid-four">
          <article className="step-feature-card" data-step-theme="indigo">
            <div className="step-card-head">
              <span className="step-num">STEP 01 · WATCH</span>
              <span className="step-emoji" aria-hidden="true">🎬</span>
            </div>
            <h3>1080p Visual Walkthroughs</h3>
            <p>
              Watch custom-rendered lesson videos that break down traffic rules, right-of-way traps, and handbook numbers with chapter segment jumpers.
            </p>
          </article>

          <article className="step-feature-card" data-step-theme="royal">
            <div className="step-card-head">
              <span className="step-num">STEP 02 · FLIP</span>
              <span className="step-emoji" aria-hidden="true">📖</span>
            </div>
            <h3>Page-Flip Concept Reader</h3>
            <p>
              Swipe one bite-sized concept per page with verified driving scenes, worked examples, myth-vs-truth boxes, and optional page audio.
            </p>
          </article>

          <article className="step-feature-card" data-step-theme="violet">
            <div className="step-card-head">
              <span className="step-num">STEP 03 · RECALL</span>
              <span className="step-emoji" aria-hidden="true">⚡</span>
            </div>
            <h3>4-Beat Memory-Hook Decks</h3>
            <p>
              Hear the prompt, think during a 3-second silent beat, then flip for the exact handbook rule, key pills, official sign, and memory hook.
            </p>
          </article>

          <article className="step-feature-card" data-step-theme="teal">
            <div className="step-card-head">
              <span className="step-num">STEP 04 · PROVE IT</span>
              <span className="step-emoji" aria-hidden="true">✓</span>
            </div>
            <h3>Explained Practice Quizzes</h3>
            <p>
              Drill {totalQuestions.toLocaleString("en-US")}+ handbook-cited questions nationwide where every right and wrong choice explains the exact rule.
            </p>
          </article>
        </div>
      </section>

      <section className="section-block" id="states">
        <div className="section-heading">
          <div>
            <span className="eyebrow">ALL 50 STATES + WASHINGTON, D.C.</span>
            <h2 className="section-title">Pick your state &amp; jump straight in.</h2>
          </div>
          <span className="muted">
            Click <b>Ch. 1 Video</b>, <b>Read</b>, <b>Cards</b>, or <b>Quiz</b> on any card to start immediately — zero sign-up
          </span>
        </div>
        <StateExplorer states={STATES} />
      </section>

      <section className="price-section neo-price-quest">
        <div className="neo-price-copy">
          <span className="neo-sticker">★ TRY FREE FIRST · ZERO SUBSCRIPTION TRAPS</span>
          <h2 className="section-title">
            One state. One year.
            <br />
            One flat {PRICE_LABEL}.
          </h2>
          <p>
            Every state&apos;s entire Chapter 1 — 1080p lesson videos, page-flip reading, active-recall flashcards, studio audio, and quiz — is open right now with no account. Ready for Chapters 2 and up? Unlock your state for 12 full months with a single payment.
          </p>
          <div className="tier-compare">
            <div className="tier-pill-box">
              <span className="tier-kicker">FREE TASTE TIER</span>
              <strong>$0 · Instant Start</strong>
              <span>Full Chapter 1 video, reader, cards, audio &amp; quiz — no account needed</span>
            </div>
            <div className="tier-pill-box is-paid">
              <span className="tier-kicker">FULL STATE PASS</span>
              <strong>{PRICE_LABEL} · 12 Months</strong>
              <span>Every chapter + full practice test bank · One-time checkout, never auto-renews</span>
            </div>
          </div>
        </div>

        <div className="price-box neo-price-card">
          <div className="neo-price-top">
            <span className="neo-badge-navy">ALL-ACCESS STATE PASS</span>
            <span className="neo-refund-chip">{REFUND_WINDOW_DAYS}-day refund</span>
          </div>
          <span className="price">{PRICE_LABEL}</span>
          <span className="neo-price-sub">one state · full year · zero recurring charges</span>
          <a className="btn neo-mint-btn full" href="#states">
            Choose your state manual ↑
          </a>
          <DynamicLessonLink
            states={STATES.map((s) => ({
              code: s.code,
              name: s.name,
              slug: s.slug,
              href: s.video ? s.firstLessonPath : s.firstReadPath,
            }))}
            variant="pricing"
            defaultCode="ND"
          />
          <small>Full {REFUND_WINDOW_DAYS}-day refund by email — no hoops, no fine-print traps.</small>
        </div>
      </section>

      <section className="course-note">
        <h2>Official handbook sourcing &amp; honest expectations.</h2>
        <p>
          Every course is built directly from its official state driver manual and machine-checked against chapter and page citations; independent review is ongoing. Pre-recorded studio narration ({totalClips.toLocaleString("en-US")} clips across all 51 jurisdictions, zero robotic browser TTS), {totalVideos.toLocaleString("en-US")}+ 1080p lesson videos across {videoStateCount} jurisdictions, and 723 verified driving visuals + public-domain FHWA MUTCD sign diagrams power the study loop. Practice scores describe your study session here and do not predict an official DMV exam result. PassLearnersPermit is independent of all state licensing agencies.
        </p>
      </section>
    </>
  );
}
