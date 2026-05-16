const STATS_KEY = "notcer_play_stats";
const STATS_V2_KEY = "notcer_play_stats_v2";
const RECENT_KEY = "notcer_recent_played";

// Anti-repeat: lagu di history N terakhir tidak masuk shuffle queue
const RECENT_WINDOW = 8;

// Kalau lagu yang baru diputar <30% lalu di-skip → dihitung skip
export const SKIP_THRESHOLD = 0.3;
// Kalau diputar ≥80% → dianggap selesai (boost score)
export const COMPLETE_THRESHOLD = 0.8;

export interface TrackStat {
  playCount: number;
  completedCount: number;
  skipCount: number;
  lastPlayedAt: number;
}

export type PlayStats = Record<string, number>; // legacy format
export type PlayStatsV2 = Record<string, TrackStat>;

// ── Storage helpers ───────────────────────────────────────────────────────

function readStatsV2(): PlayStatsV2 {
  if (typeof window === "undefined") return {};
  try {
    const v2 = localStorage.getItem(STATS_V2_KEY);
    if (v2) return JSON.parse(v2);
    // Migrasi dari format lama (hanya playCount)
    const legacy: PlayStats = JSON.parse(
      localStorage.getItem(STATS_KEY) || "{}",
    );
    const migrated: PlayStatsV2 = {};
    for (const id of Object.keys(legacy)) {
      migrated[id] = {
        playCount: legacy[id] || 0,
        completedCount: 0,
        skipCount: 0,
        lastPlayedAt: 0,
      };
    }
    localStorage.setItem(STATS_V2_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return {};
  }
}

function writeStatsV2(stats: PlayStatsV2) {
  try {
    localStorage.setItem(STATS_V2_KEY, JSON.stringify(stats));
    // Tetap update legacy untuk backward compat (komponen lama)
    const legacy: PlayStats = {};
    for (const id of Object.keys(stats)) legacy[id] = stats[id].playCount;
    localStorage.setItem(STATS_KEY, JSON.stringify(legacy));
  } catch {}
}

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeRecent(ids: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, RECENT_WINDOW)));
  } catch {}
}

// ── Public API: stats ─────────────────────────────────────────────────────

/** Legacy: return playCount map. Komponen lama (vibeScore) masih pakai ini. */
export function getPlayStats(): PlayStats {
  const v2 = readStatsV2();
  const out: PlayStats = {};
  for (const id of Object.keys(v2)) out[id] = v2[id].playCount;
  return out;
}

export function getPlayStatsV2(): PlayStatsV2 {
  return readStatsV2();
}

export function getRecentlyPlayed(): string[] {
  return readRecent();
}

export function recordPlay(trackId: string | number) {
  if (typeof window === "undefined" || !trackId) return;
  const stats = readStatsV2();
  const key = String(trackId);
  const cur = stats[key] || {
    playCount: 0,
    completedCount: 0,
    skipCount: 0,
    lastPlayedAt: 0,
  };
  stats[key] = {
    ...cur,
    playCount: cur.playCount + 1,
    lastPlayedAt: Date.now(),
  };
  writeStatsV2(stats);

  // Update sliding window history (deduped)
  const recent = readRecent().filter((id) => id !== key);
  recent.unshift(key);
  writeRecent(recent);
}

/** Catat hasil playback berdasarkan progress ratio (0..1). Dipanggil saat ganti lagu. */
export function recordPlaybackResult(
  trackId: string | number,
  progressRatio: number,
) {
  if (typeof window === "undefined" || !trackId) return;
  const stats = readStatsV2();
  const key = String(trackId);
  const cur = stats[key];
  if (!cur) return;
  if (progressRatio >= COMPLETE_THRESHOLD) {
    stats[key] = { ...cur, completedCount: cur.completedCount + 1 };
  } else if (progressRatio < SKIP_THRESHOLD) {
    stats[key] = { ...cur, skipCount: cur.skipCount + 1 };
  } else {
    return; // mid-skip, tidak dihitung
  }
  writeStatsV2(stats);
}

// ── Scoring ───────────────────────────────────────────────────────────────

/**
 * Skor "affinity" — seberapa user suka lagu ini.
 *   • completedCount × 6   → reward selesai dengarkan
 *   • playCount × 2        → reward play
 *   • skipCount × -8       → hukuman skip (kuat)
 *   • cold start (0 play)  → +3 (biar lagu baru dapat kesempatan)
 *   • recency decay        → lagu yang lama tidak diputar dapat boost (eksplorasi)
 */
