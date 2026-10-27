// 04.cards compensating checks (layer 2) for schemas-strict/04-carddeck.schema.json.
// Restores every parent bound the strict adapter dropped (minLength, pattern, minimum, minItems) and the
// role-04 pilot invariants (contracts/pilot-overrides-v0.4.0.json role_overrides["04"]).
// Pure: no network, no file reads, no clock. Missing context -> HOLD, never a guess.
import {
  check, head, isHex64, isNonEmptyString, arr, obj, PROBE_SLUG, wordCount, normalizeForCompare,
  spokenFormViolations, scaffoldViolations, DEICTIC_VISUAL_RE, factRegistry, acceptedWording,
  UNRESOLVED_FACT_STATUSES, refSha, sameSourceRef, originalityTokens, longestSharedRun,
} from '../lib/cards-sessions-common.mjs';

export const stage_id = '04.cards';
const P = '04';
export const HOOK_MAX_WORDS = 6;
export const MAX_CONTIGUOUS_SOURCE_WORDS = 12; // qualification/CRITERIA-04-text-first.json originality.max_contiguous_source_words
// Adapter-bound deterministic SRS policy (V1 citizenship 04-carddeck.json srs_policy, pinned in the mapping).
export const BASE_TIER = { easy: 'relaxed', medium: 'standard', hard: 'tight' };
const TIGHTEN = { relaxed: 'standard', standard: 'tight', tight: 'tight' };
export const expectedTier = (difficulty, highYield) => {
  const base = BASE_TIER[difficulty];
  if (!base) return null;
  return highYield === true ? TIGHTEN[base] : base;
};

function allCards(a) {
  const out = [];
  arr(a?.decks).forEach((d, di) => arr(d?.cards).forEach((c, ci) => out.push({ c: obj(c), d: obj(d), ptr: `/decks/${di}/cards/${ci}` })));
  return out;
}

