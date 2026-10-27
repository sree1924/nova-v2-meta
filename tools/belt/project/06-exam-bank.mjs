// V1 projection for 06.exam_bank: runs/2026-06-11-citizenship/06-exambank.json -> strict practice-only adapter shape.
// FIXTURE/REFERENCE ONLY — never a DMV result. Every transformation decision is recorded in _fixture.decisions.
// CLI: node tools/belt/project/06-exam-bank.mjs --write   (writes tools/belt/fixtures/06.exam_bank/v1-projected.json
//      and context-v1.json; reads only the V1 run files named below)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const V1 = 'D:/nova/runs/2026-06-11-citizenship';
const KEYS = ['A', 'B', 'C', 'D'];

export const FORM_META = {
  'mock-2025-form-A': { title: 'Practice Form A', n: 20, pass: 12, page: 'S2 uscis.gov "2025 Civics Test" page (web page, Last Reviewed/Updated 09/17/2025; no PDF page)' },
  'mock-2025-form-B': { title: 'Practice Form B', n: 20, pass: 12, page: 'S2 uscis.gov "2025 Civics Test" page (web page, Last Reviewed/Updated 09/17/2025; no PDF page)' },
  'mock-2025-form-65-20': { title: 'Special-Consideration Practice Form', n: 10, pass: 6, page: 'S1 M-1778 PDF p.1; S4 USCIS Policy Manual Vol. 12, Part E, Ch. 2' },
};

function splitRationale(rationale, distractors) {
  const idx = distractors.map(d => rationale.indexOf(`"${d}"`));
  if (idx.some(i => i < 0)) return null;
  const order = idx.map((i, k) => ({ i, k })).sort((x, y) => x.i - y.i);
  const segs = new Array(distractors.length);
  order.forEach((o, n) => { segs[o.k] = rationale.slice(o.i, n + 1 < order.length ? order[n + 1].i : undefined).trim(); });
  return { correct: rationale.slice(0, order[0].i).trim(), distractors: segs };
}

