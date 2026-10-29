import { expect, test } from '@playwright/test';
import project from '../../project.json' with { type: 'json' };

test('@smoke ships the manifest', async ({ request }) => {
  const response = await request.get('/manifest.webmanifest');
  expect(response.ok()).toBe(true);
  expect((await response.json()).name).toBe(project.title);
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now the service worker controls the page and caches what it fetches
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
  // An uncached URL must fail, which proves the page above came from the cache.
  const probe = await page.evaluate(() => fetch('/robots.txt?probe').then(() => 'network', () => 'offline'));
  expect(probe).toBe('offline');
});
