"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import api from "@/lib/axios"; // Import instance axios kita yang udah di-set base URL-nya
import { usePlayer } from "@/context/PlayerContext";
import { applyPersistedLikeState, setPersistedLikedTrackId, buildCoverUrl } from "@/lib/utils";
import { saveOfflineTrack, isOfflineAvailable, fetchImageAsDataUrl, type OfflineTrackMeta } from "@/lib/offlineStorage";
import { markOfflineOnServer, unmarkOfflineOnServer } from "@/lib/offlineSync";
import { setCachedBlobUrl } from "@/lib/offlineCache";

interface MenuContextType {
  showMenu: (
    e: React.MouseEvent,
    track: any,
    location: "queue" | "playlist" | "general",
  ) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

function inferAudioMime(url: string, serverType: string): string {
  if (serverType && serverType !== "application/octet-stream") return serverType;
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    mp3: "audio/mpeg", flac: "audio/flac", m4a: "audio/mp4",
    aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav", webm: "audio/webm",
  };
  return map[ext] ?? "audio/mpeg";
}

export function MenuProvider({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [activeTrack, setActiveTrack] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<"queue" | "playlist" | "general">(
    "general",
  );
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2200);
  };

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const normalizePlaylists = (payload: any) => {
    const raw = payload?.data?.data || payload?.data || payload;
    return Array.isArray(raw) ? raw : [];
  };

  const fetchPlaylists = async () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUserPlaylists([]);
      return;
    }

    try {
      const res = await api.get("/api/playlists"); // Ganti endpoint sesuai API lo
      setUserPlaylists(normalizePlaylists(res.data)); // Simpan playlist di state
    } catch (error: any) {
      if (error?.response?.status !== 401) {
        console.error("Error fetching playlists:", error);
      }
    }
  };

  // Ambil lebar layar pas di client side doang
  useEffect(() => {
    // Jangan sync setState, ambil langsung dari window tanpa state
    fetchPlaylists();
  }, []);

  // Import player context untuk sync like state
  const { tracks, setTracks, queue, setQueue, currentTrack, setCurrentTrack } = usePlayer();

  const refreshTracks = async () => {
    try {
      const res = await api.get("/api/tracks");
      const resData = res.data;
      const rawData = resData?.data || resData;

      if (Array.isArray(rawData)) {
        const API_BASE =
          api.defaults.baseURL || "https://panel.nexxacodeid.site";
        const updatedTracks = rawData
          .map((track) => {
            const albumArt = buildCoverUrl(track.playlistCover, API_BASE);
            return {
            ...track,
            title: track.trackTitle || "Unknown Title",
            artist: track.artistName || "Unknown Artist",
            albumArt,
            cover_url: albumArt,
            audio_url:
              track.fileName || track.file_name
                ? `${API_BASE}/music/${track.fileName || track.file_name}`
                : null,
            duration: track.durationSeconds
              ? `${Math.floor(track.durationSeconds / 60)
                  .toString()
                  .padStart(
                    2,
                    "0",
                  )}:${(track.durationSeconds % 60).toString().padStart(2, "0")}`
              : "00:00",
            is_liked: track.is_liked || false,
          };})
          .map(applyPersistedLikeState);
        setTracks(updatedTracks);
      }
    } catch (err) {
      console.error("Error refreshing tracks:", err);
    }
  };

  const showMenu = (
    e: React.MouseEvent,
    track: any,
    loc: "queue" | "playlist" | "general",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 256;
    const menuHeight = 240; // Ditambahin dikit biar aman
    const screenWidthVal = window.innerWidth;
    const screenHeight = window.innerHeight;

    // --- LOGIKA X (DI SEBELAH KIRI) ---
    let x = e.clientX - menuWidth;
    if (x < 10) x = 10; // Biar nggak mepet banget ke pinggir kiri layar

    // --- LOGIKA Y (DROPUP) ---
    let y = e.clientY;
    if (e.clientY + menuHeight > screenHeight) {
      y = e.clientY - menuHeight;
    }

    setPos({ x, y });
    setActiveTrack(track);
    setLocation(loc);
    setIsOpen(true);
    setIsSubMenuOpen(false); // Reset submenu setiap kali menu dibuka

    // Selalu sinkronkan daftar playlist saat menu dibuka supaya playlist baru langsung muncul
    fetchPlaylists();
  };

  const handleLike = async () => {
    if (!activeTrack) return;
    const trackId = activeTrack.id;
    const isCurrentlyLiked = activeTrack.is_liked;

    // OPTIMISTIC UPDATE: Ubah state duluan tanpa nunggu backend!
    // Biar UI langsung nyala/mati dan lagu masuk/keluar dari Liked Songs saat itu juga
    const updatedTracks = tracks.map((t: any) =>
      t.id === trackId ? { ...t, is_liked: !isCurrentlyLiked } : t,
    );
    setTracks(updatedTracks);
    setPersistedLikedTrackId(trackId, !isCurrentlyLiked);

    // Update juga currentTrack kalau lagu yang dilike/unlike kebetulan lagi diputar
    if (currentTrack?.id === trackId) {
      setCurrentTrack({ ...currentTrack, is_liked: !isCurrentlyLiked });
    }

    // Update state menu itu sendiri biar checkmark di menu langsung ganti
    setActiveTrack((prev: any) =>
      prev ? { ...prev, is_liked: !isCurrentlyLiked } : prev,
    );

    setIsOpen(false);

    try {
      if (isCurrentlyLiked) {
        // Panggil endpoint baru khusus unlike via DELETE (dari fixing backend)
        await api.delete(`/api/tracks/${trackId}/like`);
      } else {
        // Panggil endpoint baru khusus like via POST (dari fixing backend)
        await api.post(`/api/tracks/${trackId}/like`);
      }
      console.log(
        "Status like berhasil di-sync ke backend via endpoint baru! 🐈‍🤣",
      );
    } catch (err: any) {
      console.error("Like error dr backend, tap UI udah ke-update kok:", err);
      // Kalau ngga mau refresh gpp, UI udah jalan
    }
  };

  const handleAddToQueue = () => {
    if (!activeTrack) return;
    setQueue((prev) => [...prev, activeTrack]);
    showToast(`Added to queue: ${activeTrack.title || "Track"}`);
    setIsOpen(false);
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      console.log("Data activeTrack yang dikirim boss:", activeTrack);
      console.log("track_id yang dikirim:", activeTrack.id);

      await api.post(`/api/playlists/${playlistId}/add-track`, {
        track_id: activeTrack.id,
      });
      console.log("SENDING TRACK TO PLAYLIST", activeTrack);

      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(
        `Error bosqu: ${JSON.stringify(err.response?.data?.errors || err.response?.data?.message || err.message)}\nTRACK ID YANG DIKIRIM: ${activeTrack?.id}`,
      );
    }
  };

  const handleCreatePlaylist = async () => {
    const name = prompt("Nama playlist baru:");
    if (!name) return;
    try {
      const res = await api.post("/api/playlists", { name });
      const created = res.data?.data || res.data;
      setUserPlaylists((prev) => [...prev, created]);
      alert("Playlist baru jadi, bosquu!");
    } catch (err: any) {
      console.error(err);
      alert(
        `Gagal bikin playlist: ${err.response?.data?.message || err.message}`,
      );
    }
  };

  const handleDownload = () => {
    if (!activeTrack?.id) return;
    const API_BASE =
      api.defaults.baseURL || "https://panel.nexxacodeid.site";
    const downloadUrl = `${API_BASE}/api/tracks/${activeTrack.id}/download`;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast(`Downloading: ${activeTrack.title || "Track"}`);
    setIsOpen(false);
  };

  const [savingOffline, setSavingOffline] = useState(false);
  const [isAlreadyOffline, setIsAlreadyOffline] = useState(false);

  const handleSaveOffline = async () => {
    if (!activeTrack?.id || savingOffline) return;
    const API_BASE = api.defaults.baseURL || "https://panel.nexxacodeid.site";
    setIsOpen(false);
    setSavingOffline(true);
    showToast("Menyimpan offline...");

    try {
      const audioUrl = activeTrack.audio_url ||
        `${API_BASE}/music/${activeTrack.fileName || activeTrack.file_name}`;
      const res = await fetch(audioUrl);
      if (!res.ok) throw new Error("Gagal unduh audio");
      const rawBlob = await res.blob();
      // Pastikan MIME type audio benar — server kadang kirim application/octet-stream
      // yang bikin browser pakai decoder kurang optimal saat play dari blob URL
      const inferredType = inferAudioMime(audioUrl, rawBlob.type);
      const audioBlob = inferredType !== rawBlob.type
        ? new Blob([rawBlob], { type: inferredType })
        : rawBlob;

      const coverUrl = activeTrack.albumArt || activeTrack.cover_url || "";
      const rawCoverDataUrl = coverUrl.startsWith("data:")
        ? coverUrl
        : coverUrl
          ? await fetchImageAsDataUrl(coverUrl)
          : "";
      // Hanya simpan jika benar-benar data URL, bukan path fallback
      const coverDataUrl = rawCoverDataUrl.startsWith("data:") ? rawCoverDataUrl : "";

      await saveOfflineTrack(activeTrack, audioBlob, coverDataUrl);
      // Populate in-memory cache supaya playback bisa instant pakai blob URL
      const meta: OfflineTrackMeta = {
        key: `${activeTrack.id}`,
        id: String(activeTrack.id),
        userId: "",
        title: activeTrack.title || activeTrack.trackTitle || "Unknown",
        artist: activeTrack.artist || activeTrack.artistName || "Unknown",
        duration: activeTrack.duration || "00:00",
        coverDataUrl,
        fileSize: audioBlob.size,
        downloadedAt: Date.now(),
      };
      setCachedBlobUrl(activeTrack.id, URL.createObjectURL(audioBlob), meta);
      // Tandai di backend agar sync ke device lain
      await markOfflineOnServer(activeTrack.id).catch(() => {});
      showToast(`Tersimpan offline: ${activeTrack.title || "Track"}`);
      setIsAlreadyOffline(true);
    } catch (err) {
      console.error("Gagal simpan offline:", err);
      showToast("Gagal simpan offline");
    } finally {
      setSavingOffline(false);
    }
  };

  // Cek status offline saat menu dibuka untuk track aktif
  useEffect(() => {
    if (!activeTrack?.id) return;
    isOfflineAvailable(String(activeTrack.id)).then(setIsAlreadyOffline);
  }, [activeTrack?.id]);

  // Logic Hapus dari Playlist
  const handleRemoveFromPlaylist = async () => {
    if (!confirm("Beneran mau hapus dari playlist ini?")) return;
    try {
      // Ganti URL sesuai route Laravel lo
      await api.delete(`/api/playlists/remove-track`, {
        data: { track_id: activeTrack.id },
      });
      setIsOpen(false);
      window.location.reload(); // Refresh buat update list (Simple way)
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <MenuContext.Provider value={{ showMenu }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100]"
          onClick={() => setIsOpen(false)}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(false);
          }}
        >
          <div
            className="absolute bg-[#181818] border border-white/10 rounded shadow-2xl w-64 py-1.5 text-gray-200 animate-in zoom-in-95 duration-75 origin-bottom-right"
            style={{ top: pos.y, left: pos.x }}
            onClick={(e) => e.stopPropagation()} // Supaya ga ketutup pas dalam menu di klik
          >
            {/* ADD TO PLAYLIST */}
            <div className="relative">
              <button
                onClick={() => setIsSubMenuOpen(!isSubMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3 font-medium">
                  <span>➕</span> Add to playlist
                </div>
                <span className="text-[10px] opacity-50">
                  {isSubMenuOpen ? "▼" : "▶"}
                </span>
              </button>
              {isSubMenuOpen && (
                <div className="w-full bg-[#111111] py-1.5 animate-in fade-in slide-in-from-top-1 duration-100 border-y border-white/5 mb-1">
                  <div className="px-3 py-1 mb-1">
                    <input
                      type="text"
                      placeholder="Find a playlist"
                      className="w-full bg-[#282828] border-none outline-none rounded-sm px-2 py-1 text-[11px] placeholder:text-gray-500 font-mono"
                    />
                  </div>
                  <button
                    onClick={handleCreatePlaylist}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center gap-3"
                  >
                    <span>➕</span> New playlist
                  </button>
                  <div className="h-[1px] bg-white/5 my-1" />
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {userPlaylists.length > 0 ? (
                      userPlaylists.map((pl) => (
                        <button
                          key={pl.id}
                          onClick={() => handleAddToPlaylist(pl.id)}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/10"
                        >
                          {pl.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-center text-[10px] text-gray-500 italic font-mono">
                        Empty playlist. 🐈‍🤣
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* LIKE / UNLIKE */}
            <button
              onClick={handleLike}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-white/10 transition-colors"
            >
              {activeTrack?.is_liked ? (
                <>
                  <span className="text-[#72fe8f]">✔</span> Remove from Liked
                  Songs
                </>
              ) : (
                <>
                  <span>🤍</span> Add to Liked Songs
                </>
              )}
            </button>

            <button
              onClick={handleAddToQueue}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-white/10 transition-colors"
            >
              <span>➕</span> Add to queue
            </button>

            <div className="h-[1px] bg-white/5 my-1" />

            {/* DOWNLOAD */}
            <button
              onClick={handleDownload}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-white/10 transition-colors text-[#72fe8f]"
            >
              <span>⬇️</span> Download
            </button>

            {/* SAVE OFFLINE */}
            <button
              onClick={handleSaveOffline}
              disabled={savingOffline || isAlreadyOffline}
              className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              {isAlreadyOffline ? (
                <><span>✅</span> <span className="text-[#72fe8f]">Sudah Offline</span></>
              ) : savingOffline ? (
                <><span>⏳</span> Menyimpan...</>
              ) : (
                <><span>📥</span> Simpan Offline</>
              )}
            </button>

            {/* REMOVE FROM PLAYLIST (DYNAMIS) */}
            {location === "playlist" && (
              <>
                <div className="h-[1px] bg-white/5 my-1" />
                <button
                  onClick={handleRemoveFromPlaylist}
                  className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-red-500 hover:text-white transition-colors text-red-500"
                >
                  <span>❌</span> Remove from this playlist
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && (
        <div
          className="fixed z-[300] left-1/2 -translate-x-1/2 bottom-[140px] md:bottom-32 px-4 py-2 rounded-full bg-[#72fe8f] text-black text-xs font-bold tracking-wide shadow-[0_0_20px_rgba(114,254,143,0.4)] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none max-w-[90vw] truncate"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      )}
    </MenuContext.Provider>
  );
}

export const useGlobalMenu = () => useContext(MenuContext)!;
