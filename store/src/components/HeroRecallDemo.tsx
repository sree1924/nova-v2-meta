"use client";
import { useMemo, useRef, useState } from "react";

export interface HeroStateOption {
  code: string;
  name: string;
  slug: string;
  freeChapterTitle: string;
  chaptersBuilt: number;
  flashcards: number;
  quizItems: number;
  audioClips: number | null;
  videoUnits: number | null;
  sampleVideo: string | null;
  samplePoster: string | null;
  sampleSlideAudio: string | null;
  sampleCard: {
    front: string;
    answer: string;
    hook: string;
    kicker: string;
    pills: string[];
    audioQ: string | null;
  } | null;
  sampleSigns: {
    id: string;
    name: string;
    category: string;
    src: string;
  }[];
  sampleQuiz: {
    stem: string;
    correctKey: string;
    rationale: string;
    options: { key: string; text: string }[];
  } | null;
  freeChapterPath: string;
  firstModulePath: string;
  firstLessonPath: string;
  firstReadPath: string;
  firstCardsPath: string;
  firstQuizPath: string;
}

interface Props {
  states: HeroStateOption[];
  defaultCode?: string;
  priceLabel: string;
}

const CLOZE_RULE_STEM_RE = /^Which wording completes the cited handbook rule:\s*["“]([\s\S]+)["”]\??$/;

function renderStemParts(text: string) {
  const parts = text.split(/(?:\bblank\b|_{3,})/);
  if (parts.length === 1) return text;
  return parts.map((part, idx) => (
    <span key={idx}>
      {part}
      {idx < parts.length - 1 && (
        <span className="blank-slot" aria-label="blank">
          ______
        </span>
      )}
    </span>
  ));
}

const FALLBACK_SAMPLE_QUIZ = {
  stem: "At an octagonal red STOP sign, where does the handbook require you to bring your vehicle to a full stop?",
  correctKey: "B",
  rationale:
    "Rolling stops fail road tests. Stop completely before the stop line or crosswalk before edging forward to check cross traffic.",
  options: [
    { key: "A", text: "Slow down to 5 mph and roll through if the cross street looks clear." },
    { key: "B", text: "Come to a complete stop before the stop line, crosswalk, or intersection." },
    { key: "C", text: "Tap your horn and yield only to vehicles on your right." },
    { key: "D", text: "Stop past the crosswalk so you can see around parked cars first." },
  ],
};

