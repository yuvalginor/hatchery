// The Android app: a Capacitor wrapper around the web build in dist/.
// The app id comes from project.json (android.appId). It is permanent: a new one is a different app.
// Never change the Android scheme or the host. The app's origin, https://localhost, holds all its saved data.
import { readFileSync } from 'node:fs';
import type { CapacitorConfig } from '@capacitor/cli';

const project = JSON.parse(readFileSync('project.json', 'utf8'));

const config: CapacitorConfig = {
  appId: project.android.appId,
  appName: project.title ?? project.name,
  webDir: 'dist',
  server: {
    // The origin is https://localhost. A new scheme or host would start the app with no data.
    androidScheme: 'https',
    hostname: 'localhost',
  },
  plugins: {
    // The WebView sits between the status and navigation bars. src/native/bars.ts colours them.
    SystemBars: { insetsHandling: 'native' },
    // Live updates, self-hosted: src/native/updates.ts checks our own site and applies bundles by hand.
    // Empty URLs keep the plugin from ever calling Capgo's servers, stats included.
    CapacitorUpdater: { autoUpdate: false, statsUrl: '', updateUrl: '', channelUrl: '', shakeMenu: false },
  },
};

export default config;
