import { test, expect, POST, markDocument, sameDocument } from './fixtures';

test('the command palette finds a post and opens it in place', async ({ page }) => {
  await page.goto('/');
  await markDocument(page);
  const palette = page.locator('#command-palette');
  await page.keyboard.press('Control+k');
  await expect(palette).toBeVisible();
  await expect(page.locator('#command-palette-input')).toBeFocused();
  // "cpp" finds "C++", and the best match comes first.
  await page.keyboard.type('cpp safer');
  await expect(page.locator('#command-palette [role="option"]').first()).toContainText('C++ Must Become Safer');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(POST);
  expect(await sameDocument(page)).toBe(true);
});

test('the command palette holds focus, closes on Escape and on a click outside, and says when nothing matches', async ({ page }) => {
  await page.goto('/');
  const palette = page.locator('#command-palette');
  const button = page.locator('button[data-command-palette-open] >> visible=true');
  await button.click();
  await expect(palette).toBeVisible();
  await page.keyboard.type('zzzqqq');
  await expect(page.locator('#command-palette-results')).toHaveText('No matches');
  // Tab doesn't leave for the page behind, and Escape returns to the button.
  await page.keyboard.press('Tab');
  await expect(page.locator('#command-palette-input')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(palette).toBeHidden();
  await expect(button).toBeFocused();
  await page.keyboard.press('/');
  await expect(palette).toBeVisible();
  await page.mouse.click(10, 10);
  await expect(palette).toBeHidden();
});
