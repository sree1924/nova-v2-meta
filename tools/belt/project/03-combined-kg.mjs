// V1 projection + synthetic fixture builder for stage 03.combined_kg.
// projectV1(v1KnowledgeGraph, {sourcePath, sourceSha256}) -> pilot-adapter KnowledgeGraph (+ _fixture provenance)
// CLI: node tools/belt/project/03-combined-kg.mjs --write   (writes tools/belt/fixtures/03.combined_kg/*)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from '../lib/hash.mjs';
import { SENTINEL } from '../checks/03-combined-kg.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
export const V1_SOURCE = 'D:/nova/runs/2026-06-11-citizenship/03-knowledge-graph.json';
export const V1_BLUEPRINT = 'D:/nova/runs/2026-06-11-citizenship/16-blueprint.json';
export const V1_REGISTRY = 'D:/nova/runs/2026-06-11-citizenship/15-source-registry.json';
export const MEDIA_DISPOSITION = join(LANE, 'contracts', 'media-disposition.json');

// "[Q16 · p.4] … PDF page 4 — source [S1]" -> "S1#p.4"; "[S3] + whitehouse.gov…" -> "S3"; none -> null
export function sourcePageOf(ref) {
  const s = /\[(S\d+[a-z]?)\]/.exec(ref ?? '');
  if (!s) return null;
  const p = /PDF page (\d+)/.exec(ref);
  return p ? `${s[1]}#p.${p[1]}` : s[1];
}
const srcRef = (r) => ({ ref: r.ref, tier: r.tier, url: r.url ?? null, source_page: sourcePageOf(r.ref) });

