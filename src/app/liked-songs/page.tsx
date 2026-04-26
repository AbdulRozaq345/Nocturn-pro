"use client";

import React, { useEffect, useState } from "react";
import { Play, Shuffle, Download, MoreHorizontal, Heart } from "lucide-react";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext";
import { applyPersistedLikeState } from "@/lib/utils";

export default function LikedSongs() {
  const { setTracks, setCurrentTrack, setIsPlaying } = usePlayer();
  const { showMenu } = useGlobalMenu();
  const [likedTracks, setLikedTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeTrack = (track: any, forceLiked = false) => {
    const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";

    return {
      ...track,
      title: track.trackTitle || track.title || "Unknown Title",
      artist: track.artistName || track.artist || "Unknown Artist",
      cover_url: track.playlistCover
        ? `${API_BASE}/storage/${track.playlistCover}`
        : "/default-cover.png",
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
      is_liked: forceLiked || Boolean(track.is_liked),
    };
  };

  const loadLikedTracksFromAllTracks = async () => {
    const res = await api.get("/api/tracks");
    const resData = res.data;
    const rawData = resData?.data || resData;
    const normalizedTracks = Array.isArray(rawData)
      ? rawData
          .map((track: any) => normalizeTrack(track))
          .map(applyPersistedLikeState)
      : [];

    return normalizedTracks.filter((track: any) => track.is_liked);
  };

  const loadLikedTracks = async () => {
    const endpoints = ["/api/tracks/liked", "/api/tracks/liked-tracks"];

    for (const endpoint of endpoints) {
      try {
        const res = await api.get(endpoint);
        const resData = res.data;
        const rawData = resData?.data || resData;
        return Array.isArray(rawData)
          ? rawData.map((track: any) => normalizeTrack(track, true))
          : [];
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          throw err;
        }
      }
    }

    // Fallback kalau endpoint liked khusus belum didaftarkan di backend.
    return loadLikedTracksFromAllTracks();
  };

  useEffect(() => {
    loadLikedTracks()
      .then((data) => {
        setLikedTracks(data);
        setTracks((prev) => {
          const likedIds = new Set(data.map((track) => String(track.id)));
          const mergedTracks = prev.map((track) =>
            likedIds.has(String(track.id))
              ? { ...track, is_liked: true }
              : track,
          );

          const existingIds = new Set(
            mergedTracks.map((track) => String(track.id)),
          );
          const missingLikedTracks = data.filter(
            (track) => !existingIds.has(String(track.id)),
          );

          return [...mergedTracks, ...missingLikedTracks];
        });
      })
      .catch((err) => {
        console.error("Gagal narik liked songs dari backend!", err);
        setLikedTracks([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handlePlayTrack = (track: any) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  return (
    <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-black pb-32">
      {/* Hero Header Section - Samain kayak Playlist Page */}
      <div className="relative min-h-[650px] md:min-h-0 md:h-[60vh] flex items-end px-6 md:px-12 pb-10 overflow-hidden">
        {/* Background Blur Effect - Pake warna ijo Spotify/Liked vibe */}
        <div className="absolute inset-0 scale-110 blur-3xl opacity-30 transition-opacity duration-1000 bg-[#1cb853]" />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* pt-44 di mobile buat ngedorong konten ke bawah */}
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-end w-full pt-44 md:pt-0">
          {/* Iconic Heart Cover */}
          <div className="group relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 shadow-[0_25px_60px_-15px_rgba(28,184,83,0.3)] rounded-lg overflow-hidden bg-gradient-to-br from-[#1cb853] to-[#002a0c] flex-shrink-0 flex items-center justify-center border border-white/10">
            <Heart
              size={100}
              fill="white"
              className="text-white/90 transition-transform duration-500 group-hover:scale-110"
            />
          </div>

          {/* Info Section */}
          <div className="flex flex-col gap-4 text-center md:text-left flex-1 pb-2">
            <div className="space-y-1">
              <span className="text-[0.7rem] font-bold uppercase tracking-[0.5em] text-[#72fe8f] drop-shadow-md">
                Personal Collection
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-none text-white drop-shadow-2xl italic uppercase break-words">
                Liked Songs
              </h1>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <div className="flex items-center gap-2 text-gray-300 font-mono text-[10px] md:text-xs tracking-widest bg-white/5 backdrop-blur-sm border border-white/10 px-3 py-1.5 rounded-full">
                <span className="text-white/60">STATION:</span>
                <span className="text-[#72fe8f] font-bold uppercase">
                  Nocturn
                </span>
                <span className="text-white/20">|</span>
                <span className="text-[#72fe8f]">
                  {likedTracks.length} TRACKS
                </span>
                <span className="text-white/20">|</span>
                <span className="bg-white/10 px-2 py-0.5 rounded text-[8px]">
                  HI-RES
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 md:px-12 py-8 flex items-center gap-8">
        <button
          onClick={() =>
            likedTracks.length > 0 && handlePlayTrack(likedTracks[0])
          }
          disabled={likedTracks.length === 0}
          className="w-16 h-16 bg-[#72fe8f] rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(114,254,143,0.3)] disabled:opacity-50"
        >
          <Play fill="black" size={28} className="ml-1" />
        </button>

        <div className="flex items-center gap-6">
          <button className="text-gray-400 hover:text-[#72fe8f] transition-colors">
            <Shuffle size={24} />
          </button>
          <button className="text-gray-400 hover:text-[#72fe8f] transition-colors">
            <Download size={24} />
          </button>
          <button className="text-gray-400 hover:text-[#72fe8f] transition-colors">
            <MoreHorizontal size={24} />
          </button>
        </div>
      </div>

      {/* Tracklist Table */}
      <div className="px-4 md:px-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 p-4 md:p-6 mb-20">
          {loading ? (
            <div className="py-24 text-center text-gray-500 font-mono text-xs uppercase tracking-widest">
              Loading liked tracks...
            </div>
          ) : likedTracks.length > 0 ? (
            <div className="flex flex-col gap-3">
              {likedTracks.map((track: any, i: number) => (
                <div
                  key={track.id || i}
                  onClick={() => {
                    handlePlayTrack(track);
                  }}
                  onContextMenu={(e) => showMenu(e, track, "general")}
                  className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 p-4 rounded-xl flex items-center gap-4 hover:bg-[#262626] transition-colors cursor-pointer group shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5"
                >
                  <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center shadow-inner overflow-hidden flex-shrink-0">
                    <img
                      src={track.albumArt || "/nocturn.avif"}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      alt={track.title || "Cover"}
                    />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-white text-base truncate">
                      {track.title}
                    </h3>
                    <p className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase truncate">
                      {track.artist}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-[#a1a1aa] hidden md:block">
                    {track.duration || "00:00"}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      showMenu(e, track, "general");
                    }}
                    className="text-[#a1a1aa] hover:text-[#72fe8f] transition-colors p-1"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <Heart
                className="mx-auto text-gray-800 mb-4 opacity-20"
                size={64}
              />
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                No_Liked_Songs_Found_In_Database
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
