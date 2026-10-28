#!/usr/bin/env node
// intake-state.mjs — turn a per-state intake SPEC (written by the operator after reading the handbook text) into a seeded
// belt run: run-config cloned from the Utah run with the state's scope, private handbook snapshot, role-15 receipts
// (issuer current-edition confirmation + page snapshot, visual observation, passing-score observation), learning loop,
// standing authority; then ledger init + source registration + learning-loop pin through the controller. $0, no model calls.
//
//   node tools/belt/intake-state.mjs --spec coordination/intake/TX.spec.json [--from runs/2026-10-26-rdmv-ut-class-d]
//
// SPEC (all required unless noted):
// {
//   "run_id": "2026-10-28-rdmv-tx-class-c", "state": "Texas", "jurisdiction": "US-TX",
//   "issuing_authority": "Texas Department of Public Safety, Driver License Division",
//   "license_or_permit_class": "Class C (non-commercial) knowledge test",
//   "handbook_title": "Texas Driver Handbook", "handbook_edition": "Revised December 2024",
//   "handbook_url": "https://www.dps.texas.gov/internetforms/Forms/DL-7.pdf",
//   "handbook_pdf": "C:/.../TX.pdf"                      (local file; copied into the run's sources/private/),
//   "retrieved_at_utc": "2026-10-28T00:35:00Z",
//   "issuer_page": { "url": "https://www.dps.texas.gov/...", "domains": ["dps.texas.gov"], "observed_at_utc": "...",
//                    "observed_statements": ["..."], "excerpt": "verbatim rendered text that CONTAINS the handbook_url" },
//   "visual_observation": { "physical_page": 1, "printed_page": null, "renderer": "Chromium PDF viewer (Claude browser pane)",
//                           "observations": [{"kind":"title","verbatim":"Texas Driver Handbook","value":"Texas Driver Handbook"},
//                                            {"kind":"issuer","verbatim":"...","value":"..."}, {"kind":"edition","verbatim":"...","value":"..."}] },
//   "passing_score": { "pdf_page": 33, "printed_page": "23", "verbatim": "...", "value": 70 },
//   "exam_facts": { "question_count": 30, "passing_percent": 70, "time_limit": null, "source_pages": [33], "note": "..." },
//   "section_page_ranges": { "sec01-...": [11,12,13], ... }     (physical PDF pages, <= 30 per section, handbook order),
//   "section_titles": { "sec01-...": "Definitions" }             (optional, for the report),
//   "depth_floor": { ... }                                       (optional; defaults to the source run's)
// }
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : d; };
const SPEC_PATH = get('--spec');
const FROM = get('--from', 'runs/2026-10-26-rdmv-ut-class-d').replace(/\\/g, '/').replace(/\/$/, '');
const EXECUTOR = get('--executor-id', '2bdcad95-d4cc-467e-a88d-be4a6260cf03');
if (!SPEC_PATH) { console.error('--spec <file> required'); process.exit(2); }
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const readJ = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const writeJ = (p, v) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(v, null, 2) + '\n'); };
const spec = readJ(path.resolve(ROOT, SPEC_PATH));
const req = (k) => { if (spec[k] === undefined || spec[k] === null || spec[k] === '') throw new Error('spec missing ' + k); return spec[k]; };
for (const k of ['run_id', 'state', 'jurisdiction', 'issuing_authority', 'license_or_permit_class', 'handbook_title', 'handbook_edition', 'handbook_url', 'handbook_pdf', 'retrieved_at_utc', 'issuer_page', 'visual_observation', 'passing_score', 'exam_facts', 'section_page_ranges']) req(k);
const TO_ID = spec.run_id, TO = `runs/${TO_ID}`;
const src = (p) => path.join(ROOT, FROM, p), dst = (p) => path.join(ROOT, TO, p);
if (fs.existsSync(dst('run-config.json'))) { console.error(`${TO} already exists; refusing to overwrite`); process.exit(2); }
const fromCfg = readJ(src('run-config.json'));
const now = new Date().toISOString();

