// Shared deterministic helpers for the 06/07/08 compensating checks (Claude lane, v0.4.0).
// Pure: no network, no writes, no clock. Independence evaluation is DELEGATED to Sol's
// tools/check-audit-independence.mjs (evaluateAuditIndependence / providerFamily) — not re-implemented.
import { evaluateAuditIndependence, providerFamily } from '../../check-audit-independence.mjs';
import { sha256Canonical } from './hash.mjs';

export const HEX64 = /^[a-f0-9]{64}$/;
export const isHex64 = (s) => typeof s === 'string' && HEX64.test(s);
export const PROBE_SLUG = /^[a-z0-9][a-z0-9-]*$/;

export const check = (check_id, status, evidence, metrics) => (metrics ? { check_id, status, evidence, metrics } : { check_id, status, evidence });
export const worst = (statuses) => (statuses.includes('FAIL') ? 'FAIL' : statuses.includes('HOLD') ? 'HOLD' : 'PASS');
export const head = (arr, n = 8) => (arr.length > n ? `${arr.slice(0, n).join('; ')}; …(+${arr.length - n} more)` : arr.join('; '));

// ---- candidate binding (07/08) -------------------------------------------------------------
// context.candidate_manifest = the hashed manifest BODY {members:[{role?,path?,sha256}], ...}; it never
// contains its own digest (hash-boundary correction). Expected candidate digest =
// context.candidate_manifest_sha256 when the dispatcher supplies the file-byte digest, else
// sha256(canonicalJson(candidate_manifest)).
export function expectedCandidateSha(context) {
  if (!context?.candidate_manifest) return null;
  if (isHex64(context.candidate_manifest_sha256)) return context.candidate_manifest_sha256;
  return sha256Canonical(context.candidate_manifest);
}

export function candidateEchoCheck(prefix, report, context) {
  const id = `${prefix}.CANDIDATE_ECHO`;
  if (!isHex64(report.candidate_sha256)) return check(id, 'FAIL', `candidate_sha256 is not 64 lowercase hex: ${JSON.stringify(report.candidate_sha256)}`);
  const expected = expectedCandidateSha(context);
  if (!expected) return check(id, 'HOLD', 'context.candidate_manifest absent — candidate echo cannot be verified (no guess)');
  return report.candidate_sha256 === expected
    ? check(id, 'PASS', `candidate_sha256 ${report.candidate_sha256} equals the scoped candidate manifest digest`)
    : check(id, 'FAIL', `candidate_sha256 ${report.candidate_sha256} != scoped candidate manifest digest ${expected} (report audits a different revision)`);
}

// input_hashes is a fixed-key object (strict mode forbids open maps). Every non-null value must be
// 64-hex and a member hash of the candidate manifest; `requiredKeys` must be non-null.
export function inputMembershipCheck(prefix, inputHashes, context, requiredKeys) {
  const id = `${prefix}.INPUT_MEMBERSHIP`;
  const entries = Object.entries(inputHashes ?? {});
  const malformed = entries.filter(([, v]) => v !== null && !isHex64(v)).map(([k, v]) => `${k}=${JSON.stringify(v)}`);
  const missingRequired = requiredKeys.filter(k => inputHashes?.[k] == null);
  const pre = [];
  if (malformed.length) pre.push(`malformed hash(es): ${malformed.join(', ')}`);
  if (missingRequired.length) pre.push(`required input hash(es) null: ${missingRequired.join(', ')}`);
  if (pre.length) return check(id, 'FAIL', pre.join(' | '), { malformed: malformed.length, missing_required: missingRequired.length });
  const members = context?.candidate_manifest?.members;
  if (!Array.isArray(members)) return check(id, 'HOLD', 'context.candidate_manifest.members absent — input membership cannot be verified');
  const set = new Set(members.map(m => m?.sha256));
  const bound = entries.filter(([, v]) => v !== null);
  const outside = bound.filter(([, v]) => !set.has(v)).map(([k, v]) => `${k}=${v.slice(0, 12)}…`);
  return outside.length
    ? check(id, 'FAIL', `${outside.length}/${bound.length} bound input hash(es) are not members of the scoped candidate manifest: ${outside.join(', ')}`, { bound: bound.length, outside: outside.length })
    : check(id, 'PASS', `${bound.length}/${bound.length} bound input hashes are candidate-manifest members (${members.length} members)`, { bound: bound.length, outside: 0 });
}

