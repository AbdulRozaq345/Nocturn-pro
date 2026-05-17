/**
 * Module-level cache untuk blob URL track offline.
 * Tujuan: playTrackImmediate bisa sinkron resolve audio_url ke blob URL
 * tanpa await (yang akan menghilangkan user-gesture context untuk autoplay).
 */
import {
  getAllOfflineTracks,
  getOfflineAudioBlob,
  type OfflineTrackMeta,
} from "@/lib/offlineStorage";

const blobUrlCache: Map<string, string> = new Map();
const metaCache: Map<string, OfflineTrackMeta> = new Map();
let preloadPromise: Promise<void> | null = null;
const listeners: Set<() => void> = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {}
  }
}

/** Subscribe ke perubahan cache (track ditambah/dihapus). */
export function subscribeOfflineCache(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Cek apakah track sudah tersedia offline (sinkron, tanpa await). */
export function hasOfflineCached(trackId: string | number): boolean {
  return blobUrlCache.has(String(trackId));
}

/** Ambil blob URL dari cache (sinkron). */
export function getCachedBlobUrl(trackId: string | number): string | null {
  return blobUrlCache.get(String(trackId)) ?? null;
}

export function getCachedMeta(
  trackId: string | number,
): OfflineTrackMeta | null {
  return metaCache.get(String(trackId)) ?? null;
}

/** Set blob URL ke cache (dipanggil setelah save). */
export function setCachedBlobUrl(
  trackId: string | number,
  url: string,
  meta?: OfflineTrackMeta,
) {
  const key = String(trackId);
  const old = blobUrlCache.get(key);
  if (old && old !== url) {
    try {
      URL.revokeObjectURL(old);
    } catch {}
  }
  blobUrlCache.set(key, url);
  if (meta) metaCache.set(key, meta);
  notify();
}

/** Hapus dari cache + revoke object URL. */
export function removeCachedBlobUrl(trackId: string | number) {
  const key = String(trackId);
  const url = blobUrlCache.get(key);
  if (url) {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }
  blobUrlCache.delete(key);
  metaCache.delete(key);
  notify();
}

/**
 * Preload semua blob URL untuk track yang sudah tersimpan offline.
 * Dipanggil sekali di app startup. Idempotent.
 */
export function preloadOfflineCache(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    try {
      const all = await getAllOfflineTracks();
      await Promise.all(
        all.map(async (meta) => {
          if (blobUrlCache.has(meta.id)) return;
          try {
            const blob = await getOfflineAudioBlob(meta.id);
            if (blob) {
              blobUrlCache.set(meta.id, URL.createObjectURL(blob));
              metaCache.set(meta.id, meta);
            }
          } catch {}
        }),
      );
      notify();
    } catch {}
  })();

  return preloadPromise;
}

/** Re-scan IndexedDB & sync cache (dipanggil setelah sync provider selesai). */
export async function refreshOfflineCache(): Promise<void> {
  preloadPromise = null;
  return preloadOfflineCache();
}

/**
 * Resolve audio_url untuk track — return blob URL kalau tersedia offline,
 * jika tidak return URL aslinya.
 */
export function resolveAudioUrl(track: any): string | null {
  if (!track) return null;
  const offline = blobUrlCache.get(String(track.id));
  if (offline) return offline;
  return track.audio_url ?? null;
}

/** Resolve cover URL — pakai data URL offline kalau ada dan valid. */
export function resolveCoverUrl(track: any): string | null {
  if (!track) return null;
  const meta = metaCache.get(String(track.id));
  // Hanya pakai offline cover jika benar-benar data URL (bukan fallback path)
  if (meta?.coverDataUrl?.startsWith("data:")) return meta.coverDataUrl;
  return track.albumArt || track.cover_url || null;
}
