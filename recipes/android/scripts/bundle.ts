// Packs a web build as a live update for the Android app, after the Vite build (build/plugins/update.ts).
// Writes dist/app/bundle-<version>.zip, the whole build but app/ itself, and dist/app/latest.json, its manifest.
import { createHash } from 'node:crypto';
import { mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { zipSync } from 'fflate';
import { bundlePath, buildManifest, type Manifest } from '../src/native/update.ts';

function files(dir: string, root = dir): Record<string, Uint8Array> {
  const out: Record<string, Uint8Array> = {};
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const key = relative(root, path).split('\\').join('/');
    if (key === 'app') continue;
    if (statSync(path).isDirectory()) Object.assign(out, files(path, root));
    else out[key] = readFileSync(path);
  }
  return out;
}

export function writeUpdate(dist: string, version: string): Manifest {
  // A fixed time for every entry, so the same build gives the same zip.
  const zip = zipSync(files(dist), { level: 9, mtime: new Date('2000-01-01T00:00:00Z') });
  const sha256 = createHash('sha256').update(zip).digest('hex');
  const manifest = buildManifest(version, sha256);
  const app = join(dist, 'app');
  rmSync(app, { recursive: true, force: true });
  mkdirSync(app, { recursive: true });
  writeFileSync(join(dist, bundlePath(version)), zip);
  writeFileSync(join(app, 'latest.json'), `${JSON.stringify(manifest)}\n`);
  return manifest;
}
