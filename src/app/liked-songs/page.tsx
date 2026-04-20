"use client";

import React, { useEffect } from "react";
import { Play, Shuffle, Download, MoreHorizontal, Heart } from "lucide-react";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import TrackList from "@/components/TrackList";

export default function LikedSongs() {
  const { tracks, setTracks, setCurrentTrack, setIsPlaying, currentTrack } =
    usePlayer();

  useEffect(() => {
    if (tracks.length === 0) {
      const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";
      api
        .get("/api/tracks")
        .then((res) => {
          const resData = res.data;
          const rawData = resData?.data || resData;
          const data = Array.isArray(rawData)
            ? rawData.map((track: any) => ({
                ...track,
                title: track.trackTitle || "Unknown Title",
                artist: track.artistName || "Unknown Artist",
                cover_url: track.playlistCover
                  ? `${API_BASE}/storage/${track.playlistCover}`
                  : "/default-cover.png",
                audio_url:
                  track.fileName || track.file_name
                    ? `${API_BASE}/storage/music/${track.fileName || track.file_name}`
                    : null,
                duration: track.durationSeconds
                  ? `${Math.floor(track.durationSeconds / 60)
                      .toString()
                      .padStart(2, "0")}:${(track.durationSeconds % 60)
                      .toString()
                      .padStart(2, "0")}`
                  : "00:00",
                is_liked: track.is_liked || false,
              }))
            : [];
          setTracks(data);
          if (data.length > 0 && !currentTrack) {
            setCurrentTrack(data[0]);
          }
        })
        .catch((err) => console.error("Gagal narik lagu dari DB!", err));
    }
  }, [tracks.length, setTracks, setCurrentTrack, currentTrack]);

  const likedTracks = tracks.filter((track) => track.is_liked);

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
          <TrackList tracks={likedTracks} onPlay={handlePlayTrack} />

          {likedTracks.length === 0 && (
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
