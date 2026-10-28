import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {sha256, writeImmutable, verifyRef} from '../../tools/belt/atomic-file.mjs';
import {assembleContext, inspectAccepted02Replacement} from '../../tools/belt/context.mjs';
import {acceptedRuntimeRefs, readNativeSnapshot, authoringKey, acceptDossier} from '../../tools/belt/dispatch.mjs';
import {openLedger} from '../../tools/belt/ledger.mjs';
import {acquireExecutorLock} from '../../tools/belt/executor-lock.mjs';
import {runArtifactTask} from '../../tools/belt/artifact-task.mjs';
import {validateArtifact} from '../../tools/belt/post-validate.mjs';
import {compileDossier} from '../../tools/belt/compile.mjs';
import {mappedCompensatingChecks} from '../../tools/wrap-post-validation-receipt.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const STAGE = '02.dossier_sections';
const SECTION = ['synthetic-section'];
const NOW = '2026-10-28T20:00:00Z';
const clone = value => JSON.parse(JSON.stringify(value));
const pass = {status: 'PASS', checks: [{check_id: 'SYNTHETIC.ACCEPT', status: 'PASS'}], errors: []};

async function fixture(t) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-accepted-replacement-'));
  const runId = 'synthetic-run', runDir = path.join(projectRoot, 'runs', runId);
  fs.mkdirSync(runDir, {recursive: true});
  const lockHandle = acquireExecutorLock({runDir, runId, executorId: 'synthetic-builder'});
  let tick = Date.parse('2026-10-28T18:00:00Z');
  const ledger = openLedger({dbPath: path.join(runDir, 'ledger/run.sqlite'), lockHandle, clock: () => new Date(tick++).toISOString()});
  const fence = ledger.claimRun({runId, bindingSha256: '1'.repeat(64), mode: 'execute',
    budget: {currency: 'USD', total_usd: 10, providers: {meta: {total_usd: 10, per_call_usd: 1}}, roles: {'02': {total_usd: 10, per_call_usd: 1}, '15': {total_usd: 0, per_call_usd: 0}}}});
  t.after(() => {
    ledger.releaseRun(fence); ledger.close(); lockHandle.release();
    assert.equal(path.dirname(projectRoot), path.resolve(os.tmpdir()));
    assert.ok(path.basename(projectRoot).startsWith('nova-accepted-replacement-'));
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });
  const save = (relative, value, bytes = false) => writeImmutable(projectRoot, relative, value, {lockHandle, bytes});
  const sourceRegistryRef = save(`runs/${runId}/source.json`, {pages: {'SYN-HB': {title: 'Synthetic handbook', tier: 'official'}}});
  const pageMapRef = save(`runs/${runId}/map.json`, {source_ref: 'SYN-HB', pages: [1, 2].map(n => ({
    page_map_id: 'syn-pm0' + n, page_id: 'SYN-HB#p.' + n, source_ref: 'SYN-HB', pdf_page: n, printed_page: String(n), source_document_sha256: 'b'.repeat(64)}))});
  const sourceTextRef = save(`runs/${runId}/source.txt`, 'SYNTHETIC SOURCE: A full stop is required at a red octagonal sign before crossing the marked stop line.', true);
  const bindings = Object.fromEntries(['overlay', 'policy', 'media_disposition'].map(kind => [kind, save(`contracts/${kind}.json`, kind === 'overlay' ? {role_overrides: {
    '16': {implementation: 'deterministic_merge_and_fact_index'}, '17': {disposition: 'n/a_pilot', reason: 'Synthetic test retains accepted hints.'}}} : {kind: 'synthetic_policy'})]));
  let serial = 0;
  const accept = async (value, parts, extra = {}, stageId = STAGE, companions = null) => {
    const task = ledger.ensureTask(fence, {lineageId: 'synthetic-lineage-' + (++serial), stageId, roleId: stageId.split('.')[0],
      inputs: [], versions: {synthetic: '2'.repeat(64)}, model: null, config: {...(parts ? {section_ids: SECTION, dossier_parts: parts} : {}), ...extra}});
    return runArtifactTask({ledger, fence, lockHandle, runDir, task, produce: () => value,
      validate: () => ({...pass, ...(companions ? {companions} : {})}), accept: () => ({status: 'PASS', kind: 'synthetic_test_only'}), requiredChecks: ['SYNTHETIC.ACCEPT']});
  };
  await accept({artifact_type: 'synthetic_source_registration'}, null, {}, '15.sources', [
    {...sourceRegistryRef, kind: 'source_registry'}, {...pageMapRef, kind: 'page_map'}, {...sourceTextRef, kind: 'source_text'}]);
  const full = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/belt/fixtures/02.dossier_sections/synthetic-positive.json'), 'utf8'));
  delete full._fixture;
  full.lineage.source_registry_sha256 = sourceRegistryRef.sha256;
  const partialC = () => {
    const value = clone(full);
    value.sections = value.sections.filter(s => s.section_id === 'C');
    value.sections[0].merge_seq = 1;
    value.envelope_scope = {kind: 'partial_chunk', assigned_section_ids: ['C'], chunk_index: 1, chunk_total: 1};
    value.merge.expected_merged_sha256 = null;
    value.exam_facts = Object.fromEntries(Object.keys(value.exam_facts).map(key => [key, {value: null, status: 'unknown', source_page: null}]));
    value.verification_debt = []; value.g_matrix = [];
    value.market_signal = {origin: 'sme', origin_note: 'Synthetic C part; market research belongs to E.', disposition: 'scoped_out', chunk_ids: [], debt_refs: []};
    return value;
  };
  const older = partialC(); older.lineage.candidate_lineage_id = 'synthetic-older';
  await accept(older, ['C']);
  const targetValue = partialC();
  await accept(targetValue, ['C']);
  const rest = clone(full); rest.sections = rest.sections.filter(s => s.section_id !== 'C');
  rest.sections.forEach((s, index) => {s.merge_seq = index + 1;});
  rest.envelope_scope = {kind: 'partial_chunk', assigned_section_ids: rest.sections.map(s => s.section_id), chunk_index: 1, chunk_total: 1};
  rest.merge.expected_merged_sha256 = null; rest.high_yield_ranked = [];
  await accept(rest, rest.envelope_scope.assigned_section_ids);
  const refs = () => acceptedRuntimeRefs(readNativeSnapshot(runDir, {run_id: runId}), projectRoot, runDir, {sectionIds: SECTION});
  const target = refs().filter(r => r.kind === STAGE && JSON.parse(r.identity).config.dossier_parts.join() === 'C').sort((a, b) => a.accepted_at.localeCompare(b.accepted_at)).at(-1);
  const evidence = save(`runs/${runId}/receipts/correction-evidence/source-check.json`, {source_ref: sourceTextRef, page_map_ref: pageMapRef,
    fact_id: 'F1', source_page: 'SYN-HB#p.2', qualifier: 'before crossing the marked stop line', finding: 'Accepted wording omitted the source qualifier.'});
  const proof = {schema_version: 'nova-accepted-part-replacement.v1', status: 'PASS', kind: 'source_supported_fact_correction',
    authority_scope: 'submission_only_not_factual_acceptance', run_id: runId, stage_id: STAGE, section_ids: SECTION, part_ids: ['C'],
    supersedes: [{artifact_id: target.artifact_id, task_id: target.task_id, path: target.path, sha256: target.sha256}],
    source_evidence_refs: [{path: evidence.path, sha256: evidence.sha256}], reason: 'Restore F1 marked-stop-line qualifier from pinned source evidence.',
    recorded_by: {actor_id: 'synthetic-reviewer', session_id: 'synthetic-review-session', provider_family: 'engineering_test'},
    recorded_at: '2026-10-28T19:00:00Z', content_calls_authorized: false};
  const replacementRef = save(`runs/${runId}/receipts/replacement.json`, proof);
  const options = {projectRoot, runDir, runId, stageId: STAGE, sectionIds: SECTION, partIds: ['C'], nowUtc: NOW};
  const context = (replacement = replacementRef) => assembleContext({...options, runRoot: runDir, bindings, acceptedArtifacts: refs(), replacementRef: replacement});
  const corrected = partialC();
  corrected.sections[0].markdown = corrected.sections[0].markdown.replace('sign [P2]', 'sign before crossing the marked stop line [P2]');
  corrected.sections[0].char_count = [...corrected.sections[0].markdown].length;
  return {projectRoot, runDir, runId, ledger, fence, lockHandle, save, accept, refs, context, options, proof, replacementRef, target, corrected, sourceRegistryRef, pageMapRef, overlayRef: bindings.overlay};
}

