import fs from 'node:fs';
import path from 'node:path';
import {sha256, verifyRef} from './atomic-file.mjs';

export function inspectExecutionPolicy({projectRoot, config, go = false, mode = 'dry_run', authorityPath = 'contracts/execution-authority.v0.4.0.json'}) {
  const target = path.resolve(projectRoot, authorityPath);
  const bytes = fs.readFileSync(target);
  const authority = JSON.parse(bytes);
  const blockers = [];
  if (mode !== 'live') blockers.push('dry_run_mode');
  if (!go) blockers.push('explicit_go_absent');
  if (authority.schema_version !== 'nova-content-authority.v0.4.0' || authority.content_calls_authorized !== true) blockers.push('founder_content_authority_not_granted');
  if (authority.run_id !== config.run_id) blockers.push('authority_not_bound_to_run');
  if (!authority.approval_ref) blockers.push('founder_approval_evidence_absent');
  else {
    try { verifyRef(authority.approval_ref, projectRoot); } catch { blockers.push('founder_approval_evidence_invalid'); }
  }
  if (config.execution_enabled !== true) blockers.push('execution_disabled');
  if (config.limits?.spend_mode !== 'live') blockers.push('spend_mode_not_live');
  const model = config.producer?.model || '';
  if (!model || /contributor/i.test(model)) blockers.push('standard_model_assignment_missing');
  if (!config.scope?.jurisdiction || config.scope?.jurisdiction_selected_by == null) blockers.push('state_binding_missing');
  const limits = config.limits || {};
  for (const field of ['max_total_usd', 'max_call_usd']) if (!(limits[field] > 0 && Number.isFinite(limits[field]))) blockers.push(field + '_missing');
  if (!(limits.per_provider_usd_caps?.meta > 0)) blockers.push('meta_budget_missing');
  if (!limits.per_role_usd_caps || !Object.keys(limits.per_role_usd_caps).length) blockers.push('role_budgets_missing');
  if (!limits.max_completion_tokens || !Number.isSafeInteger(limits.max_completion_tokens)) blockers.push('token_limit_missing');
  if (!limits.run_deadline_utc || !Number.isFinite(Date.parse(limits.run_deadline_utc))) blockers.push('deadline_missing');
  else if (Date.parse(limits.run_deadline_utc) <= Date.now()) blockers.push('deadline_expired');
  return {status: blockers.length ? 'BLOCKED' : 'ELIGIBLE_FOR_BOUND_TASK_CHECKS', mode, go, content_calls_authorized: authority.content_calls_authorized === true, blockers, authority_ref: {path: authorityPath, sha256: sha256(bytes)}};
}

export function assertDispatchAllowed(options) {
  const policy = inspectExecutionPolicy(options);
  if (policy.status !== 'ELIGIBLE_FOR_BOUND_TASK_CHECKS') {
    const error = new Error('CONTENT_DISPATCH_BLOCKED: ' + policy.blockers.join(', '));
    error.code = 'CONTENT_DISPATCH_BLOCKED'; error.policy = policy;
    throw error;
  }
  return policy;
}
