const STATS_KEY = "notcer_play_stats";

export type PlayStats = Record<string, number>;

export function getPlayStats(): PlayStats {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STATS_KEY) || "{}");
  } catch {
    return {};
  }
}

export function recordPlay(trackId: string | number) {
  if (typeof window === "undefined" || !trackId) return;
  const stats = getPlayStats();
  const key = String(trackId);
  stats[key] = (stats[key] || 0) + 1;
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {}
}

/**
 * Weighted random pick — lagu yang sering diputar lebih besar kemungkinannya,
 * tapi lagu yang belum pernah diputar tetap punya kesempatan (base weight 1).
 * sqrt dipakai agar lagu yang diputar 100x tidak mendominasi sepenuhnya.
 */
export function weightedShuffle<T extends { id?: any }>(
  tracks: T[],
  excludeId: string | number | null,
  stats: PlayStats,
): T {
  const pool = excludeId != null
    ? tracks.filter((t) => String(t.id) !== String(excludeId))
    : tracks;

  if (pool.length === 0) return tracks[0];

  const weights = pool.map((t) => Math.sqrt((stats[String(t.id)] || 0) + 1));
  const total = weights.reduce((a, b) => a + b, 0);

  let rand = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Buat urutan shuffle lengkap dari semua tracks — "shuffle tanpa pengulangan".
 * Semua lagu diputar sekali dulu sebelum siklus baru dimulai.
 * Lagu yang sering diputar cenderung muncul lebih awal (weighted sort).
 */
export function generateShuffleQueue<T extends { id?: any }>(
  tracks: T[],
  excludeId: string | number | null,
  stats: PlayStats,
): T[] {
  const pool =
    excludeId != null
      ? tracks.filter((t) => String(t.id) !== String(excludeId))
      : [...tracks];

  if (pool.length === 0) return [];

  return [...pool]
    .map((t) => ({
      track: t,
      key: Math.random() * Math.sqrt((stats[String((t as any).id)] || 0) + 1),
    }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.track);
}

function titleWords(track: any): string[] {
  return (track?.title || track?.trackTitle || "")
    .toLowerCase()
    .split(/[\s\-_,.()\[\]]+/)
    .filter((w: string) => w.length > 3);
}

/**
 * Skor vibe — seberapa "cocok" sebuah lagu dengan lagu referensi.
 * Kriteria (tidak butuh data genre dari API):
 *   1. Artis sama          → +100
 *   2. Kata judul overlap  → +15 per kata
 *   3. Play count          → +4 per play (lagu favoritmu naik)
 */
export function vibeScore(
  candidate: any,
  reference: any,
  stats: PlayStats,
): number {
  let score = (stats[String(candidate?.id)] || 0) * 4;

  if (!reference) return score;

  const refArtist = (reference.artist || reference.artistName || "").toLowerCase().trim();
  const candArtist = (candidate.artist || candidate.artistName || "").toLowerCase().trim();
  if (refArtist && candArtist && refArtist === candArtist) score += 100;

  const refWords = new Set(titleWords(reference));
  for (const w of titleWords(candidate)) {
    if (refWords.has(w)) score += 15;
  }

  return score;
}

/**
 * Urutkan kandidat berdasarkan vibe terhadap lagu referensi (currentTrack).
 */
export function sortByVibe<T>(
  candidates: T[],
  reference: any,
  stats: PlayStats,
): T[] {
  return [...candidates].sort(
    (a, b) => vibeScore(b, reference, stats) - vibeScore(a, reference, stats),
  );
}