export function HeroRecallDemo({ states, defaultCode = "ND", priceLabel }: Props) {
  const [selectedCode, setSelectedCode] = useState(defaultCode);
  const [mode, setMode] = useState<"card" | "video" | "visual" | "quiz">("card");
  const [flipped, setFlipped] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const st = useMemo(
    () => states.find((x) => x.code === selectedCode) || states[0],
    [states, selectedCode]
  );

  function stopMedia() {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setPlayingAudio(false);
  }

  function onSelectState(nextCode: string) {
    stopMedia();
    setSelectedCode(nextCode);
    setFlipped(false);
    setPicked(null);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("plp:hero-state", { detail: { code: nextCode } }));
    }
    const nextSt = states.find((x) => x.code === nextCode);
    if (mode === "video" && !nextSt?.sampleVideo) {
      setMode("card");
    }
  }

  function switchTab(next: "card" | "video" | "visual" | "quiz") {
    stopMedia();
    setMode(next);
  }

  function toggleCardAudio() {
    const src = st.sampleCard?.audioQ || st.sampleSlideAudio;
    const el = audioRef.current;
    if (!src || !el) return;
    if (playingAudio && !el.paused) {
      el.pause();
      setPlayingAudio(false);
      return;
    }
    if (el.getAttribute("data-src") !== src) {
      el.setAttribute("data-src", src);
      el.src = src;
      el.load();
    }
    setPlayingAudio(true);
    el.play().catch(() => setPlayingAudio(false));
  }

  const cardPrompt =
    st.sampleCard?.front ||
    "At a road-test vehicle inspection, from what minimum distance must your horn be audible?";
  const cardAnswer =
    st.sampleCard?.answer ||
    "Your vehicle must have a working horn audible from at least 200 feet.";
  const cardHook =
    st.sampleCard?.hook || "Two football red zones = 200-foot horn check";
  const cardKicker = st.sampleCard?.kicker || "CHAPTER 1 · KEY RULE";
  const cardPills = st.sampleCard?.pills?.length
    ? st.sampleCard.pills
    : ["OFFICIAL HANDBOOK", "ACTIVE RECALL", "CITED RULE"];
  const activeQuiz = st.sampleQuiz || FALLBACK_SAMPLE_QUIZ;
  const clozeMatch = activeQuiz.stem.match(CLOZE_RULE_STEM_RE);
  const quizIsCloze = Boolean(clozeMatch);
  const quizBody = clozeMatch ? clozeMatch[1] : activeQuiz.stem;
  const isRight = picked === activeQuiz.correctKey;
  const heroSign = st.sampleSigns?.[0] || {
    id: "sign-stop",
    name: "STOP",
    category: "regulatory",
    src: "/app/signs/sign-stop.png",
  };

  return (
    <section className="hero neo-hero">
      <div className="hero-copy">
        <div className="neo-sticker-row">
          <span className="neo-sticker">★ ALL 50 STATES + D.C. · CHAPTER 1 FREE</span>
          <span className="neo-live-chip">NEW · 1080p VIDEOS + GEN-Z DECKS</span>
        </div>

        <h1>
          Crush your permit test.
          <br />
          <span className="neo-highlight">Skip the 100-page PDF.</span>
        </h1>

        <p className="lead">
          Your state&apos;s official driver manual, remixed into{" "}
          <b>1080p visual walkthroughs</b>, <b>page-flip concept cards</b>,{" "}
          <b>4-beat active recall</b>, and <b>explained DMV-style quizzes</b> — every single fact cited to the handbook page.
        </p>

        <div className="hero-launch-box" aria-label="Jump straight into your state">
          <div className="hero-launch-head">
            <label htmlFor="hero-state-select" className="hero-launch-label">
              1 · PICK YOUR STATE MANUAL
            </label>
            <span className="hero-launch-free-tag">No sign-up for Chapter 1</span>
          </div>

          <div className="hero-select-row">
            <div className="hero-select-wrap">
              <span className="hero-select-code" aria-hidden="true">
                {st.code}
              </span>
              <select
                id="hero-state-select"
                value={st.code}
                onChange={(e) => onSelectState(e.target.value)}
                aria-label="Choose your state handbook"
              >
                {states.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.code}) — {item.chaptersBuilt} ch ·{" "}
                    {item.videoUnits ? `${item.videoUnits} videos · ` : ""}
                    {item.flashcards} cards
                  </option>
                ))}
              </select>
            </div>
            <a className="btn secondary hero-syllabus-btn" href={`/states/${st.slug}`}>
              {st.code} Syllabus ↗
            </a>
          </div>

          <div className="hero-drill-label">
            2 · DRILL STRAIGHT INTO {st.name.toUpperCase()} CHAPTER 1 ({st.freeChapterTitle.toUpperCase()})
          </div>
          <div className="hero-drill-grid">
            {st.videoUnits ? (
              <a className="neo-drill-btn is-primary" href={st.firstLessonPath}>
                <span className="drill-icon" aria-hidden="true">▶</span>
                <span>
                  <strong>Watch Video 1</strong>
                  <small>{st.videoUnits} HD lessons</small>
                </span>
              </a>
            ) : (
              <a className="neo-drill-btn is-primary" href={st.firstReadPath}>
                <span className="drill-icon" aria-hidden="true">📖</span>
                <span>
                  <strong>Start Lesson 1</strong>
                  <small>Page-flip reader</small>
                </span>
              </a>
            )}
            <a className="neo-drill-btn" href={st.firstReadPath}>
              <span className="drill-icon" aria-hidden="true">📖</span>
              <span>
                <strong>Flip Reading</strong>
                <small>Visual pages</small>
              </span>
            </a>
            <a className="neo-drill-btn" href={st.firstCardsPath}>
              <span className="drill-icon" aria-hidden="true">⚡</span>
              <span>
                <strong>Gen-Z Cards</strong>
                <small>{st.flashcards} in course</small>
              </span>
            </a>
            <a className="neo-drill-btn" href={st.firstQuizPath}>
              <span className="drill-icon" aria-hidden="true">✓</span>
              <span>
                <strong>Take Quiz 1</strong>
                <small>Instant why</small>
              </span>
            </a>
          </div>
        </div>

        <p className="micro">
          Chapter 1 is 100% free in all 51 jurisdictions · Full 1-year state pass is a one-time {priceLabel} (never a subscription).
        </p>
      </div>

      <div className="neo-deck-preview" data-preview-state={st.code}>
        <div className="neo-deck-hud">
          <div className="neo-hud-badges">
            <span className="neo-badge-gold">{st.code} · {st.name.toUpperCase()}</span>
            <span className="neo-badge-navy">CH. 01 LIVE TASTE</span>
          </div>
          <span className="neo-hud-xp">
            ⚡ {st.videoUnits ? `${st.videoUnits} VIDEOS · ` : ""}{st.flashcards} CARDS
          </span>
        </div>

        <div className="neo-mode-tabs" role="tablist" aria-label="Try the 4-step study loop">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "card"}
            className={`neo-mode-tab${mode === "card" ? " is-active" : ""}`}
            onClick={() => switchTab("card")}
          >
            <span>⚡</span> Recall Card
          </button>
          {st.sampleVideo && (
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              className={`neo-mode-tab${mode === "video" ? " is-active" : ""}`}
              onClick={() => switchTab("video")}
            >
              <span>🎬</span> HD Video
            </button>
          )}
          <button
            type="button"
            role="tab"
            aria-selected={mode === "visual"}
            className={`neo-mode-tab${mode === "visual" ? " is-active" : ""}`}
            onClick={() => switchTab("visual")}
          >
            <span>🛑</span> Signs &amp; Scenes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "quiz"}
            className={`neo-mode-tab${mode === "quiz" ? " is-active" : ""}`}
            onClick={() => switchTab("quiz")}
          >
            <span>✓</span> Test Item
          </button>
        </div>

        {mode === "card" && (
          <div className="neo-cream-stage">
            <div className="neo-ribbon-bar">
              <span>⚡ {cardKicker}</span>
              <span className="neo-ribbon-pill">4-BEAT RECALL</span>
            </div>
            <div className="neo-stage-body">
              <div className="neo-pill-row">
                {cardPills.map((p) => (
                  <span key={p} className="neo-key-pill">
                    {p}
                  </span>
                ))}
              </div>
              <p className="neo-card-prompt">{cardPrompt}</p>

              <div className="neo-card-controls">
                {(st.sampleCard?.audioQ || st.sampleSlideAudio) && (
                  <button
                    type="button"
                    className={`neo-audio-chip${playingAudio ? " is-playing" : ""}`}
                    onClick={toggleCardAudio}
                  >
                    {playingAudio ? "⏸ Pause studio voice" : "▶ Hear card prompt"}
                  </button>
                )}
              </div>

              {!flipped ? (
                <button
                  type="button"
                  className="btn neo-mint-btn full"
                  onClick={() => setFlipped(true)}
                >
                  Lock answer in your head · Flip card →
                </button>
              ) : (
                <div className="neo-reveal-stack">
                  <div className="neo-answer-box">
                    <span className="neo-answer-tag">✓ OFFICIAL HANDBOOK RULE</span>
                    <p>{cardAnswer}</p>
                  </div>
                  {cardHook && (
                    <div className="neo-hook-box">
                      <span className="neo-hook-tag">★ MEMORY HOOK</span>
                      <strong>{cardHook}</strong>
                    </div>
                  )}
                  <button
                    type="button"
                    className="neo-flip-back"
                    onClick={() => setFlipped(false)}
                  >
                    ↺ Flip back to question
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {mode === "video" && st.sampleVideo && (
          <div className="neo-cream-stage">
            <div className="neo-ribbon-bar">
              <span>🎬 CHAPTER 1 · LESSON 01 WALKTHROUGH</span>
              <span className="neo-ribbon-pill">1080p HD</span>
            </div>
            <div className="neo-stage-body is-compact">
              <div className="neo-video-player-wrap">
                <video
                  ref={videoRef}
                  controls
                  playsInline
                  preload="metadata"
                  poster={st.samplePoster ?? undefined}
                  src={st.sampleVideo}
                />
              </div>
              <div className="neo-video-meta-row">
                <span>
                  <b>{st.name}</b> · {st.freeChapterTitle}
                </span>
                <a href={st.firstLessonPath}>Open full video theater →</a>
              </div>
            </div>
          </div>
        )}

        {mode === "visual" && (
          <div className="neo-cream-stage">
            <div className="neo-ribbon-bar">
              <span>🛑 OFFICIAL MUTCD + 723 DRIVING SCENES</span>
              <span className="neo-ribbon-pill">VERIFIED VISUALS</span>
            </div>
            <div className="neo-stage-body">
              <div className="neo-visual-showcase-grid">
                <figure className="neo-visual-tile">
                  <div className="neo-visual-img-box">
                    <img
                      src="/app/visuals/drv-02-knowledge-test-kiosk.webp"
                      alt="Permit knowledge test station with phone stored in locker"
                    />
                  </div>
                  <figcaption>
                    <span className="neo-vis-badge">DRIVING SCENE</span>
                    <strong>Testing Kiosk &amp; Phone Rule</strong>
                  </figcaption>
                </figure>
                <figure className="neo-visual-tile">
                  <div className="neo-visual-img-box is-sign">
                    <img
                      src={heroSign.src}
                      alt={`${heroSign.name} road sign`}
                    />
                  </div>
                  <figcaption>
                    <span className="neo-vis-badge is-mutcd">{st.code} HANDBOOK SIGN</span>
                    <strong>{heroSign.name}</strong>
                  </figcaption>
                </figure>
              </div>
              <p className="neo-visual-caption">
                Every state pairs official U.S. Federal Highway Administration sign diagrams with custom road-rule illustrations inside Reading, Cards, and Quizzes.
              </p>
            </div>
          </div>
        )}

        {mode === "quiz" && (
          <div className="neo-cream-stage">
            <div className="neo-ribbon-bar">
              <span>✓ EXPLAINED PRACTICE QUESTION</span>
              <span className="neo-ribbon-pill">INSTANT RATIONALE</span>
            </div>
            <div className="neo-stage-body">
              {quizIsCloze && (
                <span className="neo-cloze-eyebrow">Complete the rule</span>
              )}
              <p className="neo-quiz-stem">
                {renderStemParts(quizBody)}
              </p>
              <div className="hero-sample-choices" role="group" aria-label="Sample permit question">
                {activeQuiz.options.map((o) => {
                  const active = picked === o.key;
                  const stateClass = picked
                    ? o.key === activeQuiz.correctKey
                      ? " is-correct"
                      : active
                        ? " is-wrong"
                        : " is-dim"
                    : "";
                  return (
                    <button
                      key={o.key}
                      type="button"
                      className={`hero-choice-btn${active ? " is-selected" : ""}${stateClass}`}
                      onClick={() => setPicked(o.key)}
                    >
                      <span className="hero-choice-key">{o.key}</span>
                      <span>{o.text}</span>
                    </button>
                  );
                })}
              </div>
              {picked && (
                <div className={`hero-sample-feedback ${isRight ? "is-good" : "is-review"}`}>
                  <b>
                    {isRight
                      ? `✓ Correct — option ${activeQuiz.correctKey}.`
                      : `✗ Answer ${activeQuiz.correctKey} matches the handbook.`}
                  </b>{" "}
                  {activeQuiz.rationale}
                </div>
              )}
            </div>
          </div>
        )}

        <audio
          ref={audioRef}
          preload="none"
          onEnded={() => setPlayingAudio(false)}
        />

        <div className="neo-deck-footer">
          <a className="btn neo-mint-btn full" href={st.firstModulePath}>
            Open {st.name} Chapter 1 Hub (Free) →
          </a>
          <div className="neo-deck-sublinks">
            <a href={st.freeChapterPath}>All Ch. 1 modules</a>
            <span aria-hidden="true">·</span>
            <a href={`/states/${st.slug}`}>Unlock all {st.chaptersBuilt} chapters ({priceLabel})</a>
          </div>
        </div>
      </div>
    </section>
  );
}
