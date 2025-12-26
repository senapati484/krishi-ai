// Offline storage for Quick Diagnosis Cards using IndexedDB

const DB_NAME = 'krishi-ai-offline';
const DB_VERSION = 1;
const STORE_NAME = 'diagnosis-cards';

export interface OfflineDiseaseCard {
  id: string;
  crop: string;
  name: string;
  commonName: string;
  symptoms: string[];
  quickFix: string;
  severity: 'low' | 'moderate' | 'high';
  lastUpdated: number;
}

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('crop', 'crop', { unique: false });
        objectStore.createIndex('severity', 'severity', { unique: false });
      }
    };
  });
}

export async function saveDiseaseCards(cards: OfflineDiseaseCard[]): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  for (const card of cards) {
    await new Promise<void>((resolve, reject) => {
      const request = store.put(card);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export async function getDiseaseCards(crop?: string): Promise<OfflineDiseaseCard[]> {
  const database = await initDB();
  const transaction = database.transaction([STORE_NAME], 'readonly');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = crop
      ? store.index('crop').getAll(crop)
      : store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function clearDiseaseCards(): Promise<void> {
  const database = await initDB();
  const transaction = database.transaction([STORE_NAME], 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}


