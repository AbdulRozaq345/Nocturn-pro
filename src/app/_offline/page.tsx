"use client";

import { WifiOff } from "lucide-react";
import DownloadedLibrary from "@/components/DownloadedLibrary";

export default function OfflinePage() {
  return (
    <div className="flex flex-col w-full min-h-full">
      {/* Banner */}
      <div className="flex items-center gap-3 px-4 md:px-12 py-3 bg-yellow-500/10 border-b border-yellow-500/20">
        <WifiOff size={14} className="text-yellow-400 flex-shrink-0" />
        <p className="text-[11px] font-mono text-yellow-400 uppercase tracking-widest">
          Tidak ada koneksi internet — hanya lagu offline yang bisa diputar
        </p>
      </div>

      {/* Offline library — reads from IndexedDB, no network needed */}
      <DownloadedLibrary />
    </div>
  );
}
