"use client";
import { useEffect, useRef, useState, useMemo, useCallback } from "react";

import TrackList from "@/components/TrackList";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import Link from "next/link";
import { useGlobalMenu } from "@/context/MenuContext";
import { applyPersistedLikeState, buildCoverUrl } from "@/lib/utils";
import { readTracksCache, writeTracksCache } from "@/lib/tracksCache";
import { getRecentlyPlayed } from "@/lib/playStats";
import {
  Play,
  Pause,
  Music,
  History,
  ChevronLeft,
  ChevronRight,
  Shuffle,
} from "lucide-react";

const MOODS = [
  "All",
  "Energize",
  "Workout",
  "Relax",
  "Focus",
  "Commute",
  "Romance",
  "Sad",
  "Feel good",
  "Sleep",
] as const;
type Mood = (typeof MOODS)[number];

function hashId(id: string | number) {
  const s = String(id);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

// Deterministically assign each track to one of the 9 non-"All" moods,
// so the mood filter has stable, non-overlapping buckets without backend metadata.
function moodForTrack(id: string | number): Mood {
  return MOODS[1 + (hashId(id) % (MOODS.length - 1))];
}

function shuffleWithSeed<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed || 1;
  const rand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function NocturnPage() {
  const { showMenu } = useGlobalMenu();
  const {
    tracks,
    setTracks,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    playTrackRef,
  } = usePlayer();

  const [playlists, setPlaylists] = useState<any[]>([]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<Mood>("All");
  const [quickPicksSeed, setQuickPicksSeed] = useState<number>(() =>
    Math.floor(Math.random() * 1_000_000) + 1,
  );
  const [recommendedSeed, setRecommendedSeed] = useState<number>(() =>
    Math.floor(Math.random() * 1_000_000) + 1,
  );
  const listenAgainRef = useRef<HTMLDivElement | null>(null);
  const recommendedRef = useRef<HTMLDivElement | null>(null);
  const currentTrackRef = useRef(currentTrack);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  // Refresh recently played setiap kali currentTrack berubah
  useEffect(() => {
    setRecentlyPlayedIds(getRecentlyPlayed());
  }, [currentTrack?.id]);

  const recentlyPlayedTracks = useMemo(() => {
    if (!recentlyPlayedIds.length || !tracks.length) return [];
    return recentlyPlayedIds
      .map((id) => tracks.find((t) => String(t.id) === String(id)))
      .filter(Boolean)
      .slice(0, 10);
  }, [recentlyPlayedIds, tracks]);

  // Tracks filtered by the currently selected mood chip.
  const moodFilteredTracks = useMemo(() => {
    if (selectedMood === "All") return tracks;
    return tracks.filter((t: any) => moodForTrack(t.id) === selectedMood);
  }, [tracks, selectedMood]);

  // Random sample of up to 16 tracks for "Quick picks". Re-shuffles when the
  // user changes mood OR clicks the "More →" / shuffle button.
  const quickPicks = useMemo(() => {
    const pool = moodFilteredTracks.length > 0 ? moodFilteredTracks : tracks;
    return shuffleWithSeed(pool, quickPicksSeed).slice(0, 16);
  }, [moodFilteredTracks, tracks, quickPicksSeed]);

  // Recommended carousel: shuffled remainder, excludes whatever is in quickPicks.
  const recommendedTracks = useMemo(() => {
    const pool = moodFilteredTracks.length > 0 ? moodFilteredTracks : tracks;
    const taken = new Set(quickPicks.map((t: any) => t.id));
    const rest = pool.filter((t: any) => !taken.has(t.id));
    return shuffleWithSeed(rest, recommendedSeed).slice(0, 14);
  }, [moodFilteredTracks, tracks, quickPicks, recommendedSeed]);

  const scrollRow = useCallback(
    (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) => {
      const el = ref.current;
      if (!el) return;
      const amount = Math.max(320, Math.floor(el.clientWidth * 0.8));
      el.scrollBy({ left: dir * amount, behavior: "smooth" });
    },
    [],
  );

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
    let cancelled = false;
    const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";

    // ── Hydrate dari cache dulu — list lagu muncul INSTAN ──────────────────
    const cached = readTracksCache();
    if (cached && cached.length > 0) {
      setTracks((prev) => (prev.length > 0 ? prev : cached));
      if (!currentTrackRef.current) setCurrentTrack(cached[0]);
    }

    const fetchTracks = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const res = await api.get("/api/tracks");
        if (cancelled) return;
        const resData = res.data;
        const rawData = resData?.data || resData;
        const data = Array.isArray(rawData)
          ? rawData
              .map((track) => ({
                ...track,
                title: track.trackTitle || "Unknown Title",
                artist: track.artistName || "Unknown Artist",
                albumArt: buildCoverUrl(track.playlistCover, API_BASE),
                cover_url: buildCoverUrl(track.playlistCover, API_BASE),
                audio_url:
                  track.fileName || track.file_name
                    ? `${API_BASE}/music/${track.fileName || track.file_name}`
                    : null,
                duration: track.durationSeconds
                  ? `${Math.floor(track.durationSeconds / 60)
                      .toString()
                      .padStart(
                        2,
                        "0",
                      )}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
                  : "00:00",
                is_liked: track.is_liked || false,
              }))
              .map(applyPersistedLikeState)
          : [];
        setTracks((prev) => {
          if (
            prev.length === data.length &&
            prev.every((t, i) => t.id === data[i].id)
          ) {
            return prev;
          }
          return data;
        });
        // Persist ke cache supaya kunjungan berikutnya bisa instant
        if (data.length > 0) writeTracksCache(data);
        // Cek dulu apakah belum ada track yang diputar, biar pas balik home nggak ke-reset
        if (data.length > 0 && !currentTrackRef.current) {
          setCurrentTrack(data[0]);
        }
      } catch (err) {
        if (!cancelled) console.error("Gagal narik lagu, cek database!", err);
      }
    };

    fetchTracks();
    const id = setInterval(fetchTracks, 10_000);
    const onVisible = () => {
      if (!document.hidden) fetchTracks();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [setTracks, setCurrentTrack]);

  return (
    <div className="w-full">
      <main className="w-full pb-36 md:pb-24">
        {/* ========== DESKTOP UI ========== */}
        <div className="hidden md:block">

          {/* A) FEATURED HERO — compact, cinematic */}
          <div className="h-[300px] relative overflow-hidden">
            {currentTrack && (
              <img
                src={currentTrack?.albumArt || currentTrack?.cover_url || "/nocturn.avif"}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover scale-110"
                style={{ filter: "blur(80px) brightness(0.35) saturate(2)" }}
                onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f0f] via-[#0f0f0f]/50 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />

            <div className="relative z-10 flex items-end px-8 pb-8 h-full gap-6">
              <div className="w-40 h-40 rounded-lg shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden flex-shrink-0 bg-white/5 group">
                <img
                  src={currentTrack?.albumArt || currentTrack?.cover_url || "/nocturn.avif"}
                  alt={currentTrack?.title || "Cover"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
                />
              </div>

              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <span className="text-[0.6rem] font-mono tracking-[0.25em] text-[#72fe8f] uppercase">
                  {isPlaying ? "// NOW STREAMING" : "// READY TO PLAY"}
                </span>
                <h1 className="text-[2.75rem] font-black uppercase tracking-tight max-w-2xl text-white leading-[0.95] line-clamp-2">
                  {currentTrack?.title || "Select a Track"}
                </h1>
                <p className="text-gray-300 text-sm font-mono uppercase tracking-wider truncate">
                  {currentTrack?.artist || "Press play to begin"}
                </p>

                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    disabled={!currentTrack}
                    className="flex items-center gap-2 bg-[#72fe8f] text-black px-7 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(114,254,143,0.35)] hover:bg-[#5de87a] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPlaying ? <Pause size={16} fill="black" /> : <Play size={16} fill="black" className="ml-0.5" />}
                    {isPlaying ? "Pause" : "Play"}
                  </button>
                  <button
                    onClick={(e) => {
                      if (currentTrack) showMenu(e, currentTrack, "general");
                    }}
                    disabled={!currentTrack}
                    className="flex items-center gap-2 border border-white/20 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/10 hover:border-white/40 transition-all disabled:opacity-40"
                  >
                    + Library
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* B) GENRE / MOOD CHIPS */}
          <div className="px-8 pt-5 pb-2 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {MOODS.map((chip) => {
              const active = selectedMood === chip;
              return (
                <button
                  key={chip}
                  onClick={() => {
                    setSelectedMood(chip);
                    // Re-shuffle so picks feel fresh on every mood change.
                    setQuickPicksSeed(Math.floor(Math.random() * 1_000_000) + 1);
                    setRecommendedSeed(Math.floor(Math.random() * 1_000_000) + 1);
                  }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                    active
                      ? "bg-white text-black"
                      : "bg-white/[0.08] text-white hover:bg-white/[0.14] border border-white/5"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {/* C) QUICK PICKS — random 16 tracks; "More →" reshuffles */}
          {quickPicks.length > 0 && (
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Quick picks
                  {selectedMood !== "All" && (
                    <span className="ml-3 text-xs font-mono uppercase tracking-widest text-[#72fe8f]/80">
                      · {selectedMood}
                    </span>
                  )}
                </h2>
                <button
                  onClick={() =>
                    setQuickPicksSeed(Math.floor(Math.random() * 1_000_000) + 1)
                  }
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white font-medium uppercase tracking-wider transition-colors"
                  title="Shuffle Quick picks"
                >
                  <Shuffle size={12} />
                  More →
                </button>
              </div>
              <div className="grid grid-cols-4 gap-x-2 gap-y-1">
                {quickPicks.map((track: any) => {
                  const isActive = currentTrack?.id === track.id;
                  return (
                    <button
                      key={track.id}
                      onClick={() => playTrackRef.current(track)}
                      onContextMenu={(e) => showMenu(e, track, "general")}
                      className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-white/[0.07] group transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 relative bg-white/5">
                        <img
                          src={track.albumArt || track.cover_url || "/nocturn.avif"}
                          alt={track.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Play size={16} className="text-white ml-0.5" fill="white" />
                        </div>
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className={`text-sm font-medium truncate leading-tight ${isActive ? "text-[#72fe8f]" : "text-white"}`}>
                          {track.title}
                        </span>
                        <span className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                          {track.artist}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* D-pre) LISTEN AGAIN — recently played history */}
          {recentlyPlayedTracks.length > 0 && (
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-baseline justify-between mb-4">
                <div className="flex items-center gap-2">
                  <History size={18} className="text-[#72fe8f]" />
                  <h2 className="text-2xl font-bold text-white tracking-tight">Listen again</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollRow(listenAgainRef, -1)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Scroll Listen again left"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollRow(listenAgainRef, 1)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Scroll Listen again right"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              <div
                ref={listenAgainRef}
                className="flex gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden snap-x scroll-smooth"
              >
                {recentlyPlayedTracks.map((track: any) => (
                  <button
                    key={track.id}
                    onClick={() => playTrackRef.current(track)}
                    onContextMenu={(e) => showMenu(e, track, "general")}
                    className="flex flex-col gap-2.5 w-44 flex-shrink-0 snap-start group text-left"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] shadow-md group-hover:shadow-2xl transition-shadow">
                      <img
                        src={track.albumArt || track.cover_url || "/nocturn.avif"}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#72fe8f] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <Play size={16} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                    <div className="flex flex-col px-0.5">
                      <span className="text-sm font-semibold text-white truncate leading-tight">
                        {track.title}
                      </span>
                      <span className="text-xs text-gray-500 truncate leading-tight mt-1">
                        {track.artist}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* D) RECOMMENDED FOR YOU — horizontal scroll cards */}
          {recommendedTracks.length > 0 && (
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Recommended for you
                  {selectedMood !== "All" && (
                    <span className="ml-3 text-xs font-mono uppercase tracking-widest text-[#72fe8f]/80">
                      · {selectedMood}
                    </span>
                  )}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollRow(recommendedRef, -1)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Scroll Recommended left"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => scrollRow(recommendedRef, 1)}
                    className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.04] text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                    aria-label="Scroll Recommended right"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() =>
                      setRecommendedSeed(
                        Math.floor(Math.random() * 1_000_000) + 1,
                      )
                    }
                    className="ml-1 text-xs text-gray-400 hover:text-white font-medium uppercase tracking-wider transition-colors"
                  >
                    More →
                  </button>
                </div>
              </div>
              <div
                ref={recommendedRef}
                className="flex gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden snap-x scroll-smooth"
              >
                {recommendedTracks.map((track: any) => (
                  <button
                    key={track.id}
                    onClick={() => playTrackRef.current(track)}
                    onContextMenu={(e) => showMenu(e, track, "general")}
                    className="flex flex-col gap-2.5 w-44 flex-shrink-0 snap-start group text-left"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] shadow-md group-hover:shadow-2xl transition-shadow">
                      <img
                        src={track.albumArt || track.cover_url || "/nocturn.avif"}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#72fe8f] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <Play size={16} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                    <div className="flex flex-col px-0.5">
                      <span className="text-sm font-semibold text-white truncate leading-tight">
                        {track.title}
                      </span>
                      <span className="text-xs text-gray-500 truncate leading-tight mt-1">
                        {track.artist}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* E) YOUR PLAYLISTS — horizontal scroll */}
          {playlists.length > 0 && (
            <div className="px-8 pt-6 pb-2">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-2xl font-bold text-white tracking-tight">Your playlists</h2>
                <Link
                  href="/YourLibrary"
                  className="text-xs text-gray-400 hover:text-white font-medium uppercase tracking-wider transition-colors"
                >
                  More →
                </Link>
              </div>
              <div className="flex gap-5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden snap-x">
                {playlists.map((pl) => (
                  <Link
                    key={pl.id}
                    href={`/playlist/${pl.id}`}
                    className="flex flex-col gap-2.5 w-44 flex-shrink-0 snap-start group"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-[#1a1a1a] shadow-md group-hover:shadow-2xl transition-shadow">
                      {pl.cover_url || pl.cover ? (
                        <img
                          src={pl.cover_url || pl.cover}
                          alt={pl.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = "/nocturn.avif"; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
                          <Music size={36} className="text-gray-600" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-[#72fe8f] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                        <Play size={16} fill="black" className="text-black ml-0.5" />
                      </div>
                    </div>
                    <div className="flex flex-col px-0.5">
                      <span className="text-sm font-semibold text-white truncate leading-tight">
                        {pl.name}
                      </span>
                      <span className="text-xs text-gray-500 truncate leading-tight mt-1">
                        Playlist
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* F) ALL SONGS HEADER */}
          <div className="px-12 pt-8 pb-2 flex items-baseline justify-between">
            <h2 className="text-2xl font-bold text-white tracking-tight">All songs</h2>
            <span className="text-xs text-gray-500 font-mono uppercase tracking-wider">
              {tracks.length} tracks
            </span>
          </div>

          {/* G) TRACK LIST */}
          <TrackList
            tracks={tracks}
            onPlay={(t) => {
              playTrackRef.current(t);
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
                  src={currentTrack?.cover_url || currentTrack?.albumArt || "/nocturn.avif"}
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
                      playTrackRef.current(track);
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
