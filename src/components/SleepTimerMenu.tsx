"use client";

import { Moon, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SleepTimerMenuProps {
  sleepTimerUntil: number | null;
  onSelect: (mins: number | null) => void;
  onClose: () => void;
  /** Posisi menu — default "top" (buka ke atas dari tombol), "bottom" buka ke bawah */
  placement?: "top" | "bottom";
  /** Override alignment — default "right" */
  align?: "left" | "right";
}

export default function SleepTimerMenu({
  sleepTimerUntil,
  onSelect,
  onClose,
  placement = "top",
  align = "right",
}: SleepTimerMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  useEffect(() => {
    if (!sleepTimerUntil) {
      setRemaining("");
      return;
    }
    const update = () => {
      const ms = sleepTimerUntil - Date.now();
      if (ms <= 0) {
        setRemaining("0:00");
        return;
      }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${m}:${s.toString().padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [sleepTimerUntil]);

  const options = [5, 10, 15, 30, 45, 60];

  const positionClass =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";
  const alignClass = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={ref}
      className={`absolute ${positionClass} ${alignClass} w-56 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl py-2 z-[50] animate-in fade-in zoom-in-95 duration-100`}
    >
      <div className="px-3 pb-2 border-b border-white/5 mb-1.5">
        <div className="flex items-center gap-2">
          <Moon size={13} className="text-[#72fe8f]" />
          <p className="text-xs font-bold text-white">Sleep Timer</p>
        </div>
        {sleepTimerUntil && remaining && (
          <p className="text-[10px] text-[#72fe8f] font-mono mt-1">
            Stops in {remaining}
          </p>
        )}
      </div>
      {options.map((m) => (
        <button
          key={m}
          onClick={() => onSelect(m)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
        >
          <span>{m} minutes</span>
        </button>
      ))}
      {sleepTimerUntil && (
        <>
          <div className="mx-3 my-1 h-px bg-white/5" />
          <button
            onClick={() => onSelect(null)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Check size={12} /> Turn off timer
          </button>
        </>
      )}
    </div>
  );
}
