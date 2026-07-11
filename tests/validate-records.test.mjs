import assert from 'node:assert/strict';
import test from 'node:test';
import { readFrontmatter, validateRecord } from '../scripts/validate-records.mjs';

const valid = `---
title: "Test"
date: 2026-07-11
type: note
summary: "Summary"
tags: [test]
---

Body text.
`;

test('valid record passes', () => {
  assert.deepEqual(validateRecord('2026/07/2026-07-11-test.md', valid), []);
});

test('date must match path', () => {
  const errors = validateRecord('2026/07/2026-07-10-test.md', valid);
  assert.ok(errors.some((error) => error.includes('一致しません')));
});

test('unsafe executable HTML is rejected', () => {
  const errors = validateRecord('2026/07/2026-07-11-test.md', `${valid}<script>alert(1)</script>`);
  assert.ok(errors.some((error) => error.includes('JavaScript')));
});

test('unknown front matter and impossible dates are rejected', () => {
  const source = valid
    .replace('date: 2026-07-11', 'date: 2026-02-30')
    .replace('tags: [test]', 'tags: [test]\ntgas: [typo]');
  const errors = validateRecord('2026/02/2026-02-30-test.md', source);
  assert.ok(errors.some((error) => error.includes('実在する日付')));
  assert.ok(errors.some((error) => error.includes('未知のfront matter')));
});

test('cover must use the public images directory', () => {
  const source = valid.replace('tags: [test]', 'tags: [test]\ncover: "/other/cover.webp"\ncover_alt: "Cover"');
  const errors = validateRecord('2026/07/2026-07-11-test.md', source);
  assert.ok(errors.some((error) => error.includes('/images/...')));
});

test('generic raw HTML is rejected', () => {
  const errors = validateRecord('2026/07/2026-07-11-test.md', `${valid}<iframe src="https://example.com"></iframe>`);
  assert.ok(errors.some((error) => error.includes('raw HTML')));
});

test('HTML examples inside code are allowed', () => {
  const source = `${valid}\n\`\`\`html\n<button onclick="demo()">Example</button>\n\`\`\`\n\nInline: \`<script>example</script>\``;
  assert.deepEqual(validateRecord('2026/07/2026-07-11-test.md', source), []);
});

test('front matter parser returns body separately', () => {
  const parsed = readFrontmatter(valid);
  assert.equal(parsed.data.title, 'Test');
  assert.match(parsed.body, /Body text/);
});
