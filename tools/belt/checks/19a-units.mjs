// Compensating checks for stage 19A.units (adapter schemas-strict/19a-curriculum-unit-map.schema.json).
// Pure: no network, no writes, no clock. Integrity counts are RECOMPUTED here; model/tool-written counts are advisory.
//
// context.accepted_inputs (all optional; checks that need a part HOLD without it):
//   { product_line_id, tenant_id,
//     refs: { knowledge_graph, carddeck, session_scripts, exambank, learning_loop, media_disposition },   // expected ref strings
//     ids:  { modules[], nodes[], cards[], quiz_items[], sessions[], mock_items[], practice_forms[], media_slots_resolved[] },
//     module_nodes: { <module_id>: [node ids] },          // optional: unit node_ids must equal the KG module's
//     knowledge_graph: <KG artifact>                       // optional: modules/nodes extracted when ids.modules/nodes absent
//   }
// context.learning_loop = accepted LearningLoop object; context.learning_loop_sha256 = its file sha256.
export const stage_id = '19A.units';
export const SENTINEL = 'deferred:not_applicable_pilot';
export const INTEGRITY_KEYS = ['units_missing_sessions', 'units_missing_cards', 'units_missing_quizzes', 'orphan_card_refs', 'orphan_quiz_item_refs', 'orphan_session_refs', 'unresolved_required_media', 'cross_product_refs', 'duplicate_bindings', 'module_unit_mismatches'];
export const PARENT_ALLOF_KEYS = INTEGRITY_KEYS.slice(0, 8);   // the eight counts the parent allOf pins to 0 under production_ready
const ORPHAN_KEYS = ['orphan_card_refs', 'orphan_quiz_item_refs', 'orphan_session_refs', 'unresolved_required_media', 'module_unit_mismatches'];

const P = 'PASS', F = 'FAIL', H = 'HOLD';
const chk = (id, status, evidence, metrics) => (metrics ? { check_id: `19A.${id}`, status, evidence, metrics } : { check_id: `19A.${id}`, status, evidence });
const arr = (v) => (Array.isArray(v) ? v : []);
const head = (list, n = 8) => list.slice(0, n).join('; ') + (list.length > n ? `; … (+${list.length - n} more)` : '');
const dups = (list) => [...new Set(list.filter((v, i) => list.indexOf(v) !== i))];
const SLUG = /^[a-z0-9][a-z0-9-]*$/;

function acceptedIds(acc) {
  if (!acc) return null;
  const ids = { ...(acc.ids ?? {}) };
  const kg = acc.knowledge_graph;
  if (kg) {
    if (!ids.modules) ids.modules = arr(kg.modules).map(m => m.module_id ?? m.id);
    if (!ids.nodes) ids.nodes = arr(kg.nodes).map(n => n.id);
  }
  let moduleNodes = acc.module_nodes ?? null;
  if (!moduleNodes && kg) moduleNodes = Object.fromEntries(arr(kg.modules).map(m => [m.module_id ?? m.id, arr(m.node_ids)]));
  return { ids, moduleNodes };
}