// section map sanity (the dispatcher rejects >30 pages per section and non-positive pages)
const ranges = spec.section_page_ranges;
for (const [id, pages] of Object.entries(ranges)) {
  if (!/^sec\d{2}-[a-z0-9-]+$/.test(id)) throw new Error('section id must look like sec01-topic: ' + id);
  if (!Array.isArray(pages) || !pages.length || pages.length > 30 || pages.some((p) => !Number.isInteger(p) || p < 1)) throw new Error('bad page list for ' + id);
}

// 1. private handbook snapshot
const pdfBytes = fs.readFileSync(path.resolve(spec.handbook_pdf));
if (pdfBytes.subarray(0, 5).toString() !== '%PDF-') throw new Error('handbook_pdf is not a PDF');
const pdfName = path.basename(spec.handbook_url.split('?')[0]).replace(/[^A-Za-z0-9._-]/g, '_').replace(/\.pdf$/i, '') + '.pdf';
const snapshotRel = `sources/private/${pdfName}`;
fs.mkdirSync(dst('sources/private'), { recursive: true });
fs.writeFileSync(dst(snapshotRel), pdfBytes);
const pdfSha = sha(pdfBytes);
fs.writeFileSync(dst('sources/private/SHA256'), `${pdfSha}  ${pdfName}\n`);
fs.writeFileSync(dst('sources/private/README.md'), `# private sources — ${TO_ID}\n\nOfficial handbook snapshot (${spec.handbook_title}, ${spec.handbook_edition}) retrieved ${spec.retrieved_at_utc} from ${spec.handbook_url}. Never redistributed; only page anchors and authored text leave this folder.\n`);

// 2. receipts: issuer current-edition confirmation (+ page snapshot), visual observation, passing-score observation
const ip = spec.issuer_page;
if (!String(ip.excerpt || '').includes(spec.handbook_url)) throw new Error('issuer_page.excerpt must contain the exact handbook_url');
const pageSnapshot = { artifact_type: 'IssuerPageRenderedExcerpt', run_id: TO_ID, page_url: ip.url, observed_at_utc: ip.observed_at_utc, snapshot_kind: 'rendered_dom_excerpt', excerpt: ip.excerpt, handbook_href: spec.handbook_url };
const snapRel = 'receipts/issuer-page-snapshot.json';
writeJ(dst(snapRel), pageSnapshot);
const snapBytes = fs.readFileSync(dst(snapRel));
const issuerConf = {
  artifact_type: 'IssuerCurrentEditionConfirmation', version: '0.4.0', run_id: TO_ID, page_url: ip.url, observed_at_utc: ip.observed_at_utc,
  observation_method: 'Rendered page text excerpt (WebFetch/browser) with the exact visible handbook href; saved snapshot bytes are JSON, not the HTTP response body.',
  page_sha256: sha(snapBytes), page_bytes: snapBytes.length, hash_status: 'HASHED_RENDERED_DOM_SNAPSHOT', snapshot_kind: 'rendered_dom_excerpt',
  page_snapshot_ref: { path: `${TO}/${snapRel}`, sha256: sha(snapBytes) },
  observed_statements: ip.observed_statements || [], links_exact_handbook_url: spec.handbook_url, handbook_snapshot_sha256: pdfSha,
  edition_claim: spec.handbook_edition, effective_date_disposition: { value: null, reason: 'issuer page states no effective date; edition recorded as debt per S4 order' },
  recorded_by: { actor: ip.recorded_by || 'Muse Code (subscription) via tools/belt/intake-state.mjs', session_id: EXECUTOR }, recorded_at_utc: now,
};
writeJ(dst('receipts/issuer-current-edition-confirmation.json'), issuerConf);