test('qualifier replacement uses standard context/checks and keeps all accepted provenance/history', async t => {
  const f = await fixture(t);
  const before = f.refs();
  assert.equal(typeof before.find(r => r.kind === STAGE).identity, 'string', 'native parsed identity must serialize for compiler');
  const legacy = f.context(null);
  const legacyArtifact = clone(f.corrected); legacyArtifact.lineage.input_manifest_sha256 = legacy.context.input_manifest_sha256;
  const conflict = await validateArtifact({stage_id: STAGE, artifact: legacyArtifact, context: legacy.context});
  assert.equal(conflict.checks.find(c => c.check_id === '02.MERGE_DETERMINISTIC').status, 'FAIL');
  const assembled = f.context();
  assert.equal(assembled.status, 'PASS', assembled.missing.join(';'));
  assert.equal(assembled.context.sibling_envelopes.length, 1, 'latest exact part-set siblings exclude only named target');
  for (const old of before.filter(r => r.kind === STAGE)) assert.ok(assembled.inputRefs.some(r => r.sha256 === old.sha256));
  assert.ok(assembled.inputRefs.some(r => r.kind === 'accepted02_replacement_proof' && r.sha256 === f.replacementRef.sha256));
  assert.ok(assembled.inputRefs.some(r => r.kind === 'superseded_acceptance'));
  f.corrected.lineage.input_manifest_sha256 = assembled.context.input_manifest_sha256;
  const validation = await validateArtifact({stage_id: STAGE, artifact: f.corrected, context: assembled.context});
  const mapping = JSON.parse(fs.readFileSync(path.join(ROOT, 'schemas-strict/02-sme-dossier-envelope.mapping.json'), 'utf8'));
  const checks = mappedCompensatingChecks(mapping, STAGE).check_ids;
  assert.equal(validation.status, 'PASS', JSON.stringify(validation.checks.filter(c => c.status !== 'PASS')));
  assert.equal(acceptDossier(validation, checks).status, 'PASS');
  await f.accept(f.corrected, ['C'], {replacement_ref: {path: f.replacementRef.path, sha256: f.replacementRef.sha256}});
  const after = f.refs();
  for (const old of before) verifyRef(old, f.projectRoot);
  assert.equal(after.filter(r => r.kind === STAGE).length, before.filter(r => r.kind === STAGE).length + 1);
  const inspection = inspectAccepted02Replacement({...f.options, acceptedArtifacts: after, replacementRef: f.replacementRef});
  assert.equal(inspection.status, 'PASS'); assert.ok(inspection.acceptedReplacement);
  const compiled = compileDossier({projectRoot: f.projectRoot, runRoot: f.runDir, acceptedEnvelopes: after.filter(r => r.kind === STAGE),
    sourceRegistryRef: {...f.sourceRegistryRef, accepted: true}, pageMapRef: {...f.pageMapRef, accepted: true}, overlayRef: f.overlayRef});
  assert.equal(compiled.status, 'PASS', compiled.errors.join(';'));
  assert.match(compiled.factRegistry.facts.F1.statement, /before crossing the marked stop line/);
  assert.ok(compiled.blueprint.superseded_envelopes.some(r => r.sha256 === f.target.sha256));
  assert.ok(!compiled.blueprint.input_refs.some(r => r.sha256 === f.target.sha256));
  assert.equal(f.ledger.listModelCalls(f.runId).length, 0);
  assert.equal(f.ledger.listReservations(f.runId).length, 0);
});

