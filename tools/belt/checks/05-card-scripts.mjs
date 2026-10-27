// 05.card_scripts compensating checks (layer 2) for schemas-strict/05-voicescripts.schema.json.
// Restores the parent if/then (voice narrated -> tone/pacing/repeat_count/pause_after_ms), minLength,
// minimum and pattern bounds, plus the role-05 pilot invariants: fixed segment order, recall_pause_ms 3000,
// answer == accepted back, teaching carries the accepted hook verbatim, no spoken stage directions,
// practice-only wording, no deictic visual without a bound asset, pronunciation token equality.
// Pure: no network, no file reads, no clock. Missing context -> HOLD, never a guess.
import {
  check, head, isHex64, isNonEmptyString, arr, obj, PROBE_SLUG, spokenTokens,
  stageDirectionViolations, SPEAK_REQUEST_RE, practiceOnlyViolations, scaffoldViolations,
  DEICTIC_VISUAL_RE, factRegistry, UNRESOLVED_FACT_STATUSES, refSha, sameSourceRef,
} from '../lib/cards-sessions-common.mjs';

export const stage_id = '05.card_scripts';
const P = '05';
export const SEGMENT_ORDER = ['question', 'think_ref', 'recall_pause_ms', 'answer', 'teaching'];
export const RECALL_PAUSE_MS = 3000;
const PROPER_NOUN_RE = /^\p{Lu}[\p{L}'’.-]*(\s+\p{Lu}[\p{L}'’.-]*)*$/u;

// All narrated text of a script with a label (what a future render would speak).
function narratedTexts(s, thinkCue) {
  const out = [];
  const g = s.segments;
  if (g && typeof g === 'object') {
    out.push(['question.lead_in', g.question?.lead_in], ['question.text', g.question?.text], ['answer.lead_in', g.answer?.lead_in], ['answer.text', g.answer?.text], ['teaching.text', g.teaching?.text]);
  }
  if (s.recap && typeof s.recap === 'object') {
    out.push(['recap.narration_text', s.recap.narration_text]);
    arr(s.recap.hooks_spoken).forEach((h, i) => out.push([`recap.hooks_spoken[${i}]`, h]));
  }
  return out.filter(([, t]) => typeof t === 'string');
}

function acceptedDeck(context) {
  const d = context?.accepted_inputs?.carddeck;
  if (!d || !Array.isArray(d.decks)) return null;
  const cards = new Map();
  for (const deck of d.decks) for (const c of arr(deck?.cards)) cards.set(c?.card_id, c);
  const recaps = new Map(arr(d.recaps).map(r => [r?.module_id, r]));
  return { cards, recaps, decks: d.decks };
}

