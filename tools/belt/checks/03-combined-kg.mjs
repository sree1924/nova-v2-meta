// Compensating checks for stage 03.combined_kg (adapter schemas-strict/03-knowledge-graph.schema.json).
// Pure: no network, no writes, no clock. Model-supplied department claims are advisory; the script recomputes them.
export const stage_id = '03.combined_kg';
export const SENTINEL = 'deferred:not_applicable_pilot';
export const DRIFT_TOLERANCE_PP = 2.0;           // KG-04: verified-basis domain emphasis drift ceiling
export const RECOMPUTE_TOLERANCE_PP = 0.1;       // rounding allowance when comparing model-claimed numbers to recomputed ones
export const CLOSURE_TOLERANCE = 1.0;            // KG-02: module weights sum to ~100

const P = 'PASS', F = 'FAIL', H = 'HOLD';
const chk = (id, status, evidence, metrics) => (metrics ? { check_id: `03.${id}`, status, evidence, metrics } : { check_id: `03.${id}`, status, evidence });
const arr = (v) => (Array.isArray(v) ? v : []);
const head = (list, n = 8) => list.slice(0, n).join('; ') + (list.length > n ? `; … (+${list.length - n} more)` : '');
const round = (x, d = 3) => (x == null ? null : Math.round(x * 10 ** d) / 10 ** d);
const dups = (list) => [...new Set(list.filter((v, i) => list.indexOf(v) !== i))];

function registryCodes(registry) {
  const codes = new Set();
  if (!registry || typeof registry !== 'object') return codes;
  if (registry.pages && typeof registry.pages === 'object') for (const k of Array.isArray(registry.pages) ? registry.pages.map(p => p?.page_id ?? p?.id) : Object.keys(registry.pages)) if (k) codes.add(String(k));
  for (const s of arr(registry.sources)) for (const k of ['page_id', 'source_page', 'id', 'source_ref', 'blueprint_s_code']) if (s?.[k]) codes.add(String(s[k]));
  return codes;
}
const pageRegistered = (page, codes) => !!page && (codes.has(page) || codes.has(String(page).split('#')[0]));

// Kahn's algorithm over prerequisite edges; returns the node ids left in cycles.
export function prerequisiteCycleNodes(nodeIds, edges) {
  const ids = new Set(nodeIds);
  const indeg = new Map([...ids].map(i => [i, 0]));
  const adj = new Map([...ids].map(i => [i, []]));
  for (const e of arr(edges)) if (e.type === 'prerequisite' && ids.has(e.from) && ids.has(e.to)) { adj.get(e.from).push(e.to); indeg.set(e.to, indeg.get(e.to) + 1); }
  const q = [...ids].filter(i => indeg.get(i) === 0);
  let seen = 0;
  while (q.length) { const n = q.shift(); seen++; for (const m of adj.get(n)) { indeg.set(m, indeg.get(m) - 1); if (indeg.get(m) === 0) q.push(m); } }
  return seen === ids.size ? [] : [...ids].filter(i => indeg.get(i) > 0);
}

function weightProblems(where, w) {
  const errs = [];
  if (!w || typeof w !== 'object') return [`${where}: official_weight missing`];
  if (w.status === 'unknown' && w.value !== null) errs.push(`${where}: status unknown carries number ${w.value} (fabricated weight)`);
  if (w.status === 'verified' && (w.value === null || !w.source_page)) errs.push(`${where}: verified weight needs value and source_page (got ${w.value}, ${w.source_page})`);
  if (w.status === 'authored' && w.value === null) errs.push(`${where}: authored with null value (use status unknown)`);
  if (typeof w.value === 'number' && w.value < 0) errs.push(`${where}: negative weight ${w.value}`);
  return errs;
}

