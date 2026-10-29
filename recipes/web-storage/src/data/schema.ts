// Saved data shape. Every past version must stay loadable:
// - New fields get defaults in normalize().
// - Never rename or remove a field without a migration step below.
// - Add a fixture to tests/fixtures/data/ for every version.

export const VERSION = 1;

export interface Entry {
  id: string;
  text: string;
  createdAt: string;
}

export interface AppData {
  version: typeof VERSION;
  entries: Entry[];
}

export const emptyData = (): AppData => ({ version: VERSION, entries: [] });

type Raw = Record<string, unknown>;
const isRecord = (value: unknown): value is Raw => typeof value === 'object' && value !== null && !Array.isArray(value);

// One step per past version, each turning version n into n + 1. Example for a future v2:
// 1: (data) => ({ ...data, version: 2, tags: [] }),
const steps: Record<number, (data: Raw) => Raw> = {};

function normalizeEntry(raw: unknown, index: number): Entry {
  const entry = isRecord(raw) ? raw : {};
  return {
    id: typeof entry.id === 'string' ? entry.id : `entry-${index}`,
    text: typeof entry.text === 'string' ? entry.text : '',
    createdAt: typeof entry.createdAt === 'string' ? entry.createdAt : new Date(0).toISOString(),
  };
}

function normalize(data: Raw): AppData {
  const entries = Array.isArray(data.entries) ? data.entries.map(normalizeEntry) : [];
  return { version: VERSION, entries };
}

export function migrate(raw: unknown): AppData {
  if (!isRecord(raw) || !Number.isInteger(raw.version) || (raw.version as number) < 1) {
    throw new Error('This is not data from this app.');
  }
  if ((raw.version as number) > VERSION) {
    throw new Error(`This data is from a newer version (${raw.version}) of the app. Update the app first.`);
  }
  let data = raw;
  while ((data.version as number) < VERSION) data = steps[data.version as number](data);
  return normalize(data);
}
