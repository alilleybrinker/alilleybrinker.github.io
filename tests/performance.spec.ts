import { test, expect, TOC_POST } from './fixtures';

// A frame takes 8.3ms at 120fps. A task of 50ms or more on the main thread (a
// "long task") drops several frames at once, and none of these interactions
// should ever cause one.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__longTasks = [];
    new PerformanceObserver((list) => (window as any).__longTasks.push(...list.getEntries())).observe({ type: 'longtask' });
    document.addEventListener('astro:page-load', () => { (window as any).__pageLoadedAt = performance.now(); });
  });
});

// The long tasks since the last check, by duration; or only those that began
// after the current page finished loading.
const longTasks = (page: import('@playwright/test').Page, { afterPageLoad = false } = {}) => page.evaluate((afterPageLoad) => {
  const since = afterPageLoad ? (window as any).__pageLoadedAt : 0;
  return (window as any).__longTasks.splice(0).filter((task: PerformanceEntry) => task.startTime >= since).map((task: PerformanceEntry) => Math.round(task.duration));
}, afterPageLoad);

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
  // Swapping in the new page is load work, done while the browser holds the
  // old page still on screen, so it drops no frames and is left out; the title
  // morph that follows is what has to stay smooth.
  await links.nth(2).click();
  await page.waitForURL(/\/blog\//);
  await page.waitForTimeout(800);
  expect(await longTasks(page, { afterPageLoad: true }), 'the title morph after opening a post').toEqual([]);
});
