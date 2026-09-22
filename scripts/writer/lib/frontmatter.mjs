// Minimal YAML reader/writer for the subset of front matter this site uses:
// scalars, nested maps, and sequences of scalars. Anything richer (block
// scalars, anchors, nested sequences) is rejected so callers can fall back to
// editing the raw front matter text instead of mangling it.
//
// Writing is deliberately surgical: `updatePost` re-emits only the keys whose
// values changed, so saving a post never reflows front matter you did not edit.

export class FrontmatterError extends Error {}

const DELIMITER = /^---[ \t]*$/;
const WRAP_WIDTH = 78;

// Front matter keys are emitted in the order the site's own posts use, with any
// key this UI does not know about preserved between them and the nested maps.
const KEY_ORDER = ['title', 'description', 'externalUrl', 'publication', 'publicationTitle', 'readingTime', 'unlisted'];
const TRAILING_KEYS = ['taxonomies', 'extra'];
// Keys the existing posts always quote, even when YAML would not require it.
const ALWAYS_QUOTED = new Set(['description', 'externalUrl', 'publication', 'publicationTitle']);

function keyRank(key) {
  const known = KEY_ORDER.indexOf(key);
  if (known !== -1) return known;
  const trailing = TRAILING_KEYS.indexOf(key);
  if (trailing !== -1) return 200 + trailing;
  return 100;
}

export function splitFrontmatter(raw) {
  const text = raw.replace(/^﻿/, '');
  const lines = text.split('\n');
  if (!DELIMITER.test(lines[0] ?? '')) return { yaml: null, body: text };
  const end = lines.findIndex((line, index) => index > 0 && DELIMITER.test(line));
  if (end === -1) throw new FrontmatterError('Front matter is missing its closing "---".');
  return { yaml: lines.slice(1, end).join('\n'), body: lines.slice(end + 1).join('\n').replace(/^\n/, '') };
}

export function parseFrontmatter(raw) {
  const { yaml, body } = splitFrontmatter(raw);
  if (yaml === null) return { data: {}, body, yaml: null, spans: [] };
  const { data, spans } = parseYaml(yaml);
  return { data, body, yaml, spans };
}

export function parseYaml(yaml) {
  const lines = yaml.split('\n');
  const entries = [];
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.includes('\t')) throw new FrontmatterError(`Tabs are not supported (line ${index + 1}).`);
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    entries.push({ indent: line.length - line.trimStart().length, text: line.trim(), row: index });
  }
  if (entries.length === 0) return { data: {}, spans: [] };
  const spans = [];
  const [data, next] = parseMap(entries, 0, entries[0].indent, spans);
  if (next < entries.length) throw new FrontmatterError(`Unexpected indentation on line ${entries[next].row + 1}.`);
  // Extend each key's span up to the line before the next key so blank lines
  // and comments between keys survive a save untouched.
  for (let index = 0; index < spans.length; index += 1) {
    const isLast = index === spans.length - 1;
    spans[index].end = isLast ? lines.length - 1 : spans[index + 1].start - 1;
    spans[index].text = lines.slice(spans[index].start, spans[index].end + 1).join('\n');
  }
  return { data, spans };
}

function parseBlock(entries, start, indent) {
  if (start >= entries.length) return [null, start];
  if (entries[start].text.startsWith('- ') || entries[start].text === '-') return parseSequence(entries, start, indent);
  return parseMap(entries, start, indent);
}

function parseMap(entries, start, indent, spans) {
  const map = {};
  let index = start;
  while (index < entries.length && entries[index].indent >= indent) {
    const entry = entries[index];
    if (entry.indent > indent) throw new FrontmatterError(`Unexpected indentation on line ${entry.row + 1}.`);
    const match = entry.text.match(/^([A-Za-z0-9_][A-Za-z0-9_-]*):(?:[ \t]+(.*))?$/);
    if (!match) throw new FrontmatterError(`Cannot read line ${entry.row + 1}: ${entry.text}`);
    const [, key, rawValue] = match;
    if (key in map) throw new FrontmatterError(`Duplicate key "${key}" on line ${entry.row + 1}.`);
    if (rawValue === undefined || rawValue.trim() === '') {
      const nested = index + 1;
      if (nested < entries.length && entries[nested].indent > indent) {
        const [value, next] = parseBlock(entries, nested, entries[nested].indent);
        map[key] = value;
        index = next;
      } else {
        map[key] = null;
        index += 1;
      }
    } else {
      const [value, next] = parseValue(entries, index, rawValue.trim());
      map[key] = value;
      index = next;
    }
    if (spans) spans.push({ key, value: map[key], start: entry.row, end: entry.row, text: '' });
  }
  return [map, index];
}

