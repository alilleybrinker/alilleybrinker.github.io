import { test, expect, POST, TOC_POST } from './fixtures';

const PAGES = ['/', POST, TOC_POST, '/about/', '/projects/', '/reading/', '/topics/rust/'];

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const path of PAGES) {
    test(`${path} doesn't scroll sideways`, async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    });
  }

  test('the menu opens above the page', async ({ page }) => {
    await page.goto(POST);
    await page.locator('summary', { hasText: 'Menu' }).click();
    const about = page.locator('header a[href="/about/"] >> visible=true');
    const box = (await about.boundingBox())!;
    // Whatever is on top at the link's center is the link itself.
    const top = await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest('a')?.getAttribute('href'), [box.x + box.width / 2, box.y + box.height / 2]);
    expect(top).toBe('/about/');
  });
});
