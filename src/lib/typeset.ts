// Typographic fixes applied to post text, and to the titles and descriptions
// that front matter supplies.

// A quote is an opening one when nothing, a space, an opening bracket or quote,
// or a dash comes before it.
const OPENS_AFTER = /^$|[\s([{“‘—–-]$/u;

// A quote before a decade, as in "’90s", stands for the missing digits.
const DECADE = /^\d\ds\b/;

// Curls straight quotes left in text. Markdown's own smart quotes already curl
// most of them, but not those in raw HTML or front matter. Also turns curled
// opening quotes that are really apostrophes into apostrophes: right after a
// letter, digit or symbol, as in "C++‘s", or before a decade, as in "‘90s".
// And it turns a closing double quote at the start of a block or after a space
// into an opening one: Markdown curls a quote that starts a heading or table
// cell the wrong way. `before` is the text that precedes this text, so a quote
// at its start can tell which way it faces.
export function smartQuotes(text: string, before = '') {
  let result = '';
  let previous = before.slice(-1);
  const chars = [...text];
  chars.forEach((char, index) => {
    const opens = OPENS_AFTER.test(previous);
    const decade = DECADE.test(chars.slice(index + 1, index + 5).join(''));
    if (char === '"') result += opens ? '“' : '”';
    else if (char === "'") result += opens && !decade ? '‘' : '’';
    else if (char === '‘' && (decade || /[\p{L}\p{N}+#]/u.test(previous))) result += '’';
    else if (char === '”' && /^$|\s$/u.test(previous)) result += '“';
    else result += char;
    previous = result.slice(-1);
  });
  return result;
}

// For plain-text titles and descriptions: curled quotes and closed em dashes.
export function typesetText(text: string) {
  return smartQuotes(text).replace(/\s*—\s*/g, '—');
}

type Node = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: Node[];
};

// Text inside these is left exactly as written.
const VERBATIM = new Set(['code', 'pre', 'kbd', 'samp', 'script', 'style', 'svg', 'math']);
// A new block starts fresh, so a quote at its start opens.
const BLOCKS = new Set(['p', 'li', 'blockquote', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td', 'th', 'dt', 'dd', 'figcaption', 'aside', 'div', 'section']);

// Em dashes are closed up and set in a span that CSS gives a hair of space on
// either side. A hair space character would do the same, but Public Sans has
// none, so it would fall back to another font's.
function splitDashes(value: string): Node[] {
  const parts = value.split(/\s*—\s*/);
  if (parts.length === 1) return [{ type: 'text', value }];
  return parts.flatMap((part, index) => [
    ...(index > 0 ? [{ type: 'element', tagName: 'span', properties: { className: ['em-dash'] }, children: [{ type: 'text', value: '—' }] }] : []),
    ...(part ? [{ type: 'text', value: part }] : []),
  ]);
}

// Paragraphs and quotes that open with a quotation mark get a class that pulls
// the mark into the margin by its own width, so the text's left edge stays
// straight. CSS sets the widths.
const HANGS = new Set(['p', 'blockquote']);

// Raw HTML may write the mark as an entity.
function hangClass(text: string) {
  const start = text.trimStart();
  if (/^(“|&ldquo;|&#8220;|&#x201c;)/i.test(start)) return 'hang-double';
  if (/^(‘|&lsquo;|&#8216;|&#x2018;)/i.test(start)) return 'hang-single';
  return undefined;
}

function addClass(tag: string, name: string) {
  return /\sclass="/.test(tag)
    ? tag.replace(/\sclass="/, (attribute) => `${attribute}${name} `)
    : tag.replace(/^<([a-z0-9]+)/i, `<$1 class="${name}"`);
}

// The start of the first text in a node, or '' when code comes first.
function firstText(node: Node): string | undefined {
  for (const child of node.children ?? []) {
    if (child.type === 'text' && child.value?.trim()) return child.value.trimStart();
    if (child.type === 'element') {
      if (child.tagName && VERBATIM.has(child.tagName)) return '';
      const text = firstText(child);
      if (text !== undefined) return text;
    }
  }
  return undefined;
}

function markHangingQuotes(node: Node) {
  for (const child of node.children ?? []) {
    if (child.type !== 'element') continue;
    // A quote's own paragraphs are marked instead, so it isn't indented twice.
    const holdsParagraphs = child.children?.some((c) => c.type === 'element' && c.tagName === 'p');
    const hang = child.tagName && HANGS.has(child.tagName) && !holdsParagraphs ? hangClass(firstText(child) ?? '') : undefined;
    if (hang) {
      const classes = child.properties?.className;
      child.properties = { ...child.properties, className: [...(Array.isArray(classes) ? classes : []), hang] };
    }
    markHangingQuotes(child);
  }
}

export default function rehypeTypeset() {
  return (tree: Node) => {
    let previous = '';
    // Raw HTML written into a post arrives as a string. Only the text between
    // its tags is typeset, never attributes, and never inside code.
    const typesetRaw = (html: string) => {
      const parts = html.split(/(<[^>]*>)/);
      let verbatim = 0;
      // The opening tag of a paragraph or quote whose text hasn't started yet.
      let opening: number | undefined;
      parts.forEach((part, index) => {
        if (index % 2 === 1) {
          const tag = part.match(/^<(\/?)([a-z0-9]+)/i);
          const name = tag?.[2].toLowerCase() ?? '';
          if (tag && VERBATIM.has(name) && !part.endsWith('/>')) verbatim += tag[1] ? -1 : 1;
          if (tag && !tag[1] && BLOCKS.has(name)) previous = '';
          if (tag && !tag[1] && HANGS.has(name)) opening = index;
          return;
        }
        if (verbatim > 0 || !part.trim()) return;
        const text = smartQuotes(part, previous);
        previous = text.slice(-1) || previous;
        const hang = opening === undefined ? undefined : hangClass(text);
        if (hang && opening !== undefined) parts[opening] = addClass(parts[opening], hang);
        opening = undefined;
        parts[index] = text.replace(/\s*—\s*/g, '<span class="em-dash">—</span>');
      });
      return parts.join('');
    };
    const visit = (node: Node) => {
      if (node.tagName && VERBATIM.has(node.tagName)) {
        // Code reads as a word, so a quote right after it closes.
        previous = 'x';
        return;
      }
      if (node.tagName && BLOCKS.has(node.tagName)) previous = '';
      if (!node.children) return;
      node.children = node.children.flatMap((child) => {
        if (child.type === 'raw') return [{ ...child, value: typesetRaw(child.value ?? '') }];
        if (child.type !== 'text') {
          visit(child);
          return [child];
        }
        const value = smartQuotes(child.value ?? '', previous);
        previous = value.slice(-1) || previous;
        return splitDashes(value);
      });
    };
    visit(tree);
    markHangingQuotes(tree);
  };
}
