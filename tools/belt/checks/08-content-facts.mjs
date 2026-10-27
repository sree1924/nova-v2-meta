// Compensating checks for schemas-strict/08-fact-report.schema.json (stage 08.content_facts).
// Restores the parent allOf (verdict PASS => no visual/grouped-unit claim issues), dropped bounds, and the
// overlay/handoff invariants: candidate echo + input membership, tier-first, dated source liveness per
// contracts/source-liveness-receipt.schema.json + contracts/source-fact-policy.json freshness, auditor
// independence (delegated to tools/check-audit-independence.mjs), dissent not outvoted, no PASS with unrun
// checks. Acceptance status = 08.VERDICT_GATE + every check. Pure: no network, no writes, NO CLOCK — receipt
// age is measured against context.now_utc only (HOLD when absent).
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, head, isHex64, PROBE_SLUG, emptyStrings, candidateEchoCheck, inputMembershipCheck, independenceCheck, verdictGateCheck } from '../lib/qa-common.mjs';

export const stage_id = '08.content_facts';
const P = '08';
export const CHECK_IDS = ['ENVELOPE', 'CANDIDATE_ECHO', 'INPUT_MEMBERSHIP', 'ROW_FIELDS', 'VERDICT_INVARIANT', 'VERDICT_CONSISTENCY', 'REQUIRED_CHECKS_RUN', 'TIER_FIRST', 'LIVENESS_RECEIPT_SHAPE', 'LIVENESS_COVERAGE', 'LIVENESS_AGE', 'FLAGGED_BINDING', 'EXTERNAL_REVIEW', 'INDEPENDENCE', 'DISSENT_NOT_OUTVOTED', 'VERDICT_GATE'].map(c => `${P}.${c}`);
export const REQUIRED_INPUTS = ['blueprint', 'carddeck', 'voice_scripts', 'session_scripts', 'exambank', 'source_registry', 'source_liveness'];
const SENTINEL = 'deferred:not_applicable_pilot';
const AUTO_PASS_TIERS = new Set(['official', 'regulator', 'exam_owner', 'standards_body']);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
export const RECEIPT_SCHEMA_PATH = 'contracts/source-liveness-receipt.schema.json';
const ajv = new Ajv2020({ strict: false, allErrors: true });
addFormats(ajv);
const validateReceipt = ajv.compile(JSON.parse(readFileSync(join(LANE, RECEIPT_SCHEMA_PATH), 'utf8')));

const ms = (s) => { const t = Date.parse(s); return Number.isFinite(t) ? t : null; }; // parses a supplied string; never reads the clock

