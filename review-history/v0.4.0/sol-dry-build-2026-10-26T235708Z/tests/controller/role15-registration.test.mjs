import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {buildRegistration} from '../../tools/roles/15-register.mjs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const hash = value => createHash('sha256').update(value).digest('hex');
const rolePath = path.resolve(import.meta.dirname, '../../tools/roles/15-register.mjs');

// Tiny synthetic PDF: no real handbook data is copied to a fixture.
function pdf(pages) {
  const objects = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = `<< /Type /Pages /Kids [${pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  const literal = value => value.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)');
  pages.forEach((lines, index) => {
    const pageId = 4 + index * 2;
    const content = lines.map(({text, y}) => `BT /F1 12 Tf 40 ${y} Td (${literal(text)}) Tj ET`).join('\n');
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${pageId + 1} 0 R >>`;
    objects[pageId + 1] = `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`;
  });
  let body = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id++) {
    offsets.push(Buffer.byteLength(body));
    body += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const start = Buffer.byteLength(body);
  body += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  body += offsets.slice(1).map(offset => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  body += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF\n`;
  return Buffer.from(body);
}

function fixture(t, patch = {}) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-role15-test-'));
  t.after(() => fs.rmSync(projectRoot, {recursive: true, force: true}));
  const runId = '2026-10-26-rdmv-ut-class-d';
  const runRoot = path.join(projectRoot, 'runs', runId);
  const privateRoot = path.join(runRoot, 'sources', 'private');
  fs.mkdirSync(privateRoot, {recursive: true});
  const bytes = pdf([
    [
      {text: 'UTAH DRIVER HANDBOOK', y: 730},
      {text: 'Utah Driver License Division', y: 710},
      {text: 'Front cover photo courtesy of Synthetic Photographer', y: 690},
      {text: 'NEW 2026 LAWS', y: 670},
      {text: 'Effective May 6, 2026', y: 650},
    ],
    [{text: 'Synthetic chapter', y: 730}, {text: '1', y: 16}],
    [],
  ]);
  const pdfPath = path.join(privateRoot, 'handbook.pdf');
  fs.writeFileSync(pdfPath, bytes);
  const runConfigPath = `runs/${runId}/run-config.json`;
  const config = {
    run_id: runId, execution_enabled: false,
    scope: {
      jurisdiction: 'US-UT', handbook_url: 'https://dld.utah.gov/synthetic.pdf',
      handbook_local_snapshot: `runs/${runId}/sources/private/handbook.pdf`,
      handbook_sha256: hash(bytes), handbook_snapshot_bytes: bytes.length,
      handbook_retrieved_at_utc: '2026-10-26T23:27:22.083Z', ...patch,
    },
  };
  fs.writeFileSync(path.join(projectRoot, runConfigPath), JSON.stringify(config));
  return {projectRoot, runConfigPath, pdfPath, runRoot};
}

test('registration is deterministic, offline and performs no filesystem writes', async t => {
  const f = fixture(t);
  const before = fs.readdirSync(f.runRoot, {recursive: true}).sort();
  const first = await buildRegistration(f);
  const second = await buildRegistration(f);
  assert.deepEqual(first, second);
  assert.deepEqual(fs.readdirSync(f.runRoot, {recursive: true}).sort(), before);
  assert.equal(first.status, 'HOLD');
  assert.equal(first.source.no_network, true);
  assert.equal(first.source.no_models, true);
  assert.equal(first.source.original_pdf_copied, false);
  assert.equal(first.registry.sources[0].anchors_high_risk, false);
  assert.equal(first.registry.sources[0].fact_authority_eligible, false);
  for (const artifact of first.privateArtifacts) assert.match(artifact.path, /^sources\/private\//);
});

test('physical pages, PDF labels, observed printed IDs and exact evidence stay distinct', async t => {
  const r = await buildRegistration(fixture(t));
  assert.equal(r.pageMap.page_count, 3);
  assert.deepEqual(r.pageMap.pages.map(p => [p.pdf_page, p.pdf_label, p.printed_page]), [[1, '1', null], [2, '2', '1'], [3, '3', null]]);
  assert.match(r.pageMap.pages[1].page_map_id, /:pdf-0002$/);
  assert.equal(r.pageMap.pages[1].printed_page_evidence.verbatim, '1');
  assert.equal(r.pageMap.pages[1].source_document_sha256, r.source.sha256);
  assert.match(r.pageMap.pages[1].text_sha256, /^[a-f0-9]{64}$/);
  const notice = r.registry.sources[0].rights_or_attribution_evidence.find(n => n.verbatim.includes('courtesy'));
  assert.equal(notice.verbatim, 'Front cover photo courtesy of Synthetic Photographer');
  assert.equal(notice.pdf_page, 1);
  assert.equal(notice.source_document_sha256, r.source.sha256);
});

test('law dates and filename hints never become handbook edition/liveness PASS', async t => {
  const r = await buildRegistration(fixture(t));
  const source = r.registry.sources[0];
  assert.equal(source.edition, null);
  assert.equal(source.effective_date, null);
  assert.equal(source.frontmatter.contextual_date_statements[1].verbatim, 'Effective May 6, 2026');
  assert.equal(r.liveness.status, 'VERIFICATION_DEBT');
  assert.equal(r.liveness.retrieved_at, '2026-10-26T23:27:22.083Z');
  assert.equal(source.retrieval_evidence.independently_verified, false);
  assert.equal(r.liveness.issuer_current_edition_ref, null);
  assert.equal(r.privateArtifacts[1].value.status, 'HOLD');
  assert.ok(r.verification_debt.some(d => d.code === 'image_only_pages_need_review'));
  const ajv = new Ajv2020({strict: false});
  addFormats(ajv);
  const schema = JSON.parse(fs.readFileSync(path.resolve(import.meta.dirname, '../../contracts/source-liveness-receipt.schema.json'), 'utf8'));
  const validate = ajv.compile(schema);
  assert.equal(validate(r.liveness), true, JSON.stringify(validate.errors));
  assert.equal(validate({...r.liveness, status: 'PASS'}), false);
});

test('unknown retrieval timestamp produces no invented schema receipt', async t => {
  const r = await buildRegistration(fixture(t, {handbook_retrieved_at_utc: null}));
  assert.equal(r.liveness, null);
  assert.equal(r.source.recorded_retrieved_at, null);
  assert.ok(r.verification_debt.some(d => d.code === 'retrieval_time_unknown'));
  assert.ok(!r.writePlan.some(p => p.value_key === 'liveness'));
});

test('wrong configured hash remains blocking debt and never authorizes facts', async t => {
  const r = await buildRegistration(fixture(t, {handbook_sha256: '0'.repeat(64)}));
  assert.equal(r.source.configured_hash_matches, false);
  assert.equal(r.status, 'HOLD');
  assert.ok(r.verification_debt.some(d => d.code === 'snapshot_hash_mismatch'));
  assert.equal(r.registry.high_risk_gate.status, 'BLOCKED_PENDING_SOURCE_EVIDENCE');
});

test('source outside private root and standalone --register are rejected', async t => {
  const f = fixture(t);
  await assert.rejects(buildRegistration({...f, pdfPath: path.join(f.projectRoot, f.runConfigPath)}), /inside/);
  assert.throws(() => execFileSync(process.execPath, [rolePath, '--register'], {encoding: 'utf8', windowsHide: true, stdio: 'pipe'}), /controller must persist/);
});

function observation(f, changes = {}) {
  const configured = JSON.parse(fs.readFileSync(path.join(f.projectRoot, f.runConfigPath), 'utf8'));
  const value = {
    artifact_type: 'Role15VisualObservation', version: '0.4.0',
    source_document: {path: configured.scope.handbook_local_snapshot, sha256: configured.scope.handbook_sha256},
    observed_by: {actor_id: 'synthetic-test-observer', provider_family: 'human', model: null},
    method: {kind: 'local_pdf_render_visual_inspection', physical_page: 1},
    observations: [{pdf_page: 1, printed_page: null, kind: 'edition', value: 'SYNTHETIC EDITION', verbatim: 'SYNTHETIC EDITION'}],
    declarations: {engineering_observation: true, measured_meta_model_output: false,
      issuer_current_edition_confirmation: false, handbook_effective_date_evidence: false,
      retrieval_time_evidence: false, rights_clearance: false}, ...changes,
  };
  fs.mkdirSync(path.join(f.projectRoot, 'coordination'));
  fs.writeFileSync(path.join(f.projectRoot, 'coordination/observation.json'), JSON.stringify(value));
  return 'coordination/observation.json';
}

test('hashed engineering observation resolves only edition and preserves HOLD', async t => {
  const f = fixture(t);
  const observationPath = observation(f);
  const r = await buildRegistration({...f, observationPath});
  assert.equal(r.source.edition, 'SYNTHETIC EDITION');
  assert.equal(r.liveness.edition, 'SYNTHETIC EDITION');
  assert.equal(r.status, 'HOLD');
  assert.equal(r.liveness.status, 'VERIFICATION_DEBT');
  assert.equal(r.liveness.effective_date, null);
  assert.equal(r.source.visual_observation_ref.sha256, hash(fs.readFileSync(path.join(f.projectRoot, observationPath))));
  assert.ok(!r.verification_debt.some(d => d.code === 'edition_unconfirmed'));
  assert.ok(r.verification_debt.some(d => d.code === 'issuer_current_edition_unconfirmed'));
});

test('visual observation cannot bind another snapshot or physical page scope', async t => {
  const f = fixture(t);
  const observationPath = observation(f, {source_document: {path: 'other.pdf', sha256: '0'.repeat(64)}});
  await assert.rejects(buildRegistration({...f, observationPath}), /matching source hash\/path/);
  const target = path.join(f.projectRoot, observationPath);
  const value = JSON.parse(fs.readFileSync(target, 'utf8'));
  const configured = JSON.parse(fs.readFileSync(path.join(f.projectRoot, f.runConfigPath), 'utf8'));
  value.source_document = {path: configured.scope.handbook_local_snapshot, sha256: configured.scope.handbook_sha256};
  value.observations[0].pdf_page = 2;
  fs.writeFileSync(target, JSON.stringify(value));
  await assert.rejects(buildRegistration({...f, observationPath}), /physical-page scope/);
});
