"use client";
import { useEffect, useState } from "react";

import Hero from "@/components/hero";
import TrackList from "@/components/TrackList";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import Link from "next/link";
import { useGlobalMenu } from "@/context/MenuContext";
import { applyPersistedLikeState } from "@/lib/utils";

export default function NocturnPage() {
  const { showMenu } = useGlobalMenu();
  const {
    tracks,
    setTracks,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
  } = usePlayer();

  const [playlists, setPlaylists] = useState<any[]>([]);

  useEffect(() => {
    const fetchSidebarPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Skip fetching if not authenticated

      try {
        const res = await api.get("/api/playlists");
        const data = res.data.data || res.data;
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error("Gagal sinkron playlist rekomendasi! ���");
        }
      }
    };
    fetchSidebarPlaylists();
  }, []);

  useEffect(() => {
    // Biar list lagunya nggak ke-reset lagi dan is_liked nya nggak "ketimpa" waktu balik ke home
    if (tracks.length > 0) return;

    // API base URL dari instance axios
    const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";

    // Ambil data dari API Laravel lo bosquu pakai axios biar header Accept terkirim dengan benar (JSON)
    api
      .get("/api/tracks")
      .then((res) => {
        const resData = res.data;
        const rawData = resData?.data || resData;
        const data = Array.isArray(rawData)
          ? rawData
              .map((track) => ({
                ...track,
                title: track.trackTitle || "Unknown Title",
                artist: track.artistName || "Unknown Artist",
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
                // Ensure is_liked field is always present
                is_liked: track.is_liked || false,
              }))
              .map(applyPersistedLikeState)
          : [];
        setTracks(data);
        // Cek dulu apakah belum ada track yang diputar, biar pas balik home nggak ke-reset
        if (data.length > 0 && !currentTrack) {
          setCurrentTrack(data[0]);
        }
      })
      .catch((err) => console.error("Gagal narik lagu, cek database!", err));
  }, [tracks.length, setTracks, currentTrack, setCurrentTrack]);

  return (
    <div className="w-full">
      <main className="w-full pb-36 md:pb-24">
        {/* ========== DESKTOP UI ========== */}

        <div className="hidden md:block">
          <Hero currentTrack={currentTrack} />
        </div>

        <div className="hidden md:block px-12 py-8">
          <h3 className="text-2xl font-bold tracking-tight text-white uppercase italic mb-8">
            Rekomendasi
          </h3>
          {/* Row Album/Rekomendasi bisa lo buat komponen sendiri lagi nanti */}
        </div>

        <div className="hidden md:block">
          <TrackList
            tracks={tracks}
            onPlay={(t) => {
              setCurrentTrack(t);
              setIsPlaying(true);
            }}
          />
        </div>

        {/* ========== MOBILE UI (NEW DESIGN) ========== */}
        <div className="md:hidden flex flex-col w-full pb-10">
          {/* Mobile Header (TopAppBar) */}

          {/* Mobile Hero Section */}
          <section className="relative w-full aspect-[4/4.5] overflow-hidden group mt-16">
            <div className="absolute inset-0">
              {currentTrack ? (
                <img
                  className="w-[105%] h-[105%] -left-[2.5%] -top-[2.5%] object-cover transform scale-105 group-hover:scale-110 transition-transform duration-700 absolute bg-white/5 animate-pulse text-transparent text-[0px]"
                  alt="Cover"
                  src={"/nocturn.avif"}
                />
              ) : (
                <div className="w-full h-full bg-white/10 animate-pulse absolute inset-0"></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/80 via-transparent to-transparent"></div>
            </div>

            <div className="absolute bottom-0 left-0 p-6 w-full flex flex-col justify-end h-full">
              <div className="flex flex-col gap-1 mb-5 drop-shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-[#72fe8f] animate-pulse"></span>
                  <span className="text-xs font-mono font-medium tracking-[0.2em] text-[#72fe8f] uppercase">
                    Trending Session
                  </span>
                </div>
                <h1 className="text-4xl font-black leading-tight tracking-tighter text-white uppercase line-clamp-2">
                  {currentTrack?.title || "Unknown Title"}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="flex-1 bg-[#72fe8f] hover:bg-[#1cb853] text-black h-12 px-6 rounded-full font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(114,254,143,0.3)]"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isPlaying ? "pause" : "play_arrow"}
                  </span>
                  <span className="tracking-wide text-sm">
                    {isPlaying ? "PAUSE" : "PLAY NOW"}
                  </span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentTrack) showMenu(e, currentTrack, "general");
                  }}
                  className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5 text-white w-12 h-12 flex items-center justify-center rounded-full active:scale-[0.95] transition-transform hover:bg-white/10"
                >
                  <span className="material-symbols-outlined">add</span>
                </button>
              </div>
            </div>
          </section>

          {/* Technical Stats Bar */}
          <section className="mx-5 my-6 p-4 rounded-xl bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5 flex justify-between items-center relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#72fe8f]"></div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-mono tracking-widest text-[#a1a1aa] uppercase">
                Quality
              </span>
              <span className="text-xs font-bold text-[#72fe8f] tracking-wider">
                24-BIT LOSSLESS
              </span>
            </div>
          </section>

          {/* Recommendations Section */}
          <section className="py-4">
            <div className="flex justify-between items-center px-5 mb-5">
              <h2 className="text-lg font-bold tracking-tight text-white uppercase relative">
                Playlist Kamu
                <span className="absolute -bottom-1 left-0 w-1/2 h-0.5 bg-[#72fe8f]/50"></span>
              </h2>
              <Link
                href="/YourLibrary"
                className="text-[10px] font-mono text-[#72fe8f] tracking-widest uppercase hover:underline"
              >
                View All
              </Link>
            </div>

            <div className="flex gap-4 overflow-x-auto px-5 pb-4 [&::-webkit-scrollbar]:hidden snap-x">
              {playlists.length > 0 ? (
                playlists.slice(0, 3).map((p) => (
                  <Link
                    href={`/playlist/${p.id}`}
                    key={p.id}
                    className="snap-start flex-shrink-0 w-36 group cursor-pointer relative block"
                  >
                    <div className="w-36 h-36 bg-[#141414] rounded-xl overflow-hidden mb-3 relative shadow-lg flex items-center justify-center border border-white/5 group-hover:border-[#72fe8f]/50 transition-colors">
                      {p.cover_url ? (
                        <img
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 bg-white/5 animate-pulse text-transparent text-[0px]"
                          src={p.cover_url}
                          alt="Cover"
                          onError={(e) => {
                            e.currentTarget.style.opacity = "0";
                          }}
                        />
                      ) : (
                        <span className="material-symbols-outlined text-4xl text-white/20">
                          queue_music
                        </span>
                      )}

                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#72fe8f]/90 flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                          <span
                            className="material-symbols-outlined text-black text-2xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                          >
                            play_arrow
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col px-1">
                      <span className="text-sm font-semibold text-white truncate">
                        {p.name || "Unknown Playlist"}
                      </span>
                      <span className="text-[10px] font-mono text-[#a1a1aa] mt-1 uppercase">
                        PLAYLIST
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="w-full flex items-center justify-center py-6">
                  <span className="text-xs font-mono text-[#a1a1aa] uppercase tracking-widest px-4 py-2 border border-white/10 rounded-full bg-white/5">
                    No Playlist
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Recently Deployed (Using Tracks Data) */}
          <section className="py-4 px-5">
            <h2 className="text-lg font-bold tracking-tight text-white mb-4 uppercase relative inline-block">
              Recently Deployed
              <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[#72fe8f]/50"></span>
            </h2>

            <div className="flex flex-col gap-3">
              {tracks && tracks.length > 0 ? (
                tracks.slice(0, 5).map((track, i) => (
                  <div
                    key={track.id || i}
                    onClick={() => {
                      setCurrentTrack(track);
                      setIsPlaying(true);
                    }}
                    className="bg-gradient-to-br from-[#141414]/90 to-[#0f0f0f]/80 p-4 rounded-xl flex items-center gap-4 hover:bg-[#262626] transition-colors cursor-pointer group shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] border border-white/5"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#0a0a0a] flex items-center justify-center shadow-inner overflow-hidden relative">
                      <img
                        src={track.albumArt || "/nocturn.avif"}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
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
                    <span className="text-xs font-mono text-[#a1a1aa]">
                      {track.duration || "00:00"}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        showMenu(e, track, "general");
                      }}
                      className="text-[#a1a1aa] hover:text-[#72fe8f] transition-colors p-1"
                    >
                      <span className="material-symbols-outlined">
                        more_vert
                      </span>
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#a1a1aa] text-xs font-mono uppercase tracking-widest">
                  Initializing Signal...
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
