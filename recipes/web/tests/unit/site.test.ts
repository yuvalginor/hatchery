import { describe, expect, it } from 'vitest';
import { headers, renderHtml, robots, siteUrl, workersDevUrl, type Project } from '../../build/site';

const base: Project = {
  name: 'demo',
  title: 'Demo <App>',
  description: 'Says "hi"',
  workersSubdomain: 'me',
  url: '',
  public: false,
  themeColor: '#000000',
  analyticsToken: 'abc123',
  privacyAllow: [],
};
const html = '<html><head><title>%TITLE%</title><meta content="%DESCRIPTION%"><meta content="%URL%/og.png"></head></html>';

describe('site metadata', () => {
  it('derives workers.dev and Preview URLs', () => {
    expect(workersDevUrl(base)).toBe('https://demo.me.workers.dev');
    expect(workersDevUrl(base, 'feature-x')).toBe('https://feature-x-demo.me.workers.dev');
    expect(siteUrl({ ...base, url: 'https://demo.example.com/' })).toBe('https://demo.example.com');
  });

  it('escapes project text in HTML', () => {
    const out = renderHtml(html, base);
    expect(out).toContain('<title>Demo &lt;App&gt;</title>');
    expect(out).toContain('content="Says &quot;hi&quot;"');
    expect(out).toContain('https://demo.me.workers.dev/og.png');
  });

  it('keeps private projects out of search engines everywhere', () => {
    expect(renderHtml(html, base)).toContain('<meta name="robots" content="noindex, nofollow">');
    expect(robots(base)).toContain('Disallow: /');
    expect(headers(base)).toContain('X-Robots-Tag: noindex, nofollow');
    expect(renderHtml(html, base)).not.toContain('cloudflareinsights');
  });

  it('opens public projects to search engines and adds analytics', () => {
    const pub = { ...base, public: true };
    expect(renderHtml(html, pub)).not.toContain('noindex');
    expect(renderHtml(html, pub)).toContain('data-cf-beacon="{&quot;token&quot;:&quot;abc123&quot;}"');
    expect(robots(pub)).toContain('Allow: /');
    expect(headers(pub)).not.toContain('X-Robots-Tag');
  });

  it('sends a strict content security policy', () => {
    expect(headers(base)).toMatch(/Content-Security-Policy: default-src 'self'.*object-src 'none'/);
  });
});
