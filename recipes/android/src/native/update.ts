// Live updates, the pure part. Each web build publishes itself as /app/latest.json and a zip of dist/
// (build/plugins/update.ts). The Android app compares that manifest with the version it runs (src/native/updates.ts).
// A version is the commit's time in UTC and its short hash, such as 20261104093012-cc9709a, so it sorts by time
// and the same commit has the same version wherever it was built.

export type Manifest = { version: string; url: string; sha256: string };

const VERSION = /^\d{14}-[0-9a-f]{7}$/;
const SHA256 = /^[0-9a-f]{64}$/;

export function versionOf(commit: string, committedAt: Date): string {
  const stamp = committedAt.toISOString().replace(/\D/g, '').slice(0, 14);
  return `${stamp}-${commit.slice(0, 7).toLowerCase()}`;
}

export const bundlePath = (version: string): string => `/app/bundle-${version}.zip`;

export function buildManifest(version: string, sha256: string): Manifest {
  return { version, url: bundlePath(version), sha256 };
}

// A manifest from the network is data: anything that does not look exactly right is ignored.
export function parseManifest(value: unknown): Manifest | null {
  let data = value;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (typeof data !== 'object' || data === null) return null;
  const { version, url, sha256 } = data as Record<string, unknown>;
  if (typeof version !== 'string' || !VERSION.test(version)) return null;
  if (typeof sha256 !== 'string' || !SHA256.test(sha256)) return null;
  if (url !== bundlePath(version)) return null;
  return { version, url, sha256 };
}

// Newer means a later commit than the one running, and not one that already failed to start and rolled back.
// An older one, as after a revert that has not deployed yet, never replaces a newer one.
export function isNewer(manifest: Manifest, current: string, failed: readonly string[] = []): boolean {
  return manifest.version > current && !failed.includes(manifest.version);
}
