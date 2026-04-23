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
  MoreVertical,
  MonitorSpeaker,
  Check,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext"; // Tambahin ini buat fungsi menu
import api from "@/lib/axios";
import CurvedLoop from "./CurvedLoop";
import MobileOverlay from "./MobileOverlay"; // Import overlay baru

export default function Player() {
  const {
    tracks,
    setTracks,
    currentTrack,
    setCurrentTrack,
    isPlaying,
    setIsPlaying,
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
  const [isMaximized, setIsMaximized] = useState(false); // State overlay mobile

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<"none" | "all" | "one">("none");
  const [history, setHistory] = useState<any[]>([]);

  const toggleShuffle = () => setIsShuffle(!isShuffle);

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
    if (!currentTrack || tracks.length === 0) return;
    setHistory((prev) => [...prev, currentTrack]);

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);

    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrack(tracks[randomIndex]);
      setIsPlaying(true);
      return;
    }

    // Jika lagu terakhir, loop balik ke awal atau ambil dari random database tanpa delay menghentikan fungsi keseluruhan (secara async)
    if (currentIndex === tracks.length - 1) {
      if (repeatMode === "all") {
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);
        return;
      } else {
        // Otomatis fetch lagu baru tapi untuk sisa playlistnya, jangan hentikan respons UI
        // Sementara itu kita play lagu pertama aja dulu biar gak kerasa ada delay jeda nunggu API
        setCurrentTrack(tracks[0]);
        setIsPlaying(true);

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
              // Gabung sisa lagu dari server
              setTracks([...tracks, ...dbTracks]);
            }
          })
          .catch((err) => console.error("Gagal get lagu random", err));
        return;
      }
    }

    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    if (history.length > 0) {
      const previousTrack = history[history.length - 1];
      setHistory((prev) => prev.slice(0, -1));
      setCurrentTrack(previousTrack);
      setIsPlaying(true);
      return;
    }
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
  };

  const handleEnded = () => {
    if (repeatMode === "one" && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      playNext();
    }
  };

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
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(current);
      setProgress((current / dur) * 100 || 0);
    }
  };

  const togglePlay = () => {
    // Kita panggil togglePlay dari context secara implisit via setIsPlaying(!isPlaying)
    // Tapi karena sudah ada di context, kita hanya perlu ubah state isPlaying-nya.
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    // Memastikan pemutar audio (HTMLAudioElement) sinkron dengan state isPlaying di Context
    if (audioRef.current && currentTrack?.audio_url) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            if (err.name !== "AbortError") {
              console.warn("Autoplay ter-block:", err);
              setIsPlaying(false);
            }
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack?.audio_url || ""]);

  useEffect(() => {
    // Tandai bahwa komponen sudah mount, jadi perubahan berikutnya tidak dianggap initial mount lagi
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (currentTrack?.audio_url) {
      setProgress(0);
      setCurrentTime(0);
      setIsPlaying(true);
    }
  }, [currentTrack?.audio_url]);

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
        {currentTrack?.audio_url ? (
          <audio
            ref={audioRef}
            src={currentTrack.audio_url}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
          />
        ) : null}

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
              {currentTrack ? (
                <img
                  className="text-transparent w-full h-full object-cover bg-white/5 animate-pulse text-[0px]"
                  src={"/nocturn.avif"}
                  alt="Cover"
                />
              ) : (
                <img
                  src={"/nocturn.avif"}
                  className="text-gray-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                />
              )}
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
              onClick={(e) => e.stopPropagation()}
            >
              <MonitorSpeaker size={20} />
            </button>

            {/* Tombol Like (Check) */}
            <button
              className="text-[#1ed760] transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                /* Trigger Like from Context kalo butuh, untuk sekarang dummy visual */
              }}
            >
              <div className="bg-[#1ed760] text-black rounded-full flex items-center justify-center p-[2px]">
                <Check size={16} strokeWidth={3} />
              </div>
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
            <div className="w-14 h-14 bg-[#121212] rounded-md overflow-hidden border border-white/5 flex-shrink-0 items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
              {currentTrack ? (
                <img
                  className="text-transparent w-full h-full object-cover relative z-10 bg-white/5 animate-pulse text-[0px]"
                  src={"/nocturn.avif"}
                  alt="Cover"
                />
              ) : (
                <Music size={16} className="text-gray-700 relative z-10" />
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
        />
      )}
    </>
  );
}
