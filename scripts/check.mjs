import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { buildSite, PROJECT_ROOT } from './build.mjs';
import { loadLocalePacks } from './lib/i18n.mjs';
import { loadRecords } from './lib/records.mjs';

const REQUIRED_FILES = [
  'config/site.json',
  'config/i18n/en.json',
  'content/_templates/record.md',
  'src/styles.css',
  'src/app.js',
  'public/_headers',
  'public/theme-init.js',
  'public/assets/textures/walnut-shelf-back.svg',
  'public/assets/textures/walnut-shelf-plank.svg',
  'public/assets/textures/walnut-frame.svg',
  'WOOD_ASSETS.json',
  'wrangler.jsonc',
];

async function main() {
  const errors = [];
  const warnings = [];
  for (const relative of REQUIRED_FILES) {
    try { await access(path.join(PROJECT_ROOT, relative)); }
    catch { errors.push(`Missing required file: ${relative}`); }
  }

  let config;
  try { config = JSON.parse(await readFile(path.join(PROJECT_ROOT, 'config/site.json'), 'utf8')); }
  catch (error) { errors.push(`Invalid config/site.json: ${error.message}`); }

  if (config) {
    try { await loadLocalePacks(PROJECT_ROOT, config); }
    catch (error) { errors.push(error.message); }
    if (config.defaultLocale !== 'en') warnings.push('English is recommended as the default locale for the public starter.');
    if (!Array.isArray(config.locales) || !config.locales.includes(config.defaultLocale)) errors.push('config.locales must include config.defaultLocale.');
  }

  const loaded = await loadRecords({
    rootDir: PROJECT_ROOT,
    defaultLanguage: config?.defaultLocale || 'en',
  });
  errors.push(...loaded.errors);
  warnings.push(...loaded.warnings);

  if (!errors.length) {
    const temporary = await mkdtemp(path.join(os.tmpdir(), 'shiori-check-'));
    try {
      const result = await buildSite({ rootDir: PROJECT_ROOT, outDir: path.join(temporary, 'dist'), quiet: true });
      if (result.locales.length < 1) errors.push('No interface locale was generated.');
    } catch (error) {
      errors.push(`Static generation failed: ${error.message}`);
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }

  for (const warning of warnings) console.warn(`⚠ ${warning}`);
  if (errors.length) {
    console.error(`✗ Found ${errors.length} problem${errors.length === 1 ? '' : 's'}:\n- ${errors.join('\n- ')}`);
    process.exitCode = 1;
    return;
  }

  console.log(`✓ Configuration and ${config.locales.length} locale pack(s)`);
  console.log(`✓ ${loaded.published.length} published record(s), ${loaded.drafts.length} draft(s)`);
  console.log('✓ Paths, dates, metadata, translations, and media references are valid');
}

main().catch((error) => {
  console.error(`✗ ${error.stack || error.message}`);
  process.exitCode = 1;
});
