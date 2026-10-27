// Compensating checks for stage 09.package (ProductPackage pilot adapter, v0.4.0).
// Contract: export const stage_id; export function run(artifact, context) -> Check[] (CONVENTIONS.md).
// Pure: no fs, no network, no clock. Every check that needs a context binding it lacks returns HOLD.
// Context keys read (all optional):
//   media_disposition, overlay, finish_criteria            parsed contract objects
//   accepted_inputs {carddeck, card_scripts, sessions, curriculum_unit_map, exam_bank}   parsed accepted artifacts
//   candidate_manifest {artifacts:[{path,sha256}], candidate_sha256?}
//   qa_reports {coverage, facts}                            parsed 07/08 reports
//   uispec (parsed, only for its hash), uispec_receipts {validate_1:{schema,independent}, validate_2:{...}}
//   exam_facts_view {<fact_id>: {value,status,source_page}}
//   loaded_refs {"<dotted key>": {path, sha256}} (written by tools/belt/lib/fixture-context.mjs) or ref_sha256 {"<key>": sha256}
export const stage_id = '09.package';

const P = '09';
const S = 'deferred:not_applicable_pilot';
const HEX = /^[0-9a-f]{64}$/;
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const EXPECTED_REFS = {
  media_disposition: 'contracts/media-disposition.json',
  finish_criteria: 'contracts/pilot-finish-criteria.json',
  overlay: 'contracts/pilot-overrides-v0.4.0.json',
};

const mk = (status) => (name, evidence, metrics) => ({ check_id: `${P}.${name}`, status, evidence, ...(metrics ? { metrics } : {}) });
const pass = mk('PASS'), fail = mk('FAIL'), hold = mk('HOLD');
const isObj = (x) => x && typeof x === 'object' && !Array.isArray(x);
const refSha = (ctx, key) => ctx?.loaded_refs?.[key]?.sha256 ?? ctx?.ref_sha256?.[key] ?? null;
const preview = (a) => a?.pilot_status === 'preview_ready';

function walkStrings(node, path, out, skip = new Set()) {
  if (typeof node === 'string') { out.push({ path, value: node }); return out; }
  if (Array.isArray(node)) { node.forEach((n, i) => walkStrings(n, `${path}/${i}`, out, skip)); return out; }
  if (isObj(node)) for (const [k, v] of Object.entries(node)) { const p = `${path}/${k}`; if (!skip.has(p)) walkStrings(v, p, out, skip); }
  return out;
}

// ---------- accepted-input readers (tolerant to V1 and pilot-adapter shapes; evidence names the key used) ----------
const ALIASES = {
  carddeck: ['carddeck', 'cards'],
  card_scripts: ['card_scripts', 'voicescripts'],
  sessions: ['sessions', 'teaching_units', 'session_scripts'],
  curriculum_unit_map: ['curriculum_unit_map', 'units'],
  exam_bank: ['exam_bank', 'exambank'],
};
function component(ai, name) {
  for (const k of ALIASES[name]) if (isObj(ai?.[k])) return { key: k, value: ai[k] };
  return null;
}
function firstArray(obj, keys) {
  for (const k of keys) if (Array.isArray(obj?.[k])) return { key: k, arr: obj[k] };
  return null;
}
const idOf = (x, keys) => { for (const k of keys) if (typeof x?.[k] === 'string' && x[k]) return x[k]; return null; };

export function readInputs(ai) {
  const r = { present: {}, keys: {} };
  const cd = component(ai, 'carddeck');
  if (cd && Array.isArray(cd.value.decks)) {
    r.present.carddeck = true; r.keys.carddeck = `${cd.key}.decks[].cards[]`;
    r.decks = cd.value.decks;
    r.cards = cd.value.decks.flatMap(d => (Array.isArray(d.cards) ? d.cards : []));
    r.cardIds = r.cards.map(c => idOf(c, ['id', 'card_id']));
    // V1 recap scripts address "recap.<module_id>"; pilot recaps may carry id/recap_id.
    r.recapIds = (Array.isArray(cd.value.recaps) ? cd.value.recaps : []).map(x => idOf(x, ['id', 'recap_id']) ?? (x?.module_id ? `recap.${x.module_id}` : null)).filter(Boolean);
  }
  const cs = component(ai, 'card_scripts');
  const sa = cs && firstArray(cs.value, ['scripts', 'audio_scripts', 'card_scripts']);
  if (sa) { r.present.card_scripts = true; r.keys.card_scripts = `${cs.key}.${sa.key}[]`; r.scripts = sa.arr; }
  const ss = component(ai, 'sessions');
  const sx = ss && firstArray(ss.value, ['sessions', 'units', 'teaching_units']);
  if (sx) {
    r.present.sessions = true; r.keys.sessions = `${ss.key}.${sx.key}[]`; r.sessions = sx.arr;
    r.sessionIds = sx.arr.map(s => idOf(s, ['session_id', 'unit_id', 'id', 'module_id'])).filter(Boolean);
  }
  const cu = component(ai, 'curriculum_unit_map');
  if (cu && Array.isArray(cu.value.units)) { r.present.curriculum_unit_map = true; r.keys.curriculum_unit_map = `${cu.key}.units[]`; r.units = cu.value.units; }
  const eb = component(ai, 'exam_bank');
  if (eb && Array.isArray(eb.value.items)) {
    r.present.exam_bank = true;
    r.items = eb.value.items;
    r.itemIds = r.items.map(i => idOf(i, ['id', 'item_id']));
    const fx = firstArray(eb.value, ['practice_forms', 'forms', 'mock_exams']);
    r.forms = fx ? fx.arr : [];
    r.quizzes = Array.isArray(eb.value.module_quizzes) ? eb.value.module_quizzes : [];
    r.keys.exam_bank = `${eb.key}.items[] + ${eb.key}.${fx ? fx.key : '(no forms key)'}[]`;
  }
  return r;
}

