// The status and navigation bars take the page's colour and light or dark icons.
// It follows the page: its background colour, read again when the theme attribute or the device's scheme changes.
// A page that sets `data-theme` on <html> works as it is; so does one that only uses prefers-color-scheme.
import { registerPlugin } from '@capacitor/core';

type SystemColors = { set: (options: { background: string; dark: boolean }) => Promise<void> };
// android/app/src/main/java/dev/hatchery/app/SystemColorsPlugin.java
const SystemColors = registerPlugin<SystemColors>('SystemColors');

// "rgb(250, 250, 249)" or "rgba(...)" as "#fafaf9", and how light it is from 0 to 1.
// A fully transparent colour is no colour: null, so the caller asks the element behind it.
export function hexAndLightness(css: string): { hex: string; lightness: number } | null {
  const match = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?/.exec(css);
  if (!match || (match[4] !== undefined && Number(match[4]) === 0)) return null;
  const [r, g, b] = [match[1], match[2], match[3]].map((n) => Math.min(255, Number(n)));
  const hex = `#${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
  return { hex, lightness: (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 };
}

const paint = () => {
  const found =
    hexAndLightness(getComputedStyle(document.body).backgroundColor) ?? hexAndLightness(getComputedStyle(document.documentElement).backgroundColor) ?? { hex: '#ffffff', lightness: 1 };
  if (found) void SystemColors.set({ background: found.hex, dark: found.lightness < 0.5 }).catch(() => {});
};

export function followTheme(): () => void {
  paint();
  const observer = new MutationObserver(paint);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme', 'class'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  return paint;
}
