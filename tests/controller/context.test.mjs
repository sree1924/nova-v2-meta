import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {assembleContext} from '../../tools/belt/context.mjs';
import {canonicalJson, jsonBytes, sha256} from '../../tools/belt/atomic-file.mjs';

function setup(t) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nova-context-test-'));
  t.after(() => fs.rmSync(projectRoot, {recursive: true, force: true}));
  const runRoot = path.join(projectRoot, 'runs', 'synthetic-run');
  fs.mkdirSync(runRoot, {recursive: true});
  fs.mkdirSync(path.join(projectRoot, 'contracts'));
  const save = (name, value, kind, accepted = true) => {
    const target = path.join(projectRoot, name);
    fs.mkdirSync(path.dirname(target), {recursive: true});
    const bytes = kind === 'source_text' ? Buffer.from(value) : jsonBytes(value);
    fs.writeFileSync(target, bytes);
    return {path: name, sha256: sha256(bytes), kind, accepted};
  };
  const bindings = Object.fromEntries(['overlay', 'policy', 'media_disposition'].map(key => [key, save(`contracts/${key}.json`, {kind: 'synthetic_policy'}, key, false)]));
  const acceptedArtifacts = [save('runs/synthetic-run/source.json', {sources: []}, 'source_registry'),
    save('runs/synthetic-run/map.json', {pages: []}, 'page_map'), save('runs/synthetic-run/source.txt', 'SYNTHETIC source text only.', 'source_text')];
  return {projectRoot, runRoot, bindings, acceptedArtifacts, save, stageId: '02.dossier_sections', nowUtc: '2026-10-27T06:00:00Z'};
}

test('context is deterministic, exact refs bound, and no file presence grants acceptance', t => {
  const s = setup(t);
  const before = fs.readdirSync(s.runRoot);
  const a = assembleContext(s);
  const b = assembleContext({...s, acceptedArtifacts: [...s.acceptedArtifacts].reverse()});
  assert.equal(a.status, 'PASS');
  assert.deepEqual(a.context, b.context);
  assert.equal(a.context.input_manifest_sha256, sha256(canonicalJson(a.inputRefs)));
  assert.equal(a.context.now_utc, s.nowUtc);
  assert.equal(a.context.strip_fixture_meta, false);
  assert.deepEqual(fs.readdirSync(s.runRoot), before);
  assert.equal(assembleContext({...s, acceptedArtifacts: []}).status, 'HOLD');
});

test('unaccepted, stale, duplicate, and static-runtime-bypass inputs are rejected', t => {
  const s = setup(t);
  assert.throws(() => assembleContext({...s, acceptedArtifacts: [{...s.acceptedArtifacts[0], accepted: false}]}), /ledger-accepted/);
  assert.throws(() => assembleContext({...s, acceptedArtifacts: [...s.acceptedArtifacts, s.acceptedArtifacts[0]]}), /duplicate/);
  assert.throws(() => assembleContext({...s, bindings: {...s.bindings, fact_registry: s.acceptedArtifacts[0]}}), /static-policy bypass/);
  fs.appendFileSync(path.join(s.projectRoot, s.acceptedArtifacts[0].path), ' ');
  assert.throws(() => assembleContext(s), /hash mismatch/);
});

test('raw unverified numeral stays null and no source acceptance is manufactured', t => {
  const s = setup(t);
  const config = {state_selection: {status: 'confirmed', confirmed_by: 'founder', jurisdiction: 'US-UT'}, scope: {
    jurisdiction: 'US-UT', exam_facts: {passing_percent: {value: 80, status: 'verified_handbook_pdf', source_page: 'p33 (verify)'}}}};
  const configRef = s.save('runs/synthetic-run/run-config.json', config, 'run_config', false);
  const r = assembleContext({...s, config, configRef});
  assert.equal(r.context.exam_facts_view.passing_percent.value, null);
  assert.equal(r.context.exam_facts_view.passing_percent.status, 'unknown');
  assert.deepEqual(r.context.accepted_source_projection.sources, []);
  assert.throws(() => assembleContext({...s, config}), /exact configuration/);
});

