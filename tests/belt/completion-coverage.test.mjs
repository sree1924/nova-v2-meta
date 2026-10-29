// Local pure completion predicate regressions; no native run or model calls.
import test from 'node:test';
import assert from 'node:assert/strict';
import { completionCoverage } from '../../tools/belt/completion-coverage.mjs';
import { sha256Canonical } from '../../tools/belt/lib/hash.mjs';

function fixture() {
  const kgRef = 'synthetic/03.json';
  const scope = { probe: 'synthetic-coverage', candidate_lineage_id: 'synthetic-lineage' };
  const accepted_inputs = {
    knowledge_graph: { probe: scope.probe, lineage: { candidate_lineage_id: scope.candidate_lineage_id }, nodes: [
      { id: 'n.a', module_id: 'm.a', domain: 'Rules', high_yield: true },
      { id: 'n.b', module_id: 'm.a', domain: 'Rules', high_yield: false },
    ], dynamic_nodes: [] },
    carddeck: { ...scope, source_refs: { knowledge_graph: kgRef }, decks: [{ module_id: 'm.a', cards: [
      { card_id: 'c.a', node_id: 'n.a', module_id: 'm.a' },
      { card_id: 'c.b', node_id: 'n.b', module_id: 'm.a' },
    ] }], merges: [] },
    exam_bank: { ...scope, source_refs: { knowledge_graph: kgRef }, items: [
      { item_id: 'i.a', node_id: 'n.a', module_id: 'm.a' },
      { item_id: 'i.b', node_id: 'n.b', module_id: 'm.a' },
    ] },
  };
  const loaded_refs = Object.fromEntries(Object.entries(accepted_inputs).map(([key, data]) => [
    `accepted_inputs.${key}`, { path: key === 'knowledge_graph' ? kgRef : `synthetic/${key}.json`, sha256: sha256Canonical(data) },
  ]));
  const context = { accepted_inputs, loaded_refs };
  const hashes = { knowledge_graph: loaded_refs['accepted_inputs.knowledge_graph'].sha256,
    carddeck: loaded_refs['accepted_inputs.carddeck'].sha256, exambank: loaded_refs['accepted_inputs.exam_bank'].sha256 };
  return { context, hashes };
}

test('complete served and high-yield node coverage PASSes deterministically without mutation', () => {
  const f = fixture(), before = JSON.stringify(f);
  const a = completionCoverage(f.context, f.hashes), b = completionCoverage(f.context, f.hashes);
  assert.equal(a.status, 'PASS');
  assert.deepEqual(a, b);
  assert.equal(a.metrics.required_nodes, 2);
  assert.equal(JSON.stringify(f), before);
});

test('missing non-high-yield served node assessment FAILs despite structurally present items', () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.exam_bank.items.pop();
  const r = completionCoverage(context, hashes);
  assert.equal(r.status, 'FAIL');
  assert.deepEqual(r.gaps.map(g => [g.node_id, g.missing]), [['n.b', 'item']]);
});

test('merge-only target still requires its own node-bound assessment', () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.carddeck.decks[0].cards.pop();
  context.accepted_inputs.carddeck.merges = [{ card_id: 'c.a', merged_node_ids: ['n.a', 'n.b'], justification: 'one shared card' }];
  context.accepted_inputs.exam_bank.items.pop();
  const r = completionCoverage(context, hashes);
  assert.equal(r.status, 'FAIL');
  assert.equal(r.metrics.served_nodes, 2);
  assert.deepEqual(r.gaps.map(g => [g.node_id, g.missing]), [['n.b', 'item']]);
  context.accepted_inputs.exam_bank.items.push({ item_id: 'i.b', node_id: 'n.b', module_id: 'm.a' });
  assert.equal(completionCoverage(context, hashes).status, 'PASS');
});

test('high-yield node needs card coverage as well as an item', () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.carddeck.decks[0].cards.shift();
  const r = completionCoverage(context, hashes);
  assert.equal(r.status, 'FAIL');
  assert.deepEqual(r.gaps.map(g => [g.node_id, g.missing]), [['n.a', 'card']]);
});

for (const claim of [
  { node_id: 'n.b', reason: 'not needed' },
  { node_id: 'n.b', status: 'accepted', carddeck_sha256: '0'.repeat(64), reason: 'old revision' },
  { node_id: 'n.b', status: 'accepted', probe: 'another-state', reason: 'foreign scope' },
]) test(`unsupported/stale/foreign gap claim cannot waive missing coverage: ${claim.reason}`, () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.exam_bank.items.pop();
  context.accepted_inputs.exam_bank.coverage_gaps = [claim];
  context.accepted_dispositions = [{ kind: 'assessment_gap', ...claim }];
  context.quarantine = { cards: [{ id: 'c.b' }], reason: claim.reason };
  assert.equal(completionCoverage(context, hashes).status, 'FAIL');
});

