import test from 'node:test';
import assert from 'node:assert/strict';
import { FrontmatterError, parseFrontmatter } from '../scripts/lib/frontmatter.mjs';

test('accepts plain Markdown without front matter', () => {
  const source = '# Plain Markdown\n\nBody text.';
  const result = parseFrontmatter(source, 'plain.md');
  assert.deepEqual(result.data, {});
  assert.equal(result.body, source);
  assert.equal(result.hasFrontmatter, false);
});

test('parses scalar values, arrays, and block strings', () => {
  const result = parseFrontmatter(`---
title: "A small record"
date: 2026-07-10
tags: [journal, "Cloudflare Pages"]
featured: true
score: 3
summary: >
  This becomes
  one line.
note: |
  First line
  Second line
---
Body`, 'record.md');

  assert.equal(result.data.title, 'A small record');
  assert.equal(result.data.date, '2026-07-10');
  assert.deepEqual(result.data.tags, ['journal', 'Cloudflare Pages']);
  assert.equal(result.data.featured, true);
  assert.equal(result.data.score, 3);
  assert.equal(result.data.summary, 'This becomes one line.');
  assert.equal(result.data.note, 'First line\nSecond line');
  assert.equal(result.body, 'Body');
});

test('parses block arrays with Unicode values', () => {
  const result = parseFrontmatter(`---
tags:
  - journal
  - 学び
  - يوميات
---
Body`);
  assert.deepEqual(result.data.tags, ['journal', '学び', 'يوميات']);
});

test('reports duplicate keys with the source filename', () => {
  assert.throws(
    () => parseFrontmatter('---\ntitle: A\ntitle: B\n---\n', 'duplicate.md'),
    (error) => error instanceof FrontmatterError && /duplicate key/i.test(error.message) && /duplicate\.md/.test(error.message),
  );
});
