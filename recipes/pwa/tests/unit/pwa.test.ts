import { describe, expect, it } from 'vitest';
import pwaPlugin, { MANIFEST_LINK, manifest } from '../../build/plugins/pwa';
import type { Project } from '../../build/site';

const project = { title: 'Demo', description: 'A demo', themeColor: '#123456' } as Project;

describe('pwa', () => {
  it('builds an installable manifest', () => {
    const m = manifest(project) as { name: string; display: string; theme_color: string; icons: { sizes: string }[] };
    expect(m).toMatchObject({ name: 'Demo', display: 'standalone', theme_color: '#123456' });
    expect(m.icons.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  });

  it('links the manifest with credentials, so installs work behind Access', () => {
    const transform = pwaPlugin(project).transformIndexHtml as (html: string) => string;
    expect(transform('<head></head>')).toContain(MANIFEST_LINK);
    expect(MANIFEST_LINK).toContain('crossorigin="use-credentials"');
  });
});
