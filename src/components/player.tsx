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
  MoreVertical, // Tambahin ini
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext"; // Tambahin ini buat fungsi menu
import api from "@/lib/axios";
import CurvedLoop from "./CurvedLoop";

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

    if (isShuffle) {
      try {
        const res = await api.get("/api/tracks");
        const API_BASE =
          api.defaults.baseURL || "https://panel.nexxacodeid.site";
        let rawData = res.data?.data || res.data;

        if (Array.isArray(rawData) && rawData.length > 0) {
          const dbTracks = rawData.map((track: any) => ({
            ...track,
            title: track.trackTitle || track.title || "Unknown Title",
            artist: track.artistName || track.artist || "Unknown Artist",
            cover_url: track.playlistCover
              ? `${API_BASE}/storage/${track.playlistCover}`
              : track.cover_url || "/default-cover.png",
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

          const randomIndex = Math.floor(Math.random() * dbTracks.length);
          setCurrentTrack(dbTracks[randomIndex]);
          setTracks(dbTracks); // Update queue tracks dengan data dari database
          setIsPlaying(true);
          return;
        }
      } catch (err) {
        console.error("Gagal get lagu random dari database:", err);
      }

      const randomIndex = Math.floor(Math.random() * tracks.length);
      setCurrentTrack(tracks[randomIndex]);
      setIsPlaying(true);
      return;
    }

    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  useEffect(() => {
    const audio = audioRef.current;

    if (currentTrack?.audio_url && audio) {
      setProgress(0);
      setCurrentTime(0);

      // Jangan otomatis putar saat browser baru direfresh
      if (isInitialMount.current) {
        isInitialMount.current = false;
        setIsPlaying(false);
        return;
      }

      // Langsung play saat currentTrack ganti (dipencet dari UI sesudah refresh)
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((err) => {
              console.warn("Autoplay ter-block browser:", err);
              setIsPlaying(false);
            });
        }
      }, 50);
    }
  }, [currentTrack]);

  return (
    <footer className="fixed bottom-0 left-0 w-full h-20 md:h-24 bg-[#0e0e0e]/90 backdrop-blur-xl flex flex-row items-center px-4 md:px-12 justify-between z-50 border-t border-white/5 shadow-2xl gap-2 md:gap-4">
      {currentTrack?.audio_url && (
        <audio
          key={currentTrack.audio_url}
          ref={audioRef}
          src={currentTrack.audio_url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
        />
      )}

      {/* Info Bagian Kiri */}
      <div className="flex items-center gap-2 md:gap-4 w-1/2 md:w-1/4 min-w-0">
        <div className="hidden md:flex w-14 h-14 bg-[#121212] rounded-md overflow-hidden border border-white/5 flex-shrink-0 items-center justify-center relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
          <Music size={16} className="text-gray-700 relative z-10" />
        </div>

        {/* Container Teks & Menu - Pake Flex Row biar tombol ada di kanan teks */}
        <div className="flex items-center flex-1 min-w-0 gap-2">
          <div className="flex flex-col truncate flex-1">
            <div className="h-7 md:h-8 flex items-center overflow-hidden">
              {currentTrack?.title ? (
                <div className="w-full text-xs md:text-sm font-bold text-white uppercase tracking-tighter leading-none">
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

          {/* TOMBOL MENU MOBILE - Nempel di kanan teks */}
          <button
            onClick={(e) => {
              if (currentTrack) showMenu(e, currentTrack, "general");
            }}
            className="md:hidden p-2 text-gray-500 hover:text-white active:text-[#72fe8f] transition-colors flex-shrink-0"
          >
            <MoreVertical size={18} />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center justify-center gap-1 md:gap-2 flex-grow md:max-w-xl">
        <div className="flex items-center gap-4 md:gap-8 text-gray-400">
          <Shuffle
            onClick={toggleShuffle}
            size={16}
            className={`hidden md:block cursor-pointer transition-all ${isShuffle ? "text-[#72fe8f] drop-shadow-[0_0_8px_rgba(114,254,143,0.5)]" : "hover:text-white"}`}
          />
          <SkipBack
            onClick={playPrevious}
            size={20}
            className="hover:text-white cursor-pointer"
          />
          <button
            onClick={togglePlay}
            className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white flex flex-shrink-0 items-center justify-center text-black hover:scale-105 transition-all active:scale-95"
          >
            {isPlaying ? (
              <Pause fill="black" size={16} className="md:w-5 md:h-5" />
            ) : (
              <Play fill="black" size={16} className="md:w-5 md:h-5 ml-1" />
            )}
          </button>
          <SkipForward
            onClick={playNext}
            size={20}
            className="hover:text-white cursor-pointer"
          />
          <div
            onClick={toggleRepeat}
            className="hidden md:block relative cursor-pointer"
          >
            <Repeat
              size={16}
              className={`transition-all ${repeatMode !== "none" ? "text-[#72fe8f]" : "hover:text-white"}`}
            />
            {repeatMode === "one" && (
              <span className="absolute -top-1 -right-1 text-[8px] bg-[#72fe8f] text-black font-bold px-1 rounded-full scale-75">
                1
              </span>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex items-center gap-2 md:gap-3">
          <span className="text-[9px] md:text-[10px] font-mono text-gray-500 w-6 md:w-8 text-right">
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleSeek}
            className="h-[3px] flex-1 bg-white/10 rounded-full relative group cursor-pointer"
          >
            <div
              className="absolute top-0 left-0 h-full bg-[#72fe8f] shadow-[0_0_10px_#72fe8f]"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-[9px] md:text-[10px] font-mono text-gray-500 w-6 md:w-8">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Volume */}
      <div className="hidden md:flex items-center justify-end gap-4 w-1/4 text-gray-500 group/volume">
        <button onClick={toggleMute} className="hover:text-white">
          {isMuted || volume === 0 ? (
            <VolumeX size={18} className="text-red-500" />
          ) : (
            <Volume2 size={18} />
          )}
        </button>
        <div className="relative w-24 h-[3px] bg-white/10 rounded-full overflow-hidden">
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
        <Maximize2 size={14} className="hover:text-white cursor-pointer" />
      </div>
    </footer>
  );
}