function parseSequence(entries, start, indent) {
  const items = [];
  let index = start;
  while (index < entries.length && entries[index].indent === indent && (entries[index].text.startsWith('- ') || entries[index].text === '-')) {
    const entry = entries[index];
    const rawValue = entry.text === '-' ? '' : entry.text.slice(2).trim();
    if (rawValue === '') throw new FrontmatterError(`Nested sequences are not supported (line ${entry.row + 1}).`);
    const [value, next] = parseValue(entries, index, rawValue);
    items.push(value);
    index = next;
  }
  if (index < entries.length && entries[index].indent > indent) {
    throw new FrontmatterError(`Unexpected indentation on line ${entries[index].row + 1}.`);
  }
  return [items, index];
}

// Reads one scalar, consuming continuation lines when a quoted string is folded
// across several lines, as the descriptions in this repo are.
function parseValue(entries, index, rawValue) {
  const entry = entries[index];
  if (/^[|>]/.test(rawValue)) throw new FrontmatterError(`Block scalars are not supported (line ${entry.row + 1}).`);
  if (/^[&*{]/.test(rawValue)) throw new FrontmatterError(`Unsupported YAML syntax on line ${entry.row + 1}.`);
  const quote = rawValue[0] === '"' || rawValue[0] === "'" ? rawValue[0] : null;
  if (!quote) return [parseScalar(stripComment(rawValue), entry), index + 1];

  let text = rawValue;
  let cursor = index;
  while (!closesQuote(text, quote)) {
    cursor += 1;
    if (cursor >= entries.length || entries[cursor].indent <= entry.indent) {
      throw new FrontmatterError(`Unterminated quoted string starting on line ${entry.row + 1}.`);
    }
    text = `${text} ${entries[cursor].text}`;
  }
  return [unquote(text, quote), cursor + 1];
}

function closesQuote(text, quote) {
  if (text.length < 2) return false;
  let index = 1;
  while (index < text.length) {
    const char = text[index];
    if (quote === '"' && char === '\\') {
      index += 2;
      continue;
    }
    if (char === quote) {
      if (quote === "'" && text[index + 1] === "'") {
        index += 2;
        continue;
      }
      return text.slice(index + 1).trim() === '';
    }
    index += 1;
  }
  return false;
}

function unquote(text, quote) {
  const trimmed = text.trim();
  const inner = trimmed.slice(1, trimmed.lastIndexOf(quote));
  if (quote === "'") return inner.replace(/''/g, "'");
  return inner.replace(/\\(["\\/nrt])/g, (_, char) => {
    if (char === 'n') return '\n';
    if (char === 'r') return '\r';
    if (char === 't') return '\t';
    return char;
  });
}

function stripComment(value) {
  const match = value.match(/^(.*?)\s+#\s.*$/);
  return match ? match[1] : value;
}

function parseScalar(text, entry) {
  if (text === '' || text === 'null' || text === '~') return null;
  if (text === 'true') return true;
  if (text === 'false') return false;
  if (/^-?\d+$/.test(text)) return Number(text);
  if (/^-?\d*\.\d+$/.test(text)) return Number(text);
  if (text.startsWith('[')) {
    if (!text.endsWith(']')) throw new FrontmatterError(`Unterminated flow sequence on line ${entry.row + 1}.`);
    const inner = text.slice(1, -1).trim();
    if (inner === '') return [];
    if (/[[{]/.test(inner)) throw new FrontmatterError(`Nested flow sequences are not supported (line ${entry.row + 1}).`);
    return inner.split(',').map((item) => {
      const value = item.trim();
      const quote = value[0] === '"' || value[0] === "'" ? value[0] : null;
      return quote ? unquote(value, quote) : parseScalar(value, entry);
    });
  }
  return text;
}

export function serializeFrontmatter(data) {
  const keys = Object.keys(data)
    .filter((key) => data[key] !== undefined)
    .sort((a, b) => keyRank(a) - keyRank(b));
  return keys.flatMap((key) => emit(key, data[key], 0)).join('\n');
}

// Rebuilds front matter from `data`, reusing the original text of every key
// whose value is unchanged so untouched lines keep their exact formatting.
export function updateFrontmatter(data, spans) {
  const byKey = new Map(spans.map((span) => [span.key, span]));
  const blocks = [];
  for (const span of spans) {
    if (!(span.key in data) || data[span.key] === undefined) continue;
    const unchanged = isEqual(span.value, data[span.key]);
    blocks.push({ key: span.key, text: unchanged ? span.text : emit(span.key, data[span.key], 0).join('\n') });
  }
  const fresh = Object.keys(data).filter((key) => data[key] !== undefined && !byKey.has(key));
  for (const key of fresh.sort((a, b) => keyRank(a) - keyRank(b))) {
    const position = blocks.findIndex((block) => keyRank(block.key) > keyRank(key));
    const block = { key, text: emit(key, data[key], 0).join('\n') };
    if (position === -1) blocks.push(block);
    else blocks.splice(position, 0, block);
  }
  return blocks.map((block) => block.text).join('\n');
}

export function isEqual(a, b) {
  if (a === b) return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((item, index) => isEqual(item, b[index]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const keys = Object.keys(a);
    return keys.length === Object.keys(b).length && keys.every((key) => isEqual(a[key], b[key]));
  }
  return false;
}

function emit(key, value, depth) {
  const indent = '  '.repeat(depth);
  if (Array.isArray(value)) {
    if (value.length === 0) return [`${indent}${key}: []`];
    return [`${indent}${key}:`, ...value.map((item) => `${indent}  - ${formatScalar(item)}`)];
  }
  if (value !== null && typeof value === 'object') {
    const nested = Object.entries(value).flatMap(([nestedKey, nestedValue]) => emit(nestedKey, nestedValue, depth + 1));
    return [`${indent}${key}:`, ...nested];
  }
  if (typeof value === 'string' && value !== '') return wrapValue(`${indent}${key}: `, key, value, indent);
  return [`${indent}${key}: ${formatScalar(value)}`];
}

function formatScalar(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  return needsQuotes(value) ? quote(value) : value;
}

function needsQuotes(value) {
  if (value === '') return true;
  if (/^\s|\s$/.test(value)) return true;
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return true;
  if (/: |\s#/.test(value)) return true;
  if (/^(true|false|null|~|-?\d+(\.\d+)?)$/i.test(value)) return true;
  return false;
}

function quote(value) {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
}

// Long values are folded the way the existing posts fold descriptions: a quoted
// value continued on following lines with a two-space hanging indent.
function wrapValue(prefix, key, value, indent) {
  const mustQuote = needsQuotes(value) || ALWAYS_QUOTED.has(key);
  const bare = `${prefix}${value}`;
  if (!mustQuote && bare.length <= WRAP_WIDTH && !value.includes('\n')) return [bare];
  const quoted = quote(value);
  if (prefix.length + quoted.length <= WRAP_WIDTH || value.includes('\n')) return [`${prefix}${quoted}`];
  const lines = [];
  let current = prefix;
  let isFirst = true;
  for (const word of quoted.split(' ')) {
    const candidate = isFirst ? `${current}${word}` : `${current} ${word}`;
    if (!isFirst && candidate.length > WRAP_WIDTH) {
      lines.push(current);
      current = `${indent}  ${word}`;
    } else {
      current = candidate;
    }
    isFirst = false;
  }
  lines.push(current);
  return lines;
}

export function stringifyPost(data, body, spans) {
  const yaml = spans && spans.length > 0 ? updateFrontmatter(data, spans) : serializeFrontmatter(data);
  const trimmed = body.replace(/^\n+/, '').replace(/\s*$/, '');
  return trimmed === '' ? `---\n${yaml}\n---\n` : `---\n${yaml}\n---\n\n${trimmed}\n`;
}
