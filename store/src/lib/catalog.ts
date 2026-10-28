// The state catalog for landing pages, sitemap and checkout. Source of truth is
// app-preview/data/states.json + the accepted exports, condensed by
// tools/preview/sync-store.mjs into src/generated/catalog.json (re-run `npm run sync`).
import CATALOG from "@/generated/catalog.json";
import { editionNote } from "./editions";

// USPS code -> state name. The registry's `name` is used for the learner shell; landing pages
// use this table so a registry typo (e.g. a bare code) never reaches a page title.
const US: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado",
  CT: "Connecticut", DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland", MA: "Massachusetts",
  MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export interface Chapter { id: string; n: number; title: string; built: boolean }
export interface StateEntry {
  code: string; name: string; slug: string; handbook: string; edition: string; test: string;
  chapters: Chapter[]; freeChapter: { id: string; n: number; title: string };
  counts: { chapters_built: number; chapters_total: number; flashcards: number; flashcards_held_back: number; quiz_items: number; lessons: number; module_quizzes: number; practice_forms: number };
  hasAudio: boolean; appPath: string; freeChapterPath: string;
}

type Raw = (typeof CATALOG)["states"][number];
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const STATES: StateEntry[] = (CATALOG.states as Raw[]).map((s) => {
  const name = US[s.code] || s.registry_name;
  const xx = s.code.toLowerCase();
  return {
    code: s.code, name, slug: slugify(name), handbook: s.handbook, edition: editionNote(s.code, s.handbook),
    test: s.test, chapters: s.chapters as Chapter[], freeChapter: s.free_chapter,
    counts: s.counts as StateEntry["counts"], hasAudio: !!s.audio,
    appPath: `/app/#/${xx}/`, freeChapterPath: `/app/#/${xx}/chapter/${encodeURIComponent(s.free_chapter.id)}`,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

export const stateBySlug = (slug: string) => STATES.find((s) => s.slug === slug) || null;
export const stateByCode = (code: string) => STATES.find((s) => s.code === String(code || "").toUpperCase()) || null;
export const isStateCode = (code: unknown): code is string => typeof code === "string" && !!stateByCode(code);
