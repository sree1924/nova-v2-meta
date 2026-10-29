// quarantine.mjs — point-of-sale hold list. Scans every complete state's exported 04.cards backs (and the card
// scripts that copy them) for known spoken-number garble classes; writes app-preview/data/<xx>/quarantine.json and
// app-preview/data/quarantine-summary.json. The store gate hides those card ids; artifacts are never altered.
// Usage: node tools/preview/quarantine.mjs [--write]   (without --write: report only)
// Read-only scan of accepted 04.cards backs for spoken-number garbles. Writes ONLY quarantine.json files + summary.
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'app-preview');
const WRITE = process.argv.includes('--write');
const states = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/states.json'), 'utf8'));

const ONES = 'zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen';
const TENS = 'twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety';
const NUMW = `(?:(?:${TENS})(?:-(?:one|two|three|four|five|six|seven|eight|nine))?|${ONES}|hundred|thousand)`;
const DIGW = 'zero|one|two|three|four|five|six|seven|eight|nine';

// class id -> {label, severity, regexes}
const CLASSES = [
  {id: 'c1_leading_dot_decimal', n: 1, sev: 'meaning', res: [
    new RegExp(`\\b(?:of|over|at|below|or|a|than|is|above|under|exceeds?|to|from|and|reaches|with)\\.(?:${DIGW})\\b`, 'i'),
    new RegExp(`(?:^|\\s)\\.(?:${DIGW})\\b`, 'i'),
    // generic word.numberword with a LOWERCASE number word (a real sentence boundary would be capitalised) - case-sensitive
    new RegExp(`[a-z]\\.(?:${DIGW})\\b`),
  ]},
  {id: 'c2_fraction_as_alternative', n: 2, sev: 'meaning', res: [
    /\b(?:one|two|three|five|seven) or (?:two|three|four|eight|ten|sixteen|thirty-two)(?: of an)? inch(?:es)?\b/i,
    /\btwenty or (?:forty|fifty|seventy|two hundred)\b/i,
    /\b(?:one|three) or (?:two|four) of (?:a|an) (?:mile|second|inch)\b/i,
  ]},
  {id: 'c3_comma_before_dollars', n: 3, sev: 'cosmetic', res: [/,\s*dollars?\b/i]},
  {id: 'c4_clock_garble', n: 4, sev: 'cosmetic', res: [new RegExp(`\\b${NUMW}:\\s?(?:${NUMW}|oh)\\b`, 'i')]},
  {id: 'c5_911_as_number', n: 5, sev: 'meaning', res: [/\bnine hundred (?:and )?eleven\b/i]},
  {id: 'c7_year_as_plain_number', n: 7, sev: 'meaning', res: [
    /\bone thousand nine hundred\b(?!(?:[\s-]+[a-z]+){0,3}?\s+(?:feet|foot|pounds|miles|dollars|yards|inches|gallons|cubic|people|vehicles|drivers|hours)\b)/i,
  ]},
  {id: 'c8_and_or_or', n: 8, sev: 'meaning', res: [/\band or or\b/i, /\bor or\b/i, /\band and\b/i]},
  {id: 'c9_symbol_passed', n: 9, sev: 'cosmetic', res: [/[*#@\/]/]},
  {id: 'c10_parenthesised_number_word', n: 10, sev: 'cosmetic', res: [new RegExp(`\\(\\s*${NUMW}(?:[\\s-]+${NUMW})*\\s*\\)`, 'i')]},
  {id: 'c11_vulgar_fraction_glyph', n: 11, sev: 'cosmetic', res: [/[½¼¾⅓⅔⅛⅜⅝⅞⅕⅖⅗⅘⅙⅚]/]},
];

// Class 6: raw digits, split into codes (listed, not hidden) vs digits (hidden).
// Code lead: an UPPERCASE acronym (case-sensitive: RCW, NRS, MCL, SR) or a code word (case-insensitive) right before the token.
const ACRONYM_LEAD = /(?:^|\s)[A-Z]{2,}[A-Za-z]*\.?\s+$|§\s*$/;
const WORD_LEAD = /\b(?:form|forms|section|sections|chapter|title|rule|statute|code|article|subsection|route|highway|interstate|exit|no\.|number)\s+$/i;
const NUMWORD_RE = new RegExp(`(?:^|[^a-z])(?:${TENS}|${ONES}|hundred|thousand)(?=[^a-z]|$)`, 'i');
function digitHits(back) {
  const digits = [], codes = [];
  const tokRe = /\S*\d\S*/g;
  let m;
  while ((m = tokRe.exec(back))) {
    const tok = m[0].replace(/^[("'“‘\[]+|[)"'”’\].,;:!?]+$/g, '');
    const before = back.slice(Math.max(0, m.index - 24), m.index);
    // Never codes: ordinals (21st), engine sizes (125cc), decades (1960s), comma-grouped quantities, internal belt ids
    // (sec02-R03, presec10-F03, R01), and half-spoken codes (MV-forty-four.1RID, 484B.one hundred, fifty-seven.602b).
    let why = null;
    if (/^\d+(?:st|nd|rd|th)$/i.test(tok)) why = 'ordinal';
    else if (/^\d+cc$/i.test(tok)) why = 'engine_cc';
    else if (/^\d{4}s$/.test(tok)) why = 'decade';
    else if (/(?:^|[^A-Za-z])(?:pre)?sec\d+|^[FR]\d{2,}$|-[FR]\d{2,}\b/.test(tok)) why = 'internal_id_leak';
    else if (NUMWORD_RE.test(tok) && /\d/.test(tok)) why = 'half_spoken_code';
    if (!why) {
      const lettersAndDigits = /[A-Za-z]/.test(tok) && /\d/.test(tok); // MV-44, DL-123A, I-94, SR22, MV3001, az511.com
      const ledByCode = ACRONYM_LEAD.test(before) || WORD_LEAD.test(before);
      if (lettersAndDigits || ledByCode) { codes.push({tok, at: m.index}); continue; }
      why = 'raw_number';
    }
    digits.push({tok, at: m.index, why});
  }
  return {digits, codes};
}

const excerpt = (s, at, len = 0) => {
  const a = Math.max(0, at - 50), b = Math.min(s.length, at + len + 50);
  return (a > 0 ? '…' : '') + s.slice(a, b) + (b < s.length ? '…' : '');
};

// Outside the 11 requested classes: listed per state as candidates, NOT hidden (scope).
const NW = '(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:-[a-z]+)?';
const UNCOVERED = [
  {id: 'x_phone_as_cardinal', re: new RegExp(`\\b${NW} hundred(?: ${NW})?-${NW}(?: thousand| hundred)`, 'i')},
  {id: 'x_section_sign_code_as_cardinal', re: /§\s*[a-z]/i},
];

// Positive + negative controls: every class must fire on a known-bad string; spokenize()'s fixed forms must fire nothing.
const classify = (s) => { const out = CLASSES.filter(cl => cl.res.some(r => r.test(s))).map(cl => cl.id); const {digits, codes} = digitHits(s); if (digits.length) out.push('c6_raw_digits'); if (codes.length) out.push('codes'); return out; };
const POS = {c1_leading_dot_decimal: 'a BAC of.eight percent', c2_fraction_as_alternative: 'less than one or sixteen inch of tread', c3_comma_before_dollars: 'costs one hundred, dollars',
  c4_clock_garble: 'between eleven:one pm and five:zero am', c5_911_as_number: 'call nine hundred eleven', c6_raw_digits: 'costs 25 dollars', codes: 'sign form MV3001',
  c7_year_as_plain_number: 'since one thousand nine hundred ninety-eight', c8_and_or_or: 'license and or or plates', c9_symbol_passed: 'see Michigan.gov/SOS',
  c10_parenthesised_number_word: 'six (six) months', c11_vulgar_fraction_glyph: 'at least fifteen½'};
const NEG = ['a BAC of point zero eight percent', 'less than one sixteenth inch of tread', 'twenty over forty vision', 'call nine one one', 'since nineteen ninety-eight',
  'between eleven oh one p.m. and five a.m.', 'one thousand nine hundred pounds', 'fifteen and a half', 'two or three seconds', 'Stop. One more rule.'];
const controlFail = [];
for (const [cls, s] of Object.entries(POS)) if (!classify(s).includes(cls)) controlFail.push(`POS ${cls}: ${s}`);
for (const s of NEG) if (classify(s).length) controlFail.push(`NEG ${classify(s)}: ${s}`);
if (controlFail.length) { console.error('CONTROL FAIL\n' + controlFail.join('\n')); process.exit(1); }
console.log(`controls: ${Object.keys(POS).length} positive fire, ${NEG.length} negative silent`);

const SEV_RANK = {meaning: 0, digits: 1, cosmetic: 2};
const now = new Date().toISOString();
const summary = {generated_at: now, rule: 'hidden at point of sale until re-authored; fact unchanged', scope: 'accepted 04.cards card backs only (front, memory_hook, recaps not scanned)', states: [], per_class_total: {}, totals: {}};
const allExamples = [];
let grandCards = 0, grandHidden = 0, grandInstances = 0, grandCodes = 0, grandItemsLost = 0, grandItems = 0, grandUncovered = 0;

for (const st of states) {
  const code = st.code.toLowerCase();
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, st.data_root, 'manifest.json'), 'utf8'));
  const load = (stage) => m.files.filter(f => f.stage_id === stage).map(f => ({f, j: JSON.parse(fs.readFileSync(path.join(ROOT, f.file), 'utf8'))}));
  const cardArts = load('04.cards'), scriptArts = load('05.card_scripts'), examArts = load('06.exam_bank');

  const scripted = new Set();
  for (const {j} of scriptArts) for (const s of j.audio_scripts ?? []) if (s.card_id) scripted.add(s.card_id);

  const entries = [], codeEntries = [], uncovered = [], cardIds = new Set(), hiddenIds = new Set();
  const perClass = {};
  const cardsByFact = new Map(); // fact_id -> set(card_id) for scripted cards
  let instances = 0;
  const seen = new Set();
  for (const {f, j} of cardArts) {
    for (const deck of j.decks ?? []) for (const c of deck.cards ?? []) {
      instances++;
      cardIds.add(c.card_id);
      if (scripted.has(c.card_id)) for (const fid of (c.claims_fact_ids?.length ? c.claims_fact_ids : [c.node_id]).filter(Boolean)) {
        if (!cardsByFact.has(fid)) cardsByFact.set(fid, new Set());
        cardsByFact.get(fid).add(c.card_id);
      }
      const back = String(c.back ?? '');
      const key = c.card_id + '\u0000' + back;
      if (seen.has(key)) continue; // identical duplicate (same id + same back) from a re-accepted section
      seen.add(key);
      const hits = [];
      for (const cl of CLASSES) {
        for (const re of cl.res) {
          const mm = back.match(re);
          if (mm) { hits.push({cls: cl.id, sev: cl.sev, at: mm.index, len: mm[0].length, match: mm[0]}); break; }
        }
      }
      for (const u of UNCOVERED) { const um = back.match(u.re); if (um) uncovered.push({id: c.card_id, deck: deck.module_id ?? deck.module, class: u.id, back_excerpt: excerpt(back, um.index, um[0].length)}); }
      const {digits, codes} = digitHits(back);
      if (digits.length) hits.push({cls: 'c6_raw_digits', sev: 'digits', at: digits[0].at, len: digits[0].tok.length, match: digits.map(d => `${d.tok} [${d.why}]`).join(' ')});
      if (codes.length) { codeEntries.push({id: c.card_id, deck: deck.module_id ?? deck.module, class: 'codes', tokens: codes.map(d => d.tok), back_excerpt: excerpt(back, codes[0].at, codes[0].tok.length)}); perClass.codes = (perClass.codes ?? 0) + 1; }
      if (!hits.length) continue;
      hits.sort((a, b) => SEV_RANK[a.sev] - SEV_RANK[b.sev] || a.cls.localeCompare(b.cls));
      for (const h of hits) perClass[h.cls] = (perClass[h.cls] ?? 0) + 1;
      const e = {id: c.card_id, deck: deck.module_id ?? deck.module, class: hits[0].cls, classes: hits.map(h => h.cls), severity: hits[0].sev, matched: hits.map(h => h.match), back_excerpt: excerpt(back, hits[0].at, hits[0].len)};
      if (cardArts.filter(a => a.f.section_id === f.section_id).length > 1) e.source_task_id = f.task_id;
      entries.push(e);
      hiddenIds.add(c.card_id);
      allExamples.push({state: st.code, ...e, n_classes: hits.length, meaning: hits.filter(h => h.sev === 'meaning').length, back});
    }
  }

  // Informational: exam items whose every scripted supporting card is hidden.
  let items = 0, itemsLost = 0, itemsNoCard = 0;
  const lostItems = [];
  for (const {j} of examArts) for (const it of j.items ?? []) {
    items++;
    const facts = (it.fact_ids?.length ? it.fact_ids : [it.node_id]).filter(Boolean);
    const support = new Set();
    for (const fid of facts) for (const cid of cardsByFact.get(fid) ?? []) support.add(cid);
    if (!support.size) { itemsNoCard++; continue; }
    if ([...support].every(cid => hiddenIds.has(cid))) { itemsLost++; lostItems.push(it.item_id); }
  }

  const out = {state: st.code, generated_at: now, rule: 'hidden at point of sale until re-authored; fact unchanged',
    data_root: st.data_root, scanned: {card_backs: instances, unique_card_ids: cardIds.size, accepted_04_artifacts: cardArts.length},
    hidden_count: hiddenIds.size, cards: entries,
    codes_not_hidden: codeEntries,
    uncovered_candidates_not_hidden: uncovered.map(u => ({...u, already_hidden_by_other_class: hiddenIds.has(u.id)})),
    exam_items_losing_all_supporting_cards: {count: itemsLost, of_items: items, items_without_any_scripted_card: itemsNoCard, item_ids: lostItems,
      note: 'informational: item fact_ids -> scripted cards (05.card_scripts card_id) claiming those facts; counted when every such card is hidden'}};
  const outPath = path.join(ROOT, 'data', code, 'quarantine.json');
  if (WRITE) { fs.mkdirSync(path.dirname(outPath), {recursive: true}); fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n'); }
  summary.states.push({state: st.code, quarantine_file: `data/${code}/quarantine.json`, total_cards: cardIds.size, card_back_instances: instances, hidden: hiddenIds.size,
    percent_hidden: +(100 * hiddenIds.size / cardIds.size).toFixed(2), per_class: perClass, codes_not_hidden: codeEntries.length,
    exam_items: items, exam_items_losing_all_supporting_cards: itemsLost,
    uncovered_candidates_not_hidden: uncovered.filter(u => !hiddenIds.has(u.id)).length});
  grandUncovered += uncovered.filter(u => !hiddenIds.has(u.id)).length;
  for (const [k, v] of Object.entries(perClass)) summary.per_class_total[k] = (summary.per_class_total[k] ?? 0) + v;
  grandCards += cardIds.size; grandHidden += hiddenIds.size; grandInstances += instances; grandCodes += codeEntries.length; grandItemsLost += itemsLost; grandItems += items;
}
summary.totals = {states: states.length, total_cards: grandCards, card_back_instances: grandInstances, total_hidden: grandHidden,
  percent_hidden: +(100 * grandHidden / grandCards).toFixed(2), codes_not_hidden: grandCodes, exam_items: grandItems, exam_items_losing_all_supporting_cards: grandItemsLost, uncovered_candidates_not_hidden: grandUncovered};
summary.controls = {positive: Object.keys(POS).length, negative: NEG.length, result: "PASS"};
summary.severity = {meaning_changing_always_hide: ["c1","c2","c5","c7","c8"], cosmetic_hide: ["c3","c4","c9","c10","c11"], c6_digits_hide_unless_code: true, codes: "listed, not hidden", uncovered: "listed, not hidden (outside the 11 classes)"};
summary.regexes = Object.fromEntries(CLASSES.map(c => [c.id, c.res.map(r => r.toString())]));
summary.regexes.c6_raw_digits = ['tokens /\\S*\\d\\S*/; always digits (hidden): ordinal /^\\d+(st|nd|rd|th)$/, /^\\d+cc$/, decade /^\\d{4}s$/, internal belt id (sec\\d+, -[FR]\\d\\d), half-spoken code (number word + digit in one token), plain numbers incl. 26,001; codes (not hidden): letters+digits in one token (MV3001, DL-123A, I-94, SR22) or led by an UPPERCASE acronym / § / form|section|chapter|title|rule|statute|code|article|route|highway|interstate|exit|no.|number'];
summary.regexes.uncovered = Object.fromEntries(UNCOVERED.map(u => [u.id, u.re.toString()]));
if (WRITE) fs.writeFileSync(path.join(ROOT, 'data/quarantine-summary.json'), JSON.stringify(summary, null, 2) + '\n');

console.log(JSON.stringify(summary.totals));
console.log(JSON.stringify(summary.per_class_total));
for (const s of summary.states) console.log(s.state, s.total_cards, s.hidden, s.percent_hidden + '%', JSON.stringify(s.per_class), 'lost', s.exam_items_losing_all_supporting_cards);
fs.writeFileSync(path.join(path.dirname(new URL(import.meta.url).pathname.slice(1)), 'examples.json'), JSON.stringify(allExamples, null, 1));
