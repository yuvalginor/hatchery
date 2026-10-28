// Browser storage for AppData. IndexedDB, one record, migrated on every load.
import { emptyData, migrate, type AppData } from './schema';

const DB_NAME = 'app';
const STORE = 'kv';
const KEY = 'data';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

export async function loadData(): Promise<AppData> {
  const raw = await run('readonly', (store) => store.get(KEY));
  return raw === undefined ? emptyData() : migrate(raw);
}

export async function saveData(data: AppData): Promise<void> {
  await run('readwrite', (store) => store.put(data, KEY));
}

// Asks the browser not to evict our data. Browsers decide silently; the result is informational.
export async function requestPersistence(): Promise<boolean> {
  return (await navigator.storage?.persist?.()) ?? false;
}
