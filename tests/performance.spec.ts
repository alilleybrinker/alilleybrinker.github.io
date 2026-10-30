import { test, expect, TOC_POST } from './fixtures';

// A frame takes 8.3ms at 120fps. A frame held up 50ms or more drops several at
// once, and none of these interactions should ever cause one. What counts is
// the site's own work: its scripts, and the layout they force. CI draws pages
// in software and shares its CPU, so frames there sometimes run long with no
// script in them at all; those say nothing about the site, so they're left
// out. A slow frame is caught when the site's scripts in it take 50ms or more.
test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).__slowFrames = [];
    new PerformanceObserver((list) => {
      for (const frame of list.getEntries() as any[]) {
        const own = frame.scripts.filter((script: any) => !script.sourceURL || new URL(script.sourceURL, location.href).origin === location.origin);
        const time = own.reduce((total: number, script: any) => total + script.duration, 0);
        if (time >= 50) (window as any).__slowFrames.push({ startTime: frame.startTime, time });
      }
    }).observe({ type: 'long-animation-frame' });
    document.addEventListener('astro:page-load', () => { (window as any).__pageLoadedAt = performance.now(); });
  });
});

// The time the site's scripts took in each slow frame that began since the
// last check; or only in those that began after the current page finished
// loading. A frame is reported a little after it ends, so a check also leaves
// out frames reported late that began before the one before it.
const longTasks = (page: import('@playwright/test').Page, { afterPageLoad = false } = {}) => page.evaluate((afterPageLoad) => {
  const window_ = window as any;
  const since = Math.max(window_.__checkedAt ?? 0, afterPageLoad ? window_.__pageLoadedAt : 0);
  window_.__checkedAt = performance.now();
  return window_.__slowFrames.splice(0).filter((frame: { startTime: number }) => frame.startTime >= since).map((frame: { time: number }) => Math.round(frame.time));
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
