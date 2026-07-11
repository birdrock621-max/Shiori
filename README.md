<div align="center">
  <img src="public/favicon.svg" width="78" height="78" alt="Shiori logo">
  <h1>Shiori</h1>
  <p><strong>A multilingual living archive for the days, work, and lessons you want to keep.</strong></p>
  <p>Write Markdown in GitHub. Shiori turns it into an immersive, searchable bookshelf with no database, CMS, API key, or environment variable.</p>
</div>

## Publish in five minutes

You only need a GitHub account and a Cloudflare account.

### 1. Make your own copy

Use **Fork** or **Use this template** on GitHub. A template copy is best for a clean project history; a fork is the fastest option.

> Shiori is a publishing tool. Do not commit passwords, tokens, precise addresses, private health or financial data, or information about other people without permission.

### 2. Connect it to Cloudflare

In **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git**, select your Shiori repository and use:

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | `None` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | leave empty |
| Environment variables | none |

Press **Save and Deploy**. The sample archive is ready on the first deployment. Every later push to `main` rebuilds it automatically.

### 3. Tell an AI agent what happened

An agent that can edit the repository only needs to read [`AGENTS.md`](AGENTS.md).

```text
I finished the keyboard navigation for the search dialog today.
Add a development record with what changed, what I learned, and the completed tasks. Then validate and push it.
```

The same workflow works in any language:

```text
今日は検索ダイアログのキーボード操作を完成させた。
学んだことと完了タスクを開発記録にして、検証後にpushして。
```

## What Shiori provides

- A full-screen, geology-inspired entrance where a cursor spotlight reveals a second landscape.
- A walnut archive built from locally bundled WebP textures, with book height, width, tilt, color, and bookmark derived from record metadata.
- Full-text search across titles, summaries, body text, tags, projects, dates, and content languages.
- Filters for year, record type, project, tag, and language, with shelf and list views.
- Long-form record pages with headings, tables, code, quotations, images, task lists, reading time, translations, and previous/next navigation.
- English as the default interface, Japanese included, and additional interface languages supplied as JSON locale packs.
- Independent language metadata for every record, including automatic right-to-left layout for languages such as Arabic and Hebrew.
- Static HTML for every route, an Atom feed, sitemap, robots file, and localized search indexes.
- Keyboard navigation, visible focus, high-contrast controls, reduced-motion support, forced-colors support, and print styles.
- Zero runtime dependencies and no client framework. The generated site is ordinary HTML, CSS, and JavaScript.

Your writing remains portable Markdown in your own repository. Shiori can disappear and your archive still remains readable.

## Add a record by hand

Create a file at:

```text
content/records/YYYY/MM/YYYY-MM-DD-short-slug.md
```

Minimal example:

```markdown
---
title: A clear, useful title
date: 2026-07-11
type: learning
lang: en
summary: What this entry contains, in one or two sentences.
tags: [distributed-systems, review]
project: Systems course
---

Start with the important part.

## What I learned

Write the record in any language.

## Completed

- [x] Reviewed the failure model
- [ ] Compare it with Byzantine faults
```

`lang` accepts a BCP 47 language tag such as `en`, `ja`, `fr`, `es`, `de`, `ar`, or `pt-BR`. The interface language and the record language are independent: an English visitor can read and find a Japanese record, and vice versa.

Use [`content/_templates/record.md`](content/_templates/record.md) as a copyable template. The full field reference is in [`docs/CONTENT_FORMAT.md`](docs/CONTENT_FORMAT.md).

## Link translations

Records that are translations of each other share the same `translation_key` and use different `lang` values:

```yaml
translation_key: search-dialog-release
lang: en
```

```yaml
translation_key: search-dialog-release
lang: ja
```

Shiori automatically shows the available translations on each record page. It rejects duplicate translations for the same language during validation.

## Add another interface language

1. Copy `config/i18n/en.json` to `config/i18n/fr.json`.
2. Translate every value without changing the keys.
3. Add `fr` to `locales` in `config/site.json`.
4. Run `npm run test:all`.

The build creates `/fr/`, `/fr/archive/`, `/fr/browse/`, localized record pages, language switch links, `hreflang` metadata, and a French search index. No application code needs to change.

