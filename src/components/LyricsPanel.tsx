"use client";

import React, { useRef, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Music2 } from "lucide-react";
import type { LyricLine } from "@/lib/lyricsCache";

const LyricsVisualizer = dynamic(
  () => import("@/components/three/LyricsVisualizer"),
  { ssr: false },
);

interface Props {
  lyrics: LyricLine[] | null;
  currentTime: number;
  isLoading?: boolean;
  className?: string;
}

export default function LyricsPanel({
  lyrics,
  currentTime,
  isLoading = false,
  className = "",
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeIndex = useMemo(() => {
    if (!lyrics?.length) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i;
      else break;
    }
    return idx;
  }, [lyrics, currentTime]);

  // Pulse the visualizer briefly each time a new line becomes active.
  const [intensity, setIntensity] = useState(0);
  const lastActiveRef = useRef(-1);
  useEffect(() => {
    if (activeIndex === lastActiveRef.current) return;
    lastActiveRef.current = activeIndex;
    if (activeIndex < 0) return;
    setIntensity(1);
    const t = setTimeout(() => setIntensity(0), 650);
    return () => clearTimeout(t);
  }, [activeIndex]);

  // Auto-scroll so the active line stays vertically centered.
  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target =
      el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    if (typeof (container as any).scrollTo === "function") {
      (container as any).scrollTo({ top: target, behavior: "smooth" });
    } else {
      container.scrollTop = target;
    }
  }, [activeIndex]);

  // Reset on song change.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    lineRefs.current = [];
  }, [lyrics]);

  if (isLoading) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        aria-label="Memuat lirik"
      >
        <LyricsVisualizer intensity={0.4} />
        <div className="relative z-10 h-full w-full flex items-center justify-center">
          <div className="flex gap-1.5 items-end" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="block w-1.5 bg-[#72fe8f] rounded-full animate-bounce"
                style={{
                  height: "18px",
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: "0.8s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!lyrics) {
    return (
      <div
        className={`relative overflow-hidden ${className}`}
        role="status"
        aria-live="polite"
      >
        <LyricsVisualizer intensity={0} />
        <div className="relative z-10 h-full w-full flex flex-col items-center justify-center gap-3">
          <Music2 size={36} className="text-gray-500" aria-hidden="true" />
          <p className="text-[11px] font-mono text-gray-400 uppercase tracking-[0.25em] text-center">
            Lirik tidak tersedia
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <LyricsVisualizer intensity={intensity} />

      <div
        ref={scrollRef}
        className="relative z-10 h-full w-full overflow-y-auto"
        style={{
          scrollbarWidth: "none",
          // Soft mask so lines fade at the top/bottom edges of the panel
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
        }}
        role="region"
        aria-label="Lirik lagu"
      >
        <div
          className="flex flex-col gap-5 text-center"
          style={{
            padding: "40% 1.5rem",
            perspective: "900px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {lyrics.map((line, i) => {
            const isActive = i === activeIndex;
            const distance = activeIndex >= 0 ? i - activeIndex : 0;
            const absDist = Math.abs(distance);

            // Lines further from the active one fade and recede in 3D.
            const opacity = isActive
              ? 1
              : absDist === 1
                ? 0.6
                : absDist === 2
                  ? 0.35
                  : 0.18;
            const blur = isActive ? 0 : Math.min(absDist * 0.6, 2.4);
            const translateZ = isActive ? 30 : -absDist * 14;
            const tilt = distance === 0 ? 0 : distance < 0 ? 6 : -6;
            const scale = isActive ? 1.08 : Math.max(0.9, 1 - absDist * 0.04);

            return (
              <div
                key={`${line.time}-${i}`}
                ref={(el: HTMLDivElement | null) => {
                  lineRefs.current[i] = el;
                }}
                aria-current={isActive || undefined}
                style={{
                  transition:
                    "opacity 450ms ease, transform 550ms cubic-bezier(0.22, 1, 0.36, 1), filter 450ms ease",
                  opacity,
                  transform: `translateZ(${translateZ}px) rotateX(${tilt}deg) scale(${scale})`,
                  transformStyle: "preserve-3d",
                  filter: blur ? `blur(${blur}px)` : "none",
                  willChange: "transform, opacity, filter",
                }}
              >
                <LyricLineText text={line.text} active={isActive} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Per-word staggered reveal for the active line; static for others. */
function LyricLineText({ text, active }: { text: string; active: boolean }) {
  // Split on whitespace, keeping the spaces so layout matches the original.
  const tokens = useMemo(() => text.split(/(\s+)/), [text]);

  if (!active) {
    return (
      <p
        style={{
          fontWeight: 700,
          lineHeight: 1.4,
          fontSize: "0.95rem",
          color: "#7b7f88",
          letterSpacing: "0.01em",
          transition: "color 0.4s ease",
        }}
      >
        {text}
      </p>
    );
  }

  return (
    <p
      style={{
        fontWeight: 800,
        lineHeight: 1.35,
        fontSize: "1.25rem",
        letterSpacing: "0.005em",
        color: "#ffffff",
        textShadow:
          "0 0 18px rgba(114,254,143,0.55), 0 0 38px rgba(114,254,143,0.25)",
      }}
    >
      {tokens.map((tok, idx) => {
        if (/^\s+$/.test(tok)) return tok;
        // Stagger each word slightly so the active line "blooms" in.
        const delay = idx * 35;
        return (
          <span
            key={`${tok}-${idx}`}
            style={{
              display: "inline-block",
              animation: `lyricsWordIn 520ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms both`,
            }}
          >
            {tok}
          </span>
        );
      })}
      <style>{`
        @keyframes lyricsWordIn {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.94);
            filter: blur(4px);
          }
          60% {
            opacity: 1;
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
      `}</style>
    </p>
  );
}