export function run(artifact, context = {}) {
  const a = obj(artifact);
  const scripts = arr(a.audio_scripts).map(obj);
  const cardScripts = scripts.filter(s => s.is_recap === false);
  const recapScripts = scripts.filter(s => s.is_recap === true);
  const out = [];

  // ---- 05.STRING_BOUNDS: pattern/minLength/minimum restored ----
  {
    const bad = [];
    if (typeof a.probe !== 'string' || !PROBE_SLUG.test(a.probe)) bad.push(`/probe ${JSON.stringify(a.probe)} !~ ^[a-z0-9][a-z0-9-]*$`);
    if (!isHex64(a.input_manifest_sha256)) bad.push('/input_manifest_sha256 not 64 lowercase hex');
    if (!isNonEmptyString(a.candidate_lineage_id)) bad.push('/candidate_lineage_id empty');
    if (!isHex64(a.media_disposition_ref?.sha256) || !isNonEmptyString(a.media_disposition_ref?.path)) bad.push('/media_disposition_ref path empty or sha256 not hex');
    if (!isNonEmptyString(a.think_cue?.cue_id) || !isNonEmptyString(a.think_cue?.text)) bad.push('/think_cue cue_id/text empty');
    scripts.forEach((s, i) => {
      const p = `/audio_scripts/${i}`;
      for (const k of ['script_id', 'card_id', 'module_id']) if (!isNonEmptyString(s[k])) bad.push(`${p}/${k} empty`);
      if (!isNonEmptyString(s.source_ref?.ref)) bad.push(`${p}/source_ref/ref empty`);
      if (s.repeat_count !== null && s.repeat_count !== undefined && !(Number.isInteger(s.repeat_count) && s.repeat_count >= 1)) bad.push(`${p}/repeat_count ${s.repeat_count} < 1`);
      if (s.pause_after_ms !== null && s.pause_after_ms !== undefined && !(Number.isInteger(s.pause_after_ms) && s.pause_after_ms >= 0)) bad.push(`${p}/pause_after_ms ${s.pause_after_ms} < 0`);
      arr(s.pronunciation).forEach((x, j) => { if (!isNonEmptyString(x?.term) || !isNonEmptyString(x?.say)) bad.push(`${p}/pronunciation/${j} term/say empty`); });
      const g = s.segments;
      if (g && typeof g === 'object') for (const [k, v] of [['question.text', g.question?.text], ['answer.text', g.answer?.text], ['teaching.text', g.teaching?.text], ['think_ref', g.think_ref]]) if (!isNonEmptyString(v)) bad.push(`${p}/segments/${k} empty`);
    });
    out.push(bad.length ? check(`${P}.STRING_BOUNDS`, 'FAIL', `${bad.length} bound violation(s): ${head(bad)}`, { violations: bad.length })
      : check(`${P}.STRING_BOUNDS`, 'PASS', `slug, hashes, non-empty ids/segments, repeat_count>=1, pause_after_ms>=0 over ${scripts.length} scripts`, { violations: 0 }));
  }

  // ---- 05.SCRIPT_IDS ----
  {
    const seen = new Set(); const dup = [];
    for (const s of scripts) { if (seen.has(s.script_id)) dup.push(s.script_id); seen.add(s.script_id); }
    const dupCard = []; const seenCard = new Set();
    for (const s of cardScripts) { if (seenCard.has(s.card_id)) dupCard.push(s.card_id); seenCard.add(s.card_id); }
    const bad = [...dup.map(i => `duplicate script_id ${i}`), ...dupCard.map(i => `card ${i} scripted twice`)];
    out.push(bad.length ? check(`${P}.SCRIPT_IDS`, 'FAIL', head(bad)) : check(`${P}.SCRIPT_IDS`, 'PASS', `${scripts.length} unique script ids; ${cardScripts.length} card scripts, ${recapScripts.length} recap scripts`, { card_scripts: cardScripts.length, recap_scripts: recapScripts.length }));
  }

  // ---- 05.NARRATED_FIELDS: parent if voice=narrated then tone/pacing/repeat_count/pause_after_ms ----
  {
    const bad = scripts.filter(s => s.voice === 'narrated' && ['tone', 'pacing', 'repeat_count', 'pause_after_ms'].some(k => s[k] === null || s[k] === undefined)).map(s => s.script_id);
    out.push(bad.length ? check(`${P}.NARRATED_FIELDS`, 'FAIL', `${bad.length} narrated script(s) missing tone/pacing/repeat_count/pause_after_ms (parent if/then): ${head(bad)}`)
      : check(`${P}.NARRATED_FIELDS`, 'PASS', 'every narrated script sets tone, pacing, repeat_count and pause_after_ms (parent if/then restored)'));
  }

  // ---- 05.SCRIPT_SHAPE: card vs recap vs figural shape ----
  {
    const bad = [];
    for (const s of scripts) {
      if (s.is_recap === true) {
        if (s.segments !== null) bad.push(`${s.script_id}: recap carries segments`);
        if (!s.recap || typeof s.recap !== 'object') bad.push(`${s.script_id}: recap object null`);
        else if (arr(s.recap.hooks_spoken).length < 1 || !isNonEmptyString(s.recap.narration_text)) bad.push(`${s.script_id}: recap has no hooks_spoken or narration_text`);
        if (s.must_match_card_back !== null || s.must_match_memory_hook !== null) bad.push(`${s.script_id}: recap carries a back/hook equality target (must be null)`);
      } else if (s.voice === 'N/A') {
        if (s.segments !== null || s.recap !== null) bad.push(`${s.script_id}: figural N/A script carries segments/recap`);
        if (s.visual_route !== 'tap_ui') bad.push(`${s.script_id}: voice N/A without visual_route tap_ui`);
      } else {
        if (!s.segments || typeof s.segments !== 'object') bad.push(`${s.script_id}: narrated card script without segments`);
        if (s.recap !== null) bad.push(`${s.script_id}: card script carries a recap object`);
        if (!isNonEmptyString(s.must_match_card_back) || !isNonEmptyString(s.must_match_memory_hook)) bad.push(`${s.script_id}: must_match_card_back/must_match_memory_hook missing`);
        if (s.visual_route === 'tap_ui') bad.push(`${s.script_id}: narrated card routed to tap_ui`);
      }
    }
    out.push(bad.length ? check(`${P}.SCRIPT_SHAPE`, 'FAIL', `${bad.length} shape defect(s): ${head(bad)}`)
      : check(`${P}.SCRIPT_SHAPE`, 'PASS', 'card scripts carry segments + both equality targets; recaps carry is_recap and no back; figural scripts route to tap_ui'));
  }

  // ---- 05.SEGMENT_ORDER ----
  {
    const bad = cardScripts.filter(s => s.segments && typeof s.segments === 'object').filter(s => JSON.stringify(Object.keys(s.segments)) !== JSON.stringify(SEGMENT_ORDER)).map(s => `${s.script_id}: [${Object.keys(s.segments).join(',')}]`);
    out.push(bad.length ? check(`${P}.SEGMENT_ORDER`, 'FAIL', `${bad.length} script(s) out of order (required ${SEGMENT_ORDER.join(' -> ')}): ${head(bad)}`)
      : check(`${P}.SEGMENT_ORDER`, 'PASS', `segments ordered ${SEGMENT_ORDER.join(' -> ')} on every segmented script`));
  }

  // ---- 05.RECALL_PAUSE ----
  {
    const bad = cardScripts.filter(s => s.segments && s.segments.recall_pause_ms !== RECALL_PAUSE_MS).map(s => `${s.script_id}: ${JSON.stringify(s.segments.recall_pause_ms)}`);
    out.push(bad.length ? check(`${P}.RECALL_PAUSE`, 'FAIL', `${bad.length} recall pause(s) != ${RECALL_PAUSE_MS} ms: ${head(bad)}`)
      : check(`${P}.RECALL_PAUSE`, 'PASS', `recall_pause_ms == ${RECALL_PAUSE_MS} on every segmented script (silent data, not spoken words)`));
  }

  // ---- 05.THINK_REF: one shared, speakable, non-directive cue ----
  {
    const bad = [];
    const cue = a.think_cue?.cue_id;
    const wrong = cardScripts.filter(s => s.segments && s.segments.think_ref !== cue).map(s => s.script_id);
    if (wrong.length) bad.push(`${wrong.length} think_ref(s) != think_cue.cue_id ${cue}: ${head(wrong, 5)}`);
    const t = String(a.think_cue?.text ?? '');
    const dirs = stageDirectionViolations(t);
    if (dirs.length) bad.push(`think cue contains stage direction(s): ${dirs.join(',')}`);
    if (SPEAK_REQUEST_RE.test(t)) bad.push('think cue asks the learner to speak');
    out.push(bad.length ? check(`${P}.THINK_REF`, 'FAIL', head(bad)) : check(`${P}.THINK_REF`, 'PASS', `every think_ref resolves to the one shared cue ${cue}; cue text has no direction or speak request`));
  }

  // ---- 05.SELF_EQUALITY: answer == must_match_card_back; teaching contains must_match_memory_hook ----
  {
    const bad = [];
    for (const s of cardScripts) {
      if (!s.segments) continue;
      if (s.segments.answer?.text !== s.must_match_card_back) bad.push(`${s.script_id}: answer.text != must_match_card_back`);
      if (!isNonEmptyString(s.must_match_memory_hook) || !String(s.segments.teaching?.text ?? '').includes(s.must_match_memory_hook)) bad.push(`${s.script_id}: teaching does not contain must_match_memory_hook verbatim`);
    }
    out.push(bad.length ? check(`${P}.SELF_EQUALITY`, 'FAIL', `${bad.length} internal equality defect(s): ${head(bad)}`, { defects: bad.length })
      : check(`${P}.SELF_EQUALITY`, 'PASS', `${cardScripts.length} scripts: answer == must_match_card_back and teaching contains must_match_memory_hook verbatim`, { defects: 0 }));
  }

  // ---- 05.CARD_COVERAGE / 05.CARD_PARITY / 05.RECAP_PARITY against the accepted CardDeck ----
  const deck = acceptedDeck(context);
  if (!deck) {
    out.push(check(`${P}.CARD_COVERAGE`, 'HOLD', 'context.accepted_inputs.carddeck absent — card/script coverage unverified'));
    out.push(check(`${P}.CARD_PARITY`, 'HOLD', 'context.accepted_inputs.carddeck absent — answer/back, question/front and hook equality against accepted card bytes unverified (no guess)'));
    out.push(check(`${P}.RECAP_PARITY`, 'HOLD', 'context.accepted_inputs.carddeck absent — recap hook parity unverified'));
  } else {
    {
      const scripted = new Set(cardScripts.map(s => s.card_id));
      const missing = [...deck.cards.keys()].filter(id => !scripted.has(id));
      const extra = cardScripts.filter(s => !deck.cards.has(s.card_id)).map(s => s.card_id);
      out.push(missing.length || extra.length
        ? check(`${P}.CARD_COVERAGE`, 'FAIL', `${missing.length} accepted card(s) without a script${missing.length ? ': ' + head(missing, 6) : ''}; ${extra.length} script(s) for cards not in the accepted deck${extra.length ? ': ' + head(extra, 6) : ''}`, { accepted_cards: deck.cards.size, missing: missing.length, extra: extra.length })
        : check(`${P}.CARD_COVERAGE`, 'PASS', `${deck.cards.size}/${deck.cards.size} accepted cards scripted exactly once`, { accepted_cards: deck.cards.size, missing: 0, extra: 0 }));
    }
    {
      const bad = []; const counts = { question: 0, answer: 0, back_target: 0, hook_target: 0, teaching_hook: 0, carry: 0 };
      for (const s of cardScripts) {
        const c = deck.cards.get(s.card_id);
        if (!c || !s.segments) continue;
        const g = s.segments;
        if (g.question?.text !== c.front) { counts.question++; bad.push(`${s.card_id}: question.text != card.front`); }
        if (g.answer?.text !== c.back) { counts.answer++; bad.push(`${s.card_id}: answer.text != card.back`); }
        if (s.must_match_card_back !== c.back) { counts.back_target++; bad.push(`${s.card_id}: must_match_card_back != card.back`); }
        if (s.must_match_memory_hook !== c.memory_hook) { counts.hook_target++; bad.push(`${s.card_id}: must_match_memory_hook != card.memory_hook`); }
        if (!String(g.teaching?.text ?? '').includes(c.memory_hook)) { counts.teaching_hook++; bad.push(`${s.card_id}: teaching lacks accepted hook verbatim`); }
        const carryBad = [s.module_id !== c.module_id && 'module_id', (s.unit_id ?? null) !== (c.unit_id ?? null) && 'unit_id', !sameSourceRef(s.source_ref, c.source_ref) && 'source_ref', JSON.stringify(arr(s.fact_ids)) !== JSON.stringify(arr(c.claims_fact_ids)) && 'fact_ids'].filter(Boolean);
        if (carryBad.length) { counts.carry++; bad.push(`${s.card_id}: carry-through differs (${carryBad.join(',')})`); }
      }
      out.push(bad.length ? check(`${P}.CARD_PARITY`, 'FAIL', `${bad.length} parity defect(s) vs accepted card bytes: ${head(bad)}`, counts)
        : check(`${P}.CARD_PARITY`, 'PASS', 'question == front, answer == back, both equality targets == accepted back/hook, teaching contains the accepted hook, module/unit/source_ref/fact_ids carried through', counts));
    }
    {
      const bad = [];
      const byModule = new Map(recapScripts.map(s => [s.module_id, s]));
      for (const [mid, r] of deck.recaps) {
        const s = byModule.get(mid);
        if (!s) { bad.push(`deck ${mid}: no recap script`); continue; }
        const want = arr(r.recap_hooks).map(h => (typeof h === 'string' ? h : h?.text));
        if (JSON.stringify(arr(s.recap?.hooks_spoken)) !== JSON.stringify(want)) bad.push(`${s.script_id}: hooks_spoken != accepted recap hooks`);
        for (const h of want) if (!String(s.recap?.narration_text ?? '').includes(h)) bad.push(`${s.script_id}: narration lacks recap hook verbatim`);
      }
      for (const s of recapScripts) if (!deck.recaps.has(s.module_id)) bad.push(`${s.script_id}: no accepted recap for module ${s.module_id}`);
      out.push(bad.length ? check(`${P}.RECAP_PARITY`, 'FAIL', head(bad)) : check(`${P}.RECAP_PARITY`, 'PASS', `${deck.recaps.size} accepted recaps each scripted with hooks spoken verbatim`));
    }
  }

  // ---- 05.TEACHING_FACT_IDS: teaching spans bind accepted facts ----
  {
    const reg = factRegistry(context);
    const bad = [];
    for (const s of cardScripts) {
      if (!s.segments) continue;
      const ids = arr(s.segments.teaching?.fact_ids);
      if (ids.length < 1) bad.push(`${s.script_id}: teaching.fact_ids empty`);
      else if (new Set(ids).size !== ids.length) bad.push(`${s.script_id}: teaching.fact_ids not unique`);
      if (reg) for (const f of ids) {
        if (!reg[f]) bad.push(`${s.script_id}: ${f} not accepted`);
        else if (UNRESOLVED_FACT_STATUSES.has(String(reg[f].status ?? '').toLowerCase())) bad.push(`${s.script_id}: ${f} status ${reg[f].status}`);
      }
    }
    const status = bad.length ? 'FAIL' : reg ? 'PASS' : 'HOLD';
    out.push(check(`${P}.TEACHING_FACT_IDS`, status, bad.length ? `${bad.length} teaching fact-id defect(s): ${head(bad)}` : reg ? 'every teaching segment binds >=1 unique accepted fact id' : 'teaching fact ids present but context.fact_registry absent — resolution unverified', { defects: bad.length }));
  }

  // ---- 05.STAGE_DIRECTIONS: no spoken stage directions / timing tokens / speak requests ----
  {
    const hits = [];
    for (const s of scripts) for (const [k, t] of narratedTexts(s)) {
      const v = stageDirectionViolations(t);
      if (SPEAK_REQUEST_RE.test(t)) v.push('asks_learner_to_speak');
      if (v.length) hits.push(`${s.script_id}.${k}: ${v.join(',')}`);
    }
    out.push(hits.length ? check(`${P}.STAGE_DIRECTIONS`, 'FAIL', `${hits.length} narrated span(s) with stage directions/timing tokens: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.STAGE_DIRECTIONS`, 'PASS', 'no "[beat]", pause, timed-silence, ellipsis timing marker or speak request in any narrated span', { hits: 0 }));
  }

  // ---- 05.PRACTICE_ONLY: never call authored practice content official/actual/real ----
  {
    const hits = [];
    const texts = [['think_cue.text', a.think_cue?.text]];
    for (const s of scripts) for (const [k, t] of narratedTexts(s)) texts.push([`${s.script_id}.${k}`, t]);
    for (const [k, t] of texts) { const v = practiceOnlyViolations(t); if (v.length) hits.push(`${k}: ${v.join(',')}`); }
    out.push(hits.length ? check(`${P}.PRACTICE_ONLY`, 'FAIL', `${hits.length} span(s) present practice content as official/actual/real: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.PRACTICE_ONLY`, 'PASS', 'no "official answer", "actual test", "real question" (or variants) in any narrated span', { hits: 0 }));
  }

  // ---- 05.LEARNER_SCAFFOLD: "(verify" / QA scaffold / doubled article in narrated content ----
  {
    const hits = [];
    for (const s of scripts) for (const [k, t] of narratedTexts(s)) {
      if (k.endsWith('lead_in')) continue; // lead-ins are connective ("Question:") and are linted by STAGE_DIRECTIONS/PRACTICE_ONLY
      const v = scaffoldViolations(t);
      if (v.length) hits.push(`${s.script_id}.${k}: ${v.join(',')}`);
    }
    out.push(hits.length ? check(`${P}.LEARNER_SCAFFOLD`, 'FAIL', `${hits.length} narrated span(s) leak scaffold text: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.LEARNER_SCAFFOLD`, 'PASS', 'no "(verify", needs_review, QA label or doubled article in narrated content', { hits: 0 }));
  }

  // ---- 05.DEICTIC_VISUAL: "this sign" needs a bound image asset under the media disposition ----
  {
    const md = context?.media_disposition;
    const bad = []; const holds = [];
    for (const s of cardScripts) {
      const q = String(s.segments?.question?.text ?? '');
      const deictic = DEICTIC_VISUAL_RE.test(q);
      if (s.image_asset_id !== null && s.image_asset_id !== undefined) {
        if (!md) holds.push(`${s.script_id}: image_asset_id bound but context.media_disposition absent`);
        else if (md.image_cards_enabled !== true) bad.push(`${s.script_id}: image_asset_id ${s.image_asset_id} while media disposition disables image cards`);
      } else if (deictic) bad.push(`${s.script_id}: question refers to a visual ("${(DEICTIC_VISUAL_RE.exec(q) ?? [''])[0]}") with no bound image asset`);
    }
    out.push(bad.length ? check(`${P}.DEICTIC_VISUAL`, 'FAIL', head(bad)) : holds.length ? check(`${P}.DEICTIC_VISUAL`, 'HOLD', head(holds))
      : check(`${P}.DEICTIC_VISUAL`, 'PASS', 'no deictic visual question without a bound image asset; no image asset bound while image cards are disabled'));
  }

  // ---- 05.PRONUNCIATION: say normalizes to the same spoken tokens as term, or term is a flagged proper noun ----
  {
    const bad = []; let hints = 0; let properNouns = 0;
    for (const s of scripts) for (const x of arr(s.pronunciation)) {
      hints++;
      const same = JSON.stringify(spokenTokens(x?.term)) === JSON.stringify(spokenTokens(x?.say));
      if (same) continue;
      if (x?.proper_noun === true && PROPER_NOUN_RE.test(String(x.term ?? '').trim())) { properNouns++; continue; }
      bad.push(`${s.script_id}: ${JSON.stringify(x?.term)} -> ${JSON.stringify(x?.say)} (${x?.proper_noun === true ? 'flagged proper noun but term is not capitalized words' : 'token change; route to 04'})`);
    }
    out.push(bad.length ? check(`${P}.PRONUNCIATION`, 'FAIL', `${bad.length}/${hints} pronunciation hint(s) break token equality: ${head(bad)}`, { hints, proper_noun_respellings: properNouns, violations: bad.length })
      : check(`${P}.PRONUNCIATION`, 'PASS', `${hints} hint(s): token-equal or flagged proper-noun respelling (${properNouns})`, { hints, proper_noun_respellings: properNouns, violations: 0 }));
  }

  // ---- 05.AUDIO_RENDER: the render sentinel is bound to the pinned text-only disposition ----
  {
    const md = context?.media_disposition;
    if (a.audio_render !== 'deferred:not_applicable_pilot') out.push(check(`${P}.AUDIO_RENDER`, 'FAIL', `audio_render ${JSON.stringify(a.audio_render)} is not the pilot sentinel`));
    else if (!md) out.push(check(`${P}.AUDIO_RENDER`, 'HOLD', 'context.media_disposition absent — render sentinel binding unverified'));
    else {
      const bad = [];
      if (md.rendered_audio_required !== false) bad.push(`media_disposition.rendered_audio_required = ${JSON.stringify(md.rendered_audio_required)}`);
      if (md.live_tts_allowed !== false) bad.push(`media_disposition.live_tts_allowed = ${JSON.stringify(md.live_tts_allowed)}`);
      if (!arr(md.inactive_roles).includes('20')) bad.push('role 20 not listed inactive');
      const sha = refSha(context, 'media_disposition');
      if (!sha) out.push(check(`${P}.AUDIO_RENDER`, bad.length ? 'FAIL' : 'HOLD', bad.length ? head(bad) : 'media_disposition hash absent from context — media_disposition_ref.sha256 unverified'));
      else {
        if (sha !== a.media_disposition_ref?.sha256) bad.push(`media_disposition_ref.sha256 ${a.media_disposition_ref?.sha256} != pinned ${sha}`);
        out.push(bad.length ? check(`${P}.AUDIO_RENDER`, 'FAIL', head(bad)) : check(`${P}.AUDIO_RENDER`, 'PASS', `audio_render sentinel bound to media disposition ${sha} (no rendered audio, no live TTS, role 20 inactive)`));
      }
    }
  }

  // ---- 05.INPUT_BINDING ----
  {
    const exp = context?.input_manifest_sha256;
    if (!isHex64(exp)) out.push(check(`${P}.INPUT_BINDING`, 'HOLD', 'context.input_manifest_sha256 absent — input binding unverified'));
    else out.push(a.input_manifest_sha256 === exp ? check(`${P}.INPUT_BINDING`, 'PASS', `input_manifest_sha256 equals scoped manifest ${exp}`)
      : check(`${P}.INPUT_BINDING`, 'FAIL', `input_manifest_sha256 ${a.input_manifest_sha256} != scoped manifest ${exp}`));
  }

  return out;
}
