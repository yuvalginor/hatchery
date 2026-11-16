// The Android app's glue, loaded only inside the app (src/features/android.ts). The web bundle never runs it.
import { App } from '@capacitor/app';
import { handleBack } from '../back';
import { followTheme } from './bars';
import { startUpdates } from './updates';

export function start(): void {
  // Back closes the topmost thing the app listed (src/back.ts). With nothing open it leaves the app, as Android's
  // own apps do: the app goes to the background and keeps its place.
  void App.addListener('backButton', () => {
    if (!handleBack()) void App.minimizeApp();
  });
  const paint = followTheme();
  void App.addListener('resume', paint);
  startUpdates();
}
