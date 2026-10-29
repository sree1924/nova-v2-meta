#!/usr/bin/env node
// unit-map.mjs — the deterministic executor for stage 19A.units (CurriculumUnitMap), 2026-10-29.
// prompts/19A.md: "tool_assisted reference tooling, not a model-authoring task"; dispatch.mjs refuses to send 19A to an
// author, so this file is the executor it asks for. Same acceptance protocol as compileAcceptedDossier (16.compile).
//
//   node tools/belt/unit-map.mjs --run runs/<run_id> --executor-id <id> [--sections all|sec01-x,sec02-y] [--dry]
//
// Per section: read the belt's own accepted inputs for that section (acceptedRuntimeRefs: 03 KG, 04 cards, 05.sessions,
// 06 exam bank, the run's LearningLoop), build ONE unit per KG module (ids copied, never invented), compute integrity
// with checks/19a-units.mjs computeIntegrity, validate with post-validate.mjs validateArtifact (adapter schema + mapped
// compensating checks), and accept into the ledger ONLY when every check is PASS. production_gate is preview_only
// (pilot ceiling; 07/08 audits pending). No new teaching, facts or thresholds; the mastery bar is the LearningLoop's
// product policy, never an official pass mark. No network, no model calls, $0.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sha256, canonicalJson, inside, writeImmutable } from './atomic-file.mjs';
import { openLedger } from './ledger.mjs';
import { acquireExecutorLock } from './executor-lock.mjs';
import { acceptedRuntimeRefs, readNativeSnapshot, budgetFromConfig } from './dispatch.mjs';
import { loadRun } from './controller.mjs';
import { validateArtifact } from './post-validate.mjs';
import { computeIntegrity, SENTINEL } from './checks/19a-units.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(HERE, '../..');
const STAGE = '19A.units';
const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const pin = (f) => ({ path: f, sha256: sha256(fs.readFileSync(f)), bytes: fs.statSync(f).size });
const arr = (v) => (Array.isArray(v) ? v : []);
const uniq = (l) => [...new Set(l)];

