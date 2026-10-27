import { test, expect, TOC_POST, CODE_POST } from './fixtures';

test('the stuck table of contents names the section being read', async ({ page }) => {
  await page.goto(TOC_POST);
  const current = page.locator('#table-of-contents [data-toc-current]');
  await expect(current).toHaveText('');
  // Jump most of the way down at once, as the End key or a link would.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7));
  const expected = await page.evaluate(() => [...document.querySelectorAll('.post-body :is(h2, h3, h4)[id]')].filter((h) => h.getBoundingClientRect().top <= innerHeight / 3).pop()?.textContent);
  expect(expected).toBeTruthy();
  await expect(current).toHaveText(expected!);
  await expect(current).toBeVisible();
  await expect(page.locator('#table-of-contents nav a[aria-current="location"]')).toHaveText(expected!);
});

test('code blocks copy their code', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(CODE_POST);
  const block = page.locator('.code-block').first();
  await block.scrollIntoViewIfNeeded();
  await block.hover();
  await block.locator('.code-copy').click();
  await expect(block.locator('.code-copy')).toHaveText('Copied!');
  const code = await block.locator('pre').innerText();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  // One button per block.
  await expect(page.locator('.code-copy')).toHaveCount(await page.locator('pre.astro-code').count());
});

test('reading progress tracks the scroll', async ({ page }) => {
  await page.goto(TOC_POST);
  const supported = await page.evaluate(() => CSS.supports('animation-timeline: scroll()'));
  test.skip(!supported, 'this browser has no scroll timelines');
  await page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) / 2));
  // Halfway down, the line has moved half its width in from the left.
  await expect.poll(() => page.evaluate(() => {
    const line = document.querySelector('.reading-progress')!;
    return Math.round(new DOMMatrix(getComputedStyle(line, '::before').transform).m41 / line.getBoundingClientRect().width * 100);
  })).toBe(-50);
});
