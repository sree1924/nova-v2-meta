// Handbook edition dates for registry entries whose `handbook` string carries no date.
// Each value is quoted from that state's accepted stage-02 dossier (app-preview/data/<xx>/real/
// 02_dossier_sections, "reason" / source "ref" fields) as read on 2026-10-28. A state with no
// edition found in its exports shows "(verify)" — never a guessed date.
// States whose registry `handbook` already includes the edition (e.g. "Texas Driver Handbook
// (DL-7, Rev. Jan 2026)") need no entry here.
export const EDITION_FROM_DOSSIER: Record<string, string> = {
  CO: "DR 2337, dated 12/05/24",
  NC: "Revised May 2025",
  MD: "DL-002 (10-26), October 2026 Edition",
  IN: "Published July 2026",
  CA: "DL 600, revised June 2025",
  FL: "rev. 08/2023",
};

const HAS_DATE = /(19|20)\d{2}|\/\d{2}\b|R\/\d+\/\d+/;

/** Edition text for display, or null when the handbook title already carries it. */
export function editionNote(code: string, handbook: string): string {
  if (HAS_DATE.test(handbook)) return "";
  return EDITION_FROM_DOSSIER[code] || "(verify)";
}
