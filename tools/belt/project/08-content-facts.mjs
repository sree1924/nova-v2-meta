// V1 projection for 08.content_facts: runs/2026-06-11-citizenship/08-fact-report.json -> strict adapter shape,
// with a SYNTHETIC candidate manifest and liveness receipts PROJECTED from 15-source-registry rows (V1 08 carried
// no receipts). FIXTURE/REFERENCE ONLY — never a DMV result. _fixture.kind = "v1_projected_with_synthetic_candidate".
// CLI: node tools/belt/project/08-content-facts.mjs --write
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
const OWNER = { '02-sme': '02', '01b-competitive-intel': '01b' };

// V1 input_pins are 8-hex PREFIXES of each artifact's self-declared artifact_hash (or a bare file name).
export const PIN_FILES = { enriched_blueprint: ['blueprint', '17-enriched-blueprint.json'], carddeck: ['carddeck', '04-carddeck.json'], voicescripts: ['voice_scripts', '05-voicescripts.json'], exambank: ['exambank', '06-exambank.json'], source_registry: ['source_registry', '15-source-registry.json'] };

export function resolvePins(pins, readArtifact) {
  const out = {}; const notes = [];
  for (const [pinKey, [role, file]] of Object.entries(PIN_FILES)) {
    const declared = strip(readArtifact(file).artifact_hash);
    const pin = pins[pinKey];
    const prefix = strip(pin);
    if (prefix && /^[a-f0-9]{8}$/.test(prefix)) {
      if (declared?.startsWith(prefix)) { out[role] = declared; notes.push(`${pinKey}: 8-hex prefix ${prefix} resolved to ${file} declared artifact_hash ${declared}`); }
      else { out[role] = null; notes.push(`${pinKey}: prefix ${prefix} does NOT match ${file} declared artifact_hash — left null`); }
    } else { out[role] = declared; notes.push(`${pinKey}: V1 pinned only the name "${pin}" — resolved to ${file} declared artifact_hash ${declared}`); }
  }
  return { hashes: out, notes };
}

