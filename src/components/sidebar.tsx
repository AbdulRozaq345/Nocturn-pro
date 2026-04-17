import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Home,
  Library,
  Heart,
  ListMusic,
  Search,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import api from "@/lib/axios";
import { logout } from "@/lib/auth-service";

export default function Sidebar() {
  const [playlists, setPlaylists] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [user, setUser] = useState<any>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false); // State baru
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile drawer
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Ambil data user
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    // 2. Klik di luar buat nutup dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const fetchSidebarPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (!token) return; // Skip fetching if not authenticated

      try {
        const res = await api.get("/api/playlists");
        const data = res.data.data || res.data;
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err: any) {
        // Jangan log error keras-keras ke console kalau emang belom login (401)
        if (err.response?.status !== 401) {
          console.error("Gagal sinkron playlist sidebar, ju! 🗿");
        }
      }
    };
    fetchSidebarPlaylists();
  }, []);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-[1.1rem] left-4 z-[999] text-[#72fe8f] bg-[#0e0e0e]/80 p-[0.35rem] rounded-sm backdrop-blur-md border border-white/10"
      >
        <Menu size={16} />
      </button>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-[998] backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Bottom Navigation Bar (Hidden on md up) */}
      <div className="md:hidden fixed bottom-20 left-0 w-full h-14 bg-[#0e0e0e] border-t border-white/5 z-[60] flex items-center justify-between px-6">
        <Link
          href="/"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#72fe8f] focus:text-[#72fe8f]"
        >
          <Home size={20} />
          <span className="text-[10px] uppercase font-mono tracking-widest">
            Home
          </span>
        </Link>
        <Link
          href="/YourLibrary"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#72fe8f] focus:text-[#72fe8f]"
        >
          <Library size={20} />
          <span className="text-[10px] uppercase font-mono tracking-widest">
            Library
          </span>
        </Link>
        <Link
          href="/liked-songs"
          className="flex flex-col items-center gap-1 text-gray-400 hover:text-[#72fe8f] focus:text-[#72fe8f]"
        >
          <Heart size={20} />
          <span className="text-[10px] uppercase font-mono tracking-widest">
            Liked
          </span>
        </Link>
      </div>

      {/* Desktop & Mobile Drawer Sidebar */}
      <aside
        className={`fixed md:relative inset-y-0 left-0 flex flex-col h-full pt-8 pb-24 md:pb-32 bg-[#0e0e0e] text-gray-500 w-64 flex-shrink-0 z-[999] md:z-50 border-r border-white/5 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:flex ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close Button Mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <div className="px-8 mb-10 flex items-center justify-between group/brand relative">
          <div className="flex flex-col">
            <h1 className="text-xl font-bold tracking-tighter text-[#72fe8f]">
              NOCTURN{" "}
              <span className="text-[0.6rem] font-mono tracking-widest bg-[#72fe8f]/20 px-1 ml-1 align-top text-[#72fe8f]">
                PRO
              </span>
            </h1>
          </div>

          {/* PP GOOGLE SECTION */}
          {user && (
            <div className="relative" ref={profileRef}>
              {/* BUTTON CLICK */}
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`w-8 h-8 rounded-full border overflow-hidden transition-all shadow-[0_0_15px_rgba(114,254,143,0.1)] 
                ${isProfileOpen ? "border-[#72fe8f] scale-110" : "border-white/10 hover:border-[#72fe8f]/50"}`}
              >
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${user.name}&background=191919&color=72fe8f&bold=true`
                  }
                  alt="User"
                  className="w-full h-full object-cover"
                />
              </button>

              {/* DROPDOWN LOGOUT (Muncul berdasarkan State) */}
              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-40 bg-[#121212] border border-white/10 rounded shadow-2xl py-1 z-[998] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-[10px] text-white font-bold truncate uppercase">
                      {user.name}
                    </p>
                    <p className="text-[8px] text-gray-500 font-mono truncate lowercase">
                      {user.email}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (confirm("LOGOUT_SESSION? 🐈‍🤣")) logout();
                    }}
                    className="w-full text-left px-3 py-2 text-[10px] text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-mono font-bold"
                  >
                    <LogOut size={12} /> TERMINATE_SESSION
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-6 mb-8">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 group-focus-within:text-[#72fe8f]" />
            <input
              placeholder="SEARCH"
              className="w-full bg-[#191919] border-none text-[0.6rem] pl-10 py-2 rounded-sm focus:ring-1 focus:ring-[#72fe8f]/50 transition-all uppercase tracking-widest"
            />
          </div>
        </div>

        <nav className="flex-grow">
          <div className="flex flex-col">
            <NavItem icon={<Home size={18} />} label="Home" href="/" active />
            <NavItem
              icon={<Library size={18} />}
              label="Your Library"
              href="/YourLibrary"
            />
            <NavItem
              icon={<Heart size={18} />}
              label="Liked Songs"
              href="/liked-songs"
            />
          </div>

          <div className="mt-10 px-8">
            <h3 className="text-[0.6rem] font-bold text-gray-400 tracking-[0.2em] mb-4 uppercase">
              My Playlists
            </h3>

            <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto no-scrollbar">
              {playlists.length > 0 ? (
                playlists.map((p) => (
                  <a
                    key={p.id}
                    href={`/playlist/${p.id}`} // Link dinamis ke ID playlist
                    className="flex items-center gap-3 text-gray-500 hover:text-[#72fe8f] transition-colors py-2 text-[0.6rem] uppercase tracking-widest"
                  >
                    <ListMusic size={14} /> {p.name}
                  </a>
                ))
              ) : (
                <p className="text-[0.5rem] font-mono text-gray-700 italic">
                  No Database Entry...
                </p>
              )}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}

function NavItem({
  icon,
  label,
  href = "#",
  active = false,
}: {
  icon: any;
  label: string;
  href?: string;
  active?: boolean;
}) {
  return (
    <Link
      className={`flex items-center gap-4 px-8 py-3 transition-all duration-200 ${active ? "text-[#72fe8f] border-l-2 border-[#72fe8f] bg-gradient-to-r from-[#72fe8f]/10 to-transparent" : "hover:bg-[#2c2c2c] text-gray-400"}`}
      href={href}
    >
      {icon}
      <span className="text-[0.6875rem] uppercase font-mono tracking-[0.05em]">
        {label}
      </span>
    </Link>
  );
}
