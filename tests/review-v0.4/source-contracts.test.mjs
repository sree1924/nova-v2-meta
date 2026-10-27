import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {validateJsonSchema} from '../../tools/qualify-04.mjs';

const read = name => JSON.parse(fs.readFileSync(new URL('../../contracts/' + name, import.meta.url), 'utf8'));
test('unbound sign-intake template is valid data and cannot masquerade as a bound list', () => {
  const schema = read('sign-asset-intake.schema.json');
  const template = read('sign-intake.template.json');
  assert.deepEqual(validateJsonSchema(schema, template), []);
  assert.ok(validateJsonSchema(schema, {...template, status: 'BOUND'}).length > 0);
});
test('a source PASS with unknown edition/effective-date/issuer evidence is rejected', () => {
  const schema = read('source-liveness-receipt.schema.json');
  const fixture = {source_ref: 'synthetic-source', snapshot_sha256: 'a'.repeat(64),
    official_url: 'https://invalid.example/synthetic', source_tier: 'issuer',
    retrieved_at: '2026-10-26T00:00:00Z', edition: null, effective_date: null,
    issuer_current_edition_ref: null, issuer_current_edition_sha256: null,
    verified_by: {actor_id: 'synthetic-auditor', provider_family: 'synthetic-family'}, status: 'PASS'};
  assert.ok(validateJsonSchema(schema, fixture).length > 0);
  assert.deepEqual(validateJsonSchema(schema, {...fixture, status: 'VERIFICATION_DEBT'}), []);
});
test('verify text cannot masquerade as a resolved effective date in a PASS', () => {
  const schema = read('source-liveness-receipt.schema.json');
  const fixture = {source_ref: 'synthetic-source', snapshot_sha256: 'a'.repeat(64),
    official_url: 'https://invalid.example/synthetic', source_tier: 'issuer',
    retrieved_at: '2026-10-26T00:00:00Z', edition: 'synthetic-edition', effective_date: '(verify)',
    issuer_current_edition_ref: 'synthetic-issuer-receipt', issuer_current_edition_sha256: 'b'.repeat(64),
    verified_by: {actor_id: 'synthetic-auditor', provider_family: 'synthetic-family'}, status: 'PASS'};
  assert.ok(validateJsonSchema(schema, fixture).length > 0);
});
