import { CustomAudioTrack } from '../types/bell';

const DB_NAME = 'GentaSekolahAudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'audioFiles';

interface StoredAudioRecord {
  meta: CustomAudioTrack;
  blob: Blob;
}

function openAudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB tidak tersedia di browser ini.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'meta.id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Gagal membuka database audio.'));
  });
}

export async function saveCustomAudioTrack(
  file: File
): Promise<CustomAudioTrack> {
  const durationSec = await measureAudioDuration(file);
  const id = `track_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const meta: CustomAudioTrack = {
    id,
    name: file.name.replace(/\.[^/.]+$/, ''),
    mimeType: file.type || 'audio/mpeg',
    size: file.size,
    durationSec,
    createdAt: new Date().toISOString(),
  };

  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const record: StoredAudioRecord = { meta, blob: file };
    const req = store.put(record);
    req.onsuccess = () => resolve(meta);
    req.onerror = () => reject(req.error ?? new Error('Gagal menyimpan file audio.'));
  });
}

export async function listCustomAudioTracks(): Promise<CustomAudioTrack[]> {
  try {
    const db = await openAudioDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = (req.result as StoredAudioRecord[]) || [];
        resolve(records.map((r) => r.meta));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function getCustomAudioBlob(id: string): Promise<Blob | null> {
  try {
    const db = await openAudioDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const record = req.result as StoredAudioRecord | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function deleteCustomAudioTrack(id: string): Promise<void> {
  const db = await openAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error ?? new Error('Gagal menghapus audio.'));
  });
}

function measureAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const cleanup = () => {
      URL.revokeObjectURL(url);
    };
    audio.addEventListener('loadedmetadata', () => {
      const d = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
      cleanup();
      resolve(d);
    });
    audio.addEventListener('error', () => {
      cleanup();
      resolve(0);
    });
    audio.src = url;
  });
}
