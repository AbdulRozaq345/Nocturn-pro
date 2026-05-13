"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface MaintenanceStatus {
  active: boolean;
  message: string;
  estimatedTime: string;
  fullscreen: boolean;
}

interface MaintenanceAlertProps {
  pollIntervalMs?: number;
  dismissible?: boolean;
}

const DEFAULT_POLL_INTERVAL_MS = 15_000;

export default function MaintenanceAlert({
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  dismissible = false,
}: MaintenanceAlertProps) {
  const [status, setStatus] = useState<MaintenanceStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/maintenance-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as MaintenanceStatus;
        if (!cancelled) setStatus(data);
      } catch {
        // diam aja, tunggu poll berikutnya (penting buat PWA offline)
      }
    };

    fetchStatus();
    const id = setInterval(fetchStatus, pollIntervalMs);

    return () => {
      cancelled = true;
      controller.abort();
      clearInterval(id);
    };
  }, [pollIntervalMs]);

  useEffect(() => {
    if (!status?.active) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 80);
    return () => clearInterval(interval);
  }, [status?.active]);

  useEffect(() => {
    if (status?.active) setDismissed(false);
  }, [status?.active]);

  if (!status?.active || dismissed) return null;

  const { message, estimatedTime, fullscreen } = status;

  // FULLSCREEN MODE — block seluruh halaman
  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-yellow-500/30 w-full max-w-md p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div
            className="absolute top-0 left-0 h-[2px] bg-yellow-500 shadow-[0_0_10px_#eab308]"
            style={{ width: `${progress}%` }}
          />
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-4 animate-pulse">
              <AlertTriangle className="text-yellow-500" size={32} />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-white uppercase">
              System Maintenance
            </h1>
            <p className="text-[10px] text-yellow-500 mt-2 font-mono uppercase tracking-widest">
              [ STATUS_OFFLINE ]
            </p>
            <p className="text-sm text-gray-400 mt-6 leading-relaxed">{message}</p>
            {estimatedTime && (
              <div className="mt-6 w-full border-t border-white/5 pt-4">
                <p className="text-[10px] uppercase tracking-widest text-gray-500 font-mono">
                  Estimasi Selesai
                </p>
                <p className="text-sm text-[#72fe8f] font-mono font-bold mt-1">
                  {estimatedTime}
                </p>
              </div>
            )}
            <p className="text-[10px] text-gray-600 mt-8 font-mono">
              © 2026 NexxaCodeID. Stay tuned. 🛠️
            </p>
          </div>
        </div>
      </div>
    );
  }

  // CARD MODE — floating card, visible di desktop + mobile + PWA
  return (
    <div
      className="
        fixed z-[200]
        top-20 md:top-24
        left-3 right-3
        md:left-auto md:right-6 md:max-w-sm md:w-full
        animate-in slide-in-from-top-5 fade-in duration-300
        pointer-events-none
      "
      role="alert"
      aria-live="polite"
    >
      <div className="bg-[#121212]/95 border border-yellow-500/40 rounded-xl shadow-2xl shadow-yellow-500/10 backdrop-blur-xl overflow-hidden relative pointer-events-auto">
        {/* Progress bar berjalan */}
        <div
          className="absolute top-0 left-0 h-[2px] bg-yellow-500 shadow-[0_0_10px_#eab308] transition-all"
          style={{ width: `${progress}%` }}
        />

        {/* Glow accent corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-yellow-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative p-4 flex gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
            <AlertTriangle className="text-yellow-500" size={18} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] text-yellow-500 font-mono font-bold uppercase tracking-widest">
                [ MAINTENANCE_MODE ]
              </span>
              {dismissible && (
                <button
                  onClick={() => setDismissed(true)}
                  className="flex-shrink-0 text-gray-500 hover:text-white p-0.5 transition-colors"
                  aria-label="Dismiss"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <p className="text-xs text-gray-200 leading-relaxed">{message}</p>

            {estimatedTime && (
              <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-gray-500 font-mono">
                  ETA
                </span>
                <span className="text-[11px] text-[#72fe8f] font-mono font-bold">
                  {estimatedTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
      </div>
    </div>
  );
}
