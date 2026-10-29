// Compensating checks for schemas-strict/07-coverage-report.schema.json (stage 07.content_coverage).
// Restores the parent allOf (verdict PASS => no unit/media/cross-product gaps), every dropped bound/pattern,
// and the overlay/handoff invariants: candidate echo + input membership, media disposition binding, early
// media intent, titled promises, provider/scope, no PASS with unrun required checks. The post-validator status
// of a report is its ACCEPTANCE status (07.VERDICT_GATE): a FAIL/HOLD report never yields PASS.
// "Never repair" is a prompt-level instruction, not a check. Pure: no network, no writes, no clock.
import { check, head, isHex64, PROBE_SLUG, emptyStrings, candidateEchoCheck, inputMembershipCheck, independenceCheck, verdictGateCheck } from '../lib/qa-common.mjs';
import { providerFamily } from '../../check-audit-independence.mjs';
import { completionCoverage } from '../completion-coverage.mjs';

export const stage_id = '07.content_coverage';
const P = '07';
export const CHECK_IDS = ['ENVELOPE', 'CANDIDATE_ECHO', 'INPUT_MEMBERSHIP', 'ROW_FIELDS', 'VERDICT_INVARIANT', 'VERDICT_CONSISTENCY', 'REQUIRED_CHECKS_RUN', 'ROUTE_COVERAGE', 'DOMAIN_WEIGHTS', 'PRACTICE_FORM_DRIFT', 'TITLED_PROMISE', 'MEDIA_DISPOSITION', 'EARLY_MEDIA_INTENT', 'PROVIDER_SCOPE', 'INDEPENDENCE', 'VERDICT_GATE'].map(c => `${P}.${c}`);
export const REQUIRED_INPUTS = ['blueprint', 'knowledge_graph', 'carddeck', 'session_scripts', 'exambank'];
const SENTINEL = 'deferred:not_applicable_pilot';
const TENANT_DIR = /^app\/public\/tenants\/[a-z0-9][a-z0-9-]*$/;

// Countable promise in a title: "Top-N", "All N", or "N <plural noun>".
export function promisedCount(title) {
  if (typeof title !== 'string') return null;
  const m = /\b(?:top|all)[\s-]+(\d+)\b/i.exec(title) ?? /\b(\d+)[\s-]+(?:[a-z]+[\s-]+)?[a-z]+s\b/i.exec(title);
  return m ? Number(m[1]) : null;
}

