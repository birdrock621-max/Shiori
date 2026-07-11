import { readFile } from 'node:fs/promises';
import path from 'node:path';

const RTL_LANGUAGES = new Set(['ar', 'arc', 'ckb', 'dv', 'fa', 'he', 'ku', 'ps', 'sd', 'ug', 'ur', 'yi']);

export async function loadLocalePacks(rootDir, config) {
  const locales = [...new Set(config.locales ?? [])];
  if (!locales.includes(config.defaultLocale)) locales.unshift(config.defaultLocale);
  const packs = new Map();
  for (const locale of locales) {
    const file = path.join(rootDir, 'config', 'i18n', `${locale}.json`);
    let pack;
    try { pack = JSON.parse(await readFile(file, 'utf8')); }
    catch (error) { throw new Error(`Could not read locale pack ${file}: ${error.message}`); }
    if (!pack || typeof pack !== 'object' || Array.isArray(pack)) throw new Error(`${file} must contain a JSON object.`);
    packs.set(locale, pack);
  }
  const base = packs.get(config.defaultLocale);
  const missing = [];
  for (const [locale, pack] of packs) {
    for (const key of flattenKeys(base)) if (getNested(pack, key) === undefined) missing.push(`${locale}: ${key}`);
  }
  if (missing.length) throw new Error(`Locale packs are incomplete:\n- ${missing.join('\n- ')}`);
  return { locales, packs };
}

export function createTranslator(locale, packs, defaultLocale) {
  const pack = packs.get(locale) ?? packs.get(defaultLocale);
  const fallback = packs.get(defaultLocale);
  return function t(key, variables = {}) {
    const raw = getNested(pack, key) ?? getNested(fallback, key);
    if (raw === undefined) return key;
    if (typeof raw !== 'string') return raw;
    return raw.replace(/\{([A-Za-z0-9_]+)\}/g, (_, name) => variables[name] ?? `{${name}}`);
  };
}

export function localePrefix(locale, defaultLocale) { return locale === defaultLocale ? '' : `/${encodeURIComponent(locale)}`; }
export function localizePath(pathname, locale, defaultLocale) {
  const source = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const prefix = localePrefix(locale, defaultLocale);
  if (!prefix) return source;
  if (source === '/') return `${prefix}/`;
  return `${prefix}${source}`.replace(/\/{2,}/g, '/');
}
export function alternatesForPath(pathname, locales, defaultLocale, siteUrl = '') {
  return locales.map((locale) => {
    const localized = localizePath(pathname, locale, defaultLocale);
    return { locale, href: siteUrl ? `${siteUrl.replace(/\/$/, '')}${localized}` : localized };
  });
}
export function normalizeLanguageTag(value, fallback = 'und') {
  const input = String(value || '').trim().replaceAll('_', '-');
  if (!input) return fallback;
  try { return Intl.getCanonicalLocales(input)[0] || fallback; }
  catch { return fallback; }
}
export function languageBase(code = '') { return normalizeLanguageTag(code, 'und').split('-')[0].toLowerCase(); }
export function inferDirection(language, explicit = '') {
  if (explicit === 'rtl' || explicit === 'ltr') return explicit;
  return RTL_LANGUAGES.has(languageBase(language)) ? 'rtl' : 'ltr';
}
export function languageName(code, uiLocale = 'en') {
  if (!code) return '';
  try { return new Intl.DisplayNames([uiLocale], { type: 'language', fallback: 'code' }).of(code) || code; }
  catch { return code; }
}
function getNested(object, key) { return String(key).split('.').reduce((value, part) => value?.[part], object); }
function flattenKeys(object, prefix = '') {
  const output = [];
  for (const [key, value] of Object.entries(object ?? {})) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) output.push(...flattenKeys(value, next));
    else output.push(next);
  }
  return output;
}
