import { describe, expect, it } from 'vitest';
import { buildManifest, isNewer, parseManifest, versionOf } from '../../src/native/update';

const SHA = 'a'.repeat(64);

describe('live update manifest', () => {
  it('names a version by the commit time in UTC and the short hash', () => {
    expect(versionOf('CC9709A03582a7f4', new Date('2026-11-04T09:30:12+02:00'))).toBe('20261104073012-cc9709a');
  });

  it('builds a manifest that points at its own zip', () => {
    expect(buildManifest('20261104073012-cc9709a', SHA)).toEqual({
      version: '20261104073012-cc9709a',
      url: '/app/bundle-20261104073012-cc9709a.zip',
      sha256: SHA,
    });
  });

  it('reads a manifest back, as an object or as text', () => {
    const manifest = buildManifest('20261104073012-cc9709a', SHA);
    expect(parseManifest(manifest)).toEqual(manifest);
    expect(parseManifest(JSON.stringify(manifest))).toEqual(manifest);
  });

  it('ignores anything that is not exactly a manifest', () => {
    const good = buildManifest('20261104073012-cc9709a', SHA);
    for (const bad of [
      null,
      'not json',
      '<html>',
      {},
      { ...good, version: '1.0.0' },
      { ...good, sha256: 'abc' },
      { ...good, url: 'https://elsewhere.example/bundle.zip' },
      { ...good, url: '/app/bundle-20261104073012-0000000.zip' },
    ]) {
      expect(parseManifest(bad)).toBeNull();
    }
  });
});

describe('the version check', () => {
  const manifest = buildManifest('20261104093012-bbbbbbb', SHA);

  it('takes a later commit', () => {
    expect(isNewer(manifest, '20261103120000-aaaaaaa')).toBe(true);
  });

  it('skips the version running and older ones', () => {
    expect(isNewer(manifest, '20261104093012-bbbbbbb')).toBe(false);
    expect(isNewer(manifest, '20261105000000-ccccccc')).toBe(false);
  });

  it('skips a version that failed to start before', () => {
    expect(isNewer(manifest, '20261103120000-aaaaaaa', ['20261104093012-bbbbbbb'])).toBe(false);
  });
});
