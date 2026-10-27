// 05.sessions compensating checks (layer 2) for schemas-strict/05b-session-scripts.schema.json — the
// strict-mode projection of Sol's contracts/teaching-unit.schema.json. Restores every keyword the
// projection dropped (const->enum is kept in-schema; minLength, minItems, maxItems, uniqueItems,
// pattern, minimum, maximum are restored here) and every x-post-validation bullet of the owned schema.
// Pure: no network, no file reads, no clock. Missing context -> HOLD, never a guess.
import {
  check, head, isHex64, isNonEmptyString, arr, obj, wordCount, normalizeForCompare,
  scaffoldViolations, stageDirectionViolations, SPEAK_REQUEST_RE, factRegistry, UNRESOLVED_FACT_STATUSES,
} from '../lib/cards-sessions-common.mjs';

export const stage_id = '05.sessions';
const P = '05';
export const LIMITS = {
  min_slides: 6, max_slides: 8, min_lines: 1, max_lines: 4, concept_min_lines: 2, concept_max_lines: 4,
  title_max_words: 6, line_max_words: 15, min_avg_narration_chars: 400, narration_seconds: [30, 60],
};
const MISCONCEPTION_LABEL_RE = /\b(misconception|myth|common mistake|mistaken|wrong|incorrect|not true|false belief|trap|many people think|people often think)\b/i;
const TRACE_META_RE = /\bfact[_-]?ids?\b|\bsource_ref\b|\bnode_id\b|\bslide_id\b|\bunit_id\b|\bobjective_id\b|\bsha256\b|\b[a-f0-9]{64}\b|\bschema_version\b|\bcandidate_lineage/i;
const COUNT_PROMISE_RE = /\b(top|all)\s+(\d+|ten|twenty|fifty|hundred)\b|\b\d+\s+(rules|signs|questions|facts|steps|things|ways|tips|laws|mistakes)\b/i;

// Every learner-facing span with a JSON pointer and its role.
export function learnerSpans(unit, ui) {
  const u = obj(unit); const base = `/units/${ui}`; const out = [];
  const push = (ptr, s, role) => out.push({ ptr, s: obj(s), role });
  push(`${base}/title`, u.title, 'unit_title');
  arr(u.why_how).forEach((s, i) => push(`${base}/why_how/${i}`, s, 'why_how'));
  for (const k of ['scenario', 'reasoning', 'result']) push(`${base}/worked_example/${k}`, u.worked_example?.[k], `worked_example.${k}`);
  for (const k of ['claim', 'correction']) push(`${base}/misconception/${k}`, u.misconception?.[k], `misconception.${k}`);
  push(`${base}/memory_support`, u.memory_support, 'memory_support');
  for (const k of ['prompt', 'answer', 'rationale']) push(`${base}/self_check/${k}`, u.self_check?.[k], `self_check.${k}`);
  arr(u.slides).forEach((sl, si) => {
    push(`${base}/slides/${si}/title`, sl?.title, 'slide_title');
    arr(sl?.lines).forEach((s, li) => push(`${base}/slides/${si}/lines/${li}`, s, 'slide_line'));
    push(`${base}/slides/${si}/narration`, sl?.narration, 'narration');
  });
  return out;
}