export function recompute(a) {
  const nodes = arr(a.nodes);
  const nodeIds = nodes.map(n => n.id);
  const idSet = new Set(nodeIds);
  const dynIds = new Set(arr(a.dynamic_nodes).map(d => d.id));
  const homes = new Map(nodeIds.map(i => [i, 0]));
  for (const m of arr(a.modules)) for (const id of arr(m.node_ids)) if (homes.has(id)) homes.set(id, homes.get(id) + 1);
  const path = arr(a.learning_path);
  const pos = new Map(path.map((id, i) => [id, i]));
  const violations = arr(a.edges).filter(e => e.type === 'prerequisite' && pos.has(e.from) && pos.has(e.to) && pos.get(e.from) > pos.get(e.to)).map(e => `${e.from}->${e.to}`);
  const orphanNodes = nodeIds.filter(i => homes.get(i) === 0);
  const doubleHomes = nodeIds.filter(i => homes.get(i) > 1);
  const offPath = nodeIds.filter(i => !pos.has(i));
  const dynamicLeaks = [...dynIds].filter(i => pos.has(i) || idSet.has(i) || arr(a.modules).some(m => arr(m.node_ids).includes(i)));
  const cycleNodes = prerequisiteCycleNodes(nodeIds, a.edges);
  return {
    prerequisite_violations: violations.length, violations,
    orphan_nodes: orphanNodes.length, orphanNodes,
    double_homes: doubleHomes.length, doubleHomes,
    off_path: offPath,
    dynamic_quarantined: dynIds.size - dynamicLeaks.length, dynamicLeaks,
    cycleNodes,
    path_check: violations.length === 0 && offPath.length === 0 && dynamicLeaks.length === 0 && cycleNodes.length === 0 ? 'PASS' : 'FAIL',
  };
}

