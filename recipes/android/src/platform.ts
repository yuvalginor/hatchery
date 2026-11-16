// True inside the Android app. Capacitor's bridge sets window.Capacitor before the page's scripts run.
// In a browser it is false, and src/native/ is never loaded.
type Bridge = { Capacitor?: { isNativePlatform?: () => boolean } };

export const isNativeApp = (scope: Bridge = globalThis as Bridge): boolean => scope.Capacitor?.isNativePlatform?.() === true;
