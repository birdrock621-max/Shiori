# Shiori 2 architecture

Shiori 2 is a purpose-built, dependency-free static archive generator. The previous framework-based application was replaced rather than incrementally extended so multilingual routing, content language, validation, accessibility, and deployment behavior share one coherent model.

## Design goals

- A repository can be copied and deployed without a database, API key, environment variable, or framework preset.
- English is the public starter’s default interface, while interface and content languages remain independent.
- Markdown remains the source of truth and is portable outside Shiori.
- Every meaningful route is static HTML and works before client JavaScript runs.
- Interactive JavaScript progressively enhances search, filtering, themes, navigation, and the spotlight.
- A few records, no records, hundreds of records, long writing, and RTL text use the same architecture.

## Build pipeline

`npm run build` executes `scripts/build.mjs`.

1. `config/site.json` is validated.
2. `config/i18n/<locale>.json` files are loaded and checked against the default locale’s complete key set.
3. `content/records/**/*.md` is parsed and validated.
4. Markdown is rendered with raw HTML escaped and dangerous URL protocols removed.
5. Route templates generate the default locale without a prefix and additional locales under `/<locale>/`.
6. Static assets are copied and localized search indexes, Atom, sitemap, robots, and 404 output are written.

The build has no network requirement. Hero images are browser-loaded HTTPS assets configured by the owner; if unavailable, the dark visual foundation and all content remain usable.

## Source map

```text
config/
  site.json             owner-facing configuration
  i18n/*.json           complete interface locale packs
content/
  records/              public Markdown source
  _templates/           copyable record template
public/                  static assets and Cloudflare headers
scripts/
  build.mjs              build orchestration and route generation
  check.mjs              source validation gate
  contrast.mjs           critical WCAG color-pair audit
  smoke.mjs              generated-site link and metadata audit
  verify-scenarios.mjs   empty, multilingual, RTL, and large archive tests
  lib/
    frontmatter.mjs      small strict front matter parser
    i18n.mjs             locale loading, translation, paths, language names
    markdown.mjs         safe Markdown rendering
    records.mjs          record model and validation
    templates.mjs        semantic HTML route templates
    utils.mjs            shared language-neutral functions
src/
  styles.css             design system and responsive layouts
  app.js                 progressive-enhancement runtime
test/                    unit and build integration tests
wrangler.jsonc           static asset deployment contract
```

## Locale model

`config.site.defaultLocale` is published at `/`. Each additional locale is published under its locale prefix. A page’s interface locale controls navigation, labels, dates, filters, and accessibility strings. A record’s `lang` controls the language and direction of its title, summary, and article content.

For example, the Japanese record `/records/.../japanese-entry/` remains Japanese content inside the English interface, and `/ja/records/.../japanese-entry/` is the same content inside the Japanese interface.

Every generated page includes `hreflang` alternates and `x-default`. Search indexes are interface-localized but contain all published records in all content languages.

## Translation model

Translations are first-class sibling records, not mixed-language fields in one file. Siblings share `translation_key`, have distinct `lang` values, and receive their own stable URLs. This preserves Markdown portability and allows each translation to have a natural title, summary, tags, and body.

## Progressive enhancement

The generated HTML contains complete navigation, record text, archive controls, books, lists, and taxonomy links. `src/app.js` adds:

- theme persistence with storage failure fallback;
- sticky-header state;
- keyboard-operable locale and mobile menus;
- focus trapping and `inert` page content while the mobile menu is open;
- cursor smoothing for the reveal mask, with static touch/reduced-motion behavior;
- filtering, sorting, view persistence, and safe URL synchronization;
- a localized full-text search dialog;
- reading progress.

The runtime avoids a framework and keeps state local to the component root identified by `data-*` attributes.

## Security boundary

- Raw Markdown HTML is escaped.
- URL schemes such as `javascript:` and dangerous data URLs are removed.
- Generated pages use external self-hosted scripts; no inline script is required.
- `public/_headers` applies CSP, referrer, permissions, and MIME protections.
- Records marked `draft: true` are excluded from generated output, but a public Git repository still exposes the source file. Secrets must never be committed.

## Deployment

`wrangler.jsonc` declares `dist` as a static asset directory. Cloudflare must not auto-install an Astro adapter or rearrange output under `dist/client`. The supported deployment contract is:

```text
npm run build
npx wrangler deploy
```

Cloudflare Pages can instead use `npm run build` with output directory `dist`.

## Extension rules

- Add interface languages with locale packs, not conditionals in templates.
- Add record metadata in `records.mjs`, then expose it deliberately in templates, search, docs, and tests.
- Keep generated HTML meaningful without JavaScript.
- Any new foreground/background pair must meet WCAG contrast targets and be added to `contrast.mjs` when it is a critical semantic color.
- New interactions require keyboard behavior, reduced-motion behavior, and a no-JavaScript fallback or a nonessential classification.
