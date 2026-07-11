import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSite, PROJECT_ROOT } from '../scripts/build.mjs';
import { loadRecords } from '../scripts/lib/records.mjs';

async function withTempDir(callback) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'shiori-test-'));
  try { return await callback(directory); }
  finally { await rm(directory, { recursive: true, force: true }); }
}

test('builds a complete empty archive in every interface locale', async () => {
  await withTempDir(async (temporary) => {
    const contentDir = path.join(temporary, 'records');
    const outDir = path.join(temporary, 'dist');
    await mkdir(contentDir, { recursive: true });
    const result = await buildSite({ rootDir: PROJECT_ROOT, contentDir, outDir, quiet: true });

    assert.equal(result.records.length, 0);
    assert.deepEqual(result.locales, ['en', 'ja']);
    const home = await readFile(path.join(outDir, 'index.html'), 'utf8');
    const japaneseHome = await readFile(path.join(outDir, 'ja', 'index.html'), 'utf8');
    assert.match(home, /Place the first volume/i);
    assert.match(home, /<html lang="en" dir="ltr"/);
    assert.match(japaneseHome, /最初の一冊/);
    assert.match(japaneseHome, /<html lang="ja" dir="ltr"/);
    assert.equal(await readFile(path.join(outDir, 'search-index.json'), 'utf8'), '[]\n');
    await readFile(path.join(outDir, '404.html'), 'utf8');
  });
});

test('generates multilingual content and translation links', async () => {
  await withTempDir(async (temporary) => {
    const contentDir = path.join(temporary, 'records');
    const outDir = path.join(temporary, 'dist');
    const directory = path.join(contentDir, '2026', '07');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, '2026-07-10-hello.md'), `---\ntitle: Hello archive\ndate: 2026-07-10\ntype: diary\nlang: en\ntranslation_key: hello\ntags: [journal]\nsummary: An English record.\n---\n\nHello.`);
    await writeFile(path.join(directory, '2026-07-10-konnichiwa.md'), `---\ntitle: こんにちは、書庫\ndate: 2026-07-10\ntype: diary\nlang: ja\ntranslation_key: hello\ntags: [日記]\nsummary: 日本語の記録です。\n---\n\nこんにちは。`);

    const result = await buildSite({ rootDir: PROJECT_ROOT, contentDir, outDir, quiet: true });
    assert.equal(result.records.length, 2);
    const englishRecord = await readFile(path.join(outDir, 'records', '2026', '07', '2026-07-10-hello', 'index.html'), 'utf8');
    assert.match(englishRecord, />Translations</);
    assert.match(englishRecord, /こんにちは、書庫/);
    const japaneseUiRecord = await readFile(path.join(outDir, 'ja', 'records', '2026', '07', '2026-07-10-hello', 'index.html'), 'utf8');
    assert.match(japaneseUiRecord, />翻訳</);
  });
});

test('detects a date and directory mismatch before publishing', async () => {
  await withTempDir(async (temporary) => {
    const directory = path.join(temporary, 'records', '2026', '07');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, '2026-07-10-broken.md'), `---\ntitle: Broken record\ndate: 2026-07-11\ntype: diary\nlang: en\n---\nBody`);

    const loaded = await loadRecords({ rootDir: PROJECT_ROOT, contentDir: path.join(temporary, 'records') });
    assert.equal(loaded.published.length, 0);
    assert.equal(loaded.errors.length, 1);
    assert.match(loaded.errors[0], /must match/i);
  });
});

test('infers RTL direction from the content language', async () => {
  await withTempDir(async (temporary) => {
    const directory = path.join(temporary, 'records', '2026', '07');
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, '2026-07-11-arabic.md'), `---\ntitle: يوميات\ndate: 2026-07-11\ntype: diary\nlang: ar\nsummary: سجل باللغة العربية.\n---\n\nنص عربي.`);
    const loaded = await loadRecords({ rootDir: PROJECT_ROOT, contentDir: path.join(temporary, 'records') });
    assert.equal(loaded.errors.length, 0);
    assert.equal(loaded.published[0].dir, 'rtl');
  });
});