// ---- independence (07/08) ------------------------------------------------------------------
// context.intervention_lineage = {lineage_complete:boolean, actors:[{actor_id, provider_family, session_id,
// artifact_sha256, contribution_kind}]} — the actor shape check-audit-independence.mjs consumes.
// context.prompt_authorship (optional) = the contracts/prompt-authorship.json document; its entries are
// folded in as authoring_prompt contributors. context.auditor_qualification (optional) =
// {status:"qualified"|...} for this auditor/scope.
const CONFLICT = new Set(['provider_family_contributed_to_candidate_or_prompt', 'actor_contributed_to_candidate_or_prompt', 'session_contributed_to_candidate_or_prompt']);
export function independenceCheck(prefix, auditor, context, { familyOnly = false } = {}) {
  const id = `${prefix}.INDEPENDENCE`;
  const lineage = context?.intervention_lineage;
  if (!lineage || !Array.isArray(lineage.actors)) return check(id, 'HOLD', 'context.intervention_lineage absent — independence cannot be established; an auditor self-attestation is not evidence');
  const actors = [...lineage.actors];
  for (const e of context?.prompt_authorship?.entries ?? []) actors.push({ actor_id: e.actor_id, provider_family: e.provider_family, session_id: e.session_id, artifact_sha256: e.sha256, contribution_kind: 'authoring_prompt' });
  const aud = familyOnly
    ? { provider_family: auditor.provider_family, actor_id: null, session_id: null, model: 'n/a-family-scope', qualification_status: 'qualified' }
    : { ...auditor, qualification_status: context?.auditor_qualification?.status ?? null };
  const res = evaluateAuditIndependence({ actors, auditors: [aud], lineageComplete: lineage.lineage_complete === true, requiredProviderFamilies: 1 });
  const ev = res.evaluations[0];
  const reasons = familyOnly ? ev.reasons.filter(r => r !== 'auditor_actor_or_session_unresolved') : ev.reasons;
  const conflicts = reasons.filter(r => CONFLICT.has(r));
  const other = reasons.filter(r => !CONFLICT.has(r));
  const fam = providerFamily(auditor.provider_family);
  const who = ev.conflicting_contributors.map(c => `${c.actor_id}/${c.provider_family}/${c.contribution_kind}`);
  const metrics = { auditor_family: fam, contributors: actors.length, conflicts: conflicts.length };
  if (conflicts.length) return check(id, 'FAIL', `auditor (${auditor.actor_id ?? '-'}, ${fam}) not independent: ${conflicts.join(', ')}; conflicting contributors: ${head([...new Set(who)], 6)}`, metrics);
  if (other.length) return check(id, 'HOLD', `independence unresolved: ${other.join(', ')}`, metrics);
  return check(id, 'PASS', `auditor family ${fam}${familyOnly ? '' : `, actor ${auditor.actor_id}, session ${auditor.session_id}`} absent from ${actors.length} candidate/prompt contributors (delegated to tools/check-audit-independence.mjs)`, metrics);
}

// ---- verdict gate (07/08) ------------------------------------------------------------------
// The post-validator status of a QA report is the acceptance status: a report whose own verdict is FAIL
// or HOLD can never yield PASS, however well-formed it is.
export function verdictGateCheck(prefix, verdict) {
  const id = `${prefix}.VERDICT_GATE`;
  if (verdict === 'PASS') return check(id, 'PASS', 'report verdict PASS (acceptance still requires every other check PASS)');
  if (verdict === 'HOLD') return check(id, 'HOLD', 'report verdict HOLD — acceptance pending the report\'s own blocking condition');
  return check(id, 'FAIL', `report verdict ${JSON.stringify(verdict)} — not accepted`);
}

// ---- numerals --------------------------------------------------------------------------------
// Digit-run tokens ("1800s" -> "1800", "3,000" -> "3000", "12.5" -> "12.5"). Spelled-out numbers are not
// detected (recorded as an unexecuted limitation in the mappings).
export function numerals(text) {
  if (typeof text !== 'string') return [];
  return (text.match(/\d+(?:[.,]\d+)*/g) ?? []).map(t => t.replace(/,(?=\d{3}\b)/g, ''));
}

// Non-empty string helper for restored minLength:1 rules. `pairs` = [[pointer, value], ...]
export function emptyStrings(pairs) {
  return pairs.filter(([, v]) => typeof v !== 'string' || v.trim().length === 0).map(([p]) => p);
}
