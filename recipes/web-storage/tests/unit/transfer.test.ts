import { describe, expect, it } from 'vitest';
import { exportFileName, parse, serialize } from '../../src/data/transfer';

describe('export and import', () => {
  it('round-trips data through a file', () => {
    const data = { version: 1 as const, entries: [{ id: 'x', text: 'hello', createdAt: '2026-10-25T00:00:00.000Z' }] };
    expect(parse(serialize(data))).toEqual(data);
  });

  it('names the file after the app and the date', () => {
    expect(exportFileName('my-app', new Date('2026-10-25T12:00:00Z'))).toBe('my-app-2026-10-25.json');
  });

  it('rejects files that are not app data', () => {
    expect(() => parse('{"hello": 1}')).toThrow(/not data from this app/);
    expect(() => parse('not json')).toThrow();
  });
});