export function projectV1(kg, { sourcePath = V1_SOURCE, sourceSha256 = null } = {}) {
  const decisions = [];
  const recipe = kg.department_pass?.kg04?.learning_weight_recipe ?? 'V1 learning_weight';
  const nodes = kg.nodes.map(n => ({
    id: n.id,
    label: n.label,
    domain: n.domain,
    module_id: n.module_id,
    node_type: n.id.startsWith('eng.') ? 'meta_item' : 'bank_item',
    official_weight: { value: n.exam_weight, status: 'authored', source_page: sourcePageOf(n.source_ref?.ref) },
    pedagogic_emphasis: { value: n.learning_weight ?? null, status: 'authored', basis: `V1 KG-04 learning_weight: ${recipe}` },
    difficulty: n.difficulty,
    high_yield: n.high_yield,
    fact_ids: [n.id],
    source_ref: srcRef(n.source_ref),
    confidence: n.confidence,
    needs_review: n.needs_review,
    confusable_with: [],
    no_confusable_reason: null,
  }));
  decisions.push('official_weight: V1 exam_weight (100/128 per bank item) is a bank-share computed from the verified M-1778 item counts, but no USCIS page states a per-question or per-section ASK weight (02-blueprint.md BLUEPRINT heading: "the per-section mix of the 20 asked is not published — do not assume proportional selection"; AF-3). It is therefore NOT a page-stated official weight -> status "authored", value kept, source_page = the cited bank page. Not "verified".');
  decisions.push('pedagogic_emphasis: V1 learning_weight, status authored, basis = V1 kg04.learning_weight_recipe.');
  decisions.push('node_type: V1 nodes carry no node_type; V1 ontology defines bank_item and meta_item (M-715 English vocabulary) -> eng.* ids = meta_item, all others bank_item.');
  decisions.push('fact_ids: V1 node id == 16-blueprint fact_id (1 fact = 1 node per V1 kg01.extraction) -> fact_ids [id].');
  decisions.push('source_ref.source_page: first [S<n>] token in the V1 ref, plus "#p.<k>" when the ref says "PDF page <k>".');
  decisions.push('confusable_with: V1 carries confusables only as 34 easily_confused edges (+4 out-of-set label notes) with NO per-pair reason -> [] and no_confusable_reason null; no reasons are synthesized, so high-yield nodes fail 03.CONFUSABLE_SOURCE_BOUND.');

  const edges = kg.edges.map(e => ({ from: e.from, to: e.to, type: e.type, origin: e.origin, confidence: e.confidence ?? null }));
  decisions.push('edges: V1 edges carry from/to/type/origin but no confidence -> confidence null (03.EDGE_TYPED reports it).');

  const modules = kg.modules.map(m => ({
    module_id: m.module_id ?? m.id,
    title: m.title,
    domain: m.domain,
    official_weight: { value: m.weight, status: 'authored', source_page: null },
    pedagogic_emphasis: { value: null, status: 'authored', basis: 'not recorded on the V1 module (V1 module weight = sum of member exam_weights)' },
    node_ids: m.node_ids,
    media_slot_ids: m.media_slot_ids ?? [],
  }));
  decisions.push('modules: V1 "id" -> module_id; V1 weight (sum of member bank-share weights) -> official_weight authored, source_page null; module pedagogic_emphasis not in V1 -> null; media_slot_ids absent -> [].');

  const dp = kg.department_pass;
  const dynamic_nodes = kg.dynamic_nodes.map(d => ({ id: d.id, label: d.label, why_dynamic: d.why_dynamic, fact_ids: [d.id], source_ref: srcRef(d.source_ref) }));
  const dropReason = (r) => (/^redundant/.test(r) ? 'redundant' : /^out_of_set/.test(r) ? 'out_of_set' : /^wrong_direction/.test(r) ? 'wrong_direction' : null);
  const dropped_hints = dp.kg03.dropped_hints.map(h => ({ from: h.from, to: h.to, reason: dropReason(h.reason) }));
  decisions.push(`kg03.dropped_hints: V1 reasons mapped by prefix (redundant_transitive -> redundant; out_of_set_label_distractor -> out_of_set): ${dp.kg03.dropped_hints.map(h => h.reason.split(' ')[0]).join(', ')}.`);
  const nodesExtracted = /^(\d+)\/\1 facts/.exec(dp.kg01.sourcing ?? '');
  const out = {
    _fixture: {
      kind: 'v1_projected',
      label: 'FIXTURE/REFERENCE ONLY — projected from the V1 citizenship KnowledgeGraph; never a DMV production result',
      source: { path: sourcePath, sha256: sourceSha256 },
      generator: 'tools/belt/project/03-combined-kg.mjs#projectV1',
      decisions,
    },
    artifact: 'KnowledgeGraph',
    schema_version: '1.0.0',
    adapter: 'pilot_adapter@0.4.0',
    stage_id: '03.combined_kg',
    minted_by: { model: String(kg.minted_by.model), lane: String(kg.minted_by.lane), pass: String(kg.minted_by.pass) },
    probe: kg.probe,
    version: kg.version,
    lineage: { input_manifest_sha256: null, candidate_lineage_id: null },
    source_refs: {
      enriched_blueprint: kg.source_refs.enriched_blueprint,
      learning_loop: null,
      media_disposition: null,
      weighted_graph: 'inline@KG-04',
      edge_set: 'inline@KG-03',
      ontology: 'inline@KG-02',
      image_scout_pre_kg: SENTINEL,
    },
    nodes,
    edges,
    modules,
    curriculum_unit_hints: [],
    learning_path: kg.learning_path,
    learning_path_rule: { dynamic_excluded: true, rule: dp.kg05.path_order },
    dynamic_nodes,
    department_pass: {
      kg01: { origin: 'inline@KG-01', verdict: dp.kg01.verdict, gaps: [], nodes_extracted: nodesExtracted ? Number(nodesExtracted[1]) : 0, merges: dp.kg01.merges ?? [], dynamic_concepts: dynamic_nodes.map(d => d.id) },
      kg02: {
        origin: 'inline@KG-02',
        node_types: kg.ontology.node_types,
        edge_types: kg.ontology.edge_types.map(t => ({ type: t.type, directed: t.directed, acyclic: t.acyclic, definition: t.definition })),
        acyclic: dp.kg03.acyclic,
        weight_closure: { basis: 'authored_basis', sum: null, within_tolerance: null },
        placements: [],
      },
      kg03: { origin: 'inline@KG-03', edges: edges.map(e => ({ ...e })), acyclic: dp.kg03.acyclic, cycles_resolved: [], dropped_hints },
      kg04: {
        origin: 'inline@KG-04',
        domain_emphasis_check: dp.kg04.domain_emphasis_check.map(r => ({ domain: r.domain, blueprint_pct: r.blueprint_pct, weight_status: 'authored', computed_pct: r.computed_pct, drift_pp: r.drift_pp, comparison_basis: 'authored_basis', within_tolerance: r.within_tolerance })),
      },
      kg05: {
        origin: 'inline@KG-05',
        sequencing: { rule: dp.kg05.path_order, module_order: dp.kg05.module_learning_order },
        validation_assertions: { prerequisite_violations: null, orphan_nodes: 0, double_homes: 0, dynamic_quarantined: null, path_check: null },
      },
    },
  };
  decisions.push('source_refs: V1 inline@KG-0x strings carry parenthetical notes -> normalized to the adapter enum values; learning_loop/media_disposition not bound by the V1 KG -> null (03.LEARNING_INPUT_BOUND FAILs); image_scout_pre_kg did not exist in V1 (predates the 2026-06-14 amendment) -> pilot sentinel.');
  decisions.push(`kg01: verdict ${dp.kg01.verdict}, gaps [] (V1 lists none), nodes_extracted ${out.department_pass.kg01.nodes_extracted} parsed from V1 sourcing "${dp.kg01.sourcing}", dynamic_concepts = dynamic_nodes ids.`);
  decisions.push('kg02: node/edge types from V1 ontology; acyclic = V1 kg03.acyclic claim (kg02 makes none); weight_closure basis authored_basis with sum/within null (V1 states closure only in prose); placements [] (V1 records only a summary string).');
  decisions.push('kg04: V1 rows kept; weight_status authored + comparison_basis authored_basis (blueprint_pct is a bank-share, see official_weight decision).');
  decisions.push('kg05: orphan_nodes 0 and double_homes 0 taken from V1 kg02.placements ("zero orphans, zero double-homes"); other assertions unclaimed in V1 -> null; scripts recompute all.');
  decisions.push('curriculum_unit_hints: absent in V1 -> [] (03.CURRICULUM_HINTS FAILs).');
  decisions.push('lineage: V1 has no input manifest / candidate lineage -> null.');
  return out;
}

