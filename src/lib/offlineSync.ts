import api from "@/lib/axios";
import {
  saveOfflineTrack,
  getAllOfflineTracks,
  isOfflineAvailable,
  fetchImageAsDataUrl,
} from "@/lib/offlineStorage";

// ── Backend API calls ──────────────────────────────────────────────────────

export async function markOfflineOnServer(trackId: string | number): Promise<void> {
  await api.post("/api/offline-tracks", { track_id: trackId });
}

export async function unmarkOfflineOnServer(trackId: string | number): Promise<void> {
  await api.delete(`/api/offline-tracks/${String(trackId)}`);
}

/** Ambil daftar track offline user dari backend. Return [] kalau endpoint belum ada. */
async function fetchServerList(): Promise<any[]> {
  try {
    const res = await api.get("/api/offline-tracks");
    const raw = res.data?.data ?? res.data;
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

// ── Sync: backend → local IndexedDB ────────────────────────────────────────

export type SyncProgress = { done: number; total: number; current?: string };

/**
 * Download ke IndexedDB semua track yang ada di server tapi belum ada lokal.
 * Dipanggil saat login atau pertama kali buka app.
 */
export async function syncOfflineFromServer(
  onProgress?: (p: SyncProgress) => void,
): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return;

  const serverTracks = await fetchServerList();
  if (serverTracks.length === 0) return;

  const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";
  let done = 0;
  const total = serverTracks.length;

  for (const track of serverTracks) {
    const id = String(track.id);
    onProgress?.({ done, total, current: track.trackTitle || track.title || id });

    if (await isOfflineAvailable(id)) {
      done++;
      continue;
    }

    try {
      const fileName = track.fileName || track.file_name;
      if (!fileName) { done++; continue; }

      const audioRes = await fetch(`${API_BASE}/music/${fileName}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!audioRes.ok) { done++; continue; }
      const audioBlob = await audioRes.blob();

      const coverUrl =
        track.albumArt ||
        (track.playlistCover
          ? `${API_BASE}/covers/${track.playlistCover}`
          : "/nocturn.avif");

      const coverDataUrl = coverUrl.startsWith("data:")
        ? coverUrl
        : await fetchImageAsDataUrl(coverUrl);

      const normalized = {
        id: track.id,
        title: track.trackTitle || track.title || "Unknown",
        artist: track.artistName || track.artist || "Unknown",
        duration: track.durationSeconds
          ? `${Math.floor(track.durationSeconds / 60)
              .toString()
              .padStart(2, "0")}:${(track.durationSeconds % 60)
              .toString()
              .padStart(2, "0")}`
          : track.duration || "00:00",
      };

      await saveOfflineTrack(normalized, audioBlob, coverDataUrl);
    } catch (e) {
      console.warn("[offlineSync] Gagal download track", id, e);
    }

    done++;
    onProgress?.({ done, total });
  }

  onProgress?.({ done: total, total });
}

/**
 * Push daftar track yang sudah ada lokal tapi belum tercatat di server.
 * Berguna saat user simpan offline saat offline lalu online lagi.
 */
export async function pushLocalToServer(): Promise<void> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) return;

  const serverTracks = await fetchServerList();
  const serverIds = new Set(serverTracks.map((t: any) => String(t.id)));
  const localTracks = await getAllOfflineTracks();

  for (const local of localTracks) {
    if (!serverIds.has(local.id)) {
      try {
        await markOfflineOnServer(local.id);
      } catch {}
    }
  }
}
