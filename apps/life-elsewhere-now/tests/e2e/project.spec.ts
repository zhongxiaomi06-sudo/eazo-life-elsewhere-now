import { expect, test } from '@playwright/test';
import { expectHealthyEntrance, watchPageFailures } from '../../../../tests/e2e/support';

test('begins the current atlas visit', async ({ page }) => {
  const failures = watchPageFailures(page);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Right now, elsewhere, life is ordinary.' })).toBeVisible();
  await page.getByRole('button', { name: /Start/ }).click();
  await expect(page.locator('.scene-story')).toBeVisible();
  await expect(page.locator('.scene-index')).toContainText('OF 10 THIS VISIT');
  await expect(page.locator('.how-it-works')).toContainText('one postcard per region');
  await expect(page.getByRole('button', { name: 'Mute sound' })).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/[\u3400-\u9fff]/);
  await expectHealthyEntrance(page, failures);
});