test('missing/mismatched/foreign or spend-grant replacement proofs fail closed', async t => {
  const f = await fixture(t);
  const inspect = replacementRef => inspectAccepted02Replacement({...f.options, acceptedArtifacts: f.refs(), replacementRef});
  assert.equal(inspect(null).status, 'HOLD');
  const changes = [
    {run_id: 'foreign-run'}, {stage_id: '03.combined_kg'}, {section_ids: ['foreign-section']}, {part_ids: ['C2']},
    {supersedes: [{...f.proof.supersedes[0], artifact_id: 'unaccepted-artifact'}]},
    {supersedes: [{...f.proof.supersedes[0], sha256: 'f'.repeat(64)}]},
    {source_evidence_refs: []}, {content_calls_authorized: true}, {spend_authorized: true}, {reason: ''},
    {recorded_at: '2026-10-29T00:00:00Z'}, {recorded_by: {actor_id: 'actor'}},
  ];
  for (const [index, change] of changes.entries()) {
    const proofRef = f.save(`runs/${f.runId}/receipts/invalid-${index}.json`, {...f.proof, ...change});
    assert.equal(inspect(proofRef).status, 'HOLD', JSON.stringify(change));
    assert.equal(f.context(proofRef).status, 'HOLD');
  }
  const foreign = f.save('runs/foreign-run/proof.json', f.proof);
  assert.equal(inspect(foreign).status, 'HOLD');
  const externalEvidence = f.save('scratch/evidence.json', {finding: 'outside run'});
  const externalProof = f.save(`runs/${f.runId}/receipts/external-evidence.json`, {...f.proof, source_evidence_refs: [{path: externalEvidence.path, sha256: externalEvidence.sha256}]});
  assert.equal(inspect(externalProof).status, 'HOLD');
  fs.appendFileSync(f.replacementRef.path, ' ');
  assert.equal(inspect(f.replacementRef).status, 'HOLD');
  assert.equal(f.ledger.listModelCalls(f.runId).length, 0);
});

