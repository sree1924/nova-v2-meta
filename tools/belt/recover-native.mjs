import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {inside, jsonBytes, sha256, verifyRef, writeImmutable} from './atomic-file.mjs';
import {acquireExecutorLock, readExecutorLock} from './executor-lock.mjs';

const SCHEMA = 'nova-run-recovery.v0.4.0';
const SOURCES = new Set(['operator', 'founder']);
const hash = file => sha256(fs.readFileSync(file));
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const pin = file => ({path:file, sha256:hash(file), bytes:fs.statSync(file).size});
const relativeRef = (root, ref) => ({...ref, path:path.relative(root, ref.path).replaceAll('\\', '/')});
function blocked(message) { const error = new Error('NATIVE_RECOVERY_BLOCKED: ' + message); error.code = 'NATIVE_RECOVERY_BLOCKED'; return error; }

function ownedRef(projectRoot, runDir, ref, {json=true} = {}) {
  if (!ref || !nonempty(ref.path)) throw blocked('An exact owned-run evidence reference is required.');
  const target = path.isAbsolute(ref.path) ? ref.path
    : ref.path.replaceAll('\\', '/').startsWith('runs/') ? path.resolve(projectRoot, ref.path) : path.resolve(runDir, ref.path);
  inside(runDir, target);
  const file = verifyRef({...ref, path:target}, runDir);
  if (!fs.statSync(file).isFile()) throw blocked('Evidence must be a regular file.');
  return {file, ref:pin(file), data:json ? JSON.parse(fs.readFileSync(file, 'utf8')) : null};
}

function stoppedProof(proof, receipt, oldLock) {
  if (proof.schema_version !== 'nova-executor-stopped.v0.4.0' || proof.status !== 'PASS' || !SOURCES.has(proof.source)
      || proof.run_id !== receipt.run_id || proof.executor_id !== receipt.old_executor_id || proof.lock_id !== receipt.old_lock_id
      || proof.pid !== oldLock.pid || proof.hostname !== oldLock.hostname || proof.process_stopped !== true
      || proof.content_calls_authorized !== false || !nonempty(proof.recorded_by)
      || !['operator_confirmed_process_stopped', 'observed_process_exit'].includes(proof.basis)
      || !nonempty(proof.recorded_at) || !Number.isFinite(Date.parse(proof.recorded_at))
      || Date.parse(proof.recorded_at) > Date.parse(receipt.recorded_at)
      || Date.parse(proof.recorded_at) < Date.parse(oldLock.acquired_at)) {
    throw blocked('Stopped evidence must explicitly record termination/operator handover for this exact holder and lock.');
  }
}

/** Explicit native-lock recovery only. This helper never opens or modifies SQLite.
 * A caller must use the returned derived receipt with recoverRunOwnership before
 * any claim, artifact replay or provider call. No lock age or process probe grants authority.
 * References may be absolute, run-relative, or project-relative runs/<run>/... .
 */
