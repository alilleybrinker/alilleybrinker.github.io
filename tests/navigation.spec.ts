import { test, expect, POST, listedPost, markDocument, sameDocument } from './fixtures';

test('opening a post from the list is a client-side navigation with a title morph', async ({ page }) => {
  await page.goto('/');
  await markDocument(page);
  // Records the view transition names on each side of the next transition.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    const names = () => [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).viewTransitionName).filter((name) => name && name !== 'none');
    document.startViewTransition = ((update: any) => {
      const record: any = { before: names() };
      (window as any).__transition = record;
      const transition = start(update);
      transition.ready.then(() => { record.after = names(); }, (error) => { record.error = String(error); });
      return transition;
    }) as typeof document.startViewTransition;
  });
  const link = listedPost(page, /^C\+\+ Must Become Safer/);
  await link.scrollIntoViewIfNeeded();
  await link.click();
  await expect(page).toHaveURL(POST);
  await expect(page.locator('h1')).toContainText('C++ Must Become Safer');
  expect(await sameDocument(page)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__transition?.after)).toBeTruthy();
  const transition = await page.evaluate(() => (window as any).__transition);
  expect(transition.error).toBeUndefined();
  // Exactly one title carries the morph on each side.
  expect(transition.before.filter((name: string) => name === 'post-title')).toHaveLength(1);
  expect(transition.after.filter((name: string) => name === 'post-title')).toHaveLength(1);
});

test('the theme holds across navigation', async ({ page }) => {
  await page.goto('/');
  const dark = () => page.evaluate(() => document.documentElement.classList.contains('dark'));
  const before = await dark();
  await page.locator('header .theme-switcher >> visible=true').click();
  expect(await dark()).toBe(!before);
  await page.locator('header a[href="/about/"] >> visible=true').click();
  await expect(page).toHaveURL('/about/');
  expect(await dark()).toBe(!before);
  await page.reload();
  expect(await dark()).toBe(!before);
});

test('a link to another post previews it on hover, and each page keeps one preview card', async ({ page }) => {
  // "The Problem is New Code" links to "C++ Must Become Safer" in its text.
  await page.goto('/blog/the-problem-is-new-code/');
  const link = page.locator('.post-body a[href$="/blog/cpp-must-become-safer/"]').first();
  await link.scrollIntoViewIfNeeded();
  await link.hover();
  await expect(page.locator('#link-preview')).toBeVisible();
  await expect(page.locator('#link-preview')).toContainText('C++ Must Become Safer');
  // The link is to the site's full address, so leave by the header instead.
  await page.locator('header a.site-logo').click();
  await expect(page).toHaveURL('/');
  await expect(page.locator('#link-preview')).toHaveCount(1);
  await expect(page.locator('#link-preview')).toBeHidden();
});

test('a post ends with posts to read next, which open with a title morph, as does going back', async ({ page }) => {
  await page.goto(POST);
  await markDocument(page);
  const next = page.locator('section[aria-labelledby="keep-reading-heading"] a');
  await expect(next).toHaveCount(3);
  // Records the view transition names on each side of each transition.
  await page.evaluate(() => {
    const start = document.startViewTransition.bind(document);
    const names = () => [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).viewTransitionName).filter((name) => name && name !== 'none');
    document.startViewTransition = ((update: any) => {
      const record: any = { before: names() };
      (window as any).__transitions = [...((window as any).__transitions ?? []), record];
      const transition = start(update);
      transition.ready.then(() => { record.after = names(); }, (error) => { record.error = String(error); });
      return transition;
    }) as typeof document.startViewTransition;
  });
  // The first of them on this site; others may be published elsewhere.
  const first = next.and(page.locator('[href^="/blog/"]')).first();
  const title = await first.locator('[data-post-title]').textContent();
  await first.scrollIntoViewIfNeeded();
  await first.click();
  await expect(page.locator('h1')).toContainText(title!);
  await page.goBack();
  await expect(page).toHaveURL(POST);
  expect(await sameDocument(page)).toBe(true);
  await expect.poll(() => page.evaluate(() => (window as any).__transitions?.[1]?.after)).toBeTruthy();
  const transitions = await page.evaluate(() => (window as any).__transitions);
  for (const transition of transitions) {
    expect(transition.error).toBeUndefined();
    // Exactly one title carries the morph on each side.
    expect(transition.before.filter((name: string) => name === 'post-title')).toHaveLength(1);
    expect(transition.after.filter((name: string) => name === 'post-title')).toHaveLength(1);
  }
});

test('a post links to the posts just older and newer, which link back to it', async ({ page }) => {
  const sequence = () => page.getByRole('navigation', { name: 'Older and newer posts' });
  await page.goto(POST);
  const newer = await sequence().locator('a[rel="next"]').getAttribute('href');
  const date = await page.locator('h1 time').first().getAttribute('datetime');
  await sequence().locator('a[rel="prev"]').click();
  await expect(sequence().locator('a[rel="next"]')).toHaveAttribute('href', POST);
  expect(await page.locator('h1 time').first().getAttribute('datetime') <= date!).toBe(true);
  await page.goto(newer!);
  await expect(sequence().locator('a[rel="prev"]')).toHaveAttribute('href', POST);
});

test('the topics page lists every topic, reached from the Topics menu and from each topic', async ({ page }) => {
  await page.goto('/');
  await page.locator('.topics-menu summary').click();
  const menuTopics = await page.locator('.topics-menu ul a[href^="/topics/"]:not([href="/topics/"])').count();
  await page.getByRole('link', { name: 'All topics' }).click();
  await expect(page).toHaveURL('/topics/');
  await expect(page.locator('h1')).toHaveText('Topics');
  await expect(page.locator('.topic-row')).toHaveCount(menuTopics);
  await page.locator('.topic-row').first().click();
  await page.getByRole('link', { name: 'Topics', exact: true }).last().click();
  await expect(page).toHaveURL('/topics/');
});
