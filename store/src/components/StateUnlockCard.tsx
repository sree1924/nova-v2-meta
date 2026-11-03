"use client";
import { useEffect, useState } from "react";
import type { Chapter } from "@/lib/catalog";

interface UnlockProps {
  code: string;
  name: string;
  appPath: string;
  freeChapterPath: string;
  firstLessonPath: string;
  checkoutHref: string;
  priceLabel: string;
  refundDays: number;
  chaptersBuilt: number;
  flashcards: number;
  quizItems: number;
  hasAudio: boolean;
  audioClips: number | null;
  videoUnits?: number | null;
  mappedVisualCards: number;
  localMode: boolean;
}

export function StateUnlockCard(p: UnlockProps) {
  const [entitledUntil, setEntitledUntil] = useState<string | null>(null);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!active || !m) return;
        setSignedIn(!!m.signedIn);
        const iso = m.entitlements && m.entitlements[p.code];
        const ts = iso ? Date.parse(iso) : NaN;
        if (Number.isFinite(ts) && ts > Date.now()) setEntitledUntil(iso);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [p.code]);

  if (entitledUntil) {
    const formattedDate = new Date(entitledUntil).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return (
      <div className="unlock-card is-unlocked" data-unlocked-state={p.code}>
        <span className="unlocked-badge">✓ Full Course Unlocked</span>
        <h2>Your {p.name} pass is active</h2>
        <p className="unlocked-until">
          All {p.chaptersBuilt} chapters,{" "}
          {p.videoUnits ? `${p.videoUnits} HD lesson videos, ` : ""}
          {p.flashcards.toLocaleString("en-US")} flashcards, and practice tests are open through{" "}
          <b>{formattedDate}</b>.
        </p>
        <a className="btn neo-mint-btn full" href={p.appPath}>
          Open {p.name} Dashboard →
        </a>
        <a className="btn secondary full unlock-free-link" href={p.firstLessonPath}>
          Jump into Lesson 1 →
        </a>
        {p.localMode && (
          <form action="/api/local/refund" method="post" className="local-refund-form">
            <input type="hidden" name="state" value={p.code} />
            <button type="submit" className="btn secondary full">
              Simulate refund (revoke access)
            </button>
          </form>
        )}
      </div>
    );
  }

  const effectiveHref = signedIn
    ? `/api/checkout?state=${encodeURIComponent(p.code)}`
    : p.checkoutHref;

  return (
    <div className="unlock-card">
      <div className="unlock-card-top">
        <span className="eyebrow">ONE-TIME PASS · NO SUBSCRIPTION</span>
        <span className="pill">{p.refundDays}-day refund</span>
      </div>
      <h2>Unlock all of {p.name}</h2>
      <div className="price">
        {p.priceLabel}
        <small>one state · 12 months access · never auto-renews</small>
      </div>
      <ul className="unlock-features">
        <li>
          ✓ All <b>{p.chaptersBuilt} official chapters</b> (Chapter 1 always free)
        </li>
        {p.videoUnits ? (
          <li>
            ✓ <b>{p.videoUnits} 1080p lesson videos</b> + page-flip reader
          </li>
        ) : null}
        <li>
          ✓ <b>{p.flashcards.toLocaleString("en-US")} recall cards</b> with memory hooks
        </li>
        <li>
          ✓ <b>{p.quizItems.toLocaleString("en-US")} practice questions</b> with instant rationales
        </li>
        {p.hasAudio && (
          <li>
            ✓{" "}
            <b>
              {p.audioClips
                ? `${p.audioClips.toLocaleString("en-US")} studio audio clips`
                : "Studio narration audio"}
            </b>{" "}
            included
          </li>
        )}
        <li>
          ✓{" "}
          <b>
            {p.mappedVisualCards > 0 ? `${p.mappedVisualCards} visual cards` : "Verified visuals"}
          </b>{" "}
          + FHWA MUTCD road signs
        </li>
      </ul>
      <a className="btn neo-mint-btn full" href={effectiveHref}>
        {p.localMode
          ? signedIn
            ? `Unlock ${p.name} (simulated ${p.priceLabel}) →`
            : `Sign in & unlock ${p.name} →`
          : `Unlock ${p.name} — ${p.priceLabel} →`}
      </a>
      <a className="btn secondary full unlock-free-link" href={p.firstLessonPath}>
        Start Chapter 1 Lesson 1 Free →
      </a>
      <p className="micro">
        {p.localMode
          ? "Local store mode: instant test learner sign-in and simulated checkout — $0 charged."
          : `Full refund within ${p.refundDays} days of purchase. Secure one-time checkout.`}
      </p>
    </div>
  );
}

