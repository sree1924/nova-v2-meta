// 04.cards fixture projector/generator (Claude lane, v0.4.0).
// export projectV1(parentCardDeck, opts) -> adapter-shaped CardDeck (fixture/reference, never a DMV result)
// export spokenFormNormalize(artifact) -> {artifact, diff[]} minimal spoken-form normalization of V1 bytes
// CLI: node tools/belt/project/04-cards.mjs --write   (writes tools/belt/fixtures/04.cards/*; reads only local files)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const NOVA = resolve(LANE, '..');
export const V1_PATH = 'runs/2026-06-11-citizenship/04-carddeck.json';
export const V1_KG_PATH = 'runs/2026-06-11-citizenship/03-knowledge-graph.json';
const MEDIA_DISPOSITION_PATH = 'contracts/media-disposition.json';
const FIX_DIR = join(LANE, 'tools', 'belt', 'fixtures', '04.cards');

const HOOK_ORIGIN_MAP = { minted: 'minted', sme: 'sme-carried', sme_adapted: 'sme-adapted', 'sme-carried': 'sme-carried', 'sme-adapted': 'sme-adapted' };
const DROPPED_CARD_FIELDS = ['bank_q', 'esl_hint', 'audio_file', 'updatable_slot', 'dynamic_note', 'refresh_source_cadence', 'bank_note', 'id'];
const DROPPED_ROOT_FIELDS = ['artifact', 'version', 'input_artifact_refs', 'kg_artifact_hash', 'back_format', 'dynamic_policy', 'deck_count', 'card_count', 'artifact_hash'];

// "[Q16 · p.4] ..." or "... PDF page 4 ..." -> 4; anything else -> null (never guessed).
export function parsePdfPage(ref) {
  const m = /\[Q\d+\s*·\s*p\.(\d+)\]/.exec(ref ?? '') ?? /\bPDF page (\d+)\b/.exec(ref ?? '');
  return m ? Number(m[1]) : null;
}

export function projectV1(v1, { mediaDispositionSha256, v1Sha256 } = {}) {
  const decks = v1.decks.map(d => {
    const clusterOfNode = new Map();
    for (const c of d.cards) if (c.cluster_id) clusterOfNode.set(c.node_id, c.cluster_id);
    return {
      module: d.module,
      module_id: d.module_id,
      domain: d.domain,
      exam_weight: { value: null, status: 'unknown', source_page: null },
      pedagogic_emphasis: { value: typeof d.exam_weight === 'number' ? d.exam_weight : null, kind: 'authored_product_policy' },
      cards: d.cards.map(c => {
        const clusterId = c.cluster_id ?? (clusterOfNode.get(c.node_id) ?? null);
        return {
          card_id: c.id,
          node_id: c.node_id,
          module_id: d.module_id,
          unit_id: c.unit_id ?? null,
          front: c.front,
          back: c.back,
          memory_hook: c.memory_hook,
          hook_origin: HOOK_ORIGIN_MAP[c.hook_origin] ?? c.hook_origin,
          difficulty: c.difficulty,
          high_yield: c.high_yield,
          is_dynamic: c.is_dynamic,
          intro_order: c.intro_order,
          review_interval_tier: c.review_interval_tier,
          cluster_id: clusterId,
          cluster_role: clusterId === null ? null : (c.cluster_id ? 'atomic' : 'umbrella'),
          source_ref: {
            ref: c.source_ref?.ref ?? '',
            tier: c.source_ref?.tier,
            url: c.source_ref?.url ?? null,
            pdf_page: parsePdfPage(c.source_ref?.ref),
            printed_page: null,
            page_map_id: null,
          },
          claims_fact_ids: [],
        };
      }),
    };
  });
  return {
    schema_version: '1.0.0',
    adapter_version: 'carddeck-pilot.v0.4.0',
    minted_by: { model: v1.minted_by?.model ?? '', lane: v1.minted_by?.lane ?? '', pass: v1.minted_by?.pass ?? '' },
    probe: v1.probe,
    input_manifest_sha256: sha256Canonical(v1.input_artifact_refs ?? []),
    candidate_lineage_id: `V1-REFERENCE:${V1_PATH}@${v1Sha256 ?? 'unhashed'} (fixture, not a DMV result)`,
    source_refs: {
      knowledge_graph: (v1.input_artifact_refs ?? []).find(r => r.startsWith('KnowledgeGraph@')) ?? v1.kg_artifact_hash ?? '',
      image_scout_post_kg: 'deferred:not_applicable_pilot',
      curriculum_unit_hints: null,
    },
    media_disposition_ref: { path: MEDIA_DISPOSITION_PATH, sha256: mediaDispositionSha256 },
    back_format: 'spoken_text',
    srs_policy: {
      base_tier_by_difficulty: { ...v1.srs_policy.base_tier_by_difficulty },
      high_yield_rule: /tighten one step/i.test(v1.srs_policy.high_yield_rule ?? '') ? 'tighten_one_step' : v1.srs_policy.high_yield_rule,
      policy_kind: 'product_policy',
      learning_loop_ref: null,
    },
    decks,
    recaps: v1.recaps.map(r => ({ module: r.module, module_id: r.module_id, recap_hooks: r.recap_hooks.map(t => ({ text: t, fact_ids: [] })) })),
    merges: [],
    verification_debt: [],
  };
}

