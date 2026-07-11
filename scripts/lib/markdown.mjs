import { escapeAttr, escapeHtml, slugify, stripHtml } from './utils.mjs';

const BLOCK_START = /^(?:#{1,6}\s+|```|~~~|>\s?|(?:[-*_]\s*){3,}|\s*(?:[-+*]|\d+[.)])\s+)/;

export function renderMarkdown(markdown, options = {}) {
  const state = {
    headings: [],
    headingIds: new Map(),
    completedTasks: 0,
    totalTasks: 0,
    options: {
      anchorLabel: options.anchorLabel || 'Link to “{title}”',
      tableLabel: options.tableLabel || 'Scrollable table',
      taskComplete: options.taskComplete || 'Completed',
      taskIncomplete: options.taskIncomplete || 'Not completed',
    }
  };

  const source = String(markdown ?? '').replaceAll('\r\n', '\n').replace(/^\uFEFF/, '');
  const html = renderBlocks(source.split('\n'), state);
  const text = markdownToText(source);
  const cjkCharacters = (text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) ?? []).length;
  const latinWords = (text.match(/[\p{Letter}\p{Number}]+/gu) ?? []).length - cjkCharacters;
  const readingMinutes = Math.max(1, Math.ceil((Math.max(0, latinWords) + cjkCharacters / 2) / 280));

  return {
    html,
    text,
    headings: state.headings,
    completedTasks: state.completedTasks,
    totalTasks: state.totalTasks,
    readingMinutes,
    characterCount: text.length
  };
}

function renderBlocks(lines, state) {
  const output = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const fence = /^(?<marker>```|~~~)(?<language>[\w-]*)\s*$/.exec(line.trim());
    if (fence) {
      const content = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith(fence.groups.marker)) {
        content.push(lines[index]);
        index += 1;
      }
      if (index < lines.length) index += 1;
      const language = fence.groups.language ? ` class="language-${escapeAttr(fence.groups.language)}"` : '';
      output.push(`<pre class="code-block"><code${language}>${escapeHtml(content.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const plain = inlineToText(heading[2]);
      const baseId = slugify(plain, `section-${state.headings.length + 1}`);
      const duplicateCount = state.headingIds.get(baseId) ?? 0;
      state.headingIds.set(baseId, duplicateCount + 1);
      const id = duplicateCount ? `${baseId}-${duplicateCount + 1}` : baseId;
      state.headings.push({ level, text: plain, id });
      output.push(`<h${level} id="${escapeAttr(id)}">${renderInline(heading[2])}<a class="heading-anchor" href="#${escapeAttr(id)}" aria-label="${escapeAttr(state.options.anchorLabel.replace('{title}', plain))}">#</a></h${level}>`);
      index += 1;
      continue;
    }

    if (/^\s*(?:\*\s*){3,}$/.test(line) || /^\s*(?:-\s*){3,}$/.test(line) || /^\s*(?:_\s*){3,}$/.test(line)) {
      output.push('<hr>');
      index += 1;
      continue;
    }

    if (line.trimStart().startsWith('>')) {
      const quote = [];
      while (index < lines.length && (lines[index].trimStart().startsWith('>') || !lines[index].trim())) {
        quote.push(lines[index].replace(/^\s*>\s?/, ''));
        index += 1;
      }
      output.push(`<blockquote>${renderBlocks(quote, state)}</blockquote>`);
      continue;
    }

    if (isTableHeader(lines, index)) {
      const headers = splitTableRow(lines[index]);
      const alignments = splitTableRow(lines[index + 1]).map((cell) => {
        const trimmed = cell.trim();
        if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
        if (trimmed.endsWith(':')) return 'right';
        return 'left';
      });
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes('|') && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      const head = headers.map((cell, cellIndex) => `<th scope="col" class="align-${alignments[cellIndex] ?? 'left'}">${renderInline(cell.trim())}</th>`).join('');
      const body = rows.map((row) => `<tr>${headers.map((_, cellIndex) => `<td class="align-${alignments[cellIndex] ?? 'left'}">${renderInline((row[cellIndex] ?? '').trim())}</td>`).join('')}</tr>`).join('');
      output.push(`<div class="table-scroll" tabindex="0" role="region" aria-label="${escapeAttr(state.options.tableLabel)}"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`);
      continue;
    }

    const listMatch = /^\s*(?<marker>[-+*]|\d+[.)])\s+(?<content>.+)$/.exec(line);
    if (listMatch) {
      const ordered = /^\d/.test(listMatch.groups.marker);
      const items = [];
      while (index < lines.length) {
        const current = /^\s*(?<marker>[-+*]|\d+[.)])\s+(?<content>.+)$/.exec(lines[index]);
        if (!current || /^\d/.test(current.groups.marker) !== ordered) break;
        const task = /^\[(?<state>[ xX])\]\s+(?<label>.*)$/.exec(current.groups.content);
        if (task) {
          state.totalTasks += 1;
          const checked = task.groups.state.toLowerCase() === 'x';
          if (checked) state.completedTasks += 1;
          items.push(`<li class="task-item${checked ? ' is-complete' : ''}"><span class="task-box" aria-hidden="true">${checked ? '✓' : ''}</span><span>${renderInline(task.groups.label)}</span><span class="sr-only">${checked ? escapeHtml(state.options.taskComplete) : escapeHtml(state.options.taskIncomplete)}</span></li>`);
        } else {
          items.push(`<li>${renderInline(current.groups.content)}</li>`);
        }
        index += 1;
      }
      const tag = ordered ? 'ol' : 'ul';
      const className = items.some((item) => item.includes('task-item')) ? ' class="task-list"' : '';
      output.push(`<${tag}${className}>${items.join('')}</${tag}>`);
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !BLOCK_START.test(lines[index]) &&
      !isTableHeader(lines, index)
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    output.push(`<p>${renderInline(paragraph.join('\n')).replaceAll('\n', '<br>')}</p>`);
  }

  return output.join('\n');
}