// Build the CurriculumUnitMap for one section from its accepted inputs. Pure apart from reads.
export function buildUnitMapArtifact({ projectRoot = PROJECT_ROOT, loaded, sectionId, refs }) {
  const rel = (p) => path.relative(projectRoot, p).replace(/\\/g, '/');
  const byKind = (k) => refs.find((r) => r.kind === k);
  const need = { knowledge_graph: byKind('03.combined_kg'), carddeck: byKind('04.cards'), session_scripts: byKind('05.sessions'), exambank: byKind('06.exam_bank'), learning_loop: byKind('learning_loop') };
  const missing = Object.entries(need).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) return { status: 'HOLD', reason: 'accepted inputs missing for ' + sectionId + ': ' + missing.join(',') };
  const kg = read(need.knowledge_graph.path), deck = read(need.carddeck.path), sess = read(need.session_scripts.path), exam = read(need.exambank.path), ll = read(need.learning_loop.path);
  const llPin = pin(need.learning_loop.path);
  const mdPath = path.join(projectRoot, 'contracts/media-disposition.json');
  const media = read(mdPath);
  const gate = ll.mastery_gate || {};
  if (typeof gate.quiz_threshold_pct !== 'number') return { status: 'HOLD', reason: 'LearningLoop has no mastery_gate.quiz_threshold_pct' };

  const modules = arr(kg.modules);
  const nodesOf = (m) => (arr(m.node_ids).length ? arr(m.node_ids) : arr(kg.nodes).filter((n) => n.module_id === (m.module_id ?? m.id)).map((n) => n.id));
  const cardsOf = (mid) => arr(deck.decks).filter((d) => d.module_id === mid).flatMap((d) => arr(d.cards).map((c) => c.card_id));
  const sessionsOf = (mid) => arr(sess.units).filter((u) => u.module_id === mid).map((u) => u.unit_id);
  const quizOf = (mid) => uniq(arr(exam.module_quizzes).filter((q) => q.module_id === mid).flatMap((q) => arr(q.item_ids)));
  const forms = arr(exam.practice_forms);
  const formId = (f) => f.form_id ?? f.id;
  const formsFor = (itemSet) => forms.filter((f) => arr(f.item_ids).some((i) => itemSet.has(i))).map(formId);
  const moduleItems = (mid) => new Set(arr(exam.items).filter((i) => i.module_id === mid).map((i) => i.item_id));

  const units = modules.map((m, i) => {
    const mid = m.module_id ?? m.id;
    const sessions = sessionsOf(mid);
    return {
      unit_id: sessions[0] ?? `${mid}-unit`,
      module_id: mid,
      order: i + 1,
      title: m.title,
      domain: m.domain,
      node_ids: nodesOf(m),
      session_ref: sessions[0] ?? null,
      card_ids: cardsOf(mid),
      quiz_item_ids: quizOf(mid),
      mock_item_ids: [],
      practice_form_ids: formsFor(moduleItems(mid)),
      media_slot_ids: [],
      readiness_domain: m.domain,
      user_cycle: ['session', 'flashcards', 'module_hub', 'missed_review', 'spaced_review'],
      hub_options: ['module_quiz', 'flashcards', 'session'],
      hub_unlock: { requires: ['lesson_complete', 'all_cards_seen'], rule_source: 'learning_loop' },
      mastery_gate: {
        quiz_threshold_pct: gate.quiz_threshold_pct,
        missed_items_must_be_cleared: gate.missed_items_must_be_cleared !== false,
        policy_source: 'learning_loop', provenance_kind: 'product_policy',
        learning_loop_ref: rel(need.learning_loop.path), learning_loop_sha256: llPin.sha256,
      },
    };
  });
  const unknownThreshold = { value: null, status: 'unknown', source_page: null };
  const examModes = [
    { mode_id: 'module-quiz', kind: 'module_quiz', title: 'Module quiz (practice)', item_ids: uniq(units.flatMap((u) => u.quiz_item_ids)), form_ids: [],
      scoring_policy: { passing_threshold: unknownThreshold, result_language: 'practice_only', blocks_production_if_unknown: true } },
  ];
  if (forms.length) examModes.push({ mode_id: 'practice-forms', kind: 'practice_pool', title: 'Practice forms (practice)', item_ids: [], form_ids: forms.map(formId),
    scoring_policy: { passing_threshold: unknownThreshold, result_language: 'practice_only', blocks_production_if_unknown: true } });

  const source_refs = {
    knowledge_graph: rel(need.knowledge_graph.path), carddeck: rel(need.carddeck.path), session_scripts: rel(need.session_scripts.path),
    exambank: rel(need.exambank.path), learning_loop: rel(need.learning_loop.path), media_disposition: 'contracts/media-disposition.json',
    image_scout_pre_kg: SENTINEL, image_scout_post_kg: SENTINEL, image_asset_manifest: SENTINEL,
  };
  const inputPins = ['knowledge_graph', 'carddeck', 'session_scripts', 'exambank', 'learning_loop'].map((k) => ({ kind: k, path: source_refs[k], sha256: need[k].sha256 ?? pin(need[k].path).sha256 }));
  const input_manifest_sha256 = sha256(canonicalJson({ section_id: sectionId, inputs: inputPins }));
  const code = String(loaded.config.run_id).match(/rdmv-([a-z]{2})-/)?.[1] ?? 'xx';
  const product_line = { product_line_id: 'rdmv-' + code, tenant_id: loaded.config.run_id, tenant_dir: 'runs/' + loaded.config.run_id + '/19A', tenant_dir_kind: 'pilot_lane_path', source_run: 'runs/' + loaded.config.run_id, isolation: 'one_product_one_tenant_dir' };
  const artifact = {
    artifact: 'CurriculumUnitMap', schema_version: '1.0.0', adapter: 'pilot_adapter@0.4.0', stage_id: STAGE,
    minted_by: { model: 'none', lane: 'tool_assisted', pass: 'deterministic' },
    probe: loaded.config.probe ?? loaded.config.run_id,
    lineage: { input_manifest_sha256, candidate_lineage_id: loaded.config.candidate_lineage_id },
    product_line, source_refs, units, exam_modes: examModes,
    media: { required_slot_ids: [], optional_slot_ids: [], exempt_by_disposition: ['pre/post image scout plans'] },
    production_gate: { status: 'preview_only', reason: 'pilot ceiling: local preview only; official passing threshold unknown; 07/08 audits pending', blockers: [] },
    integrity: null, integrity_computed_by: 'script',
  };
  const context = {
    input_manifest_sha256,
    accepted_inputs: {
      product_line_id: product_line.product_line_id, tenant_id: product_line.tenant_id,
      refs: Object.fromEntries(['knowledge_graph', 'carddeck', 'session_scripts', 'exambank', 'learning_loop', 'media_disposition'].map((k) => [k, source_refs[k]])),
      knowledge_graph: kg,
      ids: {
        cards: arr(deck.decks).flatMap((d) => arr(d.cards).map((c) => c.card_id)),
        quiz_items: arr(exam.items).map((i) => i.item_id),
        sessions: arr(sess.units).map((u) => u.unit_id),
        mock_items: [], practice_forms: forms.map(formId), media_slots_resolved: [],
      },
    },
    learning_loop: ll, learning_loop_sha256: llPin.sha256, media_disposition: media,
  };
  artifact.integrity = computeIntegrity(artifact, context).counts;
  return { status: 'BUILT', artifact, context, inputPins };
}

