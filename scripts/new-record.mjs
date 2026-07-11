import fs from 'node:fs';
import path from 'node:path';
import { toDateKey } from './validate-records.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, list) => {
    if (!value.startsWith('--')) return pairs;
    pairs.push([value.slice(2), list[index + 1]?.startsWith('--') ? 'true' : (list[index + 1] ?? 'true')]);
    return pairs;
  }, []),
);

function fail(message) {
  console.error(message);
  console.error('\n例: npm run new -- --title "今日の記録" --type diary --tags "日記,振り返り"');
  process.exit(1);
}

const title = args.title?.trim();
if (!title) fail('--title が必要です');

const configSource = fs.readFileSync(path.join(process.cwd(), 'src', 'site.config.ts'), 'utf8');
const timezone = configSource.match(/timezone:\s*['"]([^'"]+)['"]/)?.[1] || 'Asia/Tokyo';
const date = args.date || new Intl.DateTimeFormat('sv-SE', {
  timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
if (!toDateKey(date)) fail('--date は YYYY-MM-DD 形式の実在する日付です');

const type = args.type || 'note';
const allowedTypes = ['diary', 'development', 'learning', 'task', 'activity', 'note'];
if (!allowedTypes.includes(type)) fail(`--type は ${allowedTypes.join(', ')} のいずれかです`);

const fallbackSlug = `record-${new Date().toISOString().slice(11, 19).replaceAll(':', '')}`;
const slug = (args.slug || title)
  .normalize('NFKD')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '') || fallbackSlug;
const tags = (args.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean);
const summary = args.summary || `「${title}」についての記録。`;
const [year, month] = date.split('-');
const directory = path.join(process.cwd(), 'content', 'records', year, month);
const file = path.join(directory, `${date}-${slug}.md`);

if (fs.existsSync(file)) fail(`同名ファイルがすでにあります: ${path.relative(process.cwd(), file)}`);

const quote = (value) => JSON.stringify(value);
const lines = [
  '---',
  `title: ${quote(title)}`,
  `date: ${date}`,
  `type: ${type}`,
  `summary: ${quote(summary)}`,
  `tags: [${tags.map(quote).join(', ')}]`,
  ...(args.project ? [`project: ${quote(args.project)}`] : []),
  'featured: false',
  'draft: false',
  'sample: false',
  'tasks: []',
  '---',
  '',
  'ここに本文を書きます。',
  '',
];

fs.mkdirSync(directory, { recursive: true });
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log(`✓ ${path.relative(process.cwd(), file)} を作成しました`);
