// One-shot: add 05.sessions and 05.card_scripts output conventions derived from tools/belt/checks/05-*.mjs (runner, 2026-10-27).
import fs from 'node:fs';
const p = 'schemas-strict/output-conventions.json';
const c = JSON.parse(fs.readFileSync(p, 'utf8'));
const lineage = c.stages['03.combined_kg'].lineage_to_copy;
c.stages['05.sessions'] = {
  lineage_to_copy: lineage + ' Also source_registry_sha256 = runtime_bindings.source_registry_sha256.',
  units: 'units[] = one teaching unit per KG module (unit_id unique, module_id = the KG module, objective_ids >= 1 unique). Every learner span is an object {text, fact_ids} with fact_ids >= 1, unique, and EVERY id present in fact_registry (status authored is fine; never an id that is not in the registry).',
  decompression_fields: 'Each unit populates ALL of: why_how[] (>= 1 span), worked_example {scenario, reasoning, result}, misconception {claim, correction}, memory_support, self_check {prompt, answer, rationale}. misconception.claim text must contain an explicit wrong-alternative label word: "misconception", "myth", "common mistake", "many people think", "wrong", "not true" or "trap".',
  self_check: 'self_check.answer shares >= 1 fact id with self_check.prompt; the prompt tests a fact that also appears in why_how / worked_example / misconception; at least one slide of kind "self_check" carries the prompt\'s fact ids (in its title, lines or narration). The self-check prompt is never a verbatim exam-bank stem (accepted_inputs.exam_stems).',
  slides: 'slides[] per unit: 6..8 slides; first slide kind "opening", last kind "close"; at least one "trap" or "bridge" slide and at least one "self_check" slide; kinds otherwise "concept". Every slide: title <= 6 words, lines = 1..4 spans of <= 15 words each (concept slides 2..4 lines), slide_id unique, narration {text, fact_ids} and estimated_narration_seconds a number in 30..60 (text-cadence estimate: ~2.5 words per second).',
  variety: 'Across >= 2 units the slide counts must NOT all be equal (e.g. 7, 6, 8 — never 7, 7, 7).',
  narration_depth: 'Average narration text length per unit >= 400 characters (aim 450–700 per slide). Narration is plain spoken prose: no stage directions ("[pause]", "(beat)", "pause for three seconds", ellipses "..."), never asks the learner to speak or say anything aloud.',
  learner_text_hygiene: 'No span contains "(verify", needs_review, flag-as, QA scaffold, doubled articles, internal ids (fact ids, unit/slide/module ids, objective ids), hashes, or the words fact_ids/source_ref/node_id/slide_id/schema_version. Titles make no countable promise ("Top 5", "All 10 rules", "7 signs").',
  scope: 'Teach the compiled Section 9 facts through the KG modules (accepted_inputs.knowledge_graph). Use the accepted card hooks (accepted_inputs.carddeck, when present) as memory_support where they fit.'
};
c.stages['05.card_scripts'] = {
  lineage_to_copy: lineage,
  coverage: 'audio_scripts[] = exactly ONE card script per accepted card in accepted_inputs.carddeck (is_recap false, card_id = that card, module_id = its deck) PLUS exactly ONE recap script per deck (is_recap true, module_id = the deck module_id). No scripts for cards that are not in the accepted deck. script_id unique.',
  segments: 'Card script segments object has EXACTLY these keys in THIS order: question, think_ref, recall_pause_ms, answer, teaching. question = {lead_in, text} where text == the accepted card front; think_ref == think_cue.cue_id (one shared cue for the whole artifact, speakable, no direction, never asks the learner to speak); recall_pause_ms == 3000 (silent data); answer = {lead_in, text} where text is BYTE-EQUAL to the accepted card back and equals must_match_card_back; teaching = {text} containing must_match_memory_hook verbatim, where must_match_memory_hook equals the accepted card memory_hook.',
  recap_scripts: 'Recap script: segments null, must_match_card_back null, must_match_memory_hook null, recap = {narration_text, hooks_spoken: [every recap hook text of that deck, verbatim]}.',
  voice_fields: 'voice "narrated" on every script, with tone, pacing, repeat_count (integer >= 1) and pause_after_ms (integer >= 0) all set. visual_route is NOT "tap_ui" for narrated scripts. source_ref = the card source_ref copied exactly ({ref, pdf_page, printed_page, page_map_id}).',
  spoken_hygiene: 'Narrated text never contains stage directions ("[pause]", "(beat)", timed silences, ellipses), never asks the learner to speak, never presents practice as official/actual/real, never leaks "(verify"/scaffold text, never refers to a visual ("this sign", "shown here"). pronunciation hints only for proper nouns, as {term, say} with the same number of tokens.',
  audio_render: 'audio_render MUST be the literal "deferred:not_applicable_pilot" and media_disposition_ref = {path, sha256} copied from runtime_bindings (pilot media disposition). No audio is rendered in this pilot; these are text scripts.',
  scope: 'Script every accepted card; keep lead_ins short and warm; the teaching segment explains the rule in two or three spoken sentences and ends with the hook.'
};
fs.writeFileSync(p, JSON.stringify(c, null, 2) + '\n');
console.log(Object.keys(c.stages).map(k => k + ':' + Object.keys(c.stages[k]).length).join(' '));