export function run(artifact, context = {}) {
  const a = obj(artifact);
  const cards = allCards(a);
  const byId = new Map(cards.map(x => [x.c.card_id, x]));
  const out = [];

  // ---- 04.STRING_BOUNDS: parent minLength/pattern/minimum/minItems restored ----
  {
    const bad = [];
    if (typeof a.probe !== 'string' || !PROBE_SLUG.test(a.probe)) bad.push(`/probe ${JSON.stringify(a.probe)} !~ ^[a-z0-9][a-z0-9-]*$`);
    if (!isHex64(a.input_manifest_sha256)) bad.push('/input_manifest_sha256 not 64 lowercase hex');
    if (!isNonEmptyString(a.candidate_lineage_id)) bad.push('/candidate_lineage_id empty');
    if (!isNonEmptyString(a.source_refs?.knowledge_graph)) bad.push('/source_refs/knowledge_graph empty');
    if (!isNonEmptyString(a.media_disposition_ref?.path)) bad.push('/media_disposition_ref/path empty');
    if (!isHex64(a.media_disposition_ref?.sha256)) bad.push('/media_disposition_ref/sha256 not 64 lowercase hex');
    const ll = a.srs_policy?.learning_loop_ref;
    if (ll && (!isNonEmptyString(ll.path) || !isHex64(ll.sha256))) bad.push('/srs_policy/learning_loop_ref path empty or sha256 not hex');
    arr(a.decks).forEach((d, di) => {
      for (const k of ['module', 'module_id', 'domain']) if (!isNonEmptyString(d?.[k])) bad.push(`/decks/${di}/${k} empty`);
      const v = d?.exam_weight?.value;
      if (typeof v === 'number' && !(v >= 0)) bad.push(`/decks/${di}/exam_weight/value ${v} < 0`);
    });
    for (const { c, d, ptr } of cards) {
      for (const k of ['card_id', 'node_id', 'module_id', 'front', 'back', 'memory_hook']) if (!isNonEmptyString(c[k])) bad.push(`${ptr}/${k} empty`);
      if (!isNonEmptyString(c.source_ref?.ref)) bad.push(`${ptr}/source_ref/ref empty`);
      if (!(Number.isInteger(c.intro_order) && c.intro_order >= 0)) bad.push(`${ptr}/intro_order ${JSON.stringify(c.intro_order)} not an integer >= 0`);
      const pg = c.source_ref?.pdf_page;
      if (pg !== null && pg !== undefined && !(Number.isInteger(pg) && pg >= 1)) bad.push(`${ptr}/source_ref/pdf_page ${pg} < 1`);
      if (c.source_ref?.printed_page !== null && c.source_ref?.printed_page !== undefined && !isNonEmptyString(c.source_ref.printed_page)) bad.push(`${ptr}/source_ref/printed_page empty string`);
      if (isNonEmptyString(c.module_id) && c.module_id !== d.module_id) bad.push(`${ptr}/module_id ${c.module_id} != deck module_id ${d.module_id}`);
    }
    arr(a.recaps).forEach((r, ri) => {
      if (!isNonEmptyString(r?.module)) bad.push(`/recaps/${ri}/module empty`);
      if (!isNonEmptyString(r?.module_id)) bad.push(`/recaps/${ri}/module_id empty`);
      if (arr(r?.recap_hooks).length < 1) bad.push(`/recaps/${ri}/recap_hooks has 0 items (parent minItems 1)`);
      arr(r?.recap_hooks).forEach((h, hi) => { if (!isNonEmptyString(h?.text)) bad.push(`/recaps/${ri}/recap_hooks/${hi}/text empty`); });
    });
    out.push(bad.length
      ? check(`${P}.STRING_BOUNDS`, 'FAIL', `${bad.length} bound violation(s): ${head(bad)}`, { violations: bad.length })
      : check(`${P}.STRING_BOUNDS`, 'PASS', `probe slug, hashes, non-empty strings, intro_order>=0, exam_weight>=0, recap_hooks>=1 hold over ${cards.length} cards / ${arr(a.recaps).length} recaps`, { violations: 0 }));
  }

  // ---- 04.CARD_IDS: stable unique ids; intro_order unique per deck ----
  {
    const seen = new Map(); const dup = [];
    for (const { c } of cards) { if (seen.has(c.card_id)) dup.push(c.card_id); seen.set(c.card_id, true); }
    const orderDup = [];
    arr(a.decks).forEach((d) => {
      const s = new Map();
      for (const c of arr(d?.cards)) { if (s.has(c?.intro_order)) orderDup.push(`${d.module_id}:intro_order ${c.intro_order} (${s.get(c.intro_order)}, ${c.card_id})`); else s.set(c?.intro_order, c?.card_id); }
    });
    const bad = [...dup.map(i => `duplicate card_id ${i}`), ...orderDup];
    out.push(bad.length
      ? check(`${P}.CARD_IDS`, 'FAIL', `${bad.length} id/order collision(s): ${head(bad)}`, { duplicate_card_ids: dup.length, duplicate_intro_orders: orderDup.length })
      : check(`${P}.CARD_IDS`, 'PASS', `${cards.length} unique card_ids; intro_order unique within each of ${arr(a.decks).length} decks`, { duplicate_card_ids: 0, duplicate_intro_orders: 0 }));
  }

  // ---- 04.MERGES: justified merges are well-formed and point at real cards ----
  {
    const bad = [];
    arr(a.merges).forEach((m, i) => {
      if (arr(m?.merged_node_ids).length < 2) bad.push(`/merges/${i} merges ${arr(m?.merged_node_ids).length} node(s); a merge needs >=2`);
      if (!byId.has(m?.card_id)) bad.push(`/merges/${i}/card_id ${m?.card_id} is not a card`);
      if (!isNonEmptyString(m?.justification)) bad.push(`/merges/${i}/justification empty`);
    });
    out.push(bad.length ? check(`${P}.MERGES`, 'FAIL', head(bad), { merges: arr(a.merges).length })
      : check(`${P}.MERGES`, 'PASS', `${arr(a.merges).length} recorded merge(s) well-formed`, { merges: arr(a.merges).length }));
  }

  // ---- 04.EXAM_WEIGHT_STATUS: official-number sentinel shape; authored emphasis kept separate ----
  {
    const bad = [];
    arr(a.decks).forEach((d, di) => {
      const w = obj(d?.exam_weight);
      if (w.status === 'verified' && (typeof w.value !== 'number' || !(w.value >= 0) || !isNonEmptyString(w.source_page))) bad.push(`/decks/${di}/exam_weight verified without a value >= 0 and a source_page`);
      if (w.status === 'unknown' && w.value !== null) bad.push(`/decks/${di}/exam_weight status unknown but value ${JSON.stringify(w.value)} (no numeric hint may ride an unknown official fact)`);
      if (w.status !== 'unknown' && w.status !== 'verified') bad.push(`/decks/${di}/exam_weight status ${JSON.stringify(w.status)} (official weights are unknown|verified only)`);
      const pe = obj(d?.pedagogic_emphasis);
      if (pe.kind !== 'authored_product_policy') bad.push(`/decks/${di}/pedagogic_emphasis not labelled authored_product_policy`);
      if (pe.value !== null && pe.value !== undefined && !(typeof pe.value === 'number' && pe.value >= 0)) bad.push(`/decks/${di}/pedagogic_emphasis value ${JSON.stringify(pe.value)} not null or >= 0`);
    });
    const counts = { verified: 0, unknown: 0, emphasis_values: 0 };
    arr(a.decks).forEach(d => { if (counts[d?.exam_weight?.status] !== undefined) counts[d.exam_weight.status]++; if (typeof d?.pedagogic_emphasis?.value === 'number') counts.emphasis_values++; });
    out.push(bad.length ? check(`${P}.EXAM_WEIGHT_STATUS`, 'FAIL', head(bad), counts)
      : check(`${P}.EXAM_WEIGHT_STATUS`, 'PASS', `official exam_weight honest on ${arr(a.decks).length} decks (verified ${counts.verified}, unknown ${counts.unknown}); ${counts.emphasis_values} authored emphasis value(s) labelled product policy, never promoted to official`, counts));
  }

  // ---- 04.SRS_POLICY: review_interval_tier == f(difficulty, high_yield) under the bound policy ----
  {
    const pol = obj(a.srs_policy);
    const bad = [];
    const polOk = pol.base_tier_by_difficulty?.easy === 'relaxed' && pol.base_tier_by_difficulty?.medium === 'standard' && pol.base_tier_by_difficulty?.hard === 'tight' && pol.high_yield_rule === 'tighten_one_step';
    if (!polOk) bad.push(`srs_policy is not the bound deterministic policy {easy:relaxed, medium:standard, hard:tight} + tighten_one_step: ${JSON.stringify({ b: pol.base_tier_by_difficulty, r: pol.high_yield_rule })}`);
    let tightened = 0;
    for (const { c } of cards) {
      const exp = expectedTier(c.difficulty, c.high_yield);
      if (c.high_yield === true) tightened++;
      if (exp === null || c.review_interval_tier !== exp) bad.push(`${c.card_id}: ${c.difficulty}/high_yield=${c.high_yield} -> expected ${exp}, got ${JSON.stringify(c.review_interval_tier)}`);
    }
    let status = bad.length ? 'FAIL' : 'PASS';
    let note = '';
    const llRef = pol.learning_loop_ref;
    if (!bad.length && llRef) {
      const ll = context?.learning_loop;
      const sha = refSha(context, 'learning_loop');
      if (!ll || !sha) { status = 'HOLD'; note = ' | learning_loop_ref declared but context.learning_loop (+hash) absent — LearningLoop binding unverified'; }
      else if (sha !== llRef.sha256) { status = 'FAIL'; note = ` | learning_loop_ref.sha256 ${llRef.sha256} != context hash ${sha}`; }
      else if (ll.srs_policy && (JSON.stringify(ll.srs_policy.base_tier_by_difficulty) !== JSON.stringify(BASE_TIER) || ll.srs_policy.high_yield_rule !== 'tighten_one_step')) { status = 'FAIL'; note = ' | accepted LearningLoop srs_policy differs from the adapter-bound policy (adapter revision required)'; }
      else note = ' | LearningLoop ref hash matches context';
    } else if (!llRef) note = ' | learning_loop_ref null: tiers follow the adapter-bound product policy only';
    out.push(check(`${P}.SRS_POLICY`, status, (bad.length ? `${bad.length} tier mismatch(es): ${head(bad)}` : `${cards.length}/${cards.length} cards tier == f(difficulty, high_yield); ${tightened} high-yield cards tightened`) + note,
      { mismatches: bad.length, high_yield_tightened: tightened }));
  }

  // ---- 04.BACK_SPOKEN_FORM: spoken-form lint on backs, hooks, recap hooks ----
  {
    const hits = [];
    let fields = 0;
    for (const { c } of cards) {
      for (const k of ['back', 'memory_hook']) {
        fields++;
        const v = spokenFormViolations(c[k]);
        if (v.length) hits.push(`${c.card_id}.${k}: ${[...new Set(v.map(x => `${x.kind}'${x.token}'`))].join(',')}`);
      }
    }
    arr(a.recaps).forEach(r => arr(r?.recap_hooks).forEach((h, hi) => {
      fields++;
      const v = spokenFormViolations(h?.text);
      if (v.length) hits.push(`recap ${r.module_id}[${hi}]: ${[...new Set(v.map(x => `${x.kind}'${x.token}'`))].join(',')}`);
    }));
    if (a.back_format !== 'spoken_text') hits.unshift(`back_format ${JSON.stringify(a.back_format)} != "spoken_text"`);
    out.push(hits.length
      ? check(`${P}.BACK_SPOKEN_FORM`, 'FAIL', `${hits.length}/${fields} field(s) not spoken form: ${head(hits)}`, { violating_fields: hits.length, fields_checked: fields })
      : check(`${P}.BACK_SPOKEN_FORM`, 'PASS', `${fields} back/hook/recap fields spoken-form clean (no | / % & symbols, bare unit abbreviations or unspelled decimals)`, { violating_fields: 0, fields_checked: fields }));
  }

  // ---- 04.HOOK_LENGTH: every card hooked, at most six words ----
  {
    const over = []; let max = 0;
    for (const { c } of cards) {
      const n = wordCount(c.memory_hook);
      max = Math.max(max, n);
      if (n < 1 || n > HOOK_MAX_WORDS) over.push(`${c.card_id} (${n} words)`);
    }
    out.push(over.length
      ? check(`${P}.HOOK_LENGTH`, 'FAIL', `${over.length}/${cards.length} hooks outside 1..${HOOK_MAX_WORDS} words: ${head(over)}`, { over_limit: over.length, max_words: max })
      : check(`${P}.HOOK_LENGTH`, 'PASS', `${cards.length} hooks within 1..${HOOK_MAX_WORDS} words (max ${max})`, { over_limit: 0, max_words: max }));
  }

  // ---- 04.HOOK_ORIGIN: mnemonic-first consistency with the accepted Blueprint ----
  {
    const mn = context?.accepted_inputs?.blueprint_mnemonics;
    if (!mn || typeof mn !== 'object') {
      out.push(check(`${P}.HOOK_ORIGIN`, 'HOLD', 'context.accepted_inputs.blueprint_mnemonics absent — hook_origin cannot be checked against Blueprint mnemonic presence'));
    } else {
      const bad = []; const counts = { 'sme-carried': 0, 'sme-adapted': 0, minted: 0 };
      for (const { c } of cards) {
        const m = typeof mn[c.node_id] === 'string' && mn[c.node_id].trim() ? mn[c.node_id] : null;
        if (counts[c.hook_origin] !== undefined) counts[c.hook_origin]++;
        if (c.hook_origin === 'sme-carried' && (!m || normalizeForCompare(m) !== normalizeForCompare(c.memory_hook))) bad.push(`${c.card_id}: sme-carried but ${m ? 'hook != Blueprint mnemonic' : 'no Blueprint mnemonic for node'}`);
        if (c.hook_origin === 'sme-adapted' && !m) bad.push(`${c.card_id}: sme-adapted but no Blueprint mnemonic for node ${c.node_id}`);
        if (c.hook_origin === 'minted' && m) bad.push(`${c.card_id}: minted although Blueprint mnemonic exists for ${c.node_id} (mnemonic-first rule)`);
      }
      out.push(bad.length ? check(`${P}.HOOK_ORIGIN`, 'FAIL', `${bad.length} hook_origin inconsistency(ies): ${head(bad)}`, counts)
        : check(`${P}.HOOK_ORIGIN`, 'PASS', `hook_origin consistent with Blueprint mnemonics on ${cards.length} cards`, counts));
    }
  }

  // ---- 04.FACT_IDS: every card / recap hook carries unique fact ids; recap ids come from the deck ----
  {
    const bad = [];
    for (const { c } of cards) {
      const ids = arr(c.claims_fact_ids);
      if (ids.length < 1) bad.push(`${c.card_id}: claims_fact_ids empty`);
      if (new Set(ids).size !== ids.length) bad.push(`${c.card_id}: duplicate fact ids`);
      if (ids.some(i => !isNonEmptyString(i))) bad.push(`${c.card_id}: empty fact id`);
    }
    const deckFacts = new Map(arr(a.decks).map(d => [d?.module_id, new Set(arr(d?.cards).flatMap(c => arr(c?.claims_fact_ids)))]));
    arr(a.recaps).forEach(r => arr(r?.recap_hooks).forEach((h, hi) => {
      const ids = arr(h?.fact_ids);
      if (ids.length < 1) bad.push(`recap ${r.module_id}[${hi}]: fact_ids empty`);
      const pool = deckFacts.get(r?.module_id) ?? new Set();
      const foreign = ids.filter(i => !pool.has(i));
      if (foreign.length) bad.push(`recap ${r.module_id}[${hi}]: fact ids not on any card of the deck: ${foreign.join(',')}`);
    }));
    const reg = factRegistry(context);
    let unresolved = null;
    if (reg) {
      const all = [...new Set([...cards.flatMap(x => arr(x.c.claims_fact_ids)), ...arr(a.recaps).flatMap(r => arr(r?.recap_hooks).flatMap(h => arr(h?.fact_ids)))])];
      const miss = all.filter(i => !reg[i]);
      unresolved = miss.length;
      if (miss.length) bad.push(`${miss.length} fact id(s) not in context.fact_registry: ${head(miss, 6)}`);
    }
    const status = bad.length ? 'FAIL' : reg ? 'PASS' : 'HOLD';
    out.push(check(`${P}.FACT_IDS`, status,
      bad.length ? `${bad.length} fact-id defect(s): ${head(bad)}` : reg ? 'every card/recap hook carries >=1 unique fact id; all resolve in context.fact_registry' : 'structure OK (>=1 unique fact id per card/recap hook) but context.fact_registry absent — resolution unverified',
      { defects: bad.length, unresolved_in_registry: unresolved }));
  }

  // ---- 04.BACK_FIDELITY: back equals accepted fact wording ----
  {
    const reg = factRegistry(context);
    if (!reg) {
      out.push(check(`${P}.BACK_FIDELITY`, 'HOLD', 'context.fact_registry absent — back-vs-accepted-wording equality cannot be checked (no guess)'));
    } else {
      const bad = []; let exact = 0;
      for (const { c } of cards) {
        const facts = arr(c.claims_fact_ids).map(i => [i, reg[i]]);
        const missing = facts.filter(([, f]) => !f).map(([i]) => i);
        if (missing.length) { bad.push(`${c.card_id}: unresolved fact id(s) ${missing.join(',')}`); continue; }
        const unresolvedStatus = facts.filter(([, f]) => UNRESOLVED_FACT_STATUSES.has(String(f.status ?? '').toLowerCase())).map(([i, f]) => `${i}=${f.status}`);
        if (unresolvedStatus.length) { bad.push(`${c.card_id}: fact status not publishable (${unresolvedStatus.join(',')})`); continue; }
        const wordings = facts.map(([, f]) => acceptedWording(f)).filter(w => w !== null);
        const components = c.cluster_role === 'atomic' ? facts.flatMap(([, f]) => arr(f.components)) : [];
        if (wordings.includes(c.back) || components.includes(c.back)) exact++;
        else bad.push(`${c.card_id}: back ${JSON.stringify(String(c.back).slice(0, 60))} != accepted wording of ${facts.map(([i]) => i).join(',')}`);
      }
      out.push(bad.length ? check(`${P}.BACK_FIDELITY`, 'FAIL', `${bad.length}/${cards.length} back(s) not equal to accepted fact wording: ${head(bad)}`, { exact: exact, drift: bad.length })
        : check(`${P}.BACK_FIDELITY`, 'PASS', `${exact}/${cards.length} backs byte-equal to accepted (spoken_)statement or accepted component`, { exact, drift: 0 }));
    }
  }

  // ---- 04.ATOMIC_CLUSTER: umbrella + atomic components share node/source; atomic back is a verbatim component ----
  {
    const clusters = new Map(); const bad = []; let holds = 0;
    for (const { c } of cards) {
      if ((c.cluster_id === null) !== (c.cluster_role === null)) bad.push(`${c.card_id}: cluster_id and cluster_role must both be null or both set`);
      if (c.cluster_id !== null && c.cluster_id !== undefined) { if (!clusters.has(c.cluster_id)) clusters.set(c.cluster_id, []); clusters.get(c.cluster_id).push(c); }
    }
    const reg = factRegistry(context);
    for (const [cid, members] of clusters) {
      const umb = members.filter(m => m.cluster_role === 'umbrella');
      const atoms = members.filter(m => m.cluster_role === 'atomic');
      if (umb.length !== 1) { bad.push(`${cid}: ${umb.length} umbrella cards (need exactly 1)`); continue; }
      if (atoms.length < 1) bad.push(`${cid}: no atomic cards`);
      const u = umb[0];
      for (const at of atoms) {
        if (at.node_id !== u.node_id) bad.push(`${at.card_id}: node_id ${at.node_id} != umbrella node ${u.node_id}`);
        if (!sameSourceRef(at.source_ref, u.source_ref)) bad.push(`${at.card_id}: source_ref differs from umbrella ${u.card_id}`);
        const isSpan = typeof at.back === 'string' && at.back.length > 0 && typeof u.back === 'string' && u.back.includes(at.back);
        if (isSpan) continue;
        if (!reg) { holds++; continue; }
        const comps = arr(at.claims_fact_ids).flatMap(i => arr(reg[i]?.components));
        if (!comps.includes(at.back)) bad.push(`${at.card_id}: back ${JSON.stringify(at.back)} is neither a verbatim span of umbrella back nor an accepted fact component`);
      }
    }
    const status = bad.length ? 'FAIL' : holds ? 'HOLD' : 'PASS';
    out.push(check(`${P}.ATOMIC_CLUSTER`, status,
      bad.length ? `${bad.length} cluster defect(s): ${head(bad)}` : holds ? `${holds} atomic back(s) are not umbrella spans and context.fact_registry is absent — component equality unverified` : `${clusters.size} cluster(s) valid (one umbrella, atomics share node+source_ref, atomic backs verbatim)`,
      { clusters: clusters.size, defects: bad.length, unverified_atomics: holds }));
  }

  // ---- 04.DUPLICATE_BACKS: no duplicate normalized backs ----
  {
    const seen = new Map();
    for (const { c } of cards) { const k = normalizeForCompare(c.back); if (!seen.has(k)) seen.set(k, []); seen.get(k).push(c.card_id); }
    const dups = [...seen.values()].filter(v => v.length > 1);
    out.push(dups.length ? check(`${P}.DUPLICATE_BACKS`, 'FAIL', `${dups.length} duplicate normalized back group(s): ${head(dups.map(g => g.join('=')))}`, { duplicate_groups: dups.length, cards_in_duplicates: dups.reduce((n, g) => n + g.length, 0) })
      : check(`${P}.DUPLICATE_BACKS`, 'PASS', `${cards.length} backs distinct after NFKC/lowercase/punctuation normalization`, { duplicate_groups: 0, cards_in_duplicates: 0 }));
  }

  // ---- 04.PAGE_CITATIONS: every card cites a page or carries an open (verify) debt entry ----
  {
    const debtByCard = new Map();
    arr(a.verification_debt).forEach(d => { if (d?.kind === 'missing_page_citation') debtByCard.set(d.card_id, d.debt_id); });
    const uncited = []; const debted = []; let cited = 0;
    for (const { c } of cards) {
      const sr = obj(c.source_ref);
      const hasPage = (Number.isInteger(sr.pdf_page) && sr.pdf_page >= 1) || isNonEmptyString(sr.printed_page);
      if (hasPage) cited++;
      else if (debtByCard.has(c.card_id)) debted.push(`${c.card_id}->${debtByCard.get(c.card_id)}`);
      else uncited.push(c.card_id);
    }
    const status = uncited.length ? 'FAIL' : debted.length ? 'HOLD' : 'PASS';
    out.push(check(`${P}.PAGE_CITATIONS`, status,
      uncited.length ? `${uncited.length}/${cards.length} card(s) cite no pdf_page/printed_page and carry no missing_page_citation debt: ${head(uncited)}`
        : debted.length ? `${cited} cited; ${debted.length} card(s) rest on open verification debt (not acceptable until resolved): ${head(debted)}`
          : `${cited}/${cards.length} cards cite a pdf_page or printed_page`,
      { cited, open_debt: debted.length, uncited: uncited.length }));
  }

  // ---- 04.PAGE_RESOLUTION: cited pages resolve in the accepted page map ----
  {
    const pm = context?.page_map?.pages;
    if (!Array.isArray(pm)) {
      out.push(check(`${P}.PAGE_RESOLUTION`, 'HOLD', 'context.page_map.pages absent — cited pages cannot be resolved against the selected source page map'));
    } else {
      const byMap = new Map(pm.filter(p => p?.page_map_id).map(p => [p.page_map_id, p]));
      const pdf = new Set(pm.map(p => p?.pdf_page).filter(Number.isInteger));
      const printed = new Set(pm.map(p => p?.printed_page).filter(isNonEmptyString));
      const bad = []; let resolved = 0;
      for (const { c } of cards) {
        const sr = obj(c.source_ref);
        if (!(Number.isInteger(sr.pdf_page) || isNonEmptyString(sr.printed_page))) continue;
        if (sr.page_map_id !== null && sr.page_map_id !== undefined) {
          const e = byMap.get(sr.page_map_id);
          if (!e) { bad.push(`${c.card_id}: page_map_id ${sr.page_map_id} not in page map`); continue; }
          if (Number.isInteger(sr.pdf_page) && e.pdf_page !== sr.pdf_page) { bad.push(`${c.card_id}: pdf_page ${sr.pdf_page} != page map ${e.pdf_page}`); continue; }
          if (isNonEmptyString(sr.printed_page) && e.printed_page !== sr.printed_page) { bad.push(`${c.card_id}: printed_page ${sr.printed_page} != page map ${e.printed_page}`); continue; }
        } else if ((Number.isInteger(sr.pdf_page) && !pdf.has(sr.pdf_page)) || (isNonEmptyString(sr.printed_page) && !printed.has(sr.printed_page))) { bad.push(`${c.card_id}: page not in page map`); continue; }
        resolved++;
      }
      out.push(bad.length ? check(`${P}.PAGE_RESOLUTION`, 'FAIL', `${bad.length} unresolved citation(s): ${head(bad)}`, { resolved, unresolved: bad.length })
        : check(`${P}.PAGE_RESOLUTION`, 'PASS', `${resolved} cited page(s) resolve in context.page_map`, { resolved, unresolved: 0 }));
    }
  }

  // ---- 04.LEARNER_SCAFFOLD: no "(verify", QA scaffold or doubled article in learner fields ----
  {
    const hits = [];
    for (const { c } of cards) for (const k of ['front', 'back', 'memory_hook']) { const v = scaffoldViolations(c[k]); if (v.length) hits.push(`${c.card_id}.${k}: ${v.join(',')}`); }
    arr(a.recaps).forEach(r => arr(r?.recap_hooks).forEach((h, hi) => { const v = scaffoldViolations(h?.text); if (v.length) hits.push(`recap ${r.module_id}[${hi}]: ${v.join(',')}`); }));
    out.push(hits.length ? check(`${P}.LEARNER_SCAFFOLD`, 'FAIL', `${hits.length} learner field(s) leak scaffold/QA text: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.LEARNER_SCAFFOLD`, 'PASS', 'no "(verify", needs_review, flag-as, MOD- code, bare module id, Q:/A: label or doubled article in front/back/hook/recap fields', { hits: 0 }));
  }

  // ---- 04.MEDIA_DISPOSITION: the scout sentinel is bound to the pinned text-first disposition ----
  {
    const bad = []; const holds = [];
    const deictic = cards.filter(({ c }) => DEICTIC_VISUAL_RE.test(String(c.front ?? '')) || DEICTIC_VISUAL_RE.test(String(c.back ?? ''))).map(({ c }) => c.card_id);
    if (deictic.length) bad.push(`${deictic.length} card(s) refer to a visual ("this sign"/"shown") with no bindable image in the text-first adapter: ${head(deictic, 6)}`);
    if (a.source_refs?.image_scout_post_kg === 'deferred:not_applicable_pilot') {
      const md = context?.media_disposition;
      if (!md) holds.push('context.media_disposition absent — sentinel binding unverified');
      else {
        if (md.image_cards_enabled !== false) bad.push(`sentinel used but media_disposition.image_cards_enabled = ${JSON.stringify(md.image_cards_enabled)}`);
        if (!arr(md.non_applicable_checks).some(n => /image scout/i.test(String(n?.check ?? '')))) bad.push('media_disposition.non_applicable_checks names no image-scout non-applicability');
        if (md.visual_recognition_claims_allowed_without_assets === true) bad.push('media_disposition allows visual-recognition claims without assets (pilot forbids)');
        const sha = refSha(context, 'media_disposition');
        if (!sha) holds.push('media_disposition hash absent from context (loaded_refs/ref_sha256) — media_disposition_ref.sha256 unverified');
        else if (sha !== a.media_disposition_ref?.sha256) bad.push(`media_disposition_ref.sha256 ${a.media_disposition_ref?.sha256} != pinned disposition ${sha}`);
      }
    } else bad.push(`source_refs.image_scout_post_kg ${JSON.stringify(a.source_refs?.image_scout_post_kg)} is not the pilot sentinel`);
    const status = bad.length ? 'FAIL' : holds.length ? 'HOLD' : 'PASS';
    out.push(check(`${P}.MEDIA_DISPOSITION`, status,
      bad.length ? head([...bad, ...holds]) : holds.length ? head(holds) : `sentinel deferred:not_applicable_pilot bound to media disposition ${a.media_disposition_ref?.sha256} (image_cards_enabled false, image-scout non-applicability listed); no deictic visual references`,
      { deictic_cards: deictic.length }));
  }

  // ---- 04.RECAP_PER_DECK: exactly one recap per deck ----
  {
    const deckIds = arr(a.decks).map(d => d?.module_id);
    const recapIds = arr(a.recaps).map(r => r?.module_id);
    const bad = [];
    for (const id of deckIds) { const n = recapIds.filter(r => r === id).length; if (n !== 1) bad.push(`deck ${id}: ${n} recaps`); }
    for (const id of recapIds) if (!deckIds.includes(id)) bad.push(`recap ${id} has no deck`);
    out.push(bad.length ? check(`${P}.RECAP_PER_DECK`, 'FAIL', head(bad), { decks: deckIds.length, recaps: recapIds.length })
      : check(`${P}.RECAP_PER_DECK`, 'PASS', `${deckIds.length} decks, one recap each`, { decks: deckIds.length, recaps: recapIds.length }));
  }

  // ---- 04.DECKS_MIRROR_KG: decks mirror KG modules; nodes carded or merged; KG dynamic flag wins ----
  {
    const kg = context?.accepted_inputs?.knowledge_graph;
    if (!kg || !Array.isArray(kg.modules) || !Array.isArray(kg.nodes)) {
      out.push(check(`${P}.DECKS_MIRROR_KG`, 'HOLD', 'context.accepted_inputs.knowledge_graph {modules[], nodes[], dynamic_nodes[]} absent — module mirroring, node coverage and dynamic flags unverified'));
    } else {
      const bad = [];
      const kgMods = kg.modules.map(m => m?.module_id ?? m?.id);
      const deckMods = arr(a.decks).map(d => d?.module_id);
      if (JSON.stringify(kgMods) !== JSON.stringify(deckMods)) bad.push(`deck module order ${JSON.stringify(deckMods)} != KG modules ${JSON.stringify(kgMods)}`);
      const nodeMod = new Map(kg.nodes.map(n => [n?.id ?? n?.node_id, n?.module_id]));
      const dyn = new Set(arr(kg.dynamic_nodes).map(n => (typeof n === 'string' ? n : n?.id ?? n?.node_id)));
      const carded = new Set(cards.map(x => x.c.node_id));
      const merged = new Set(arr(a.merges).flatMap(m => arr(m?.merged_node_ids)));
      const dropped = [...nodeMod.keys()].filter(n => !carded.has(n) && !merged.has(n));
      if (dropped.length) bad.push(`${dropped.length} KG node(s) neither carded nor merged: ${head(dropped, 6)}`);
      for (const { c } of cards) {
        if (!nodeMod.has(c.node_id)) { bad.push(`${c.card_id}: node ${c.node_id} not in KG`); continue; }
        if (nodeMod.get(c.node_id) !== undefined && nodeMod.get(c.node_id) !== c.module_id) bad.push(`${c.card_id}: module ${c.module_id} != KG node module ${nodeMod.get(c.node_id)}`);
        if (c.is_dynamic !== dyn.has(c.node_id)) bad.push(`${c.card_id}: is_dynamic ${c.is_dynamic} != KG dynamic ${dyn.has(c.node_id)}`);
      }
      out.push(bad.length ? check(`${P}.DECKS_MIRROR_KG`, 'FAIL', `${bad.length} KG mirror defect(s): ${head(bad)}`, { kg_nodes: nodeMod.size, dropped: dropped.length })
        : check(`${P}.DECKS_MIRROR_KG`, 'PASS', `${deckMods.length} decks mirror KG modules in order; ${nodeMod.size} nodes carded or merged; dynamic flags match KG`, { kg_nodes: nodeMod.size, dropped: 0 }));
    }
  }

  // ---- 04.ORIGINALITY: longest normalized contiguous source overlap per learner field <= 12 words ----
  {
    const src = context?.source_document?.text;
    if (typeof src !== 'string' || !src.length) {
      out.push(check(`${P}.ORIGINALITY`, 'HOLD', 'context.source_document.text absent — contiguous-overlap originality against the registered full source document unverified'));
    } else {
      const st = originalityTokens(src);
      const fields = [];
      for (const { c } of cards) for (const k of ['front', 'back', 'memory_hook']) fields.push([`${c.card_id}.${k}`, c[k]]);
      arr(a.recaps).forEach(r => arr(r?.recap_hooks).forEach((h, hi) => fields.push([`recap ${r.module_id}[${hi}]`, h?.text])));
      let max = 0; let maxAt = null; const over = [];
      for (const [label, text] of fields) {
        const run = longestSharedRun(originalityTokens(text), st);
        if (run > max) { max = run; maxAt = label; }
        if (run > MAX_CONTIGUOUS_SOURCE_WORDS) over.push(`${label} (${run} words)`);
      }
      out.push(over.length ? check(`${P}.ORIGINALITY`, 'FAIL', `${over.length} learner field(s) share > ${MAX_CONTIGUOUS_SOURCE_WORDS} contiguous normalized words with the source: ${head(over)}`, { longest_overlap_words: max, longest_at: maxAt, source_tokens: st.length })
        : check(`${P}.ORIGINALITY`, 'PASS', `${fields.length} learner fields; longest contiguous source overlap ${max} words (<= ${MAX_CONTIGUOUS_SOURCE_WORDS}) at ${maxAt}`, { longest_overlap_words: max, longest_at: maxAt, source_tokens: st.length }));
    }
  }

  // ---- 04.INPUT_BINDING: echoes the scoped input manifest digest ----
  {
    const exp = context?.input_manifest_sha256;
    if (!isHex64(exp)) out.push(check(`${P}.INPUT_BINDING`, 'HOLD', 'context.input_manifest_sha256 absent — input binding unverified'));
    else out.push(a.input_manifest_sha256 === exp ? check(`${P}.INPUT_BINDING`, 'PASS', `input_manifest_sha256 equals scoped manifest ${exp}`)
      : check(`${P}.INPUT_BINDING`, 'FAIL', `input_manifest_sha256 ${a.input_manifest_sha256} != scoped manifest ${exp}`));
  }

  // ---- 04.VERIFICATION_DEBT: debt entries are well-formed; any open debt blocks acceptance ----
  {
    const bad = []; const ids = new Set();
    arr(a.verification_debt).forEach((d, i) => {
      if (!isNonEmptyString(d?.debt_id) || ids.has(d.debt_id)) bad.push(`/verification_debt/${i}: debt_id empty or duplicate`);
      ids.add(d?.debt_id);
      if (!byId.has(d?.card_id)) bad.push(`/verification_debt/${i}: card_id ${d?.card_id} is not a card`);
      if (!isNonEmptyString(d?.note)) bad.push(`/verification_debt/${i}: note empty`);
    });
    const n = arr(a.verification_debt).length;
    out.push(bad.length ? check(`${P}.VERIFICATION_DEBT`, 'FAIL', head(bad), { open_debt: n })
      : n ? check(`${P}.VERIFICATION_DEBT`, 'HOLD', `${n} open verification debt entr(y/ies) — routed, not acceptable until resolved`, { open_debt: n })
        : check(`${P}.VERIFICATION_DEBT`, 'PASS', 'no open verification debt', { open_debt: 0 }));
  }

  return out;
}