const vo = spec.visual_observation;
const visual = {
  artifact_type: 'Role15VisualObservation', version: '0.4.0',
  source_document: { path: `${TO}/${snapshotRel}`, sha256: pdfSha },
  observed_by: { actor_id: vo.actor_id || (vo.method_kind === 'local_pdf_text_observation' ? 'muse-code/muse-spark-1.3 (subscription) via handbook-text.mjs' : 'claude-fable-5-1 (belt runner)'), provider_family: vo.provider_family || (vo.method_kind === 'local_pdf_text_observation' ? 'meta' : 'anthropic'), identity: vo.identity || (vo.method_kind === 'local_pdf_text_observation' ? 'Muse Code operator; title/issuer read from the extracted text of one physical page' : 'Claude Code runner, visual inspection of the rendered PDF page'), model: vo.method_kind === 'local_pdf_text_observation' ? 'muse-spark-1.3' : 'claude-fable-5-1', model_id_availability: 'exposed' },
  method: vo.method_kind === 'local_pdf_text_observation'
    ? { kind: 'local_pdf_text_observation', renderer: vo.renderer || 'tools/belt/handbook-text.mjs (pypdf text extraction of the physical page)', physical_page: vo.physical_page || 1, render_parameters: ['text extraction only, no rendering'], transport: 'extracted page text read locally; verbatim lines quoted', files_written: 0, network_requests: 0 }
    : { kind: 'local_pdf_render_visual_inspection', renderer: vo.renderer || 'pdfplumber page.to_image (pypdfium2) → PNG inspected in conversation', physical_page: vo.physical_page || 1, render_parameters: ['to_image resolution 110', 'PNG'], transport: 'rendered locally; image inspected in conversation', files_written: 0, network_requests: 0 },
  observations: (vo.observations || []).map((o) => ({ pdf_page: vo.physical_page || 1, printed_page: vo.printed_page ?? null, kind: o.kind, value: o.value, verbatim: o.verbatim })),
  declarations: { engineering_observation: true, measured_meta_model_output: false, issuer_current_edition_confirmation: false, handbook_effective_date_evidence: false, retrieval_time_evidence: false, rights_clearance: false },
  observed_at_utc: vo.observed_at_utc || now,
};
const visualRel = 'receipts/ROLE15-VISUAL-OBSERVATION.json';
writeJ(dst(visualRel), visual);

const ps = spec.passing_score;
const passingRel = 'receipts/15-passing-score-observation.json';
writeJ(dst(passingRel), { artifact_type: 'LocalSourceFactObservation', run_id: TO_ID, source_ref: `src:${TO_ID.replace(/^\d{4}-\d{2}-\d{2}-/, '')}:${spec.jurisdiction.toLowerCase()}:handbook`, snapshot_sha256: pdfSha,
  source_page: `src:${TO_ID.replace(/^\d{4}-\d{2}-\d{2}-/, '')}:${spec.jurisdiction.toLowerCase()}:handbook:pdf-${String(ps.pdf_page).padStart(4, '0')}`, pdf_page: ps.pdf_page, printed_page: ps.printed_page ?? null, value: ps.value, verbatim: ps.verbatim,
  method: 'Exact local PDF-page text match; no model or parametric fact source', factual_audit: 'pending07/08' });

// 3. standing authority (same founder words/cap; this run's id; authoring amendment)
const standingRel = 'approvals/STANDING-AUTHORITY-utah-full-run.json';
const standing = readJ(src(standingRel));
standing.run_id = TO_ID;
standing.scope = { ...(standing.scope || {}), state: spec.state, jurisdiction: spec.jurisdiction, note: `extended to ${spec.state} by founder order 2026-10-28 ("do five states parallel"); Muse Code subscription authoring; no Model API calls` };
standing.amendments = [...(standing.amendments || []), { at: now, kind: 'state_extension_and_authoring_mode', state: spec.state, value: 'muse_code_subscription', founder_words: 'yup do five states parallel then we proceed... no audio minting until i say go (2026-10-28)', derived_from: { run_id: fromCfg.run_id, path: `${FROM}/${standingRel}` } }];
writeJ(dst(standingRel), standing);
const standingRef = { path: `${TO}/${standingRel}`, sha256: sha(fs.readFileSync(dst(standingRel))) };

