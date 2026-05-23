"use client";

import { useRef, useEffect, useMemo } from "react";
import { Music2 } from "lucide-react";
import type { LyricLine } from "@/lib/lyricsCache";

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

  // Scroll sehingga baris aktif selalu di tengah container
  useEffect(() => {
    const el = lineRefs.current[activeIndex];
    const container = scrollRef.current;
    if (!el || !container) return;
    const target = el.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
    container.scrollTo({ top: target, behavior: "smooth" });
  }, [activeIndex]);

  // Reset posisi scroll saat lagu berganti
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    lineRefs.current = [];
  }, [lyrics]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`} aria-label="Memuat lirik">
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
    );
  }

  if (!lyrics) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-3 ${className}`}
        role="status"
        aria-live="polite"
      >
        <Music2 size={36} className="text-gray-700" aria-hidden="true" />
        <p className="text-[11px] font-mono text-gray-600 uppercase tracking-[0.25em] text-center">
          Lirik tidak tersedia
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto ${className}`}
      style={{ scrollbarWidth: "none" } as React.CSSProperties}
      role="region"
      aria-label="Lirik lagu"
    >
      {/* Padding atas/bawah besar agar baris pertama/terakhir bisa di-center */}
      <div className="flex flex-col gap-4 text-center" style={{ padding: "40% 1.5rem" }}>
        {lyrics.map((line, i) => {
          const isActive = i === activeIndex;
          const isFuture = i > activeIndex;
          return (
            <div
              key={`${line.time}-${i}`}
              ref={(el) => {
                lineRefs.current[i] = el;
              }}
              aria-current={isActive || undefined}
              style={{
                transition: "opacity 0.4s ease, transform 0.4s ease",
                opacity: isActive ? 1 : isFuture ? 0.45 : 0.28,
                transform: isActive ? "scale(1.05)" : "scale(1)",
                transformOrigin: "center",
              }}
            >
              <p
                style={{
                  fontWeight: 700,
                  lineHeight: 1.4,
                  transition: "color 0.4s ease, font-size 0.4s ease",
                  fontSize: isActive ? "1.15rem" : "0.95rem",
                  color: isActive ? "#ffffff" : "#6b7280",
                }}
              >
                {line.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