test('a newer distinct accepted target makes a prior proof stale', async t => {
  const f = await fixture(t);
  await f.accept(f.corrected, ['C']);
  const result = inspectAccepted02Replacement({...f.options, acceptedArtifacts: f.refs(), replacementRef: f.replacementRef});
  assert.equal(result.status, 'HOLD'); assert.match(result.blockers.join(';'), /target_stale/);
});

test('replacement identity cannot reuse ordinary outboxes and malformed duplicates still fail mapped checks', async t => {
  const f = await fixture(t), assembled = f.context();
  const ordinary = authoringKey(STAGE, SECTION, ['C'], 0);
  const replacement = authoringKey(STAGE, SECTION, ['C'], 0, f.replacementRef.sha256);
  assert.notEqual(ordinary, replacement); assert.equal(ordinary, '02.dossier_sections__synthetic-section__C__n0');
  assert.equal(replacement, authoringKey(STAGE, SECTION, ['C'], 0, f.replacementRef.sha256));
  assert.throws(() => authoringKey(STAGE, SECTION, ['C'], 0, 'partial-hash'), /exact proof hash/);
  const malformed = clone(f.corrected); malformed.lineage.input_manifest_sha256 = assembled.context.input_manifest_sha256;
  malformed.sections.push(clone(malformed.sections[0]));
  const validation = await validateArtifact({stage_id: STAGE, artifact: malformed, context: assembled.context});
  assert.equal(validation.status, 'FAIL');
  assert.equal(validation.checks.find(c => c.check_id === '02.MERGE_DETERMINISTIC').status, 'FAIL');
  assert.equal(acceptDossier(validation, validation.checks.map(c => c.check_id)).status, 'HOLD');
  assert.equal(f.ledger.listModelCalls(f.runId).length, 0);
});

function revisionContextFixture(t) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-source-context-'));
  const runRoot = path.join(projectRoot, 'runs', 'synthetic-revision');
  fs.mkdirSync(runRoot, {recursive: true});
  t.after(() => {
    assert.equal(path.dirname(projectRoot), path.resolve(os.tmpdir()));
    assert.ok(path.basename(projectRoot).startsWith('nova-source-context-'));
    fs.rmSync(projectRoot, {recursive: true, force: true});
  });
  const save = (name, data, kind, inputs = []) => ({...writeImmutable(projectRoot, name, data, {bytes: kind === 'source_text'}),
    kind, accepted: true, identity: JSON.stringify({inputs})});
  const local = (name, data, kind, inputs) => save('runs/synthetic-revision/' + name, data, kind, inputs);
  const bindings = Object.fromEntries(['overlay', 'policy', 'media_disposition'].map(kind => [kind, save('contracts/' + kind + '.json', {}, kind)]));
  const oldSource = local('source-v1.json', {sources: []}, 'source_registry');
  const source = local('source-v2.json', {sources: [], source_revision: {reconciliation_required: true, previous_registry_ref: oldSource}}, 'source_registry');
  const oldMap = local('map-v1.json', {pages: []}, 'page_map');
  const pageMap = local('map-v2.json', {pages: [], revision: 2}, 'page_map');
  const text = local('source.txt', 'Synthetic source text.', 'source_text');
  const learning = local('learning.json', {}, 'learning_loop');
  const oldFacts = local('facts-v1.json', {source_registry_sha256: oldSource.sha256, page_map_sha256: oldMap.sha256, facts: {}}, 'fact_registry');
  const oldCompile = local('compiled-v1.json', {source_registry_sha256: oldSource.sha256, page_map_sha256: oldMap.sha256, fact_registry_sha256: oldFacts.sha256}, 'compiled_dossier');
  const facts = local('facts-v2.json', {source_registry_sha256: source.sha256, page_map_sha256: pageMap.sha256, facts: {}}, 'fact_registry');
  const compiled = local('compiled-v2.json', {source_registry_sha256: source.sha256, page_map_sha256: pageMap.sha256, fact_registry_sha256: facts.sha256}, 'compiled_dossier');
  const current = [source, pageMap, compiled, facts];
  const old = [oldSource, oldMap, oldCompile, oldFacts];
  const base = [source, pageMap, text, learning];
  const assemble = (stageId, refs) => assembleContext({projectRoot, runRoot, bindings, stageId, acceptedArtifacts: refs, nowUtc: NOW});
  return {local, old, current, base, oldFacts, oldCompile, facts, compiled, source, pageMap, assemble};
}

