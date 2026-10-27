// V1 projection + synthetic fixture builder for stage 02.dossier_sections.
// projectV1(markdownText, {sourcePath, sourceSha256}) -> SmeDossierEnvelope (+ _fixture provenance)
// CLI: node tools/belt/project/02-dossier-sections.mjs --write   (writes tools/belt/fixtures/02.dossier_sections/*)
// Pure except the CLI branch, which reads the V1 files named below and writes fixtures. No network, no model.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Bytes, sha256File } from '../lib/hash.mjs';
import { CONTRACT_MAX_SECTION_CHARS, G_BOXES, SECTION_IDS } from '../checks/02-dossier-sections.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const LANE = resolve(here, '..', '..', '..');
const cp = (s) => [...s].length;

export const V1_SOURCE = 'D:/nova/runs/2026-06-11-citizenship/02-blueprint.md';
export const V1_REGISTRY = 'D:/nova/runs/2026-06-11-citizenship/15-source-registry.json';

// "## " heading prefix -> master-SME section id. "### " headings inherit the enclosing "## " section.
export const V1_SECTION_MAP = [
  ['## 🔎 VERIFY CONSOLIDATED', 'F'],
  ['## EXAM_META', 'A'],
  ['## BLUEPRINT', 'A'],
  ['## AUDIENCE', 'B'],
  ['## SLOTS', 'B'],
  ['## KNOWLEDGE DOSSIER', 'C'],
  ['## UPDATABLE', 'A'],
  ['## ACCURACY', 'D'],
  ['## COMPETITIVE TEARDOWN', 'E2'],
  ['## MARKET-SIGNAL', 'E'],
  ['## ✅ DEFINITION OF DONE', 'G'],
];
export const SPLIT_RULE = [
  '1. Lines are kept with their trailing "\\n"; concatenating every chunk in merge_seq order reproduces the source bytes exactly.',
  '2. A new chunk starts at every line beginning "## " or "### "; lines before the first such heading form a preamble chunk (section F).',
  `3. A chunk whose length is >= ${CONTRACT_MAX_SECTION_CHARS} code points is re-split at lines beginning "**Q<n>." (question boundaries), greedily, so every part is < ${CONTRACT_MAX_SECTION_CHARS}.`,
  '4. Section id comes from the enclosing "## " heading via V1_SECTION_MAP; preamble -> F.',
  '5. chunk_id = <section_id>.<merge_seq zero-padded to 2>.',
];

const ANCHOR_RE = /\[(S\d+[a-z]?(?: p\.\d+)?|Q\d+ · p\.\d+)\]/g;
const anchorPage = (id) => {
  let m;
  if ((m = /^Q\d+ · p\.(\d+)$/.exec(id))) return `S1#p.${m[1]}`;       // V1 source legend: [Qn · p.N] = M-1778 [S1] PDF page N
  if ((m = /^(S\d+[a-z]?) p\.(\d+)$/.exec(id))) return `${m[1]}#p.${m[2]}`;
  return id;
};

