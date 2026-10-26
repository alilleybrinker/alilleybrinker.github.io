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
// `before` is the text that precedes this text, so a quote at its start can
// tell which way it faces.
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

export default function rehypeTypeset() {
  return (tree: Node) => {
    let previous = '';
    // Raw HTML written into a post arrives as a string. Only the text between
    // its tags is typeset, never attributes, and never inside code.
    const typesetRaw = (html: string) => {
      let verbatim = 0;
      return html.split(/(<[^>]*>)/).map((part, index) => {
        if (index % 2 === 1) {
          const tag = part.match(/^<(\/?)([a-z0-9]+)/i);
          if (tag && VERBATIM.has(tag[2].toLowerCase()) && !part.endsWith('/>')) verbatim += tag[1] ? -1 : 1;
          if (tag && !tag[1] && BLOCKS.has(tag[2].toLowerCase())) previous = '';
          return part;
        }
        if (verbatim > 0 || !part) return part;
        const text = smartQuotes(part, previous);
        previous = text.slice(-1) || previous;
        return text.replace(/\s*—\s*/g, '<span class="em-dash">—</span>');
      }).join('');
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
  };
}
