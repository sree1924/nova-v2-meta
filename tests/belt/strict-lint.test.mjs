// node --test tests/belt/strict-lint.test.mjs
// Asserts every adapter present in schemas-strict/*.schema.json passes the Meta strict-subset lint
// (tools/belt/strict-lint.mjs lintAll). Adapters are discovered at run time, so stages still being built by
// sibling builders are simply absent; with no adapter present the test is skipped with a message.
// Local lint only — not provider acceptance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lintAll } from '../../tools/belt/strict-lint.mjs';

const report = lintAll();
const names = Object.keys(report).sort();

if (!names.length) {
  test('strict-lint: no adapters present', { skip: 'no schemas-strict/*.schema.json adapter present yet' }, () => {});
} else {
  for (const name of names) {
    test(`strict-lint ok: ${name}`, () => {
      const r = report[name];
      assert.equal(r.ok, true, `violations: ${JSON.stringify(r.violations, null, 1)}`);
      assert.ok(r.max_depth <= 10, `depth ${r.max_depth}`);
    });
  }
}
