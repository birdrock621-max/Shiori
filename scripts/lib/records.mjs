import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { parseFrontmatter } from './frontmatter.mjs';
import { markdownToText, renderMarkdown } from './markdown.mjs';
import { inferDirection, normalizeLanguageTag } from './i18n.mjs';
import { RECORD_TYPES, compareDateDesc, ensureArray, parseDateParts, safePathSegment, toPosixPath, truncate } from './utils.mjs';

const FILENAME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/;
const VALID_TYPES = new Set(RECORD_TYPES);
const KNOWN_FIELDS = new Set(['title','date','updated','type','lang','language','dir','summary','tags','project','mood','translation_key','cover','cover_alt','featured','draft','sample','slug']);

export async function loadRecords({ rootDir, contentDir = 'content/records', publicDir = 'public', defaultLanguage = 'en' }) {
  const absoluteContentDir = path.resolve(rootDir, contentDir);
  const absolutePublicDir = path.resolve(rootDir, publicDir);
  const files = await walkMarkdownFiles(absoluteContentDir);
  const records = [], warnings = [], errors = [];

  for (const absolutePath of files) {
    const relativePath = toPosixPath(path.relative(rootDir, absolutePath));
    try {
      const source = await readFile(absolutePath, 'utf8');
      records.push(await parseRecord({ source, absolutePath, relativePath, absoluteContentDir, absolutePublicDir, defaultLanguage, warnings }));
    } catch (error) { errors.push(error instanceof Error ? error.message : String(error)); }
  }

  const seenUrls = new Map(), seenTranslations = new Map();
  for (const record of records) {
    if (seenUrls.has(record.url)) errors.push(`${record.sourcePath}: duplicate URL ${record.url}; also used by ${seenUrls.get(record.url)}`);
    else seenUrls.set(record.url, record.sourcePath);
    if (record.translationKey) {
      const key = `${record.translationKey}::${record.lang}`;
      if (seenTranslations.has(key)) errors.push(`${record.sourcePath}: translation_key “${record.translationKey}” already has a ${record.lang} version in ${seenTranslations.get(key)}`);
      else seenTranslations.set(key, record.sourcePath);
    }
  }

  records.sort(compareDateDesc);
  return { records, published: records.filter((record) => !record.draft), drafts: records.filter((record) => record.draft), warnings, errors };
}

