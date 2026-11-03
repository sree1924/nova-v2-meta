"use client";
import { useMemo, useState } from "react";
import type { StateEntry } from "@/lib/catalog";

export function StateExplorer({ states }: { states: StateEntry[] }) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "video">("all");

  const videoCount = useMemo(
    () => states.filter((s) => !!s.video).length,
    [states]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return states.filter((s) => {
      if (filterMode === "video" && !s.video) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase() === q ||
        s.handbook.toLowerCase().includes(q)
      );
    });
  }, [states, query, filterMode]);

  return (
    <div className="neo-explorer">
      <div className="explorer-controls">
        <div className="explorer-search">
          <label htmlFor="state-search-input" className="sr-only">
            Search your state
          </label>
          <input
            id="state-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your state or 2-letter code (e.g., Texas, TX, California, ND)…"
            autoComplete="off"
          />
        </div>
        <div className="explorer-pills" role="group" aria-label="Filter courses">
          <button
            type="button"
            className={`explorer-pill${filterMode === "all" ? " is-active" : ""}`}
            onClick={() => setFilterMode("all")}
          >
            All 51 Manuals ({states.length})
          </button>
          <button
            type="button"
            className={`explorer-pill${filterMode === "video" ? " is-active" : ""}`}
            onClick={() => setFilterMode("video")}
          >
            🎬 1080p Video Editions ({videoCount})
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card explorer-empty">
          <p>
            No state matched <b>&ldquo;{query}&rdquo;</b>. Try searching by full state name (like{" "}
            <i>North Dakota</i>) or postal code (<i>ND</i>).
          </p>
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              setQuery("");
              setFilterMode("all");
            }}
          >
            Show all 51 courses
          </button>
        </div>
      ) : (
        <ul className="grid state-grid">
          {filtered.map((s) => {
            const hasVideo = !!s.video;
            return (
              <li key={s.code} className="neo-state-card" data-state-card={s.code}>
                <div className="neo-state-top">
                  <a href={`/states/${s.slug}`} className="neo-state-head-link">
                    <span className="state-code">{s.code}</span>
                    <span className="state-name">
                      <span className="state-name-top">
                        <strong>{s.name}</strong>
                        {hasVideo && <em className="spotlight-tag">🎬 {s.video!.units} Videos</em>}
                      </span>
                      <small>
                        {s.counts.chapters_built} ch · {s.counts.flashcards} cards · {s.counts.quiz_items} Qs
                      </small>
                    </span>
                  </a>
                  <a
                    href={`/states/${s.slug}`}
                    className="neo-state-pass-link"
                    aria-label={`${s.name} syllabus and full course pass`}
                  >
                    Syllabus ↗
                  </a>
                </div>

                <div className="neo-state-drills" aria-label={`Jump directly into ${s.name} free Chapter 1`}>
                  <a
                    className="neo-mini-drill is-mint"
                    href={hasVideo ? s.firstLessonPath : s.firstReadPath}
                  >
                    {hasVideo ? "▶ Ch. 1 Video" : "📖 Ch. 1 Read"}
                  </a>
                  {hasVideo && (
                    <a className="neo-mini-drill" href={s.firstReadPath}>
                      📖 Read
                    </a>
                  )}
                  <a className="neo-mini-drill" href={s.firstCardsPath}>
                    ⚡ Cards
                  </a>
                  <a className="neo-mini-drill" href={s.firstQuizPath}>
                    ✓ Quiz
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