test('a selected source revision holds old compile/index bindings while upstream repair remains available', t => {
  const f = revisionContextFixture(t);
  const stale = [...f.base, f.oldCompile, f.oldFacts];
  const downstream = f.assemble('03.combined_kg', stale);
  assert.equal(downstream.status, 'HOLD');
  assert.ok(downstream.missing.includes('source_reconciliation:compiled_dossier_source_registry_mismatch'));
  assert.ok(downstream.missing.includes('source_reconciliation:fact_registry_page_map_mismatch'));
  assert.equal(f.assemble(STAGE, stale).status, 'PASS', '02 remains available to reconcile source-bound envelopes');
  const fresh = f.assemble('03.combined_kg', [...f.base, f.compiled, f.facts]);
  assert.equal(fresh.status, 'PASS', fresh.missing.join(';'));
  const mismatchedIndex = f.local('compiled-wrong-index.json', {source_registry_sha256: f.source.sha256,
    page_map_sha256: f.pageMap.sha256, fact_registry_sha256: f.oldFacts.sha256}, 'compiled_dossier');
  assert.ok(f.assemble('03.combined_kg', [...f.base, mismatchedIndex, f.facts]).missing.includes('source_reconciliation:compiled_fact_registry_mismatch'));
});

test('revised sources require exact fresh KG/card provenance before downstream content can consume them', t => {
  const f = revisionContextFixture(t), fresh = [...f.base, f.compiled, f.facts];
  const oldKg = f.local('kg-v1.json', {modules: [], nodes: []}, 'knowledge_graph', f.old);
  const unknownKg = f.local('kg-unknown.json', {modules: [], nodes: [], note: 'missing accepted identity inputs'}, 'knowledge_graph');
  for (const kg of [oldKg, unknownKg]) {
    const held = f.assemble('04.cards', [...fresh, kg]);
    assert.equal(held.status, 'HOLD');
    assert.ok(held.missing.includes('source_reconciliation:knowledge_graph_source_registry_provenance_mismatch'));
  }
  const kg = f.local('kg-v2.json', {modules: [], nodes: [], revision: 2}, 'knowledge_graph', f.current);
  assert.equal(f.assemble('04.cards', [...fresh, kg]).status, 'PASS');
  const staleCards = f.local('cards-v1.json', {decks: []}, 'carddeck', [...f.old, oldKg]);
  const mixedCards = f.local('cards-mixed.json', {decks: [], revision: 'mixed'}, 'carddeck', [...f.current, oldKg]);
  for (const cards of [staleCards, mixedCards]) {
    const held = f.assemble('05.card_scripts', [...fresh, kg, cards]);
    assert.equal(held.status, 'HOLD');
    assert.ok(held.missing.some(reason => reason.startsWith('source_reconciliation:carddeck_')));
  }
  const cards = f.local('cards-v2.json', {decks: [], revision: 2}, 'carddeck', [...f.current, kg]);
  const ready = f.assemble('05.card_scripts', [...fresh, kg, cards]);
  assert.equal(ready.status, 'PASS', ready.missing.join(';'));
});
