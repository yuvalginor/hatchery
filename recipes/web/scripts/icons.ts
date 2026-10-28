// Renders assets/icon.svg to the PWA icons and draws the social preview card (public/og.png).
// Run after changing the icon, title or description: npm run icons
import { copyFileSync, existsSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const CLOUD_CHROMIUM = '/opt/pw-browsers/chromium';
const project = JSON.parse(readFileSync('project.json', 'utf8'));
const svg = readFileSync('assets/icon.svg', 'utf8');
const iconUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const browser = await chromium.launch(existsSync(CLOUD_CHROMIUM) ? { executablePath: CLOUD_CHROMIUM } : {});
const page = await browser.newPage();

for (const size of [180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<body style="margin:0"><img src="${iconUrl}" width="${size}" height="${size}"></body>`);
  await page.screenshot({ path: `public/icons/icon-${size}.png`, omitBackground: true });
}
copyFileSync('assets/icon.svg', 'public/icons/icon.svg');

await page.setViewportSize({ width: 1200, height: 630 });
await page.setContent(`<body style="margin:0;width:1200px;height:630px;display:flex;align-items:center;gap:56px;padding:0 80px;box-sizing:border-box;
  background:${project.themeColor};color:#fff;font-family:system-ui,sans-serif">
  <img src="${iconUrl}" width="260" height="260" style="border-radius:48px;box-shadow:0 8px 32px #0004">
  <div><h1 id="title" style="font-size:72px;margin:0 0 16px"></h1><p id="description" style="font-size:36px;margin:0;opacity:.9"></p></div></body>`);
await page.locator('#title').evaluate((node, text) => (node.textContent = text), project.title);
await page.locator('#description').evaluate((node, text) => (node.textContent = text), project.description);
await page.screenshot({ path: 'public/og.png' });

await browser.close();
console.log('Wrote public/icons/icon-{180,192,512}.png, public/icons/icon.svg and public/og.png');
