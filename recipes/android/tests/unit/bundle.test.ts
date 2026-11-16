import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { unzipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { writeUpdate } from '../../scripts/bundle';
import { parseManifest } from '../../src/native/update';
import { updateOrigin } from '../../build/plugins/update';
import type { Project } from '../../build/site';

describe('the live update bundle', () => {
  it('zips the build without app/ and writes a manifest that matches the zip', () => {
    const dist = mkdtempSync(join(tmpdir(), 'bundle-'));
    mkdirSync(join(dist, 'assets'));
    mkdirSync(join(dist, 'app'));
    writeFileSync(join(dist, 'index.html'), '<!doctype html>');
    writeFileSync(join(dist, 'assets', 'index.js'), 'console.log(1)');
    writeFileSync(join(dist, 'app', 'bundle-old.zip'), 'old');

    const manifest = writeUpdate(dist, '20261104073012-cc9709a');
    expect(parseManifest(readFileSync(join(dist, 'app', 'latest.json'), 'utf8'))).toEqual(manifest);
    const zip = readFileSync(join(dist, manifest.url));
    expect(createHash('sha256').update(zip).digest('hex')).toBe(manifest.sha256);
    expect(Object.keys(unzipSync(zip)).sort()).toEqual(['assets/index.js', 'index.html']);
    expect(() => readFileSync(join(dist, 'app', 'bundle-old.zip'))).toThrow();
  });

  it('takes updates from production on main, and from its own Preview on a branch', () => {
    const project = { name: 'demo', workersSubdomain: 'me', url: '' } as Project;
    expect(updateOrigin(project, 'main')).toBe('https://demo.me.workers.dev');
    expect(updateOrigin(project, 'Android/Updates')).toBe('https://android-updates-demo.me.workers.dev');
  });
});
