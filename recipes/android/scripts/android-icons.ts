// Renders assets/icon.svg to the Android launcher icons, per screen density, and the icon's background colour.
// The adaptive icon's foreground is the mark alone on 108 dp, scaled to the 66 dp safe zone, over the icon's own
// background colour (its first <rect> fill). Legacy launchers get the full square and a round one.
// Run after changing the icon: node scripts/android-icons.ts
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const CLOUD_CHROMIUM = '/opt/pw-browsers/chromium';
const svg = readFileSync('assets/icon.svg', 'utf8');
const iconUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const background = /<rect[^>]*fill="(#[0-9a-f]{6})"/i.exec(svg)?.[1] ?? '#ffffff';
const markUrl = `data:image/svg+xml;base64,${Buffer.from(svg.replace(/<rect[^>]*\/>/, '')).toString('base64')}`;
const res = 'android/app/src/main/res';
const densities: [string, number][] = [
  ['mdpi', 1],
  ['hdpi', 1.5],
  ['xhdpi', 2],
  ['xxhdpi', 3],
  ['xxxhdpi', 4],
];

const browser = await chromium.launch(existsSync(CLOUD_CHROMIUM) ? { executablePath: CLOUD_CHROMIUM } : {});
const page = await browser.newPage();
for (const [density, scale] of densities) {
  const dir = `${res}/mipmap-${density}`;
  const legacy = 48 * scale;
  await page.setViewportSize({ width: legacy, height: legacy });
  for (const [name, radius] of [['ic_launcher', '12%'], ['ic_launcher_round', '50%']]) {
    await page.setContent(`<body style="margin:0"><img src="${iconUrl}" width="${legacy}" height="${legacy}" style="display:block;border-radius:${radius}"></body>`);
    await page.screenshot({ path: `${dir}/${name}.png`, omitBackground: true });
  }
  const full = 108 * scale;
  const mark = 66 * scale;
  await page.setViewportSize({ width: full, height: full });
  await page.setContent(`<body style="margin:0;display:grid;place-items:center;height:${full}px"><img src="${markUrl}" width="${mark}" height="${mark}"></body>`);
  await page.screenshot({ path: `${dir}/ic_launcher_foreground.png`, omitBackground: true });
}
await browser.close();
writeFileSync(
  `${res}/values/ic_launcher_background.xml`,
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${background}</color>\n</resources>\n`,
);
console.log('Wrote the Android launcher icons and their background colour.');
