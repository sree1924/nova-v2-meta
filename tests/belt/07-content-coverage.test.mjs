// node --test tests/belt/07-content-coverage.test.mjs — local deterministic tests for the 07.content_coverage adapter + checks.
// No model/endpoint call; a PASS here is local validation only, never provider acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { validateArtifact } from '../../tools/belt/post-validate.mjs';
import { lintSchema } from '../../tools/belt/strict-lint.mjs';
import { resolveContext } from '../../tools/belt/lib/fixture-context.mjs';
import { assembleContext } from '../../tools/belt/context.mjs';
import { sha256Bytes, sha256Canonical } from '../../tools/belt/lib/hash.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const J = (rel) => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const STAGE = '07.content_coverage';
const FX = 'tools/belt/fixtures/07.content_coverage';
const mapping = J('schemas-strict/07-coverage-report.mapping.json');
const ctxSyn = resolveContext(J(`${FX}/context-completion.json`));
const base = () => J(`${FX}/synthetic-completion-pass.json`);
const run = (artifact, context = ctxSyn) => validateArtifact({ stage_id: STAGE, artifact, context: { ...context, strip_fixture_meta: true } });
const st = (res, id) => res.checks.find(c => c.check_id === id)?.status;

test('adapter passes strict-lint with no soft-keyword exemptions', () => {
  const r = lintSchema(J('schemas-strict/07-coverage-report.schema.json'));
  assert.equal(r.ok, true, JSON.stringify(r.violations));
  assert.equal(r.soft_compensated.length, 0);
});

test('every mapping fixture yields its expected status', async () => {
  for (const f of mapping.fixtures) {
    const res = await run(J(f.path), resolveContext(J(f.context_path)));
    assert.equal(res.status, f.expected_status, `${f.path}: ${res.checks.filter(c => c.status !== 'PASS').map(c => c.check_id).join(',')}`);
    if (f.expected_schema) assert.equal(st(res, '07.SCHEMA'), f.expected_schema, f.path);
  }
});

test('result names every mapped compensating check; synthetic report PASSes all', async () => {
  const res = await run(base());
  const ids = new Set(res.checks.map(c => c.check_id));
  for (const id of mapping.compensating_checks) assert.ok(ids.has(id), `missing ${id}`);
  assert.equal(res.status, 'PASS');
});

test('mismatched candidate hash -> FAIL; candidate manifest absent -> HOLD', async () => {
  const neg = await run(J(`${FX}/synthetic-neg-candidate-mismatch.json`));
  assert.equal(st(neg, '07.CANDIDATE_ECHO'), 'FAIL');
  assert.equal(neg.status, 'FAIL');
  const { candidate_manifest, ...noManifest } = ctxSyn;
  const hold = await run(base(), noManifest);
  assert.equal(st(hold, '07.CANDIDATE_ECHO'), 'HOLD');
  assert.equal(st(hold, '07.INPUT_MEMBERSHIP'), 'HOLD');
  assert.equal(hold.status, 'HOLD');
});

test('input hash outside the candidate manifest -> FAIL', async () => {
  const a = base(); a.input_hashes.carddeck = '9'.repeat(64);
  assert.equal(st(await run(a), '07.INPUT_MEMBERSHIP'), 'FAIL');
});

test('to_worker "02" is ACCEPTED by the adapter (parent enum rejects it)', async () => {
  const parentEnum = JSON.parse(readFileSync(join(ROOT, '..', 'schemas', 'coverage-report.schema.json'), 'utf8')).properties.route_back.items.properties.to_worker.enum;
  assert.ok(!parentEnum.includes('02'), 'parent enum excludes 02');
  const res = await run(J(`${FX}/synthetic-route-to-02.json`));
  assert.equal(st(res, '07.SCHEMA'), 'PASS');
  assert.equal(st(res, '07.ROUTE_COVERAGE'), 'PASS');
  assert.equal(st(res, '07.VERDICT_GATE'), 'FAIL');
  for (const w of ['13', '15', '08', '00']) { const a = J(`${FX}/synthetic-route-to-02.json`); a.route_back[0].to_worker = w; a.blocking_findings[0].route_to = w; assert.equal(st(await run(a), '07.SCHEMA'), 'PASS', w); }
});

test('parent allOf restored: PASS with media_gaps / unit gaps / cross-product refs -> FAIL', async () => {
  const a = base(); a.media_gaps.push({ media_slot_id: 'slot.1', issue: 'required_unresolved', required: true, owner: '20A' });
  assert.equal(st(await run(a), '07.VERDICT_INVARIANT'), 'FAIL');
  const b = base(); b.curriculum_unit_gaps.push({ unit_id: 'unit.a', issue: 'missing_session', ref: null });
  assert.equal(st(await run(b), '07.VERDICT_INVARIANT'), 'FAIL');
  const c = base(); c.cross_product_refs.push({ ref: 'm01', expected_tenant_dir: 'app/public/tenants/examplia', actual_tenant_dir: 'app/public/tenants/other' });
  assert.equal(st(await run(c), '07.VERDICT_INVARIANT'), 'FAIL');
});

