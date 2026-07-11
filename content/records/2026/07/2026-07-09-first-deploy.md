---
title: The first deploy that felt real
date: 2026-07-09
type: development
lang: en
tags: [Cloudflare, deployment, validation]
project: Shiori
summary: A clean static build, a small deployment surface, and a checklist turned the first public release into something dependable.
mood: focused
featured: true
sample: true
draft: false
---

The useful milestone was not seeing a page online. It was knowing the same repository could be copied and deployed without a private service or secret configuration.

## Release checks

- [x] Built every page from a clean checkout
- [x] Checked internal links and required assets
- [x] Tested an empty archive and a large archive
- [x] Kept the deployment output static

## Decision

The deployment contract is intentionally small: run `npm run build` and publish `dist`.
