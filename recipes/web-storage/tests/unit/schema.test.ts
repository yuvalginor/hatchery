import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { emptyData, migrate, VERSION } from '../../src/data/schema';

const dir = 'tests/fixtures/data';
const fixtures = readdirSync(dir).filter((f) => /^v\d+\.json$/.test(f));

describe('saved data', () => {
  it('has a fixture for every version up to the current one', () => {
    const versions = fixtures.map((f) => Number(f.slice(1, -5))).sort((a, b) => a - b);
    expect(versions).toEqual(Array.from({ length: VERSION }, (_, i) => i + 1));
  });

  it.each(fixtures)('loads %s without losing entries', (file) => {
    const raw = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
    const data = migrate(raw);
    expect(data.version).toBe(VERSION);
    expect(data.entries.map((e) => e.text)).toEqual(raw.entries.map((e: { text: string }) => e.text));
  });

  it('fills defaults for missing fields', () => {
    expect(migrate({ version: 1, entries: [{ text: 'only text' }] }).entries[0]).toEqual({
      id: 'entry-0',
      text: 'only text',
      createdAt: '1970-01-01T00:00:00.000Z',
    });
    expect(migrate({ version: 1 })).toEqual(emptyData());
  });

  it('rejects data from a newer app version instead of dropping fields', () => {
    expect(() => migrate({ version: VERSION + 1, entries: [] })).toThrow(/newer version/);
  });

  it.each([null, [], 'text', { entries: [] }, { version: 0 }])('rejects %j', (raw) => {
    expect(() => migrate(raw)).toThrow(/not data from this app/);
  });
});