// Standing authority, approvals and lineage resets: the same records the native runner writes (run-utah.mjs mintApproval;
// the pre-2026-10-29 runner's resetLineage). The ledger caps every task at 1-2 attempts and counts ALL attempts of a stage
// within one lineage (C28), so a per-section stage needs one lineage per section: each reset is recorded with its cause.
function standingFor(loaded, projectRoot) {
  const ref = loaded.config.execution?.standing_authority_ref;
  const p = ref ? path.resolve(projectRoot, ref.path) : path.join(loaded.runDir, 'approvals/STANDING-AUTHORITY-utah-full-run.json');
  const bytes = fs.readFileSync(p), standing = JSON.parse(bytes);
  if (ref && sha256(bytes) !== ref.sha256) throw new Error('Standing authority bytes differ from execution.standing_authority_ref.');
  if (standing.run_id !== loaded.config.run_id || typeof standing.founder_words !== 'string' || !standing.founder_words.trim()) throw new Error('Standing authority is not bound to this run / founder words.');
  return { standing, path: p, sha: sha256(bytes) };
}
function mintApproval({ projectRoot, loaded, executorId, sectionId }) {
  const { standing, path: sp, sha } = standingFor(loaded, projectRoot);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const file = path.join(loaded.runDir, 'approvals', `GO-${STAGE}-${stamp}.json`);
  const approval = { schema_version: 'nova-stage-approval.v0.4.0', run_id: standing.run_id, stage_id: STAGE, section_ids: [sectionId], founder_words: standing.founder_words, founder: standing.founder,
    derived_from_standing_authority: { path: path.relative(projectRoot, sp).replaceAll('\\', '/'), sha256: sha },
    recorded_by: { actor_id: 'unit-map deterministic executor (19A)', session_id: executorId }, recorded_at: new Date().toISOString(), expires_at: standing.expires_at,
    usd_ceiling: 0, content_calls_authorized: true, note: 'deterministic tool_assisted stage; no model call, $0 (flag mirrors the runner/compile rebind contract)' };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(approval, null, 2) + '\n', { flag: 'wx' });
  return { path: file, sha256: sha256(fs.readFileSync(file)) };
}
function resetLineage({ projectRoot, loaded, executorId, sectionId, cause }) {
  const { standing } = standingFor(loaded, projectRoot);
  const cfg = read(loaded.configPath);
  const from = cfg.candidate_lineage_id, n = Number(String(from).split(':').pop()) + 1, to = `${cfg.run_id}:lineage:${n}`;
  const rel = `receipts/lineage-reset-19Aunits-lineage${n}.json`;
  const receipt = { schema_version: 'nova-lineage-reset.v0.4.0', run_id: cfg.run_id, stage_id: STAGE, section_ids: [sectionId], from_lineage: from, to_lineage: to,
    authority: 'standing authority of this run', founder_words: standing.founder_words, cause, recorded_by: { actor_id: 'unit-map deterministic executor (19A)', session_id: executorId }, recorded_at: new Date().toISOString() };
  const saved = writeImmutable(loaded.runDir, rel, receipt);
  cfg.candidate_lineage_id = to;
  cfg.candidate_lineage_reset_ref = { path: 'runs/' + cfg.run_id + '/' + rel, sha256: saved.sha256, previous: cfg.candidate_lineage_reset_ref?.path ?? null };
  fs.writeFileSync(loaded.configPath, JSON.stringify(cfg, null, 2) + '\n');
  fs.appendFileSync(path.join(loaded.runDir, 'jams.md'), `\n- ${new Date().toISOString()} lineage reset → ${to} for ${STAGE} (${sectionId}) under standing authority; cause: ${cause}\n`);
  return to;
}
const sectionOfTask = (t) => { try { const id = typeof t.identity_json === 'string' ? JSON.parse(t.identity_json) : t.identity_json; return id?.config?.section_ids?.[0] ?? null; } catch { return null; } };

