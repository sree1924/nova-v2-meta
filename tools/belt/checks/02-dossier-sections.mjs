// Compensating checks for stage 02.dossier_sections (adapter schemas-strict/02-sme-dossier-envelope.schema.json).
// Pure: no network, no writes, no clock. Every check returns {check_id, status, evidence, metrics?}.
// The parametric-knowledge ban ("a claim must be stated on the cited snapshot page") is a DOCUMENTED requirement
// recorded in the mapping file; it is not machine-checkable here and no check claims to enforce it.
import { sha256Bytes } from '../lib/hash.mjs';

export const stage_id = '02.dossier_sections';
export const CONTRACT_MAX_SECTION_CHARS = 12000;          // code points; a chunk at/above the cap is treated as truncated
export const SECTION_IDS = ['A', 'B', 'C', 'C2', 'D', 'E', 'E2', 'F', 'G'];
export const G_BOXES = ['G01_domains_covered', 'G02_passing_standard_exact', 'G03_high_yield_ranked', 'G04_misconceptions',
  'G05_mnemonics', 'G06_glossary', 'G07_dynamic_isolated', 'G08_competitive_teardown', 'G09_market_pack',
  'G10_accuracy_sourced', 'G11_verify_list_consolidated'];
const LEARNER_FACING_REQUIRED = new Set(['A', 'C']);      // exam info + knowledge feed learner surfaces
const EXAM_FACT_KEYS = ['exam_name', 'issuing_body', 'edition', 'effective_date', 'question_bank_size', 'n_questions', 'passing_standard', 'format', 'time_limit'];

const P = 'PASS', F = 'FAIL', H = 'HOLD';
const chk = (id, status, evidence, metrics) => (metrics ? { check_id: `02.${id}`, status, evidence, metrics } : { check_id: `02.${id}`, status, evidence });
const arr = (v) => (Array.isArray(v) ? v : []);
const cp = (s) => [...(s ?? '')].length;
const head = (list, n = 8) => list.slice(0, n).join('; ') + (list.length > n ? `; … (+${list.length - n} more)` : '');
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ---------- deterministic merge (exported; role 16 uses the same rule) ----------
export function mergeSections(sections) {
  const ordered = [...arr(sections)].sort((a, b) => a.merge_seq - b.merge_seq);
  const markdown = ordered.map(s => s.markdown ?? '').join('');
  return { markdown, sha256: sha256Bytes(Buffer.from(markdown, 'utf8')), order: ordered.map(s => s.chunk_id) };
}

export function mergeEnvelopes(envelopes) {
  const errors = [];
  const all = [];
  const seenChunk = new Map();
  const seenSeq = new Map();
  const factVals = new Map();
  const registryShas = new Set();
  for (const [i, env] of arr(envelopes).entries()) {
    if (env?.lineage?.source_registry_sha256) registryShas.add(env.lineage.source_registry_sha256);
    for (const s of arr(env?.sections)) {
      if (seenChunk.has(s.chunk_id)) errors.push(`duplicate chunk_id ${s.chunk_id} (envelopes ${seenChunk.get(s.chunk_id)} and ${i})`);
      else seenChunk.set(s.chunk_id, i);
      if (seenSeq.has(s.merge_seq)) errors.push(`duplicate merge_seq ${s.merge_seq} (${seenSeq.get(s.merge_seq)} vs ${s.chunk_id})`);
      else seenSeq.set(s.merge_seq, s.chunk_id);
      all.push(s);
    }
    for (const k of EXAM_FACT_KEYS) {
      const f = env?.exam_facts?.[k];
      if (!f) continue;
      const sig = JSON.stringify([f.value, f.status, f.source_page]);
      if (factVals.has(k) && factVals.get(k) !== sig) errors.push(`conflicting exam_facts.${k} across envelopes: ${factVals.get(k)} vs ${sig}`);
      else factVals.set(k, sig);
    }
  }
  if (registryShas.size > 1) errors.push(`conflicting source_registry_sha256 across envelopes: ${[...registryShas].join(', ')}`);
  const present = new Set(all.map(s => s.section_id));
  const missing = SECTION_IDS.filter(id => !present.has(id));
  if (missing.length) errors.push(`merged dossier missing section(s) ${missing.join(',')}`);
  const seqs = all.map(s => s.merge_seq).sort((a, b) => a - b);
  seqs.forEach((v, idx) => { if (v !== idx + 1) errors.push(`merge_seq not contiguous at position ${idx + 1} (found ${v})`); });
  const merged = mergeSections(all);
  return { ok: errors.length === 0, errors: [...new Set(errors)], ...merged };
}