// Minimal spoken-form normalization, applied ONLY to back / memory_hook / recap hook text.
// Rules 1-4 are the V1 run's own pronunciation lexicon (05-voicescripts.json pronunciation[] term->say);
// rules 5-6 are projection rules (no V1 lexicon entry exists for variant slashes or " + ").
export const SPOKEN_RULES = [
  { id: 'R1-v1-lexicon-url', from: 'uscis.gov/citizenship/testupdates', to: 'U S C I S dot gov, slash citizenship, slash test updates' },
  { id: 'R2-v1-lexicon-edition', from: '(01/10)', to: 'the January twenty ten edition' },
  { id: 'R3-v1-lexicon-pipe', from: ' | ', to: ', or, ' },
  { id: 'R4-v1-lexicon-middle-dot', from: ' · ', to: ', ' },
  { id: 'R4b-v1-lexicon-middle-dot-bare', from: '·', to: ', ' },
  { id: 'R5-projection-variant-slash', from: '/', to: ' or ' },
  { id: 'R6-projection-plus', from: ' + ', to: ' plus ' },
];
export function normalizeText(text) {
  let t = text; const applied = [];
  for (const r of SPOKEN_RULES) if (t.includes(r.from)) { t = t.split(r.from).join(r.to); applied.push(r.id); }
  return { text: t, applied };
}
export function spokenFormNormalize(artifact) {
  const a = JSON.parse(JSON.stringify(artifact)); const diff = [];
  for (const d of a.decks) for (const c of d.cards) for (const k of ['back', 'memory_hook']) {
    const { text, applied } = normalizeText(c[k]);
    if (applied.length) { diff.push({ pointer: `card:${c.card_id}/${k}`, before: c[k], after: text, rules: applied }); c[k] = text; }
  }
  for (const r of a.recaps) r.recap_hooks.forEach((h, i) => {
    const { text, applied } = normalizeText(h.text);
    if (applied.length) { diff.push({ pointer: `recap:${r.module_id}/recap_hooks/${i}/text`, before: h.text, after: text, rules: applied }); h.text = text; }
  });
  return { artifact: a, diff };
}

