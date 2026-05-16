"use client";

import { useEffect, useState, useRef } from "react";
import { Play, Trash2, WifiOff, HardDrive, Music } from "lucide-react";
import {
  getAllOfflineTracks,
  getOfflineAudioBlob,
  removeOfflineTrack,
  formatBytes,
  type OfflineTrackMeta,
} from "@/lib/offlineStorage";
import { unmarkOfflineOnServer } from "@/lib/offlineSync";
import { usePlayer } from "@/context/PlayerContext";

export default function DownloadedLibrary() {
  const [tracks, setTracks] = useState<OfflineTrackMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalSize, setTotalSize] = useState(0);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const blobUrlsRef = useRef<Record<string, string>>({});
  const { setCurrentTrack, setIsPlaying, setTracks: setPlayerTracks } = usePlayer();

  useEffect(() => {
    getAllOfflineTracks()
      .then((data) => {
        setTracks(data);
        setTotalSize(data.reduce((s, t) => s + t.fileSize, 0));
      })
      .finally(() => setLoading(false));

    return () => {
      // Revoke semua blob URL saat unmount
      Object.values(blobUrlsRef.current).forEach(URL.revokeObjectURL);
    };
  }, []);

  const handlePlay = async (meta: OfflineTrackMeta) => {
    setPlayingId(meta.id);
    try {
      // Buat blob URL untuk semua track sekaligus supaya playNext bisa lanjut tanpa network
      await Promise.all(
        tracks.map(async (t) => {
          if (blobUrlsRef.current[t.id]) return;
          const blob = await getOfflineAudioBlob(t.id);
          if (blob) blobUrlsRef.current[t.id] = URL.createObjectURL(blob);
        }),
      );

      if (!blobUrlsRef.current[meta.id]) return; // track yg dipilih nggak ada blobnya

      // Bangun daftar semua offline tracks sebagai player queue (hanya yang punya blob URL)
      const offlineQueue = tracks
        .filter((t) => blobUrlsRef.current[t.id])
        .map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          duration: t.duration,
          albumArt: t.coverDataUrl,
          cover_url: t.coverDataUrl,
          audio_url: blobUrlsRef.current[t.id],
          is_liked: false,
        }));

      setPlayerTracks(offlineQueue);
      setCurrentTrack({
        id: meta.id,
        title: meta.title,
        artist: meta.artist,
        duration: meta.duration,
        albumArt: meta.coverDataUrl,
        cover_url: meta.coverDataUrl,
        audio_url: blobUrlsRef.current[meta.id],
        is_liked: false,
      });
      setIsPlaying(true);
    } finally {
      setPlayingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await removeOfflineTrack(id);
    unmarkOfflineOnServer(id).catch(() => {}); // fire-and-forget, tidak perlu tunggu network
    if (blobUrlsRef.current[id]) {
      URL.revokeObjectURL(blobUrlsRef.current[id]);
      delete blobUrlsRef.current[id];
    }
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
              Klik kanan lagu → "Simpan Offline"
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
                {track.coverDataUrl && track.coverDataUrl !== "/nocturn.avif" ? (
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
                  disabled={playingId === track.id}
                  className="w-9 h-9 rounded-full bg-[#72fe8f] flex items-center justify-center text-black hover:scale-110 active:scale-90 transition-transform disabled:opacity-60"
                >
                  {playingId === track.id ? (
                    <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play size={14} fill="black" className="ml-0.5" />
                  )}
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