export function projectV1(parent, { blueprint, registry, readArtifact }) {
  const { hashes, notes } = resolvePins(parent.input_pins ?? {}, readArtifact);
  const input_hashes = { blueprint: hashes.blueprint, carddeck: hashes.carddeck, voice_scripts: hashes.voice_scripts, session_scripts: null, exambank: hashes.exambank, source_registry: hashes.source_registry, curriculum_unit_map: null, source_liveness: null };
  const members = Object.entries(PIN_FILES).map(([, [role, file]]) => ({ role, path: `${RUN}/${file}`, sha256: hashes[role] })).filter(m => m.sha256);
  const candidate_manifest = { artifact_type: 'ContentCandidateManifest', synthetic: true, lineage_id: 'v1-reference:runs/2026-06-11-citizenship:08', members };
  const byUrl = new Map(registry.sources.map(s => [s.locator?.url, s]));
  const byCode = new Map(registry.sources.filter(s => s.blueprint_s_code).map(s => [s.blueprint_s_code, s]));
  const claim_tiers = [];
  for (const k of blueprint.knowledge) for (const f of k.facts) {
    const code = /\[(S\d+[ab]?)\]/.exec(f.source_ref?.ref ?? '')?.[1];
    const src = byUrl.get(f.source_ref?.url) ?? byCode.get(code) ?? null;
    claim_tiers.push({ claim_id: `claim.${f.fact_id}`, item_ref: f.fact_id, source_ref: src ? src.source_ref : f.source_ref.ref, tier: f.source_ref.tier, fact_ids: [f.fact_id] });
  }
  const cited = [...new Set(claim_tiers.map(c => c.source_ref))];
  const source_liveness = cited.map(sr => registry.sources.find(s => s.source_ref === sr)).filter(Boolean).map(s => ({
    source_ref: s.source_ref,
    snapshot_sha256: strip(s.snapshot_hash) ?? '',
    official_url: s.locator.url,
    source_tier: 'issuer',
    retrieved_at: s.retrieved_at,
    edition: null,
    effective_date: null,
    issuer_current_edition_ref: null,
    issuer_current_edition_sha256: null,
    verified_by: { actor_id: `v1:15-source-registry:${registry.minted_by?.model}`, provider_family: FAMILY[registry.minted_by?.model] ?? String(registry.minted_by?.model) },
    status: 'VERIFICATION_DEBT',
  }));
  const ev = parent.evidence ?? {};
  const checks_run = Object.entries(ev).map(([k, v]) => ({ check_id: `v1.${k}`, status: 'PASS', scope: /sample/i.test(v) ? 'sampled' : 'full', evidence: v }));
  const artifact = {
    artifact_type: 'FactReport',
    adapter_version: '0.4.0',
    probe: parent.probe,
    minted_by: { model: parent.minted_by.model, lane: parent.minted_by.lane, pass: parent.minted_by.pass },
    candidate_sha256: sha256Canonical(candidate_manifest),
    input_hashes,
    source_refs: {
      blueprint: `${RUN}/17-enriched-blueprint.json`, carddeck: `${RUN}/04-carddeck.json`, voice_scripts: `${RUN}/05-voicescripts.json`,
      session_scripts: 'unbound:v1-08-pinned-no-session-scripts', exambank: `${RUN}/06-exambank.json`, source_registry: `${RUN}/15-source-registry.json`,
      image_scout_plan: 'deferred:not_applicable_pilot', curriculum_unit_map: 'unbound:v1-run-has-no-19A-curriculum-unit-map',
    },
    assigned_scope: 'content_facts:full_candidate',
    auditor: { provider_family: 'anthropic', actor_id: 'v1:08-executor:opus', session_id: 'unrecorded:v1-08', model: parent.minted_by.model },
    verdict: parent.verdict,
    tier_resolution_first: true,
    claim_tiers,
    source_liveness,
    flagged: [],
    source_supported_blocking_findings: [],
    unsourced: [],
    visual_claim_issues: [],
    grouped_unit_claim_issues: [],
    verification_debt: parent.verification_debt.map(d => ({ claim_id: d.claim_id, blocker_kind: d.blocker_kind, detail: d.detail ?? '', source_tier_required: d.source_tier_required, owner_worker: OWNER[d.owner_worker] ?? d.owner_worker, ship_blocking: d.ship_blocking })),
    external_review_requests: [],
    publish_blocked: parent.publish_blocked,
    checks_run,
    required_checks_not_run: [
      'Step 2 source liveness: dated effective_date + issuer current-edition receipt per cited source (V1 08 carried no receipts)',
      'Step 3 TeachingUnit/session span trace (V1 08 pinned no session scripts)',
      'Order Q rules 3/4 scaffold + doubled-article grep and rule 15 titled promises (rules postdate V1 08)',
      'auditor independence against an intervention ledger (V1 had none)',
    ],
  };
  return { artifact, candidate_manifest, notes };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const srcPath = join(V1, '08-fact-report.json');
  const parent = JSON.parse(readFileSync(srcPath, 'utf8'));
  const readArtifact = (f) => JSON.parse(readFileSync(join(V1, f), 'utf8'));
  const blueprint = readArtifact('17-enriched-blueprint.json');
  const registry = readArtifact('15-source-registry.json');
  const { artifact, candidate_manifest, notes } = projectV1(parent, { blueprint, registry, readArtifact });
  const genPath = fileURLToPath(import.meta.url);
  const NOW = '2026-06-12T18:00:00Z';
  const fixture = {
    _fixture: {
      kind: 'v1_projected_with_synthetic_candidate',
      note: 'FIXTURE/REFERENCE projected from the V1 citizenship 08 report — never a DMV production result. Candidate manifest and liveness receipts are SYNTHETIC projections (V1 had neither).',
      source: { path: `${RUN}/08-fact-report.json`, sha256: sha256File(srcPath), declared_artifact_hash: parent.artifact_hash },
      generator: { path: 'tools/belt/project/08-content-facts.mjs', sha256: sha256File(genPath) },
      pin_resolution: notes,
      decisions: [
        'input_hashes: V1 input_pins are 8-hex prefixes; each resolved to the self-declared artifact_hash of the named V1 artifact ONLY when the prefix matches (canonical-body hash, not file bytes). source_registry was pinned by name only -> its declared artifact_hash. session_scripts/curriculum_unit_map/source_liveness null (V1 pinned none).',
        'candidate_sha256 = sha256(canonicalJson(synthetic manifest of those resolved hashes)).',
        'claim_tiers: one row per 17-enriched-blueprint fact (130); source_ref = 15-source-registry row matched by fact URL, else by [S-code]; tier copied from the fact.',
        'source_liveness: projected from 15-source-registry rows for the cited sources: retrieved_at/snapshot/url copied; trust_tier official_body -> source_tier issuer; edition/effective_date/issuer current-edition fields null (not recorded) -> status VERIFICATION_DEBT. Not invented as PASS.',
        'auditor: V1 08 minted_by opus (anthropic); actor id is a label; V1 recorded no session id ("unrecorded:v1-08").',
        'verification_debt VD-1..4 copied; owner_worker 02-sme -> 02, 01b-competitive-intel -> 01b.',
        'checks_run: one row per V1 evidence key, status PASS as V1 reported, scope sampled where the V1 text says sample.',
        'required_checks_not_run lists v0.4.0-required steps with no V1 evidence.',
        `context now_utc ${NOW} is SYNTHETIC (V1 08 freshness note says as of 2026-06-12); receipts dated 2026-06-11T00:00Z are therefore > 24h.`,
        'flagged/unsourced/visual/grouped/external_review empty, publish_blocked false, verdict PASS — copied from V1.',
      ],
    },
    ...artifact,
  };
  const outDir = join(LANE, 'tools', 'belt', 'fixtures', '08.content_facts');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'v1-projected.json'), JSON.stringify(fixture, null, 2) + '\n');
  const actors = Object.values(PIN_FILES).map(([role, file]) => {
    const j = readArtifact(file);
    return { actor_id: `v1:${file}:${j.minted_by?.model}`, provider_family: FAMILY[j.minted_by?.model] ?? String(j.minted_by?.model), session_id: null, artifact_sha256: artifact.input_hashes[role], contribution_kind: 'authored_candidate_artifact' };
  });
  const context = {
    _context: { kind: 'v1_derived_synthetic_context', note: 'Synthetic candidate manifest, now_utc and lineage assembled from V1 stamps (opus/sonnet -> anthropic).' },
    strip_fixture_meta: true,
    candidate_manifest,
    now_utc: NOW,
    policy: { freshness: { max_receipt_age_hours: 24 } },
    intervention_lineage: { lineage_complete: true, actors },
  };
  writeFileSync(join(outDir, 'context-v1.json'), JSON.stringify(context, null, 2) + '\n');
  console.log(JSON.stringify({ wrote: ['tools/belt/fixtures/08.content_facts/v1-projected.json', 'tools/belt/fixtures/08.content_facts/context-v1.json'], candidate_sha256: artifact.candidate_sha256, notes, claims: artifact.claim_tiers.length, receipts: artifact.source_liveness.length }, null, 2));
}