// ---- synthetic interface fixtures (clearly synthetic; no real handbook content) ----
export function syntheticPositive(mediaDispositionSha256) {
  const src = (pdf, printed, pm) => ({ ref: 'SYNTHETIC-FIXTURE-SOURCE (not a handbook, not a source)', tier: 'unverified', url: null, pdf_page: pdf, printed_page: printed, page_map_id: pm });
  const base = { unit_id: null, high_yield: false, is_dynamic: false, cluster_id: null, cluster_role: null };
  return {
    schema_version: '1.0.0', adapter_version: 'carddeck-pilot.v0.4.0',
    minted_by: { model: 'synthetic-fixture', lane: 'none', pass: 'none' },
    probe: 'synthetic-fixture',
    input_manifest_sha256: 'c'.repeat(64),
    candidate_lineage_id: 'SYNTHETIC-NOT-A-RUN',
    source_refs: { knowledge_graph: 'SYNTHETIC-KG', image_scout_post_kg: 'deferred:not_applicable_pilot', curriculum_unit_hints: null },
    media_disposition_ref: { path: MEDIA_DISPOSITION_PATH, sha256: mediaDispositionSha256 },
    back_format: 'spoken_text',
    srs_policy: { base_tier_by_difficulty: { easy: 'relaxed', medium: 'standard', hard: 'tight' }, high_yield_rule: 'tighten_one_step', policy_kind: 'product_policy', learning_loop_ref: null },
    decks: [
      {
        module: 'Synthetic Module One', module_id: 'syn-m01', domain: 'Synthetic domain', exam_weight: { value: null, status: 'unknown', source_page: null }, pedagogic_emphasis: { value: null, kind: 'authored_product_policy' },
        cards: [
          { ...base, card_id: 'syn-card-01', node_id: 'syn-node-01', module_id: 'syn-m01', front: 'Fixture prompt one: what does the synthetic rule require?', back: 'The synthetic rule requires a full stop at the fixture line.', memory_hook: 'Fixture line means full stop', hook_origin: 'sme-carried', difficulty: 'easy', intro_order: 0, review_interval_tier: 'relaxed', source_ref: src(3, '1', 'syn-pm-3'), claims_fact_ids: ['syn-fact-01'] },
          { ...base, card_id: 'syn-card-02', node_id: 'syn-node-02', module_id: 'syn-m01', front: 'Fixture prompt two: name the three synthetic colors.', back: 'Alpha, beta, and gamma', memory_hook: 'Alpha leads, gamma ends', hook_origin: 'minted', difficulty: 'medium', high_yield: true, intro_order: 1, review_interval_tier: 'tight', cluster_id: 'syn-cluster-02', cluster_role: 'umbrella', source_ref: src(3, '1', 'syn-pm-3'), claims_fact_ids: ['syn-fact-02'] },
          { ...base, card_id: 'syn-card-02-a', node_id: 'syn-node-02', module_id: 'syn-m01', front: 'Fixture prompt: which synthetic color comes first?', back: 'Alpha', memory_hook: 'Alpha always comes first', hook_origin: 'minted', difficulty: 'easy', intro_order: 100, review_interval_tier: 'relaxed', cluster_id: 'syn-cluster-02', cluster_role: 'atomic', source_ref: src(3, '1', 'syn-pm-3'), claims_fact_ids: ['syn-fact-02'] },
          { ...base, card_id: 'syn-card-02-b', node_id: 'syn-node-02', module_id: 'syn-m01', front: 'Fixture prompt: which synthetic color comes last?', back: 'gamma', memory_hook: 'Gamma closes the set', hook_origin: 'minted', difficulty: 'easy', intro_order: 101, review_interval_tier: 'relaxed', cluster_id: 'syn-cluster-02', cluster_role: 'atomic', source_ref: src(3, '1', 'syn-pm-3'), claims_fact_ids: ['syn-fact-02'] },
        ],
      },
      {
        module: 'Synthetic Module Two', module_id: 'syn-m02', domain: 'Synthetic domain', exam_weight: { value: null, status: 'unknown', source_page: null }, pedagogic_emphasis: { value: null, kind: 'authored_product_policy' },
        cards: [
          { ...base, card_id: 'syn-card-03', node_id: 'syn-node-03', module_id: 'syn-m02', front: 'Fixture prompt three: how far apart do fixture vehicles stay?', back: 'Fixture vehicles keep twenty fixture units apart.', memory_hook: 'Twenty units apart, always', hook_origin: 'sme-adapted', difficulty: 'hard', is_dynamic: true, intro_order: 0, review_interval_tier: 'tight', source_ref: src(null, '7', 'syn-pm-9'), claims_fact_ids: ['syn-fact-03'] },
        ],
      },
    ],
    recaps: [
      { module: 'Synthetic Module One', module_id: 'syn-m01', recap_hooks: [{ text: 'Full stop, then alpha to gamma', fact_ids: ['syn-fact-01', 'syn-fact-02'] }] },
      { module: 'Synthetic Module Two', module_id: 'syn-m02', recap_hooks: [{ text: 'Twenty units apart', fact_ids: ['syn-fact-03'] }] },
    ],
    merges: [],
    verification_debt: [],
  };
}

