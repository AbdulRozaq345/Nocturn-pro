"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { LogOut, Search, ChevronDown } from "lucide-react";
import { logout } from "@/lib/auth-service";

export default function Topbar() {
  const router = useRouter();
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* ========== DESKTOP TOPBAR ========== */}
      <header className="hidden md:flex h-16 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/[0.04] sticky top-0 z-40 px-6 gap-4 items-center">

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Profile */}
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-white/5 transition-all"
            >
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.name}&background=191919&color=72fe8f&bold=true`
                }
                alt="User"
                className="w-8 h-8 rounded-full object-cover bg-white/5"
                onError={(e) => {
                  e.currentTarget.src = "/nocturn.avif";
                }}
              />
              <span className="hidden lg:block text-sm font-medium text-white max-w-[120px] truncate">
                {user.name}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#121212] border border-white/10 rounded-lg shadow-2xl py-1 z-[998] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] text-white font-bold truncate uppercase">
                    {user.name}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono truncate lowercase">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-[10px] text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-mono font-bold"
                >
                  <LogOut size={12} /> LOGOUT
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      {/* ========== MOBILE HEADER (NEW DESIGN) ========== */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 transition-all duration-300 bg-[#0a0a0a]/75 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={`block w-9 h-9 rounded-full overflow-hidden border-2 p-0.5 transition-all ${isProfileOpen ? "border-[#72fe8f] scale-110" : "border-[#72fe8f]/20 hover:border-[#72fe8f]/50"}`}
            >
              {user ? (
                <img className="text-transparent w-full h-full object-cover rounded-full bg-white/5 animate-pulse text-[0px]" src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=191919&color=72fe8f&bold=true`}
                  alt="Profile"
                  />
              ) : (
                <div className="w-full h-full rounded-full bg-white/10 animate-pulse"></div>
              )}
            </button>

            {/* DROPDOWN LOGOUT */}
            {isProfileOpen && user && (
              <div className="absolute left-0 top-full mt-2 w-40 bg-[#121212] border border-white/10 rounded shadow-2xl py-1 z-[998] animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-150">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] text-white font-bold truncate uppercase">
                    {user.name}
                  </p>
                  <p className="text-[8px] text-gray-500 font-mono truncate lowercase">
                    {user.email}
                  </p>
                </div>
                <button
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-[10px] text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-mono font-bold"
                >
                  <LogOut size={12} /> LOGOUT
                </button>
              </div>
            )}
          </div>
          <span className="text-xl font-black italic tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#72fe8f] to-[#0fe3ff]">
            NOCTURN
          </span>
        </div>
      </header>
    </>
  );
}
