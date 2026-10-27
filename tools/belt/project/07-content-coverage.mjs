// V1 projection for 07.content_coverage: runs/2026-06-11-citizenship/07-coverage-report.json -> strict adapter shape,
// with a SYNTHETIC candidate manifest built from the input hashes V1 itself recorded.
// FIXTURE/REFERENCE ONLY — never a DMV result. _fixture.kind = "v1_projected_with_synthetic_candidate".
// CLI: node tools/belt/project/07-content-coverage.mjs --write   (run after tools/belt/project/06-exam-bank.mjs --write)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const V1 = 'D:/nova/runs/2026-06-11-citizenship';
const RUN = 'runs/2026-06-11-citizenship';
const strip = (h) => (typeof h === 'string' ? h.replace(/^sha256:/, '') : null);
const FAMILY = { opus: 'anthropic', sonnet: 'anthropic', haiku: 'anthropic' };

export const V1_INPUT_KEYS = {
  '17-enriched-blueprint.json': 'blueprint', '03-knowledge-graph.json': 'knowledge_graph', '04-carddeck.json': 'carddeck',
  '05-voicescripts.json': 'voice_scripts', '06-exambank.json': 'exambank',
};

export function projectV1(parent, { mediaDisposition }) {
  const h = parent.input_artifact_hashes ?? {};
  const input_hashes = { blueprint: null, knowledge_graph: null, carddeck: null, session_scripts: null, voice_scripts: null, exambank: null, curriculum_unit_map: null, learning_loop: null, early_media_intent: null, source_registry: null };
  for (const [file, key] of Object.entries(V1_INPUT_KEYS)) input_hashes[key] = strip(h[file]);
  const members = Object.entries(V1_INPUT_KEYS).map(([file, role]) => ({ role, path: `${RUN}/${file}`, sha256: strip(h[file]) }));
  const candidate_manifest = { artifact_type: 'ContentCandidateManifest', synthetic: true, lineage_id: 'v1-reference:runs/2026-06-11-citizenship', members };
  const candidate_sha256 = sha256Canonical(candidate_manifest);
  const artifact = {
    artifact_type: 'CoverageReport',
    adapter_version: '0.4.0',
    probe: parent.probe,
    minted_by: { model: parent.minted_by.model, lane: parent.minted_by.lane, pass: parent.minted_by.pass },
    candidate_sha256,
    input_hashes,
    source_refs: {
      blueprint: `${RUN}/17-enriched-blueprint.json`, knowledge_graph: `${RUN}/03-knowledge-graph.json`, carddeck: `${RUN}/04-carddeck.json`,
      session_scripts: 'unbound:v1-07-did-not-audit-session-scripts', exambank: `${RUN}/06-exambank.json`,
      curriculum_unit_map: 'unbound:v1-run-has-no-19A-curriculum-unit-map', image_scout_plan: 'deferred:not_applicable_pilot',
    },
    coverage_matrix_ref: 'unbound:v1-07-emitted-no-coverage-matrix',
    coverage_basis: 'official_objectives',
    provider_family: 'anthropic',
    assigned_scope: 'content_coverage:full_candidate',
    verdict: parent.verdict,
    required_checks_not_run: [
      'session/TeachingUnit coverage and claims fact-id resolution (no 05b input in V1 07)',
      'curriculum unit binding via 19A (no CurriculumUnitMap in the V1 run)',
      'Order Q rule 5/6 form overlap + item-clone recompute (rules postdate V1 07)',
      'Order Q rule 15 titled-promise sweep (rule postdates V1 07)',
    ],
    blocking_findings: [],
    domain_coverage: parent.domain_coverage.map(d => ({ domain: d.domain, weight_check: 'not_applicable', weight_pct: null, content_share: d.content_share, weighting_drift: null, ok: d.content_share > 0 })),
    missing_high_yield: parent.missing_high_yield ?? [],
    dropped_facts: [],
    practice_form_drift: [],
    voice_gaps: (parent.voice_gaps ?? []).map(v => ({ card_id: v.card_id })),
    curriculum_unit_gaps: [],
    media: {
      media_disposition_ref: mediaDisposition.path,
      media_disposition_sha256: mediaDisposition.sha256,
      early_media_intent_ref: null,
      non_applicable_checks: mediaDisposition.document.non_applicable_checks.map(n => ({ check: n.check, reason: n.reason })),
    },
    media_gaps: [],
    pending_media: [],
    cross_product_refs: [],
    sme_dod_unsatisfied: parent.sme_dod_unsatisfied ?? [],
    titled_promises: [],
    route_back: [],
  };
  return { artifact, candidate_manifest, candidate_sha256 };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const srcPath = join(V1, '07-coverage-report.json');
  const parent = JSON.parse(readFileSync(srcPath, 'utf8'));
  const mdAbs = join(LANE, 'contracts', 'media-disposition.json');
  const mediaDisposition = { path: 'contracts/media-disposition.json', sha256: sha256File(mdAbs), document: JSON.parse(readFileSync(mdAbs, 'utf8')) };
  const { artifact, candidate_manifest } = projectV1(parent, { mediaDisposition });
  const genPath = fileURLToPath(import.meta.url);
  const fixture = {
    _fixture: {
      kind: 'v1_projected_with_synthetic_candidate',
      note: 'FIXTURE/REFERENCE projected from the V1 citizenship 07 report — never a DMV production result. The candidate manifest is SYNTHETIC (V1 had none): its members are exactly the input hashes V1 07 recorded.',
      source: { path: `${RUN}/07-coverage-report.json`, sha256: sha256File(srcPath), declared_artifact_hash: parent.artifact_hash },
      generator: { path: 'tools/belt/project/07-content-coverage.mjs', sha256: sha256File(genPath) },
      decisions: [
        'input_hashes: the 5 hashes V1 07 recorded in input_artifact_hashes (sha256: prefix stripped), preserved byte-for-byte; session_scripts/curriculum_unit_map/learning_loop/early_media_intent/source_registry null (V1 07 bound none).',
        'candidate_sha256 = sha256(canonicalJson(synthetic manifest whose members are those 5 recorded hashes)). Synthetic; recorded in context-v1.json.',
        'domain_coverage: V1 weight_pct values are shares of the 128-question published bank (bank_q counts / 128), not issuer-published domain weights -> weight_check not_applicable, weight_pct null, weighting_drift null; content_share kept; ok = content_share > 0.',
        'coverage_basis official_objectives (each M-1778 question is an official objective).',
        'provider_family anthropic: V1 07 minted_by opus + sonnet computer (minted_by.computed_by).',
        'required_checks_not_run lists v0.4.0-required checks for which the V1 report carries no evidence (session/unit/rule 5-6/rule 15). Not a claim that V1 was wrong in its own era.',
        'media: V1 predates the pilot media disposition; projection binds contracts/media-disposition.json@current sha and echoes its non_applicable_checks verbatim. early_media_intent_ref null (no early UI media intent in V1) -> HOLD.',
        'source_refs for unaudited inputs use explicit "unbound:" labels; image_scout_plan uses the deferred:not_applicable_pilot sentinel bound to the disposition.',
        'V1 adapter_exceptions / executor_rulings_applied are not carried (no adapter field; rulings R1-R3 are V1-era executor decisions).',
        'verdict PASS copied from V1.',
      ],
    },
    ...artifact,
  };
  const outDir = join(LANE, 'tools', 'belt', 'fixtures', '07.content_coverage');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'v1-projected.json'), JSON.stringify(fixture, null, 2) + '\n');

  // V1-derived context: projected 06 bank (current V1 bytes; V1 07 audited an earlier exambank revision),
  // titled surfaces from V1 decks/quizzes/forms, lineage from V1 minted_by stamps.
  const bank06 = JSON.parse(readFileSync(join(LANE, 'tools', 'belt', 'fixtures', '06.exam_bank', 'v1-projected.json'), 'utf8'));
  delete bank06._fixture;
  const deck = JSON.parse(readFileSync(join(V1, '04-carddeck.json'), 'utf8'));
  const titled_surfaces = [
    ...deck.decks.map(d => ({ surface_id: `deck.${d.module_id}`, title: d.module, actual_count: d.cards.length })),
    ...bank06.module_quizzes.map(q => ({ surface_id: q.quiz_id, title: q.title, actual_count: q.item_ids.length })),
    ...bank06.practice_forms.map(f => ({ surface_id: f.form_id, title: f.title, actual_count: f.item_ids.length })),
  ];
  const actors = Object.keys(V1_INPUT_KEYS).map(file => {
    const j = JSON.parse(readFileSync(join(V1, file), 'utf8'));
    return { actor_id: `v1:${file}:${j.minted_by?.model}`, provider_family: FAMILY[j.minted_by?.model] ?? j.minted_by?.model, session_id: null, artifact_sha256: strip(parent.input_artifact_hashes[file]), contribution_kind: 'authored_candidate_artifact' };
  });
  const context = {
    _context: { kind: 'v1_derived_synthetic_context', note: 'Synthetic candidate manifest + lineage assembled from V1 stamps; exambank is the projected 06 fixture of CURRENT V1 bytes (V1 07 audited exambank sha acd95d16…, an earlier revision). opus/sonnet stamps mapped to provider family anthropic.' },
    strip_fixture_meta: true,
    candidate_manifest,
    media_disposition: mediaDisposition,
    exambank: bank06,
    titled_surfaces,
    audit_assignment: { provider_family: 'anthropic', assigned_scope: 'content_coverage:full_candidate' },
    intervention_lineage: { lineage_complete: true, actors },
  };
  writeFileSync(join(outDir, 'context-v1.json'), JSON.stringify(context, null, 2) + '\n');
  console.log(JSON.stringify({ wrote: ['tools/belt/fixtures/07.content_coverage/v1-projected.json', 'tools/belt/fixtures/07.content_coverage/context-v1.json'], candidate_sha256: artifact.candidate_sha256, titled_surfaces: titled_surfaces.length }, null, 2));
}