export function syntheticContext(mediaDisposition, mediaDispositionSha256) {
  return {
    _context_note: 'SYNTHETIC validator context only — not a fact registry, KG or source of any real run.',
    input_manifest_sha256: 'c'.repeat(64),
    fact_registry: {
      facts: {
        'syn-fact-01': { statement: 'The synthetic rule requires a full stop at the fixture line.', status: 'verified', source_page: '3' },
        'syn-fact-02': { statement: 'Alpha, beta, and gamma', components: ['Alpha', 'beta', 'gamma'], status: 'verified', source_page: '3' },
        'syn-fact-03': { statement: 'Fixture vehicles keep 20 fixture units apart.', spoken_statement: 'Fixture vehicles keep twenty fixture units apart.', status: 'verified', source_page: '9' },
      },
    },
    accepted_inputs: {
      blueprint_mnemonics: { 'syn-node-01': 'Fixture line means full stop', 'syn-node-03': 'Keep twenty fixture units apart' },
      knowledge_graph: {
        modules: [{ module_id: 'syn-m01' }, { module_id: 'syn-m02' }],
        nodes: [{ id: 'syn-node-01', module_id: 'syn-m01' }, { id: 'syn-node-02', module_id: 'syn-m01' }, { id: 'syn-node-03', module_id: 'syn-m02' }],
        dynamic_nodes: ['syn-node-03'],
      },
    },
    page_map: { pages: [{ page_map_id: 'syn-pm-3', pdf_page: 3, printed_page: '1' }, { page_map_id: 'syn-pm-9', pdf_page: 9, printed_page: '7' }] },
    source_document: { text: 'SYNTHETIC SOURCE DOCUMENT, not a handbook. Page three: at the fixture line the synthetic rule asks for a full stop. The three synthetic colors are alpha, beta and gamma. Page nine: every fixture vehicle in this synthetic document keeps a steady distance from the next fixture vehicle on the synthetic road at all times, twenty fixture units.' },
    media_disposition: mediaDisposition,
    ref_sha256: { media_disposition: mediaDispositionSha256 },
  };
}

const card = (a, id) => a.decks.flatMap(d => d.cards).find(c => c.card_id === id);
export const SYNTHETIC_NEGATIVES = [
  { name: 'synthetic-neg-spoken-form', expect: { status: 'FAIL', fail: ['04.BACK_SPOKEN_FORM'] }, note: 'syn-card-03 back uses "20 ft" and " | " shorthand', mutate: a => { card(a, 'syn-card-03').back = 'Fixture vehicles keep 20 ft apart | always.'; } },
  { name: 'synthetic-neg-back-drift', expect: { status: 'FAIL', fail: ['04.BACK_FIDELITY'] }, note: 'syn-card-01 back paraphrased away from accepted wording', mutate: a => { card(a, 'syn-card-01').back = 'The synthetic rule suggests slowing near the fixture line.'; } },
  { name: 'synthetic-neg-hook-srs', expect: { status: 'FAIL', fail: ['04.HOOK_LENGTH', '04.SRS_POLICY', '04.HOOK_ORIGIN'] }, note: 'syn-card-01 ten-word hook, tier tight for easy/non-high-yield, sme-carried no longer equal to mnemonic', mutate: a => { const c = card(a, 'syn-card-01'); c.memory_hook = 'Always remember that the fixture line means a full stop'; c.review_interval_tier = 'tight'; } },
  { name: 'synthetic-neg-uncited', expect: { status: 'FAIL', fail: ['04.PAGE_CITATIONS'] }, note: 'syn-card-01 cites no page and carries no debt', mutate: a => { Object.assign(card(a, 'syn-card-01').source_ref, { pdf_page: null, printed_page: null, page_map_id: null }); } },
  { name: 'synthetic-hold-page-debt', expect: { status: 'HOLD', hold: ['04.PAGE_CITATIONS', '04.VERIFICATION_DEBT'] }, note: 'syn-card-01 cites no page but carries an open missing_page_citation debt -> HOLD, never PASS', mutate: a => { Object.assign(card(a, 'syn-card-01').source_ref, { pdf_page: null, printed_page: null, page_map_id: null }); a.verification_debt.push({ debt_id: 'syn-debt-01', card_id: 'syn-card-01', kind: 'missing_page_citation', route_to: '15', note: 'page locator not yet bound by role 15' }); } },
  { name: 'synthetic-neg-verify-leak', expect: { status: 'FAIL', fail: ['04.LEARNER_SCAFFOLD'] }, note: 'syn-card-01 hook carries "(verify)" into learner text', mutate: a => { card(a, 'syn-card-01').memory_hook = 'Full stop (verify)'; } },
  { name: 'synthetic-neg-atomic', expect: { status: 'FAIL', fail: ['04.ATOMIC_CLUSTER'] }, note: 'atomic syn-card-02-b back is neither an umbrella span nor an accepted component', mutate: a => { card(a, 'syn-card-02-b').back = 'Gamma comes last'; } },
  { name: 'synthetic-neg-duplicate-back', expect: { status: 'FAIL', fail: ['04.DUPLICATE_BACKS'] }, note: 'a second card repeats syn-card-01 back', mutate: a => { const c = JSON.parse(JSON.stringify(card(a, 'syn-card-01'))); c.card_id = 'syn-card-01-dup'; c.front = 'Fixture prompt one again?'; c.intro_order = 2; a.decks[0].cards.push(c); } },
  { name: 'synthetic-neg-originality', expect: { status: 'FAIL', fail: ['04.ORIGINALITY'] }, note: 'syn-card-03 front copies a 20-word run of the registered synthetic source', mutate: a => { card(a, 'syn-card-03').front = 'Is it true that every fixture vehicle in this synthetic document keeps a steady distance from the next fixture vehicle on the synthetic road?'; } },
  { name: 'synthetic-neg-official-number', expect: { status: 'FAIL', fail: ['04.EXAM_WEIGHT_STATUS'] }, note: 'deck 1 carries a numeric official weight hint (40) under status unknown; deck 2 claims verified with no source page', mutate: a => { a.decks[0].exam_weight = { value: 40, status: 'unknown', source_page: null }; a.decks[1].exam_weight = { value: 60, status: 'verified', source_page: null }; } },
  { name: 'synthetic-neg-deictic-visual', expect: { status: 'FAIL', fail: ['04.MEDIA_DISPOSITION'] }, note: 'front says "this sign" while image cards are disabled and no asset can be bound', mutate: a => { card(a, 'syn-card-01').front = 'Fixture prompt: what does this sign require?'; } },
];

