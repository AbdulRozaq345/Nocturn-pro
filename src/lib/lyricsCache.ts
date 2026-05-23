import api from "@/lib/axios";

export interface LyricLine {
  time: number; // detik dari awal lagu
  text: string;
}

interface CachedEntry {
  lines: LyricLine[] | null;
  fetchedAt: number;
}

const TTL = 7 * 24 * 60 * 60 * 1000;

// v2: busts old cache that used wrong shape before normalize was fixed
const cacheKey = (id: string | number) => `nocturn_lyrics_v2_${id}`;

function readCache(id: string | number): LyricLine[] | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = localStorage.getItem(cacheKey(id));
    if (!raw) return undefined;
    const entry: CachedEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > TTL) {
      localStorage.removeItem(cacheKey(id));
      return undefined;
    }
    return entry.lines;
  } catch {
    return undefined;
  }
}

function writeCache(id: string | number, lines: LyricLine[] | null) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(id), JSON.stringify({ lines, fetchedAt: Date.now() } satisfies CachedEntry));
  } catch {}
}

function parseLRC(lrc: string): LyricLine[] | null {
  const lines: LyricLine[] = [];
  // Mendukung [mm:ss.xx] dan [mm:ss.xxx]
  const re = /\[(\d+):(\d+)\.(\d+)\]\s*(.*)/;
  for (const row of lrc.split("\n")) {
    const m = row.match(re);
    if (!m) continue;
    const ms = m[3].padEnd(3, "0").slice(0, 3);
    const time = parseInt(m[1]) * 60 + parseInt(m[2]) + parseInt(ms) / 1000;
    const text = m[4].trim();
    if (text) lines.push({ time, text });
  }
  return lines.length > 0 ? lines : null;
}

// Plain text: no timestamps — all lines get time=999999 so activeIndex stays -1
// (panel shows static list at 0.45 opacity, no auto-scroll)
function parsePlain(text: string): LyricLine[] | null {
  const lines = text
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => ({ time: 999999, text: t }));
  return lines.length > 0 ? lines : null;
}

function normalize(data: unknown): LyricLine[] | null {
  if (!data) return null;
  if (typeof data === "string") return parseLRC(data);
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;

    // Backend shape: { found, syncedText, plainText, isSynced, ... }
    if (d.found === false) return null;
    if (typeof d.syncedText === "string" && d.syncedText.trim()) return parseLRC(d.syncedText);
    if (typeof d.plainText === "string" && d.plainText.trim()) return parsePlain(d.plainText);

    // Fallback shapes
    if (typeof d.lyrics === "string") return parseLRC(d.lyrics);
    if (Array.isArray(d.lines) && d.lines.length) return d.lines as LyricLine[];
    if (Array.isArray(data) && (data as unknown[]).length) return data as LyricLine[];
  }
  return null;
}

export async function fetchLyrics(trackId: string | number): Promise<LyricLine[] | null> {
  const cached = readCache(trackId);
  if (cached !== undefined) return cached;

  try {
    const res = await api.get(`/api/tracks/${trackId}/lyrics`);
    const lines = normalize(res.data);
    writeCache(trackId, lines);
    return lines;
  } catch {
    writeCache(trackId, null);
    return null;
  }
}
