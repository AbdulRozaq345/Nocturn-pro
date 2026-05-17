"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Home,
  Library,
  Heart,
  ListMusic,
  Search,
  LogOut,
  WifiOff,
  ChevronRight,
  Music,
  Compass,
} from "lucide-react";
import api from "@/lib/axios";
import { logout } from "@/lib/auth-service";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

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
    const fetchSidebarPlaylists = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await api.get("/api/playlists");
        const data = res.data.data || res.data;
        setPlaylists(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.response?.status !== 401) {
          console.error("Gagal sinkron playlist sidebar, ju! 🗿");
        }
      }
    };
    fetchSidebarPlaylists();
  }, []);

  const navItems = [
    { icon: <Home size={18} />, label: "Home", href: "/" },
    { icon: <Compass size={18} />, label: "Explore", href: "/search" },
    { icon: <Library size={18} />, label: "Library", href: "/YourLibrary" },
    { icon: <Heart size={18} />, label: "Liked Songs", href: "/liked-songs" },
    { icon: <WifiOff size={18} />, label: "Downloaded", href: "/downloaded" },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation Bar (Hidden on md up) */}
      <div className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-[#0a0a0a] border-t border-[#262626] z-[60] flex items-center justify-around px-2 pb-1">
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-1 w-1/3 text-white"
        >
          <Home size={22} fill="white" />
          <span className="text-[9px] font-sans tracking-wide">Home</span>
        </Link>
        <Link
          href="/search"
          className="flex flex-col items-center justify-center gap-1 w-1/3 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <Search size={22} />
          <span className="text-[9px] font-sans tracking-wide">Cari</span>
        </Link>
        <Link
          href="/YourLibrary"
          className="flex flex-col items-center justify-center gap-1 w-1/4 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <Library size={22} />
          <span className="text-[9px] font-sans tracking-wide">Koleksi</span>
        </Link>
        <Link
          href="/downloaded"
          className="flex flex-col items-center justify-center gap-1 w-1/4 text-[#a1a1aa] hover:text-white transition-colors"
        >
          <WifiOff size={22} />
          <span className="text-[9px] font-sans tracking-wide">Offline</span>
        </Link>
      </div>

      {/* Desktop Sidebar (Hidden on Mobile) */}
      <aside className="hidden md:flex flex-col h-full bg-[#0f0f0f] text-gray-400 w-56 flex-shrink-0 z-50 border-r border-white/[0.04]">
        {/* Logo Section */}
        <div className="px-4 py-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#72fe8f] flex items-center justify-center flex-shrink-0">
            <span className="text-black font-black text-sm">N</span>
          </div>
          <span className="text-white font-black text-sm tracking-widest flex-1">
            NOCTURN
          </span>
          <span className="text-[0.55rem] font-mono tracking-widest bg-[#72fe8f]/20 text-[#72fe8f] px-1.5 py-0.5 rounded">
            PRO
          </span>
        </div>

        {/* Navigation */}
        <nav className="px-2 mb-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span
                  className={isActive ? "text-[#72fe8f]" : ""}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/5 my-2" />

        {/* Playlists Section */}
        <div className="flex-1 overflow-y-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden">
          <p className="text-[0.6rem] font-bold tracking-[0.18em] text-gray-600 uppercase px-3 mb-2">
            Playlists
          </p>

          {/* Liked Songs shortcut */}
          <Link
            href="/liked-songs"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"
          >
            <div className="w-8 h-8 rounded-md bg-gradient-to-br from-[#72fe8f] to-[#0fe3ff] flex items-center justify-center flex-shrink-0">
              <Heart size={14} className="text-black" fill="black" />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium text-white truncate leading-tight">
                Liked Songs
              </span>
              <span className="text-[0.65rem] text-gray-500 truncate leading-tight">
                Playlist
              </span>
            </div>
          </Link>

          {/* User playlists */}
          {playlists.map((p) => (
            <Link
              key={p.id}
              href={`/playlist/${p.id}`}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden flex-shrink-0 bg-white/5">
                {p.cover_url || p.cover ? (
                  <img
                    src={p.cover_url || p.cover}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = "/nocturn.avif";
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music size={14} className="text-gray-600" />
                  </div>
                )}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate leading-tight">
                  {p.name}
                </span>
                <span className="text-[0.65rem] text-gray-500 truncate leading-tight">
                  Playlist
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* User Profile */}
        <div className="border-t border-white/[0.04] px-2 py-3" ref={profileRef}>
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
              >
                <img
                  src={
                    user.avatar ||
                    `https://ui-avatars.com/api/?name=${user.name}&background=191919&color=72fe8f&bold=true`
                  }
                  alt="User"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 bg-white/5"
                  onError={(e) => {
                    e.currentTarget.src = "/nocturn.avif";
                  }}
                />
                <div className="flex flex-col flex-1 overflow-hidden text-left">
                  <span className="text-xs font-semibold text-white truncate leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[0.6rem] text-gray-500 truncate leading-tight font-mono">
                    {user.email}
                  </span>
                </div>
                <ChevronRight size={14} className="text-gray-600 flex-shrink-0" />
              </button>

              {isProfileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#121212] border border-white/10 rounded-lg shadow-2xl py-1 z-[998] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-150">
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
          ) : (
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-2 bg-white/5 rounded animate-pulse w-3/4" />
                <div className="h-1.5 bg-white/5 rounded animate-pulse w-1/2" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
