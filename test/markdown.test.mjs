import test from 'node:test';
import assert from 'node:assert/strict';
import { renderInline, renderMarkdown } from '../scripts/lib/markdown.mjs';

test('renders long-form Markdown with localized accessible labels', () => {
  const result = renderMarkdown(`# Heading

## Repeated heading

## Repeated heading

- [x] Complete
- [ ] Incomplete

| Left | Right |
| --- | ---: |
| A | B |

> A quotation.

\`code\` and **strong**.`, {
    anchorLabel: 'Link to this section',
    tableLabel: 'Data table',
    taskComplete: 'Completed task',
    taskIncomplete: 'Incomplete task',
  });

  assert.match(result.html, /<h1 id="heading">/);
  assert.match(result.html, /id="repeated-heading-2"/);
  assert.match(result.html, />Completed task<\/span>/);
  assert.match(result.html, /aria-label="Data table"/);
  assert.match(result.html, /<blockquote>/);
  assert.equal(result.completedTasks, 1);
  assert.equal(result.totalTasks, 2);
  assert.equal(result.headings.length, 3);
  assert.ok(result.readingMinutes >= 1);
});

test('escapes raw HTML and blocks dangerous URL protocols', () => {
  const result = renderMarkdown('<script>alert(1)</script>\n\n[Danger](javascript:alert(1))\n\n![Image](data:text/html,bad)');
  assert.doesNotMatch(result.html, /<script>/i);
  assert.doesNotMatch(result.html, /href="javascript:/i);
  assert.doesNotMatch(result.html, /src="data:text\/html/i);
  assert.match(result.html, /&lt;script&gt;/);
});

test('keeps safe internal, external, and Unicode links', () => {
  assert.equal(renderInline('[Internal](/about/)'), '<a href="/about/">Internal</a>');
  assert.equal(renderInline('[External](https://example.com)'), '<a href="https://example.com" rel="noreferrer">External</a>');
  assert.equal(renderInline('[日本語](/tags/%E6%97%A5%E8%A8%98/)'), '<a href="/tags/%E6%97%A5%E8%A8%98/">日本語</a>');
});