export function recomputeCounts(r) {
  return {
    deck_count: r.present.carddeck ? r.decks.length : 0,
    card_count: r.present.carddeck ? r.cards.length : 0,
    text_script_count: r.present.card_scripts ? r.scripts.length : 0,
    session_count: r.present.sessions ? r.sessions.length : 0,
    unit_count: r.present.curriculum_unit_map ? r.units.length : 0,
    item_count: r.present.exam_bank ? r.items.length : 0,
    form_count: r.present.exam_bank ? r.forms.length : 0,
  };
}

export function recomputeIntegrity(r, probe) {
  const cardSet = new Set(r.cardIds ?? []);
  const targets = new Set([...(r.cardIds ?? []), ...(r.recapIds ?? [])]);
  const itemSet = new Set(r.itemIds ?? []);
  const sessionSet = new Set(r.sessionIds ?? []);
  const scriptTargets = (r.scripts ?? []).map(s => idOf(s, ['card_id', 'target_id', 'recap_id']));
  const scriptTargetSet = new Set(scriptTargets.filter(Boolean));
  const orphanScripts = r.present.carddeck ? scriptTargets.filter(t => !t || !targets.has(t)) : [];
  const cardsMissingScript = r.present.card_scripts ? (r.cardIds ?? []).filter(id => !scriptTargetSet.has(id)) : (r.cardIds ?? []);
  let unresolved = 0;
  const unresolvedSamples = [];
  const note = (where, id) => { unresolved++; if (unresolvedSamples.length < 6) unresolvedSamples.push(`${where}:${id}`); };
  let formsMissing = 0;
  for (const f of r.forms ?? []) {
    const bad = (f.item_ids ?? []).filter(id => !itemSet.has(id));
    bad.forEach(id => note(`form ${f.form_id ?? f.id ?? '?'}`, id));
    if (bad.length || !(f.item_ids ?? []).length) formsMissing++;
  }
  for (const q of r.quizzes ?? []) (q.item_ids ?? []).filter(id => !itemSet.has(id)).forEach(id => note(`quiz ${q.module_id ?? q.module ?? '?'}`, id));
  let unitsMissing = 0;
  const unitCards = new Set();
  for (const u of r.units ?? []) {
    let bad = 0;
    for (const id of u.card_ids ?? []) { unitCards.add(id); if (!cardSet.has(id)) { bad++; note(`unit ${u.unit_id ?? '?'} card`, id); } }
    for (const id of [...(u.quiz_item_ids ?? []), ...(u.mock_item_ids ?? [])]) if (!itemSet.has(id)) { bad++; note(`unit ${u.unit_id ?? '?'} item`, id); }
    if (u.session_ref != null && !sessionSet.has(u.session_ref)) { bad++; note(`unit ${u.unit_id ?? '?'} session_ref`, u.session_ref); }
    if (bad || !(u.card_ids ?? []).length || u.session_ref == null) unitsMissing++;
  }
  const cardsOutsideUnits = r.present.curriculum_unit_map ? (r.cardIds ?? []).filter(id => !unitCards.has(id)) : [];
  // cross_product_refs: any accepted-input string id/ref that names another tenant directory.
  let cross = 0;
  if (probe) {
    const all = walkStrings([r.cards ?? [], r.scripts ?? [], r.units ?? [], r.items ?? []], '', []);
    for (const s of all) { const m = /tenants\/([a-z0-9-]+)/.exec(s.value); if (m && m[1] !== probe) cross++; }
  }
  return {
    values: {
      orphans: orphanScripts.length + cardsOutsideUnits.length,
      unresolved_refs: unresolved,
      cards_missing_text_script: cardsMissingScript.length,
      forms_missing_items: formsMissing,
      units_missing_refs: unitsMissing,
      cross_product_refs: cross,
    },
    samples: { orphan_scripts: orphanScripts.slice(0, 5), cards_outside_units: cardsOutsideUnits.slice(0, 5), cards_missing_text_script: cardsMissingScript.slice(0, 5), unresolved: unresolvedSamples },
  };
}

// provenance = a non-empty source_ref string, a V1-style {ref:"..."} source_ref object, source_refs[] or fact_ids[].
export const hasProvenance = (x) => Boolean(
  (typeof x?.source_ref === 'string' && x.source_ref.trim()) ||
  (isObj(x?.source_ref) && typeof x.source_ref.ref === 'string' && x.source_ref.ref.trim()) ||
  (Array.isArray(x?.source_refs) && x.source_refs.length) ||
  (Array.isArray(x?.fact_ids) && x.fact_ids.length));

// ---------------------------------------------------------------- checks
function chkLegacyStatus(a, ctx) {
  const expected = ctx?.overlay?.role_overrides?.['09']?.state_adaptation?.legacy_parent_status ?? 'blocked';
  const reason = typeof a.status_reason === 'string' ? a.status_reason.trim() : '';
  if (a.status !== expected) return fail('LEGACY_STATUS_HONEST', `status=${JSON.stringify(a.status)}; pilot packages keep the legacy parent status ${JSON.stringify(expected)} (overlay role_overrides.09.state_adaptation; prompt 09 "Never emit parent status:shipped")`);
  if (!reason) return fail('LEGACY_STATUS_HONEST', 'status_reason is empty; legacy status "blocked" requires a scoped reason (status_reason_required)');
  if (preview(a) && !/deferr/i.test(reason)) return fail('LEGACY_STATUS_HONEST', `pilot_status=preview_ready but status_reason ${JSON.stringify(reason.slice(0, 120))} does not scope the legacy "blocked" to a deferred production release; the legacy status must not read as a content failure`);
  return pass('LEGACY_STATUS_HONEST', `status="${a.status}" with scoped reason ${JSON.stringify(reason.slice(0, 120))}; pilot_status="${a.pilot_status}" carries the package verdict`);
}

