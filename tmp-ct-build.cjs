const fs = require('fs');
const crypto = require('crypto');
const ROOT = 'D:/nova/fb-ai-hackathon';
const RUN = 'runs/2026-10-28-rdmv-ct-class-d';
const KEY = '02.dossier_sections__sec09-rules-of-road__E__n0';
const inbox = `${ROOT}/${RUN}/sources/private/muse-authoring/inbox/${KEY}.json`;
const outbox = `${ROOT}/${RUN}/sources/private/muse-authoring/outbox/${KEY}.json`;
const packet = JSON.parse(fs.readFileSync(inbox, 'utf8'));
const packetSha = crypto.createHash('sha256').update(fs.readFileSync(inbox)).digest('hex');
const md =
`## E \u2014 Market signal\n` +
`\n` +
`Status: no market research was performed for this section; the upstream competitive-intelligence pointer was not supplied for this run, so market size, pass rate, rooms, voice-of-customer quotes, persona, seasonality, price and success bar are recorded as typed debt (verify \u2014 CT-SEC-NINE-E-MARKET).\n` +
`Known context only from the product frame: buyers are first-time Connecticut applicants and the parents of teen drivers preparing for the knowledge test; for this section the pressing need is knowing speed, yield, parking and lighting rules.\n` +
`Ad hooks, verbatim learner pain phrases and a named differentiation gap must come from sourced recon in a later pass, never invented here.\n`;
const unk = () => ({ value: null, status: 'unknown', source_page: null });
const artifact = {
  artifact: 'SmeDossierEnvelope',
  schema_version: '0.4.0',
  stage_id: '02.dossier_sections',
  probe: 'rdmv-ct-d',
  lineage: {
    input_manifest_sha256: packet.delta.inputData.lineage_to_copy.input_manifest_sha256,
    candidate_lineage_id: packet.delta.inputData.lineage_to_copy.candidate_lineage_id,
    source_registry_sha256: packet.delta.inputData.runtime_bindings.source_registry_sha256,
    source_liveness_sha256: packet.delta.inputData.runtime_bindings.source_liveness_sha256,
  },
  envelope_scope: { kind: 'partial_chunk', assigned_section_ids: ['E'], chunk_index: 1, chunk_total: 1 },
  section_char_limit: 12000,
  sections: [{
    section_id: 'E', chunk_id: 'E.01', merge_seq: 1,
    domain: null,
    heading: 'E \u2014 Market signal',
    learner_facing: false, markdown: md, char_count: [...md].length,
    fact_ids: [],
    source_anchors: [],
  }],
  merge: { order_rule: 'merge_seq_ascending', joiner: 'concat_no_separator', expected_merged_sha256: null },
  exam_facts: {
    exam_name: unk(), issuing_body: unk(), edition: unk(), effective_date: unk(),
    question_bank_size: unk(), n_questions: unk(), passing_standard: unk(), format: unk(), time_limit: unk(),
  },
  high_yield_ranked: [],
  needs_dedicated_surface: { status: 'unknown', items: [] },
  corpus_stability: { assessment: 'stable_le_1_per_year', blocked_probe: false, reason: 'The Connecticut Driver\u2019s Manual is one dated edition (Revised March 2023, physical p3); nothing on the selected pages indicates more than one rewrite per year.' },
  verification_debt: [
    { claim_id: 'CT-SEC-NINE-E-MARKET', claim_text: 'Market size, pass rate, rooms, voice-of-customer, persona, seasonality, pricing, success bar, ad hooks and named priced competitors for Connecticut knowledge-test prep (rules of the road) were not researched in this pass', blocker_kind: 'source_missing', source_tier_required: 'reputable', owner_worker: 'SMEResearchAgent', ship_blocking: false, expires_by: null, resolution_artifact_ref: null, located_at: { section_id: 'E', chunk_id: 'E.01' }, withheld_values: [] },
  ],
  external_review_requests: [],
  market_signal: { origin: 'sme', origin_note: 'no CompetitiveIntel pointer supplied for this run; market pack recorded as typed debt, never fictional research', disposition: 'typed_debt', chunk_ids: ['E.01'], debt_refs: ['CT-SEC-NINE-E-MARKET'] },
  g_matrix: [],
};
const out = { key: KEY, packet_sha256: packetSha, authored_by: 'muse-code/muse-spark-1.3 (subscription)', artifact };
fs.writeFileSync(outbox + '.tmp', JSON.stringify(out, null, 2) + '\n');
fs.renameSync(outbox + '.tmp', outbox);
console.log('cp:', [...md].length, 'digits:', /\d/.test(md));