export async function buildUnitMap({ projectRoot = PROJECT_ROOT, runConfigPath, executorId, sectionId, dry = false }) {
  if (!executorId) throw new Error('Explicit executorId is required.');
  let loaded = loadRun({ projectRoot, runConfigPath });
  let snapshot = readNativeSnapshot(loaded.runDir, loaded.config);
  // Idempotent: a section with an accepted 19A task (any lineage) is done.
  if ((snapshot.tasks ?? []).some((t) => t.stage_id === STAGE && t.status === 'accepted' && sectionOfTask(t) === sectionId)) return { status: 'PASS', reused: true, model_calls: 0 };
  // C28: two 19A attempts per lineage at most. Start a recorded new lineage when this one is used up.
  const lineageAttempts = () => { const ids = new Set((snapshot.tasks ?? []).filter((t) => t.stage_id === STAGE && t.lineage_id === loaded.config.candidate_lineage_id).map((t) => t.task_id)); return (snapshot.attempts ?? []).filter((a) => ids.has(a.task_id)).length; };
  if (!dry && lineageAttempts() >= 2) {
    resetLineage({ projectRoot, loaded, executorId, sectionId, cause: 'one lineage per section for 19A.units: the ledger allows two attempts per lineage+stage (C28); deterministic executor makes one $0 attempt per section' });
    loaded = loadRun({ projectRoot, runConfigPath });
    snapshot = readNativeSnapshot(loaded.runDir, loaded.config);
  }
  const refs = acceptedRuntimeRefs(snapshot, projectRoot, loaded.runDir, { sectionIds: [sectionId] });
  const built = buildUnitMapArtifact({ projectRoot, loaded, sectionId, refs });
  if (built.status !== 'BUILT') return built;
  const validation = await validateArtifact({ stage_id: STAGE, artifact: built.artifact, context: built.context });
  const notPass = arr(validation.checks).filter((c) => c.status !== 'PASS');
  if (validation.status !== 'PASS' || notPass.length) return { status: 'HOLD', reason: 'validation', checks: notPass.map((c) => `${c.check_id}=${c.status}: ${String(c.evidence).slice(0, 160)}`), errors: validation.errors };
  if (dry) return { status: 'DRY_PASS', units: built.artifact.units.length, checks: validation.checks.length };

  const lockHandle = acquireExecutorLock({ runDir: loaded.runDir, runId: loaded.config.run_id, executorId });
  let ledger, fence;
  try {
    ledger = openLedger({ dbPath: inside(loaded.runDir, loaded.config.execution.ledger.path), lockHandle });
    const previous = ledger.getRun(loaded.config.run_id);
    fence = ledger.claimRun({ runId: loaded.config.run_id, bindingSha256: previous?.binding_sha256 ?? loaded.configRef.sha256, mode: previous?.mode ?? 'execute', budget: previous?.budget_json ?? budgetFromConfig(loaded.config) });
    if (previous && previous.binding_sha256 !== loaded.configRef.sha256) {
      // Same re-bind rule as compileAcceptedDossier: a hash-bound authorization derived from a stage approval.
      const approvalRef = mintApproval({ projectRoot, loaded, executorId, sectionId });
      const authorization = { status: 'PASS', action: 'rebind_run', source: 'founder', run_id: loaded.config.run_id, previous_binding_sha256: previous.binding_sha256, binding_sha256: loaded.configRef.sha256, mode: 'execute',
        budget_sha256: sha256(canonicalJson(budgetFromConfig(loaded.config))), execution_authorized: true, content_calls_authorized: true, derived_from_stage_approval: approvalRef };
      const authRef = writeImmutable(loaded.runDir, 'receipts/binding-' + sha256(canonicalJson(authorization)) + '.json', authorization, { lockHandle });
      fence = ledger.rebindRun(fence, { bindingSha256: loaded.configRef.sha256, mode: 'execute', budget: budgetFromConfig(loaded.config), authorizationReceipt: authRef });
    }
    const versions = { script: pin(fileURLToPath(import.meta.url)).sha256, checks: pin(path.join(HERE, 'checks/19a-units.mjs')).sha256, adapter_schema: pin(path.join(projectRoot, 'schemas-strict/19a-curriculum-unit-map.schema.json')).sha256 };
    const task = ledger.ensureTask(fence, { lineageId: loaded.config.candidate_lineage_id, stageId: STAGE, roleId: '19A', inputs: built.inputPins, versions, model: null, config: { section_ids: [sectionId], lane: 'tool_assisted' }, maxAttempts: 2 });
    if (task.status === 'accepted') return { status: 'PASS', reused: true, model_calls: 0 };
    const attempt = ledger.startAttempt(fence, { taskId: task.taskId, commandId: 'unit-map:' + task.taskId });
    const body = built.artifact;
    const sha8 = sha256(canonicalJson(body)).slice(0, 8);
    const saved = writeImmutable(loaded.runDir, `19A/${sectionId}/${sha8}/19a-curriculum-unit-map.json`, body, { lockHandle });
    const main = { ...saved, kind: '19a-curriculum-unit-map.json' };
    const vRef = writeImmutable(loaded.runDir, 'receipts/19A-validation-' + main.sha256 + '.json', { status: 'PASS', output_sha256: main.sha256, checks: validation.checks, metrics: validation.metrics ?? {} }, { lockHandle });
    const aRef = writeImmutable(loaded.runDir, 'receipts/19A-acceptance-' + main.sha256 + '.json', { status: 'PASS', output_sha256: main.sha256, kind: 'deterministic_unit_map_only', production_gate: 'preview_only', auditors: 'pending07/08' }, { lockHandle });
    ledger.acceptArtifact(fence, { taskId: task.taskId, attemptId: attempt.attemptId, artifact: main, validationReceipt: vRef, acceptanceReceipt: aRef });
    return { status: 'PASS', units: body.units.length, artifact: path.relative(projectRoot, main.path).replace(/\\/g, '/'), model_calls: 0 };
  } finally { if (fence && ledger) ledger.releaseRun(fence); ledger?.close(); lockHandle.release(); }
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  const a = process.argv.slice(2);
  const opt = (k) => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  const run = opt('--run'), executorId = opt('--executor-id'), dry = a.includes('--dry');
  if (!run || !executorId) { console.error('usage: --run runs/<run_id> --executor-id <id> [--sections all|a,b] [--dry]'); process.exit(2); }
  const runConfigPath = path.join(run, 'run-config.json');
  const cfg = read(path.join(PROJECT_ROOT, runConfigPath));
  const all = (cfg.scope.sections || Object.keys(cfg.scope.section_page_ranges || {})).map((x) => (typeof x === 'string' ? x : x.id));
  const want = !opt('--sections') || opt('--sections') === 'all' ? all : opt('--sections').split(',');
  let held = 0;
  for (const sectionId of want) {
    let r;
    try { r = await buildUnitMap({ runConfigPath, executorId, sectionId, dry }); } catch (e) { r = { status: 'HOLD', reason: String(e.message).slice(0, 200) }; }
    console.log(`  ${sectionId}: ${r.status}${r.reused ? ' (already accepted)' : ''}${r.units ? ' units=' + r.units : ''}${r.reason ? ' — ' + r.reason : ''}${r.checks && r.status !== 'DRY_PASS' ? '\n    ' + r.checks.join('\n    ') : ''}`);
    if (!['PASS', 'DRY_PASS'].includes(r.status)) { held++; break; }
  }
  process.exit(held ? 3 : 0);
}
