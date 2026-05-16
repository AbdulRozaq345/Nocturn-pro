"use client";

import { useEffect, useState } from "react";
import { Play, Trash2, WifiOff, HardDrive, Music } from "lucide-react";
import {
  getAllOfflineTracks,
  removeOfflineTrack,
  formatBytes,
  type OfflineTrackMeta,
} from "@/lib/offlineStorage";
import { unmarkOfflineOnServer } from "@/lib/offlineSync";
import {
  preloadOfflineCache,
  getCachedBlobUrl,
  removeCachedBlobUrl,
  subscribeOfflineCache,
} from "@/lib/offlineCache";
import { usePlayer } from "@/context/PlayerContext";

export default function DownloadedLibrary() {
  const [tracks, setTracks] = useState<OfflineTrackMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { setTracks: setPlayerTracks, playTrackRef } = usePlayer();

  useEffect(() => {
    let cancelled = false;

    const loadAll = async () => {
      try {
        // Gunakan shared cache supaya blob URL tidak duplikat di-create
        await preloadOfflineCache();
        const data = await getAllOfflineTracks();
        if (cancelled) return;

        setTracks(data);
        setTotalSize(data.reduce((s, t) => s + t.fileSize, 0));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadAll();

    // Re-render saat cache berubah (track baru di-save / dihapus dari tempat lain)
    const unsubscribe = subscribeOfflineCache(() => {
      if (!cancelled) loadAll();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // handlePlay harus sinkronus (tidak ada await) supaya user-gesture context tidak hilang
  // yang bisa menyebabkan autoplay policy memblokir audio.play()
  const handlePlay = (meta: OfflineTrackMeta) => {
    const blobUrl = getCachedBlobUrl(meta.id);
    if (!blobUrl) return; // blob belum siap (sangat jarang setelah loading selesai)

    // Bangun queue dari semua track yang blob-nya sudah siap
    const offlineQueue = tracks
      .map((t) => {
        const url = getCachedBlobUrl(t.id);
        if (!url) return null;
        return {
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          albumArt: t.coverDataUrl,
          cover_url: t.coverDataUrl,
          audio_url: url,
          is_liked: false,
          is_offline: true,
        };
      })
      .filter(Boolean);

    setPlayerTracks(offlineQueue as any[]);

    playTrackRef.current({
      id: meta.id,
      title: meta.title,
      artist: meta.artist,
      duration: meta.duration,
      albumArt: meta.coverDataUrl,
      cover_url: meta.coverDataUrl,
      audio_url: blobUrl,
      is_liked: false,
      is_offline: true,
    });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await removeOfflineTrack(id);
    unmarkOfflineOnServer(id).catch(() => {}); // fire-and-forget
    removeCachedBlobUrl(id);
    setTracks((prev) => {
      const next = prev.filter((t) => t.id !== id);
      setTotalSize(next.reduce((s, t) => s + t.fileSize, 0));
      return next;
    });
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[#72fe8f] font-mono text-xs tracking-[0.3em]">
        <div className="w-8 h-8 border-2 border-[#72fe8f] border-t-transparent rounded-full animate-spin mb-4" />
        LOADING_OFFLINE_LIBRARY...
      </div>
    );
  }

  return (
    <div className="flex-1 pb-40 w-full px-4 md:px-12 bg-transparent min-h-full text-white flex flex-col pt-6">
      {/* Header */}
      <div className="sticky top-0 md:top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md py-3 border-b border-white/5 -mx-4 px-4 md:-mx-12 md:px-12 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WifiOff size={16} className="text-[#72fe8f]" />
            <span className="font-mono text-[0.65rem] font-bold uppercase tracking-widest text-[#72fe8f]">
              Offline / Downloaded
            </span>
          </div>
          {tracks.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-mono text-gray-500">
              <HardDrive size={12} />
              <span>{formatBytes(totalSize)}</span>
              <span className="text-gray-700">·</span>
              <span>{tracks.length} lagu</span>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {tracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-6 py-24 text-center">
          <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <WifiOff size={36} className="text-gray-700" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-gray-500 mb-2">
              Belum Ada Lagu Offline
            </p>
            <p className="text-[11px] text-gray-600 font-mono">
              Klik kanan lagu → &quot;Simpan Offline&quot;
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-colors group"
            >
              {/* Cover */}
              <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative bg-[#1a1a1a]">
                {track.coverDataUrl &&
                track.coverDataUrl !== "/nocturn.avif" ? (
                  <img
                    src={track.coverDataUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={20} className="text-gray-700" />
                  </div>
                )}
                {/* Offline badge */}
                <div className="absolute bottom-0 right-0 bg-[#72fe8f] rounded-tl-md px-1">
                  <WifiOff size={8} className="text-black" />
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate uppercase tracking-tight">
                  {track.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-mono text-gray-500 truncate uppercase">
                    {track.artist}
                  </span>
                  <span className="text-gray-700 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-gray-600">
                    {track.duration}
                  </span>
                  <span className="text-gray-700 text-[10px]">·</span>
                  <span className="text-[10px] font-mono text-gray-700">
                    {formatBytes(track.fileSize)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handlePlay(track)}
                  className="w-9 h-9 rounded-full bg-[#72fe8f] flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform disabled:opacity-60"
                >
                  <Play size={14} fill="black" className="ml-0.5" />
                </button>
                <button
                  onClick={() => handleDelete(track.id)}
                  disabled={deletingId === track.id}
                  className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                >
                  {deletingId === track.id ? (
                    <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer info */}
      {tracks.length > 0 && (
        <div className="mt-10 px-6 py-6 border-t border-white/5">
          <p className="text-[10px] font-mono text-gray-700 text-center">
            Lagu offline disimpan di browser device ini.
            <br />
            Hapus cache browser = lagu offline hilang.
          </p>
        </div>
      )}
    </div>
  );
}