// ---------- registry resolution ----------
// A source_page is "<source_code>[#<locator>]". The base code resolves against registry.pages keys, or
// registry.sources[].{page_id, source_page, id, source_ref, blueprint_s_code}. Page locators within a registered
// source are accepted (the V1 SourceRegistry is source-level, not page-level).
export function registryCodes(registry) {
  const codes = new Set();
  if (!registry || typeof registry !== 'object') return codes;
  if (registry.pages && typeof registry.pages === 'object') {
    for (const k of Array.isArray(registry.pages) ? registry.pages.map(p => p?.page_id ?? p?.id) : Object.keys(registry.pages)) if (k) codes.add(String(k));
  }
  for (const s of arr(registry.sources)) for (const k of ['page_id', 'source_page', 'id', 'source_ref', 'blueprint_s_code']) if (s?.[k]) codes.add(String(s[k]));
  return codes;
}
export const pageRegistered = (page, codes) => !!page && (codes.has(page) || codes.has(String(page).split('#')[0]));

// ---------- line classification ----------
function isFactBearing(line, anchorIds) {
  if (/^\s*#{1,6}\s/.test(line)) return false;                       // structural headings are labels, not claims
  let s = line;
  for (const id of anchorIds) s = s.split(`[${id}]`).join(' ');
  s = s.replace(/https?:\/\/\S+/g, ' ');                              // URLs
  s = s.replace(/\b[A-Za-z]{1,4}-?\d+[a-z]?\b/g, ' ');                 // id tokens: Q12, S5a, VD-1, AF-3, U1, M-1778, N-400, FY2024
  s = s.replace(/(^|\s)\d+[.)](?=\s)/g, ' ');                          // list ordinals "1)" "2."
  if (/^\s*\|?[\s:|-]+\|?\s*$/.test(s)) return false;                 // table separator rows
  return /\d/.test(s);
}
const isContinuation = (line) => /^\s*([-*+]\s|\d+\.\s|\|)/.test(line);

export function uncitedFactLines(section, openDebtIds) {
  const anchorIds = arr(section.source_anchors).map(a => a.anchor_id).filter(Boolean);
  const hasAnchor = (line) => anchorIds.some(id => line.includes(`[${id}]`));
  const debtRe = openDebtIds.length ? new RegExp(`(^|[^A-Za-z0-9-])(${openDebtIds.map(escapeRe).join('|')})(?![A-Za-z0-9])`) : null;
  const out = [];
  let lead = null; let inFence = false; let factLines = 0;
  // Fact-block lead: "FACT_ID: <id> | anchor: Axx" with a declared anchor covers the block's lines until the next blank line
  // (output-conventions.json, 02 citations). A "Source: [Axx -> page]" trailer is itself anchored.
  const blockLeadRe = /^\s*FACT_ID:\s*\S+\s*\|\s*anchor:\s*([A-Za-z0-9_-]+)\s*$/;
  let blockAnchored = false;
  const lines = (section.markdown ?? '').split('\n');
  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    if (line.trim() === '') { lead = null; blockAnchored = false; return; }
    const bl = line.match(blockLeadRe);
    if (bl) { blockAnchored = anchorIds.includes(bl[1]); }
    const cont = isContinuation(line);
    if (!cont) lead = line;                        // lead = nearest preceding non-list/non-table line in the same block
    if (!isFactBearing(line, anchorIds)) return;
    factLines++;
    if (hasAnchor(line)) return;
    if (blockAnchored) return;
    if (cont && lead !== null && hasAnchor(lead)) return;
    if (/\(verify/i.test(line) && debtRe && debtRe.test(line)) return;
    out.push(`${section.chunk_id}:L${i + 1}${/\(verify/i.test(line) ? '(verify-without-open-debt-id)' : ''}`);
  });
  return { uncited: out, factLines };
}

