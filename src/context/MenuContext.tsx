"use client";
import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import api from "@/lib/axios"; // Import instance axios kita yang udah di-set base URL-nya

interface MenuContextType {
  showMenu: (
    e: React.MouseEvent,
    track: any,
    location: "queue" | "playlist" | "general",
  ) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [activeTrack, setActiveTrack] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [location, setLocation] = useState<"queue" | "playlist" | "general">(
    "general",
  );
  const [screenWidth, setScreenWidth] = useState(0);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);

  const fetchPlaylists = async () => {
    try {
      const res = await api.get("/api/playlists"); // Ganti endpoint sesuai API lo
      setUserPlaylists(res.data.data || res.data); // Simpan playlist di state
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  // Ambil lebar layar pas di client side doang
  useEffect(() => {
    setScreenWidth(window.innerWidth);
    fetchPlaylists();
  }, []);

  const showMenu = (
    e: React.MouseEvent,
    track: any,
    loc: "queue" | "playlist" | "general",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const menuWidth = 256;
    const menuHeight = 240; // Ditambahin dikit biar aman
    const screenWidth = window.innerWidth;
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
  };

  const handleLike = async () => {
    if (!activeTrack) return;
    try {
      // Endpoint Laravel lo biasanya pake toggle
      await api.post(`/api/tracks/${activeTrack.id}/like`);

      // Update local state biar UI langsung berubah (Optimistic Update)
      setActiveTrack({ ...activeTrack, is_liked: !activeTrack.is_liked });
      console.log("Status like berubah! 🐈‍🤣");
    } catch (err) {
      alert("Gagal nge-like, cek koneksi Laravel lo!");
    }
  };

  const handleAddToPlaylist = async (playlistId: number) => {
    try {
      console.log("Data activeTrack yang dikirim boss:", activeTrack);
      console.log("track_id yang dikirim:", activeTrack.id);

      await api.post(`/api/playlists/${playlistId}/add-track`, {
        track_id: activeTrack.id,
      });
      console.log("SENDING TRACK TO PLAYLIST", activeTrack);

      alert(`Berhasil masukin ${activeTrack.title} ke playlist!`);
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
      setUserPlaylists([...userPlaylists, res.data.data || res.data]);
      alert("Playlist baru jadi, bosquu!");
    } catch (err: any) {
      console.error(err);
      alert(
        `Gagal bikin playlist: ${err.response?.data?.message || err.message}`,
      );
    }
  };

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
                  {isSubMenuOpen ? "▼" : "◀"}
                </span>
              </button>
              {isSubMenuOpen && (
                <div
                  className={`absolute top-0 w-64 bg-[#181818] border border-white/10 rounded shadow-2xl py-1.5 animate-in slide-in-from-right-1 duration-100
                  ${pos.x < 300 ? "left-full ml-0.5" : "right-full mr-0.5"}`}
                >
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

            <button className="w-full flex items-center gap-3 px-3 py-2 text-xs hover:bg-white/10 transition-colors">
              <span>➕</span> Add to queue
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
    </MenuContext.Provider>
  );
}

export const useGlobalMenu = () => useContext(MenuContext)!;
