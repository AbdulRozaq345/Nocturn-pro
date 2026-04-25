"use client";
import React, { useState, useEffect } from "react";
import api from "@/lib/axios";
import Link from "next/link";
import { Plus, Heart, LayoutGrid, MoreVertical, Music } from "lucide-react";

interface Playlist {
  id: number;
  name: string;
  cover: string;
}

const YourLibrary = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    if (typeof window !== "undefined") {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const cachedTitle = localStorage.getItem(
        `playlists_${user?.id || "default"}`,
      );
      return cachedTitle ? JSON.parse(cachedTitle) : [];
    }
    return [];
  });
  const [loading, setLoading] = useState(playlists.length === 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const fetchPlaylists = async () => {
    try {
      const res = await api.get("/api/playlists");
      const dataFetched = res.data.data || res.data;
      const validPlaylists = Array.isArray(dataFetched) ? dataFetched : [];
      setPlaylists(validPlaylists);

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user?.id) {
        localStorage.setItem(
          `playlists_${user.id}`,
          JSON.stringify(validPlaylists),
        );
      }
    } catch (err: any) {
      console.error("Gagal narik playlist, bosquu!", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;
    try {
      await api.post("/api/playlists", { name: newPlaylistName });
      setIsModalOpen(false);
      setNewPlaylistName("");
      fetchPlaylists();
    } catch (err: any) {
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center w-full h-[60vh] text-[#72fe8f] font-mono text-xs tracking-[0.3em]">
        <div className="w-8 h-8 border-2 border-[#72fe8f] border-t-transparent rounded-full animate-spin mb-4" />
        LOADING_LIBRARY...
      </div>
    );

  return (
    <div className="flex-1  top-20 md:top-0 pb-40 w-full px-4 md:px-12 bg-transparent min-h-full text-white flex flex-col relative font-sans pt-6">
      {/* Tab Nav - Lebih Slim */}
      <div className="sticky mb-8 md:top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-md py-3 border-b border-white/5 -mx-4 px-4 md:-mx-12 md:px-12">
        <div className="flex gap-2 font-mono text-[0.65rem] font-bold uppercase tracking-widest">
          <button className="px-4 py-1.5 bg-[#72fe8f] text-black rounded-sm shadow-[0_0_15px_rgba(114,254,143,0.2)]">
            Playlists
          </button>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex justify-between items-center py-4 text-[10px] font-mono uppercase tracking-[0.2em] text-gray-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#72fe8f] rounded-full animate-pulse" />
          <span>Sort By: Recents</span>
        </div>
        <LayoutGrid
          size={14}
          className="text-gray-600 hover:text-[#72fe8f] cursor-pointer"
        />
      </div>

      {/* List Container */}
      <div className="flex flex-col gap-2">
        {/* Liked Songs - Dibuat lebih ikonik */}
        <Link
          href="/liked-songs"
          className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-md transition-all group"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-[#72fe8f] to-[#0fe3ff] flex items-center justify-center rounded-sm flex-shrink-0 shadow-lg group-active:scale-95 transition-transform">
            <Heart size={20} className="fill-black text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black italic tracking-tight text-white group-hover:text-[#72fe8f]">
              Liked Songs
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="px-1 text-[8px] border border-[#72fe8f]/30 text-[#72fe8f] font-mono">
                FIXED
              </span>
            </div>
          </div>
        </Link>

        {/* Mapped Playlists */}
        {playlists.map((pl) => (
          <Link
            href={`/playlist/${pl.id}`}
            key={pl.id}
            className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-md transition-all group"
          >
            <div className="w-14 h-14 bg-[#1a1a1a] flex items-center justify-center rounded-sm flex-shrink-0 relative overflow-hidden border border-white/10 group-active:scale-95 transition-transform">
              {pl.cover ? (
                <img
                  className="w-full h-full object-cover"
                  src={pl.cover}
                  alt={pl.name}
                />
              ) : (
                <Music size={20} className="text-gray-800" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black italic tracking-tight text-white uppercase group-hover:text-[#72fe8f] truncate">
                {pl.name}
              </h3>
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                Playlist • Nocturn
              </p>
            </div>
            <MoreVertical
              size={16}
              className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
            />
          </Link>
        ))}
      </div>

      {/* Footer "Curated For You" */}
      <div className="mt-10 px-6 py-6 border-t border-white/5 bg-gradient-to-b from-transparent to-[#72fe8f]/5">
        <div className="border-l-2 border-[#72fe8f] pl-4">
          <p className="text-[0.6rem] font-mono text-[#72fe8f] font-bold uppercase tracking-[0.3em] mb-1">
            TERMINAL_CURATOR
          </p>
          <p className="text-xs italic text-gray-400 tracking-wide font-serif leading-relaxed">
            &quot;The system finds rhythm where others only see code.&quot;
          </p>
        </div>
      </div>

      {/* Floating Action Button - Lebih Nyatu */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-32 right-12 md:right-16 w-14 h-14 bg-[#72fe8f] text-black rounded-full shadow-[0_0_20px_rgba(114,254,143,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40"
      >
        <Plus size={24} />
      </button>

      {/* Modal Buat Playlist */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#141414] border border-[#72fe8f]/20 rounded-xl p-6 w-full max-w-sm shadow-[0_0_40px_rgba(114,254,143,0.1)]">
            <h2 className="text-xl font-black italic text-[#72fe8f] mb-4 uppercase tracking-tighter">
              BUAT PLAYLIST BARU
            </h2>
            <input
              type="text"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="Nama Playlist"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-md p-3 text-sm text-white focus:outline-none focus:border-[#72fe8f]/50 font-mono mb-6 placeholder:text-gray-600"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreatePlaylist();
                if (e.key === "Escape") setIsModalOpen(false);
              }}
            />
            <div className="flex justify-end gap-3 font-mono text-xs uppercase tracking-widest">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                BATAL
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="px-4 py-2 bg-[#72fe8f] text-black font-bold rounded-sm hover:opacity-90 transition-opacity"
              >
                SIMPAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YourLibrary;
