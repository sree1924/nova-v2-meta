import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {compileDossier} from '../../tools/belt/compile.mjs';
import {jsonBytes, sha256} from '../../tools/belt/atomic-file.mjs';
import {mergeSections} from '../../tools/belt/checks/02-dossier-sections.mjs';

const sourceFixture = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../tools/belt/fixtures/02.dossier_sections/synthetic-positive.json');
function setup(t, change = () => {}) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-compile-test-'));
  t.after(() => fs.rmSync(projectRoot, {recursive: true, force: true}));
  const runRoot = path.join(projectRoot, 'runs', 'synthetic-run');
  fs.mkdirSync(runRoot, {recursive: true});
  fs.mkdirSync(path.join(projectRoot, 'contracts'));
  const save = (name, value, accepted = true) => {
    const bytes = jsonBytes(value);
    const target = path.join(projectRoot, name);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    fs.writeFileSync(target, bytes);
    return {path: name, sha256: sha256(bytes), accepted};
  };
  const sourceRegistryRef = save('runs/synthetic-run/15-source-registry.json', {sources: [{source_ref: 'SYN-HB'}]});
  const pageMapRef = save('runs/synthetic-run/15-page-map.json', {source_ref: 'SYN-HB', pages: [{
    page_map_id: 'syn-pm02', page_id: 'SYN-HB#p.2', source_ref: 'SYN-HB', pdf_page: 2, printed_page: '1', source_document_sha256: 'b'.repeat(64)}]});
  const overlayRef = save('contracts/overlay.json', {role_overrides: {
    '16': {implementation: 'deterministic_merge_and_fact_index'},
    '17': {disposition: 'n/a_pilot', reason: 'SYNTHETIC pilot retains accepted C2 text without adding hints.'}}}, false);
  const envelope = JSON.parse(fs.readFileSync(sourceFixture, 'utf8'));
  delete envelope._fixture;
  envelope.lineage.source_registry_sha256 = sourceRegistryRef.sha256;
  change(envelope);
  const acceptedEnvelopes = [save('runs/synthetic-run/02.json', envelope)];
  return {projectRoot, runRoot, acceptedEnvelopes, sourceRegistryRef, pageMapRef, overlayRef, save, envelope};
}

test('role16 exact merge/fact index is deterministic and does not write or claim canonical compilation', t => {
  const s = setup(t);
  const before = fs.readdirSync(s.runRoot);
  const a = compileDossier(s);
  assert.deepEqual(a, compileDossier(s));
  assert.deepEqual(fs.readdirSync(s.runRoot), before);
  assert.equal(a.status, 'PASS', a.errors.join(';'));
  assert.equal(a.markdown, mergeSections(s.envelope.sections).markdown);
  assert.equal(a.blueprint.canonical_blueprint_validation_claimed, false);
  assert.equal(a.blueprint.stage17.status, 'n/a_pilot');
  // 2026-10-27: anchor removal no longer leaves " ." — punctuation is closed up (learner-facing: 04 backs equal this statement).
  assert.equal(a.factRegistry.facts.F1.statement, 'A full stop is required at a red octagonal sign.\n- Applies at every marked stop line.');
  assert.equal(a.factRegistry.facts.F1.pdf_page, 2);
  assert.equal(a.factRegistry.facts.F1.printed_page, '1');
  assert.equal(a.factRegistry.facts.F1.status, 'authored');
  assert.equal(a.factRegistry.facts.F1.independent_audit_status, 'pending');
});

test('partial dossier remains HOLD instead of inventing absent master sections', t => {
  const s = setup(t, e => { e.sections = e.sections.filter(s => s.section_id === 'C'); e.merge.expected_merged_sha256 = mergeSections(e.sections).sha256; });
  const r = compileDossier(s);
  assert.equal(r.status, 'HOLD');
  assert.match(r.errors.join(';'), /missing section/);
});

test('unaccepted references and byte drift are rejected', t => {
  const s = setup(t);
  assert.throws(() => compileDossier({...s, acceptedEnvelopes: s.acceptedEnvelopes.map(r => ({...r, accepted: false}))}), /ledger-accepted/);
  fs.appendFileSync(path.join(s.projectRoot, s.acceptedEnvelopes[0].path), ' ');
  assert.throws(() => compileDossier(s), /hash mismatch/);
});

test('ambiguous page locator is not converted into a physical page guess', t => {
  const s = setup(t);
  s.pageMapRef = s.save('runs/synthetic-run/15-page-map.json', {pages: [{page_map_id: 'other', source_ref: 'SYN-HB', pdf_page: 2, printed_page: '2'}]});
  const r = compileDossier(s);
  assert.equal(r.status, 'HOLD');
  assert.match(r.errors.join(';'), /physical page unresolved/);
});

test('duplicate fact spans and undeclared stage17 adaptation cannot pass', t => {
  const s = setup(t, e => { e.sections.find(s => s.section_id === 'C').fact_ids.push('F1'); });
  assert.match(compileDossier(s).errors.join(';'), /Duplicate declared fact ID/);
  s.overlayRef = s.save('contracts/overlay.json', {role_overrides: {'16': {implementation: 'deterministic_merge_and_fact_index'}}}, false);
  assert.throws(() => compileDossier(s), /role17 n\/a_pilot/);
});
