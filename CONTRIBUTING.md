# Contributing to Shiori

Thank you for helping make personal archives easier to own, publish, and revisit.

## Before opening a change

- Use an issue for a significant new feature or data-model change.
- Keep the zero-configuration deployment promise: no mandatory database, API key, account, or environment variable.
- Preserve Markdown portability and static output.
- Do not add a client framework for a small interaction that progressive enhancement can handle.

## Development

Requires Node.js 22 or later.

```bash
npm ci
npm run dev
```

Run the full gate before submitting a pull request:

```bash
npm run test:all
git diff --check
```

## Internationalization

English is the source interface locale. A locale pack must contain every key in `config/i18n/en.json`. Do not hard-code user-facing text in templates or `src/app.js`; add a locale key or pass a translated value through `data-*` attributes.

Content languages are not limited to interface locales. Do not introduce code that assumes Latin script, left-to-right text, ASCII tags, or English word boundaries.

## Accessibility and visual quality

Application changes must preserve:

- keyboard operation and visible focus;
- semantic landmarks and one meaningful page heading;
- reduced-motion behavior;
- forced-colors usability;
- WCAG AA text contrast for normal text;
- mobile layouts without page-level horizontal overflow;
- readable long-form content and controls at 320 CSS pixels wide.

Add critical semantic color pairs to `scripts/contrast.mjs`. Test both an empty archive and a large archive when changing layout or generation logic.

## Pull requests

Explain:

- what changed and why;
- user and developer impact;
- migration implications;
- checks you ran;
- screenshots or measured layout results for visible changes.

Do not include generated `dist/`, unrelated formatting, secrets, or personal journal content.
