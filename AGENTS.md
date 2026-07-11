# AGENTS.md — Shiori record protocol

Shiori turns public-safe Markdown records into a multilingual static archive. For ordinary journal, task, learning, activity, note, or development requests, follow this document without requiring the user to restate the file format.

## Non-negotiable principles

1. Record facts; do not invent achievements, emotions, times, causes, metrics, quotations, or personal details.
2. Treat the repository and generated site as potentially public. Generalize sensitive context or use `draft: true` when publication is uncertain.
3. For ordinary record work, change only record Markdown and record-specific media.
4. Preserve the user’s language and voice. Do not translate a record unless the user asks for a translation.
5. Do not overwrite unrelated work or include existing uncommitted changes in a commit.
6. Validate before committing or pushing.

## Normal edit boundary

Ordinary record requests may change:

- `content/records/YYYY/MM/*.md`
- `public/images/records/YYYY/MM/<slug>/*`

Only when explicitly requested:

- `config/site.json`
- `config/i18n/*.json`
- shared profile or branding assets under `public/`

Do not change these during ordinary record entry:

- `scripts/`, `src/`, `test/`
- `package.json`, `package-lock.json`, `.node-version`, `wrangler.jsonc`
- `.github/`, `README.md`, `AGENTS.md`, `LICENSE`
- `dist/` or temporary build output

## Create a new record or update an existing one

Create a new file when the event is on another date, has a clearly separate subject or project, deserves an independent permalink, or the user asks for a new record.

Update an existing file when it is a continuation or correction of the same date and subject, or the user explicitly refers to the earlier entry. Preserve existing prose. Set or update `updated: YYYY-MM-DD`, then add a section such as:

```markdown
## Update

Additional information.
```

Include a time only when the user supplied it or it is reliably known.

## File location and name

Use the date in `config/site.json`’s timezone unless the user supplies an explicit date.

```text
content/records/YYYY/MM/YYYY-MM-DD-short-kebab-case-slug.md
```

Rules:

- directory year/month, filename date, and front matter `date` must match;
- use an ASCII lowercase slug when practical so URLs are easy to share globally;
- do not rename an existing record casually because its public URL will change;
- `content/_templates/record.md` is a template, not a published record.

## Required front matter

```yaml
---
title: Fixed keyboard navigation in search
date: 2026-07-11
type: development
lang: en
summary: Corrected focus movement and verified that the dialog works without a pointer.
tags: [search, accessibility]
project: Shiori
---
```

Required:

- `title`: specific and useful when seen out of context;
- `date`: ISO `YYYY-MM-DD`, matching the file path;
- `type`: one of `diary`, `task`, `development`, `learning`, `activity`, `note`;
- `lang`: BCP 47 language tag for the record body, such as `en`, `ja`, `fr`, `es`, `de`, `ar`, or `pt-BR`;
- `summary`: one or two informative sentences in the same language as the record.

Optional:

- `tags`: up to 12, reusing existing spelling where possible;
- `project`: one existing, consistently spelled project name;
- `mood`: only when supported by the user’s words;
- `updated`: ISO date for a later update;
- `cover` and `cover_alt`;
- `featured: true` for an intentionally selected record;
- `draft: true` to keep the record out of the generated site;
- `translation_key`: shared stable identifier for translations of the same record;
- `dir: rtl` or `dir: ltr` only when automatic direction from `lang` is wrong;
- `sample: true` only for repository demo content.

## Language and translation rules

- Preserve the language the user used unless they request another language.
- Interface language and record language are independent; do not rewrite content just to match the interface.
- Use a valid BCP 47 language tag. Prefer `en`, `ja`, `fr`, `es`, etc.; include a region only when it matters.
- Arabic, Hebrew, Persian, Urdu, and related languages receive RTL layout automatically.
- A translation is a separate Markdown file with its own title, summary, body, and `lang`.
- Translation siblings share the same `translation_key`.
- Never place two records with the same `translation_key` and the same language; validation rejects this.
- Do not claim a machine translation was human-reviewed unless the user confirms it.

## Choosing a record type

| Type | Use for |
| --- | --- |
| `diary` | events, feelings, reflection, ordinary days |
| `task` | a group of completed tasks or small wins |
| `development` | implementation, incidents, releases, technical decisions |
| `learning` | courses, reading, research, practice, discoveries |
| `activity` | walks, travel, events, exercise, making things |
| `note` | ideas, observations, and material that does not fit another type |

Choose the shelf the user is most likely to browse later; use tags for secondary facets.

## Body guidelines

- Match the amount of detail the user supplied. Do not inflate a short report into fictional long-form prose.
- Begin with the important information, then add `##` sections as useful.
- Do not repeat the title as a `#` heading; the page template renders it.
- Put commands, code, and errors in fenced code blocks.
- Mark uncertainty explicitly.
- Do not embed raw HTML, scripts, iframes, or tracking content.
- Summarize copyrighted sources rather than reproducing long passages.

## Completed tasks

Use Markdown checkboxes only for actual task state:

```markdown
## Completed

- [x] Added keyboard focus movement
- [x] Verified Escape closes the dialog
- [ ] Run the final screen-reader pass
```

Never mark an unconfirmed task complete. Shiori aggregates completed boxes, so they are data rather than decoration.

## Projects and tags

Search existing records before creating a new spelling. Reuse the exact project name when the relationship is clear. If multiple projects are plausible, omit `project` rather than guessing. Keep tags concise, stable, and in the language that best serves the owner’s archive; multilingual tags are supported.

## Images

Store record-specific images at:

```text
public/images/records/YYYY/MM/<slug>/descriptive-name.webp
```

Reference them from Markdown as:

```markdown
![Meaningful alternative text](/images/records/2026/07/search-release/results.webp)
```

For a cover:

```yaml
cover: /images/records/2026/07/search-release/results.webp
cover_alt: Search results with the language filter active
```

Before committing, remove unnecessary metadata and inspect the image for precise locations, faces, private messages, email addresses, tokens, notifications, customer data, and private code.

## Information that must not be published

Do not commit passwords, API keys, tokens, private keys, cookies, connection strings, private customer or repository data, exact home/school/work addresses, unnecessary personal contact details, identity documents, sensitive medical or financial details, non-consensual third-party information, or actionable details of an undisclosed vulnerability.

Generalize context when possible: “near home,” “a colleague,” “a private project,” or “rotated the credential.” If generalization defeats the record’s purpose, create a draft and tell the user why it was not published.

## Validation and publishing

For content-only changes:

```bash
npm run check
npm test
npm run build
npm run smoke
```

Before committing:

```bash
git diff --check
git diff -- content/records public/images/records
```

Recommended commit messages:

```text
content: add search accessibility development log
content: update July 11 journal
content: add Japanese translation for release notes
```

Do not commit `dist/`, temporary files, secrets, or unrelated changes. Do not force-push or rewrite shared history. Push only when the environment has repository permission and the user asked for the change to be published.

## Final checklist

- [ ] Path, filename date, and front matter date match.
- [ ] `title`, `type`, `lang`, and `summary` are present and accurate.
- [ ] Language and text direction are correct.
- [ ] A translation uses a separate file and shared `translation_key`.
- [ ] Tags and project spelling reuse existing conventions.
- [ ] Only confirmed tasks are checked.
- [ ] Images and alternative text are safe and correct.
- [ ] No secrets, unnecessary personal data, or third-party private information are present.
- [ ] No unsupported facts were invented.
- [ ] Only intended files changed.
- [ ] Validation and build checks pass.
- [ ] The final diff was reviewed before commit and push.
