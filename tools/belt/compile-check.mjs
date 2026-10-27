// Pure compile check: runs the role-16 compiler over the ledger-accepted 02 parts WITHOUT touching the ledger or writing
// artifacts. Prints status + errors (and fact count on PASS). Runner verification tool, 2026-10-27.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { readNativeSnapshot, acceptedRuntimeRefs } from './dispatch.mjs';
import { compileDossier } from './compile.mjs';

const projectRoot = process.cwd();
const runConfigPath = process.argv[2] ?? 'runs/2026-10-26-rdmv-ut-class-d/run-config.json';
const configPath = path.resolve(projectRoot, runConfigPath);
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const runDir = path.dirname(configPath);
const snapshot = readNativeSnapshot(runDir, config);
const accepted = acceptedRuntimeRefs(snapshot, projectRoot, runDir);
const envelopes = accepted.filter(a => a.kind === '02.dossier_sections');
const source = accepted.find(a => a.kind === 'source_registry');
const pages = accepted.find(a => a.kind === 'page_map');
const overlayPath = path.join(projectRoot, 'contracts/pilot-overrides-v0.4.0.json');
const overlay = { path: 'contracts/pilot-overrides-v0.4.0.json', sha256: createHash('sha256').update(fs.readFileSync(overlayPath)).digest('hex') };
console.log(`accepted 02 envelopes: ${envelopes.length}; source registry: ${!!source}; page map: ${!!pages}`);
const r = compileDossier({ projectRoot, runRoot: runDir, acceptedEnvelopes: envelopes, sourceRegistryRef: source, pageMapRef: pages, overlayRef: overlay, candidateLineageId: config.candidate_lineage_id });
console.log('status', r.status);
if (r.errors?.length) console.log('errors', r.errors.length, '\n' + r.errors.slice(0, 40).join('\n'));
if (r.status === 'PASS') console.log('facts indexed', Object.keys(r.factRegistry.facts).length, 'merge order', r.blueprint.merge.order.join(' '), 'lineages', r.blueprint.source_lineages.join(','), 'superseded', r.blueprint.superseded_envelopes.length);