function chkStatusScope(a) {
  if (a.status_scope !== 'content_package') return fail('STATUS_SCOPE', `status_scope=${JSON.stringify(a.status_scope)}; 09 may only assert content_package (application readiness is a separate later receipt)`);
  const claims = walkStrings(a, '', []).filter(s => /application[_ ]preview[_ ]ready|application (is )?ready|working application|app(lication)? qa pass/i.test(s.value));
  if (claims.length) return fail('STATUS_SCOPE', `application-readiness claim in package strings: ${claims.slice(0, 3).map(c => `${c.path}=${JSON.stringify(c.value.slice(0, 80))}`).join('; ')}`);
  return pass('STATUS_SCOPE', 'status_scope=content_package; no application-readiness claim in any string field');
}

function chkProbeVersion(a) {
  const bad = [];
  if (!SLUG.test(a.probe ?? '')) bad.push(`probe ${JSON.stringify(a.probe)} !~ ${SLUG}`);
  if (!(typeof a.package_version === 'string' && a.package_version.trim())) bad.push('package_version empty');
  for (const k of ['model', 'lane', 'pass']) if (!(a.minted_by?.[k] ?? '').trim()) bad.push(`minted_by.${k} empty`);
  return bad.length ? fail('PROBE_AND_VERSION', bad.join('; ')) : pass('PROBE_AND_VERSION', `probe="${a.probe}" matches ${SLUG}; package_version="${a.package_version}"`);
}

function chkNonNegative(a) {
  const bad = [];
  for (const sec of ['contents', 'integrity']) for (const [k, v] of Object.entries(a[sec] ?? {})) if (typeof v === 'number' && (!Number.isInteger(v) || v < 0)) bad.push(`${sec}.${k}=${v}`);
  if (typeof a.qa_gates?.blocking_findings === 'number' && a.qa_gates.blocking_findings < 0) bad.push(`qa_gates.blocking_findings=${a.qa_gates.blocking_findings}`);
  return bad.length ? fail('NONNEGATIVE_COUNTS', `negative/non-integer counts: ${bad.join(', ')}`) : pass('NONNEGATIVE_COUNTS', 'every contents/integrity count and blocking_findings is a non-negative integer');
}

function chkHashFormat(a) {
  const bad = [];
  const walk = (n, p) => {
    if (Array.isArray(n)) return n.forEach((x, i) => walk(x, `${p}/${i}`));
    if (!isObj(n)) return;
    for (const [k, v] of Object.entries(n)) {
      if ((k === 'sha256' || k.endsWith('_sha256')) && v !== null && !(typeof v === 'string' && HEX.test(v))) bad.push(`${p}/${k}=${JSON.stringify(v)}`);
      walk(v, `${p}/${k}`);
    }
  };
  walk(a, '');
  return bad.length ? fail('HASH_FORMAT', `non-hex sha256 values: ${bad.slice(0, 6).join('; ')}`) : pass('HASH_FORMAT', 'every non-null sha256 field is 64 lowercase hex');
}

function chkQaGates(a) {
  const g = a.qa_gates ?? {};
  const bad = [];
  for (const k of ['coverage', 'facts']) {
    const x = g[k] ?? {};
    if (x.verdict === 'PASS' && (!x.report_ref || !x.sha256)) bad.push(`qa_gates.${k} claims PASS without report_ref+sha256`);
  }
  if (!preview(a)) {
    return bad.length ? fail('QA_GATES_FOR_PREVIEW', bad.join('; ')) : pass('QA_GATES_FOR_PREVIEW', `pilot_status=blocked: no gate asserted (coverage=${g.coverage?.verdict}, facts=${g.facts?.verdict})`);
  }
  for (const k of ['coverage', 'facts']) {
    const x = g[k] ?? {};
    if (x.verdict !== 'PASS') bad.push(`qa_gates.${k}.verdict=${x.verdict}`);
    if (!x.report_ref || !x.sha256) bad.push(`qa_gates.${k} report_ref/sha256 missing`);
  }
  if (g.all_assigned_providers_pass !== true) bad.push(`all_assigned_providers_pass=${g.all_assigned_providers_pass}`);
  if (g.blocking_findings !== 0) bad.push(`blocking_findings=${g.blocking_findings}`);
  return bad.length ? fail('QA_GATES_FOR_PREVIEW', `preview_ready requires 07+08 PASS, every assigned provider PASS, zero blocking findings: ${bad.join('; ')}`)
    : pass('QA_GATES_FOR_PREVIEW', 'preview_ready: coverage PASS + facts PASS with refs, all_assigned_providers_pass=true, blocking_findings=0');
}

