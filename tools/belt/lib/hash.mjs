import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const sha256Bytes = (buf) => createHash('sha256').update(buf).digest('hex');
export const sha256File = (path) => sha256Bytes(readFileSync(path));

// Canonical JSON: recursive lexicographic keys, compact, no trailing newline (matches prompts/README.md §13.4).
export function canonicalJson(value) {
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('non-finite number');
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return '[' + value.map(canonicalJson).join(',') + ']';
  return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonicalJson(value[k])).join(',') + '}';
}
export const sha256Canonical = (value) => sha256Bytes(Buffer.from(canonicalJson(value), 'utf8'));
