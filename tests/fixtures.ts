import { test as base, expect, type Page } from '@playwright/test';

// Every test runs without analytics, and fails on any uncaught page error.
export const test = base.extend<{ errors: string[] }>({
  errors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.route(/simpleanalytics/, (route) => route.abort());
    await use(errors);
    expect(errors, 'uncaught errors on the page').toEqual([]);
  }, { auto: true }],
});

export { expect };

// Posts the checks rely on: one with a table of contents and one with code.
export const POST = '/blog/cpp-must-become-safer/';
export const TOC_POST = '/blog/open-source-software-and-corporate-influence/';
export const CODE_POST = '/blog/monomorphization-bloat/';

// A link to a post in the home page's list of posts.
export const listedPost = (page: Page, title: RegExp) => page.locator('a:has([data-post-title])', { hasText: title }).first();

// Marks the document, so a check can tell a client-side navigation, which
// keeps it, from a full page load, which replaces it.
export const markDocument = (page: Page) => page.evaluate(() => { (window as any).__sameDocument = true; });
export const sameDocument = (page: Page) => page.evaluate(() => Boolean((window as any).__sameDocument));
