"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import { Play, Music } from "lucide-react";
import TrackList from "@/components/TrackList";

export default function PlaylistPage() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { setCurrentTrack, setIsPlaying, setTracks } = usePlayer();

  useEffect(() => {
    const fetchPlaylistDetail = async () => {
      try {
        const res = await api.get(`/api/playlists/${id}`);
        const API_BASE =
          api.defaults.baseURL || "https://panel.nexxacodeid.site";
        const data = res.data.data || res.data;

        if (data && data.tracks && Array.isArray(data.tracks)) {
          data.tracks = data.tracks.map((track: any) => ({
            ...track,
            title: track.trackTitle || track.title || "Unknown Title",
            artist: track.artistName || track.artist || "Unknown Artist",
            cover_url: track.playlistCover
              ? `${API_BASE}/storage/${track.playlistCover}`
              : track.cover_url || "/default-cover.png",
            audio_url:
              track.fileName || track.file_name
                ? `${API_BASE}/storage/music/${track.fileName || track.file_name}`
                : track.audio_url || null,
            duration: track.durationSeconds
              ? `${Math.floor(track.durationSeconds / 60)
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
              : track.duration || "00:00",
          }));
        }
        setPlaylist(data);
      } catch (err: any) {
        console.error(
          "Gagal ambil detail playlist di Marlboro Server! 😂 🤣",
          err,
        );
        setError(
          err.response?.data?.message || err.message || "Endpoint Error",
        );
      }
    };
    if (id) fetchPlaylistDetail();
  }, [id]);

  if (error)
    return (
      <div className="flex h-screen items-center justify-center bg-black font-mono text-red-500 p-6 text-center">
        [SYSTEM_FAILURE]: {error}
      </div>
    );

  if (!playlist)
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="text-[#72fe8f] font-mono text-sm tracking-[0.5em] animate-pulse">
          LOADING_VIRTUAL_PLAYLIST...
        </div>
      </div>
    );

  return (
    <main className="flex-1 relative overflow-y-auto custom-scrollbar bg-black pb-32">
      {/* Hero Header Section */}
      <div className="relative min-h-[650px] md:min-h-0 md:h-[60vh] flex items-end px-6 md:px-12 pb-10 overflow-hidden transition-all duration-500">
        {/* Background Blur Effect */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 blur-3xl opacity-40"
          style={{
            backgroundImage: `url(${playlist.cover || playlist.cover_url || "/default-cover.png"})`,
          }}
        />

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* pt-40 di mobile buat ngedorong konten ke bawah, md:pt-0 balikin ke normal di desktop */}
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-end w-full pt-44 md:pt-0">
          {/* Cover Image */}
          <div className="group relative w-56 h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] rounded-lg overflow-hidden bg-[#1a1a1a] flex-shrink-0 border border-white/5">
            <img
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              src={playlist.cover || playlist.cover_url || "/default-cover.png"}
              alt="cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/default-cover.png";
              }}
            />
          </div>

          {/* Info Playlist */}
          <div className="flex flex-col gap-4 text-center md:text-left flex-1 pb-2">
            <div className="space-y-1">
              <span className="text-[0.65rem] md:text-[0.7rem] font-bold uppercase tracking-[0.5em] text-[#72fe8f] drop-shadow-md">
                Collection / Playlist
              </span>
              <h1 className="text-5xl md:text-7xl lg:text-9xl font-black tracking-tighter leading-none text-white drop-shadow-2xl italic uppercase break-words">
                {playlist.name}
              </h1>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 mt-4">
              <div className="flex items-center gap-2 text-gray-300 font-mono text-[10px] md:text-xs tracking-widest bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
                <span className="text-white/40">SERVER:</span>
                <span className="text-[#72fe8f] font-bold uppercase">
                  Nocturn
                </span>
                <span className="text-white/20">|</span>
                <span className="text-[#72fe8f]">
                  {playlist.tracks?.length || 0} TRACKS
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-8 md:px-12 py-8">
        <button
          onClick={() => {
            if (playlist.tracks?.length > 0) {
              setTracks(playlist.tracks);
              setCurrentTrack(playlist.tracks[0]);
              setIsPlaying(true);
            }
          }}
          className="group w-16 h-16 bg-[#72fe8f] rounded-full flex items-center justify-center text-black hover:scale-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(114,254,143,0.3)]"
        >
          <Play fill="black" size={28} className="ml-1" />
        </button>
      </div>

      {/* Tracks Section */}
      <div className="px-4 md:px-8 relative z-10">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/5 p-4 md:p-6 mb-20">
          {playlist.tracks && playlist.tracks.length > 0 ? (
            <TrackList
              tracks={playlist.tracks}
              onPlay={(track) => {
                setTracks(playlist.tracks);
                setCurrentTrack(track);
                setIsPlaying(true);
              }}
            />
          ) : (
            <div className="py-24 text-center border-2 border-dashed border-white/5 rounded-xl">
              <Music
                className="mx-auto text-gray-700 mb-4 opacity-20"
                size={64}
              />
              <p className="text-gray-500 font-mono text-xs uppercase tracking-widest">
                Empty_Database_No_Tracks_Found
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