export function run(artifact, context = {}) {
  const a = artifact ?? {};
  const nodes = arr(a.nodes);
  const byId = new Map(nodes.map(n => [n.id, n]));
  const modules = arr(a.modules);
  const edges = arr(a.edges);
  const dp = a.department_pass ?? {};
  const codes = context.source_registry ? registryCodes(context.source_registry) : null;
  const rc = recompute(a);
  const out = [];

  out.push(/^[a-z0-9][a-z0-9-]*$/.test(a.probe ?? '') ? chk('PROBE_SLUG', P, `probe "${a.probe}" matches ^[a-z0-9][a-z0-9-]*$`) : chk('PROBE_SLUG', F, `probe "${a.probe}" violates ^[a-z0-9][a-z0-9-]*$`));

  if (!context.input_manifest_sha256) out.push(chk('LINEAGE', H, 'context.input_manifest_sha256 absent; cannot bind KG to its scoped input manifest'));
  else out.push(a.lineage?.input_manifest_sha256 === context.input_manifest_sha256 && a.lineage?.candidate_lineage_id
    ? chk('LINEAGE', P, `input_manifest_sha256 matches; candidate_lineage_id=${a.lineage.candidate_lineage_id}`)
    : chk('LINEAGE', F, `lineage ${JSON.stringify(a.lineage)} does not bind context manifest ${context.input_manifest_sha256}`));

  // ID_INTEGRITY — unique ids; dynamic nodes quarantined from nodes/modules.
  {
    const errs = [];
    const d1 = dups(nodes.map(n => n.id)); if (d1.length) errs.push(`duplicate node ids ${d1.join(',')}`);
    const dynIds = arr(a.dynamic_nodes).map(d => d.id);
    const d2 = dups(dynIds); if (d2.length) errs.push(`duplicate dynamic ids ${d2.join(',')}`);
    const both = dynIds.filter(i => byId.has(i)); if (both.length) errs.push(`dynamic ids also stable nodes: ${both.join(',')}`);
    const d3 = dups(modules.map(m => m.module_id)); if (d3.length) errs.push(`duplicate module ids ${d3.join(',')}`);
    for (const n of nodes) if (!arr(n.fact_ids).length) errs.push(`${n.id} has no fact_ids`);
    for (const d of arr(a.dynamic_nodes)) if (!d.why_dynamic) errs.push(`dynamic ${d.id} lacks why_dynamic`);
    out.push(errs.length ? chk('ID_INTEGRITY', F, head(errs)) : chk('ID_INTEGRITY', P, `${nodes.length} nodes, ${dynIds.length} dynamic, ${modules.length} modules; ids unique, dynamic disjoint`));
  }

  // KG01_GAPS — typed gaps; blocking gap => FAIL verdict, zero extraction, route back to 02.
  {
    const k = dp.kg01 ?? {};
    const gaps = arr(k.gaps);
    const blocking = gaps.filter(g => g.severity === 'blocking');
    const errs = [];
    for (const g of gaps) if (!g.located_at || !g.detail) errs.push(`gap ${g.type} lacks located_at/detail`);
    if (blocking.length && k.verdict !== 'FAIL') errs.push(`${blocking.length} blocking gap(s) but verdict ${k.verdict}`);
    if (k.verdict === 'FAIL' && !blocking.length) errs.push('verdict FAIL without a blocking gap');
    if (k.verdict === 'FAIL' && (k.nodes_extracted !== 0 || nodes.length !== 0)) errs.push(`FAIL verdict must extract nothing (nodes_extracted=${k.nodes_extracted}, nodes=${nodes.length})`);
    if (k.verdict === 'PASS' && k.nodes_extracted !== nodes.length) errs.push(`nodes_extracted ${k.nodes_extracted} != nodes ${nodes.length}`);
    const dc = new Set(arr(k.dynamic_concepts)); const dn = new Set(arr(a.dynamic_nodes).map(d => d.id));
    if (dc.size !== dn.size || [...dc].some(x => !dn.has(x))) errs.push(`kg01.dynamic_concepts [${[...dc].length}] != dynamic_nodes [${dn.size}]`);
    out.push(errs.length ? chk('KG01_GAPS', F, head(errs), { blocking_gaps: blocking.length }) : chk('KG01_GAPS', P, `verdict ${k.verdict}; ${gaps.length} gap(s), ${blocking.length} blocking; nodes_extracted=${k.nodes_extracted}`, { blocking_gaps: blocking.length }));
    // Always emitted (fail-closed mapping): FAIL when KG-01 bounced the dossier, PASS when no route_back is required.
    if (k.verdict === 'FAIL') out.push(chk('KG01_ROUTE_BACK', F, `KG-01 bounced the dossier (route_back to 02): ${head(blocking.map(g => `${g.type}@${g.located_at}`))}`));
    else out.push(chk('KG01_ROUTE_BACK', P, `verdict ${k.verdict}; no blocking gap, no route_back to 02 required`));
  }

  // ONTOLOGY — node/edge types declared by KG-02; prerequisite declared directed+acyclic.
  {
    const errs = [];
    const nt = new Set(arr(dp.kg02?.node_types).map(t => t.type));
    const et = new Map(arr(dp.kg02?.edge_types).map(t => [t.type, t]));
    for (const n of nodes) if (!nt.has(n.node_type)) errs.push(`${n.id} node_type "${n.node_type}" undeclared`);
    for (const e of edges) if (!et.has(e.type)) errs.push(`edge ${e.from}->${e.to} type ${e.type} undeclared`);
    const pr = et.get('prerequisite');
    if (edges.some(e => e.type === 'prerequisite') && !(pr && pr.directed && pr.acyclic)) errs.push('prerequisite edge type must be declared directed:true acyclic:true');
    out.push(errs.length ? chk('ONTOLOGY', F, head(errs)) : chk('ONTOLOGY', P, `${nt.size} node type(s), ${et.size} edge type(s) declared; all used types legal`));
  }

  // EDGE_TYPED — endpoints resolve, no self loops, edge confidence present (KG-03 edge record).
  {
    const errs = [];
    for (const e of edges) {
      if (!byId.has(e.from) || !byId.has(e.to)) errs.push(`edge ${e.from}->${e.to} endpoint not a stable node`);
      if (e.from === e.to) errs.push(`self loop ${e.from}`);
      if (e.confidence == null) errs.push(`edge ${e.from}->${e.to} confidence null`);
    }
    const nullConf = edges.filter(e => e.confidence == null).length;
    out.push(errs.length ? chk('EDGE_TYPED', F, `${errs.length} edge problem(s): ${head(errs)}`, { edges: edges.length, null_confidence: nullConf }) : chk('EDGE_TYPED', P, `${edges.length} edges typed with resolvable endpoints`, { edges: edges.length }));
  }

  // EDGES_MIRROR — kg03.edges is the same edge set as edges[].
  {
    const key = (e) => [e.from, e.to, e.type, e.origin, e.confidence].join('|');
    const A = edges.map(key).sort(), B = arr(dp.kg03?.edges).map(key).sort();
    const same = A.length === B.length && A.every((v, i) => v === B[i]);
    out.push(same ? chk('EDGES_MIRROR', P, `kg03.edges == edges (${A.length})`) : chk('EDGES_MIRROR', F, `kg03.edges (${B.length}) differs from edges (${A.length})`));
  }

  // ACYCLIC — recomputed; claims advisory.
  {
    const claims = [dp.kg02?.acyclic, dp.kg03?.acyclic];
    const actual = rc.cycleNodes.length === 0;
    const errs = [];
    if (!actual) errs.push(`prerequisite cycle among ${head(rc.cycleNodes)}`);
    if (claims.some(c => c !== actual)) errs.push(`claimed acyclic kg02=${claims[0]} kg03=${claims[1]} vs recomputed ${actual}`);
    out.push(errs.length ? chk('ACYCLIC', F, errs.join('; ')) : chk('ACYCLIC', P, `prerequisite subgraph acyclic (${edges.filter(e => e.type === 'prerequisite').length} edges, Kahn)`));
  }

  // ONE_MODULE_PER_NODE — every stable node in exactly one module, agreeing with node.module_id and placements.
  {
    const errs = [];
    if (rc.orphan_nodes) errs.push(`${rc.orphan_nodes} node(s) in no module: ${head(rc.orphanNodes)}`);
    if (rc.double_homes) errs.push(`${rc.double_homes} node(s) in >1 module: ${head(rc.doubleHomes)}`);
    for (const m of modules) for (const id of arr(m.node_ids)) {
      if (!byId.has(id)) errs.push(`module ${m.module_id} lists unknown node ${id}`);
      else if (byId.get(id).module_id !== m.module_id) errs.push(`${id}.module_id ${byId.get(id).module_id} != containing module ${m.module_id}`);
    }
    for (const p of arr(dp.kg02?.placements)) {
      if (byId.get(p.concept_id)?.module_id !== p.module_id) errs.push(`placement ${p.concept_id}->${p.module_id} disagrees with node`);
      if (p.ambiguous && !p.resolution) errs.push(`ambiguous placement ${p.concept_id} lacks resolution`);
    }
    out.push(errs.length ? chk('ONE_MODULE_PER_NODE', F, head(errs)) : chk('ONE_MODULE_PER_NODE', P, `${nodes.length}/${nodes.length} nodes in exactly one module`));
  }

  // PATH_COVERAGE — every stable node on the path once; dynamic nodes excluded with a recorded rule.
  {
    const path = arr(a.learning_path);
    const errs = [];
    const d = dups(path); if (d.length) errs.push(`path repeats ${d.join(',')}`);
    const unknown = path.filter(i => !byId.has(i)); if (unknown.length) errs.push(`path ids not stable nodes: ${head(unknown)}`);
    if (rc.off_path.length) errs.push(`${rc.off_path.length} node(s) off path: ${head(rc.off_path)}`);
    if (rc.dynamicLeaks.length) errs.push(`dynamic node(s) leaked into path/nodes/modules: ${head(rc.dynamicLeaks)}`);
    if (a.learning_path_rule?.dynamic_excluded !== true || !a.learning_path_rule?.rule) errs.push('learning_path_rule must record dynamic_excluded:true and a rule');
    out.push(errs.length ? chk('PATH_COVERAGE', F, head(errs)) : chk('PATH_COVERAGE', P, `path covers ${path.length}/${nodes.length} stable nodes; ${arr(a.dynamic_nodes).length} dynamic excluded; rule recorded`));
  }

  // PATH_TOPOLOGICAL — zero prerequisite violations in learning_path.
  out.push(rc.prerequisite_violations ? chk('PATH_TOPOLOGICAL', F, `${rc.prerequisite_violations} prerequisite violation(s): ${head(rc.violations)}`)
    : chk('PATH_TOPOLOGICAL', P, `0 prerequisite violations over ${edges.filter(e => e.type === 'prerequisite').length} prerequisite edges`));

  // NODE_COVERAGE — every registry fact is a node (facts dropped from the graph never reach cards/items/lessons). kg_hints are not facts.
  {
    const regFactsAll = context.fact_registry?.facts && typeof context.fact_registry.facts === 'object' ? Object.keys(context.fact_registry.facts) : null;
    if (!regFactsAll) out.push(chk('NODE_COVERAGE', P, 'context.fact_registry absent; node coverage not applicable (resolution is FACT_IDS_REGISTERED\'s concern)'));
    else {
      const nodeFacts = new Set([...nodes.flatMap(n => arr(n.fact_ids)), ...arr(a.dynamic_nodes).flatMap(d => arr(d.fact_ids))]); // dynamic nodes carry facts too
      const dropped = regFactsAll.filter(id => !nodeFacts.has(id) && !byId.has(id));
      out.push(dropped.length ? chk('NODE_COVERAGE', F, `${dropped.length}/${regFactsAll.length} registry fact(s) have no node (every fact_registry.facts entry must be a node; C2 R-ids included): ${head(dropped)}`, { dropped: dropped.length })
        : chk('NODE_COVERAGE', P, `all ${regFactsAll.length} registry facts are nodes`, { dropped: 0 }));
    }
  }

  // HIGH_YIELD_SET — high_yield nodes == accepted source high-yield set.
  {
    const srcRaw = context.accepted_inputs?.high_yield_ids;
    // High-yield ids that are not facts in the registry (C2 KG-hint ids) cannot be nodes and are not expected (2026-10-27, sec01).
    const hintIds = context.fact_registry?.kg_hints && typeof context.fact_registry.kg_hints === 'object' ? new Set(Object.keys(context.fact_registry.kg_hints)) : new Set();
    const src = Array.isArray(srcRaw) ? srcRaw.filter(id => !hintIds.has(id)) : srcRaw;
    const mine = nodes.filter(n => n.high_yield).map(n => n.id);
    if (!Array.isArray(src)) out.push(chk('HIGH_YIELD_SET', H, `context.accepted_inputs.high_yield_ids absent; artifact flags ${mine.length} high-yield node(s)`, { high_yield_nodes: mine.length }));
    else {
      const s = new Set(src); const m = new Set(mine);
      const extra = mine.filter(x => !s.has(x)); const missing = src.filter(x => !m.has(x));
      out.push(extra.length || missing.length ? chk('HIGH_YIELD_SET', F, `extra [${head(extra)}] missing [${head(missing)}]`) : chk('HIGH_YIELD_SET', P, `high-yield set equals source (${mine.length})`));
    }
  }

  // CONFUSABLE_SOURCE_BOUND — every confusable cites a fact of BOTH endpoints; high-yield nodes need confusables or a reason.
  {
    const errs = [];
    let pairs = 0;
    for (const n of nodes) {
      for (const c of arr(n.confusable_with)) {
        pairs++;
        const o = byId.get(c.other_id);
        if (!o) { errs.push(`${n.id}: confusable other_id ${c.other_id} unresolved`); continue; }
        if (o.id === n.id) errs.push(`${n.id}: confusable with itself`);
        if (!c.why || !c.why.trim()) errs.push(`${n.id}~${o.id}: why empty`);
        const f = new Set(arr(c.fact_ids));
        if (!arr(n.fact_ids).some(x => f.has(x))) errs.push(`${n.id}~${o.id}: fact_ids lack a fact of ${n.id}`);
        if (!arr(o.fact_ids).some(x => f.has(x))) errs.push(`${n.id}~${o.id}: fact_ids lack a fact of ${o.id}`);
      }
      if (n.high_yield && !arr(n.confusable_with).length && !(n.no_confusable_reason && n.no_confusable_reason.trim())) errs.push(`high-yield ${n.id}: no confusable_with and no no_confusable_reason`);
    }
    out.push(errs.length ? chk('CONFUSABLE_SOURCE_BOUND', F, `${errs.length} problem(s): ${head(errs)}`, { pairs }) : chk('CONFUSABLE_SOURCE_BOUND', P, `${pairs} confusable record(s) cite both endpoint facts; every high-yield node covered`, { pairs }));
  }

  // FACT_IDS_REGISTERED — node and confusable fact ids exist in the fact registry.
  {
    const reg = context.fact_registry?.facts;
    const ids = new Set([...nodes.flatMap(n => arr(n.fact_ids)), ...nodes.flatMap(n => arr(n.confusable_with).flatMap(c => arr(c.fact_ids))), ...arr(a.dynamic_nodes).flatMap(d => arr(d.fact_ids))]);
    if (!reg) out.push(chk('FACT_IDS_REGISTERED', H, `context.fact_registry absent; ${ids.size} fact id(s) unresolved`));
    else { const miss = [...ids].filter(i => !(i in reg)); out.push(miss.length ? chk('FACT_IDS_REGISTERED', F, `${miss.length}/${ids.size} fact ids not registered: ${head(miss)}`) : chk('FACT_IDS_REGISTERED', P, `${ids.size}/${ids.size} fact ids registered`)); }
  }

  // WEIGHT_HONESTY — nullable official weights never carry fabricated numbers; authored emphasis labelled.
  {
    const errs = [];
    for (const n of nodes) { errs.push(...weightProblems(`node ${n.id}`, n.official_weight)); if (!n.pedagogic_emphasis?.basis) errs.push(`node ${n.id}: pedagogic_emphasis.basis empty`); if (n.pedagogic_emphasis?.value < 0) errs.push(`node ${n.id}: negative emphasis`); }
    for (const m of modules) { errs.push(...weightProblems(`module ${m.module_id}`, m.official_weight)); if (!m.pedagogic_emphasis?.basis) errs.push(`module ${m.module_id}: pedagogic_emphasis.basis empty`); }
    for (const r of arr(dp.kg04?.domain_emphasis_check)) {
      if (r.weight_status === 'unknown' && (r.blueprint_pct !== null || r.drift_pp !== null || r.within_tolerance !== null || r.comparison_basis === 'official_verified')) errs.push(`kg04 "${r.domain}": unknown weight must have blueprint_pct/drift_pp/within_tolerance null and non-official basis`);
      if (r.weight_status === 'verified' && (r.blueprint_pct === null || r.comparison_basis !== 'official_verified')) errs.push(`kg04 "${r.domain}": verified weight needs blueprint_pct and official_verified basis`);
      if (r.weight_status === 'authored' && r.comparison_basis === 'official_verified') errs.push(`kg04 "${r.domain}": authored weight compared as official_verified`);
    }
    const st = nodes.reduce((m, n) => { const s = n.official_weight?.status ?? 'missing'; m[s] = (m[s] ?? 0) + 1; return m; }, {});
    out.push(errs.length ? chk('WEIGHT_HONESTY', F, `${errs.length} problem(s): ${head(errs)}`, st) : chk('WEIGHT_HONESTY', P, `official weights honest: ${JSON.stringify(st)}; no number under unknown status`, st));
  }

  // VERIFIED_WEIGHTS_REGISTERED — a verified weight's page is in the source registry.
  {
    const ver = [...nodes.map(n => [`node ${n.id}`, n.official_weight]), ...modules.map(m => [`module ${m.module_id}`, m.official_weight])].filter(([, w]) => w?.status === 'verified');
    if (!ver.length) out.push(chk('VERIFIED_WEIGHTS_REGISTERED', P, 'no verified official weights claimed'));
    else if (!codes) out.push(chk('VERIFIED_WEIGHTS_REGISTERED', H, `${ver.length} verified weight(s) but context.source_registry absent`));
    else { const bad = ver.filter(([, w]) => !pageRegistered(w.source_page, codes)).map(([k, w]) => `${k}->${w.source_page}`); out.push(bad.length ? chk('VERIFIED_WEIGHTS_REGISTERED', F, head(bad)) : chk('VERIFIED_WEIGHTS_REGISTERED', P, `${ver.length} verified weight page(s) registered`)); }
  }

  // DOMAIN_EMPHASIS — recompute computed_pct from node pedagogic emphasis; verified-basis drift <= 2pp.
  {
    const rows = arr(dp.kg04?.domain_emphasis_check);
    const domains = [...new Set(nodes.map(n => n.domain))];
    const errs = [];
    const nullEmph = nodes.filter(n => n.pedagogic_emphasis?.value == null).map(n => n.id);
    const total = nodes.reduce((s, n) => s + (n.pedagogic_emphasis?.value ?? 0), 0);
    if (nullEmph.length || total <= 0) {
      out.push(chk('DOMAIN_EMPHASIS', H, `computed_pct not recomputable: ${nullEmph.length} node(s) with null pedagogic_emphasis, total ${round(total)}`));
    } else {
      for (const d of domains) if (!rows.some(r => r.domain === d)) errs.push(`no domain_emphasis_check row for "${d}"`);
      for (const r of rows) {
        if (!domains.includes(r.domain)) { errs.push(`row "${r.domain}" has no nodes`); continue; }
        const comp = 100 * nodes.filter(n => n.domain === r.domain).reduce((s, n) => s + n.pedagogic_emphasis.value, 0) / total;
        if (Math.abs(comp - r.computed_pct) > RECOMPUTE_TOLERANCE_PP) errs.push(`"${r.domain}" computed_pct ${r.computed_pct} != recomputed ${round(comp)}`);
        if (r.blueprint_pct !== null) {
          const drift = Math.abs(comp - r.blueprint_pct);
          if (r.drift_pp === null || Math.abs(drift - r.drift_pp) > RECOMPUTE_TOLERANCE_PP) errs.push(`"${r.domain}" drift_pp ${r.drift_pp} != recomputed ${round(drift)}`);
          const within = drift <= DRIFT_TOLERANCE_PP + 1e-9;
          if (r.within_tolerance !== within) errs.push(`"${r.domain}" within_tolerance ${r.within_tolerance} != recomputed ${within}`);
          if (r.comparison_basis === 'official_verified' && !within) errs.push(`"${r.domain}" verified-basis drift ${round(drift)}pp > ${DRIFT_TOLERANCE_PP}pp (re-weights the exam)`);
        }
      }
      out.push(errs.length ? chk('DOMAIN_EMPHASIS', F, head(errs)) : chk('DOMAIN_EMPHASIS', P, `${rows.length} domain row(s) recomputed within ${RECOMPUTE_TOLERANCE_PP}pp; verified-basis drift <= ${DRIFT_TOLERANCE_PP}pp`, { domains: rows.length }));
    }
  }

  // WEIGHT_CLOSURE — module weights sum to ~100 on the declared basis (recomputed).
  {
    const wc = dp.kg02?.weight_closure ?? {};
    const errs = [];
    let sum = null;
    if (wc.basis === 'unknown') {
      if (wc.sum !== null || wc.within_tolerance !== null) errs.push('basis unknown must leave sum/within_tolerance null');
      if (modules.some(m => m.official_weight?.status !== 'unknown')) errs.push('basis unknown but some module carries a non-unknown official weight');
    } else {
      const want = wc.basis === 'official_verified' ? 'verified' : 'authored';
      if (modules.some(m => m.official_weight?.status !== want)) errs.push(`basis ${wc.basis} requires every module official_weight.status=${want}`);
      sum = modules.reduce((s, m) => s + (m.official_weight?.value ?? 0), 0);
      const within = Math.abs(sum - 100) <= CLOSURE_TOLERANCE;
      if (wc.sum !== null && Math.abs(wc.sum - sum) > RECOMPUTE_TOLERANCE_PP) errs.push(`claimed sum ${wc.sum} != recomputed ${round(sum)}`);
      if (wc.within_tolerance !== null && wc.within_tolerance !== within) errs.push(`claimed within_tolerance ${wc.within_tolerance} != recomputed ${within}`);
      if (!within) errs.push(`module weights sum ${round(sum)} not within 100±${CLOSURE_TOLERANCE}`);
    }
    out.push(errs.length ? chk('WEIGHT_CLOSURE', F, head(errs), { recomputed_sum: round(sum) }) : chk('WEIGHT_CLOSURE', P, `basis ${wc.basis}; recomputed sum ${round(sum)}${wc.sum === null ? ' (unclaimed)' : ''}`, { recomputed_sum: round(sum) }));
  }

  // KG05_ASSERTIONS — scripts recompute the claimed path checks; model numbers are advisory.
  {
    const va = dp.kg05?.validation_assertions ?? {};
    const errs = [];
    for (const k of ['prerequisite_violations', 'orphan_nodes', 'double_homes', 'dynamic_quarantined', 'path_check']) if (va[k] !== null && va[k] !== undefined && va[k] !== rc[k]) errs.push(`claimed ${k}=${va[k]} != recomputed ${rc[k]}`);
    const metrics = { prerequisite_violations: rc.prerequisite_violations, orphan_nodes: rc.orphan_nodes, double_homes: rc.double_homes, dynamic_quarantined: rc.dynamic_quarantined, path_check: rc.path_check };
    out.push(errs.length ? chk('KG05_ASSERTIONS', F, errs.join('; '), metrics) : chk('KG05_ASSERTIONS', P, `claims agree with recomputation (null = unclaimed): ${JSON.stringify(metrics)}`, metrics));
  }

  // CURRICULUM_HINTS — one hint per module; session -> flashcards -> module_hub; hub-chosen quiz.
  {
    const hints = arr(a.curriculum_unit_hints);
    const errs = [];
    if (!hints.length && modules.length) errs.push(`curriculum_unit_hints empty for ${modules.length} module(s)`);
    const d = dups(hints.map(h => h.unit_id)); if (d.length) errs.push(`duplicate unit_id ${d.join(',')}`);
    for (const m of modules) {
      const hs = hints.filter(h => h.module_id === m.module_id);
      if (hints.length && hs.length !== 1) { errs.push(`module ${m.module_id} has ${hs.length} hint(s)`); continue; }
      const h = hs[0]; if (!h) continue;
      const A = [...arr(h.node_ids)].sort().join(','), B = [...arr(m.node_ids)].sort().join(',');
      if (A !== B) errs.push(`${h.unit_id} node_ids differ from module ${m.module_id}`);
      const uc = arr(h.user_cycle);
      if (uc.slice(0, 3).join('>') !== 'session>flashcards>module_hub') errs.push(`${h.unit_id} user_cycle starts ${uc.slice(0, 3).join('>')} (need session>flashcards>module_hub)`);
      const hubAt = uc.indexOf('module_hub'), quizAt = uc.indexOf('module_quiz');
      if (quizAt >= 0 && (hubAt < 0 || quizAt < hubAt)) errs.push(`${h.unit_id} forces module_quiz before the hub`);
      if (hubAt >= 0 && !['module_quiz', 'flashcards', 'session'].every(o => arr(h.hub_options).includes(o))) errs.push(`${h.unit_id} hub_options must include module_quiz, flashcards, session`);
      for (const k of ['session_strategy', 'flashcard_strategy', 'quiz_strategy']) if (!h[k]) errs.push(`${h.unit_id} ${k} empty`);
    }
    for (const h of hints) if (!modules.some(m => m.module_id === h.module_id)) errs.push(`hint ${h.unit_id} names unknown module ${h.module_id}`);
    out.push(errs.length ? chk('CURRICULUM_HINTS', F, head(errs)) : chk('CURRICULUM_HINTS', P, `${hints.length} unit hint(s), one per module; session>flashcards>module_hub with hub options`));
  }

  // SCOUT_SENTINEL — the pre-KG image-scout sentinel is honored only when the bound media disposition names it non-applicable.
  {
    const md = context.media_disposition;
    if (a.source_refs?.image_scout_pre_kg !== SENTINEL) out.push(chk('SCOUT_SENTINEL', F, `image_scout_pre_kg must be "${SENTINEL}" in the pilot`));
    else if (!md) out.push(chk('SCOUT_SENTINEL', H, 'context.media_disposition absent; sentinel binding unverifiable'));
    else {
      const ok = arr(md.inactive_roles).includes('20A') && arr(md.non_applicable_checks).some(c => /image scout/i.test(c?.check ?? ''));
      out.push(ok ? chk('SCOUT_SENTINEL', P, 'media disposition lists 20A inactive and image-scout checks non-applicable') : chk('SCOUT_SENTINEL', F, 'media disposition does not exempt the image scout; sentinel unbound'));
    }
  }

  // LEARNING_INPUT_BOUND — accepted role-19 learning input is bound before the graph (overlay retained rule).
  {
    const ref = a.source_refs?.learning_loop;
    const want = context.accepted_inputs?.learning_loop_ref;
    if (!ref) out.push(chk('LEARNING_INPUT_BOUND', F, 'source_refs.learning_loop is null; accepted role-19 learning input must be bound before the graph'));
    else if (want === undefined) out.push(chk('LEARNING_INPUT_BOUND', H, `learning_loop ref "${ref}" present; context.accepted_inputs.learning_loop_ref absent`));
    else out.push(ref === want ? chk('LEARNING_INPUT_BOUND', P, `learning_loop ref matches accepted input ${want}`) : chk('LEARNING_INPUT_BOUND', F, `learning_loop ref ${ref} != accepted ${want}`));
  }

  return out;
}
