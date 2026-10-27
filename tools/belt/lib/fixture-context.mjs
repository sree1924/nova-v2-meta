// Fixture-context loader shared by tools/belt/run-fixtures.mjs and tests/belt/*.test.mjs.
// A fixture `<name>.json` may have a sibling `<name>.context.json`. Inside a context file any object of the
// exact form {"$load": "<path>"} is replaced by the parsed JSON at <path> (resolved against the lane root,
// D:/nova/fb-ai-hackathon, unless absolute), and the exact bytes' sha256 is recorded at
// context.loaded_refs["<dotted.key.path>"] = {path, sha256}. Checks read hashes through loaded_refs (or an
// inline context.ref_sha256[key]) and stay pure: this loader does the file reads, never the checks.
// Reads only; no network, no writes, no clock.
import { readFileSync, existsSync } from 'node:fs';
import { isAbsolute, join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256Bytes } from './hash.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const LANE_ROOT = resolve(here, '..', '..', '..');

export function contextPathFor(fixtureAbs) {
  const a = fixtureAbs.replace(/\.json$/, '.context.json');
  if (a !== fixtureAbs && existsSync(a)) return a;
  const b = `${fixtureAbs}.context.json`;
  if (existsSync(b)) return b;
  return null;
}

export function resolveContext(raw, { root = LANE_ROOT } = {}) {
  const loaded_refs = { ...(raw?.loaded_refs ?? {}) };
  const walk = (node, keyPath) => {
    if (Array.isArray(node)) return node.map((n, i) => walk(n, `${keyPath}[${i}]`));
    if (!node || typeof node !== 'object') return node;
    const keys = Object.keys(node);
    if (keys.length === 1 && keys[0] === '$load' && typeof node.$load === 'string') {
      const abs = isAbsolute(node.$load) ? node.$load : join(root, node.$load);
      const bytes = readFileSync(abs);
      loaded_refs[keyPath] = { path: node.$load, sha256: sha256Bytes(bytes) };
      return JSON.parse(bytes.toString('utf8'));
    }
    const out = {};
    for (const k of keys) {
      if (keyPath === '' && k === 'loaded_refs') continue;
      out[k] = walk(node[k], keyPath ? `${keyPath}.${k}` : k);
    }
    return out;
  };
  const ctx = walk(raw ?? {}, '');
  ctx.loaded_refs = loaded_refs;
  return ctx;
}

export function loadFixtureContext(fixtureAbs, opts) {
  const p = contextPathFor(fixtureAbs);
  if (!p) return { context: {}, context_path: null };
  return { context: resolveContext(JSON.parse(readFileSync(p, 'utf8')), opts), context_path: p };
}