export function projectV1(parent, { learningLoopRef } = {}) {
  const sfMap = new Map();
  for (const s of parent.self_flagged_distractors ?? []) sfMap.set(s.item_id, [...(sfMap.get(s.item_id) ?? []), s]);
  const stats = { split_ok: 0, split_failed: [], unbound: [], page_debt: [] };
  const self_flagged_distractors = [];
  const page_debt = [];
  const items = parent.items.map((it, n) => {
    const pos = n % 4;
    const split = splitRationale(it.rationale, it.distractors);
    if (split) stats.split_ok++; else stats.split_failed.push(it.id);
    const texts = [...it.distractors];
    texts.splice(pos, 0, it.correct);
    const options = texts.map((text, k) => {
      const isCorrect = k === pos;
      const di = k < pos ? k : k - 1;
      const rationale = split ? (isCorrect ? split.correct : split.distractors[di]) : (isCorrect ? it.rationale : '');
      return { key: KEYS[k], text, rationale };
    });
    for (const s of sfMap.get(it.id) ?? []) {
      const opt = options.find(o => o.text === s.distractor);
      self_flagged_distractors.push({ item_id: it.id, option_key: opt ? opt.key : 'A', why_possibly_correct: s.why_possibly_correct });
    }
    const pageM = /PDF page (\d+)/.exec(it.source_ref?.ref ?? '');
    const pdf_page = pageM ? Number(pageM[1]) : null;
    if (pdf_page == null) {
      page_debt.push({ item_id: it.id, reason: `(verify) V1 source_ref "${it.source_ref?.ref}" cites no page`, route_to: '15' });
      stats.page_debt.push(it.id);
    }
    if (!it.node_id) stats.unbound.push(it.id);
    return {
      item_id: it.id,
      objective_id: it.node_id ?? '',
      node_id: it.node_id ?? '',
      module_id: it.module_id,
      unit_id: it.unit_id ?? null,
      domain: it.domain,
      fact_ids: it.node_id ? [it.node_id] : [],
      source_ref: { ref: it.source_ref.ref, tier: it.source_ref.tier, pdf_page, printed_page: null },
      stem: it.stem,
      options,
      correct_key: KEYS[pos],
      correct_rationale: split ? split.correct : it.rationale,
      distractor_source: it.distractor_source,
      difficulty: it.difficulty,
      is_derived: false,
      self_flagged: sfMap.has(it.id),
      needs_review: it.needs_review === true,
    };
  });
  const module_quizzes = parent.module_quizzes.map(q => ({ quiz_id: `quiz.${q.module}`, module_id: q.module, unit_id: q.unit_id ?? null, domain: q.domain, title: q.title ?? '', item_ids: q.item_ids }));
  const practice_forms = parent.mock_exams.map(m => {
    const fm = FORM_META[m.form_id];
    return {
      form_id: m.form_id,
      title: fm.title,
      item_ids: m.item_ids,
      declared_count: m.item_ids.length,
      overlap_note: null,
      official_mirror: {
        status: 'verified',
        n_questions: { value: fm.n, status: 'verified', source_page: fm.page },
        passing: { value: fm.pass, status: 'verified', source_page: fm.page },
        passing_unit: 'correct_count',
        time: { value: null, status: 'unknown', source_page: null },
      },
      scoring_policy: { kind: 'product_policy', learning_loop_ref: learningLoopRef },
    };
  });
  const input_manifest_sha256 = sha256Canonical(parent.inputs);
  const artifact = {
    artifact_type: 'ExamBank',
    adapter_version: '0.4.0',
    overlay_kind: 'practice_only_pilot_overlay',
    probe: parent.probe,
    minted_by: { model: parent.minted_by.model, lane: parent.minted_by.lane, pass: parent.minted_by.pass },
    input_manifest_sha256,
    candidate_lineage_id: 'v1-reference:runs/2026-06-11-citizenship:06-exambank',
    source_refs: { knowledge_graph: parent.inputs.knowledge_graph, curriculum_unit_hints: null },
    items,
    module_quizzes,
    practice_forms,
    self_flagged_distractors,
    page_debt,
    derived_in_forms_disposition_ref: null,
    needs_review_count: items.filter(i => i.needs_review).length,
  };
  return { artifact, stats };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const srcPath = join(V1, '06-exambank.json');
  const parent = JSON.parse(readFileSync(srcPath, 'utf8'));
  const llPath = join(V1, '19-learning-loop.json');
  const learningLoopRef = `runs/2026-06-11-citizenship/19-learning-loop.json@sha256:${sha256File(llPath)}`;
  const { artifact, stats } = projectV1(parent, { learningLoopRef });
  const bpPath = join(V1, '17-enriched-blueprint.json');
  const bp = JSON.parse(readFileSync(bpPath, 'utf8'));
  const kgPath = join(V1, '03-knowledge-graph.json');
  const kg = JSON.parse(readFileSync(kgPath, 'utf8'));
  const exPath = join(V1, '16-blueprint.json');
  const exam = JSON.parse(readFileSync(exPath, 'utf8')).exam_meta;
  const genPath = fileURLToPath(import.meta.url);
  const fixture = {
    _fixture: {
      kind: 'v1_projected',
      note: 'FIXTURE/REFERENCE projected from the V1 citizenship run — never a DMV production result.',
      source: { path: 'runs/2026-06-11-citizenship/06-exambank.json', sha256: sha256File(srcPath), declared_artifact_hash: parent.artifact_hash },
      generator: { path: 'tools/belt/project/06-exam-bank.mjs', sha256: sha256File(genPath) },
      stats: { items: artifact.items.length, rationale_split_ok: stats.split_ok, rationale_split_failed: stats.split_failed, node_unbound: stats.unbound, page_debt: stats.page_debt },
      decisions: [
        'items[].id -> item_id; objective_id = node_id (the M-1778 published bank: each official question is its own objective, coverage_basis official_objectives). Items with node_id null (item.eng.*) project objective_id/node_id "" and fact_ids [] — V1 never bound them; not invented.',
        'fact_ids = [node_id] (V1 node ids equal 17-enriched-blueprint fact_id values).',
        'source_ref.pdf_page parsed from the V1 ref text "PDF page N"; printed_page null (V1 does not distinguish printed pages). Refs without a page get a page_debt row routed to 15 — no page invented.',
        'options: correct answer inserted at position (item index mod 4) -> keys A–D; distractors keep V1 order. Deterministic, recorded so tests are reproducible.',
        'per-option rationales: V1 single rationale split at each \'"<distractor>"\' marker; text before the first marker = correct_rationale and correct-option rationale. Where a marker is absent (item.eng.*) the whole V1 rationale goes to the correct option and distractor rationales stay "" (V1 has none) — the check reports it.',
        'is_derived false for every item (V1 carries no derived flag; item.eng.* are M-715 items, not component derivations).',
        'self_flagged true for the 8 items in V1 self_flagged_distractors; option_key resolved by exact distractor text. They remain UNRESOLVED at 06 time — the later 08 executor ruling is not a 06 resolution.',
        'needs_review copied (17 items true); needs_review_count = 17. Never cleared.',
        'mock_exams -> practice_forms. Titles AUTHORED here (V1 forms have none): "Practice Form A", "Practice Form B", "Special-Consideration Practice Form" — no numerals.',
        'official_mirror status "verified" for all 3 forms because V1 cites USCIS sources for count and passing: A/B n_questions 20 / passing 12 correct ([S2] web page, no PDF page); 65/20 n_questions 10 / passing 6 ([S1] p.1, [S4]). time = unknown/null: V1 states only an SME note "no separate published time limit", not a page-bound official fact.',
        'V1 domain_distribution, passing_threshold, mechanics, early_stop and distribution_basis are not carried: distribution is recomputed by 07, and the mechanics prose mixes official rules with product claims (official numbers live only in official_mirror). overlap_note null on every form — V1 has no learner-visible reuse note.',
        'scoring_policy = product_policy bound to runs/2026-06-11-citizenship/19-learning-loop.json@sha256 of its current bytes.',
        'input_manifest_sha256 is SYNTHETIC: sha256(canonicalJson(V1.inputs)) — V1 has no input manifest. candidate_lineage_id is a synthetic reference label.',
        'module_quizzes: quiz_id = "quiz.<module>"; title/domain/item_ids copied; unit_id null (V1 KG has no curriculum_unit_hints).',
      ],
    },
    ...artifact,
  };
  const outDir = join(LANE, 'tools', 'belt', 'fixtures', '06.exam_bank');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'v1-projected.json'), JSON.stringify(fixture, null, 2) + '\n');

  // Synthetic-but-derived context: fact registry from 17-enriched-blueprint (status verified only where the fact is
  // official/regulator tier, confidence high, needs_review false and its ref cites a PDF page).
  const facts = {};
  for (const k of bp.knowledge) for (const f of k.facts) {
    const paged = /PDF page \d+|p\.\s?\d+/.test(f.source_ref?.ref ?? '');
    const verified = ['official', 'regulator'].includes(f.source_ref?.tier) && f.confidence === 'high' && f.needs_review !== true && paged;
    facts[f.fact_id] = { status: verified ? 'verified' : 'unknown', statement: `${f.statement} | domain: ${k.domain}`, answers: f.answers ?? [], source_page: paged ? (/PDF page (\d+)/.exec(f.source_ref.ref)?.[1] ?? null) : null };
  }
  const context = {
    _context: {
      kind: 'v1_derived_synthetic_context',
      note: 'Context assembled from V1 run files for the projected fixture; not a production binding.',
      sources: [
        { path: 'runs/2026-06-11-citizenship/17-enriched-blueprint.json', sha256: sha256File(bpPath) },
        { path: 'runs/2026-06-11-citizenship/03-knowledge-graph.json', sha256: sha256File(kgPath) },
        { path: 'runs/2026-06-11-citizenship/16-blueprint.json', sha256: sha256File(exPath) },
        { path: 'runs/2026-06-11-citizenship/19-learning-loop.json', sha256: sha256File(llPath) },
      ],
      fact_status_rule: 'verified iff tier official|regulator AND confidence high AND needs_review false AND ref cites a page; else unknown',
    },
    strip_fixture_meta: true,
    input_manifest_sha256: artifact.input_manifest_sha256,
    learning_loop: { ref: learningLoopRef },
    accepted_inputs: { module_ids: kg.modules.map(m => m.id) },
    exam_facts_view: {
      by_form: {
        'mock-2025-form-A': { n_questions: { value: exam.n_asked_max, status: 'verified', source_page: FORM_META['mock-2025-form-A'].page }, passing: { value: exam.n_correct_to_pass, status: 'verified', source_page: FORM_META['mock-2025-form-A'].page } },
        'mock-2025-form-B': { n_questions: { value: exam.n_asked_max, status: 'verified', source_page: FORM_META['mock-2025-form-B'].page }, passing: { value: exam.n_correct_to_pass, status: 'verified', source_page: FORM_META['mock-2025-form-B'].page } },
        'mock-2025-form-65-20': { n_questions: { value: 10, status: 'verified', source_page: FORM_META['mock-2025-form-65-20'].page }, passing: { value: 6, status: 'verified', source_page: FORM_META['mock-2025-form-65-20'].page } },
      },
    },
    fact_registry: { facts },
  };
  writeFileSync(join(outDir, 'context-v1.json'), JSON.stringify(context, null, 2) + '\n');
  console.log(JSON.stringify({ wrote: ['tools/belt/fixtures/06.exam_bank/v1-projected.json', 'tools/belt/fixtures/06.exam_bank/context-v1.json'], stats: { items: artifact.items.length, split_ok: stats.split_ok, split_failed: stats.split_failed.length, unbound: stats.unbound.length, page_debt: stats.page_debt.length, verified_facts: Object.values(facts).filter(f => f.status === 'verified').length, facts: Object.keys(facts).length } }, null, 2));
}
