"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import Link from "next/link";

interface Playlist {
  id: number;
  name: string; // Ganti title jadi name sesuai DB
  cover: string; // Ganti image jadi cover sesuai DB
}

const YourLibrary = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaylists = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.get("/api/playlists");
      // Cek struktur response Laravel lo.
      // Kalau di Controller pake return response()->json($data),
      // atau ada status success-nya, sesuaikan di sini:
      const dataFetched = res.data.data || res.data;
      setPlaylists(Array.isArray(dataFetched) ? dataFetched : []);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        /* eslint-disable */ console.error(
          "Gagal narik playlist, bosquu! 🗿",
          err,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    const playlistName = prompt("Masukkan nama playlist baru:");
    if (!playlistName) return;

    try {
      // Backend lo minta field 'name' bukan 'title'
      const res = await api.post("/api/playlists", { name: playlistName });

      // Refresh biar data paling update dari server masuk
      fetchPlaylists();
    } catch (err: any) {
      console.error("====== DEBUG BIKIN PLAYLIST ======");
      console.error("STATUS:", err.response?.status);
      console.error("DATA:", err.response?.data);
      console.error("MESSAGE:", err.message);
      console.error("FULL ERR:", err);
      console.error("==================================");
      alert(
        `Gagal bikin playlist, puki bener! 🐈‍🤣\nStatus: ${err.response?.status || "Network Error"}\nSilakan cek tab Console F12 buat detailnya.`,
      );
    }
  };

  if (loading)
    return (
      <div className="p-12 text-[#72fe8f] font-mono animate-pulse">
        SYNCING_DATABASE...
      </div>
    );

  return (
    <div className="flex-1 pb-32 pt-8 px-8 md:px-12 bg-[#000000] text-white">
      <div className="mb-10">
        <h2 className="text-[3.5rem] font-bold tracking-tight leading-none mb-8">
          Your Library
        </h2>
        <div className="flex gap-3">
          <button className="px-5 py-1.5 rounded-full bg-[#72fe8f] text-[#002a0c] text-sm font-medium">
            Playlists
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-8">
        {/* Tombol Create */}
        <div onClick={handleCreatePlaylist} className="group cursor-pointer">
          <div className="aspect-square mb-4 bg-[#1f1f1f] rounded-sm flex flex-col items-center justify-center border-2 border-dashed border-[#484848]/30 hover:border-[#72fe8f]/40 transition-all">
            <span className="material-symbols-outlined text-4xl text-gray-500 group-hover:text-[#72fe8f]">
              add
            </span>
            <span className="text-[0.6rem] font-mono uppercase tracking-widest text-gray-500 mt-2">
              New Entry
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-500 group-hover:text-white transition-colors">
            Create Playlist
          </h3>
        </div>

        {/* Render Playlists */}
        {playlists.map((pl) => (
          <Link
            href={`/playlist/${pl.id}`}
            key={pl.id}
            className="group cursor-pointer"
          >
            <div className="relative aspect-square mb-4 bg-[#191919] rounded-sm overflow-hidden">
              <img
                src={
                  pl.cover ||
                  "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17"
                } // Fallback image
                alt={pl.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />

              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="h-12 w-12 bg-[#72fe8f] rounded-sm flex items-center justify-center text-[#002a0c]">
                  <span
                    className="material-symbols-outlined text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </div>
              </div>
            </div>
            <h3 className="text-sm font-medium text-white mb-1 group-hover:text-[#72fe8f] transition-colors">
              {pl.name}
            </h3>
            <p className="text-[0.6875rem] font-mono uppercase tracking-[0.05em] text-[#ababab]">
              Playlist
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default YourLibrary;
