const fs = require('fs');

const content = `"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/lib/auth-service";

export default function Topbar() {
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));

    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* ========== DESKTOP UI ========== */}
      <header className="hidden md:flex h-16 md:h-20 justify-between items-center px-4 md:px-12 sticky top-0 z-40 bg-[#0a0a0a]/60 backdrop-blur-md">
        <div className="text-[0.6rem] text-gray-400 font-mono tracking-[0.3em]">
          NOTCER_STATION_V1.0
        </div>
        <div className="flex gap-6 text-[0.6rem] font-bold uppercase tracking-widest text-gray-400">
          <Link href="#" className="text-[#72fe8f]">
            Feed
          </Link>
          <Link href="#" className="hover:text-white">
            Collect
          </Link>
          <Link href="#" className="hover:text-white">
            Labs
          </Link>
        </div>
      </header>

      {/* ========== MOBILE HEADER (NEW DESIGN) ========== */}
      <header className="md:hidden fixed top-0 w-full z-50 flex justify-between items-center px-5 h-16 transition-all duration-300 bg-[#0a0a0a]/75 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className={\`block w-9 h-9 rounded-full overflow-hidden border-2 p-0.5 transition-all \${isProfileOpen ? "border-[#72fe8f] scale-110" : "border-[#72fe8f]/20 hover:border-[#72fe8f]/50"}\`}
            >
              {user ? (
                <img
                  src={user.avatar || \`https://ui-avatars.com/api/?name=\${user.name}&background=191919&color=72fe8f&bold=true\`}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
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
                  onClick={() => {
                    if (confirm("LOGOUT_SESSION? í°ˆâ€í´£")) logout();
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] text-red-500 hover:bg-red-500/10 flex items-center gap-2 transition-colors font-mono font-bold"
                >
                  <LogOut size={12} /> TERMINATE_SESSION
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
`;

fs.writeFileSync('src/components/topbar.tsx', content);
console.log("Updated topbar.tsx");