test('PASS with required_checks_not_run -> FAIL', async () => {
  const a = base(); a.required_checks_not_run = ['rule 7 depth floor'];
  assert.equal(st(await run(a), '07.REQUIRED_CHECKS_RUN'), 'FAIL');
});

test('historical context lacking accepted KG/cards cannot claim completion PASS', async () => {
  const res = await run(J(`${FX}/synthetic-pass.json`), J(`${FX}/context-synthetic.json`));
  assert.equal(st(res, '07.REQUIRED_CHECKS_RUN'), 'HOLD');
  assert.equal(res.status, 'HOLD');
});

test('served node coverage FAILs independently of 06 structural acceptance and claimed gap strings', async () => {
  const ctx = structuredClone(ctxSyn);
  const structural = await validateArtifact({ stage_id: '06.exam_bank', artifact: ctx.accepted_inputs.exam_bank,
    context: { ...J('tools/belt/fixtures/06.exam_bank/context-synthetic.json'), strip_fixture_meta: true } });
  assert.equal(structural.status, 'PASS', '06 structural PASS does not require cards or prove served-node completeness');
  const node = { ...ctx.accepted_inputs.knowledge_graph.nodes[0], id: 'n.unassessed', high_yield: false };
  ctx.accepted_inputs.knowledge_graph.nodes.push(node);
  ctx.accepted_inputs.carddeck.decks[0].cards.push({ ...ctx.accepted_inputs.carddeck.decks[0].cards[0], card_id: 'card.unassessed', node_id: node.id });
  ctx.accepted_dispositions = [{ kind: 'assessment_gap', node_id: node.id, reason: 'old package already accepted' }];
  const res = await run(base(), ctx);
  assert.equal(st(res, '07.REQUIRED_CHECKS_RUN'), 'FAIL');
  assert.match(res.checks.find(c => c.check_id === '07.REQUIRED_CHECKS_RUN').evidence, /n\.unassessed:item/);
  assert.equal(st(res, '07.PRACTICE_FORM_DRIFT'), 'PASS', 'unchanged bank forms remain structurally sound');
});

test('native 07 context supplies exact accepted KG/card/exam pins for the completion join', async t => {
  const projectRoot = mkdtempSync(join(tmpdir(), 'nova-completion-'));
  t.after(() => {
    assert.ok(projectRoot.startsWith(resolve(tmpdir()) + sep), 'cleanup stays inside the named temporary root');
    rmSync(projectRoot, { recursive: true, force: true });
  });
  const runRoot = join(projectRoot, 'runs', 'synthetic-completion'); mkdirSync(runRoot, { recursive: true });
  const data = structuredClone(ctxSyn.accepted_inputs);
  const kgPath = 'runs/synthetic-completion/knowledge_graph.json';
  data.carddeck.source_refs.knowledge_graph = kgPath;
  data.exam_bank.source_refs.knowledge_graph = kgPath;
  const refs = Object.entries(data).map(([kind, artifact]) => {
    const path = `runs/synthetic-completion/${kind}.json`, bytes = JSON.stringify(artifact);
    writeFileSync(join(projectRoot, path), bytes);
    return { kind, path, sha256: sha256Bytes(Buffer.from(bytes)), accepted: true };
  });
  const assembled = assembleContext({ projectRoot, runRoot, stageId: STAGE, acceptedArtifacts: refs });
  for (const key of ['knowledge_graph', 'carddeck', 'exam_bank']) {
    assert.deepEqual(assembled.context.accepted_inputs[key], data[key]);
    assert.equal(assembled.context.loaded_refs[`accepted_inputs.${key}`].sha256, refs.find(r => r.kind === key).sha256);
  }
  const report = base(), manifest = structuredClone(ctxSyn.candidate_manifest);
  for (const ref of refs) {
    const key = ref.kind === 'exam_bank' ? 'exambank' : ref.kind;
    report.input_hashes[key] = ref.sha256;
    Object.assign(manifest.members.find(m => m.role === key), { path: ref.path, sha256: ref.sha256 });
  }
  report.candidate_sha256 = sha256Canonical(manifest);
  const ctx = { ...ctxSyn, accepted_inputs: assembled.context.accepted_inputs,
    loaded_refs: assembled.context.loaded_refs, exambank: assembled.context.exambank, candidate_manifest: manifest };
  assert.equal((await run(report, ctx)).status, 'PASS');
  const missing = structuredClone(ctx);
  missing.accepted_inputs.exam_bank.items = missing.accepted_inputs.exam_bank.items.filter(i => i.node_id !== 'n.permit.hours');
  assert.equal(st(await run(report, missing), '07.REQUIRED_CHECKS_RUN'), 'FAIL');
});

