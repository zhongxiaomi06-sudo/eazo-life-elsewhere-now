import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(Boolean(testInfo.project.metadata.app) && testInfo.project.metadata.app !== 'life', 'Life Elsewhere only');
  await page.goto('/');
});

test('production path discloses synthetic content and creates a pair', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Right now, elsewhere feels normal.' })).toBeVisible();
  await expect(page.getByText('Every person is synthetic.')).toBeVisible();
  await expect(page.getByText('No real identity. No live tracking. No location collected.')).toBeVisible();
  await expect(page.getByText('ORBIT / 10 SEC')).toBeVisible();
  await expect(page.getByText('LIVE-FEEL · NOT LIVE')).toBeVisible();
  await expect(page.locator('.contrast-cuts .cut')).toHaveCount(3);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  await expect(page.getByText('SYNTHETIC SCENE')).toBeVisible();
  await expect(page.getByText('Possible portrait')).toBeVisible();
  await expect(page.getByText('Independent visual seed · not a real person')).toBeVisible();
  await expect(page.getByText('national estimate · not a personal prediction')).toBeVisible();
  await page.getByRole('button', { name: '＋ Save for a pair' }).click();
  await expect(page.getByRole('status')).toContainText('Saved on this device.');
  await expect(page.getByText('YOUR CONTACT SHEET')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open pair ↗' })).toBeVisible();
  await page.getByRole('button', { name: 'Pair 1' }).click();
  await expect(page.getByRole('heading', { name: 'Difference without a scoreboard.' })).toBeVisible();
  await expect(page.getByText(/Comparable context|No ranking shown/)).toBeVisible();
  const firstPairStory = page.locator('.pair-primary h2');
  const previousStory = await firstPairStory.textContent();
  await page.getByRole('button', { name: 'Change first scene' }).click();
  await expect(page.getByRole('button', { name: 'Change first scene' })).toBeDisabled();
  await expect(firstPairStory).not.toHaveText(previousStory!);
  await expect(page.getByRole('button', { name: 'Change first scene' })).toBeEnabled();
});

test('encounter loop supports keyboard, touch swipe and direct filmstrip navigation', async ({ page }) => {
  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  const frame = page.getByRole('group', { name: /Encounter 1 of 10/ });
  await expect(frame).toBeVisible();

  await frame.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText('ELSEWHERE / FRAME 02')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next scene' })).toBeEnabled();

  const secondFrame = page.getByRole('group', { name: /Encounter 2 of 10/ });
  const box = await secondFrame.boundingBox();
  expect(box).not.toBeNull();
  await secondFrame.dispatchEvent('pointerdown', { pointerId: 7, clientX: box!.x + box!.width * .8, clientY: box!.y + box!.height * .5 });
  await secondFrame.dispatchEvent('pointerup', { pointerId: 7, clientX: box!.x + box!.width * .2, clientY: box!.y + box!.height * .5 });
  await expect(page.getByText('ELSEWHERE / FRAME 03')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next scene' })).toBeEnabled();

  await page.getByRole('button', { name: 'Go to encounter 7' }).click();
  await expect(page.getByText('ELSEWHERE / FRAME 07')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next scene' })).toBeEnabled();
  await page.getByRole('button', { name: 'Previous scene' }).click();
  await expect(page.getByText('ELSEWHERE / FRAME 06')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('method ledger exposes complete source and Eazo runtime information', async ({ page }) => {
  await page.getByRole('button', { name: 'Method' }).click();
  await expect(page.getByRole('heading', { name: 'How the atlas is made.' })).toBeVisible();
  await expect(page.getByText('48 / 48 reviewed')).toBeVisible();
  await expect(page.getByText('d791b6dcfdb7cccf98f1be1326acc015554ca974a3f16d86fb3a87ec947e8cb4')).toBeVisible();
  await expect(page.getByText('Web fallback active')).toBeVisible();
  await expect(page.getByRole('link', { name: 'World Bank ↗' })).toHaveCount(4);
});

test('offline state keeps the local experience usable', async ({ page, context }) => {
  await page.getByRole('button', { name: 'Begin an encounter ↗' }).click();
  await context.setOffline(true);
  await expect(page.getByText('Offline ready')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Meet someone else →' })).toBeEnabled();
  await context.setOffline(false);
});

test('cached shell survives a cold offline reload', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'WebKit offline reload is not stable in Playwright; covered by active-session offline test.');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  const cachedRequests = await page.evaluate(async () => (await caches.open('elsewhere-now-v3')).keys().then(keys => keys.map(key => key.url)));
  expect(cachedRequests.some(url => url.includes('/assets/index-') && url.endsWith('.js'))).toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Right now, elsewhere feels normal.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Begin an encounter ↗' })).toBeEnabled();
  await context.setOffline(false);
});
