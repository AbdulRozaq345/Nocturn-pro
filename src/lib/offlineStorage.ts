const DB_NAME = "notcer_offline";
const DB_VERSION = 1;
const META_STORE = "track_meta";
const BLOB_STORE = "audio_blobs";

// ── helpers ────────────────────────────────────────────────────────────────

function currentUserId(): string {
  if (typeof window === "undefined") return "guest";
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return String(u?.id || u?.email || "guest");
  } catch {
    return "guest";
  }
}

/** key yang disimpan di DB = "{userId}::{trackId}" */
function makeKey(trackId: string | number): string {
  return `${currentUserId()}::${String(trackId)}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(META_STORE))
        db.createObjectStore(META_STORE, { keyPath: "key" });
      if (!db.objectStoreNames.contains(BLOB_STORE))
        db.createObjectStore(BLOB_STORE, { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(store: IDBObjectStore, val: any): Promise<void> {
  return new Promise((res, rej) => {
    const r = store.put(val);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

function idbGet<T>(store: IDBObjectStore, key: string): Promise<T | undefined> {
  return new Promise((res, rej) => {
    const r = store.get(key);
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => rej(r.error);
  });
}

function idbGetAll<T>(store: IDBObjectStore): Promise<T[]> {
  return new Promise((res, rej) => {
    const r = store.getAll();
    r.onsuccess = () => res(r.result as T[]);
    r.onerror = () => rej(r.error);
  });
}

function idbDel(store: IDBObjectStore, key: string): Promise<void> {
  return new Promise((res, rej) => {
    const r = store.delete(key);
    r.onsuccess = () => res();
    r.onerror = () => rej(r.error);
  });
}

// ── types ──────────────────────────────────────────────────────────────────

export interface OfflineTrackMeta {
  key: string;       // "{userId}::{trackId}"
  id: string;        // track id saja
  userId: string;
  title: string;
  artist: string;
  duration: string;
  coverDataUrl: string;
  fileSize: number;
  downloadedAt: number;
}

// ── public API ─────────────────────────────────────────────────────────────

export async function saveOfflineTrack(
  track: any,
  audioBlob: Blob,
  coverDataUrl: string,
): Promise<void> {
  const db = await openDB();
  const uid = currentUserId();
  const key = makeKey(track.id);
  const t = db.transaction([META_STORE, BLOB_STORE], "readwrite");
  const meta: OfflineTrackMeta = {
    key,
    id: String(track.id),
    userId: uid,
    title: track.title || track.trackTitle || "Unknown",
    artist: track.artist || track.artistName || "Unknown",
    duration: track.duration || "00:00",
    coverDataUrl,
    fileSize: audioBlob.size,
    downloadedAt: Date.now(),
  };
  await idbPut(t.objectStore(META_STORE), meta);
  await idbPut(t.objectStore(BLOB_STORE), { key, blob: audioBlob });
}

export async function getAllOfflineTracks(): Promise<OfflineTrackMeta[]> {
  const db = await openDB();
  const uid = currentUserId();
  const all = await idbGetAll<OfflineTrackMeta>(
    db.transaction(META_STORE, "readonly").objectStore(META_STORE),
  );
  return all
    .filter((r) => r.userId === uid)
    .sort((a, b) => b.downloadedAt - a.downloadedAt);
}

export async function getOfflineAudioBlob(trackId: string): Promise<Blob | null> {
  const db = await openDB();
  const row = await idbGet<{ key: string; blob: Blob }>(
    db.transaction(BLOB_STORE, "readonly").objectStore(BLOB_STORE),
    makeKey(trackId),
  );
  return row?.blob ?? null;
}

export async function removeOfflineTrack(trackId: string): Promise<void> {
  const db = await openDB();
  const key = makeKey(trackId);
  const t = db.transaction([META_STORE, BLOB_STORE], "readwrite");
  await idbDel(t.objectStore(META_STORE), key);
  await idbDel(t.objectStore(BLOB_STORE), key);
}

export async function isOfflineAvailable(trackId: string | number): Promise<boolean> {
  const db = await openDB();
  const row = await idbGet(
    db.transaction(META_STORE, "readonly").objectStore(META_STORE),
    makeKey(trackId),
  );
  return row !== undefined;
}

// ── utils ──────────────────────────────────────────────────────────────────

export async function fetchImageAsDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "/nocturn.avif";
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
