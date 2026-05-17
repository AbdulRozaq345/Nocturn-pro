"use client";

import { X, Music, Play, Pause, Trash2, ListMusic } from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useGlobalMenu } from "@/context/MenuContext";
import { useMemo } from "react";

export default function QueuePanel() {
  const {
    isQueueOpen,
    setIsQueueOpen,
    queue,
    setQueue,
    tracks,
    currentTrack,
    isPlaying,
    setIsPlaying,
    playTrackRef,
  } = usePlayer();
  const { showMenu } = useGlobalMenu();

  // Track berikutnya dari `tracks` list (yang akan diputar setelah queue habis)
  const upcomingFromTracks = useMemo(() => {
    if (!currentTrack || tracks.length === 0) return [];
    const idx = tracks.findIndex((t) => String(t.id) === String(currentTrack.id));
    if (idx < 0) return [];
    return tracks.slice(idx + 1, idx + 11);
  }, [tracks, currentTrack]);

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <>
      {/* Backdrop */}
      {isQueueOpen && (
        <div
          className="hidden md:block fixed inset-0 z-[80] bg-black/30 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsQueueOpen(false)}
        />
      )}

      {/* Panel */}
      <aside
        className={`hidden md:flex fixed right-0 top-0 bottom-[96px] z-[90] w-[380px] bg-[#0f0f0f] border-l border-white/[0.06] flex-col transition-transform duration-300 ease-out shadow-[0_0_60px_rgba(0,0,0,0.6)] ${
          isQueueOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <ListMusic size={18} className="text-[#72fe8f]" />
            <h2 className="text-base font-bold text-white tracking-tight">Up Next</h2>
            {queue.length > 0 && (
              <span className="text-[10px] font-mono text-gray-500 ml-1">
                {queue.length} in queue
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear queue"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsQueueOpen(false)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Now Playing */}
          {currentTrack ? (
            <div className="px-5 pt-4 pb-3">
              <p className="text-[10px] font-bold text-[#72fe8f] uppercase tracking-[0.2em] mb-2.5">
                Now Playing
              </p>
              <div
                className="flex items-center gap-3 p-2 rounded-lg bg-[#72fe8f]/[0.08] border border-[#72fe8f]/20"
                onContextMenu={(e) => showMenu(e, currentTrack, "general")}
              >
                <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                  <img
                    src={currentTrack.albumArt || currentTrack.cover_url || "/nocturn.avif"}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/nocturn.avif"; }}
                  />
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center"
                  >
                    {isPlaying ? (
                      <Pause size={16} fill="white" className="text-white" />
                    ) : (
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    )}
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate mt-0.5">
                    {currentTrack.artist}
                  </p>
                </div>
                {/* Audio bars animation */}
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-4 flex-shrink-0 mr-1">
                    <span className="w-0.5 bg-[#72fe8f] animate-[pulse_0.8s_ease-in-out_infinite] h-1/2" />
                    <span className="w-0.5 bg-[#72fe8f] animate-[pulse_0.8s_ease-in-out_infinite_0.2s] h-full" />
                    <span className="w-0.5 bg-[#72fe8f] animate-[pulse_0.8s_ease-in-out_infinite_0.4s] h-1/3" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Music size={36} className="text-gray-700 mx-auto mb-3" />
              <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">
                No track playing
              </p>
            </div>
          )}

          {/* In Queue (user-added) */}
          {queue.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2.5">
                In Queue ({queue.length})
              </p>
              <div className="flex flex-col gap-1">
                {queue.map((track, i) => (
                  <div
                    key={`${track.id}-${i}`}
                    onClick={() => {
                      // Drop dari queue dan langsung play
                      setQueue((prev) => prev.filter((_, idx) => idx !== i));
                      playTrackRef.current(track);
                    }}
                    onContextMenu={(e) => showMenu(e, track, "queue")}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] group transition-colors cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                      <img
                        src={track.albumArt || track.cover_url || "/nocturn.avif"}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/nocturn.avif"; }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromQueue(i);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
                      title="Remove from queue"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next from playlist */}
          {upcomingFromTracks.length > 0 && (
            <div className="px-5 py-3 border-t border-white/5 pb-8">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-2.5">
                Next from playlist
              </p>
              <div className="flex flex-col gap-1">
                {upcomingFromTracks.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => playTrackRef.current(track)}
                    onContextMenu={(e) => showMenu(e, track, "general")}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/[0.06] group transition-colors cursor-pointer"
                  >
                    <div className="relative w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                      <img
                        src={track.albumArt || track.cover_url || "/nocturn.avif"}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { (e.target as HTMLImageElement).src = "/nocturn.avif"; }}
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={14} fill="white" className="text-white ml-0.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate group-hover:text-white transition-colors">
                        {track.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>
                    <span className="text-[10px] text-gray-600 font-mono flex-shrink-0 mr-1">
                      {track.duration || ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
