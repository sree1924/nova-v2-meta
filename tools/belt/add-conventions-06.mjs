// One-shot: add stage 06.exam_bank output conventions derived from tools/belt/checks/06-exam-bank.mjs (runner, 2026-10-27).
import fs from 'node:fs';
const p = 'schemas-strict/output-conventions.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
const lineage = c.stages['03.combined_kg'].lineage_to_copy;
c.stages['06.exam_bank'] = {
  lineage_to_copy: lineage,
  item_binding: 'Every item: item_id unique; objective_id, node_id (a KG node id), module_id (its KG module), domain, stem non-empty; fact_ids >= 1 and every id exists in fact_registry; source_ref = {ref, pdf_page (integer >= 1), printed_page} copied from the fact. No item without a page (page_debt stays [] — an item you cannot page-cite is not written).',
  options: 'options = EXACTLY 4 entries keyed "A","B","C","D" (unique keys, unique non-empty texts), each with a non-empty rationale; correct_key is one of them; correct_rationale names/endorses the correct option and no rationale endorses another option as right. distractor_source = exactly 3 non-empty strings (one per distractor; label synthesized near-misses as "synthesized near-miss: …").',
  numerals_rule: 'The fact registry facts are status "authored" (not "verified"), and the numeral check only accepts digits anchored in VERIFIED facts. Therefore: in stems, the correct option, correct_rationale and option rationales write EVERY number as words ("two seconds", "one hundred feet", "fifteen miles per hour"); digits may appear only inside distractor option TEXTS. Quiz titles and form titles carry no digits at all.',
  practice_forms: 'practice_forms >= 2 (a retake is a real retest), e.g. form_id "form-a"/"form-b". title MUST contain the word "practice" and NO digits (e.g. "Rules of the Road Practice Test A"). declared_count == item_ids.length (>= 1), no repeated item id within a form. Pairwise item overlap between forms <= 20% (or both forms carry a learner-visible overlap_note). No is_derived item in any form (derived items live only in module quizzes).',
  official_mirror: 'official_mirror per form: n_questions = {value: 50, status: "verified", source_page: <the registered handbook page from safe_run_config.exam_facts>} and passing = {value: 80, status: "verified", source_page: <that page>} ONLY when safe_run_config.exam_facts shows those exact verified values — else {value: null, status: "unknown", source_page: null}. time = {value: null, status: "unknown", source_page: null} (not published). passing_unit "percent_correct" when passing is verified, else "unknown". official_mirror.status = "verified" only if n_questions AND passing are verified AND declared_count equals n_questions.value; otherwise "practice_only". A practice form of 25 items therefore has official_mirror.status "practice_only" even though the exam facts are verified.',
  scoring_policy: 'scoring_policy = {kind: "product_policy", learning_loop_ref: <accepted_inputs.learning_loop_ref, copied exactly>} on every form. Never an official passing claim in learner text.',
  module_quizzes: 'module_quizzes = EXACTLY one per KG module (accepted_inputs.module_ids): {quiz_id, module_id, domain, title (no digits), item_ids non-empty, all items from that module}.',
  banned_claims: 'Learner strings never say actual/real/leaked/official question(s), never predict a pass, never say "full-length" or "full test" (time is unverified). Everything is practice.',
  duplicates: 'No two items with the same normalized stem AND same correct answer; no two items with identical correct option + distractor set + rationale (clones).',
  honesty_counters: 'needs_review_count = 0 and no item has needs_review true; self_flagged_distractors = [] and no item has self_flagged true; page_debt = []. If you are unsure of an item, drop it rather than flag it.',
  scope: 'Bank the compiled Section 9 facts: aim for 1–2 items per fact (~50–70 items), each stem a scenario or recall question in your own words (never a handbook sentence verbatim), 3 plausible near-miss distractors drawn from confusable rules.'
};
fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
console.log('06 rules', Object.keys(c.stages['06.exam_bank']).length);
