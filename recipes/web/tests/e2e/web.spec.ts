// @smoke tests are read-only: deploy runs them against the live site, so they must never write data.
import { expect, test } from '@playwright/test';
import project from '../../project.json' with { type: 'json' };

test('@smoke home page loads and renders', async ({ page }) => {
  // Console errors include Content-Security-Policy violations.
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  await page.goto('/');
  await expect(page).toHaveTitle(project.title);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(project.title);
  await expect(page.locator('#app')).not.toBeEmpty();
  await page.waitForLoadState('networkidle');
  expect(errors).toEqual([]);
});

test('@smoke keeps private projects unindexed and sends security headers', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain(project.public ? 'Allow: /' : 'Disallow: /');
  const home = await request.get('/');
  expect(home.headers()['content-security-policy']).toContain("default-src 'self'");
  if (!project.public) expect(home.headers()['x-robots-tag']).toContain('noindex');
});