// Deterministic integrity computation. Returns {counts, detail, complete} — complete=false when accepted inputs are absent
// (orphan-style counts then cannot be computed and are null).
export function computeIntegrity(a, context = {}) {
  const units = arr(a.units);
  const acc = acceptedIds(context.accepted_inputs);
  const detail = {};
  const counts = Object.fromEntries(INTEGRITY_KEYS.map(k => [k, null]));
  counts.units_missing_sessions = units.filter(u => !u.session_ref).length;
  counts.units_missing_cards = units.filter(u => !arr(u.card_ids).length).length;
  counts.units_missing_quizzes = units.filter(u => !arr(u.quiz_item_ids).length).length;
  const cardB = units.flatMap(u => arr(u.card_ids)), quizB = units.flatMap(u => arr(u.quiz_item_ids));
  const sessB = units.map(u => u.session_ref).filter(Boolean), modB = units.map(u => u.module_id);
  detail.duplicate_bindings = [...dups(cardB).map(x => `card ${x}`), ...dups(quizB).map(x => `quiz ${x}`), ...dups(sessB).map(x => `session ${x}`), ...dups(modB).map(x => `module ${x}`)];
  counts.duplicate_bindings = detail.duplicate_bindings.length;
  // cross-product: any ref naming another tenant dir, or a product line mismatch
  const tenant = a.product_line?.tenant_id;
  const refs = [...Object.values(a.source_refs ?? {}), a.product_line?.tenant_dir, ...units.map(u => u.session_ref), ...units.map(u => u.mastery_gate?.learning_loop_ref)].filter(r => typeof r === 'string');
  detail.cross_product_refs = refs.filter(r => { const m = /tenants\/([a-z0-9][a-z0-9-]*)/.exec(r); return m && m[1] !== tenant; });
  if (context.accepted_inputs?.product_line_id && context.accepted_inputs.product_line_id !== a.product_line?.product_line_id) detail.cross_product_refs.push(`product_line_id ${a.product_line?.product_line_id} != accepted ${context.accepted_inputs.product_line_id}`);
  if (context.accepted_inputs?.tenant_id && context.accepted_inputs.tenant_id !== tenant) detail.cross_product_refs.push(`tenant_id ${tenant} != accepted ${context.accepted_inputs.tenant_id}`);
  counts.cross_product_refs = detail.cross_product_refs.length;
  if (!acc) return { counts, detail, complete: false };
  const { ids, moduleNodes } = acc;
  const both = (bound, accepted, label) => {
    if (!Array.isArray(accepted)) return null;
    const A = new Set(accepted), B = new Set(bound);
    const out = [...[...B].filter(x => !A.has(x)).map(x => `${label} ${x} unresolved`), ...[...A].filter(x => !B.has(x)).map(x => `${label} ${x} unbound`)];
    return out;
  };
  detail.orphan_card_refs = both(cardB, ids.cards, 'card');
  detail.orphan_quiz_item_refs = both(quizB, ids.quiz_items, 'quiz item');
  detail.orphan_session_refs = both(sessB, ids.sessions, 'session');
  const req = arr(a.media?.required_slot_ids);
  detail.unresolved_required_media = Array.isArray(ids.media_slots_resolved) || req.length === 0 ? req.filter(s => !arr(ids.media_slots_resolved).includes(s)).map(s => `required slot ${s}`) : null;
  if (Array.isArray(ids.modules)) {
    const mm = [];
    for (const m of ids.modules) { const n = units.filter(u => u.module_id === m).length; if (n !== 1) mm.push(`module ${m} has ${n} unit(s)`); }
    for (const u of units) if (!ids.modules.includes(u.module_id)) mm.push(`unit ${u.unit_id} module ${u.module_id} not in KG`);
    if (moduleNodes) for (const u of units) if (moduleNodes[u.module_id] && [...arr(u.node_ids)].sort().join(',') !== [...moduleNodes[u.module_id]].sort().join(',')) mm.push(`unit ${u.unit_id} node_ids != KG module ${u.module_id}`);
    detail.module_unit_mismatches = mm;
  } else detail.module_unit_mismatches = null;
  let complete = true;
  for (const k of ORPHAN_KEYS) { if (detail[k] === null) { complete = false; counts[k] = null; } else counts[k] = detail[k].length; }
  return { counts, detail, complete };
}

