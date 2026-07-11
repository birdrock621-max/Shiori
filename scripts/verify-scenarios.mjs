import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildSite, PROJECT_ROOT } from './build.mjs';

async function temporaryScenario(name, callback) {
  const root = await mkdtemp(path.join(os.tmpdir(), `shiori-${name}-`));
  try { await callback(root); }
  finally { await rm(root, { recursive: true, force: true }); }
}

async function emptyArchive() {
  await temporaryScenario('empty', async (root) => {
    const contentDir = path.join(root, 'records');
    const outDir = path.join(root, 'dist');
    await mkdir(contentDir, { recursive: true });
    const result = await buildSite({ rootDir: PROJECT_ROOT, contentDir, outDir, quiet: true });
    assert.equal(result.records.length, 0);
    assert.match(await readFile(path.join(outDir, 'index.html'), 'utf8'), /Place the first volume/i);
    assert.match(await readFile(path.join(outDir, 'ja', 'index.html'), 'utf8'), /最初の一冊/);
  });
}

async function largeArchive() {
  await temporaryScenario('large', async (root) => {
    const contentDir = path.join(root, 'records');
    const outDir = path.join(root, 'dist');
    const start = Date.UTC(2024, 0, 1);
    for (let index = 0; index < 360; index += 1) {
      const date = new Date(start + index * 86_400_000).toISOString().slice(0, 10);
      const [year, month] = date.split('-');
      const directory = path.join(contentDir, year, month);
      await mkdir(directory, { recursive: true });
      const language = index % 7 === 0 ? 'ja' : index % 11 === 0 ? 'ar' : 'en';
      const title = language === 'ja' ? `検証記録 ${index + 1}` : language === 'ar' ? `سجل الاختبار ${index + 1}` : `Load-test volume ${index + 1}`;
      await writeFile(path.join(directory, `${date}-volume-${String(index + 1).padStart(3, '0')}.md`), `---\ntitle: "${title}"\ndate: ${date}\ntype: ${index % 2 ? 'diary' : 'development'}\nlang: ${language}\ntags: [load-test, group-${index % 12}]\nproject: Project ${index % 9}\nsummary: "A multilingual archive scalability record."\n---\n\n## Notes\n\n${'Long-form content. '.repeat(80)}\n\n- [x] Generated\n`);
    }
    const result = await buildSite({ rootDir: PROJECT_ROOT, contentDir, outDir, quiet: true });
    assert.equal(result.records.length, 360);
    assert.ok(result.pages.size > 750);
    const englishIndex = JSON.parse(await readFile(path.join(outDir, 'search-index.json'), 'utf8'));
    const japaneseIndex = JSON.parse(await readFile(path.join(outDir, 'ja', 'search-index.json'), 'utf8'));
    assert.equal(englishIndex.length, 360);
    assert.equal(japaneseIndex.length, 360);
    assert.match(await readFile(path.join(outDir, 'languages', 'ar', 'index.html'), 'utf8'), /dir="ltr"/);
    assert.match(await readFile(path.join(outDir, 'records', '2024', '01', '2024-01-12-volume-012', 'index.html'), 'utf8'), /lang="ar" dir="rtl"/);
  });
}

await emptyArchive();
await largeArchive();
console.log('✓ Empty, multilingual, RTL, long-form, and 360-record archive scenarios passed');
