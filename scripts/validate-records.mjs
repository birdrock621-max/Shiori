import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import YAML from 'yaml';

export const RECORD_TYPES = new Set(['diary', 'development', 'learning', 'task', 'activity', 'note']);
export const MOODS = new Set(['bright', 'calm', 'focused', 'tired', 'curious', 'proud']);
export const RECORD_PATH = /^(\d{4})\/(\d{2})\/(\d{4}-\d{2}-\d{2})-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
export const RECORD_KEYS = new Set([
  'title', 'date', 'updated', 'type', 'summary', 'tags', 'project', 'mood',
  'featured', 'draft', 'sample', 'cover', 'cover_alt', 'tasks',
]);

export function readFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('front matter (--- ... ---) がありません');
  const data = YAML.parse(match[1]);
  if (!data || typeof data !== 'object') throw new Error('front matter をオブジェクトとして読めません');
  return { data, body: source.slice(match[0].length) };
}

function proseWithoutCode(source) {
  return source
    .replace(/^(?: {0,3})(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1\s*$/gm, '')
    .replace(/`+[^`\n]*`+/g, '');
}

export function toDateKey(value) {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) value = value.toISOString().slice(0, 10);
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
  ) return value;
  return null;
}

export function validateRecord(relativePath, source, root = process.cwd()) {
  const errors = [];
  const normalizedPath = relativePath.split(path.sep).join('/');
  const pathMatch = normalizedPath.match(RECORD_PATH);
  if (!pathMatch) {
    errors.push('パスは YYYY/MM/YYYY-MM-DD-kebab-slug.md の形式にしてください');
  }

  let parsed;
  try {
    parsed = readFrontmatter(source);
  } catch (error) {
    errors.push(error.message);
    return errors;
  }

  const { data, body } = parsed;
  for (const key of Object.keys(data)) {
    if (!RECORD_KEYS.has(key)) errors.push(`未知のfront matter項目です: ${key}`);
  }
  for (const key of ['title', 'date', 'type', 'summary', 'tags']) {
    if (data[key] === undefined || data[key] === null || data[key] === '') errors.push(`必須項目 ${key} がありません`);
  }

  const date = toDateKey(data.date);
  if (!date) errors.push('date は YYYY-MM-DD 形式の実在する日付にしてください');
  if (data.updated !== undefined) {
    const updated = toDateKey(data.updated);
    if (!updated) errors.push('updated は YYYY-MM-DD 形式の実在する日付にしてください');
    if (date && updated && updated < date) errors.push('updated は date 以降の日付にしてください');
  }
  if (pathMatch && date && pathMatch[3] !== date) errors.push(`date (${date}) とファイル名の日付 (${pathMatch[3]}) が一致しません`);
  if (pathMatch && date && (pathMatch[1] !== date.slice(0, 4) || pathMatch[2] !== date.slice(5, 7))) {
    errors.push('date と年/月ディレクトリが一致しません');
  }
  if (!RECORD_TYPES.has(data.type)) errors.push(`type は ${[...RECORD_TYPES].join(', ')} のいずれかです`);
  if (data.mood && !MOODS.has(data.mood)) errors.push(`mood は ${[...MOODS].join(', ')} のいずれかです`);
  if (!Array.isArray(data.tags)) {
    errors.push('tags は配列にしてください（例: [日記, 読書]）');
  } else {
    if (data.tags.length > 24) errors.push('tags は24件以内にしてください');
    if (data.tags.some((tag) => typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 32)) {
      errors.push('各tagは1〜32文字の文字列にしてください');
    }
  }
  if (typeof data.title !== 'string' || data.title.trim().length === 0 || data.title.length > 120) errors.push('title は1〜120文字にしてください');
  if (typeof data.summary !== 'string' || data.summary.trim().length === 0 || data.summary.length > 240) errors.push('summary は1〜240文字にしてください');
  if (data.project !== undefined && (typeof data.project !== 'string' || data.project.trim().length === 0 || data.project.length > 64)) {
    errors.push('project は1〜64文字にしてください');
  }
  for (const key of ['featured', 'draft', 'sample']) {
    if (data[key] !== undefined && typeof data[key] !== 'boolean') errors.push(`${key} は true または false にしてください`);
  }
  if (data.tasks !== undefined) {
    if (!Array.isArray(data.tasks)) {
      errors.push('tasks は配列にしてください');
    } else {
      if (data.tasks.length > 40) errors.push('tasks は40件以内にしてください');
      if (data.tasks.some((task) => !task || typeof task !== 'object'
        || Object.keys(task).some((key) => !['text', 'done'].includes(key))
        || typeof task.text !== 'string' || task.text.trim().length === 0 || task.text.length > 160
        || typeof task.done !== 'boolean')) {
        errors.push('各taskは1〜160文字のtextとbooleanのdoneだけを持つ形式にしてください');
      }
    }
  }

  if (data.cover) {
    if (!data.cover_alt) errors.push('cover を指定した場合は cover_alt が必要です');
    if (typeof data.cover !== 'string' || !data.cover.startsWith('/images/')) {
      errors.push('cover は /images/... で始まるサイト内パスにしてください');
    } else {
      const asset = path.join(root, 'public', data.cover.replace(/^\//, ''));
      if (!fs.existsSync(asset)) errors.push(`cover の画像が見つかりません: ${data.cover}`);
    }
  }

  if (/<\/?[a-z][^>]*>|<!--|javascript\s*:|\son[a-z]+\s*=/i.test(proseWithoutCode(body))) {
    errors.push('本文にraw HTML、iframe、実行可能なHTML/JavaScriptを含めないでください');
  }
  if (/\b(?:sk-|ghp_|github_pat_|AKIA)[A-Za-z0-9_-]{12,}/.test(source)) {
    errors.push('APIキーまたはアクセストークンらしき文字列が含まれています');
  }

  return errors;
}

function walkMarkdown(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walkMarkdown(target);
    return entry.isFile() && entry.name.endsWith('.md') ? [target] : [];
  });
}

export function validateAll(root = process.cwd()) {
  const recordsRoot = path.join(root, 'content', 'records');
  const files = walkMarkdown(recordsRoot);
  const failures = [];

  for (const file of files) {
    const relative = path.relative(recordsRoot, file);
    const errors = validateRecord(relative, fs.readFileSync(file, 'utf8'), root);
    if (errors.length) failures.push({ file: relative, errors });
  }
  return { files, failures };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { files, failures } = validateAll();
  if (failures.length) {
    console.error(`\n${failures.length}件の記録に問題があります。\n`);
    for (const failure of failures) {
      console.error(`- ${failure.file}`);
      failure.errors.forEach((error) => console.error(`  • ${error}`));
    }
    process.exitCode = 1;
  } else {
    console.log(`✓ ${files.length}件の記録を検証しました`);
  }
}
