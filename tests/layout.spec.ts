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

// iOS draws a home-screen icon's transparent pixels black, which hid the
// line-art face on a black square.
test('the home-screen and tab icons are opaque', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page.locator('link[rel="apple-touch-icon"], link[rel="icon"][type="image/png"]').evaluateAll((links) => links.map((link) => link.getAttribute('href')!));
  expect(hrefs.length).toBe(3);
  for (const href of hrefs) {
    const minAlpha = await page.evaluate(async (src) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = Object.assign(document.createElement('canvas'), { width: img.width, height: img.height });
      const context = canvas.getContext('2d')!;
      context.drawImage(img, 0, 0);
      const { data } = context.getImageData(0, 0, img.width, img.height);
      let min = 255;
      for (let i = 3; i < data.length; i += 4) min = Math.min(min, data[i]);
      return min;
    }, href);
    expect(minAlpha, href).toBe(255);
  }
});

test('every page but the home page and 404 shares an image of its own', async ({ page, request }) => {
  const seen = new Set<string>();
  for (const path of ['/about/', '/projects/', '/reading/', '/colophon/', '/topics/', '/talks/', '/talks/a-tale-of-teaching-rust/', POST]) {
    await page.goto(path);
    const image = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(image, path).not.toMatch(/\/social\/home\.png$/);
    expect(seen.has(image!), `${path} shares ${image} with another page`).toBe(false);
    seen.add(image!);
    const response = await request.get(new URL(image!).pathname);
    expect(response.status(), image!).toBe(200);
    expect(response.headers()['content-type']).toBe('image/png');
  }
});

test('About lists every place to find Andrew, each with a pixel mark, and fills in live counts', async ({ page }) => {
  await page.route(/public\.api\.bsky\.app|api\.github\.com/, (route) => route.fulfill({
    contentType: 'application/json',
    body: route.request().url().includes('bsky') ? '{"followersCount":1234}' : '{"public_repos":54}',
  }));
  await page.goto('/about/');
  const places = page.locator('[data-contact-list] .contact-link');
  await expect(places).toHaveCount(7);
  for (const name of ['Bluesky', 'GitHub', 'Mastodon', 'LinkedIn', 'Hacker News', 'Lobste.rs', 'Reddit']) {
    await expect(places.filter({ hasText: name })).toHaveCount(1);
  }
  await expect(places.first()).toContainText('Message me on Bluesky for my Signal username to chat.');
  expect(await page.locator('.contact-mark').first().locator('rect').count()).toBeGreaterThan(40);
  await expect(page.locator('[data-contact-live="bluesky"]')).toHaveText('1.2K followers');
  await expect(page.locator('[data-contact-live="github"]')).toHaveText('54 repos');
});
