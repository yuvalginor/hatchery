// Live updates inside the Android app, with Capgo's updater in its self-hosted manual mode: no Capgo account,
// no Capgo servers, no stats (capacitor.config.ts). On launch and on resume the app reads latest.json from its
// update origin, natively, so no CORS is needed. A newer bundle downloads, its sha256 is checked, and it is applied
// the next time the app goes to the background, never under the finger.
import { CapacitorHttp } from '@capacitor/core';
import { App } from '@capacitor/app';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import { isNewer, parseManifest } from './update';

// Set by build/plugins/update.ts for each build.
declare const __APP_VERSION__: string;
declare const __UPDATE_ORIGIN__: string;

const FAILED = 'update-failed'; // localStorage: versions that failed to start and rolled back

const failedVersions = (): string[] => {
  try {
    const list = JSON.parse(localStorage.getItem(FAILED) ?? '[]');
    return Array.isArray(list) ? list.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

const rememberFailed = (version: string) => {
  try {
    localStorage.setItem(FAILED, JSON.stringify([...new Set([...failedVersions(), version])].slice(-20)));
  } catch {
    // Blocked: it may be tried once more.
  }
};

let checking = false;

async function check(): Promise<void> {
  if (checking) return;
  checking = true;
  try {
    const response = await CapacitorHttp.get({ url: `${__UPDATE_ORIGIN__}/app/latest.json`, headers: { 'Cache-Control': 'no-cache' } });
    const manifest = response.status === 200 ? parseManifest(response.data) : null;
    if (!manifest || !isNewer(manifest, __APP_VERSION__, failedVersions())) return;
    const { bundles } = await CapacitorUpdater.list();
    const ready = bundles.find((b) => b.version === manifest.version && b.status !== 'error');
    const bundle =
      ready ?? (await CapacitorUpdater.download({ url: `${__UPDATE_ORIGIN__}${manifest.url}`, version: manifest.version, checksum: manifest.sha256 }));
    await CapacitorUpdater.next({ id: bundle.id });
  } catch {
    // Offline, or the site is down: the app runs on what it has and tries again on the next resume.
  } finally {
    checking = false;
  }
}

export function startUpdates(): void {
  // This bundle started. Without this call within 10 s, the updater rolls back to the last good bundle.
  void CapacitorUpdater.notifyAppReady();
  void CapacitorUpdater.addListener('updateFailed', ({ bundle }) => rememberFailed(bundle.version));
  void App.addListener('resume', () => void check());
  void check();
}
