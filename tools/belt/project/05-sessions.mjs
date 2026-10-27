// 05.sessions fixture generator (Claude lane, v0.4.0). There is NO V1 projection: the V1 citizenship
// 05b-session-scripts.json carries no fact-tagged TeachingUnit spans (see schemas-strict/05b-session-scripts.mapping.json,
// v1_projection: HOLD). This script only (a) copies Sol's synthetic TeachingUnit payload with provenance and
// (b) derives clearly synthetic negatives from it.
// export observeV1(v1SessionScripts) -> informative structural observations (never a projection)
// CLI: node tools/belt/project/05-sessions.mjs --write
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256File } from '../lib/hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const NOVA = resolve(LANE, '..');
export const SOL_FIXTURE = 'qualification/fixtures/TEACHING-UNIT.synthetic.json';
export const V1_PATH = 'runs/2026-06-11-citizenship/05b-session-scripts.json';
const FIX_DIR = join(LANE, 'tools', 'belt', 'fixtures', '05.sessions');

export function observeV1(v1) {
  const S = v1.sessions ?? [];
  const keys = ['why_how', 'worked_example', 'misconception', 'memory_support', 'self_check'];
  const avg = S.map(s => s.slides.reduce((n, x) => n + String(x.narration_text ?? '').length, 0) / Math.max(1, s.slides.length));
  return {
    sessions: S.length,
    slide_count_vector: S.map(s => s.slides.length).join(','),
    sessions_with_unit_decompression_fields: S.filter(s => keys.some(k => k in s)).length,
    slides_with_span_fact_ids: S.reduce((n, s) => n + s.slides.filter(x => x.title && typeof x.title === 'object').length, 0),
    claims_rows: S.reduce((n, s) => n + (s.claims?.length ?? 0), 0),
    claims_fact_id_example: S[0]?.claims?.[0]?.fact_ids ?? null,
    sessions_first_slide_opening: S.filter(s => s.slides[0]?.kind === 'opening').length,
    sessions_last_slide_close: S.filter(s => s.slides.at(-1)?.kind === 'close').length,
    sessions_with_trap_or_bridge: S.filter(s => s.slides.some(x => x.kind === 'trap' || x.kind === 'bridge')).length,
    min_session_avg_narration_chars: Number(Math.min(...avg).toFixed(1)),
  };
}

