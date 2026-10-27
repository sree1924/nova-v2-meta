import fs from 'node:fs';
import {renderRequest} from '../tools/render-request.mjs';

// Synthetic local rendering example. No provider client or dispatch function is imported.
const promptText = fs.readFileSync(new URL('../prompts/04.md', import.meta.url), 'utf8');
const headerTemplateText = fs.readFileSync(new URL('../prompts/controller-header.template.json', import.meta.url), 'utf8');
const render = run_id => renderRequest({promptText, headerTemplateText,
  bindings: {task: {run_id, role_id: '04', stage_id: '04.review_fixture'}}});
const a = render('synthetic-render-one');
const b = render('synthetic-render-two');
console.log(JSON.stringify({
  fixture_scope: 'SYNTHETIC_REQUEST_RENDERING_ONLY',
  mode: 'review', execution_authorized: false, dispatch_attempted: false,
  first: a.hashes, second: b.hashes,
  body_hash_stable: a.hashes.template_body_sha256 === b.hashes.template_body_sha256,
  header_hash_changes: a.hashes.rendered_header_sha256 !== b.hashes.rendered_header_sha256,
  request_hash_changes: a.hashes.rendered_request_sha256 !== b.hashes.rendered_request_sha256
}, null, 2));
