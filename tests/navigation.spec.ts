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

test('every page ends with a footer that names the newest post and opens search', async ({ page }) => {
  await page.goto(POST);
  const footer = page.locator('.site-footer');
  const latest = footer.getByRole('navigation').or(footer.locator('section')).locator('a').first();
  const href = await latest.getAttribute('href');
  expect(href).toMatch(/^(\/blog\/|https?:)/);
  for (const name of ['Bluesky', 'Topics', 'About', 'Colophon']) await expect(footer.getByRole('link', { name, exact: true })).toBeVisible();
  await expect(footer.getByText('Choose a feed')).toBeVisible();
  // The newest post's own page doesn't point at itself.
  if (href!.startsWith('/')) {
    await page.goto(href!);
    await expect(page.locator('.site-footer section a')).toHaveCount(0);
  }
  await footer.getByRole('button', { name: 'Search' }).click();
  await expect(page.locator('#command-palette')).toBeVisible();
});

test('a post in a series names its place and links the other parts', async ({ page }) => {
  await page.goto('/blog/gas-town-and-urbit/');
  const series = page.locator('.post-series');
  await expect(series.getByRole('heading')).toHaveText('Part 2 of 2');
  await expect(series.locator('[aria-current="page"]')).toHaveText('Gas Town is not Urbit');
  await series.getByRole('link', { name: 'Gas Town Decoded' }).click();
  await expect(page).toHaveURL('/blog/gas-town-decoded/');
  await expect(page.locator('.post-series h2')).toHaveText('Part 1 of 2');
  // A post in no series has no list.
  await page.goto('/blog/cpp-must-become-safer/');
  await expect(page.locator('.post-series')).toHaveCount(0);
});

test('the reading page offers its own feed', async ({ page, request }) => {
  await page.goto('/reading/');
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute('href', '/reading/rss.xml');
  const feed = await request.get('/reading/rss.xml');
  expect(feed.ok()).toBe(true);
  expect(await feed.text()).toContain('<title>Andrew Lilley Brinker: Reading</title>');
});

test('each talk has a page, reached from Talks in the header, whose recording loads only when played', async ({ page }) => {
  const youtube: string[] = [];
  await page.route(/youtube/, (route) => {
    youtube.push(route.request().url());
    return route.fulfill({ body: '<!doctype html><title>Player</title>' });
  });
  await page.goto('/');
  await page.locator('header').getByRole('link', { name: 'Talks', exact: true }).click();
  await expect(page).toHaveURL(/\/talks\/$/);
  await page.getByRole('link', { name: /A Tale of Teaching Rust/ }).click();
  await expect(page).toHaveURL(/\/talks\/a-tale-of-teaching-rust\/$/);
  await expect(page.locator('h1')).toContainText('A Tale of Teaching Rust');
  await expect(page.locator('.talk-plate-field path')).toHaveAttribute('d', /M/);
  expect(youtube).toEqual([]);
  await page.getByRole('link', { name: 'Play the recording' }).click();
  const frame = page.locator('[data-talk-plate] iframe');
  await expect(frame).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\/0PhfaFkzdBA\?/);
  await expect(page.getByRole('heading', { name: 'Other talks' })).toBeVisible();
});

test('a talk lists posts on its subject, and only strong matches', async ({ page }) => {
  await page.goto('/talks/memory-safety-and-the-future-of-vulnerabilities/');
  await expect(page.getByRole('heading', { name: 'Writing on this' })).toBeVisible();
  await expect(page.locator('section', { hasText: 'Writing on this' }).getByRole('link', { name: 'C++ Must Become Safer' })).toBeVisible();
  await page.goto('/talks/a-tale-of-teaching-rust/');
  await expect(page.getByRole('heading', { name: 'Writing on this' })).toHaveCount(0);
});

test('the talks page lists every talk, newest first, each opening its own page', async ({ page }) => {
  await page.goto('/talks/');
  await expect(page.locator('h1')).toHaveText('Talks');
  const titles = page.locator('.talk-row .dither-underline');
  await expect(titles).toHaveCount(4);
  await expect(titles.first()).toHaveText('Memory Safety and the Future of Vulnerabilities');
  await expect(titles.last()).toHaveText('Hello and Welcome: Documentation in the Rust Ecosystem');
  await page.getByRole('link', { name: /A Tale of Teaching Rust/ }).click();
  await expect(page).toHaveURL(/\/talks\/a-tale-of-teaching-rust\/$/);
});

test('coming back to a long post offers to pick up where the reader left off', async ({ page }) => {
  await page.goto(POST);
  await expect(page.locator('[data-resume]')).toBeHidden();
  const middle = await page.evaluate(() => (document.documentElement.scrollHeight - innerHeight) * 0.5);
  await page.evaluate((top) => scrollTo(0, top), middle);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('reading-places') ?? '{}'))).toHaveProperty([new URL(page.url()).pathname]);

  await page.goto('/');
  await page.goto(POST);
  const resume = page.locator('[data-resume]');
  await expect(resume).toBeVisible();
  await expect(page.locator('[data-resume-mark]')).toBeVisible();
  await page.getByRole('button', { name: 'Pick up where you left off' }).click();
  await expect(resume).toBeHidden();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(middle * 0.9);

  // Dismissing it forgets the place.
  await page.goto('/');
  await page.goto(POST);
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await page.goto('/');
  await page.goto(POST);
  await expect(resume).toBeHidden();
});

test('the AI policy has its own page, linked from the footer, and old links to it on About go there', async ({ page }) => {
  await page.goto('/');
  await page.locator('footer').getByRole('link', { name: 'AI Policy' }).click();
  await expect(page).toHaveURL(/\/ai\/$/);
  await expect(page.locator('h1')).toHaveText('AI Policy');
  await expect(page.getByText('The words on this site were written by Andrew with care.')).toBeVisible();
  await page.goto('/about/#ai-policy');
  await expect(page).toHaveURL(/\/ai\/$/);
  await page.goto('/about/#talks');
  await expect(page).toHaveURL(/\/talks\/$/);
});

test('the footer keeps feeds apart from profiles elsewhere, every feed in one menu', async ({ page, context, request }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  const follow = page.locator('footer nav[aria-labelledby="footer-follow-heading"]');
  await expect(follow.getByRole('link')).toHaveText(['Bluesky', 'Mastodon', 'GitHub', 'LinkedIn']);
  const menu = page.locator('[data-feeds-menu]');
  await menu.locator('summary').click();
  const links = menu.locator('.feeds-menu-link');
  await expect(links.first()).toBeVisible();
  const hrefs = await links.evaluateAll((all) => all.map((link) => link.getAttribute('href')!));
  expect(hrefs.slice(0, 3)).toEqual(['/rss.xml', '/atom.xml', '/reading/rss.xml']);
  expect(hrefs.length).toBeGreaterThan(8);
  expect(hrefs.filter((href) => href.startsWith('/topics/')).length).toBe(hrefs.length - 3);
  expect(hrefs).not.toContain('/mini/atom.xml');
  for (const href of hrefs) expect((await request.get(href)).status(), href).toBe(200);
  await menu.getByRole('button', { name: /Copy the All posts RSS feed/ }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(new URL('/rss.xml', page.url()).href);
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
});
