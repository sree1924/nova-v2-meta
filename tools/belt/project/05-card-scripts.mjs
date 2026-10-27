// 05.card_scripts fixture projector/generator (Claude lane, v0.4.0).
// export projectV1(v1VoiceScripts, v1AudioSegments, opts) -> {artifact, notes} adapter-shaped VoiceScripts
//   (fixture/reference, never a DMV result). V1 fuses each card script into one narration_text; it is split
//   by the V1 markers "Question: " / " ... Take a moment. Think about your answer. ... " / "Here is the official answer: ".
// export practiceNormalize(artifact) -> {artifact, diff[]} minimal normalization for the practice-only + timing lints
// CLI: node tools/belt/project/05-card-scripts.mjs --write
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File, sha256Canonical } from '../lib/hash.mjs';
import { projectV1 as projectCards, parsePdfPage, syntheticPositive as syntheticDeck, syntheticContext as syntheticDeckContext, V1_PATH as V1_DECK_PATH } from './04-cards.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const NOVA = resolve(LANE, '..');
export const V1_PATH = 'runs/2026-06-11-citizenship/05-voicescripts.json';
export const V1_SEGMENTS_PATH = 'runs/2026-06-11-citizenship/audio-segments.json';
const MEDIA_DISPOSITION_PATH = 'contracts/media-disposition.json';
const FIX_DIR = join(LANE, 'tools', 'belt', 'fixtures', '05.card_scripts');
export const V1_THINK_TEXT = 'Take a moment. Think about your answer.';
const FUSED_RE = /^Question: ([\s\S]*?) \.\.\. Take a moment\. Think about your answer\. \.\.\. (Here is the official answer:) ([\s\S]*)$/;
const PROPER_NOUN_HEURISTIC = /^\p{Lu}\p{Ll}+$/u;

const projSourceRef = (r) => ({ ref: r?.ref ?? '', tier: r?.tier, url: r?.url ?? null, pdf_page: parsePdfPage(r?.ref), printed_page: null, page_map_id: null });

export function projectV1(v1, segs, { mediaDispositionSha256, v1Sha256 } = {}) {
  const notes = { unsplit: [], answer_prefix_mismatch: [], hook_not_found: [] };
  const scripts = v1.audio_scripts.map(s => {
    const common = {
      script_id: `script.${s.card_id}`,
      card_id: s.card_id,
      module_id: s.module_id,
      unit_id: s.unit_id ?? null,
      is_recap: s.must_match_card_back === false,
      voice: s.voice,
      mode: s.mode,
      tone: s.tone ?? null, pacing: s.pacing ?? null, repeat_count: s.repeat_count ?? null, pause_after_ms: s.pause_after_ms ?? null,
      pronunciation: (s.pronunciation ?? []).map(p => ({ term: p.term, say: p.say, proper_noun: PROPER_NOUN_HEURISTIC.test(p.term) })),
      visual_sync: (s.visual_sync ?? []).map(v => ({ text_span: v.text_span, timing_hint: v.timing_hint })),
      source_ref: projSourceRef(s.source_ref),
      fact_ids: [],
      visual_route: s.visual_route ?? null,
      image_asset_id: null,
    };
    if (common.is_recap) {
      return { ...common, segments: null, recap: { hooks_spoken: s.recap_hooks_spoken ?? [], narration_text: s.narration_text }, must_match_card_back: null, must_match_memory_hook: null };
    }
    const m = FUSED_RE.exec(s.narration_text);
    let segments = null; let hook = null;
    if (!m) notes.unsplit.push(s.card_id);
    else {
      const back = s.must_match_card_back;
      let rest = m[3]; let answerText = back;
      if (rest.startsWith(back)) rest = rest.slice(back.length).replace(/^\.\s*/, '').trim();
      else { notes.answer_prefix_mismatch.push(s.card_id); answerText = rest; rest = ''; }
      const h = /To help it stick: ([\s\S]*?)(?: One more time\. [\s\S]*)?$/.exec(rest);
      hook = h ? h[1] : null;
      if (!hook) notes.hook_not_found.push(s.card_id);
      segments = {
        question: { lead_in: 'Question:', text: m[1] },
        think_ref: 'think.shared',
        recall_pause_ms: segs.pause_ms,
        answer: { lead_in: m[2], text: answerText },
        teaching: { text: rest, fact_ids: [] },
      };
    }
    return { ...common, segments, recap: null, must_match_card_back: s.must_match_card_back, must_match_memory_hook: hook };
  });
  const artifact = {
    schema_version: '1.0.0',
    adapter_version: 'voicescripts-pilot.v0.4.0',
    minted_by: { model: v1.minted_by?.model ?? '', lane: v1.minted_by?.lane ?? '', pass: v1.minted_by?.pass ?? '' },
    probe: v1.probe,
    audience: v1.audience,
    input_manifest_sha256: sha256Canonical(v1.input_artifact_refs ?? []),
    candidate_lineage_id: `V1-REFERENCE:${V1_PATH}@${v1Sha256 ?? 'unhashed'} (fixture, not a DMV result)`,
    media_disposition_ref: { path: MEDIA_DISPOSITION_PATH, sha256: mediaDispositionSha256 },
    audio_render: 'deferred:not_applicable_pilot',
    think_cue: { cue_id: 'think.shared', text: V1_THINK_TEXT },
    audio_scripts: scripts,
  };
  return { artifact, notes };
}

