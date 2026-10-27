import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Pure input preparation. No model, network, ledger, service or content generation.
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const hasDebt = value => typeof value === 'string' && /\(\s*verify\b|unverified|unknown|pending/i.test(value);
const nonempty = value => typeof value === 'string' && value.trim().length > 0 && !hasDebt(value);

export function normalizeOfficialFact(raw, legacyStatus, sourceRegistry = {sources: []}) {
  const wrapped = raw && typeof raw === 'object' && !Array.isArray(raw);
  const value = wrapped ? raw.value : raw;
  const status = wrapped ? raw.status : legacyStatus;
  const unknown = {value: null, status: 'unknown', source_page: null, source_ref: null,
    source_snapshot_sha256: null, liveness_receipt_ref: null};
  if (!wrapped || status !== 'verified' || hasDebt(value) || hasDebt(legacyStatus) || value == null) return unknown;
  if (!['number', 'string', 'boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) return unknown;
  if (!nonempty(raw.source_page) || !nonempty(raw.source_ref) || !sha(raw.source_snapshot_sha256) || !nonempty(raw.liveness_receipt_ref)) return unknown;
  const registered = (sourceRegistry.sources || []).find(source => source.ref === raw.source_ref
    && source.sha256 === raw.source_snapshot_sha256 && source.accepted === true
    && source.current === true && source.liveness_receipt_ref === raw.liveness_receipt_ref
    && Array.isArray(source.accepted_pages) && source.accepted_pages.includes(raw.source_page));
  if (!registered) return unknown;
  return {value, status: 'verified', source_page: raw.source_page, source_ref: raw.source_ref,
    source_snapshot_sha256: raw.source_snapshot_sha256, liveness_receipt_ref: raw.liveness_receipt_ref};
}

export function sanitizeModelInput(config, {sourceRegistry = {sources: []}, learningPolicy = null} = {}) {
  const selection = config.state_selection || {};
  const selected = selection.status === 'confirmed' && selection.confirmed_by === 'founder'
    && nonempty(selection.jurisdiction) && selection.jurisdiction === config.scope?.jurisdiction;
  const facts = config.scope?.exam_facts || {};
  const modelFacts = {};
  const debtFields = [];
  for (const [key, raw] of Object.entries(facts)) {
    if (key.endsWith('_status')) continue;
    modelFacts[key] = normalizeOfficialFact(raw, facts[key + '_status'], sourceRegistry);
    if (modelFacts[key].status !== 'verified') debtFields.push('scope.exam_facts.' + key);
  }
  const policyBound = learningPolicy?.kind === 'product_policy' && nonempty(learningPolicy.ref)
    && sha(learningPolicy.sha256) && learningPolicy.accepted === true
    && typeof learningPolicy.quiz_threshold_pct === 'number' && Number.isFinite(learningPolicy.quiz_threshold_pct)
    && learningPolicy.quiz_threshold_pct >= 0 && learningPolicy.quiz_threshold_pct <= 100;
  const productPolicy = policyBound
    ? {kind: 'product_policy', ref: learningPolicy.ref, sha256: learningPolicy.sha256,
      quiz_threshold_pct: learningPolicy.quiz_threshold_pct ?? null, is_official_exam_fact: false}
    : {kind: 'product_policy', ref: null, sha256: null, quiz_threshold_pct: null, is_official_exam_fact: false};
  const safeScope = {};
  for (const key of ['jurisdiction', 'issuing_authority', 'license_or_permit_class', 'audience_age_band', 'application_path', 'language', 'handbook_edition']) {
    const value = config.scope?.[key];
    safeScope[key] = selected && nonempty(value) ? value : null;
  }
  return {status: selected ? 'PRACTICE_ONLY_CONFIG' : 'HOLD',
    hold_reasons: selected ? [] : ['state_selection_pending'],
    model_input: {product: 'regular passenger-car written-test preparation', scope: safeScope,
      exam_facts: modelFacts, scoring_policy: productPolicy, official_mirror_claims_allowed: false},
    verification_debt_fields: debtFields,
    note: 'This safe view does not establish factual truth or authorize execution; independent source checks remain required.'};
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  const project = path.resolve(path.dirname(thisFile), '..');
  const argument = process.argv[2];
  if (!argument) {
    console.error('Usage: node tools/sanitize-model-input.mjs <project-local-config.json>');
    process.exitCode = 2;
  } else {
    const file = path.resolve(project, argument);
    const rel = path.relative(project, file);
    if (rel.startsWith('..') || path.isAbsolute(rel) || path.extname(file) !== '.json') {
      console.error('Expected a project-local JSON configuration path.');
      process.exitCode = 2;
    } else {
      try { console.log(JSON.stringify(sanitizeModelInput(JSON.parse(fs.readFileSync(file, 'utf8'))), null, 2)); }
      catch { console.error('Cannot read a valid JSON configuration.'); process.exitCode = 1; }
    }
  }
}
