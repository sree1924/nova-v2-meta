import fs from 'node:fs';
import path from 'node:path';
import {sha256, canonicalJson, writeImmutable, verifyRef, inside} from './atomic-file.mjs';

// A local transaction boundary used by the controller and synthetic fault tests.
// produce() is supplied by an authorized executor; this module never calls a provider.
export async function runArtifactTask({ledger, fence, lockHandle, runDir, task, produce, validate, accept, requiredChecks, afterOutputSaved}) {
  if (!Array.isArray(requiredChecks) || !requiredChecks.length || new Set(requiredChecks).size !== requiredChecks.length) throw new Error('Explicit complete required check IDs are mandatory.');
  const taskId = task.taskId ?? task.task_id;
  const current = ledger.getTask(taskId);
  if (current?.status === 'accepted') {
    const saved = ledger.listArtifacts(fence.runId).find(a => a.task_id === taskId && a.status === 'accepted');
    if (!saved) throw new Error('Accepted task is missing its artifact record.');
    for (const ref of [saved, saved.validation_ref_json, saved.acceptance_ref_json]) verifyRef(ref, runDir);
    return {status:'accepted',reused:true,recovered:false,artifact:saved};
  }
  const attempts = ledger.listAttempts(fence.runId).filter(a => (a.taskId ?? a.task_id) === taskId);
  let attempt = attempts.find(a => ['running', 'accepted'].includes(a.status));
  if (!attempt) attempt = ledger.startAttempt(fence, {taskId, commandId: 'execute:' + taskId + ':' + (attempts.length + 1)});
  const attemptId = attempt.attemptId ?? attempt.attempt_id;
  const dir = 'artifacts/' + taskId + '/' + attemptId;
  const outputPath = inside(runDir, dir + '/artifact.json');
  const recovered = fs.existsSync(outputPath);
  let value;
  if (recovered) value = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  else value = await produce();
  if (!value || typeof value !== 'object' || Object.prototype.hasOwnProperty.call(value, '_fixture')) throw new Error('Unexpected fixture metadata in stage output.');
  const artifact = {...writeImmutable(runDir, dir + '/artifact.json', value, {lockHandle}), kind: 'stage_output'};
  // Used only by tests to simulate power loss at the filesystem/ledger boundary.
  if (!recovered && afterOutputSaved) await afterOutputSaved(artifact);
  const validation = await validate(value, {artifact, task, attemptId, recovered});
  const ids = (validation?.checks || []).map(c => c.check_id);
  const missing = requiredChecks.filter(id => !ids.includes(id));
  const invalidChecks = (validation?.checks || []).some(c => !['PASS', 'FAIL', 'HOLD'].includes(c.status));
  const complete = !missing.length && !invalidChecks && ids.length === new Set(ids).size;
  const valid = validation?.status === 'PASS' && complete && requiredChecks.every(id => validation.checks.find(c => c.check_id === id)?.status === 'PASS')
    && !validation.checks.some(c => c.status !== 'PASS') && !(validation.errors?.length);
  const validationRef = writeImmutable(runDir, dir + '/validation.json', {...validation, status: valid ? 'PASS' : 'HOLD', output_sha256: artifact.sha256, mapped_check_coverage: {complete, missing}}, {lockHandle});
  if (!valid) {
    ledger.recordArtifact(fence, {taskId, attemptId, artifact, status: 'blocked'});
    ledger.appendEvent(fence, {eventId: attemptId + ':validation-held', type: 'validation.held', taskId, attemptId, payload: {artifact, validation: validationRef}});
    return {status: 'HOLD', recovered, artifact, validation: validationRef};
  }
  // Acceptance is a separate supplied result; model completion cannot create it.
  if (typeof accept !== 'function') throw new Error('Independent acceptance result is required.');
  const acceptance = await accept(value, {artifact, validation, task, attemptId});
  const acceptanceRef = writeImmutable(runDir, dir + '/acceptance.json', {...acceptance, output_sha256: artifact.sha256}, {lockHandle});
  if (acceptance?.status !== 'PASS') {
    ledger.recordArtifact(fence, {taskId, attemptId, artifact, status: 'blocked'});
    ledger.appendEvent(fence, {eventId: attemptId + ':acceptance-held', type: 'acceptance.held', taskId, attemptId, payload: {artifact, acceptance: acceptanceRef}});
    return {status: 'HOLD', recovered, artifact, acceptance: acceptanceRef};
  }
  // Re-verify actual bytes immediately before the single acceptance transaction.
  for (const ref of [artifact, validationRef, acceptanceRef]) verifyRef(ref, runDir);
  const result = ledger.acceptArtifact(fence, {taskId, attemptId, artifact, validationReceipt: validationRef, acceptanceReceipt: acceptanceRef});
  return {...result, recovered, validation: validationRef, acceptance: acceptanceRef};
}
