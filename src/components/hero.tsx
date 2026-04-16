interface HeroProps {
  currentTrack: any;
}

export default function Hero({ currentTrack }: HeroProps) {
  // Kalau lagi loading atau database kosong, kasih tampilan default biar gak error
  if (!currentTrack) {
    return (
      <section className="relative px-12 pt-8 pb-12 overflow-hidden animate-pulse">
        <div className="h-64 bg-surface-container rounded-sm"></div>
      </section>
    );
  }

  return (
    <section className="relative hidden md:block px-12 pt-8 pb-12 overflow-hidden">
      {/* Background Image: Ambil dari cover_url database lo */}
      <div className="absolute inset-0 z-0">
        <img
          className="w-full h-full object-cover scale-105 blur-sm"
          src={
            currentTrack.cover_url ? `${process.env.NEXT_PUBLIC_BASE_URL}/storage/covers/${currentTrack.cover_url}` : "https://placeholder.com"
          }
          alt={currentTrack.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-[#0e0e0e]/90 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0e] via-transparent to-transparent"></div>
      </div>

      <div className="relative z-10 backdrop-blur-3xl bg-white/5 p-10 rounded-sm flex flex-col gap-6 max-w-4xl border border-white/5 shadow-2xl">
        <div>
          <span className="text-[0.6rem] font-bold text-[#72fe8f] tracking-[0.3em] uppercase font-mono mb-4 block">
            Now Playing
          </span>
          {/* Title otomatis dari Database */}
          <h2 className="text-6xl font-extrabold tracking-tighter text-white mb-2 leading-none uppercase">
            {currentTrack.title}
          </h2>
          {/* Artist otomatis dari Database */}
          <p className="text-gray-400 text-sm max-w-md leading-relaxed">
            A masterpiece by{" "}
            <span className="text-[#72fe8f]">{currentTrack.artist}</span>.
            High-fidelity audio curated for the late-night architect. 🐈‍🤣
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="bg-[#72fe8f] text-black px-8 py-3 rounded-sm font-bold text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
            Play Session
          </button>
          <button className="bg-white/10 backdrop-blur-md text-white px-8 py-3 rounded-sm font-bold text-xs uppercase tracking-widest border border-white/10 hover:bg-white/20 transition-all">
            Add to Library
          </button>
        </div>
      </div>
    </section>
  );
}