const clone = (x) => JSON.parse(JSON.stringify(x));
function renameUnit(u, n) {
  const v = clone(u);
  v.unit_id = `fixture-unit-${n}`; v.module_id = `fixture-module-${n}`;
  v.slides.forEach((s, i) => { s.slide_id = `fixture-u${n}-slide-${i}`; });
  return v;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  mkdirSync(FIX_DIR, { recursive: true });
  const solAbs = join(LANE, SOL_FIXTURE); const solSha = sha256File(solAbs);
  const genSha = sha256File(fileURLToPath(import.meta.url));
  const sol = JSON.parse(readFileSync(solAbs, 'utf8'));
  const { payload, ...solWrapper } = sol;
  const v1Abs = join(NOVA, V1_PATH); const v1Sha = sha256File(v1Abs);
  const v1obs = observeV1(JSON.parse(readFileSync(v1Abs, 'utf8')));
  const ctx = {
    _context_note: 'SYNTHETIC validator context only — mirrors Sol\'s synthetic_fact_ids; not a fact registry of any run.',
    input_manifest_sha256: payload.input_manifest_sha256,
    source_registry_sha256: payload.source_registry_sha256,
    fact_registry: { facts: { 'fixture-fact-1': { statement: 'Synthetic validator fact; no driving, licensing, legal or source-authority claim.', status: 'verified', source_page: 'synthetic' } } },
    accepted_inputs: { exam_stems: ['Synthetic exam-bank stem that no self-check reuses?'] },
  };
  const write = (name, body, meta, withCtx = true) => {
    writeFileSync(join(FIX_DIR, `${name}.json`), JSON.stringify({ _fixture: meta, ...body }, null, 2) + '\n');
    if (withCtx) writeFileSync(join(FIX_DIR, `${name}.context.json`), JSON.stringify(ctx, null, 2) + '\n');
  };
  const prov = { path: SOL_FIXTURE, sha256: solSha, owner: 'Sol qualification worker — consumed, never edited', wrapper: solWrapper };
  const meta = (kind, note, expect, extra = {}) => ({ kind, label: 'SYNTHETIC validator interface fixture — not a qualification, source or run', derived_from: prov, generator: { path: 'tools/belt/project/05-sessions.mjs', sha256: genSha }, note, expect, ...extra });

  // positive 1: Sol's payload, byte-for-byte field values (only the wrapper moved into _fixture)
  write('synthetic-positive-sol', payload, meta('synthetic_positive', 'Sol payload copied unchanged; wrapper fields fixture_kind/not_a_qualification_or_source/synthetic_fact_ids moved into _fixture.derived_from.wrapper', { status: 'PASS' }));
  write('synthetic-hold-no-context', payload, meta('synthetic_hold', 'Sol payload with NO context: fact resolution, input binding and self-check originality must HOLD', { status: 'HOLD' }), false);

  const u1 = payload.units[0];
  // positive 2: two units, slide counts 6 and 7 (non-uniform)
  {
    const b = clone(payload); const u2 = renameUnit(u1, 2);
    const extra = clone(u2.slides[1]); extra.slide_id = 'fixture-u2-slide-extra'; u2.slides.splice(2, 0, extra);
    b.units.push(u2);
    write('synthetic-positive-two-units', b, meta('synthetic_positive', 'two units with slide-count vector [6,7] — the uniform-vector comparison is exercised, not skipped', { status: 'PASS' }));
  }
  const negatives = [
    ['synthetic-neg-five-slide', 'FIVE-SLIDE lesson: one concept slide removed from Sol unit (parent minimum 5 is superseded by the six-slide floor)', ['05.SLIDE_COUNT'], b => { b.units[0].slides.splice(2, 1); }],
    ['synthetic-neg-uniform-vector', 'two units with identical slide-count vector [6,6]', ['05.UNIFORM_VECTOR'], b => { b.units.push(renameUnit(u1, 2)); }],
    ['synthetic-neg-unresolved-fact', 'one why_how span cites fixture-fact-404, absent from the registry', ['05.FACT_RESOLUTION'], b => { b.units[0].why_how[0].fact_ids = ['fixture-fact-404']; }],
    ['synthetic-neg-stage-direction', 'concept narration carries "[beat]" and "Pause for three seconds."', ['05.STAGE_DIRECTIONS'], b => { b.units[0].slides[1].narration.text = '[beat] Pause for three seconds. ' + b.units[0].slides[1].narration.text; }],
    ['synthetic-neg-depth-limits', 'short narration on every slide, a 9-word title, a 17-word line and a 75 s estimate', ['05.NARRATION_DEPTH', '05.WORD_LIMITS', '05.NARRATION_SECONDS'], b => {
      b.units[0].slides.forEach(s => { s.narration.text = 'Short synthetic narration only.'; });
      b.units[0].slides[1].title.text = 'An eight word synthetic title that is too long';
      b.units[0].slides[1].lines[0].text = 'This synthetic line has far too many words in it to fit the fifteen word limit easily';
      b.units[0].slides[2].estimated_narration_seconds = 75;
    }],
    ['synthetic-neg-arc', 'trap slide turned into concept and the close slide moved before self_check', ['05.SLIDE_ARC'], b => { const s = b.units[0].slides; s[3].kind = 'concept'; const close = s.pop(); s.splice(4, 0, close); }],
    ['synthetic-neg-verify-leak', 'why_how leaks "(verify)" + an internal fact id; the misconception claim loses its label', ['05.LEARNER_TRACE_LEAK', '05.MISCONCEPTION_LABELLED'], b => { b.units[0].why_how[0].text = 'Generic why explanation (verify) per fixture-fact-1.'; b.units[0].misconception.claim.text = 'A synthetic claim.'; }],
    ['synthetic-neg-missing-decompression', 'why_how emptied: strict schema accepts [] (minItems dropped), the restored checks reject it', ['05.UNIQUE_ITEMS', '05.DECOMPRESSION_FIELDS'], b => { b.units[0].why_how = []; }],
  ];
  for (const [name, note, fails, mutate] of negatives) { const b = clone(payload); mutate(b); write(name, b, meta('synthetic_negative', note, { status: 'FAIL', fail: fails })); }
  console.log(JSON.stringify({ written: FIX_DIR, sol_fixture_sha256: solSha, v1_sha256: v1Sha, v1_observations: v1obs }, null, 2));
}
