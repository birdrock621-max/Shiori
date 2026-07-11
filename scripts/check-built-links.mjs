import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');

if (!fs.existsSync(dist)) {
  console.error('dist がありません。先に npm run build を実行してください。');
  process.exit(1);
}

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(target, extension);
    return entry.isFile() && (!extension || entry.name.endsWith(extension)) ? [target] : [];
  });
}

function outputPath(urlPath) {
  const decoded = decodeURIComponent(urlPath).replace(/^\//, '');
  if (!decoded) return path.join(dist, 'index.html');
  if (decoded.endsWith('/')) return path.join(dist, decoded, 'index.html');
  if (path.extname(decoded)) return path.join(dist, decoded);
  return path.join(dist, decoded, 'index.html');
}

const failures = [];
const htmlFiles = walk(dist, '.html');

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  const references = [...html.matchAll(/(?:href|src)="(\/[^"]*)"/g)].map((match) => match[1]);
  for (const reference of references) {
    const clean = reference.split('#')[0].split('?')[0];
    if (!clean || clean.startsWith('//')) continue;
    const target = outputPath(clean);
    if (!fs.existsSync(target)) {
      failures.push(`${path.relative(dist, file)} → ${reference}`);
    }
  }

  const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/g)];
  if (inlineScripts.length) failures.push(`${path.relative(dist, file)} にCSPで禁止されるinline scriptがあります`);
}

for (const required of ['index.html', '404.html', '_headers', 'manifest.webmanifest']) {
  if (!fs.existsSync(path.join(dist, required))) failures.push(`必須出力がありません: ${required}`);
}

if (failures.length) {
  console.error(`\n生成物に${failures.length}件の問題があります:\n`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`✓ ${htmlFiles.length}ページの内部リンク・画像・CSP互換性を確認しました`);
