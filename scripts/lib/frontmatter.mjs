const KEY_PATTERN = /^[A-Za-z][A-Za-z0-9_-]*$/;

export class FrontmatterError extends Error {
  constructor(message, filePath = '', line = 0) {
    const where = [filePath, line ? `line ${line}` : ''].filter(Boolean).join(':');
    super(where ? `${where}: ${message}` : message);
    this.name = 'FrontmatterError';
    this.filePath = filePath;
    this.line = line;
  }
}

export function parseFrontmatter(source, filePath = '') {
  const input = String(source).replace(/^\uFEFF/, '').replaceAll('\r\n', '\n');
  if (!input.startsWith('---\n')) {
    return { data: {}, body: input, hasFrontmatter: false };
  }

  const closingIndex = input.indexOf('\n---\n', 4);
  if (closingIndex === -1) {
    throw new FrontmatterError('front matter is missing the closing `---` line', filePath, 1);
  }

  const raw = input.slice(4, closingIndex);
  const body = input.slice(closingIndex + 5);
  const lines = raw.split('\n');
  const data = {};

  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index];
    const lineNumber = index + 2;
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) continue;
    if (/^\s/.test(rawLine)) {
      throw new FrontmatterError('top-level keys must start at the beginning of the line', filePath, lineNumber);
    }

    const separator = rawLine.indexOf(':');
    if (separator === -1) {
      throw new FrontmatterError('use `key: value` syntax', filePath, lineNumber);
    }

    const key = rawLine.slice(0, separator).trim();
    const remainder = rawLine.slice(separator + 1).trim();
    if (!KEY_PATTERN.test(key)) {
      throw new FrontmatterError(`invalid key name: ${key}`, filePath, lineNumber);
    }
    if (Object.hasOwn(data, key)) {
      throw new FrontmatterError(`duplicate key: ${key}`, filePath, lineNumber);
    }

    if (remainder === '|' || remainder === '>') {
      const mode = remainder;
      const block = [];
      while (index + 1 < lines.length && (/^\s+/.test(lines[index + 1]) || lines[index + 1] === '')) {
        index += 1;
        const child = lines[index];
        block.push(child.replace(/^ {2}/, ''));
      }
      data[key] = mode === '|' ? block.join('\n').replace(/\n+$/, '') : block.join(' ').replace(/\s+/g, ' ').trim();
      continue;
    }

    if (remainder === '') {
      const values = [];
      while (index + 1 < lines.length && /^\s+-\s+/.test(lines[index + 1])) {
        index += 1;
        const child = lines[index];
        values.push(parseScalar(child.replace(/^\s+-\s+/, ''), filePath, index + 2));
      }
      data[key] = values;
      continue;
    }

    data[key] = parseScalar(remainder, filePath, lineNumber);
  }

  return { data, body, hasFrontmatter: true };
}

function parseScalar(value, filePath, lineNumber) {
  const input = value.trim();
  if (input === '') return '';

  if (input.startsWith('[')) {
    if (!input.endsWith(']')) {
      throw new FrontmatterError('inline array is missing the closing `]`', filePath, lineNumber);
    }
    return splitInlineArray(input.slice(1, -1)).map((item) => parseScalar(item, filePath, lineNumber));
  }

  if (input.startsWith('"')) {
    try {
      return JSON.parse(input);
    } catch {
      throw new FrontmatterError('invalid double-quoted string', filePath, lineNumber);
    }
  }

  if (input.startsWith("'")) {
    if (!input.endsWith("'")) {
      throw new FrontmatterError('single-quoted string is not closed', filePath, lineNumber);
    }
    return input.slice(1, -1).replaceAll("''", "'");
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;
  if (input === 'true') return true;
  if (input === 'false') return false;
  if (input === 'null') return null;
  if (/^-?(?:\d+|\d*\.\d+)$/.test(input)) return Number(input);
  return input;
}

function splitInlineArray(input) {
  const values = [];
  let buffer = '';
  let quote = '';
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }
    if (char === '\\' && quote === '"') {
      buffer += char;
      escaped = true;
      continue;
    }
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? '' : char;
      buffer += char;
      continue;
    }
    if (char === ',' && !quote) {
      values.push(buffer.trim());
      buffer = '';
      continue;
    }
    buffer += char;
  }

  if (quote) throw new FrontmatterError('quote inside inline array is not closed');
  if (buffer.trim() || input.trim()) values.push(buffer.trim());
  return values.filter((item) => item !== '');
}
