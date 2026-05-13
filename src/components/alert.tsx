"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface MaintenanceAlertProps {
  message?: string;
  estimatedTime?: string;
  dismissible?: boolean;
  fullscreen?: boolean;
}

export default function MaintenanceAlert({
  message = "Server sedang dalam maintenance. Beberapa fitur mungkin tidak berfungsi sementara waktu.",
  estimatedTime,
  dismissible = false,
  fullscreen = false,
}: MaintenanceAlertProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
    }, 80);
    return () => clearInterval(interval);
  }, []);

  if (!visible) return null;

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#121212] border border-yellow-500/30 w-full max-w-md p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 h-[2px] bg-yellow-500 shadow-[0_0_10px_#eab308]" style={{ width: `${progress}%` }} />

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

            <p className="text-sm text-gray-400 mt-6 leading-relaxed">
              {message}
            </p>

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

  return (
    <div className="relative w-full bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent border-b border-yellow-500/30 backdrop-blur-md">
      <div className="absolute bottom-0 left-0 h-[1px] bg-yellow-500 shadow-[0_0_8px_#eab308]" style={{ width: `${progress}%` }} />

      <div className="flex items-center gap-3 px-4 md:px-12 py-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center animate-pulse">
          <AlertTriangle className="text-yellow-500" size={14} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] text-yellow-500 font-mono font-bold uppercase tracking-widest">
              [ MAINTENANCE_MODE ]
            </span>
            {estimatedTime && (
              <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest hidden sm:inline">
                · ETA: <span className="text-[#72fe8f]">{estimatedTime}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 truncate">
            {message}
          </p>
        </div>

        {dismissible && (
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 text-gray-500 hover:text-white p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