function reportVerdict(r) { return r?.verdict ?? r?.status ?? null; }
function reportBlocking(r) {
  const b = r?.blocking_findings ?? r?.unresolved_blocking_findings;
  if (typeof b === 'number') return b;
  if (Array.isArray(b)) return b.length;
  return null;
}
function chkQaReportsBinding(a, ctx) {
  const g = a.qa_gates ?? {};
  const bound = ['coverage', 'facts'].filter(k => g[k]?.report_ref || g[k]?.sha256);
  if (!bound.length) return preview(a) ? fail('QA_REPORTS_BINDING', 'preview_ready with no bound 07/08 report') : pass('QA_REPORTS_BINDING', 'no 07/08 report bound (pilot_status=blocked)');
  if (!isObj(ctx?.qa_reports)) return hold('QA_REPORTS_BINDING', `qa_gates bind ${bound.join('+')} but context.qa_reports is absent; cannot verify report bytes/verdict/candidate echo`);
  const bad = [], ok = [];
  let blockingSum = 0, blockingKnown = true;
  for (const k of bound) {
    const rep = ctx.qa_reports[k];
    if (!isObj(rep)) { bad.push(`context.qa_reports.${k} absent`); continue; }
    const sha = refSha(ctx, `qa_reports.${k}`);
    if (!sha) bad.push(`no loaded sha256 for qa_reports.${k}`);
    else if (sha !== g[k].sha256) bad.push(`qa_gates.${k}.sha256 ${g[k].sha256} != report bytes ${sha}`);
    const v = reportVerdict(rep);
    if (v !== g[k].verdict) bad.push(`qa_gates.${k}.verdict=${g[k].verdict} but report says ${v}`);
    if (a.candidate_sha256 != null && rep.candidate_sha256 !== a.candidate_sha256) bad.push(`report ${k} candidate_sha256=${rep.candidate_sha256 ?? 'absent'} != package candidate_sha256=${a.candidate_sha256}`);
    const b = reportBlocking(rep);
    if (b === null) blockingKnown = false; else blockingSum += b;
    ok.push(`${k}:${v}`);
  }
  if (blockingKnown && blockingSum !== g.blocking_findings) bad.push(`qa_gates.blocking_findings=${g.blocking_findings} but reports total ${blockingSum}`);
  if (bad.length) return fail('QA_REPORTS_BINDING', bad.join('; '));
  return pass('QA_REPORTS_BINDING', `report bytes/verdicts match (${ok.join(', ')})${a.candidate_sha256 ? '; both echo candidate_sha256' : '; no candidate bound'}${blockingKnown ? `; blocking total ${blockingSum}` : '; reports carry no blocking_findings field (not recomputed)'}`);
}

function chkCandidate(a, ctx) {
  if (a.candidate_sha256 == null) {
    return preview(a) ? fail('CANDIDATE_IN_MANIFEST', 'preview_ready with candidate_sha256=null; packaging binds exactly one ContentCandidateManifest')
      : pass('CANDIDATE_IN_MANIFEST', 'candidate_sha256=null with pilot_status=blocked (no candidate bound; nothing asserted)');
  }
  const cm = ctx?.candidate_manifest;
  const expected = refSha(ctx, 'candidate_manifest') ?? (isObj(cm) ? cm.candidate_sha256 ?? null : null);
  if (!expected) return hold('CANDIDATE_IN_MANIFEST', `candidate_sha256=${a.candidate_sha256} but no context.candidate_manifest (bytes hash) to compare`);
  if (expected !== a.candidate_sha256) return fail('CANDIDATE_IN_MANIFEST', `candidate_sha256=${a.candidate_sha256} != candidate manifest ${expected}`);
  const listed = new Set((cm?.artifacts ?? []).map(x => x?.sha256).filter(Boolean));
  const notListed = [];
  for (const [k, v] of Object.entries(ctx?.loaded_refs ?? {})) if (k.startsWith('accepted_inputs.') && !listed.has(v.sha256)) notListed.push(`${k}@${v.sha256.slice(0, 12)}`);
  const cum = a.deploy?.curriculum_unit_map_sha256;
  if (cum && !listed.has(cum)) notListed.push(`deploy.curriculum_unit_map_sha256@${cum.slice(0, 12)}`);
  if (notListed.length) return fail('CANDIDATE_IN_MANIFEST', `scoped artifact hashes outside the candidate manifest: ${notListed.join(', ')}`);
  return pass('CANDIDATE_IN_MANIFEST', `candidate_sha256 equals manifest bytes ${expected.slice(0, 16)}…; ${listed.size} manifest artifacts; every accepted input + unit map hash is listed`);
}

