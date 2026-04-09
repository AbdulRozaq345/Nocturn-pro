"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause, // <-- Tambahin ini
  Music2,
  Search,
  Home as HomeIcon,
  Library,
  Clock,
  Heart,
  Volume2,
  VolumeX,
  Trash2,
  RefreshCw,
  Download,
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleRight, faCircleLeft } from "@fortawesome/free-solid-svg-icons";

export default function Home() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false); // <-- Tambahin state ini
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState({
    name: "Playlist Saya",
    image: null as string | null,
  });
  // Fitur Tambahan (Search, Download, dll)
  const [searchQuery, setSearchQuery] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const fullWidth = rect.width;
    const percentage = x / fullWidth;
    const targetTime = percentage * audioRef.current.duration;
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
    setProgress(percentage * 100);
  };

  const API_BASE =
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://panel.nexxacodeid.site";

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      setIsMuted(newMutedState);
      audioRef.current.muted = newMutedState;
      if (!newMutedState && volume === 0) {
        setVolume(0.1);
        audioRef.current.volume = 0.1;
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const total = audioRef.current.duration || 0;
      setCurrentTime(current);
      setDuration(total);
      setProgress(total > 0 ? (current / total) * 100 : 0);
    }
  };

  const calculateTotalPlaylistTime = () => {
    if (tracks.length === 0) return "0 mnt";
    const totalSeconds = tracks.reduce(
      (acc, track) => acc + (track?.durationSeconds || track?.duration || 0),
      0,
    );
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return hours > 0 ? `${hours} jam ${minutes} mnt` : `${minutes} mnt`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPlaylistInfo({ ...playlistInfo, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
  };

  const playPrevious = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
  };

  const handleDownloadYoutube = async (youtubeUrl: string) => {
    if (!youtubeUrl) return alert("Patenkan URL YouTube-nya bosquu!");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: youtubeUrl }),
      });

      let json = { status: "", error: "", data: null };
      const text = await res.text();
      try {
        json = JSON.parse(text.trim());
      } catch (e) {
        console.warn("Bukan JSON murni. Raw response:", text);
      }

      if (
        (res.ok && json.data) ||
        json.status === "success" ||
        json.status === "Gaskeun!"
      ) {
        setTracks([json.data, ...tracks]);
        setYoutubeUrl("");
        alert("Lagu sukses di-download! Gaskeun 🔥");
      } else {
        alert(
          "Error dari backend: " +
            (json.error || "Gagal/Timeout"),
        );
      }
    } catch (err: any) {
      console.error("Gagal Request:", err);
      if (err.name === "TypeError") {
        alert(
          "Gagal menghubungi server (Terkendala CORS atau Timeout dari Cloudflare/Server karena proses download terlalu lama, cek log panel backend!).",
        );
      } else {
        alert("Terjadi kesalahan di jaringan/sistem: " + String(err.message));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fitur Scan Folder
  const handleScanFolder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/scanFolder`);
      const json = await res.json();
      alert(json.message || "Folder berhasil discan!");
      await fetchTracks(); // Refresh data
    } catch (err) {
      alert("Gagal scan folder");
    } finally {
      setIsLoading(false);
    }
  };

  // Fitur Hapus
  const handleDeleteTrack = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Biar gak auto play lagunya pas klik delete
    const confirmDelete = window.confirm(
      "Yakin mau hapus lagu ini ke tempat sampah, bosquu? 🗿",
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/tracks/${id}`, {
        method: "DELETE",
      });

      let json = { status: "", message: "" };
      const text = await res.text();
      try {
        json = JSON.parse(text);
      } catch (parseErr) {
        console.warn("Bukan strict JSON, isi balasan:", text);
      }

      if (res.ok || json.status === "Gacor!") {
        setTracks(tracks.filter((t) => t.id !== id));
        if (currentTrack?.id === id) {
          setCurrentTrack(null);
          audioRef.current?.pause();
          setIsPlaying(false);
        }
        alert(json.message || "Lagu berhasil dihapus.");
      } else {
        alert(json.message || "Gagal hapus!");
      }
    } catch (err) {
      console.error(err);
      alert("Error: gagal menghubungi server");
    }
  };

  // Extract fungsi fetch biasa agar bisa dipakai ulang (oleh scan/search empty)
  const fetchTracks = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/tracks`, { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json && json.status === "success") {
        setTracks(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
    }
  };

  // Fitur Search
  const handleSearch = async (
    e: React.FormEvent | React.ChangeEvent<HTMLInputElement>,
  ) => {
    let kw = "";
    if ("target" in e) kw = (e.target as HTMLInputElement).value;
    setSearchQuery(kw);

    if (!kw.trim()) {
      fetchTracks();
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/api/tracks/search?q=${encodeURIComponent(kw)}`,
      );
      const json = await res.json();
      if (json.status === "success") {
        setTracks(json.data || []);
      }
    } catch (err) {
      console.error("Gagal nyari lagu:", err);
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    fetchTracks();
  }, [API_BASE]);
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.load();
      audioRef.current.play();
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [currentTrack]);

  return (
    <div className="flex h-screen bg-[#050505] text-[#e0e0e0] font-sans">
      {/* SIDEBAR */}
      <aside className="w-64 bg-black border-r border-[#151515] p-6 flex flex-col gap-8 hidden lg:flex">
        <h1 className="text-2xl font-black tracking-tighter text-[#1DB954] italic">
          notcer.
        </h1>
        <nav className="flex flex-col gap-6 text-sm font-bold text-gray-400">
          <div className="flex items-center gap-4 text-white cursor-pointer hover:text-[#1DB954] transition-all">
            <HomeIcon size={22} /> Home
          </div>
          <div className="flex items-center gap-4 hover:text-white transition-all cursor-pointer">
            <Search size={22} /> Search
          </div>
          <div className="flex items-center gap-4 hover:text-white transition-all cursor-pointer">
            <Library size={22} /> Library
          </div>
          <div className="mt-4 pt-4 border-t border-[#151515] flex items-center gap-4 hover:text-white transition-all cursor-pointer">
            <Heart size={22} /> Liked Songs
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a1a] via-[#050505] to-[#050505] p-8 pb-32">
        <div className="max-w-5xl mx-auto">
          {/* GREETING SECTION */}
          <header className="mb-10">
            <h2 className="text-3xl font-black tracking-tight text-white mb-6">
              Good Afternoon, Bosquu 🐈‍🤣
            </h2>
            <label className="w-48 h-48 bg-[#282828] shadow-2xl flex-shrink-0 flex items-center justify-center cursor-pointer overflow-hidden rounded-md relative group">
              {playlistInfo.image ? (
                <img
                  src={playlistInfo.image}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Music2 size={64} className="text-gray-600" />
              )}
              <input
                type="file"
                className="hidden"
                onChange={handleImageUpload}
                accept="image/*"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <p className="text-xs font-bold text-white">Ganti Foto</p>
              </div>
            </label>

            {/* FEATURED / QUICK ACCESS */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold uppercase tracking-wider">
                Public Playlist
              </span>
              <input
                type="text"
                value={playlistInfo.name}
                onChange={(e) =>
                  setPlaylistInfo({ ...playlistInfo, name: e.target.value })
                }
                className="text-7xl font-black bg-transparent border-none outline-none focus:ring-0 p-0 tracking-tighter text-white"
              />
              <div className="flex items-center gap-2 text-sm font-bold mt-2">
                <span className="text-[#1DB954] hover:underline cursor-pointer">
                  notcer.
                </span>
                <span className="text-gray-400">
                  • {tracks.length} lagu, {calculateTotalPlaylistTime()}
                </span>
              </div>
            </div>
          </header>

          {/* ALL TRACKS LIST */}
          <section>
            {/* ACTION BAR: Search, Download YT & Scan */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
              <form
                onSubmit={handleSearch}
                className="flex items-center w-full max-w-md bg-[#282828]/60 rounded-full px-4 py-2 border border-[#4d4d4d]/30 focus-within:border-[#1DB954] transition-colors"
              >
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari lagu atau artis..."
                  className="bg-transparent border-none outline-none text-sm text-white w-full ml-2 focus:ring-0"
                  value={searchQuery}
                  onChange={handleSearch} /* Realtime Search */
                />
              </form>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <div className="flex items-center bg-[#282828]/60 rounded-full px-4 py-2 w-full border border-[#4d4d4d]/30 focus-within:border-[#1DB954] transition-colors">
                  <input
                    type="text"
                    placeholder="Link YouTube..."
                    className="bg-transparent border-none outline-none text-sm text-white w-full focus:ring-0"
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                  />
                  <button
                    onClick={() => handleDownloadYoutube(youtubeUrl)}
                    disabled={isLoading}
                    className="text-[#1DB954] hover:text-white transition-colors ml-2 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                  </button>
                </div>
                <button
                  onClick={handleScanFolder}
                  disabled={isLoading}
                  title="Sync Lagu Local"
                  className="bg-[#282828] p-2.5 rounded-full border border-[#4d4d4d]/30 text-gray-400 hover:text-[#1DB954] transition disabled:opacity-50"
                >
                  <RefreshCw
                    size={18}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock size={20} /> Your Music Library
              </h3>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">
                {tracks.length} songs found
              </p>
            </div>

            <div className="bg-[#121212]/30 rounded-xl border border-[#1a1a1a] overflow-hidden">
              <div className="grid grid-cols-[40px_1fr_120px] gap-4 p-4 border-b border-[#1a1a1a] text-xs font-bold text-gray-500 uppercase tracking-widest">
                <p className="text-center">#</p>
                <p>Title / Artist</p>
                <p className="text-right">Action</p>
              </div>

              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => setCurrentTrack(track)}
                  className={`grid grid-cols-[40px_1fr_120px] gap-4 p-4 items-center transition-all cursor-pointer border-b border-[#151515]/50 group 
  ${currentTrack?.id === track.id ? "bg-[#1DB954]/10" : "hover:bg-white/5"}`}
                >
                  <span
                    className={`text-center text-sm font-mono ${currentTrack?.id === track.id ? "text-[#1DB954]" : "text-gray-500"}`}
                  >
                    {index + 1}
                  </span>
                  <div className="overflow-hidden">
                    <p
                      className={`text-sm font-bold truncate ${currentTrack?.id === track.id ? "text-[#1DB954]" : "text-white"}`}
                    >
                      {track.trackTitle || track.title}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold">
                      {track.artistName || track.artist}
                    </p>
                  </div>
                  <div className="text-right opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-end gap-3 z-10">
                    <button className="bg-[#1DB954] text-black p-2 rounded-full hover:scale-110 transition-transform">
                      <Play size={14} fill="currentColor" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteTrack(e, track.id)}
                      title="Hapus Lagu"
                      className="bg-red-600/10 text-red-500 p-2 rounded-full hover:bg-red-600 hover:text-white transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* PLAYER BAR */}
      {currentTrack && (
        <footer className="fixed bottom-0 left-0 right-0 h-24 bg-black border-t border-[#121212] px-4 flex items-center justify-between z-50I">
          {/* INFO KIRI */}
          <div className="flex items-center gap-4 w-[30%]">
            <div className="w-14 h-14 bg-[#282828] rounded flex items-center justify-center">
              <Music2 size={24} className="text-gray-600" />
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">
                {currentTrack.trackTitle || currentTrack.title}
              </p>
              <p className="text-xs text-gray-400">
                {currentTrack.artistName || currentTrack.artist}
              </p>
            </div>
          </div>

          {/* CONTROLS TENGAH */}
          <div className="flex flex-col items-center w-[40%] gap-2">
            <div className="flex items-center gap-6 text-gray-400">
              {/* Button Previous */}
              <button
                onClick={playPrevious}
                className="hover:text-white transition-colors p-1"
              >
                <FontAwesomeIcon
                  icon={faCircleLeft}
                  style={{ color: "rgb(255, 255, 255)" }}
                  size="2xl"
                />
              </button>

              {/* Button Play/Pause */}
              <button
                onClick={togglePlay}
                className="bg-white text-black p-2.5 rounded-full hover:scale-105 transition active:scale-95"
              >
                {isPlaying ? (
                  <Pause size={24} fill="black" />
                ) : (
                  <Play size={24} fill="black" />
                )}
              </button>

              {/* Button Next */}
              <button
                onClick={playNext}
                className="hover:text-white transition-colors p-1"
              >
                <FontAwesomeIcon
                  icon={faCircleRight}
                  style={{ color: "rgb(255, 255, 255)" }}
                  size="2xl"
                />
              </button>
            </div>

            {/* PROGRESS BAR JALAN BENERAN */}
            <div className="flex items-center gap-2 w-full max-w-md group">
              <span className="text-[10px] text-gray-400">
                {formatTime(currentTime)}
              </span>
              <div
                onClick={handleSeek}
                className="h-1 flex-1 bg-[#4d4d4d] rounded-full relative group cursor-pointer"
              >
                <div
                  className="absolute top-0 left-0 h-full bg-[#1DB954] group-hover:bg-[#1ed760] transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${progress}%`, marginLeft: "-6px" }}
                />
              </div>
              <span className="text-[10px] text-gray-400">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          <div className="w-[30%] flex justify-end items-center gap-3 text-gray-400 group">
            <button
              onClick={toggleMute}
              className="hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX size={18} />
              ) : (
                <Volume2 size={18} />
              )}
            </button>

            <div className="relative w-24 h-1 bg-[#4d4d4d] rounded-full overflow-hidden">
              {/* Progress Bar Hijau (Visual) */}
              <div
                className="absolute top-0 left-0 h-full bg-[#1DB954] group-hover:bg-[#1ed760] transition-all"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </div>
          </div>

          {/* AUDIO ELEMENT DENGAN REF */}
          <audio
            ref={audioRef}
            key={currentTrack.id}
            src={`${API_BASE}/storage/music/${currentTrack.fileName || currentTrack.file_name}`}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={playNext}
            autoPlay
          />
        </footer>
      )}
    </div>
  );
}
