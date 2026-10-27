import { test, expect, POST } from './fixtures';

// Every element with its own visible text meets WCAG AA contrast against the
// background actually behind it, blending translucent backgrounds up the tree.
const PAGES = ['/', POST, '/about/', '/projects/', '/topics/rust/', '/colophon/'];

for (const scheme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`text contrast on ${path} (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      const failures = await page.evaluate(() => {
        const context = Object.assign(document.createElement('canvas'), { width: 1, height: 1 }).getContext('2d', { willReadFrequently: true })!;
        const rgba = (color: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = '#000';
          context.fillStyle = color;
          context.fillRect(0, 0, 1, 1);
          const [r, g, b, a] = context.getImageData(0, 0, 1, 1).data;
          return [r, g, b, a / 255];
        };
        const over = (top: number[], under: number[]) => [0, 1, 2].map((i) => top[i] * top[3] + under[i] * (1 - top[3])).concat(1);
        const luminance = ([r, g, b]: number[]) => {
          const channel = (v: number) => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const background = (element: Element) => {
          const chain: Element[] = [];
          for (let e: Element | null = element; e; e = e.parentElement) chain.unshift(e);
          return chain.reduce((behind, e) => {
            const color = rgba(getComputedStyle(e).backgroundColor);
            return color[3] > 0 ? over(color, behind) : behind;
          }, [255, 255, 255, 1]);
        };
        const failures: string[] = [];
        for (const element of document.querySelectorAll('body *')) {
          if (element.closest('#link-preview, [hidden], noscript, dialog:not([open]), .sr-only, details:not([open]) > :not(summary)')) continue;
          const text = [...element.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE).map((node) => node.textContent).join('').trim();
          if (!text) continue;
          const style = getComputedStyle(element);
          if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue;
          const box = element.getBoundingClientRect();
          if (!box.width || !box.height) continue;
          const behind = background(element);
          const [lighter, darker] = [luminance(over(rgba(style.color), behind)), luminance(behind)].sort((a, b) => b - a);
          const ratio = (lighter + 0.05) / (darker + 0.05);
          const size = parseFloat(style.fontSize);
          const needed = size >= 24 || (Number(style.fontWeight) >= 700 && size >= 18.66) ? 3 : 4.5;
          if (ratio < needed) failures.push(`${ratio.toFixed(2)}:1 (needs ${needed}) "${text.slice(0, 30)}" ${element.getAttribute('class') ?? element.tagName}`);
        }
        return failures;
      });
      expect(failures).toEqual([]);
    });
  }
}