async function parseRecord({ source, absolutePath, relativePath, absoluteContentDir, absolutePublicDir, defaultLanguage, warnings }) {
  const parsed = parseFrontmatter(source, relativePath);
  const relativeToRecords = toPosixPath(path.relative(absoluteContentDir, absolutePath));
  const fileName = path.basename(absolutePath);
  const fileMatch = FILENAME_PATTERN.exec(fileName);
  if (!fileMatch) throw new Error(`${relativePath}: filename must use YYYY-MM-DD-short-slug.md`);

  const fileDate = `${fileMatch[1]}-${fileMatch[2]}-${fileMatch[3]}`;
  const pathParts = relativeToRecords.split('/');
  if (pathParts.length < 3 || pathParts[0] !== fileMatch[1] || pathParts[1] !== fileMatch[2]) throw new Error(`${relativePath}: place the file under content/records/${fileMatch[1]}/${fileMatch[2]}/`);

  const inferredTitle = inferTitle(parsed.body, fileMatch[4]);
  const date = String(parsed.data.date || fileDate);
  if (!parseDateParts(date)) throw new Error(`${relativePath}: date must be a real YYYY-MM-DD date`);
  if (date !== fileDate) throw new Error(`${relativePath}: front matter date (${date}) must match filename date (${fileDate})`);
  const title = String(parsed.data.title || inferredTitle).trim();
  if (!title) throw new Error(`${relativePath}: add title or a first-level heading`);
  const type = String(parsed.data.type || 'note').trim();
  if (!VALID_TYPES.has(type)) throw new Error(`${relativePath}: type must be one of ${[...VALID_TYPES].join(', ')}`);

  for (const field of Object.keys(parsed.data)) if (!KNOWN_FIELDS.has(field)) warnings.push(`${relativePath}: unknown front matter field “${field}”`);
  const tags = ensureArray(parsed.data.tags).map((tag) => String(tag).trim()).filter(Boolean);
  if (tags.length > 12) warnings.push(`${relativePath}: ${tags.length} tags may be difficult to scan; 12 or fewer is recommended`);
  const project = parsed.data.project ? String(parsed.data.project).trim() : '';
  const mood = parsed.data.mood ? String(parsed.data.mood).trim() : '';
  const updated = parsed.data.updated ? String(parsed.data.updated).trim() : '';
  if (updated && !parseDateParts(updated)) throw new Error(`${relativePath}: updated must use YYYY-MM-DD`);
  if (updated && updated < date) warnings.push(`${relativePath}: updated is earlier than date`);

  const langInput = parsed.data.lang ?? parsed.data.language ?? defaultLanguage;
  const lang = normalizeLanguageTag(langInput, '');
  if (!lang) throw new Error(`${relativePath}: lang must be a valid BCP 47 language tag`);
  const explicitDir = parsed.data.dir ? String(parsed.data.dir).trim().toLowerCase() : '';
  if (explicitDir && !['ltr','rtl','auto'].includes(explicitDir)) throw new Error(`${relativePath}: dir must be ltr, rtl, or auto`);
  const dir = explicitDir === 'auto' || !explicitDir ? inferDirection(lang) : explicitDir;
  const translationKey = parsed.data.translation_key ? String(parsed.data.translation_key).trim() : '';
  if (translationKey && (translationKey.length > 120 || /\s/.test(translationKey))) throw new Error(`${relativePath}: translation_key must be 120 characters or fewer and contain no whitespace`);

  const metrics = renderMarkdown(parsed.body);
  const summary = truncate(String(parsed.data.summary || firstMeaningfulText(parsed.body) || metrics.text), 220);
  if (!summary) warnings.push(`${relativePath}: summary and body are empty`);
  const rawSlug = parsed.data.slug ? String(parsed.data.slug) : fileMatch[4];
  const slug = safePathSegment(rawSlug, `record-${date}`);
  const year = date.slice(0,4), month = date.slice(5,7);
  const url = `/records/${year}/${month}/${date}-${slug}/`;
  const cover = parsed.data.cover ? String(parsed.data.cover).trim() : '';
  const coverAlt = parsed.data.cover_alt ? String(parsed.data.cover_alt).trim() : '';
  if (cover.startsWith('/')) {
    const coverPath = path.resolve(absolutePublicDir, cover.slice(1));
    if (!coverPath.startsWith(absolutePublicDir)) throw new Error(`${relativePath}: cover points outside public/`);
    try { const coverStat = await stat(coverPath); if (!coverStat.isFile()) throw new Error(); }
    catch { throw new Error(`${relativePath}: cover file does not exist: public${cover}`); }
  }
  if (cover && !coverAlt) warnings.push(`${relativePath}: cover_alt is recommended for every cover image`);

  return {
    title, date, updated, type, tags:[...new Set(tags)], project, mood, summary, cover, coverAlt, lang, dir, translationKey,
    draft: parsed.data.draft === true, featured: parsed.data.featured === true, sample: parsed.data.sample === true,
    slug, url, year, month, monthKey:`${year}-${month}`, body:parsed.body, text:metrics.text, headings:metrics.headings,
    completedTasks:metrics.completedTasks, totalTasks:metrics.totalTasks, readingMinutes:metrics.readingMinutes,
    characterCount:metrics.characterCount, sourcePath:relativePath, hasFrontmatter:parsed.hasFrontmatter,
  };
}
function inferTitle(body, slug) { const heading=/^#\s+(.+)$/m.exec(body); return heading?markdownToText(heading[1]):String(slug).replaceAll('-',' ').replace(/\b\w/g,(c)=>c.toUpperCase()); }
function firstMeaningfulText(body) { return truncate(markdownToText(String(body).replace(/^#\s+.*$/m,'')),220); }
async function walkMarkdownFiles(directory) {
  try {
    const entries=await readdir(directory,{withFileTypes:true});
    const nested=await Promise.all(entries.map(async(entry)=>{if(entry.name.startsWith('.'))return[];const absolute=path.join(directory,entry.name);if(entry.isDirectory())return walkMarkdownFiles(absolute);if(entry.isFile()&&entry.name.endsWith('.md')&&!entry.name.startsWith('_'))return[absolute];return[];}));
    return nested.flat().sort();
  } catch(error){if(error?.code==='ENOENT')return[];throw error;}
}
