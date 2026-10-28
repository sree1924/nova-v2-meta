// Role 16 pilot adapter: exact deterministic merge + located fact index.
// No canonical Blueprint certification, enrichment, clock, writes or model calls.
import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, sha256, jsonBytes, verifyRef, inside} from './atomic-file.mjs';
import {mergeEnvelopes, mergeSections} from './checks/02-dossier-sections.mjs';

const slash = s => s.replaceAll('\\', '/');
const clone = value => JSON.parse(JSON.stringify(value));
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAccepted = ref => ref?.accepted === true || ref?.status === 'accepted';

function readRuntime(ref, projectRoot, runRoot, kind) {
  if (!isAccepted(ref)) throw new Error(`Compiler requires ledger-accepted ${kind} reference`);
  const file = verifyRef(ref, projectRoot);
  inside(runRoot, file);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Object.hasOwn(value, '_fixture')) throw new Error('Fixture metadata cannot enter a production compile');
  return {value, ref: {kind, path: slash(path.relative(projectRoot, file)), sha256: ref.sha256}};
}

function findPage(sourcePage, pageMap) {
  if (typeof sourcePage !== 'string') return null;
  const pages = pageMap.pages ?? [];
  const direct = pages.filter(p => [p.page_id, p.page_map_id, p.source_page].includes(sourcePage));
  if (direct.length === 1) return direct[0];
  // Only explicit physical-page locators are parsed. Bare '#p.2' could mean
  // printed2 or physical2 and must instead resolve to an exact registered ID.
  const physical = sourcePage.match(/^(.*?)#(?:pdf_page=|pdf_page:)(\d+)$/);
  if (!physical) return null;
  const found = pages.filter(p => p.pdf_page === Number(physical[2]) && p.source_ref === physical[1]);
  return found.length === 1 ? found[0] : null;
}

// Deterministic spoken rendering used for spoken_statement (04 backs must be spoken-form AND byte-equal to accepted wording):
// symbol shorthand, percent/ampersand, unit abbreviations, decimals and integers (0–9999) rendered as words.
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
export function numberToWords(n) {
  // Range raised 9,999 → 999,999,999 (2026-10-28): "26,001 pounds" / "10,000" stayed as digits on byte-locked card backs.
  if (!Number.isInteger(n) || n < 0 || n > 999_999_999) return null;
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + numberToWords(n % 100) : '');
  if (n < 1_000_000) return numberToWords(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + numberToWords(n % 1000) : '');
  return numberToWords(Math.floor(n / 1_000_000)) + ' million' + (n % 1_000_000 ? ' ' + numberToWords(n % 1_000_000) : '');
}
const UNIT_WORDS = {mph: 'miles per hour', 'mi/h': 'miles per hour', kph: 'kilometers per hour', ft: 'feet', yd: 'yards', yds: 'yards', mi: 'miles', lb: 'pounds', lbs: 'pounds', oz: 'ounces', sec: 'seconds', secs: 'seconds', hr: 'hours', hrs: 'hours', min: 'minutes', mins: 'minutes', mo: 'months', yr: 'years', yrs: 'years', db: 'decibels'};
// Spoken fractions (2026-10-28): "1/16 inch" was spoken "one or sixteen inch" by the alternatives rule; "20/50" vision as
// "twenty or fifty". Numeric a/b is a fraction or a ratio, never an alternative.
const FRACTION_WORDS = {2: ['half', 'halves'], 3: ['third', 'thirds'], 4: ['quarter', 'quarters'], 5: ['fifth', 'fifths'], 6: ['sixth', 'sixths'], 8: ['eighth', 'eighths'], 10: ['tenth', 'tenths'], 12: ['twelfth', 'twelfths'], 16: ['sixteenth', 'sixteenths'], 32: ['thirty-second', 'thirty-seconds']};
function fractionToWords(a, b) {
  const num = Number(a), den = Number(b);
  if (FRACTION_WORDS[den] && num >= 1 && num < den) return `${numberToWords(num)} ${FRACTION_WORDS[den][num === 1 ? 0 : 1]}`;
  // Ratios such as visual acuity ("20/50", "20/200") and anything else numeric read as "<a> over <b>".
  return `${numberToWords(num) ?? a} over ${numberToWords(den) ?? b}`;
}
// Clock times (2026-10-28): "11:01 p.m." was spoken "eleven:one p.m."; "5:00 a.m." as "five:zero a.m.".
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const spokenizeDecimal = (n) => { const [a, b] = String(n).split('.'); return (numberToWords(Number(a)) ?? a) + (b ? ' point ' + [...b].map((d) => ONES[Number(d)]).join(' ') : ''); };
function timeToWords(h, m) {
  const hour = numberToWords(Number(h)) ?? h;
  const mins = Number(m);
  if (mins === 0) return hour;
  if (mins < 10) return `${hour} oh ${ONES[mins]}`;
  return `${hour} ${numberToWords(mins)}`;
}
export function spokenize(text) {
  let s = String(text ?? '');
  // URLs / web paths first (2026-10-28, Michigan "Michigan.gov/NewDrivers", "Michigan.gov/SOS"): a slash after a dotted host is
  // spoken as "slash", never as "or"; without this the short-part rule below turned "Michigan.gov/SOS" into "Michigan.gov or SOS"
  // and long paths got no spoken form at all (04.BACK_SPOKEN_FORM vs 04.BACK_FIDELITY could not both pass).
  s = s.replace(/\b((?:https?:\/\/)?(?:www\.)?[A-Za-z0-9-]+(?:\.[A-Za-z]{2,})+)((?:\/[A-Za-z0-9._~%-]+)+)\/?/g, (_, host, pathPart) => host + pathPart.split('/').filter(Boolean).map((seg) => ' slash ' + seg).join(''));
  // Emergency number and money in millions/billions (2026-10-28, Michigan "911" → "nine hundred eleven", "$130 million" →
  // "one hundred thirty dollars million"); engine displacement "125cc".
  s = s.replace(/\b911\b/g, 'nine one one');
  s = s.replace(/\$\s?(\d+(?:\.\d+)?)\s*(million|billion|trillion)\b/gi, (_, n, scale) => `${spokenizeDecimal(n)} ${scale.toLowerCase()} dollars`);
  s = s.replace(/\b(\d+)\s*cc\b/g, (_, n) => `${numberToWords(Number(n)) ?? n} cubic centimeters`);
  // Years 1900–1999 (New Jersey "since 1998" was "one thousand nine hundred ninety-eight"): "nineteen ninety-eight" unless a
  // measure follows (then it is a quantity). 20xx already reads naturally as "two thousand twenty-one".
  s = s.replace(/\b19(\d\d)\b(?!\s*(?:feet|ft|foot|pounds|lbs?|miles|mi|mph|dollars|yards|inches|cc|percent|%))/g, (_, yy) => `nineteen ${Number(yy) === 0 ? 'hundred' : Number(yy) < 10 ? 'oh ' + ONES[Number(yy)] : numberToWords(Number(yy))}`);
  // Clock times and numeric fractions/ratios BEFORE the alternatives rule, which would otherwise read "/" and ":" literally.
  s = s.replace(/\b(1[0-2]|0?[1-9])[:.]([0-5]\d)(?=\s*(?:a\.?m\.?|p\.?m\.?|noon|midnight)\b)/gi, (_, h, m) => timeToWords(h, m));
  s = s.replace(/\b(\d{1,2}):([0-5]\d)\b(?!\s*:)/g, (_, h, m) => timeToWords(h, m));
  // Dates "12/31/2021" (Indiana sec05-F23 was "twelve or thirty-one/two thousand twenty-one") and numeric triples such as
  // insurance minimums "25/50/25" ("twenty-five, fifty, twenty-five"), both before the two-part fraction/ratio rule.
  s = s.replace(/\b(1[0-2]|0?[1-9])\/(3[01]|[12]\d|0?[1-9])\/((?:19|20)\d\d)\b/g, (_, m, d, y) => `${MONTHS[Number(m) - 1]} ${numberToWords(Number(d))}, ${numberToWords(Number(y))}`);
  s = s.replace(/\b(\d{1,3})((?:\/\d{1,3}){2,})\b/g, (_, first, rest) => [first, ...rest.split('/').filter(Boolean)].map((n) => numberToWords(Number(n)) ?? n).join(', '));
  s = s.replace(/\b(\d{1,2})\/(\d{1,3})\b(?!\/)/g, (_, a, b) => fractionToWords(a, b));
  s = s.replace(/\b([A-Za-z0-9]{1,3})((?:\/[A-Za-z0-9]{1,3}\b)+)/g, (_, first, rest) => { const parts = [first, ...rest.split('/').filter(Boolean)]; return parts.length > 2 ? parts.slice(0, -1).join(', ') + ' or ' + parts.at(-1) : parts.join(' or '); });
  s = s.replace(/(\d)\s*%/g, '$1 percent').replace(/\s*&\s*/g, ' and ');
  // Money: the amount group must not swallow a trailing list comma ("$1,000, plus costs" was "one thousand, dollars plus costs").
  s = s.replace(/\$\s?(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{2}))?\b/g, (_, whole, cents) => {
    const w = numberToWords(Number(whole.replace(/,/g, ''))) ?? whole;
    return cents && Number(cents) ? `${w} dollars and ${numberToWords(Number(cents))} cents` : `${w} dollars`;
  });
  s = s.replace(/\b(\d+)\s*(mph|mi\/h|kph|ft|yds?|mi|lbs?|oz|secs?|hrs?|mins?|mo|yrs?|dB)\b\.?/gi, (_, num, unit) => `${num} ${UNIT_WORDS[unit.toLowerCase()] ?? unit}`);
  // Leading-dot decimals (2026-10-28, Colorado ".08 / .02 / .04 BAC" came out "over.eight"): spoken "point zero eight".
  s = s.replace(/(^|[^\d.])\.(\d+)\b/g, (_, pre, frac) => `${pre}${pre && !/\s/.test(pre) ? ' ' : ''}point ${[...frac].map(d => ONES[Number(d)]).join(' ')}`);
  s = s.replace(/\b(\d+)\.(\d+)\b/g, (_, a, b) => `${numberToWords(Number(a)) ?? a} point ${[...b].map(d => ONES[Number(d)]).join(' ')}`);
  s = s.replace(/\b(\d{1,3}(?:,\d{3})+|\d+)\b/g, (m) => { const n = Number(m.replace(/,/g, '')); const w = numberToWords(n); return w ?? m; });
  return s.replace(/[ \t]{2,}/g, ' ');
}

