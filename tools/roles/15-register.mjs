/** Offline Role 15 registration. No network, model calls, clock reads, or writes.
 * The controller owns its executor lock and persistence of the returned plan.
 */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';

const execFileAsync = promisify(execFile);
const MODULE_PATH = fileURLToPath(import.meta.url);
export const DEFAULT_PROJECT_ROOT = path.resolve(path.dirname(MODULE_PATH), '../..');
export const DEFAULT_RUN_CONFIG = 'runs/2026-10-26-rdmv-ut-class-d/run-config.json';
export const DEFAULT_OBSERVATION = 'coordination/ROLE15-VISUAL-OBSERVATION-v0.4.0.json';
export const DEFAULT_PYTHON = 'C:/Users/varad/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe';
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n', 'utf8');
const slash = value => value.split(path.sep).join('/');
const isDateTime = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));

// Python returns extracted text only through the local pipe. It writes no cache,
// images, PDF copies, or text files. Printed IDs come from a physical footer crop,
// never PDF /PageLabels (the Utah back cover is labelled Main105 but unnumbered).
const EXTRACT_PYTHON = String.raw`
import sys, json, hashlib
from importlib.metadata import version
from pypdf import PdfReader
import pdfplumber

source = sys.argv[1]
reader = PdfReader(source, strict=False)
labels = reader.page_labels
pages = []
with pdfplumber.open(source) as document:
    if len(document.pages) != len(reader.pages):
        raise ValueError('PDF extractors disagree on physical page count')
    for index, (page, layout) in enumerate(zip(reader.pages, document.pages)):
        text = (page.extract_text() or '').replace('\r\n', '\n').replace('\r', '\n')
        # The bottom 32pt captures actual isolated footer IDs in this handbook.
        top = max(0, layout.height - 32)
        footer = layout.crop((0, top, layout.width, layout.height)).extract_text() or ''
        lines = [line.strip() for line in footer.splitlines() if line.strip()]
        last = lines[-1] if lines else ''
        printed = last if last.isdigit() or (last and all(c in 'ivxlcdmIVXLCDM' for c in last)) else None
        pages.append({'pdf_page': index + 1, 'pdf_label': str(labels[index]),
            'text': text, 'printed_page': printed,
            'printed_page_evidence': None if printed is None else {
                'kind': 'isolated_last_footer_line', 'verbatim': last,
                'crop_bbox_pt': [0, top, layout.width, layout.height]},
            'width_pt': layout.width, 'height_pt': layout.height})
print(json.dumps({'page_count': len(pages),
    'metadata': {str(k): str(v) for k,v in (reader.metadata or {}).items()},
    'tool_versions': {'pypdf': version('pypdf'), 'pdfplumber': version('pdfplumber')},
    'pages': pages}, ensure_ascii=True))
`;

function contained(root, target, label) {
  const realRoot = fs.realpathSync(root);
  const realTarget = fs.realpathSync(target);
  const rel = path.relative(realRoot, realTarget);
  if (!rel || rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) {
    throw new Error(`${label} must be a file inside ${realRoot}`);
  }
  return realTarget;
}

function evidence(page, sourceRef, sourceHash, verbatim, kind) {
  return {
    source_ref: sourceRef, source_document_sha256: sourceHash,
    page_map_id: `${sourceRef}:pdf-${String(page.pdf_page).padStart(4, '0')}`,
    pdf_page: page.pdf_page, printed_page: page.printed_page,
    page_text_sha256: sha256(Buffer.from(page.text, 'utf8')), kind, verbatim,
  };
}

/** Only local installed Python tooling is executed; no shell or provider SDK. */
export async function extractLocalPdf(pdfPath, {pythonPath = DEFAULT_PYTHON} = {}) {
  const {stdout} = await execFileAsync(pythonPath, ['-c', EXTRACT_PYTHON, pdfPath], {
    windowsHide: true, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
    timeout: 120_000,
  });
  const result = JSON.parse(stdout);
  if (!Number.isInteger(result.page_count) || result.page_count < 1 || result.pages?.length !== result.page_count) {
    throw new Error('PDF extraction did not return a complete physical page list');
  }
  return result;
}

