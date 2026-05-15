"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  MoreHorizontal,
  Share2,
  ListMusic,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Heart,
} from "lucide-react";
import { useState } from "react";

const FullscreenVisualizer = dynamic(
  () => import("@/components/three/FullscreenVisualizer"),
  { ssr: false },
);

export default function MobileOverlay({
  onClose,
  currentTrack,
  ...props
}: any) {
  const [imgError, setImgError] = useState(false);
  const coverSrc = !imgError
    ? currentTrack?.albumArt || currentTrack?.cover_url || "/nocturn.avif"
    : "/nocturn.avif";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col animate-[slideIn_0.3s_ease-out] overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes slideIn {
              from { transform: translateY(100%); }
              to   { transform: translateY(0); }
            }
            @keyframes spin-slow {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
          `,
        }}
      />

      {/* ── Background: blurred cover ── */}
      <div className="absolute inset-0">
        <img
          src={coverSrc}
          alt=""
          className="w-full h-full object-cover scale-110"
          style={{ filter: "blur(48px) brightness(0.3) saturate(1.6)" }}
          aria-hidden
        />
        {/* extra dark gradient so text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
      </div>

      {/* ── 3D Visualizer (subtle, behind cover) ── */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <FullscreenVisualizer />
      </div>

      {/* ── Foreground UI ── */}
      <div className="relative z-10 flex flex-col h-full px-6 pt-4 pb-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center"
          >
            <ChevronDown size={22} />
          </button>
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[9px] font-mono tracking-[0.4em] text-[#72fe8f] uppercase">
              Now Playing
            </span>
            <span className="text-[8px] font-mono text-gray-400 tracking-widest uppercase">
              {currentTrack?.artist || "—"}
            </span>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
            <MoreHorizontal size={22} />
          </button>
        </div>

        {/* ── Album Cover ── */}
        <div className="flex-1 flex items-center justify-center">
          <div
            className="relative w-72 h-72 md:w-80 md:h-80"
            style={{
              filter: "drop-shadow(0 24px 64px rgba(0,0,0,0.8))",
            }}
          >
            {/* Glow ring saat playing */}
            {props.isPlaying && (
              <div
                className="absolute -inset-3 rounded-2xl opacity-40"
                style={{
                  background:
                    "conic-gradient(from 0deg, #72fe8f, transparent, #72fe8f)",
                  animation: "spin-slow 4s linear infinite",
                  borderRadius: "20px",
                }}
              />
            )}

            <img
              src={coverSrc}
              alt={currentTrack?.title || "Cover"}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-2xl relative z-10"
              style={{
                transform: props.isPlaying ? "scale(1)" : "scale(0.95)",
                transition: "transform 0.4s ease",
                boxShadow: "0 8px 48px rgba(0,0,0,0.7)",
              }}
            />
          </div>
        </div>

        {/* Track Info + Like */}
        <div className="flex justify-between items-end mt-8 mb-5">
          <div className="flex-1 overflow-hidden pr-4">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white leading-none mb-1 truncate">
              {currentTrack?.title || "Unknown Title"}
            </h2>
            <p className="text-[#72fe8f] font-mono text-xs uppercase tracking-widest opacity-80 truncate">
              {currentTrack?.artist || "Unknown Artist"}
            </p>
          </div>
          <button className="flex-shrink-0 p-2 text-[#72fe8f]">
            <Heart size={24} fill="currentColor" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div
            className="h-1 w-full bg-white/15 rounded-full mb-2.5 cursor-pointer"
            onClick={props.handleSeek}
          >
            <div
              className="h-full bg-[#72fe8f] rounded-full relative shadow-[0_0_12px_#72fe8f]"
              style={{ width: `${props.progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 tracking-widest">
            <span>{props.formatTime(props.currentTime)}</span>
            <span>{props.formatTime(props.duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={props.toggleShuffle}
            className={`w-10 h-10 flex items-center justify-center ${
              props.isShuffle ? "text-[#72fe8f]" : "text-gray-500"
            }`}
          >
            <Shuffle size={20} />
          </button>
          <button
            onClick={props.playPrevious}
            className="w-12 h-12 flex items-center justify-center text-white"
          >
            <SkipBack size={30} fill="currentColor" />
          </button>
          <button
            onClick={props.togglePlay}
            className="w-20 h-20 bg-[#72fe8f] rounded-full flex items-center justify-center text-black active:scale-90 transition-transform shadow-[0_0_40px_rgba(114,254,143,0.5)]"
          >
            {props.isPlaying ? (
              <Pause size={32} fill="black" />
            ) : (
              <Play size={32} fill="black" className="ml-1.5" />
            )}
          </button>
          <button
            onClick={props.playNext}
            className="w-12 h-12 flex items-center justify-center text-white"
          >
            <SkipForward size={30} fill="currentColor" />
          </button>
          <button
            onClick={props.toggleRepeat}
            className={`w-10 h-10 flex items-center justify-center relative ${
              props.repeatMode !== "none" ? "text-[#72fe8f]" : "text-gray-500"
            }`}
          >
            <Repeat size={20} />
            {props.repeatMode === "one" && (
              <span className="absolute -top-1 -right-1 text-[7px] bg-[#72fe8f] text-black font-bold px-1 rounded-full">
                1
              </span>
            )}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-between items-center text-gray-500">
          <button className="hover:text-white transition-colors">
            <Share2 size={20} />
          </button>
          <button className="hover:text-white transition-colors">
            <ListMusic size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
