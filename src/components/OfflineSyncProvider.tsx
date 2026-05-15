"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { syncOfflineFromServer, pushLocalToServer } from "@/lib/offlineSync";
import type { SyncProgress } from "@/lib/offlineSync";

export default function OfflineSyncProvider() {
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let cancelled = false;

    const run = async () => {
      // Dulu push lokal → server (kalau ada track yang disimpan saat offline)
      await pushLocalToServer().catch(() => {});

      // Lalu download dari server → lokal (kalau ada yang belum ada lokal)
      await syncOfflineFromServer((p) => {
        if (!cancelled) setProgress(p);
      });

      if (!cancelled) setProgress(null);
    };

    // Delay sedikit agar tidak block initial render
    const timer = setTimeout(run, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!progress || progress.done === progress.total) return null;

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
      {/* Progress bar */}
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