// 4. run-config
const cfg = structuredClone(fromCfg);
cfg.run_id = TO_ID;
cfg.working_product_id = `rdmv-${spec.jurisdiction.split('-')[1].toLowerCase()}-${(spec.license_or_permit_class.match(/class\s+([a-z])/i)?.[1] || 'x').toLowerCase()}`;
cfg.candidate_lineage_id = `${TO_ID}:lineage:1`;
delete cfg.candidate_lineage_reset_ref;
cfg.execution.retry_nonces = {};
cfg.execution.standing_authority_ref = standingRef;
cfg.execution.live_window = { armed_by: `founder standing authority 2026-10-28 (five states, muse_code_subscription)`, armed_at: now };
cfg.producer.authoring_mode = 'muse_code_subscription';
cfg.producer.authoring_note = `Muse Code (${cfg.producer.model}) authors every artifact under its subscription via belt packets; no Model API call; ledger actual $0; same strict schemas, checks, ledger and lineage policy as the Utah Model-API run.`;
cfg.state_selection = { status: 'confirmed', confirmed_by: 'founder', jurisdiction: spec.jurisdiction, confirmed_at_utc: now, evidence: 'founder chat 2026-10-28: "yup do five states parallel then we proceed" (TX, CA, FL, NY + VA after PA/IL/OH/GA refused scripted retrieval)', recorded_by: 'Claude Code runner via intake-state.mjs', scope_note: `${spec.state} ${spec.license_or_permit_class}, first-time applicant path, English` };
const s = cfg.scope;
s.jurisdiction = spec.jurisdiction; s.jurisdiction_selected_by = 'founder (five-state parallel order, 2026-10-28)';
s.issuing_authority = spec.issuing_authority; s.license_or_permit_class = spec.license_or_permit_class;
s.handbook_edition = `${spec.handbook_title} ${spec.handbook_edition}`.trim(); s.handbook_url = spec.handbook_url; s.handbook_local_snapshot = `${TO}/${snapshotRel}`;
s.handbook_sha256 = pdfSha; s.handbook_snapshot_bytes = pdfBytes.length; s.handbook_retrieved_at_utc = spec.retrieved_at_utc;
delete s.source_pages_checked_2026_10_26;
s.issuer_page_domains = ip.domains || [new URL(ip.url).hostname.replace(/^www\./, '')];
// exam_facts in the shape the safe model-input view verifies (tools/sanitize-model-input.mjs normalizeOfficialFact): each fact
// is {value, status, source_page, source_ref, source_snapshot_sha256, liveness_receipt_ref} bound to the source the registrar
// will register (same source_ref derivation as tools/roles/15-register.mjs). Flat numbers read as "unknown" (bug of 2026-10-28,
// migrated by tools/belt/migrate-exam-facts.mjs). Provenance lives beside it, never inside it.
{
  const stateCode = spec.jurisdiction.slice(3).toLowerCase();
  const issuerSlug = String(spec.issuing_authority ?? 'issuer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const sourceRef = `src:${cfg.working_product_id || ('rdmv-' + stateCode)}:${issuerSlug}:handbook`;
  const liveness = `${TO}/15-source-liveness.json`;
  const ef = spec.exam_facts || {};
  const unknown = () => ({ value: null, status: 'unknown', source_page: null, source_ref: null, source_snapshot_sha256: null, liveness_receipt_ref: null });
  const fact = (value, page) => (value == null || page == null) ? unknown() : { value, status: 'verified', source_page: `${sourceRef}:pdf-${String(page).padStart(4, '0')}`, source_ref: sourceRef, source_snapshot_sha256: pdfSha, liveness_receipt_ref: liveness };
  const passingPage = ps.pdf_page ?? null;
  const questionPage = ef.question_count_page ?? (ef.source_pages || []).find((p) => p !== passingPage) ?? passingPage;
  s.exam_facts = { question_count: fact(ef.question_count ?? null, questionPage), passing_percent: fact(ef.passing_percent ?? null, passingPage), time_limit: fact(ef.time_limit ?? null, ef.time_limit_page ?? null), format: unknown() };
  s.exam_facts_provenance = { note: ef.note ?? null, source_pages: ef.source_pages ?? null, passing_score_observation_ref: { path: `${TO}/${passingRel}`, sha256: sha(fs.readFileSync(dst(passingRel))) }, recorded_from: 'handbook page text (intake spec); issuer page statements in receipts/issuer-current-edition-confirmation.json' };
  // the observation receipt names the same registered source
  const obs = readJ(dst(passingRel)); obs.source_ref = sourceRef; obs.source_page = `${sourceRef}:pdf-${String(ps.pdf_page).padStart(4, '0')}`; writeJ(dst(passingRel), obs);
  s.exam_facts_provenance.passing_score_observation_ref.sha256 = sha(fs.readFileSync(dst(passingRel)));
}
s.section_page_ranges = ranges;
s.section_page_ranges_note = `physical PDF pages per handbook section (${Object.keys(ranges).length} sections), mapped by the operator from the extracted page text; <= 30 pages each; titles in section_titles`;
s.section_titles = spec.section_titles || {};
if (spec.depth_floor) s.depth_floor = spec.depth_floor;
s.visual_observation_ref = { path: `${TO}/${visualRel}`, sha256: sha(fs.readFileSync(dst(visualRel))) };
if (s.coverage_manifest_ref) s.coverage_manifest_ref = null;
cfg.seeded_from = { run_id: fromCfg.run_id, at: now, by: 'tools/belt/intake-state.mjs', spec: SPEC_PATH };
// rewrite any leftover references to the source run (receipts, liveness) to this run
const walk = (v) => Array.isArray(v) ? v.map(walk) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x)])) : typeof v === 'string' ? v.split(FROM).join(TO) : v;
writeJ(dst('run-config.json'), walk(cfg));

