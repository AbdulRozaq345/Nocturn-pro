"use client";

import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, MoreVertical } from "lucide-react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext";
import { applyPersistedLikeState } from "@/lib/utils";

const formatDuration = (seconds: number) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function MusikPage() {
  const router = useRouter();
  const [songs, setSongs] = useState<any[]>([]);
  const { setCurrentTrack, setIsPlaying, setTracks } = usePlayer();
  const { showMenu } = useGlobalMenu();

  useEffect(() => {
    import("@/lib/axios").then((module) => {
      const api = module.default;
      api
        .get("/api/tracks")
        .then((res) => {
          if (res.data && res.data.data) {
            const API_BASE =
              api.defaults.baseURL || "https://panel.nexxacodeid.site";
            const formattedTracks = res.data.data
              .map((track: any) => ({
                ...track,
                title: track.trackTitle || track.title || "Unknown Title",
                artist: track.artistName || track.artist || "Unknown Artist",
                audio_url:
                  track.fileName || track.file_name
                    ? `${API_BASE}/storage/music/${track.fileName || track.file_name}`
                    : track.audio_url || null,
                duration: track.durationSeconds
                  ? `${Math.floor(track.durationSeconds / 60)
                      .toString()
                      .padStart(2, "0")}:${(track.durationSeconds % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : track.duration || "00:00",
              }))
              .map(applyPersistedLikeState);
            setSongs(formattedTracks);
          }
        })
        .catch((err) => console.error(err));
    });
  }, []);

  const handlePlaySong = (song: any) => {
    setTracks(songs);
    setCurrentTrack(song);
    setIsPlaying(true);
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0a] text-white px-5 pt-20 pb-40">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push("/search")}
          className="text-[#72fe8f]"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-3xl font-black italic text-[#72fe8f] uppercase tracking-tighter">
          SEMUA MUSIK
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        {songs.length > 0 ? (
          songs.map((song) => (
            <div
              key={song.id}
              onClick={() => handlePlaySong(song)}
              className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 p-4 rounded-xl flex items-center gap-4 hover:bg-[#262626] transition-colors cursor-pointer group shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5"
            >
              <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-[#72fe8f]/20 relative">
                <img
                  src={song.albumArt || "/nocturn.avif"}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play size={20} className="text-[#72fe8f] fill-[#72fe8f]" />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-bold text-[#72fe8f] text-base truncate uppercase italic tracking-tighter">
                  {song.trackTitle || song.title}
                </h3>
                <p className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase truncate tracking-widest">
                  {song.artistName || song.artist}
                </p>
              </div>
              <span className="text-xs font-mono text-[#a1a1aa]">
                {formatDuration(song.durationSeconds)}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  showMenu(e, song, "general");
                }}
                className="text-[#a1a1aa] hover:text-[#72fe8f] transition-colors p-1"
              >
                <MoreVertical size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 font-mono mt-10">
            Sedang memuat lagu...
          </div>
        )}
      </div>
    </div>
  );
}
