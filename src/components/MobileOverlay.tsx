import {
  ChevronDown,
  MoreHorizontal,
  Share2,
  ListMusic,
  CheckCircle2,
} from "lucide-react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
} from "lucide-react";

export default function MobileOverlay({
  onClose,
  currentTrack,
  ...props
}: any) {
  return (
    <div className="fixed inset-0 z-[200] bg-[#0a0a0a] flex flex-col px-6 py-4 animate-[slideIn_0.3s_ease-out] backdrop-blur-xl">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes slideIn {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `,
        }}
      />

      {/* Header Overlay */}
      <div className="flex justify-between items-center mb-10">
        <button onClick={onClose}>
          <ChevronDown size={28} />
        </button>
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-mono tracking-[0.3em] text-gray-500 uppercase">
            Now Playing
          </span>
        </div>
        <button>
          <MoreHorizontal size={24} />
        </button>
      </div>

      {/* Album Art Raksasa */}
      <div className="w-full aspect-square bg-[#121212] mb-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 flex items-center justify-center relative overflow-hidden rounded-xl">
        {currentTrack ? (
          <img className="text-transparent w-full h-full object-cover grayscale-[0.2] bg-white/5 animate-pulse text-[0px]" src={"/nocturn.avif"}
            alt="cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent animate-pulse" />
        )}
      </div>

      {/* Info Lagu */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex-1 overflow-hidden pr-4">
          <h2 className="text-2xl font-[1000] italic uppercase tracking-tighter text-white leading-none mb-2 truncate">
            {currentTrack?.title || "Unknown Title"}
          </h2>
          <p className="text-[#72fe8f] font-mono text-xs uppercase tracking-widest opacity-80 truncate">
            {currentTrack?.artist || "Unknown Artist"}
          </p>
        </div>
        <CheckCircle2 className="text-[#72fe8f]" size={24} />
      </div>

      {/* Custom Progress Bar Full Screen */}
      <div className="mb-10">
        <div
          className="h-1 w-full bg-white/10 rounded-full mb-3"
          onClick={props.handleSeek}
        >
          <div
            className="h-full bg-[#72fe8f] relative shadow-[0_0_15px_#72fe8f]"
            style={{ width: `${props.progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
          </div>
        </div>
        <div className="flex justify-between text-[10px] font-mono text-gray-500">
          <span>{props.formatTime(props.currentTime)}</span>
          <span>{props.formatTime(props.duration)}</span>
        </div>
      </div>

      {/* Main Controls Gede */}
      <div className="flex justify-between items-center mb-12">
        <Shuffle
          onClick={props.toggleShuffle}
          className={props.isShuffle ? "text-[#72fe8f]" : "text-gray-500"}
        />
        <SkipBack onClick={props.playPrevious} size={32} fill="white" />
        <button
          onClick={props.togglePlay}
          className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-black active:scale-90 transition-transform"
        >
          {props.isPlaying ? (
            <Pause size={36} fill="black" />
          ) : (
            <Play size={36} fill="black" className="ml-2" />
          )}
        </button>
        <SkipForward onClick={props.playNext} size={32} fill="white" />
        <Repeat
          onClick={props.toggleRepeat}
          className={
            props.repeatMode !== "none" ? "text-[#72fe8f]" : "text-gray-500"
          }
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-between items-center text-gray-500 mt-auto pb-6">
        <Share2 size={20} className="hover:text-white" />
        <ListMusic size={20} className="hover:text-white" />
      </div>
    </div>
  );
}
