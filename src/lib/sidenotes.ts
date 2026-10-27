import type { Element, ElementContent, Root } from 'hast';
import { visit } from 'unist-util-visit';

// Copies each Markdown footnote into a sidenote beside its reference, for
// screens wide enough to show it in the margin (see .sidenote in
// global.css). The footnotes at the end stay as they are: screen readers and
// narrower screens use them, and the sidenotes are hidden from both.
export default function rehypeSidenotes() {
  return (tree: Root) => {
    const notes = new Map<string, ElementContent[]>();
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'section' || !('dataFootnotes' in node.properties)) return;
      visit(node, 'element', (item) => {
        if (item.tagName !== 'li' || typeof item.properties.id !== 'string') return;
        notes.set(item.properties.id, item.children.filter((child) => child.type !== 'text' || child.value.trim()).flatMap(inline));
      });
    });
    if (notes.size === 0) return;

    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'sup' || index === undefined || !parent) return;
      const reference = node.children.find((child): child is Element => child.type === 'element' && 'dataFootnoteRef' in child.properties);
      const id = String(reference?.properties.href ?? '').slice(1);
      const note = notes.get(id);
      if (!reference || !note) return;
      const number = reference.children.find((child) => child.type === 'text');
      parent.children.splice(index + 1, 0, {
        type: 'element',
        tagName: 'span',
        properties: { className: ['sidenote'], ariaHidden: 'true', dataSidenote: id },
        children: [
          { type: 'element', tagName: 'span', properties: { className: ['sidenote-number'] }, children: number ? [structuredClone(number)] : [] },
          ...structuredClone(note),
        ],
      });
      return index + 2;
    });
  };
}

// A sidenote sits inside a paragraph, so its own paragraphs become spans set
// as blocks, and the links back to the reference are dropped.
function inline(node: ElementContent): ElementContent[] {
  if (node.type !== 'element') return [node];
  if ('dataFootnoteBackref' in node.properties) return [];
  const children = node.children.flatMap(inline);
  if (node.tagName === 'p') return [{ type: 'element', tagName: 'span', properties: { className: ['sidenote-paragraph'] }, children }];
  return [{ ...node, children }];
}
