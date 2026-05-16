"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  ReactNode,
} from "react";

interface AudioAnalyserContextType {
  attachAudioElement: (el: HTMLAudioElement | null) => void;
  resumeContext: () => void;
  getAnalyser: () => AnalyserNode | null;
}

const AudioAnalyserContext = createContext<AudioAnalyserContextType | undefined>(
  undefined,
);

export function AudioAnalyserProvider({ children }: { children: ReactNode }) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const currentElRef = useRef<HTMLAudioElement | null>(null);

  const ensureContext = () => {
    if (audioCtxRef.current) return audioCtxRef.current;
    if (typeof window === "undefined") return null;
    try {
      const Ctx =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      const ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.85;
      analyser.connect(ctx.destination);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;

      // ── Auto-resume saat browser/OS suspend context ─────────────────────
      // Penting buat PWA: saat user pencet Home, browser bisa suspend
      // AudioContext. Karena audio kita di-route lewat MediaElementAudioSource,
      // suspend = no sound (meski <audio> tetap jalan). Auto-resume di sini
      // memastikan lagu berikutnya tetap kedengaran.
      ctx.addEventListener?.("statechange", () => {
        if (ctx.state === "suspended") {
          ctx.resume().catch(() => {});
        }
      });
      return ctx;
    } catch {
      return null;
    }
  };

  const attachAudioElement = useCallback((el: HTMLAudioElement | null) => {
    if (!el) return;
    if (el === currentElRef.current && sourceRef.current) return;

    const ctx = ensureContext();
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch {}
      sourceRef.current = null;
    }

    try {
      const source = ctx.createMediaElementSource(el);
      source.connect(analyser);
      sourceRef.current = source;
      currentElRef.current = el;
    } catch {
      // Element mungkin udah punya source node (bisa kejadian saat HMR). Diam aja.
    }
  }, []);

  const resumeContext = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }, []);

  const getAnalyser = useCallback(() => analyserRef.current, []);

  return (
    <AudioAnalyserContext.Provider
      value={{ attachAudioElement, resumeContext, getAnalyser }}
    >
      {children}
    </AudioAnalyserContext.Provider>
  );
}

export function useAudioAnalyser() {
  const ctx = useContext(AudioAnalyserContext);
  if (!ctx) {
    throw new Error(
      "useAudioAnalyser must be used within an AudioAnalyserProvider",
    );
  }
  return ctx;
}
