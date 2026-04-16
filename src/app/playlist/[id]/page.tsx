"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { usePlayer } from "@/context/PlayerContext";
import { Play, Music } from "lucide-react";
import Sidebar from "@/components/sidebar";
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
        // API base URL dari instance axios untuk assets
        const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";
        
        let data = res.data.data || res.data;
        
        // Pastikan format track sama dengan TrackList
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
                  .padStart(2, "0")}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
              : track.duration || "00:00",
          }));
        }

        setPlaylist(data);
      } catch (err: any) {
        console.error("Gagal ambil detail playlist di Marlboro Server! ���‍���", err);
        setError(err.response?.data?.message || err.message || "Endpoint Error");
      }
    };
    if (id) fetchPlaylistDetail();
  }, [id]);

  let content;

  if (error) {
    content = (
      <div className="p-12 font-mono text-red-500">
        ERROR_FETCHING: {error}
      </div>
    );
  } else if (!playlist) {
    content = (
      <div className="p-12 font-mono text-[#72fe8f] animate-pulse">
        FETCHING_PLAYLIST_DATA...
      </div>
    );
  } else {
    content = (
      <div className="flex-1 bg-gradient-to-b from-[#1e1e1e] to-black py-8 min-h-full">
        <div className="flex flex-col md:flex-row gap-8 items-end px-8 md:px-12 mb-12">
          <div className="w-60 h-60 bg-[#282828] shadow-2xl rounded-sm overflow-hidden flex-shrink-0">
            <img
              src={playlist.cover || playlist.cover_url || "/default-cover.png"}
              className="w-full h-full object-cover"
              alt="cover"
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[0.6rem] font-mono uppercase tracking-[0.4em] text-[#72fe8f]">
              Public Playlist
            </span>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none">
              {playlist.name}
            </h1>
            <p className="text-gray-400 font-mono text-xs mt-4 uppercase tracking-widest">
              {playlist.tracks?.length || 0} TRACKS
            </p>
          </div>
        </div>

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
          <div className="py-20 text-center">
            <Music className="mx-auto text-gray-800 mb-4" size={48} />
            <p className="text-gray-600 font-mono text-[0.6rem] uppercase tracking-widest">
              This playlist is currently empty.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#0e0e0e] text-white">
      <Sidebar />
      <main className="flex-grow grow relative overflow-y-auto custom-scrollbar bg-[#000000] pb-36 md:pb-24">
        <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-12 sticky top-0 z-40 bg-[#000000]/80 backdrop-blur-md">
          <div className="text-[0.6rem] text-gray-400 font-mono tracking-[0.3em]">
            NOTCER_STATION_V1.0
          </div>
          <div className="flex gap-6 text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">
            <a href="#" className="text-[#72fe8f]">
              Feed
            </a>
            <a href="#" className="hover:text-white">
              Collect
            </a>
            <a href="#" className="hover:text-white">
              Labs
            </a>
          </div>
        </header>

        {content}
      </main>
    </div>
  );
}
