"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { syncOfflineFromServer, pushLocalToServer } from "@/lib/offlineSync";
import type { SyncProgress } from "@/lib/offlineSync";
import { preloadOfflineCache, refreshOfflineCache } from "@/lib/offlineCache";

export default function OfflineSyncProvider() {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [isOnline, setIsOnline] = useState(() =>
    typeof window !== "undefined" ? navigator.onLine : true,
  );
  // Tampilkan "back online" sebentar setelah reconnect
  const [showOnlineBanner, setShowOnlineBanner] = useState(false);

  useEffect(() => {
    // Preload blob URL cache di startup — biar offline playback langsung ready
    // Dilakukan sebelum auth check supaya offline mode bisa langsung dengar tanpa login
    preloadOfflineCache();

    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    const runSync = async () => {
      if (!navigator.onLine) return;
      await pushLocalToServer().catch(() => {});
      await syncOfflineFromServer((p) => {
        if (!cancelled) setProgress(p);
      }).catch(() => {});
      // Refresh cache setelah sync — track baru yang baru di-download masuk cache
      await refreshOfflineCache().catch(() => {});
      if (!cancelled) setProgress(null);
    };

    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineBanner(true);
      setTimeout(() => setShowOnlineBanner(false), 3000);
      pushLocalToServer().catch(() => {});
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOnlineBanner(false);
    };

    // Sync awal setelah 3 detik biar app selesai load
    const timer = setTimeout(runSync, 3000);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Indikator "Back Online" singkat
  if (showOnlineBanner) {
    return (
      <div className="fixed bottom-[160px] md:bottom-28 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2.5 bg-[#141414] border border-[#72fe8f]/40 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(114,254,143,0.15)] pointer-events-none animate-in fade-in slide-in-from-bottom-2">
        <Wifi size={12} className="text-[#72fe8f] flex-shrink-0" />
        <span className="text-[10px] font-mono text-[#72fe8f] tracking-widest">
          ONLINE
        </span>
      </div>
    );
  }

  // Indikator offline persisten (kecil, tidak mengganggu)
  if (!isOnline && (!progress || progress.done === progress.total)) {
    return (
      <div className="fixed bottom-[160px] md:bottom-28 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2.5 bg-[#141414] border border-yellow-500/30 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(234,179,8,0.1)] pointer-events-none">
        <WifiOff size={12} className="text-yellow-400 flex-shrink-0" />
        <span className="text-[10px] font-mono text-yellow-400 tracking-widest">
          OFFLINE MODE
        </span>
      </div>
    );
  }

  // Progress bar saat sync
  if (progress && progress.done < progress.total) {
    return (
      <div className="fixed bottom-[160px] md:bottom-28 left-1/2 -translate-x-1/2 z-[250] flex items-center gap-2.5 bg-[#141414] border border-[#72fe8f]/20 rounded-full px-4 py-2 shadow-[0_0_20px_rgba(114,254,143,0.1)] pointer-events-none">
        <WifiOff size={12} className="text-[#72fe8f] flex-shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-mono text-[#72fe8f] tracking-widest">
            SYNC OFFLINE {progress.done}/{progress.total}
          </span>
          {progress.current && (
            <span className="text-[9px] font-mono text-gray-500 truncate max-w-[200px]">
              {progress.current}
            </span>
          )}
        </div>
        <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-[#72fe8f] rounded-full transition-all"
            style={{
              width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%`,
            }}
          />
        </div>
      </div>
    );
  }

  return null;
}
