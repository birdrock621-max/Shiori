import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const DIST = path.resolve(process.argv[2] || path.join(ROOT, 'dist'));

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  }))).flat();
}

function localTarget(rawValue) {
  const value = rawValue.replaceAll('&amp;', '&').split('#')[0].split('?')[0];
  if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/i.test(value)) return null;
  if (!value.startsWith('/')) return null;
  const decoded = decodeURIComponent(value);
  const relative = decoded.replace(/^\/+/, '');
  if (!relative) return path.join(DIST, 'index.html');
  if (decoded.endsWith('/')) return path.join(DIST, relative, 'index.html');
  return path.join(DIST, relative);
}

async function main() {
  const files = await walk(DIST);
  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  const errors = [];
  let checkedLinks = 0;
  let localizedPages = 0;

  for (const htmlFile of htmlFiles) {
    const relative = path.relative(DIST, htmlFile);
    const html = await readFile(htmlFile, 'utf8');
    const lang = html.match(/<html\b[^>]*\blang=["']([^"']+)/i)?.[1];
    if (!lang) errors.push(`${relative}: missing html lang`);
    if (!/<html\b[^>]*\bdir=["'](?:ltr|rtl)["']/i.test(html)) errors.push(`${relative}: missing valid html dir`);
    if (!/<title>[^<]+<\/title>/i.test(html)) errors.push(`${relative}: missing title`);
    if (!/<meta\s+name=["']description["']/i.test(html)) errors.push(`${relative}: missing description`);
    if (!/<main\b/i.test(html)) errors.push(`${relative}: missing main landmark`);
    if (!/<h1\b/i.test(html)) errors.push(`${relative}: missing h1`);
    if (!/rel=["']alternate["'][^>]+hreflang=["']x-default["']/i.test(html)) errors.push(`${relative}: missing x-default alternate`);
    if (/\b(?:TODO|FIXME|Lorem ipsum|coming soon)\b/i.test(html)) errors.push(`${relative}: placeholder text remains`);
    if (/\son(?:click|error|load|mouseover)=/i.test(html)) errors.push(`${relative}: unsafe inline event handler`);
    if (/href=["']javascript:/i.test(html)) errors.push(`${relative}: javascript URL`);
    if (/<script(?![^>]+\bsrc=)[^>]*>/i.test(html)) errors.push(`${relative}: inline script conflicts with CSP`);
    if (relative.startsWith(`ja${path.sep}`)) localizedPages += 1;

    for (const match of html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const target = localTarget(match[1]);
      if (!target) continue;
      checkedLinks += 1;
      try {
        const info = await stat(target);
        if (!info.isFile()) errors.push(`${relative}: ${match[1]} is not a file`);
      } catch {
        errors.push(`${relative}: missing internal reference ${match[1]}`);
      }
    }
  }

  for (const required of ['index.html', '404.html', 'search-index.json', 'ja/index.html', 'ja/search-index.json', 'assets/styles.css', 'assets/app.js', '_headers', 'manifest.webmanifest']) {
    try { await stat(path.join(DIST, required)); }
    catch { errors.push(`missing required output: ${required}`); }
  }
  if (!localizedPages) errors.push('no localized pages were generated');

  if (errors.length) {
    console.error(`✗ Smoke test found ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n- ${errors.slice(0, 80).join('\n- ')}`);
    if (errors.length > 80) console.error(`- ${errors.length - 80} more`);
    process.exitCode = 1;
    return;
  }
  console.log(`✓ ${htmlFiles.length} HTML pages and ${checkedLinks} internal references`);
  console.log('✓ Language metadata, alternate URLs, CSP-safe scripts, and required assets are present');
}

main().catch((error) => {
  console.error(`✗ ${error.stack || error.message}`);
  process.exitCode = 1;
});
