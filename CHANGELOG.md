# Changelog

## [Unreleased]

### Added

- A locally bundled walnut cabinet system with dedicated back-panel, shelf-plank, and frame textures.
- Asset provenance and accessibility documentation for the wood archive.
- Release checks that require all walnut texture assets.

All notable changes to Shiori are documented here.

## [2.0.0] - 2026-07-11

### Rebuilt

- Replaced the framework-based site with a purpose-built, dependency-free static generator.
- Replaced Japanese-specific application assumptions with an English-first multilingual architecture.
- Separated interface locale from each record’s content language and text direction.
- Rebuilt routes, search indexes, taxonomy pages, metadata, feeds, and 404 pages for every interface locale.
- Rebuilt the client runtime around progressive enhancement instead of framework state.

### Added

- Complete English and Japanese interface locale packs with key parity validation.
- BCP 47 record language metadata, automatic RTL support, and content-language filtering.
- First-class translated record relationships through `translation_key`.
- Localized full-text search covering every published content language.
- High-contrast semantic tokens and an automated WCAG contrast audit.
- Empty, multilingual, RTL, long-form, and 360-record scenario tests.
- External CSP-safe theme initialization and storage failure fallbacks.
- Keyboard focus trapping for mobile navigation and keyboard-operable locale selection.

### Design

- Preserved the full-screen geology-inspired hero, dual-image reveal, glass navigation, editorial typography, and growing bookshelf concept.
- Increased legibility with opaque dark glass reading panels, stronger hero scrims, higher-contrast secondary text, and clearer focus states.
- Reworked desktop, tablet, mobile, short-height, reduced-motion, forced-colors, and print layouts.

### Deployment

- Standardized Cloudflare deployment on static `dist` assets through `wrangler.jsonc`.
- Removed Astro and the Cloudflare adapter auto-configuration failure mode.

## [1.0.0] - 2026-07-11

- First public bookshelf archive implementation.
