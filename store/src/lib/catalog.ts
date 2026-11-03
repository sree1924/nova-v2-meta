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
export interface AudioSamples {
  slide: string | null;
  cardQ: string | null;
  cardA: string | null;
  freeClips: number;
}
export interface VideoInfo {
  units: number;
  freeUnits: number;
  durationSeconds: number | null;
  sampleVideo: string | null;
  samplePoster: string | null;
}
export interface SampleCardInfo {
  front: string;
  answer: string;
  hook: string;
  kicker: string;
  pills: string[];
  audioQ: string | null;
}
export interface SampleSignInfo {
  id: string;
  name: string;
  category: string;
  src: string;
}
export interface SampleQuizInfo {
  stem: string;
  correctKey: string;
  rationale: string;
  options: { key: string; text: string }[];
}
export interface StateEntry {
  code: string; name: string; slug: string; handbook: string; edition: string; test: string;
  chapters: Chapter[]; freeChapter: { id: string; n: number; title: string };
  firstModuleTitle: string;
  counts: { chapters_built: number; chapters_total: number; flashcards: number; flashcards_held_back: number; quiz_items: number; lessons: number; module_quizzes: number; practice_forms: number; road_signs?: number };
  roadSigns: number;
  mappedVisualCards: number;
  hasGenZDeck: boolean;
  sampleCard: SampleCardInfo | null;
  sampleSigns: SampleSignInfo[];
  sampleQuiz: SampleQuizInfo | null;
  hasAudio: boolean; audioClips: number | null; audioSamples: AudioSamples | null;
  video: VideoInfo | null;
  appPath: string;
  signsPath: string;
  freeChapterPath: string;
  firstModulePath: string;
  firstLessonPath: string;
  firstReadPath: string;
  firstCardsPath: string;
  firstQuizPath: string;
  practicePath: string;
}

type Raw = (typeof CATALOG)["states"][number] & {
  entry?: { first_module_id?: string | null; first_unit_id?: string | null; first_title?: string | null } | null;
  counts: { road_signs?: number };
  visuals?: { mapped_cards?: number; has_genz_deck?: boolean } | null;
  sample_card?: { front: string; answer: string; hook: string; kicker: string; pills?: string[]; audio_q?: string | null } | null;
  sample_signs?: { id: string; name: string; category: string; file: string }[] | null;
  sample_quiz?: { stem: string; correct_key: string; rationale?: string; options: { key: string; text: string }[] } | null;
  video?: { units: number; free_units?: number; duration_seconds?: number | null; sample_video?: string | null; sample_poster?: string | null } | null;
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const STATES: StateEntry[] = (CATALOG.states as Raw[]).map((s) => {
  const name = US[s.code] || s.registry_name;
  const xx = s.code.toLowerCase();
  const audio = s.audio as { clips: number; free_clips?: number; sample_slide?: string | null; sample_card_q?: string | null; sample_card_a?: string | null } | null;
  const rawVideo = s.video || null;
  const ch1Prefix = s.free_chapter.id.split("-")[0] || "sec01";
  const firstModule = (s.entry && s.entry.first_module_id) || `${ch1Prefix}-m01`;
  const firstUnit = (s.entry && s.entry.first_unit_id) || `${ch1Prefix}-u01`;
  const firstModuleTitle = (s.entry && s.entry.first_title) || s.free_chapter.title;
  const freeChapterPath = `/app/#/${xx}/chapter/${encodeURIComponent(s.free_chapter.id)}`;
  return {
    code: s.code, name, slug: slugify(name), handbook: s.handbook, edition: editionNote(s.code, s.handbook),
    test: s.test, chapters: s.chapters as Chapter[], freeChapter: s.free_chapter,
    firstModuleTitle,
    counts: s.counts as StateEntry["counts"],
    roadSigns: s.counts.road_signs ?? 40,
    mappedVisualCards: s.visuals?.mapped_cards ?? 0,
    hasGenZDeck: Boolean(s.visuals?.has_genz_deck),
    sampleCard: s.sample_card ? {
      front: s.sample_card.front,
      answer: s.sample_card.answer,
      hook: s.sample_card.hook,
      kicker: s.sample_card.kicker,
      pills: s.sample_card.pills ?? [],
      audioQ: s.sample_card.audio_q ? `/app/${s.sample_card.audio_q}` : null,
    } : null,
    sampleSigns: (s.sample_signs || []).map((sg) => ({
      id: sg.id,
      name: sg.name,
      category: sg.category,
      src: `/app/${sg.file}`,
    })),
    sampleQuiz: s.sample_quiz ? {
      stem: s.sample_quiz.stem,
      correctKey: s.sample_quiz.correct_key,
      rationale: s.sample_quiz.rationale || "",
      options: s.sample_quiz.options || [],
    } : null,
    hasAudio: !!audio, audioClips: audio ? audio.clips : null,
    audioSamples: audio ? {
      slide: audio.sample_slide ? `/app/${audio.sample_slide}` : null,
      cardQ: audio.sample_card_q ? `/app/${audio.sample_card_q}` : null,
      cardA: audio.sample_card_a ? `/app/${audio.sample_card_a}` : null,
      freeClips: audio.free_clips ?? 0,
    } : null,
    video: rawVideo ? {
      units: rawVideo.units,
      freeUnits: rawVideo.free_units ?? 0,
      durationSeconds: rawVideo.duration_seconds ?? null,
      sampleVideo: rawVideo.sample_video ? `/app/${rawVideo.sample_video}` : `/app/video/${xx}/${firstUnit}.mp4`,
      samplePoster: rawVideo.sample_poster ? `/app/${rawVideo.sample_poster}` : `/app/video/${xx}/${firstUnit}.jpg`,
    } : null,
    appPath: `/app/#/${xx}/`,
    signsPath: `/app/#/${xx}/signs`,
    freeChapterPath,
    firstModulePath: firstModule ? `/app/#/${xx}/module/${encodeURIComponent(firstModule)}` : freeChapterPath,
    firstLessonPath: firstUnit ? `/app/#/${xx}/lesson/${encodeURIComponent(firstUnit)}` : freeChapterPath,
    firstReadPath: firstUnit ? `/app/#/${xx}/read/${encodeURIComponent(firstUnit)}` : freeChapterPath,
    firstCardsPath: firstUnit ? `/app/#/${xx}/cards/${encodeURIComponent(firstUnit)}` : freeChapterPath,
    firstQuizPath: firstUnit ? `/app/#/${xx}/quiz/${encodeURIComponent(firstUnit)}` : freeChapterPath,
    practicePath: `/app/#/${xx}/practice`,
  };
}).sort((a, b) => a.name.localeCompare(b.name));

export const stateBySlug = (slug: string) => STATES.find((s) => s.slug === slug) || null;
export const stateByCode = (code: string) => STATES.find((s) => s.code === String(code || "").toUpperCase()) || null;
export const isStateCode = (code: unknown): code is string => typeof code === "string" && !!stateByCode(code);
