import type { CollectionEntry } from 'astro:content';

export type RecordEntry = CollectionEntry<'records'>;
export type RecordType = RecordEntry['data']['type'];

export const typeMeta: Record<
  RecordType,
  { label: string; short: string; color: string; icon: string }
> = {
  diary: { label: '日記', short: '日', color: 'berry', icon: '✦' },
  development: { label: '開発', short: '開', color: 'indigo', icon: '⌘' },
  learning: { label: '学び', short: '学', color: 'teal', icon: '◇' },
  task: { label: '達成', short: '達', color: 'ochre', icon: '✓' },
  activity: { label: '活動', short: '活', color: 'forest', icon: '↗' },
  note: { label: 'メモ', short: '記', color: 'slate', icon: '•' },
};

export function visibleRecords(entries: RecordEntry[]): RecordEntry[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
}

export function recordHref(entry: RecordEntry): string {
  return `/records/${entry.id}/`;
}

export function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function monthKey(date: Date): string {
  return date.toISOString().slice(0, 7);
}

export function formatDate(date: Date, locale = 'ja-JP'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    timeZone: 'UTC',
  }).format(date);
}

export function formatShortDate(date: Date): string {
  const [, month, day] = dateKey(date).split('-');
  return `${Number(month)}/${Number(day)}`;
}

export function formatMonth(key: string, locale = 'ja-JP'): string {
  const [year, month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function groupByMonth(entries: RecordEntry[]) {
  const groups = new Map<string, RecordEntry[]>();
  for (const entry of entries) {
    const key = monthKey(entry.data.date);
    const current = groups.get(key) ?? [];
    current.push(entry);
    groups.set(key, current);
  }
  return [...groups.entries()].map(([key, records]) => ({ key, records }));
}

export function getTaxonomy(entries: RecordEntry[]) {
  const tags = new Set<string>();
  const projects = new Set<string>();
  const years = new Set<string>();

  for (const entry of entries) {
    entry.data.tags.forEach((tag) => tags.add(tag));
    if (entry.data.project) projects.add(entry.data.project);
    years.add(String(entry.data.date.getUTCFullYear()));
  }

  return {
    tags: [...tags].sort((a, b) => a.localeCompare(b, 'ja')),
    projects: [...projects].sort((a, b) => a.localeCompare(b, 'ja')),
    years: [...years].sort().reverse(),
  };
}

export function getArchiveStats(entries: RecordEntry[]) {
  const days = new Set(entries.map((entry) => dateKey(entry.data.date)));
  const tags = new Set(entries.flatMap((entry) => entry.data.tags));
  const projects = new Set(
    entries.map((entry) => entry.data.project).filter((value): value is string => Boolean(value)),
  );
  const completedTasks = entries.reduce(
    (total, entry) => total + entry.data.tasks.filter((task) => task.done).length,
    0,
  );

  return {
    records: entries.length,
    days: days.size,
    tags: tags.size,
    projects: projects.size,
    completedTasks,
  };
}

export function estimateReadingMinutes(body = ''): number {
  const japaneseCharacters = (body.match(/[\u3000-\u30ff\u3400-\u9fff]/g) ?? []).length;
  const latinWords = (body.match(/[A-Za-z0-9]+/g) ?? []).length;
  return Math.max(1, Math.ceil(japaneseCharacters / 500 + latinWords / 220));
}

export function stableNumber(value: string, modulo: number): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash % modulo;
}

export function bookStyle(entry: RecordEntry) {
  const bodyLength = entry.body?.length ?? 0;
  return {
    height: 178 + stableNumber(entry.id, 5) * 8,
    width: Math.min(72, 42 + Math.floor(bodyLength / 550) * 4 + stableNumber(entry.id, 3) * 3),
    tilt: stableNumber(`${entry.id}-tilt`, 7) - 3,
  };
}

export function normalizedSearchText(entry: RecordEntry): string {
  const date = dateKey(entry.data.date);
  const [year, month, day] = date.split('-');
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  return [
    entry.data.title,
    entry.data.summary,
    entry.data.type,
    entry.data.project ?? '',
    date,
    `${year}/${month}/${day}`,
    `${year}-${month}`,
    `${year}/${month}`,
    `${year}年${monthNumber}月${dayNumber}日`,
    `${year}年${monthNumber}月`,
    ...entry.data.tags,
  ]
    .join(' ')
    .normalize('NFKC')
    .toLocaleLowerCase('ja');
}
