"use client";

import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Maximize2,
  Music,
  MonitorSpeaker,
  Heart,
} from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext";
import { useAudioAnalyser } from "@/context/AudioAnalyserContext";
import api from "@/lib/axios";
import {
  recordPlay,
  recordPlaybackResult,
  getPlayStats,
  generateShuffleQueue,
} from "@/lib/playStats";
import {
  resolveAudioUrl,
  resolveCoverUrl,
  hasOfflineCached,
} from "@/lib/offlineCache";
import { setPersistedLikedTrackId } from "@/lib/utils";
import CurvedLoop from "./CurvedLoop";
import MobileOverlay from "./MobileOverlay";

export default function Player() {
  const {
    tracks,
    setTracks,
    queue,
    setQueue,
    shuffleQueue,
    setShuffleQueue,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
    playTrackRef,
  } = usePlayer();
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isInitialMount = useRef(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  const { showMenu } = useGlobalMenu(); // Buat nampilin menu
  const { attachAudioElement, resumeContext } = useAudioAnalyser();
  const [isMaximized, setIsMaximized] = useState(false); // State overlay mobile

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [history, setHistory] = useState<any[]>([]);

  // Refs so Media Session handlers always call the latest version of these functions
  const playNextRef = useRef<() => void>(() => {});
  const playPreviousRef = useRef<() => void>(() => {});
  // Flag to skip the isPlaying/track useEffect when playTrackImmediate already called play()
  const skipPlayEffectRef = useRef(false);

  const toggleShuffle = () => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        // Shuffle pintar: dipengaruhi vibe currentTrack + affinity user
        setShuffleQueue(
          generateShuffleQueue(
            tracks,
            currentTrack?.id ?? null,
            getPlayStats(),
            currentTrack,
          ),
        );
      } else {
        setShuffleQueue([]);
      }
      return next;
    });
  };

  // Reset shuffle queue saat tracks diganti (playlist baru dimuat)
  const prevTracksIdRef = useRef<string>("");
  useEffect(() => {
    const id = tracks.map((t) => t.id).join(",");
    if (id !== prevTracksIdRef.current) {
      prevTracksIdRef.current = id;
      if (isShuffle) {
        setShuffleQueue(
          generateShuffleQueue(
            tracks,
            currentTrack?.id ?? null,
            getPlayStats(),
            currentTrack,
          ),
        );
      }
    }
  }, [tracks]);

  const getTrackKey = (track: any) =>
    `${track?.id ?? "unknown"}::${track?.audio_url ?? ""}`;

  // Update Media Session metadata + state secara imperative (tanpa nunggu re-render)
  const updateMediaSession = (track: any, playing: boolean) => {
    if (!("mediaSession" in navigator) || !track) return;
    try {
      const artworkSrc: string =
        track.cover_url || "/icons/icon-512x512.png";
      const artworkUrl = artworkSrc.startsWith("http")
        ? artworkSrc
        : `${window.location.origin}${artworkSrc}`;
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || "Unknown",
        artist: track.artist || "Nocturn",
        album: "Nocturn",
        artwork: [
          { src: artworkUrl, sizes: "192x192", type: "image/png" },
          { src: artworkUrl, sizes: "512x512", type: "image/png" },
        ],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {}
  };

  // Putar track tertentu secara imperative — bypass React render cycle biar instant
  const playTrackImmediate = (track: any) => {
    if (!track) return;

    // Catat hasil playback lagu sebelumnya untuk smart shuffle (skip vs complete)
    const audio = audioRef.current;
    if (audio && currentTrack?.id && audio.duration > 0) {
      const ratio = audio.currentTime / audio.duration;
      recordPlaybackResult(currentTrack.id, ratio);
    }

    // Auto-resolve ke offline blob URL kalau tersedia (untuk dengar offline)
    const resolvedAudioUrl = resolveAudioUrl(track);
    const resolvedCover = resolveCoverUrl(track);
    const enrichedTrack = {
      ...track,
      audio_url: resolvedAudioUrl || track.audio_url,
      cover_url: resolvedCover || track.cover_url,
      albumArt: resolvedCover || track.albumArt,
      is_offline: hasOfflineCached(track.id),
    };

    recordPlay(enrichedTrack.id);
    skipPlayEffectRef.current = true; // cegah useEffect double-play setelah re-render
    setCurrentTrack(enrichedTrack);
    setIsPlaying(true);

    if (audio && enrichedTrack.audio_url) {
      if (audio.src !== enrichedTrack.audio_url) {
        audio.src = enrichedTrack.audio_url;
      }
      resumeContext();
      audio.play().catch((err) => {
        if (err.name !== "AbortError") console.warn("Play failed:", err);
      });
    }
    updateMediaSession(enrichedTrack, true);
  };

  // Daftarkan fungsi playTrackImmediate ke context ref setiap render supaya selalu fresh
  // (DownloadedLibrary dan komponen lain bisa pakai ini untuk play tanpa melalui React render cycle)
  useEffect(() => {
    playTrackRef.current = playTrackImmediate;
  });

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseFloat(e.target.value); // Pake newVol biar konsisten
    setVolume(newVol);
    if (audioRef.current) audioRef.current.volume = newVol;
    if (newVol > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setVolume(prevVolume);
      if (audioRef.current) audioRef.current.volume = prevVolume;
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      if (audioRef.current) audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleRepeat = () => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  };

  const playNext = async () => {
    if (!currentTrack && tracks.length === 0 && queue.length === 0) return;
    setHistory((prev) => [...prev, currentTrack]);

    // Konsumsi queue user-added dulu (FIFO)
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      playTrackImmediate(next);
      return;
    }

    if (!currentTrack || tracks.length === 0) return;

    const currentIndexByKey = tracks.findIndex(
      (t) => getTrackKey(t) === getTrackKey(currentTrack),
    );
    const currentIndexById = tracks.findIndex((t) => t.id === currentTrack.id);
    const currentIndex =
      currentIndexByKey >= 0 ? currentIndexByKey : currentIndexById;

    if (isShuffle) {
      // Ambil dari depan shuffle queue; kalau habis → regenerate dengan referensi terbaru
      const sq =
        shuffleQueue.length > 0
          ? shuffleQueue
          : generateShuffleQueue(
              tracks,
              currentTrack?.id ?? null,
              getPlayStats(),
              currentTrack,
            );
      const [next, ...rest] = sq;
      setShuffleQueue(rest);
      playTrackImmediate(next);
      return;
    }

    // Jika lagu terakhir, loop balik ke awal atau ambil dari random database tanpa delay menghentikan fungsi keseluruhan (secara async)
    if (currentIndex === tracks.length - 1) {
      if (repeatMode === "all") {
        playTrackImmediate(tracks[0]);
        return;
      } else {
        // Putar lagu pertama dulu biar gak kerasa delay nunggu API
        playTrackImmediate(tracks[0]);

        // Jangan fetch kalau sedang offline
        if (!navigator.onLine) return;

        // Fetch diam-diam di background dan perbarui antrean saat selesai
        api
          .get("/api/tracks")
          .then((res) => {
            const API_BASE =
              api.defaults.baseURL || "https://panel.nexxacodeid.site";
            const rawData = res.data?.data || res.data;
            if (Array.isArray(rawData) && rawData.length > 0) {
              const dbTracks = rawData.map((track: any) => ({
                ...track,
                title: track.trackTitle || track.title || "Unknown Title",
                artist: track.artistName || track.artist || "Unknown Artist",
                audio_url:
                  track.fileName || track.file_name
                    ? `${API_BASE}/music/${track.fileName || track.file_name}`
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
              // Gabung antrean tanpa duplikasi id+audio_url biar index next/previous tetap stabil
              setTracks((prev) => {
                const seen = new Set(prev.map((item) => getTrackKey(item)));
                const uniqueNewTracks = dbTracks.filter((item: any) => {
                  const key = getTrackKey(item);
                  if (seen.has(key)) return false;
                  seen.add(key);
                  return true;
                });
                return [...prev, ...uniqueNewTracks];
              });
            }
          })
          .catch((err) => console.error("Gagal get lagu random", err));
        return;
      }
    }

    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrackImmediate(tracks[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    if (history.length > 0) {
      const previousTrack = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      playTrackImmediate(previousTrack);
      return;
    }
    const currentIndexByKey = tracks.findIndex(
      (t) => getTrackKey(t) === getTrackKey(currentTrack),
    );
    const currentIndexById = tracks.findIndex((t) => t.id === currentTrack.id);
    const currentIndex =
      currentIndexByKey >= 0 ? currentIndexByKey : currentIndexById;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrackImmediate(tracks[prevIndex]);
  };

  const handleEnded = () => {
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  };

  // ── Like toggle ────────────────────────────────────────────────────────────
  const handleToggleLike = async () => {
    if (!currentTrack?.id) return;
    const trackId = currentTrack.id;
    const wasLiked = Boolean(currentTrack.is_liked);
    const nowLiked = !wasLiked;

    // Optimistic update
    setCurrentTrack((prev: any) => prev ? { ...prev, is_liked: nowLiked } : prev);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, is_liked: nowLiked } : t)),
    );
    setPersistedLikedTrackId(trackId, nowLiked);

    try {
      if (wasLiked) {
        await api.delete(`/api/tracks/${trackId}/like`);
      } else {
        await api.post(`/api/tracks/${trackId}/like`);
      }
    } catch {
      // Revert on error
      setCurrentTrack((prev: any) => prev ? { ...prev, is_liked: wasLiked } : prev);
      setTracks((prev) =>
        prev.map((t) => (t.id === trackId ? { ...t, is_liked: wasLiked } : t)),
      );
      setPersistedLikedTrackId(trackId, wasLiked);
    }
  };

  // ── Upcoming tracks untuk queue display di overlay ─────────────────────────
  const upcomingTracks = useMemo(() => {
    const fromQueue = queue.slice(0, 5);
    const currentIdx = tracks.findIndex(
      (t) => String(t.id) === String(currentTrack?.id),
    );
    const fromTracks =
      currentIdx >= 0
        ? tracks.slice(currentIdx + 1, currentIdx + 1 + (5 - fromQueue.length))
        : [];
    return [...fromQueue, ...fromTracks].slice(0, 5);
  }, [queue, tracks, currentTrack]);

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      audioRef.current.volume = volume; // Set volume awal pas lagu load
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audioRef.current.currentTime = percentage * audioRef.current.duration;
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration;
    setCurrentTime(current);
    setProgress((current / dur) * 100 || 0);

    if ("mediaSession" in navigator && dur > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: audioRef.current.playbackRate,
          position: current,
        });
      } catch {}
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.audio_url) {
      setIsPlaying((p) => !p);
      return;
    }
    if (audio.paused) {
      resumeContext();
      audio.play().catch(() => {});
      setIsPlaying(true);
      if ("mediaSession" in navigator)
        navigator.mediaSession.playbackState = "playing";
    } else {
      audio.pause();
      setIsPlaying(false);
      if ("mediaSession" in navigator)
        navigator.mediaSession.playbackState = "paused";
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(false);
  };

  const safelyPlayAudio = () => {
    if (!audioRef.current || !currentTrack?.audio_url) return;
    resumeContext();
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        if (err.name !== "AbortError") {
          console.warn("Autoplay ter-block:", err);
          setIsPlaying(false);
        }
      });
    }
  };

  // Audio element sekarang persistent; cukup attach analyser sekali aja.
  useEffect(() => {
    if (audioRef.current) attachAudioElement(audioRef.current);
  }, [attachAudioElement]);

  useEffect(() => {
    // Sinkronisasi HTMLAudioElement dengan state isPlaying.
    // Skip jika playTrackImmediate sudah memanggil play() langsung (cegah double-play).
    if (skipPlayEffectRef.current) {
      skipPlayEffectRef.current = false;
      return;
    }
    if (audioRef.current && currentTrack?.audio_url) {
      if (isPlaying) {
        safelyPlayAudio();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack?.id, currentTrack?.audio_url]);

  useEffect(() => {
    // Tandai bahwa komponen sudah mount, jadi perubahan berikutnya tidak dianggap initial mount lagi
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (currentTrack?.audio_url) {
      setProgress(0);
      setCurrentTime(0);
      // setIsPlaying(true); dihapus agar tidak autoplay saat website pertama kali dibuka
    }
  }, [currentTrack?.audio_url]);

  const handleCanPlay = () => {
    // Retry play setelah source siap untuk mencegah kondisi play() terlalu cepat saat ganti lagu
    if (isPlaying) {
      safelyPlayAudio();
    }
  };

  // Keep refs pointing to latest playNext/playPrevious (avoid stale closures in Media Session handlers)
  useEffect(() => {
    playNextRef.current = playNext;
  });
  useEffect(() => {
    playPreviousRef.current = playPrevious;
  });

  // Media Session: update song metadata on track change
  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    const artworkSrc: string =
      currentTrack.cover_url || "/icons/icon-512x512.png";
    const artworkUrl = artworkSrc.startsWith("http")
      ? artworkSrc
      : `${window.location.origin}${artworkSrc}`;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || "Unknown",
      artist: currentTrack.artist || "Nocturn",
      album: "Nocturn",
      artwork: [
        { src: artworkUrl, sizes: "192x192", type: "image/png" },
        { src: artworkUrl, sizes: "512x512", type: "image/png" },
      ],
    });
  }, [currentTrack]);

  // Media Session: sync play/pause state
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
  }, [isPlaying]);

  // Media Session: register action handlers once on mount
  useEffect(() => {
    if (!("mediaSession" in navigator)) return;

    // Directly control the audio element synchronously — Media Session requires this.
    // State update alone (async) is too slow; the OS expects immediate audio response.
    navigator.mediaSession.setActionHandler("play", () => {
      audioRef.current?.play().catch(() => {});
      navigator.mediaSession.playbackState = "playing";
      setIsPlaying(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      audioRef.current?.pause();
      navigator.mediaSession.playbackState = "paused";
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      navigator.mediaSession.playbackState = "paused";
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(false);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      playNextRef.current(),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      playPreviousRef.current(),
    );
    navigator.mediaSession.setActionHandler("seekto", (d) => {
      if (audioRef.current && d.seekTime !== undefined) {
        audioRef.current.currentTime = d.seekTime;
        try {
          navigator.mediaSession.setPositionState({
            duration: audioRef.current.duration || 0,
            playbackRate: audioRef.current.playbackRate,
            position: d.seekTime,
          });
        } catch {}
      }
    });
    navigator.mediaSession.setActionHandler("seekbackward", (d) => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.max(
          0,
          audioRef.current.currentTime - (d.seekOffset ?? 10),
        );
    });
    navigator.mediaSession.setActionHandler("seekforward", (d) => {
      if (audioRef.current)
        audioRef.current.currentTime = Math.min(
          audioRef.current.duration || 0,
          audioRef.current.currentTime + (d.seekOffset ?? 10),
        );
    });
  }, []);

  // Tambahan untuk mendengarkan spasi agar play/pause otomatis
  useEffect(() => {
    const handleSpacebar = (e: KeyboardEvent) => {
      // Abaikan jika user sedang mengetik di input, textarea, dll
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault(); // Cegah halaman scroll ke bawah
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleSpacebar);
    return () => window.removeEventListener("keydown", handleSpacebar);
  }, [isPlaying]);

  return (
    <>
      <footer className="fixed z-[100] transition-all bottom-[72px] left-2 w-[calc(100%-16px)] h-14 bg-[#1a1a1a] rounded-lg shadow-2xl overflow-hidden md:bottom-0 md:left-0 md:w-full md:h-24 md:bg-[#0e0e0e]/90 md:backdrop-blur-xl md:rounded-none md:border-t md:border-white/5">
        <audio
          ref={audioRef}
          src={currentTrack?.audio_url || undefined}
          crossOrigin="anonymous"
          preload="auto"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />

        {/* ========== MOBILE LAYOUT ========== */}
        <div
          onClick={() => setIsMaximized(true)}
          className="flex md:hidden items-center justify-between w-full h-full px-2 cursor-pointer relative"
        >
          {/* Progress Bar (Bottom Edge) */}
          <div className="absolute bottom-0 left-0 h-[2px] bg-white/20 w-full overflow-hidden rounded-b-lg">
            <div
              className="h-full bg-white shadow-lg transition-all ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Kiri: Cover & Info */}
          <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
            <div className="w-10 h-10 rounded-md overflow-hidden bg-[#2a2a2a] flex-shrink-0 relative shadow-sm">
              <img
                className="text-transparent w-full h-full object-cover text-[0px]"
                src={currentTrack?.albumArt || currentTrack?.cover_url || "/nocturn.avif"}
                alt="Cover"
                onError={(e) => { (e.target as HTMLImageElement).src = "/nocturn.avif"; }}
              />
            </div>

            <div className="flex flex-col truncate flex-1 min-w-0">
              <span className="text-[13px] font-bold text-white truncate leading-tight tracking-tight">
                {currentTrack?.title || "IDLE"}
              </span>
              <span className="text-[11px] text-[#a1a1aa] truncate leading-tight mt-[1px]">
                {currentTrack?.artist || "STANDBY"}
              </span>
            </div>
          </div>

          {/* Kanan: Icons */}
          <div className="flex items-center gap-3 flex-shrink-0 pr-1">
            <button
              className="text-[#a1a1aa] hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setIsMaximized(true); }}
            >
              <MonitorSpeaker size={20} />
            </button>

            {/* Tombol Like */}
            <button
              className={`transition-colors ${currentTrack?.is_liked ? "text-[#72fe8f]" : "text-[#a1a1aa] hover:text-white"}`}
              onClick={(e) => { e.stopPropagation(); handleToggleLike(); }}
            >
              <Heart
                size={20}
                fill={currentTrack?.is_liked ? "currentColor" : "none"}
                strokeWidth={currentTrack?.is_liked ? 0 : 2}
              />
            </button>

            {/* Play/Pause */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePlay();
              }}
              className="text-white hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause size={24} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play size={24} fill="currentColor" strokeWidth={0} />
              )}
            </button>
          </div>
        </div>

        {/* ========== DESKTOP LAYOUT ========== */}
        <div className="hidden md:flex flex-row items-center px-12 justify-between w-full h-full gap-4">
          {/* Info Bagian Kiri */}
          <div
            onClick={() => setIsMaximized(true)}
            className="flex items-center gap-4 w-1/4 min-w-0 cursor-pointer"
          >
            <div className="w-14 h-14 bg-[#121212] rounded-md overflow-hidden border border-white/5 flex-shrink-0 relative group">
              {currentTrack ? (
                <>
                  {/* Blurred cover sebagai background glow */}
                  <img
                    aria-hidden
                    src={currentTrack.albumArt || currentTrack.cover_url || "/nocturn.avif"}
                    className="absolute inset-0 w-full h-full object-cover scale-110 opacity-60"
                    style={{ filter: "blur(8px)" }}
                  />
                  <img
                    className="w-full h-full object-cover relative z-10 group-hover:scale-105 transition-transform duration-300 text-[0px]"
                    src={currentTrack.albumArt || currentTrack.cover_url || "/nocturn.avif"}
                    alt="Cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/nocturn.avif"; }}
                  />
                </>
              ) : (
                <Music size={16} className="text-gray-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              )}
            </div>

            <div className="flex flex-col truncate flex-1 min-w-0">
              <div className="h-8 flex items-center overflow-hidden">
                {currentTrack?.title ? (
                  <div className="w-full text-sm font-bold text-white uppercase tracking-tighter leading-none">
                    <CurvedLoop
                      marqueeText={currentTrack.title}
                      speed={0.8}
                      curveAmount={0}
                      direction="left"
                      interactive={false}
                    />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-gray-600 animate-pulse">
                    IDLE
                  </span>
                )}
              </div>
              <span className="text-[10px] text-[#72fe8f] font-mono uppercase truncate opacity-80">
                {currentTrack?.artist || "STANDBY"}
              </span>
            </div>
          </div>

          {/* Controls Bagian Tengah */}
          <div className="flex flex-col items-center justify-center gap-2 max-w-xl flex-grow">
            <div className="flex items-center gap-8 text-gray-400">
              <Shuffle
                onClick={toggleShuffle}
                size={16}
                className={`cursor-pointer transition-all ${
                  isShuffle
                    ? "text-[#72fe8f] drop-shadow-[0_0_8px_rgba(114,254,143,0.5)]"
                    : "hover:text-white"
                } ${isShuffle ? "scale-110" : "scale-100"}`}
              />
              <SkipBack
                onClick={playPrevious}
                size={20}
                className="hover:text-white cursor-pointer"
              />
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-white flex flex-shrink-0 items-center justify-center text-black hover:scale-105 transition-all active:scale-95"
              >
                {isPlaying ? (
                  <Pause fill="black" size={16} className="w-5 h-5" />
                ) : (
                  <Play fill="black" size={16} className="w-5 h-5 ml-1" />
                )}
              </button>
              <SkipForward
                onClick={playNext}
                size={20}
                className="hover:text-white cursor-pointer"
              />
              <div
                onClick={toggleRepeat}
                className="relative cursor-pointer group"
              >
                <Repeat
                  size={16}
                  className={`transition-all ${
                    repeatMode !== "none"
                      ? "text-[#72fe8f]"
                      : "hover:text-white"
                  }`}
                />
                {repeatMode === "one" && (
                  <span className="absolute -top-1.5 -right-1.5 text-[7px] bg-[#72fe8f] text-black font-bold px-1 rounded-full scale-90 border border-[#0e0e0e]">
                    1
                  </span>
                )}
                {repeatMode === "all" && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#72fe8f] rounded-full shadow-[0_0_5px_#72fe8f]"></span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-3">
              <span className="text-[10px] font-mono text-gray-500 w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div
                onClick={handleSeek}
                className="h-[4px] flex-1 bg-white/10 rounded-full relative group cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#72fe8f] shadow-[0_0_10px_#72fe8f] rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Bagian Kanan */}
          <div className="flex items-center justify-end gap-4 w-1/4 text-gray-500 group/volume">
            {/* Queue badge */}
            {queue.length > 0 && (
              <div className="relative flex items-center cursor-default" title={`${queue.length} lagu di queue`}>
                <MonitorSpeaker size={16} className="text-[#72fe8f]" />
                <span className="absolute -top-2 -right-2 bg-[#72fe8f] text-black text-[8px] font-black rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5 leading-none">
                  {queue.length > 99 ? "99+" : queue.length}
                </span>
              </div>
            )}
            <button onClick={toggleMute} className="hover:text-white">
              {isMuted || volume === 0 ? (
                <VolumeX size={18} className="text-red-500" />
              ) : (
                <Volume2 size={18} />
              )}
            </button>
            <div className="relative w-24 h-[4px] bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-[#72fe8f]"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
            <Maximize2
              size={16}
              className="hover:text-white cursor-pointer ml-2"
              onClick={() => setIsMaximized(true)}
            />
          </div>
        </div>
      </footer>

      {isMaximized && (
        <MobileOverlay
          onClose={() => setIsMaximized(false)}
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          togglePlay={togglePlay}
          progress={progress}
          currentTime={currentTime}
          duration={duration}
          handleSeek={handleSeek}
          playNext={playNext}
          playPrevious={playPrevious}
          isShuffle={isShuffle}
          toggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          toggleRepeat={toggleRepeat}
          formatTime={formatTime}
          isLiked={Boolean(currentTrack?.is_liked)}
          handleToggleLike={handleToggleLike}
          upcomingTracks={upcomingTracks}
        />
      )}
    </>
  );
}