function chkUiSpec(a, ctx) {
  const u = a.uispec ?? {};
  const has1 = isObj(u.validate_1_receipt), has2 = isObj(u.validate_2_receipt);
  if (!preview(a)) {
    if (!has1 && !has2) return pass('UISPEC_RECEIPTS', `pilot_status=blocked; uispec receipts not asserted (validate_1=${has1}, validate_2=${has2})`);
  } else {
    const miss = [];
    if (!u.ref || !u.sha256) miss.push('uispec ref/sha256');
    if (!has1) miss.push('validate_1_receipt');
    if (!has2) miss.push('validate_2_receipt');
    if (miss.length) return fail('UISPEC_RECEIPTS', `preview_ready requires a validated FINAL UiSpec; missing: ${miss.join(', ')}`);
  }
  const rec = ctx?.uispec_receipts;
  if (!isObj(rec)) return hold('UISPEC_RECEIPTS', 'uispec receipts referenced but context.uispec_receipts absent; receipt status/spec/candidate binding not verified');
  const bad = [];
  const specSha = refSha(ctx, 'uispec');
  if (u.sha256 && specSha && specSha !== u.sha256) bad.push(`uispec.sha256 ${u.sha256} != UiSpec bytes ${specSha}`);
  if (u.sha256 && !specSha) bad.push('no loaded UiSpec bytes to hash (context.uispec)');
  for (const [phase, has] of [['validate_1', has1], ['validate_2', has2]]) {
    if (!has) continue;
    for (const [slot, kind] of [['schema', 'role14_schema'], ['independent', 'independent_semantic']]) {
      const r = rec?.[phase]?.[slot];
      const ref = u[`${phase}_receipt`][`${slot}_receipt`];
      if (!isObj(r)) { bad.push(`context.uispec_receipts.${phase}.${slot} absent`); continue; }
      const sha = refSha(ctx, `uispec_receipts.${phase}.${slot}`);
      if (sha && sha !== ref.sha256) bad.push(`${phase}.${slot} ref sha ${ref.sha256.slice(0, 12)} != bytes ${sha.slice(0, 12)}`);
      if (r.phase !== phase) bad.push(`${phase}.${slot} phase=${r.phase}`);
      if (r.kind !== kind) bad.push(`${phase}.${slot} kind=${r.kind} (want ${kind})`);
      if (r.status !== 'PASS') bad.push(`${phase}.${slot} status=${r.status}`);
      if (r.spec_sha256 !== u.sha256) bad.push(`${phase}.${slot} spec_sha256 ${String(r.spec_sha256).slice(0, 12)} != uispec.sha256`);
      if (a.candidate_sha256 && r.content_candidate_sha256 !== a.candidate_sha256) bad.push(`${phase}.${slot} content_candidate_sha256 != package candidate`);
    }
  }
  return bad.length ? fail('UISPEC_RECEIPTS', bad.join('; ')) : pass('UISPEC_RECEIPTS', `UiSpec bytes match; validate_1 + validate_2 schema/independent receipts PASS on spec ${String(u.sha256).slice(0, 12)}… and the package candidate`);
}

function chkMediaDisposition(a, ctx) {
  const bad = [];
  if (preview(a) && !isObj(a.early_media_intent_ref)) bad.push('preview_ready requires early_media_intent_ref (a late UiSpec cannot retroactively supply the early media policy)');
  if (a.media_disposition_ref !== EXPECTED_REFS.media_disposition) bad.push(`media_disposition_ref=${a.media_disposition_ref} (want ${EXPECTED_REFS.media_disposition})`);
  if (preview(a) && !a.media_disposition_sha256) bad.push('media_disposition_sha256 null on preview_ready');
  if (bad.length) return fail('MEDIA_DISPOSITION_BINDING', bad.join('; '));
  if (!isObj(ctx?.media_disposition)) return hold('MEDIA_DISPOSITION_BINDING', 'context.media_disposition absent; disposition bytes not verified');
  const sha = refSha(ctx, 'media_disposition');
  if (!sha) return hold('MEDIA_DISPOSITION_BINDING', 'media_disposition supplied without a bytes hash (loaded_refs/ref_sha256)');
  if (a.media_disposition_sha256 !== sha) return fail('MEDIA_DISPOSITION_BINDING', `media_disposition_sha256=${a.media_disposition_sha256} != disposition bytes ${sha}`);
  return pass('MEDIA_DISPOSITION_BINDING', `media disposition bound at ${sha.slice(0, 16)}…${a.early_media_intent_ref ? '; early media intent ref present' : ''}`);
}

function chkAudio(a, ctx) {
  const md = ctx?.media_disposition;
  const t = a.audio_teacher_loop ?? {};
  if (t.live_tts_in_user_flow !== false) return fail('AUDIO_INACTIVE_ROLE20', `audio_teacher_loop.live_tts_in_user_flow=${t.live_tts_in_user_flow}; live TTS is never allowed`);
  if (!isObj(md) || !Array.isArray(md.inactive_roles)) return hold('AUDIO_INACTIVE_ROLE20', 'context.media_disposition.inactive_roles absent; cannot decide whether an audio provider is permitted');
  if (!md.inactive_roles.includes('20')) return pass('AUDIO_INACTIVE_ROLE20', `role 20 active per media disposition; provider=${t.provider} not restricted by this check`);
  const bad = [];
  if (t.provider !== 'none_text_only_pilot') bad.push(`provider=${t.provider}`);
  if (t.generation_mode !== 'none') bad.push(`generation_mode=${t.generation_mode}`);
  if (t.output_manifest !== 'none') bad.push(`output_manifest=${t.output_manifest}`);
  if (a.deploy?.audio_manifest_ref !== S) bad.push(`deploy.audio_manifest_ref=${a.deploy?.audio_manifest_ref}`);
  if (a.learner_features?.rendered_audio !== false) bad.push(`learner_features.rendered_audio=${a.learner_features?.rendered_audio}`);
  if (bad.length) return fail('AUDIO_INACTIVE_ROLE20', `media disposition lists role 20 inactive (inactive_roles=${JSON.stringify(md.inactive_roles)}, rendered_audio_required=${md.rendered_audio_required}) but the package claims active audio: ${bad.join('; ')}`);
  return pass('AUDIO_INACTIVE_ROLE20', 'role 20 inactive; audio_teacher_loop={none_text_only_pilot,none,none,live_tts=false}; audio_manifest_ref sentinel');
}

