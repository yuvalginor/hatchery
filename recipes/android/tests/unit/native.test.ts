import { describe, expect, it } from 'vitest';
import { isNativeApp } from '../../src/platform';
import { hexAndLightness } from '../../src/native/bars';

describe('isNativeApp', () => {
  it('is true only when Capacitor says it runs on a device', () => {
    expect(isNativeApp({})).toBe(false);
    expect(isNativeApp({ Capacitor: { isNativePlatform: () => false } })).toBe(false);
    expect(isNativeApp({ Capacitor: { isNativePlatform: () => true } })).toBe(true);
  });
});

describe('hexAndLightness', () => {
  it('turns a computed colour into hex and a lightness from 0 to 1', () => {
    expect(hexAndLightness('rgb(250, 250, 249)')?.hex).toBe('#fafaf9');
    expect(hexAndLightness('rgba(25, 25, 25, 1)')?.hex).toBe('#191919');
    expect(hexAndLightness('rgb(255, 255, 255)')?.lightness).toBeCloseTo(1);
    expect(hexAndLightness('rgb(0, 0, 0)')?.lightness).toBe(0);
    expect(hexAndLightness('transparent')).toBeNull();
    expect(hexAndLightness('rgba(0, 0, 0, 0)')).toBeNull();
  });
});