test('unknown weights: null weight accepted; fabricated number under not_applicable -> FAIL; checked needs verified view', async () => {
  const ok = await run(base());
  assert.equal(st(ok, '07.DOMAIN_WEIGHTS'), 'PASS');
  const a = base(); a.domain_coverage[0].weight_pct = 50;
  assert.equal(st(await run(a), '07.DOMAIN_WEIGHTS'), 'FAIL');
  const b = base(); Object.assign(b.domain_coverage[0], { weight_check: 'checked', weight_pct: 48, weighting_drift: 2 });
  assert.equal(st(await run(b), '07.DOMAIN_WEIGHTS'), 'HOLD');
  assert.equal(st(await run(b, { ...ctxSyn, exam_facts_view: { domain_weights: { Permits: { value: 48, status: 'unknown' } } } }), '07.DOMAIN_WEIGHTS'), 'FAIL');
  assert.equal(st(await run(b, { ...ctxSyn, exam_facts_view: { domain_weights: { Permits: { value: 48, status: 'verified' } } } }), '07.DOMAIN_WEIGHTS'), 'PASS');
});

test('media disposition sha / checks mismatch -> FAIL; late 09 UISpec as early intent -> FAIL; null -> HOLD', async () => {
  const a = base(); a.media.media_disposition_sha256 = '0'.repeat(64);
  assert.equal(st(await run(a), '07.MEDIA_DISPOSITION'), 'FAIL');
  const b = base(); b.media.non_applicable_checks.pop();
  assert.equal(st(await run(b), '07.MEDIA_DISPOSITION'), 'FAIL');
  const c = base(); c.media.early_media_intent_ref = 'runs/x/09-uispec.json';
  assert.equal(st(await run(c), '07.EARLY_MEDIA_INTENT'), 'FAIL');
  const d = base(); d.media.early_media_intent_ref = null;
  assert.equal(st(await run(d), '07.EARLY_MEDIA_INTENT'), 'HOLD');
  const { media_disposition, ...noMd } = ctxSyn;
  assert.equal(st(await run(base(), noMd), '07.MEDIA_DISPOSITION'), 'HOLD');
});

test('titled promise broken but unreported -> FAIL', async () => {
  const ctx = structuredClone(ctxSyn); ctx.titled_surfaces[0].actual_count = 2;
  assert.equal(st(await run(base(), ctx), '07.TITLED_PROMISE'), 'FAIL');
});

test('recomputed form drift the report omits -> FAIL', async () => {
  const ctx = structuredClone(ctxSyn); ctx.exambank.practice_forms[0].overlap_note = null;
  assert.equal(st(await run(base(), ctx), '07.PRACTICE_FORM_DRIFT'), 'FAIL');
});

test('provider/scope mismatch -> FAIL; auditor family in lineage -> FAIL', async () => {
  const a = base(); a.assigned_scope = 'content_coverage:other';
  assert.equal(st(await run(a), '07.PROVIDER_SCOPE'), 'FAIL');
  const b = base(); b.provider_family = 'openai';
  const res = await run(b, { ...ctxSyn, audit_assignment: { provider_family: 'openai', assigned_scope: 'content_coverage:full_candidate' } });
  assert.equal(st(res, '07.INDEPENDENCE'), 'FAIL', 'openai authored the prompt templates');
});

test('FAIL verdict without a route -> FAIL; HOLD without a stated blocker -> FAIL', async () => {
  const a = base(); a.verdict = 'FAIL';
  assert.equal(st(await run(a), '07.VERDICT_CONSISTENCY'), 'FAIL');
  const b = base(); b.verdict = 'HOLD';
  assert.equal(st(await run(b), '07.VERDICT_CONSISTENCY'), 'FAIL');
});

test('V1 projection (synthetic candidate) FAILs for its recorded reasons', async () => {
  const fx = J(`${FX}/v1-projected.json`);
  assert.equal(fx._fixture.kind, 'v1_projected_with_synthetic_candidate');
  const res = await run(fx, J(`${FX}/context-v1.json`));
  assert.equal(st(res, '07.SCHEMA'), 'PASS');
  assert.equal(st(res, '07.CANDIDATE_ECHO'), 'PASS');
  for (const id of ['07.INPUT_MEMBERSHIP', '07.REQUIRED_CHECKS_RUN', '07.PRACTICE_FORM_DRIFT', '07.INDEPENDENCE']) assert.equal(st(res, id), 'FAIL', id);
  assert.equal(st(res, '07.EARLY_MEDIA_INTENT'), 'HOLD');
  assert.equal(res.status, 'FAIL');
});