function affinityScore(stat: TrackStat | undefined): number {
  if (!stat || stat.playCount === 0) return 3; // cold-start boost
  const base =
    stat.completedCount * 6 + stat.playCount * 2 - stat.skipCount * 8;
  // Decay: makin lama tidak diputar, makin tinggi rasa "rindu"
  const daysSince = (Date.now() - stat.lastPlayedAt) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.min(daysSince * 0.5, 6); // cap +6
  return Math.max(0.5, base + recencyBoost);
}

function titleWords(track: any): string[] {
  return (track?.title || track?.trackTitle || "")
    .toLowerCase()
    .split(/[\s\-_,.()\[\]]+/)
    .filter((w: string) => w.length > 3);
}

/**
 * Skor "vibe" — seberapa cocok kandidat dengan lagu referensi.
 *   • Artis sama          → +100
 *   • Kata judul overlap  → +15 per kata
 *   • Affinity user       → +affinityScore (cocok dengan selera)
 */
export function vibeScore(
  candidate: any,
  reference: any,
  stats: PlayStats,
): number {
  // Kompatibilitas dengan legacy PlayStats (Record<string, number>) ─
  // ubah ke V2 saat dipakai untuk affinity
  const v2 = readStatsV2();
  let score = affinityScore(v2[String(candidate?.id)]);

  if (!reference) return score;

  const refArtist = (reference.artist || reference.artistName || "")
    .toLowerCase()
    .trim();
  const candArtist = (candidate.artist || candidate.artistName || "")
    .toLowerCase()
    .trim();
  if (refArtist && candArtist && refArtist === candArtist) score += 100;

  const refWords = new Set(titleWords(reference));
  for (const w of titleWords(candidate)) {
    if (refWords.has(w)) score += 15;
  }

  return score;
}

export function sortByVibe<T>(
  candidates: T[],
  reference: any,
  _stats: PlayStats,
): T[] {
  return [...candidates].sort(
    (a, b) =>
      vibeScore(b, reference, _stats) - vibeScore(a, reference, _stats),
  );
}

// ── Shuffle generators ────────────────────────────────────────────────────

/** Weighted random pick — basic, dipakai untuk fallback. */
export function weightedShuffle<T extends { id?: any }>(
  tracks: T[],
  excludeId: string | number | null,
  _stats: PlayStats,
): T {
  const v2 = readStatsV2();
  const pool =
    excludeId != null
      ? tracks.filter((t) => String(t.id) !== String(excludeId))
      : tracks;
  if (pool.length === 0) return tracks[0];

  const weights = pool.map((t) => affinityScore(v2[String(t.id)]));
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Shuffle pintar:
 *   1. Anti-repeat — drop lagu di RECENT_WINDOW terakhir (kecuali kalau queue habis)
 *   2. Vibe-aware — kalau ada referensi (currentTrack), lagu mirip dapat boost
 *   3. Affinity-weighted random sort
 *
 * Lagu favorit (sering completed) → cenderung muncul lebih awal.
 * Lagu yang sering di-skip → cenderung muncul belakangan.
 * Lagu cold-start (belum pernah diputar) → tetap punya kesempatan tampil.
 */
export function generateShuffleQueue<T extends { id?: any }>(
  tracks: T[],
  excludeId: string | number | null,
  _stats: PlayStats,
  reference?: any,
): T[] {
  const v2 = readStatsV2();
  const recent = new Set(readRecent());
  if (excludeId != null) recent.add(String(excludeId));

  let pool = tracks.filter((t) => !recent.has(String(t.id)));
  // Kalau anti-repeat terlalu agresif (queue habis), longgarkan:
  // hanya exclude currentTrack saja
  if (pool.length === 0) {
    pool = excludeId != null
      ? tracks.filter((t) => String(t.id) !== String(excludeId))
      : [...tracks];
  }
  if (pool.length === 0) return [];

  const ref = reference;

  return pool
    .map((t) => {
      const stat = v2[String((t as any).id)];
      const affinity = affinityScore(stat);
      const vibeBoost = ref ? vibeScore(t as any, ref, {}) / 50 : 0;
      // Weighted random key — Math.random() × (affinity + vibe)
      const weight = affinity + vibeBoost;
      return { track: t, key: Math.random() * weight };
    })
    .sort((a, b) => b.key - a.key)
    .map((x) => x.track);
}
