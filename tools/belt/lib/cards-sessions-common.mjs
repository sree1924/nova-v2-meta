// Shared deterministic text helpers for the 04.cards / 05.sessions / 05.card_scripts compensating checks
// (Claude lane, v0.4.0). Pure: no network, no file reads, no clock.

export const HEX64 = /^[a-f0-9]{64}$/;
export const isHex64 = (s) => typeof s === 'string' && HEX64.test(s);
export const PROBE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const check = (check_id, status, evidence, metrics) => (metrics ? { check_id, status, evidence, metrics } : { check_id, status, evidence });
export const head = (arr, n = 8) => (arr.length > n ? `${arr.slice(0, n).join('; ')}; …(+${arr.length - n} more)` : arr.join('; '));
export const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
export const arr = (v) => (Array.isArray(v) ? v : []);
export const obj = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? v : {});

// ---- tokens / words --------------------------------------------------------------------------
// Words = whitespace-separated chunks that contain at least one Unicode letter or number
// (a bare "—" or "-" is not a word).
export function wordCount(text) {
  if (typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(t => /[\p{L}\p{N}]/u.test(t)).length;
}

// Normalized form used for duplicate detection: NFKC + lowercase, letter/number runs joined by one space.
export function normalizeForCompare(text) {
  if (typeof text !== 'string') return '';
  return (text.normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).join(' ');
}

// Spoken tokens for pronunciation-hint equality: NFKC lowercase letter/number runs, then any run of
// consecutive single-letter tokens is collapsed into one token ("U S" == "U.S." == "us"; "U S C I S" == "USCIS").
export function spokenTokens(text) {
  const raw = (String(text ?? '').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const out = [];
  let run = '';
  for (const t of raw) {
    if (t.length === 1 && /\p{L}/u.test(t)) { run += t; continue; }
    if (run) { out.push(run); run = ''; }
    out.push(t);
  }
  if (run) out.push(run);
  return out;
}

// ---- originality (qualification/CRITERIA-04-text-first.json originality.normalization) ------------
// "Unicode NFKC + lowercase; consecutive Unicode letter/number tokens; punctuation and whitespace separate tokens."
export const originalityTokens = (text) => (String(text ?? '').normalize('NFKC').toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
// Longest contiguous token run shared by `fieldTokens` and `sourceTokens` (DP, O(|field|·|source|)).
export function longestSharedRun(fieldTokens, sourceTokens) {
  const n = fieldTokens.length; const m = sourceTokens.length;
  if (!n || !m) return 0;
  let prev = new Uint16Array(m + 1); let cur = new Uint16Array(m + 1); let best = 0;
  for (let i = 1; i <= n; i++) {
    const t = fieldTokens[i - 1];
    for (let j = 1; j <= m; j++) {
      cur[j] = sourceTokens[j - 1] === t ? prev[j - 1] + 1 : 0;
      if (cur[j] > best) best = cur[j];
    }
    [prev, cur] = [cur, prev];
    cur.fill(0);
  }
  return best;
}

// ---- spoken-form lint (04 backs/hooks/recaps)--------------------------------------------------
// Symbols that have no unambiguous spoken form in a back/hook. Spelled-out forms ("miles per hour",
// "feet", "percent", "and", "or") are the allowed replacements.
export const SPOKEN_FORBIDDEN_SYMBOLS = ['|', '/', '\\', '%', '&', '#', '@', '+', '=', '<', '>', '~', '^', '*', '°', '·', '•'];
// Unit abbreviations flagged anywhere as a whole word (case-insensitive).
export const BARE_UNIT_ABBREVIATIONS = ['mph', 'kph', 'kmh', 'ft', 'yd', 'yds', 'lb', 'lbs', 'oz', 'mg', 'mcg', 'ml', 'psi', 'hr', 'hrs', 'mins', 'secs', 'sq'];
// Unit abbreviations flagged after a numeral with optional space ("55 mi", "15 min"), case-insensitive.
export const NUMBER_ADJACENT_UNITS = ['mi', 'km', 'cm', 'mm', 'kg', 'sec', 'min', 'gal', 'qt', 'pt', 'yr', 'yrs', 'mo'];
// Abbreviations that collide with English words / decades — flagged ONLY when glued to a numeral
// ("12in", "9m", "4h"); "signed in 1787 in Philadelphia" and "the 1800s" are not flagged.
export const NUMBER_GLUED_UNITS = ['in', 'm', 'h', 'l', 'g'];
export const ALLOWED_SPELLED_FORMS = ['miles per hour', 'kilometers per hour', 'feet', 'foot', 'yards', 'pounds', 'ounces', 'inches', 'miles', 'meters', 'seconds', 'minutes', 'hours', 'percent', 'degrees', 'and', 'or', 'point'];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const BARE_RE = new RegExp(`(?<![\\p{L}\\p{N}])(${BARE_UNIT_ABBREVIATIONS.map(escapeRe).join('|')})\\.?(?![\\p{L}\\p{N}])`, 'giu');
const ADJ_RE = new RegExp(`\\p{N}\\s*(${NUMBER_ADJACENT_UNITS.map(escapeRe).join('|')})\\.?(?![\\p{L}\\p{N}])`, 'giu');
const GLUED_RE = new RegExp(`\\p{N}(${NUMBER_GLUED_UNITS.map(escapeRe).join('|')})\\.?(?![\\p{L}\\p{N}])`, 'giu');
const DECIMAL_RE = /\p{N}+\.\p{N}+/gu;

// Returns a list of {kind, token} violations; [] = spoken-form clean.
export function spokenFormViolations(text) {
  if (typeof text !== 'string') return [{ kind: 'not_a_string', token: String(text) }];
  const out = [];
  for (const s of SPOKEN_FORBIDDEN_SYMBOLS) if (text.includes(s)) out.push({ kind: 'symbol', token: s });
  for (const m of text.matchAll(BARE_RE)) out.push({ kind: 'bare_unit_abbreviation', token: m[1] });
  for (const m of text.matchAll(ADJ_RE)) out.push({ kind: 'number_adjacent_unit', token: m[0].trim() });
  for (const m of text.matchAll(GLUED_RE)) out.push({ kind: 'number_glued_unit', token: m[0] });
  for (const m of text.matchAll(DECIMAL_RE)) out.push({ kind: 'unspelled_decimal', token: m[0] });
  return out;
}

// ---- learner scaffold / QA leak (Order Q §4 rules 3 and 4) -------------------------------------
export const SCAFFOLD_PATTERNS = [
  { id: 'verify_debt', re: /\(verify/i },
  { id: 'needs_review', re: /needs_review/i },
  { id: 'flag_as', re: /\bflag as\b/i },
  { id: 'module_code', re: /MOD-[A-Z]/ },
  { id: 'bare_module_id', re: /^m\d\d$/ },
  { id: 'qa_label_prefix', re: /^(answer|question|q|a)\s*:/i },
  { id: 'doubled_article', re: /\b(the|a|an)\s+\1\b/i },
];
export function scaffoldViolations(text) {
  if (typeof text !== 'string') return [];
  return SCAFFOLD_PATTERNS.filter(p => p.re.test(text)).map(p => p.id);
}

// ---- narrated stage directions (05.sessions narration, 05.card_scripts segments) ----------------
// "three seconds" is only a stage direction when attached to a pause/wait/think instruction; a sourced
// fact such as a following-distance rule ("stay three seconds behind") is not flagged.
export const STAGE_DIRECTION_PATTERNS = [
  { id: 'bracket_direction', re: /\[\s*(beat|pause|long pause|short pause|silence|music|sfx|breath|break)[^\]]*\]/i },
  { id: 'paren_direction', re: /\(\s*(beat|pause|silence|music|sfx|breath)[^)]*\)/i },
  // Only the INSTRUCTION use of "pause" is a stage direction (sentence-initial imperative, "pause here/now/for…", "let's pause");
  // the verb in content ("a citation can pause driving", "the officer paused traffic") is narration (2026-10-27, sec02 u03).
  { id: 'pause_word', re: /(?:^|[.!?]\s+|[:;—-]\s*)paus(?:e|ing)\b(?!\s+(?:driving|traffic|the\b|your\b|their\b|his\b|her\b|its\b|a\b|an\b|that\b|this\b|all\b|any\b))|\bpause\s+(?:here|now|for\s+(?:a|one|two|three|\d)|and\s+(?:think|test|recall|try|answer)|to\s+(?:think|recall|answer)|before\s+(?:you|answering))\b|\blet'?s\s+pause\b|\btake\s+a\s+pause\b/i },
  // Learner-directed timing only: sentence-initial / after now|please|let's|just, verbs wait|pause|think|hold on. Driving content
  // ("hold the signal for at least two seconds", "stop for three seconds") is narration, not a direction (2026-10-27, sec08).
  { id: 'timed_instruction', re: /(?:^|[.!?]\s+|\b(?:now|please|just|let'?s)\s+)(?:wait|pause|think|hold\s+on)\b[^.?!]{0,30}\b(one|two|three|four|five|ten|\d+)[- ]seconds?\b/i },
  { id: 'seconds_of_silence', re: /\b(one|two|three|four|five|ten|\d+)[- ]seconds?\s+(of silence|pause|beat|to think|to recall|to answer)\b/i },
  { id: 'ellipsis_timing_marker', re: /\.\.\.|…/ },
  { id: 'production_cue', re: /\b(sound effect|music cue|stage direction|cut to|fade (in|out))\b/i },
];
export function stageDirectionViolations(text) {
  if (typeof text !== 'string') return [];
  return STAGE_DIRECTION_PATTERNS.filter(p => p.re.test(text)).map(p => p.id);
}

// ---- learner request to speak (05 contract: the learner never speaks) -------------------------
// Imperative only: sentence-initial (or after "so"/"now"/"please") say/speak/read/repeat ... out loud/aloud.
// Descriptive uses ("easy to say out loud", "the read-aloud sentences") are not requests and are not flagged.
export const SPEAK_REQUEST_RE = /(?:^|[.!?:;,]\s*|\b(?:so|now|please)\s+)(?:say|speak|read|repeat)\b[^.?!]{0,30}\b(?:out loud|aloud)\b|\bsay your answer\b|\bspeak your answer\b/i;

// ---- practice-only lint (05.card_scripts public wording) ---------------------------------------
export const PRACTICE_ONLY_PATTERNS = [
  { id: 'official_answer', re: /\bofficial answers?\b/i },
  { id: 'official_question', re: /\bofficial (test |exam )?questions?\b/i },
  { id: 'actual_test', re: /\bactual (test|exam)s?\b/i },
  { id: 'actual_question', re: /\bactual (test |exam )?questions?\b/i },
  { id: 'real_question', re: /\breal (test |exam )?questions?\b/i },
  { id: 'real_test', re: /\breal (test|exam)s?\b/i },
];
export function practiceOnlyViolations(text) {
  if (typeof text !== 'string') return [];
  return PRACTICE_ONLY_PATTERNS.filter(p => p.re.test(text)).map(p => p.id);
}

// ---- deictic visual references ("this sign") need a bound image asset --------------------------
export const DEICTIC_VISUAL_RE = /\b(this|that|these|those|the following|the pictured|the shown)\s+(road\s+)?(signs?|signals?|images?|pictures?|photos?|markings?|symbols?|shapes?|diagrams?)\b|\b(shown|pictured)\s+(here|above|below)\b|\bin the (image|picture|photo)\b/i;

// ---- fact registry ----------------------------------------------------------------------------
// context.fact_registry = {facts: {<fact_id>: {statement, spoken_statement?, components?: string[],
//   status: "verified"|"authored"|"unknown", source_page?, node_id?}}}
export const UNRESOLVED_FACT_STATUSES = new Set(['unknown', 'verify', 'debt', 'unverified', 'blocked']);
export function factRegistry(context) {
  const facts = context?.fact_registry?.facts;
  return facts && typeof facts === 'object' && !Array.isArray(facts) ? facts : null;
}
export function acceptedWording(fact) {
  if (!fact || typeof fact !== 'object') return null;
  if (typeof fact.spoken_statement === 'string') return fact.spoken_statement;
  if (typeof fact.statement === 'string') return fact.statement;
  return null;
}

// ---- reference hash lookup (fixture-context convention: loaded_refs[key] or ref_sha256[key]) ----
export function refSha(context, key) {
  return context?.loaded_refs?.[key]?.sha256 ?? context?.ref_sha256?.[key] ?? null;
}

export function sameSourceRef(a, b) {
  const pick = (r) => JSON.stringify([r?.ref ?? null, r?.tier ?? null, r?.pdf_page ?? null, r?.printed_page ?? null, r?.page_map_id ?? null]);
  return pick(a) === pick(b);
}
