// Not @smoke: these tests write data, so deploy never runs them against the live site.
import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import project from '../../project.json' with { type: 'json' };

test('saved entries survive a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'New entry' }).fill('Buy milk');
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('status')).toHaveText('Saved.');
  await page.reload();
  await expect(page.getByRole('list', { name: 'Entries' })).toContainText('Buy milk');
});

test('export then import restores the data', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'New entry' }).fill('Keep me');
  await page.getByRole('button', { name: 'Add' }).click();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(new RegExp(`^${project.name}-\\d{4}-\\d{2}-\\d{2}\\.json$`));
  const file = testInfo.outputPath('export.json');
  await download.saveAs(file);

  await page.getByRole('button', { name: 'Delete Keep me' }).click();
  await expect(page.getByRole('list', { name: 'Entries' })).toContainText('Nothing yet.');

  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('input[type=file]').setInputFiles({ name: 'export.json', mimeType: 'application/json', buffer: await readFile(file) });
  await expect(page.getByRole('status')).toHaveText('Imported.');
  await expect(page.getByRole('list', { name: 'Entries' })).toContainText('Keep me');
});