export function run(artifact, context = {}) {
  const a = obj(artifact);
  const units = arr(a.units);
  const out = [];
  const spansByUnit = units.map((u, i) => learnerSpans(u, i));
  const allSpans = spansByUnit.flat();

  // ---- 05.ROOT_BOUNDS: patterns + minLength + units minItems ----
  {
    const bad = [];
    if (!isHex64(a.input_manifest_sha256)) bad.push('/input_manifest_sha256 !~ ^[a-f0-9]{64}$');
    if (!isHex64(a.source_registry_sha256)) bad.push('/source_registry_sha256 !~ ^[a-f0-9]{64}$');
    if (!isNonEmptyString(a.candidate_lineage_id)) bad.push('/candidate_lineage_id empty (minLength 1)');
    if (units.length < 1) bad.push('/units has 0 items (minItems 1)');
    if (a.schema_version !== 'teaching-unit.v0.4.0') bad.push(`/schema_version ${JSON.stringify(a.schema_version)} != teaching-unit.v0.4.0`);
    out.push(bad.length ? check(`${P}.ROOT_BOUNDS`, 'FAIL', head(bad), { violations: bad.length })
      : check(`${P}.ROOT_BOUNDS`, 'PASS', `root hashes are 64-hex, lineage id present, ${units.length} unit(s)`, { violations: 0, units: units.length }));
  }

  // ---- 05.INPUT_BINDING: hash-boundary binding to the scoped input manifest + source registry ----
  {
    const im = context?.input_manifest_sha256; const sr = context?.source_registry_sha256;
    const bad = []; const missing = [];
    if (!isHex64(im)) missing.push('context.input_manifest_sha256'); else if (im !== a.input_manifest_sha256) bad.push(`input_manifest_sha256 ${a.input_manifest_sha256} != scoped ${im}`);
    if (!isHex64(sr)) missing.push('context.source_registry_sha256'); else if (sr !== a.source_registry_sha256) bad.push(`source_registry_sha256 ${a.source_registry_sha256} != scoped ${sr}`);
    out.push(bad.length ? check(`${P}.INPUT_BINDING`, 'FAIL', head(bad))
      : missing.length ? check(`${P}.INPUT_BINDING`, 'HOLD', `${missing.join(' and ')} absent — binding unverified`)
        : check(`${P}.INPUT_BINDING`, 'PASS', 'input_manifest_sha256 and source_registry_sha256 equal the scoped context hashes'));
  }

  // ---- 05.STRING_BOUNDS: minLength 1 on ids, span text, fact id items ----
  {
    const bad = [];
    units.forEach((u, ui) => {
      for (const k of ['unit_id', 'module_id']) if (!isNonEmptyString(u?.[k])) bad.push(`/units/${ui}/${k} empty`);
      arr(u?.objective_ids).forEach((o, oi) => { if (!isNonEmptyString(o)) bad.push(`/units/${ui}/objective_ids/${oi} empty`); });
      arr(u?.slides).forEach((s, si) => { if (!isNonEmptyString(s?.slide_id)) bad.push(`/units/${ui}/slides/${si}/slide_id empty`); });
    });
    for (const { ptr, s } of allSpans) {
      if (!isNonEmptyString(s.text)) bad.push(`${ptr}/text empty`);
      arr(s.fact_ids).forEach((f, fi) => { if (!isNonEmptyString(f)) bad.push(`${ptr}/fact_ids/${fi} empty`); });
    }
    out.push(bad.length ? check(`${P}.STRING_BOUNDS`, 'FAIL', `${bad.length} empty string(s): ${head(bad)}`, { violations: bad.length })
      : check(`${P}.STRING_BOUNDS`, 'PASS', `${allSpans.length} spans and all ids non-empty`, { violations: 0, spans: allSpans.length }));
  }

  // ---- 05.UNIQUE_ITEMS: objective_ids / span fact_ids minItems 1 + uniqueItems; stable unique ids ----
  {
    const bad = [];
    const unitIds = new Set(); const slideIds = new Set();
    units.forEach((u, ui) => {
      const o = arr(u?.objective_ids);
      if (o.length < 1) bad.push(`/units/${ui}/objective_ids empty (minItems 1)`);
      if (new Set(o).size !== o.length) bad.push(`/units/${ui}/objective_ids not unique`);
      if (unitIds.has(u?.unit_id)) bad.push(`duplicate unit_id ${u?.unit_id}`); unitIds.add(u?.unit_id);
      arr(u?.slides).forEach((s) => { if (slideIds.has(s?.slide_id)) bad.push(`duplicate slide_id ${s?.slide_id}`); slideIds.add(s?.slide_id); });
      if (arr(u?.why_how).length < 1) bad.push(`/units/${ui}/why_how empty (minItems 1)`);
    });
    for (const { ptr, s } of allSpans) {
      const f = arr(s.fact_ids);
      if (f.length < 1) bad.push(`${ptr}/fact_ids empty (minItems 1)`);
      else if (new Set(f).size !== f.length) bad.push(`${ptr}/fact_ids not unique`);
    }
    out.push(bad.length ? check(`${P}.UNIQUE_ITEMS`, 'FAIL', `${bad.length} cardinality/uniqueness defect(s): ${head(bad)}`, { violations: bad.length })
      : check(`${P}.UNIQUE_ITEMS`, 'PASS', `objective_ids and every span's fact_ids are non-empty and unique; ${unitIds.size} unit ids, ${slideIds.size} slide ids unique`, { violations: 0 }));
  }

  // ---- 05.FACT_RESOLUTION: 100% of span fact ids resolve to accepted, publishable facts ----
  {
    const reg = factRegistry(context);
    const refs = allSpans.flatMap(({ ptr, s }) => arr(s.fact_ids).map(f => [ptr, f]));
    if (!reg) out.push(check(`${P}.FACT_RESOLUTION`, 'HOLD', `context.fact_registry absent — ${refs.length} span fact reference(s) unresolved (resolution ratio unknown, never assumed 1)`, { references: refs.length, resolved: null, ratio: null }));
    else {
      const missing = refs.filter(([, f]) => !reg[f]);
      const debt = refs.filter(([, f]) => reg[f] && UNRESOLVED_FACT_STATUSES.has(String(reg[f].status ?? '').toLowerCase()));
      const resolved = refs.length - missing.length - debt.length;
      const ratio = refs.length ? resolved / refs.length : 0;
      const bad = [...missing.map(([p, f]) => `${p}: ${f} not accepted`), ...debt.map(([p, f]) => `${p}: ${f} status ${reg[f].status} (unresolved verification debt)`)];
      out.push(bad.length || !refs.length ? check(`${P}.FACT_RESOLUTION`, 'FAIL', bad.length ? `resolution ${resolved}/${refs.length}: ${head(bad)}` : 'no span fact references at all', { references: refs.length, resolved, ratio })
        : check(`${P}.FACT_RESOLUTION`, 'PASS', `${resolved}/${refs.length} span fact references resolve to accepted publishable facts (ratio 1); source entailment is NOT checked here`, { references: refs.length, resolved, ratio: 1 }));
    }
  }

  // ---- per-unit structure ----
  const unitRows = units.map((u, ui) => ({ u: obj(u), ui, slides: arr(u?.slides).map(obj) }));

  // 05.SLIDE_COUNT (minItems 6 / maxItems 8)
  {
    const bad = unitRows.filter(r => r.slides.length < LIMITS.min_slides || r.slides.length > LIMITS.max_slides).map(r => `${r.u.unit_id}: ${r.slides.length} slides`);
    out.push(bad.length ? check(`${P}.SLIDE_COUNT`, 'FAIL', `${bad.length} unit(s) outside ${LIMITS.min_slides}..${LIMITS.max_slides} slides (Order Q §4 rule 7 floor; parent five-slide minimum superseded): ${head(bad)}`, { failing_units: bad.length })
      : check(`${P}.SLIDE_COUNT`, 'PASS', `slide counts ${unitRows.map(r => r.slides.length).join(',')} within ${LIMITS.min_slides}..${LIMITS.max_slides}`, { failing_units: 0 }));
  }
  // 05.SLIDE_ARC
  {
    const bad = []; let trapBridge = 0; let selfChecks = 0;
    for (const r of unitRows) {
      const kinds = r.slides.map(s => s.kind);
      if (kinds[0] !== 'opening') bad.push(`${r.u.unit_id}: first slide ${kinds[0]} (must be opening)`);
      if (kinds[kinds.length - 1] !== 'close') bad.push(`${r.u.unit_id}: last slide ${kinds[kinds.length - 1]} (must be close)`);
      const tb = kinds.filter(k => k === 'trap' || k === 'bridge').length; const sc = kinds.filter(k => k === 'self_check').length;
      trapBridge += tb; selfChecks += sc;
      if (tb < 1) bad.push(`${r.u.unit_id}: no trap/bridge slide`);
      if (sc < 1) bad.push(`${r.u.unit_id}: no self_check slide`);
    }
    out.push(bad.length ? check(`${P}.SLIDE_ARC`, 'FAIL', head(bad), { trap_or_bridge_slides: trapBridge, self_check_slides: selfChecks })
      : check(`${P}.SLIDE_ARC`, 'PASS', `${unitRows.length} unit(s): opening first, close last, >=1 trap/bridge and >=1 self_check each`, { trap_or_bridge_slides: trapBridge, self_check_slides: selfChecks }));
  }
  // 05.SLIDE_LINES (lines minItems 1 / maxItems 4; concept 2..4)
  {
    const bad = [];
    for (const r of unitRows) r.slides.forEach((s, si) => {
      const n = arr(s.lines).length;
      if (n < LIMITS.min_lines || n > LIMITS.max_lines) bad.push(`${r.u.unit_id}/${s.slide_id ?? si}: ${n} lines (1..4)`);
      if (s.kind === 'concept' && (n < LIMITS.concept_min_lines || n > LIMITS.concept_max_lines)) bad.push(`${r.u.unit_id}/${s.slide_id ?? si}: concept slide with ${n} lines (2..4)`);
    });
    out.push(bad.length ? check(`${P}.SLIDE_LINES`, 'FAIL', head(bad), { violations: bad.length })
      : check(`${P}.SLIDE_LINES`, 'PASS', 'every slide has 1..4 lines; every concept slide 2..4', { violations: 0 }));
  }
  // 05.WORD_LIMITS (titles <= 6 words, lines <= 15 words)
  {
    const bad = []; let maxTitle = 0; let maxLine = 0;
    for (const { ptr, s, role } of allSpans) {
      const n = wordCount(s.text);
      if (role === 'unit_title' || role === 'slide_title') { maxTitle = Math.max(maxTitle, n); if (n > LIMITS.title_max_words) bad.push(`${ptr}: title ${n} words`); }
      if (role === 'slide_line') { maxLine = Math.max(maxLine, n); if (n > LIMITS.line_max_words) bad.push(`${ptr}: line ${n} words`); }
    }
    out.push(bad.length ? check(`${P}.WORD_LIMITS`, 'FAIL', `${bad.length} over-limit span(s): ${head(bad)}`, { max_title_words: maxTitle, max_line_words: maxLine })
      : check(`${P}.WORD_LIMITS`, 'PASS', `titles <= ${LIMITS.title_max_words} words (max ${maxTitle}); lines <= ${LIMITS.line_max_words} words (max ${maxLine})`, { max_title_words: maxTitle, max_line_words: maxLine }));
  }
  // 05.NARRATION_DEPTH (average narration >= 400 characters per unit)
  {
    const avgs = unitRows.map(r => { const lens = r.slides.map(s => String(s.narration?.text ?? '').length); return { id: r.u.unit_id, avg: lens.length ? lens.reduce((x, y) => x + y, 0) / lens.length : 0 }; });
    const bad = avgs.filter(x => x.avg < LIMITS.min_avg_narration_chars).map(x => `${x.id}: avg ${x.avg.toFixed(1)} chars`);
    const minAvg = avgs.length ? Math.min(...avgs.map(x => x.avg)) : 0;
    out.push(bad.length ? check(`${P}.NARRATION_DEPTH`, 'FAIL', `${bad.length} unit(s) below ${LIMITS.min_avg_narration_chars}-char average narration: ${head(bad)}`, { min_unit_avg_chars: Number(minAvg.toFixed(1)) })
      : check(`${P}.NARRATION_DEPTH`, 'PASS', `per-unit average narration ${avgs.map(x => x.avg.toFixed(1)).join(',')} chars (>= ${LIMITS.min_avg_narration_chars})`, { min_unit_avg_chars: Number(minAvg.toFixed(1)) }));
  }
  // 05.NARRATION_SECONDS (minimum 30 / maximum 60; text-cadence estimate, not audio)
  {
    const bad = [];
    for (const r of unitRows) r.slides.forEach((s, si) => { const v = s.estimated_narration_seconds; if (typeof v !== 'number' || !Number.isFinite(v) || v < LIMITS.narration_seconds[0] || v > LIMITS.narration_seconds[1]) bad.push(`${r.u.unit_id}/${s.slide_id ?? si}: ${JSON.stringify(v)}`); });
    out.push(bad.length ? check(`${P}.NARRATION_SECONDS`, 'FAIL', `${bad.length} slide estimate(s) outside 30..60 s: ${head(bad)}`, { violations: bad.length })
      : check(`${P}.NARRATION_SECONDS`, 'PASS', 'every estimated_narration_seconds in 30..60 (text-cadence estimate; no audio or playback claim)', { violations: 0 }));
  }
  // 05.UNIFORM_VECTOR (reject uniform slide-count vector across >= 2 units)
  {
    const vec = unitRows.map(r => r.slides.length);
    if (vec.length < 2) out.push(check(`${P}.UNIFORM_VECTOR`, 'PASS', `single unit — slide-count comparison not_applicable_single_unit (not a diversity pass)`, { comparison: 'not_applicable_single_unit', vector: vec.join(',') }));
    else if (new Set(vec).size === 1) out.push(check(`${P}.UNIFORM_VECTOR`, 'FAIL', `uniform slide-count vector [${vec.join(',')}] across ${vec.length} units (Order Q §4 rule 7)`, { comparison: 'uniform', vector: vec.join(',') }));
    else out.push(check(`${P}.UNIFORM_VECTOR`, 'PASS', `slide-count vector [${vec.join(',')}] is not uniform`, { comparison: 'varied', vector: vec.join(',') }));
  }
  // 05.DECOMPRESSION_FIELDS (script-computed counters)
  {
    const bad = []; const tot = { why_how: 0, worked_examples: 0, misconception_corrections: 0, memory_supports: 0, self_checks: 0 };
    for (const r of unitRows) {
      const u = r.u; const has = (s) => isNonEmptyString(s?.text);
      const wh = arr(u.why_how).filter(has).length;
      const we = ['scenario', 'reasoning', 'result'].every(k => has(u.worked_example?.[k])) ? 1 : 0;
      const mc = has(u.misconception?.claim) && has(u.misconception?.correction) ? 1 : 0;
      const ms = has(u.memory_support) ? 1 : 0;
      const sc = ['prompt', 'answer', 'rationale'].every(k => has(u.self_check?.[k])) ? 1 : 0;
      tot.why_how += wh; tot.worked_examples += we; tot.misconception_corrections += mc; tot.memory_supports += ms; tot.self_checks += sc;
      const miss = [wh < 1 && 'why_how', !we && 'worked_example', !mc && 'misconception', !ms && 'memory_support', !sc && 'self_check'].filter(Boolean);
      if (miss.length) bad.push(`${u.unit_id}: missing/empty ${miss.join(',')}`);
    }
    out.push(bad.length ? check(`${P}.DECOMPRESSION_FIELDS`, 'FAIL', head(bad), tot)
      : check(`${P}.DECOMPRESSION_FIELDS`, 'PASS', `every unit populates why_how (${tot.why_how}), worked example (${tot.worked_examples}), misconception/correction (${tot.misconception_corrections}), memory support (${tot.memory_supports}), self-check (${tot.self_checks})`, tot));
  }
  // 05.SELF_CHECK_ALIGNED
  {
    const bad = [];
    for (const r of unitRows) {
      const u = r.u; const ids = (s) => new Set(arr(s?.fact_ids));
      const p = ids(u.self_check?.prompt); const ans = ids(u.self_check?.answer);
      const taught = new Set([...arr(u.why_how).flatMap(s => arr(s?.fact_ids)), ...['scenario', 'reasoning', 'result'].flatMap(k => arr(u.worked_example?.[k]?.fact_ids)), ...['claim', 'correction'].flatMap(k => arr(u.misconception?.[k]?.fact_ids))]);
      const scSlides = r.slides.filter(s => s.kind === 'self_check');
      const scSlideIds = new Set(scSlides.flatMap(s => [s.title, s.narration, ...arr(s.lines)].flatMap(x => arr(x?.fact_ids))));
      if (![...p].some(f => ans.has(f))) bad.push(`${u.unit_id}: self_check answer shares no fact with its prompt`);
      if (![...p].some(f => taught.has(f))) bad.push(`${u.unit_id}: self_check prompt tests no fact taught in why_how/worked_example/misconception`);
      if (!scSlides.length || ![...p].some(f => scSlideIds.has(f))) bad.push(`${u.unit_id}: no self_check slide carries the self_check prompt's facts`);
    }
    out.push(bad.length ? check(`${P}.SELF_CHECK_ALIGNED`, 'FAIL', head(bad), { misaligned_units: bad.length })
      : check(`${P}.SELF_CHECK_ALIGNED`, 'PASS', 'each self_check answer shares facts with its prompt, tests taught facts and is carried by a self_check slide', { misaligned_units: 0 }));
  }
  // 05.SELF_CHECK_ORIGINALITY (Order Q §4 rule 8)
  {
    const stems = context?.accepted_inputs?.exam_stems;
    if (!Array.isArray(stems)) out.push(check(`${P}.SELF_CHECK_ORIGINALITY`, 'HOLD', 'context.accepted_inputs.exam_stems absent — self-check vs exam-bank stem originality unverified'));
    else {
      const set = new Set(stems.map(normalizeForCompare));
      const hits = unitRows.flatMap(r => [r.u.self_check?.prompt, ...r.slides.filter(s => s.kind === 'self_check').flatMap(s => arr(s.lines))].filter(x => set.has(normalizeForCompare(x?.text))).map(() => r.u.unit_id));
      out.push(hits.length ? check(`${P}.SELF_CHECK_ORIGINALITY`, 'FAIL', `self-check text reproduces an exam-bank stem verbatim in ${head([...new Set(hits)])}`, { verbatim_hits: hits.length })
        : check(`${P}.SELF_CHECK_ORIGINALITY`, 'PASS', `no self-check prompt/line equals any of ${stems.length} accepted exam stems (normalized)`, { verbatim_hits: 0 }));
    }
  }
  // 05.MISCONCEPTION_LABELLED
  {
    const bad = unitRows.filter(r => !MISCONCEPTION_LABEL_RE.test(String(r.u.misconception?.claim?.text ?? ''))).map(r => r.u.unit_id);
    out.push(bad.length ? check(`${P}.MISCONCEPTION_LABELLED`, 'FAIL', `misconception claim not explicitly labelled as a wrong alternative in ${head(bad)}`, { unlabelled: bad.length })
      : check(`${P}.MISCONCEPTION_LABELLED`, 'PASS', `every misconception claim carries an explicit label (${MISCONCEPTION_LABEL_RE.source.slice(0, 60)}…); correction fact ids covered by ${P}.FACT_RESOLUTION`, { unlabelled: 0 }));
  }
  // 05.LEARNER_TRACE_LEAK (no "(verify", QA scaffold, doubled article or internal trace metadata)
  {
    const ids = new Set();
    for (const r of unitRows) { ids.add(r.u.unit_id); ids.add(r.u.module_id); arr(r.u.objective_ids).forEach(o => ids.add(o)); r.slides.forEach(s => ids.add(s.slide_id)); }
    for (const { s } of allSpans) arr(s.fact_ids).forEach(f => ids.add(f));
    const idList = [...ids].filter(i => typeof i === 'string' && i.length >= 4 && /[-_.:]/.test(i));
    const hits = [];
    for (const { ptr, s } of allSpans) {
      const t = String(s.text ?? '');
      const v = scaffoldViolations(t);
      if (TRACE_META_RE.test(t)) v.push('trace_metadata');
      const leakedId = idList.find(i => t.includes(i));
      if (leakedId) v.push(`internal_id:${leakedId}`);
      if (v.length) hits.push(`${ptr}: ${v.join(',')}`);
    }
    out.push(hits.length ? check(`${P}.LEARNER_TRACE_LEAK`, 'FAIL', `${hits.length} learner span(s) leak scaffold/trace text: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.LEARNER_TRACE_LEAK`, 'PASS', `${allSpans.length} learner spans free of "(verify", QA scaffold, doubled article, trace metadata and internal ids`, { hits: 0 }));
  }
  // 05.STAGE_DIRECTIONS (no narrated stage directions; learner never asked to speak)
  {
    const hits = [];
    for (const { ptr, s, role } of allSpans) {
      const t = String(s.text ?? '');
      const v = role === 'narration' ? stageDirectionViolations(t) : [];
      if (SPEAK_REQUEST_RE.test(t)) v.push('asks_learner_to_speak');
      if (v.length) hits.push(`${ptr}: ${v.join(',')}`);
    }
    out.push(hits.length ? check(`${P}.STAGE_DIRECTIONS`, 'FAIL', `${hits.length} span(s) with stage directions/speak requests: ${head(hits)}`, { hits: hits.length })
      : check(`${P}.STAGE_DIRECTIONS`, 'PASS', 'no narrated pause/beat/timed-silence/ellipsis direction and no request to speak', { hits: 0 }));
  }
  // 05.TITLED_PROMISE (Order Q §4 rule 15: countable title promises need a count binding)
  {
    const promises = allSpans.filter(({ role, s }) => (role === 'unit_title' || role === 'slide_title') && COUNT_PROMISE_RE.test(String(s.text ?? ''))).map(({ ptr }) => ptr);
    out.push(promises.length ? check(`${P}.TITLED_PROMISE`, 'HOLD', `${promises.length} title(s) make a countable promise; no content-count binding is available to machine-verify it: ${head(promises)}`, { promises: promises.length })
      : check(`${P}.TITLED_PROMISE`, 'PASS', 'no countable promise ("Top N", "All N", "N rules…") in any title', { promises: 0 }));
  }

  return out;
}