export async function recoverNativeOwnership({projectRoot, runDir, runId, executorId, reconciliationRef} = {}) {
  if (!nonempty(projectRoot) || !nonempty(runDir) || !nonempty(runId) || !nonempty(executorId)) throw blocked('Explicit project/run/executor identity is required.');
  projectRoot = fs.realpathSync(projectRoot);
  runDir = inside(path.join(projectRoot, 'runs'), path.resolve(runDir));
  if (path.basename(runDir) !== runId) throw blocked('Run directory and identity differ.');
  const source = ownedRef(projectRoot, runDir, reconciliationRef), receipt = source.data;
  if (receipt.schema_version !== SCHEMA || receipt.status !== 'PASS' || receipt.action !== 'recover_run'
      || !SOURCES.has(receipt.source) || receipt.content_calls_authorized !== false || receipt.run_id !== runId
      || !Number.isSafeInteger(receipt.old_generation) || receipt.old_generation < 1
      || !nonempty(receipt.old_lock_id) || !nonempty(receipt.old_executor_id) || receipt.new_executor_id !== executorId
      || !/^[a-f0-9]{64}$/.test(receipt.binding_sha256 ?? '') || !/^[a-f0-9]{64}$/.test(receipt.budget_sha256 ?? '')
      || !['dry_run', 'execute'].includes(receipt.mode) || !nonempty(receipt.recorded_by)
      || !nonempty(receipt.recorded_at) || !Number.isFinite(Date.parse(receipt.recorded_at))
      || Date.parse(receipt.recorded_at) > Date.now()) {
    throw blocked('Reconciliation does not explicitly authorize this exact non-content ownership transfer.');
  }
  const lockPath = inside(runDir, 'EXECUTOR.lock.md');
  const oldLockRef = ownedRef(projectRoot, runDir, receipt.old_lock_ref, {json:false});
  const oldBytes = fs.readFileSync(lockPath), oldHash = sha256(oldBytes), oldLock = readExecutorLock(runDir);
  if (oldLock.schema_version !== 'executor-lock.v0.4.0' || oldLock.run_id !== runId
      || oldLock.lock_id !== receipt.old_lock_id || oldLock.executor_id !== receipt.old_executor_id
      || !Number.isSafeInteger(oldLock.pid) || oldLock.pid < 1 || !nonempty(oldLock.hostname)
      || oldLockRef.ref.sha256 !== oldHash) throw blocked('Current native lock differs from the exact authorized old lock.');
  const stopped = ownedRef(projectRoot, runDir, receipt.stopped_evidence_ref);
  stoppedProof(stopped.data, receipt, oldLock);
  if (new Set([source.file, stopped.file, oldLockRef.file]).size !== 3 || source.file === lockPath || stopped.file === lockPath) throw blocked('Independent reconciliation, stopped evidence and lock artifacts are required.');

  const guardPath = inside(runDir, '.NATIVE-RECOVERY.guard.json');
  const transactionId = crypto.randomUUID();
  let guard;
  try { guard = fs.openSync(guardPath, 'wx', 0o600); }
  catch (error) { if (error.code === 'EEXIST') throw blocked('An existing recovery guard requires explicit reconciliation; age grants no authority.'); throw error; }
  try {
    fs.writeFileSync(guard, jsonBytes({schema_version:'nova-native-recovery-guard.v0.4.0', transaction_id:transactionId, run_id:runId,
      old_lock_id:receipt.old_lock_id, new_executor_id:executorId, reconciliation_ref:relativeRef(runDir, source.ref)}));
    fs.fsyncSync(guard);
  } finally { fs.closeSync(guard); }
  const archiveRoot = inside(runDir, 'sources/private/recovery/native-' + transactionId);
  const archivedLock = inside(runDir, path.join(archiveRoot, 'EXECUTOR.lock.original.md'));
  let moved = false, lockHandle, journalPath;
  const journal = value => {
    if (!journalPath) return;
    const fd = fs.openSync(journalPath, 'a', 0o600);
    try { fs.writeFileSync(fd, JSON.stringify({at:new Date().toISOString(), ...value}) + '\n'); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); }
  };
  try {
    fs.mkdirSync(archiveRoot, {recursive:true}); inside(runDir, archiveRoot);
    journalPath = inside(runDir, path.join(archiveRoot, 'recovery-journal.jsonl'));
    journal({step:'verified', old_lock_sha256:oldHash, reconciliation_ref:relativeRef(runDir, source.ref)});
    // The receipt is the authority. Re-read every exact input at the mutation boundary.
    for (const entry of [source, oldLockRef, stopped]) verifyRef(entry.ref, runDir);
    if (hash(lockPath) !== oldHash) throw blocked('Old lock changed before archival.');
    fs.renameSync(lockPath, archivedLock); moved = true;
    const archivedLockRef = pin(archivedLock);
    if (archivedLockRef.sha256 !== oldHash) throw blocked('Archived lock bytes changed.');
    journal({step:'old_lock_archived', old_lock_ref:relativeRef(runDir, archivedLockRef)});
    lockHandle = acquireExecutorLock({runDir, runId, executorId});
    const derived = {...receipt, old_lock_ref:relativeRef(runDir, archivedLockRef), stopped_evidence_ref:relativeRef(runDir, stopped.ref),
      source_reconciliation_ref:relativeRef(runDir, source.ref), new_lock_id:lockHandle.lockId,
      recovered_at:new Date().toISOString(), content_calls_authorized:false,
      recovery_scope:'lock transfer only; SQLite ownership/generation/attempt reconciliation is required separately'};
    const receiptRef = writeImmutable(runDir, path.join(archiveRoot, 'reconciliation-derived.json'), derived, {lockHandle});
    journal({step:'new_lock_acquired', new_lock_id:lockHandle.lockId, derived_receipt_ref:relativeRef(runDir, receiptRef), sqlite_modified:false});
    lockHandle.assertHeld();
    const guardRef = inside(runDir, path.join(archiveRoot, 'recovery-guard.completed.json'));
    fs.renameSync(guardPath, guardRef);
    let rolledBack = false;
    const rollback = () => {
      if (rolledBack) return {status:'rolled_back', reused:true, oldLockRef:pin(lockPath)};
      // Caller may invoke only after the ledger ownership transaction fails, never after commit.
      lockHandle.assertHeld();
      verifyRef(archivedLockRef, runDir);
      const fd = fs.openSync(guardPath, 'wx', 0o600);
      try { fs.writeFileSync(fd, jsonBytes({transaction_id:transactionId, action:'rollback_uncommitted_native_recovery'})); fs.fsyncSync(fd); }
      finally { fs.closeSync(fd); }
      lockHandle.release();
      const oldFd = fs.openSync(lockPath, 'wx', 0o600);
      try { fs.writeFileSync(oldFd, oldBytes); fs.fsyncSync(oldFd); } finally { fs.closeSync(oldFd); }
      if (hash(lockPath) !== oldHash) throw blocked('Rollback restored lock hash differs.');
      journal({step:'caller_rollback_before_database_commit', restored_old_lock:true, sqlite_modified:false});
      fs.renameSync(guardPath, inside(runDir, path.join(archiveRoot, 'recovery-guard.caller-rollback.json')));
      rolledBack = true;
      return {status:'rolled_back', oldLockRef:pin(lockPath), archivedLockRef};
    };
    return {lockHandle, reconciliationRef:receiptRef, receiptRef, archivedLockRef, rollback,
      stoppedEvidenceRef:stopped.ref, sourceReconciliationRef:source.ref, archiveRoot, journalRef:pin(journalPath), guardRef:pin(guardRef)};
  } catch (error) {
    // Never overwrite a competing lock. Preserve journal/archive if restoration cannot be safe.
    let restored = !moved;
    try {
      if (lockHandle) { lockHandle.release(); lockHandle = null; }
      if (moved && !fs.existsSync(lockPath) && fs.existsSync(archivedLock) && hash(archivedLock) === oldHash) {
        fs.renameSync(archivedLock, lockPath); restored = true;
      }
      journal({step:'rollback', restored_old_lock:restored, error_code:error.code ?? null, error:String(error.message)});
      if (restored && fs.existsSync(guardPath)) {
        if (fs.existsSync(archiveRoot)) fs.renameSync(guardPath, inside(runDir, path.join(archiveRoot, 'recovery-guard.rolled-back.json')));
        else fs.unlinkSync(guardPath);
      }
    } catch (rollbackError) { error.rollback_error = rollbackError.message; }
    if (!restored) error.recovery_archive = archiveRoot;
    throw error;
  }
}