function isTableHeader(lines, index) {
  if (index + 1 >= lines.length || !lines[index].includes('|')) return false;
  const delimiter = lines[index + 1].trim();
  if (!delimiter.includes('-')) return false;
  const cells = splitTableRow(delimiter);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function splitTableRow(line) {
  let source = line.trim();
  if (source.startsWith('|')) source = source.slice(1);
  if (source.endsWith('|')) source = source.slice(0, -1);
  const cells = [];
  let buffer = '';
  let escaped = false;
  for (const char of source) {
    if (escaped) {
      buffer += char;
      escaped = false;
    } else if (char === '\\') {
      escaped = true;
    } else if (char === '|') {
      cells.push(buffer);
      buffer = '';
    } else {
      buffer += char;
    }
  }
  cells.push(buffer);
  return cells;
}

export function renderInline(input) {
  let source = String(input ?? '');
  const tokens = [];
  const token = (html) => {
    const key = `\u0000TOKEN${tokens.length}\u0000`;
    tokens.push(html);
    return key;
  };

  source = source.replace(/`([^`\n]+)`/g, (_, code) => token(`<code>${escapeHtml(code)}</code>`));
  source = source.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, alt, rawUrl, title) => {
    const url = sanitizeUrl(rawUrl, true);
    if (!url) return escapeHtml(`![${alt}](${rawUrl})`);
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    return token(`<img src="${escapeAttr(url)}" alt="${escapeAttr(alt)}" loading="lazy" decoding="async"${titleAttr}>`);
  });
  source = source.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_, label, rawUrl, title) => {
    const url = sanitizeUrl(rawUrl, false);
    if (!url) return escapeHtml(`[${label}](${rawUrl})`);
    const titleAttr = title ? ` title="${escapeAttr(title)}"` : '';
    const external = /^https?:\/\//i.test(url) ? ' rel="noreferrer"' : '';
    return token(`<a href="${escapeAttr(url)}"${titleAttr}${external}>${renderInline(label)}</a>`);
  });
  source = source.replace(/<((?:https?:\/\/|mailto:)[^>]+)>/gi, (_, rawUrl) => {
    const url = sanitizeUrl(rawUrl, false);
    if (!url) return escapeHtml(`<${rawUrl}>`);
    return token(`<a href="${escapeAttr(url)}" rel="noreferrer">${escapeHtml(rawUrl)}</a>`);
  });

  source = escapeHtml(source);
  source = source
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/__([^_\n]+)__/g, '<strong>$1</strong>')
    .replace(/~~([^~\n]+)~~/g, '<del>$1</del>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    const key = escapeHtml(`\u0000TOKEN${index}\u0000`);
    source = source.replaceAll(key, tokens[index]);
  }
  return source;
}

function sanitizeUrl(value, image) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^(?:javascript|vbscript|file):/i.test(url)) return '';
  if (/^data:/i.test(url)) return image && /^data:image\/(?:png|gif|jpe?g|webp|svg\+xml);/i.test(url) ? url : '';
  if (/^(?:https?:|mailto:|tel:)/i.test(url)) return url;
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url.startsWith('#')) return url;
  return url.includes(':') ? '' : url;
}

export function markdownToText(markdown) {
  return stripHtml(
    String(markdown ?? '')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/~~~[\s\S]*?~~~/g, ' ')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, '')
      .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, '')
      .replace(/\[(?: |x|X)\]\s*/g, '')
      .replace(/[*_~`|]/g, ' ')
  );
}

function inlineToText(value) {
  return markdownToText(value);
}
