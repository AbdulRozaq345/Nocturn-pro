"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Hero from "@/components/hero";
import TrackList from "@/components/TrackList";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";

export default function NocturnPage() {
  const {
    tracks,
    setTracks,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
  } = usePlayer();

  useEffect(() => {
    // API base URL dari instance axios
    const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";

    // Ambil data dari API Laravel lo bosquu pakai axios biar header Accept terkirim dengan benar (JSON)
    api
      .get("/api/tracks")
      .then((res) => {
        const resData = res.data;
        const rawData = resData?.data || resData;
        const data = Array.isArray(rawData)
          ? rawData.map((track) => ({
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
                    .padStart(
                      2,
                      "0",
                    )}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
                : "00:00",
            }))
          : [];
        setTracks(data);
        // Cek dulu apakah belum ada track yang diputar, biar pas balik home nggak ke-reset
        if (data.length > 0 && !currentTrack) {
          setCurrentTrack(data[0]);
        }
      })
      .catch((err) => console.error("Gagal narik lagu, cek database!", err));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0e0e] text-white">
      <Sidebar />

      <main className="flex-grow relative overflow-y-auto custom-scrollbar pb-36 md:pb-24">
        {/* Header Search & Nav */}
        <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-12 sticky top-0 z-40 bg-[#0e0e0e]/60 backdrop-blur-md">
          <div className="text-[0.6rem] text-gray-400 font-mono tracking-[0.3em]">
            NOTCER_STATION_V1.0
          </div>
          <div className="flex gap-6 text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="text-[#72fe8f]">
              Feed
            </a>
            <a href="#" className="hover:text-white">
              Collect
            </a>
            <a href="#" className="hover:text-white">
              Labs
            </a>
          </div>
        </header>

        <Hero currentTrack={currentTrack} />

        <div className="px-12 py-8">
          <h3 className="text-2xl font-bold tracking-tight text-white uppercase italic mb-8">
            Rekomendasi
          </h3>
          {/* Row Album/Rekomendasi bisa lo buat komponen sendiri lagi nanti */}
        </div>

        <TrackList
          tracks={tracks}
          onPlay={(t) => {
            setCurrentTrack(t);
            setIsPlaying(true);
          }}
        />
      </main>
    </div>
  );
}