// Minimal normalization of V1 bytes for the two text lints that legitimately fail on V1:
// N1 "Here is the official answer:" -> "Here is the answer:" (practice-only wording; the 05 contract's own lead-in)
// N2 " ... " ellipsis timing markers in recap narration -> " " (V1 narration_grammar declares "..." a pause marker)
export function practiceNormalize(artifact) {
  const a = JSON.parse(JSON.stringify(artifact)); const diff = [];
  for (const s of a.audio_scripts) {
    if (s.segments && s.segments.answer.lead_in === 'Here is the official answer:') {
      diff.push({ pointer: `${s.script_id}/segments/answer/lead_in`, before: s.segments.answer.lead_in, after: 'Here is the answer:', rule: 'N1-practice-only-lead-in' });
      s.segments.answer.lead_in = 'Here is the answer:';
    }
    if (s.recap && /\.\.\.|…/.test(s.recap.narration_text)) {
      const after = s.recap.narration_text.replace(/\s*(\.\.\.|…)\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
      diff.push({ pointer: `${s.script_id}/recap/narration_text`, before: s.recap.narration_text, after, rule: 'N2-ellipsis-timing-marker' });
      s.recap.narration_text = after;
    }
  }
  return { artifact: a, diff };
}

// ---- synthetic fixtures built over the 04 synthetic deck ----
export function syntheticScripts(deck, mdSha) {
  const scripts = [];
  for (const d of deck.decks) for (const c of d.cards) scripts.push({
    script_id: `script.${c.card_id}`, card_id: c.card_id, module_id: c.module_id, unit_id: c.unit_id, is_recap: false,
    voice: 'narrated', mode: 'read_answer',
    segments: {
      question: { lead_in: 'Question:', text: c.front },
      think_ref: 'think.shared',
      recall_pause_ms: 3000,
      answer: { lead_in: 'Here is the answer:', text: c.back },
      teaching: { text: `Key point: ${c.back} Remember: ${c.memory_hook}. Once more: ${c.back}`, fact_ids: [...c.claims_fact_ids] },
    },
    recap: null,
    must_match_card_back: c.back, must_match_memory_hook: c.memory_hook,
    tone: 'coach', pacing: 'standard', repeat_count: 1, pause_after_ms: 1000,
    pronunciation: c.card_id === 'syn-card-02' ? [{ term: 'Gamma', say: 'GAM-uh', proper_noun: true }, { term: 'U.S.', say: 'U S', proper_noun: false }] : [],
    visual_sync: [{ text_span: c.back, timing_hint: 'highlight the answer while it is read' }],
    source_ref: { ...c.source_ref }, fact_ids: [...c.claims_fact_ids], visual_route: null, image_asset_id: null,
  });
  for (const r of deck.recaps) {
    const hooks = r.recap_hooks.map(h => h.text);
    scripts.push({
      script_id: `script.recap.${r.module_id}`, card_id: `recap.${r.module_id}`, module_id: r.module_id, unit_id: null, is_recap: true,
      voice: 'narrated', mode: 'rapid_review', segments: null,
      recap: { hooks_spoken: hooks, narration_text: `Deck recap: ${r.module}. ${hooks.join(' ')} That is the recap for this deck.` },
      must_match_card_back: null, must_match_memory_hook: null,
      tone: 'coach', pacing: 'standard', repeat_count: 1, pause_after_ms: 1200, pronunciation: [], visual_sync: [],
      source_ref: { ref: 'SYNTHETIC recap over deck cards', tier: 'unverified', url: null, pdf_page: null, printed_page: null, page_map_id: null },
      fact_ids: [...new Set(r.recap_hooks.flatMap(h => h.fact_ids))], visual_route: null, image_asset_id: null,
    });
  }
  return {
    schema_version: '1.0.0', adapter_version: 'voicescripts-pilot.v0.4.0',
    minted_by: { model: 'synthetic-fixture', lane: 'none', pass: 'none' }, probe: 'synthetic-fixture', audience: 'Adult',
    input_manifest_sha256: 'd'.repeat(64), candidate_lineage_id: 'SYNTHETIC-NOT-A-RUN',
    media_disposition_ref: { path: MEDIA_DISPOSITION_PATH, sha256: mdSha }, audio_render: 'deferred:not_applicable_pilot',
    think_cue: { cue_id: 'think.shared', text: 'Take a moment. Think about your answer.' },
    audio_scripts: scripts,
  };
}

const sc = (a, id) => a.audio_scripts.find(s => s.card_id === id);
export const SYNTHETIC_NEGATIVES = [
  { name: 'synthetic-neg-answer-mismatch', fail: ['05.CARD_PARITY', '05.SELF_EQUALITY'], note: 'answer segment paraphrases the accepted back', mutate: a => { sc(a, 'syn-card-01').segments.answer.text = 'The synthetic rule wants you to slow down.'; } },
  { name: 'synthetic-neg-hook-mismatch', fail: ['05.CARD_PARITY', '05.SELF_EQUALITY'], note: 'teaching drops the accepted hook and must_match_memory_hook is rewritten', mutate: a => { const s = sc(a, 'syn-card-01'); s.must_match_memory_hook = 'Stop at the line'; s.segments.teaching.text = 'Key point: stop. Remember: stop at the line.'; } },
  // 2026-10-27: provider strict-mode JSON sorts object keys, so key ORDER is not observable; the check now requires the exact
  // segment key SET. The negative is therefore a lost recall beat: recall_pause_ms absent (teaching renamed to a stray key).
  { name: 'synthetic-neg-segment-order', fail: ['05.SEGMENT_ORDER'], note: 'recall beat lost: segments lack recall_pause_ms and carry a stray key (key SET, not order — provider sorts keys)', mutate: a => { const s = sc(a, 'syn-card-01'); const g = s.segments; s.segments = { question: g.question, think_ref: g.think_ref, answer: g.answer, teaching: g.teaching, recall_pause: g.recall_pause_ms }; } },
  { name: 'synthetic-neg-recall-pause', fail: ['05.RECALL_PAUSE'], note: 'recall pause 2000 ms instead of 3000', mutate: a => { sc(a, 'syn-card-02').segments.recall_pause_ms = 2000; } },
  { name: 'synthetic-neg-stage-direction', fail: ['05.STAGE_DIRECTIONS'], note: 'teaching narrates "[beat]" and "pause for three seconds"', mutate: a => { const g = sc(a, 'syn-card-02').segments; g.teaching.text = `[beat] Now pause for three seconds. ${g.teaching.text}`; } },
  { name: 'synthetic-neg-official-answer', fail: ['05.PRACTICE_ONLY'], note: 'answer lead-in calls the authored back "the official answer" and teaching says "real test question"', mutate: a => { const g = sc(a, 'syn-card-03').segments; g.answer.lead_in = 'Here is the official answer:'; g.teaching.text += ' This is a real test question.'; } },
  { name: 'synthetic-neg-deictic', fail: ['05.DEICTIC_VISUAL'], note: 'question says "this sign" with no bound image asset (image cards disabled)', mutate: a => { sc(a, 'syn-card-01').segments.question.text = 'What does this sign require?'; } },
  { name: 'synthetic-neg-pronunciation', fail: ['05.PRONUNCIATION'], note: 'pronunciation hint changes the spoken amount (20 -> twenty five)', mutate: a => { sc(a, 'syn-card-03').pronunciation.push({ term: '20', say: 'twenty five', proper_noun: false }); } },
  { name: 'synthetic-neg-missing-script', fail: ['05.CARD_COVERAGE'], note: 'accepted card syn-card-02-b has no script', mutate: a => { a.audio_scripts = a.audio_scripts.filter(s => s.card_id !== 'syn-card-02-b'); } },
];

const writeJson = (p, v) => writeFileSync(p, JSON.stringify(v, null, 2) + '\n');

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  mkdirSync(FIX_DIR, { recursive: true });
  const v1Abs = join(NOVA, V1_PATH); const segAbs = join(NOVA, V1_SEGMENTS_PATH); const deckAbs = join(NOVA, V1_DECK_PATH); const mdAbs = join(LANE, MEDIA_DISPOSITION_PATH);
  const v1Sha = sha256File(v1Abs); const segSha = sha256File(segAbs); const deckSha = sha256File(deckAbs); const mdSha = sha256File(mdAbs);
  const genSha = sha256File(fileURLToPath(import.meta.url));
  const v1 = JSON.parse(readFileSync(v1Abs, 'utf8')); const segs = JSON.parse(readFileSync(segAbs, 'utf8'));
  const md = JSON.parse(readFileSync(mdAbs, 'utf8'));
  const { artifact, notes } = projectV1(v1, segs, { mediaDispositionSha256: mdSha, v1Sha256: v1Sha });
  const acceptedDeck = projectCards(JSON.parse(readFileSync(deckAbs, 'utf8')), { mediaDispositionSha256: mdSha, v1Sha256: deckSha });
  const segCards = new Set(segs.cards); const scripted = new Set(artifact.audio_scripts.filter(s => !s.is_recap).map(s => s.card_id));
  const meta = (kind, extra) => ({
    kind, label: 'FIXTURE/REFERENCE — projected from the V1 citizenship run; never a DMV production result',
    source: { path: V1_PATH, sha256: v1Sha }, companion: { path: V1_SEGMENTS_PATH, sha256: segSha },
    projector: { path: 'tools/belt/project/05-card-scripts.mjs', sha256: genSha },
    counts: { scripts: artifact.audio_scripts.length, card_scripts: scripted.size, recap_scripts: artifact.audio_scripts.length - scripted.size, audio_segments_cards: segCards.size, audio_segments_cards_without_v1_script: [...segCards].filter(c => !scripted.has(c)).length },
    split: { regex: FUSED_RE.source, unsplit: notes.unsplit, answer_prefix_mismatch: notes.answer_prefix_mismatch, hook_not_found: notes.hook_not_found },
    decisions: [
      'card scripts (must_match_card_back is a string): narration_text split into question/answer/teaching by the V1 markers; question.lead_in "Question:"; answer.lead_in = the V1 phrase "Here is the official answer:" (kept: it is V1 bytes)',
      'answer.text = must_match_card_back (narration embeds it verbatim right after the lead-in); teaching.text = remaining narration after the back and its separator ("." and/or one space, dropped) (plain-English support + "To help it stick: <hook>" + repeats)',
      `think_ref = "think.shared"; think_cue.text = "${V1_THINK_TEXT}" (the fused V1 think span; V1 renders it as the shared clip ${segs.think} per ${V1_SEGMENTS_PATH})`,
      `recall_pause_ms = ${segs.pause_ms} from ${V1_SEGMENTS_PATH} pause_ms`,
      'must_match_memory_hook = the narrated span after "To help it stick: " up to " One more time." (V1 has no hook equality field; the span is V1 narration bytes, not the current card hook)',
      'recap scripts (must_match_card_back false): is_recap true, segments null, recap {hooks_spoken: recap_hooks_spoken, narration_text}, both equality targets null (parent false -> adapter null)',
      'pronunciation proper_noun := /^\\p{Lu}\\p{Ll}+$/u.test(term) (capitalized single word: Iroquois, Connecticut, …); V1 has no proper-noun flag',
      'source_ref.pdf_page parsed as in the 04 projector; fact_ids [] and teaching.fact_ids [] (V1 carries no fact ids)',
      'input_manifest_sha256 = sha256(canonicalJson(V1 input_artifact_refs)) — a projection digest, NOT a real input manifest',
      `media_disposition_ref = ${MEDIA_DISPOSITION_PATH}@${mdSha} and audio_render sentinel added by the projection (V1 rendered real mp3 audio; the pilot does not)`,
      'dropped V1 script fields: bank_q, is_dynamic, narration_text (replaced by segments/recap.narration_text); dropped V1 root fields: artifact, version, input_artifact_refs, carddeck_artifact_hash, narration_grammar, jam_notes, script_counts, artifact_hash',
    ],
    ...extra,
  });
  const v1Context = {
    _context_note: `V1 reference context: accepted_inputs.carddeck = the 04 projection of ${V1_DECK_PATH}@${deckSha} (current V1 deck bytes, projected by tools/belt/project/04-cards.mjs). No fact registry or input manifest exists for V1 -> those checks HOLD.`,
    accepted_inputs: { carddeck: acceptedDeck },
    media_disposition: md,
    ref_sha256: { media_disposition: mdSha, carddeck_v1_source: deckSha },
  };
  writeJson(join(FIX_DIR, 'v1-projected.json'), { _fixture: meta('v1_projection', {}), ...artifact });
  writeJson(join(FIX_DIR, 'v1-projected.context.json'), v1Context);
  const { artifact: norm, diff } = practiceNormalize(artifact);
  const ruleCounts = {}; for (const d of diff) ruleCounts[d.rule] = (ruleCounts[d.rule] ?? 0) + 1;
  writeJson(join(FIX_DIR, 'v1-projected-practice-normalized.json'), { _fixture: meta('v1_projection_practice_normalized', { normalization: { scope: 'answer.lead_in and recap.narration_text only; nothing else changed', rule_counts: ruleCounts, fields_changed: diff.length }, diff }), ...norm });
  writeJson(join(FIX_DIR, 'v1-projected-practice-normalized.context.json'), v1Context);

  const deck = syntheticDeck(mdSha);
  const pos = syntheticScripts(deck, mdSha);
  const deckCtx = syntheticDeckContext(md, mdSha);
  const ctx = { _context_note: 'SYNTHETIC validator context only — the accepted carddeck is the 04 synthetic positive fixture.', input_manifest_sha256: 'd'.repeat(64), fact_registry: deckCtx.fact_registry, accepted_inputs: { carddeck: deck }, media_disposition: md, ref_sha256: { media_disposition: mdSha } };
  const synMeta = (kind, note, expect) => ({ kind, label: 'SYNTHETIC validator interface fixture — not a qualification, source or run', generator: { path: 'tools/belt/project/05-card-scripts.mjs', sha256: genSha }, note, expect });
  writeJson(join(FIX_DIR, 'synthetic-positive.json'), { _fixture: synMeta('synthetic_positive', 'template-arc scripts over the 04 synthetic deck', { status: 'PASS' }), ...pos });
  writeJson(join(FIX_DIR, 'synthetic-positive.context.json'), ctx);
  writeJson(join(FIX_DIR, 'synthetic-hold-no-context.json'), { _fixture: synMeta('synthetic_hold', 'positive bytes with NO context: deck parity, fact resolution, render binding and input binding must HOLD', { status: 'HOLD' }), ...pos });
  for (const n of SYNTHETIC_NEGATIVES) {
    const a = JSON.parse(JSON.stringify(pos)); n.mutate(a);
    writeJson(join(FIX_DIR, `${n.name}.json`), { _fixture: synMeta('synthetic_negative', n.note, { status: 'FAIL', fail: n.fail }), ...a });
    writeJson(join(FIX_DIR, `${n.name}.context.json`), ctx);
  }
  console.log(JSON.stringify({ written: FIX_DIR, v1_sha256: v1Sha, segments_sha256: segSha, notes, normalized_fields: diff.length, rule_counts: ruleCounts }, null, 2));
}
