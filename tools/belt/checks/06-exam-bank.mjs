// Compensating checks for schemas-strict/06-exambank.schema.json (stage 06.exam_bank, practice-only overlay).
// Restores every parent rule the adapter dropped (see schemas-strict/06-exambank.mapping.json) plus the
// overlay/Order Q §4 rules 1, 5, 6, 15. Pure: no network, no writes, no clock. Every check is ALWAYS emitted
// (a check that has nothing to inspect reports PASS with that evidence; one that needs absent context HOLDs).
import { check, head, isHex64, PROBE_SLUG, numerals, emptyStrings } from '../lib/qa-common.mjs';

export const stage_id = '06.exam_bank';
const P = '06';
export const CHECK_IDS = [
  'ENVELOPE', 'INPUT_MANIFEST', 'ID_INTEGRITY', 'ITEM_BINDING', 'PAGE_OR_DEBT', 'OPTIONS_SHAPE', 'DISTRACTOR_SOURCE',
  'ANSWER_RATIONALE_AGREEMENT', 'BANNED_CLAIMS', 'PRACTICE_LABEL', 'FORM_NUMERALS', 'ITEM_NUMERALS', 'OFFICIAL_MIRROR',
  'SCORING_POLICY', 'DECLARED_COUNT', 'TITLED_PROMISE', 'FORM_OVERLAP', 'DUPLICATE_STEM', 'ITEM_CLONE',
  'NEEDS_REVIEW_ZERO', 'SELF_FLAGGED_RESOLVED', 'DERIVED_PLACEMENT', 'FORM_COUNT', 'MODULE_QUIZ_COVERAGE',
].map(c => `${P}.${c}`);

const BANNED_ITEM = [/\bactual exam\b/i, /\breal test\b/i, /\bleaked\b/i, /\bofficial questions?\b/i];
const BANNED_TITLE = [/\bpredict(s|ive|ion)?\b/i, /\bguarantee[sd]?\b/i, /\bpass (rate|prediction)\b/i];
const FULL_LENGTH = /\b(full|complete|full-length)\b/i;
const OVERLAP_THRESHOLD = 0.2;