export function run(artifact, context = {}) {
  const a = artifact ?? {};
  const units = arr(a.units);
  const gate = a.production_gate ?? {};
  const integ = computeIntegrity(a, context);
  const acc = acceptedIds(context.accepted_inputs);
  const out = [];
  const defects = (counts) => Object.entries(counts).filter(([, v]) => typeof v === 'number' && v > 0).map(([k, v]) => `${k}=${v}`);

  out.push(SLUG.test(a.probe ?? '') && SLUG.test(a.product_line?.tenant_id ?? '') ? chk('PROBE_SLUG', P, `probe "${a.probe}" and tenant_id "${a.product_line?.tenant_id}" are slugs`)
    : chk('PROBE_SLUG', F, `probe "${a.probe}" / tenant_id "${a.product_line?.tenant_id}" violate ^[a-z0-9][a-z0-9-]*$`));

  if (!context.input_manifest_sha256) out.push(chk('LINEAGE', H, 'context.input_manifest_sha256 absent; cannot bind the unit map to its scoped input manifest'));
  else out.push(a.lineage?.input_manifest_sha256 === context.input_manifest_sha256 && a.lineage?.candidate_lineage_id ? chk('LINEAGE', P, `input_manifest_sha256 matches; candidate_lineage_id=${a.lineage.candidate_lineage_id}`)
    : chk('LINEAGE', F, `lineage ${JSON.stringify(a.lineage)} does not bind context manifest ${context.input_manifest_sha256}`));

  // TENANT_DIR — canonical tenants keep the parent pattern; a pilot lane path is a logical address that never claims a canonical tenant.
  {
    const pl = a.product_line ?? {};
    const td = pl.tenant_dir ?? '';
    const errs = [];
    if (pl.tenant_dir_kind === 'canonical_tenant') { if (td !== `app/public/tenants/${pl.tenant_id}`) errs.push(`canonical tenant_dir "${td}" != app/public/tenants/${pl.tenant_id}`); }
    else {
      if (!/^runs\/[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+)*$/.test(td)) errs.push(`pilot lane path "${td}" must match ^runs/<segment>(/<segment>)*$`);
      if (/(^|\/)\.\.(\/|$)/.test(td)) errs.push(`pilot lane path "${td}" contains ..`);
      if (/tenants\//.test(td)) errs.push(`pilot lane path "${td}" must not claim a canonical tenants/ dir`);
    }
    if (!pl.product_line_id) errs.push('product_line_id empty');
    out.push(errs.length ? chk('TENANT_DIR', F, errs.join('; ')) : chk('TENANT_DIR', P, `${pl.tenant_dir_kind} "${td}"`));
  }

  // PRODUCTION_GATE_CEILING — the pilot never seals production_ready.
  {
    const errs = [];
    if (gate.status === 'production_ready') errs.push('production_gate.status production_ready exceeds the pilot ceiling (preview_only|blocked|diagnostic_only)');
    else if (!['preview_only', 'blocked', 'diagnostic_only'].includes(gate.status)) errs.push(`unknown production_gate.status ${gate.status}`);
    if (!gate.reason) errs.push('production_gate.reason empty');
    if (gate.status === 'blocked' && !arr(gate.blockers).length) errs.push('blocked without blockers[]');
    out.push(errs.length ? chk('PRODUCTION_GATE_CEILING', F, errs.join('; ')) : chk('PRODUCTION_GATE_CEILING', P, `status ${gate.status} within pilot ceiling`));
  }

  // PARENT_ALLOF_RESTORED — parent: production_ready => all eight integrity counts are 0 (recomputed, plus claimed).
  {
    if (gate.status !== 'production_ready') out.push(chk('PARENT_ALLOF_RESTORED', P, `status ${gate.status}: parent if(production_ready) invariant not triggered; ceiling enforced by 19A.PRODUCTION_GATE_CEILING`));
    else {
      const pick = (o) => Object.fromEntries(PARENT_ALLOF_KEYS.map(k => [k, o?.[k]]));
      const bad = [...new Set([...defects(pick(integ.counts)).map(x => `recomputed ${x}`), ...defects(pick(a.integrity)).map(x => `claimed ${x}`)])];
      if (bad.length) out.push(chk('PARENT_ALLOF_RESTORED', F, `production_ready with integrity defects: ${head(bad)}${integ.detail.orphan_card_refs?.length ? ` [${head(integ.detail.orphan_card_refs, 4)}]` : ''}`));
      else if (!integ.complete) out.push(chk('PARENT_ALLOF_RESTORED', H, 'production_ready: orphan counts not recomputable without context.accepted_inputs'));
      else out.push(chk('PARENT_ALLOF_RESTORED', F, 'production_ready with zero recomputed defects is still above the pilot ceiling'));
    }
  }

  // INTEGRITY_RECOMPUTE — counts are script-computed; any disagreement with the artifact FAILs.
  {
    const errs = [];
    if (a.integrity_computed_by !== 'script') errs.push(`integrity_computed_by ${a.integrity_computed_by} (must be script)`);
    for (const k of INTEGRITY_KEYS) if (integ.counts[k] !== null && a.integrity?.[k] !== integ.counts[k]) errs.push(`${k}: artifact ${a.integrity?.[k]} != recomputed ${integ.counts[k]}`);
    for (const k of INTEGRITY_KEYS) if (typeof a.integrity?.[k] === 'number' && a.integrity[k] < 0) errs.push(`${k} negative`);
    const metrics = Object.fromEntries(INTEGRITY_KEYS.map(k => [k, integ.counts[k]]));
    if (errs.length) out.push(chk('INTEGRITY_RECOMPUTE', F, head(errs), metrics));
    else if (!integ.complete) out.push(chk('INTEGRITY_RECOMPUTE', H, `local counts agree; orphan/media/cardinality counts need context.accepted_inputs (${ORPHAN_KEYS.filter(k => integ.counts[k] === null).join(',')})`, metrics));
    else out.push(chk('INTEGRITY_RECOMPUTE', P, `all ${INTEGRITY_KEYS.length} counts recomputed and equal: ${JSON.stringify(metrics)}`, metrics));
  }

  // INCOMPLETE_MAP_BLOCKED — preview_only never means defects were checked away.
  {
    const bad = defects(integ.counts);
    if (bad.length && gate.status !== 'blocked') out.push(chk('INCOMPLETE_MAP_BLOCKED', F, `status ${gate.status} with recomputed defects ${bad.join(', ')} — an incomplete map must be blocked`));
    else if (!integ.complete && gate.status !== 'blocked') out.push(chk('INCOMPLETE_MAP_BLOCKED', H, 'completeness unknown without context.accepted_inputs'));
    else out.push(chk('INCOMPLETE_MAP_BLOCKED', P, bad.length ? `defects present and status blocked (${bad.join(', ')})` : 'no recomputed defects'));
  }

  // REFS_RESOLVE — every id and source ref resolves against accepted inputs.
  {
    if (!acc) out.push(chk('REFS_RESOLVE', H, 'context.accepted_inputs absent; no reference can be resolved'));
    else {
      const { ids } = acc;
      const errs = [];
      const want = context.accepted_inputs.refs ?? {};
      for (const [k, v] of Object.entries(want)) if (a.source_refs?.[k] !== v) errs.push(`source_refs.${k} "${a.source_refs?.[k]}" != accepted "${v}"`);
      const res = (list, pool, label) => { if (!Array.isArray(pool)) { if (list.length) errs.push(`${label}: accepted id set absent`); return; } const s = new Set(pool); for (const x of list) if (!s.has(x)) errs.push(`${label} ${x} unresolved`); };
      res(units.flatMap(u => arr(u.node_ids)), ids.nodes, 'node');
      res(units.flatMap(u => arr(u.mock_item_ids)), ids.mock_items, 'mock item');
      res(units.flatMap(u => arr(u.practice_form_ids)), ids.practice_forms, 'practice form');
      res(arr(a.exam_modes).flatMap(m => arr(m.item_ids)), [...arr(ids.quiz_items), ...arr(ids.mock_items)], 'exam-mode item');
      res(arr(a.exam_modes).flatMap(m => arr(m.form_ids)), ids.practice_forms, 'exam-mode form');
      for (const k of ['orphan_card_refs', 'orphan_quiz_item_refs', 'orphan_session_refs']) for (const d of arr(integ.detail[k])) if (/unresolved$/.test(d)) errs.push(d);
      if (!Object.keys(want).length) errs.push('accepted_inputs.refs absent: source_refs unbound');
      out.push(errs.length ? chk('REFS_RESOLVE', F, `${errs.length} unresolved: ${head(errs)}`) : chk('REFS_RESOLVE', P, `source_refs equal accepted refs; all unit/exam-mode ids resolve`));
    }
  }

  // MODULE_UNIT_CARDINALITY — every KG module has exactly one unit.
  {
    const mm = integ.detail.module_unit_mismatches;
    if (mm === null || mm === undefined) out.push(chk('MODULE_UNIT_CARDINALITY', H, 'accepted KG module list absent'));
    else out.push(mm.length ? chk('MODULE_UNIT_CARDINALITY', F, head(mm)) : chk('MODULE_UNIT_CARDINALITY', P, `${arr(acc.ids.modules).length} KG module(s) <-> ${units.length} unit(s), 1:1`));
  }

  // UNIT_SHAPE — non-empty units, unique ids, contiguous order (parent minItems/minimum restored).
  {
    const errs = [];
    if (!units.length) errs.push('units[] empty');
    const d = dups(units.map(u => u.unit_id)); if (d.length) errs.push(`duplicate unit_id ${d.join(',')}`);
    const orders = units.map(u => u.order).sort((x, y) => x - y);
    if (orders.some((o, i) => o !== i + 1)) errs.push(`order must be 1..${units.length}; got [${orders.join(',')}]`);
    for (const u of units) for (const k of ['unit_id', 'module_id', 'title', 'domain', 'readiness_domain']) if (!u[k]) errs.push(`${u.unit_id ?? '?'}.${k} empty`);
    if (!arr(a.exam_modes).length) errs.push('exam_modes[] empty');
    out.push(errs.length ? chk('UNIT_SHAPE', F, head(errs)) : chk('UNIT_SHAPE', P, `${units.length} unit(s), order 1..${units.length}`));
  }

  // USER_CYCLE — session -> flashcards -> module_hub; quiz chosen at the hub; reviews after the quiz.
  {
    const errs = [];
    for (const u of units) {
      const uc = arr(u.user_cycle);
      if (uc.length < 3) errs.push(`${u.unit_id} user_cycle has ${uc.length} step(s) (<3)`);
      if (dups(uc).length) errs.push(`${u.unit_id} user_cycle repeats ${dups(uc).join(',')}`);
      if (uc.slice(0, 3).join('>') !== 'session>flashcards>module_hub') errs.push(`${u.unit_id} starts ${uc.slice(0, 3).join('>')}`);
      const hubAt = uc.indexOf('module_hub');
      if (uc.includes('module_quiz') && uc.indexOf('module_quiz') < hubAt) errs.push(`${u.unit_id} forces module_quiz before the hub (quiz is hub-chosen)`);
      for (const r of ['missed_review', 'spaced_review']) if (uc.includes(r) && uc.indexOf(r) < hubAt) errs.push(`${u.unit_id} ${r} precedes the hub (reviews follow the quiz)`);
      if (!['module_quiz', 'flashcards', 'session'].every(o => arr(u.hub_options).includes(o))) errs.push(`${u.unit_id} hub_options must include module_quiz, flashcards, session`);
      if (dups(arr(u.hub_options)).length) errs.push(`${u.unit_id} hub_options repeats`);
    }
    out.push(errs.length ? chk('USER_CYCLE', F, head(errs)) : chk('USER_CYCLE', P, `${units.length} unit(s): session>flashcards>module_hub; hub options module_quiz|flashcards|session`));
  }

  // HUB_UNLOCK — hub opens only after the lesson and all cards are seen, per LearningLoop.
  {
    const errs = [];
    for (const u of units) {
      const r = arr(u.hub_unlock?.requires);
      if (!r.includes('lesson_complete') || !r.includes('all_cards_seen')) errs.push(`${u.unit_id} hub_unlock.requires [${r.join(',')}] lacks lesson_complete+all_cards_seen`);
      if (u.hub_unlock?.rule_source !== 'learning_loop') errs.push(`${u.unit_id} hub_unlock.rule_source ${u.hub_unlock?.rule_source}`);
    }
    out.push(errs.length ? chk('HUB_UNLOCK', F, head(errs)) : chk('HUB_UNLOCK', P, `${units.length} unit(s): hub unlocks after lesson_complete + all_cards_seen (rule_source learning_loop)`));
  }

  // MASTERY_GATE — quiz threshold is LearningLoop product policy, never an official exam threshold.
  {
    const errs = [];
    for (const u of units) {
      const g = u.mastery_gate ?? {};
      if (!(typeof g.quiz_threshold_pct === 'number' && g.quiz_threshold_pct >= 0 && g.quiz_threshold_pct <= 100)) errs.push(`${u.unit_id} quiz_threshold_pct ${g.quiz_threshold_pct} outside 0..100`);
      if (g.learning_loop_ref !== a.source_refs?.learning_loop) errs.push(`${u.unit_id} learning_loop_ref ${g.learning_loop_ref} != source_refs.learning_loop ${a.source_refs?.learning_loop}`);
    }
    const ll = context.learning_loop;
    const llSha = context.learning_loop_sha256 ?? context.loaded_refs?.learning_loop?.sha256 ?? null;
    if (errs.length) out.push(chk('MASTERY_GATE', F, head(errs)));
    else if (!ll) out.push(chk('MASTERY_GATE', H, 'context.learning_loop absent; threshold cannot be bound to the accepted LearningLoop'));
    else {
      const want = ll.mastery_gate?.quiz_threshold_pct;
      const wantMissed = ll.mastery_gate?.missed_items_must_be_cleared;
      for (const u of units) {
        if (u.mastery_gate.quiz_threshold_pct !== want) errs.push(`${u.unit_id} quiz_threshold_pct ${u.mastery_gate.quiz_threshold_pct} != LearningLoop ${want}`);
        if (wantMissed !== undefined && u.mastery_gate.missed_items_must_be_cleared !== wantMissed) errs.push(`${u.unit_id} missed_items_must_be_cleared != LearningLoop ${wantMissed}`);
        if (llSha && u.mastery_gate.learning_loop_sha256 !== llSha) errs.push(`${u.unit_id} learning_loop_sha256 != accepted ${llSha}`);
      }
      if (errs.length) out.push(chk('MASTERY_GATE', F, head(errs)));
      else if (!llSha) out.push(chk("MASTERY_GATE", H, `threshold ${want} matches LearningLoop; learning_loop sha256 absent (context.learning_loop_sha256 or loaded_refs.learning_loop) so the pin is unverified`));
      else out.push(chk('MASTERY_GATE', P, `${units.length} unit(s) bind quiz_threshold_pct ${want} to LearningLoop@${llSha.slice(0, 12)} (product_policy)`));
    }
  }

  // EXAM_MODE_TRUTH — pass/fail language only with a verified, page-sourced threshold; unknown stays null.
  {
    const errs = [];
    for (const m of arr(a.exam_modes)) {
      const t = m.scoring_policy?.passing_threshold ?? {};
      const lang = m.scoring_policy?.result_language;
      if (t.status === 'unknown' && t.value !== null) errs.push(`${m.mode_id}: unknown threshold carries ${t.value}`);
      if (t.status === 'verified' && (t.value === null || !t.source_page)) errs.push(`${m.mode_id}: verified threshold needs value + source_page`);
      if (t.status === 'authored' && t.value === null) errs.push(`${m.mode_id}: authored threshold with null value`);
      if (lang === 'pass_fail' && t.status !== 'verified') errs.push(`${m.mode_id}: pass_fail result language with ${t.status} threshold`);
      if (lang === 'pass_fail' && ['practice_pool', 'diagnostic'].includes(m.kind)) errs.push(`${m.mode_id}: ${m.kind} cannot render pass_fail`);
      if (t.status === 'unknown' && m.kind === 'mock_exam' && m.scoring_policy?.blocks_production_if_unknown !== true) errs.push(`${m.mode_id}: mock with unknown threshold must block production`);
    }
    out.push(errs.length ? chk('EXAM_MODE_TRUTH', F, head(errs)) : chk('EXAM_MODE_TRUTH', P, `${arr(a.exam_modes).length} exam mode(s): result language consistent with threshold status`));
  }

  // MEDIA_SENTINEL — scout/asset sentinels and exemptions only via the pinned media disposition.
  {
    const md = context.media_disposition;
    const errs = [];
    for (const k of ['image_scout_pre_kg', 'image_scout_post_kg', 'image_asset_manifest']) if (a.source_refs?.[k] !== SENTINEL) errs.push(`source_refs.${k} must be ${SENTINEL}`);
    if (errs.length) out.push(chk('MEDIA_SENTINEL', F, errs.join('; ')));
    else if (!md) out.push(chk('MEDIA_SENTINEL', H, 'context.media_disposition absent; sentinel/exemption binding unverifiable'));
    else {
      if (!arr(md.inactive_roles).includes('20A')) errs.push('media disposition does not list 20A inactive');
      const allowed = arr(md.non_applicable_checks).map(c => c.check);
      for (const e of arr(a.media?.exempt_by_disposition)) if (!allowed.includes(e)) errs.push(`exemption "${e}" not named in media disposition non_applicable_checks`);
      if (md.image_cards_enabled === false && arr(a.media?.required_slot_ids).length) errs.push(`image_cards_enabled false yet ${arr(a.media.required_slot_ids).length} required media slot(s) declared — required visuals need Role15 asset binding`);
      out.push(errs.length ? chk('MEDIA_SENTINEL', F, head(errs)) : chk('MEDIA_SENTINEL', P, `sentinels bound to media disposition; ${arr(a.media?.exempt_by_disposition).length} exemption(s) named there`));
    }
  }

  return out;
}
