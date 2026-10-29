// Completion is a separate join after the parallel 04/06 stages. An accepted 06 item is
// structurally bound; it does not prove that every served or high-yield node has an item.
// Pure: caller supplies accepted artifacts and their dispatcher-verified loaded_refs pins.
// There is NO assessment-gap waiver in the current 04/06/07 schemas. Preview quarantine
// hides card IDs but is not a typed, revision-bound native coverage disposition. Neither
// freeform gap claims nor quarantine strings can excuse a missing assessment here.
import { isHex64 } from './lib/qa-common.mjs';

const arr = v => Array.isArray(v) ? v : [];
const str = v => typeof v === 'string' && v.trim().length > 0;
const lineage = a => a?.candidate_lineage_id ?? a?.lineage?.candidate_lineage_id;
const INPUTS = ['knowledge_graph', 'carddeck', 'exam_bank'];

export function completionCoverage(context = {}, inputHashes = null) {
  const accepted = context.accepted_inputs ?? {};
  const missing = [];
  const errors = [];
  const pins = {};
  for (const key of INPUTS) {
    if (!accepted[key] || typeof accepted[key] !== 'object') missing.push(`accepted_inputs.${key}`);
    const pin = context.loaded_refs?.[`accepted_inputs.${key}`];
    if (!str(pin?.path) || !isHex64(pin?.sha256)) missing.push(`loaded_refs.accepted_inputs.${key}`);
    else pins[key] = pin;
    const hashKey = key === 'exam_bank' ? 'exambank' : key;
    if (pin && inputHashes && inputHashes[hashKey] !== pin.sha256) errors.push(`${hashKey}: report hash differs from accepted artifact pin`);
  }
  if (errors.length || missing.length) return { status: errors.length ? 'FAIL' : 'HOLD', errors, missing, gaps: [], metrics: { required_nodes: 0, missing_items: 0, missing_high_yield_cards: 0 } };

  const kg = accepted.knowledge_graph, deck = accepted.carddeck, bank = accepted.exam_bank;
  if (!Array.isArray(kg.nodes) || !Array.isArray(deck.decks) || !Array.isArray(bank.items)) {
    return { status: 'FAIL', errors: ['accepted KG/cards/exam shape lacks nodes/decks/items arrays'], missing: [], gaps: [], metrics: { required_nodes: 0, missing_items: 0, missing_high_yield_cards: 0 } };
  }
  const probes = INPUTS.map(key => accepted[key]?.probe);
  if (probes.some(v => !str(v))) missing.push('accepted artifact probe');
  else if (new Set(probes).size !== 1) errors.push('accepted KG/cards/exam probe differs (foreign scope)');
  // candidate_lineage_id is the execution epoch, not a cross-stage content identity.
  // Native accepted-capacity advancement can change it between 03, 04 and 06 while
  // retaining accepted inputs. Current scope comes from acceptedRuntimeRefs (stage +
  // section) and assembleContext (verified immutable refs confined to this run).
  if (INPUTS.some(key => !str(lineage(accepted[key])))) missing.push('accepted artifact candidate lineage');
  const runRoots = INPUTS.map(key => /^runs\/([^/]+)\//.exec(pins[key].path.replaceAll('\\', '/'))?.[1] ?? null);
  if (runRoots.some(Boolean) && (runRoots.some(v => v === null) || new Set(runRoots).size !== 1)) errors.push('accepted KG/cards/exam pins differ in native run scope');
  const members = context.candidate_manifest?.members;
  if (Array.isArray(members)) for (const key of INPUTS) {
    // Existing manifests allow role to be absent; typed inputHashes + accepted-input
    // keys supply the role binding. The exact current path AND digest must be present.
    if (!members.some(m => m?.path === pins[key].path && m.sha256 === pins[key].sha256)) errors.push(`${key}: current accepted path/hash absent from candidate scope`);
  }
  for (const [key, artifact] of [['carddeck', deck], ['exam_bank', bank]]) {
    if (artifact.source_refs?.knowledge_graph !== pins.knowledge_graph.path) errors.push(`${key}: knowledge_graph ref differs from accepted KG pin`);
  }
  const nodes = new Map();
  for (const n of [...kg.nodes, ...arr(kg.dynamic_nodes)]) {
    if (!str(n?.id) || nodes.has(n.id)) errors.push(`invalid or duplicate KG node ${String(n?.id)}`);
    else nodes.set(n.id, n);
  }
  const cards = new Map();
  const served = new Set();
  const requireNode = (id, owner, moduleId) => {
    const node = nodes.get(id);
    if (!node) errors.push(`${owner}: node ${String(id)} absent from accepted KG`);
    else if (str(moduleId) && str(node.module_id) && node.module_id !== moduleId) errors.push(`${owner}: module differs from KG node ${id}`);
    served.add(id);
  };
  for (const d of deck.decks) for (const c of arr(d?.cards)) {
    if (!str(c?.card_id) || cards.has(c.card_id)) errors.push(`invalid or duplicate card ${String(c?.card_id)}`);
    else cards.set(c.card_id, c);
    requireNode(c?.node_id, `card ${c?.card_id}`, c?.module_id);
  }
  for (const merge of arr(deck.merges)) {
    const card = cards.get(merge?.card_id);
    if (!card) { errors.push(`merge card ${String(merge?.card_id)} absent from accepted deck`); continue; }
    // A merge saves a card, not its other nodes' assessment obligations.
    for (const id of arr(merge.merged_node_ids)) requireNode(id, `merge ${merge.card_id}`);
  }
  const required = new Set([...served, ...kg.nodes.filter(n => n?.high_yield === true).map(n => n.id)]);
  const gaps = [];
  for (const id of [...required].sort()) {
    const node = nodes.get(id);
    if (!node) continue;
    if (node.high_yield === true && !served.has(id)) gaps.push({ node_id: id, domain: node.domain, missing: 'card', high_yield: true });
    const items = bank.items.filter(it => str(it?.item_id) && it.node_id === id && (!str(node.module_id) || it.module_id === node.module_id));
    if (!items.length) gaps.push({ node_id: id, domain: node.domain, missing: 'item', high_yield: node.high_yield === true });
  }
  const metrics = { served_cards: cards.size, served_nodes: served.size, required_nodes: required.size,
    missing_items: gaps.filter(g => g.missing === 'item').length,
    missing_high_yield_cards: gaps.filter(g => g.missing === 'card').length };
  return { status: errors.length || gaps.length ? 'FAIL' : missing.length ? 'HOLD' : 'PASS', errors, missing, gaps, metrics };
}
