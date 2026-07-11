# Record format

A Shiori record is a UTF-8 Markdown file stored at:

```text
content/records/YYYY/MM/YYYY-MM-DD-short-slug.md
```

## Complete example

```markdown
---
title: Search now works without a pointer
date: 2026-07-11
updated: 2026-07-12
type: development
lang: en
tags: [search, accessibility, keyboard]
project: Shiori
summary: Rebuilt focus movement, Escape behavior, and result navigation for keyboard users.
mood: focused
translation_key: search-keyboard-release
featured: true
draft: false
cover: /images/records/2026/07/search-keyboard/result.webp
cover_alt: Search results with a visible keyboard focus indicator
---

The important result comes first.

## What changed

Explain the work and decisions.

## Completed

- [x] Moved focus into the dialog
- [x] Added Arrow Up and Arrow Down navigation
- [ ] Run a final screen-reader review
```

## Fields

| Field | Required | Format and meaning |
| --- | --- | --- |
| `title` | yes | Human-readable title in the record language. |
| `date` | yes | ISO `YYYY-MM-DD`; must match folder and filename. |
| `type` | yes | `diary`, `task`, `development`, `learning`, `activity`, or `note`. |
| `lang` | yes | BCP 47 content language such as `en`, `ja`, `fr`, `ar`, or `pt-BR`. |
| `summary` | yes | One or two useful sentences in the record language. |
| `tags` | no | Inline or block array, up to 12 values. |
| `project` | no | One project name. Reuse exact existing spelling. |
| `updated` | no | ISO date for a later revision. |
| `mood` | no | Owner-defined short value; use only when meaningful. |
| `translation_key` | no | Shared stable identifier for translations of one record. |
| `dir` | no | `ltr` or `rtl`; normally inferred from `lang`. |
| `cover` | no | Root-relative path under `public/`. |
| `cover_alt` | with cover | Meaningful alternative text in the record language. |
| `featured` | no | Boolean; selects the entry for the home page. |
| `draft` | no | Boolean; excludes the entry from generated output. |
| `sample` | no | Reserved for bundled demonstration records. |

Front matter is intentionally small. Unknown fields produce warnings so spelling mistakes do not silently become unused data.

## Language direction

Shiori normalizes language tags and infers right-to-left direction for Arabic, Hebrew, Persian, Urdu, and related scripts. Add `dir` only for exceptional mixed-script content.

The site interface does not translate the record body. A record remains in its authored language in every interface locale.

## Translations

Create one file per translation. Use the same `translation_key` and a different `lang`:

```yaml
translation_key: first-release
lang: en
```

```yaml
translation_key: first-release
lang: ja
```

Each translation may use its own title, summary, tags, and natural structure. Shiori links the siblings and rejects duplicate language siblings.

## Markdown support

- headings with stable unique anchors;
- paragraphs and line breaks;
- ordered, unordered, and task lists;
- block quotations;
- fenced code blocks and inline code;
- tables in a keyboard-scrollable labelled region;
- emphasis, strong text, and strikethrough;
- safe internal and external links;
- images with alternative text;
- horizontal rules.

Raw HTML is displayed as text. Scripts and dangerous URL schemes are not rendered.

## Images

Use record-owned folders:

```text
public/images/records/2026/07/search-keyboard/result.webp
```

Reference them as:

```markdown
![Search results with the language filter set to Japanese](/images/records/2026/07/search-keyboard/result.webp)
```

Prefer WebP or AVIF, resize images to realistic display dimensions, and remove private metadata.

## URL stability

The public URL is derived from the relative file path without `.md`. Renaming or moving an existing record changes its URL. Treat established record paths as permanent.

## Validation

Run:

```bash
npm run check
```

The validator checks dates, paths, required metadata, record type, language tags, text direction, duplicate URLs, translation conflicts, tag limits, cover fields, image existence, and drafts.