export function run(r, context = {}) {
  const out = [];
  const arr = (k) => (Array.isArray(r?.[k]) ? r[k] : []);
  const passClaimed = r?.verdict === 'PASS';
  const blockOrHold = (cond) => (cond ? (passClaimed ? 'FAIL' : 'HOLD') : 'PASS');

  // ENVELOPE
  {
    const bad = [];
    if (!PROBE_SLUG.test(r?.probe ?? '')) bad.push(`probe ${JSON.stringify(r?.probe)} violates ^[a-z0-9][a-z0-9-]*$`);
    const sr = r?.source_refs ?? {};
    const e = emptyStrings([['/minted_by/model', r?.minted_by?.model], ['/minted_by/lane', r?.minted_by?.lane], ['/minted_by/pass', r?.minted_by?.pass], ['/assigned_scope', r?.assigned_scope], ...Object.entries(sr).map(([k, v]) => [`/source_refs/${k}`, v])]);
    if (e.length) bad.push(`empty: ${e.join(', ')}`);
    const misuse = Object.entries(sr).filter(([k, v]) => v === SENTINEL && !['image_scout_plan', 'curriculum_unit_map'].includes(k)).map(([k]) => k);
    if (misuse.length) bad.push(`sentinel not allowed for source_refs.${misuse.join(',')} (parent-required inputs)`);
    out.push(check(`${P}.ENVELOPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : 'probe slug, stamp, scope and source_refs valid'));
  }

  out.push(candidateEchoCheck(P, r ?? {}, context));
  out.push(inputMembershipCheck(P, r?.input_hashes, context, REQUIRED_INPUTS));

  // ROW_FIELDS — restored minLength:1 on row strings (parent flagged/visual/grouped/debt/ERR fields).
  {
    const pairs = [
      ...arr('claim_tiers').flatMap((c, i) => [[`/claim_tiers/${i}/claim_id`, c.claim_id], [`/claim_tiers/${i}/item_ref`, c.item_ref], [`/claim_tiers/${i}/source_ref`, c.source_ref]]),
      ...arr('flagged').flatMap((f, i) => [[`/flagged/${i}/check_id`, f.check_id], [`/flagged/${i}/item_id`, f.item_id], [`/flagged/${i}/issue`, f.issue], [`/flagged/${i}/evidence`, f.evidence]]),
      ...arr('source_supported_blocking_findings').flatMap((f, i) => [[`/source_supported_blocking_findings/${i}/finding_id`, f.finding_id], [`/source_supported_blocking_findings/${i}/source_ref`, f.source_ref], [`/source_supported_blocking_findings/${i}/source_page`, f.source_page], [`/source_supported_blocking_findings/${i}/evidence`, f.evidence]]),
      ...arr('unsourced').flatMap((u, i) => [[`/unsourced/${i}/claim_id`, u.claim_id], [`/unsourced/${i}/text`, u.text]]),
      ...arr('visual_claim_issues').map((v, i) => [`/visual_claim_issues/${i}/media_slot_id`, v.media_slot_id]),
      ...arr('grouped_unit_claim_issues').map((g, i) => [`/grouped_unit_claim_issues/${i}/unit_id`, g.unit_id]),
      ...arr('verification_debt').flatMap((d, i) => [[`/verification_debt/${i}/claim_id`, d.claim_id], [`/verification_debt/${i}/blocker_kind`, d.blocker_kind]]),
      ...arr('external_review_requests').flatMap((x, i) => [[`/external_review_requests/${i}/request_id`, x.request_id], [`/external_review_requests/${i}/why_human_required`, x.why_human_required]]),
      ...arr('checks_run').flatMap((c, i) => [[`/checks_run/${i}/check_id`, c.check_id], [`/checks_run/${i}/evidence`, c.evidence]]),
      ...arr('required_checks_not_run').map((c, i) => [`/required_checks_not_run/${i}`, c]),
    ];
    const bad = emptyStrings(pairs).map(p => `empty ${p}`);
    const noFacts = arr('claim_tiers').filter(c => !Array.isArray(c.fact_ids) || !c.fact_ids.length).map(c => c.claim_id);
    if (noFacts.length) bad.push(`claim(s) without fact_ids: ${head(noFacts)}`);
    out.push(check(`${P}.ROW_FIELDS`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `all ${pairs.length} row strings non-empty; every claim binds fact_ids`));
  }

  // VERDICT_INVARIANT — parent allOf.
  {
    const nonEmpty = ['visual_claim_issues', 'grouped_unit_claim_issues'].filter(k => arr(k).length);
    const bad = passClaimed && nonEmpty.length;
    out.push(check(`${P}.VERDICT_INVARIANT`, bad ? 'FAIL' : 'PASS', bad ? `verdict PASS with non-empty ${nonEmpty.join(', ')} (parent allOf)` : `parent allOf holds (verdict ${r?.verdict}; visual/grouped issues ${arr('visual_claim_issues').length}/${arr('grouped_unit_claim_issues').length})`));
  }

  // VERDICT_CONSISTENCY — PASS => no major/blocking flag, no unsourced, no ship-blocking debt, publish_blocked false,
  // no blocking external review, no failed/held executed check; FAIL/HOLD must state why.
  {
    const hi = arr('flagged').filter(f => f.severity === 'major' || f.severity === 'blocking').map(f => f.item_id);
    const shipDebt = arr('verification_debt').filter(d => d.ship_blocking).map(d => d.claim_id);
    const badRuns = arr('checks_run').filter(c => c.status !== 'PASS').map(c => `${c.check_id}:${c.status}`);
    const p = [];
    if (passClaimed) {
      if (hi.length) p.push(`${hi.length} high/blocking flagged item(s): ${head(hi)}`);
      if (arr('unsourced').length) p.push(`${arr('unsourced').length} unsourced claim(s)`);
      if (shipDebt.length) p.push(`ship-blocking debt: ${head(shipDebt)}`);
      if (r.publish_blocked) p.push('publish_blocked true');
      if (arr('external_review_requests').length) p.push(`${arr('external_review_requests').length} blocking external review request(s)`);
      if (badRuns.length) p.push(`executed check(s) not PASS: ${head(badRuns)}`);
    } else if (r?.verdict === 'FAIL' && !arr('flagged').length && !arr('unsourced').length && !arr('visual_claim_issues').length && !arr('grouped_unit_claim_issues').length) p.push('verdict FAIL with no flagged/unsourced/visual/grouped finding');
    else if (r?.verdict === 'HOLD' && !arr('verification_debt').length && !arr('required_checks_not_run').length && !badRuns.length && !arr('external_review_requests').length) p.push('verdict HOLD without debt, unrun check, held check or review request stating the blocker');
    out.push(check(`${P}.VERDICT_CONSISTENCY`, p.length ? 'FAIL' : 'PASS', p.length ? `verdict ${r?.verdict}: ${p.join(' | ')}` : `verdict ${r?.verdict} consistent with findings (${arr('flagged').length} flagged, ${arr('verification_debt').length} debt)`));
  }

  // REQUIRED_CHECKS_RUN — PASS requires every required check executed (sampled scope is reported, not hidden).
  {
    const n = arr('required_checks_not_run');
    const sampled = arr('checks_run').filter(c => c.scope === 'sampled').map(c => c.check_id);
    const bad = passClaimed && n.length;
    out.push(check(`${P}.REQUIRED_CHECKS_RUN`, bad ? 'FAIL' : 'PASS', bad ? `verdict PASS but required_checks_not_run: ${head(n)}` : `${n.length} unrun required check(s) (verdict ${r?.verdict}); ${sampled.length} sampled-scope check(s)${sampled.length ? `: ${head(sampled)}` : ''}`, { sampled_checks: sampled.length }));
  }

  // TIER_FIRST — every claim's tier is resolved first; reputable/unverified never auto-pass (must be debt or flagged).
  {
    const claims = arr('claim_tiers');
    const debtIds = new Set(arr('verification_debt').map(d => d.claim_id));
    const flaggedIds = new Set(arr('flagged').map(f => f.item_id));
    const weak = claims.filter(c => !AUTO_PASS_TIERS.has(c.tier));
    const silent = weak.filter(c => !debtIds.has(c.claim_id) && !flaggedIds.has(c.claim_id) && !flaggedIds.has(c.item_ref)).map(c => `${c.claim_id}(${c.tier})`);
    const bad = [];
    if (r?.tier_resolution_first !== true) bad.push('tier_resolution_first is not true');
    if (!claims.length) bad.push('no claim_tiers rows: tier resolution not evidenced');
    if (silent.length) bad.push(`${silent.length} claim(s) on insufficient tier with no debt/flag: ${head(silent)}`);
    out.push(check(`${P}.TIER_FIRST`, bad.length ? 'FAIL' : 'PASS', bad.length ? bad.join(' | ') : `${claims.length} claim tier(s) resolved; ${weak.length} insufficient-tier claim(s) carried as debt/flag`, { claims: claims.length, insufficient_tier: weak.length }));
  }

  const receipts = arr('source_liveness');
  // LIVENESS_RECEIPT_SHAPE — each receipt validated against the contract schema (restores its pattern/format/allOf).
  {
    const bad = [];
    receipts.forEach((x, i) => { if (!validateReceipt(x)) bad.push(`[${i}] ${x.source_ref}: ${validateReceipt.errors.slice(0, 3).map(e => `${e.instancePath || '/'} ${e.message}`).join(', ')}`); });
    out.push(check(`${P}.LIVENESS_RECEIPT_SHAPE`, bad.length ? 'FAIL' : 'PASS', bad.length ? `${bad.length}/${receipts.length} receipt(s) violate ${RECEIPT_SCHEMA_PATH}: ${head(bad, 5)}` : `${receipts.length} receipt(s) conform to ${RECEIPT_SCHEMA_PATH}`));
  }

  // LIVENESS_COVERAGE — every cited source has a PASS receipt with a dated effective_date and issuer current-edition
  // confirmation; unknown effective date without accepted disposition => HOLD (source-fact-policy), FAIL if PASS claimed.
  {
    const cited = [...new Set(arr('claim_tiers').map(c => c.source_ref))];
    const bySrc = new Map(receipts.map(x => [x.source_ref, x]));
    const accepted = new Set((context.accepted_dispositions ?? []).filter(d => d.kind === 'effective_date_not_applicable').map(d => d.source_ref));
    const missing = cited.filter(s => !bySrc.has(s));
    const undated = cited.filter(s => bySrc.has(s) && !accepted.has(s) && !DATE.test(bySrc.get(s).effective_date ?? ''));
    const unconfirmed = cited.filter(s => bySrc.has(s) && (!bySrc.get(s).issuer_current_edition_ref || !isHex64(bySrc.get(s).issuer_current_edition_sha256)));
    // S4 (2026-10-27): CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT is accepted ONLY with exact proof — null effective_date,
    // a hex64 issuer current-edition pin, a disposition ref bound to that same pin, and an accepted
    // effective_date_not_applicable disposition for the same source. Generic VERIFICATION_DEBT never passes.
    const narrowlyAccepted = (r) => r.status === 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT' && r.effective_date === null
      && accepted.has(r.source_ref) && typeof r.issuer_current_edition_ref === 'string' && r.issuer_current_edition_ref.length > 0
      && isHex64(r.issuer_current_edition_sha256) && r.effective_date_disposition_ref
      && r.effective_date_disposition_ref.path === r.issuer_current_edition_ref && r.effective_date_disposition_ref.sha256 === r.issuer_current_edition_sha256;
    const debt = cited.filter(s => bySrc.has(s) && bySrc.get(s).status !== 'PASS' && !narrowlyAccepted(bySrc.get(s)));
    const issues = [];
    if (missing.length) issues.push(`${missing.length} cited source(s) without receipt: ${head(missing, 5)}`);
    if (undated.length) issues.push(`${undated.length} with effective_date null/(verify)/undated: ${head(undated, 5)}`);
    if (unconfirmed.length) issues.push(`${unconfirmed.length} without issuer current-edition confirmation: ${head(unconfirmed, 5)}`);
    if (debt.length) issues.push(`${debt.length} receipt(s) in VERIFICATION_DEBT: ${head(debt, 5)}`);
    const st = blockOrHold(issues.length > 0);
    out.push(check(`${P}.LIVENESS_COVERAGE`, st, issues.length ? `${issues.join(' | ')}${passClaimed ? ' — verdict PASS not allowed' : ' — cannot PASS (policy: HOLD)'}` : `${cited.length} cited source(s) each carry a dated PASS receipt with current-edition confirmation`, { cited: cited.length, missing: missing.length, undated: undated.length }));
  }

  // LIVENESS_AGE — receipts at most max_receipt_age_hours (policy, default 24) old relative to context.now_utc.
  {
    const now = typeof context.now_utc === 'string' ? ms(context.now_utc) : null;
    const maxH = context.policy?.freshness?.max_receipt_age_hours ?? 24;
    if (now == null) out.push(check(`${P}.LIVENESS_AGE`, 'HOLD', 'context.now_utc absent — receipt age not measured (checks read no clock)'));
    else {
      const stale = [], future = [], unparsable = [];
      for (const x of receipts) {
        const t = ms(x.retrieved_at);
        if (t == null) unparsable.push(x.source_ref);
        else if (t > now) future.push(x.source_ref);
        else if ((now - t) / 3.6e6 > maxH) stale.push(`${x.source_ref} (${((now - t) / 3.6e6).toFixed(1)}h)`);
      }
      const issues = [];
      if (stale.length) issues.push(`${stale.length} receipt(s) older than ${maxH}h: ${head(stale, 5)}`);
      if (future.length) issues.push(`retrieved_at after now_utc: ${head(future, 5)}`);
      if (unparsable.length) issues.push(`unparsable retrieved_at: ${head(unparsable, 5)}`);
      const st = future.length || unparsable.length ? 'FAIL' : blockOrHold(stale.length > 0);
      out.push(check(`${P}.LIVENESS_AGE`, st, issues.length ? issues.join(' | ') : `${receipts.length} receipt(s) within ${maxH}h of now_utc ${context.now_utc}`, { stale: stale.length, max_age_hours: maxH }));
    }
  }

  // FLAGGED_BINDING — each finding binds a candidate member hash and names evidence/owner/route.
  {
    const bad = arr('flagged').filter(f => !isHex64(f.artifact_hash)).map(f => `${f.item_id}: artifact_hash not 64 hex`);
    const members = context.candidate_manifest?.members;
    let st = 'PASS', ev;
    if (bad.length) { st = 'FAIL'; ev = head(bad); }
    else if (arr('flagged').length && !Array.isArray(members)) { st = 'HOLD'; ev = `${arr('flagged').length} flagged finding(s) but context.candidate_manifest absent — artifact_hash membership unverified`; }
    else {
      const set = new Set((members ?? []).map(m => m.sha256));
      const outside = arr('flagged').filter(f => !set.has(f.artifact_hash)).map(f => f.item_id);
      const unbacked = arr('source_supported_blocking_findings').filter(s => !arr('flagged').some(f => f.item_id === s.flagged_item_id)).map(s => s.finding_id);
      const p = [];
      if (outside.length) p.push(`flagged artifact_hash outside candidate: ${head(outside)}`);
      if (unbacked.length) p.push(`source-supported finding(s) without a flagged row: ${head(unbacked)}`);
      st = p.length ? 'FAIL' : 'PASS';
      ev = p.length ? p.join(' | ') : `${arr('flagged').length} flagged finding(s) bound to candidate members`;
    }
    out.push(check(`${P}.FLAGGED_BINDING`, st, ev));
  }

  // EXTERNAL_REVIEW — only legally required review; claim_ids >= 1 (parent minItems) and a legal requirement ref.
  {
    const bad = [];
    for (const x of arr('external_review_requests')) {
      if (!Array.isArray(x.claim_ids) || x.claim_ids.length < 1) bad.push(`${x.request_id}: claim_ids empty`);
      if (!String(x.legal_requirement_ref ?? '').trim()) bad.push(`${x.request_id}: no legal_requirement_ref (merely risky facts never route to a human)`);
    }
    out.push(check(`${P}.EXTERNAL_REVIEW`, bad.length ? 'FAIL' : 'PASS', bad.length ? head(bad) : `${arr('external_review_requests').length} external review request(s), each legally justified with claim ids`));
  }

  // INDEPENDENCE — actor/session/provider family absent from candidate + prompt-template lineage.
  out.push(independenceCheck(P, r?.auditor ?? {}, context));

  // DISSENT_NOT_OUTVOTED — a source-supported blocking finding (own or any scoped peer on the same candidate) blocks.
  {
    const own = arr('source_supported_blocking_findings');
    const peers = (context.peer_reports ?? []).filter(p => p?.candidate_sha256 === r?.candidate_sha256);
    const peerHits = peers.filter(p => (p.source_supported_blocking_findings ?? []).length).map(p => `${p.auditor?.provider_family ?? 'peer'}:${p.source_supported_blocking_findings.length}`);
    const p = [];
    if (own.length && passClaimed) p.push(`verdict PASS despite ${own.length} own source-supported blocking finding(s)`);
    if (peerHits.length) p.push(`peer report(s) on the same candidate carry source-supported blocking findings (${peerHits.join(', ')}) — not outvotable`);
    out.push(check(`${P}.DISSENT_NOT_OUTVOTED`, p.length ? 'FAIL' : 'PASS', p.length ? p.join(' | ') : `no source-supported blocking finding overridden (${own.length} own, ${peers.length} peer report(s) inspected)`));
  }

  out.push(verdictGateCheck(P, r?.verdict));
  return out;
}