function chkSentinels(a, ctx) {
  const d = a.deploy ?? {};
  const bad = [];
  if (!(Array.isArray(d.mobile_api_payload_refs) && d.mobile_api_payload_refs.length === 1 && d.mobile_api_payload_refs[0] === S)) bad.push(`mobile_api_payload_refs=${JSON.stringify(d.mobile_api_payload_refs)} (want ["${S}"])`);
  if (bad.length) return fail('SENTINEL_BINDING', bad.join('; '));
  const ov = ctx?.overlay?.role_overrides?.['09'];
  const md = ctx?.media_disposition;
  if (!isObj(ov) || !isObj(md)) return hold('SENTINEL_BINDING', `sentinel authority not verifiable: overlay role 09 ${isObj(ov) ? 'present' : 'absent'}, media disposition ${isObj(md) ? 'present' : 'absent'}`);
  const step = (n) => (ov.sop_dispositions ?? []).find(s => s.step === n)?.status ?? null;
  const s4 = step(4), s6 = step(6);
  if (!/^(ADAPTED_DEV_PREVIEW|DEFERRED)/.test(s4 ?? '')) bad.push(`overlay 09 SOP step 4 status=${s4} does not defer deploy targets`);
  if (!/^DEFERRED/.test(s6 ?? '')) bad.push(`overlay 09 SOP step 6 status=${s6} does not defer production shipping`);
  const na = (md.non_applicable_checks ?? []).map(x => String(x.check).toLowerCase());
  if (!na.some(c => c.includes('audio manifest'))) bad.push('media disposition non_applicable_checks lacks the rendered audio manifest');
  if (!na.some(c => c.includes('image scout'))) bad.push('media disposition non_applicable_checks lacks image scout plans');
  if (bad.length) return fail('SENTINEL_BINDING', `sentinel without authority: ${bad.join('; ')}`);
  return pass('SENTINEL_BINDING', `supabase/mobile/listing sentinels backed by overlay 09 step4=${s4}, step6=${s6}; audio manifest + image scout sentinels backed by media-disposition non_applicable_checks; market_signal_ref sentinel authority (BELT-V2 roster: consumer 10 Launch & Growth inactive_for_pilot; C57 later sales handoff) is recorded in the mapping, not machine-verified here`);
}

function chkContractBinding(name, key, a, ctx, extra) {
  const refField = `${key === 'overlay' ? 'pilot_overlay' : key}_ref`;
  const shaField = `${key === 'overlay' ? 'pilot_overlay' : key}_sha256`;
  if (a[refField] !== EXPECTED_REFS[key]) return fail(name, `${refField}=${a[refField]} (want ${EXPECTED_REFS[key]})`);
  if (preview(a) && !a[shaField]) return fail(name, `${shaField} null on preview_ready`);
  if (!isObj(ctx?.[key])) return hold(name, `context.${key} absent; ${refField} bytes not verified`);
  const sha = refSha(ctx, key);
  if (!sha) return hold(name, `context.${key} supplied without a bytes hash`);
  if (a[shaField] !== sha) return fail(name, `${shaField}=${a[shaField]} != bytes ${sha}`);
  const bad = extra(ctx[key]);
  return bad.length ? fail(name, bad.join('; ')) : pass(name, `${refField} bound at ${sha.slice(0, 16)}…`);
}
function chkFinishCriteria(a, ctx) {
  return chkContractBinding('FINISH_CRITERIA_BINDING', 'finish_criteria', a, ctx, (fc) => {
    const bad = [];
    if (!isObj(fc.status_scopes?.package_preview_ready)) bad.push('finish criteria lack status_scopes.package_preview_ready');
    if (fc.status_scopes?.application_preview_ready?.must_not_rewrite_accepted_package !== true) bad.push('application_preview_ready.must_not_rewrite_accepted_package is not true');
    if (fc.statuses?.legacy_parent_status && fc.statuses.legacy_parent_status !== a.status) bad.push(`finish criteria legacy_parent_status=${fc.statuses.legacy_parent_status} != status=${a.status}`);
    if (Array.isArray(fc.statuses?.pilot_status) && !fc.statuses.pilot_status.includes(a.pilot_status)) bad.push(`pilot_status ${a.pilot_status} not in finish criteria statuses`);
    return bad;
  });
}
function chkOverlay(a, ctx) {
  return chkContractBinding('OVERLAY_BINDING', 'overlay', a, ctx, (ov) => {
    const sa = ov.role_overrides?.['09']?.state_adaptation;
    const bad = [];
    if (!isObj(sa)) bad.push('overlay lacks role_overrides.09.state_adaptation');
    else {
      if (!(sa.pilot_status ?? []).includes(a.pilot_status)) bad.push(`pilot_status ${a.pilot_status} not in overlay ${JSON.stringify(sa.pilot_status)}`);
      if (sa.status_reason_required === true && !(a.status_reason ?? '').trim()) bad.push('overlay requires status_reason');
    }
    return bad;
  });
}

function chkLearnerFeatures(a, ctx) {
  const lf = a.learner_features ?? {};
  const on = Object.entries(lf).filter(([, v]) => v !== false).map(([k]) => k);
  if (on.length) return fail('LEARNER_FEATURES_OFF', `learner features claimed on in a free dev preview: ${on.join(', ')}`);
  const fc = ctx?.finish_criteria?.learner_features;
  if (isObj(fc)) {
    const diff = Object.entries(fc).filter(([k, v]) => k in lf && lf[k] !== v).map(([k, v]) => `${k}: package=${lf[k]} criteria=${v}`);
    if (diff.length) return fail('LEARNER_FEATURES_OFF', diff.join('; '));
  }
  return pass('LEARNER_FEATURES_OFF', `auth/checkout/rendered_audio/trace_in_learner_navigation all false${isObj(fc) ? '; equals finish-criteria learner_features' : ''}`);
}