test('absent accepted artifacts or pins HOLD; stale report hash and foreign input scope FAIL', () => {
  assert.equal(completionCoverage().status, 'HOLD');
  const { context, hashes } = fixture();
  const unpinned = structuredClone(context); delete unpinned.loaded_refs['accepted_inputs.carddeck'];
  assert.equal(completionCoverage(unpinned, hashes).status, 'HOLD');
  assert.equal(completionCoverage(context, { ...hashes, carddeck: '0'.repeat(64) }).status, 'FAIL');
  context.accepted_inputs.exam_bank.probe = 'foreign-state';
  assert.equal(completionCoverage(context, hashes).status, 'FAIL');
});

test('foreign card nodes and wrong-module items cannot satisfy the join', () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.exam_bank.items[1].module_id = 'other-module';
  assert.equal(completionCoverage(context, hashes).status, 'FAIL');
  context.accepted_inputs.carddeck.decks[0].cards[1].node_id = 'foreign-node';
  assert.match(completionCoverage(context, hashes).errors.join(' '), /foreign-node absent/);
});

test('different accepted execution epochs PASS when current run, probe and dependencies match', () => {
  const { context, hashes } = fixture();
  context.accepted_inputs.knowledge_graph.lineage.candidate_lineage_id = 'synthetic-run:lineage:1';
  context.accepted_inputs.carddeck.candidate_lineage_id = 'synthetic-run:lineage:2';
  context.accepted_inputs.exam_bank.candidate_lineage_id = 'synthetic-run:lineage:3';
  const kgPath = 'runs/synthetic-run/artifacts/current-kg/output.json';
  for (const key of ['carddeck', 'exam_bank']) context.accepted_inputs[key].source_refs.knowledge_graph = kgPath;
  context.candidate_manifest = { members: [] };
  for (const [key, data] of Object.entries(context.accepted_inputs)) {
    const pin = context.loaded_refs[`accepted_inputs.${key}`];
    pin.path = key === 'knowledge_graph' ? kgPath : `runs/synthetic-run/artifacts/current-${key}/output.json`;
    pin.sha256 = sha256Canonical(data);
    const role = key === 'exam_bank' ? 'exambank' : key;
    hashes[role] = pin.sha256;
    context.candidate_manifest.members.push({ role, ...pin });
  }
  assert.equal(completionCoverage(context, hashes).status, 'PASS');
  context.accepted_inputs.exam_bank.probe = 'another-probe';
  assert.match(completionCoverage(context, hashes).errors.join(' '), /probe differs/);
});

test('stale KG dependency path and foreign native run pin FAIL despite matching execution epochs', () => {
  const { context, hashes } = fixture();
  for (const key of Object.keys(context.accepted_inputs)) context.loaded_refs[`accepted_inputs.${key}`].path = `runs/current-run/artifacts/${key}/output.json`;
  const kgPath = context.loaded_refs['accepted_inputs.knowledge_graph'].path;
  context.accepted_inputs.carddeck.source_refs.knowledge_graph = kgPath;
  context.accepted_inputs.exam_bank.source_refs.knowledge_graph = kgPath;
  assert.equal(completionCoverage(context, hashes).status, 'PASS');
  context.accepted_inputs.carddeck.source_refs.knowledge_graph = 'runs/current-run/artifacts/older-kg/output.json';
  assert.match(completionCoverage(context, hashes).errors.join(' '), /knowledge_graph ref differs/);
  context.accepted_inputs.carddeck.source_refs.knowledge_graph = kgPath;
  context.loaded_refs['accepted_inputs.exam_bank'].path = 'runs/foreign-run/artifacts/exam_bank/output.json';
  assert.match(completionCoverage(context, hashes).errors.join(' '), /native run scope/);
});

test('candidate membership must bind each current accepted path and hash', () => {
  const { context, hashes } = fixture();
  context.candidate_manifest = { members: Object.entries(context.loaded_refs).map(([key, pin]) => ({ role: key.endsWith('exam_bank') ? 'exambank' : key.split('.').at(-1), ...pin })) };
  assert.equal(completionCoverage(context, hashes).status, 'PASS');
  const roleless = structuredClone(context);
  roleless.candidate_manifest.members.forEach(m => { delete m.role; });
  assert.equal(completionCoverage(roleless, hashes).status, 'PASS', 'existing native manifest member role is optional');
  context.candidate_manifest.members.find(m => m.role === 'knowledge_graph').path = 'synthetic/stale-03.json';
  assert.match(completionCoverage(context, hashes).errors.join(' '), /current accepted path\/hash absent/);
});
