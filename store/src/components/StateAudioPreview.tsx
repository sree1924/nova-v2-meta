"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AudioSamples } from "@/lib/catalog";

interface Track {
  id: string;
  title: string;
  subtitle: string;
  src: string;
}

function fmtTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function StateAudioPreview({
  stateName,
  audioClips,
  samples,
  freeChapterPath,
}: {
  stateName: string;
  audioClips: number | null;
  samples: AudioSamples;
  freeChapterPath: string;
}) {
  const tracks = useMemo<Track[]>(() => {
    const out: Track[] = [];
    if (samples.slide) {
      out.push({
        id: "slide",
        title: "Guided Lesson Slide",
        subtitle: "Chapter 1 teacher walkthrough",
        src: samples.slide,
      });
    }
    if (samples.cardQ) {
      out.push({
        id: "cardQ",
        title: "Flashcard Recall Prompt",
        subtitle: "Spoken question before silent pause",
        src: samples.cardQ,
      });
    }
    if (samples.cardA) {
      out.push({
        id: "cardA",
        title: "Flashcard Answer Reveal",
        subtitle: "Spoken handbook answer check",
        src: samples.cardA,
      });
    }
    return out;
  }, [samples.slide, samples.cardQ, samples.cardA]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const autoplayNextRef = useRef(false);

  const activeTrack = tracks[activeIdx] || tracks[0];

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !activeTrack) return;
    setCurrentTime(0);
    setDuration(0);
    el.load();
    if (autoplayNextRef.current) {
      autoplayNextRef.current = false;
      el.play().catch(() => setPlaying(false));
    }
  }, [activeTrack]);

  if (!tracks.length) return null;

  function togglePlay() {
    const el = audioRef.current;
    if (!el) return;
    if (!el.paused) {
      el.pause();
    } else {
      el.play().catch(() => setPlaying(false));
    }
  }

  function selectTrack(idx: number) {
    if (idx === activeIdx) {
      togglePlay();
      return;
    }
    autoplayNextRef.current = true;
    setActiveIdx(idx);
  }

  const pct = duration > 0 ? Math.min(100, Math.round((currentTime / duration) * 100)) : 0;

  return (
    <section className="audio-preview-card" aria-label={`${stateName} audio sample`}>
      <div className="audio-preview-copy">
        <span className="eyebrow">PRE-RECORDED TEACHER NARRATION</span>
        <h2>Hear how {stateName} sounds.</h2>
        <p className="muted">
          {audioClips ? `${audioClips.toLocaleString("en-US")} studio-minted audio clips` : "Full audio narration"} across lessons, 4-step active-recall flashcards (question → silent think pause → answer → why it matters), and module recaps. No robotic browser TTS.
        </p>
        <a className="audio-free-cta" href={freeChapterPath}>
          Open narrated Chapter 1 ({samples.freeClips > 0 ? `${samples.freeClips} free clips` : "free"}) →
        </a>
      </div>

      <div className="audio-player-panel">
        <div className="audio-track-tabs" role="tablist" aria-label="Sample audio clips">
          {tracks.map((t, idx) => {
            const isSel = idx === activeIdx;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isSel}
                data-audio-sample-tab={t.id}
                className={`audio-track-tab${isSel ? " is-active" : ""}`}
                onClick={() => selectTrack(idx)}
              >
                <strong>{t.title}</strong>
                <span>{t.subtitle}</span>
              </button>
            );
          })}
        </div>

        <div className="audio-transport">
          <button
            type="button"
            className={`audio-play-btn${playing ? " is-playing" : ""}`}
            data-audio-sample-play
            onClick={togglePlay}
            aria-label={playing ? `Pause ${activeTrack.title}` : `Play ${activeTrack.title}`}
          >
            {playing ? "⏸ Pause sample" : "▶ Play sample"}
          </button>

          <div className="audio-progress-wrap">
            <div className="audio-progress-meta">
              <strong>{activeTrack.title}</strong>
              <span className="audio-time">
                {fmtTime(currentTime)} / {duration > 0 ? fmtTime(duration) : "--:--"}
              </span>
            </div>
            <div className="audio-progress-rail" aria-hidden="true">
              <div className="audio-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        <audio
          ref={audioRef}
          src={activeTrack.src}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
          }}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime || 0)}
        />
      </div>
    </section>
  );
}