const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  mkdirSync(FIX_DIR, { recursive: true });
  const v1Abs = join(NOVA, V1_PATH); const kgAbs = join(NOVA, V1_KG_PATH); const mdAbs = join(LANE, MEDIA_DISPOSITION_PATH);
  const v1Sha = sha256File(v1Abs); const kgSha = sha256File(kgAbs); const mdSha = sha256File(mdAbs);
  const projectorSha = sha256File(fileURLToPath(import.meta.url));
  const v1 = JSON.parse(readFileSync(v1Abs, 'utf8'));
  const kg = JSON.parse(readFileSync(kgAbs, 'utf8'));
  const md = JSON.parse(readFileSync(mdAbs, 'utf8'));
  const projected = projectV1(v1, { mediaDispositionSha256: mdSha, v1Sha256: v1Sha });
  const nCards = projected.decks.reduce((n, d) => n + d.cards.length, 0);
  const droppedCard = {}; for (const d of v1.decks) for (const c of d.cards) for (const k of DROPPED_CARD_FIELDS) if (k in c && k !== 'id') droppedCard[k] = (droppedCard[k] ?? 0) + 1;
  const meta = (kind, extra) => ({
    kind, label: 'FIXTURE/REFERENCE — projected from the V1 citizenship run; never a DMV production result',
    source: { path: V1_PATH, sha256: v1Sha }, projector: { path: 'tools/belt/project/04-cards.mjs', sha256: projectorSha },
    counts: { decks: projected.decks.length, cards: nCards, recaps: projected.recaps.length },
    decisions: [
      'card.id -> card_id; deck module_id copied onto every card as module_id',
      'hook_origin sme -> sme-carried, sme_adapted -> sme-adapted, minted -> minted',
      'source_ref.pdf_page parsed from "[Qn · p.N]" / "PDF page N" in source_ref.ref; 19 refs without a page (3 derived atomics, 16 M-715 English cards) -> null; printed_page and page_map_id null (V1 has no page map)',
      'claims_fact_ids = [] on every card and recap hook: V1 carries no fact ids; none are invented',
      'cluster: V1 atomics keep cluster_id; the cluster umbrella (same node_id, no cluster_id in V1) is assigned that cluster_id with cluster_role umbrella',
      'V1 deck exam_weight number -> pedagogic_emphasis {value, kind:"authored_product_policy"}; official exam_weight -> {value:null, status:"unknown", source_page:null}: the V1 number is a role-03 computed share of the bank and no issuer page states a weight, so it is never promoted to an official weight',
      'review_interval_tier copied verbatim (14 M-715 cards carry the V1 value "2", an out-of-enum value)',
      'srs_policy.high_yield_rule "tighten one step (...)" -> "tighten_one_step"; policy_kind product_policy; learning_loop_ref null',
      'back_format declared spoken_text (the pilot requirement); V1 rule was the " | " join, so V1 backs are linted as-is',
      'source_refs added: knowledge_graph = V1 input_artifact_refs KnowledgeGraph entry; image_scout_post_kg = sentinel; curriculum_unit_hints null',
      `media_disposition_ref = ${MEDIA_DISPOSITION_PATH}@${mdSha} (pilot binding added by the projection; V1 was not produced under it)`,
      'input_manifest_sha256 = sha256(canonicalJson(V1 input_artifact_refs)) — a projection digest of V1 input refs, NOT a real input manifest; candidate_lineage_id labels the fixture',
      `dropped V1 card fields: ${JSON.stringify(droppedCard)}; dropped V1 root fields: ${DROPPED_ROOT_FIELDS.join(', ')}`,
      'merges [] and verification_debt [] (V1 records neither)',
    ],
    ...extra,
  });
  const v1Context = {
    _context_note: 'V1 reference context: only what V1 artifacts honestly provide. No fact registry, Blueprint mnemonic map, page map or input manifest exists for V1 -> those checks HOLD.',
    accepted_inputs: {
      knowledge_graph: {
        _source: { path: V1_KG_PATH, sha256: kgSha, view: 'modules[].id, nodes[].{id,module_id}, dynamic_nodes[].answers_bank_node (non-null)' },
        modules: kg.modules.map(m => ({ module_id: m.id })),
        nodes: kg.nodes.map(n => ({ id: n.id, module_id: n.module_id })),
        dynamic_nodes: kg.dynamic_nodes.map(n => n.answers_bank_node).filter(Boolean),
      },
    },
    media_disposition: md,
    ref_sha256: { media_disposition: mdSha },
  };
  writeJson(join(FIX_DIR, 'v1-projected.json'), { _fixture: meta('v1_projection', {}), ...projected });
  writeJson(join(FIX_DIR, 'v1-projected.context.json'), v1Context);
  const { artifact: fixed, diff } = spokenFormNormalize(projected);
  const ruleCounts = {}; for (const d of diff) for (const r of d.rules) ruleCounts[r] = (ruleCounts[r] ?? 0) + 1;
  writeJson(join(FIX_DIR, 'v1-projected-spokenform-fixed.json'), {
    _fixture: meta('v1_projection_spokenform_normalized', {
      normalization: { scope: 'back, memory_hook, recap_hooks[].text only; nothing else changed', rules: SPOKEN_RULES, fields_changed: diff.length, rule_counts: ruleCounts },
      diff,
    }),
    ...fixed,
  });
  writeJson(join(FIX_DIR, 'v1-projected-spokenform-fixed.context.json'), v1Context);
  const pos = syntheticPositive(mdSha);
  const ctx = syntheticContext(md, mdSha);
  const synMeta = (kind, note, expect) => ({ kind, label: 'SYNTHETIC validator interface fixture — not a qualification, source or run', generator: { path: 'tools/belt/project/04-cards.mjs', sha256: projectorSha }, note, expect });
  writeJson(join(FIX_DIR, 'synthetic-positive.json'), { _fixture: synMeta('synthetic_positive', 'all 04 checks satisfiable with the sibling synthetic context', { status: 'PASS' }), ...pos });
  writeJson(join(FIX_DIR, 'synthetic-positive.context.json'), ctx);
  writeJson(join(FIX_DIR, 'synthetic-hold-no-context.json'), { _fixture: synMeta('synthetic_hold', 'positive bytes with NO context: every context-bound check must HOLD, never PASS', { status: 'HOLD' }), ...pos });
  for (const n of SYNTHETIC_NEGATIVES) {
    const a = JSON.parse(JSON.stringify(pos)); n.mutate(a);
    writeJson(join(FIX_DIR, `${n.name}.json`), { _fixture: synMeta(n.expect.status === 'HOLD' ? 'synthetic_hold' : 'synthetic_negative', n.note, n.expect), ...a });
    writeJson(join(FIX_DIR, `${n.name}.context.json`), ctx);
  }
  console.log(JSON.stringify({ written: FIX_DIR, v1_sha256: v1Sha, cards: nCards, spokenform_fields_changed: diff.length, rule_counts: ruleCounts }, null, 2));
}
