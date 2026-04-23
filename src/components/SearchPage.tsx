"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ArrowLeft,
  X,
  Clock,
  Play,
  MoreVertical,
  Camera,
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext";

import Link from "next/link";

// helper for duration
const formatDuration = (seconds: number) => {
  if (!seconds) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export default function SearchPage() {
  // State buat ngatur alur sesuai gambar lo
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [databaseSongs, setDatabaseSongs] = useState<any[]>([]);

  const { setCurrentTrack, setIsPlaying, setTracks } = usePlayer();
  const { showMenu } = useGlobalMenu();

  useEffect(() => {
    // Ambil data lagu dari database (API)
    import("@/lib/axios").then((module) => {
      const api = module.default;
      api
        .get("/api/tracks")
        .then((res) => {
          if (res.data && res.data.data) {
            const API_BASE =
              api.defaults.baseURL || "https://panel.nexxacodeid.site";
            const formattedTracks = res.data.data.map((track: any) => ({
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
                    .padStart(
                      2,
                      "0",
                    )}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
                : track.duration || "00:00",
            }));
            setDatabaseSongs(formattedTracks);
          }
        })
        .catch((err) => console.log("Gagal mengambil data lagu", err));
    });
  }, []);

  // 1. Tampilan Utama (Gambar 1)
  const renderMainSearch = () => (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-black tracking-tighter italic text-[#72fe8f]">
        MULAI_JELAJAHI
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {["Musik"].map((cat, i) => (
          <Link
            href={`/${cat.toLowerCase()}`}
            key={i}
            className="h-24 rounded-sm bg-gradient-to-br from-white/10 to-transparent border border-white/5 p-3 relative overflow-hidden group cursor-pointer block"
          >
            <span className="font-black italic uppercase text-xs tracking-widest">
              {cat}
            </span>
            <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-[#72fe8f]/20 rotate-12 group-hover:scale-110 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );

  // 2. History & Suggestion (Gambar 2 & 3)
  const renderSearchHistory = () => (
    <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-2 duration-300">
      <h3 className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em]">
        Recent_Searches
      </h3>
      {["Skyfall", "Sempurna", "Nina"].map((item, i) => (
        <div
          key={i}
          className="flex items-center justify-between group cursor-pointer py-1"
        >
          <div className="flex items-center gap-4">
            <Clock size={16} className="text-gray-600" />
            <span className="text-sm font-bold text-gray-300 group-hover:text-[#72fe8f]">
              {item}
            </span>
          </div>
          <X size={14} className="text-gray-700 hover:text-white" />
        </div>
      ))}
    </div>
  );

  // 4. Hasil Search (Gambar 4)
  const renderSearchResults = () => {
    const matchedSongs = databaseSongs.filter(
      (song) =>
        song.trackTitle?.toLowerCase().includes(query.toLowerCase()) ||
        song.artistName?.toLowerCase().includes(query.toLowerCase()),
    );

    // Ambil beberapa lagu dari database (yang bukan hasil search) untuk direkomendasikan
    const otherSongs = databaseSongs.filter(
      (song) =>
        !song.trackTitle?.toLowerCase().includes(query.toLowerCase()) &&
        !song.artistName?.toLowerCase().includes(query.toLowerCase()),
    );
    const recommendedSongs = otherSongs.slice(0, 8); // Tampilkan 8 rekomendasi saja

    const handlePlaySong = (song: any, list: any[]) => {
      // Set antrean lagu ke context player agar bisa 'next/previous'
      setTracks(list);
      // Set lagu yang sekarang dimainkan
      setCurrentTrack(song);
      // Paksa mainkan
      setIsPlaying(true);
    };

    return (
      <div className="flex flex-col gap-2 animate-in fade-in duration-300">
        {/* Tab Filter ala Gambar 4 */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {["Lagu", "Playlist", "Album", "Artis"].map((tab, i) => (
            <button
              key={i}
              className={`px-4 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-widest border ${i === 0 ? "bg-[#72fe8f] text-black border-[#72fe8f]" : "border-white/10 text-gray-400"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Hasil Pencarian (Sesuai Query) */}
        {matchedSongs.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-mono text-[#72fe8f] uppercase tracking-[0.2em] mb-3">
              Hasil Pencarian
            </h3>
            <div className="flex flex-col gap-3">
              {matchedSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handlePlaySong(song, databaseSongs)}
                  className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 p-4 rounded-xl flex items-center gap-4 hover:bg-[#262626] transition-colors cursor-pointer group shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-[#72fe8f]/30"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center overflow-hidden border border-[#72fe8f]/20 relative">
                    <img
                      src={song.albumArt || "/nocturn.avif"}
                      alt={song.trackTitle || "Album Art"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play
                        size={20}
                        className="text-[#72fe8f] fill-[#72fe8f]"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-[#72fe8f] text-base truncate uppercase italic tracking-tighter">
                      {song.trackTitle}
                    </h3>
                    <p className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase truncate tracking-widest">
                      {song.artistName}
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
              ))}
            </div>
          </div>
        )}

        {/* Separator / Margin */}
        {matchedSongs.length > 0 && recommendedSongs.length > 0 && (
          <div className="w-full h-px bg-white/10 my-4"></div>
        )}

        {/* Lagu Rekomendasi di Database */}
        {recommendedSongs.length > 0 && (
          <div>
            <h3 className="text-xs font-mono text-gray-500 uppercase tracking-[0.2em] mb-3">
              Lagu Rekomendasi
            </h3>
            <div className="flex flex-col gap-3">
              {recommendedSongs.map((song) => (
                <div
                  key={`other-${song.id}`}
                  onClick={() => handlePlaySong(song, databaseSongs)}
                  className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 p-4 rounded-xl flex items-center gap-4 hover:bg-[#262626] transition-colors cursor-pointer group shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center overflow-hidden relative">
                    <img
                      src={song.albumArt || "/nocturn.avif"}
                      alt={song.trackTitle || "Album Art"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play
                        size={20}
                        className="text-[#72fe8f] fill-[#72fe8f]"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-white text-base truncate uppercase italic tracking-tighter">
                      {song.trackTitle}
                    </h3>
                    <p className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase truncate tracking-widest">
                      {song.artistName}
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
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-screen bg-[#0a0a0a] text-white px-5 pt-20 pb-40">
      {/* Header Search Input */}
      <div
        className={`flex items-center gap-3 mb-8 transition-all duration-300 ${isFocused ? "translate-y-[-10px]" : ""}`}
      >
        {isFocused && (
          <button
            onClick={() => {
              setIsFocused(false);
              setQuery("");
            }}
            className="text-[#72fe8f]"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        <div className="flex-1 relative group">
          <Search
            className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isFocused ? "text-[#72fe8f]" : "text-gray-500"}`}
            size={18}
          />
          <input
            type="text"
            placeholder="Apa yang ingin kamu dengarkan?"
            value={query}
            onFocus={() => setIsFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearching(e.target.value.length > 0);
            }}
            className="w-full bg-[#1a1a1a] border border-white/5 focus:border-[#72fe8f]/50 py-3.5 pl-12 pr-4 rounded-sm text-sm font-bold tracking-tight focus:outline-none transition-all placeholder:text-gray-600"
          />
          {!isFocused && (
            <Camera
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
              size={18}
            />
          )}
        </div>
      </div>

      {/* Logic Alur Tampilan */}
      {!isFocused && renderMainSearch()}
      {isFocused && !isSearching && renderSearchHistory()}
      {isSearching && renderSearchResults()}
    </div>
  );
}
