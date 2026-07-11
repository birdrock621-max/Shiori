import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const source = process.cwd();
const astroPackageRoot = path.join(source, 'node_modules', 'astro');
const astroPackage = JSON.parse(fs.readFileSync(path.join(astroPackageRoot, 'package.json'), 'utf8'));
const astroCli = path.join(astroPackageRoot, astroPackage.bin.astro);

function copyProject(target) {
  const skipped = new Set(['.git', '.astro', 'dist', 'node_modules']);
  fs.cpSync(source, target, {
    recursive: true,
    filter(from) {
      const relative = path.relative(source, from);
      const first = relative.split(path.sep)[0];
      return !skipped.has(first);
    },
  });
  const sourceModules = path.join(source, 'node_modules');
  const targetModules = path.join(target, 'node_modules');
  fs.mkdirSync(targetModules, { recursive: true });
  for (const entry of fs.readdirSync(sourceModules, { withFileTypes: true })) {
    if (entry.name === '.astro') continue;
    fs.symlinkSync(
      path.join(sourceModules, entry.name),
      path.join(targetModules, entry.name),
      entry.isDirectory() ? 'dir' : 'file',
    );
  }
}

function build(target) {
  execFileSync(process.execPath, [astroCli, 'build'], {
    cwd: target,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    stdio: 'pipe',
  });
}

function recordSource(index, date, manyTags = false) {
  const tags = manyTags
    ? Array.from({ length: 24 }, (_, tag) => `tag-${String(tag + 1).padStart(2, '0')}`)
    : ['scale', `group-${index % 8}`];
  const title = manyTags ? `長い題名の表示を確認する記録${'とても'.repeat(22)}`.slice(0, 120) : `Scale record ${index}`;
  const body = manyTags ? `${'長い本文でも読みやすさを保つための検証段落です。'.repeat(120)}\n` : 'Generated, fictional test record.\n';
  return `---
title: ${JSON.stringify(title)}
date: ${date}
type: ${['diary', 'development', 'learning', 'task', 'activity', 'note'][index % 6]}
summary: "A generated fictional record for scale testing."
tags: [${tags.map((tag) => JSON.stringify(tag)).join(', ')}]
project: "Scale Test"
featured: false
draft: false
sample: false
tasks:
  - text: "Generated task"
    done: true
---

${body}`;
}

function generatedPages(target) {
  const records = path.join(target, 'dist', 'records');
  let count = 0;
  const walk = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const child = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.name === 'index.html') count += 1;
    }
  };
  if (fs.existsSync(records)) walk(records);
  return count;
}

const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'shiori-scenarios-'));

try {
  const empty = path.join(workspace, 'empty');
  copyProject(empty);
  fs.rmSync(path.join(empty, 'content', 'records'), { recursive: true, force: true });
  fs.mkdirSync(path.join(empty, 'content', 'records'), { recursive: true });
  build(empty);
  const emptyHtml = fs.readFileSync(path.join(empty, 'dist', 'index.html'), 'utf8');
  if (!emptyHtml.includes('最初の一冊を収めましょう')) throw new Error('0件時の案内が生成されませんでした');
  if (generatedPages(empty) !== 0) throw new Error('0件時に記録ページが生成されました');
  console.log('✓ 0件: 空の書庫と追加案内を生成');

  const large = path.join(workspace, 'large');
  copyProject(large);
  fs.rmSync(path.join(large, 'content', 'records'), { recursive: true, force: true });
  const start = new Date(Date.UTC(2025, 0, 1));
  for (let index = 0; index < 360; index += 1) {
    const date = new Date(start.valueOf() + index * 86_400_000).toISOString().slice(0, 10);
    const [year, month] = date.split('-');
    const directory = path.join(large, 'content', 'records', year, month);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, `${date}-scale-${String(index + 1).padStart(3, '0')}.md`),
      recordSource(index, date, index === 0),
      'utf8',
    );
  }
  build(large);
  if (generatedPages(large) !== 360) throw new Error(`360件中${generatedPages(large)}ページしか生成されませんでした`);
  const archiveHtml = fs.readFileSync(path.join(large, 'dist', 'archive', 'index.html'), 'utf8');
  if (!archiveHtml.includes('360</strong> 冊を表示')) throw new Error('360件の目録件数が正しくありません');
  console.log('✓ 360件: 長文・24タグを含む全ページを生成');
} finally {
  fs.rmSync(workspace, { recursive: true, force: true });
}
