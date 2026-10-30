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

test('the share panel copies the post’s link, saying so without changing size or name', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(CODE_POST);
  const button = page.getByRole('button', { name: 'Copy link' });
  await button.scrollIntoViewIfNeeded();
  // Its size, not its place: paragraphs above it are drawn lazily and can
  // settle as the page is read, moving the button without resizing it.
  const size = async () => {
    const { width, height } = (await button.boundingBox())!;
    return { width, height };
  };
  const before = await size();
  await button.click();
  await expect(button).toHaveAttribute('data-copied');
  await expect(button.locator('[data-copied-label]')).toHaveCSS('opacity', '1');
  expect(await size()).toEqual(before);
  await expect(page.getByRole('button', { name: 'Copy link' })).toHaveCount(1);
  await expect(page.locator('#copy-link-status')).toHaveText('Post link copied to the clipboard.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
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

test('a section heading links to itself, copies its address, and lands clear of the table of contents', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(TOC_POST);
  const heading = page.locator('.post-body h2[id]').nth(1);
  const id = await heading.getAttribute('id');
  const link = heading.locator('.heading-link');
  await expect(link).toHaveAttribute('aria-label', `Link to section: ${await heading.evaluate((h) => h.firstChild!.textContent)}`);
  await heading.hover();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(page.url());
  // Neither going to a section nor choosing one from the open list leaves the
  // stuck table of contents over its heading.
  const clear = (selector: string) => page.evaluate((selector) => document.querySelector(selector)!.getBoundingClientRect().top >= document.querySelector('#table-of-contents')!.getBoundingClientRect().bottom, selector);
  await expect.poll(() => clear(`#${id}`)).toBe(true);
  await page.locator('#table-of-contents summary').click();
  const target = page.locator('#table-of-contents nav a').nth(4);
  const hash = await target.getAttribute('href');
  await target.click();
  await expect(page.locator('#table-of-contents')).not.toHaveAttribute('open');
  await expect.poll(() => clear(hash!)).toBe(true);
});

test('a post prints as just the article, in the light theme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(TOC_POST);
  await page.evaluate(() => dispatchEvent(new Event('beforeprint')));
  await page.emulateMedia({ media: 'print', colorScheme: 'dark' });
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(false);
  for (const hidden of ['body > div > header', '#table-of-contents', '.post-end', '[aria-labelledby="keep-reading-heading"]', '.reading-progress']) {
    await expect(page.locator(hidden).first()).toBeHidden();
  }
  await expect(page.locator('.post-body h1')).toBeVisible();
  await expect(page.locator('.print-only')).toHaveText(`https://www.alilleybrinker.com${TOC_POST}`);
  await page.evaluate(() => dispatchEvent(new Event('afterprint')));
  expect(await page.evaluate(() => document.documentElement.classList.contains('dark'))).toBe(true);
});

test('selecting a passage offers it as a quote card, in whole words, to share', async ({ page, context }) => {
  await page.goto(TOC_POST);
  const paragraph = page.locator('.post-body > p').nth(2);
  await paragraph.scrollIntoViewIfNeeded();
  // Select from partway through the first word to partway through another.
  const quote = await paragraph.evaluate((p) => {
    const text = [...p.childNodes].find((node) => node.nodeType === Node.TEXT_NODE && node.textContent!.trim().split(/\s+/).length > 6)!;
    const range = document.createRange();
    const words = [...text.textContent!.matchAll(/\S+/g)];
    // One letter into the first word, to one letter before the end of the sixth.
    range.setStart(text, words[0].index! + 1);
    range.setEnd(text, words[5].index! + words[5][0].length - 1);
    getSelection()!.removeAllRanges();
    getSelection()!.addRange(range);
    return words.slice(0, 6).map((word) => word[0]).join(' ');
  });
  const pill = page.getByRole('button', { name: 'Share quote' });
  await expect(pill).toBeVisible();
  await pill.click();
  const dialog = page.getByRole('dialog', { name: 'Share quote' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('img')).toHaveAttribute('src', /^blob:/);
  await expect(dialog.locator('img')).toHaveAttribute('alt', new RegExp(quote.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const bluesky = dialog.getByRole('link', { name: 'Share on Bluesky' });
  expect(decodeURIComponent((await bluesky.getAttribute('href'))!)).toContain(`“${quote}”`);
  // Bluesky's share link takes only text, so opening it copies the card to
  // paste in.
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const opened = page.context().waitForEvent('page');
  await bluesky.click();
  await (await opened).close();
  await expect(dialog.locator('#quote-share-note')).toHaveText(/paste it into your Bluesky post/);
  await expect(dialog.locator('#quote-share-note')).toBeVisible();
  expect(await page.evaluate(async () => (await navigator.clipboard.read())[0].types)).toContain('image/png');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  // The title isn't the post's text to quote.
  await page.locator('h1').selectText();
  await expect(pill).toBeHidden();
});

test('on touch screens the quote pill docks at the bottom, clear of the system menu', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto(TOC_POST);
  const paragraph = page.locator('.post-body > p').nth(2);
  await paragraph.scrollIntoViewIfNeeded();
  await paragraph.evaluate((p) => {
    const range = document.createRange();
    range.selectNodeContents(p);
    getSelection()!.removeAllRanges();
    getSelection()!.addRange(range);
  });
  const pill = page.getByRole('button', { name: 'Share quote' });
  await expect(pill).toBeVisible();
  // Centered, near the bottom, wherever the selection is.
  const box = (await pill.boundingBox())!;
  expect(Math.abs(box.x + box.width / 2 - 195)).toBeLessThan(2);
  expect(844 - (box.y + box.height)).toBeLessThan(40);
  await pill.tap();
  await expect(page.getByRole('dialog', { name: 'Share quote' })).toBeVisible();
  await context.close();
});