// ---------- synthetic fixtures ----------
export function buildSynthetic(mediaDisposition) {
  const unk = { value: null, status: 'unknown', source_page: null };
  const emph = (v) => ({ value: v, status: 'authored', basis: 'synthetic: authored pedagogic emphasis (product policy), not an exam weight' });
  const sref = (p) => ({ ref: `Example handbook (synthetic) ${p}`, tier: 'official', url: null, source_page: `SYN-HB#${p}` });
  const node = (id, mod, label, e, hy, conf, reason) => ({ id, label, domain: mod === 'm01' ? 'Signs (synthetic)' : 'Right of way (synthetic)', module_id: mod, node_type: 'rule', official_weight: { ...unk }, pedagogic_emphasis: emph(e), difficulty: 'medium', high_yield: hy, fact_ids: [`f.${id}`], source_ref: sref('p.1'), confidence: 'high', needs_review: false, confusable_with: conf, no_confusable_reason: reason });
  const nodes = [
    node('n1', 'm01', 'Stop sign requires a full stop', 30, true, [{ other_id: 'n2', why: 'both signs control entry; f.n1 requires a full stop, f.n2 requires only slowing and yielding', fact_ids: ['f.n1', 'f.n2'] }], null),
    node('n2', 'm01', 'Yield sign requires slowing and yielding', 20, false, [], null),
    node('n3', 'm02', 'Four-way stop arrival order', 30, true, [], 'no page-supported confusable in the accepted facts'),
    node('n4', 'm02', 'Pedestrians in a marked crosswalk', 20, false, [], null),
  ];
  const edges = [
    { from: 'n1', to: 'n3', type: 'prerequisite', origin: 'sme_hint', confidence: 'high' },
    { from: 'n2', to: 'n4', type: 'prerequisite', origin: 'domain_logic', confidence: 'medium' },
    { from: 'n1', to: 'n2', type: 'easily_confused', origin: 'sme_hint', confidence: 'high' },
  ];
  const modules = [
    { module_id: 'm01', title: 'Signs', domain: 'Signs (synthetic)', official_weight: { ...unk }, pedagogic_emphasis: emph(50), node_ids: ['n1', 'n2'], media_slot_ids: [] },
    { module_id: 'm02', title: 'Right of way', domain: 'Right of way (synthetic)', official_weight: { ...unk }, pedagogic_emphasis: emph(50), node_ids: ['n3', 'n4'], media_slot_ids: [] },
  ];
  const hint = (m, u, ids) => ({ module_id: m, unit_id: u, node_ids: ids, user_cycle: ['session', 'flashcards', 'module_hub', 'missed_review', 'spaced_review'], hub_options: ['module_quiz', 'flashcards', 'session'], session_strategy: 'teach rules in prerequisite order', flashcard_strategy: 'visible-answer cards, one fact each', quiz_strategy: 'hub-chosen module quiz', media_slot_ids: [] });
  const positive = {
    _fixture: { kind: 'synthetic', label: 'SYNTHETIC interface fixture — unknown official weights with NO fabricated number (must PASS)', generator: 'tools/belt/project/03-combined-kg.mjs#buildSynthetic', expected_status_with_context: 'PASS' },
    artifact: 'KnowledgeGraph', schema_version: '1.0.0', adapter: 'pilot_adapter@0.4.0', stage_id: '03.combined_kg',
    minted_by: { model: 'synthetic', lane: 'fixture', pass: 'none' }, probe: 'synthetic-probe', version: '0.4.0-synthetic',
    lineage: { input_manifest_sha256: 'c'.repeat(64), candidate_lineage_id: 'lineage-synthetic-003' },
    source_refs: { enriched_blueprint: 'synthetic/17-enriched-blueprint.json', learning_loop: 'synthetic/19-learning-loop.json', media_disposition: 'contracts/media-disposition.json', weighted_graph: 'inline@KG-04', edge_set: 'inline@KG-03', ontology: 'inline@KG-02', image_scout_pre_kg: SENTINEL },
    nodes, edges, modules,
    curriculum_unit_hints: [hint('m01', 'u01', ['n1', 'n2']), hint('m02', 'u02', ['n3', 'n4'])],
    learning_path: ['n1', 'n2', 'n3', 'n4'],
    learning_path_rule: { dynamic_excluded: true, rule: 'topological; high emphasis first; dynamic_nodes never on the path' },
    dynamic_nodes: [{ id: 'd1', label: 'Current fee (refreshable)', why_dynamic: 'fees change by notice', fact_ids: ['f.d1'], source_ref: sref('p.2') }],
    department_pass: {
      kg01: { origin: 'inline@KG-01', verdict: 'PASS', gaps: [{ type: 'thin_domain', located_at: 'C.04', detail: 'right-of-way has two facts', severity: 'advisory' }], nodes_extracted: 4, merges: [], dynamic_concepts: ['d1'] },
      kg02: { origin: 'inline@KG-02', node_types: [{ type: 'rule', definition: 'one accepted page-sourced rule' }], edge_types: [{ type: 'prerequisite', directed: true, acyclic: true, definition: 'learn from before to' }, { type: 'easily_confused', directed: false, acyclic: false, definition: 'commonly swapped pair' }], acyclic: true, weight_closure: { basis: 'unknown', sum: null, within_tolerance: null }, placements: [] },
      kg03: { origin: 'inline@KG-03', edges: edges.map(e => ({ ...e })), acyclic: true, cycles_resolved: [], dropped_hints: [] },
      kg04: { origin: 'inline@KG-04', domain_emphasis_check: [
        { domain: 'Signs (synthetic)', blueprint_pct: null, weight_status: 'unknown', computed_pct: 50, drift_pp: null, comparison_basis: 'none', within_tolerance: null },
        { domain: 'Right of way (synthetic)', blueprint_pct: null, weight_status: 'unknown', computed_pct: 50, drift_pp: null, comparison_basis: 'none', within_tolerance: null },
      ] },
      kg05: { origin: 'inline@KG-05', sequencing: { rule: 'topological then emphasis', module_order: ['m01', 'm02'] }, validation_assertions: { prerequisite_violations: 0, orphan_nodes: 0, double_homes: 0, dynamic_quarantined: 1, path_check: 'PASS' } },
    },
  };
  const context = {
    _fixture: { kind: 'synthetic_context', label: 'SYNTHETIC context for 03 synthetic fixtures; media_disposition embedded from contracts/media-disposition.json' },
    input_manifest_sha256: 'c'.repeat(64),
    accepted_inputs: { high_yield_ids: ['n1', 'n3'], learning_loop_ref: 'synthetic/19-learning-loop.json' },
    fact_registry: { facts: { 'f.n1': {}, 'f.n2': {}, 'f.n3': {}, 'f.n4': {}, 'f.d1': {} } },
    source_registry: { pages: { 'SYN-HB': { tier: 'official' } } },
    media_disposition: mediaDisposition,
  };
  const fabricated = structuredClone(positive);
  fabricated._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — bare number under unknown weight status (must FAIL)', expected_status_with_context: 'FAIL', expected_failing_checks: ['03.WEIGHT_HONESTY', '03.DOMAIN_EMPHASIS'] };
  fabricated.nodes[0].official_weight = { value: 12.5, status: 'unknown', source_page: null };
  fabricated.department_pass.kg04.domain_emphasis_check[0].blueprint_pct = 60;
  const cycle = structuredClone(positive);
  cycle._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — prerequisite cycle (must FAIL)', expected_status_with_context: 'FAIL', expected_failing_checks: ['03.ACYCLIC', '03.PATH_TOPOLOGICAL', '03.KG05_ASSERTIONS'] };
  const back = { from: 'n3', to: 'n1', type: 'prerequisite', origin: 'domain_logic', confidence: 'low' };
  cycle.edges.push(back); cycle.department_pass.kg03.edges.push({ ...back });
  return { positive, context, fabricated, cycle };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const dir = join(LANE, 'tools', 'belt', 'fixtures', '03.combined_kg');
  mkdirSync(dir, { recursive: true });
  const kg = JSON.parse(readFileSync(V1_SOURCE, 'utf8'));
  const v1 = projectV1(kg, { sourceSha256: sha256File(V1_SOURCE) });
  const bp = JSON.parse(readFileSync(V1_BLUEPRINT, 'utf8'));
  const facts = {};
  for (const k of bp.knowledge) for (const f of k.facts ?? []) facts[f.fact_id] = { domain: k.domain, source_ref: f.source_ref?.ref ?? null };
  for (const u of bp.updatable ?? []) facts[u.fact_id] = { domain: 'updatable', source_ref: u.source_ref?.ref ?? null };
  const md = JSON.parse(readFileSync(MEDIA_DISPOSITION, 'utf8'));
  const v1ctx = {
    _fixture: {
      kind: 'v1_projected_context',
      label: 'context for the V1 projection: V1 SourceRegistry verbatim, fact_registry = fact_ids of the V1 compiled Blueprint (knowledge[].facts[] + updatable[]), lane media disposition; no input manifest, no machine-readable source high-yield set exists for V1',
      sources: [
        { path: V1_REGISTRY, sha256: sha256File(V1_REGISTRY) },
        { path: V1_BLUEPRINT, sha256: sha256File(V1_BLUEPRINT) },
        { path: 'contracts/media-disposition.json', sha256: sha256File(MEDIA_DISPOSITION) },
      ],
    },
    source_registry: JSON.parse(readFileSync(V1_REGISTRY, 'utf8')),
    fact_registry: { facts },
    media_disposition: md,
  };
  const { positive, context, fabricated, cycle } = buildSynthetic(md);
  const w = (name, obj) => { writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + '\n'); console.log(`${name} ${sha256File(join(dir, name))}`); };
  const ptr = (name, base) => w(`${name}.context.json`, { $load: `tools/belt/fixtures/03.combined_kg/${base}` });
  const hold = structuredClone(positive);
  hold._fixture = { kind: 'synthetic', label: 'SYNTHETIC — positive KG with NO context -> HOLD, never PASS', expected_status: 'HOLD' };
  w('v1-projected.json', v1);
  w('v1-context.json', v1ctx);
  w('synthetic-positive.json', positive);
  w('synthetic-context.json', context);
  w('synthetic-negative-fabricated-weight.json', fabricated);
  w('synthetic-negative-cycle.json', cycle);
  w('synthetic-hold-no-context.json', hold);
  ptr('v1-projected', 'v1-context.json');
  for (const n of ['synthetic-positive', 'synthetic-negative-fabricated-weight', 'synthetic-negative-cycle']) ptr(n, 'synthetic-context.json');
}
