import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import {parsePrompt, renderRequest} from '../../tools/render-request.mjs';

const headerTemplateText = fs.readFileSync(new URL('../../prompts/controller-header.template.json', import.meta.url), 'utf8');
const body = 'Role instruction body for a synthetic interface fixture.\n';
const hash = crypto.createHash('sha256').update(body).digest('hex');
const promptText = body + 'prompt_template_sha256: ' + hash + '\n';

test('default review header is separate from the stable instruction body', () => {
  const result = renderRequest({promptText, headerTemplateText});
  assert.equal(result.header.mode, 'review');
  assert.equal(result.header.execution_authorized, false);
  assert.equal(result.messages[1].content, body);
  assert.equal(result.messages[1].content.includes('prompt_template_sha256'), false);
  assert.equal(result.dispatch_attempted, false);
});
test('changed bindings change header/request hashes without changing body hash', () => {
  const a = renderRequest({promptText, headerTemplateText, bindings: {task: {run_id: 'synthetic-one'}}});
  const b = renderRequest({promptText, headerTemplateText, bindings: {task: {run_id: 'synthetic-two'}}});
  assert.equal(a.hashes.template_body_sha256, b.hashes.template_body_sha256);
  assert.notEqual(a.hashes.rendered_header_sha256, b.hashes.rendered_header_sha256);
  assert.notEqual(a.hashes.rendered_request_sha256, b.hashes.rendered_request_sha256);
});
test('a body edit with a stale footer is rejected', () => {
  assert.throws(() => parsePrompt(promptText.replace('Role instruction', 'Changed instruction')), /hash mismatch/);
});
test('review bindings cannot grant execution permission', () => {
  const r = renderRequest({promptText, headerTemplateText, bindings: {execution_authorized: true}});
  assert.equal(r.header.execution_authorized, false);
});
test('non-review rendering without explicit authority refs is rejected', () => {
  assert.throws(() => renderRequest({promptText, headerTemplateText, bindings: {mode: 'qualification'}}), /authority/);
});
test('credential fields cannot enter the header', () => {
  assert.throws(() => renderRequest({promptText, headerTemplateText, bindings: {api_key: 'synthetic-placeholder'}}), /Credential/);
});