// ---------- the checks ----------
export function run(artifact, context = {}) {
  const a = artifact ?? {};
  const sections = arr(a.sections);
  const chunkById = new Map(sections.map(s => [s.chunk_id, s]));
  const debts = arr(a.verification_debt);
  const debtIds = new Set(debts.map(d => d.claim_id));
  const openDebtIds = debts.filter(d => d.resolution_artifact_ref == null).map(d => d.claim_id).filter(Boolean);
  const registry = context.source_registry;
  const codes = registry ? registryCodes(registry) : null;
  const out = [];

  // PROBE_SLUG — parent $defs/probeSlug pattern restored.
  out.push(/^[a-z0-9][a-z0-9-]*$/.test(a.probe ?? '') ? chk('PROBE_SLUG', P, `probe "${a.probe}" matches ^[a-z0-9][a-z0-9-]*$`)
    : chk('PROBE_SLUG', F, `probe "${a.probe}" violates ^[a-z0-9][a-z0-9-]*$`));

  // LINEAGE — hash-boundary rule: pre-seal author outputs echo input_manifest_sha256, never a final candidate digest.
  if (!context.input_manifest_sha256) out.push(chk('LINEAGE', H, 'context.input_manifest_sha256 absent; cannot bind envelope to its scoped input manifest'));
  else if (a.lineage?.input_manifest_sha256 !== context.input_manifest_sha256) out.push(chk('LINEAGE', F, `lineage.input_manifest_sha256=${a.lineage?.input_manifest_sha256} != context ${context.input_manifest_sha256}`));
  else if (!a.lineage?.candidate_lineage_id) out.push(chk('LINEAGE', F, 'lineage.candidate_lineage_id is null; pre-seal outputs must carry candidate_lineage_id'));
  else out.push(chk('LINEAGE', P, `input_manifest_sha256 matches context; candidate_lineage_id=${a.lineage.candidate_lineage_id}`));

  // CHUNK_IDENTITY — unique chunk ids, contiguous merge_seq, sane chunk index (restores parent minItems on content).
  {
    const errs = [];
    if (sections.length === 0) errs.push('sections[] is empty');
    const ids = sections.map(s => s.chunk_id);
    const dupIds = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dupIds.length) errs.push(`duplicate chunk_id: ${[...new Set(dupIds)].join(',')}`);
    if (ids.some(v => !v)) errs.push('empty chunk_id');
    const seqs = sections.map(s => s.merge_seq).sort((x, y) => x - y);
    const badSeq = seqs.filter((v, i) => v !== i + 1);
    if (badSeq.length) errs.push(`merge_seq must be 1..${sections.length} unique; got [${seqs.join(',')}]`);
    const sc = a.envelope_scope ?? {};
    if (!(Number.isInteger(sc.chunk_index) && Number.isInteger(sc.chunk_total) && sc.chunk_index >= 1 && sc.chunk_index <= sc.chunk_total)) errs.push(`envelope_scope chunk_index/chunk_total invalid (${sc.chunk_index}/${sc.chunk_total})`);
    if (sc.kind === 'complete_dossier' && !(sc.chunk_index === 1 && sc.chunk_total === 1)) errs.push('complete_dossier must be chunk 1/1');
    out.push(errs.length ? chk('CHUNK_IDENTITY', F, errs.join('; ')) : chk('CHUNK_IDENTITY', P, `${sections.length} chunks, merge_seq 1..${sections.length} contiguous, ids unique`));
  }

  // SCOPE_COMPLETENESS — an incomplete chunk cannot be mistaken for the complete dossier.
  {
    const sc = a.envelope_scope ?? {};
    const present = [...new Set(sections.map(s => s.section_id))];
    const assigned = [...new Set(arr(sc.assigned_section_ids))];
    const errs = [];
    if (sc.kind === 'complete_dossier') {
      const missing = SECTION_IDS.filter(id => !present.includes(id));
      if (missing.length) errs.push(`complete_dossier missing section(s): ${missing.join(',')}`);
      const unassigned = SECTION_IDS.filter(id => !assigned.includes(id));
      if (unassigned.length) errs.push(`complete_dossier assigned_section_ids lacks ${unassigned.join(',')}`);
    } else {
      const extra = present.filter(id => !assigned.includes(id));
      const absent = assigned.filter(id => !present.includes(id));
      if (!assigned.length) errs.push('partial_chunk declares no assigned_section_ids');
      if (extra.length) errs.push(`chunk carries unassigned section(s) ${extra.join(',')}`);
      if (absent.length) errs.push(`assigned section(s) ${absent.join(',')} have no chunk`);
    }
    out.push(errs.length ? chk('SCOPE_COMPLETENESS', F, errs.join('; '), { sections_present: present.join(',') })
      : chk('SCOPE_COMPLETENESS', P, `${sc.kind}: sections present ${present.join(',')}`));
  }

  // SECTION_BOUNDS — truncation guard part 1: declared vs computed size, hard cap.
  {
    const limit = Math.min(Number.isInteger(a.section_char_limit) && a.section_char_limit > 0 ? a.section_char_limit : CONTRACT_MAX_SECTION_CHARS, CONTRACT_MAX_SECTION_CHARS);
    const errs = []; const selfCountMismatch = [];
    let maxSeen = 0;
    for (const s of sections) {
      const n = cp(s.markdown);                     // the validator's count is authoritative; the model's char_count is advisory
      maxSeen = Math.max(maxSeen, n);
      if (n === 0) errs.push(`${s.chunk_id} empty markdown`);
      if (s.char_count !== n) selfCountMismatch.push(`${s.chunk_id} declared ${s.char_count} vs computed ${n}`);
      if (n >= limit) errs.push(`${s.chunk_id} ${n} code points >= cap ${limit} (treated as truncated)`);
    }
    if (a.section_char_limit > CONTRACT_MAX_SECTION_CHARS) errs.push(`declared section_char_limit ${a.section_char_limit} exceeds contract max ${CONTRACT_MAX_SECTION_CHARS}`);
    const metrics = { effective_limit: limit, max_chunk_chars: maxSeen, self_count_mismatches: selfCountMismatch.length };
    out.push(errs.length ? chk('SECTION_BOUNDS', F, head(errs), metrics)
      : chk('SECTION_BOUNDS', P, `all ${sections.length} chunks < ${limit} code points (computed)${selfCountMismatch.length ? `; self-reported char_count off on ${selfCountMismatch.length}: ${head(selfCountMismatch)}` : '; char_count exact'}`, metrics));
  }

  // TRUNCATION_GUARD — part 2: structural balance + clean ending.
  {
    const errs = [];
    for (const s of sections) {
      const md = s.markdown ?? '';
      const fences = (md.match(/^\s*```/gm) ?? []).length;
      if (fences % 2) errs.push(`${s.chunk_id} unclosed code fence`);
      const bold = md.split('**').length - 1;
      if (bold % 2) errs.push(`${s.chunk_id} unbalanced ** (${bold})`);
      const ob = (md.match(/\[/g) ?? []).length, cb = (md.match(/\]/g) ?? []).length;
      if (ob !== cb) errs.push(`${s.chunk_id} unbalanced brackets [${ob} vs ]${cb}`);
      if (md.length && !/(\n|[.!?)\]|`*"”'])$/.test(md)) errs.push(`${s.chunk_id} ends mid-token: …${JSON.stringify(md.slice(-24))}`);
    }
    out.push(errs.length ? chk('TRUNCATION_GUARD', F, head(errs)) : chk('TRUNCATION_GUARD', P, `${sections.length} chunks balanced (fences, **, brackets) and end cleanly`));
  }

  // MERGE_DETERMINISTIC — merge(sections) is order-independent and reproduces the declared dossier hash; sibling chunks merge without conflict.
  {
    const m1 = mergeSections(sections);
    const m2 = mergeSections([...sections].reverse());
    const errs = [];
    if (m1.sha256 !== m2.sha256) errs.push('merge differs with input order');
    // expected_merged_sha256 names the FULL merged dossier: compared to this envelope's own merge when it is a
    // complete_dossier, and to the cross-envelope merge when sibling envelopes are supplied for a partial_chunk.
    // A generator cannot hash its own output: null or 64 zeros means "not computed" (output-conventions.json); the validator
    // computes and records the merged hash. Only a real declared hash is compared.
    const expRaw = a.merge?.expected_merged_sha256;
    const exp = typeof expRaw === 'string' && /^[a-f0-9]{64}$/.test(expRaw) && !/^0{64}$/.test(expRaw) ? expRaw : null;
    const partial = a.envelope_scope?.kind === 'partial_chunk';
    if (exp && !partial && exp !== m1.sha256) errs.push(`expected_merged_sha256 ${exp} != computed ${m1.sha256}`);
    let siblingNote = '';
    const hasSib = Array.isArray(context.sibling_envelopes) && context.sibling_envelopes.length > 0;
    if (hasSib) {
      const mm = mergeEnvelopes([a, ...context.sibling_envelopes]);
      if (!mm.ok) errs.push(...mm.errors);
      if (exp && partial && exp !== mm.sha256) errs.push(`expected_merged_sha256 ${exp} != cross-envelope merge ${mm.sha256}`);
      siblingNote = `; merged with ${context.sibling_envelopes.length} sibling envelope(s) -> ${mm.sha256}`;
    } else if (partial) {
      siblingNote = '; partial_chunk: cross-envelope merge not exercised (context.sibling_envelopes absent)';
    }
    out.push(errs.length ? chk('MERGE_DETERMINISTIC', F, head(errs), { merged_sha256: m1.sha256 })
      : chk('MERGE_DETERMINISTIC', P, `merge order [${head(m1.order, 4)}] -> sha256 ${m1.sha256}${!exp ? ' (no expected hash declared)' : !partial ? ' == expected' : hasSib ? '' : ' (expected hash names the full dossier; not compared without siblings)'}${siblingNote}${exp && partial && hasSib ? ' == expected' : ''}`, { merged_sha256: m1.sha256, merged_code_points: cp(m1.markdown) }));
  }

  // ANCHORS_REGISTERED — every declared anchor maps to one page registered in the source registry.
  {
    const conflicts = [];
    const unregistered = [];
    for (const s of sections) {
      const seen = new Map();
      for (const an of arr(s.source_anchors)) {
        if (seen.has(an.anchor_id) && seen.get(an.anchor_id) !== an.source_page) conflicts.push(`${s.chunk_id}:[${an.anchor_id}] -> ${seen.get(an.anchor_id)} and ${an.source_page}`);
        seen.set(an.anchor_id, an.source_page);
        if (codes && !pageRegistered(an.source_page, codes)) unregistered.push(`${s.chunk_id}:[${an.anchor_id}]->${an.source_page}`);
      }
    }
    const total = sections.reduce((n, s) => n + arr(s.source_anchors).length, 0);
    if (conflicts.length) out.push(chk('ANCHORS_REGISTERED', F, `anchor maps to two pages: ${head(conflicts)}`));
    else if (!codes) out.push(chk('ANCHORS_REGISTERED', H, `context.source_registry absent; ${total} declared anchors unresolvable`));
    else out.push(unregistered.length ? chk('ANCHORS_REGISTERED', F, `${unregistered.length}/${total} anchors not in registry: ${head(unregistered)}`, { unregistered: unregistered.length })
      : chk('ANCHORS_REGISTERED', P, `${total}/${total} anchors resolve to registered sources (${codes.size} registry codes)`));
  }

  // FACT_LINES_CITED — every fact-bearing line cites a declared anchor (inline or by list/table block lead) or carries (verify) + an open debt id.
  {
    let fact = 0; const bad = [];
    // F (VERIFY list) and G (DoD matrix) are bookkeeping sections: their numerals are counts/box ids, not learner facts.
    for (const s of sections) { if (['F', 'G'].includes(s.section_id)) continue; const r = uncitedFactLines(s, openDebtIds); fact += r.factLines; bad.push(...r.uncited); }
    out.push(bad.length ? chk('FACT_LINES_CITED', F, `${bad.length}/${fact} fact-bearing lines uncited: ${head(bad)}`, { fact_lines: fact, uncited: bad.length })
      : chk('FACT_LINES_CITED', P, `${fact}/${fact} fact-bearing lines cite a declared anchor or (verify)+open debt`, { fact_lines: fact, uncited: 0 }));
  }

  // EXAM_FACT_STATUS — official-fact objects: unknown => value null; verified => value + registered page; authored => value present.
  {
    const errs = []; let needRegistry = false; const notReg = [];
    for (const k of EXAM_FACT_KEYS) {
      const f = a.exam_facts?.[k];
      if (!f) { errs.push(`${k} missing`); continue; }
      if (f.status === 'unknown' && f.value !== null) errs.push(`${k}: status unknown but value=${JSON.stringify(f.value)} (fabricated placeholder)`);
      if (f.status === 'verified') {
        if (f.value === null) errs.push(`${k}: verified with null value`);
        if (!f.source_page) errs.push(`${k}: verified without source_page`);
        else if (!codes) needRegistry = true;
        else if (!pageRegistered(f.source_page, codes)) notReg.push(`${k}->${f.source_page}`);
      }
      if (f.status === 'authored' && f.value === null) errs.push(`${k}: authored with null value (use status unknown)`);
      // parent exam_meta bounds restored: strings non-empty (minLength 1); n_questions integer >= 1 (also applied to bank size)
      if (typeof f.value === 'string' && !f.value.trim()) errs.push(`${k}: empty string value`);
      if (['n_questions', 'question_bank_size'].includes(k) && f.value !== null && !(Number.isInteger(f.value) && f.value >= 1)) errs.push(`${k}: value ${JSON.stringify(f.value)} must be an integer >= 1 or null`);
    }
    if (notReg.length) errs.push(`verified source_page not registered: ${notReg.join(', ')}`);
    const counts = EXAM_FACT_KEYS.reduce((m, k) => { const s = a.exam_facts?.[k]?.status ?? 'missing'; m[s] = (m[s] ?? 0) + 1; return m; }, {});
    if (errs.length) out.push(chk('EXAM_FACT_STATUS', F, head(errs), counts));
    else if (needRegistry) out.push(chk('EXAM_FACT_STATUS', H, 'verified exam facts present but context.source_registry absent', counts));
    else out.push(chk('EXAM_FACT_STATUS', P, `exam_facts consistent: ${JSON.stringify(counts)}`, counts));
  }

  // NUMERAL_LEAK — numerals of non-verified official facts / open debts must not appear in learner-facing prose.
  {
    const errs = [];
    for (const s of sections) if (LEARNER_FACING_REQUIRED.has(s.section_id) && s.learner_facing !== true) errs.push(`${s.chunk_id} (section ${s.section_id}) must be learner_facing:true`);
    const forbidden = new Map();
    for (const k of EXAM_FACT_KEYS) {
      const f = a.exam_facts?.[k];
      if (f && f.status !== 'verified' && f.value !== null && (typeof f.value === 'number' || /^\d[\d.,]*%?$/.test(String(f.value)))) forbidden.set(String(f.value), `exam_facts.${k}(${f.status})`);
    }
    for (const d of debts) if (d.resolution_artifact_ref == null) for (const w of arr(d.withheld_values)) if (w) forbidden.set(w, `debt ${d.claim_id}`);
    for (const [k, v] of Object.entries(context.exam_facts_view ?? {})) if (v && v.status !== 'verified' && v.value != null) forbidden.set(String(v.value), `exam_facts_view.${k}(${v.status})`);
    const leaks = [];
    for (const s of sections.filter(x => x.learner_facing === true)) {
      for (const [w, why] of forbidden) {
        const re = new RegExp(`(?<![0-9])${escapeRe(w)}(?![0-9])`);
        if (re.test(s.markdown ?? '')) leaks.push(`"${w}" (${why}) in ${s.chunk_id}`);
      }
    }
    errs.push(...leaks);
    out.push(errs.length ? chk('NUMERAL_LEAK', F, head(errs), { forbidden_values: forbidden.size, leaks: leaks.length })
      : chk('NUMERAL_LEAK', P, `${forbidden.size} withheld/unverified value(s) absent from ${sections.filter(x => x.learner_facing).length} learner-facing chunks`, { forbidden_values: forbidden.size, leaks: 0 }));
  }

  // HIGH_YIELD_PER_DOMAIN — explicit ranked high_yield for every knowledge domain.
  {
    const domains = [...new Set(sections.filter(s => s.section_id === 'C' && s.domain).map(s => s.domain))];
    const byDomain = new Map(arr(a.high_yield_ranked).map(h => [h.domain, h]));
    const errs = [];
    for (const d of domains) {
      const h = byDomain.get(d);
      if (!h) { errs.push(`no high_yield_ranked for domain "${d}"`); continue; }
      const ranks = arr(h.ranked).map(r => r.rank).sort((x, y) => x - y);
      if (!ranks.length) errs.push(`"${d}" ranked[] empty`);
      if (ranks.some((r, i) => r !== i + 1)) errs.push(`"${d}" ranks not 1..${ranks.length}: [${ranks.join(',')}]`);
      if (arr(h.ranked).some(r => !r.label || !arr(r.item_refs).length)) errs.push(`"${d}" has a ranked item without label/item_refs`);
      const c = chunkById.get(h.chunk_id);
      if (!c || c.domain !== d) errs.push(`"${d}" chunk_id ${h.chunk_id} does not resolve to a chunk of that domain`);
    }
    for (const h of arr(a.high_yield_ranked)) if (!domains.includes(h.domain)) errs.push(`high_yield_ranked domain "${h.domain}" has no knowledge chunk`);
    out.push(errs.length ? chk('HIGH_YIELD_PER_DOMAIN', F, head(errs), { domains: domains.length })
      : chk('HIGH_YIELD_PER_DOMAIN', P, `${domains.length}/${domains.length} knowledge domains carry a contiguous ranked high_yield list`, { domains: domains.length }));
  }

  // DEDICATED_SURFACE — explicit needs_dedicated_surface disposition.
  {
    const n = a.needs_dedicated_surface ?? {};
    const items = arr(n.items);
    const errs = [];
    if (n.status === 'declared' && !items.length) errs.push('status declared but items[] empty');
    if (n.status === 'declared' && !items.some(i => i.needs_dedicated_surface === true)) errs.push('status declared but no item has needs_dedicated_surface:true');
    if (n.status === 'none_required' && items.some(i => i.needs_dedicated_surface === true)) errs.push('status none_required contradicts an item flagged true');
    for (const i of items) if (!i.why || !i.skill) errs.push(`item "${i.skill}" lacks skill/why`);
    if (n.status === 'unknown' && !debts.some(d => d.blocker_kind === 'exam_policy_unclear' && d.located_at?.section_id === 'C')) errs.push('status unknown without an exam_policy_unclear VerificationDebt located in section C');
    out.push(errs.length ? chk('DEDICATED_SURFACE', F, head(errs)) : chk('DEDICATED_SURFACE', P, `needs_dedicated_surface ${n.status} with ${items.length} item(s)`));
  }

  // CORPUS_STABILITY — volatility emits BlockedProbe.
  {
    const c = a.corpus_stability ?? {};
    const errs = [];
    if (c.assessment === 'volatile_gt_1_per_year' && c.blocked_probe !== true) errs.push('volatile corpus must set blocked_probe:true (BlockedProbe to 00)');
    if (!c.reason || !c.reason.trim()) errs.push('reason empty');
    if (c.assessment === 'unknown' && c.blocked_probe !== true && !debts.some(d => d.located_at?.section_id === 'A')) errs.push('unknown stability without blocked_probe or a section-A VerificationDebt');
    out.push(errs.length ? chk('CORPUS_STABILITY', F, errs.join('; ')) : chk('CORPUS_STABILITY', P, `assessment ${c.assessment}, blocked_probe ${c.blocked_probe}`));
  }

  // DEBT_TYPED — every debt typed per the 02 contract and located.
  {
    const errs = [];
    const ids = debts.map(d => d.claim_id);
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (dup.length) errs.push(`duplicate claim_id ${[...new Set(dup)].join(',')}`);
    for (const d of debts) {
      if (!d.claim_id || !d.claim_text) errs.push(`debt ${d.claim_id ?? '?'} missing claim_id/claim_text`);
      for (const k of ['blocker_kind', 'source_tier_required', 'owner_worker']) if (d[k] == null) errs.push(`${d.claim_id}.${k} is null`);
      if (d.expires_by != null && !(/^\d{4}-\d{2}-\d{2}(T|$)/.test(d.expires_by) && !Number.isNaN(Date.parse(d.expires_by)))) errs.push(`${d.claim_id}.expires_by "${d.expires_by}" not an ISO date or null`);
      const c = chunkById.get(d.located_at?.chunk_id);
      if (!c) errs.push(`${d.claim_id}.located_at.chunk_id ${d.located_at?.chunk_id} unresolved`);
      else if (c.section_id !== d.located_at.section_id) errs.push(`${d.claim_id}.located_at section ${d.located_at.section_id} != chunk section ${c.section_id}`);
      if (arr(d.withheld_values).some(w => !w)) errs.push(`${d.claim_id} has an empty withheld value`);
    }
    out.push(errs.length ? chk('DEBT_TYPED', F, head(errs), { debts: debts.length })
      : chk('DEBT_TYPED', P, `${debts.length} debt record(s) typed + located`, { debts: debts.length, ship_blocking: debts.filter(d => d.ship_blocking).length }));
  }

  // EXTERNAL_REVIEW — legally/clinically required review is an ExternalReviewRequest, typed and resolvable.
  {
    const errs = [];
    const reqs = arr(a.external_review_requests);
    const factIds = new Set(sections.flatMap(s => arr(s.fact_ids)));
    const rids = reqs.map(r => r.request_id);
    if (rids.some((v, i) => rids.indexOf(v) !== i)) errs.push('duplicate request_id');
    for (const r of reqs) {
      if (!arr(r.claim_ids).length) errs.push(`${r.request_id} claim_ids empty`);
      for (const c of arr(r.claim_ids)) if (!debtIds.has(c) && !factIds.has(c)) errs.push(`${r.request_id} claim ${c} unresolved`);
      if (!r.why_human_required) errs.push(`${r.request_id} why_human_required empty`);
    }
    const covered = new Set(reqs.flatMap(r => arr(r.claim_ids)));
    for (const d of debts) if (['legal_review_required', 'clinical_review_required'].includes(d.blocker_kind) && !covered.has(d.claim_id)) errs.push(`debt ${d.claim_id} (${d.blocker_kind}) has no ExternalReviewRequest`);
    out.push(errs.length ? chk('EXTERNAL_REVIEW', F, head(errs)) : chk('EXTERNAL_REVIEW', P, `${reqs.length} request(s); every legal/clinical debt covered`));
  }

  // MARKET_SIGNAL — origin explicit; evidence chunks or typed debt, never fictional market research.
  {
    const m = a.market_signal ?? {};
    const errs = [];
    if (!m.origin_note) errs.push('origin_note empty');
    for (const c of arr(m.chunk_ids)) { const s = chunkById.get(c); if (!s) errs.push(`chunk ${c} unresolved`); else if (!['E', 'E2'].includes(s.section_id)) errs.push(`chunk ${c} is section ${s.section_id}, not E/E2`); }
    if (m.disposition === 'present' && !arr(m.chunk_ids).some(c => chunkById.get(c)?.section_id === 'E')) errs.push('disposition present but no section-E chunk referenced');
    if (m.disposition === 'typed_debt' && !arr(m.debt_refs).length) errs.push('disposition typed_debt without debt_refs');
    for (const d of arr(m.debt_refs)) if (!debtIds.has(d)) errs.push(`debt_ref ${d} unresolved`);
    out.push(errs.length ? chk('MARKET_SIGNAL', F, head(errs)) : chk('MARKET_SIGNAL', P, `origin ${m.origin}, disposition ${m.disposition}, ${arr(m.chunk_ids).length} chunk(s), ${arr(m.debt_refs).length} debt ref(s)`));
  }

  // DEPTH_FLOOR — compensating check for the contract's "Depth ∝ exam weight" / DoD: a structurally valid but hollow
  // envelope must not pass (2026-10-27: a 9×145-code-point "overview" passed every structural check). Floors are bound
  // from run-config scope.depth_floor via context.depth_floor; with no floor bound (fixtures) the check records metrics only.
  {
    const floor = context.depth_floor;
    const counts = sections.map(s => ({ id: s.section_id, chunk: s.chunk_id, cp: cp(s.markdown), facts: (String(s.markdown ?? '').match(/^\s*FACT_ID:/gm) || []).length }));
    const metrics = Object.fromEntries(counts.map(c => [`${c.id}_cp`, c.cp]).concat(counts.map(c => [`${c.id}_fact_blocks`, c.facts])));
    const summary = counts.map(c => `${c.id}:${c.facts}f/${c.cp}cp`).join(' ');
    if (!floor || typeof floor !== 'object') out.push(chk('DEPTH_FLOOR', P, `no depth floor bound in context (fixture/synthetic); ${summary}`, metrics));
    else {
      const errs = [];
      for (const c of counts) {
        const f = floor[c.id] ?? floor.default; if (!f) continue;
        if (c.facts < (f.min_fact_blocks ?? 0)) errs.push(`${c.chunk} (${c.id}) ${c.facts} fact blocks < floor ${f.min_fact_blocks}`);
        if (c.cp < (f.min_code_points ?? 0)) errs.push(`${c.chunk} (${c.id}) ${c.cp} code points < floor ${f.min_code_points}`);
      }
      out.push(errs.length ? chk('DEPTH_FLOOR', F, `hollow envelope: ${head(errs)}`, metrics) : chk('DEPTH_FLOOR', P, `bound depth floor met; ${summary}`, metrics));
    }
  }

  // G_MATRIX — one located disposition per Definition-of-Done box; nothing silently counts as done.
  {
    const g = arr(a.g_matrix);
    const errs = [];
    const ids = g.map(x => x.box_id);
    const missing = G_BOXES.filter(b => !ids.includes(b));
    const dup = ids.filter((v, i) => ids.indexOf(v) !== i);
    if (missing.length) errs.push(`missing box(es) ${missing.join(',')}`);
    if (dup.length) errs.push(`duplicate box(es) ${[...new Set(dup)].join(',')}`);
    for (const x of g) {
      if (!chunkById.has(x.located_at)) errs.push(`${x.box_id} located_at ${x.located_at} unresolved`);
      if (x.disposition === 'debt' && !debtIds.has(x.debt_ref)) errs.push(`${x.box_id} disposition debt with unresolved debt_ref ${x.debt_ref}`);
      if (x.disposition === 'non_applicable' && !x.note) errs.push(`${x.box_id} non_applicable without note`);
    }
    const tally = g.reduce((m, x) => { m[x.disposition] = (m[x.disposition] ?? 0) + 1; return m; }, {});
    out.push(errs.length ? chk('G_MATRIX', F, head(errs), tally) : chk('G_MATRIX', P, `11/11 G boxes located: ${JSON.stringify(tally)}`, tally));
  }

  return out;
}
