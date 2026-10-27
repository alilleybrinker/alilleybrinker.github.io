import { test, expect, TOC_POST, CODE_POST } from './fixtures';

test('the stuck table of contents names the section being read', async ({ page }) => {
  await page.goto(TOC_POST);
  const current = page.locator('#table-of-contents [data-toc-current]');
  await expect(current).toHaveText('');
  // Jump most of the way down at once, as the End key or a link would.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.7));
  // Paragraphs drawn after the jump take their real heights, which moves the
  // headings, so the heading being read is found as it is checked.
  const reading = () => page.evaluate(() => [...document.querySelectorAll('.post-body :is(h2, h3, h4)[id]')].filter((h) => h.getBoundingClientRect().top <= innerHeight / 3).pop()?.textContent);
  await expect.poll(async () => {
    const expected = await reading();
    return Boolean(expected) && (await current.textContent()) === expected && (await page.locator('#table-of-contents nav a[aria-current="location"]').textContent()) === expected;
  }).toBe(true);
  await expect(current).toBeVisible();
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
  // The line has moved in from the left as far as the page has scrolled. The
  // page's length settles a little as paragraphs are drawn, so this measures
  // against its length now rather than when it scrolled.
  await expect.poll(() => page.evaluate(() => {
    const line = document.querySelector('.reading-progress')!;
    const moved = 1 + new DOMMatrix(getComputedStyle(line, '::before').transform).m41 / line.getBoundingClientRect().width;
    const scrolled = scrollY / (document.documentElement.scrollHeight - innerHeight);
    return Math.round(Math.abs(moved - scrolled) * 100);
  })).toBe(0);
});
