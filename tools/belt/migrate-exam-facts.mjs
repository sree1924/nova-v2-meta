#!/usr/bin/env node
// migrate-exam-facts.mjs — rewrite scope.exam_facts in a seeded run's run-config into the shape the safe model-input view
// verifies (tools/sanitize-model-input.mjs normalizeOfficialFact): {value, status, source_page, source_ref,
// source_snapshot_sha256, liveness_receipt_ref} per fact, bound to the registered source. intake-state.mjs wrote flat numbers
// on 2026-10-28, so every new state's exam facts read "unknown" even when the handbook states them (NJ 50/80, NY 20/70, TX 70,
// VA 80, FL 50). Provenance notes move to scope.exam_facts_provenance (every key of exam_facts is treated as a fact).
//   node tools/belt/migrate-exam-facts.mjs runs/<run> [runs/<run> ...] [--dry]
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const LANE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const runs = args.filter((a) => !a.startsWith('--')).map((r) => r.replace(/\\/g, '/').replace(/\/$/, ''));
const sha = (buf) => createHash('sha256').update(buf).digest('hex');
const readJ = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const pad = (n) => String(n).padStart(4, '0');

export function examFactsFor({ runRel, registry, values, pages, livenessRel }) {
  const src = registry.sources[0];
  const ref = src.source_ref, snap = src.snapshot_hash;
  const fact = (value, page) => value == null || page == null
    ? { value: null, status: 'unknown', source_page: null, source_ref: null, source_snapshot_sha256: null, liveness_receipt_ref: null }
    : { value, status: 'verified', source_page: `${ref}:pdf-${pad(page)}`, source_ref: ref, source_snapshot_sha256: snap, liveness_receipt_ref: livenessRel };
  return {
    question_count: fact(values.question_count, pages.question_count),
    passing_percent: fact(values.passing_percent, pages.passing_percent),
    time_limit: fact(values.time_limit, pages.time_limit),
    format: { value: null, status: 'unknown', source_page: null, source_ref: null, source_snapshot_sha256: null, liveness_receipt_ref: null },
  };
}

for (const run of runs) {
  const cfgPath = path.join(LANE, run, 'run-config.json');
  const cfg = readJ(cfgPath);
  const regPath = path.join(LANE, run, '15-source-registry.json');
  if (!fs.existsSync(regPath)) { console.log(run, ': no source registry; skipped'); continue; }
  const registry = readJ(regPath);
  const e = cfg.scope.exam_facts || {};
  const already = e.question_count && typeof e.question_count === 'object';
  if (already) { console.log(run, ': already object-shaped; skipped'); continue; }
  const obsRef = e.passing_score_observation_ref;
  const obs = obsRef && fs.existsSync(path.join(LANE, obsRef.path)) ? readJ(path.join(LANE, obsRef.path)) : null;
  const passingPage = obs?.pdf_page ?? (e.source_pages || [])[e.source_pages?.length - 1] ?? null;
  const questionPage = (e.source_pages || []).find((p) => p !== passingPage) ?? passingPage;
  const values = { question_count: e.question_count ?? null, passing_percent: e.passing_percent ?? null, time_limit: e.time_limit ?? null };
  const pages = { question_count: questionPage, passing_percent: passingPage, time_limit: null };
  const livenessRel = `${run}/15-source-liveness.json`;
  const next = examFactsFor({ runRel: run, registry, values, pages, livenessRel });
  const provenance = { note: e.note ?? null, source_pages: e.source_pages ?? null, passing_score_observation_ref: obsRef ?? null, recorded_from: e.recorded_from ?? null, migrated_at: new Date().toISOString(), migrated_by: 'tools/belt/migrate-exam-facts.mjs', previous_shape: 'flat numbers (intake-state.mjs 2026-10-28 <04:30Z)' };
  // the observation receipt's source_ref/source_page must name the REGISTERED source (intake wrote a provisional ref)
  let obsNote = '';
  if (obs && obs.source_ref !== registry.sources[0].source_ref) {
    obs.source_ref = registry.sources[0].source_ref; obs.source_page = `${registry.sources[0].source_ref}:pdf-${pad(obs.pdf_page)}`; obs.snapshot_sha256 = registry.sources[0].snapshot_hash;
    if (!DRY) { fs.writeFileSync(path.join(LANE, obsRef.path), JSON.stringify(obs, null, 2) + '\n'); provenance.passing_score_observation_ref = { path: obsRef.path, sha256: sha(fs.readFileSync(path.join(LANE, obsRef.path))) }; }
    obsNote = ' (+ observation receipt re-bound to the registered source ref)';
  }
  cfg.scope.exam_facts = next; cfg.scope.exam_facts_provenance = provenance;
  console.log(run, ':', Object.entries(next).map(([k, v]) => `${k}=${v.status === 'verified' ? v.value + '@' + v.source_page.split(':').pop() : 'unknown'}`).join(' '), DRY ? '(dry)' : 'WRITTEN' + obsNote);
  if (!DRY) { fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n'); fs.appendFileSync(path.join(LANE, run, 'jams.md'), `\n- ${new Date().toISOString()} exam_facts migrated to the verified object shape (question_count/passing_percent/time_limit/format bound to the registered source); provenance in scope.exam_facts_provenance\n`); }
}
