import { alternatesForPath, createTranslator, inferDirection, localizePath } from './i18n.mjs';
import { escapeAttr, escapeHtml, joinUrl } from './utils.mjs';
import { ICONS } from './template-core.mjs';
import { renderSearchDialog } from './template-components.mjs';

export function renderLayout({ config, locale, locales, packs, pathname, pageTitle='', description='', body, bodyClass='', type='website', image='', publishedDate='', modifiedDate='', noindex=false, hero=false }) {
  const t=createTranslator(locale,packs,config.defaultLocale);
  const fullTitle=pageTitle?`${pageTitle} — ${config.name}`:t('meta.siteTitle');
  const canonicalPath=localizePath(pathname,locale,config.defaultLocale);
  const canonical=config.siteUrl?joinUrl(config.siteUrl,canonicalPath):'';
  const socialImage=image || (config.siteUrl?joinUrl(config.siteUrl,'/og-default.svg'):'/og-default.svg');
  const alternates=alternatesForPath(pathname,locales,config.defaultLocale,config.siteUrl);
  const navItems=[['nav.home','/'],['nav.archive','/archive/'],['nav.browse','/browse/'],['nav.about','/about/']];
  const nav=navItems.map(([key,href])=>{const localized=localizePath(href,locale,config.defaultLocale);const active=pathname===href||(href!=='/'&&pathname.startsWith(href));return `<a href="${escapeAttr(localized)}"${active?' aria-current="page"':''}>${escapeHtml(t(key))}</a>`;}).join('');
  const localeLinks=locales.map(candidate=>{const href=localizePath(pathname,candidate,config.defaultLocale);const pack=packs.get(candidate);return `<a href="${escapeAttr(href)}" lang="${escapeAttr(candidate)}" hreflang="${escapeAttr(candidate)}"${candidate===locale?' aria-current="true"':''}><strong>${escapeHtml(pack.localeShort||candidate.toUpperCase())}</strong><span>${escapeHtml(pack.localeName||candidate)}</span></a>`;}).join('');
  const repo=config.repository?`<a href="${escapeAttr(config.repository)}" rel="noreferrer">${escapeHtml(t('common.repository'))}</a>`:'';
  const alternateTags=alternates.map(item=>`<link rel="alternate" hreflang="${escapeAttr(item.locale)}" href="${escapeAttr(item.href)}">`).join('\n  ');
  const xDefault=alternates.find(item=>item.locale===config.defaultLocale)?.href||canonicalPath;
  const dir=inferDirection(locale);
  const bodyData={auto:t('common.themeAuto'),light:t('common.themeLight'),dark:t('common.themeDark')};
  return `<!doctype html>
<html lang="${escapeAttr(locale)}" dir="${dir}" data-theme="auto">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="generator" content="Shiori 2 static archive">
  <meta name="color-scheme" content="light dark">
  <meta name="theme-color" content="#080a08">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeAttr(description||t('meta.siteDescription'))}">
  ${noindex?'<meta name="robots" content="noindex">':''}
  ${canonical?`<link rel="canonical" href="${escapeAttr(canonical)}">`:''}
  ${alternateTags}
  <link rel="alternate" hreflang="x-default" href="${escapeAttr(xDefault)}">
  <meta property="og:type" content="${escapeAttr(type)}">
  <meta property="og:site_name" content="${escapeAttr(config.name)}">
  <meta property="og:title" content="${escapeAttr(fullTitle)}">
  <meta property="og:description" content="${escapeAttr(description||t('meta.siteDescription'))}">
  ${canonical?`<meta property="og:url" content="${escapeAttr(canonical)}">`:''}
  <meta property="og:image" content="${escapeAttr(socialImage)}">
  <meta name="twitter:card" content="summary_large_image">
  ${publishedDate?`<meta property="article:published_time" content="${escapeAttr(publishedDate)}">`:''}
  ${modifiedDate?`<meta property="article:modified_time" content="${escapeAttr(modifiedDate)}">`:''}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="/apple-touch-icon.svg" type="image/svg+xml">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="alternate" type="application/atom+xml" title="${escapeAttr(config.name)}" href="/feed.xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <script src="/theme-init.js"></script>
  <link rel="stylesheet" href="/assets/styles.css">
</head>
<body class="${escapeAttr([bodyClass,hero?'has-hero':''].filter(Boolean).join(' '))}" data-locale="${escapeAttr(locale)}" data-search-index="${escapeAttr(localizePath('/search-index.json',locale,config.defaultLocale))}" data-theme-labels="${escapeAttr(JSON.stringify(bodyData))}">
  <a class="skip-link" href="#main-content">${escapeHtml(t('common.skipToContent'))}</a>
  <progress class="reading-progress" data-reading-progress max="100" value="0" aria-label="${escapeAttr(t('common.contents'))}"></progress>
  <header class="site-header${hero?' site-header--hero':''}" data-site-header>
    <div class="header-inner">
      <a class="brand" href="${escapeAttr(localizePath('/',locale,config.defaultLocale))}" aria-label="${escapeAttr(`${config.name} — ${t('nav.home')}`)}">
        <svg class="brand-logo" viewBox="0 0 256 256" aria-hidden="true"><path d="M256 256H128L0 128h128ZM256 128H128L0 0h128Z"/></svg><span class="brand-name">${escapeHtml(config.name)}</span><small>${escapeHtml(t('hero.overline'))}</small>
      </a>
      <nav class="primary-nav" aria-label="${escapeAttr(t('common.mainNavigation'))}">${nav}</nav>
      <div class="header-actions">
        <div class="locale-switcher" data-locale-switcher><button class="icon-button locale-toggle" type="button" data-locale-toggle aria-expanded="false" aria-haspopup="menu" aria-label="${escapeAttr(t('common.language'))}">${ICONS.globe}<span>${escapeHtml(packs.get(locale).localeShort||locale.toUpperCase())}</span></button><div class="locale-menu" role="menu" data-locale-menu hidden>${localeLinks}</div></div>
        <button class="icon-button" type="button" data-search-open aria-label="${escapeAttr(t('common.openSearch'))}" aria-keyshortcuts="/">${ICONS.search}</button>
        <button class="icon-button" type="button" data-theme-toggle aria-label="${escapeAttr(t('common.changeTheme'))}"><span data-theme-icon="auto">${ICONS.system}</span><span data-theme-icon="light" hidden>${ICONS.sun}</span><span data-theme-icon="dark" hidden>${ICONS.moon}</span></button>
        <a class="header-cta" href="${escapeAttr(localizePath('/archive/',locale,config.defaultLocale))}">${escapeHtml(t('hero.primaryAction'))}</a>
        <button class="menu-toggle" type="button" data-nav-toggle data-open-label="${escapeAttr(t('common.openMenu'))}" data-close-label="${escapeAttr(t('common.closeMenu'))}" aria-expanded="false" aria-controls="mobile-navigation" aria-label="${escapeAttr(t('common.openMenu'))}"><span></span><span></span></button>
      </div>
    </div>
    <div class="mobile-navigation" id="mobile-navigation" data-mobile-nav hidden><div class="mobile-navigation-inner"><p>${escapeHtml(t('browse.eyebrow'))}</p><nav aria-label="${escapeAttr(t('common.mobileNavigation'))}">${nav}</nav><div class="mobile-locales"><span>${escapeHtml(t('common.language'))}</span>${localeLinks}</div></div></div>
  </header>
  <main id="main-content" tabindex="-1">${body}</main>
  <footer class="site-footer"><div class="footer-inner"><div><p class="footer-brand">${escapeHtml(config.name)}</p><p>${escapeHtml(t('meta.siteDescription'))}</p></div><div class="footer-links"><a href="/feed.xml">${escapeHtml(t('common.rss'))}</a><a href="${escapeAttr(localizePath('/about/',locale,config.defaultLocale))}">${escapeHtml(t('nav.about'))}</a>${repo}</div></div><p class="footer-fineprint">© ${new Date().getUTCFullYear()} ${escapeHtml(config.author?.name||config.name)} · ${escapeHtml(t('common.builtFromMarkdown'))}</p></footer>
  ${renderSearchDialog(t)}
  <script type="module" src="/assets/app.js"></script>
</body>
</html>`;
}
