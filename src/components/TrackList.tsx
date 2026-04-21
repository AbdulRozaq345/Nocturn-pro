"use client";

import { Play, Clock } from "lucide-react";
import { useGlobalMenu } from "@/context/MenuContext";

export default function TrackList({
  tracks,
  onPlay,
}: {
  tracks: any[];
  onPlay: (track: any) => void;
}) {
  const { showMenu } = useGlobalMenu();

  return (
    // Padding dikecilin buat mobile biar gak terlalu boros ruang
    <section className="px-4 md:px-12 py-8 mb-24">
      {/* HEADER: Metadata & Clock disembunyiin di Mobile (hidden md:grid) */}
      <div className="grid grid-cols-[32px_1fr] md:grid-cols-[48px_1fr_120px_80px] px-4 py-3 text-[0.6rem] font-bold text-gray-500 uppercase tracking-widest border-b border-white/5 mb-4 font-mono">
        <span>#</span>
        <span>Track / Artist</span>
        <span className="hidden md:block text-right">Metadata</span>
        <span className="hidden md:block text-right">
          <Clock size={12} className="inline" />
        </span>
      </div>

      <div className="flex flex-col">
        {Array.isArray(tracks) &&
          tracks.map((track, index) => (
            <div
              key={`track-${track.id || "new"}-${index}`}
              onClick={(e) => {
                e.preventDefault();
                onPlay(track);
              }}
              onContextMenu={(e) => showMenu(e, track, "general")}
              // GRID: Di mobile cuma 2 kolom, di desktop balik ke 4 kolom
              className="grid grid-cols-[32px_1fr] md:grid-cols-[48px_1fr_120px_80px] items-center px-4 py-3 rounded-sm hover:bg-white/5 transition-all group cursor-pointer border-b border-white/[0.02] gap-2"
            >
              {/* Nomor / Play Icon */}
              <div className="flex items-center justify-start">
                <span className="text-gray-500 text-[10px] md:text-xs font-mono group-hover:hidden">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Play
                  size={14}
                  className="hidden group-hover:block text-[#72fe8f] fill-[#72fe8f]"
                />
              </div>

              {/* Skeleton Music & Info - Pake min-w-0 biar truncate jalan */}
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden min-w-0">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-[#121212] rounded-sm flex-shrink-0 border border-white/5 flex items-center justify-center relative overflow-hidden group-hover:border-[#72fe8f]/30 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
                  <img
                    src={track.albumArt || "/nocturn.avif"}
                    className="text-gray-700 group-hover:text-[#72fe8f] transition-colors w-full h-full object-cover"
                    alt={track.title || "Track Cover"}
                  />
                </div>

                {/* Info Teks - truncate wajib di sini */}
                <div className="flex flex-col truncate">
                  <span className="text-white text-xs md:text-sm font-bold tracking-tight truncate group-hover:text-[#72fe8f] transition-colors uppercase">
                    {track.title}
                  </span>
                  <span className="text-[0.55rem] md:text-[0.6rem] text-gray-500 font-mono uppercase tracking-tighter truncate">
                    {track.artist}
                  </span>
                </div>
              </div>

              {/* Metadata - Sembunyi di Mobile */}
              <div className="hidden md:flex justify-end">
                <span className="text-[0.6rem] text-gray-600 font-mono text-right border border-white/5 py-0.5 px-1 rounded-sm">
                  24bit / FLAC
                </span>
              </div>

              {/* Duration - Sembunyi di Mobile */}
              <span className="hidden md:block text-[0.6rem] text-gray-500 font-mono text-right">
                {track.duration || "03:45"}
              </span>
            </div>
          ))}
      </div>
    </section>
  );
}