function indexFact(id, section, pageMap) {
  const lines = section.markdown.split('\n');
  // Two marker forms: the legacy inline lead ("**F01** text" / "F01: text") and the 02 block lead the Utah pilot's
  // output-conventions prescribe ("FACT_ID: F01 | anchor: A01" on its own line, statement on the following lines).
  const marker = new RegExp(`^\\s*(?:[-*+]\\s+)?(?:FACT_ID:\\s*${escape(id)}\\s*(?:\\|\\s*anchor:\\s*[A-Za-z0-9_-]+)?\\s*()$|(?:\\*\\*${escape(id)}[.:]?\\*\\*[.:]?|${escape(id)}[.:])\\s*(.*)$)`);
  const candidates = lines.map((line, i) => ({match: line.match(marker), i})).filter(v => v.match);
  if (candidates.length !== 1) return {error: `${id}: expected exactly one explicit fact marker in ${section.chunk_id}; found ${candidates.length}`};
  const {match, i} = candidates[0];
  // The block body may start after blank line(s) following a FACT_ID lead (sec01 layout, 2026-10-27); it ends at the next blank
  // line after the body began, or at a heading / bold lead / next FACT_ID.
  let start = i + 1;
  if (match[1] !== undefined) while (start < lines.length && !lines[start].trim()) start++;
  // The block also ends where ANOTHER fact of this chunk starts on the next line (legacy one-line-per-fact layout without
  // blank lines, e.g. sec06 C2: "sec06-R02: … [A01]." right under R01).
  const otherMarker = new RegExp(`^\\s*(?:[-*+]\\s+)?(?:\\*\\*)?(?:${(section.fact_ids ?? []).filter(f => f !== id).map(escape).join('|') || '(?!x)x'})(?:\\*\\*)?[.:]`);
  let end = start;
  while (end < lines.length && lines[end].trim() && !/^\s*(?:#{1,6}\s|\*\*|§|FACT_ID:)/.test(lines[end]) && !otherMarker.test(lines[end])) end++;
  const lead = match[1] ?? match[2] ?? '';
  // "Source: [Axx -> page]" trailers and "Why it matters:"-style commentary lines are bookkeeping, not fact wording; they stay
  // in the verbatim span only.
  const body = lines.slice(start, end).filter(l => !/^\s*Source:\s*\[[A-Za-z0-9_-]+\s*->\s*\S+\]\s*$/.test(l) && !/^\s*(?:Why it matters|Why|Example|Tip|Note|Context|Remember|Exam angle|Trap)\s*:/i.test(l));
  const raw = [lead, ...body].join('\n');
  // The block-lead anchor ("| anchor: Axx") is an explicit citation by construction, even when the body does not repeat [Axx].
  const leadAnchorId = lines[i].match(/\|\s*anchor:\s*([A-Za-z0-9_-]+)/)?.[1] ?? null;
  const anchors = (section.source_anchors ?? []).filter(a => raw.includes(`[${a.anchor_id}]`) || a.anchor_id === leadAnchorId);
  if (!anchors.length) return {error: `${id}: exact marked fact span has no explicit source anchor`};
  let pages = anchors.map(a => ({anchor: a, page: findPage(a.source_page, pageMap)}));
  const unresolved = pages.filter(p => !p.page);
  if (unresolved.length) return {error: `${id}: physical page unresolved for ${unresolved.map(p => p.anchor.source_page).join(', ')}`};
  const identities = new Set(pages.map(p => p.page.page_map_id));
  let supportingPages = [];
  if (identities.size !== 1) {
    // A block lead "FACT_ID: x | anchor: Axx" declares the page of record; further inline anchors are supporting pages
    // (recorded, not chosen by the compiler). Without a lead anchor the span still needs an explicit split.
    const leadId = lines[i].match(/\|\s*anchor:\s*([A-Za-z0-9_-]+)/)?.[1];
    // Legacy one-line facts have no lead anchor: the FIRST anchor cited in the span is the page of record (deterministic).
    const firstCited = [...raw.matchAll(/\[([A-Za-z0-9_-]+)\]/g)].map(m => m[1]).find(a => pages.some(p => p.anchor.anchor_id === a));
    const lead = (leadId && pages.find(p => p.anchor.anchor_id === leadId)) || (firstCited && pages.find(p => p.anchor.anchor_id === firstCited));
    if (!lead) return {error: `${id}: multi-page span needs an explicit fact split; compiler will not choose a page`};
    supportingPages = pages.filter(p => p !== lead).map(p => ({anchor_id: p.anchor.anchor_id, source_page: p.anchor.source_page, pdf_page: p.page.pdf_page}));
    pages = [lead];
  }
  let statement = raw;
  for (const anchor of anchors) statement = statement.split(`[${anchor.anchor_id}]`).join('');
  // Scaffold lines ("Group: x | Prereq: y | Difficulty: 2 | Confusable: z") are dossier bookkeeping, never fact wording;
  // anchor removal leaves " ." / " ," which is closed up. Both fixes are learner-facing: 04 backs must equal this statement.
  statement = statement.split('\n').filter(l => !/^\s*(?:[A-Za-z][A-Za-z _-]{0,20}:\s*[^|\n]*\|\s*){1,}[A-Za-z][A-Za-z _-]{0,20}:\s*[^|\n]*$/.test(l)).join('\n');
  // KG-hint clauses ("group …; prereq …; difficulty N; confusable …") are C2 bookkeeping, never learner wording.
  const HINT_CLAUSE = /(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables|tags?)\s*:?\s*[^;.\n]*/gi;
  const hintOnly = /^\s*(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables)\b/i.test(statement) && statement.split(';').every(seg => /^\s*(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables|tags?)\b/i.test(seg) || !seg.trim() || /^\s*\.?\s*$/.test(seg));
  statement = statement.replace(/;\s*(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables|tags?)\s*:?\s*[^;.\n]*/gi, '').replace(/^\s*(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables)\s*:?\s*[^;.\n]*;\s*/i, '');
  statement = statement.replace(/\s+([.,;:!?])/g, '$1').replace(/[ \t]+(?=\n|$)/g, '').trim();
  // A C2 entry that is ONLY KG-hint metadata (no rule sentence) is a kg_hint, not a learner fact: it is returned for the
  // hints map and kept out of the fact registry (04/05/06 never card or narrate it; 03 may still use it for confusables).
  const hintClauseInSpan = /(?:group|prereq|prerequisite|difficulty|diff|confusable|confusables|tags?)\s*:?\s*[^;.\n]*/i.test(lines.slice(i, end).join(' ')); // non-global copy: HINT_CLAUSE carries /g state
  if (hintOnly || (statement && statement.split(/\s+/).length < 4 && hintClauseInSpan)) {
    return {hint: {fact_id: id, chunk_id: section.chunk_id, section: section.section_id, hint_text: lines.slice(i, end).join('\n'), source_page: pages[0].anchor.source_page, pdf_page: pages[0].page.pdf_page}};
  }
  if (!statement || /\(\s*verify\b/i.test(statement)) return {error: `${id}: empty or unresolved fact span cannot enter accepted wording`};
  const page = pages[0].page;
  // Deterministic spoken rendering of symbol shorthand (the 04 back must be spoken-form AND equal the accepted wording):
  // "A/B/C" → "A, B or C", "%" → " percent", "&" → " and ". Emitted as spoken_statement only when it differs from statement.
  const spoken = spokenize(statement);
  const spokenExtra = spoken !== statement ? {spoken_statement: spoken} : {};
  return {fact: {
    fact_id: id, text: statement, statement, ...spokenExtra, ...(supportingPages.length ? {supporting_pages: supportingPages} : {}),
    status: 'authored', acceptance_kind: 'deterministic_validation_only', independent_audit_status: 'pending',
    section: section.section_id, chunk_id: section.chunk_id, domain: section.domain,
    source_page: pages[0].anchor.source_page, pdf_page: page.pdf_page, printed_page: page.printed_page,
    page_map_id: page.page_map_id, source_document_sha256: page.source_document_sha256 ?? pageMap.source_document_ref?.sha256 ?? null,
    source_ref: {ref: page.source_ref ?? pageMap.source_ref, pdf_page: page.pdf_page, printed_page: page.printed_page, page_map_id: page.page_map_id},
    source_span: {chunk_id: section.chunk_id, start_line: i + 1, end_line: end,
      markdown_sha256: sha256(Buffer.from(section.markdown)), verbatim: lines.slice(i, end).join('\n')},
    transformation: 'Remove explicit fact-ID marker and declared inline source-anchor tokens; retain all wording and continuation lines.',
  }};
}

/** Accepted refs are supplied by the controller from the ledger, never inferred
 * from file presence or PASS text inside an output. Relative paths use projectRoot.
 */
export function compileDossier({projectRoot, runRoot, acceptedEnvelopes: acceptedEnvelopesIn = [], sourceRegistryRef, pageMapRef, overlayRef, candidateLineageId = null, outputDir = 'root'} = {}) {
  // Per-part dispatch (JAM-UT-03) + lineage resets mean accepted parts legitimately come from several lineages, and a part may be
  // re-accepted under a new task identity (validator closure reseal). Rule: one envelope per assigned part set — the latest
  // accepted wins (ledger accepted_at, then task_id for determinism); lineages are recorded, not required to match.
  const byParts = new Map();
  for (const r of acceptedEnvelopesIn) {
    const parts = (() => { try { return JSON.stringify(JSON.parse(r.identity ?? 'null')?.config?.dossier_parts ?? []); } catch { return '[]'; } })();
    const key = parts === '[]' ? 'whole:' + (r.task_id ?? r.sha256) : parts;
    const prev = byParts.get(key);
    if (!prev || String(r.accepted_at ?? '') > String(prev.accepted_at ?? '') || (String(r.accepted_at ?? '') === String(prev.accepted_at ?? '') && String(r.task_id ?? '') > String(prev.task_id ?? ''))) byParts.set(key, r);
  }
  const acceptedEnvelopes = [...byParts.values()];
  const supersededEnvelopes = acceptedEnvelopesIn.filter(r => !acceptedEnvelopes.includes(r)).map(r => ({path: r.path, sha256: r.sha256, task_id: r.task_id ?? null}));
  if (!projectRoot || !runRoot) throw new Error('projectRoot and isolated runRoot are required');
  projectRoot = fs.realpathSync(projectRoot);
  runRoot = inside(path.join(projectRoot, 'runs'), runRoot);
  if (!acceptedEnvelopes.length) return {status: 'HOLD', errors: ['No accepted02 envelopes'], inputRefs: [], writePlan: [], blueprint: null, factRegistry: null, markdown: null};
  const loaded = acceptedEnvelopes.map(r => readRuntime(r, projectRoot, runRoot, 'dossier_envelope'));
  const sourceRegistry = readRuntime(sourceRegistryRef, projectRoot, runRoot, 'source_registry');
  const map = readRuntime(pageMapRef, projectRoot, runRoot, 'page_map');
  const overlayFile = verifyRef(overlayRef, projectRoot);
  const overlay = JSON.parse(fs.readFileSync(overlayFile, 'utf8'));
  const overlayPin = {kind: 'pilot_overlay', path: slash(path.relative(projectRoot, overlayFile)), sha256: overlayRef.sha256};
  if (overlay.role_overrides?.['16']?.implementation !== 'deterministic_merge_and_fact_index' ||
      overlay.role_overrides?.['17']?.disposition !== 'n/a_pilot' || !overlay.role_overrides['17'].reason?.trim()) {
    throw new Error('Pinned overlay must declare role16 deterministic_merge_and_fact_index and role17 n/a_pilot with reason');
  }
  const envelopes = loaded.map(l => l.value);
  const errors = [];
  const probes = new Set(envelopes.map(e => e.probe));
  if (probes.size !== 1) errors.push('Accepted envelopes have conflicting probe');
  const sourceLineages = [...new Set(envelopes.map(e => e.lineage?.candidate_lineage_id ?? null))].sort();
  for (const envelope of envelopes) {
    if (envelope.artifact !== 'SmeDossierEnvelope' || envelope.stage_id !== '02.dossier_sections') errors.push('Accepted input is not a stage02 dossier envelope');
    // An envelope that asserts a registry hash must match the accepted registry; an empty/null hash (a non-citing part such as
    // B or E that omitted it) is "not asserted" and is recorded, not failed — the anchors of citing parts are resolved below.
    const envReg = envelope.lineage?.source_registry_sha256;
    if (envReg && envReg !== sourceRegistry.ref.sha256) errors.push('Envelope source registry hash differs from accepted registry');
    const ownMerge = mergeSections(envelope.sections);
    // A declared expected_merged_sha256 names the FULL dossier (output-conventions): it is only comparable on a complete_dossier
    // envelope. Null / all-zeros means "not computed" (sec03 part declared a non-null placeholder, 2026-10-27).
    const declared = envelope.merge?.expected_merged_sha256;
    const realHash = typeof declared === 'string' && /^[a-f0-9]{64}$/.test(declared) && !/^0{64}$/.test(declared);
    if (realHash && envelope.envelope_scope?.kind !== 'partial_chunk' && declared !== ownMerge.sha256) errors.push('Envelope declared merge hash differs from actual ordered bytes');
  }
  const merged = mergeEnvelopes(envelopes);
  errors.push(...merged.errors);
  const sections = merged.sections; // the merge's own order (one envelope: merge_seq; several: section order, then merge_seq)
  const factEntries = [];
  const hintEntries = []; // C2 KG-hint-only entries (no learner sentence): kept beside the registry, never as facts
  const seen = new Set();
  for (const section of sections) for (const id of section.fact_ids ?? []) {
    if (seen.has(id)) { errors.push(`Duplicate declared fact ID ${id}`); continue; }
    seen.add(id);
    const indexed = indexFact(id, section, map.value);
    if (indexed.error) errors.push(indexed.error);
    else if (indexed.hint) hintEntries.push([id, indexed.hint]);
    else factEntries.push([id, indexed.fact]);
  }
  if (!factEntries.length) errors.push('No unambiguously located accepted fact spans were indexed');
  const inputRefs = [...loaded.map(l => l.ref), sourceRegistry.ref, map.ref, overlayPin]
    .sort((a, b) => `${a.kind}:${a.path}`.localeCompare(`${b.kind}:${b.path}`));
  const inputManifestHash = sha256(canonicalJson(inputRefs));
  const stage17 = {status: 'n/a_pilot', reason: overlay.role_overrides['17'].reason,
    overlay_ref: overlayPin, action: 'No hint enrichment executed; accepted section/C2 text passes through unchanged.'};
  const status = errors.length ? 'HOLD' : 'PASS';
  const factRegistry = {artifact_type: 'AcceptedDossierFactIndex', schema_version: '0.4.0', status,
    role_id: '16', input_manifest_sha256: inputManifestHash,
    source_registry_sha256: sourceRegistry.ref.sha256, page_map_sha256: map.ref.sha256,
    acceptance_kind: 'deterministic_index_only_not_factual_audit',
    facts: Object.fromEntries(factEntries.sort(([a], [b]) => a.localeCompare(b))),
    ...(hintEntries.length ? {kg_hints: Object.fromEntries(hintEntries.sort(([a], [b]) => a.localeCompare(b))), kg_hints_note: 'C2 entries that carried only KG-hint metadata; not learner facts, not carded or narrated'} : {})};
  const blueprint = {artifact_type: 'CompiledDossierPilot', schema_version: '0.4.0', role_id: '16', status,
    canonical_blueprint_validation_claimed: false, probe: envelopes[0].probe,
    candidate_lineage_id: candidateLineageId ?? envelopes[0].lineage?.candidate_lineage_id ?? null,
    source_lineages: sourceLineages, superseded_envelopes: supersededEnvelopes,
    input_manifest_sha256: inputManifestHash, input_refs: inputRefs,
    source_registry_sha256: sourceRegistry.ref.sha256, page_map_sha256: map.ref.sha256,
    merge: {order: merged.order, sha256: merged.sha256, rule: 'merge_seq_ascending_concat_no_separator'},
    sections: clone(sections), exam_facts: clone(envelopes[0].exam_facts),
    high_yield_ranked: clone(envelopes.flatMap(e => e.high_yield_ranked ?? [])),
    verification_debt: clone(envelopes.flatMap(e => e.verification_debt ?? [])),
    external_review_requests: clone(envelopes.flatMap(e => e.external_review_requests ?? [])),
    stage17, fact_registry_sha256: sha256(jsonBytes(factRegistry)), compiler_note: 'statements: anchors removed, scaffold key:value|… lines dropped, punctuation closed up', errors: [...new Set(errors)]};
  // Output paths: the root names for the first compile; a RE-compile over the same inputs (compiler fix) goes under
  // 16/<fact-registry sha8>/ so the immutable first files stay as history. Basenames are kept (context binds kinds by basename).
  const registrySha = sha256(jsonBytes(factRegistry));
  // outputDir: 'root' (legacy Section 9 first compile) | 'versioned' (recompile of the root compile) | any explicit prefix such as
  // '16/sec10-alcohol-drugs/' (per-section compiles); an explicit prefix ending in '*/' versions under it.
  const dir = outputDir === 'root' ? '' : outputDir === 'versioned' ? `16/${registrySha.slice(0, 8)}/` : outputDir.endsWith('*/') ? `${outputDir.slice(0, -2)}/${registrySha.slice(0, 8)}/` : outputDir;
  return {status, blueprint, factRegistry, markdown: merged.markdown, errors: [...new Set(errors)], inputRefs, fact_registry_sha256: registrySha,
    writePlan: [
      {path: dir + '16-compiled-dossier.json', value_key: 'blueprint', sha256: sha256(jsonBytes(blueprint))},
      {path: dir + '16-fact-registry.json', value_key: 'factRegistry', sha256: registrySha},
      {path: dir + '02-blueprint.md', value_key: 'markdown', sha256: merged.sha256, encoding: 'utf8'},
      {path: dir + '17-disposition.json', value_key: 'blueprint.stage17', sha256: sha256(jsonBytes(stage17))},
    ]};
}