export function StateChapterRoadmap({
  code,
  stateName,
  roadSigns,
  signsPath,
  chapters,
  freeChapterId,
  firstLessonPath,
  firstReadPath,
  firstCardsPath,
  firstQuizPath,
  hasVideo,
}: {
  code: string;
  stateName: string;
  roadSigns: number;
  signsPath: string;
  chapters: Chapter[];
  freeChapterId: string;
  firstLessonPath: string;
  firstReadPath: string;
  firstCardsPath: string;
  firstQuizPath: string;
  hasVideo: boolean;
}) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (!active || !m) return;
        const iso = m.entitlements && m.entitlements[code];
        const ts = iso ? Date.parse(iso) : NaN;
        if (Number.isFinite(ts) && ts > Date.now()) setUnlocked(true);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [code]);

  return (
    <ol className="chapter-roadmap">
      {chapters.map((ch) => {
        const isFree = ch.id === freeChapterId;
        const canOpen = ch.built && (isFree || unlocked);
        const chapterHref = `/app/#/${code.toLowerCase()}/chapter/${encodeURIComponent(ch.id)}`;
        return (
          <li key={ch.id} className={isFree ? "is-free-row" : undefined}>
            <a href={chapterHref} className="chapter-roadmap-main">
              <span className={`chapter-number${canOpen ? " is-open" : ""}`}>
                {String(ch.n).padStart(2, "0")}
              </span>
              <span className="chapter-roadmap-body">
                <b>
                  Chapter {ch.n} — {ch.title}
                </b>
                <small>
                  {isFree
                    ? "100% Free taste tier · Jump straight into Lesson 1 below or open all Chapter 1 modules"
                    : ch.built
                      ? unlocked
                        ? "Unlocked · Video walkthrough, page-flip reading, flashcards & module quiz"
                        : "Video walkthrough · Page-flip reading · Active-recall cards · Module quiz"
                      : "Coming soon"}
                </small>
              </span>
              <span className={isFree || unlocked ? "pill" : "chapter-access-pill"}>
                {isFree ? "★ Free Ch. 1" : unlocked ? "Open →" : "Full Pass →"}
              </span>
            </a>
            {isFree && (
              <div className="roadmap-quick-drills" aria-label="Chapter 1 direct launch">
                {hasVideo && (
                  <a className="neo-mini-drill is-mint" href={firstLessonPath}>
                    ▶ Lesson 1 Video
                  </a>
                )}
                <a className={`neo-mini-drill${!hasVideo ? " is-mint" : ""}`} href={firstReadPath}>
                  📖 Lesson 1 Reading
                </a>
                <a className="neo-mini-drill" href={firstCardsPath}>
                  ⚡ Ch. 1 Flashcards
                </a>
                <a className="neo-mini-drill" href={firstQuizPath}>
                  ✓ Ch. 1 Quiz
                </a>
              </div>
            )}
          </li>
        );
      })}
      <li className="is-free-row">
        <a href={signsPath} className="chapter-roadmap-main">
          <span className="chapter-number is-open" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <polygon
                points="12,21 2,4 22,4"
                fill="#ffffff"
                stroke="#d62828"
                strokeWidth="3"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="chapter-roadmap-body">
            <b>Road signs</b>
            <small>
              100% Free · The {roadSigns} signs the {stateName} handbook expects you to know — colour rules, recall cards &amp; 20-question sign test
            </small>
          </span>
          <span className="pill">★ Free Signs</span>
        </a>
        <div className="roadmap-quick-drills" aria-label="Road signs direct launch">
          <a className="neo-mini-drill is-mint" href={signsPath}>
            🛑 Signs Hub
          </a>
          <a className="neo-mini-drill" href={`${signsPath}/cards`}>
            ⚡ Sign Cards
          </a>
          <a className="neo-mini-drill" href={`${signsPath}/test`}>
            ✓ Sign Test
          </a>
        </div>
      </li>
    </ol>
  );
}
