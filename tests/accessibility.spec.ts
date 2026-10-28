import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { test, expect, POST, TOC_POST, CODE_POST } from './fixtures';

// Every kind of page, and the things that open over them, pass axe's WCAG 2.2
// AA and best-practice rules in both themes.
const PAGES = ['/', POST, TOC_POST, CODE_POST, '/topics/rust/', '/topics/', '/about/', '/reading/', '/projects/', '/colophon/', '/talks/', '/404.html'];

const audit = async (page: Page) => {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
  return violations.map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.map((node) => node.target.join(' ')).join(', ')})`);
};

for (const scheme of ['light', 'dark'] as const) {
  for (const path of PAGES) {
    test(`${path} passes axe (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(path);
      expect(await audit(page)).toEqual([]);
    });
  }

  test(`the open command palette passes axe (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto('/');
    await page.keyboard.press('Control+k');
    await page.keyboard.type('rust');
    await expect(page.locator('#command-palette [role="option"]').first()).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test(`the open menus pass axe (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto('/');
    for (const summary of await page.locator('details:visible > summary').all()) {
      await summary.click();
      expect(await audit(page)).toEqual([]);
      await page.keyboard.press('Escape');
    }
  });
}

test('the first Tab reaches a link that skips to the page’s content', async ({ page }) => {
  await page.goto(TOC_POST);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press('Enter');
  // The next Tab goes into the post, past the header.
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => Boolean(document.activeElement?.closest('main')))).toBe(true);
});

test('in forced colors, pills and panels keep an edge and the portrait keeps its drawing', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await page.goto(POST);
  for (const selector of ['.share-action', 'aside[aria-labelledby="share-post-heading"]', '[data-command-palette-open]']) {
    await expect(page.locator(selector).first()).toHaveCSS('outline-style', 'solid');
  }
  await expect(page.locator('.site-logo-face').first()).toHaveCSS('forced-color-adjust', 'none');
});
