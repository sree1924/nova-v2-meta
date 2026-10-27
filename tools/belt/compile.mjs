// Role 16 pilot adapter: exact deterministic merge + located fact index.
// No canonical Blueprint certification, enrichment, clock, writes or model calls.
import fs from 'node:fs';
import path from 'node:path';
import {canonicalJson, sha256, jsonBytes, verifyRef, inside} from './atomic-file.mjs';
import {mergeEnvelopes, mergeSections} from './checks/02-dossier-sections.mjs';

const slash = s => s.replaceAll('\\', '/');
const clone = value => JSON.parse(JSON.stringify(value));
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isAccepted = ref => ref?.accepted === true || ref?.status === 'accepted';

function readRuntime(ref, projectRoot, runRoot, kind) {
  if (!isAccepted(ref)) throw new Error(`Compiler requires ledger-accepted ${kind} reference`);
  const file = verifyRef(ref, projectRoot);
  inside(runRoot, file);
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Object.hasOwn(value, '_fixture')) throw new Error('Fixture metadata cannot enter a production compile');
  return {value, ref: {kind, path: slash(path.relative(projectRoot, file)), sha256: ref.sha256}};
}

function findPage(sourcePage, pageMap) {
  if (typeof sourcePage !== 'string') return null;
  const pages = pageMap.pages ?? [];
  const direct = pages.filter(p => [p.page_id, p.page_map_id, p.source_page].includes(sourcePage));
  if (direct.length === 1) return direct[0];
  // Only explicit physical-page locators are parsed. Bare '#p.2' could mean
  // printed2 or physical2 and must instead resolve to an exact registered ID.
  const physical = sourcePage.match(/^(.*?)#(?:pdf_page=|pdf_page:)(\d+)$/);
  if (!physical) return null;
  const found = pages.filter(p => p.pdf_page === Number(physical[2]) && p.source_ref === physical[1]);
  return found.length === 1 ? found[0] : null;
}

function indexFact(id, section, pageMap) {
  const lines = section.markdown.split('\n');
  // Two marker forms: the legacy inline lead ("**F01** text" / "F01: text") and the 02 block lead the Utah pilot's
  // output-conventions prescribe ("FACT_ID: F01 | anchor: A01" on its own line, statement on the following lines).
  const marker = new RegExp(`^\\s*(?:[-*+]\\s+)?(?:FACT_ID:\\s*${escape(id)}\\s*(?:\\|\\s*anchor:\\s*[A-Za-z0-9_-]+)?\\s*()$|(?:\\*\\*${escape(id)}[.:]?\\*\\*[.:]?|${escape(id)}[.:])\\s*(.*)$)`);
  const candidates = lines.map((line, i) => ({match: line.match(marker), i})).filter(v => v.match);
  if (candidates.length !== 1) return {error: `${id}: expected exactly one explicit fact marker in ${section.chunk_id}; found ${candidates.length}`};
  const {match, i} = candidates[0];
  // The block body may start after blank line(s) following a FACT_ID lead (sec01 layout, 2026-10-27); it ends at the next blank
  // line after the body began, or at a heading / bold lead / next FACT_ID.
  let start = i + 1;
  if (match[1] !== undefined) while (start < lines.length && !lines[start].trim()) start++;
  let end = start;
  while (end < lines.length && lines[end].trim() && !/^\s*(?:#{1,6}\s|\*\*|§|FACT_ID:)/.test(lines[end])) end++;
  const lead = match[1] ?? match[2] ?? '';
  // "Source: [Axx -> page]" trailers and "Why it matters:"-style commentary lines are bookkeeping, not fact wording; they stay
  // in the verbatim span only.
  const body = lines.slice(start, end).filter(l => !/^\s*Source:\s*\[[A-Za-z0-9_-]+\s*->\s*\S+\]\s*$/.test(l) && !/^\s*(?:Why it matters|Why|Example|Tip|Note|Context|Remember|Exam angle|Trap)\s*:/i.test(l));
  const raw = [lead, ...body].join('\n');
  const anchors = (section.source_anchors ?? []).filter(a => raw.includes(`[${a.anchor_id}]`));
  if (!anchors.length) return {error: `${id}: exact marked fact span has no explicit source anchor`};
  const pages = anchors.map(a => ({anchor: a, page: findPage(a.source_page, pageMap)}));
  const unresolved = pages.filter(p => !p.page);
  if (unresolved.length) return {error: `${id}: physical page unresolved for ${unresolved.map(p => p.anchor.source_page).join(', ')}`};
  const identities = new Set(pages.map(p => p.page.page_map_id));
  if (identities.size !== 1) return {error: `${id}: multi-page span needs an explicit fact split; compiler will not choose a page`};
  let statement = raw;
  for (const anchor of anchors) statement = statement.split(`[${anchor.anchor_id}]`).join('');
  // Scaffold lines ("Group: x | Prereq: y | Difficulty: 2 | Confusable: z") are dossier bookkeeping, never fact wording;
  // anchor removal leaves " ." / " ," which is closed up. Both fixes are learner-facing: 04 backs must equal this statement.
  statement = statement.split('\n').filter(l => !/^\s*(?:[A-Za-z][A-Za-z _-]{0,20}:\s*[^|\n]*\|\s*){1,}[A-Za-z][A-Za-z _-]{0,20}:\s*[^|\n]*$/.test(l)).join('\n');
  statement = statement.replace(/\s+([.,;:!?])/g, '$1').replace(/[ \t]+(?=\n|$)/g, '').trim();
  if (!statement || /\(\s*verify\b/i.test(statement)) return {error: `${id}: empty or unresolved fact span cannot enter accepted wording`};
  const page = pages[0].page;
  return {fact: {
    fact_id: id, text: statement, statement,
    status: 'authored', acceptance_kind: 'deterministic_validation_only', independent_audit_status: 'pending',
    section: section.section_id, chunk_id: section.chunk_id, domain: section.domain,
    source_page: pages[0].anchor.source_page, pdf_page: page.pdf_page, printed_page: page.printed_page,
    page_map_id: page.page_map_id, source_document_sha256: page.source_document_sha256 ?? pageMap.source_document_ref?.sha256 ?? null,
    source_ref: {ref: page.source_ref ?? pageMap.source_ref, pdf_page: page.pdf_page, printed_page: page.printed_page, page_map_id: page.page_map_id},
    source_span: {chunk_id: section.chunk_id, start_line: i + 1, end_line: end,
      markdown_sha256: sha256(Buffer.from(section.markdown)), verbatim: lines.slice(i, end).join('\n')},
    transformation: 'Remove explicit fact-ID marker and declared inline source-anchor tokens; retain all wording and continuation lines.',
  }};
}

/** Accepted refs are supplied by the controller from the ledger, never inferred
 * from file presence or PASS text inside an output. Relative paths use projectRoot.
 */
export function compileDossier({projectRoot, runRoot, acceptedEnvelopes: acceptedEnvelopesIn = [], sourceRegistryRef, pageMapRef, overlayRef, candidateLineageId = null, outputDir = 'root'} = {}) {
  // Per-part dispatch (JAM-UT-03) + lineage resets mean accepted parts legitimately come from several lineages, and a part may be
  // re-accepted under a new task identity (validator closure reseal). Rule: one envelope per assigned part set — the latest
  // accepted wins (ledger accepted_at, then task_id for determinism); lineages are recorded, not required to match.
  const byParts = new Map();
  for (const r of acceptedEnvelopesIn) {
    const parts = (() => { try { return JSON.stringify(JSON.parse(r.identity ?? 'null')?.config?.dossier_parts ?? []); } catch { return '[]'; } })();
    const key = parts === '[]' ? 'whole:' + (r.task_id ?? r.sha256) : parts;
    const prev = byParts.get(key);
    if (!prev || String(r.accepted_at ?? '') > String(prev.accepted_at ?? '') || (String(r.accepted_at ?? '') === String(prev.accepted_at ?? '') && String(r.task_id ?? '') > String(prev.task_id ?? ''))) byParts.set(key, r);
  }
  const acceptedEnvelopes = [...byParts.values()];
  const supersededEnvelopes = acceptedEnvelopesIn.filter(r => !acceptedEnvelopes.includes(r)).map(r => ({path: r.path, sha256: r.sha256, task_id: r.task_id ?? null}));
  if (!projectRoot || !runRoot) throw new Error('projectRoot and isolated runRoot are required');
  projectRoot = fs.realpathSync(projectRoot);
  runRoot = inside(path.join(projectRoot, 'runs'), runRoot);
  if (!acceptedEnvelopes.length) return {status: 'HOLD', errors: ['No accepted02 envelopes'], inputRefs: [], writePlan: [], blueprint: null, factRegistry: null, markdown: null};
  const loaded = acceptedEnvelopes.map(r => readRuntime(r, projectRoot, runRoot, 'dossier_envelope'));
  const sourceRegistry = readRuntime(sourceRegistryRef, projectRoot, runRoot, 'source_registry');
  const map = readRuntime(pageMapRef, projectRoot, runRoot, 'page_map');
  const overlayFile = verifyRef(overlayRef, projectRoot);
  const overlay = JSON.parse(fs.readFileSync(overlayFile, 'utf8'));
  const overlayPin = {kind: 'pilot_overlay', path: slash(path.relative(projectRoot, overlayFile)), sha256: overlayRef.sha256};
  if (overlay.role_overrides?.['16']?.implementation !== 'deterministic_merge_and_fact_index' ||
      overlay.role_overrides?.['17']?.disposition !== 'n/a_pilot' || !overlay.role_overrides['17'].reason?.trim()) {
    throw new Error('Pinned overlay must declare role16 deterministic_merge_and_fact_index and role17 n/a_pilot with reason');
  }
  const envelopes = loaded.map(l => l.value);
  const errors = [];
  const probes = new Set(envelopes.map(e => e.probe));
  if (probes.size !== 1) errors.push('Accepted envelopes have conflicting probe');
  const sourceLineages = [...new Set(envelopes.map(e => e.lineage?.candidate_lineage_id ?? null))].sort();
  for (const envelope of envelopes) {
    if (envelope.artifact !== 'SmeDossierEnvelope' || envelope.stage_id !== '02.dossier_sections') errors.push('Accepted input is not a stage02 dossier envelope');
    // An envelope that asserts a registry hash must match the accepted registry; an empty/null hash (a non-citing part such as
    // B or E that omitted it) is "not asserted" and is recorded, not failed — the anchors of citing parts are resolved below.
    const envReg = envelope.lineage?.source_registry_sha256;
    if (envReg && envReg !== sourceRegistry.ref.sha256) errors.push('Envelope source registry hash differs from accepted registry');
    const ownMerge = mergeSections(envelope.sections);
    // A declared expected_merged_sha256 names the FULL dossier (output-conventions): it is only comparable on a complete_dossier
    // envelope. Null / all-zeros means "not computed" (sec03 part declared a non-null placeholder, 2026-10-27).
    const declared = envelope.merge?.expected_merged_sha256;
    const realHash = typeof declared === 'string' && /^[a-f0-9]{64}$/.test(declared) && !/^0{64}$/.test(declared);
    if (realHash && envelope.envelope_scope?.kind !== 'partial_chunk' && declared !== ownMerge.sha256) errors.push('Envelope declared merge hash differs from actual ordered bytes');
  }
  const merged = mergeEnvelopes(envelopes);
  errors.push(...merged.errors);
  const sections = merged.sections; // the merge's own order (one envelope: merge_seq; several: section order, then merge_seq)
  const factEntries = [];
  const seen = new Set();
  for (const section of sections) for (const id of section.fact_ids ?? []) {
    if (seen.has(id)) { errors.push(`Duplicate declared fact ID ${id}`); continue; }
    seen.add(id);
    const indexed = indexFact(id, section, map.value);
    if (indexed.error) errors.push(indexed.error);
    else factEntries.push([id, indexed.fact]);
  }
  if (!factEntries.length) errors.push('No unambiguously located accepted fact spans were indexed');
  const inputRefs = [...loaded.map(l => l.ref), sourceRegistry.ref, map.ref, overlayPin]
    .sort((a, b) => `${a.kind}:${a.path}`.localeCompare(`${b.kind}:${b.path}`));
  const inputManifestHash = sha256(canonicalJson(inputRefs));
  const stage17 = {status: 'n/a_pilot', reason: overlay.role_overrides['17'].reason,
    overlay_ref: overlayPin, action: 'No hint enrichment executed; accepted section/C2 text passes through unchanged.'};
  const status = errors.length ? 'HOLD' : 'PASS';
  const factRegistry = {artifact_type: 'AcceptedDossierFactIndex', schema_version: '0.4.0', status,
    role_id: '16', input_manifest_sha256: inputManifestHash,
    source_registry_sha256: sourceRegistry.ref.sha256, page_map_sha256: map.ref.sha256,
    acceptance_kind: 'deterministic_index_only_not_factual_audit',
    facts: Object.fromEntries(factEntries.sort(([a], [b]) => a.localeCompare(b)))};
  const blueprint = {artifact_type: 'CompiledDossierPilot', schema_version: '0.4.0', role_id: '16', status,
    canonical_blueprint_validation_claimed: false, probe: envelopes[0].probe,
    candidate_lineage_id: candidateLineageId ?? envelopes[0].lineage?.candidate_lineage_id ?? null,
    source_lineages: sourceLineages, superseded_envelopes: supersededEnvelopes,
    input_manifest_sha256: inputManifestHash, input_refs: inputRefs,
    source_registry_sha256: sourceRegistry.ref.sha256, page_map_sha256: map.ref.sha256,
    merge: {order: merged.order, sha256: merged.sha256, rule: 'merge_seq_ascending_concat_no_separator'},
    sections: clone(sections), exam_facts: clone(envelopes[0].exam_facts),
    high_yield_ranked: clone(envelopes.flatMap(e => e.high_yield_ranked ?? [])),
    verification_debt: clone(envelopes.flatMap(e => e.verification_debt ?? [])),
    external_review_requests: clone(envelopes.flatMap(e => e.external_review_requests ?? [])),
    stage17, fact_registry_sha256: sha256(jsonBytes(factRegistry)), compiler_note: 'statements: anchors removed, scaffold key:value|… lines dropped, punctuation closed up', errors: [...new Set(errors)]};
  // Output paths: the root names for the first compile; a RE-compile over the same inputs (compiler fix) goes under
  // 16/<fact-registry sha8>/ so the immutable first files stay as history. Basenames are kept (context binds kinds by basename).
  const registrySha = sha256(jsonBytes(factRegistry));
  // outputDir: 'root' (legacy Section 9 first compile) | 'versioned' (recompile of the root compile) | any explicit prefix such as
  // '16/sec10-alcohol-drugs/' (per-section compiles); an explicit prefix ending in '*/' versions under it.
  const dir = outputDir === 'root' ? '' : outputDir === 'versioned' ? `16/${registrySha.slice(0, 8)}/` : outputDir.endsWith('*/') ? `${outputDir.slice(0, -2)}/${registrySha.slice(0, 8)}/` : outputDir;
  return {status, blueprint, factRegistry, markdown: merged.markdown, errors: [...new Set(errors)], inputRefs, fact_registry_sha256: registrySha,
    writePlan: [
      {path: dir + '16-compiled-dossier.json', value_key: 'blueprint', sha256: sha256(jsonBytes(blueprint))},
      {path: dir + '16-fact-registry.json', value_key: 'factRegistry', sha256: registrySha},
      {path: dir + '02-blueprint.md', value_key: 'markdown', sha256: merged.sha256, encoding: 'utf8'},
      {path: dir + '17-disposition.json', value_key: 'blueprint.stage17', sha256: sha256(jsonBytes(stage17))},
    ]};
}
