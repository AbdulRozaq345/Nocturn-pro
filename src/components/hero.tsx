"use client";

import dynamic from "next/dynamic";
import { usePlayer } from "@/context/PlayerContext";

const HeroVisualizer = dynamic(
  () => import("@/components/three/HeroVisualizer"),
  { ssr: false },
);

interface HeroProps {
  currentTrack: any;
}

export default function Hero({ currentTrack }: HeroProps) {
  const { isPlaying, setIsPlaying } = usePlayer();

  return (
    <section className="relative hidden md:block w-full h-[480px] overflow-hidden">
      {/* 3D shader background */}
      <HeroVisualizer />

      {/* Gradient veil biar teks tetep kebaca */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/55 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />

      {/* Border glow di pinggir */}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#72fe8f]/40 to-transparent" />

      {/* Content overlay */}
      <div className="relative z-10 h-full flex flex-col justify-end px-12 pb-12 pt-20">
        <div className="flex items-center gap-3 mb-5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#72fe8f] opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#72fe8f]" />
          </span>
          <span className="text-[10px] font-bold text-[#72fe8f] tracking-[0.4em] uppercase font-mono">
            {isPlaying ? "// Live Session" : "// Now Playing"}
          </span>
        </div>

        <h2 className="text-7xl font-black tracking-tighter text-white leading-[0.85] uppercase max-w-3xl drop-shadow-[0_0_25px_rgba(0,0,0,0.7)]">
          {currentTrack?.title || "INITIALIZING..."}
        </h2>

        <p className="text-gray-300 text-sm mt-4 max-w-md leading-relaxed">
          <span className="text-[#72fe8f] font-mono uppercase tracking-wider">
            {currentTrack?.artist || "STANDBY"}
          </span>
          <span className="block mt-1 text-gray-400">
            High-fidelity audio curated for the late-night architect.
          </span>
        </p>

        <div className="flex items-center gap-4 mt-7">
          <button
            onClick={() => currentTrack && setIsPlaying(!isPlaying)}
            disabled={!currentTrack}
            className="relative group bg-[#72fe8f] text-black px-8 py-3 rounded-sm font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(114,254,143,0.4)] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="absolute inset-0 rounded-sm bg-[#72fe8f] blur opacity-50 group-hover:opacity-80 transition-opacity -z-10" />
            {isPlaying ? "▮▮ Pause" : "▶ Play Session"}
          </button>
          <button className="bg-white/5 backdrop-blur-md text-white px-8 py-3 rounded-sm font-bold text-xs uppercase tracking-widest border border-white/10 hover:border-[#72fe8f]/50 hover:bg-white/10 transition-all">
            + Add to Library
          </button>
        </div>
      </div>
    </section>
  );
}
