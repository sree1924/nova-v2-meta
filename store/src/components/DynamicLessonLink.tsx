"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export interface StateLessonRoute {
  code: string;
  name: string;
  slug: string;
  href: string;
}

interface Props {
  states: StateLessonRoute[];
  variant: "header" | "pricing";
  defaultCode?: string;
}

export function DynamicLessonLink({ states, variant, defaultCode = "ND" }: Props) {
  const pathname = usePathname();
  const [heroCode, setHeroCode] = useState(defaultCode);

  useEffect(() => {
    if (pathname !== "/") return;
    const syncFromSelect = () => {
      const sel = document.getElementById("hero-state-select") as HTMLSelectElement | null;
      if (sel && sel.value) {
        setHeroCode(sel.value);
      }
    };
    syncFromSelect();

    const onHeroState = (ev: Event) => {
      const detail = (ev as CustomEvent<{ code?: string }>).detail;
      if (detail?.code) setHeroCode(detail.code);
    };
    window.addEventListener("plp:hero-state", onHeroState);
    const sel = document.getElementById("hero-state-select");
    if (sel) sel.addEventListener("change", syncFromSelect);
    return () => {
      window.removeEventListener("plp:hero-state", onHeroState);
      if (sel) sel.removeEventListener("change", syncFromSelect);
    };
  }, [pathname]);

  let activeState: StateLessonRoute | undefined;
  let resolvedHref = "/app/#/";

  if (pathname === "/") {
    activeState = states.find((s) => s.code === heroCode) || states[0];
    resolvedHref = activeState ? activeState.href : "/app/#/";
  } else if (pathname?.startsWith("/states/")) {
    const slug = pathname.slice("/states/".length).split("/")[0];
    activeState = states.find((s) => s.slug === slug);
    resolvedHref = activeState ? activeState.href : "/app/#/";
  }

  if (variant === "pricing") {
    const labelName = activeState ? activeState.name : "Your State";
    return (
      <a className="btn secondary full" href={resolvedHref} data-dynamic-lesson-link="pricing">
        Try {labelName} Lesson 1 Free →
      </a>
    );
  }

  return (
    <a href={resolvedHref} data-dynamic-lesson-link="header">
      Free Ch. 1 Video
    </a>
  );
}
