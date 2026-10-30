import { describe, expect, it } from 'vitest';
import { checkName, scanText } from '../../scripts/privacy-check';

const rules = (text: string, allow: string[] = []) => scanText('f.js', text, allow).map((f) => f.rule);

describe('privacy check', () => {
  it('passes ordinary build output', () => {
    expect(rules('const a=document.querySelector("#app");localStorage.getItem("x");fetch("/api/items")')).toEqual([]);
  });

  it.each([
    ['//# sourceMappingURL=main.js.map', 'sourcemap reference'],
    ['-----BEGIN RSA PRIVATE KEY-----', 'private key'],
    ['AKIAABCDEFGHIJKLMNOP', 'AWS key'],
    [`ghp_${'a'.repeat(36)}`, 'GitHub token'],
    [`AIza${'b'.repeat(35)}`, 'Google API key'],
    [`sk-ant-${'c'.repeat(40)}`, 'AI API key'],
    [`cfast_${'d'.repeat(40)}`, 'Cloudflare Access secret'],
    ['postgres://user:pw@db.example.com/app', 'database URL with password'],
    ['apiKey:"abcdef123456"', 'secret assignment'],
    ['10.0.0.12', 'private IP address'],
    ['192.168.1.20', 'private IP address'],
    ['http://localhost:8787/x', 'internal hostname'],
    ['db.internal', 'internal hostname'],
    ['me@example.com', 'email address'],
    ['/home/user/project/src', 'local file path'],
  ])('flags sample %# as a secret or leak', (text, rule) => {
    expect(rules(text)).toContain(rule);
  });

  it('skips allowlisted strings', () => {
    expect(rules('hello@example.com', ['hello@example.com'])).toEqual([]);
  });

  it('only ships allowlisted file types', () => {
    expect(checkName('assets/index-abc.js')).toEqual([]);
    expect(checkName('_headers')).toEqual([]);
    expect(checkName('assets/index.js.map')[0].rule).toBe('sourcemap file');
    expect(checkName('.env')[0].rule).toBe('dotfile');
    expect(checkName('notes.md')[0].rule).toBe('file type not on the allowlist');
    expect(checkName('src/main.ts')[0].rule).toBe('file type not on the allowlist');
  });
});