// 5. learning loop: the canonical loop with the state's name/slug substituted (product policy, not handbook facts)
const loopText = fs.readFileSync(src('19-learning-loop.json'), 'utf8').split('Utah').join(spec.state).split('ut-pilot').join(`${spec.jurisdiction.split('-')[1].toLowerCase()}-pilot`);
fs.writeFileSync(dst('19-learning-loop.json'), loopText);
fs.writeFileSync(dst('jams.md'), `# jams — ${TO_ID}\n\nSeeded ${now} by intake-state.mjs from ${fromCfg.run_id} (spec ${SPEC_PATH}); authoring mode muse_code_subscription.\n`);
fs.writeFileSync(dst('.gitkeep'), '');

// 6. controller: ledger init + register source + pin learning loop
const run = (label, cmdArgs) => {
  const r = spawnSync(process.execPath, ['tools/belt/controller.mjs', ...cmdArgs], { cwd: ROOT, encoding: 'utf8' });
  const out = (r.stdout || '') + (r.stderr || '');
  console.log(`${label}: exit ${r.status}\n${out.split('\n').filter(Boolean).slice(-5).map((l) => '  ' + l.slice(0, 220)).join('\n')}`);
  return r.status === 0;
};
const ok1 = run('plan --init-ledger --register-sources', ['plan', '--run-config', `${TO}/run-config.json`, '--executor-id', EXECUTOR, '--init-ledger', '--register-sources']);
const ok2 = ok1 && run('pin-learning-loop', ['pin-learning-loop', '--run-config', `${TO}/run-config.json`, '--executor-id', EXECUTOR]);
console.log(`\nINTAKE ${TO} (${spec.state}, ${Object.keys(ranges).length} sections, handbook ${pdfName} ${(pdfBytes.length / 1e6).toFixed(1)} MB): ledger ${ok1 ? 'initialised + source registered' : 'INIT/REGISTER FAILED'}; learning loop ${ok2 ? 'pinned' : 'not pinned'}`);
process.exit(ok1 && ok2 ? 0 : 1);
