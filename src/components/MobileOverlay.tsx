"use client";

import dynamic from "next/dynamic";
import {
  ChevronDown,
  MoreHorizontal,
  Share2,
  ListMusic,
  CheckCircle2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
} from "lucide-react";

const FullscreenVisualizer = dynamic(
  () => import("@/components/three/FullscreenVisualizer"),
  { ssr: false },
);

export default function MobileOverlay({
  onClose,
  currentTrack,
  ...props
}: any) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#050505] flex flex-col animate-[slideIn_0.3s_ease-out]">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `,
        }}
      />

      {/* 3D Reactive Visualizer - fullscreen behind everything */}
      <FullscreenVisualizer />

      {/* Subtle radial vignette + bottom gradient for readability */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_30%,_rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#050505] via-[#050505]/70 to-transparent pointer-events-none" />

      {/* Foreground UI */}
      <div className="relative z-10 flex flex-col h-full px-6 py-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <ChevronDown size={22} />
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-mono tracking-[0.4em] text-[#72fe8f] uppercase">
              [ NOW PLAYING ]
            </span>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#72fe8f] animate-pulse" />
              <span className="text-[9px] font-mono tracking-widest text-gray-400 uppercase">
                Live Session
              </span>
            </div>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
            <MoreHorizontal size={22} />
          </button>
        </div>

        {/* Spacer - lets the visualizer breathe in the middle */}
        <div className="flex-1 flex items-center justify-center">
          {/* Decorative tech rings around the visualizer center */}
          <div className="pointer-events-none">
            <div
              className="w-72 h-72 rounded-full border border-[#72fe8f]/15"
              style={{ boxShadow: "0 0 60px rgba(114,254,143,0.05)" }}
            />
          </div>
        </div>

        {/* Track Info + Like */}
        <div className="flex justify-between items-end mb-6">
          <div className="flex-1 overflow-hidden pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] font-mono tracking-widest text-[#72fe8f]/70 uppercase">
                Track
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#72fe8f]/40 to-transparent" />
            </div>
            <h2 className="text-3xl font-[1000] italic uppercase tracking-tighter text-white leading-none mb-2 truncate drop-shadow-[0_0_20px_rgba(0,0,0,0.8)]">
              {currentTrack?.title || "Unknown Title"}
            </h2>
            <p className="text-[#72fe8f] font-mono text-xs uppercase tracking-widest opacity-90 truncate">
              {currentTrack?.artist || "Unknown Artist"}
            </p>
          </div>
          <CheckCircle2 className="text-[#72fe8f] flex-shrink-0 drop-shadow-[0_0_8px_rgba(114,254,143,0.6)]" size={26} />
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div
            className="h-1 w-full bg-white/10 rounded-full mb-3 cursor-pointer"
            onClick={props.handleSeek}
          >
            <div
              className="h-full bg-[#72fe8f] rounded-full relative shadow-[0_0_15px_#72fe8f]"
              style={{ width: `${props.progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
            </div>
          </div>
          <div className="flex justify-between text-[10px] font-mono text-gray-500 tracking-widest">
            <span>{props.formatTime(props.currentTime)}</span>
            <span>—</span>
            <span>{props.formatTime(props.duration)}</span>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex justify-between items-center mb-8">
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
        <div className="flex justify-between items-center text-gray-500 pb-6">
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
