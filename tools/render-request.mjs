import crypto from 'node:crypto';

// Pure request assembly: no SDK, dispatch, network, filesystem writes or authority grant.
const digest = value => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const sorted = value => Array.isArray(value) ? value.map(sorted) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, sorted(value[key])])) : value;
const canonical = value => JSON.stringify(sorted(value));

export function parsePrompt(promptText) {
  if (typeof promptText !== 'string' || promptText.startsWith('\uFEFF') || promptText.includes('\r')) throw new Error('Expected UTF-8/LF prompt text without BOM.');
  const match = promptText.match(/^prompt_template_sha256: ([a-f0-9]{64})\n?$/m);
  if (!match || match.index + match[0].length !== promptText.length) throw new Error('Missing final body-hash footer.');
  const body = promptText.slice(0, match.index);
  if (digest(body) !== match[1]) throw new Error('Prompt body hash mismatch.');
  return {body, file_sha256: digest(promptText), template_body_sha256: match[1]};
}

function merge(base, patch) {
  const result = structuredClone(base);
  for (const [key, value] of Object.entries(patch)) {
    result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? merge(result[key] && typeof result[key] === 'object' ? result[key] : {}, value) : structuredClone(value);
  }
  return result;
}
function rejectSecretFields(value) {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    if (/^(api_key|authorization|access_token|refresh_token|password|secret)$/i.test(key)) throw new Error('Credential fields are forbidden in a rendered header.');
    rejectSecretFields(child);
  }
}

export function renderRequest({promptText, headerTemplateText, bindings = {}, inputData = null}) {
  const prompt = parsePrompt(promptText);
  const template = JSON.parse(headerTemplateText);
  if (template.schema_version !== 'controller-header-template.v0.4.0') throw new Error('Unsupported header template.');
  const header = merge(template, bindings);
  rejectSecretFields(header);
  if (!['review', 'qualification', 'production'].includes(header.mode)) throw new Error('Unknown request mode.');
  if (header.mode === 'review') header.execution_authorized = false;
  const renderOnly = header.render_only === true && header.execution_authorized === false;
  if (header.mode !== 'review' && !renderOnly && (header.execution_authorized !== true
      || typeof header.execution_authority_ref !== 'string'
      || !/^[a-f0-9]{64}$/.test(header.execution_authority_sha256 || ''))) {
    throw new Error('Non-review rendering requires explicit controller-supplied authority references.');
  }
  header.header_template_sha256 = digest(headerTemplateText);
  header.body = {...header.body, file_sha256: prompt.file_sha256, template_body_sha256: prompt.template_body_sha256};
  const headerText = canonical(header);
  const messages = [{role: 'system', content: headerText}, {role: 'user', content: prompt.body}];
  if (inputData !== null) { rejectSecretFields(inputData); messages.push({role:'user',content:canonical(inputData)}); }
  return {
    schema_version: 'rendered-request.v0.4.0',
    hashes: {prompt_file_sha256: prompt.file_sha256, template_body_sha256: prompt.template_body_sha256,
      header_template_sha256: digest(headerTemplateText), rendered_header_sha256: digest(headerText),
      rendered_request_sha256: digest(canonical(messages))},
    header, messages,
    dispatch_attempted: false,
    render_only: renderOnly || header.mode === 'review',
    authority_note: 'Rendering computes bytes and hashes only. The controller must independently verify genuine authority, bindings, budgets, schemas and eligibility before any future call.'
  };
}
