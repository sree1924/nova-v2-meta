import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
export const canonicalJson = value => JSON.stringify(sort(value));
function sort(value) {
  return Array.isArray(value) ? value.map(sort) : value && typeof value === 'object'
    ? Object.fromEntries(Object.keys(value).sort().map(k => [k, sort(value[k])])) : value;
}
export const jsonBytes = value => Buffer.from(JSON.stringify(value, null, 2) + '\n');

export function inside(root, candidate) {
  const absoluteRoot = path.resolve(root);
  const target = path.resolve(absoluteRoot, candidate);
  const rel = path.relative(absoluteRoot, target);
  if (rel === '..' || rel.startsWith('..' + path.sep) || path.isAbsolute(rel)) throw new Error('Path escapes owned root.');
  // Resolve every existing ancestor, including junctions, before creating anything.
  let current = target;
  while (!fs.existsSync(current)) {
    const parent = path.dirname(current);
    if (parent === current) throw new Error('No existing ancestor for output.');
    current = parent;
  }
  const realRoot = fs.realpathSync(absoluteRoot);
  const realAncestor = fs.realpathSync(current);
  const realRel = path.relative(realRoot, realAncestor);
  if (realRel === '..' || realRel.startsWith('..' + path.sep) || path.isAbsolute(realRel)) throw new Error('Symlink/junction escapes owned root.');
  return target;
}

export function writeImmutable(root, relativePath, value, {lockHandle, bytes = false} = {}) {
  lockHandle?.assertHeld();
  const target = inside(root, relativePath);
  const content = bytes ? Buffer.from(value) : jsonBytes(value);
  const hash = sha256(content);
  if (fs.existsSync(target)) {
    if (sha256(fs.readFileSync(target)) !== hash) throw new Error('Immutable artifact already exists with different bytes: ' + relativePath);
    return {path: target, sha256: hash, bytes: content.length, reused: true};
  }
  fs.mkdirSync(path.dirname(target), {recursive: true});
  const tmp = target + '.' + crypto.randomUUID() + '.tmp';
  let fd;
  try {
    fd = fs.openSync(tmp, 'wx');
    fs.writeFileSync(fd, content);
    fs.fsyncSync(fd);
    fs.closeSync(fd); fd = undefined;
    lockHandle?.assertHeld();
    // The executor lock provides the single-writer boundary. A same-directory
    // rename publishes only a fully fsynced file (hard links are not available
    // in the Windows app sandbox).
    if (fs.existsSync(target)) {
      if (sha256(fs.readFileSync(target)) !== hash) throw new Error('Immutable publication collision.');
      fs.unlinkSync(tmp);
      return {path:target,sha256:hash,bytes:content.length,reused:true};
    }
    fs.renameSync(tmp, target);
    // Directory fsync is supported on POSIX; Windows refuses directory handles.
    if (process.platform !== 'win32') {
      const dir = fs.openSync(path.dirname(target), 'r');
      try { fs.fsyncSync(dir); } finally { fs.closeSync(dir); }
    }
  } catch (error) {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    throw error;
  }
  return {path: target, sha256: hash, bytes: content.length, reused: false};
}

export function verifyRef(ref, root) {
  if (!ref || !/^[a-f0-9]{64}$/.test(ref.sha256 || '')) throw new Error('Missing exact file hash.');
  const target = inside(root, ref.path);
  if (sha256(fs.readFileSync(target)) !== ref.sha256) throw new Error('File hash mismatch: ' + ref.path);
  return target;
}
