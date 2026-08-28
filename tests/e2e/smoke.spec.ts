import { expect, test } from '@playwright/test';

test('mobile first viewport exposes one clear task and no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('main button').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('keyboard reaches the primary task', async ({ page, browserName }) => {
  await page.goto('/');
  const skipLink = page.locator('.skip-link');
  if (browserName === 'chromium') {
    await page.keyboard.press('Tab');
    await expect(skipLink).toBeFocused();
  } else {
    await skipLink.focus();
  }
  await page.keyboard.press('Enter');
  await expect(page.locator('main')).toBeFocused();
});

test('320px compact viewport has no horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('group', { name: /Encounter 1 of 10/ })).toBeVisible();
});

test('short mobile home keeps the start action above bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  const action = await page.getByRole('button', { name: 'Begin an encounter ↗' }).boundingBox();
  const navigation = await page.locator('.topbar nav').boundingBox();
  expect(action).not.toBeNull();
  expect(navigation).not.toBeNull();
  expect(action!.y + action!.height).toBeLessThanOrEqual(navigation!.y);
});

test('mobile scene controls keep thumb-sized heights', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  const heights = await page.evaluate(() => [...document.querySelectorAll('.scene-transport button,.scene-filmstrip button')].map(element => element.getBoundingClientRect().height));
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});

test('mobile landscape keeps the encounter frame near the top', async ({ page }) => {
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  const frame = await page.locator('.scene-canvas').boundingBox();
  expect(frame).not.toBeNull();
  expect(frame!.y).toBeLessThanOrEqual(110);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