const CLAIM_PATTERNS = [
  [/\bclerk\b/i, 'Clerk auth'], [/\bstripe\b/i, 'Stripe'], [/\bcheckout\b/i, 'checkout'], [/\bpaywall\b/i, 'paywall'],
  [/\b(pk|sk|rk)_(live|test)_/i, 'API key'], [/\bvercel\b/i, 'Vercel'], [/supabase\.(co|in)\b/i, 'Supabase host'],
  [/https?:\/\//i, 'public URL'], [/process\.env|NEXT_PUBLIC_|(^|[\s/])\.env\b/i, 'env reference'],
  [/\bdeployed\b|\bgo[- ]?live\b|\blive (url|site|store|app)\b|\bpublished to\b/i, 'deployment claim'],
  [/\bopenai_audio_api\b|\bgpt-4o-mini-tts\b|\.mp3\b/i, 'audio render claim'],
];
function chkNoDeployClaims(a) {
  const strings = walkStrings(a, '', [], new Set(['/status', '/audio_teacher_loop/provider']));
  const hits = [];
  for (const s of strings) for (const [re, label] of CLAIM_PATTERNS) if (re.test(s.value)) hits.push(`${s.path} (${label}): ${JSON.stringify(s.value.slice(0, 80))}`);
  return hits.length ? fail('NO_DEPLOY_AUTH_CLAIMS', `${hits.length} auth/checkout/env/deployment/audio claim(s): ${hits.slice(0, 4).join('; ')}`)
    : pass('NO_DEPLOY_AUTH_CLAIMS', `${strings.length} string fields scanned; no Clerk/Stripe/checkout/env/URL/deployment/audio-render claim`);
}

function chkSourceDebt(a) {
  const hits = walkStrings(a, '', []).filter(s => /\(verify\)/i.test(s.value));
  return hits.length ? fail('SOURCE_DEBT_LEAK', `"(verify)" source-debt marker in package: ${hits.slice(0, 3).map(h => h.path).join(', ')}`)
    : pass('SOURCE_DEBT_LEAK', 'no "(verify)" marker in any package string');
}

function chkOfficialNumbers(a, ctx) {
  const ec = a.exam_config ?? {};
  const nums = [['n_questions', ec.n_questions], ['passing_threshold', ec.passing_threshold], ...(ec.domain_weights ?? []).map((w, i) => [`domain_weights/${i}(${w.domain})`, w.weight])];
  const bad = [];
  if (ec.practice_only !== true) bad.push(`practice_only=${ec.practice_only} (pilot exam config is practice-only per overlay 06)`);
  const verified = [];
  for (const [p, n] of nums) {
    if (!isObj(n)) { bad.push(`${p} missing`); continue; }
    if (n.status === 'verified') {
      if (n.value === null || !n.source_page || !n.fact_id) bad.push(`${p} status=verified needs value+source_page+fact_id (value=${n.value}, source_page=${n.source_page}, fact_id=${n.fact_id})`);
      else if (p === 'n_questions' && !(Number.isInteger(n.value) && n.value >= 1)) bad.push(`n_questions verified value ${n.value} must be an integer >= 1 (parent minimum 1)`);
      else verified.push([p, n]);
    } else if (n.status === 'unknown') {
      if (n.value !== null) bad.push(`${p} status=unknown carries bare number ${n.value}`);
    } else if (n.status === 'authored') {
      if (ec.practice_only !== true) bad.push(`${p} authored value outside practice_only`);
      if (n.source_page) bad.push(`${p} authored value cites official page ${n.source_page} (authored policy must not pose as official)`);
    }
  }
  if (ec.official_mirror_status === 'verified' && nums.some(([, n]) => n?.status !== 'verified')) bad.push('official_mirror_status=verified while some exam numbers are not verified');
  if (bad.length) return fail('OFFICIAL_NUMBERS', bad.join('; '));
  if (verified.length) {
    const view = ctx?.exam_facts_view;
    if (!isObj(view)) return hold('OFFICIAL_NUMBERS', `${verified.length} verified exam number(s) but context.exam_facts_view absent`);
    for (const [p, n] of verified) {
      const f = view[n.fact_id];
      if (!isObj(f)) bad.push(`${p} fact_id ${n.fact_id} not in exam_facts_view`);
      else if (f.status !== 'verified' || f.value !== n.value || f.source_page !== n.source_page) bad.push(`${p} disagrees with exam_facts_view[${n.fact_id}] (${JSON.stringify(f)})`);
    }
    if (bad.length) return fail('OFFICIAL_NUMBERS', bad.join('; '));
  }
  const tally = nums.reduce((m, [, n]) => ((m[n?.status] = (m[n?.status] ?? 0) + 1), m), {});
  return pass('OFFICIAL_NUMBERS', `practice_only=true; official_mirror_status=${ec.official_mirror_status}; number statuses ${JSON.stringify(tally)}; no bare number under unknown`, { verified: verified.length });
}

function chkCounts(a, ctx) {
  if (!isObj(ctx?.accepted_inputs)) return hold('COUNTS_RECOMPUTED', 'context.accepted_inputs absent; contents counts cannot be recomputed (a model may not self-certify counts)');
  const r = readInputs(ctx.accepted_inputs);
  const want = recomputeCounts(r);
  const missing = Object.keys(ALIASES).filter(k => !r.present[k]);
  const diff = Object.entries(want).filter(([k, v]) => a.contents?.[k] !== v).map(([k, v]) => `${k}: package=${a.contents?.[k]} recomputed=${v}`);
  if (preview(a) && missing.length) diff.unshift(`preview_ready but accepted inputs lack ${missing.join(', ')}`);
  if (diff.length) return fail('COUNTS_RECOMPUTED', `contents disagree with accepted inputs: ${diff.join('; ')}`, { ...want });
  return pass('COUNTS_RECOMPUTED', `contents equal recomputation from ${Object.values(r.keys).join(', ')}${missing.length ? `; absent components counted 0: ${missing.join(', ')}` : ''}`, { ...want });
}

function chkIntegrity(a, ctx) {
  if (!isObj(ctx?.accepted_inputs)) return hold('INTEGRITY_RECOMPUTED', 'context.accepted_inputs absent; joins/orphans cannot be recomputed');
  const r = readInputs(ctx.accepted_inputs);
  const { values, samples } = recomputeIntegrity(r, a.probe);
  const diff = Object.entries(values).filter(([k, v]) => a.integrity?.[k] !== v).map(([k, v]) => `${k}: package=${a.integrity?.[k]} recomputed=${v}`);
  if (diff.length) return fail('INTEGRITY_RECOMPUTED', `integrity disagrees with deterministic joins: ${diff.join('; ')}; samples ${JSON.stringify(samples)}`, { ...values });
  return pass('INTEGRITY_RECOMPUTED', `integrity equals deterministic joins ${JSON.stringify(values)}`, { ...values });
}

function chkIntegrityZero(a) {
  if (!preview(a)) return pass('INTEGRITY_ZERO_FOR_PREVIEW', `pilot_status=blocked; non-zero integrity is reported honestly (orphans=${a.integrity?.orphans}, cards_missing_text_script=${a.integrity?.cards_missing_text_script})`);
  const nz = Object.entries(a.integrity ?? {}).filter(([k, v]) => typeof v === 'number' && v !== 0).map(([k, v]) => `${k}=${v}`);
  if (a.provenance_preserved !== true) nz.push(`provenance_preserved=${a.provenance_preserved}`);
  return nz.length ? fail('INTEGRITY_ZERO_FOR_PREVIEW', `preview_ready requires zero orphans/unresolved/missing refs and preserved provenance: ${nz.join(', ')}`)
    : pass('INTEGRITY_ZERO_FOR_PREVIEW', 'preview_ready: every integrity count 0 and provenance_preserved=true');
}

function chkProvenance(a, ctx) {
  if (!isObj(ctx?.accepted_inputs)) return hold('PROVENANCE_RECOMPUTED', 'context.accepted_inputs absent; provenance carry-through not recomputed');
  const r = readInputs(ctx.accepted_inputs);
  const hasProv = hasProvenance;
  const cardsNo = (r.cards ?? []).filter(c => !hasProv(c)).length;
  const itemsNo = (r.items ?? []).filter(i => !hasProv(i)).length;
  const actual = cardsNo === 0 && itemsNo === 0 && (r.cards?.length ?? 0) + (r.items?.length ?? 0) > 0;
  if (a.provenance_preserved === true && !actual) return fail('PROVENANCE_RECOMPUTED', `provenance_preserved=true but ${cardsNo} card(s) and ${itemsNo} item(s) lack source_ref/source_ref.ref/source_refs/fact_ids (or no cards/items present)`);
  if (a.provenance_preserved === false && actual) return fail('PROVENANCE_RECOMPUTED', 'provenance_preserved=false but every accepted card/item carries provenance (report it truthfully)');
  return pass('PROVENANCE_RECOMPUTED', `provenance_preserved=${a.provenance_preserved}; cards without provenance=${cardsNo}, items without provenance=${itemsNo}`);
}

export function run(artifact, context = {}) {
  const a = isObj(artifact) ? artifact : {};
  const ctx = isObj(context) ? context : {};
  return [
    chkLegacyStatus(a, ctx),
    chkStatusScope(a),
    chkProbeVersion(a),
    chkNonNegative(a),
    chkHashFormat(a),
    chkQaGates(a),
    chkQaReportsBinding(a, ctx),
    chkCandidate(a, ctx),
    chkUiSpec(a, ctx),
    chkMediaDisposition(a, ctx),
    chkAudio(a, ctx),
    chkSentinels(a, ctx),
    chkFinishCriteria(a, ctx),
    chkOverlay(a, ctx),
    chkLearnerFeatures(a, ctx),
    chkNoDeployClaims(a),
    chkSourceDebt(a),
    chkOfficialNumbers(a, ctx),
    chkCounts(a, ctx),
    chkIntegrity(a, ctx),
    chkIntegrityZero(a),
    chkProvenance(a, ctx),
  ];
}

export const CHECK_IDS = ['LEGACY_STATUS_HONEST', 'STATUS_SCOPE', 'PROBE_AND_VERSION', 'NONNEGATIVE_COUNTS', 'HASH_FORMAT', 'QA_GATES_FOR_PREVIEW', 'QA_REPORTS_BINDING', 'CANDIDATE_IN_MANIFEST', 'UISPEC_RECEIPTS', 'MEDIA_DISPOSITION_BINDING', 'AUDIO_INACTIVE_ROLE20', 'SENTINEL_BINDING', 'FINISH_CRITERIA_BINDING', 'OVERLAY_BINDING', 'LEARNER_FEATURES_OFF', 'NO_DEPLOY_AUTH_CLAIMS', 'SOURCE_DEBT_LEAK', 'OFFICIAL_NUMBERS', 'COUNTS_RECOMPUTED', 'INTEGRITY_RECOMPUTED', 'INTEGRITY_ZERO_FOR_PREVIEW', 'PROVENANCE_RECOMPUTED'].map(n => `${P}.${n}`);