## Customize the archive

Most owners only edit [`config/site.json`](config/site.json):

```json
{
  "name": "My Archive",
  "description": "A record of work, reading, and ordinary days.",
  "defaultLocale": "en",
  "locales": ["en", "ja"],
  "timezone": "America/New_York",
  "url": "",
  "startYear": 2026,
  "author": {
    "name": "Your name",
    "bio": "A short public profile."
  }
}
```

- Leave `url` empty on Cloudflare Pages; `CF_PAGES_URL` is used automatically during deployment.
- Replace the two HTTPS URLs under `hero` to change the base and reveal landscapes. Two images with similar composition produce the best spotlight effect.
- The walnut cabinet textures are bundled under `public/assets/textures/`; their provenance and accessibility fallbacks are documented in [`docs/WOOD_ASSETS.md`](docs/WOOD_ASSETS.md).
- Remove locale codes you do not need. The default locale is published without a URL prefix; other locales use `/<locale>/`.
- Delete files with `sample: true` after you understand the finished result. A zero-record archive remains a complete, helpful empty state.

## Images

Store record images under:

```text
public/images/records/YYYY/MM/<slug>/image.webp
```

Reference them from Markdown without the `public` prefix:

```markdown
![A concise description of the image](/images/records/2026/07/search-release/result.webp)
```

Remove location metadata and check screenshots for names, notifications, email addresses, tokens, and private repository content before committing them.

## Local development

Node.js 22 or later is required. There are no npm dependencies, but `npm ci` verifies the lockfile and keeps the workflow familiar.

```bash
npm ci
npm run dev
```

Run the complete release gate before pushing:

```bash
npm run test:all
```

It validates configuration, locale packs, records, translations, media references, critical WCAG contrast pairs, unit tests, static generation, internal links, CSP compatibility, zero-record behavior, multilingual and RTL content, and a 360-record archive.

## How it works

Shiori 2 is a purpose-built static generator rather than a themed blog framework. At build time it:

1. validates `config/site.json` and every locale pack;
2. parses and validates Markdown records;
3. generates each route for every interface locale;
4. emits localized search indexes, taxonomy pages, feeds, and metadata;
5. copies a small progressive-enhancement runtime for search, filtering, navigation, themes, and the spotlight.

Read [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for the design and extension boundaries.

## Troubleshooting

<details>
<summary><strong>Cloudflare starts “configuring Astro” or creates <code>dist/client</code></strong></summary>

You are deploying an older revision or Cloudflare is not reading the repository root. Shiori 2 does not use Astro. Confirm that `package.json` is version `2.0.0`, `wrangler.jsonc` exists, the root directory is empty, the build command is `npm run build`, and the output directory is `dist`.
</details>

<details>
<summary><strong>A new record does not appear</strong></summary>

Check that the folder date, filename date, and front matter `date` match; `draft` is not `true`; `type` is supported; and `npm run check` succeeds.
</details>

<details>
<summary><strong>The spotlight does not follow the pointer</strong></summary>

Touch devices and browsers with reduced motion enabled intentionally use a fixed reveal position. This avoids a misleading hover interaction and respects accessibility preferences.
</details>

<details>
<summary><strong>A language switch route is missing</strong></summary>

The locale must exist in `config/site.json`, its JSON file must exist under `config/i18n/`, and every key from the default locale must be translated.
</details>

## Updating, contributing, and security

- Keep your records on your own branch before pulling upstream changes.
- Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before proposing application changes.
- Report vulnerabilities privately as described in [`SECURITY.md`](SECURITY.md).
- The project uses the [MIT License](LICENSE).

---

<details>
<summary><strong>日本語での最短導入</strong></summary>

1. このリポジトリをForkまたはテンプレートから複製します。
2. Cloudflare Pagesでリポジトリを選び、ビルドコマンドを`npm run build`、出力先を`dist`にします。
3. `config/site.json`で名前やタイムゾーンを変更します。
4. AIエージェントへ「`AGENTS.md`に従って今日の記録を追加し、検証後にpushして」と伝えます。

日本語UIは`/ja/`に生成されます。日本語の記録には`lang: ja`を付けてください。
</details>