const norm = (s) => String(s ?? '').toLowerCase().replace(/[()"'“”‘’.,;:!?]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const itemStrings = (it) => [it.stem, it.correct_rationale, ...(it.options ?? []).flatMap(o => [o.text, o.rationale])];

// Numeral kind by its immediate neighbourhood (count / pass / time / other).
function classifiedNumerals(text) {
  const out = [];
  if (typeof text !== 'string') return out;
  const re = /\d+(?:[.,]\d+)*/g;
  let m;
  while ((m = re.exec(text))) {
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 14);
    const before = text.slice(Math.max(0, m.index - 14), m.index);
    let kind = 'other';
    if (/^\s*-?\s*(questions?|items?|q\b)/i.test(after)) kind = 'count';
    else if (/^\s*-?\s*(minutes?|mins?|hours?|hrs?)\b/i.test(after)) kind = 'time';
    else if (/^\s*(%|percent|correct)/i.test(after) || /(pass(ing)?|score)\s*(at|of|:|=)?\s*$/i.test(before)) kind = 'pass';
    out.push({ token: m[0].replace(/,(?=\d{3}\b)/g, ''), kind });
  }
  return out;
}

function endorsesOther(text, others) {
  if (typeof text !== 'string') return [];
  const hits = [];
  for (const o of others) {
    if (!o.text) continue;
    const t = esc(o.text);
    const pats = [
      new RegExp(`["“']${t}["”']\\s+(is|are)\\s+(the\\s+)?(correct|right)\\b`, 'i'),
      new RegExp(`(correct|right)\\s+answer\\s*(is|:)\\s*["“']?${t}(["”']|\\b)`, 'i'),
      new RegExp(`\\b(option|choice|answer)\\s+${o.key}\\s+(is|are)\\s+(the\\s+)?(correct|right)\\b`, 'i'),
      new RegExp(`(correct|right)\\s+answer\\s*(is|:)\\s*(option\\s+|choice\\s+)?${o.key}\\b`),
    ];
    if (pats.some(p => p.test(text))) hits.push(o.key);
  }
  return hits;
}
const selfEndorses = (r) => typeof r === 'string' && /\b(is|are)\s+(the\s+)?(correct|right)\b/i.test(r) && !/\b(not|wrong|incorrect|isn['’]t|never|no)\b/i.test(r);

function factText(f) {
  if (!f || typeof f !== 'object') return '';
  return [f.statement, f.text, typeof f.value === 'object' ? JSON.stringify(f.value) : f.value, ...(Array.isArray(f.answers) ? f.answers : [])].filter(v => v != null).join(' | ');
}

export function run(a, context = {}) {
  const out = [];
  const items = Array.isArray(a?.items) ? a.items : [];
  const forms = Array.isArray(a?.practice_forms) ? a.practice_forms : [];
  const quizzes = Array.isArray(a?.module_quizzes) ? a.module_quizzes : [];
  const byId = new Map(items.map(i => [i.item_id, i]));
  const registry = context.fact_registry?.facts ?? null;

  // ENVELOPE — restores parent probeSlug pattern + minLength:1 on stamp/refs; hash format.
  {
    const bad = [];
    if (!PROBE_SLUG.test(a?.probe ?? '')) bad.push(`probe ${JSON.stringify(a?.probe)} violates ^[a-z0-9][a-z0-9-]*$`);
    if (!isHex64(a?.input_manifest_sha256)) bad.push('input_manifest_sha256 not 64 lowercase hex');
    const empties = emptyStrings([['/minted_by/model', a?.minted_by?.model], ['/minted_by/lane', a?.minted_by?.lane], ['/minted_by/pass', a?.minted_by?.pass], ['/candidate_lineage_id', a?.candidate_lineage_id], ['/source_refs/knowledge_graph', a?.source_refs?.knowledge_graph]]);
    if (empties.length) bad.push(`empty: ${empties.join(', ')}`);
    out.push(check(`${P}.ENVELOPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : 'probe slug, input_manifest_sha256 format and stamp/ref strings valid'));
  }

  // INPUT_MANIFEST — pre-seal author output binds input_manifest_sha256 (hash-boundary correction).
  if (!isHex64(context.input_manifest_sha256)) out.push(check(`${P}.INPUT_MANIFEST`, 'HOLD', 'context.input_manifest_sha256 absent — input binding cannot be verified'));
  else out.push(check(`${P}.INPUT_MANIFEST`, a?.input_manifest_sha256 === context.input_manifest_sha256 ? 'PASS' : 'FAIL',
    a?.input_manifest_sha256 === context.input_manifest_sha256 ? `input_manifest_sha256 equals bound manifest ${context.input_manifest_sha256.slice(0, 12)}…` : `input_manifest_sha256 ${String(a?.input_manifest_sha256).slice(0, 12)}… != bound ${context.input_manifest_sha256.slice(0, 12)}…`));

  // ID_INTEGRITY — runtime-honest refs: unique ids; every quiz/form item id resolves.
  {
    const dup = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);
    const bad = [];
    const emptyIds = [...items.map(i => i.item_id), ...forms.map(f => f.form_id), ...quizzes.map(q => q.quiz_id)].filter(x => typeof x !== 'string' || !x.trim()).length;
    if (emptyIds) bad.push(`${emptyIds} empty item/form/quiz id(s)`);
    const di = dup(items.map(i => i.item_id)); if (di.length) bad.push(`duplicate item_id: ${head([...new Set(di)])}`);
    const df = dup(forms.map(f => f.form_id)); if (df.length) bad.push(`duplicate form_id: ${df.join(',')}`);
    const dq = dup(quizzes.map(q => q.quiz_id)); if (dq.length) bad.push(`duplicate quiz_id: ${dq.join(',')}`);
    const unresolved = [...forms.flatMap(f => (f.item_ids ?? []).filter(x => !byId.has(x)).map(x => `${f.form_id}:${x}`)), ...quizzes.flatMap(q => (q.item_ids ?? []).filter(x => !byId.has(x)).map(x => `${q.quiz_id}:${x}`))];
    if (unresolved.length) bad.push(`${unresolved.length} unresolved item ref(s): ${head(unresolved)}`);
    const sfUnres = (a?.self_flagged_distractors ?? []).filter(s => !byId.has(s.item_id)).map(s => s.item_id);
    const pdUnres = (a?.page_debt ?? []).filter(s => !byId.has(s.item_id)).map(s => s.item_id);
    if (sfUnres.length) bad.push(`self_flagged_distractors unresolved: ${sfUnres.join(',')}`);
    if (pdUnres.length) bad.push(`page_debt unresolved: ${pdUnres.join(',')}`);
    out.push(check(`${P}.ID_INTEGRITY`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `${items.length} unique items; all ${forms.reduce((n, f) => n + (f.item_ids?.length ?? 0), 0)} form refs and ${quizzes.reduce((n, q) => n + (q.item_ids?.length ?? 0), 0)} quiz refs resolve`, { items: items.length, unresolved: unresolved.length }));
  }

  // ITEM_BINDING — objective/node/module/domain/fact ids per item (restored minLength + overlay binding).
  {
    const bad = [];
    for (const it of items) {
      const e = emptyStrings([['objective_id', it.objective_id], ['node_id', it.node_id], ['module_id', it.module_id], ['domain', it.domain], ['source_ref.ref', it.source_ref?.ref], ['stem', it.stem]]);
      if (!Array.isArray(it.fact_ids) || it.fact_ids.length === 0 || it.fact_ids.some(f => typeof f !== 'string' || !f.trim())) e.push('fact_ids');
      if (e.length) bad.push(`${it.item_id}: ${e.join(',')}`);
    }
    if (bad.length) out.push(check(`${P}.ITEM_BINDING`, 'FAIL', `${bad.length}/${items.length} item(s) missing binding: ${head(bad)}`, { unbound: bad.length }));
    else if (!registry) out.push(check(`${P}.ITEM_BINDING`, 'HOLD', `all ${items.length} items carry objective/node/module/fact ids, but context.fact_registry absent — fact_id resolution not verified`));
    else {
      const unres = items.flatMap(it => it.fact_ids.filter(f => !(f in registry)).map(f => `${it.item_id}:${f}`));
      out.push(check(`${P}.ITEM_BINDING`, unres.length ? 'FAIL' : 'PASS', unres.length ? `${unres.length} fact_id(s) not in fact_registry: ${head(unres)}` : `all ${items.length} items bound; every fact_id resolves in fact_registry`, { unresolved_fact_ids: unres.length }));
    }
  }

  // PAGE_OR_DEBT — every item cites a page, or carries an explicit (verify) page_debt row (debt = HOLD).
  {
    const debt = new Set((a?.page_debt ?? []).map(d => d.item_id));
    const noPage = items.filter(it => it.source_ref?.pdf_page == null && (it.source_ref?.printed_page == null || !String(it.source_ref.printed_page).trim()));
    const badPage = items.filter(it => it.source_ref?.pdf_page != null && !(Number.isInteger(it.source_ref.pdf_page) && it.source_ref.pdf_page >= 1)).map(it => it.item_id);
    const silent = noPage.filter(it => !debt.has(it.item_id)).map(it => it.item_id);
    const stale = items.filter(it => debt.has(it.item_id) && !noPage.includes(it)).map(it => it.item_id);
    const emptyReason = (a?.page_debt ?? []).filter(d => !String(d.reason ?? '').trim()).map(d => d.item_id);
    const fails = [];
    if (silent.length) fails.push(`${silent.length} item(s) with no page and no page_debt: ${head(silent)}`);
    if (badPage.length) fails.push(`pdf_page < 1: ${head(badPage)}`);
    if (stale.length) fails.push(`page_debt on items that cite a page: ${head(stale)}`);
    if (emptyReason.length) fails.push(`page_debt with empty reason: ${head(emptyReason)}`);
    const owed = noPage.length - silent.length;
    out.push(check(`${P}.PAGE_OR_DEBT`, fails.length ? 'FAIL' : owed ? 'HOLD' : 'PASS',
      fails.length ? fails.join(' | ') : owed ? `${owed} item(s) carry open (verify) page debt — acceptance waits on source repair: ${head([...debt])}` : `all ${items.length} items cite a pdf/printed page`, { paged: items.length - noPage.length, page_debt: owed }));
  }

  // OPTIONS_SHAPE — 1 correct + exactly 3 distractors (parent minItems/maxItems 3), keys A–D unique, non-empty.
  {
    const bad = [];
    for (const it of items) {
      const opts = it.options ?? [];
      const keys = opts.map(o => o.key);
      const p = [];
      if (opts.length !== 4) p.push(`${opts.length} options (need 4 = 1 correct + 3 distractors)`);
      if (new Set(keys).size !== keys.length) p.push('duplicate option keys');
      if (!keys.includes(it.correct_key)) p.push(`correct_key ${it.correct_key} not among options`);
      const texts = opts.map(o => String(o.text ?? '').trim());
      if (new Set(texts).size !== texts.length) p.push('duplicate option text');
      const e = emptyStrings([...opts.map(o => [`${o.key}.text`, o.text]), ...opts.map(o => [`${o.key}.rationale`, o.rationale]), ['correct_rationale', it.correct_rationale]]);
      if (e.length) p.push(`empty: ${e.join(',')}`);
      if (p.length) bad.push(`${it.item_id}: ${p.join('; ')}`);
    }
    out.push(check(`${P}.OPTIONS_SHAPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length} item(s): ${head(bad)}` : `all ${items.length} items have 4 keyed options (3 distractors) with per-option rationales`, { bad_items: bad.length }));
  }

  // DISTRACTOR_SOURCE — exactly one non-empty source per distractor (parent distractor_source min/max 3).
  {
    const bad = items.filter(it => !Array.isArray(it.distractor_source) || it.distractor_source.length !== 3 || it.distractor_source.some(s => !String(s ?? '').trim())).map(it => `${it.item_id}(${it.distractor_source?.length ?? 0})`);
    const synth = items.reduce((n, it) => n + (it.distractor_source ?? []).filter(s => /synthes/i.test(s)).length, 0);
    out.push(check(`${P}.DISTRACTOR_SOURCE`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length} item(s) without exactly 3 non-empty distractor sources: ${head(bad)}` : `every item records 3 distractor sources (${synth} labelled synthesized near-miss)`, { synthesized: synth }));
  }

  // ANSWER_RATIONALE_AGREEMENT — correct_rationale endorses correct_key; nothing endorses another option.
  {
    const bad = [];
    for (const it of items) {
      const opts = it.options ?? [];
      const correct = opts.find(o => o.key === it.correct_key);
      if (!correct) { bad.push(`${it.item_id}: correct_key unresolved`); continue; }
      const others = opts.filter(o => o.key !== it.correct_key);
      const p = [];
      const cr = String(it.correct_rationale ?? '');
      const mentions = cr.includes(correct.text) || norm(cr).includes(norm(correct.text)) || new RegExp(`\\b(option|choice|answer)\\s+${correct.key}\\b`).test(cr);
      if (!mentions) p.push('correct_rationale does not name the correct option');
      const e1 = endorsesOther(cr, others); if (e1.length) p.push(`correct_rationale endorses ${e1.join(',')}`);
      const e2 = endorsesOther(correct.rationale, others); if (e2.length) p.push(`correct option rationale endorses ${e2.join(',')}`);
      for (const o of others) {
        if (selfEndorses(o.rationale)) p.push(`distractor ${o.key} rationale affirms it as correct`);
        const e3 = endorsesOther(o.rationale, others.filter(x => x.key !== o.key)); if (e3.length) p.push(`distractor ${o.key} rationale endorses ${e3.join(',')}`);
      }
      if (p.length) bad.push(`${it.item_id}: ${p.join('; ')}`);
    }
    out.push(check(`${P}.ANSWER_RATIONALE_AGREEMENT`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length} item(s): ${head(bad)}` : `all ${items.length} correct rationales name the keyed answer; no rationale endorses another option`, { disagreements: bad.length }));
  }

  // BANNED_CLAIMS — no actual/real/leaked/official-question claims; no prediction; "full" length only when verified.
  {
    const bad = [];
    for (const it of items) for (const s of itemStrings(it)) for (const re of BANNED_ITEM) if (re.test(s ?? '')) bad.push(`${it.item_id}: ${re.source}`);
    for (const f of forms) {
      const verified = f.official_mirror?.status === 'verified';
      for (const s of [f.title, f.overlap_note]) {
        for (const re of [...BANNED_ITEM, ...BANNED_TITLE]) if (re.test(s ?? '')) bad.push(`${f.form_id}: ${re.source}`);
        if (!verified && /\bofficial\b/i.test(s ?? '')) bad.push(`${f.form_id}: "official" on a practice-only form`);
      }
      if (!verified && FULL_LENGTH.test(f.title ?? '')) bad.push(`${f.form_id}: "${f.title}" implies official full length while official_mirror is ${f.official_mirror?.status}`);
    }
    for (const q of quizzes) for (const re of [...BANNED_ITEM, ...BANNED_TITLE]) if (re.test(q.title ?? '')) bad.push(`${q.quiz_id}: ${re.source}`);
    out.push(check(`${P}.BANNED_CLAIMS`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length} banned claim(s): ${head(bad)}` : 'no actual/real/leaked/official-question, prediction or unverified full-length claims in learner strings', { hits: bad.length }));
  }

  // PRACTICE_LABEL — practice labels are mandatory on every form title.
  {
    const bad = forms.filter(f => !/\bpractice\b/i.test(f.title ?? '')).map(f => `${f.form_id}: "${f.title}"`);
    out.push(check(`${P}.PRACTICE_LABEL`, bad.length ? 'FAIL' : 'PASS', bad.length ? `form title(s) without a practice label: ${head(bad)}` : `all ${forms.length} form titles carry a practice label`));
  }

  // FORM_NUMERALS — source-debt numeral leak: a numeral in a form title (or an official-kind numeral in an
  // overlap note) is allowed only where the official fact it would assert has status verified.
  {
    const bad = [];
    for (const f of forms) {
      const om = f.official_mirror ?? {};
      const st = { count: om.n_questions?.status, pass: om.passing?.status, time: om.time?.status };
      const val = { count: om.n_questions?.value, pass: om.passing?.value, time: om.time?.value };
      const allVerified = st.count === 'verified' && st.pass === 'verified' && st.time === 'verified';
      for (const n of classifiedNumerals(f.title)) {
        if (n.kind === 'other') {
          if (!allVerified) bad.push(`${f.form_id} title "${f.title}": numeral ${n.token} beside unverified official facts`);
          else if (![val.count, val.pass, val.time, f.declared_count].map(String).includes(n.token)) bad.push(`${f.form_id} title numeral ${n.token} matches no verified value`);
        } else if (st[n.kind] !== 'verified') bad.push(`${f.form_id} title "${f.title}": ${n.kind} numeral ${n.token} while official ${n.kind === 'count' ? 'n_questions' : n.kind === 'pass' ? 'passing' : 'time'}.status=${st[n.kind]} (source-debt numeral leak)`);
        else if (n.kind !== 'count' && String(val[n.kind]) !== n.token) bad.push(`${f.form_id} title ${n.kind} numeral ${n.token} != verified ${val[n.kind]}`);
      }
      for (const n of classifiedNumerals(f.overlap_note)) {
        if ((n.kind === 'pass' || n.kind === 'time') && st[n.kind] !== 'verified') bad.push(`${f.form_id} overlap_note: ${n.kind} numeral ${n.token} while official status ${st[n.kind]}`);
      }
    }
    out.push(check(`${P}.FORM_NUMERALS`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `no form-level numeral asserts an unverified official fact (${forms.length} forms)`, { leaks: bad.length }));
  }

  // ITEM_NUMERALS — every numeral in a stem / correct option / rationale (and non-count numerals in quiz
  // titles) must be anchored in a VERIFIED fact bound to that surface. Distractor option texts are exempt
  // (presented as wrong); distractor rationales may also echo the item's own option numerals.
  {
    const surfaces = [];
    for (const it of items) {
      const correct = (it.options ?? []).find(o => o.key === it.correct_key);
      const optNums = new Set((it.options ?? []).flatMap(o => numerals(o.text)));
      const strict = [['stem', it.stem], ['correct option', correct?.text], ['correct_rationale', it.correct_rationale], ['correct option rationale', correct?.rationale]];
      const loose = (it.options ?? []).filter(o => o.key !== it.correct_key).map(o => [`${o.key} rationale`, o.rationale]);
      surfaces.push({ id: it.item_id, fact_ids: it.fact_ids ?? [], strict, loose, optNums });
    }
    for (const q of quizzes) {
      const fids = [...new Set((q.item_ids ?? []).flatMap(x => byId.get(x)?.fact_ids ?? []))];
      const txt = classifiedNumerals(q.title).filter(n => n.kind !== 'count').map(n => n.token).join(' ');
      surfaces.push({ id: q.quiz_id, fact_ids: fids, strict: [['title', txt]], loose: [], optNums: new Set() });
    }
    const withNums = surfaces.filter(s => [...s.strict, ...s.loose].some(([, t]) => numerals(t).length));
    if (!withNums.length) out.push(check(`${P}.ITEM_NUMERALS`, 'PASS', 'no numerals in item/quiz learner strings'));
    else if (!registry) out.push(check(`${P}.ITEM_NUMERALS`, 'HOLD', `${withNums.length} surface(s) carry numerals but context.fact_registry absent — fact status cannot be verified`));
    else {
      const bad = [];
      for (const s of withNums) {
        const facts = s.fact_ids.map(f => registry[f]).filter(Boolean);
        const verifiedNums = new Set(facts.filter(f => f.status === 'verified').flatMap(f => numerals(factText(f))));
        const debtNums = new Set(facts.filter(f => f.status !== 'verified').flatMap(f => numerals(factText(f))));
        const miss = [];
        for (const [where, t] of s.strict) for (const n of numerals(t)) if (!verifiedNums.has(n)) miss.push(`${where} ${n}${debtNums.has(n) ? ' (source-debt fact)' : ' (unanchored)'}`);
        for (const [where, t] of s.loose) for (const n of numerals(t)) if (!verifiedNums.has(n) && !s.optNums.has(n)) miss.push(`${where} ${n}${debtNums.has(n) ? ' (source-debt fact)' : ' (unanchored)'}`);
        if (miss.length) bad.push(`${s.id}: ${[...new Set(miss)].join(', ')}`);
      }
      out.push(check(`${P}.ITEM_NUMERALS`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length}/${withNums.length} surface(s) with numerals not anchored in a verified bound fact: ${head(bad, 10)}` : `all numerals on ${withNums.length} surface(s) anchored in verified bound facts`, { surfaces_with_numerals: withNums.length, failing: bad.length }));
    }
  }

  // OFFICIAL_MIRROR — verified ⇒ page-bound non-null facts and exact mirror; unknown ⇒ value null (no hint).
  {
    const bad = [];
    let needsView = false;
    const view = context.exam_facts_view ?? null;
    for (const f of forms) {
      const om = f.official_mirror ?? {};
      for (const k of ['n_questions', 'passing', 'time']) {
        const r = om[k] ?? {};
        if (r.status === 'verified' && (r.value == null || !String(r.source_page ?? '').trim())) bad.push(`${f.form_id}.${k}: verified without value + source_page`);
        if (r.status === 'unknown' && r.value != null) bad.push(`${f.form_id}.${k}: status unknown but value ${r.value} emitted (numeric hint is not a fact)`);
        if (r.status === 'verified') {
          needsView = true;
          const ref = view?.by_form?.[f.form_id]?.[k] ?? view?.[k];
          if (view && (!ref || ref.status !== 'verified' || ref.value !== r.value)) bad.push(`${f.form_id}.${k}: verified ${r.value} not confirmed by exam_facts_view (${ref ? `${ref.status}/${ref.value}` : 'absent'})`);
        }
      }
      if (om.status === 'verified') {
        if (om.n_questions?.status !== 'verified' || om.passing?.status !== 'verified') bad.push(`${f.form_id}: official_mirror verified but n_questions/passing not both verified`);
        if (om.n_questions?.value != null && f.declared_count !== om.n_questions.value) bad.push(`${f.form_id}: mirror n_questions ${om.n_questions.value} != declared_count ${f.declared_count}`);
        if (om.passing_unit === 'unknown') bad.push(`${f.form_id}: verified mirror with passing_unit unknown`);
      }
      if (om.passing?.value != null) {
        if (om.passing_unit === 'correct_count' && (om.passing.value < 0 || om.passing.value > f.declared_count)) bad.push(`${f.form_id}: passing ${om.passing.value} correct outside 0..${f.declared_count}`);
        if (om.passing_unit === 'percent_correct' && (om.passing.value < 0 || om.passing.value > 100)) bad.push(`${f.form_id}: passing ${om.passing.value}% outside 0..100`);
      }
      if (om.n_questions?.value != null && !(om.n_questions.value >= 1)) bad.push(`${f.form_id}: n_questions < 1`);
    }
    const st = bad.length ? 'FAIL' : needsView && !view ? 'HOLD' : 'PASS';
    out.push(check(`${P}.OFFICIAL_MIRROR`, st, bad.length ? head(bad) : st === 'HOLD' ? 'forms assert verified official facts but context.exam_facts_view absent — cannot confirm' : `official mirror records consistent on ${forms.length} forms (${forms.filter(f => f.official_mirror?.status === 'verified').length} verified, ${forms.filter(f => f.official_mirror?.status !== 'verified').length} practice-only)`));
  }

  // SCORING_POLICY — product_policy by LearningLoop ref; never an official passing claim.
  {
    const refs = [...new Set(forms.map(f => f.scoring_policy?.learning_loop_ref))];
    const empty = forms.filter(f => !String(f.scoring_policy?.learning_loop_ref ?? '').trim()).map(f => f.form_id);
    const want = context.learning_loop?.ref;
    if (empty.length) out.push(check(`${P}.SCORING_POLICY`, 'FAIL', `forms without learning_loop_ref: ${empty.join(',')}`));
    else if (!want) out.push(check(`${P}.SCORING_POLICY`, 'HOLD', 'context.learning_loop.ref absent — product-policy binding cannot be verified'));
    else {
      const wrong = forms.filter(f => f.scoring_policy.learning_loop_ref !== want).map(f => `${f.form_id}:${f.scoring_policy.learning_loop_ref}`);
      out.push(check(`${P}.SCORING_POLICY`, wrong.length ? 'FAIL' : 'PASS', wrong.length ? `learning_loop_ref mismatch vs ${want}: ${head(wrong)}` : `all forms score by product policy ${want}`, { distinct_refs: refs.length }));
    }
  }

  // DECLARED_COUNT — Order Q rule 15: declared_count == served item ids; >=1; no repeated id in a form.
  {
    const bad = forms.flatMap(f => {
      const ids = f.item_ids ?? [];
      const p = [];
      if (f.declared_count !== ids.length) p.push(`${f.form_id}: declared_count ${f.declared_count} != ${ids.length} item_ids`);
      if (!(f.declared_count >= 1)) p.push(`${f.form_id}: declared_count < 1`);
      if (new Set(ids).size !== ids.length) p.push(`${f.form_id}: repeated item id within form`);
      return p;
    });
    out.push(check(`${P}.DECLARED_COUNT`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `declared_count equals served item ids on all ${forms.length} forms`));
  }

  // TITLED_PROMISE — rule 15: any count in a form/quiz title equals the actual served count.
  {
    const bad = [];
    for (const f of forms) for (const n of classifiedNumerals(f.title)) if (n.kind === 'count' && Number(n.token) !== (f.item_ids ?? []).length) bad.push(`${f.form_id} "${f.title}" promises ${n.token}, serves ${(f.item_ids ?? []).length}`);
    for (const q of quizzes) for (const n of classifiedNumerals(q.title)) if (n.kind === 'count' && Number(n.token) !== (q.item_ids ?? []).length) bad.push(`${q.quiz_id} "${q.title}" promises ${n.token}, serves ${(q.item_ids ?? []).length}`);
    out.push(check(`${P}.TITLED_PROMISE`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : 'every countable title promise equals served content'));
  }

  // FORM_OVERLAP — rule 5: pairwise overlap > 20% requires learner-visible notes on both forms; note claims asserted.
  {
    const bad = [];
    const pairs = [];
    for (let i = 0; i < forms.length; i++) for (let j = i + 1; j < forms.length; j++) {
      const A = forms[i], B = forms[j];
      const sa = new Set(A.item_ids ?? []);
      const shared = (B.item_ids ?? []).filter(x => sa.has(x)).length;
      const denom = Math.min((A.item_ids ?? []).length, (B.item_ids ?? []).length) || 1;
      const ratio = shared / denom;
      pairs.push({ a: A.form_id, b: B.form_id, shared, pct: Math.round(ratio * 100) });
      if (ratio > OVERLAP_THRESHOLD) for (const F of [A, B]) if (!String(F.overlap_note ?? '').trim()) bad.push(`${A.form_id}×${B.form_id} share ${shared} (${Math.round(ratio * 100)}%) but ${F.form_id}.overlap_note is null`);
    }
    for (const f of forms) {
      const note = f.overlap_note; if (!note) continue;
      const mine = pairs.filter(p => p.a === f.form_id || p.b === f.form_id);
      if (/\b(no|zero|without)\s+(item\s+)?(overlap|reuse|repeat)|non[- ]?overlapping|\bunique\b/i.test(note) && mine.some(p => p.shared > 0)) bad.push(`${f.form_id}.overlap_note claims no overlap but shares ${mine.filter(p => p.shared > 0).map(p => `${p.shared} with ${p.a === f.form_id ? p.b : p.a}`).join(', ')}`);
      for (const m of note.matchAll(/(\d+)\s*(%|percent)/gi)) if (!mine.some(p => p.pct === Number(m[1]))) bad.push(`${f.form_id}.overlap_note claims ${m[1]}% overlap; actual ${mine.map(p => p.pct + '%').join('/')}`);
      for (const m of note.matchAll(/(\d+)\s+(shared|reused|repeated|overlapping)/gi)) if (!mine.some(p => p.shared === Number(m[1]))) bad.push(`${f.form_id}.overlap_note claims ${m[1]} ${m[2]}; actual ${mine.map(p => p.shared).join('/')}`);
    }
    out.push(check(`${P}.FORM_OVERLAP`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `pairwise overlap ${pairs.map(p => `${p.a}×${p.b}=${p.shared}(${p.pct}%)`).join(', ') || 'n/a'}; disclosures present where >20%`, { pairs: pairs.length, max_overlap_pct: pairs.reduce((m, p) => Math.max(m, p.pct), 0) }));
  }

  // DUPLICATE_STEM — same normalized stem AND same correct answer = duplicate item (generic shared
  // instruction stems with different answers are allowed and reported).
  {
    const m = new Map();
    for (const it of items) { const c = (it.options ?? []).find(o => o.key === it.correct_key)?.text; const k = `${norm(it.stem)}||${norm(c)}`; m.set(k, [...(m.get(k) ?? []), it.item_id]); }
    const dups = [...m.values()].filter(v => v.length > 1).map(v => v.join('='));
    const sameStem = new Map(); for (const it of items) { const k = norm(it.stem); sameStem.set(k, (sameStem.get(k) ?? 0) + 1); }
    const shared = [...sameStem.values()].filter(n => n > 1).length;
    out.push(check(`${P}.DUPLICATE_STEM`, dups.length ? 'FAIL' : 'PASS', dups.length ? `duplicate stem+answer: ${head(dups)}` : `no duplicate stem+answer pairs (${shared} shared instruction stem(s) with distinct answers)`, { duplicates: dups.length, shared_instruction_stems: shared }));
  }

  // ITEM_CLONE — rule 6: identical correct + distractor set + rationale regardless of stem.
  {
    const m = new Map();
    for (const it of items) {
      const opts = it.options ?? [];
      const c = opts.find(o => o.key === it.correct_key)?.text ?? '';
      const d = opts.filter(o => o.key !== it.correct_key).map(o => o.text).sort();
      const k = JSON.stringify([c.trim(), d.map(x => String(x).trim()), String(it.correct_rationale ?? '').trim()]);
      m.set(k, [...(m.get(k) ?? []), it.item_id]);
    }
    const clones = [...m.values()].filter(v => v.length > 1).map(v => v.join('='));
    out.push(check(`${P}.ITEM_CLONE`, clones.length ? 'FAIL' : 'PASS', clones.length ? `clone groups: ${head(clones)}` : `no clones among ${items.length} items`, { clone_groups: clones.length }));
  }

  // NEEDS_REVIEW_ZERO — rule 1: honest count and zero for acceptance.
  {
    const flagged = items.filter(it => it.needs_review === true).map(it => it.item_id);
    const p = [];
    if (a?.needs_review_count !== flagged.length) p.push(`needs_review_count ${a?.needs_review_count} != actual ${flagged.length}`);
    if (flagged.length) p.push(`${flagged.length} served item(s) needs_review:true: ${head(flagged, 20)}`);
    out.push(check(`${P}.NEEDS_REVIEW_ZERO`, p.length ? 'FAIL' : 'PASS', p.length ? p.join(' | ') : 'needs_review_count 0 and no served item flagged', { needs_review: flagged.length }));
  }

  // SELF_FLAGGED_RESOLVED — rule 1: no unresolved self-flagged distractor; flags consistent with the list.
  {
    const list = a?.self_flagged_distractors ?? [];
    const listed = new Set(list.map(s => s.item_id));
    const flaggedItems = items.filter(it => it.self_flagged === true).map(it => it.item_id);
    const p = [];
    const incons = [...flaggedItems.filter(x => !listed.has(x)).map(x => `${x} flagged but not listed`), ...[...listed].filter(x => byId.has(x) && byId.get(x).self_flagged !== true).map(x => `${x} listed but self_flagged false`)];
    const onCorrect = list.filter(s => byId.get(s.item_id)?.correct_key === s.option_key).map(s => s.item_id);
    const emptyWhy = list.filter(s => !String(s.why_possibly_correct ?? '').trim()).map(s => s.item_id);
    if (incons.length) p.push(`inconsistent: ${head(incons)}`);
    if (onCorrect.length) p.push(`flag targets the correct option: ${onCorrect.join(',')}`);
    if (emptyWhy.length) p.push(`empty why_possibly_correct: ${emptyWhy.join(',')}`);
    const unresolved = new Set([...flaggedItems, ...listed]);
    if (unresolved.size) p.push(`${unresolved.size} unresolved self-flagged distractor item(s) served: ${head([...unresolved], 20)}`);
    out.push(check(`${P}.SELF_FLAGGED_RESOLVED`, p.length ? 'FAIL' : 'PASS', p.length ? p.join(' | ') : 'no unresolved self-flagged distractors', { unresolved: unresolved.size }));
  }

  // DERIVED_PLACEMENT — derived items stay in module quizzes unless a bound exam-policy disposition allows forms.
  {
    const derivedInForms = forms.flatMap(f => (f.item_ids ?? []).filter(x => byId.get(x)?.is_derived === true).map(x => `${f.form_id}:${x}`));
    const disp = a?.derived_in_forms_disposition_ref ?? null;
    let st = 'PASS', ev = `no derived items in practice forms (${items.filter(i => i.is_derived).length} derived items total)`;
    if (derivedInForms.length) {
      if (!disp) { st = 'FAIL'; ev = `${derivedInForms.length} derived item(s) in forms without derived_in_forms_disposition_ref: ${head(derivedInForms)}`; }
      else if (!context.exam_policy_disposition_ref) { st = 'HOLD'; ev = `derived items in forms cite ${disp} but context.exam_policy_disposition_ref absent`; }
      else if (disp !== context.exam_policy_disposition_ref) { st = 'FAIL'; ev = `derived_in_forms_disposition_ref ${disp} != bound ${context.exam_policy_disposition_ref}`; }
      else ev = `${derivedInForms.length} derived item(s) in forms under bound disposition ${disp}`;
    }
    out.push(check(`${P}.DERIVED_PLACEMENT`, st, ev));
  }

  // FORM_COUNT — parent mock_exams minItems:2 (a retake is a real retest).
  out.push(check(`${P}.FORM_COUNT`, forms.length >= 2 ? 'PASS' : 'FAIL', `${forms.length} practice form(s) (need >= 2)`));

  // MODULE_QUIZ_COVERAGE — one quiz per declared module; quiz items belong to that module; quiz strings non-empty.
  {
    const declared = context.accepted_inputs?.module_ids;
    const bad = [];
    for (const q of quizzes) {
      const e = emptyStrings([['module_id', q.module_id], ['domain', q.domain], ['title', q.title]]);
      if (e.length) bad.push(`${q.quiz_id}: empty ${e.join(',')}`);
      const foreign = (q.item_ids ?? []).filter(x => byId.has(x) && byId.get(x).module_id !== q.module_id);
      if (foreign.length) bad.push(`${q.quiz_id}: ${foreign.length} item(s) from another module (${head(foreign, 4)})`);
      if (!(q.item_ids ?? []).length) bad.push(`${q.quiz_id}: empty quiz`);
    }
    if (Array.isArray(declared)) {
      const counts = new Map(); for (const q of quizzes) counts.set(q.module_id, (counts.get(q.module_id) ?? 0) + 1);
      const missing = declared.filter(mid => !counts.has(mid));
      const multi = [...counts].filter(([, n]) => n > 1).map(([m]) => m);
      const undeclared = [...counts.keys()].filter(mid => !declared.includes(mid));
      if (missing.length) bad.push(`declared module(s) without quiz: ${head(missing)}`);
      if (multi.length) bad.push(`module(s) with >1 quiz: ${multi.join(',')}`);
      if (undeclared.length) bad.push(`quiz for undeclared module(s): ${undeclared.join(',')}`);
    }
    const st = bad.length ? 'FAIL' : Array.isArray(declared) ? 'PASS' : 'HOLD';
    out.push(check(`${P}.MODULE_QUIZ_COVERAGE`, st, bad.length ? head(bad) : st === 'HOLD' ? `${quizzes.length} quizzes internally consistent, but context.accepted_inputs.module_ids absent — one-quiz-per-module not verified` : `${quizzes.length} quizzes = one per ${declared.length} declared modules; all quiz items in-module`));
  }

  return out;
}