test('03 high-yield node IDs derive from fact IDs only under the explicit pinned overlay policy', t => {
  const s = setup(t);
  s.stageId = '03.combined_kg';
  s.acceptedArtifacts.push(s.save('runs/synthetic-run/compiled.json', {high_yield_ranked: [{ranked: [{item_refs: ['F1', 'F2']}]}]}, 'compiled_dossier'));
  const before = assembleContext(s);
  assert.deepEqual(before.context.accepted_inputs.high_yield_fact_ids, ['F1', 'F2']);
  assert.equal(before.context.accepted_inputs.high_yield_ids, undefined);
  s.bindings.overlay = s.save('contracts/overlay.json', {role_overrides: {'03': {high_yield_node_id_source: 'accepted_fact_ids'}}}, 'overlay', false);
  assert.deepEqual(assembleContext(s).context.accepted_inputs.high_yield_ids, ['F1', 'F2']);
});

test('07 wraps media evidence and audit context stays missing until ledger-accepted', t => {
  const s = setup(t);
  s.stageId = '07.content_coverage';
  const r = assembleContext(s);
  assert.equal(r.status, 'HOLD');
  assert.deepEqual(r.context.media_disposition, {path: s.bindings.media_disposition.path, sha256: s.bindings.media_disposition.sha256, document: {kind: 'synthetic_policy'}});
  assert.ok(r.missing.includes('intervention_lineage'));
  assert.equal(r.context.candidate_manifest, null);
});

test('safe official-fact view requires exact accepted page/liveness/proof and preserves effective-date debt', t => {
  const s = setup(t);
  const sourceRef = 'src:synthetic:handbook';
  const sourceSha = 'a'.repeat(64);
  const officialUrl = 'https://dld.utah.gov/synthetic-handbook.pdf';
  const snapshot = 'SYNTHETIC rendered issuer page links ' + officialUrl;
  const snapshotRef = s.save('runs/synthetic-run/issuer-page.txt', snapshot, 'source_text');
  const issuerRef = s.save('runs/synthetic-run/issuer.json', {handbook_snapshot_sha256: sourceSha,
    links_exact_handbook_url: officialUrl, page_url: 'https://dld.utah.gov/learner-permit/', observed_at_utc: '2026-10-27T05:00:00Z',
    page_snapshot_ref: {path: snapshotRef.path, sha256: snapshotRef.sha256}, page_sha256: snapshotRef.sha256,
    page_bytes: Buffer.byteLength(snapshot), snapshot_kind: 'rendered_dom_excerpt', effective_date_disposition: {value: null}}, 'issuer_proof');
  const pageId = sourceRef + ':pdf-0033';
  const liveRef = s.save('runs/synthetic-run/liveness.json', {source_ref: sourceRef, snapshot_sha256: sourceSha,
    official_url: officialUrl, status: 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT', effective_date: null,
    issuer_current_edition_ref: issuerRef.path, issuer_current_edition_sha256: issuerRef.sha256,
    effective_date_disposition_ref: {path: issuerRef.path, sha256: issuerRef.sha256}}, 'source_liveness');
  s.acceptedArtifacts = [
    s.save('runs/synthetic-run/source.json', {sources: [{source_ref: sourceRef, snapshot_hash: sourceSha, is_official: true}]}, 'source_registry'),
    s.save('runs/synthetic-run/map.json', {pages: [{page_id: pageId, page_map_id: pageId, source_ref: sourceRef, source_document_sha256: sourceSha, pdf_page: 33, printed_page: '23'}]}, 'page_map'),
    s.acceptedArtifacts[2], liveRef,
  ];
  const config = {state_selection: {status: 'confirmed', confirmed_by: 'founder', jurisdiction: 'US-UT'}, scope: {
    jurisdiction: 'US-UT', exam_facts: {passing_percent: {value: 80, status: 'verified', source_page: pageId,
      source_ref: sourceRef, source_snapshot_sha256: sourceSha, liveness_receipt_ref: liveRef.path}}}};
  const configRef = s.save('runs/synthetic-run/run-config.json', config, 'run_config', false);
  const good = assembleContext({...s, config, configRef});
  assert.equal(good.context.exam_facts_view.passing_percent.value, 80);
  assert.equal(good.context.accepted_source_projection.sources[0].effective_date_status, 'debt');
  assert.equal(good.context.accepted_source_projection.sources[0].liveness_status, 'CONFIRMED_EDITION_EFFECTIVE_DATE_DEBT');
  const stale = assembleContext({...s, config, configRef, nowUtc: '2026-10-29T06:00:00Z'});
  assert.equal(stale.context.exam_facts_view.passing_percent.value, null);
  fs.appendFileSync(path.join(s.projectRoot, snapshotRef.path), 'tamper');
  assert.equal(assembleContext({...s, config, configRef}).context.exam_facts_view.passing_percent.value, null);
});