export function run(r, context = {}) {
  const out = [];
  const arr = (k) => (Array.isArray(r?.[k]) ? r[k] : []);

  // ENVELOPE — probe pattern; non-empty stamp/scope/basis refs; source_refs non-empty (sentinel only for image_scout_plan).
  {
    const bad = [];
    if (!PROBE_SLUG.test(r?.probe ?? '')) bad.push(`probe ${JSON.stringify(r?.probe)} violates ^[a-z0-9][a-z0-9-]*$`);
    const sr = r?.source_refs ?? {};
    const e = emptyStrings([['/minted_by/model', r?.minted_by?.model], ['/minted_by/lane', r?.minted_by?.lane], ['/minted_by/pass', r?.minted_by?.pass], ['/coverage_matrix_ref', r?.coverage_matrix_ref], ['/provider_family', r?.provider_family], ['/assigned_scope', r?.assigned_scope], ...Object.entries(sr).map(([k, v]) => [`/source_refs/${k}`, v])]);
    if (e.length) bad.push(`empty: ${e.join(', ')}`);
    const sentinelMisuse = Object.entries(sr).filter(([k, v]) => v === SENTINEL && k !== 'image_scout_plan').map(([k]) => k);
    if (sentinelMisuse.length) bad.push(`sentinel ${SENTINEL} not allowed for source_refs.${sentinelMisuse.join(',')}`);
    out.push(check(`${P}.ENVELOPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : 'probe slug, stamp, coverage_matrix_ref, provider/scope and source_refs valid'));
  }

  out.push(candidateEchoCheck(P, r ?? {}, context));
  out.push(inputMembershipCheck(P, r?.input_hashes, context, REQUIRED_INPUTS));

  // ROW_FIELDS — restored minLength:1 on every row string, tenant-dir pattern, numeric bounds 0..100.
  {
    const pairs = [
      ...arr('blocking_findings').flatMap((f, i) => [[`/blocking_findings/${i}/finding_id`, f.finding_id], [`/blocking_findings/${i}/check_id`, f.check_id], [`/blocking_findings/${i}/issue`, f.issue], [`/blocking_findings/${i}/evidence`, f.evidence]]),
      ...arr('domain_coverage').map((d, i) => [`/domain_coverage/${i}/domain`, d.domain]),
      ...arr('missing_high_yield').flatMap((m, i) => [[`/missing_high_yield/${i}/domain`, m.domain], [`/missing_high_yield/${i}/high_yield_area`, m.high_yield_area]]),
      ...arr('dropped_facts').flatMap((d, i) => [[`/dropped_facts/${i}/fact_id`, d.fact_id], [`/dropped_facts/${i}/source_ref`, d.source_ref], [`/dropped_facts/${i}/statement`, d.statement], [`/dropped_facts/${i}/domain`, d.domain]]),
      ...arr('practice_form_drift').map((d, i) => [`/practice_form_drift/${i}/form_id`, d.form_id]),
      ...arr('voice_gaps').map((v, i) => [`/voice_gaps/${i}/card_id`, v.card_id]),
      ...arr('curriculum_unit_gaps').map((u, i) => [`/curriculum_unit_gaps/${i}/unit_id`, u.unit_id]),
      ...arr('media_gaps').map((m, i) => [`/media_gaps/${i}/media_slot_id`, m.media_slot_id]),
      ...arr('pending_media').map((m, i) => [`/pending_media/${i}/media_slot_id`, m.media_slot_id]),
      ...arr('cross_product_refs').map((c, i) => [`/cross_product_refs/${i}/ref`, c.ref]),
      ...arr('sme_dod_unsatisfied').flatMap((s, i) => [[`/sme_dod_unsatisfied/${i}/checklist_item`, s.checklist_item], [`/sme_dod_unsatisfied/${i}/evidence_missing`, s.evidence_missing]]),
      ...arr('route_back').map((g, i) => [`/route_back/${i}/gap_ref`, g.gap_ref]),
      ...arr('required_checks_not_run').map((c, i) => [`/required_checks_not_run/${i}`, c]),
      ...(r?.media?.non_applicable_checks ?? []).flatMap((n, i) => [[`/media/non_applicable_checks/${i}/check`, n.check], [`/media/non_applicable_checks/${i}/reason`, n.reason]]),
    ];
    const bad = emptyStrings(pairs).map(p => `empty ${p}`);
    arr('cross_product_refs').forEach((c, i) => { if (!TENANT_DIR.test(c.expected_tenant_dir ?? '')) bad.push(`/cross_product_refs/${i}/expected_tenant_dir violates ${TENANT_DIR.source}`); });
    arr('domain_coverage').forEach((d, i) => {
      if (!(d.content_share >= 0 && d.content_share <= 100)) bad.push(`/domain_coverage/${i}/content_share ${d.content_share} outside 0..100`);
      if (d.weight_pct != null && !(d.weight_pct >= 0 && d.weight_pct <= 100)) bad.push(`/domain_coverage/${i}/weight_pct ${d.weight_pct} outside 0..100`);
      if (d.weighting_drift != null && !(d.weighting_drift >= 0)) bad.push(`/domain_coverage/${i}/weighting_drift < 0`);
    });
    arr('titled_promises').forEach((t, i) => { if (!String(t.surface_id ?? '').trim()) bad.push(`empty /titled_promises/${i}/surface_id`); });
    out.push(check(`${P}.ROW_FIELDS`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `all row strings non-empty, tenant dirs and numeric bounds valid (${pairs.length} strings)`));
  }

  // VERDICT_INVARIANT — parent allOf: PASS => curriculum_unit_gaps, media_gaps, cross_product_refs empty.
  {
    const nonEmpty = ['curriculum_unit_gaps', 'media_gaps', 'cross_product_refs'].filter(k => arr(k).length);
    const bad = r?.verdict === 'PASS' && nonEmpty.length;
    out.push(check(`${P}.VERDICT_INVARIANT`, bad ? 'FAIL' : 'PASS', bad ? `verdict PASS with non-empty ${nonEmpty.map(k => `${k}(${arr(k).length})`).join(', ')} (parent allOf)` : `parent allOf holds (verdict ${r?.verdict}; unit/media/cross-product gaps ${['curriculum_unit_gaps', 'media_gaps', 'cross_product_refs'].map(k => arr(k).length).join('/')})`));
  }

  // VERDICT_CONSISTENCY — PASS => no gaps/findings/route-backs; FAIL => at least one routed gap; HOLD => a stated blocker.
  {
    const gapKeys = ['blocking_findings', 'missing_high_yield', 'dropped_facts', 'practice_form_drift', 'voice_gaps', 'sme_dod_unsatisfied', 'route_back'];
    const gaps = gapKeys.filter(k => arr(k).length);
    const notOk = arr('domain_coverage').filter(d => d.ok === false).map(d => d.domain);
    const badTitles = arr('titled_promises').filter(t => t.ok === false).map(t => t.surface_id);
    let st = 'PASS', ev;
    if (r?.verdict === 'PASS' && (gaps.length || notOk.length || badTitles.length)) { st = 'FAIL'; ev = `verdict PASS with ${[...gaps.map(k => `${k}(${arr(k).length})`), notOk.length ? `domain ok:false(${notOk.length})` : null, badTitles.length ? `titled_promises ok:false(${badTitles.length})` : null].filter(Boolean).join(', ')}`; }
    else if (r?.verdict === 'FAIL' && !arr('route_back').length) { st = 'FAIL'; ev = 'verdict FAIL without a routable route_back[] entry'; }
    else if (r?.verdict === 'HOLD' && !arr('blocking_findings').length && !arr('required_checks_not_run').length) { st = 'FAIL'; ev = 'verdict HOLD without a blocking finding or unrun required check stating the blocker'; }
    else ev = `verdict ${r?.verdict} consistent with ${gaps.length} non-empty gap list(s)`;
    out.push(check(`${P}.VERDICT_CONSISTENCY`, st, ev));
  }

  // REQUIRED_CHECKS_RUN — completion independently joins accepted KG -> cards/merges -> items.
  // 06 structural acceptance remains distinct; no freeform gap/disposition can waive this join.
  {
    const n = arr('required_checks_not_run');
    const bad = r?.verdict === 'PASS' && n.length;
    const coverage = completionCoverage(context, r?.input_hashes);
    const evidence = [bad ? `verdict PASS but required_checks_not_run: ${head(n)}` : n.length ? `${n.length} required check(s) not run, verdict ${r?.verdict} (not PASS)` : 'no required check left unrun'];
    if (coverage.errors.length) evidence.push(head(coverage.errors));
    if (coverage.missing.length) evidence.push(`completion coverage unverified: ${head(coverage.missing)} absent`);
    if (coverage.gaps.length) evidence.push(`completion coverage missing: ${head(coverage.gaps.map(g => `${g.node_id}:${g.missing}`))}; no schema-supported assessment-gap waiver`);
    if (coverage.status === 'PASS') evidence.push(`${coverage.metrics.required_nodes} required served/high-yield node(s) have card and assessment coverage, including merged nodes`);
    out.push(check(`${P}.REQUIRED_CHECKS_RUN`, bad || coverage.status === 'FAIL' ? 'FAIL' : coverage.status, evidence.join(' | '), coverage.metrics));
  }

  // ROUTE_COVERAGE — every blocking finding's owner appears in route_back; gaps imply a route.
  {
    const routed = new Set(arr('route_back').map(g => g.to_worker));
    const unrouted = arr('blocking_findings').filter(f => !routed.has(f.route_to)).map(f => `${f.finding_id}->${f.route_to}`);
    const gapLists = ['missing_high_yield', 'dropped_facts', 'practice_form_drift', 'voice_gaps', 'curriculum_unit_gaps', 'media_gaps', 'cross_product_refs', 'sme_dod_unsatisfied'].filter(k => arr(k).length);
    const bad = [];
    if (unrouted.length) bad.push(`blocking finding owner(s) missing from route_back: ${head(unrouted)}`);
    if (gapLists.length && !routed.size) bad.push(`gap list(s) ${gapLists.join(',')} with empty route_back`);
    out.push(check(`${P}.ROUTE_COVERAGE`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `route_back targets ${[...routed].join(',') || 'none'} cover every finding (adapter route enum includes 02/13/15/08/00)`));
  }

  // DOMAIN_WEIGHTS — checked => verified official weight from exam_facts_view + correct drift arithmetic;
  // not_applicable => weight and drift null (no fabricated number).
  {
    const bad = [];
    let needView = false;
    const view = context.exam_facts_view?.domain_weights ?? null;
    for (const d of arr('domain_coverage')) {
      if (d.weight_check === 'not_applicable') {
        if (d.weight_pct != null || d.weighting_drift != null) bad.push(`${d.domain}: weight_check not_applicable but weight_pct/weighting_drift non-null (fabricated number)`);
        if (d.ok === true && !(d.content_share > 0)) bad.push(`${d.domain}: ok with zero content share`);
      } else {
        needView = true;
        if (d.weight_pct == null || d.weighting_drift == null) { bad.push(`${d.domain}: weight_check checked with null weight/drift`); continue; }
        const drift = Math.abs(d.content_share - d.weight_pct);
        if (Math.abs(drift - d.weighting_drift) > 0.011) bad.push(`${d.domain}: weighting_drift ${d.weighting_drift} != |${d.content_share}-${d.weight_pct}|=${drift.toFixed(2)}`);
        const okWant = drift <= 5 && d.content_share > 0;
        if (d.ok !== okWant) bad.push(`${d.domain}: ok=${d.ok} but drift ${drift.toFixed(2)} => ${okWant}`);
        if (view) {
          const w = view[d.domain];
          if (!w || w.status !== 'verified' || w.value == null) bad.push(`${d.domain}: weight ${d.weight_pct} checked but official weight is ${w ? w.status : 'absent'} in exam_facts_view`);
          else if (Math.abs(w.value - d.weight_pct) > 0.0001) bad.push(`${d.domain}: weight ${d.weight_pct} != verified ${w.value}`);
        }
      }
    }
    const st = bad.length ? 'FAIL' : needView && !view ? 'HOLD' : 'PASS';
    out.push(check(`${P}.DOMAIN_WEIGHTS`, st, bad.length ? head(bad) : st === 'HOLD' ? 'weights marked checked but context.exam_facts_view.domain_weights absent — official weights unverified' : `${arr('domain_coverage').length} domain row(s): ${arr('domain_coverage').filter(d => d.weight_check === 'checked').length} checked vs verified weights, ${arr('domain_coverage').filter(d => d.weight_check === 'not_applicable').length} not_applicable with null weights`));
  }

  // PRACTICE_FORM_DRIFT — independent recompute from the accepted 06 bank (context.exambank); the report must
  // list every count/overlap-disclosure drift it implies and cannot PASS over one.
  {
    const bank = context.exambank;
    if (!bank || !Array.isArray(bank.practice_forms)) out.push(check(`${P}.PRACTICE_FORM_DRIFT`, 'HOLD', 'context.exambank (accepted 06 artifact) absent — form counts/overlap not recomputed; 06 totals are never trusted'));
    else {
      const found = [];
      const forms = bank.practice_forms;
      for (const f of forms) if ((f.item_ids ?? []).length !== f.declared_count) found.push({ form_id: f.form_id, issue: 'count' });
      for (let i = 0; i < forms.length; i++) for (let j = i + 1; j < forms.length; j++) {
        const s = new Set(forms[i].item_ids ?? []);
        const shared = (forms[j].item_ids ?? []).filter(x => s.has(x)).length;
        const ratio = shared / (Math.min((forms[i].item_ids ?? []).length, (forms[j].item_ids ?? []).length) || 1);
        if (ratio > 0.2) for (const F of [forms[i], forms[j]]) if (!String(F.overlap_note ?? '').trim()) found.push({ form_id: F.form_id, issue: 'overlap_disclosure' });
      }
      const listed = new Set(arr('practice_form_drift').map(d => `${d.form_id}|${d.issue}`));
      const missed = found.filter(f => !listed.has(`${f.form_id}|${f.issue}`)).map(f => `${f.form_id}:${f.issue}`);
      const bad = [];
      if (missed.length) bad.push(`recompute found drift the report omits: ${head([...new Set(missed)])}`);
      if (r?.verdict === 'PASS' && found.length) bad.push(`verdict PASS over ${found.length} recomputed drift(s)`);
      out.push(check(`${P}.PRACTICE_FORM_DRIFT`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `recomputed ${forms.length} forms: ${found.length} drift(s), all listed`, { recomputed_drift: found.length }));
    }
  }

  // TITLED_PROMISE — Order Q rule 15 against context.titled_surfaces [{surface_id,title,actual_count}].
  {
    const surfaces = context.titled_surfaces;
    if (!Array.isArray(surfaces)) out.push(check(`${P}.TITLED_PROMISE`, 'HOLD', 'context.titled_surfaces absent — titled promises not machine-verified'));
    else {
      const rows = new Map(arr('titled_promises').map(t => [t.surface_id, t]));
      const bad = [];
      let mismatches = 0;
      for (const s of surfaces) {
        const promised = promisedCount(s.title);
        const ok = promised == null || promised === s.actual_count;
        if (!ok) mismatches++;
        const row = rows.get(s.surface_id);
        if (!row) { if (!ok) bad.push(`${s.surface_id} "${s.title}" promises ${promised}, has ${s.actual_count}; not reported`); continue; }
        if (row.ok !== ok) bad.push(`${s.surface_id}: report ok=${row.ok} but recompute ${promised}/${s.actual_count} => ${ok}`);
        if (row.promised_count !== promised || row.actual_count !== s.actual_count) bad.push(`${s.surface_id}: report counts ${row.promised_count}/${row.actual_count} != recomputed ${promised}/${s.actual_count}`);
      }
      if (r?.verdict === 'PASS' && mismatches) bad.push(`verdict PASS over ${mismatches} broken titled promise(s)`);
      out.push(check(`${P}.TITLED_PROMISE`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `${surfaces.length} titled surface(s) recomputed; ${mismatches} broken promise(s), all reported`, { surfaces: surfaces.length, broken: mismatches }));
    }
  }

  // MEDIA_DISPOSITION — ref/sha + non_applicable_checks must echo the pinned early media-disposition artifact.
  {
    const md = context.media_disposition;
    const m = r?.media ?? {};
    if (!md || !md.document) out.push(check(`${P}.MEDIA_DISPOSITION`, 'HOLD', 'context.media_disposition {path,sha256,document} absent — non-applicability unbound'));
    else {
      const bad = [];
      if (!isHex64(m.media_disposition_sha256)) bad.push('media_disposition_sha256 not 64 hex');
      if (m.media_disposition_ref !== md.path) bad.push(`media_disposition_ref ${m.media_disposition_ref} != ${md.path}`);
      if (m.media_disposition_sha256 !== md.sha256) bad.push(`media_disposition_sha256 ${String(m.media_disposition_sha256).slice(0, 12)}… != pinned ${String(md.sha256).slice(0, 12)}…`);
      const want = new Map((md.document.non_applicable_checks ?? []).map(n => [n.check, n.reason]));
      const got = new Map((m.non_applicable_checks ?? []).map(n => [n.check, n.reason]));
      const extra = [...got.keys()].filter(k => !want.has(k));
      const missing = [...want.keys()].filter(k => !got.has(k));
      const reasonDiff = [...got].filter(([k, v]) => want.has(k) && want.get(k) !== v).map(([k]) => k);
      if (extra.length) bad.push(`non-applicable checks not in disposition: ${extra.join('; ')}`);
      if (missing.length) bad.push(`disposition checks not echoed: ${missing.join('; ')}`);
      if (reasonDiff.length) bad.push(`reason differs for: ${reasonDiff.join('; ')}`);
      if (r?.source_refs?.image_scout_plan === SENTINEL && md.document.image_cards_enabled !== false) bad.push('image_scout_plan sentinel while disposition enables image cards');
      out.push(check(`${P}.MEDIA_DISPOSITION`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `media disposition ${md.path}@${md.sha256.slice(0, 12)}… echoed with ${want.size} non-applicable checks`));
    }
  }

  // EARLY_MEDIA_INTENT — required-media flags come from the EARLY intent bound before 07, never a late 09 UISpec.
  {
    const ref = r?.media?.early_media_intent_ref ?? null;
    const want = context.early_media_intent;
    let st, ev;
    if (ref && /09-?ui-?spec|uispec/i.test(ref)) { st = 'FAIL'; ev = `early_media_intent_ref ${ref} is a late UISpec — cannot retroactively supply 07 media policy`; }
    else if (!ref) { st = 'HOLD'; ev = 'early_media_intent_ref null — required-media policy unbound'; }
    else if (!want?.ref) { st = 'HOLD'; ev = `early_media_intent_ref ${ref} cited but context.early_media_intent absent`; }
    else if (want.ref !== ref) { st = 'FAIL'; ev = `early_media_intent_ref ${ref} != bound ${want.ref}`; }
    else if (r?.input_hashes?.early_media_intent == null || (want.sha256 && r.input_hashes.early_media_intent !== want.sha256)) { st = 'FAIL'; ev = 'early media intent hash missing from input_hashes or differs from bound sha256'; }
    else { st = 'PASS'; ev = `early media intent ${ref} bound before 07`; }
    out.push(check(`${P}.EARLY_MEDIA_INTENT`, st, ev));
  }

  // PROVIDER_SCOPE — two-provider rule: the report states its provider family and assigned scope as dispatched.
  {
    const asg = context.audit_assignment;
    const fam = providerFamily(r?.provider_family);
    if (!fam) out.push(check(`${P}.PROVIDER_SCOPE`, 'FAIL', `provider_family ${JSON.stringify(r?.provider_family)} unresolvable`));
    else if (!asg) out.push(check(`${P}.PROVIDER_SCOPE`, 'HOLD', 'context.audit_assignment absent — provider/scope dispatch not verified'));
    else {
      const bad = [];
      if (providerFamily(asg.provider_family) !== fam) bad.push(`provider_family ${fam} != assigned ${asg.provider_family}`);
      if (asg.assigned_scope !== r.assigned_scope) bad.push(`assigned_scope ${r.assigned_scope} != dispatched ${asg.assigned_scope}`);
      out.push(check(`${P}.PROVIDER_SCOPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `report ${fam}/${r.assigned_scope} matches assignment`));
    }
  }

  // INDEPENDENCE — provider family absent from candidate + prompt lineage (delegated evaluator).
  out.push(independenceCheck(P, { provider_family: r?.provider_family }, context, { familyOnly: true }));

  out.push(verdictGateCheck(P, r?.verdict));
  return out;
}
