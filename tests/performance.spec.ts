import { test, expect, TOC_POST } from './fixtures';

// A frame takes 8.3ms at 120fps. A task of 50ms or more on the main thread (a
// "long task") drops several frames at once, and none of these interactions
// should ever cause one.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__longTasks = [];
    new PerformanceObserver((list) => (window as any).__longTasks.push(...list.getEntries().map((entry) => Math.round(entry.duration)))).observe({ type: 'longtask' });
  });
});

const longTasks = (page: import('@playwright/test').Page) => page.evaluate(() => (window as any).__longTasks.splice(0));

test('scrolling through a post', async ({ page }) => {
  await page.goto(TOC_POST);
  await longTasks(page);
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 300);
    await page.waitForTimeout(20);
  }
  expect(await longTasks(page)).toEqual([]);
});

test('moving across the list of posts, typing in the palette, and opening a post', async ({ page }) => {
  await page.goto('/');
  await longTasks(page);
  const links = page.locator('a:has([data-post-title])');
  for (let i = 0; i < 10; i++) {
    const box = (await links.nth(i).boundingBox())!;
    await page.mouse.move(box.x + 30, box.y + 5, { steps: 3 });
    await page.waitForTimeout(80);
  }
  expect(await longTasks(page), 'moving across the list').toEqual([]);
  await page.keyboard.press('Control+k');
  await page.keyboard.type('memory safety', { delay: 40 });
  await page.keyboard.press('Escape');
  expect(await longTasks(page), 'typing in the palette').toEqual([]);
  await links.nth(2).click();
  await page.waitForTimeout(800);
  expect(await longTasks(page), 'opening a post').toEqual([]);
});