function splitChunks(md) {
  const lines = md.split(/(?<=\n)/);                                    // keep newline on each line
  const raw = [];
  let cur = { lines: [], h2: null };
  let h2 = null;
  for (const line of lines) {
    if (/^#{2,3} /.test(line)) {
      if (cur.lines.length) raw.push(cur);
      if (/^## /.test(line)) h2 = line;
      cur = { lines: [], h2 };
    }
    cur.lines.push(line);
  }
  if (cur.lines.length) raw.push(cur);
  const out = [];
  for (const c of raw) {
    const text = c.lines.join('');
    if (cp(text) < CONTRACT_MAX_SECTION_CHARS) { out.push({ text, h2: c.h2, part: null }); continue; }
    // re-split at question boundaries
    const blocks = [];
    let b = [];
    for (const line of c.lines) { if (/^\*\*Q\d+\./.test(line) && b.length) { blocks.push(b.join('')); b = []; } b.push(line); }
    if (b.length) blocks.push(b.join(''));
    let acc = ''; let part = 1;
    for (const blk of blocks) {
      if (acc && cp(acc) + cp(blk) >= CONTRACT_MAX_SECTION_CHARS) { out.push({ text: acc, h2: c.h2, part: part++ }); acc = ''; }
      acc += blk;
    }
    if (acc) out.push({ text: acc, h2: c.h2, part });
  }
  return out;
}

function sectionFor(h2) {
  if (!h2) return 'F';
  const hit = V1_SECTION_MAP.find(([p]) => h2.startsWith(p));
  if (!hit) throw new Error(`unmapped V1 heading: ${h2.trim()}`);
  return hit[1];
}

const stripParen = (s) => s.replace(/\s*\([^()]*(\([^()]*\)[^()]*)*\)\s*$/, '').trim();

export function projectV1(md, { sourcePath = V1_SOURCE, sourceSha256 = sha256Bytes(Buffer.from(md, 'utf8')) } = {}) {
  const decisions = [];
  const parts = splitChunks(md);
  const sections = parts.map((p, i) => {
    const seq = i + 1;
    const section_id = sectionFor(p.h2);
    const first = p.text.split('\n')[0];
    const isH3 = /^### /.test(first);
    const headingLine = p.part && p.part > 1 ? null : first;
    let domain = null;
    if (section_id === 'C') {
      // domain comes from the "### " heading of the chunk (or of the first part when re-split)
      const h3 = isH3 ? first : null;
      domain = h3 && !/^### GLOSSARY/.test(h3) ? stripParen(h3.replace(/^### /, '')) : null;
    }
    const anchors = [...new Set([...p.text.matchAll(ANCHOR_RE)].map(m => m[1]))];
    const fact_ids = [];
    if (section_id === 'C') for (const m of p.text.matchAll(/^\*\*Q(\d+)\./gm)) fact_ids.push(`Q${m[1]}`);
    if (section_id === 'A') for (const m of p.text.matchAll(/^\| (U\d+) \|/gm)) fact_ids.push(m[1]);
    return {
      section_id,
      chunk_id: `${section_id}.${String(seq).padStart(2, '0')}`,
      merge_seq: seq,
      domain,
      heading: (headingLine ?? `${first.slice(0, 60)}`).replace(/^#+\s*/, '').trim() + (p.part ? ` [part ${p.part}]` : ''),
      learner_facing: section_id === 'A' || section_id === 'C',
      markdown: p.text,
      char_count: cp(p.text),
      fact_ids,
      source_anchors: anchors.map(id => ({ anchor_id: id, source_page: anchorPage(id) })),
      _h3: isH3 ? first : null,
    };
  });
  // carry the domain of a re-split C chunk to its continuation parts
  for (let i = 1; i < sections.length; i++) {
    const s = sections[i];
    if (s.section_id === 'C' && s.domain === null && !s._h3 && / \[part \d+\]$/.test(s.heading) && sections[i - 1].section_id === 'C') {
      s.domain = sections[i - 1].domain;
      s.heading = `${sections[i - 1].heading.replace(/ \[part \d+\]$/, '')} [part ${s.heading.match(/\[part (\d+)\]$/)[1]}]`;
    }
  }
  sections.forEach(s => { delete s._h3; });
  decisions.push(`split: ${sections.length} chunks; re-split parts: ${sections.filter(s => / \[part \d+\]$/.test(s.heading)).map(s => s.chunk_id).join(', ') || 'none'}`);
  decisions.push('domain: every "### " knowledge chunk is domain-bearing except "### GLOSSARY" (V1 labels it plain-ESL support, never the exam answer); the "## KNOWLEDGE DOSSIER" legend chunk has domain null. The English vocab chunk IS domain-bearing (scored component), so its missing high-yield list surfaces as a finding.');
  decisions.push('learner_facing: A and C chunks true (exam info + knowledge feed learner surfaces), all others false.');
  decisions.push('fact_ids: C chunks use the md-native "Q<n>" ids from "**Q<n>." lines (role 16 later assigned gov-a.NN ids, not present in the md); the UPDATABLE chunk uses its U<n> row ids.');
  decisions.push('source_anchors: every distinct inline citation token [S<n>], [S<n> p.<k>], [Q<n> · p.<k>]; source_page "S1#p.<k>" for [Q<n> · p.<k>] per the V1 source legend.');
  const chunk = (sid) => sections.filter(s => s.section_id === sid);
  const lineOf = (re) => { const m = md.split('\n').find(l => re.test(l)); if (!m) throw new Error(`V1 line not found: ${re}`); return m; };
  const must = (sub) => { if (!md.includes(sub)) throw new Error(`projection value not verbatim in V1: ${sub}`); return sub; };

  // exam_facts — status verified ONLY when the V1 line itself carries a page anchor; value = verbatim V1 substring.
  const ex = (value, status, source_page) => ({ value, status, source_page });
  const exam_facts = {
    exam_name: ex(must('Naturalization Test — Civics component, **2025 Naturalization Civics Test**').replace(/\*\*/g, ''), 'authored', null),
    issuing_body: ex(must('U.S. Citizenship and Immigration Services (USCIS), Dept. of Homeland Security'), 'authored', null),
    edition: ex(must('2025 version'), 'verified', 'S3'),
    effective_date: ex(must('Form N-400 filed on/after Oct. 20, 2025'), 'verified', 'S2'),
    question_bank_size: ex(128, 'verified', 'S1'),
    n_questions: ex(20, 'verified', 'S2'),
    passing_standard: ex(must('must answer **at least 12 correctly** to pass').replace(/\*\*/g, ''), 'verified', 'S2'),
    format: ex(must('oral Q&A during the naturalization interview'), 'authored', null),
    time_limit: ex(null, 'unknown', null),
  };
  lineOf(/^- \*\*passing \(2025, VERIFIED\):\*\*.*up to 20\*\* of the 128.*\[S2\]/);
  decisions.push('exam_facts: verified only where the V1 EXAM_META line carries an inline anchor (edition [S3], effective_date [S2], passing_standard + n_questions=20 on the [S2]-cited passing line; question_bank_size=128 -> S1, the M-1778 bank "128 Civics Questions and Answers" defined as [S1] in EXAM_META); exam_name, issuing_body, format lines carry no anchor -> status authored (V1 labels, not page-cited); time_limit: V1 says "no separate published time limit" without an anchor -> value null, status unknown.');

  // high_yield_ranked — parse "**§ high_yield (<tag>, ranked):** 1) … · 2) …"
  const high_yield_ranked = [];
  for (const s of chunk('C')) {
    const m = /^\*\*§ high_yield \([^)]*\):\*\* (.*)$/m.exec(s.markdown);
    if (!m || !s.domain) continue;
    const ranked = m[1].split(' · ').map(t => {
      const mm = /^(\d+)\) (.*?)\.?$/.exec(t.trim());
      const label = mm ? mm[2] : t.trim();
      const refs = [];
      for (const q of label.matchAll(/Q(\d+)((?:\/\d+)*)/g)) { refs.push(`Q${q[1]}`); for (const extra of (q[2] || '').split('/').filter(Boolean)) refs.push(`Q${extra}`); }
      return { rank: mm ? Number(mm[1]) : 0, item_refs: [...new Set(refs)], label };
    });
    high_yield_ranked.push({ domain: s.domain, chunk_id: s.chunk_id, ranked });
  }
  decisions.push('high_yield_ranked: parsed from each "**§ high_yield (…, ranked):**" line; items split on " · ", rank from "N)", item_refs = Q tokens with "/n" expansions (ranges like Q86–89 are NOT expanded).');

  // verification_debt — parse the typed VD table in ACCURACY.
  const D = chunk('D')[0];
  const enumPick = (v, allowed) => { const t = String(v).trim().split(/[\s(]/)[0]; return allowed.includes(t) ? t : null; };
  const withheld = (text) => [...text.matchAll(/(?<![A-Za-z0-9-])\d[\d,.]*(?:[–-]\d[\d,.]*)?k?(?![A-Za-z0-9])/g)].map(m => m[0]).filter(v => !/^(19|20)\d\d$/.test(v));
  const verification_debt = [];
  const debtNotes = [];
  for (const row of D.markdown.split('\n').filter(l => /^\| VD-\d+ \|/.test(l))) {
    const c = row.split('|').slice(1, -1).map(x => x.trim());
    const [claim_id, claim_text, bk, tier, owner, ship, exp, res] = c;
    const rec = {
      claim_id, claim_text,
      blocker_kind: enumPick(bk, ['source_missing', 'source_stale', 'exam_policy_unclear', 'legal_review_required', 'clinical_review_required']),
      source_tier_required: enumPick(tier, ['official', 'regulator', 'standards_body', 'exam_owner', 'reputable', 'unverified']),
      owner_worker: enumPick(owner, ['SMEResearchAgent', 'EvidenceLibrarian', 'HallucinationAuditor']),
      ship_blocking: /^true/.test(ship),
      expires_by: /^\d{4}-\d{2}-\d{2}/.test(exp) ? exp : null,
      resolution_artifact_ref: res === 'null' ? null : res,
      located_at: { section_id: 'D', chunk_id: D.chunk_id },
      withheld_values: withheld(claim_text),
    };
    debtNotes.push(`${claim_id}: blocker_kind "${bk}"->${rec.blocker_kind}; source_tier "${tier}"->${rec.source_tier_required}; owner "${owner}"->${rec.owner_worker}; expires_by "${exp}"->${rec.expires_by}; withheld ${JSON.stringify(rec.withheld_values)}`);
    verification_debt.push(rec);
  }
  decisions.push('verification_debt: projected from the ACCURACY VD table. enum fields take the leading token when it is a contract enum value, else null (never mapped to a guessed tier); expires_by keeps ISO dates only, V1 phrases like "next run" -> null; withheld_values = numerals in claim_text excluding id tokens and 4-digit years.');
  decisions.push(...debtNotes);

  const E = chunk('E')[0], E2 = chunk('E2')[0], G = chunk('G')[0];
  const debtIdSet = new Set(verification_debt.map(d => d.claim_id));
  const marketDebts = [...new Set([...(E.markdown + E2.markdown).matchAll(/VD-\d+/g)].map(m => m[0]))].filter(d => debtIdSet.has(d));
  const eHead = E.markdown.split('\n')[0];
  const market_signal = {
    origin: 'competitive_intel',
    origin_note: /\((origin: .*)\)\s*$/.exec(eHead)[1],
    disposition: 'present',
    chunk_ids: [E.chunk_id, E2.chunk_id],
    debt_refs: marketDebts,
  };
  decisions.push('market_signal.origin: parent enum is sme|competitive_intel; V1 heading says "origin: competitive_intel @ 01b + official stats verified this session" and the compiled 16-blueprint.json records competitive_intel -> competitive_intel, verbatim heading kept in origin_note.');

  const gLines = G.markdown.split('\n').filter(l => /^- \[( |x)\] /.test(l));
  if (gLines.length !== G_BOXES.length) throw new Error(`V1 DoD has ${gLines.length} boxes, expected ${G_BOXES.length}`);
  const g_matrix = gLines.map((l, i) => ({
    box_id: G_BOXES[i],
    disposition: l.startsWith('- [x]') ? 'completed' : 'debt',
    located_at: G.chunk_id,
    debt_ref: null,
    note: `V1 self-claim: ${l.replace(/^- \[[ x]\] /, '').replace(/\*\*/g, '').slice(0, 110)}`,
  }));
  decisions.push('g_matrix: V1 DoD lines map 1:1 in order onto the 11 master-template G boxes; dispositions are V1 self-claims ([x] -> completed), not independently re-verified.');

  const stab = lineOf(/^- \*\*stability check:\*\*/).replace(/^- \*\*stability check:\*\* /, '');
  const envelope = {
    artifact: 'SmeDossierEnvelope',
    schema_version: '0.4.0',
    stage_id: '02.dossier_sections',
    probe: 'us-citizenship',
    lineage: { input_manifest_sha256: null, candidate_lineage_id: null, source_registry_sha256: null, source_liveness_sha256: null },
    envelope_scope: { kind: 'complete_dossier', assigned_section_ids: [...SECTION_IDS], chunk_index: 1, chunk_total: 1 },
    section_char_limit: CONTRACT_MAX_SECTION_CHARS,
    sections,
    merge: { order_rule: 'merge_seq_ascending', joiner: 'concat_no_separator', expected_merged_sha256: sourceSha256 },
    exam_facts,
    high_yield_ranked,
    needs_dedicated_surface: { status: 'unknown', items: [] },
    corpus_stability: { assessment: 'stable_le_1_per_year', blocked_probe: false, reason: stab },
    verification_debt,
    external_review_requests: [],
    market_signal,
    g_matrix,
  };
  decisions.push('lineage: V1 predates input manifests/candidate lineage -> all four hashes null (02.LINEAGE HOLDs without context, FAILs if a manifest is supplied).');
  decisions.push('needs_dedicated_surface: V1 (2026-06-11) predates the 2026-06-17 Sellable-Depth amendment and records the English component as "meta only — no delivery loop designed here"; it never declares the field -> status unknown, items [] (not inferred).');
  decisions.push('envelope_scope: V1 is a whole dossier -> complete_dossier assigned all 9 ids; V1 has no Section C2 (hints were added by role 17), so SCOPE_COMPLETENESS reports C2 missing.');
  decisions.push('external_review_requests: V1 ACCURACY states none -> [].');
  return {
    _fixture: {
      kind: 'v1_projected',
      label: 'FIXTURE/REFERENCE ONLY — projected from the V1 citizenship run; never a DMV production result',
      source: { path: sourcePath, sha256: sourceSha256 },
      generator: 'tools/belt/project/02-dossier-sections.mjs#projectV1',
      split_rule: SPLIT_RULE,
      section_map: V1_SECTION_MAP.map(([p, s]) => `${p} -> ${s}`).concat(['(preamble before first "## ") -> F', '"### " -> enclosing "## " section']),
      decisions,
    },
    ...envelope,
  };
}

// ---------- synthetic fixtures (clearly fictional issuer; interface coverage only) ----------
function mkSection(seq, section_id, domain, learner_facing, markdown, anchors, fact_ids = []) {
  return { section_id, chunk_id: `${section_id}.${String(seq).padStart(2, '0')}`, merge_seq: seq, domain, heading: markdown.split('\n')[0].replace(/^#+\s*/, ''), learner_facing, markdown, char_count: cp(markdown), fact_ids, source_anchors: anchors };
}
export function buildSynthetic() {
  const A = [{ anchor_id: 'P1', source_page: 'SYN-HB#p.1' }, { anchor_id: 'P2', source_page: 'SYN-HB#p.2' }];
  const sections = [
    mkSection(1, 'A', null, true, '## A — Exam authority (SYNTHETIC)\nIssuer: Example Licensing Board (synthetic) [P1].\nThe written test has 25 items [P1].\nThe passing standard is not published on the handbook pages (verify — SD-1).\n', A.slice(0, 1)),
    mkSection(2, 'B', null, false, '## B — Audience (SYNTHETIC)\nFirst-time applicants reading at a plain-English level.\n', []),
    mkSection(3, 'C', 'Road rules (synthetic)', true, '## C — Road rules (SYNTHETIC)\n**F1.** A full stop is required at a red octagonal sign [P2].\n- Applies at every marked stop line.\n**§ high_yield (ranked):** 1) F1 full stop.\n', A.slice(1), ['F1']),
    mkSection(4, 'C2', null, false, '## C2 — KG hints (SYNTHETIC)\nF1: group_hint signs; difficulty_hint low; prereq none.\n', []),
    mkSection(5, 'D', null, false, '## D — Accuracy (SYNTHETIC)\nSD-1: the passing standard is unverified; withheld until the issuer page states it (verify — SD-1).\n', []),
    mkSection(6, 'E', null, false, '## E — Market signal (SYNTHETIC)\nCandidate volume is unknown; recorded as debt SD-2 (verify — SD-2).\n', []),
    mkSection(7, 'E2', null, false, '## E2 — Teardown (SYNTHETIC)\nNo named competitor reviewed in this synthetic fixture.\n', []),
    mkSection(8, 'F', null, false, '## F — Structured research index (SYNTHETIC)\nOpen debts: SD-1, SD-2.\n', []),
    mkSection(9, 'G', null, false, '## G — Definition of done (SYNTHETIC)\nEvery box below carries a located disposition.\n', []),
  ];
  const fact = (value, status, source_page) => ({ value, status, source_page });
  const merged = sections.map(s => s.markdown).join('');
  const positive = {
    _fixture: { kind: 'synthetic', label: 'SYNTHETIC interface fixture — fictional issuer, not a DMV or V1 result', generator: 'tools/belt/project/02-dossier-sections.mjs#buildSynthetic', expected_status_with_context: 'PASS' },
    artifact: 'SmeDossierEnvelope', schema_version: '0.4.0', stage_id: '02.dossier_sections', probe: 'synthetic-probe',
    lineage: { input_manifest_sha256: 'a'.repeat(64), candidate_lineage_id: 'lineage-synthetic-001', source_registry_sha256: 'b'.repeat(64), source_liveness_sha256: null },
    envelope_scope: { kind: 'complete_dossier', assigned_section_ids: [...SECTION_IDS], chunk_index: 1, chunk_total: 1 },
    section_char_limit: 4000,
    sections,
    merge: { order_rule: 'merge_seq_ascending', joiner: 'concat_no_separator', expected_merged_sha256: sha256Bytes(Buffer.from(merged, 'utf8')) },
    exam_facts: {
      exam_name: fact('Example written knowledge test (synthetic)', 'authored', null),
      issuing_body: fact('Example Licensing Board (synthetic)', 'verified', 'SYN-HB#p.1'),
      edition: fact(null, 'unknown', null),
      effective_date: fact(null, 'unknown', null),
      question_bank_size: fact(null, 'unknown', null),
      n_questions: fact(25, 'verified', 'SYN-HB#p.1'),
      passing_standard: fact(null, 'unknown', null),
      format: fact(null, 'unknown', null),
      time_limit: fact(null, 'unknown', null),
    },
    high_yield_ranked: [{ domain: 'Road rules (synthetic)', chunk_id: 'C.03', ranked: [{ rank: 1, item_refs: ['F1'], label: 'F1 full stop' }] }],
    needs_dedicated_surface: { status: 'declared', items: [{ skill: 'sign recognition (verbal cues)', domain: 'Road rules (synthetic)', needs_dedicated_surface: true, why: 'scored separately from rules recall in this synthetic issuer', source_page: 'SYN-HB#p.2' }] },
    corpus_stability: { assessment: 'stable_le_1_per_year', blocked_probe: false, reason: 'synthetic handbook revised at most annually [P1]' },
    verification_debt: [
      { claim_id: 'SD-1', claim_text: 'Passing standard (a hint of 80% appears only in a legacy candidate config)', blocker_kind: 'source_missing', source_tier_required: 'official', owner_worker: 'EvidenceLibrarian', ship_blocking: true, expires_by: '2026-11-30', resolution_artifact_ref: null, located_at: { section_id: 'D', chunk_id: 'D.05' }, withheld_values: ['80%'] },
      { claim_id: 'SD-2', claim_text: 'Annual candidate volume', blocker_kind: 'source_missing', source_tier_required: 'official', owner_worker: 'EvidenceLibrarian', ship_blocking: false, expires_by: null, resolution_artifact_ref: null, located_at: { section_id: 'E', chunk_id: 'E.06' }, withheld_values: [] },
    ],
    external_review_requests: [],
    market_signal: { origin: 'sme', origin_note: 'synthetic: no market research performed; typed debt only', disposition: 'typed_debt', chunk_ids: ['E.06'], debt_refs: ['SD-2'] },
    g_matrix: G_BOXES.map(b => ({ box_id: b, disposition: b === 'G02_passing_standard_exact' ? 'debt' : (b === 'G08_competitive_teardown' || b === 'G09_market_pack') ? 'non_applicable' : 'completed', located_at: b === 'G02_passing_standard_exact' ? 'D.05' : 'G.09', debt_ref: b === 'G02_passing_standard_exact' ? 'SD-1' : null, note: b.startsWith('G08') || b.startsWith('G09') ? 'synthetic fixture: market research scoped out' : 'synthetic' })),
  };
  const context = {
    _fixture: { kind: 'synthetic_context', label: 'SYNTHETIC context for 02 synthetic fixtures' },
    input_manifest_sha256: 'a'.repeat(64),
    source_registry: { pages: { 'SYN-HB': { title: 'Example handbook (synthetic)', tier: 'official' } } },
  };
  // negative: the withheld 80% leaks into a learner-facing knowledge chunk
  const leak = structuredClone(positive);
  leak._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — source-debt numeral leak', expected_status_with_context: 'FAIL', expected_failing_checks: ['02.NUMERAL_LEAK'] };
  const c = leak.sections[2];
  c.markdown = c.markdown.replace('**§ high_yield', 'You need 80% to pass [P2].\n**§ high_yield');
  c.char_count = cp(c.markdown);
  leak.merge.expected_merged_sha256 = sha256Bytes(Buffer.from(leak.sections.map(s => s.markdown).join(''), 'utf8'));
  // negative: truncated chunk (char_count no longer matches, ends mid-token, merged hash changes)
  const trunc = structuredClone(positive);
  trunc._fixture = { kind: 'synthetic', label: 'SYNTHETIC negative — truncated section chunk', expected_status_with_context: 'FAIL', expected_failing_checks: ['02.SECTION_BOUNDS', '02.TRUNCATION_GUARD', '02.MERGE_DETERMINISTIC'] };
  trunc.sections[2].markdown = '## C — Road rules (SYNTHETIC)\n**F1.** A full stop is required at a red octa';
  return { positive, context, leak, trunc };
}

// ---------- CLI ----------
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes('--write')) {
  const dir = join(LANE, 'tools', 'belt', 'fixtures', '02.dossier_sections');
  mkdirSync(dir, { recursive: true });
  const md = readFileSync(V1_SOURCE, 'utf8');
  const v1 = projectV1(md, { sourceSha256: sha256File(V1_SOURCE) });
  const registry = JSON.parse(readFileSync(V1_REGISTRY, 'utf8'));
  const v1ctx = {
    _fixture: { kind: 'v1_projected_context', label: 'context for the V1 projection: the V1 SourceRegistry embedded verbatim; no input manifest exists for V1', source: { path: V1_REGISTRY, sha256: sha256File(V1_REGISTRY) } },
    source_registry: registry,
  };
  const { positive, context, leak, trunc } = buildSynthetic();
  const w = (name, obj) => { writeFileSync(join(dir, name), JSON.stringify(obj, null, 2) + '\n'); console.log(`${name} ${sha256File(join(dir, name))}`); };
  const ptr = (name, base) => w(`${name}.context.json`, { $load: `tools/belt/fixtures/02.dossier_sections/${base}` });
  const hold = structuredClone(positive);
  hold._fixture = { kind: 'synthetic', label: 'SYNTHETIC — positive envelope with NO context (manifest/registry absent) -> HOLD, never PASS', expected_status: 'HOLD' };
  w('v1-projected.json', v1);
  w('v1-context.json', v1ctx);
  w('synthetic-positive.json', positive);
  w('synthetic-context.json', context);
  w('synthetic-negative-numeral-leak.json', leak);
  w('synthetic-negative-truncated.json', trunc);
  w('synthetic-hold-no-context.json', hold);
  ptr('v1-projected', 'v1-context.json');
  for (const n of ['synthetic-positive', 'synthetic-negative-numeral-leak', 'synthetic-negative-truncated']) ptr(n, 'synthetic-context.json');
}
