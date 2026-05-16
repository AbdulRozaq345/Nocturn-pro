/**
 * Cache hasil API tracks di localStorage untuk stale-while-revalidate.
 * Tujuan: list lagu tampil INSTAN dari cache, lalu fetch baru di background.
 *
 * Server API `/api/tracks` TTFB ~2.5s — tanpa cache, user selalu nunggu.
 * Dengan cache: load awal cuma muncul empty kalau benar-benar first visit.
 */

const TRACKS_CACHE_KEY = "notcer_tracks_cache_v1";
const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24; // 1 hari

interface CachedTracks {
  data: any[];
  timestamp: number;
}

export function readTracksCache(): any[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TRACKS_CACHE_KEY);
    if (!raw) return null;
    const parsed: CachedTracks = JSON.parse(raw);
    if (!parsed?.data || !Array.isArray(parsed.data)) return null;
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeTracksCache(data: any[]) {
  if (typeof window === "undefined") return;
  try {
    const payload: CachedTracks = { data, timestamp: Date.now() };
    localStorage.setItem(TRACKS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // QuotaExceededError — abaikan, cache hilang
  }
}

export function clearTracksCache() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TRACKS_CACHE_KEY);
  } catch {}
}
