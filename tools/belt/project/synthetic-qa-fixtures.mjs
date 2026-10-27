// Generator for the clearly SYNTHETIC 07.content_coverage / 08.content_facts interface fixtures (fictional
// "Examplia" candidate). Both reports audit ONE synthetic candidate manifest whose exambank member is the sha256 of
// tools/belt/fixtures/06.exam_bank/synthetic-pass.json. Real pinned bytes used: contracts/media-disposition.json,
// contracts/prompt-authorship.json. Never a DMV result.
// CLI: node tools/belt/project/synthetic-qa-fixtures.mjs --write
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const rep = (s) => s.repeat(32);

export function build() {
  const syn06Path = join(LANE, 'tools/belt/fixtures/06.exam_bank/synthetic-pass.json');
  const bank = JSON.parse(readFileSync(syn06Path, 'utf8')); delete bank._fixture;
  const exambankSha = sha256File(syn06Path);
  const H = { blueprint: rep('b1'), knowledge_graph: rep('c3'), carddeck: rep('c4'), session_scripts: rep('c5'), voice_scripts: rep('d5'), exambank: exambankSha, curriculum_unit_map: rep('a9'), learning_loop: rep('19'), early_media_intent: rep('ee'), source_registry: rep('f1'), source_liveness: rep('a1') };
  const candidate_manifest = { artifact_type: 'ContentCandidateManifest', synthetic: true, lineage_id: 'synthetic-lineage-07-08', members: Object.entries(H).map(([role, sha256]) => ({ role, path: `synthetic/${role}.json`, sha256 })) };
  const candidate_sha256 = sha256Canonical(candidate_manifest);
  const mdAbs = join(LANE, 'contracts/media-disposition.json');
  const md = { path: 'contracts/media-disposition.json', sha256: sha256File(mdAbs), document: JSON.parse(readFileSync(mdAbs, 'utf8')) };
  const prompt_authorship = JSON.parse(readFileSync(join(LANE, 'contracts/prompt-authorship.json'), 'utf8'));
  const lineage = { lineage_complete: true, actors: [{ actor_id: 'synthetic-meta-author', provider_family: 'meta', session_id: 'synthetic-session-author-1', artifact_sha256: exambankSha, contribution_kind: 'authored_candidate_artifact' }] };
  const files = {};

  // ---------------- 07 ----------------
  const c07 = 'tools/belt/fixtures/07.content_coverage/context-synthetic.json';
  const r07 = {
    _fixture: { kind: 'synthetic', note: 'Clearly SYNTHETIC 07 report over the fictional Examplia candidate. Never a DMV result.', context: c07, expected_status: 'PASS' },
    artifact_type: 'CoverageReport', adapter_version: '0.4.0', probe: 'synthetic-examplia',
    minted_by: { model: 'synthetic-fixture', lane: 'fixture', pass: 'synthetic' },
    candidate_sha256,
    input_hashes: { blueprint: H.blueprint, knowledge_graph: H.knowledge_graph, carddeck: H.carddeck, session_scripts: H.session_scripts, voice_scripts: H.voice_scripts, exambank: H.exambank, curriculum_unit_map: H.curriculum_unit_map, learning_loop: H.learning_loop, early_media_intent: H.early_media_intent, source_registry: H.source_registry },
    source_refs: { blueprint: 'synthetic/blueprint.json', knowledge_graph: 'synthetic/knowledge_graph.json', carddeck: 'synthetic/carddeck.json', session_scripts: 'synthetic/session_scripts.json', exambank: 'tools/belt/fixtures/06.exam_bank/synthetic-pass.json', curriculum_unit_map: 'synthetic/curriculum_unit_map.json', image_scout_plan: 'deferred:not_applicable_pilot' },
    coverage_matrix_ref: 'synthetic/07-coverage-matrix.json', coverage_basis: 'handbook_sections',
    provider_family: 'anthropic', assigned_scope: 'content_coverage:full_candidate', verdict: 'PASS',
    required_checks_not_run: [], blocking_findings: [],
    domain_coverage: [
      { domain: 'Permits', weight_check: 'not_applicable', weight_pct: null, content_share: 50, weighting_drift: null, ok: true },
      { domain: 'Parking', weight_check: 'not_applicable', weight_pct: null, content_share: 50, weighting_drift: null, ok: true },
    ],
    missing_high_yield: [], dropped_facts: [], practice_form_drift: [], voice_gaps: [], curriculum_unit_gaps: [],
    media: { media_disposition_ref: md.path, media_disposition_sha256: md.sha256, early_media_intent_ref: 'synthetic/early_media_intent.json', non_applicable_checks: md.document.non_applicable_checks.map(n => ({ check: n.check, reason: n.reason })) },
    media_gaps: [], pending_media: [], cross_product_refs: [], sme_dod_unsatisfied: [],
    titled_promises: [{ surface_id: 'deck.parking', title: 'Top 3 Parking Rules', promised_count: 3, actual_count: 3, ok: true }],
    route_back: [],
  };
  files[c07] = {
    _context: { kind: 'synthetic', note: 'Synthetic candidate/lineage/assignment context for the Examplia 07 fixtures.' },
    strip_fixture_meta: true, candidate_manifest, media_disposition: md,
    early_media_intent: { ref: 'synthetic/early_media_intent.json', sha256: H.early_media_intent },
    exambank: bank,
    titled_surfaces: [
      { surface_id: 'deck.parking', title: 'Top 3 Parking Rules', actual_count: 3 },
      ...bank.module_quizzes.map(q => ({ surface_id: q.quiz_id, title: q.title, actual_count: q.item_ids.length })),
      ...bank.practice_forms.map(f => ({ surface_id: f.form_id, title: f.title, actual_count: f.item_ids.length })),
    ],
    audit_assignment: { provider_family: 'anthropic', assigned_scope: 'content_coverage:full_candidate' },
    intervention_lineage: lineage, prompt_authorship,
  };
  files['tools/belt/fixtures/07.content_coverage/synthetic-pass.json'] = r07;
  const m07 = structuredClone(r07);
  m07._fixture = { kind: 'synthetic_negative', note: 'SYNTHETIC negative: candidate_sha256 names a different revision than the scoped candidate manifest.', context: c07, expected_status: 'FAIL', expected_failing_checks: ['07.CANDIDATE_ECHO'] };
  m07.candidate_sha256 = rep('de');
  files['tools/belt/fixtures/07.content_coverage/synthetic-neg-candidate-mismatch.json'] = m07;
  const q07 = structuredClone(r07);
  q07._fixture = { kind: 'synthetic_adapter_acceptance', note: 'SYNTHETIC: a FAIL report routing a gap to worker 02 (outside the parent route enum 03/04/05/06/19A/20A/09). The ADAPTER accepts it (07.SCHEMA PASS); the report verdict is FAIL so acceptance status is FAIL.', context: c07, expected_status: 'FAIL', expected_schema: 'PASS', expected_failing_checks: ['07.VERDICT_GATE'] };
  q07.verdict = 'FAIL';
  q07.blocking_findings = [{ finding_id: 'finding.syn.1', check_id: 'sme_dod_walk', issue: 'SME section-G box "uphill/downhill curb contrast" has no dossier source sentence', evidence: 'synthetic/02-dossier.json#/sections/G/4 has no fact_id; KG node n.parking.curb cites none', route_to: '02' }];
  q07.sme_dod_unsatisfied = [{ checklist_item: 'G.4 uphill/downhill curb contrast', evidence_missing: 'no source-bound dossier sentence' }];
  q07.route_back = [{ to_worker: '02', gap_ref: 'finding.syn.1' }];
  files['tools/belt/fixtures/07.content_coverage/synthetic-route-to-02.json'] = q07;

  // ---------------- 08 ----------------
  const c08 = 'tools/belt/fixtures/08.content_facts/context-synthetic.json';
  const SRC = 'src:examplia:handbook:001';
  const receipt = { source_ref: SRC, snapshot_sha256: rep('ab'), official_url: 'https://examplia.invalid/handbook.pdf', source_tier: 'issuer', retrieved_at: '2026-10-26T08:00:00Z', edition: '2026 synthetic edition', effective_date: '2026-07-01', issuer_current_edition_ref: 'https://examplia.invalid/handbook/current', issuer_current_edition_sha256: rep('cd'), verified_by: { actor_id: 'synthetic-15-librarian', provider_family: 'google' }, status: 'PASS' };
  const r08 = {
    _fixture: { kind: 'synthetic', note: 'Clearly SYNTHETIC 08 report over the fictional Examplia candidate: tier-first claims, one dated PASS liveness receipt 4h old at now_utc, independent anthropic auditor vs meta authors + openai prompt authors. Never a DMV result.', context: c08, expected_status: 'PASS' },
    artifact_type: 'FactReport', adapter_version: '0.4.0', probe: 'synthetic-examplia',
    minted_by: { model: 'synthetic-fixture', lane: 'fixture', pass: 'synthetic' },
    candidate_sha256,
    input_hashes: { blueprint: H.blueprint, carddeck: H.carddeck, voice_scripts: H.voice_scripts, session_scripts: H.session_scripts, exambank: H.exambank, source_registry: H.source_registry, curriculum_unit_map: H.curriculum_unit_map, source_liveness: H.source_liveness },
    source_refs: { blueprint: 'synthetic/blueprint.json', carddeck: 'synthetic/carddeck.json', voice_scripts: 'synthetic/voice_scripts.json', session_scripts: 'synthetic/session_scripts.json', exambank: 'tools/belt/fixtures/06.exam_bank/synthetic-pass.json', source_registry: 'synthetic/source_registry.json', image_scout_plan: 'deferred:not_applicable_pilot', curriculum_unit_map: 'synthetic/curriculum_unit_map.json' },
    assigned_scope: 'content_facts:full_candidate',
    auditor: { provider_family: 'anthropic', actor_id: 'synthetic-08-auditor', session_id: 'synthetic-session-auditor-1', model: 'claude-opus-5-5' },
    verdict: 'PASS', tier_resolution_first: true,
    claim_tiers: ['001', '002', '003', '004', '005'].map(n => ({ claim_id: `claim.syn.${n}`, item_ref: `fact.syn.${n}`, source_ref: SRC, tier: 'official', fact_ids: [`fact.syn.${n}`] })),
    source_liveness: [receipt],
    flagged: [], source_supported_blocking_findings: [], unsourced: [], visual_claim_issues: [], grouped_unit_claim_issues: [],
    verification_debt: [], external_review_requests: [], publish_blocked: false,
    checks_run: [
      { check_id: 'step1.tier_resolution', status: 'PASS', scope: 'full', evidence: '5/5 claims official tier via synthetic registry' },
      { check_id: 'step2.source_liveness', status: 'PASS', scope: 'full', evidence: '1/1 cited source receipted 2026-10-26T08:00Z, effective 2026-07-01' },
      { check_id: 'step3.claim_trace', status: 'PASS', scope: 'full', evidence: 'all item/option/rationale strings trace to fact.syn.001-005 pages 12-31' },
      { check_id: 'step4.applicability_and_options', status: 'PASS', scope: 'full', evidence: 'no distractor defensible; answers agree with rationales' },
      { check_id: 'step5.card_equality', status: 'PASS', scope: 'full', evidence: 'synthetic: no card scripts in scope' },
    ],
    required_checks_not_run: [],
  };
  files[c08] = {
    _context: { kind: 'synthetic', note: 'Synthetic candidate/lineage/clock context for the Examplia 08 fixtures; now_utc is supplied data, not a clock read.' },
    strip_fixture_meta: true, candidate_manifest, now_utc: '2026-10-26T12:00:00Z',
    policy: { freshness: { max_receipt_age_hours: 24 } },
    intervention_lineage: lineage, prompt_authorship, auditor_qualification: { status: 'qualified' },
  };
  files['tools/belt/fixtures/08.content_facts/synthetic-pass.json'] = r08;
  const m08 = structuredClone(r08);
  m08._fixture = { kind: 'synthetic_negative', note: 'SYNTHETIC negative: candidate_sha256 names a different revision.', context: c08, expected_status: 'FAIL', expected_failing_checks: ['08.CANDIDATE_ECHO'] };
  m08.candidate_sha256 = rep('de');
  files['tools/belt/fixtures/08.content_facts/synthetic-neg-candidate-mismatch.json'] = m08;
  const i08 = structuredClone(r08);
  const sol = prompt_authorship.entries.find(e => e.path === 'prompts/08.md');
  i08._fixture = { kind: 'synthetic_negative', note: 'SYNTHETIC negative: the auditor is the actor/session/provider family that authored the prompt templates (contracts/prompt-authorship.json) — not independent.', context: c08, expected_status: 'FAIL', expected_failing_checks: ['08.INDEPENDENCE'] };
  i08.auditor = { provider_family: sol.provider_family, actor_id: sol.actor_id, session_id: sol.session_id, model: 'synthetic-openai-model' };
  files['tools/belt/fixtures/08.content_facts/synthetic-neg-auditor-not-independent.json'] = i08;
  const d08 = structuredClone(r08);
  d08._fixture = { kind: 'synthetic_negative', note: 'SYNTHETIC negative: one source-supported blocking finding, yet the report claims PASS (as if outvoted by agreement).', context: c08, expected_status: 'FAIL', expected_failing_checks: ['08.DISSENT_NOT_OUTVOTED', '08.VERDICT_CONSISTENCY'] };
  d08.flagged = [{ check_id: 'step3.claim_trace', item_id: 's04', artifact_hash: exambankSha, source_page: '30', issue: 'distractor "No closer than 5 feet" is the crosswalk rule; rationale calls it "far too close" without source', evidence: 'synthetic handbook p.30 states only the 15-foot hydrant rule', severity: 'blocking', owner_worker: '06', repair_route: 'route_to_producer' }];
  d08.source_supported_blocking_findings = [{ finding_id: 'ssbf.1', flagged_item_id: 's04', source_ref: SRC, source_page: '30', evidence: 'p.30 hydrant sentence does not support the s04 B rationale' }];
  files['tools/belt/fixtures/08.content_facts/synthetic-neg-dissent-outvoted.json'] = d08;
  const h08 = structuredClone(r08);
  h08._fixture = { kind: 'synthetic_hold', note: 'SYNTHETIC: honest HOLD report — the cited source receipt has effective_date null (VERIFICATION_DEBT) and no accepted disposition; policy unknown_effective_date_without_accepted_disposition = HOLD.', context: c08, expected_status: 'HOLD', expected_hold_checks: ['08.LIVENESS_COVERAGE', '08.VERDICT_GATE'] };
  h08.verdict = 'HOLD';
  h08.source_liveness = [{ ...receipt, effective_date: null, issuer_current_edition_ref: null, issuer_current_edition_sha256: null, status: 'VERIFICATION_DEBT' }];
  h08.verification_debt = [{ claim_id: 'claim.syn.001', blocker_kind: 'effective_date_unknown', detail: 'issuer page shows no effective date for the 2026 edition', source_tier_required: 'official', owner_worker: '15', ship_blocking: true }];
  h08.checks_run = h08.checks_run.map(c => c.check_id === 'step2.source_liveness' ? { ...c, status: 'HOLD', evidence: 'effective date unresolved; VerificationDebt to 15' } : c);
  files['tools/belt/fixtures/08.content_facts/synthetic-hold-undated-effective-date.json'] = h08;
  return { files, candidate_sha256, exambankSha };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const { files, candidate_sha256, exambankSha } = build();
  for (const [rel, obj] of Object.entries(files)) { mkdirSync(dirname(join(LANE, rel)), { recursive: true }); writeFileSync(join(LANE, rel), JSON.stringify(obj, null, 2) + '\n'); }
  console.log(JSON.stringify({ wrote: Object.keys(files), candidate_sha256, exambank_member: exambankSha }, null, 2));
}
