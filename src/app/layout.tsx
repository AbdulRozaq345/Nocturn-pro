"use client"; // Ubah jadi client component biar bisa pake hooks

import "./globals.css";
import { MenuProvider } from "@/context/MenuContext";
import LoginModal from "@/components/LoginModal";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PlayerProvider } from "@/context/PlayerContext";
import Sidebar from "@/components/sidebar";
import Topbar from "@/components/topbar";
import Player from "@/components/player";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem("token");
  });
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [pathname]);

  const isCallbackPage = pathname === "/auth/callback";

  return (
    <html lang="en">
<head>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet" />
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#72fe8f" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Nocturn" />
<link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
</head>
      <body className="antialiased bg-black text-white selection:bg-[#72fe8f] selection:text-black">
        <PlayerProvider>
          <MenuProvider>
            {!isLoggedIn && !isCallbackPage && <LoginModal />}
            <div className="flex h-screen overflow-hidden bg-[#0a0a0a] text-white">
              <Sidebar />
              <div className="flex-grow flex flex-col relative overflow-y-auto custom-scrollbar w-full">
                <Topbar />
                {children}
              </div>
            </div>
            <Player />
          </MenuProvider>
        </PlayerProvider>
      </body>
    </html>
  );
}