/** Build a deterministic registration plan from the locked run's private PDF.
 * recorded retrieval values are assertions with exact run-config byte provenance;
 * they do not establish issuer liveness, edition, rights clearance, or acceptance.
 * No artifact is written. Persist privateArtifacts ONLY inside sources/private.
 */
export async function buildRegistration({
  projectRoot = DEFAULT_PROJECT_ROOT, runConfigPath = DEFAULT_RUN_CONFIG,
  pdfPath, pythonPath = DEFAULT_PYTHON, observationPath, issuerConfirmationPath, configEvidenceRef,
} = {}) {
  projectRoot = fs.realpathSync(projectRoot);
  const configPath = contained(projectRoot, path.resolve(projectRoot, runConfigPath), 'Run config');
  const configBytes = fs.readFileSync(configPath);
  const config = JSON.parse(configBytes.toString('utf8'));
  const runRoot = path.dirname(configPath);
  const runsRoot = fs.realpathSync(path.join(projectRoot, 'runs'));
  contained(runsRoot, configPath, 'Run config');
  if (path.basename(configPath) !== 'run-config.json' || config.run_id !== path.basename(runRoot)) {
    throw new Error('run_id and run-config.json directory must identify the same isolated run');
  }
  // Multi-state intake (2026-10-28): any founder-confirmed US jurisdiction registers through this same offline profile.
  if (!/^US-[A-Z]{2}$/.test(config.scope?.jurisdiction ?? '') || config.state_selection?.status !== 'confirmed') {
    throw new Error('This offline registration profile requires a founder-confirmed US-XX jurisdiction (scope.jurisdiction + state_selection.status=confirmed)');
  }
  const stateCode = config.scope.jurisdiction.slice(3).toLowerCase();
  const issuerSlug = String(config.scope.issuing_authority ?? 'issuer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const productId = config.working_product_id || ('rdmv-' + stateCode);
  const handbookTitle = String(config.scope.handbook_edition ?? '').split(/\s+(?:20\d\d|revised|rev\.|edition)/i)[0].trim();
  const titleRe = new RegExp([handbookTitle, config.scope.issuing_authority].filter(s => s && s.length > 6).map(s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).concat(['Driver Handbook', "Driver'?s Handbook", "Driver'?s Manual", 'Driver License Handbook', 'Driver License Division', 'Driver License \\(Class [A-Z]\\)']).join('|'), 'i');
  const issuerDomains = Array.isArray(config.scope?.issuer_page_domains) && config.scope.issuer_page_domains.length ? config.scope.issuer_page_domains : ['dld.utah.gov'];
  const onIssuerDomain = (u) => issuerDomains.some(d => new RegExp('^https://(?:[a-z0-9-]+\\.)*' + String(d).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(u ?? ''));
  const privateRoot = contained(runRoot, path.join(runRoot, 'sources', 'private'), 'Private source directory');
  const declaredPath = config.scope?.handbook_local_snapshot;
  if (typeof declaredPath !== 'string' || !declaredPath) throw new Error('Run config has no private handbook snapshot');
  const declaredPdf = contained(privateRoot, path.resolve(projectRoot, declaredPath), 'PDF');
  const sourcePath = contained(privateRoot, pdfPath ? path.resolve(projectRoot, pdfPath) : declaredPdf, 'PDF');
  if (sourcePath !== declaredPdf || path.extname(sourcePath).toLowerCase() !== '.pdf') {
    throw new Error('Only the exact configured private PDF may be registered');
  }
  const sourceBytes = fs.readFileSync(sourcePath);
  if (!sourceBytes.subarray(0, 5).equals(Buffer.from('%PDF-'))) throw new Error('Configured source is not a PDF');
  const sourceHash = sha256(sourceBytes);
  const snapshotPath = slash(path.relative(projectRoot, sourcePath));
  let configEvidencePath = configPath;
  if (configEvidenceRef !== undefined) {
    if (!configEvidenceRef || !/^[a-f0-9]{64}$/.test(configEvidenceRef.sha256 ?? '') || typeof configEvidenceRef.path !== 'string') {
      throw new Error('Config evidence requires an exact path and SHA256');
    }
    configEvidencePath = contained(runRoot, path.resolve(projectRoot, configEvidenceRef.path), 'Config evidence');
    if (configEvidencePath === configPath) throw new Error('Config evidence must be a separate immutable snapshot, not the mutable run config');
    const evidenceBytes = fs.readFileSync(configEvidencePath);
    if (sha256(evidenceBytes) !== configEvidenceRef.sha256 || !evidenceBytes.equals(configBytes)) {
      throw new Error('Config evidence bytes/hash differ from the actual run config read for registration');
    }
  }
  const configRef = {path: slash(path.relative(projectRoot, configEvidencePath)), sha256: sha256(configBytes)};
  const debt = [];
  const addDebt = (code, field, reason, evidence_refs = []) => debt.push({code, field, reason, evidence_refs});
  if (sourceHash !== config.scope.handbook_sha256) addDebt('snapshot_hash_mismatch', 'snapshot_sha256', 'Actual PDF bytes do not match the configured source hash.', [configRef]);
  if (config.scope.handbook_snapshot_bytes !== undefined && config.scope.handbook_snapshot_bytes !== sourceBytes.length) {
    addDebt('snapshot_size_mismatch', 'snapshot_bytes', 'Actual PDF size differs from the configured download size.', [configRef]);
  }
  const extraction = await extractLocalPdf(sourcePath, {pythonPath});
  if (sha256(fs.readFileSync(sourcePath)) !== sourceHash || sha256(fs.readFileSync(configPath)) !== configRef.sha256 ||
      sha256(fs.readFileSync(configEvidencePath)) !== configRef.sha256) {
    throw new Error('Source PDF or run config changed during extraction; retry from stable input bytes');
  }
  const sourceRef = stateCode === 'ut' ? 'src:rdmv-ut-class-d:utah-dld:handbook' : `src:${productId}:${issuerSlug}:handbook`;
  const emptyPages = extraction.pages.filter(p => !p.text.trim()).map(p => p.pdf_page);
  const pageMap = {
    schema_version: 'nova.local.page-map.v0.4.0', role_id: '15', run_id: config.run_id,
    source_ref: sourceRef, source_document_ref: {path: snapshotPath, sha256: sourceHash},
    status: 'PASS', status_scope: 'physical_page_inventory_and_observed_footer_ids_only',
    page_count: extraction.page_count,
    printed_page_policy: 'Observed isolated footer text only. PDF labels and physical page indexes are separate; null means no observed printed ID.',
    pages: extraction.pages.map(p => ({
      page_map_id: `${sourceRef}:pdf-${String(p.pdf_page).padStart(4, '0')}`,
      page_id: `${sourceRef}:pdf-${String(p.pdf_page).padStart(4, '0')}`,
      source_ref: sourceRef, source_document_sha256: sourceHash,
      pdf_page: p.pdf_page, printed_page: p.printed_page, pdf_label: p.pdf_label,
      text_sha256: sha256(Buffer.from(p.text, 'utf8')),
      text_extraction_status: p.text.trim() ? 'text_extracted' : 'no_extractable_text',
      printed_page_evidence: p.printed_page_evidence,
    })),
  };
  const notices = [];
  const dateStatements = [];
  const editionCandidates = [];
  const issuerEvidence = [];
  for (const p of extraction.pages) {
    for (const line of p.text.split('\n')) {
      if (/copyright|\u00a9|all rights reserved|photo courtesy|used with permission|permission to reproduce|AAMVA/i.test(line)) {
        notices.push(evidence(p, sourceRef, sourceHash, line, 'rights_or_attribution_text_match'));
      }
      if (p.pdf_page <= 10 && /\beffective\b|NEW \d{4} LAWS/i.test(line)) {
        dateStatements.push(evidence(p, sourceRef, sourceHash, line, 'frontmatter_date_statement_not_edition_effective_date'));
      }
      if (p.pdf_page <= 10 && /\bedition\b|\brevised\b|\brevision\b/i.test(line)) {
        editionCandidates.push(evidence(p, sourceRef, sourceHash, line, 'unresolved_edition_statement_candidate'));
      }
      if (p.pdf_page <= 10 && (stateCode === 'ut' ? /UTAH DRIVER HANDBOOK|Utah Driver License Division|Driver License \(Class D\)/.test(line) : titleRe.test(line))) {
        issuerEvidence.push(evidence(p, sourceRef, sourceHash, line, 'issuer_or_title_text'));
      }
    }
  }
  // Extracting a year from a URL, filename, PDF creation date or law-section
  // heading would silently manufacture an edition. Those remain only hints.
  let visualObservation = null;
  let visualObservationRef = null;
  const visualPath = observationPath ?? (fs.existsSync(path.join(projectRoot, DEFAULT_OBSERVATION)) ? DEFAULT_OBSERVATION : null);
  if (visualPath !== null) {
    const observationFile = contained(projectRoot, path.resolve(projectRoot, visualPath), 'Visual observation');
    const bytes = fs.readFileSync(observationFile);
    const value = JSON.parse(bytes.toString('utf8'));
    if (value.artifact_type !== 'Role15VisualObservation' || value.version !== '0.4.0' ||
        value.source_document?.sha256 !== sourceHash || value.source_document?.path !== snapshotPath ||
        !value.observed_by?.actor_id || !value.observed_by?.provider_family ||
        // 2026-10-28 queue mode: a title/issuer observation may also be read from the locally extracted text of ONE physical
        // page (no rendering); the method says so and the evidence is still page-bound and verbatim.
        !['local_pdf_render_visual_inspection', 'local_pdf_text_observation'].includes(value.method?.kind) ||
        !Number.isInteger(value.method?.physical_page) || value.method.physical_page < 1 || value.method.physical_page > extraction.page_count ||
        value.declarations?.engineering_observation !== true || value.declarations?.measured_meta_model_output !== false ||
        ['issuer_current_edition_confirmation', 'handbook_effective_date_evidence', 'retrieval_time_evidence', 'rights_clearance'].some(k => value.declarations?.[k] !== false) ||
        !Array.isArray(value.observations) || !value.observations.length || value.observations.some(o =>
          !Number.isInteger(o.pdf_page) || o.pdf_page < 1 || o.pdf_page > extraction.page_count ||
          o.pdf_page !== value.method.physical_page || o.printed_page !== extraction.pages[o.pdf_page - 1].printed_page ||
          !['title', 'edition', 'issuer'].includes(o.kind) ||
          typeof o.verbatim !== 'string' || !o.verbatim.trim() || typeof o.value !== 'string' || !o.value.trim())) {
      throw new Error('Visual observation lacks matching source hash/path, valid physical-page scope, or engineering provenance');
    }
    visualObservation = value;
    visualObservationRef = {path: slash(path.relative(projectRoot, observationFile)), sha256: sha256(bytes)};
  }
  const editionObservations = visualObservation?.observations.filter(o => o.kind === 'edition') ?? [];
  if (editionObservations.length > 1 || editionObservations.some(o => o.value !== o.verbatim || o.pdf_page !== 1 || o.printed_page !== null)) {
    throw new Error('Edition observation must be a single verbatim front-cover observation on physical page1, with no printed ID');
  }
  const edition = editionObservations[0]?.value ?? null;
  const effectiveDate = null;
  let issuerConfirmation = null;
  const defaultIssuerFile = path.join(runRoot, 'receipts', 'issuer-current-edition-confirmation.json');
  const issuerFile = issuerConfirmationPath ? path.resolve(projectRoot, issuerConfirmationPath)
    : fs.existsSync(defaultIssuerFile) ? defaultIssuerFile : null;
  if (issuerFile !== null) {
    const actualFile = contained(runRoot, issuerFile, 'Issuer confirmation');
    const bytes = fs.readFileSync(actualFile);
    const value = JSON.parse(bytes.toString('utf8'));
    if (value.artifact_type !== 'IssuerCurrentEditionConfirmation' || value.run_id !== config.run_id ||
        value.handbook_snapshot_sha256 !== sourceHash || value.links_exact_handbook_url !== config.scope.handbook_url ||
        // Issuer page must be on the run's declared issuer domain(s) (scope.issuer_page_domains, https only); Utah's DLD
        // remains the default so the first run's receipts still verify. Multi-state intake, 2026-10-28.
        !(Array.isArray(config.scope?.issuer_page_domains) && config.scope.issuer_page_domains.length ? config.scope.issuer_page_domains : ['dld.utah.gov'])
          .some(d => new RegExp('^https://(?:[a-z0-9-]+\\.)*' + String(d).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/').test(value.page_url ?? '')) || !isDateTime(value.observed_at_utc) ||
        !value.recorded_by?.actor || !value.recorded_by?.session_id ||
        value.effective_date_disposition?.value !== null) {
      throw new Error('Issuer confirmation does not bind this run, source hash, exact handbook URL, dated official page, and recorder');
    }
    let pageSnapshot = null;
    if (value.page_sha256 !== null && value.page_sha256 !== undefined) {
      if (!/^[a-f0-9]{64}$/.test(value.page_sha256) || !value.page_snapshot_ref) {
        throw new Error('Hashed issuer-page claim requires a local page_snapshot_ref and exact page SHA');
      }
      const snapshotPath = typeof value.page_snapshot_ref === 'string' ? value.page_snapshot_ref : value.page_snapshot_ref.path;
      if (typeof snapshotPath !== 'string' || (typeof value.page_snapshot_ref === 'object' && value.page_snapshot_ref.sha256 !== value.page_sha256)) {
        throw new Error('Issuer page snapshot reference and page SHA differ');
      }
      const snapshot = contained(runRoot, path.resolve(projectRoot, snapshotPath), 'Issuer page snapshot');
      const pageBytes = fs.readFileSync(snapshot);
      if (sha256(pageBytes) !== value.page_sha256 || value.page_bytes !== pageBytes.length) throw new Error('Issuer page snapshot hash/size mismatch');
      if (!pageBytes.toString('utf8').includes(config.scope.handbook_url)) throw new Error('Issuer page snapshot does not contain the exact configured handbook URL');
      if (!['rendered_dom_excerpt', 'rendered_dom_snapshot', 'http_response_body'].includes(value.snapshot_kind)) {
        throw new Error('Issuer snapshot must declare whether bytes are rendered DOM/excerpt or HTTP response body');
      }
      pageSnapshot = {path: slash(path.relative(projectRoot, snapshot)), sha256: value.page_sha256, bytes: pageBytes.length, snapshot_kind: value.snapshot_kind};
    }
    issuerConfirmation = {
      receipt_ref: {path: slash(path.relative(projectRoot, actualFile)), sha256: sha256(bytes)},
      observed_at_utc: value.observed_at_utc, official_page_url: value.page_url,
      observation_method: value.observation_method ?? null, recorder: value.recorded_by,
      page_snapshot_ref: pageSnapshot,
      evidence_strength: pageSnapshot ? (pageSnapshot.snapshot_kind === 'http_response_body' ? 'HASHED_HTTP_RESPONSE_BODY' : 'HASHED_RENDERED_DOM_SNAPSHOT_NOT_HTTP_BYTES') : 'DATED_SUMMARIZED_OBSERVATION_NO_PAGE_SNAPSHOT',
      recorded_effective_date_disposition: value.effective_date_disposition,
      disposition_acceptance: pageSnapshot && edition ? 'recorded_dated_effective_date_debt_not_full_liveness_PASS' : 'not_granted_by_registration',
      proposed_liveness_status: 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT',
    };
  }
  if (edition === null) addDebt('edition_unconfirmed', 'edition', 'No edition has been independently confirmed. Filename/year and law-section headings are not edition evidence.', editionCandidates);
  addDebt('effective_date_unconfirmed', 'effective_date', 'Front-matter law effective dates are recorded as contextual evidence, not promoted to handbook effective date.', dateStatements);
  if (!issuerConfirmation) addDebt('issuer_current_edition_unconfirmed', 'issuer_current_edition_ref', 'No dated issuer current-edition observation was supplied; this offline role does not fetch one.');
  else if (!issuerConfirmation.page_snapshot_ref) addDebt('issuer_observation_unhashed', 'issuer_current_edition_ref',
    'The exact dated observation receipt is pinned, but page_sha256/page_bytes are null. Its summarized statements are not a hashed issuer-page snapshot.', [issuerConfirmation.receipt_ref]);
  if (issuerConfirmation && (!issuerConfirmation.page_snapshot_ref || !edition)) addDebt('effective_date_disposition_unaccepted', 'effective_date_disposition',
    'The issuer receipt proposes an effective-date debt disposition. Registration records it but cannot grant acceptance or change the frozen liveness status contract.', [issuerConfirmation.receipt_ref]);
  if (emptyPages.length) addDebt('image_only_pages_need_review', 'rights_and_frontmatter_review', `Physical PDF pages ${emptyPages.join(', ')} contain no extractable text. A scoped visual annotation, if bound, resolves only its stated observation; no OCR or complete visual clearance is claimed.`);
  addDebt('rights_review_incomplete', 'rights_notices', 'Text-matched attributions are captured verbatim. Absence of a copyright text match is not redistribution permission; image-only pages remain unreviewed.', notices);
  const recordedRetrieval = config.scope.handbook_retrieved_at_utc;
  const retrievedAt = isDateTime(recordedRetrieval) ? recordedRetrieval : null;
  addDebt(retrievedAt ? 'retrieval_assertion_not_independently_verified' : 'retrieval_time_unknown', 'retrieved_at',
    retrievedAt ? 'Date is the existing run-config download assertion, bound by config hash; no independent HTTP/download receipt was found or fabricated.' : 'No valid recorded download timestamp exists. Local mtime and current registration time are not retrieval evidence.', [configRef]);
  const officialUrl = typeof config.scope.handbook_url === 'string' ? config.scope.handbook_url : null;
  const officialLocator = officialUrl !== null && onIssuerDomain(officialUrl);
  if (!officialLocator) addDebt('official_locator_unverified', 'official_url', `Configured locator is not on the declared HTTPS issuer domain(s): ${issuerDomains.join(', ')}.`, [configRef]);
  const liveness = retrievedAt && officialLocator ? {
    source_ref: sourceRef, snapshot_sha256: sourceHash, official_url: officialUrl,
    source_tier: 'issuer', retrieved_at: retrievedAt, edition,
    effective_date: effectiveDate, issuer_current_edition_ref: issuerConfirmation?.receipt_ref.path ?? null,
    issuer_current_edition_sha256: issuerConfirmation?.receipt_ref.sha256 ?? null,
    verified_by: {actor_id: 'role15-offline-registration-script', provider_family: 'script'},
    status: issuerConfirmation?.page_snapshot_ref && edition && sourceHash === config.scope.handbook_sha256
      ? 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT' : 'VERIFICATION_DEBT',
    ...(issuerConfirmation?.page_snapshot_ref && edition && sourceHash === config.scope.handbook_sha256
      ? {effective_date_disposition_ref: issuerConfirmation.receipt_ref} : {}),
  } : null;
  const combinedText = extraction.pages.map(p => `\n=== PHYSICAL PDF PAGE ${p.pdf_page}; PRINTED ${p.printed_page ?? 'UNOBSERVED'} ===\n${p.text}\n`).join('');
  const pageMapHash = sha256(jsonBytes(pageMap));
  const sourceTextHash = sha256(Buffer.from(combinedText, 'utf8'));
  const privateTextPath = 'sources/private/15-source-text.txt';
  const extractionReceipt = {
    schema_version: 'nova.local.source-text-extraction.v0.4.0', role_id: '15', run_id: config.run_id,
    status: emptyPages.length ? 'HOLD' : 'PASS',
    status_scope: 'text_extraction_only_not_source_liveness_or_rights_clearance',
    source_document_sha256: sourceHash, extracted_text_sha256: sourceTextHash,
    page_map_sha256: pageMapHash, page_count: extraction.page_count,
    image_only_physical_pages: emptyPages, tool_versions: extraction.tool_versions,
    method: 'pypdf text extraction and pdfplumber physical footer crop; no OCR',
  };
  const registry = {
    schema_version: '1.0.0', registry_version: '0.4.0.offline-registration',
    minted_by: {model: 'deterministic-script:no-model', lane: 'tool_assisted', pass: 'registration-plan'},
    probe: stateCode === 'ut' ? 'rdmv-ut-class-d' : productId, run_id: config.run_id, status: 'HOLD',
    registration_authority: 'local deterministic registration only; no content acceptance or execution grant',
    input_config: configRef, source_liveness_status: liveness?.status ?? 'VERIFICATION_DEBT',
    sources: [{
      source_ref: sourceRef, publisher: stateCode === 'ut' ? 'Utah Driver License Division' : String(config.scope.issuing_authority ?? 'issuer'),
      title: extraction.metadata['/Title'] ?? null, locator: officialUrl,
      snapshot_ref: snapshotPath, snapshot_hash: sourceHash, snapshot_bytes: sourceBytes.length,
      trust_tier: officialLocator && issuerEvidence.length ? 'official_body' : 'unverified',
      is_official: officialLocator && issuerEvidence.length > 0,
      authority_basis: 'Private PDF issuer text and configured official locator; issuer current-edition confirmation remains missing.',
      retrieved_at: retrievedAt, retrieval_evidence: {kind: 'recorded_run_config_assertion', config_ref: configRef, independently_verified: false},
      edition, effective_date: effectiveDate, refresh_cadence: '30d',
      issuer_current_edition_observation: issuerConfirmation,
      expires_or_review_by: null, refresh_status: 'verification_required_before_fact_use',
      anchors_high_risk: false, high_risk_kinds: ['law', 'safety'],
      status: 'pending_verification',
      fact_authority_eligible: liveness?.status === 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT',
      independent_fact_audit_status: 'pending07/08',
      rights_posture: 'fact-authority candidate only; PDF/text/images not redistributed; no rights clearance claimed',
      page_count: extraction.page_count, page_map_sha256: pageMapHash,
      frontmatter: {edition_statement_candidates: editionCandidates, contextual_date_statements: dateStatements, issuer_evidence: issuerEvidence,
        visual_observation_ref: visualObservationRef, visual_observations: visualObservation?.observations ?? [],
        visual_observer: visualObservation?.observed_by ?? null},
      rights_or_attribution_evidence: notices,
      pdf_metadata: extraction.metadata,
    }],
    decoder: {kind: 'installed_local_python', python_path: pythonPath,
      packages: extraction.tool_versions, writes: false, network: false, ocr_performed: false},
    // Same page IDs as page_map let existing registryCodes consumers resolve them.
    pages: pageMap.pages.map(({page_id, source_ref, pdf_page, printed_page, text_sha256}) => ({page_id, source_ref, pdf_page, printed_page, text_sha256})),
    high_risk_gate: {high_risk_facts: 0, anchored_by_official_or_regulator: 0, rejected_low_trust: [], status: 'BLOCKED_PENDING_SOURCE_EVIDENCE'},
    verification_debt: debt,
  };
  const source = {
    source_ref: sourceRef, path: snapshotPath, sha256: sourceHash, bytes: sourceBytes.length,
    config_ref: configRef, configured_hash_matches: sourceHash === config.scope.handbook_sha256,
    pdf_page_count: extraction.page_count, printed_page_count: pageMap.pages.filter(p => p.printed_page !== null).length,
    page_map_sha256: pageMapHash, extracted_text_sha256: sourceTextHash,
    recorded_retrieved_at: retrievedAt, retrieval_basis: 'run_config_assertion_only',
    edition, visual_observation_ref: visualObservationRef,
    issuer_confirmation: issuerConfirmation,
    fact_authority_eligible: liveness?.status === 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT',
    independent_fact_audit_status: 'pending07/08',
    no_network: true, no_models: true, original_pdf_copied: false,
  };
  const writePlan = [
    {path: '15-source-registry.json', sha256: sha256(jsonBytes(registry)), value_key: 'registry', visibility: 'private_run_only'},
    {path: '15-page-map.json', sha256: pageMapHash, value_key: 'pageMap', visibility: 'private_run_only'},
    ...(liveness ? [{path: '15-source-liveness.json', sha256: sha256(jsonBytes(liveness)), value_key: 'liveness', visibility: 'private_run_only'}] : []),
    {path: privateTextPath, sha256: sourceTextHash, value_key: 'privateArtifacts[0].contents', visibility: 'private_only'},
    {path: 'sources/private/15-extraction-receipt.json', sha256: sha256(jsonBytes(extractionReceipt)), value_key: 'privateArtifacts[1].value', visibility: 'private_only'},
  ];
  return {
    registry, pageMap, liveness, status: 'HOLD', verification_debt: debt, source, writePlan,
    privateArtifacts: [
      {path: privateTextPath, contents: combinedText, sha256: sourceTextHash, encoding: 'utf8', private_only: true},
      {path: 'sources/private/15-extraction-receipt.json', value: extractionReceipt, sha256: sha256(jsonBytes(extractionReceipt)), private_only: true},
    ],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === MODULE_PATH) {
  try {
    const args = process.argv.slice(2);
    if (args.includes('--register') || args.includes('--go')) throw new Error('This role never writes or executes. The controller must persist buildRegistration() output under its executor lock.');
    const permitted = new Set(['--run-config', '--python', '--project-root', '--observation', '--issuer-confirmation']);
    const opts = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!permitted.has(args[i]) || !args[i + 1]) throw new Error(`Unknown/missing option: ${args[i]}`);
      opts[{'--run-config': 'runConfigPath', '--python': 'pythonPath', '--project-root': 'projectRoot', '--observation': 'observationPath', '--issuer-confirmation': 'issuerConfirmationPath'}[args[i]]] = args[i + 1];
    }
    const result = await buildRegistration(opts);
    process.stdout.write(JSON.stringify({mode: 'dry_run', writes_performed: 0, status: result.status,
      source: result.source, liveness: result.liveness, verification_debt: result.verification_debt,
      writePlan: result.writePlan, note: 'No source text emitted. Use buildRegistration() inside the locked controller to persist the private plan.'}, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(`Role15 registration blocked: ${error.message}\n`);
    process.exitCode = 1;
  }
}
