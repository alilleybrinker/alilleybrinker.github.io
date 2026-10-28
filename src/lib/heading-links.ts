import type { Element, Root } from 'hast';
import GithubSlugger from 'github-slugger';
import { visit } from 'unist-util-visit';

// Gives each section heading in a post (h2 to h4) a link to itself, for
// sharing a section rather than the whole post. The link holds no text, so
// headings read the same everywhere their text is used (the table of contents,
// search); its "#" is drawn by .heading-link in global.css, and its name says
// what it's for.
//
// Astro gives headings their ids only after this runs, so it gives them the
// same ids first: Astro's slugger over the same text, through every heading in
// order so repeated headings are numbered alike. Astro keeps an id it finds.
export default function rehypeHeadingLinks() {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    visit(tree, 'element', (node) => {
      const depth = /^h([1-6])$/.exec(node.tagName)?.[1];
      if (!depth) return;
      const text = textOf(node);
      if (typeof node.properties.id !== 'string') node.properties.id = slugger.slug(text);
      if (Number(depth) < 2 || Number(depth) > 4) return;
      node.children.push({
        type: 'element',
        tagName: 'a',
        properties: { className: ['heading-link'], href: `#${node.properties.id}`, ariaLabel: `Link to section: ${text.trim()}` },
        children: [],
      });
    });
  };
}

// Text as Astro reads it for an id: every text node within the heading.
function textOf(node: Element): string {
  return node.children.map((child) => (child.type === 'text' ? child.value : child.type === 'element' ? textOf(child) : '')).join('');
}
